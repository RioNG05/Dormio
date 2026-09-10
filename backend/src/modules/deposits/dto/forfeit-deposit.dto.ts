import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ForfeitDepositDto {
  @ApiProperty({
    description: 'Reason for forfeiting the deposit (100% deduction)',
    example: 'Khách không đến nhận phòng và không ký hợp đồng đúng thời hạn cam kết',
  })
  @IsString({ message: 'Lý do khấu trừ/tịch thu cọc phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Lý do khấu trừ/tịch thu cọc không được để trống' })
  deductionReason: string;

  @ApiPropertyOptional({
    description: 'Additional note on forfeiture',
    example: 'Khách bỏ cọc sau 10 ngày',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
