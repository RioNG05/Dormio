import { api } from './api'

export type GrievanceType = 'complaint' | 'inquiry' | 'feedback'
export type GrievancePriority = 'low' | 'medium' | 'high'
export type GrievanceStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected'

export interface GrievanceImage {
  id: string
  url: string
  createdAt: string
}

export interface Grievance {
  id: string
  type: GrievanceType
  title: string
  description: string
  priority: GrievancePriority
  status: GrievanceStatus
  boardingHouseName: string | null
  roomNumber: string | null
  resolutionNote: string | null
  resolvedAt: string | null
  resolvedByName: string | null
  images: GrievanceImage[]
  createdAt: string
  updatedAt: string
}

export interface CreateGrievancePayload {
  type: GrievanceType
  title: string
  description: string
  priority?: GrievancePriority
  imageUrls?: string[]
  contractId?: string
  roomId?: string
}

// ─── ADMIN, LANDLORD & STAFF INTERFACES ───────────────────────────

export interface AdminGrievanceItem {
  id: string
  type: GrievanceType
  title: string
  description: string
  priority: GrievancePriority
  status: GrievanceStatus
  tenantId: string
  tenantName: string
  tenantPhone: string
  tenantEmail: string
  boardingHouseId: string | null
  boardingHouseName: string | null
  roomId: string | null
  roomNumber: string | null
  landlordName: string | null
  landlordPhone: string | null
  resolutionNote: string | null
  resolvedAt: string | null
  resolvedByName: string | null
  images: GrievanceImage[]
  createdAt: string
  updatedAt: string
}

export interface GrievanceQueueCounts {
  pending: number
  inProgress: number
  resolved: number
  rejected: number
  urgent: number
}

export interface AdminGrievanceListResponse {
  success: boolean
  items: AdminGrievanceItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  counts: GrievanceQueueCounts
}

export interface AdminGrievanceQuery {
  type?: string
  status?: string
  priority?: string
  search?: string
  boardingHouseId?: string
  page?: number
  limit?: number
}

export interface ResolveGrievancePayload {
  resolutionNote: string
  escalateLockLandlord?: boolean
}

export interface RejectGrievancePayload {
  resolutionNote: string
}

function buildParams(query?: AdminGrievanceQuery): Record<string, string> {
  const params: Record<string, string> = {}
  if (query?.type) params.type = query.type
  if (query?.status) params.status = query.status
  if (query?.priority) params.priority = query.priority
  if (query?.search) params.search = query.search
  if (query?.boardingHouseId) params.boardingHouseId = query.boardingHouseId
  if (query?.page) params.page = query.page.toString()
  if (query?.limit) params.limit = query.limit.toString()
  return params
}

