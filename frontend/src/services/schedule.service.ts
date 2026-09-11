import { api } from './api';

export interface ShiftItem {
  id: string;
  boardingHouseId: string;
  name: string;
  startTime: string; // "06:00"
  endTime: string;   // "14:00"
  createdAt: string;
}

export interface WorkScheduleItem {
  id: string;
  boardingHouseId: string;
  employeeId: string;
  employeeName: string;
  employeePhone: string;
  employeeAvatar: string | null;
  positionName: string | null;
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  workDate: string; // "YYYY-MM-DD"
  recurrenceId: string | null;
  isRecurring: boolean;
  status: 'scheduled' | 'canceled';
  note: string | null;
  attendanceStatus: 'not_yet' | 'on_time' | 'late' | 'absent' | null;
  checkIn: string | null;
  checkOut: string | null;
  createdAt: string;
}

export interface SchedulesSummary {
  totalSchedules: number;
  scheduledCount: number;
  canceledCount: number;
  recurringCount: number;
  adhocCount: number;
}

export interface SchedulesResponse {
  data: WorkScheduleItem[];
  summary: SchedulesSummary;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateShiftPayload {
  name: string;
  startTime: string;
  endTime: string;
}

export interface UpdateShiftPayload {
  name?: string;
  startTime?: string;
  endTime?: string;
}

export interface CreateRecurringPayload {
  employeeIds: string[];
  shiftId: string;
  daysOfWeek: string;
  startDate: string;
  endDate: string;
  note?: string;
}

export interface CreateAdhocPayload {
  employeeId: string;
  shiftId: string;
  workDate: string;
  note?: string;
}

export interface UpdateSchedulePayload {
  shiftId?: string;
  workDate?: string;
  status?: 'scheduled' | 'canceled';
  note?: string;
}

export interface UpdateRecurrencePayload {
  shiftId?: string;
  status?: 'scheduled' | 'canceled';
}

export const scheduleService = {
  // ─── Shifts Management ──────────────────────────────────────────────────
  async getShifts(boardingHouseId: string): Promise<ShiftItem[]> {
    const res = await api.get<ShiftItem[]>('/v1/landlord/shifts', {
      headers: { 'x-boarding-house-id': boardingHouseId },
    });
    return (res as any)?.data || (res as any) || [];
  },

  async createShift(
    boardingHouseId: string,
    payload: CreateShiftPayload,
  ): Promise<ShiftItem> {
    const res = await api.post<ShiftItem>('/v1/landlord/shifts', payload, {
      headers: { 'x-boarding-house-id': boardingHouseId },
    });
    return (res as any)?.data || (res as any);
  },

  async updateShift(
    boardingHouseId: string,
    shiftId: string,
    payload: UpdateShiftPayload,
  ): Promise<ShiftItem> {
    const res = await api.patch<ShiftItem>(`/v1/landlord/shifts/${shiftId}`, payload, {
      headers: { 'x-boarding-house-id': boardingHouseId },
    });
    return (res as any)?.data || (res as any);
  },

  async deleteShift(
    boardingHouseId: string,
    shiftId: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(
      `/v1/landlord/shifts/${shiftId}`,
      {
        headers: { 'x-boarding-house-id': boardingHouseId },
      },
    );
    return (res as any)?.data || (res as any);
  },

  // ─── Schedules Management ───────────────────────────────────────────────
  async getSchedules(
    boardingHouseId: string,
    params: {
      startDate?: string;
      endDate?: string;
      employeeId?: string;
      shiftId?: string;
      status?: 'scheduled' | 'canceled';
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<SchedulesResponse> {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.shiftId) query.append('shiftId', params.shiftId);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `/v1/landlord/schedules${qs ? `?${qs}` : ''}`;

    const res = await api.get<SchedulesResponse>(endpoint, {
      headers: { 'x-boarding-house-id': boardingHouseId },
    });
    return (res as any)?.data || (res as any);
  },

  async createRecurringSchedule(
    boardingHouseId: string,
    payload: CreateRecurringPayload,
  ): Promise<{ success: boolean; patternsCreated: number; schedulesMaterialized: number; message: string }> {
    const res = await api.post<any>('/v1/landlord/schedules/recurring', payload, {
      headers: { 'x-boarding-house-id': boardingHouseId },
    });
    return (res as any)?.data || (res as any);
  },

  async createAdhocSchedule(
    boardingHouseId: string,
    payload: CreateAdhocPayload,
  ): Promise<WorkScheduleItem> {
    const res = await api.post<WorkScheduleItem>(
      '/v1/landlord/schedules/adhoc',
      payload,
      {
        headers: { 'x-boarding-house-id': boardingHouseId },
      },
    );
    return (res as any)?.data || (res as any);
  },

  async updateSchedule(
    boardingHouseId: string,
    scheduleId: string,
    payload: UpdateSchedulePayload,
  ): Promise<WorkScheduleItem> {
    const res = await api.patch<WorkScheduleItem>(
      `/v1/landlord/schedules/${scheduleId}`,
      payload,
      {
        headers: { 'x-boarding-house-id': boardingHouseId },
      },
    );
    return (res as any)?.data || (res as any);
  },

  async updateRecurrence(
    boardingHouseId: string,
    recurrenceId: string,
    payload: UpdateRecurrencePayload,
  ): Promise<{ updatedCount: number; message: string }> {
    const res = await api.patch<any>(
      `/v1/landlord/schedules/recurrence/${recurrenceId}`,
      payload,
      {
        headers: { 'x-boarding-house-id': boardingHouseId },
      },
    );
    return (res as any)?.data || (res as any);
  },

  async deleteSchedule(
    boardingHouseId: string,
    scheduleId: string,
    mode: 'single' | 'future' = 'single',
  ): Promise<{ deletedCount: number; message: string }> {
    const res = await api.delete<any>(
      `/v1/landlord/schedules/${scheduleId}?mode=${mode}`,
      {
        headers: { 'x-boarding-house-id': boardingHouseId },
      },
    );
    return (res as any)?.data || (res as any);
  },
};
