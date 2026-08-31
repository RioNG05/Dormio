import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
}

