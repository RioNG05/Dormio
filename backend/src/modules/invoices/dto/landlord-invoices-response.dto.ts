import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceFeeBreakdownDto {
  @ApiProperty({ description: 'Name of the service', example: 'WiFi' })
  name: string;

  @ApiProperty({ description: 'Amount in VND', example: 100000 })
  amount: number;
}

export class LandlordMeterReadingDto {
  @ApiProperty({ description: 'Service ID (UUID)' })
  serviceId: string;

  @ApiProperty({ description: 'Service name (e.g. Điện, Nước)' })
  serviceName: string;

  @ApiProperty({ description: 'Unit (kWh, m³)' })
  unit: string;

  @ApiPropertyOptional({ description: 'Reading numerical value', nullable: true })
  readingValue: number | null;

  @ApiPropertyOptional({ description: 'Dial photo URL', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ description: 'Recorded ISO date string' })
  recordedAt: string;
}

export class LandlordInvoiceItemDto {
  @ApiProperty({ description: 'Invoice ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Room ID (UUID)' })
  roomId: string;

  @ApiProperty({ description: 'Room name / number', example: 'P101' })
  roomName: string;

  @ApiProperty({ description: 'Boarding house name', example: 'Dormio Tân Bình' })
  buildingName: string;

  @ApiProperty({ description: 'Tenant full name', example: 'Nguyễn Văn Tuấn' })
  tenantName: string;

  @ApiProperty({ description: 'Tenant phone number', example: '0912345678' })
  tenantPhone: string;

  @ApiProperty({ description: 'Billing cycle period', example: '08/2026' })
  period: string;

  @ApiProperty({ description: 'Base room rent amount', example: 3500000 })
  rentAmount: number;

  @ApiProperty({ description: 'Previous electricity index', example: 1318 })
  elecOld: number;

  @ApiProperty({ description: 'Current electricity index', example: 1418 })
  elecNew: number;

  @ApiProperty({ description: 'Electricity unit price VND/kWh', example: 3500 })
  elecRate: number;

  @ApiProperty({ description: 'Previous water index', example: 240 })
  waterOld: number;

  @ApiProperty({ description: 'Current water index', example: 252 })
  waterNew: number;

  @ApiProperty({ description: 'Water unit price VND/m³', example: 15000 })
  waterRate: number;

  @ApiProperty({
    description: 'Flat services breakdown',
    type: [ServiceFeeBreakdownDto],
  })
  serviceFees: ServiceFeeBreakdownDto[];

  @ApiProperty({ description: 'Discount amount', example: 0 })
  discount: number;

  @ApiProperty({ description: 'Total invoice amount in VND', example: 4030000 })
  totalAmount: number;

  @ApiProperty({ description: 'Payment deadline (formatted or ISO)', example: '2026-08-20T00:00:00.000Z' })
  deadline: string;

  @ApiProperty({
    description: 'Status label in Vietnamese for direct UI rendering',
    enum: ['Đã thu', 'Chưa thu', 'Quá hạn'],
    example: 'Chưa thu',
  })
  status: 'Đã thu' | 'Chưa thu' | 'Quá hạn';

  @ApiProperty({
    description: 'Raw system status code',
    enum: ['paid', 'unpaid', 'overdue', 'cancelled'],
    example: 'unpaid',
  })
  rawStatus: 'paid' | 'unpaid' | 'overdue' | 'cancelled';

  @ApiProperty({ description: 'Creation ISO timestamp' })
  createdAt: string;

  @ApiPropertyOptional({ description: 'Settlement timestamp if paid', nullable: true })
  paidAt?: string;

  @ApiPropertyOptional({ description: 'Payment method used', nullable: true })
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'VietQR image URL with locked amount', nullable: true })
  vietQrUrl?: string;

  @ApiPropertyOptional({ description: 'Primary meter reading photo for proof', nullable: true })
  ocrMeterImage?: string;

  @ApiPropertyOptional({
    description: 'All attached meter readings for this cycle',
    type: [LandlordMeterReadingDto],
  })
  meterReadings?: LandlordMeterReadingDto[];
}

export class LandlordInvoicesSummaryDto {
  @ApiProperty({ description: 'Total invoices count for period', example: 12 })
  totalInvoicesCount: number;

  @ApiProperty({ description: 'Paid invoices count', example: 8 })
  paidCount: number;

  @ApiProperty({ description: 'Unpaid invoices count', example: 3 })
  unpaidCount: number;

  @ApiProperty({ description: 'Overdue invoices count', example: 1 })
  overdueCount: number;

  @ApiProperty({ description: 'Total collected amount in VND', example: 28500000 })
  totalPaidAmount: number;

  @ApiProperty({ description: 'Total pending receivables amount in VND', example: 9800000 })
  totalUnpaidAmount: number;
}

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total matching records', example: 45 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Records per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total available pages', example: 5 })
  totalPages: number;
}

export class LandlordInvoicesListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [LandlordInvoiceItemDto] })
  data: LandlordInvoiceItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;

  @ApiProperty({ type: LandlordInvoicesSummaryDto })
  summary: LandlordInvoicesSummaryDto;
}
