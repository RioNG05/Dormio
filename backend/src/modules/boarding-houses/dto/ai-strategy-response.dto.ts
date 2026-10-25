import { ApiProperty } from '@nestjs/swagger'

export class StrategyActionStepDto {
  @ApiProperty({ example: 1 })
  dayRange: string // e.g., "Days 1 - 7"

  @ApiProperty({ example: 'Survey and adjust pricing' })
  title: string

  @ApiProperty({
    example: 'Reduce rent by 5% for rooms vacant over 30 days at Cau Giay property.',
  })
  description: string
}

export class AiStrategyResponseDto {
  @ApiProperty({ example: 'Profit optimization and room occupancy strategy Q3/2026' })
  title: string

  @ApiProperty({
    example:
      'System operates 3 properties with 84.4% occupancy. Largest bottleneck is Nam Tu Liem with 4 persistent vacancies.',
  })
  executiveSummary: string

  @ApiProperty({
    example: [
      'Apply tier-based flexible pricing at Cau Giay to increase revenue by 8%.',
      'Offer 0.5 month deposit discount for tenants signing 12-month contracts on vacant rooms.',
    ],
  })
  pricingRecommendations: string[]

  @ApiProperty({
    example: [
      'Promote featured listings on Dormio with "Newly Renovated" badge.',
      'Partner with student associations within 2km radius.',
    ],
  })
  marketingCampaigns: string[]

  @ApiProperty({
    example: [
      'Audit shared utility usage to reduce operating expenses by 15%.',
      'Apply automated debt collection notices 3 days before due date.',
    ],
  })
  operationalOptimizations: string[]

  @ApiProperty({ type: [StrategyActionStepDto] })
  actionPlan30Days: StrategyActionStepDto[]

  @ApiProperty({ example: '2026-09-12T01:45:00.000Z' })
  createdAt: string
}
