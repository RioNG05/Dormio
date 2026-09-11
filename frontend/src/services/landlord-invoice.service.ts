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

export interface DebtInvoiceSummary {
  id: string;
  period: string;
  totalAmount: number;
  status: 'unpaid' | 'overdue';
  dueDate: string;
  agingDays: number;
}

export interface RoomDebtTenant {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface RoomDebtItem {
  roomId: string;
  roomNumber: string;
  floor: number | null;
  buildingName: string;
  tenant: RoomDebtTenant | null;
  contractId: string | null;
  totalDebtAmount: number;
  unpaidAmount: number;
  overdueAmount: number;
  oldestDueDate: string;
  maxAgingDays: number;
  agingCategory: 'current' | '1_month' | '2_months' | 'bad_debt';
  invoicesCount: number;
  invoices: DebtInvoiceSummary[];
}

export interface DebtsAgingDistribution {
  under30Days: number;
  under30DaysAmount: number;
  from31To60Days: number;
  from31To60DaysAmount: number;
  over60Days: number;
  over60DaysAmount: number;
}

export interface LandlordDebtsSummary {
  totalDebtAmount: number;
  overdueDebtAmount: number;
  badDebtAmount: number;
  debtorRoomsCount: number;
  totalInvoicesCount: number;
  agingDistribution: DebtsAgingDistribution;
}

export interface LandlordDebtsResponse {
  success: boolean;
  data: RoomDebtItem[];
  meta: PaginationMeta;
  summary: LandlordDebtsSummary;
}

export interface DebtReminderResponse {
  success: boolean;
  message: string;
  tenantName: string;
  tenantPhone: string;
  roomNumber: string;
  totalDebtAmount: number;
  reminderText: string;
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

  /**
   * Retrieves room debt ledger with summary metrics and aging calculation (UC-L-16)
   */
  async getLandlordDebts(
    buildingId: string,
    params?: {
      search?: string;
      duration?: 'all' | 'current' | 'overdue' | '1_month' | '2_months' | 'bad_debt';
      sortBy?: 'debt_desc' | 'aging_desc' | 'room_asc';
      page?: number;
      limit?: number;
    },
  ): Promise<LandlordDebtsResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.duration && params.duration !== 'all') queryParams.duration = params.duration;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return api.get<LandlordDebtsResponse>(`/v1/landlord/invoices/debts`, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
      params: queryParams,
    });
  },

  /**
   * Dispatches debt reminder to primary tenant of room (UC-L-16)
   */
  async sendDebtReminder(
    buildingId: string,
    roomId: string,
    note?: string,
  ): Promise<DebtReminderResponse> {
    return api.post<DebtReminderResponse>(
      `/v1/landlord/invoices/debts/remind`,
      { roomId, note },
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },

  /**
   * Triggers manual update of overdue status for unpaid invoices past due date (UC-L-16)
   */
  async flipOverdueInvoices(
    buildingId: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    return api.post<{ success: boolean; updatedCount: number }>(
      `/v1/landlord/invoices/debts/flip-overdue`,
      {},
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },
};
