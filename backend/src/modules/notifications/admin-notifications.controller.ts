import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import {
  CreateMassNotificationDto,
  MassNotificationItemDto,
  MassNotificationListResponseDto,
  MassNotificationQueryDto,
} from './dto/admin-mass-notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Admin Mass Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/notifications')
export class AdminNotificationsController {
  private readonly logger = new Logger(AdminNotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // ─── POST /api/v1/admin/notifications/mass ─────────────────────────────────

  @Post('mass')
  @ApiOperation({
    summary: 'Compose and dispatch mass notification (UC-A-05)',
    description:
      'Creates a MassNotificationJob record, saves AuditLog, and enqueues an asynchronous ' +
      'fan-out job into BullMQ to deliver messages across the chosen channel (Email, SMS, Zalo, In-App).',
  })
  @ApiCreatedResponse({
    description: 'Mass notification job successfully created and enqueued',
    type: MassNotificationItemDto,
  })
  @ApiForbiddenResponse({ description: 'Requires administrative privileges' })
  async createMassNotification(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMassNotificationDto,
  ): Promise<MassNotificationItemDto> {
    const adminId = user?.id || 'system-admin';
    this.logger.log(
      `POST /api/v1/admin/notifications/mass invoked by admin=${adminId} for channel=${dto.channel}`,
    );
    return this.notificationsService.createMassNotification(adminId, dto);
  }

  // ─── GET /api/v1/admin/notifications/mass ──────────────────────────────────

  @Get('mass')
  @ApiOperation({
    summary: 'List mass notification jobs (UC-A-05)',
    description:
      'Returns paginated mass notification jobs with status counts (total, sent, pending, failed), ' +
      'supporting channel, status, and text search filters.',
  })
  @ApiOkResponse({
    description: 'List of mass notification jobs with pagination and metrics',
    type: MassNotificationListResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Requires administrative privileges' })
  async getMassNotificationJobs(
    @CurrentUser() user: JwtPayload,
    @Query() query: MassNotificationQueryDto,
  ): Promise<MassNotificationListResponseDto> {
    const adminId = user?.id || 'system-admin';
    this.logger.log(
      `GET /api/v1/admin/notifications/mass invoked by admin=${adminId} page=${query.page} limit=${query.limit}`,
    );
    return this.notificationsService.getMassNotificationJobs(query);
  }

  // ─── GET /api/v1/admin/notifications/mass/:id ──────────────────────────────

  @Get('mass/:id')
  @ApiOperation({
    summary: 'Get mass notification job detail by ID (UC-A-05)',
    description:
      'Retrieves the full record of a mass notification job including creator, target user, delivery metrics, and status.',
  })
  @ApiOkResponse({
    description: 'Mass notification job detail retrieved',
    type: MassNotificationItemDto,
  })
  @ApiNotFoundResponse({ description: 'Mass notification job not found' })
  @ApiForbiddenResponse({ description: 'Requires administrative privileges' })
  async getMassNotificationJobById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MassNotificationItemDto> {
    const adminId = user?.id || 'system-admin';
    this.logger.log(
      `GET /api/v1/admin/notifications/mass/${id} invoked by admin=${adminId}`,
    );
    return this.notificationsService.getMassNotificationJobById(id);
  }

  // ─── POST /api/v1/admin/notifications/mass/:id/retry ───────────────────────

  @Post('mass/:id/retry')
  @ApiOperation({
    summary: 'Retry a failed or pending mass notification job (UC-A-05)',
    description:
      'Resets delivery counts, updates status back to pending, records AuditLog, and re-enqueues into BullMQ.',
  })
  @ApiOkResponse({
    description: 'Mass notification job re-enqueued for delivery',
    type: MassNotificationItemDto,
  })
  @ApiNotFoundResponse({ description: 'Mass notification job not found' })
  @ApiForbiddenResponse({ description: 'Requires administrative privileges' })
  async retryMassNotification(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MassNotificationItemDto> {
    const adminId = user?.id || 'system-admin';
    this.logger.log(
      `POST /api/v1/admin/notifications/mass/${id}/retry invoked by admin=${adminId}`,
    );
    return this.notificationsService.retryMassNotification(adminId, id);
  }
}
