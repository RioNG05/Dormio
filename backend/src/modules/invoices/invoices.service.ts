import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TenantInvoiceDto,
  TenantInvoicesListResponseDto,
  InvoiceItemDetailDto,
  MeterReadingSummaryDto,
} from './dto/tenant-invoices-response.dto';
import {
  TenantUsageAnalyticsResponseDto,
  UtilityConsumptionDataPointDto,
  UsageAnalyticsSummaryDto,
} from './dto/usage-analytics-response.dto';
import {
  PaymentHistoryResponseDto,
  PaymentHistoryRecordDto,
  PaymentHistorySummaryDto,
  PaymentBreakdownItemDto,
} from './dto/payment-history-response.dto';
import { QueryLandlordInvoicesDto } from './dto/query-landlord-invoices.dto';
import { CreateManualInvoiceDto } from './dto/create-manual-invoice.dto';
import { ManualPaymentDto } from './dto/manual-payment.dto';
import {
  LandlordInvoicesListResponseDto,
  LandlordInvoiceItemDto,
  LandlordInvoicesSummaryDto,
  ServiceFeeBreakdownDto,
  LandlordMeterReadingDto,
} from './dto/landlord-invoices-response.dto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to resolve active contract for tenant
   */
  async resolveActiveTenantContract(tenantId: string) {
    const tenantContract = await this.prisma.tenantContract.findFirst({
      where: {
        tenantId,
        contract: {
          status: 'active',
        },
      },
      include: {
        contract: {
          include: {
            room: {
              include: {
                boardingHouse: true,
              },
            },
          },
        },
      },
    });

    if (!tenantContract || !tenantContract.contract) {
      throw new NotFoundException(
        'Không tìm thấy hợp đồng thuê phòng đang có hiệu lực của bạn.',
      );
    }

    return tenantContract.contract;
  }

  /**
   * UC-T-05: Query all invoices and item details for the tenant's active room
   */
  async getTenantInvoices(userId: string): Promise<TenantInvoicesListResponseDto> {
    this.logger.log(`Fetching invoices for tenant user ${userId}`);
    const contract = await this.resolveActiveTenantContract(userId);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        contractId: contract.id,
      },
      include: {
        invoiceItems: {
          include: {
            service: true,
          },
        },
        payment: true,
        meterReadings: {
          include: {
            service: true,
          },
        },
      },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    });

    const now = new Date();

    const data: TenantInvoiceDto[] = invoices.map((inv) => {
      const dueDate = new Date(inv.dueDate);
      const period = `Tháng ${String(dueDate.getMonth() + 1).padStart(2, '0')}/${dueDate.getFullYear()}`;

      let displayStatus: 'paid' | 'unpaid' | 'overdue' = 'unpaid';
      if (inv.status === 'paid') {
        displayStatus = 'paid';
      } else if (dueDate < now) {
        displayStatus = 'overdue';
      } else {
        displayStatus = 'unpaid';
      }

      // Map line item details
      const details: InvoiceItemDetailDto[] = inv.invoiceItems.map((item) => {
        let name = item.service?.name || 'Tiền phòng';
        const isMetered = item.service?.isMetered ?? false;
        let unit = item.service?.unit || 'tháng';

        if (!item.serviceId) {
          name = 'Tiền phòng';
          unit = 'tháng';
        } else if (name.toLowerCase().includes('điện')) {
          name = 'Tiền điện';
          unit = 'kWh';
        } else if (name.toLowerCase().includes('nước')) {
          name = 'Tiền nước';
          unit = 'm³';
        }

        return {
          name,
          value: Number(item.amount),
          quantity: item.quantity,
          unit,
          unitPrice: Number(item.unitPrice),
          isMetered,
        };
      });

      // Map meter readings
      const meterReadings: MeterReadingSummaryDto[] = inv.meterReadings.map(
        (mr) => ({
          serviceId: mr.serviceId,
          serviceName: mr.service.name,
          unit: mr.service.unit,
          readingValue: mr.readingValue !== null ? Number(mr.readingValue) : null,
          imageUrl: mr.imageUrl,
          recordedAt: mr.createdAt.toISOString(),
        }),
      );

      return {
        id: inv.id,
        period,
        amount: Number(inv.totalAmount),
        status: displayStatus,
        dueDate: inv.dueDate.toISOString(),
        createdDate: inv.createdAt.toISOString(),
        paidDate: inv.payment?.createdAt
          ? inv.payment.createdAt.toISOString()
          : null,
        details,
        meterReadings,
      };
    });

    return {
      success: true,
      data,
    };
  }

  /**
   * UC-T-05: Query and aggregate utility usage analytics and month-over-month trends
   */
  async getTenantUsageAnalytics(
    userId: string,
  ): Promise<TenantUsageAnalyticsResponseDto> {
    this.logger.log(`Generating usage analytics for tenant user ${userId}`);
    const contract = await this.resolveActiveTenantContract(userId);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        contractId: contract.id,
      },
      include: {
        invoiceItems: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' }, // chronological for time series charts
    });

    if (invoices.length === 0) {
      return {
        success: true,
        summary: {
          currentCycleDue: 0,
          averageMonthlySpend: 0,
          averageElectricityKwh: 0,
          averageWaterM3: 0,
          momChangePercent: 0,
          momChangeAmount: 0,
          isUp: false,
          nextDueDate: null,
        },
        chartData: [],
      };
    }

    const chartData: UtilityConsumptionDataPointDto[] = invoices.map((inv) => {
      const dueDate = new Date(inv.dueDate);
      const period = `T${dueDate.getMonth() + 1}/${dueDate.getFullYear().toString().slice(2)}`;

      let electricityKwh = 0;
      let waterM3 = 0;
      let roomRent = 0;
      let electricityAmount = 0;
      let waterAmount = 0;
      let otherServicesAmount = 0;

      for (const item of inv.invoiceItems) {
        const sName = item.service?.name?.toLowerCase() || '';
        const amt = Number(item.amount);

        if (!item.serviceId || sName.includes('phòng')) {
          roomRent += amt;
        } else if (sName.includes('điện')) {
          electricityKwh += item.quantity;
          electricityAmount += amt;
        } else if (sName.includes('nước')) {
          waterM3 += item.quantity;
          waterAmount += amt;
        } else {
          otherServicesAmount += amt;
        }
      }

      return {
        period,
        date: dueDate.toISOString().slice(0, 10),
        electricityKwh,
        waterM3,
        roomRent,
        electricityAmount,
        waterAmount,
        otherServicesAmount,
        totalAmount: Number(inv.totalAmount),
      };
    });

    // Compute Summary Statistics
    const totalCount = chartData.length;
    const sumSpend = chartData.reduce((acc, c) => acc + c.totalAmount, 0);
    const sumElec = chartData.reduce((acc, c) => acc + c.electricityKwh, 0);
    const sumWater = chartData.reduce((acc, c) => acc + c.waterM3, 0);

    const averageMonthlySpend = Math.round(sumSpend / totalCount);
    const averageElectricityKwh = Math.round(sumElec / totalCount);
    const averageWaterM3 = Math.round((sumWater / totalCount) * 10) / 10;

    // Latest cycle and previous cycle MoM
    const latest = chartData[totalCount - 1];
    const prev = totalCount > 1 ? chartData[totalCount - 2] : null;

    let momChangeAmount = 0;
    let momChangePercent = 0;
    let isUp = false;

    if (prev && prev.totalAmount > 0) {
      const diff = latest.totalAmount - prev.totalAmount;
      momChangeAmount = Math.abs(diff);
      momChangePercent = Number(((diff / prev.totalAmount) * 100).toFixed(1));
      isUp = diff >= 0;
    }

    // Find unpaid invoice due date
    const unpaidInvoice = invoices
      .filter((i) => i.status === 'unpaid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    const currentCycleDue = unpaidInvoice
      ? Number(unpaidInvoice.totalAmount)
      : 0;

    const nextDueDate = unpaidInvoice
      ? unpaidInvoice.dueDate.toISOString()
      : null;

    const summary: UsageAnalyticsSummaryDto = {
      currentCycleDue,
      averageMonthlySpend,
      averageElectricityKwh,
      averageWaterM3,
      momChangePercent,
      momChangeAmount,
      isUp,
      nextDueDate,
    };

    return {
      success: true,
      summary,
      chartData,
    };
  }

  /**
   * UC-T-08: Query full payment history across all contracts (past & active)
   */
  async getTenantPaymentHistory(
    userId: string,
  ): Promise<PaymentHistoryResponseDto> {
    this.logger.log(`Fetching lifetime payment history for tenant user ${userId}`);

    // 1. Resolve every Contract this tenant has ever been party to (active + ended)
    const tenantContracts = await this.prisma.tenantContract.findMany({
      where: { tenantId: userId },
      include: {
        contract: {
          include: {
            room: {
              include: {
                boardingHouse: true,
              },
            },
          },
        },
      },
    });

    const contractIds = tenantContracts
      .map((tc) => tc.contractId)
      .filter((id): id is string => Boolean(id));

    // 2. Fetch all Invoices tied to these contracts
    const invoices =
      contractIds.length > 0
        ? await this.prisma.invoice.findMany({
            where: {
              contractId: { in: contractIds },
            },
            include: {
              contract: {
                include: {
                  room: {
                    include: {
                      boardingHouse: true,
                    },
                  },
                },
              },
              payment: true,
              invoiceItems: {
                include: {
                  service: true,
                },
              },
            },
            orderBy: {
              dueDate: 'desc',
            },
          })
        : [];

    // 3. Fetch standalone payments (e.g. upfront rent without invoice)
    const standalonePayments = await this.prisma.payment.findMany({
      where: {
        payerId: userId,
        invoiceId: null,
      },
      include: {
        deposit: true,
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    // 4. Map Invoices to standard PaymentHistoryRecordDto
    const invoiceRecords: PaymentHistoryRecordDto[] = invoices.map((inv) => {
      const d = new Date(inv.dueDate);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const period = `T${month}/${year}`;

      const breakdown: PaymentBreakdownItemDto[] = inv.invoiceItems.map(
        (item) => ({
          label: item.service?.name || 'Tiền thuê phòng',
          amount: Number(item.amount),
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          type: item.service ? (item.service.isMetered ? 'metered' : 'service') : 'room',
        }),
      );

      return {
        id: inv.id,
        source: 'monthly_invoice',
        contractId: inv.contractId,
        boardingHouseName:
          inv.contract?.room?.boardingHouse?.name || 'Nhà trọ Dormio',
        roomNumber: inv.contract?.room?.roomNumber || '-',
        totalAmount: Number(inv.totalAmount),
        paidAt: inv.payment?.paidAt ? inv.payment.paidAt.toISOString() : null,
        dueDate: inv.dueDate.toISOString(),
        period,
        status: inv.status,
        paymentMethod: (inv.payment?.method as 'cash' | 'banking') || null,
        transactionRef: inv.payment?.transactionRef || null,
        receiptNumber: inv.payment?.receiptNumber || null,
        qrCodeUrl: inv.payment?.qrCodeUrl || null,
        breakdown,
        createdAt: inv.createdAt.toISOString(),
      };
    });

    // 5. Map Standalone / Upfront payments
    const upfrontRecords: PaymentHistoryRecordDto[] = standalonePayments.map(
      (p) => {
        const d = new Date(p.paidAt);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const period = `T${month}/${year}`;

        const breakdown: PaymentBreakdownItemDto[] = [
          {
            label: p.depositId ? 'Tiền cọc giữ phòng' : 'Tiền trọ trọn gói',
            amount: Number(p.amount),
            quantity: 1,
            unitPrice: Number(p.amount),
            type: p.depositId ? 'deposit' : 'room',
          },
        ];

        return {
          id: p.id,
          source: 'upfront_rent',
          contractId: null,
          boardingHouseName: 'Dormio System',
          roomNumber: '-',
          totalAmount: Number(p.amount),
          paidAt: p.paidAt.toISOString(),
          dueDate: p.paidAt.toISOString(),
          period,
          status: p.status === 'success' ? 'paid' : p.status,
          paymentMethod: (p.method as 'cash' | 'banking') || null,
          transactionRef: p.transactionRef || null,
          receiptNumber: p.receiptNumber || null,
          qrCodeUrl: p.qrCodeUrl || null,
          breakdown,
          createdAt: p.paidAt.toISOString(),
        };
      },
    );

    // Merge and sort chronologically by date descending
    const allRecords = [...invoiceRecords, ...upfrontRecords].sort(
      (a, b) =>
        new Date(b.paidAt || b.dueDate).getTime() -
        new Date(a.paidAt || a.dueDate).getTime(),
    );

    // 6. Compute summary metrics
    const totalPaidAmount = allRecords
      .filter((r) => r.status === 'paid' || r.status === 'success')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const totalPendingAmount = allRecords
      .filter((r) => r.status === 'unpaid' || r.status === 'overdue' || r.status === 'pending')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const paidRecords = allRecords.filter((r) => Boolean(r.paidAt));
    const lastPaymentDate =
      paidRecords.length > 0 ? paidRecords[0].paidAt : null;

    const summary: PaymentHistorySummaryDto = {
      totalPaidAmount,
      totalPendingAmount,
      totalTransactions: allRecords.length,
      lastPaymentDate,
    };

    return {
      success: true,
      summary,
      data: allRecords,
    };
  }

  // ─── Landlord Invoices Management (UC-L-06) ──────────────────────────────────

  private readonly DEFAULT_BANK_CODE = '970422'; // MB Bank
  private readonly DEFAULT_ACCOUNT_NUMBER = '0988123456';
  private readonly DEFAULT_ACCOUNT_NAME = 'DORMIO BHMS';

  /**
   * Generates a standard VietQR image URL with locked amount and transfer memo
   */
  private buildVietQrUrl(
    invoiceId: string,
    roomNumber: string,
    amount: number,
    period: string,
  ): string {
    const memo = `TT TRO P${roomNumber.replace(/\s+/g, '')} ${period.replace('/', '')}`;
    return `https://img.vietqr.io/image/${this.DEFAULT_BANK_CODE}-${this.DEFAULT_ACCOUNT_NUMBER}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      memo,
    )}&accountName=${encodeURIComponent(this.DEFAULT_ACCOUNT_NAME)}`;
  }

  /**
   * UC-L-06: Query paginated landlord invoices with filters, search, and summary metrics
   */
  async getLandlordInvoices(
    boardingHouseId: string,
    query: QueryLandlordInvoicesDto,
    landlordId: string,
  ): Promise<LandlordInvoicesListResponseDto> {
    this.logger.log(
      `Landlord ${landlordId} querying invoices for house ${boardingHouseId} (page=${query.page}, status=${query.status})`,
    );

    const now = new Date();
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 10);
    const skip = (page - 1) * limit;

    // 1. Base house scope filter
    const baseHouseWhere: Prisma.InvoiceWhereInput = {
      room: {
        boardingHouseId,
      },
    };

    // 2. Date range filter based on month and year
    let dateFilter: Prisma.DateTimeFilter | undefined;
    const selectedYear = query.year && query.year !== 'all' ? Number(query.year) : null;
    const selectedMonth = query.month && query.month !== 'all' ? Number(query.month) : null;

    if (selectedYear && selectedMonth) {
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    } else if (selectedYear) {
      const start = new Date(selectedYear, 0, 1);
      const end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }

    const periodWhere: Prisma.InvoiceWhereInput = {
      ...baseHouseWhere,
      ...(dateFilter ? { dueDate: dateFilter } : {}),
    };

    // 3. Search filter
    let searchWhere: Prisma.InvoiceWhereInput = {};
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      searchWhere = {
        OR: [
          { id: { contains: term, mode: 'insensitive' } },
          { room: { roomNumber: { contains: term, mode: 'insensitive' } } },
          {
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
        ],
      };
    }

    // 4. Status filter
    let statusWhere: Prisma.InvoiceWhereInput = {};
    if (query.status === 'paid') {
      statusWhere = { status: 'paid' };
    } else if (query.status === 'unpaid') {
      statusWhere = { status: 'unpaid', dueDate: { gte: now } };
    } else if (query.status === 'overdue') {
      statusWhere = {
        OR: [
          { status: 'overdue' },
          { status: 'unpaid', dueDate: { lt: now } },
        ],
      };
    }

    // Combine for items query
    const where: Prisma.InvoiceWhereInput = {
      ...periodWhere,
      ...searchWhere,
      ...statusWhere,
    };

    // 5. Query period invoices for Summary Metrics (unpaginated, matching house & period)
    const periodInvoices = await this.prisma.invoice.findMany({
      where: periodWhere,
      select: {
        id: true,
        status: true,
        dueDate: true,
        totalAmount: true,
      },
    });

    let paidCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;
    let totalPaidAmount = 0;
    let totalUnpaidAmount = 0;

    for (const inv of periodInvoices) {
      const amt = Number(inv.totalAmount);
      const isDuePast = new Date(inv.dueDate) < now;

      if (inv.status === 'paid') {
        paidCount++;
        totalPaidAmount += amt;
      } else if (inv.status === 'overdue' || isDuePast) {
        overdueCount++;
        totalUnpaidAmount += amt;
      } else {
        unpaidCount++;
        totalUnpaidAmount += amt;
      }
    }

    const summary: LandlordInvoicesSummaryDto = {
      totalInvoicesCount: periodInvoices.length,
      paidCount,
      unpaidCount,
      overdueCount,
      totalPaidAmount,
      totalUnpaidAmount,
    };

    // 6. Query paginated records with complete joins
    const [total, invoices] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        include: {
          room: {
            include: {
              boardingHouse: true,
            },
          },
          contract: {
            include: {
              tenantContracts: {
                where: { isPrimary: true },
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
          payment: true,
          meterReadings: {
            include: {
              service: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    // 7. Map database records to response DTO
    const data: LandlordInvoiceItemDto[] = invoices.map((inv) => {
      const primaryTenant =
        inv.contract?.tenantContracts[0]?.tenant || null;
      const tenantName =
        primaryTenant?.userIdentification?.fullName ||
        primaryTenant?.username ||
        'Chưa có người thuê';
      const tenantPhone = primaryTenant?.phoneNumber || '';

      const dueDateObj = new Date(inv.dueDate);
      const period = `Tháng ${String(dueDateObj.getMonth() + 1).padStart(2, '0')}/${dueDateObj.getFullYear()}`;
      const periodShort = `${String(dueDateObj.getMonth() + 1).padStart(2, '0')}/${dueDateObj.getFullYear()}`;

      let displayStatus: 'Đã thu' | 'Chưa thu' | 'Quá hạn' = 'Chưa thu';
      let rawStatus: 'paid' | 'unpaid' | 'overdue' | 'cancelled' = inv.status;

      if (inv.status === 'paid') {
        displayStatus = 'Đã thu';
        rawStatus = 'paid';
      } else if (dueDateObj < now || inv.status === 'overdue') {
        displayStatus = 'Quá hạn';
        rawStatus = 'overdue';
      } else {
        displayStatus = 'Chưa thu';
        rawStatus = 'unpaid';
      }

      // Breakdown line items
      let rentAmount = 0;
      let elecRate = 3500;
      let elecNew = 0;
      let elecOld = 0;
      let waterRate = 15000;
      let waterNew = 0;
      let waterOld = 0;
      const serviceFees: ServiceFeeBreakdownDto[] = [];

      for (const item of inv.invoiceItems) {
        const sName = (item.service?.name || '').toLowerCase();
        const amt = Number(item.amount);

        if (!item.serviceId || sName.includes('phòng')) {
          rentAmount += amt;
        } else if (sName.includes('điện')) {
          elecRate = Number(item.unitPrice) || elecRate;
          elecNew = item.quantity;
        } else if (sName.includes('nước')) {
          waterRate = Number(item.unitPrice) || waterRate;
          waterNew = item.quantity;
        } else {
          serviceFees.push({
            name: item.service?.name || 'Phí dịch vụ',
            amount: amt,
          });
        }
      }

      // Check attached meter readings for dial images & values
      const meterReadings: LandlordMeterReadingDto[] = inv.meterReadings.map(
        (mr) => ({
          serviceId: mr.serviceId,
          serviceName: mr.service.name,
          unit: mr.service.unit,
          readingValue: mr.readingValue !== null ? Number(mr.readingValue) : null,
          imageUrl: mr.imageUrl,
          recordedAt: mr.createdAt.toISOString(),
        }),
      );

      const ocrReading = inv.meterReadings.find((mr) => Boolean(mr.imageUrl));
      const ocrMeterImage = ocrReading?.imageUrl || undefined;

      const vietQrUrl = this.buildVietQrUrl(
        inv.id,
        inv.room.roomNumber,
        Number(inv.totalAmount),
        periodShort,
      );

      return {
        id: inv.id,
        roomId: inv.roomId,
        roomName: inv.room.roomNumber,
        buildingName: inv.room.boardingHouse.name,
        tenantName,
        tenantPhone,
        period: periodShort,
        rentAmount,
        elecOld,
        elecNew,
        elecRate,
        waterOld,
        waterNew,
        waterRate,
        serviceFees,
        discount: 0,
        totalAmount: Number(inv.totalAmount),
        deadline: inv.dueDate.toISOString(),
        status: displayStatus,
        rawStatus,
        createdAt: inv.createdAt.toISOString(),
        paidAt: inv.payment?.paidAt ? inv.payment.paidAt.toISOString() : undefined,
        paymentMethod:
          inv.payment?.method === 'banking'
            ? 'Chuyển khoản VietQR'
            : inv.payment?.method === 'cash'
            ? 'Tiền mặt'
            : undefined,
        vietQrUrl,
        ocrMeterImage,
        meterReadings,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      summary,
    };
  }

  /**
   * UC-L-06 / UC-L-07: Get complete Landlord invoice detail by ID
   */
  async getLandlordInvoiceDetail(
    boardingHouseId: string,
    invoiceId: string,
  ): Promise<LandlordInvoiceItemDto> {
    this.logger.log(`Fetching landlord invoice detail for ${invoiceId}`);

    const inv = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        room: {
          include: {
            boardingHouse: true,
          },
        },
        contract: {
          include: {
            tenantContracts: {
              where: { isPrimary: true },
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
        payment: true,
        meterReadings: {
          include: {
            service: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!inv || inv.room.boardingHouseId !== boardingHouseId) {
      throw new NotFoundException('Không tìm thấy hóa đơn cần xem chi tiết');
    }

    const now = new Date();
    const primaryTenant = inv.contract?.tenantContracts[0]?.tenant || null;
    const tenantName =
      primaryTenant?.userIdentification?.fullName ||
      primaryTenant?.username ||
      'Chưa có người thuê';
    const tenantPhone = primaryTenant?.phoneNumber || '';

    const dueDateObj = new Date(inv.dueDate);
    const periodShort = `${String(dueDateObj.getMonth() + 1).padStart(2, '0')}/${dueDateObj.getFullYear()}`;

    let displayStatus: 'Đã thu' | 'Chưa thu' | 'Quá hạn' = 'Chưa thu';
    let rawStatus: 'paid' | 'unpaid' | 'overdue' | 'cancelled' = inv.status;

    if (inv.status === 'paid') {
      displayStatus = 'Đã thu';
      rawStatus = 'paid';
    } else if (dueDateObj < now || inv.status === 'overdue') {
      displayStatus = 'Quá hạn';
      rawStatus = 'overdue';
    } else {
      displayStatus = 'Chưa thu';
      rawStatus = 'unpaid';
    }

    let rentAmount = 0;
    let elecRate = 3500;
    let elecNew = 0;
    let elecOld = 0;
    let waterRate = 15000;
    let waterNew = 0;
    let waterOld = 0;
    const serviceFees: ServiceFeeBreakdownDto[] = [];

    for (const item of inv.invoiceItems) {
      const sName = (item.service?.name || '').toLowerCase();
      const amt = Number(item.amount);

      if (!item.serviceId || sName.includes('phòng')) {
        rentAmount += amt;
      } else if (sName.includes('điện')) {
        elecRate = Number(item.unitPrice) || elecRate;
        elecNew = item.quantity;
      } else if (sName.includes('nước')) {
        waterRate = Number(item.unitPrice) || waterRate;
        waterNew = item.quantity;
      } else {
        serviceFees.push({
          name: item.service?.name || 'Phí dịch vụ',
          amount: amt,
        });
      }
    }

    const meterReadings: LandlordMeterReadingDto[] = inv.meterReadings.map(
      (mr) => ({
        serviceId: mr.serviceId,
        serviceName: mr.service.name,
        unit: mr.service.unit,
        readingValue: mr.readingValue !== null ? Number(mr.readingValue) : null,
        imageUrl: mr.imageUrl,
        recordedAt: mr.createdAt.toISOString(),
      }),
    );

    const ocrReading = inv.meterReadings.find((mr) => Boolean(mr.imageUrl));
    const ocrMeterImage = ocrReading?.imageUrl || undefined;

    const vietQrUrl = this.buildVietQrUrl(
      inv.id,
      inv.room.roomNumber,
      Number(inv.totalAmount),
      periodShort,
    );

    return {
      id: inv.id,
      roomId: inv.roomId,
      roomName: inv.room.roomNumber,
      buildingName: inv.room.boardingHouse.name,
      tenantName,
      tenantPhone,
      period: periodShort,
      rentAmount,
      elecOld,
      elecNew,
      elecRate,
      waterOld,
      waterNew,
      waterRate,
      serviceFees,
      discount: 0,
      totalAmount: Number(inv.totalAmount),
      deadline: inv.dueDate.toISOString(),
      status: displayStatus,
      rawStatus,
      createdAt: inv.createdAt.toISOString(),
      paidAt: inv.payment?.paidAt ? inv.payment.paidAt.toISOString() : undefined,
      paymentMethod:
        inv.payment?.method === 'banking'
          ? 'Chuyển khoản VietQR'
          : inv.payment?.method === 'cash'
          ? 'Tiền mặt'
          : undefined,
      vietQrUrl,
      ocrMeterImage,
      meterReadings,
    };
  }

  /**
   * UC-L-06 / UC-L-09: Create manual invoice with custom line items and AuditLog
   */
  async createManualInvoice(
    landlordId: string,
    boardingHouseId: string,
    dto: CreateManualInvoiceDto,
  ): Promise<LandlordInvoiceItemDto> {
    this.logger.log(
      `Landlord ${landlordId} creating manual invoice for room ${dto.roomId} in house ${boardingHouseId}`,
    );

    // 1. Verify room exists and belongs to this property
    const room = await this.prisma.room.findFirst({
      where: {
        id: dto.roomId,
        boardingHouseId,
      },
      include: {
        boardingHouse: true,
        contracts: {
          where: { status: 'active' },
          include: {
            tenantContracts: {
              where: { isPrimary: true },
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
        roomServices: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(
        'Không tìm thấy phòng tương ứng trong khu trọ này',
      );
    }

    const activeContract = room.contracts[0] || null;

    // 2. Resolve electricity & water metered services for this room if available
    const elecService =
      room.roomServices.find(
        (rs) =>
          rs.service.isMetered &&
          rs.service.name.toLowerCase().includes('điện'),
      )?.service || null;

    const waterService =
      room.roomServices.find(
        (rs) =>
          rs.service.isMetered &&
          rs.service.name.toLowerCase().includes('nước'),
      )?.service || null;

    // 3. Compute cost breakdown
    const rentAmount = Math.max(0, dto.rentAmount);

    let elecDelta = 0;
    let elecCost = 0;
    const elecRate =
      dto.elecRate || (elecService ? Number(elecService.price) : 3500);
    if (
      dto.elecNew !== undefined &&
      dto.elecOld !== undefined &&
      dto.elecNew >= dto.elecOld
    ) {
      elecDelta = dto.elecNew - dto.elecOld;
      elecCost = Math.round(elecDelta * elecRate);
    }

    let waterDelta = 0;
    let waterCost = 0;
    const waterRate =
      dto.waterRate || (waterService ? Number(waterService.price) : 15000);
    if (
      dto.waterNew !== undefined &&
      dto.waterOld !== undefined &&
      dto.waterNew >= dto.waterOld
    ) {
      waterDelta = dto.waterNew - dto.waterOld;
      waterCost = Math.round(waterDelta * waterRate);
    }

    let flatServicesTotal = 0;
    const serviceFeesToCreate: Array<{ name: string; amount: number }> = [];
    if (dto.serviceFees && dto.serviceFees.length > 0) {
      for (const fee of dto.serviceFees) {
        if (fee.amount > 0) {
          flatServicesTotal += Math.round(fee.amount);
          serviceFeesToCreate.push({
            name: fee.name,
            amount: Math.round(fee.amount),
          });
        }
      }
    }

    const discount = Math.max(0, dto.discount || 0);
    const totalAmount = Math.max(
      0,
      rentAmount + elecCost + waterCost + flatServicesTotal - discount,
    );

    const dueDate = new Date(dto.dueDate);

    // 4. Atomic Database Transaction: Invoice + Items + MeterReadings + AuditLog
    const createdInvoice = await this.prisma.$transaction(async (tx) => {
      // 4a. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          roomId: room.id,
          contractId: activeContract ? activeContract.id : null,
          totalAmount: new Prisma.Decimal(totalAmount),
          status: 'unpaid',
          dueDate,
        },
      });

      // 4b. Create Rent InvoiceItem
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          serviceId: null,
          quantity: 1,
          unitPrice: new Prisma.Decimal(rentAmount),
          amount: Math.round(rentAmount),
        },
      });

      // 4c. Create Electricity Item & MeterReading if provided
      if (elecDelta > 0 || dto.elecNew !== undefined) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            serviceId: elecService?.id || null,
            quantity: Math.max(1, elecDelta),
            unitPrice: new Prisma.Decimal(elecRate),
            amount: Math.round(elecCost),
          },
        });

        if (elecService && dto.elecNew !== undefined) {
          await tx.meterReading.create({
            data: {
              roomId: room.id,
              serviceId: elecService.id,
              readingValue: new Prisma.Decimal(dto.elecNew),
              invoiceId: invoice.id,
            },
          });
        }
      }

      // 4d. Create Water Item & MeterReading if provided
      if (waterDelta > 0 || dto.waterNew !== undefined) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            serviceId: waterService?.id || null,
            quantity: Math.max(1, waterDelta),
            unitPrice: new Prisma.Decimal(waterRate),
            amount: Math.round(waterCost),
          },
        });

        if (waterService && dto.waterNew !== undefined) {
          await tx.meterReading.create({
            data: {
              roomId: room.id,
              serviceId: waterService.id,
              readingValue: new Prisma.Decimal(dto.waterNew),
              invoiceId: invoice.id,
            },
          });
        }
      }

      // 4e. Create flat service fees
      for (const fee of serviceFeesToCreate) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            serviceId: null,
            quantity: 1,
            unitPrice: new Prisma.Decimal(fee.amount),
            amount: Math.round(fee.amount),
          },
        });
      }

      // 4f. AuditLog inside same transaction (Rule 4)
      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'INVOICE',
          entityId: invoice.id,
          boardingHouseId,
          userId: landlordId,
          ipAddress: '127.0.0.1',
          newValue: {
            totalAmount,
            rentAmount,
            elecCost,
            waterCost,
            flatServicesTotal,
            discount,
            dueDate: dueDate.toISOString(),
            roomId: room.id,
            period: dto.period,
          },
        },
      });

      return invoice;
    });

    return this.getLandlordInvoiceDetail(boardingHouseId, createdInvoice.id);
  }

  /**
   * UC-L-06 Part 3: Record manual payment by landlord (cash or external transfer) with AuditLog
   */
  async recordLandlordManualPayment(
    landlordId: string,
    boardingHouseId: string,
    invoiceId: string,
    dto: ManualPaymentDto,
  ): Promise<{ success: boolean; message: string; paymentId: string }> {
    this.logger.log(
      `Landlord ${landlordId} recording manual payment for invoice ${invoiceId}`,
    );

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        room: {
          include: {
            boardingHouse: true,
          },
        },
        contract: {
          include: {
            tenantContracts: {
              where: { isPrimary: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!invoice || invoice.room.boardingHouseId !== boardingHouseId) {
      throw new NotFoundException('Không tìm thấy hóa đơn cần xác nhận thanh toán');
    }

    // Idempotency: If invoice is already paid and payment exists, return successfully
    if (invoice.status === 'paid' && invoice.payment) {
      this.logger.log(
        `Invoice ${invoice.id} already paid (Payment ID: ${invoice.payment.id})`,
      );
      return {
        success: true,
        message: 'Hóa đơn đã được ghi nhận thanh toán trước đó.',
        paymentId: invoice.payment.id,
      };
    }

    const primaryTenantId =
      invoice.contract?.tenantContracts[0]?.tenantId || null;
    const transactionRef =
      dto.transactionRef || `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const d = new Date(invoice.dueDate);
    const receiptNumber = `REC-${d.getFullYear()}${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const periodShort = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    // Execute atomic payment + invoice update + AuditLog
    const payment = await this.prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          payerId: primaryTenantId,
          type: 'charge',
          amount: invoice.totalAmount,
          method: dto.method || 'cash',
          status: 'success',
          transactionRef,
          receiptNumber,
          paidAt: new Date(),
          qrCodeUrl: this.buildVietQrUrl(
            invoice.id,
            invoice.room.roomNumber,
            Number(invoice.totalAmount),
            periodShort,
          ),
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'paid',
        },
      });

      // AuditLog for PAYMENT creation (Rule 4)
      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'PAYMENT',
          entityId: createdPayment.id,
          boardingHouseId,
          userId: landlordId,
          ipAddress: '127.0.0.1',
          newValue: {
            invoiceId: invoice.id,
            amount: Number(invoice.totalAmount),
            method: dto.method || 'cash',
            transactionRef,
            receiptNumber,
            note: dto.note || 'Thanh toán trực tiếp ghi nhận bởi chủ trọ',
          },
        },
      });

      // AuditLog for INVOICE status transition (Rule 4)
      await tx.auditLog.create({
        data: {
          action: 'update',
          entityType: 'INVOICE',
          entityId: invoice.id,
          boardingHouseId,
          userId: landlordId,
          ipAddress: '127.0.0.1',
          oldValue: { status: invoice.status },
          newValue: { status: 'paid', paymentId: createdPayment.id },
        },
      });

      return createdPayment;
    });

    return {
      success: true,
      message: 'Ghi nhận thanh toán thành công.',
      paymentId: payment.id,
    };
  }

  /**
   * UC-L-06 Part 1 Step 3 / Part 3:
   * Automated flat-rate invoice generation on billing day for rooms with NO metered services
   */
  async generateFlatRateInvoice(
    contractId: string,
    dueDate: Date,
  ): Promise<any> {
    this.logger.log(
      `[BillingCron] Generating automated flat-rate invoice for contract ${contractId}`,
    );

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        room: {
          include: {
            roomServices: {
              where: {
                service: {
                  isMetered: false,
                  status: 'active',
                },
              },
              include: { service: true },
            },
            boardingHouse: true,
          },
        },
      },
    });

    if (!contract || contract.status !== 'active') {
      return null;
    }

    // Idempotency: verify if an invoice was already generated for this cycle
    const startOfDay = new Date(dueDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dueDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        contractId: contract.id,
        dueDate: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingInvoice) {
      this.logger.log(
        `[BillingCron] Invoice already exists for contract ${contract.id} on ${dueDate.toISOString()}`,
      );
      return existingInvoice;
    }

    const rentPriceNum = Number(contract.rentPrice);
    let totalAmount = rentPriceNum;

    const lineItemsToCreate: Array<{
      serviceId: string | null;
      quantity: number;
      unitPrice: Prisma.Decimal;
      amount: number;
    }> = [
      {
        serviceId: null,
        quantity: 1,
        unitPrice: contract.rentPrice,
        amount: Math.round(rentPriceNum),
      },
    ];

    for (const rs of contract.room.roomServices) {
      const priceNum = Number(rs.service.price);
      totalAmount += priceNum;
      lineItemsToCreate.push({
        serviceId: rs.serviceId,
        quantity: 1,
        unitPrice: rs.service.price,
        amount: Math.round(priceNum),
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          roomId: contract.roomId,
          contractId: contract.id,
          totalAmount: new Prisma.Decimal(totalAmount),
          status: 'unpaid',
          dueDate,
        },
      });

      for (const item of lineItemsToCreate) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'INVOICE',
          entityId: invoice.id,
          boardingHouseId: contract.room.boardingHouseId,
          userId: contract.room.boardingHouse.ownerId,
          ipAddress: '127.0.0.1',
          newValue: {
            totalAmount,
            contractId: contract.id,
            automatedBy: 'billing_cron',
            dueDate: dueDate.toISOString(),
          },
        },
      });

      return invoice;
    });
  }
}


