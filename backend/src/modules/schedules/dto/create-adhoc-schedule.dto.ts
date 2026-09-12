import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAdhocScheduleDto {
  @ApiProperty({
    description: 'Employee UUID',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID('4', { message: 'ID nhân viên không hợp lệ' })
  @IsNotEmpty({ message: 'Cần chọn nhân viên' })
  employeeId: string;

  @ApiProperty({
    description: 'Shift UUID',
    example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  })
  @IsUUID('4', { message: 'ID ca làm việc không hợp lệ' })
  @IsNotEmpty({ message: 'Cần chọn ca làm việc' })
  shiftId: string;

  @ApiProperty({
    description: 'Work date (YYYY-MM-DD)',
    example: '2026-09-16',
  })
  @IsDateString({}, { message: 'Ngày làm việc không hợp lệ (YYYY-MM-DD)' })
  workDate: string;

  @ApiPropertyOptional({
    description: 'Optional note or specific duty for this shift',
    example: 'Tăng cường dọn dẹp vệ sinh sau khi sơn sửa phòng 302',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
