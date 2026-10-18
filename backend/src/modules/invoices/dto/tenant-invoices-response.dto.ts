import { ApiProperty } from '@nestjs/swagger'

export class InvoiceItemDetailDto {
  @ApiProperty({ example: 'Room rent', description: 'Cost item / service name' })
  name: string

  @ApiProperty({ example: 4500000, description: 'Calculated item amount in VND' })
  value: number

  @ApiProperty({ example: 1, description: 'Usage quantity / metric' })
  quantity: number

  @ApiProperty({ example: 'month', description: 'Unit of measure' })
  unit: string

  @ApiProperty({ example: 4500000, description: 'Unit price in VND' })
  unitPrice: number

  @ApiProperty({ example: false, description: 'Whether this is a metered utility service' })
  isMetered: boolean
}

export class MeterReadingSummaryDto {
  @ApiProperty({ example: 'srv-uuid-1', description: 'Metered service UUID' })
  serviceId: string

  @ApiProperty({ example: 'Electricity', description: 'Service name' })
  serviceName: string

  @ApiProperty({ example: 'kWh', description: 'Unit' })
  unit: string

  @ApiProperty({ example: 1250, description: 'Recorded reading value' })
  readingValue: number | null

  @ApiProperty({
    example: 'https://images.unsplash.com/...',
    nullable: true,
    description: 'Meter dial photo URL',
  })
  imageUrl: string | null

  @ApiProperty({ example: '2026-08-31T15:00:00.000Z', description: 'Reading recording timestamp' })
  recordedAt: string
}

export class TenantInvoiceDto {
  @ApiProperty({ example: 'inv-uuid-1', description: 'Invoice UUID' })
  id: string

  @ApiProperty({ example: 'Month 09/2026', description: 'Display billing period' })
  period: string

  @ApiProperty({ example: 5200000, description: 'Total payable amount in VND' })
  amount: number

  @ApiProperty({
    enum: ['paid', 'unpaid', 'overdue'],
    example: 'unpaid',
    description: 'Invoice payment status',
  })
  status: 'paid' | 'unpaid' | 'overdue'

  @ApiProperty({ example: '2026-09-05T00:00:00.000Z', description: 'Payment deadline' })
  dueDate: string

  @ApiProperty({ example: '2026-08-31T10:00:00.000Z', description: 'Invoice creation date' })
  createdDate: string

  @ApiProperty({ example: null, nullable: true, description: 'Settlement date' })
  paidDate: string | null

  @ApiProperty({ type: [InvoiceItemDetailDto], description: 'Detailed line items in invoice' })
  details: InvoiceItemDetailDto[]

  @ApiProperty({
    type: [MeterReadingSummaryDto],
    description: 'Attached utility meter readings',
  })
  meterReadings: MeterReadingSummaryDto[]
}

export class TenantInvoicesListResponseDto {
  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ type: [TenantInvoiceDto] })
  data: TenantInvoiceDto[]
}
