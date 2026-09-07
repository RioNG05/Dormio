import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * DTO for creating a contract from a paid platform deposit (Flow A)
 */
export class CreateContractPlatformDto {
  @ApiProperty({
    description: 'Target room UUID (must have a paid unconverted platform deposit)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({
    description: 'Contract start date (ISO 8601 string)',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Contract end date (ISO 8601 string)',
    example: '2027-10-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: 'Monthly rent price in VND (DECIMAL(12,2))',
    example: 3500000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  rentPrice: number;

  @ApiProperty({
    description: 'Day of the month when rent is due (1 to 31)',
    example: 5,
    minimum: 1,
    maximum: 31,
  })
  @IsNumber()
  @Min(1)
  @Max(31)
  monthlyPaymentDate: number;

  @ApiPropertyOptional({
    description: 'Billing cycle interval in months (e.g. 1, 3, 6, 12). Default is 1.',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rentPaymentCycle?: number;

  @ApiPropertyOptional({
    description: 'Additional notes or contract terms',
    example: 'Khách thuê từ nền tảng Dormio đã đặt cọc phòng.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
