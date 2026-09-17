import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StaffShiftDto {
  @ApiProperty({ example: 'shift-uuid-1' })
  id: string;

  @ApiProperty({ example: 'Ca Sáng (07:00 - 15:00)' })
  name: string;

  @ApiProperty({ example: '07:00' })
  startTime: string;

  @ApiProperty({ example: '15:00' })
  endTime: string;
}

export class StaffPositionDto {
  @ApiProperty({ example: 'position-uuid-1' })
  id: string;

  @ApiProperty({ example: 'Bảo vệ & Vận hành sảnh' })
  name: string;

  @ApiPropertyOptional({
    example: 'Tuần tra an ninh\nKiểm soát xe ra vào\nĐóng cổng 23:00',
    nullable: true,
  })
  description?: string | null;
}

export class StaffCoWorkerDto {
  @ApiProperty({ example: 'emp-uuid-2' })
  id: string;

  @ApiProperty({ example: 'Nguyễn Văn Bình' })
  name: string;

  @ApiProperty({ example: '0912345678' })
  phone: string;

  @ApiProperty({ example: 'Bảo vệ ca sáng' })
  positionName: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  avatar?: string | null;
}

export class StaffDutyItemDto {
  @ApiProperty({ example: 'duty-1' })
  id: string;

  @ApiProperty({ example: 'Kiểm tra chốt an ninh cổng chính và quản lý xe ra vào' })
  title: string;

  @ApiProperty({ example: true })
  requiresPhoto: boolean;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiPropertyOptional({ example: '07:30 - 2026-09-17', nullable: true })
  completedAt?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  photoProof?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  photoProofTime?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  note?: string | null;
}

export class StaffAdditionalTaskDto {
  @ApiProperty({ example: 'task-1' })
  id: string;

  @ApiProperty({ example: 'Kiểm tra bình cứu hỏa tầng 2' })
  title: string;

  @ApiPropertyOptional({ example: 'Ghi nhận áp suất và tem kiểm định', nullable: true })
  description?: string | null;

  @ApiProperty({ example: '2026-09-17 10:00' })
  deadline: string;

  @ApiPropertyOptional({ example: true })
  isCustomTask?: boolean;
}

export class StaffScheduleItemResponseDto {
  @ApiProperty({ example: 'schedule-uuid-1' })
  id: string;

  @ApiProperty({ example: '2026-09-17' })
  workDate: string;

  @ApiProperty({ example: 'house-uuid-1' })
  boardingHouseId: string;

  @ApiProperty({ example: 'KTX HOLA (Khu A)' })
  boardingHouseName: string;

  @ApiProperty({ type: StaffShiftDto })
  shift: StaffShiftDto;

  @ApiProperty({ type: StaffPositionDto })
  position: StaffPositionDto;

  @ApiProperty({ example: true })
  isRecurring: boolean;

  @ApiProperty({ example: 'scheduled' })
  status: string;

  @ApiProperty({ type: [StaffCoWorkerDto] })
  coWorkers: StaffCoWorkerDto[];

  @ApiProperty({ type: [StaffDutyItemDto] })
  duties: StaffDutyItemDto[];

  @ApiProperty({ type: [StaffAdditionalTaskDto] })
  additionalTasks: StaffAdditionalTaskDto[];
}

