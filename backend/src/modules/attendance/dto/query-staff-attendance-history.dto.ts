import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryStaffAttendanceHistoryDto {
  @ApiPropertyOptional({
    description: 'Search keyword matching date (YYYY-MM-DD), shift name, or property name',
    example: 'Ca Sáng',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by attendance status',
    enum: ['all', 'on_time', 'late', 'absent'],
    example: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'on_time', 'late', 'absent'], {
    message: 'status must be one of: all, on_time, late, absent',
  })
  status?: 'all' | 'on_time' | 'late' | 'absent';

  @ApiPropertyOptional({
    description: 'Filter start date (YYYY-MM-DD)',
    example: '2026-09-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid date string (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter end date (YYYY-MM-DD)',
    example: '2026-09-30',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid date string (YYYY-MM-DD)' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number for list view pagination (Rule #9)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page for list view pagination (Rule #9)',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
