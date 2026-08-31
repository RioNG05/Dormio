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

export const tenantInvoiceService = {
  /**
   * Fetch all invoices for current tenant's active room
   */
  async getTenantInvoices(): Promise<TenantInvoice[]> {
    const res = await api.get<{ success: boolean; data: TenantInvoice[] }>(
      '/v1/tenant/invoices',
    );
    return res.data || [];
  },

  /**
   * Fetch utility consumption analytics and MoM trends
   */
  async getUsageAnalytics(): Promise<TenantUsageAnalyticsResponse> {
    const res = await api.get<TenantUsageAnalyticsResponse>(
      '/v1/tenant/analytics/usage',
    );
    return res;
  },
};
