import { api } from './api';

export interface ExpenseItem {
  id: string;
  code: string;
  name: string;
  category: string;
  amount: number;
  status: 'paid' | 'pending' | 'canceled';
  paidAt: string;
  createdAt: string;
  boardingHouseId: string;
  roomId?: string | null;
  roomName: string;
  roomNumber?: string | null;
  description?: string | null;
}

export interface ExpensesSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  canceledAmount: number;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpensesListResponse {
  success: boolean;
  data: ExpenseItem[];
  meta: PaginationMeta;
  summary: ExpensesSummary;
}

export interface CreateExpensePayload {
  name: string;
  category: string;
  amount: number;
  paidAt: string;
  status?: 'paid' | 'pending' | 'canceled';
  roomId?: string | null;
  description?: string;
}

export interface UpdateExpensePayload extends Partial<CreateExpensePayload> {}

export const expenseService = {
  /**
   * List paginated expenses for a boarding house with summary metrics (UC-L-17)
   */
  async getExpenses(
    buildingId: string,
    params?: {
      search?: string;
      category?: string;
      status?: string;
      roomId?: string;
      month?: string;
      year?: string;
      sortBy?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<ExpensesListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.category && params.category !== 'all') queryParams.category = params.category;
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (params?.roomId && params.roomId !== 'all') queryParams.roomId = params.roomId;
    if (params?.month && params.month !== 'all') queryParams.month = params.month;
    if (params?.year && params.year !== 'all') queryParams.year = params.year;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return api.get<ExpensesListResponse>(`/v1/landlord/expenses`, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
      params: queryParams,
    });
  },

  /**
   * Get single expense detail by ID (UC-L-17)
   */
  async getExpenseDetail(
    buildingId: string,
    id: string,
  ): Promise<{ success: boolean; data: ExpenseItem }> {
    return api.get<{ success: boolean; data: ExpenseItem }>(
      `/v1/landlord/expenses/${id}`,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },

  /**
   * Create a new expense item (UC-L-17)
   */
  async createExpense(
    buildingId: string,
    payload: CreateExpensePayload,
  ): Promise<{ success: boolean; data: ExpenseItem }> {
    return api.post<{ success: boolean; data: ExpenseItem }>(
      `/v1/landlord/expenses`,
      payload,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },

  /**
   * Update an existing expense item (UC-L-17)
   */
  async updateExpense(
    buildingId: string,
    id: string,
    payload: UpdateExpensePayload,
  ): Promise<{ success: boolean; data: ExpenseItem }> {
    return api.patch<{ success: boolean; data: ExpenseItem }>(
      `/v1/landlord/expenses/${id}`,
      payload,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },

  /**
   * Delete an expense item (UC-L-17)
   */
  async deleteExpense(
    buildingId: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(
      `/v1/landlord/expenses/${id}`,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },
};
