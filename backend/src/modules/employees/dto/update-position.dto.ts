import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdatePositionDto {
  @ApiPropertyOptional({
    description: 'Updated job position name',
    example: 'Head Building Manager',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string

  @ApiPropertyOptional({
    description: 'Free-text duty description / responsibilities list shown to staff in UC-S-01',
    example: 'Comprehensive operations management, security inspection, tenant grievances handling',
  })
  @IsOptional()
  @IsString()
  description?: string
}
