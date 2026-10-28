import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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
  IsArray,
} from 'class-validator'
import { Type } from 'class-transformer'
import { Gender } from '@prisma'

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
  identityNumber: string

  @ApiProperty({
    description: 'Full legal name on citizen ID',
    example: 'Nguyen Van An',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string

  @ApiProperty({
    description: 'Date of birth (ISO 8601 string)',
    example: '1998-05-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    example: Gender.male,
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender

  @ApiPropertyOptional({
    description: 'Nationality (default: Vietnam)',
    example: 'Vietnam',
    default: 'Vietnam',
  })
  @IsOptional()
  @IsString()
  nationality?: string

  @ApiPropertyOptional({
    description: 'Place of origin (native place)',
    example: { province: 'Hanoi', district: 'Dan Phuong' },
  })
  @IsOptional()
  placeOfOrigin?: any

  @ApiPropertyOptional({
    description: 'Place of residence (permanent residence)',
    example: { address: '12 Lane 45 Cau Giay, Hanoi' },
  })
  @IsOptional()
  placeOfResidence?: any

  @ApiPropertyOptional({
    description: 'Issue date of citizen ID',
    example: '2021-06-10T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string

  @ApiPropertyOptional({
    description: 'Expiry date of citizen ID',
    example: '2038-05-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string

  @ApiPropertyOptional({
    description: 'Optional identification note or characteristics',
    example: 'Birthmark 1cm below right lip',
  })
  @IsOptional()
  @IsString()
  note?: string

  @ApiPropertyOptional({
    description: 'Front image URL or S3 storage key of citizen ID',
    example: 'identifications/tenant-1/front.jpg',
  })
  @IsOptional()
  @IsString()
  cardFrontUrl?: string

  @ApiPropertyOptional({
    description: 'Back image URL or S3 storage key of citizen ID',
    example: 'identifications/tenant-1/back.jpg',
  })
  @IsOptional()
  @IsString()
  cardBackUrl?: string
}

/**
 * DTO for creating a contract directly (Flow B - landlord adds tenant directly)
 */

/**
 * Initial Utility Meter Reading at Handover DTO
 */
export class InitialMeterReadingDto {
  @ApiProperty({
    description: 'UUID of the metered Service (Electricity, Water)',
    example: 'd9b2d63d-a233-4123-847e-2972986422b4',
  })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string

  @ApiProperty({
    description: 'Initial reading value at room handover',
    example: 1450,
  })
  @IsNumber()
  @Min(0)
  readingValue: number

  @ApiPropertyOptional({
    description: 'Optional handover proof photo (Base64 data URI or remote URL)',
    example: 'https://res.cloudinary.com/.../meter.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string
}

export class CreateContractDirectDto {
  @ApiProperty({
    description: 'Target room UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  roomId: string

  @ApiPropertyOptional({
    description: 'Tenant user UUID (must be an active occupant in target room)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4')
  tenantId?: string

  @ApiProperty({
    description: 'Tenant Vietnamese phone number (10 digits starting with 0)',
    example: '0987654321',
  })
  @IsString()
  @Matches(/^0[0-9]{9}$/, {
    message: 'tenantPhoneNumber must be a valid 10-digit Vietnamese phone number starting with 0',
  })
  @IsNotEmpty()
  tenantPhoneNumber: string

  @ApiProperty({
    description: 'Tenant full name',
    example: 'Nguyen Van An',
  })
  @IsString()
  @IsNotEmpty()
  tenantFullName: string

  @ApiPropertyOptional({
    description: 'Tenant email address',
    example: 'nguyenvanan@example.com',
  })
  @IsOptional()
  @IsEmail()
  tenantEmail?: string

  @ApiPropertyOptional({
    description:
      'Tenant citizen ID information. Required if user does not already have identification registered.',
    type: TenantIdentificationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TenantIdentificationDto)
  identification?: TenantIdentificationDto

  @ApiProperty({
    description: 'Contract start date (ISO 8601 string)',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string

  @ApiProperty({
    description: 'Contract end date (ISO 8601 string)',
    example: '2027-10-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string

  @ApiProperty({
    description: 'Monthly rent price in VND (DECIMAL(12,2))',
    example: 4000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  rentPrice: number

  @ApiProperty({
    description: 'Deposit amount recorded manually in VND (>= 0)',
    example: 4000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  depositAmount: number

  @ApiProperty({
    description: 'Day of the month when rent is due (1 to 31)',
    example: 5,
    minimum: 1,
    maximum: 31,
  })
  @IsNumber()
  @Min(1)
  @Max(31)
  monthlyPaymentDate: number

  @ApiPropertyOptional({
    description: 'Billing cycle interval in months (e.g. 1, 3, 6, 12). Default is 1.',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rentPaymentCycle?: number

  @ApiPropertyOptional({
    description: 'Additional notes or contract terms',
    example: '1-year lease contract, rent due on the 5th of each month.',
  })
  @IsOptional()
  @IsString()
  note?: string

  @ApiPropertyOptional({
    description: 'Initial utility meter readings recorded at room handover',
    type: [InitialMeterReadingDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InitialMeterReadingDto)
  initialMeterReadings?: InitialMeterReadingDto[]
}
