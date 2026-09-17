import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AttendanceWatermarkDto } from './staff-check-in.dto';

export class StaffCheckOutDto {
  @ApiProperty({
    description: 'ID of the work schedule to check out from',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsNotEmpty()
  @IsUUID()
  workScheduleId: string;

  @ApiPropertyOptional({
    description: 'Data URL or uploaded image URL of the verification photo',
    example: 'data:image/jpeg;base64,...',
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({
    description: 'Watermark metadata embedded in the verification photo',
    type: AttendanceWatermarkDto,
  })
  @IsOptional()
  watermark?: AttendanceWatermarkDto;

  @ApiPropertyOptional({
    description: 'Optional explanation if checking out early',
    example: 'Đã bàn giao ca sớm 30 phút cho đồng nghiệp có việc khẩn',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Simulated or captured time in HH:mm format',
    example: '15:05',
  })
  @IsOptional()
  @IsString()
  capturedTime?: string;
}

