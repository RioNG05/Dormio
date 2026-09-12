import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePositionDto {
  @ApiPropertyOptional({
    description: 'Updated job position name',
    example: 'Trưởng ban Quản lý tòa nhà',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Free-text duty description / responsibilities list shown to staff in UC-S-01',
    example: 'Quản lý vận hành toàn diện, kiểm tra an ninh, tiếp nhận phản ánh người thuê',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
