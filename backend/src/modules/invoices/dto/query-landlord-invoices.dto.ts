import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLandlordInvoicesDto {
  @ApiPropertyOptional({
    description: 'Search by invoice ID, room number, tenant name, or tenant phone number',
    example: '101',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by invoice payment status',
    enum: ['all', 'paid', 'unpaid', 'overdue'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'paid', 'unpaid', 'overdue'])
  status?: 'all' | 'paid' | 'unpaid' | 'overdue' = 'all';

  @ApiPropertyOptional({
    description: 'Filter by month (01-12 or "all")',
    example: '08',
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
    description: 'Items per page (default: 10 for table, 6 for grid)',
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
