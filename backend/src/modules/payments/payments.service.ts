import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  VietQrPaymentInstructionDto,
} from './dto/initiate-payment.dto';
import {
  ConfirmPaymentDto,
  PaymentExecutionResultDto,
  VietQrWebhookDto,
} from './dto/confirm-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  // System VietQR Default Beneficiary Bank
  private readonly DEFAULT_BANK_CODE = '970422'; // MB Bank
  private readonly DEFAULT_BANK_NAME = 'MB Bank (Quân Đội)';
  private readonly DEFAULT_ACCOUNT_NUMBER = '0912345678';
  private readonly DEFAULT_ACCOUNT_NAME = 'DORMIO MANAGEMENT';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to format period string from date
   */
  private formatPeriod(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `T${month}/${year}`;
  }

  /**
   * UC-T-04: Generate locked-amount VietQR payment instruction for an invoice
   */
  async getVietQrInstruction(
    userId: string,
    invoiceId: string,
  ): Promise<VietQrPaymentInstructionDto> {
    this.logger.log(
      `Generating VietQR instruction for invoice ${invoiceId} by user ${userId}`,
    );

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: {
          include: {
            room: {
              include: {
                boardingHouse: true,
              },
            },
            tenantContracts: true,
          },
        },
      },
    });

    if (!invoice || !invoice.contract) {
      throw new NotFoundException(
        'Không tìm thấy hóa đơn hoặc hợp đồng liên quan.',
      );
    }

    // Verify tenant ownership scoping
    const isTenantParty = invoice.contract.tenantContracts.some(
      (tc) => tc.tenantId === userId,
    );
    if (!isTenantParty) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập hoặc thanh toán hóa đơn này.',
      );
    }

    const roomNumber = invoice.contract.room.roomNumber;
    const boardingHouseName = invoice.contract.room.boardingHouse.name;
    const period = this.formatPeriod(invoice.dueDate);
    const amount = Number(invoice.totalAmount);
    const transferSyntax = `TT TRO P${roomNumber} ${period}`;

    const qrCodeUrl = `https://api.vietqr.io/image/${this.DEFAULT_BANK_CODE}-${this.DEFAULT_ACCOUNT_NUMBER}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      transferSyntax,
    )}&accountName=${encodeURIComponent(this.DEFAULT_ACCOUNT_NAME)}`;

    return {
      invoiceId: invoice.id,
      amount,
      bankCode: this.DEFAULT_BANK_CODE,
      bankName: this.DEFAULT_BANK_NAME,
      accountNumber: this.DEFAULT_ACCOUNT_NUMBER,
      accountName: this.DEFAULT_ACCOUNT_NAME,
      transferSyntax,
      qrCodeUrl,
      period,
      roomNumber,
      boardingHouseName,
      dueDate: invoice.dueDate.toISOString(),
    };
  }

  /**
   * UC-T-04 / UC-L-06 Part 3: Confirm invoice payment with idempotency & audit logging
   */
  async confirmInvoicePayment(
    userId: string,
    dto: ConfirmPaymentDto,
  ): Promise<PaymentExecutionResultDto> {
    this.logger.log(
      `Confirming payment for invoice ${dto.invoiceId} by user ${userId}`,
    );

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        payment: true,
        contract: {
          include: {
            room: {
              include: {
                boardingHouse: true,
              },
            },
            tenantContracts: true,
          },
        },
      },
    });

    if (!invoice || !invoice.contract) {
      throw new NotFoundException('Không tìm thấy hóa đơn cần thanh toán.');
    }

    // Tenant scoping validation
    const isTenantParty = invoice.contract.tenantContracts.some(
      (tc) => tc.tenantId === userId,
    );
    if (!isTenantParty) {
      throw new ForbiddenException(
        'Bạn không có quyền thanh toán hóa đơn này.',
      );
    }

    // 1. Idempotency check: Already paid
    if (invoice.status === 'paid' && invoice.payment) {
      this.logger.log(
        `Invoice ${invoice.id} already marked paid (Payment ID: ${invoice.payment.id})`,
      );
      return {
        success: true,
        paymentId: invoice.payment.id,
        invoiceId: invoice.id,
        receiptNumber: invoice.payment.receiptNumber || 'REC-PAID',
        invoiceStatus: 'paid',
        paidAt: invoice.payment.paidAt.toISOString(),
        message: 'Hóa đơn đã được thanh toán thành công trước đó.',
      };
    }

    const transactionRef =
      dto.transactionRef || `TXN-VQR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Idempotency check on transactionRef
    const existingPaymentByRef = await this.prisma.payment.findFirst({
      where: { transactionRef },
    });
    if (existingPaymentByRef) {
      this.logger.log(
        `Payment with transactionRef ${transactionRef} already exists`,
      );
      return {
        success: true,
        paymentId: existingPaymentByRef.id,
        invoiceId: invoice.id,
        receiptNumber: existingPaymentByRef.receiptNumber || 'REC-PROCESSED',
        invoiceStatus: 'paid',
        paidAt: existingPaymentByRef.paidAt.toISOString(),
        message: 'Giao dịch đã được ghi nhận thành công.',
      };
    }

    const d = new Date(invoice.dueDate);
    const receiptNumber = `REC-${d.getFullYear()}${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidAtDate = new Date();
    const period = this.formatPeriod(invoice.dueDate);
    const roomNumber = invoice.contract.room.roomNumber;
    const boardingHouseId = invoice.contract.room.boardingHouseId;

    // 3. Execute DB Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create Payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          payerId: userId,
          type: 'charge',
          amount: invoice.totalAmount,
          method: dto.method || 'banking',
          status: 'success',
          transactionRef,
          receiptNumber,
          paidAt: paidAtDate,
          qrCodeUrl: `https://api.vietqr.io/image/${this.DEFAULT_BANK_CODE}-${this.DEFAULT_ACCOUNT_NUMBER}-compact2.png?amount=${Number(
            invoice.totalAmount,
          )}&addInfo=${encodeURIComponent(
            `TT TRO P${roomNumber} ${period}`,
          )}`,
        },
      });

      // Update Invoice status to paid
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'paid',
        },
      });

      // AuditLog for PAYMENT creation
      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'PAYMENT',
          entityId: payment.id,
          boardingHouseId,
          userId,
          ipAddress: '127.0.0.1',
          newValue: {
            invoiceId: invoice.id,
            amount: Number(invoice.totalAmount),
            method: dto.method || 'banking',
            transactionRef,
            receiptNumber,
          },
        },
      });

      // AuditLog for INVOICE status change
      await tx.auditLog.create({
        data: {
          action: 'update',
          entityType: 'INVOICE',
          entityId: invoice.id,
          boardingHouseId,
          userId,
          ipAddress: '127.0.0.1',
          oldValue: { status: invoice.status },
          newValue: { status: 'paid', paymentId: payment.id },
        },
      });

      // Create success notification for tenant
      await tx.notification.create({
        data: {
          receiverId: userId,
          senderId: userId,
          boardingHouseId,
          type: 'payment_success',
          content: `Thanh toán thành công hóa đơn ${period} phòng ${roomNumber} (Số tiền: ${new Intl.NumberFormat(
            'vi-VN',
          ).format(Number(invoice.totalAmount))} đ). Mã biên nhận: ${receiptNumber}`,
          isRead: false,
        },
      });

      return payment;
    });

    this.logger.log(
      `Payment ${result.id} recorded successfully. Invoice ${invoice.id} marked as PAID.`,
    );

    return {
      success: true,
      paymentId: result.id,
      invoiceId: invoice.id,
      receiptNumber,
      invoiceStatus: 'paid',
      paidAt: paidAtDate.toISOString(),
      message: 'Thanh toán hóa đơn thành công.',
    };
  }

  /**
   * UC-L-06 Part 3: Webhook handler from banking partner (VietQR / bank gateway)
   */
  async handleVietQrWebhook(
    dto: VietQrWebhookDto,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Received VietQR Webhook: ${JSON.stringify(dto)}`);

    // 1. Check idempotency on transactionRef
    const existingPayment = await this.prisma.payment.findFirst({
      where: { transactionRef: dto.transactionRef },
    });
    if (existingPayment) {
      this.logger.log(
        `Webhook transactionRef ${dto.transactionRef} already processed`,
      );
      return { success: true, message: 'Transaction already processed' };
    }

    // 2. Parse transferContent to find room number and invoice
    // Syntax expected: "TT TRO P101 T09/2026" or "INV-<UUID>"
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['unpaid', 'overdue'] },
      },
      include: {
        contract: {
          include: {
            room: {
              include: {
                boardingHouse: true,
              },
            },
            tenantContracts: true,
          },
        },
      },
    });

    // Match invoice by transfer content
    const matchedInvoice = invoices.find((inv) => {
      const roomNum = inv.contract?.room?.roomNumber;
      const period = this.formatPeriod(inv.dueDate);
      const syntax = `TT TRO P${roomNum} ${period}`.toUpperCase();
      const content = dto.transferContent.toUpperCase();
      return (
        content.includes(syntax) ||
        (roomNum && content.includes(`P${roomNum.toUpperCase()}`) && content.includes(period)) ||
        content.includes(inv.id.toUpperCase())
      );
    });

    if (!matchedInvoice) {
      this.logger.warn(
        `No unpaid invoice matched for webhook content: "${dto.transferContent}"`,
      );
      throw new NotFoundException(
        'Không tìm thấy hóa đơn chưa thanh toán phù hợp với nội dung chuyển khoản.',
      );
    }

    const primaryTenant =
      matchedInvoice.contract?.tenantContracts.find((tc) => tc.isPrimary) ||
      matchedInvoice.contract?.tenantContracts[0];

    const payerId = primaryTenant?.tenantId || null;

    // Process payment
    await this.confirmInvoicePayment(payerId || '00000000-0000-0000-0000-000000000000', {
      invoiceId: matchedInvoice.id,
      amount: dto.amount,
      transactionRef: dto.transactionRef,
      method: 'banking' as any,
    });

    return {
      success: true,
      message: `Hóa đơn ${matchedInvoice.id} đã được quyết toán tự động qua VietQR.`,
    };
  }
}
