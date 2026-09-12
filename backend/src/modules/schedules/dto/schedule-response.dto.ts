import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus, ScheduleStatus } from '@prisma';

export class WorkScheduleItemDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  boardingHouseId: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' })
  employeeId: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  employeeName: string;

  @ApiProperty({ example: '0912345678' })
  employeePhone: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  employeeAvatar: string | null;

  @ApiPropertyOptional({ example: 'Bảo vệ' })
  positionName: string | null;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' })
  shiftId: string;

  @ApiProperty({ example: 'Ca sáng' })
  shiftName: string;

  @ApiProperty({ example: '06:00' })
  startTime: string;

  @ApiProperty({ example: '14:00' })
  endTime: string;

  @ApiProperty({ example: '2026-09-15' })
  workDate: string;

  @ApiPropertyOptional({ example: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a' })
  recurrenceId: string | null;

  @ApiProperty({
    description: 'True if this schedule was generated from a recurrence pattern',
    example: true,
  })
  isRecurring: boolean;

  @ApiProperty({ enum: ScheduleStatus, example: 'scheduled' })
  status: ScheduleStatus;

  @ApiPropertyOptional({ example: 'Trực an ninh cổng A' })
  note: string | null;

  @ApiPropertyOptional({ enum: AttendanceStatus, example: 'on_time' })
  attendanceStatus: AttendanceStatus | null;

  @ApiPropertyOptional({ example: '2026-09-15T06:02:00.000Z' })
  checkIn: string | null;

  @ApiPropertyOptional({ example: '2026-09-15T14:01:00.000Z' })
  checkOut: string | null;

  @ApiProperty({ example: '2026-09-12T00:00:00.000Z' })
  createdAt: string;
}

export class SchedulesSummaryDto {
  @ApiProperty({ example: 42 })
  totalSchedules: number;

  @ApiProperty({ example: 38 })
  scheduledCount: number;

  @ApiProperty({ example: 4 })
  canceledCount: number;

  @ApiProperty({ example: 30 })
  recurringCount: number;

  @ApiProperty({ example: 12 })
  adhocCount: number;
}

export class SchedulesListResponseDto {
  @ApiProperty({ type: [WorkScheduleItemDto] })
  data: WorkScheduleItemDto[];

  @ApiProperty({ type: SchedulesSummaryDto })
  summary: SchedulesSummaryDto;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class CreateRecurringResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 2 })
  patternsCreated: number;

  @ApiProperty({ example: 24 })
  schedulesMaterialized: number;

  @ApiProperty({ example: 'Đã phân ca lặp lại và tạo thành công 24 lịch làm việc.' })
  message: string;
}
