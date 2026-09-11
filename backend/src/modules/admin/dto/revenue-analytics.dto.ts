import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum RevenuePeriod {
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class RevenueQueryDto {
  @ApiPropertyOptional({
    description: 'Reporting period granularity: month, quarter, or year',
    enum: RevenuePeriod,
    default: RevenuePeriod.MONTH,
  })
  @IsOptional()
  @IsEnum(RevenuePeriod)
  period?: RevenuePeriod = RevenuePeriod.MONTH;

  @ApiPropertyOptional({
    description: 'Calendar year for reporting (e.g., 2026)',
    example: 2026,
    default: new Date().getFullYear(),
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year?: number = new Date().getFullYear();

  @ApiPropertyOptional({
    description: 'Optional custom start date ISO string',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Optional custom end date ISO string',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class SubscriptionByPlanDto {
  @ApiProperty({ example: 45000000 })
  plus: number;

  @ApiProperty({ example: 67500000 })
  pro: number;
}

export class SubscriptionByCycleDto {
  @ApiProperty({ example: 32500000 })
  monthly: number;

  @ApiProperty({ example: 80000000 })
  yearly: number;
}

export class SubscriptionRevenueSummaryDto {
  @ApiProperty({ example: 112500000 })
  total: number;

  @ApiProperty({ example: 72.8 })
  percentage: number;

  @ApiProperty({ type: SubscriptionByPlanDto })
  byPlan: SubscriptionByPlanDto;

  @ApiProperty({ type: SubscriptionByCycleDto })
  byCycle: SubscriptionByCycleDto;
}

export class PostPurchaseRevenueSummaryDto {
  @ApiProperty({ example: 42000000 })
  total: number;

  @ApiProperty({ example: 27.2 })
  percentage: number;

  @ApiProperty({ example: 4200 })
  totalCreditsSold: number;

  @ApiProperty({ example: 140 })
  totalTransactions: number;

  @ApiProperty({ example: 300000 })
  averageOrderValue: number;
}

export class RevenueSummaryDto {
  @ApiProperty({ example: 154500000 })
  totalRevenue: number;

  @ApiProperty({ example: 128000000 })
  previousPeriodRevenue: number;

  @ApiProperty({ example: 20.7 })
  revenueGrowthRate: number;

  @ApiProperty({ type: SubscriptionRevenueSummaryDto })
  subscriptionRevenue: SubscriptionRevenueSummaryDto;

  @ApiProperty({ type: PostPurchaseRevenueSummaryDto })
  postPurchaseRevenue: PostPurchaseRevenueSummaryDto;
}

export class RevenueTimelineItemDto {
  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  bucket: string;

  @ApiProperty({ example: 'Jan 2026' })
  label: string;

  @ApiProperty({ example: 12500000 })
  totalRevenue: number;

  @ApiProperty({ example: 3500000 })
  subscriptionPlus: number;

  @ApiProperty({ example: 5500000 })
  subscriptionPro: number;

  @ApiProperty({ example: 3500000 })
  postPurchase: number;
}

export class RevenueResponseDto {
  @ApiProperty({ type: RevenueSummaryDto })
  summary: RevenueSummaryDto;

  @ApiProperty({ type: [RevenueTimelineItemDto] })
  timeline: RevenueTimelineItemDto[];
}
