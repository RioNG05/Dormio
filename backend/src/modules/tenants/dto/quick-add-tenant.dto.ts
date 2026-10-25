import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator'

export class QuickAddTenantDto {
  @ApiProperty({
    description: '10-digit Vietnamese phone number starting with 0',
    example: '0987654321',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0[0-9]{9}$/, {
    message: 'phoneNumber must be a valid 10-digit Vietnamese phone number starting with 0',
  })
  phoneNumber: string

  @ApiProperty({
    description: 'Tenant full name',
    example: 'Nguyen Van An',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string

  @ApiProperty({
    description: 'Target room UUID where tenant will reside',
    example: 'd3b07384-d113-4c9f-8ec1-c30d9ec0d102',
  })
  @IsUUID('4')
  @IsNotEmpty()
  roomId: string

  @ApiPropertyOptional({
    description: 'Optional notes regarding tenancy',
    example: 'Khách ở ghép ngắn hạn',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string
}

