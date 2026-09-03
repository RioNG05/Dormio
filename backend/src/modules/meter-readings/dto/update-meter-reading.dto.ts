import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class UpdateMeterReadingDto {
  @ApiProperty({
    description: 'Corrected/manual reading value for the utility meter',
    example: 1255.0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  readingValue: number;
}
