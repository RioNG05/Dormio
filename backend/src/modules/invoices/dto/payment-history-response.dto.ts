import { ApiProperty } from '@nestjs/swagger';

export class PaymentBreakdownItemDto {
  @ApiProperty({
    example: 'Tiền thuê phòng',
    description: 'Tên khoản phí / dịch vụ',
  })
  label: string;

  @ApiProperty({
    example: 4500000,
    description: 'Thành tiền của khoản mục (VNĐ)',
  })
  amount: number;

  @ApiProperty({
    example: 1,
    description: 'Số lượng / sản lượng sử dụng',
  })
  quantity: number;

  @ApiProperty({
    example: 4500000,
    description: 'Đơn giá tương ứng (VNĐ)',
  })
  unitPrice: number;

  @ApiProperty({
    example: 'room',
    description: 'Phân loại dịch vụ (room, electricity, water, other)',
  })
  type: string;
}

export class PaymentHistoryRecordDto {
  @ApiProperty({ example: 'inv-uuid-1', description: 'Mã hóa đơn / giao dịch' })
  id: string;

  @ApiProperty({
    enum: ['monthly_invoice', 'upfront_rent'],
    example: 'monthly_invoice',
    description: 'Nguồn phát sinh khoản thanh toán',
  })
  source: 'monthly_invoice' | 'upfront_rent';

  @ApiProperty({
    example: 'contract-uuid-1',
    nullable: true,
    description: 'Mã hợp đồng thuê liên quan',
  })
  contractId: string | null;

  @ApiProperty({
    example: 'Dormio Tân Bình',
    description: 'Tên nhà trọ',
  })
  boardingHouseName: string;

  @ApiProperty({
    example: '101',
    description: 'Số phòng',
  })
  roomNumber: string;

  @ApiProperty({
    example: 5200000,
    description: 'Tổng số tiền thanh toán (VNĐ)',
  })
  totalAmount: number;

  @ApiProperty({
    example: '2026-08-30T10:15:00.000Z',
    nullable: true,
    description: 'Thời điểm thanh toán thành công (null nếu chưa thanh toán)',
  })
  paidAt: string | null;

  @ApiProperty({
    example: '2026-09-05T00:00:00.000Z',
    description: 'Hạn thanh toán',
  })
  dueDate: string;

  @ApiProperty({
    example: 'T08/2026',
    description: 'Kỳ thanh toán (tháng/năm)',
  })
  period: string;

  @ApiProperty({
    enum: ['paid', 'unpaid', 'overdue', 'pending', 'success', 'failed'],
    example: 'paid',
    description: 'Trạng thái thanh toán',
  })
  status: string;

  @ApiProperty({
    enum: ['cash', 'banking'],
    nullable: true,
    example: 'banking',
    description: 'Hình thức thanh toán (chuyển khoản / tiền mặt)',
  })
  paymentMethod: 'cash' | 'banking' | null;

  @ApiProperty({
    example: 'MB123456789',
    nullable: true,
    description: 'Mã tham chiếu ngân hàng / giao dịch',
  })
  transactionRef: string | null;

  @ApiProperty({
    example: 'REC-202608-001',
    nullable: true,
    description: 'Số biên nhận / phiếu thu',
  })
  receiptNumber: string | null;

  @ApiProperty({
    example: 'https://img.vietqr.io/image/970422-0912345678-compact2.png',
    nullable: true,
    description: 'Mã QR thanh toán VietQR',
  })
  qrCodeUrl: string | null;

  @ApiProperty({
    type: [PaymentBreakdownItemDto],
    description: 'Bảng chi tiết các khoản mục trong hóa đơn',
  })
  breakdown: PaymentBreakdownItemDto[];

  @ApiProperty({
    example: '2026-08-25T00:00:00.000Z',
    description: 'Ngày tạo hóa đơn',
  })
  createdAt: string;
}

export class PaymentHistorySummaryDto {
  @ApiProperty({
    example: 15600000,
    description: 'Tổng số tiền đã thanh toán từ trước đến nay (VNĐ)',
  })
  totalPaidAmount: number;

  @ApiProperty({
    example: 5200000,
    description: 'Tổng số tiền đang chờ hoặc quá hạn thanh toán (VNĐ)',
  })
  totalPendingAmount: number;

  @ApiProperty({
    example: 6,
    description: 'Tổng số lượt giao dịch / hóa đơn',
  })
  totalTransactions: number;

  @ApiProperty({
    example: '2026-08-30T10:15:00.000Z',
    nullable: true,
    description: 'Thời điểm thanh toán giao dịch gần nhất',
  })
  lastPaymentDate: string | null;
}

export class PaymentHistoryResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: PaymentHistorySummaryDto })
  summary: PaymentHistorySummaryDto;

  @ApiProperty({ type: [PaymentHistoryRecordDto] })
  data: PaymentHistoryRecordDto[];
}
