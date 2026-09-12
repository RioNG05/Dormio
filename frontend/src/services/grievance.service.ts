import { api } from './api';

export type GrievancePriority = 'low' | 'medium' | 'high';
export type GrievanceStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

export interface GrievanceImage {
  id: string;
  url: string;
  createdAt: string;
}

export interface Grievance {
  id: string;
  title: string;
  description: string;
  priority: GrievancePriority;
  status: GrievanceStatus;
  boardingHouseName: string;
  roomNumber: string;
  resolutionNote: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  images: GrievanceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGrievancePayload {
  title: string;
  description: string;
  priority?: GrievancePriority;
  imageUrls?: string[];
}

// ─── ADMIN INTERFACES (UC-A-04) ──────────────────────────────────────────────

export interface AdminGrievanceItem {
  id: string;
  title: string;
  description: string;
  priority: GrievancePriority;
  status: GrievanceStatus;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  boardingHouseId: string;
  boardingHouseName: string;
  roomId: string;
  roomNumber: string;
  landlordName: string;
  landlordPhone: string;
  resolutionNote: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  images: GrievanceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface GrievanceQueueCounts {
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  urgent: number;
}

export interface AdminGrievanceListResponse {
  success: boolean;
  items: AdminGrievanceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: GrievanceQueueCounts;
}

export interface AdminGrievanceQuery {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ResolveGrievancePayload {
  resolutionNote: string;
  escalateLockLandlord?: boolean;
}

export interface RejectGrievancePayload {
  resolutionNote: string;
}

export const grievanceService = {
  // ─── TENANT METHODS (UC-T-07) ──────────────────────────────────────────────

  /**
   * Get all grievances submitted by current tenant
   */
  async getTenantGrievances(): Promise<Grievance[]> {
    try {
      const res = await api.get<{ success: boolean; data: Grievance[] }>(
        '/v1/tenant/grievances',
        { silent: true },
      );
      return res.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Get grievance detail by ID
   */
  async getTenantGrievanceById(id: string): Promise<Grievance> {
    const res = await api.get<{ success: boolean; data: Grievance }>(
      `/v1/tenant/grievances/${id}`,
    );
    return res.data;
  },

  /**
   * Submit a new grievance / complaint
   */
  async createGrievance(payload: CreateGrievancePayload): Promise<Grievance> {
    const res = await api.post<{ success: boolean; data: Grievance }>(
      '/v1/tenant/grievances',
      payload,
    );
    return res.data;
  },

  // ─── ADMIN METHODS (UC-A-04) ───────────────────────────────────────────────

  /**
   * UC-A-04: Retrieve admin grievances queue with priority ordering and counts
   */
  async getAdminGrievanceQueue(
    query?: AdminGrievanceQuery,
  ): Promise<AdminGrievanceListResponse> {
    const params: Record<string, string> = {};
    if (query?.status) params.status = query.status;
    if (query?.priority) params.priority = query.priority;
    if (query?.search) params.search = query.search;
    if (query?.page) params.page = query.page.toString();
    if (query?.limit) params.limit = query.limit.toString();

    return api.get<AdminGrievanceListResponse>('/v1/admin/grievances', {
      params,
    });
  },

  /**
   * UC-A-04: Get single grievance detail for admin
   */
  async getAdminGrievanceById(id: string): Promise<AdminGrievanceItem> {
    return api.get<AdminGrievanceItem>(`/v1/admin/grievances/${id}`);
  },

  /**
   * UC-A-04: Mark grievance as in-progress
   */
  async updateGrievanceInProgress(id: string): Promise<AdminGrievanceItem> {
    return api.patch<AdminGrievanceItem>(`/v1/admin/grievances/${id}/in-progress`, {});
  },

  /**
   * UC-A-04: Resolve grievance with written resolution note
   */
  async resolveGrievance(
    id: string,
    payload: ResolveGrievancePayload,
  ): Promise<AdminGrievanceItem> {
    return api.patch<AdminGrievanceItem>(`/v1/admin/grievances/${id}/resolve`, payload);
  },

  /**
   * UC-A-04: Reject grievance with written explanation
   */
  async rejectGrievance(
    id: string,
    payload: RejectGrievancePayload,
  ): Promise<AdminGrievanceItem> {
    return api.patch<AdminGrievanceItem>(`/v1/admin/grievances/${id}/reject`, payload);
  },
};
