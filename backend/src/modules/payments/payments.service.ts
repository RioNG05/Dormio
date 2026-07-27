import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

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
}
