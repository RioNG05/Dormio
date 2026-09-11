import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStatus } from '@prisma';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateScheduleDto {
  @ApiPropertyOptional({
    description: 'Updated shift UUID',
    example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID ca làm việc không hợp lệ' })
  shiftId?: string;

  @ApiPropertyOptional({
    description: 'Updated work date (YYYY-MM-DD)',
    example: '2026-09-17',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày làm việc không hợp lệ' })
  workDate?: string;

  @ApiPropertyOptional({
    description: 'Schedule status',
    enum: ScheduleStatus,
    example: 'scheduled',
  })
  @IsOptional()
  @IsEnum(ScheduleStatus, { message: 'Trạng thái ca làm việc không hợp lệ' })
  status?: ScheduleStatus;

  @ApiPropertyOptional({
    description: 'Duty note for the shift',
    example: 'Đổi sang trực ca tối thay nhân viên A',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
