import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStatus } from '@prisma';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class UpdateRecurrenceDto {
  @ApiPropertyOptional({
    description: 'Updated shift UUID for all forward occurrences',
    example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID ca làm việc không hợp lệ' })
  shiftId?: string;

  @ApiPropertyOptional({
    description: 'Updated status for all forward occurrences',
    enum: ScheduleStatus,
    example: 'canceled',
  })
  @IsOptional()
  @IsEnum(ScheduleStatus, { message: 'Trạng thái ca làm việc không hợp lệ' })
  status?: ScheduleStatus;
}
