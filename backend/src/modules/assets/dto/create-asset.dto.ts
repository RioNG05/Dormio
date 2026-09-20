import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  IsISO8601,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetCondition } from '@prisma';

export class CreateAssetDto {
  @ApiProperty({
    description: 'Name of the asset / equipment',
    example: 'Máy lạnh Panasonic Inverter 1.5 HP',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Category of the asset (e.g. Điện tử, Nội thất, Gia dụng)',
    example: 'Điện máy',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    description: 'Location or placement within the boarding house',
    example: 'Phòng 101 - Ban công',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location: string;

  @ApiPropertyOptional({
    description: 'Room UUID if assigned to a specific room, or null if unassigned / shared space',
    example: 'ce81baea-5efc-4e89-9cb1-ef0db32e011b',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4')
  roomId?: string | null;

  @ApiPropertyOptional({
    description: 'Quantity of items',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number = 1;

  @ApiPropertyOptional({
    description: 'Current physical condition of the asset',
    enum: AssetCondition,
    default: AssetCondition.good,
  })
  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition = AssetCondition.good;

  @ApiPropertyOptional({
    description: 'Purchase price in VND',
    example: 8500000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({
    description: 'Purchase date in ISO 8601 string format',
    example: '2026-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  purchaseDate?: string;

  @ApiPropertyOptional({
    description: 'Image URL of the asset photo',
    example: 'https://storage.example.com/assets/fan.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or warranty info',
    example: 'Bảo hành đến tháng 01/2028',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
