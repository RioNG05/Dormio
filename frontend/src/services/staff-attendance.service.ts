import { api } from './api';
import {
  WorkScheduleItem,
  AttendanceRecord,
  AttendanceWatermark,
} from '@/app/(dashboard)/staff/data';

export interface StaffCheckInPayload {
  workScheduleId: string;
  photo?: string;
  watermark?: AttendanceWatermark;
  explanation?: string;
  capturedTime?: string;
}

export interface StaffCheckOutPayload {
  workScheduleId: string;
  photo?: string;
  watermark?: AttendanceWatermark;
  explanation?: string;
  capturedTime?: string;
}

export interface StaffDutyProofPayload {
  workScheduleId: string;
  dutyId: string;
  photo?: string;
  note?: string;
  markCompleted?: boolean;
}

export interface StaffTodayOverview {
  employeeId: string;
  staffName: string;
  staffPhone: string;
  staffAvatar?: string | null;
  schedule: WorkScheduleItem;
  attendance: AttendanceRecord;
}

export interface StaffMonthlySummary {
  month: string;
  totalShifts: number;
  totalHours: number;
  onTimeRate: number;
  onTimeCount: number;
  lateCount: number;
  earlyCount: number;
}

export interface StaffAttendanceHistoryParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface StaffAttendanceHistorySummary {
  total: number;
  onTime: number;
  late: number;
  absent: number;
  hours: string;
}

export interface StaffAttendanceHistoryResponse {
  data: AttendanceRecord[];
  summary: StaffAttendanceHistorySummary;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const staffAttendanceService = {
  /**
   * UC-S-01: Fetch today's schedule, duties, coworkers and attendance status
   */
  async getTodayOverview(): Promise<StaffTodayOverview> {
    const res = await api.get<any>('/v1/staff/attendance/today');
    return res?.data ?? res;
  },

  /**
   * UC-S-01: Fetch monthly attendance summary metrics for logged-in staff
   */
  async getMonthlySummary(month?: string): Promise<StaffMonthlySummary> {
    const query = month ? `?month=${month}` : '';
    const res = await api.get<any>(`/v1/staff/attendance/monthly-summary${query}`);
    return res?.data ?? res;
  },

  /**
   * UC-S-01 & UC-S-02: Fetch paginated timesheet history, attendance metrics and watermark photo proofs
   */
  async getHistory(params?: StaffAttendanceHistoryParams): Promise<StaffAttendanceHistoryResponse> {
    const queryParts: string[] = [];
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.status && params.status !== 'all') queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.startDate) queryParts.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params?.endDate) queryParts.push(`endDate=${encodeURIComponent(params.endDate)}`);
    if (params?.page) queryParts.push(`page=${params.page}`);
    if (params?.limit) queryParts.push(`limit=${params.limit}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await api.get<any>(`/v1/staff/attendance/history${queryString}`);
    const data = res?.data ?? res;
    return {
      data: Array.isArray(data?.data) ? data.data : [],
      summary: data?.summary || { total: 0, onTime: 0, late: 0, absent: 0, hours: '0.0' },
      page: data?.page || 1,
      limit: data?.limit || 10,
      total: data?.total || 0,
      totalPages: data?.totalPages || 1,
    };
  },

  /**
   * UC-S-02: Submit staff check-in with GPS photo watermark and optional late explanation
   */
  async checkIn(payload: StaffCheckInPayload): Promise<StaffTodayOverview> {
    const res = await api.post<any>('/v1/staff/attendance/check-in', payload);
    return res?.data ?? res;
  },

  /**
   * UC-S-02: Submit staff check-out with GPS photo watermark and optional early explanation
   */
  async checkOut(payload: StaffCheckOutPayload): Promise<StaffTodayOverview> {
    const res = await api.post<any>('/v1/staff/attendance/check-out', payload);
    return res?.data ?? res;
  },

  /**
   * UC-S-01: Submit photo proof and progress note for duty task
   */
  async saveDutyProof(payload: StaffDutyProofPayload): Promise<StaffTodayOverview> {
    const res = await api.post<any>('/v1/staff/attendance/duty-proof', payload);
    return res?.data ?? res;
  },
};

