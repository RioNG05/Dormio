import { ApiProperty } from '@nestjs/swagger';

export class UtilityConsumptionDataPointDto {
  @ApiProperty({ example: 'Tháng 09/2026', description: 'Kỳ thanh toán' })
  period: string;

  @ApiProperty({ example: '2026-09-01', description: 'Mốc thời gian sắp xếp' })
  date: string;

  @ApiProperty({ example: 140, description: 'Số lượng điện tiêu thụ (kWh)' })
  electricityKwh: number;

  @ApiProperty({ example: 6, description: 'Số lượng nước tiêu thụ (m³)' })
  waterM3: number;

  @ApiProperty({ example: 4500000, description: 'Tiền phòng (VNĐ)' })
  roomRent: number;

  @ApiProperty({ example: 490000, description: 'Tiền điện (VNĐ)' })
  electricityAmount: number;

  @ApiProperty({ example: 150000, description: 'Tiền nước (VNĐ)' })
  waterAmount: number;

  @ApiProperty({ example: 60000, description: 'Tiền dịch vụ khác (VNĐ)' })
  otherServicesAmount: number;

  @ApiProperty({ example: 5200000, description: 'Tổng tiền hóa đơn kỳ này (VNĐ)' })
  totalAmount: number;
}

export class UsageAnalyticsSummaryDto {
  @ApiProperty({ example: 5200000, description: 'Số tiền hóa đơn hiện tại cần thanh toán (VNĐ)' })
  currentCycleDue: number;

  @ApiProperty({ example: 5162500, description: 'Chi phí trung bình mỗi tháng (VNĐ)' })
  averageMonthlySpend: number;

  @ApiProperty({ example: 130, description: 'Lượng điện tiêu thụ trung bình (kWh/tháng)' })
  averageElectricityKwh: number;

  @ApiProperty({ example: 6, description: 'Lượng nước tiêu thụ trung bình (m³/tháng)' })
  averageWaterM3: number;

  @ApiProperty({ example: 1.46, description: '% chênh lệch so với kỳ trước' })
  momChangePercent: number;

  @ApiProperty({ example: 75000, description: 'Số tiền chênh lệch so với kỳ trước (VNĐ)' })
  momChangeAmount: number;

  @ApiProperty({ example: true, description: 'Chi phí kỳ này tăng so với kỳ trước hay không' })
  isUp: boolean;

  @ApiProperty({ example: '2026-09-05T00:00:00.000Z', description: 'Hạn chót thanh toán hóa đơn gần nhất' })
  nextDueDate: string | null;
}

export class TenantUsageAnalyticsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: UsageAnalyticsSummaryDto })
  summary: UsageAnalyticsSummaryDto;

  @ApiProperty({ type: [UtilityConsumptionDataPointDto] })
  chartData: UtilityConsumptionDataPointDto[];
}
