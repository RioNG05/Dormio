import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LandlordReadingSnapshotDto {
  @ApiProperty({ description: 'UUID of MeterReading' })
  id: string;

  @ApiProperty({ description: 'Reading value', example: 1530 })
  readingValue: number;

  @ApiPropertyOptional({ description: 'Meter photo URL', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ description: 'Recorded at timestamp ISO' })
  createdAt: string;
}

export class LandlordActiveMeteredServiceItemDto {
  @ApiProperty({ description: 'Service UUID' })
  serviceId: string;

  @ApiProperty({ description: 'Service name (e.g. Điện, Nước)', example: 'Điện' })
  serviceName: string;

  @ApiProperty({ description: 'Unit price per unit', example: 3500 })
  unitPrice: number;

  @ApiProperty({ description: 'Unit measurement', example: 'kWh' })
  unit: string;

  @ApiPropertyOptional({
    description: 'Last reading value recorded previously (for calculating delta)',
    type: LandlordReadingSnapshotDto,
    nullable: true,
  })
  lastReading: LandlordReadingSnapshotDto | null;

  @ApiPropertyOptional({
    description: 'Current unbilled reading if already logged for the active cycle',
    type: LandlordReadingSnapshotDto,
    nullable: true,
  })
  unbilledReading: LandlordReadingSnapshotDto | null;
}

export class LandlordRoomMeteredServicesResponseDto {
  @ApiProperty({ description: 'Room UUID' })
  roomId: string;

  @ApiProperty({ description: 'Room number', example: '101' })
  roomNumber: string;

  @ApiProperty({
    description: 'List of active metered services for the room',
    type: [LandlordActiveMeteredServiceItemDto],
  })
  services: LandlordActiveMeteredServiceItemDto[];
}

export class LandlordMeterReadingServiceItemDto {
  @ApiProperty({ description: 'Meter reading UUID' })
  id: string;

  @ApiProperty({ description: 'Service UUID' })
  serviceId: string;

  @ApiProperty({ description: 'Service name (e.g. Điện, Nước)' })
  serviceName: string;

  @ApiProperty({ description: 'Unit', example: 'kWh' })
  unit: string;

  @ApiProperty({ description: 'Unit price', example: 3500 })
  unitPrice: number;

  @ApiProperty({ description: 'Old reading value', example: 1428 })
  oldReading: number;

  @ApiProperty({ description: 'New reading value', example: 1530 })
  newReading: number;

  @ApiProperty({ description: 'Consumption amount (new - old)', example: 102 })
  consumption: number;

  @ApiProperty({ description: 'Cost total (consumption * unitPrice)', example: 357000 })
  cost: number;

  @ApiPropertyOptional({ description: 'Meter photo proof URL', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ description: 'Timestamp recorded' })
  createdAt: string;
}

export class LandlordMeterPeriodHistoryDto {
  @ApiProperty({ description: 'Period label (e.g. Tháng 09/2026)', example: 'Tháng 09/2026' })
  period: string;

  @ApiProperty({ description: 'Formatted date string', example: '01/09/2026 08:00' })
  date: string;

  @ApiProperty({ description: 'Timestamp ISO' })
  createdAt: string;

  @ApiProperty({
    description: 'Individual service meter readings in this cycle',
    type: [LandlordMeterReadingServiceItemDto],
  })
  services: LandlordMeterReadingServiceItemDto[];

  @ApiProperty({ description: 'Sum of meter costs for this period', example: 457000 })
  totalMeterCost: number;

  @ApiPropertyOptional({ description: 'Associated Invoice ID if billed', nullable: true })
  invoiceId: string | null;

  @ApiProperty({ description: 'Payment status of associated invoice', example: 'unpaid' })
  invoiceStatus: string;

  @ApiProperty({ description: 'Whether invoice has been paid', example: false })
  isPaid: boolean;

  @ApiProperty({
    description: 'Whether landlord can edit these readings (unbilled or unpaid)',
    example: true,
  })
  canEdit: boolean;

  @ApiPropertyOptional({ description: 'Edit reason if modified', nullable: true })
  editReason?: string;

  @ApiPropertyOptional({ description: 'Timestamp when edited', nullable: true })
  editedAt?: string;
}

export class LandlordRoomMeterHistoryResponseDto {
  @ApiProperty({ description: 'Room UUID' })
  roomId: string;

  @ApiProperty({ description: 'Room number', example: '101' })
  roomNumber: string;

  @ApiProperty({
    description: 'Chronological list of meter reading cycles',
    type: [LandlordMeterPeriodHistoryDto],
  })
  history: LandlordMeterPeriodHistoryDto[];
}
