import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RefundDepositDto {
  @ApiPropertyOptional({
    description: 'Amount deducted from deposit before refunding in VND (0 if 100% refund)',
    example: 500000,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deductedAmount?: number = 0;

  @ApiPropertyOptional({
    description: 'Reason for deducting part or all of deposit',
    example: 'Khấu trừ tiền vệ sinh và hư hỏng thiết bị',
  })
  @IsOptional()
  @IsString()
  deductionReason?: string;

  @ApiPropertyOptional({
    description: 'Additional note on refund',
    example: 'Đã chuyển khoản hoàn cọc cho khách',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
