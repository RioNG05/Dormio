import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';
import { PaginationMetaDto } from './landlord-invoices-response.dto';

export class DebtInvoiceSummaryDto {
  @ApiProperty({ description: 'Invoice UUID' })
  id: string;

  @ApiProperty({ description: 'Billing cycle period', example: '08/2026' })
  period: string;

  @ApiProperty({ description: 'Total invoice amount in VND', example: 3850000 })
  totalAmount: number;

  @ApiProperty({ description: 'Invoice payment status', enum: ['unpaid', 'overdue'] })
  status: 'unpaid' | 'overdue';

  @ApiProperty({ description: 'Due date string' })
  dueDate: string;

  @ApiProperty({ description: 'Number of aging days since due date (0 if not yet due)', example: 12 })
  agingDays: number;
}

export class RoomDebtTenantDto {
  @ApiProperty({ description: 'Tenant user UUID' })
  id: string;

  @ApiProperty({ description: 'Tenant full name', example: 'Nguyễn Văn Tuấn' })
  name: string;

  @ApiProperty({ description: 'Tenant phone number', example: '0912345678' })
  phone: string;

  @ApiPropertyOptional({ description: 'Tenant email', example: 'tuan@example.com' })
  email?: string;
}

export class RoomDebtItemDto {
  @ApiProperty({ description: 'Room UUID' })
  roomId: string;

  @ApiProperty({ description: 'Room number / name', example: 'P102' })
  roomNumber: string;

  @ApiPropertyOptional({ description: 'Floor number', example: 1, nullable: true })
  floor: number | null;

  @ApiProperty({ description: 'Boarding house name', example: 'Dormio Tân Bình' })
  buildingName: string;

  @ApiPropertyOptional({ description: 'Primary tenant details', type: RoomDebtTenantDto, nullable: true })
  tenant: RoomDebtTenantDto | null;

  @ApiPropertyOptional({ description: 'Active contract UUID', nullable: true })
  contractId: string | null;

  @ApiProperty({ description: 'Total outstanding debt amount in VND', example: 7500000 })
  totalDebtAmount: number;

  @ApiProperty({ description: 'Amount still within grace period / unpaid not overdue', example: 3500000 })
  unpaidAmount: number;

  @ApiProperty({ description: 'Amount overdue past due date', example: 4000000 })
  overdueAmount: number;

  @ApiProperty({ description: 'Oldest unpaid invoice due date string' })
  oldestDueDate: string;

  @ApiProperty({ description: 'Maximum overdue aging in days (0 if not yet overdue)', example: 42 })
  maxAgingDays: number;

  @ApiProperty({
    description: 'Debt duration bracket category',
    enum: ['current', '1_month', '2_months', 'bad_debt'],
    example: '2_months',
  })
  agingCategory: 'current' | '1_month' | '2_months' | 'bad_debt';

  @ApiProperty({ description: 'Count of pending invoices for this room', example: 2 })
  invoicesCount: number;

  @ApiProperty({ description: 'List of unpaid or overdue invoices', type: [DebtInvoiceSummaryDto] })
  invoices: DebtInvoiceSummaryDto[];
}

export class DebtsAgingDistributionDto {
  @ApiProperty({ description: 'Count of rooms with debt <= 30 days', example: 3 })
  under30Days: number;

  @ApiProperty({ description: 'Total debt amount <= 30 days in VND', example: 10500000 })
  under30DaysAmount: number;

  @ApiProperty({ description: 'Count of rooms with debt 31-60 days', example: 1 })
  from31To60Days: number;

  @ApiProperty({ description: 'Total debt amount 31-60 days in VND', example: 4500000 })
  from31To60DaysAmount: number;

  @ApiProperty({ description: 'Count of rooms with bad debt > 60 days', example: 1 })
  over60Days: number;

  @ApiProperty({ description: 'Total bad debt amount > 60 days in VND', example: 8200000 })
  over60DaysAmount: number;
}

export class LandlordDebtsSummaryDto {
  @ApiProperty({ description: 'Total outstanding debt in VND across all rooms', example: 23200000 })
  totalDebtAmount: number;

  @ApiProperty({ description: 'Total overdue debt in VND', example: 12700000 })
  overdueDebtAmount: number;

  @ApiProperty({ description: 'Total bad debt (3+ months / >60 days overdue) in VND', example: 8200000 })
  badDebtAmount: number;

  @ApiProperty({ description: 'Number of distinct rooms with debt', example: 5 })
  debtorRoomsCount: number;

  @ApiProperty({ description: 'Total count of unpaid/overdue invoices', example: 8 })
  totalInvoicesCount: number;

  @ApiProperty({ description: 'Aging bracket breakdown', type: DebtsAgingDistributionDto })
  agingDistribution: DebtsAgingDistributionDto;
}

export class LandlordDebtsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [RoomDebtItemDto] })
  data: RoomDebtItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;

  @ApiProperty({ type: LandlordDebtsSummaryDto })
  summary: LandlordDebtsSummaryDto;
}

export class SendDebtReminderDto {
  @ApiProperty({ description: 'Room UUID to send debt reminder for', example: 'ce81baea-5efc-4e89-9cb1-ef0db32e011b' })
  @IsUUID('4')
  roomId: string;

  @ApiPropertyOptional({ description: 'Optional custom note/memo from landlord', example: 'Vui lòng thanh toán trước ngày 25 để tránh phạt chậm.' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class DebtReminderResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Đã gửi thông báo nhắc nợ thành công' })
  message: string;

  @ApiProperty({ example: 'Nguyễn Văn Tuấn' })
  tenantName: string;

  @ApiProperty({ example: '0912345678' })
  tenantPhone: string;

  @ApiProperty({ example: 'P102' })
  roomNumber: string;

  @ApiProperty({ example: 7500000 })
  totalDebtAmount: number;

  @ApiProperty({ description: 'Ready-to-copy reminder message for Zalo or SMS' })
  reminderText: string;
}
