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