export const grievanceService = {
  // ─── TENANT METHODS ──────────────────────────────────────────────

  /**
   * Get all grievances submitted by current tenant
   */
  async getTenantGrievances(): Promise<Grievance[]> {
    try {
      const res = await api.get<{ success: boolean; data: Grievance[] }>('/v1/tenant/grievances', {
        silent: true,
      })
      return res.data || []
    } catch {
      return []
    }
  },

  /**
   * Get grievance detail by ID
   */
  async getTenantGrievanceById(id: string): Promise<Grievance> {
    const res = await api.get<{ success: boolean; data: Grievance }>(`/v1/tenant/grievances/${id}`)
    return res.data
  },

  /**
   * Submit a new grievance / complaint
   */
  async createGrievance(payload: CreateGrievancePayload): Promise<Grievance> {
    const res = await api.post<{ success: boolean; data: Grievance }>(
      '/v1/tenant/grievances',
      payload,
    )
    return res.data
  },

  // ─── LANDLORD METHODS ────────────────────────────────────────────

  /**
   * Retrieve grievances queue for landlord's boarding houses
   */
  async getLandlordGrievances(query?: AdminGrievanceQuery): Promise<AdminGrievanceListResponse> {
    try {
      return await api.get<AdminGrievanceListResponse>('/v1/landlord/grievances', {
        params: buildParams(query),
        silent: true,
      })
    } catch {
      return {
        success: false,
        items: [],
        total: 0,
        page: query?.page || 1,
        limit: query?.limit || 10,
        totalPages: 1,
        counts: { pending: 0, inProgress: 0, resolved: 0, rejected: 0, urgent: 0 },
      }
    }
  },

  /**
   * Get single grievance detail for landlord
   */
  async getLandlordGrievanceById(id: string): Promise<AdminGrievanceItem> {
    return api.get<AdminGrievanceItem>(`/v1/landlord/grievances/${id}`)
  },

  /**
   * Mark grievance as in-progress by landlord
   */
  async updateLandlordGrievanceInProgress(id: string): Promise<AdminGrievanceItem> {
    return api.patch<AdminGrievanceItem>(`/v1/landlord/grievances/${id}/in-progress`, {})
  },

  /**
   * Resolve grievance with written resolution note by landlord
   */
  async resolveLandlordGrievance(
    id: string,
    payload: ResolveGrievancePayload,
  ): Promise<AdminGrievanceItem> {
    return api.patch<AdminGrievanceItem>(`/v1/landlord/grievances/${id}/resolve`, payload)
  },

  // ─── STAFF METHODS ───────────────────────────────────────────────

  /**
   * Retrieve grievances queue for staff assigned boarding houses
   */
  async getStaffGrievances(query?: AdminGrievanceQuery): Promise<AdminGrievanceListResponse> {
    try {
      return await api.get<AdminGrievanceListResponse>('/v1/staff/grievances', {
        params: buildParams(query),
        silent: true,
      })
    } catch {
      return {
        success: false,
        items: [],
        total: 0,
        page: query?.page || 1,
        limit: query?.limit || 10,
        totalPages: 1,
        counts: { pending: 0, inProgress: 0, resolved: 0, rejected: 0, urgent: 0 },
      }
    }
  },

  /**
   * Get single grievance detail for staff
   */
  async getStaffGrievanceById(id: string): Promise<AdminGrievanceItem> {
    return api.get<AdminGrievanceItem>(`/v1/staff/grievances/${id}`)
  },

  /**
   * Mark grievance as in-progress by staff
   */
  async updateStaffGrievanceInProgress(id: string): Promise<AdminGrievanceItem> {
    return api.patch<AdminGrievanceItem>(`/v1/staff/grievances/${id}/in-progress`, {})
  },

  /**
   * Resolve grievance with written resolution note by staff
   */
  async resolveStaffGrievance(
    id: string,
    payload: ResolveGrievancePayload,
  ): Promise<AdminGrievanceItem> {
    return api.patch<AdminGrievanceItem>(`/v1/staff/grievances/${id}/resolve`, payload)
  },

  // ─── ADMIN METHODS ───────────────────────────────────────────────

  /**
   * Retrieve admin grievances queue with priority ordering and counts
   */
  async getAdminGrievanceQueue(query?: AdminGrievanceQuery): Promise<AdminGrievanceListResponse> {
    return api.get<AdminGrievanceListResponse>('/v1/admin/grievances', {
      params: buildParams(query),
    })
  },

  /**
   * Get single grievance detail for admin
   */
  async getAdminGrievanceById(id: string): Promise<AdminGrievanceItem> {
    return api.get<AdminGrievanceItem>(`/v1/admin/grievances/${id}`)
  },

  /**
   * Mark grievance as in-progress
   */
  async updateGrievanceInProgress(id: string): Promise<AdminGrievanceItem> {
    return api.patch<AdminGrievanceItem>(`/v1/admin/grievances/${id}/in-progress`, {})
  },

  /**
   * Resolve grievance with written resolution note
   */
  async resolveGrievance(
    id: string,
    payload: ResolveGrievancePayload,
  ): Promise<AdminGrievanceItem> {
    return api.patch<AdminGrievanceItem>(`/v1/admin/grievances/${id}/resolve`, payload)
  },

  /**
   * Reject grievance with written explanation
   */
  async rejectGrievance(id: string, payload: RejectGrievancePayload): Promise<AdminGrievanceItem> {
    return api.patch<AdminGrievanceItem>(`/v1/admin/grievances/${id}/reject`, payload)
  },
}
