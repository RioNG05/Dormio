import { ApiProperty } from '@nestjs/swagger'

export class PaymentBreakdownItemDto {
  @ApiProperty({
    example: 'Room rent',
    description: 'Service / fee item name',
  })
  label: string

  @ApiProperty({
    example: 4500000,
    description: 'Item total amount in VND',
  })
  amount: number

  @ApiProperty({
    example: 1,
    description: 'Quantity / consumption volume',
  })
  quantity: number

  @ApiProperty({
    example: 4500000,
    description: 'Unit price in VND',
  })
  unitPrice: number

  @ApiProperty({
    example: 'room',
    description: 'Service category (room, electricity, water, other)',
  })
  type: string
}

export class PaymentHistoryRecordDto {
  @ApiProperty({ example: 'inv-uuid-1', description: 'Invoice / transaction UUID' })
  id: string

  @ApiProperty({
    enum: ['monthly_invoice', 'upfront_rent'],
    example: 'monthly_invoice',
    description: 'Source of payment',
  })
  source: 'monthly_invoice' | 'upfront_rent'

  @ApiProperty({
    example: 'contract-uuid-1',
    nullable: true,
    description: 'Associated contract UUID',
  })
  contractId: string | null

  @ApiProperty({
    example: 'Dormio Tan Binh',
    description: 'Boarding house name',
  })
  boardingHouseName: string

  @ApiProperty({
    example: '101',
    description: 'Room number',
  })
  roomNumber: string

  @ApiProperty({
    example: 5200000,
    description: 'Total payment amount in VND',
  })
  totalAmount: number

  @ApiProperty({
    example: '2026-08-30T10:15:00.000Z',
    nullable: true,
    description: 'Payment settlement timestamp (null if unpaid)',
  })
  paidAt: string | null

  @ApiProperty({
    example: '2026-09-05T00:00:00.000Z',
    description: 'Payment due date',
  })
  dueDate: string

  @ApiProperty({
    example: 'T08/2026',
    description: 'Billing cycle period',
  })
  period: string

  @ApiProperty({
    enum: ['paid', 'unpaid', 'overdue', 'pending', 'success', 'failed'],
    example: 'paid',
    description: 'Payment status',
  })
  status: string

  @ApiProperty({
    enum: ['cash', 'banking'],
    nullable: true,
    example: 'banking',
    description: 'Payment method (banking / cash)',
  })
  paymentMethod: 'cash' | 'banking' | null

  @ApiProperty({
    example: 'MB123456789',
    nullable: true,
    description: 'Bank transaction reference',
  })
  transactionRef: string | null

  @ApiProperty({
    example: 'REC-202608-001',
    nullable: true,
    description: 'Receipt number',
  })
  receiptNumber: string | null

  @ApiProperty({
    example: 'https://img.vietqr.io/image/970422-0912345678-compact2.png',
    nullable: true,
    description: 'VietQR payment code URL',
  })
  qrCodeUrl: string | null

  @ApiProperty({
    type: [PaymentBreakdownItemDto],
    description: 'Detailed line items in invoice',
  })
  breakdown: PaymentBreakdownItemDto[]

  @ApiProperty({
    example: '2026-08-25T00:00:00.000Z',
    description: 'Invoice creation date',
  })
  createdAt: string
}

export class PaymentHistorySummaryDto {
  @ApiProperty({
    example: 15600000,
    description: 'Total amount paid to date in VND',
  })
  totalPaidAmount: number

  @ApiProperty({
    example: 5200000,
    description: 'Total pending or overdue amount in VND',
  })
  totalPendingAmount: number

  @ApiProperty({
    example: 6,
    description: 'Total transaction count',
  })
  totalTransactions: number

  @ApiProperty({
    example: '2026-08-30T10:15:00.000Z',
    nullable: true,
    description: 'Most recent payment date',
  })
  lastPaymentDate: string | null
}

export class PaymentHistoryResponseDto {
  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ type: PaymentHistorySummaryDto })
  summary: PaymentHistorySummaryDto

  @ApiProperty({ type: [PaymentHistoryRecordDto] })
  data: PaymentHistoryRecordDto[]
}
