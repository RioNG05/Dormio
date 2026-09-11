import { api } from './api';

export interface JobPosition {
  id: string;
  name: string;
  description?: string | null;
  staffCount?: number;
  createdAt?: string;
}

export interface StaffItem {
  assignmentId: string;
  employeeId: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  avatarUrl?: string | null;
  positionId: string;
  positionName: string;
  positionDescription?: string | null;
  status: 'active' | 'inactive';
  joinedAt: string;
  leftAt?: string | null;
  createdAt: string;
  userRole: string;
  mustChangePassword: boolean;
}

export interface StaffSummary {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  positionsCount: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StaffListResponse {
  success: boolean;
  data: StaffItem[];
  summary: StaffSummary;
  meta: PaginationMeta;
}

export interface SearchUserResult {
  success: boolean;
  found: boolean;
  user?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email?: string | null;
    avatarUrl?: string | null;
    role: string;
    isAlreadyStaffAtThisHouse?: boolean;
  } | null;
}

export interface OnboardStaffPayload {
  phoneNumber: string;
  fullName?: string;
  positionId?: string;
  newPositionName?: string;
  newPositionDescription?: string;
  joinedAt?: string;
  note?: string;
}

export interface OnboardStaffResponse {
  success: boolean;
  data: StaffItem;
  isNewUser: boolean;
  generatedPassword?: string;
  message: string;
}

export interface QueryStaffParams {
  search?: string;
  status?: 'active' | 'inactive';
  positionId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'joinedAt' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const staffService = {
  /**
   * Search user by phone or name (UC-L-19 Step 1)
   */
  async searchUser(buildingId: string, query: string): Promise<SearchUserResult> {
    return api.get<SearchUserResult>('/v1/landlord/staff/search-user', {
      params: { q: query },
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    });
  },

  /**
   * Get all job positions for this boarding house
   */
  async getPositions(buildingId: string): Promise<{ data: JobPosition[] } | JobPosition[]> {
    return api.get<JobPosition[]>('/v1/landlord/staff/positions', {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    });
  },

  /**
   * Create custom job position (UC-L-20)
   */
  async createPosition(
    buildingId: string,
    payload: { name: string; description?: string },
  ): Promise<JobPosition> {
    return api.post<JobPosition>('/v1/landlord/staff/positions', payload, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    });
  },

  /**
   * List staff members with pagination and summary (UC-L-20)
   */
  async getStaffList(
    buildingId: string,
    params: QueryStaffParams = {},
  ): Promise<StaffListResponse> {
    const queryParams: Record<string, string> = {};
    if (params.search) queryParams.search = params.search;
    if (params.status) queryParams.status = params.status;
    if (params.positionId) queryParams.positionId = params.positionId;
    if (params.page) queryParams.page = params.page.toString();
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    return api.get<StaffListResponse>('/v1/landlord/staff', {
      params: queryParams,
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    });
  },

  /**
   * Onboard new or existing staff (UC-L-19)
   */
  async onboardStaff(
    buildingId: string,
    payload: OnboardStaffPayload,
  ): Promise<OnboardStaffResponse> {
    return api.post<OnboardStaffResponse>('/v1/landlord/staff/onboard', payload, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    });
  },

  /**
   * Update staff status or position (UC-L-20)
   */
  async updateStaffStatus(
    buildingId: string,
    assignmentId: string,
    payload: { status: 'active' | 'inactive'; positionId?: string },
  ): Promise<StaffItem> {
    return api.patch<StaffItem>(
      `/v1/landlord/staff/${assignmentId}/status`,
      payload,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },
};
