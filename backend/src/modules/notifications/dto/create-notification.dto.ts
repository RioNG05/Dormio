import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Target user ID (null for broadcast)' })
  @IsOptional()
  @IsUUID()
  receiverId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Associated boarding house context' })
  @IsOptional()
  @IsUUID()
  boardingHouseId?: string;

  @ApiPropertyOptional({ example: 'Đến hạn thanh toán tiền trọ', description: 'Notification title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Hóa đơn tiền phòng tháng 09/2026 đã đến hạn thanh toán.', description: 'Body text' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: 'rental_payment',
    description: 'Notification type (rental_payment, contract_created, meter_reading, grievance, happy_new_year, broadcast)',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ example: '/tenant/invoices', description: 'Direct navigation link' })
  @IsOptional()
  @IsString()
  targetUrl?: string;
}
