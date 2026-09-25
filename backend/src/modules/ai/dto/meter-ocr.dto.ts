import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExtractMeterReadingDto {
  @ApiProperty({
    description: 'URL of the uploaded meter image or base64 data URI',
    example: 'https://res.cloudinary.com/dbdol9ny5/image/upload/v1/meter_reading.jpg',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    description: 'Type of utility service context (electricity, water, general)',
    example: 'electricity',
    required: false,
    default: 'general',
  })
  @IsString()
  @IsOptional()
  serviceType?: string;
}

export class MeterOcrResponseDto {
  @ApiProperty({ description: 'Extracted numeric meter reading value', example: 1250.5 })
  readingValue: number;

  @ApiProperty({ description: 'Raw detected string of digits', example: '012505' })
  rawDigits: string;

  @ApiProperty({ description: 'Identified meter type', example: 'electricity', enum: ['electricity', 'water', 'unknown'] })
  meterType: 'electricity' | 'water' | 'unknown';

  @ApiProperty({ description: 'Measurement unit', example: 'kWh', enum: ['kWh', 'm3'] })
  unit: 'kWh' | 'm3';

  @ApiProperty({ description: 'Confidence score between 0.0 and 1.0', example: 0.95 })
  confidence: number;

  @ApiProperty({ description: 'Whether the reading seems abnormal or blurry', example: false })
  isAnomalyWarning: boolean;

  @ApiProperty({ description: 'Optional operational notes from the AI vision model', example: 'Exclusion of red decimal drum' })
  notes?: string;
}
