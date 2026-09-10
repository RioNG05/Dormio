import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomStatus } from '@prisma';

export class RoomServiceItemDto {
  @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  id: string;

  @ApiProperty({ example: 'Electricity' })
  name: string;

  @ApiProperty({ example: '3500.00' })
  price: string;

  @ApiProperty({ example: 'kWh' })
  unit: string;

  @ApiProperty({ example: true })
  isMetered: boolean;
}

export class RoomTypeSummaryDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'Studio' })
  name: string;

  @ApiPropertyOptional({ example: 'Private kitchen and bathroom' })
  description?: string | null;
}

export class RoomResponseDto {
  @ApiProperty({ example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' })
  id: string;

  @ApiProperty({ example: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' })
  boardingHouseId: string;

  @ApiProperty({ example: 'P101' })
  roomNumber: string;

  @ApiProperty({ example: 1 })
  floor: number;

  @ApiPropertyOptional({ example: '25.5' })
  area?: string | null;

  @ApiPropertyOptional({ example: 2 })
  maxOccupants?: number | null;

  @ApiProperty({ enum: RoomStatus, example: RoomStatus.available })
  status: RoomStatus;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../room.jpg' })
  imageUrl?: string | null;

  @ApiProperty({ type: RoomTypeSummaryDto })
  roomType: RoomTypeSummaryDto;

  @ApiProperty({ type: [RoomServiceItemDto] })
  services: RoomServiceItemDto[];

  @ApiProperty({ example: '2026-09-05T00:00:00.000Z' })
  createdAt: string;

  @ApiPropertyOptional({ example: '2026-09-05T00:00:00.000Z' })
  updatedAt?: string | null;
}

export class BulkGenerateRoomsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 12, description: 'Number of rooms generated' })
  count: number;

  @ApiProperty({
    type: [RoomResponseDto],
    description: 'List of created rooms with associated types and services',
  })
  data: RoomResponseDto[];
}

export class RoomMetadataResponseDto {
  @ApiProperty({ type: [RoomTypeSummaryDto] })
  roomTypes: RoomTypeSummaryDto[];

  @ApiProperty({ type: [RoomServiceItemDto] })
  services: RoomServiceItemDto[];

  @ApiProperty({ example: 10, description: 'Maximum allowed rooms under current plan' })
  maxRoom: number;

  @ApiProperty({ example: 3, description: 'Current count of existing rooms in this property' })
  currentRoomCount: number;
}

export class RoomPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class RoomListResponseDto {
  @ApiProperty({ type: [RoomResponseDto] })
  data: RoomResponseDto[];

  @ApiProperty({ type: RoomPaginationMetaDto })
  meta: RoomPaginationMetaDto;
}
