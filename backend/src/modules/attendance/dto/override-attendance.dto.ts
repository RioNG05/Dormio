import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class OverrideAttendanceDto {
  @ApiProperty({
    description: 'Work schedule UUID to override attendance for',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID('4', { message: 'ID lịch làm việc không hợp lệ' })
  @IsNotEmpty({ message: 'workScheduleId không được để trống' })
  workScheduleId: string;

  @ApiProperty({
    description: 'Overridden attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.on_time,
  })
  @IsEnum(AttendanceStatus, { message: 'Trạng thái chấm công không hợp lệ' })
  status: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Check-in timestamp (ISO string)',
    example: '2026-09-12T06:05:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Giờ check-in không hợp lệ' })
  checkIn?: string;

  @ApiPropertyOptional({
    description: 'Check-out timestamp (ISO string)',
    example: '2026-09-12T14:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Giờ check-out không hợp lệ' })
  checkOut?: string;

  @ApiPropertyOptional({
    description: 'Landlord adjustment note or reason',
    example: 'Nhân viên quên mang điện thoại check-in, xác nhận qua camera',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
