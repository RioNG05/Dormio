import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
} from 'class-validator';

/**
 * DTO for UC-PU-04: Platform Deposit by a public user (tenant-side).
 * Called from BHRP room detail page when the user confirms payment via VietQR.
 * No authentication required — identity captured via tenantName + tenantPhone.
 */
export class CreatePlatformDepositDto {
  @ApiProperty({
    description: 'Full name of the prospective tenant',
    example: 'Nguyen Van A',
  })
  @IsString({ message: 'Tenant name must be a string' })
  @IsNotEmpty({ message: 'Tenant name must not be empty' })
  tenantName: string;

  @ApiProperty({
    description: 'Vietnamese mobile phone number of the prospective tenant (10 digits starting with 03/05/07/08/09)',
    example: '0912345678',
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number must not be empty' })
  @Matches(/^(03|05|07|08|09)[0-9]{8}$/, {
    message: 'Phone number must be a valid Vietnamese mobile number (10 digits starting with 03/05/07/08/09)',
  })
  tenantPhone: string;

  @ApiPropertyOptional({
    description: 'Optional note from the prospective tenant',
    example: 'I will move in next month',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
