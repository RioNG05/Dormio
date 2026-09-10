import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { RoomStatus } from '@prisma';

export class CreateRoomDto {
  @ApiProperty({
    example: 'P101',
    description: 'Room number or room code (unique within the boarding house)',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'roomNumber must not be blank' })
  @MaxLength(50)
  roomNumber: string;

  @ApiProperty({
    example: 1,
    description: 'Floor level where this room is located',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  floor: number;

  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'UUID of the room type for this room',
  })
  @IsUUID('all', { message: 'roomTypeId must be a valid UUID' })
  roomTypeId: string;

  @ApiPropertyOptional({
    example: 25.5,
    description: 'Floor area of the room in square meters',
    minimum: 0.1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  area?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Maximum allowed occupants',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxOccupants?: number;

  @ApiPropertyOptional({
    enum: RoomStatus,
    example: RoomStatus.available,
    description: 'Initial operational status of the room (default: available)',
  })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/room101.jpg',
    description: 'Image URL representing the room',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['b1aebc99-9c0b-4ef8-bb6d-6bb9bd380a22'],
    description:
      'Optional list of service UUIDs to attach. If omitted or empty, all active autoApplied services for this property will be attached.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsUUID('all', { each: true, message: 'Each serviceId must be a valid UUID' })
  serviceIds?: string[];
}
