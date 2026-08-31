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
   * Fetch all invoices for current tenant's active room (UC-T-05)
   */
  async getTenantInvoices(): Promise<TenantInvoice[]> {
    const res = await api.get<{ success: boolean; data: TenantInvoice[] }>(
      '/v1/tenant/invoices',
    );
    return res.data || [];
  },

  /**
   * Fetch utility consumption analytics and MoM trends (UC-T-05)
   */
  async getUsageAnalytics(): Promise<TenantUsageAnalyticsResponse> {
    const res = await api.get<TenantUsageAnalyticsResponse>(
      '/v1/tenant/analytics/usage',
    );
    return res;
  },

  /**
   * Fetch lifetime payment history across all contracts (UC-T-08)
   */
  async getPaymentHistory(): Promise<PaymentHistoryResponse> {
    const res = await api.get<PaymentHistoryResponse>(
      '/v1/tenant/payments/history',
    );
    return res;
  },
};
