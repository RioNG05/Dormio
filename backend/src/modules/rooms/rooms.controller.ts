import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { ApiAuth, ApiBoardingHouseHeader } from '../../common/swagger';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { BulkGenerateRoomsDto } from './dto/bulk-generate-rooms.dto';
import { RoomQueryDto } from './dto/room-query.dto';
import {
  BulkGenerateRoomsResponseDto,
  RoomListResponseDto,
  RoomMetadataResponseDto,
  RoomResponseDto,
} from './dto/room-response.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

@ApiTags('Rooms')
@ApiAuth()
@ApiBoardingHouseHeader()
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@Controller('rooms')
export class RoomsController {
  private readonly logger = new Logger(RoomsController.name);

  constructor(private readonly roomsService: RoomsService) {}

  @Post('bulk-generate')
  @ApiOperation({
    summary: 'Bulk generate rooms for a boarding house (UC-L-02)',
    description:
      'Validates landlord subscription room quota, creates rooms according to numbering template, associates services, and enforces room number uniqueness per boarding house.',
  })
  @ApiCreatedResponse({
    description: 'Rooms generated successfully',
    type: BulkGenerateRoomsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid input, duplicate room number in batch, or subscription room quota exceeded',
  })
  @ApiConflictResponse({
    description: 'One or more room numbers already exist in this boarding house',
  })
  async bulkGenerateRooms(
    @CurrentUser() user: JwtPayload,
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: BulkGenerateRoomsDto,
  ): Promise<BulkGenerateRoomsResponseDto> {
    this.logger.log(
      `POST /rooms/bulk-generate called by user ${user.id} for house ${boardingHouseId}`,
    );
    return this.roomsService.bulkGenerateRooms(user.id, boardingHouseId, dto);
  }

  @Get('metadata')
  @ApiOperation({
    summary: 'Get room creation metadata (room types, services, plan quota)',
    description:
      'Returns the list of room types, services, current room count, and max allowed room cap for this property.',
  })
  @ApiOkResponse({
    description: 'Metadata retrieved successfully',
    type: RoomMetadataResponseDto,
  })
  async getRoomMetadata(
    @CurrentUser() user: JwtPayload,
    @Headers('x-boarding-house-id') boardingHouseId: string,
  ): Promise<RoomMetadataResponseDto> {
    this.logger.log(
      `GET /rooms/metadata called by user ${user.id} for house ${boardingHouseId}`,
    );
    return this.roomsService.getRoomMetadata(user.id, boardingHouseId);
  }

  @Get()
  @ApiOperation({
    summary: 'List rooms in the boarding house',
    description:
      'Returns paginated rooms with associated room types and services. Supports filtering by status, floor, and search query.',
  })
  @ApiOkResponse({
    description: 'Room list retrieved successfully',
    type: RoomListResponseDto,
  })
  async getRooms(
    @CurrentUser() user: JwtPayload,
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Query() query: RoomQueryDto,
  ): Promise<RoomListResponseDto> {
    this.logger.log(
      `GET /rooms called by user ${user.id} for house ${boardingHouseId} (page=${query.page}, limit=${query.limit})`,
    );
    return this.roomsService.getRooms(boardingHouseId, query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a single room (reusable for UC-L-03 editable grid)',
    description:
      'Updates attributes for a room such as roomNumber, floor, area, maxOccupants, roomTypeId, or status.',
  })
  @ApiOkResponse({
    description: 'Room updated successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiConflictResponse({ description: 'Room number already exists in this property' })
  async updateRoom(
    @CurrentUser() user: JwtPayload,
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoomDto,
  ): Promise<RoomResponseDto> {
    this.logger.log(
      `PATCH /rooms/${id} called by user ${user.id} for house ${boardingHouseId}`,
    );
    return this.roomsService.updateRoom(boardingHouseId, id, dto);
  }
}
