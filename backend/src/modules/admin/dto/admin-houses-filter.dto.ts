import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminHousesFilterDto {
  @ApiPropertyOptional({
    description: 'Search string matching boarding house name or address (street, ward, district, city, province)',
    example: 'Dormio',
  })
  @IsOptional()
  @IsString()
  propertyQuery?: string;

  @ApiPropertyOptional({
    description: 'Search string matching landlord contact name, phone number, or email',
    example: 'Tuấn',
  })
  @IsOptional()
  @IsString()
  landlordQuery?: string;

  @ApiPropertyOptional({
    description: 'Minimum total number of rooms in the boarding house',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minRooms?: number;

  @ApiPropertyOptional({
    description: 'Maximum total number of rooms in the boarding house',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxRooms?: number;

  @ApiPropertyOptional({
    description: 'Minimum occupancy rate percentage (0 - 100)',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minOccupancy?: number;

  @ApiPropertyOptional({
    description: 'Maximum occupancy rate percentage (0 - 100)',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  maxOccupancy?: number;

  @ApiPropertyOptional({
    description: 'Filter by one or multiple moderation statuses (comma-separated: active, locked, reported)',
    example: 'active,reported',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Current page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class LockHouseDto {
  @ApiPropertyOptional({
    description: 'Reason for locking the boarding house',
    example: 'Fire safety violation and unresolved complaints',
  })
  @IsString()
  reason: string;
}
