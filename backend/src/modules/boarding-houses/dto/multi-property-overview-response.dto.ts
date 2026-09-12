import { ApiProperty } from '@nestjs/swagger';

export class PortfolioSummaryDto {
  @ApiProperty({ example: 3 })
  totalProperties: number;

  @ApiProperty({ example: 45 })
  totalRooms: number;

  @ApiProperty({ example: 38 })
  occupiedRooms: number;

  @ApiProperty({ example: 5 })
  vacantRooms: number;

  @ApiProperty({ example: 2 })
  depositRooms: number;

  @ApiProperty({ example: 0 })
  maintenanceRooms: number;

  @ApiProperty({ example: '84.4%' })
  occupancyRate: string;

  @ApiProperty({ example: '125,500,000' })
  currentMonthRevenue: string;

  @ApiProperty({ example: '18,200,000' })
  currentMonthExpenses: string;

  @ApiProperty({ example: '107,300,000' })
  netProfit: string;

  @ApiProperty({ example: '12,000,000' })
  unpaidDebt: string;

  @ApiProperty({ example: 4 })
  unpaidInvoicesCount: number;

  @ApiProperty({ example: 32 })
  paidInvoicesCount: number;

  @ApiProperty({ example: '91.3%' })
  collectionRate: string;
}

export class PropertyBreakdownDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'Nhà trọ Cầu Giấy' })
  name: string;

  @ApiProperty({ example: '123 Cầu Giấy, Dịch Vọng, Hà Nội' })
  address: string;

  @ApiProperty({ example: 20 })
  totalRooms: number;

  @ApiProperty({ example: 18 })
  occupiedRooms: number;

  @ApiProperty({ example: 2 })
  vacantRooms: number;

  @ApiProperty({ example: '90.0%' })
  occupancyRate: string;

  @ApiProperty({ example: '58,000,000' })
  currentMonthRevenue: string;

  @ApiProperty({ example: '8,000,000' })
  currentMonthExpenses: string;

  @ApiProperty({ example: '50,000,000' })
  netProfit: string;

  @ApiProperty({ example: '4,000,000' })
  unpaidDebt: string;

  @ApiProperty({ example: 1 })
  unpaidInvoicesCount: number;

  @ApiProperty({ example: 2 })
  expiringContractsCount: number;
}

export class MonthlyChartPointDto {
  @ApiProperty({ example: '09/26' })
  month: string;

  @ApiProperty({ example: 125.5 })
  val: number; // in millions VND

  @ApiProperty({ example: '125,500,000' })
  fullAmount: string;
}

export class MonthlyOccupancyPointDto {
  @ApiProperty({ example: '09/26' })
  month: string;

  @ApiProperty({ example: 84 })
  occupied: number; // percentage

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 38 })
  count: number;
}

export class MultiPropertyExpiringContractDto {
  @ApiProperty({ example: 'c1' })
  id: string;

  @ApiProperty({ example: 'Nhà trọ Cầu Giấy' })
  propertyName: string;

  @ApiProperty({ example: 'P.201' })
  room: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  tenant: string;

  @ApiProperty({ example: '0901234567' })
  phone: string;

  @ApiProperty({ example: 12 })
  daysLeft: number;

  @ApiProperty({ example: '24/09/2026' })
  endDate: string;
}

export class MultiPropertyOverviewResponseDto {
  @ApiProperty({ type: PortfolioSummaryDto })
  portfolioSummary: PortfolioSummaryDto;

  @ApiProperty({ type: [PropertyBreakdownDto] })
  propertiesBreakdown: PropertyBreakdownDto[];

  @ApiProperty({ type: [MonthlyChartPointDto] })
  revenueChart: MonthlyChartPointDto[];

  @ApiProperty({ type: [MonthlyOccupancyPointDto] })
  occupancyChart: MonthlyOccupancyPointDto[];

  @ApiProperty({ type: [MultiPropertyExpiringContractDto] })
  expiringContracts: MultiPropertyExpiringContractDto[];
}
