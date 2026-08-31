import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: '0901234567',
    description: 'Vietnamese phone number (10 digits, starting with 0)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0[0-9]{9}$/, {
    message: 'phoneNumber must be a valid Vietnamese phone number (10 digits)',
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Optional email — also usable as login identifier',
  })
  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email?: string;

  @ApiProperty({ example: 'Secret@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
