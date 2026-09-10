import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentMeterReadingDto {
  @ApiProperty({ example: 'mr-uuid-1', description: 'Mã định danh bản ghi chỉ số' })
  id: string;

  @ApiProperty({ example: 'srv-uuid-1', description: 'Mã dịch vụ' })
  serviceId: string;

  @ApiProperty({ example: 'Điện', description: 'Tên dịch vụ đo lường' })
  serviceName: string;

  @ApiProperty({ example: 1250, description: 'Chỉ số đo được' })
  readingValue: number;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/dormio/meter-reading.jpg',
    description: 'URL ảnh chụp công tơ thực tế làm bằng chứng thanh toán',
  })
  imageUrl?: string | null;

  @ApiProperty({ example: '2026-09-01T08:00:00Z', description: 'Thời điểm ghi chỉ số' })
  createdAt: string;
}

export class PaymentInvoiceItemDto {
  @ApiProperty({ example: 'item-uuid-1', description: 'Mã định danh mục hóa đơn' })
  id: string;

  @ApiPropertyOptional({ example: 'srv-uuid-1', description: 'Mã dịch vụ liên kết' })
  serviceId?: string | null;

  @ApiProperty({ example: 'Tiền phòng', description: 'Tên mục hoặc dịch vụ' })
  serviceName: string;

  @ApiProperty({ example: 1, description: 'Số lượng / sản lượng' })
  quantity: number;

  @ApiProperty({ example: 3500000, description: 'Đơn giá (VNĐ)' })
  unitPrice: number;

  @ApiProperty({ example: 3500000, description: 'Thành tiền (VNĐ)' })
  amount: number;
}

export class LandlordPaymentItemDto {
  @ApiProperty({ example: 'pay-uuid-1', description: 'Mã định danh thanh toán (UUID)' })
  id: string;

  @ApiPropertyOptional({ example: 'REC-202609-1029', description: 'Số biên nhận điện tử' })
  receiptNumber?: string | null;

  @ApiPropertyOptional({ example: 'TXN-VQR-1725840000-123', description: 'Mã tham chiếu giao dịch ngân hàng / VietQR' })
  transactionRef?: string | null;

  @ApiProperty({ example: 3850000, description: 'Số tiền thanh toán thực tế (VNĐ)' })
  amount: number;

  @ApiProperty({ example: 'banking', description: 'Hình thức thanh toán: banking (VietQR) hoặc cash (Tiền mặt)' })
  method: string;

  @ApiProperty({ example: 'success', description: 'Trạng thái giao dịch: success, pending, failed' })
  status: string;

  @ApiProperty({ example: '2026-09-05T14:30:00Z', description: 'Thời gian thanh toán ghi nhận' })
  paidAt: string;

  @ApiPropertyOptional({ example: 'usr-uuid-1', description: 'Mã người thanh toán' })
  payerId?: string | null;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên người thanh toán' })
  payerName: string;

  @ApiPropertyOptional({ example: '0988123456', description: 'Số điện thoại người thanh toán' })
  payerPhone?: string | null;

  @ApiProperty({ example: 'inv-uuid-1', description: 'Mã hóa đơn liên quan' })
  invoiceId: string;

  @ApiProperty({ example: 'T09/2026', description: 'Kỳ hóa đơn' })
  period: string;

  @ApiProperty({ example: 3850000, description: 'Tổng tiền trên hóa đơn' })
  invoiceTotal: number;

  @ApiProperty({ example: 'room-uuid-1', description: 'Mã phòng' })
  roomId: string;

  @ApiProperty({ example: 'P.101', description: 'Tên hoặc số phòng' })
  roomNumber: string;

  @ApiPropertyOptional({ example: 'Phòng Studio Ban công', description: 'Tên loại phòng' })
  roomTypeName?: string | null;

  @ApiProperty({ type: [PaymentInvoiceItemDto], description: 'Chi tiết các mục chi phí trong hóa đơn' })
  items: PaymentInvoiceItemDto[];

  @ApiProperty({ type: [PaymentMeterReadingDto], description: 'Ảnh chụp và bằng chứng đồng hồ điện nước liên quan (UC-L-07)' })
  meterReadings: PaymentMeterReadingDto[];
}

export class LandlordPaymentsSummaryDto {
  @ApiProperty({ example: 15400000, description: 'Tổng doanh thu đã thu trong kỳ/bộ lọc (VNĐ)' })
  totalRevenue: number;

  @ApiProperty({ example: 4, description: 'Tổng số giao dịch thành công' })
  totalTransactions: number;

  @ApiProperty({ example: 11550000, description: 'Tổng tiền thu qua Ngân hàng / VietQR (VNĐ)' })
  bankingRevenue: number;

  @ApiProperty({ example: 3850000, description: 'Tổng tiền thu bằng tiền mặt (VNĐ)' })
  cashRevenue: number;
}

export class LandlordPaymentsPaginationDto {
  @ApiProperty({ example: 4, description: 'Tổng số bản ghi thỏa mãn điều kiện lọc' })
  total: number;

  @ApiProperty({ example: 1, description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ example: 10, description: 'Số bản ghi mỗi trang' })
  limit: number;

  @ApiProperty({ example: 1, description: 'Tổng số trang' })
  totalPages: number;
}

export class LandlordPaymentsResponseDto {
  @ApiProperty({ type: LandlordPaymentsSummaryDto, description: 'Tổng hợp thống kê thu chi' })
  summary: LandlordPaymentsSummaryDto;

  @ApiProperty({ type: LandlordPaymentsPaginationDto, description: 'Thông tin phân trang' })
  pagination: LandlordPaymentsPaginationDto;

  @ApiProperty({ type: [LandlordPaymentItemDto], description: 'Danh sách lịch sử thanh toán' })
  payments: LandlordPaymentItemDto[];
}
