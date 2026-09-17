import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma';

export class StaffDutyDto {
  @ApiProperty({ example: 'sec-1' })
  id: string;

  @ApiProperty({ example: 'Kiểm soát an ninh cổng chính' })
  title: string;

  @ApiProperty({ example: true })
  requiresPhoto: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg', nullable: true })
  photoProof?: string;

  @ApiPropertyOptional({ example: '06:55:00 - 17/09/2026', nullable: true })
  photoProofTime?: string;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiPropertyOptional({ example: '07:15', nullable: true })
  completedAt?: string;

  @ApiPropertyOptional({ example: 'Đã kiểm tra 45 xe máy', nullable: true })
  note?: string;
}

export class StaffShiftDto {
  @ApiProperty({ example: 'shift-morning-uuid' })
  id: string;

  @ApiProperty({ example: 'Ca Sáng' })
  name: string;

  @ApiProperty({ example: '07:00' })
  startTime: string;

  @ApiProperty({ example: '15:00' })
  endTime: string;

  @ApiProperty({ example: 8 })
  durationHours: number;
}

export class StaffPositionDto {
  @ApiProperty({ example: 'pos-1-uuid' })
  id: string;

  @ApiProperty({ example: 'Quản lý toà nhà & Bảo vệ' })
  name: string;

  @ApiPropertyOptional({ example: 'Chịu trách nhiệm an ninh', nullable: true })
  description?: string | null;
}

export class StaffCoWorkerDto {
  @ApiProperty({ example: 'cw-1-uuid' })
  id: string;

  @ApiProperty({ example: 'Nguyễn Thị Mai' })
  name: string;

  @ApiProperty({ example: '0905566778' })
  phone: string;

  @ApiProperty({ example: 'Nhân viên tạp vụ' })
  positionName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatar?: string | null;
}

export class StaffWorkScheduleDto {
  @ApiProperty({ example: 'schedule-uuid' })
  id: string;

  @ApiProperty({ example: '2026-09-17' })
  workDate: string;

  @ApiProperty({ example: 'house-uuid' })
  boardingHouseId: string;

  @ApiProperty({ example: 'Dormio Premier Quận 1' })
  boardingHouseName: string;

  @ApiProperty({ example: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM' })
  boardingHouseAddress: string;

  @ApiProperty({ type: StaffShiftDto })
  shift: StaffShiftDto;

  @ApiProperty({ type: StaffPositionDto })
  position: StaffPositionDto;

  @ApiProperty({ example: 'scheduled' })
  status: string;

  @ApiProperty({ example: true })
  isRecurring: boolean;

  @ApiProperty({ type: [StaffCoWorkerDto] })
  coWorkers: StaffCoWorkerDto[];

  @ApiProperty({ type: [StaffDutyDto] })
  duties: StaffDutyDto[];
}

export class StaffAttendanceRecordDto {
  @ApiProperty({ example: 'att-uuid' })
  id: string;

  @ApiProperty({ example: 'schedule-uuid' })
  workScheduleId: string;

  @ApiProperty({ example: '2026-09-17' })
  workDate: string;

  @ApiProperty({ example: 'Dormio Premier Quận 1' })
  boardingHouseName: string;

  @ApiProperty({ example: 'Ca Sáng' })
  shiftName: string;

  @ApiProperty({ example: '07:00 - 15:00' })
  shiftTime: string;

  @ApiPropertyOptional({ example: '06:55', nullable: true })
  checkIn: string | null;

  @ApiPropertyOptional({ example: '15:05', nullable: true })
  checkOut: string | null;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.on_time })
  status: AttendanceStatus;

  @ApiProperty({ example: 8 })
  totalHours: number;

  @ApiProperty({ example: false })
  editedByLandlord: boolean;

  @ApiPropertyOptional({ example: 'Check-in đúng giờ', nullable: true })
  note?: string;

  @ApiPropertyOptional({ example: 'data:image/jpeg;base64,...', nullable: true })
  checkInPhoto?: string;

  @ApiPropertyOptional({ nullable: true })
  checkInWatermark?: any;

  @ApiPropertyOptional({ example: 'Kẹt xe', nullable: true })
  checkInExplanation?: string;

  @ApiPropertyOptional({ example: 'data:image/jpeg;base64,...', nullable: true })
  checkOutPhoto?: string;

  @ApiPropertyOptional({ nullable: true })
  checkOutWatermark?: any;

  @ApiPropertyOptional({ example: 'Về sớm 15 phút', nullable: true })
  checkOutExplanation?: string;

  @ApiPropertyOptional({ example: false })
  isEarlyCheckOut?: boolean;
}

export class StaffTodayOverviewResponseDto {
  @ApiProperty({ example: 'emp-uuid' })
  employeeId: string;

  @ApiProperty({ example: 'Phạm Văn Bảo' })
  staffName: string;

  @ApiProperty({ example: '0901122334' })
  staffPhone: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', nullable: true })
  staffAvatar?: string | null;

  @ApiProperty({ type: StaffWorkScheduleDto })
  schedule: StaffWorkScheduleDto;

  @ApiProperty({ type: StaffAttendanceRecordDto })
  attendance: StaffAttendanceRecordDto;
}

