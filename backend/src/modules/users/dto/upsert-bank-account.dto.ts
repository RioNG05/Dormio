import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class UpsertBankAccountDto {
  @ApiProperty({
    description: 'Name of the bank (e.g. TPBank, Vietcombank)',
    example: 'TPBank',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  bankName: string;

  @ApiProperty({
    description: 'Bank account number',
    example: '0987654321',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  accountNumber: string;

  @ApiProperty({
    description: 'Account holder name (as printed on card, uppercase)',
    example: 'NGUYEN VAN A',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  accountName: string;
}
