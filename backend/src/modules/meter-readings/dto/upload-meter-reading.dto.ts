import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class UploadMeterReadingDto {
  @ApiProperty({
    description: 'UUID of the metered Service',
    example: 'd9b2d63d-a233-4123-847e-2972986422b4',
  })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Image URL or data URI of the captured meter dial photo',
    example: 'https://res.cloudinary.com/dormio/image/upload/v1234/meter_water.jpg',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({
    description: 'Optional manual reading value override if provided at upload time',
    example: 1250.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readingValue?: number;
}
