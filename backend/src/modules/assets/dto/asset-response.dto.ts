import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCondition } from '@prisma';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total matching records', example: 45 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Records per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total available pages', example: 5 })
  totalPages: number;
}

export class AssetItemDto {
  @ApiProperty({ description: 'Asset UUID' })
  id: string;

  @ApiProperty({
    description: 'Human-readable code for display and tracking',
    example: 'TS-001',
  })
  code: string;

  @ApiProperty({ description: 'Asset name / title', example: 'Máy lạnh Daikin 1.5 HP' })
  name: string;

  @ApiPropertyOptional({ description: 'Category', nullable: true, example: 'Điện máy' })
  category: string | null;

  @ApiProperty({ description: 'Location / placement description', example: 'Phòng 101' })
  location: string;

  @ApiPropertyOptional({ description: 'Room UUID if assigned', nullable: true })
  roomId: string | null;

  @ApiPropertyOptional({ description: 'Room number if assigned', nullable: true, example: '101' })
  roomNumber: string | null;

  @ApiProperty({
    description: 'Display name for room location (e.g. "Phòng 101" or "Khu vực chung / Chưa gán")',
    example: 'Phòng 101',
  })
  roomName: string;

  @ApiProperty({ description: 'Quantity of items', example: 1 })
  quantity: number;

  @ApiProperty({
    description: 'Physical condition of the asset',
    enum: AssetCondition,
    example: AssetCondition.good,
  })
  condition: AssetCondition;

  @ApiPropertyOptional({
    description: 'Original purchase price in VND',
    nullable: true,
    example: 9500000,
  })
  purchasePrice: number | null;

  @ApiPropertyOptional({
    description: 'Purchase date in ISO 8601 format',
    nullable: true,
    example: '2026-01-10T00:00:00.000Z',
  })
  purchaseDate: string | null;

  @ApiPropertyOptional({
    description: 'Photo URL of the asset',
    nullable: true,
    example: 'https://storage.example.com/assets/daikin.jpg',
  })
  imageUrl: string | null;

  @ApiPropertyOptional({
    description: 'Notes or warranty details',
    nullable: true,
    example: 'Bảo hành 2 năm chính hãng',
  })
  note: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;

  @ApiProperty({ description: 'Boarding House UUID' })
  boardingHouseId: string;
}

export class AssetsSummaryDto {
  @ApiProperty({ description: 'Total distinct asset records', example: 28 })
  totalItems: number;

  @ApiProperty({ description: 'Total item units across all assets', example: 45 })
  totalQuantity: number;

  @ApiProperty({ description: 'Total purchase value of all assets in VND', example: 120500000 })
  totalValue: number;

  @ApiProperty({ description: 'Number of assets in good/new condition', example: 25 })
  goodConditionCount: number;

  @ApiProperty({ description: 'Number of assets needing repair or damaged', example: 3 })
  needsRepairCount: number;
}

export class AssetsListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [AssetItemDto] })
  data: AssetItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;

  @ApiProperty({ type: AssetsSummaryDto })
  summary: AssetsSummaryDto;
}
