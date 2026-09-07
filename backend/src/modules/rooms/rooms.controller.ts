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
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomDashboardResponseDto } from './dto/room-dashboard-response.dto';
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

  @Post()
  @ApiOperation({
    summary: 'Create a single room (UC-L-03)',
    description:
      'Creates an individual room in the boarding house, validates landlord subscription quota, ensures room number uniqueness, and attaches specified or autoApplied services as RoomService.',
  })
  @ApiCreatedResponse({
    description: 'Room created successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid input, invalid service IDs, or subscription plan max room limit exceeded',
  })
  @ApiResponse({
    status: 404,
    description: 'Specified roomTypeId does not exist for this boarding house',
  })
  @ApiConflictResponse({
    description: 'Room number already exists in this boarding house',
  })
  async createRoom(
    @CurrentUser() user: JwtPayload,
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    this.logger.log(
      `POST /rooms called by user ${user.id} for house ${boardingHouseId} (roomNumber=${dto.roomNumber})`,
    );
    return this.roomsService.createRoom(user.id, boardingHouseId, dto);
  }

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

  @Get(':id/dashboard')
  @ApiOperation({
    summary: 'View Room Dashboard (UC-L-05)',
    description:
      'Performs a single aggregated query to return room specifications, attached services, current active contract with tenants and identification, full rental history, invoices, and meter readings.',
  })
  @ApiOkResponse({
    description: 'Room dashboard retrieved successfully',
    type: RoomDashboardResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Room not found in this property' })
  async getRoomDashboard(
    @CurrentUser() user: JwtPayload,
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomDashboardResponseDto> {
    this.logger.log(
      `GET /rooms/${id}/dashboard called by user ${user.id} for house ${boardingHouseId}`,
    );
    return this.roomsService.getRoomDashboard(boardingHouseId, id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single room details (UC-L-03 / UC-L-05)',
    description:
      'Returns single room details including joined roomType and roomServices for editing or room dashboard.',
  })
  @ApiOkResponse({
    description: 'Room retrieved successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Room not found in this property' })
  async getRoomById(
    @CurrentUser() user: JwtPayload,
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomResponseDto> {
    this.logger.log(
      `GET /rooms/${id} called by user ${user.id} for house ${boardingHouseId}`,
    );
    return this.roomsService.getRoomById(boardingHouseId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a single room (UC-L-03)',
    description:
      'Updates attributes for a room such as roomNumber, floor, area, maxOccupants, roomTypeId, status, imageUrl, or synchronized service attachments.',
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
