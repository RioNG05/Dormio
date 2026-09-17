import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AttendanceWatermarkDto {
  @ApiProperty({ example: '2026-09-17 06:55:00' })
  @IsString()
  time: string;

  @ApiProperty({ example: '123 Nguyễn Huệ, Quận 1, TP.HCM' })
  @IsString()
  place: string;

  @ApiProperty({ example: 'Phạm Văn Bảo (NV01)' })
  @IsString()
  staffName: string;

  @ApiPropertyOptional({ example: '10.7769° N, 106.7009° E' })
  @IsOptional()
  @IsString()
  coordinates?: string;
}

export class StaffCheckInDto {
  @ApiProperty({
    description: 'ID of the work schedule to check into',
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
    description: 'Optional explanation if checking in late',
    example: 'Kẹt xe nghiêm trọng trên đường đến ca trực',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Simulated or captured time in HH:mm format',
    example: '06:55',
  })
  @IsOptional()
  @IsString()
  capturedTime?: string;
}

