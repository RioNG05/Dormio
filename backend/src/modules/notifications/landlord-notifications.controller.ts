import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { ApiAuth, ApiBoardingHouseHeader } from '../../common/swagger';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { AnnouncementQueryDto } from './dto/announcement-query.dto';
import { BroadcastAnnouncementDto } from './dto/broadcast-announcement.dto';
import {
  LandlordAnnouncementItemDto,
  LandlordAnnouncementsResponseDto,
} from './dto/landlord-announcement-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Landlord Notifications')
@ApiAuth()
@ApiBoardingHouseHeader()
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@Controller('landlord/notifications')
export class LandlordNotificationsController {
  private readonly logger = new Logger(LandlordNotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // ─── POST /api/v1/landlord/notifications/broadcast (UC-L-13) ───────────────

  @Post('broadcast')
  @ApiOperation({
    summary: 'Broadcast announcement to boarding house (UC-L-13)',
    description:
      'Creates a broadcast announcement for all residents in the specified boarding house. ' +
      'Stores a Notification record with receiverId = NULL (broadcast convention) ' +
      'and triggers async multi-channel dispatch via BullMQ job queue.',
  })
  @ApiCreatedResponse({
    description: 'Broadcast announcement successfully published',
    type: LandlordAnnouncementItemDto,
  })
  @ApiForbiddenResponse({
    description: 'Landlord does not own this boarding house',
  })
  async broadcast(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: BroadcastAnnouncementDto,
  ): Promise<{ success: boolean; data: LandlordAnnouncementItemDto }> {
    this.logger.log(
      `POST /api/v1/landlord/notifications/broadcast invoked by landlord ${user.id} for house ${boardingHouseId}`,
    );

    const data = await this.notificationsService.broadcastAnnouncement(
      boardingHouseId,
      user.id,
      dto,
    );

    return { success: true, data };
  }

  // ─── GET /api/v1/landlord/notifications/announcements ─────────────────────

  @Get('announcements')
  @ApiOperation({
    summary: 'List announcements for boarding house',
    description:
      'Returns a paginated list of broadcast announcements for the specified boarding house, ' +
      'with search and category filtering, plus reach metrics.',
  })
  @ApiOkResponse({
    description: 'Announcements retrieved successfully',
    type: LandlordAnnouncementsResponseDto,
  })
  async getAnnouncements(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: AnnouncementQueryDto,
  ): Promise<LandlordAnnouncementsResponseDto> {
    this.logger.log(
      `GET /api/v1/landlord/notifications/announcements invoked by landlord ${user.id} for house ${boardingHouseId}`,
    );

    return this.notificationsService.getBoardingHouseAnnouncements(
      boardingHouseId,
      query,
    );
  }

  // ─── DELETE /api/v1/landlord/notifications/:id ────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an announcement',
    description:
      'Removes a broadcast announcement from the boarding house. ' +
      'Only the owner of the boarding house can delete its announcements.',
  })
  @ApiNoContentResponse({ description: 'Announcement deleted successfully' })
  @ApiNotFoundResponse({ description: 'Announcement not found' })
  @ApiForbiddenResponse({
    description: 'Announcement does not belong to this boarding house',
  })
  async deleteAnnouncement(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.log(
      `DELETE /api/v1/landlord/notifications/${id} invoked by landlord ${user.id} for house ${boardingHouseId}`,
    );

    await this.notificationsService.deleteAnnouncement(boardingHouseId, id);
  }
}
