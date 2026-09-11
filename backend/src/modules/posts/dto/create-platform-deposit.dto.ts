import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsUUID,
} from 'class-validator';

/**
 * DTO for UC-PU-04 Step 2: Initiate Direct Online Deposit on a Post.
 */
export class InitiatePlatformDepositDto {
  @ApiPropertyOptional({
    description: 'Deposit amount (defaults to Post.depositAmount)',
    example: 3500000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Deposit amount must be a number' })
  @Min(0, { message: 'Deposit amount must not be negative' })
  amount?: number;

  @ApiPropertyOptional({
    description: 'Optional note from the prospective tenant',
    example: 'Tôi dự kiến chuyển vào đầu tháng sau',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Tenant name (optional override)',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiPropertyOptional({
    description: 'Tenant mobile phone number (optional override)',
    example: '0912345678',
  })
  @IsOptional()
  @IsString()
  tenantPhone?: string;
}

/**
 * Legacy alias for backwards compatibility
 */
export class CreatePlatformDepositDto extends InitiatePlatformDepositDto {}

/**
 * DTO for UC-PU-04 Step 5: Gateway callback / Confirm Deposit Payment
 */
export class ConfirmPlatformDepositDto {
  @ApiProperty({
    description: 'UUID of the pending deposit record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'depositId must be a valid UUID' })
  @IsNotEmpty({ message: 'depositId is required' })
  depositId: string;

  @ApiPropertyOptional({
    description: 'Transaction reference code from banking gateway or VietQR',
    example: 'TXN-DEP-1726053892-123',
  })
  @IsOptional()
  @IsString()
  transactionRef?: string;
}

/**
 * Response DTO for initiated deposit with VietQR payment instructions
 */
export class PlatformDepositInstructionDto {
  @ApiProperty()
  depositId: string;

  @ApiProperty()
  paymentId: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  roomId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  transactionRef: string;

  @ApiProperty()
  qrCodeUrl: string;

  @ApiProperty()
  bankCode: string;

  @ApiProperty()
  accountNumber: string;

  @ApiProperty()
  accountName: string;

  @ApiProperty()
  transferContent: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  message: string;
}
