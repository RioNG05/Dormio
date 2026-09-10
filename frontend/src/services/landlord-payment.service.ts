import { api } from './api';

export interface PaymentMeterReading {
  id: string;
  serviceId: string;
  serviceName: string;
  readingValue: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface PaymentInvoiceItem {
  id: string;
  serviceId?: string | null;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface LandlordPaymentItem {
  id: string;
  receiptNumber?: string | null;
  transactionRef?: string | null;
  amount: number;
  method: 'cash' | 'banking';
  status: 'success' | 'pending' | 'failed';
  paidAt: string;
  payerId?: string | null;
  payerName: string;
  payerPhone?: string | null;
  invoiceId: string;
  period: string;
  invoiceTotal: number;
  roomId: string;
  roomNumber: string;
  roomTypeName?: string | null;
  items: PaymentInvoiceItem[];
  meterReadings: PaymentMeterReading[];
}

export interface LandlordPaymentsSummary {
  totalRevenue: number;
  totalTransactions: number;
  bankingRevenue: number;
  cashRevenue: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LandlordPaymentsResponse {
  summary: LandlordPaymentsSummary;
  pagination: PaginationMeta;
  payments: LandlordPaymentItem[];
}

export const landlordPaymentService = {
  /**
   * Retrieves paginated payment history joined with invoices and meter readings (UC-L-07)
   */
  async getLandlordPayments(
    buildingId: string,
    params?: {
      roomId?: string;
      search?: string;
      method?: string;
      month?: string;
      year?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<LandlordPaymentsResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.roomId && params.roomId !== 'all') queryParams.roomId = params.roomId;
    if (params?.search) queryParams.search = params.search;
    if (params?.method && params.method !== 'all') queryParams.method = params.method;
    if (params?.month && params.month !== 'all') queryParams.month = params.month;
    if (params?.year && params.year !== 'all') queryParams.year = params.year;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return api.get<LandlordPaymentsResponse>(`/v1/landlord/payments`, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
      params: queryParams,
    });
  },

  /**
   * Retrieves detailed receipt & evidence for a single payment (UC-L-07)
   */
  async getLandlordPaymentDetail(
    buildingId: string,
    paymentId: string,
  ): Promise<LandlordPaymentItem> {
    return api.get<LandlordPaymentItem>(
      `/v1/landlord/payments/${paymentId}`,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },
};
