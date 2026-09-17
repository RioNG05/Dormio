import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class QueryStaffSchedulesDto {
  @ApiPropertyOptional({
    description: 'Start date filter for schedule roster window (YYYY-MM-DD)',
    example: '2026-09-14',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid date string (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter for schedule roster window (YYYY-MM-DD)',
    example: '2026-09-20',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid date string (YYYY-MM-DD)' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Optional boarding house UUID to filter schedules by specific property',
    example: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  })
  @IsOptional()
  @IsUUID('4', { message: 'boardingHouseId must be a valid UUID' })
  boardingHouseId?: string;
}

