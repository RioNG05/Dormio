import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceStatus } from '@prisma';

export class ServiceItemDto {
  @ApiProperty({ example: '8f7a6344-7ff5-4e78-bc40-5494d6e9f1a2' })
  id: string;

  @ApiProperty({ example: 'c0b89b43-b9dc-46d2-8bfe-ec5a7a72dcf3' })
  boardingHouseId: string;

  @ApiProperty({ example: 'Điện sinh hoạt' })
  name: string;

  @ApiProperty({ example: '3500.00' })
  price: string;

  @ApiProperty({ example: 3500 })
  numericPrice: number;

  @ApiProperty({ example: 'kWh' })
  unit: string;

  @ApiProperty({ example: true })
  isMetered: boolean;

  @ApiProperty({ example: true })
  autoApplied: boolean;

  @ApiProperty({ enum: ServiceStatus, example: ServiceStatus.active })
  status: ServiceStatus;

  @ApiProperty({ example: 12 })
  appliedRoomsCount: number;

  @ApiProperty({ example: '2026-09-11T08:00:00.000Z' })
  createdAt: string;

  @ApiPropertyOptional({ example: '2026-09-11T08:00:00.000Z' })
  updatedAt?: string | null;
}

export class ServicesSummaryDto {
  @ApiProperty({ example: 6 })
  totalServices: number;

  @ApiProperty({ example: 2 })
  meteredCount: number;

  @ApiProperty({ example: 2 })
  roomFixedCount: number;

  @ApiProperty({ example: 2 })
  otherCount: number;

  @ApiProperty({ example: 5 })
  activeCount: number;

  @ApiProperty({ example: 1 })
  inactiveCount: number;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 6 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class ServicesListResponseDto {
  @ApiProperty({ type: [ServiceItemDto] })
  items: ServiceItemDto[];

  @ApiProperty({ type: ServicesSummaryDto })
  summary: ServicesSummaryDto;

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class ServiceAssignedRoomDto {
  @ApiProperty({ example: 'cec7370a-f423-4a6d-b999-ffd15d5c8c48' })
  id: string;

  @ApiProperty({ example: '101' })
  roomNumber: string;

  @ApiProperty({ example: 1 })
  floor: number;

  @ApiProperty({ example: 'available' })
  status: string;
}

export class ServiceRoomsResponseDto {
  @ApiProperty({ example: '8f7a6344-7ff5-4e78-bc40-5494d6e9f1a2' })
  serviceId: string;

  @ApiProperty({ example: 'Điện sinh hoạt' })
  serviceName: string;

  @ApiProperty({ example: 5 })
  appliedRoomsCount: number;

  @ApiProperty({ type: [ServiceAssignedRoomDto] })
  rooms: ServiceAssignedRoomDto[];
}
