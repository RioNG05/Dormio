import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Matches } from 'class-validator'

export class SearchTenantQueryDto {
  @ApiProperty({
    description: '10-digit Vietnamese phone number starting with 0',
    example: '0987654321',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0[0-9]{9}$/, {
    message: 'phone must be a valid 10-digit Vietnamese phone number starting with 0',
  })
  phone: string
}

