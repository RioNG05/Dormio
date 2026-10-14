import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator'

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
  @MaxLength(255)
  city?: string

  @ApiPropertyOptional({ example: 'Thu Duc District', description: 'District' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  district?: string

  @ApiPropertyOptional({ example: 'Linh Trung Ward', description: 'Ward' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ward?: string

  @ApiPropertyOptional({ example: 'Vo Van Ngan Street', description: 'Street' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string

  @ApiPropertyOptional({ example: '1', description: 'House number' })
  @IsOptional()
  @IsString()
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
}
