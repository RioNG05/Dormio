import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator'

export class AddRoomServiceDto {
  @ApiPropertyOptional({
    description: 'UUID of an existing boarding house service to attach to this room',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID('all')
  serviceId?: string

  @ApiPropertyOptional({
    description: 'Name of a new service to create and attach to this room',
    example: 'Gửi xe điện',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string

  @ApiPropertyOptional({
    description: 'Unit price of the new service (VND)',
    example: 100000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number

  @ApiPropertyOptional({
    description: 'Unit of measurement (e.g. kWh, m³, người/tháng, phòng/tháng, xe/tháng)',
    example: 'xe/tháng',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  unit?: string

  @ApiPropertyOptional({
    description: 'Whether this service requires utility meter readings (e.g. Electricity, Water)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMetered?: boolean
}

export class UpdateRoomServiceDto {
  @ApiPropertyOptional({
    description: 'Updated name for the service',
    example: 'Gửi xe máy / xe điện',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string

  @ApiPropertyOptional({
    description: 'Updated unit price of the service (VND)',
    example: 120000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number

  @ApiPropertyOptional({
    description: 'Updated unit of measurement',
    example: 'xe/tháng',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  unit?: string

  @ApiPropertyOptional({
    description: 'Whether this service requires utility meter readings',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isMetered?: boolean
}

