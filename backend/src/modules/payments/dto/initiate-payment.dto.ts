import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({
    example: 'inv-uuid-1',
    description: 'Mã định danh hóa đơn cần thanh toán (UUID)',
  })
  @IsNotEmpty({ message: 'Mã hóa đơn không được để trống' })
  @IsUUID('4', { message: 'Mã hóa đơn phải là UUID hợp lệ' })
  invoiceId: string;
}

export class VietQrPaymentInstructionDto {
  @ApiProperty({ example: 'inv-uuid-1', description: 'Mã hóa đơn' })
  invoiceId: string;

  @ApiProperty({ example: 5200000, description: 'Số tiền cố định (VNĐ)' })
  amount: number;

  @ApiProperty({ example: '970422', description: 'Mã định danh ngân hàng' })
  bankCode: string;

  @ApiProperty({
    example: 'MB Bank (Quân Đội)',
    description: 'Tên ngân hàng thụ hưởng',
  })
  bankName: string;

  @ApiProperty({
    example: '0912345678',
    description: 'Số tài khoản người thụ hưởng',
  })
  accountNumber: string;

  @ApiProperty({
    example: 'DORMIO MANAGEMENT',
    description: 'Tên chủ tài khoản thụ hưởng',
  })
  accountName: string;

  @ApiProperty({
    example: 'TT TRO P101 T09/2026',
    description: 'Cú pháp nội dung chuyển khoản bắt buộc',
  })
  transferSyntax: string;

  @ApiProperty({
    example:
      'https://api.vietqr.io/image/970422-0912345678-compact2.png?amount=5200000&addInfo=TT%20TRO%20P101%20T09/2026',
    description: 'Đường dẫn ảnh mã VietQR đã khóa số tiền',
  })
  qrCodeUrl: string;

  @ApiProperty({
    example: 'T09/2026',
    description: 'Kỳ thanh toán',
  })
  period: string;

  @ApiProperty({
    example: '101',
    description: 'Số phòng',
  })
  roomNumber: string;

  @ApiProperty({
    example: 'Dormio Tân Bình',
    description: 'Tên nhà trọ',
  })
  boardingHouseName: string;

  @ApiProperty({
    example: '2026-09-05T00:00:00.000Z',
    description: 'Hạn thanh toán hóa đơn',
  })
  dueDate: string;
}
