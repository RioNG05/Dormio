import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class BroadcastAnnouncementDto {
  @ApiProperty({
    description: 'Title of the broadcast announcement',
    example: 'Thông báo cúp điện bảo trì lưới điện',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Detailed content of the announcement',
    example: 'Kính gửi quý khách thuê phòng, hệ thống điện lưới sẽ tạm ngắt để bảo trì từ 8h00 - 11h00 ngày mai.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Category tag of the announcement',
    example: 'Điện nước',
    default: 'Nội quy',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Target scope of the announcement (e.g., all building or specific floor/room)',
    example: 'Toàn bộ tòa nhà',
    default: 'Toàn bộ tòa nhà',
  })
  @IsOptional()
  @IsString()
  targetScope?: string;

  @ApiPropertyOptional({
    description: 'Primary delivery channel for the announcement',
    example: 'Thông báo hệ thống',
    default: 'Thông báo hệ thống',
  })
  @IsOptional()
  @IsString()
  channel?: string;
}
