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
  Matches,
  IsEnum,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '@prisma';

/**
 * Tenant Identification Details DTO (CCCD/CMND)
 */
export class TenantIdentificationDto {
  @ApiProperty({
    description: 'National citizen identification number (CCCD/CMND)',
    example: '001201012345',
  })
  @IsString()
  @IsNotEmpty()
  identityNumber: string;

  @ApiProperty({
    description: 'Full legal name on citizen ID',
    example: 'Nguyễn Văn An',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601 string)',
    example: '1998-05-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    example: Gender.male,
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiPropertyOptional({
    description: 'Nationality (default: Việt Nam)',
    example: 'Việt Nam',
    default: 'Việt Nam',
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Place of origin (quê quán)',
    example: { province: 'Hà Nội', district: 'Đan Phượng' },
  })
  @IsOptional()
  placeOfOrigin?: any;

  @ApiPropertyOptional({
    description: 'Place of residence (hộ khẩu thường trú)',
    example: { address: 'Số 12 ngõ 45 Cầu Giấy, Hà Nội' },
  })
  @IsOptional()
  placeOfResidence?: any;

  @ApiPropertyOptional({
    description: 'Issue date of citizen ID',
    example: '2021-06-10T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Expiry date of citizen ID',
    example: '2038-05-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Optional identification note or characteristics',
    example: 'Nốt ruồi cách 1cm dưới mép phải',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Front image URL or S3 storage key of citizen ID',
    example: 'identifications/tenant-1/front.jpg',
  })
  @IsOptional()
  @IsString()
  cardFrontUrl?: string;

  @ApiPropertyOptional({
    description: 'Back image URL or S3 storage key of citizen ID',
    example: 'identifications/tenant-1/back.jpg',
  })
  @IsOptional()
  @IsString()
  cardBackUrl?: string;
}

/**
 * DTO for creating a contract directly (Flow B - landlord adds tenant directly)
 */
export class CreateContractDirectDto {
  @ApiProperty({
    description: 'Target room UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({
    description: 'Tenant Vietnamese phone number (10 digits starting with 0)',
    example: '0987654321',
  })
  @IsString()
  @Matches(/^0[0-9]{9}$/, {
    message: 'tenantPhoneNumber must be a valid 10-digit Vietnamese phone number starting with 0',
  })
  @IsNotEmpty()
  tenantPhoneNumber: string;

  @ApiProperty({
    description: 'Tenant full name',
    example: 'Nguyễn Văn An',
  })
  @IsString()
  @IsNotEmpty()
  tenantFullName: string;

  @ApiPropertyOptional({
    description: 'Tenant email address',
    example: 'nguyenvanan@example.com',
  })
  @IsOptional()
  @IsEmail()
  tenantEmail?: string;

  @ApiPropertyOptional({
    description:
      'Tenant citizen ID information. Required if user does not already have identification registered.',
    type: TenantIdentificationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TenantIdentificationDto)
  identification?: TenantIdentificationDto;

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
    example: 4000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  rentPrice: number;

  @ApiProperty({
    description: 'Deposit amount recorded manually in VND (>= 0)',
    example: 4000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  depositAmount: number;

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
    example: 'Hợp đồng thuê 1 năm, đóng tiền ngày 5 hàng tháng.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
