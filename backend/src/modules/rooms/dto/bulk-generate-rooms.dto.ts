import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class BulkGenerateRoomsDto {
  @ApiProperty({
    example: 3,
    description: 'Total number of floors to generate rooms for (1 - 100)',
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  floorCount: number;

  @ApiProperty({
    example: 4,
    description: 'Number of rooms per floor (1 - 100)',
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  roomsPerFloor: number;

  @ApiProperty({
    example: 'P{floor}0{index}',
    description:
      'Template for room numbering. Supported placeholders: {floor}, {index}, {index:02}',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'nameFormat must not be blank' })
  @MaxLength(50)
  nameFormat: string;

  @ApiPropertyOptional({
    example: 25.5,
    description: 'Floor area of each room in square meters',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  area?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Maximum number of occupants per room',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxOccupants?: number;

  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'UUID of the room type to assign to generated rooms',
  })
  @IsUUID('all', { message: 'roomTypeId must be a valid UUID' })
  @IsNotEmpty()
  roomTypeId: string;

  @ApiPropertyOptional({
    example: ['b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'],
    description: 'List of Service UUIDs to attach to every created room',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true, message: 'Each serviceId must be a valid UUID' })
  serviceIds?: string[];
}
