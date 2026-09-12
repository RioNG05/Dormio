import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRecurringScheduleDto {
  @ApiProperty({
    description: 'Array of employee UUIDs to assign to this recurring schedule',
    example: ['a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Cần chọn ít nhất một nhân viên' })
  @IsUUID('4', { each: true, message: 'ID nhân viên không hợp lệ' })
  employeeIds: string[];

  @ApiProperty({
    description: 'Shift UUID',
    example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  })
  @IsUUID('4', { message: 'ID ca làm việc không hợp lệ' })
  @IsNotEmpty({ message: 'Cần chọn ca làm việc' })
  shiftId: string;

  @ApiProperty({
    description:
      'Comma-separated days of week. Supports 0-6 (0=Sun) or Vietnamese 2,3,4,5,6,7,CN',
    example: '2,4,6',
  })
  @IsString()
  @IsNotEmpty({ message: 'Cần chọn các ngày trong tuần (ví dụ: 2,4,6)' })
  daysOfWeek: string;

  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2026-09-15',
  })
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({
    description: 'End date (YYYY-MM-DD)',
    example: '2026-10-15',
  })
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ (YYYY-MM-DD)' })
  endDate: string;

  @ApiPropertyOptional({
    description: 'Optional note for the scheduled shifts',
    example: 'Trực giám sát camera và kiểm tra an ninh cổng chính',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
