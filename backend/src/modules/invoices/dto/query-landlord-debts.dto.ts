import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLandlordDebtsDto {
  @ApiPropertyOptional({
    description: 'Search by room number, tenant name, or tenant phone number',
    example: '101',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter debts by overdue duration / aging category',
    enum: ['all', 'current', 'overdue', '1_month', '2_months', 'bad_debt'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'current', 'overdue', '1_month', '2_months', 'bad_debt'])
  duration?: 'all' | 'current' | 'overdue' | '1_month' | '2_months' | 'bad_debt' = 'all';

  @ApiPropertyOptional({
    description: 'Sort criteria for the debt ledger',
    enum: ['debt_desc', 'aging_desc', 'room_asc'],
    default: 'debt_desc',
  })
  @IsOptional()
  @IsIn(['debt_desc', 'aging_desc', 'room_asc'])
  sortBy?: 'debt_desc' | 'aging_desc' | 'room_asc' = 'debt_desc';

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
