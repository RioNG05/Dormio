import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GrievanceImageDto } from './grievance-response.dto';

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

export class AdminGrievanceQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by grievance status',
    enum: GrievanceStatusFilter,
    default: GrievanceStatusFilter.ALL,
  })
  @IsOptional()
  @IsEnum(GrievanceStatusFilter)
  status?: GrievanceStatusFilter = GrievanceStatusFilter.ALL;

  @ApiPropertyOptional({
    description: 'Filter by priority level',
    enum: GrievancePriorityFilter,
    default: GrievancePriorityFilter.ALL,
  })
  @IsOptional()
  @IsEnum(GrievancePriorityFilter)
  priority?: GrievancePriorityFilter = GrievancePriorityFilter.ALL;

  @ApiPropertyOptional({
    description: 'Search by keyword (title, description, tenant name, phone, house name, room number)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size limit',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class ResolveGrievanceDto {
  @ApiProperty({
    example: 'Đã hòa giải giữa hai bên. Chủ trọ đồng ý hoàn lại 100% tiền cọc 2.000.000đ cho khách thuê.',
    description: 'Written explanation / resolution note visible to the tenant and recorded in audit log',
  })
  @IsNotEmpty({ message: 'Resolution note is required' })
  @IsString()
  @MinLength(5, { message: 'Resolution note must be at least 5 characters' })
  resolutionNote: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Flag to penalize / lock landlord listing or send high-priority alert',
  })
  @IsOptional()
  @IsBoolean()
  escalateLockLandlord?: boolean;
}

export class RejectGrievanceDto {
  @ApiProperty({
    example: 'Từ chối giải quyết: Giao dịch diễn ra hoàn toàn ngoài nền tảng và không có hợp đồng thuê phòng trên Dormio.',
    description: 'Written explanation / rejection note visible to the tenant',
  })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  @MinLength(5, { message: 'Rejection reason must be at least 5 characters' })
  resolutionNote: string;
}

export class AdminGrievanceItemDto {
  @ApiProperty({ example: 'grievance-uuid-1' })
  id: string;

  @ApiProperty({ example: 'Chủ trọ tự ý giữ tiền cọc' })
  title: string;

  @ApiProperty({ example: 'Mô tả chi tiết khiếu nại của khách thuê...' })
  description: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'], example: 'high' })
  priority: 'low' | 'medium' | 'high';

  @ApiProperty({ enum: ['pending', 'in_progress', 'resolved', 'rejected'], example: 'pending' })
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';

  @ApiProperty({ example: 'user-tenant-1' })
  tenantId: string;

  @ApiProperty({ example: 'Trần Thị Thuỳ Dung' })
  tenantName: string;

  @ApiProperty({ example: '0912345678' })
  tenantPhone: string;

  @ApiProperty({ example: 'dung.tran@gmail.com' })
  tenantEmail: string;

  @ApiProperty({ example: 'house-1' })
  boardingHouseId: string;

  @ApiProperty({ example: 'Dormio Sunrise Q7' })
  boardingHouseName: string;

  @ApiProperty({ example: 'room-1' })
  roomId: string;

  @ApiProperty({ example: '101' })
  roomNumber: string;

  @ApiProperty({ example: 'Nguyễn Quang Huy' })
  landlordName: string;

  @ApiProperty({ example: '0344265925' })
  landlordPhone: string;

  @ApiProperty({ example: 'Đã hòa giải thành công.', nullable: true })
  resolutionNote: string | null;

  @ApiProperty({ example: '2026-09-08T10:00:00.000Z', nullable: true })
  resolvedAt: string | null;

  @ApiProperty({ example: 'Admin Quản Trị', nullable: true })
  resolvedByName: string | null;

  @ApiProperty({ type: [GrievanceImageDto] })
  images: GrievanceImageDto[];

  @ApiProperty({ example: '2026-09-08T09:15:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-08T09:15:00.000Z' })
  updatedAt: string;
}

export class GrievanceQueueCountsDto {
  @ApiProperty({ example: 5 })
  pending: number;

  @ApiProperty({ example: 2 })
  inProgress: number;

  @ApiProperty({ example: 18 })
  resolved: number;

  @ApiProperty({ example: 4 })
  rejected: number;

  @ApiProperty({ example: 3 })
  urgent: number;
}

export class AdminGrievanceListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [AdminGrievanceItemDto] })
  items: AdminGrievanceItemDto[];

  @ApiProperty({ example: 29 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ type: GrievanceQueueCountsDto })
  counts: GrievanceQueueCountsDto;
}
