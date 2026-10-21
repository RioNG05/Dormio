import { api } from './api'

export type AssetCondition = 'new' | 'good' | 'damaged' | 'under_repair' | 'lost' | 'disposed'

export interface AssetTenantInfo {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  avatarUrl?: string | null
  contractId?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface AssetItem {
  id: string
  code: string
  name: string
  category: string | null
  location: string
  roomId?: string | null
  roomNumber?: string | null
  roomName: string
  quantity: number
  condition: AssetCondition
  purchasePrice?: number | null
  purchaseDate?: string | null
  imageUrl?: string | null
  note?: string | null
  depreciationYears?: number | null
  modelCode?: string | null
  serialNumber?: string | null
  warrantyPeriod?: string | null
  supplier?: string | null
  tenant?: AssetTenantInfo | null
  createdAt: string
  updatedAt: string
  boardingHouseId: string
}

export interface AssetsSummary {
  totalItems: number
  totalQuantity: number
  totalValue: number
  goodConditionCount: number
  needsRepairCount: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AssetsListResponse {
  success: boolean
  data: AssetItem[]
  pagination: PaginationMeta
  summary: AssetsSummary
}

export interface AssetMaintenanceLog {
  id: string
  assetId: string
  boardingHouseId: string
  type: string
  description: string
  cost: number
  performer?: string | null
  performedAt: string
  createdAt: string
}

export interface MaintenanceLogsListResponse {
  success: boolean
  data: AssetMaintenanceLog[]
  totalCost: number
}

export interface CreateAssetPayload {
  name: string
  category?: string
  location: string
  roomId?: string | null
  quantity?: number
  condition?: AssetCondition
  purchasePrice?: number
  purchaseDate?: string
  imageUrl?: string
  note?: string
  depreciationYears?: number
  modelCode?: string
  serialNumber?: string
  warrantyPeriod?: string
  supplier?: string
}

export interface UpdateAssetPayload extends Partial<CreateAssetPayload> {}

export interface CreateMaintenanceLogPayload {
  type: string
  description: string
  cost?: number
  performer?: string
  performedAt?: string
  setCondition?: AssetCondition
}

export const assetService = {
  /**
   * List paginated assets for a boarding house with summary metrics
   */
  async getAssets(
    buildingId: string,
    params?: {
      search?: string
      category?: string
      condition?: string
      roomId?: string
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    },
  ): Promise<AssetsListResponse> {
    const queryParams: Record<string, string> = {}
    if (params?.search) queryParams.search = params.search
    if (params?.category && params.category !== 'all') queryParams.category = params.category
    if (params?.condition && params.condition !== 'all') queryParams.condition = params.condition
    if (params?.roomId && params.roomId !== 'all') queryParams.roomId = params.roomId
    if (params?.page) queryParams.page = String(params.page)
    if (params?.limit) queryParams.limit = String(params.limit)
    if (params?.sortBy) queryParams.sortBy = params.sortBy
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder

    return api.get<AssetsListResponse>(`/v1/landlord/assets`, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
      params: queryParams,
    })
  },

  /**
   * Get single asset detail by ID
   */
  async getAssetDetail(
    buildingId: string,
    id: string,
  ): Promise<{ success: boolean; data: AssetItem }> {
    return api.get<{ success: boolean; data: AssetItem }>(`/v1/landlord/assets/${id}`, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    })
  },

  /**
   * Create a new asset
   */
  async createAsset(
    buildingId: string,
    payload: CreateAssetPayload,
  ): Promise<{ success: boolean; data: AssetItem }> {
    return api.post<{ success: boolean; data: AssetItem }>(`/v1/landlord/assets`, payload, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    })
  },

  /**
   * Update an existing asset
   */
  async updateAsset(
    buildingId: string,
    id: string,
    payload: UpdateAssetPayload,
  ): Promise<{ success: boolean; data: AssetItem }> {
    return api.patch<{ success: boolean; data: AssetItem }>(`/v1/landlord/assets/${id}`, payload, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    })
  },

  /**
   * Delete an asset
   */
  async deleteAsset(
    buildingId: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/v1/landlord/assets/${id}`, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    })
  },

  /**
   * Get maintenance logs for an asset
   */
  async getMaintenanceLogs(
    buildingId: string,
    assetId: string,
  ): Promise<MaintenanceLogsListResponse> {
    return api.get<MaintenanceLogsListResponse>(`/v1/landlord/assets/${assetId}/maintenance-logs`, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    })
  },

  /**
   * Create a maintenance log for an asset
   */
  async createMaintenanceLog(
    buildingId: string,
    assetId: string,
    payload: CreateMaintenanceLogPayload,
  ): Promise<{ success: boolean; data: AssetMaintenanceLog }> {
    return api.post<{ success: boolean; data: AssetMaintenanceLog }>(
      `/v1/landlord/assets/${assetId}/maintenance-logs`,
      payload,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    )
  },

  /**
   * Delete a maintenance log
   */
  async deleteMaintenanceLog(
    buildingId: string,
    assetId: string,
    logId: string,
  ): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(
      `/v1/landlord/assets/${assetId}/maintenance-logs/${logId}`,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    )
  },
}
