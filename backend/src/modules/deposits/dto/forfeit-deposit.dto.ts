import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ForfeitDepositDto {
  @ApiProperty({
    description: 'Reason for forfeiting the deposit (100% deduction)',
    example: 'Tenant did not check in or sign contract within the agreed deadline',
  })
  @IsString({ message: 'Deduction reason must be a string' })
  @IsNotEmpty({ message: 'Deduction reason is required' })
  deductionReason: string

  @ApiPropertyOptional({
    description: 'Additional note on forfeiture',
    example: 'Tenant forfeited deposit after 10 days',
  })
  @IsOptional()
  @IsString()
  note?: string
}
