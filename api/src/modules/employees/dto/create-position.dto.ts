import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreatePositionDto {
  @ApiProperty({
    description: 'Job position name (e.g., Building Manager, Security, Janitor)',
    example: 'Day Shift Security',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string

  @ApiPropertyOptional({
    description: 'Free-text duty description (e.g., gate guard, vehicle check, night patrol)',
    example: 'Main gate duty, visitor logbook registration, premises patrol.',
  })
  @IsOptional()
  @IsString()
  description?: string
}
