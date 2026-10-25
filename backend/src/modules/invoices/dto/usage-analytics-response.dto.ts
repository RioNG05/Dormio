import { ApiProperty } from '@nestjs/swagger'

export class UtilityConsumptionDataPointDto {
  @ApiProperty({ example: 'Month 09/2026', description: 'Billing cycle period' })
  period: string

  @ApiProperty({ example: '2026-09-01', description: 'Ordering timestamp' })
  date: string

  @ApiProperty({ example: 140, description: 'Electricity consumption (kWh)' })
  electricityKwh: number

  @ApiProperty({ example: 6, description: 'Water consumption (m³)' })
  waterM3: number

  @ApiProperty({ example: 4500000, description: 'Room rent in VND' })
  roomRent: number

  @ApiProperty({ example: 490000, description: 'Electricity fee in VND' })
  electricityAmount: number

  @ApiProperty({ example: 150000, description: 'Water fee in VND' })
  waterAmount: number

  @ApiProperty({ example: 60000, description: 'Other service fees in VND' })
  otherServicesAmount: number

  @ApiProperty({ example: 5200000, description: 'Total invoice amount this cycle in VND' })
  totalAmount: number
}

export class UsageAnalyticsSummaryDto {
  @ApiProperty({ example: 5200000, description: 'Current cycle payable amount in VND' })
  currentCycleDue: number

  @ApiProperty({ example: 5162500, description: 'Average monthly spend in VND' })
  averageMonthlySpend: number

  @ApiProperty({ example: 130, description: 'Average electricity consumption (kWh/month)' })
  averageElectricityKwh: number

  @ApiProperty({ example: 6, description: 'Average water consumption (m³/month)' })
  averageWaterM3: number

  @ApiProperty({ example: 1.46, description: '% difference compared to previous cycle' })
  momChangePercent: number

  @ApiProperty({ example: 75000, description: 'Amount difference compared to previous cycle in VND' })
  momChangeAmount: number

  @ApiProperty({ example: true, description: 'Whether current cycle cost increased MoM' })
  isUp: boolean

  @ApiProperty({
    example: '2026-09-05T00:00:00.000Z',
    description: 'Upcoming payment deadline',
  })
  nextDueDate: string | null
}

export class TenantUsageAnalyticsResponseDto {
  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ type: UsageAnalyticsSummaryDto })
  summary: UsageAnalyticsSummaryDto

  @ApiProperty({ type: [UtilityConsumptionDataPointDto] })
  chartData: UtilityConsumptionDataPointDto[]
}
