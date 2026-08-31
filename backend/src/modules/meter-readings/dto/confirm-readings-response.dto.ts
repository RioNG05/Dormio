import { ApiProperty } from '@nestjs/swagger';

export class InvoiceItemResponseDto {
  @ApiProperty({ example: 'item-uuid' })
  id: string;

  @ApiProperty({ example: 'Tiền phòng', nullable: true })
  title: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 3500000 })
  unitPrice: number;

  @ApiProperty({ example: 3500000 })
  amount: number;
}

export class ConfirmReadingsResponseDto {
  @ApiProperty({ example: 'inv-uuid' })
  invoiceId: string;

  @ApiProperty({ example: 'unpaid' })
  status: string;

  @ApiProperty({ example: 4250000 })
  totalAmount: number;

  @ApiProperty({ example: '2026-09-05T00:00:00.000Z' })
  dueDate: string;

  @ApiProperty({ example: 'r1-uuid' })
  roomId: string;

  @ApiProperty({ example: 'c1-uuid' })
  contractId: string;

  @ApiProperty({ type: [InvoiceItemResponseDto] })
  items: InvoiceItemResponseDto[];

  @ApiProperty({
    example:
      '00020101021238580010A0000007270126000697042201121234567890520400005303704540742500005802VN62170813DORMIO_INV1236304ABCD',
    description: 'Pre-generated locked-amount VietQR payload',
  })
  vietQrPayload: string;
}
