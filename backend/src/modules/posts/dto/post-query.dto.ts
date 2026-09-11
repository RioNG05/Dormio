import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '@prisma';

export class PostQueryDto {
  @ApiPropertyOptional({
    description: 'Filter posts by status',
    enum: PostStatus,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({
    description: 'Search keyword matching title or content',
    example: 'Quận 1',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by boarding house ID (via associated room)',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsOptional()
  @IsString()
  boardingHouseId?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

/**
 * Query DTO for the public UC-PU-01 browse & filter listings endpoint.
 * Uses structured address fields on BoardingHouse — NOT free-text address search.
 */
export class BrowsePostsQueryDto {
  @ApiPropertyOptional({
    description: 'Keyword search matching Post title or content',
    example: 'studio ban công',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by listing status (draft, posted, hidden, or all)',
    example: 'posted',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by province (exact match on BoardingHouse.province)',
    example: 'Hà Nội',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description: 'Filter by district (exact match on BoardingHouse.district)',
    example: 'Đống Đa',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Filter by ward (exact match on BoardingHouse.ward)',
    example: 'Láng Thượng',
  })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({
    description: 'Minimum deposit amount in VND (inclusive)',
    example: 500000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum deposit amount in VND (inclusive)',
    example: 5000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Minimum room area in m² (inclusive)',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minArea?: number;

  @ApiPropertyOptional({
    description: 'Maximum room area in m² (inclusive)',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxArea?: number;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 12,
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12;
}

