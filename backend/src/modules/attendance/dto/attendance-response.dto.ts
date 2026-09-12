import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus, ScheduleStatus } from '@prisma';

export class AttendanceRecordDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  workScheduleId: string;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    nullable: true,
  })
  attendanceId: string | null;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' })
  employeeId: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  employeeName: string;

  @ApiProperty({ example: '0912345678' })
  employeePhone: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  employeeAvatar: string | null;

  @ApiPropertyOptional({ example: 'Bảo vệ', nullable: true })
  positionName: string | null;

  @ApiProperty({ example: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a' })
  shiftId: string;

  @ApiProperty({ example: 'Ca sáng' })
  shiftName: string;

  @ApiProperty({ example: '06:00' })
  shiftStartTime: string;

  @ApiProperty({ example: '14:00' })
  shiftEndTime: string;

  @ApiProperty({ example: '2026-09-12' })
  workDate: string;

  @ApiProperty({ enum: ScheduleStatus, example: ScheduleStatus.scheduled })
  scheduleStatus: ScheduleStatus;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.on_time })
  attendanceStatus: AttendanceStatus;

  @ApiPropertyOptional({
    example: '2026-09-12T05:58:00.000Z',
    nullable: true,
  })
  checkIn: string | null;

  @ApiPropertyOptional({
    example: '2026-09-12T14:02:00.000Z',
    nullable: true,
  })
  checkOut: string | null;

  @ApiPropertyOptional({
    example: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    nullable: true,
  })
  editedBy: string | null;

  @ApiPropertyOptional({ example: 'Chủ nhà trọ (Quản trị)', nullable: true })
  editedByName: string | null;

  @ApiPropertyOptional({
    example: '2026-09-12T06:30:00.000Z',
    nullable: true,
  })
  updatedAt: string | null;
}

export class AttendanceSummaryDto {
  @ApiProperty({ example: 40 })
  totalShifts: number;

  @ApiProperty({ example: 32 })
  onTimeCount: number;

  @ApiProperty({ example: 3 })
  lateCount: number;

  @ApiProperty({ example: 1 })
  absentCount: number;

  @ApiProperty({ example: 4 })
  notYetCount: number;

  @ApiProperty({
    description: 'Attendance rate percentage ((onTime + late) / (total - notYet) * 100)',
    example: 97.2,
  })
  attendanceRate: number;
}

export class AttendanceListResponseDto {
  @ApiProperty({ type: [AttendanceRecordDto] })
  data: AttendanceRecordDto[];

  @ApiProperty({ type: AttendanceSummaryDto })
  summary: AttendanceSummaryDto;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 40 })
  total: number;

  @ApiProperty({ example: 4 })
  totalPages: number;
}
