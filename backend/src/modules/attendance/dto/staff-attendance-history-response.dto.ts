import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StaffAttendanceWatermarkDto {
  @ApiProperty({ example: '06:58:30 - 17/09/2026' })
  time: string;

  @ApiProperty({ example: 'KTX HOLA (Khu A)' })
  place: string;

  @ApiProperty({ example: 'Nguyễn Văn Bảo' })
  staffName: string;

  @ApiPropertyOptional({ example: '21.0132° N, 105.5273° E', nullable: true })
  coordinates?: string | null;
}

export class StaffAttendanceHistoryItemDto {
  @ApiProperty({ example: 'att-uuid-1' })
  id: string;

  @ApiProperty({ example: 'schedule-uuid-1' })
  workScheduleId: string;

  @ApiProperty({ example: '2026-09-17' })
  workDate: string;

  @ApiProperty({ example: 'KTX HOLA (Khu A)' })
  boardingHouseName: string;

  @ApiProperty({ example: 'Ca Sáng' })
  shiftName: string;

  @ApiProperty({ example: '07:00 - 15:00' })
  shiftTime: string;

  @ApiPropertyOptional({ example: '06:58', nullable: true })
  checkIn: string | null;

  @ApiPropertyOptional({ example: '15:02', nullable: true })
  checkOut: string | null;

  @ApiProperty({ example: 'on_time', enum: ['on_time', 'late', 'absent', 'not_yet'] })
  status: string;

  @ApiProperty({ example: 8.0 })
  totalHours: number;

  @ApiProperty({ example: false })
  editedByLandlord: boolean;

  @ApiPropertyOptional({ example: null, nullable: true })
  note?: string | null;

  @ApiPropertyOptional({ example: 'https://images.example.com/checkin.jpg', nullable: true })
  checkInPhoto?: string | null;

  @ApiPropertyOptional({ type: StaffAttendanceWatermarkDto, nullable: true })
  checkInWatermark?: StaffAttendanceWatermarkDto | null;

  @ApiPropertyOptional({ example: 'Tắc đường do mưa ngập', nullable: true })
  checkInExplanation?: string | null;

  @ApiPropertyOptional({ example: 'https://images.example.com/checkout.jpg', nullable: true })
  checkOutPhoto?: string | null;

  @ApiPropertyOptional({ type: StaffAttendanceWatermarkDto, nullable: true })
  checkOutWatermark?: StaffAttendanceWatermarkDto | null;

  @ApiPropertyOptional({ example: 'Bàn giao ca cho anh Hùng', nullable: true })
  checkOutExplanation?: string | null;

  @ApiPropertyOptional({ example: false })
  isEarlyCheckOut?: boolean;
}

export class StaffAttendanceHistoryMetricsDto {
  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 21 })
  onTime: number;

  @ApiProperty({ example: 2 })
  late: number;

  @ApiProperty({ example: 1 })
  absent: number;

  @ApiProperty({ example: '184.5' })
  hours: string;
}

export class StaffAttendanceHistoryResponseDto {
  @ApiProperty({ type: [StaffAttendanceHistoryItemDto] })
  data: StaffAttendanceHistoryItemDto[];

  @ApiProperty({ type: StaffAttendanceHistoryMetricsDto })
  summary: StaffAttendanceHistoryMetricsDto;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
