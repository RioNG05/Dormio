import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../../common/decorators/public.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(req: any): string | undefined {
    if (req.user?.id) return req.user.id;
    if (req.user?.sub) return req.user.sub;

    const authHeader = req.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded: any = this.jwtService.decode(token);
        if (decoded?.id) return decoded.id;
        if (decoded?.sub) return decoded.sub;
      } catch {
        // Token invalid or unparsable; treated as guest
      }
    }
    return undefined;
  }

  // ─── GET /v1/notifications ────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List my notifications (or public broadcasts)',
    description:
      'Returns all in-app notifications for the authenticated user, newest-first. ' +
      'If accessed as a guest, returns global system broadcasts.',
  })
  @ApiOkResponse({
    description: 'Notifications retrieved successfully',
    type: [NotificationResponseDto],
  })
  async findAll(@Request() req: any) {
    const userId = this.extractUserId(req);
    this.logger.log(`GET /v1/notifications called by ${userId ? `user ${userId}` : 'guest'}`);
    const data = await this.notificationsService.findAllForUser(userId);
    return { success: true, data };
  }

  // ─── PATCH /v1/notifications/read-all ─────────────────────────────────────

  @Public()
  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all notifications for current user (or public announcements) as read.',
  })
  @ApiOkResponse({
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Request() req: any) {
    const userId = this.extractUserId(req);
    this.logger.log(`PATCH /v1/notifications/read-all called by ${userId ? `user ${userId}` : 'guest'}`);
    const result = await this.notificationsService.markAllAsRead(userId);
    return result;
  }

  // ─── PATCH /v1/notifications/:id/read ────────────────────────────────────

  @Public()
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a single notification as read',
    description: 'Marks the specified notification as read.',
  })
  @ApiOkResponse({ description: 'Notification marked as read' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  @ApiForbiddenResponse({ description: 'Notification does not belong to the requesting user' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const userId = this.extractUserId(req);
    this.logger.log(`PATCH /v1/notifications/${id}/read called by ${userId ? `user ${userId}` : 'guest'}`);
    await this.notificationsService.markAsRead(id, userId);
    return { success: true, id, isRead: true };
  }

  // ─── POST /v1/notifications ──────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Create an in-app notification',
    description: 'Creates and stores an in-app notification for a user or broadcast.',
  })
  @ApiCreatedResponse({
    description: 'Notification created successfully',
    type: NotificationResponseDto,
  })
  async createNotification(
    @Body() dto: CreateNotificationDto,
    @Request() req: any,
  ) {
    const senderId = this.extractUserId(req) || '4b3ceb40-b707-4d27-9ba2-ff922b279836';
    this.logger.log(`POST /v1/notifications created by ${senderId} of type ${dto.type}`);
    const data = await this.notificationsService.createInAppNotification(senderId, dto);
    return { success: true, data };
  }
}
