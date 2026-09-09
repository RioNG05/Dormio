import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecordLandlordMeterReadingItemDto {
  @ApiProperty({
    description: 'UUID of the metered Service (e.g. Điện or Nước)',
    example: 'd9b2d63d-a233-4123-847e-2972986422b4',
  })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Numerical reading value from the utility meter dial',
    example: 1530,
  })
  @IsNumber()
  @Min(0)
  readingValue: number;

  @ApiPropertyOptional({
    description: 'Optional proof photo image URL',
    example: 'https://res.cloudinary.com/dormio/image/upload/v1234/meter_elec.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class RecordLandlordMeterReadingDto {
  @ApiProperty({
    description: 'UUID of the Room where meter reading was taken',
    example: 'f87a32d1-2357-410a-8bf8-d3ecf1244342',
  })
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({
    description: 'List of metered service readings for the room',
    type: [RecordLandlordMeterReadingItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordLandlordMeterReadingItemDto)
  readings: RecordLandlordMeterReadingItemDto[];

  @ApiPropertyOptional({
    description: 'Optional timestamp when the reading was physically logged (defaults to now)',
    example: '2026-09-01T08:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @ApiPropertyOptional({
    description: 'Billing month (1 to 12)',
    example: 9,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    description: 'Billing year',
    example: 2026,
  })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({
    description: 'Optional note or reason for recording/adjusting meter readings',
    example: 'Chốt số điện nước định kỳ đầu tháng',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
