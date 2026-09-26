import { ApiProperty } from '@nestjs/swagger';

export class InvoicePayOsCheckoutResponseDto {
  @ApiProperty({
    example: 1727289123456,
    description: 'Mã số đơn hàng PayOS dạng số nguyên duy nhất',
  })
  orderCode: number;

  @ApiProperty({
    example: 'link-uuid-1',
    description: 'Mã liên kết thanh toán PayOS',
  })
  paymentLinkId: string;

  @ApiProperty({
    example: 'https://pay.payos.vn/web/...',
    description: 'Đường dẫn trang thanh toán PayOS',
  })
  checkoutUrl: string;

  @ApiProperty({
    example: 'https://api.vietqr.io/image/...',
    description: 'Mã QR hoặc ảnh VietQR để quét thanh toán',
  })
  qrCode: string;

  @ApiProperty({
    example: '0912345678',
    description: 'Số tài khoản thụ hưởng của hệ thống Dormio',
  })
  accountNumber: string;

  @ApiProperty({
    example: 'DORMIO MANAGEMENT',
    description: 'Tên chủ tài khoản thụ hưởng của hệ thống Dormio',
  })
  accountName: string;

  @ApiProperty({
    example: '970422',
    description: 'Mã BIN ngân hàng thụ hưởng (MB Bank)',
  })
  bin: string;

  @ApiProperty({
    example: 4500000,
    description: 'Số tiền thanh toán khóa cố định (VNĐ)',
  })
  amount: number;

  @ApiProperty({
    example: 'INV P101 T09/2026',
    description: 'Nội dung chuyển khoản khóa cố định',
  })
  description: string;

  @ApiProperty({
    example: 900,
    description: 'Thời gian tồn tại của mã QR tính theo giây (15 phút = 900s)',
  })
  expiresIn: number;

  @ApiProperty({
    example: 'inv-uuid-1',
    description: 'Mã định danh hóa đơn được thanh toán',
  })
  invoiceId: string;

  @ApiProperty({
    example: false,
    description: 'Cờ cho biết phiên thanh toán đang chờ trước đó có được tái sử dụng hay không',
    required: false,
  })
  isReused?: boolean;
}

export class InvoicePaymentStatusResponseDto {
  @ApiProperty({
    example: 1727289123456,
    description: 'Mã số đơn hàng PayOS',
  })
  orderCode: number;

  @ApiProperty({
    example: 'success',
    description: 'Trạng thái thanh toán (pending, success, failed, expired)',
  })
  status: string;

  @ApiProperty({
    example: true,
    description: 'True nếu đơn hàng đã được quyết toán thành công',
  })
  isPaid: boolean;

  @ApiProperty({
    example: 'inv-uuid-1',
    description: 'Mã định danh hóa đơn liên kết',
    required: false,
  })
  invoiceId?: string;

  @ApiProperty({
    example: '2026-09-25T16:00:00.000Z',
    description: 'Thời điểm thanh toán thành công',
    required: false,
  })
  paidAt?: string;
}
