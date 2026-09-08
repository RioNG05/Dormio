import { api } from './api';

export interface ServiceFeeBreakdown {
  name: string;
  amount: number;
}

export interface LandlordMeterReading {
  serviceId: string;
  serviceName: string;
  unit: string;
  readingValue: number | null;
  imageUrl: string | null;
  recordedAt: string;
}

export interface LandlordInvoiceItem {
  id: string;
  roomId: string;
  roomName: string;
  buildingName: string;
  tenantName: string;
  tenantPhone: string;
  period: string;
  rentAmount: number;
  elecOld: number;
  elecNew: number;
  elecRate: number;
  waterOld: number;
  waterNew: number;
  waterRate: number;
  serviceFees: ServiceFeeBreakdown[];
  discount: number;
  totalAmount: number;
  deadline: string;
  status: 'Đã thu' | 'Chưa thu' | 'Quá hạn';
  rawStatus: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  paymentMethod?: string;
  vietQrUrl?: string;
  ocrMeterImage?: string;
  meterReadings?: LandlordMeterReading[];
}

export interface LandlordInvoicesSummary {
  totalInvoicesCount: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LandlordInvoicesResponse {
  success: boolean;
  data: LandlordInvoiceItem[];
  meta: PaginationMeta;
  summary: LandlordInvoicesSummary;
}

export interface CreateManualInvoicePayload {
  roomId: string;
  period: string;
  dueDate: string;
  rentAmount: number;
  elecOld?: number;
  elecNew?: number;
  elecRate?: number;
  waterOld?: number;
  waterNew?: number;
  waterRate?: number;
  serviceFees?: Array<{ name: string; amount: number }>;
  discount?: number;
  note?: string;
}

export interface ManualPaymentPayload {
  method?: 'cash' | 'banking';
  note?: string;
  transactionRef?: string;
}

export const landlordInvoiceService = {
  /**
   * Retrieves paginated invoices for a boarding house with summary metrics (UC-L-06)
   */
  async getLandlordInvoices(
    buildingId: string,
    params?: {
      search?: string;
      status?: string;
      month?: string;
      year?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<LandlordInvoicesResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (params?.month && params.month !== 'all') queryParams.month = params.month;
    if (params?.year && params.year !== 'all') queryParams.year = params.year;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return api.get<LandlordInvoicesResponse>(`/v1/landlord/invoices`, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
      params: queryParams,
    });
  },

  /**
   * Retrieves complete invoice detail by ID (UC-L-06 / UC-L-07)
   */
  async getLandlordInvoiceDetail(
    buildingId: string,
    invoiceId: string,
  ): Promise<{ success: boolean; data: LandlordInvoiceItem }> {
    return api.get<{ success: boolean; data: LandlordInvoiceItem }>(
      `/v1/landlord/invoices/${invoiceId}`,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },

  /**
   * Creates manual billing invoice for a room (UC-L-06 / UC-L-09)
   */
  async createManualInvoice(
    buildingId: string,
    payload: CreateManualInvoicePayload,
  ): Promise<{ success: boolean; data: LandlordInvoiceItem }> {
    return api.post<{ success: boolean; data: LandlordInvoiceItem }>(
      `/v1/landlord/invoices/manual`,
      payload,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },

  /**
   * Records manual payment (cash or external transfer) for an invoice (UC-L-06 Part 3)
   */
  async recordManualPayment(
    buildingId: string,
    invoiceId: string,
    payload: ManualPaymentPayload = { method: 'cash' },
  ): Promise<{ success: boolean; message: string; paymentId: string }> {
    return api.post<{ success: boolean; message: string; paymentId: string }>(
      `/v1/landlord/invoices/${invoiceId}/pay`,
      payload,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },
};
