import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AttendanceStatus } from '@prisma'
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class OverrideAttendanceDto {
  @ApiProperty({
    description: 'Work schedule UUID to override attendance for',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID('4', { message: 'Invalid work schedule ID' })
  @IsNotEmpty({ message: 'workScheduleId cannot be empty' })
  workScheduleId: string

  @ApiProperty({
    description: 'Overridden attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.on_time,
  })
  @IsEnum(AttendanceStatus, { message: 'Invalid attendance status' })
  status: AttendanceStatus

  @ApiPropertyOptional({
    description: 'Check-in timestamp (ISO string)',
    example: '2026-09-12T06:05:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid check-in time' })
  checkIn?: string

  @ApiPropertyOptional({
    description: 'Check-out timestamp (ISO string)',
    example: '2026-09-12T14:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid check-out time' })
  checkOut?: string

  @ApiPropertyOptional({
    description: 'Landlord adjustment note or reason',
    example: 'Staff forgot phone for check-in, verified via camera',
  })
  @IsOptional()
  @IsString()
  note?: string
}
