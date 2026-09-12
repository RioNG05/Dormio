import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AssignmentStatus } from '@prisma';

export class QueryStaffDto {
  @ApiPropertyOptional({
    description: 'Search by staff name, phone number, or position name',
    example: 'Nguyễn Văn Bảo',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by employment status (active | inactive)',
    enum: AssignmentStatus,
    example: AssignmentStatus.active,
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({
    description: 'Filter by job position ID',
    example: 'c6f9e8a0-2f3b-4e1a-9f5e-7a8b9c0d1e2f',
  })
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['joinedAt', 'name', 'status'],
    default: 'joinedAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'joinedAt' | 'name' | 'status' = 'joinedAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
