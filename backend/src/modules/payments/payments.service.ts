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
import { Prisma } from '@prisma/client';
import { QueryLandlordPaymentsDto } from './dto/query-landlord-payments.dto';
import {
  LandlordPaymentsResponseDto,
  LandlordPaymentItemDto,
  PaymentInvoiceItemDto,
  PaymentMeterReadingDto,
} from './dto/landlord-payments-response.dto';

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

  /**
   * Helper to map Prisma Payment entity to LandlordPaymentItemDto (UC-L-07)
   */
  private mapPaymentToDto(payment: any): LandlordPaymentItemDto {
    const primaryTenant =
      payment.invoice?.contract?.tenantContracts?.find((tc: any) => tc.isPrimary) ||
      payment.invoice?.contract?.tenantContracts?.[0];

    const payerName =
      payment.payer?.userIdentification?.fullName ||
      payment.payer?.username ||
      primaryTenant?.tenant?.userIdentification?.fullName ||
      primaryTenant?.tenant?.username ||
      'Khách thuê';

    const payerPhone =
      payment.payer?.phoneNumber ||
      primaryTenant?.tenant?.phoneNumber ||
      null;

    const period = payment.invoice?.dueDate
      ? this.formatPeriod(payment.invoice.dueDate)
      : 'N/A';

    return {
      id: payment.id,
      receiptNumber:
        payment.receiptNumber || `REC-${payment.id.substring(0, 8).toUpperCase()}`,
      transactionRef: payment.transactionRef || null,
      amount: Number(payment.amount),
      method: payment.method,
      status: payment.status,
      paidAt: payment.paidAt
        ? payment.paidAt.toISOString()
        : payment.createdAt.toISOString(),
      payerId: payment.payerId || primaryTenant?.tenantId || null,
      payerName,
      payerPhone,
      invoiceId: payment.invoiceId || '',
      period,
      invoiceTotal: payment.invoice
        ? Number(payment.invoice.totalAmount)
        : Number(payment.amount),
      roomId: payment.invoice?.roomId || '',
      roomNumber: payment.invoice?.room?.roomNumber || 'P.---',
      roomTypeName: payment.invoice?.room?.roomType?.name || null,
      items: (payment.invoice?.invoiceItems || []).map((item: any) => ({
        id: item.id,
        serviceId: item.serviceId || null,
        serviceName:
          item.service?.name || (item.serviceId ? 'Dịch vụ' : 'Tiền phòng'),
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        amount: item.amount,
      })),
      meterReadings: (payment.invoice?.meterReadings || []).map((mr: any) => ({
        id: mr.id,
        serviceId: mr.serviceId,
        serviceName: mr.service?.name || 'Đồng hồ',
        readingValue: Number(mr.readingValue ?? 0),
        imageUrl: mr.imageUrl || null,
        createdAt: mr.createdAt.toISOString(),
      })),
    };
  }

  /**
   * UC-L-07: Query payment history joined with Invoice, InvoiceItem, and MeterReading
   */
  async getLandlordPayments(
    boardingHouseId: string,
    query: QueryLandlordPaymentsDto,
    landlordId: string,
  ): Promise<LandlordPaymentsResponseDto> {
    this.logger.log(
      `Landlord ${landlordId} querying payment history for house ${boardingHouseId}`,
    );

    // 1. Verify landlord ownership
    const boardingHouse = await this.prisma.boardingHouse.findUnique({
      where: { id: boardingHouseId },
    });
    if (!boardingHouse || boardingHouse.landlordId !== landlordId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập dữ liệu thanh toán của nhà trọ này.',
      );
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    // 2. Date filtering
    let dateFilter: Prisma.DateTimeFilter | undefined;
    const selectedYear =
      query.year && query.year !== 'all' ? Number(query.year) : null;
    const selectedMonth =
      query.month && query.month !== 'all' ? Number(query.month) : null;

    if (selectedYear && selectedMonth) {
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    } else if (selectedYear) {
      const start = new Date(selectedYear, 0, 1);
      const end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }

    // 3. Search filter
    const isUuid = (val: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val,
      );

    let searchConditions: Prisma.PaymentWhereInput[] | undefined = undefined;
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      searchConditions = [
        { receiptNumber: { contains: term, mode: 'insensitive' } },
        { transactionRef: { contains: term, mode: 'insensitive' } },
        {
          invoice: {
            room: {
              roomNumber: { contains: term, mode: 'insensitive' },
            },
          },
        },
        {
          payer: {
            OR: [
              { username: { contains: term, mode: 'insensitive' } },
              { phoneNumber: { contains: term } },
              {
                userIdentification: {
                  fullName: { contains: term, mode: 'insensitive' },
                },
              },
            ],
          },
        },
        {
          invoice: {
            contract: {
              tenantContracts: {
                some: {
                  tenant: {
                    OR: [
                      { username: { contains: term, mode: 'insensitive' } },
                      { phoneNumber: { contains: term } },
                      {
                        userIdentification: {
                          fullName: { contains: term, mode: 'insensitive' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ];

      if (isUuid(term)) {
        searchConditions.push({ id: term });
      }
    }

    // 4. Construct Where Clause
    const whereInput: Prisma.PaymentWhereInput = {
      type: 'charge',
      status: 'success',
      invoice: {
        room: {
          boardingHouseId,
          ...(query.roomId && query.roomId !== 'all'
            ? { id: query.roomId }
            : {}),
        },
      },
      ...(query.method && query.method !== 'all'
        ? { method: query.method as any }
        : {}),
      ...(dateFilter ? { paidAt: dateFilter } : {}),
      ...(searchConditions ? { OR: searchConditions } : {}),
    };

    // 5. Aggregate metrics
    const allFilteredPayments = await this.prisma.payment.findMany({
      where: whereInput,
      select: {
        amount: true,
        method: true,
      },
    });

    const totalRevenue = allFilteredPayments.reduce(
      (acc, p) => acc + Number(p.amount),
      0,
    );
    const totalTransactions = allFilteredPayments.length;
    const bankingRevenue = allFilteredPayments
      .filter((p) => p.method === 'banking')
      .reduce((acc, p) => acc + Number(p.amount), 0);
    const cashRevenue = allFilteredPayments
      .filter((p) => p.method === 'cash')
      .reduce((acc, p) => acc + Number(p.amount), 0);

    const totalPages = Math.ceil(totalTransactions / limit) || 1;

    // 6. Fetch paginated payments with all joins
    const payments = await this.prisma.payment.findMany({
      where: whereInput,
      include: {
        payer: {
          include: {
            userIdentification: true,
          },
        },
        invoice: {
          include: {
            room: {
              include: {
                roomType: true,
              },
            },
            contract: {
              include: {
                tenantContracts: {
                  include: {
                    tenant: {
                      include: {
                        userIdentification: true,
                      },
                    },
                  },
                },
              },
            },
            invoiceItems: {
              include: {
                service: true,
              },
            },
            meterReadings: {
              include: {
                service: true,
              },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      summary: {
        totalRevenue,
        totalTransactions,
        bankingRevenue,
        cashRevenue,
      },
      pagination: {
        total: totalTransactions,
        page,
        limit,
        totalPages,
      },
      payments: payments.map((p) => this.mapPaymentToDto(p)),
    };
  }

  /**
   * UC-L-07: Get detailed receipt & supporting evidence for a single payment
   */
  async getLandlordPaymentDetail(
    boardingHouseId: string,
    paymentId: string,
    landlordId?: string,
  ): Promise<LandlordPaymentItemDto> {
    this.logger.log(
      `Querying payment detail for ${paymentId} in house ${boardingHouseId}`,
    );

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        payer: {
          include: {
            userIdentification: true,
          },
        },
        invoice: {
          include: {
            room: {
              include: {
                roomType: true,
                boardingHouse: true,
              },
            },
            contract: {
              include: {
                tenantContracts: {
                  include: {
                    tenant: {
                      include: {
                        userIdentification: true,
                      },
                    },
                  },
                },
              },
            },
            invoiceItems: {
              include: {
                service: true,
              },
            },
            meterReadings: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (
      !payment ||
      !payment.invoice ||
      payment.invoice.room.boardingHouseId !== boardingHouseId
    ) {
      throw new NotFoundException('Không tìm thấy bản ghi thanh toán.');
    }

    if (
      landlordId &&
      payment.invoice.room.boardingHouse.landlordId !== landlordId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thanh toán này.',
      );
    }

    return this.mapPaymentToDto(payment);
  }
}

