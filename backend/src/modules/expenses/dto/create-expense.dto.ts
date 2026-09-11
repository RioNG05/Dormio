import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
  IsIn,
  IsISO8601,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Expense item name or title',
    example: 'Bảo trì thang máy định kỳ',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Expense category',
    example: 'Bảo trì & Sửa chữa',
    enum: [
      'Bảo trì & Sửa chữa',
      'Điện nước & Dịch vụ',
      'Vệ sinh & An ninh',
      'Trang thiết bị',
      'Chi phí khác',
    ],
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Expense amount in VND',
    example: 1500000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Date when the expense was paid or scheduled to be paid (ISO string)',
    example: '2026-08-15T00:00:00.000Z',
  })
  @IsISO8601()
  paidAt: string;

  @ApiPropertyOptional({
    description: 'Payment status of the expense',
    enum: ['pending', 'paid', 'canceled'],
    default: 'paid',
  })
  @IsOptional()
  @IsIn(['pending', 'paid', 'canceled'])
  status?: 'pending' | 'paid' | 'canceled' = 'paid';

  @ApiPropertyOptional({
    description: 'Room UUID if expense is tied to a specific room, or null for property-wide',
    example: 'ce81baea-5efc-4e89-9cb1-ef0db32e011b',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4')
  roomId?: string;

  @ApiPropertyOptional({
    description: 'Detailed description or notes about the expense',
    example: 'Bảo dưỡng hệ thống cáp và phanh khẩn cấp thang máy.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
