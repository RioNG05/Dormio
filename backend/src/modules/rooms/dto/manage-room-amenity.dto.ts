import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

export class AddRoomAmenityDto {
  @ApiPropertyOptional({
    description: 'UUID of an existing shared amenity to attach to this room',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID('all')
  amenityId?: string

  @ApiPropertyOptional({
    description: 'Name of a new private amenity to create exclusively for this room',
    example: 'Tủ lạnh mini riêng',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string

  @ApiPropertyOptional({
    description: 'Icon key for the amenity',
    example: 'Refrigerator',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string
}

export class UpdateRoomAmenityDto {
  @ApiProperty({
    description: 'Updated name for the amenity',
    example: 'Điều hòa Daikin Inverter',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string

  @ApiPropertyOptional({
    description: 'Updated icon key for the amenity',
    example: 'AirConditioner',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string

  @ApiPropertyOptional({
    description:
      'If true, forks this amenity as a private amenity for this room only instead of updating the shared master record across all rooms.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  forkForRoom?: boolean
}

export class RoomAmenityItemDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string

  @ApiProperty({ example: 'Điều hòa' })
  name: string

  @ApiPropertyOptional({ example: 'AirConditioner' })
  icon?: string | null

  @ApiProperty({
    example: true,
    description:
      'True if shared across boarding house rooms; false if private to this room',
  })
  isShared: boolean
}
