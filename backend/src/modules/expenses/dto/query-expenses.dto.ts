import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryExpensesDto {
  @ApiPropertyOptional({
    description: 'Search by expense name, description, or room number',
    example: 'thang máy',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by expense category',
    example: 'Bảo trì & Sửa chữa',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: ['all', 'paid', 'pending', 'canceled'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'paid', 'pending', 'canceled'])
  status?: 'all' | 'paid' | 'pending' | 'canceled' = 'all';

  @ApiPropertyOptional({
    description: 'Filter by room: "all", "property_wide", or a specific room UUID',
    example: 'all',
  })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({
    description: 'Filter by month (1-12 or "all")',
    example: '8',
    default: 'all',
  })
  @IsOptional()
  @IsString()
  month?: string = 'all';

  @ApiPropertyOptional({
    description: 'Filter by year (e.g. 2026 or "all")',
    example: '2026',
    default: 'all',
  })
  @IsOptional()
  @IsString()
  year?: string = 'all';

  @ApiPropertyOptional({
    description: 'Sort criteria for expenses list',
    enum: ['date_desc', 'date_asc', 'amount_desc', 'amount_asc'],
    default: 'date_desc',
  })
  @IsOptional()
  @IsIn(['date_desc', 'date_asc', 'amount_desc', 'amount_asc'])
  sortBy?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' = 'date_desc';

  @ApiPropertyOptional({
    description: 'Page number (default: 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page (default: 6 for grid, 10 for table)',
    example: 6,
    default: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 6;
}
