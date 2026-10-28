import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  IsBoolean,
} from 'class-validator'
import { Type } from 'class-transformer'
import { GrievanceImageDto } from './grievance-response.dto'

export enum GrievanceStatusFilter {
  ALL = 'all',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum GrievancePriorityFilter {
  ALL = 'all',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum GrievanceTypeFilter {
  ALL = 'all',
  COMPLAINT = 'complaint',
  INQUIRY = 'inquiry',
  FEEDBACK = 'feedback',
}

export class AdminGrievanceQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by grievance type',
    enum: GrievanceTypeFilter,
    default: GrievanceTypeFilter.ALL,
  })
  @IsOptional()
  @IsEnum(GrievanceTypeFilter)
  type?: GrievanceTypeFilter = GrievanceTypeFilter.ALL

  @ApiPropertyOptional({
    description: 'Filter by grievance status',
    enum: GrievanceStatusFilter,
    default: GrievanceStatusFilter.ALL,
  })
  @IsOptional()
  @IsEnum(GrievanceStatusFilter)
  status?: GrievanceStatusFilter = GrievanceStatusFilter.ALL

  @ApiPropertyOptional({
    description: 'Filter by priority level',
    enum: GrievancePriorityFilter,
    default: GrievancePriorityFilter.ALL,
  })
  @IsOptional()
  @IsEnum(GrievancePriorityFilter)
  priority?: GrievancePriorityFilter = GrievancePriorityFilter.ALL

  @ApiPropertyOptional({
    description: 'Filter by boarding house ID',
  })
  @IsOptional()
  @IsString()
  boardingHouseId?: string

  @ApiPropertyOptional({
    description:
      'Search by keyword (title, description, tenant name, phone, house name, room number)',
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Page size limit',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10
}

export class ResolveGrievanceDto {
  @ApiProperty({
    example:
      'Mediation reached between both parties. Landlord agreed to refund 100% deposit of 2,000,000 VND to tenant.',
    description:
      'Written explanation / resolution note visible to the tenant and recorded in audit log',
  })
  @IsNotEmpty({ message: 'Resolution note is required' })
  @IsString()
  @MinLength(5, { message: 'Resolution note must be at least 5 characters' })
  resolutionNote: string

  @ApiPropertyOptional({
    example: false,
    description: 'Flag to penalize / lock landlord listing or send high-priority alert',
  })
  @IsOptional()
  @IsBoolean()
  escalateLockLandlord?: boolean
}

export class RejectGrievanceDto {
  @ApiProperty({
    example:
      'Resolution rejected: Transaction took place entirely off-platform and without a valid lease contract on Dormio.',
    description: 'Written explanation / rejection note visible to the tenant',
  })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  @MinLength(5, { message: 'Rejection reason must be at least 5 characters' })
  resolutionNote: string
}

export class AdminGrievanceItemDto {
  @ApiProperty({ example: 'grievance-uuid-1' })
  id: string

  @ApiProperty({ example: 'Landlord arbitrarily withholding deposit' })
  title: string

  @ApiProperty({ example: 'Detailed description of tenant grievance...' })
  description: string

  @ApiProperty({ enum: ['complaint', 'inquiry', 'feedback'], example: 'complaint' })
  type: 'complaint' | 'inquiry' | 'feedback'

  @ApiProperty({ enum: ['low', 'medium', 'high'], example: 'high' })
  priority: 'low' | 'medium' | 'high'

  @ApiProperty({ enum: ['pending', 'in_progress', 'resolved', 'rejected'], example: 'pending' })
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'

  @ApiProperty({ example: 'user-tenant-1' })
  tenantId: string

  @ApiProperty({ example: 'Tran Thi Thuy Dung' })
  tenantName: string

  @ApiProperty({ example: '0912345678' })
  tenantPhone: string

  @ApiProperty({ example: 'dung.tran@gmail.com' })
  tenantEmail: string

  @ApiProperty({ example: 'house-1', nullable: true })
  boardingHouseId: string | null

  @ApiProperty({ example: 'Dormio Sunrise Q7', nullable: true })
  boardingHouseName: string | null

  @ApiProperty({ example: 'room-1', nullable: true })
  roomId: string | null

  @ApiProperty({ example: '101', nullable: true })
  roomNumber: string | null

  @ApiProperty({ example: 'Nguyen Quang Huy', nullable: true })
  landlordName: string | null

  @ApiProperty({ example: '0344265925', nullable: true })
  landlordPhone: string | null

  @ApiProperty({ example: 'Mediation completed successfully.', nullable: true })
  resolutionNote: string | null

  @ApiProperty({ example: '2026-09-08T10:00:00.000Z', nullable: true })
  resolvedAt: string | null

  @ApiProperty({ example: 'System Administrator', nullable: true })
  resolvedByName: string | null

  @ApiProperty({ type: [GrievanceImageDto] })
  images: GrievanceImageDto[]

  @ApiProperty({ example: '2026-09-08T09:15:00.000Z' })
  createdAt: string

  @ApiProperty({ example: '2026-09-08T09:15:00.000Z' })
  updatedAt: string
}

export class GrievanceQueueCountsDto {
  @ApiProperty({ example: 5 })
  pending: number

  @ApiProperty({ example: 2 })
  inProgress: number

  @ApiProperty({ example: 18 })
  resolved: number

  @ApiProperty({ example: 4 })
  rejected: number

  @ApiProperty({ example: 3 })
  urgent: number
}

export class AdminGrievanceListResponseDto {
  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ type: [AdminGrievanceItemDto] })
  items: AdminGrievanceItemDto[]

  @ApiProperty({ example: 29 })
  total: number

  @ApiProperty({ example: 1 })
  page: number

  @ApiProperty({ example: 10 })
  limit: number

  @ApiProperty({ example: 3 })
  totalPages: number

  @ApiProperty({ type: GrievanceQueueCountsDto })
  counts: GrievanceQueueCountsDto
}
