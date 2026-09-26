import { api } from './api';

export interface InvoiceItemDetail {
 name: string;
 value: number;
 quantity: number;
 unit: string;
 unitPrice: number;
 isMetered: boolean;
}

export interface MeterReadingSummary {
 serviceId: string;
 serviceName: string;
 unit: string;
 readingValue: number | null;
 imageUrl: string | null;
 recordedAt: string;
}

export interface TenantInvoice {
 id: string;
 period: string;
 amount: number;
 status: 'paid' | 'unpaid' | 'overdue';
 dueDate: string;
 createdDate: string;
 paidDate: string | null;
 details: InvoiceItemDetail[];
 meterReadings: MeterReadingSummary[];
}

export interface UtilityConsumptionDataPoint {
 period: string;
 date: string;
 electricityKwh: number;
 waterM3: number;
 roomRent: number;
 electricityAmount: number;
 waterAmount: number;
 otherServicesAmount: number;
 totalAmount: number;
}

export interface UsageAnalyticsSummary {
 currentCycleDue: number;
 averageMonthlySpend: number;
 averageElectricityKwh: number;
 averageWaterM3: number;
 momChangePercent: number;
 momChangeAmount: number;
 isUp: boolean;
 nextDueDate: string | null;
}

export interface TenantUsageAnalyticsResponse {
 success: boolean;
 summary: UsageAnalyticsSummary;
 chartData: UtilityConsumptionDataPoint[];
}

export interface PaymentBreakdownItem {
 label: string;
 amount: number;
 quantity: number;
 unitPrice: number;
 type: string;
}

export interface PaymentHistoryRecord {
 id: string;
 source: 'monthly_invoice' | 'upfront_rent';
 contractId: string | null;
 boardingHouseName: string;
 roomNumber: string;
 totalAmount: number;
 paidAt: string | null;
 dueDate: string;
 period: string;
 status: string;
 paymentMethod: 'cash' | 'banking' | null;
 transactionRef: string | null;
 receiptNumber: string | null;
 qrCodeUrl: string | null;
 breakdown: PaymentBreakdownItem[];
 createdAt: string;
}

export interface PaymentHistorySummary {
 totalPaidAmount: number;
 totalPendingAmount: number;
 totalTransactions: number;
 lastPaymentDate: string | null;
}

export interface PaymentHistoryResponse {
 success: boolean;
 summary: PaymentHistorySummary;
 data: PaymentHistoryRecord[];
}

export const tenantInvoiceService = {
  /**
   * Fetch a single invoice by id for tenant
   */
  async getTenantInvoiceById(id: string): Promise<TenantInvoice | null> {
    try {
      const res = await api.get<{ success?: boolean; data?: TenantInvoice } | TenantInvoice>(
        `/v1/tenant/invoices/${id}`,
        { silent: true },
      );
      if (!res) return null;
      if (typeof res === "object" && "data" in res && (res as any).data) {
        return (res as any).data;
      }
      return res as TenantInvoice;
    } catch {
      return null;
    }
  },
 /**
 * Fetch all invoices for current tenant's active room
 */
 async getTenantInvoices(): Promise<TenantInvoice[]> {
 try {
 const res = await api.get<{ success: boolean; data: TenantInvoice[] }>(
 '/v1/tenant/invoices',
 { silent: true },
 );
 return res.data || [];
 } catch {
 return [];
 }
 },

 /**
 * Fetch utility consumption analytics and MoM trends
 */
 async getUsageAnalytics(): Promise<TenantUsageAnalyticsResponse | null> {
 try {
 const res = await api.get<TenantUsageAnalyticsResponse>(
 '/v1/tenant/analytics/usage',
 { silent: true },
 );
 return res;
 } catch {
 return null;
 }
 },

 /**
 * Fetch lifetime payment history across all contracts
 */
 async getPaymentHistory(): Promise<PaymentHistoryResponse | null> {
 try {
 const res = await api.get<PaymentHistoryResponse>(
 '/v1/tenant/payments/history',
 { silent: true },
 );
 return res;
 } catch {
 return null;
 }
 },
};
