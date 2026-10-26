import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

export class UpdateBoardingHouseRoomTypeDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'Room type ID if updating existing' })
  @IsOptional()
  @IsString()
  id?: string

  @ApiProperty({ example: 'Studio', description: 'Room type name' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(255)
  name: string

  @ApiPropertyOptional({
    example: 'Private kitchen and bathroom',
    description: 'Optional room type description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string
}

export class UpdateBoardingHouseDto {
  @ApiPropertyOptional({ example: 'Sunrise Residence', description: 'Property display name' })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(255)
  name?: string

  @ApiPropertyOptional({ example: 'Vietnam', description: 'Country' })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'country must not be blank' })
  @MaxLength(255)
  country?: string

  @ApiPropertyOptional({ example: 'Ho Chi Minh City', description: 'Province or municipality' })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'province must not be blank' })
  @MaxLength(255)
  province?: string

  @ApiPropertyOptional({ example: 'Thu Duc City', description: 'City' })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'city must not be blank' })
  @MaxLength(255)
  city?: string

  @ApiPropertyOptional({ example: 'Thu Duc District', description: 'District' })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'district must not be blank' })
  @MaxLength(255)
  district?: string

  @ApiPropertyOptional({ example: 'Linh Trung Ward', description: 'Ward' })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'ward must not be blank' })
  @MaxLength(255)
  ward?: string

  @ApiPropertyOptional({ example: 'Vo Van Ngan Street', description: 'Street' })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'street must not be blank' })
  @MaxLength(255)
  street?: string

  @ApiPropertyOptional({ example: '1', description: 'House number' })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'houseNumber must not be blank' })
  @MaxLength(255)
  houseNumber?: string

  @ApiPropertyOptional({
    example: 'Near the university campus',
    description: 'Property description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string

  @ApiPropertyOptional({ example: 5, minimum: 1, description: 'Total number of floors' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalFloor?: number

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    maximum: 31,
    description: 'Updated recurring monthly billing payment day (1-31)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  monthlyPaymentDate?: number

  @ApiPropertyOptional({
    example: '2020-01-01',
    format: 'date',
    description: 'Property construction date',
  })
  @IsOptional()
  @IsDateString()
  builtAt?: string

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/...',
    description: 'Property cover image URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  thumbnail?: string

  @ApiPropertyOptional({
    type: [UpdateBoardingHouseRoomTypeDto],
    description: 'Updated room types list for this property',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBoardingHouseRoomTypeDto)
  roomTypes?: UpdateBoardingHouseRoomTypeDto[]

  @ApiPropertyOptional({
    example: ['WiFi', 'Air Conditioner', 'Water Heater'],
    description: 'Updated boarding house amenities list',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[]
}
