import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0[0-9]{9}$/, {
    message: 'phoneNumber must be a valid Vietnamese phone number (10 digits)',
  })
  phoneNumber: string;

  @ApiProperty({ example: 'Secret@123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
