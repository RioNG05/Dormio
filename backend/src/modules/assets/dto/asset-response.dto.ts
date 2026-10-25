import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AssetCondition } from '@prisma'

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total matching records', example: 45 })
  total: number

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number

  @ApiProperty({ description: 'Records per page', example: 10 })
  limit: number

  @ApiProperty({ description: 'Total available pages', example: 5 })
  totalPages: number
}

export class AssetTenantDto {
  @ApiProperty({ description: 'Tenant user ID' })
  id: string

  @ApiProperty({ description: 'Display name of tenant' })
  name: string

  @ApiPropertyOptional({ description: 'Phone number', nullable: true })
  phone: string | null

  @ApiPropertyOptional({ description: 'Email address', nullable: true })
  email: string | null

  @ApiPropertyOptional({ description: 'Avatar URL', nullable: true })
  avatarUrl: string | null

  @ApiPropertyOptional({ description: 'Contract ID', nullable: true })
  contractId: string | null

  @ApiPropertyOptional({ description: 'Contract start date (ISO)', nullable: true })
  startDate: string | null

  @ApiPropertyOptional({ description: 'Contract end date (ISO)', nullable: true })
  endDate: string | null
}

export class AssetItemDto {
  @ApiProperty({ description: 'Asset UUID' })
  id: string

  @ApiProperty({
    description: 'Human-readable code for display and tracking',
    example: 'TS-001',
  })
  code: string

  @ApiProperty({ description: 'Asset name / title', example: 'Máy lạnh Daikin 1.5 HP' })
  name: string

  @ApiPropertyOptional({ description: 'Category', nullable: true, example: 'Điện máy' })
  category: string | null

  @ApiProperty({ description: 'Location / placement description', example: 'Phòng 101' })
  location: string

  @ApiPropertyOptional({ description: 'Room UUID if assigned', nullable: true })
  roomId: string | null

  @ApiPropertyOptional({ description: 'Room number if assigned', nullable: true, example: '101' })
  roomNumber: string | null

  @ApiProperty({
    description: 'Display name for room location (e.g. "Phòng 101" or "Khu vực chung / Chưa gán")',
    example: 'Phòng 101',
  })
  roomName: string

  @ApiProperty({ description: 'Quantity of items', example: 1 })
  quantity: number

  @ApiProperty({
    description: 'Physical condition of the asset',
    enum: AssetCondition,
    example: AssetCondition.good,
  })
  condition: AssetCondition

  @ApiPropertyOptional({
    description: 'Original purchase price in VND',
    nullable: true,
    example: 9500000,
  })
  purchasePrice: number | null

  @ApiPropertyOptional({
    description: 'Purchase date in ISO 8601 format',
    nullable: true,
    example: '2026-01-10T00:00:00.000Z',
  })
  purchaseDate: string | null

  @ApiPropertyOptional({
    description: 'Photo URL of the asset',
    nullable: true,
    example: 'https://storage.example.com/assets/daikin.jpg',
  })
  imageUrl: string | null

  @ApiPropertyOptional({
    description: 'Notes or warranty details',
    nullable: true,
    example: 'Bảo hành 2 năm chính hãng',
  })
  note: string | null

  @ApiPropertyOptional({
    description: 'Lifespan / depreciation years',
    nullable: true,
    example: 5,
  })
  depreciationYears: number | null

  @ApiPropertyOptional({
    description: 'Model code',
    nullable: true,
    example: 'CU/CS-PU12XKH-8M',
  })
  modelCode: string | null

  @ApiPropertyOptional({
    description: 'Serial number',
    nullable: true,
    example: 'SN-2024-AC-00192',
  })
  serialNumber: string | null

  @ApiPropertyOptional({
    description: 'Warranty period / details',
    nullable: true,
    example: '24 tháng chính hãng',
  })
  warrantyPeriod: string | null

  @ApiPropertyOptional({
    description: 'Supplier or vendor name',
    nullable: true,
    example: 'Điện Máy Xanh Q.1',
  })
  supplier: string | null

  @ApiPropertyOptional({
    description: 'Current occupying tenant info if room is rented',
    type: AssetTenantDto,
    nullable: true,
  })
  tenant?: AssetTenantDto | null

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string

  @ApiProperty({ description: 'Boarding House UUID' })
  boardingHouseId: string
}

export class AssetsSummaryDto {
  @ApiProperty({ description: 'Total distinct asset records', example: 28 })
  totalItems: number

  @ApiProperty({ description: 'Total item units across all assets', example: 45 })
  totalQuantity: number

  @ApiProperty({ description: 'Total purchase value of all assets in VND', example: 120500000 })
  totalValue: number

  @ApiProperty({ description: 'Number of assets in good/new condition', example: 25 })
  goodConditionCount: number

  @ApiProperty({ description: 'Number of assets needing repair or damaged', example: 3 })
  needsRepairCount: number
}

export class AssetsListResponseDto {
  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ type: [AssetItemDto] })
  data: AssetItemDto[]

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto

  @ApiProperty({ type: AssetsSummaryDto })
  summary: AssetsSummaryDto
}

export class MaintenanceLogItemDto {
  @ApiProperty({ description: 'Log UUID' })
  id: string

  @ApiProperty({ description: 'Asset UUID' })
  assetId: string

  @ApiProperty({ description: 'Boarding House UUID' })
  boardingHouseId: string

  @ApiProperty({ description: 'Maintenance type', example: 'repair' })
  type: string

  @ApiProperty({ description: 'Detailed description of the maintenance activity' })
  description: string

  @ApiProperty({ description: 'Maintenance cost in VND', example: 350000 })
  cost: number

  @ApiPropertyOptional({ description: 'Performer or technician name', nullable: true })
  performer: string | null

  @ApiProperty({ description: 'Execution timestamp (ISO)' })
  performedAt: string

  @ApiProperty({ description: 'Creation timestamp (ISO)' })
  createdAt: string
}

export class MaintenanceLogsListResponseDto {
  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ type: [MaintenanceLogItemDto] })
  data: MaintenanceLogItemDto[]

  @ApiProperty({ description: 'Total cost incurred across all maintenance logs in VND', example: 1200000 })
  totalCost: number
}
