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

export const grievanceService = {
  /**
   * Get all grievances submitted by current tenant
   */
  async getTenantGrievances(): Promise<Grievance[]> {
    const res = await api.get<{ success: boolean; data: Grievance[] }>(
      '/v1/tenant/grievances',
    );
    return res.data || [];
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
};
