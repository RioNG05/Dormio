import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'Invoice ID không được để trống' })
  @IsUUID()
  invoiceId: string;

  @IsNotEmpty({ message: 'Số tiền thanh toán không được để trống' })
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionCode?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
