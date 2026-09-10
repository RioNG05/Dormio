import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for UC-L-10: Manual Deposit Entry
 * Used when a landlord records a room reservation / hold deposit directly.
 */
export class CreateManualDepositDto {
  @ApiProperty({
    description: 'Target room UUID to be deposited',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'Mã phòng phải là định dạng UUID hợp lệ' })
  @IsNotEmpty({ message: 'Mã phòng không được để trống' })
  roomId: string;

  @ApiProperty({
    description: 'Deposit amount in VND',
    example: 1000000,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tiền cọc phải là số hợp lệ' })
  @Min(1, { message: 'Tiền cọc phải lớn hơn 0' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Full name of the prospective tenant holding the room',
    example: 'Trần Thị Mai',
  })
  @IsOptional()
  @IsString({ message: 'Tên người đặt cọc phải là chuỗi ký tự' })
  tenantName?: string;

  @ApiPropertyOptional({
    description: 'Vietnamese phone number of the prospective tenant (10 digits starting with 0)',
    example: '0977234567',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(0[3|5|7|8|9])[0-9]{8}$/, {
    message: 'Số điện thoại phải là số di động Việt Nam hợp lệ (10 chữ số)',
  })
  tenantPhone?: string;

  @ApiPropertyOptional({
    description: 'Holding expiry date / deadline to finalize contract (YYYY-MM-DD or ISO string)',
    example: '2026-09-25',
  })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Landlord note or remarks about the deposit',
    example: 'Cọc giữ chỗ hẹn chốt hợp đồng sau 7 ngày',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
