import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsUUID, IsNotEmpty, IsNumber, Min, IsOptional, IsString, Matches } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for UC-L-10: Manual Deposit Entry
 * Used when a landlord records a room reservation / hold deposit directly.
 */
export class CreateManualDepositDto {
  @ApiProperty({
    description: 'Target room UUID to be deposited',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'Room ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Room ID is required' })
  roomId: string

  @ApiProperty({
    description: 'Deposit amount in VND',
    example: 1000000,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Deposit amount must be a valid number' })
  @Min(1, { message: 'Deposit amount must be greater than 0' })
  amount: number

  @ApiPropertyOptional({
    description: 'Full name of the prospective tenant holding the room',
    example: 'Tran Thi Mai',
  })
  @IsOptional()
  @IsString({ message: 'Tenant name must be a string' })
  tenantName?: string

  @ApiPropertyOptional({
    description: 'Vietnamese phone number of the prospective tenant (10 digits starting with 0)',
    example: '0977234567',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(0[3|5|7|8|9])[0-9]{8}$/, {
    message: 'Phone number must be a valid Vietnamese mobile number (10 digits)',
  })
  tenantPhone?: string

  @ApiPropertyOptional({
    description: 'Holding expiry date / deadline to finalize contract (YYYY-MM-DD or ISO string)',
    example: '2026-09-25',
  })
  @IsOptional()
  @IsString()
  expiryDate?: string

  @ApiPropertyOptional({
    description: 'Landlord note or remarks about the deposit',
    example: 'Holding deposit, contract to be signed within 7 days',
  })
  @IsOptional()
  @IsString()
  note?: string
}
