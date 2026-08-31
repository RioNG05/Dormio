import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CurrentDraftReadingDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiPropertyOptional({ example: 1245.5, nullable: true })
  readingValue: number | null;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/dormio/meter.jpg', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: '2026-08-31T22:45:00.000Z' })
  createdAt: string;
}

export class PreviousReadingDto {
  @ApiProperty({ example: 1120.0 })
  readingValue: number;

  @ApiProperty({ example: '2026-07-31T22:45:00.000Z' })
  recordedAt: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/dormio/old_meter.jpg', nullable: true })
  imageUrl: string | null;
}

export class MeteredServiceItemDto {
  @ApiProperty({ example: 'd9b2d63d-a233-4123-847e-2972986422b4' })
  serviceId: string;

  @ApiProperty({ example: 'Điện' })
  serviceName: string;

  @ApiProperty({ example: 3500 })
  unitPrice: number;

  @ApiProperty({ example: 'kWh' })
  unit: string;

  @ApiPropertyOptional({ type: CurrentDraftReadingDto, nullable: true })
  currentReading: CurrentDraftReadingDto | null;

  @ApiPropertyOptional({ type: PreviousReadingDto, nullable: true })
  previousReading: PreviousReadingDto | null;

  @ApiProperty({ example: false })
  isCompleted: boolean;
}

export class ActiveMeteredServicesResponseDto {
  @ApiProperty({ example: 'r1-uuid' })
  roomId: string;

  @ApiProperty({ example: 'P.302' })
  roomNumber: string;

  @ApiProperty({ example: 'c1-uuid' })
  contractId: string;

  @ApiProperty({ example: 5 })
  monthlyPaymentDate: number;

  @ApiProperty({ type: [MeteredServiceItemDto] })
  meteredServices: MeteredServiceItemDto[];

  @ApiProperty({ example: 2 })
  totalMeteredServices: number;

  @ApiProperty({ example: 1 })
  completedMeteredServices: number;

  @ApiProperty({ example: false })
  isAllCompleted: boolean;
}
