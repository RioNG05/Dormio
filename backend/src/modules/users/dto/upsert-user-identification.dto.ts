import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { Gender } from '@prisma';

export class UpsertUserIdentificationDto {
  @ApiProperty({
    description: 'Vietnamese Citizen ID (CCCD) number - exactly 12 digits',
    example: '001202012345',
  })
  @IsString()
  @IsNotEmpty({ message: 'Identity number is required' })
  @Matches(/^[0-9]{12}$/, {
    message: 'Identity number (CCCD) must contain exactly 12 digits',
  })
  identityNumber: string;

  @ApiProperty({
    description: 'Full name as printed on ID card',
    example: 'NGUYEN VAN A',
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601 or YYYY-MM-DD)',
    example: '2000-01-15',
  })
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  @IsNotEmpty({ message: 'Date of birth is required' })
  dateOfBirth: string;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    example: Gender.male,
  })
  @IsEnum(Gender, { message: 'Gender must be male or female' })
  gender: Gender;

  @ApiPropertyOptional({
    description: 'Nationality',
    default: 'Việt Nam',
    example: 'Việt Nam',
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Place of origin (quê quán) as string or structured JSON',
    example: 'Hà Nội',
  })
  @IsOptional()
  placeOfOrigin?: any;

  @ApiPropertyOptional({
    description: 'Place of residence (nơi thường trú) as string or structured JSON',
    example: 'TP. Hồ Chí Minh',
  })
  @IsOptional()
  placeOfResidence?: any;

  @ApiPropertyOptional({
    description: 'Issue date (ngày cấp)',
    example: '2021-05-20',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Expiry date (ngày hết hạn)',
    example: '2030-01-15',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'URL of ID card front image',
    example: 'https://images.unsplash.com/photo-id-front.jpg',
  })
  @IsOptional()
  @IsString()
  cardFrontUrl?: string;

  @ApiPropertyOptional({
    description: 'URL of ID card back image',
    example: 'https://images.unsplash.com/photo-id-back.jpg',
  })
  @IsOptional()
  @IsString()
  cardBackUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Verified via national citizen identity database',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
