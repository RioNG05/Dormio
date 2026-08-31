import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ─── GET /v1/notifications ────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List my notifications',
    description:
      'Returns all in-app notifications for the authenticated user, newest-first. ' +
      'Scoped to the current user — no cross-user access.',
  })
  @ApiOkResponse({
    description: 'Notifications retrieved successfully',
    type: [NotificationResponseDto],
  })
  async findAll(@Request() req: { user: { id: string } }) {
    const data = await this.notificationsService.findAllForUser(req.user.id);
    return { success: true, data };
  }

  // ─── PATCH /v1/notifications/:id/read ────────────────────────────────────

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark a notification as read',
    description:
      'Marks the specified notification as read. ' +
      'Returns 403 if the notification belongs to a different user.',
  })
  @ApiNoContentResponse({ description: 'Notification marked as read' })
  @ApiNotFoundResponse({
    description: 'Notification not found',
  })
  @ApiForbiddenResponse({
    description: 'Notification does not belong to the requesting user',
  })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ): Promise<void> {
    await this.notificationsService.markAsRead(id, req.user.id);
  }
}
