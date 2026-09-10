import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const MONEY_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

export class CreateInitialServiceDto {
  @ApiProperty({ example: 'Electricity', description: 'Service name' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'kWh', description: 'Billing unit' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'unit must not be blank' })
  @MaxLength(255)
  unit: string;

  @ApiProperty({
    example: '3500.00',
    description: 'Non-negative monetary amount with no more than two decimal places',
  })
  @IsString()
  @Matches(MONEY_PATTERN, {
    message: 'price must be a non-negative decimal with up to two decimal places',
  })
  price: string;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Whether usage is measured by a meter',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isMetered?: boolean;
}

export class CreateInitialRoomTypeDto {
  @ApiProperty({ example: 'Studio', description: 'Room type name' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Private kitchen and bathroom',
    description: 'Optional room type description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class CreateBoardingHouseDto {
  @ApiProperty({ example: 'Sunrise Residence', description: 'Property name' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Vietnam', description: 'Country' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'country must not be blank' })
  @MaxLength(255)
  country: string;

  @ApiProperty({ example: 'Ho Chi Minh City', description: 'Province or municipality' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'province must not be blank' })
  @MaxLength(255)
  province: string;

  @ApiProperty({ example: 'Thu Duc City', description: 'City' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'city must not be blank' })
  @MaxLength(255)
  city: string;

  @ApiProperty({ example: 'Linh Trung Ward', description: 'Ward' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'ward must not be blank' })
  @MaxLength(255)
  ward: string;

  @ApiProperty({ example: 'Thu Duc District', description: 'District' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'district must not be blank' })
  @MaxLength(255)
  district: string;

  @ApiProperty({ example: 'Vo Van Ngan Street', description: 'Street' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'street must not be blank' })
  @MaxLength(255)
  street: string;

  @ApiProperty({ example: '1', description: 'House number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'houseNumber must not be blank' })
  @MaxLength(255)
  houseNumber: string;

  @ApiPropertyOptional({ example: 'Near the university campus', description: 'Property description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, description: 'Total number of floors' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalFloor?: number;

  @ApiProperty({ example: '2020-01-01', format: 'date', description: 'Property construction date' })
  @IsDateString()
  builtAt: string;

  @ApiPropertyOptional({ type: [CreateInitialServiceDto], description: 'Initial services for this property' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateInitialServiceDto)
  services?: CreateInitialServiceDto[];

  @ApiPropertyOptional({ type: [CreateInitialRoomTypeDto], description: 'Initial room types for this property' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateInitialRoomTypeDto)
  roomTypes?: CreateInitialRoomTypeDto[];
}
