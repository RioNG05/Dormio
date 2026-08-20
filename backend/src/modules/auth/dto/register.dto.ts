import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: 'Secret@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', required: false })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
