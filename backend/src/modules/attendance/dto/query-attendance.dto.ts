import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class QueryAttendanceDto {
  @ApiPropertyOptional({
    description: 'Start date filter (YYYY-MM-DD)',
    example: '2026-09-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate phải có định dạng YYYY-MM-DD' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter (YYYY-MM-DD)',
    example: '2026-09-30',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate phải có định dạng YYYY-MM-DD' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by employee UUID',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID nhân viên không hợp lệ' })
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by shift UUID',
    example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID ca làm việc không hợp lệ' })
  shiftId?: string;

  @ApiPropertyOptional({
    description: 'Filter by attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.on_time,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus, { message: 'Trạng thái chấm công không hợp lệ' })
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Filter search query (employee name or phone)',
    example: 'Nguyễn Văn',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for list view pagination',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page for list view pagination',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
