import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscriptionPlanItemDto {
  @ApiProperty({ example: 'plus', description: 'Plan identifier' })
  planName: string;

  @ApiProperty({ example: 150000, description: 'Monthly price in VND' })
  priceMonthly: number;

  @ApiPropertyOptional({ example: 405000, description: 'Quarterly price in VND' })
  priceQuarterly?: number;

  @ApiProperty({ example: 1440000, description: 'Yearly price in VND' })
  priceYearly: number;

  @ApiProperty({ example: 30, description: 'Maximum rooms allowed' })
  maxRoom: number;

  @ApiProperty({ example: 5, description: 'Daily post quote' })
  dailyPostQuote: number;

  @ApiPropertyOptional({ example: 'Gói nâng cao cho nhà trọ', description: 'Description' })
  description?: string;

  @ApiProperty({ example: ['Quản lý 30 phòng', 'Báo cáo nâng cao'], description: 'Features list' })
  features: string[];
}
