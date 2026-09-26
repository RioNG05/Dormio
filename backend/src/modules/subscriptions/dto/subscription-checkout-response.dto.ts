import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscriptionCheckoutResponseDto {
  @ApiProperty({
    example: 1727289123456,
    description: 'The unique numeric order code generated for payOS',
  })
  orderCode: number;

  @ApiProperty({
    example: 'link-abc-123',
    description: 'The payOS payment link ID',
  })
  paymentLinkId: string;

  @ApiProperty({
    example: 'https://pay.payos.vn/web/...',
    description: 'The checkout URL',
  })
  checkoutUrl: string;

  @ApiProperty({
    example: '00020101021238570010A000000727...',
    description: 'VietQR string or image URL for direct in-page display',
  })
  qrCode: string;

  @ApiProperty({
    example: '0912345678',
    description: 'Beneficiary account number',
  })
  accountNumber: string;

  @ApiProperty({
    example: 'DORMIO MANAGEMENT',
    description: 'Beneficiary account name',
  })
  accountName: string;

  @ApiProperty({
    example: '970422',
    description: 'Beneficiary bank code (BIN)',
  })
  bin: string;

  @ApiProperty({
    example: 150000,
    description: 'Total amount in VND',
  })
  amount: number;

  @ApiProperty({
    example: 'DORMIO SUB PLUS 1042',
    description: 'Transfer description content',
  })
  description: string;

  @ApiProperty({
    example: 900,
    description: 'Seconds until the QR code / payment link expires',
  })
  expiresIn: number;

  @ApiProperty({
    example: '2026-10-01T00:00:00.000Z',
    description: 'Calculated subscription start date',
  })
  startDate: string;

  @ApiProperty({
    example: '2026-10-31T23:59:59.000Z',
    description: 'Calculated subscription end date',
  })
  endDate: string;

  @ApiProperty({
    example: 'plus',
    description: 'The subscription package',
  })
  planName: string;

  @ApiProperty({
    example: 'monthly',
    description: 'The chosen billing cycle',
  })
  billingCycle: string;

  @ApiPropertyOptional({
    example: false,
    description: 'True if returning an existing pending QR session (idempotent reuse)',
  })
  isReused?: boolean;
}
