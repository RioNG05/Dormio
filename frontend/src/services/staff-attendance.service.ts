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

export const staffAttendanceService = {
  /**
   * UC-S-01: Fetch today's schedule, duties, coworkers and attendance status
   */
  async getTodayOverview(): Promise<StaffTodayOverview> {
    return api.get<StaffTodayOverview>('/v1/staff/attendance/today');
  },

  /**
   * UC-S-02: Submit staff check-in with GPS photo watermark and optional late explanation
   */
  async checkIn(payload: StaffCheckInPayload): Promise<StaffTodayOverview> {
    return api.post<StaffTodayOverview>('/v1/staff/attendance/check-in', payload);
  },

  /**
   * UC-S-02: Submit staff check-out with GPS photo watermark and optional early explanation
   */
  async checkOut(payload: StaffCheckOutPayload): Promise<StaffTodayOverview> {
    return api.post<StaffTodayOverview>('/v1/staff/attendance/check-out', payload);
  },

  /**
   * UC-S-01: Submit photo proof and progress note for duty task
   */
  async saveDutyProof(payload: StaffDutyProofPayload): Promise<StaffTodayOverview> {
    return api.post<StaffTodayOverview>('/v1/staff/attendance/duty-proof', payload);
  },
};

