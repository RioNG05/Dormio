import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class ManualPaymentDto {
  @ApiPropertyOptional({
    description: 'Payment method used',
    enum: ['banking', 'cash'],
    default: 'cash',
    example: 'cash',
  })
  @IsOptional()
  @IsIn(['banking', 'cash'])
  method?: 'banking' | 'cash' = 'cash';

  @ApiPropertyOptional({
    description: 'Landlord transaction memo or note',
    example: 'Khách thanh toán tiền mặt trực tiếp tại quầy',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'External bank transaction reference or receipt code',
    example: 'FT260819823491',
  })
  @IsOptional()
  @IsString()
  transactionRef?: string;
}
