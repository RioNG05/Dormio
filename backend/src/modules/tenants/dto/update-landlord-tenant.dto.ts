import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsEmail, IsEnum, Matches } from 'class-validator'
import { Gender } from '@prisma'

export class UpdateLandlordTenantDto {
  @ApiPropertyOptional({
    description: 'Full name as printed on ID card',
    example: 'NGUYEN VAN A',
  })
  @IsOptional()
  @IsString()
  fullName?: string

  @ApiPropertyOptional({
    description: 'Vietnamese Citizen ID (CCCD) number - exactly 12 digits',
    example: '001202012345',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{12}$/, {
    message: 'Identity number (CCCD) must contain exactly 12 digits',
  })
  identityNumber?: string

  @ApiPropertyOptional({
    description: 'Date of birth (ISO 8601 or YYYY-MM-DD)',
    example: '2000-01-15',
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string

  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
    example: Gender.male,
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be male or female' })
  gender?: Gender

  @ApiPropertyOptional({
    description: 'Place of residence (nơi thường trú) as string or structured JSON object',
    example: {
      province: 'Thành phố Hồ Chí Minh',
      ward: 'Phường Bến Nghé',
      street: 'Số 12 Lê Duẩn',
      address: 'Số 12 Lê Duẩn, Phường Bến Nghé, Thành phố Hồ Chí Minh',
    },
  })
  @IsOptional()
  placeOfResidence?: any

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'tenant@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string

  @ApiPropertyOptional({
    description: 'Occupation / Job title',
    example: 'Kỹ sư phần mềm',
  })
  @IsOptional()
  @IsString()
  job?: string

  @ApiPropertyOptional({
    description: 'Company or Workplace',
    example: 'Công ty Công nghệ FPT',
  })
  @IsOptional()
  @IsString()
  workplace?: string

  @ApiPropertyOptional({
    description: 'Landlord internal note regarding this tenant',
    example: 'Khách thuê lịch sự, thanh toán đúng hạn',
  })
  @IsOptional()
  @IsString()
  note?: string
}

