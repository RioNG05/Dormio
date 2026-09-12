import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({
    description: 'Job position name (e.g., Quản lý tòa nhà, Bảo vệ, Vệ sinh)',
    example: 'Bảo vệ ca ngày',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Free-text duty description (e.g., trực cổng, kiểm tra thẻ xe, tuần tra ban đêm)',
    example: 'Trực cổng chính, ghi sổ khách ra vào, tuần tra khuôn viên.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
