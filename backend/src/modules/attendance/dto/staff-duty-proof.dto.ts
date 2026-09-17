import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class StaffDutyProofDto {
  @ApiProperty({
    description: 'ID of the work schedule',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsNotEmpty()
  @IsUUID()
  workScheduleId: string;

  @ApiProperty({
    description: 'Unique identifier of the duty task',
    example: 'sec-1',
  })
  @IsNotEmpty()
  @IsString()
  dutyId: string;

  @ApiPropertyOptional({
    description: 'Data URL or image URL of the photo proof',
    example: 'data:image/jpeg;base64,...',
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({
    description: 'Progress or handover note for the duty',
    example: 'Đã kiểm tra an ninh cổng chính, 45 xe máy sắp xếp gọn gàng.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Whether to mark the duty task as completed',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  markCompleted?: boolean;
}

