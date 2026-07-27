import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

export interface VietQRResponse {
  invoiceId: string;
  invoiceCode: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  bankName: string;
  accountNo: string;
  accountName: string;
  memo: string;
  qrUrl: string;
}

export interface WebhookPayload {
  content?: string;
  transferAmount?: number;
  amount?: number;
  referenceCode?: string;
  transactionCode?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn cần thanh toán');
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod || 'VIETQR',
          transactionCode: dto.transactionCode || `TX-${Date.now()}`,
          note: dto.note,
        },
      });

      const currentPaid = Number(invoice.paidAmount || 0) + dto.amount;
      const total = Number(invoice.totalAmount);

      let newStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' = invoice.status;
      if (currentPaid >= total) {
        newStatus = 'PAID';
      } else if (currentPaid > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          paidAmount: currentPaid,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date() : null,
        },
      });

      return transaction;
    });
  }

  async getVietQR(invoiceId: string): Promise<VietQRResponse> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        house: true,
        room: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    const total = Number(invoice.totalAmount);
    const paid = Number(invoice.paidAmount || 0);
    const remaining = Math.max(0, total - paid);

    const bankBin = process.env.VIETQR_BANK_BIN || 'MB'; // MBBank default
    const accountNo = process.env.VIETQR_ACCOUNT_NO || '0902000002';
    const accountName = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN VAN CHU NHA';
    const memo = `DORMIO ${invoice.invoiceCode}`;

    // Standard VietQR URL encoding
    const encodedMemo = encodeURIComponent(memo);
    const encodedName = encodeURIComponent(accountName);
    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${remaining}&addInfo=${encodedMemo}&accountName=${encodedName}`;

    return {
      invoiceId: invoice.id,
      invoiceCode: invoice.invoiceCode,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      bankName: bankBin,
      accountNo,
      accountName,
      memo,
      qrUrl,
    };
  }

  async handleWebhook(payload: WebhookPayload) {
    const content = payload.content || '';
    const transferAmount = Number(payload.transferAmount || payload.amount || 0);
    const transactionCode = payload.referenceCode || payload.transactionCode || `WB-${Date.now()}`;

    if (transferAmount <= 0) {
      throw new BadRequestException('Số tiền chuyển khoản không hợp lệ');
    }

    // Extract invoice code e.g. "INV-2026-07-001" from content string
    const match = content.match(/INV-\d{4}-\d{2}-\d{3,4}/i);
    if (!match) {
      throw new NotFoundException('Không tìm thấy mã hóa đơn trong nội dung chuyển khoản');
    }

    const invoiceCode = match[0].toUpperCase();
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceCode },
    });

    if (!invoice) {
      throw new NotFoundException(`Không tìm thấy hóa đơn với mã ${invoiceCode}`);
    }

    return this.create({
      invoiceId: invoice.id,
      amount: transferAmount,
      paymentMethod: 'VIETQR',
      transactionCode,
      note: `Thanh toán tự động qua VietQR/Banking: ${content}`,
    });
  }
}

