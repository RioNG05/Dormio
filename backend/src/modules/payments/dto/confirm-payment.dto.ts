import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';

export enum PaymentMethodEnum {
  banking = 'banking',
  cash = 'cash',
}

export class ConfirmPaymentDto {
  @ApiProperty({
    example: 'inv-uuid-1',
    description: 'Mã định danh hóa đơn thanh toán (UUID)',
  })
  @IsNotEmpty({ message: 'Mã hóa đơn không được để trống' })
  @IsUUID('4', { message: 'Mã hóa đơn phải là UUID hợp lệ' })
  invoiceId: string;

  @ApiPropertyOptional({
    example: 5200000,
    description: 'Số tiền thực tế thanh toán (VNĐ)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Số tiền phải là số' })
  @Min(1000, { message: 'Số tiền tối thiểu là 1.000 VNĐ' })
  amount?: number;

  @ApiPropertyOptional({
    example: 'MB9823471029',
    description: 'Mã tham chiếu giao dịch ngân hàng',
  })
  @IsOptional()
  @IsString({ message: 'Mã giao dịch phải là chuỗi ký tự' })
  transactionRef?: string;

  @ApiPropertyOptional({
    enum: PaymentMethodEnum,
    default: PaymentMethodEnum.banking,
    description: 'Phương thức thanh toán (banking, cash)',
  })
  @IsOptional()
  @IsEnum(PaymentMethodEnum, {
    message: 'Phương thức thanh toán phải là banking hoặc cash',
  })
  method?: PaymentMethodEnum;
}

export class VietQrWebhookDto {
  @ApiProperty({
    example: 'MB9823471029',
    description: 'Mã giao dịch ngân hàng',
  })
  @IsNotEmpty({ message: 'transactionRef không được để trống' })
  @IsString()
  transactionRef: string;

  @ApiProperty({
    example: 5200000,
    description: 'Số tiền giao dịch thực tế',
  })
  @IsNotEmpty({ message: 'amount không được để trống' })
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'TT TRO P101 T09/2026',
    description: 'Nội dung chuyển khoản (chứa cú pháp nhận diện hóa đơn/phòng)',
  })
  @IsNotEmpty({ message: 'transferContent không được để trống' })
  @IsString()
  transferContent: string;

  @ApiPropertyOptional({
    example: '970422',
    description: 'Mã ngân hàng thực hiện',
  })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({
    example: '2026-09-01T08:30:00.000Z',
    description: 'Thời gian giao dịch từ ngân hàng',
  })
  @IsOptional()
  @IsString()
  transactionDate?: string;
}

export class PaymentExecutionResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'pay-uuid-1', description: 'Mã thanh toán (Payment ID)' })
  paymentId: string;

  @ApiProperty({ example: 'inv-uuid-1', description: 'Mã hóa đơn' })
  invoiceId: string;

  @ApiProperty({
    example: 'REC-202609-001',
    description: 'Số biên nhận điện tử',
  })
  receiptNumber: string;

  @ApiProperty({
    example: 'paid',
    description: 'Trạng thái hóa đơn sau khi thanh toán',
  })
  invoiceStatus: string;

  @ApiProperty({
    example: '2026-09-01T08:30:00.000Z',
    description: 'Thời điểm thanh toán',
  })
  paidAt: string;

  @ApiProperty({
    example: 'Thanh toán hóa đơn thành công',
    description: 'Thông báo kết quả',
  })
  message: string;
}
