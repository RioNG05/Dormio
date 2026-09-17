import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class QueryStaffMonthlyDto {
  @ApiPropertyOptional({
    example: '2026-09',
    description: 'Month in YYYY-MM format (defaults to current month)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'month must be formatted as YYYY-MM (e.g. 2026-09)',
  })
  month?: string;
}

