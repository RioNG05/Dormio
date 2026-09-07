import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { RoomStatus } from '@prisma';

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: 'P101', description: 'Room number or code' })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'roomNumber must not be blank' })
  @MaxLength(50)
  roomNumber?: string;

  @ApiPropertyOptional({ example: 1, description: 'Floor level' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  floor?: number;

  @ApiPropertyOptional({ example: 25.5, description: 'Floor area in m²' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  area?: number;

  @ApiPropertyOptional({ example: 2, description: 'Maximum occupants' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxOccupants?: number;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsUUID('all', { message: 'roomTypeId must be a valid UUID' })
  roomTypeId?: string;

  @ApiPropertyOptional({ enum: RoomStatus, example: RoomStatus.available })
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
      'List of service UUIDs attached to this room. If provided, existing room services will be synchronized with this list.',
  })
  @IsOptional()
  @IsUUID('all', { each: true, message: 'Each serviceId must be a valid UUID' })
  serviceIds?: string[];
}
