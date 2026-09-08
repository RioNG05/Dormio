import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class UpdateLandlordMeterReadingDto {
  @ApiProperty({
    description: 'Updated numerical reading value',
    example: 1535,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  readingValue: number;

  @ApiPropertyOptional({
    description: 'Optional updated photo URL',
    example: 'https://res.cloudinary.com/dormio/image/upload/v1234/corrected_dial.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Reason for manual correction (audit log)',
    example: 'Ghi nhầm chỉ số công tơ do chụp ảnh mờ, chủ trọ đính chính lại',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
