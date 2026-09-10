import { api } from './api';

export interface DepositItem {
  id: string;
  roomId: string;
  roomNumber: string;
  boardingHouseId: string;
  boardingHouseName: string;
  contractId: string | null;
  postId: string | null;
  type: 'contract' | 'platform';
  depositCategory: 'hold' | 'contract';
  amount: number;
  originalAmount: number;
  status: 'pending' | 'paid' | 'refund' | 'forfeited';
  recordedManually: boolean;
  recordedBy?: string | null;
  tenantName: string;
  tenantPhone: string;
  expiryDate?: string | null;
  depositDate: string;
  deductedAmount?: number;
  refundAmount?: number;
  deductionReason?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface DepositStats {
  totalHoldingAmount: number;
  totalHoldTypeAmount: number;
  totalRefundedAmount: number;
  totalDeductedAmount: number;
  holdingCountTotal: number;
  holdTypeHoldingCountTotal: number;
  refundedCountTotal: number;
  deductedCountTotal: number;
  holdTypeCountTotal: number;
  contractTypeCountTotal: number;
}

export interface DepositListResult {
  data: DepositItem[];
  stats: DepositStats;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DepositQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  depositCategory?: 'hold' | 'contract';
}

export interface CreateManualDepositPayload {
  roomId: string;
  amount: number;
  tenantName?: string;
  tenantPhone?: string;
  expiryDate?: string;
  note?: string;
}

export interface RefundDepositPayload {
  deductedAmount?: number;
  deductionReason?: string;
  note?: string;
}

export interface ForfeitDepositPayload {
  deductionReason: string;
  note?: string;
}

/**
 * Creates a manual deposit entry for a room (UC-L-10).
 */
export async function createManualDeposit(
  boardingHouseId: string,
  payload: CreateManualDepositPayload,
): Promise<{ success: boolean; data: DepositItem }> {
  const res = await api.post<any>('/v1/landlord/deposits', payload, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  });

  return {
    success: true,
    data: res?.data ?? res,
  };
}

/**
 * Fetches paginated list of deposits and statistics for a boarding house (UC-L-14).
 */
export async function getDeposits(
  boardingHouseId: string,
  query?: DepositQueryParams,
): Promise<DepositListResult> {
  const params: Record<string, string> = {};
  if (query?.page) params.page = String(query.page);
  if (query?.limit) params.limit = String(query.limit);
  if (query?.search) params.search = query.search;
  if (query?.status) params.status = query.status;
  if (query?.type) params.type = query.type;
  if (query?.depositCategory) params.depositCategory = query.depositCategory;

  const res = await api.get<any>('/v1/landlord/deposits', {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
    params,
  });

  const payload = res?.data ?? res;
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    stats: payload?.stats ?? {
      totalHoldingAmount: 0,
      totalHoldTypeAmount: 0,
      totalRefundedAmount: 0,
      totalDeductedAmount: 0,
      holdingCountTotal: 0,
      holdTypeHoldingCountTotal: 0,
      refundedCountTotal: 0,
      deductedCountTotal: 0,
      holdTypeCountTotal: 0,
      contractTypeCountTotal: 0,
    },
    meta: payload?.meta ?? {
      total: Array.isArray(payload?.data) ? payload.data.length : 0,
      page: Number(query?.page || 1),
      limit: Number(query?.limit || 10),
      totalPages: 1,
    },
  };
}

/**
 * Fetches detailed deposit by ID.
 */
export async function getDepositById(
  boardingHouseId: string,
  depositId: string,
): Promise<{ success: boolean; data: DepositItem }> {
  const res = await api.get<any>(`/v1/landlord/deposits/${depositId}`, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  });

  return {
    success: true,
    data: res?.data ?? res,
  };
}

/**
 * Refunds a deposit (partial or full).
 */
export async function refundDeposit(
  boardingHouseId: string,
  depositId: string,
  payload: RefundDepositPayload,
): Promise<{ success: boolean; data: DepositItem }> {
  const res = await api.patch<any>(`/v1/landlord/deposits/${depositId}/refund`, payload, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  });

  return {
    success: true,
    data: res?.data ?? res,
  };
}

/**
 * Forfeits a deposit (100% deduction).
 */
export async function forfeitDeposit(
  boardingHouseId: string,
  depositId: string,
  payload: ForfeitDepositPayload,
): Promise<{ success: boolean; data: DepositItem }> {
  const res = await api.patch<any>(`/v1/landlord/deposits/${depositId}/forfeit`, payload, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  });

  return {
    success: true,
    data: res?.data ?? res,
  };
}
