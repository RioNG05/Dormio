import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExtractIdCardDto {
  @ApiProperty({
    description: 'URL of the CCCD/ID card photo or base64 data URI',
    example: 'https://res.cloudinary.com/dbdol9ny5/image/upload/v1/cccd_front.jpg',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    description: 'Side of the CCCD/ID card (front or back)',
    example: 'front',
    required: false,
    default: 'front',
  })
  @IsString()
  @IsOptional()
  side?: 'front' | 'back';
}

export class IdCardOcrResponseDto {
  @ApiProperty({ description: '12-digit citizen identification number', example: '001202012345' })
  identityNumber: string;

  @ApiProperty({ description: 'Full name on identification card', example: 'NGUYEN VAN A' })
  fullName: string;

  @ApiProperty({ description: 'Date of birth (DD/MM/YYYY)', example: '15/08/1998', required: false })
  dateOfBirth?: string;

  @ApiProperty({ description: 'Gender', example: 'Nam', required: false })
  gender?: string;

  @ApiProperty({ description: 'Place of origin / hometown', example: 'Hà Nội', required: false })
  hometown?: string;

  @ApiProperty({ description: 'Permanent address', example: 'Số 10 Tràng Thi, Hoàn Kiếm, Hà Nội', required: false })
  permanentAddress?: string;

  @ApiProperty({ description: 'Date of issue', example: '10/05/2021', required: false })
  issueDate?: string;

  @ApiProperty({ description: 'Expiration date', example: '15/08/2038', required: false })
  expiryDate?: string;

  @ApiProperty({ description: 'Confidence score', example: 0.96 })
  confidence: number;

  @ApiProperty({ description: 'Notes or warnings', example: 'Clear photo without glare', required: false })
  notes?: string;
}
