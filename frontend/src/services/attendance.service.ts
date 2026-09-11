import { api } from './api';

export type AttendanceStatus = 'not_yet' | 'on_time' | 'late' | 'absent';

export interface AttendanceRecord {
  workScheduleId: string;
  attendanceId: string | null;
  employeeId: string;
  employeeName: string;
  employeePhone: string;
  employeeAvatar: string | null;
  positionName: string | null;
  shiftId: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  workDate: string; // YYYY-MM-DD
  scheduleStatus: 'scheduled' | 'canceled';
  attendanceStatus: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  editedBy: string | null;
  editedByName: string | null;
  updatedAt: string | null;
}

export interface AttendanceSummary {
  totalShifts: number;
  onTimeCount: number;
  lateCount: number;
  absentCount: number;
  notYetCount: number;
  attendanceRate: number; // percentage
}

export interface AttendanceListResponse {
  data: AttendanceRecord[];
  summary: AttendanceSummary;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface QueryAttendanceParams {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  shiftId?: string;
  status?: AttendanceStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OverrideAttendancePayload {
  workScheduleId: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
}

export const attendanceService = {
  /**
   * UC-L-22: Query attendance records
   */
  async getAttendance(
    boardingHouseId: string,
    params: QueryAttendanceParams = {},
  ): Promise<AttendanceListResponse> {
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
    const endpoint = `/v1/landlord/attendance${qs ? `?${qs}` : ''}`;

    const res = await api.get<AttendanceListResponse>(endpoint, {
      headers: { 'x-boarding-house-id': boardingHouseId },
    });
    return (res as any)?.data || (res as any);
  },

  /**
   * UC-L-22: Manual override attendance status/times
   */
  async overrideAttendance(
    boardingHouseId: string,
    payload: OverrideAttendancePayload,
  ): Promise<AttendanceRecord> {
    const res = await api.patch<AttendanceRecord>(
      '/v1/landlord/attendance/override',
      payload,
      {
        headers: { 'x-boarding-house-id': boardingHouseId },
      },
    );
    return (res as any)?.data || (res as any);
  },
};
