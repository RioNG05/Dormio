import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for updating contract details (rent price, deposit, payment date, end date, reason)
 */
export class UpdateContractDto {
  @ApiPropertyOptional({
    description: 'Updated monthly rent price in VND (DECIMAL(12,2))',
    example: 3800000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rentPrice?: number

  @ApiPropertyOptional({
    description: 'Updated deposit amount in VND (DECIMAL(12,2))',
    example: 3800000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositAmount?: number

  @ApiPropertyOptional({
    description: 'Day of the month when rent is due (1 to 31)',
    example: 5,
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  monthlyPaymentDate?: number

  @ApiPropertyOptional({
    description: 'Updated contract end date (ISO 8601 string)',
    example: '2027-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiPropertyOptional({
    description: 'Optional contract notes or terms',
    example: 'Adjusted rent due to annual pricing update.',
  })
  @IsOptional()
  @IsString()
  note?: string

  @ApiProperty({
    description: 'Reason for the contract update (required for audit logging and history)',
    example: 'Điều chỉnh giá thuê và tiền cọc theo thỏa thuận',
  })
  @IsNotEmpty()
  @IsString()
  reason: string
}

