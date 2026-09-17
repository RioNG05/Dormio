import { api } from './api';

export interface StaffBoardingHouse {
  id: string;
  name: string;
  address?: string | null;
}

export interface StaffShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface StaffPosition {
  id: string;
  name: string;
  description?: string | null;
}

export interface StaffCoWorker {
  id: string;
  name: string;
  phone: string;
  positionName: string;
  avatar?: string | null;
}

export interface StaffDutyItem {
  id: string;
  title: string;
  requiresPhoto: boolean;
  completed: boolean;
  completedAt?: string | null;
  photoProof?: string | null;
  photoProofTime?: string | null;
  note?: string | null;
}

export interface StaffAdditionalTask {
  id: string;
  title: string;
  description?: string | null;
  deadline: string;
  isCustomTask?: boolean;
}

export interface StaffScheduleItem {
  id: string;
  workDate: string;
  boardingHouseId: string;
  boardingHouseName: string;
  shift: StaffShift;
  position: StaffPosition;
  isRecurring: boolean;
  status: string;
  coWorkers: StaffCoWorker[];
  duties: StaffDutyItem[];
  additionalTasks?: StaffAdditionalTask[];
}

export interface QueryStaffSchedulesParams {
  startDate?: string;
  endDate?: string;
  boardingHouseId?: string;
}

export const staffScheduleService = {
  /**
   * UC-S-01: Get active assigned boarding houses for staff member
   */
  async getBoardingHouses(): Promise<StaffBoardingHouse[]> {
    const res = await api.get<any>('/v1/staff/boarding-houses');
    return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  },

  /**
   * UC-S-01: Get work schedule roster with shift, position, co-workers and duties
   */
  async getSchedules(params?: QueryStaffSchedulesParams): Promise<StaffScheduleItem[]> {
    const queryParts: string[] = [];
    if (params?.startDate) queryParts.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params?.endDate) queryParts.push(`endDate=${encodeURIComponent(params.endDate)}`);
    if (params?.boardingHouseId && params.boardingHouseId !== 'all') {
      queryParts.push(`boardingHouseId=${encodeURIComponent(params.boardingHouseId)}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await api.get<any>(`/v1/staff/schedules${queryString}`);
    return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  },
};

