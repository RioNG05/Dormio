import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OverviewRoomsDto {
  @ApiProperty({ example: 10 })
  totalRooms: number;

  @ApiProperty({ example: 8 })
  occupiedRooms: number;

  @ApiProperty({ example: 2 })
  vacantRooms: number;

  @ApiProperty({ example: 0 })
  depositRooms: number;

  @ApiProperty({ example: 0 })
  maintenanceRooms: number;

  @ApiProperty({ example: '80%' })
  occupancyRate: string;
}

export class OverviewFinancialDto {
  @ApiProperty({ example: '45000000.00' })
  currentMonthRevenue: string;

  @ApiProperty({ example: '0.00' })
  unpaidDebt: string;

  @ApiProperty({ example: 0 })
  unpaidInvoicesCount: number;

  @ApiProperty({ example: 6 })
  paidInvoicesCount: number;
}

export class OverviewRevenueMonthDto {
  @ApiProperty({ example: '08/26' })
  month: string;

  @ApiProperty({ example: 45 })
  val: number;

  @ApiProperty({ example: '45000000.00' })
  fullAmount: string;
}

export class OverviewDepositItemDto {
  @ApiProperty({ example: 'deposit-uuid' })
  id: string;

  @ApiProperty({ example: 'P101' })
  room: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  tenant: string;

  @ApiProperty({ example: 2000000 })
  amount: number;

  @ApiProperty({ example: '2026-08-25T10:00:00.000Z' })
  date: string;

  @ApiProperty({ example: 'Cọc giữ phòng' })
  type: string;

  @ApiProperty({ example: 'held' })
  status: string;
}

export class OverviewMaintenanceItemDto {
  @ApiProperty({ example: 'grievance-uuid' })
  id: string;

  @ApiProperty({ example: 'P201' })
  room: string;

  @ApiProperty({ example: 'Hỏng vòi nước' })
  issue: string;

  @ApiProperty({ example: 'high' })
  priority: string;

  @ApiProperty({ example: 'Tran Van B' })
  reporter: string;

  @ApiProperty({ example: '2026-08-25T14:30:00.000Z' })
  date: string;

  @ApiProperty({ example: 'pending' })
  status: string;
}

export class OverviewExpiringContractDto {
  @ApiProperty({ example: 'contract-uuid' })
  id: string;

  @ApiProperty({ example: 'P301' })
  room: string;

  @ApiProperty({ example: 'Le Thi C' })
  tenant: string;

  @ApiProperty({ example: '0987654321' })
  phone: string;

  @ApiProperty({ example: 15 })
  daysLeft: number;

  @ApiProperty({ example: '2026-09-15' })
  endDate: string;
}

export class BoardingHouseOverviewResponseDto {
  @ApiProperty({ type: OverviewRoomsDto })
  rooms: OverviewRoomsDto;

  @ApiProperty({ type: OverviewFinancialDto })
  financial: OverviewFinancialDto;

  @ApiProperty({ type: [OverviewRevenueMonthDto] })
  revenueChart: OverviewRevenueMonthDto[];

  @ApiProperty({ type: [OverviewDepositItemDto] })
  depositNotifications: OverviewDepositItemDto[];

  @ApiProperty({ type: [OverviewMaintenanceItemDto] })
  maintenanceRequests: OverviewMaintenanceItemDto[];

  @ApiProperty({ type: [OverviewExpiringContractDto] })
  expiringContracts: OverviewExpiringContractDto[];
}
