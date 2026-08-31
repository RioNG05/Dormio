import { ApiProperty } from '@nestjs/swagger';

export class InvoiceItemDetailDto {
  @ApiProperty({ example: 'Tiền phòng', description: 'Tên mục chi phí / dịch vụ' })
  name: string;

  @ApiProperty({ example: 4500000, description: 'Số tiền tính cho mục này (VNĐ)' })
  value: number;

  @ApiProperty({ example: 1, description: 'Số lượng sử dụng / định lượng' })
  quantity: number;

  @ApiProperty({ example: 'tháng', description: 'Đơn vị tính' })
  unit: string;

  @ApiProperty({ example: 4500000, description: 'Đơn giá (VNĐ)' })
  unitPrice: number;

  @ApiProperty({ example: false, description: 'Có phải dịch vụ đồng hồ đo (điện/nước) hay không' })
  isMetered: boolean;
}

export class MeterReadingSummaryDto {
  @ApiProperty({ example: 'srv-uuid-1', description: 'Mã dịch vụ đồng hồ' })
  serviceId: string;

  @ApiProperty({ example: 'Điện sinh hoạt', description: 'Tên dịch vụ' })
  serviceName: string;

  @ApiProperty({ example: 'kWh', description: 'Đơn vị tính' })
  unit: string;

  @ApiProperty({ example: 1250, description: 'Chỉ số ghi nhận' })
  readingValue: number | null;

  @ApiProperty({ example: 'https://images.unsplash.com/...', nullable: true, description: 'Ảnh chụp mặt đồng hồ' })
  imageUrl: string | null;

  @ApiProperty({ example: '2026-08-31T15:00:00.000Z', description: 'Thời điểm ghi chỉ số' })
  recordedAt: string;
}

export class TenantInvoiceDto {
  @ApiProperty({ example: 'inv-uuid-1', description: 'Mã định danh hóa đơn' })
  id: string;

  @ApiProperty({ example: 'Tháng 09/2026', description: 'Kỳ thanh toán hiển thị' })
  period: string;

  @ApiProperty({ example: 5200000, description: 'Tổng số tiền phải thanh toán (VNĐ)' })
  amount: number;

  @ApiProperty({ enum: ['paid', 'unpaid', 'overdue'], example: 'unpaid', description: 'Trạng thái hóa đơn' })
  status: 'paid' | 'unpaid' | 'overdue';

  @ApiProperty({ example: '2026-09-05T00:00:00.000Z', description: 'Hạn chót thanh toán' })
  dueDate: string;

  @ApiProperty({ example: '2026-08-31T10:00:00.000Z', description: 'Ngày tạo hóa đơn' })
  createdDate: string;

  @ApiProperty({ example: null, nullable: true, description: 'Ngày đã thanh toán' })
  paidDate: string | null;

  @ApiProperty({ type: [InvoiceItemDetailDto], description: 'Chi tiết từng khoản trong hóa đơn' })
  details: InvoiceItemDetailDto[];

  @ApiProperty({ type: [MeterReadingSummaryDto], description: 'Các chỉ số điện nước đính kèm hóa đơn' })
  meterReadings: MeterReadingSummaryDto[];
}

export class TenantInvoicesListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [TenantInvoiceDto] })
  data: TenantInvoiceDto[];
}
