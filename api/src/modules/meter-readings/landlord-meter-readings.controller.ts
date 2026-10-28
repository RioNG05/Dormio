import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Headers,
  UseGuards,
  Request,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiOkResponse,
  ApiParam,
  ApiHeader,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard'
import { MeterReadingsService } from './meter-readings.service'
import { RecordLandlordMeterReadingDto } from './dto/record-landlord-meter-reading.dto'
import { UpdateLandlordMeterReadingDto } from './dto/update-landlord-meter-reading.dto'
import {
  LandlordRoomMeteredServicesResponseDto,
  LandlordRoomMeterHistoryResponseDto,
} from './dto/landlord-meter-readings-response.dto'

@ApiTags('Landlord Meter Readings')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@Controller('landlord/meter-readings')
export class LandlordMeterReadingsController {
  private readonly logger = new Logger(LandlordMeterReadingsController.name)

  constructor(private readonly meterReadingsService: MeterReadingsService) {}

  @Get('room/:roomId/services')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get metered services & latest readings for room (UC-L-09)',
    description:
      'Returns active metered services (Electricity, Water) for the room with previous and draft indices.',
  })
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    description: 'Boarding house ID (required)',
    required: true,
  })
  @ApiParam({ name: 'roomId', description: 'Room UUID' })
  @ApiOkResponse({
    description: 'List of metered services for the room',
    type: LandlordRoomMeteredServicesResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Room not found in this boarding house' })
  async getRoomMeteredServices(
    @Request() req: any,
    @Headers('X-Boarding-House-Id') boardingHouseId: string,
    @Param('roomId') roomId: string,
  ) {
    this.logger.log(
      `GET /api/v1/landlord/meter-readings/room/${roomId}/services called by landlord: ${req.user?.id}`,
    )
    const data = await this.meterReadingsService.getRoomMeteredServices(boardingHouseId, roomId)
    return { success: true, data }
  }

  @Get('room/:roomId/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get meter reading cycle history for room (UC-L-09)',
    description:
      'Query complete meter reading history grouped by billing cycle, computing consumption and costs.',
  })
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    description: 'Boarding house ID (required)',
    required: true,
  })
  @ApiParam({ name: 'roomId', description: 'Room UUID' })
  @ApiOkResponse({
    description: 'Room meter reading history',
    type: LandlordRoomMeterHistoryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Room not found in this boarding house' })
  async getRoomMeterHistory(
    @Request() req: any,
    @Headers('X-Boarding-House-Id') boardingHouseId: string,
    @Param('roomId') roomId: string,
  ) {
    this.logger.log(
      `GET /api/v1/landlord/meter-readings/room/${roomId}/history called by landlord: ${req.user?.id}`,
    )
    const data = await this.meterReadingsService.getRoomMeterHistory(boardingHouseId, roomId)
    return { success: true, data }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record meter readings manually (UC-L-09)',
    description:
      'Directly record meter readings into the system without tenant OCR/confirmation. Data is locked immediately.',
  })
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    description: 'Boarding house ID (required)',
    required: true,
  })
  @ApiOkResponse({
    description: 'Meter readings saved successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Room not found in this boarding house' })
  async recordMeterReading(
    @Request() req: any,
    @Headers('X-Boarding-House-Id') boardingHouseId: string,
    @Body() dto: RecordLandlordMeterReadingDto,
  ) {
    this.logger.log(
      `POST /api/v1/landlord/meter-readings called by landlord: ${req.user?.id} for room: ${dto.roomId}`,
    )
    return this.meterReadingsService.recordLandlordMeterReading(req.user?.id, boardingHouseId, dto)
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit meter reading with reason (UC-L-09)',
    description:
      'Allows landlord to adjust meter reading with a mandatory reason. Only applicable to unbilled/unpaid cycles.',
  })
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    description: 'Boarding house ID (required)',
    required: true,
  })
  @ApiParam({ name: 'id', description: 'MeterReading UUID to update' })
  @ApiOkResponse({
    description: 'Meter reading updated successfully',
  })
  @ApiBadRequestResponse({ description: 'Invoice already paid or invalid data' })
  @ApiNotFoundResponse({ description: 'Meter reading record not found' })
  async updateMeterReading(
    @Request() req: any,
    @Headers('X-Boarding-House-Id') boardingHouseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLandlordMeterReadingDto,
  ) {
    this.logger.log(
      `PATCH /api/v1/landlord/meter-readings/${id} called by landlord: ${req.user?.id}`,
    )
    return this.meterReadingsService.updateLandlordMeterReading(
      req.user?.id,
      boardingHouseId,
      id,
      dto,
    )
  }
}
