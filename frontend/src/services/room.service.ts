import { api } from './api'

export interface RoomTypeItem {
  id: string
  name: string
  description?: string | null
}

export interface RoomServiceItem {
  id: string
  name: string
  price: string
  unit: string
  isMetered: boolean
}

export interface RoomItem {
  id: string
  boardingHouseId: string
  roomNumber: string
  floor: number
  area?: string | null
  maxOccupants?: number | null
  status: 'available' | 'deposited' | 'occupied' | 'maintainace' | string
  imageUrl?: string | null
  roomType: RoomTypeItem
  services: RoomServiceItem[]
  createdAt: string
  updatedAt?: string | null
}

export interface RoomMetadata {
  roomTypes: RoomTypeItem[]
  services: RoomServiceItem[]
  maxRoom: number
  currentRoomCount: number
}

export interface BulkGeneratePayload {
  floorCount: number
  roomsPerFloor: number
  nameFormat: string
  area?: number
  maxOccupants?: number
  roomTypeId: string
  serviceIds?: string[]
}

export interface BulkGenerateResult {
  success: boolean
  count: number
  data: RoomItem[]
}

export interface RoomListResult {
  data: RoomItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RoomQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  floor?: number
}

/**
 * Bulk generate rooms for a boarding house
 */
export async function bulkGenerateRooms(
  boardingHouseId: string,
  payload: BulkGeneratePayload,
): Promise<BulkGenerateResult> {
  const res = await api.post<any>('/v1/rooms/bulk-generate', payload, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  })
  return res?.data?.count !== undefined ? res.data : res
}

/**
 * Fetch room metadata (room types, services, plan quota)
 */
export async function getRoomMetadata(boardingHouseId: string): Promise<RoomMetadata> {
  const res = await api.get<any>('/v1/rooms/metadata', {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  })
  return res?.data?.roomTypes ? res.data : res?.roomTypes ? res : (res?.data ?? res)
}

/**
 * List rooms with pagination and filters
 */
export async function getRooms(
  boardingHouseId: string,
  query?: RoomQueryParams,
): Promise<RoomListResult> {
  const params: Record<string, string> = {}
  if (query?.page) params.page = String(query.page)
  if (query?.limit) params.limit = String(query.limit)
  if (query?.search) params.search = query.search
  if (query?.status) params.status = query.status
  if (query?.floor !== undefined) params.floor = String(query.floor)

  const res = await api.get<any>('/v1/rooms', {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
    params,
  })

  // TransformInterceptor wraps response in { success: true, data: { data: RoomItem[], meta: ... } }
  const payload = res?.data ?? res
  return {
    data: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
    meta: payload?.meta ?? {
      page: Number(query?.page || 1),
      limit: Number(query?.limit || 10),
      total: Array.isArray(payload?.data) ? payload.data.length : 0,
      totalPages: 1,
    },
  }
}

export interface CreateRoomPayload {
  roomNumber: string
  floor: number
  roomTypeId: string
  area?: number
  maxOccupants?: number
  status?: string
  imageUrl?: string
  serviceIds?: string[]
}

export interface UpdateRoomPayload {
  roomNumber?: string
  floor?: number
  roomTypeId?: string
  area?: number
  maxOccupants?: number
  status?: string
  imageUrl?: string
  serviceIds?: string[]
}

/**
 * Create a single room
 */
export async function createRoom(
  boardingHouseId: string,
  payload: CreateRoomPayload,
): Promise<RoomItem> {
  const res = await api.post<any>('/v1/rooms', payload, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  })
  return res?.data ?? res
}

/**
 * Get single room details
 */
export async function getRoom(boardingHouseId: string, roomId: string): Promise<RoomItem> {
  const res = await api.get<any>(`/v1/rooms/${roomId}`, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  })
  return res?.data ?? res
}

/**
 * Update single room attributes and attached services
 */
export async function updateRoom(
  boardingHouseId: string,
  roomId: string,
  payload: UpdateRoomPayload,
): Promise<RoomItem> {
  const res = await api.patch<any>(`/v1/rooms/${roomId}`, payload, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  })
  return res?.data ?? res
}

export interface RoomDashboardTenant {
  id: string
  fullName: string
  phoneNumber: string
  email?: string | null
  avatarUrl?: string | null
  isPrimary?: boolean
  hasIdentification: boolean
  identityNumber?: string | null
  dateOfBirth?: string | null
  gender?: string | null
}

export interface RoomDashboardDeposit {
  id: string
  amount: string
  status: string
  type: string
}

export interface RoomDashboardDocument {
  id: string
  url: string
  createdAt: string
}

export interface RoomDashboardContract {
  id: string
  startDate: string
  endDate: string
  rentPrice: string
  monthlyPaymentDate: number
  status: string
  note?: string | null
  deposit?: RoomDashboardDeposit | null
  tenants: RoomDashboardTenant[]
  documents: RoomDashboardDocument[]
}

export interface RoomDashboardRentalHistoryItem {
  id: string
  startDate: string
  endDate: string
  rentPrice: string
  status: string
  primaryTenantName: string
  primaryTenantPhone: string
  tenantsCount: number
}

export interface RoomDashboardInvoice {
  id: string
  totalAmount: string
  status: string
  dueDate: string
  createdAt: string
  paymentStatus?: string | null
  paymentMethod?: string | null
}

export interface RoomDashboardMeterReading {
  id: string
  serviceId: string
  serviceName: string
  readingValue?: string | null
  imageUrl?: string | null
  createdAt: string
}

export interface RoomDashboardOccupant {
  id: string
  tenantId: string
  fullName: string
  phoneNumber: string
  email?: string | null
  avatarUrl?: string | null
  hasAccount: boolean
  hasIdentification: boolean
  identityNumber?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  status: string
  joinedAt: string
  note?: string | null
  hasContract: boolean
  contractId?: string | null
}

export interface RoomDashboardResponse {
  room: RoomItem
  services: RoomServiceItem[]
  occupants?: RoomDashboardOccupant[]
  currentContract?: RoomDashboardContract | null
  rentalHistory: RoomDashboardRentalHistoryItem[]
  invoices: RoomDashboardInvoice[]
  meterReadings: RoomDashboardMeterReading[]
  amenities?: RoomAmenityItem[]
}

/**
 * Get aggregated Room Dashboard
 */
export async function getRoomDashboard(
  boardingHouseId: string,
  roomId: string,
): Promise<RoomDashboardResponse> {
  const res = await api.get<any>(`/v1/rooms/${roomId}/dashboard`, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  })
  return res?.data?.room ? res.data : res?.room ? res : (res?.data ?? res)
}


export interface RoomAmenityItem {
  id: string
  name: string
  icon?: string | null
  isShared: boolean
}

export interface RoomAmenitiesResponse {
  currentAmenities: RoomAmenityItem[]
  availableSharedAmenities: RoomAmenityItem[]
}

export interface AddRoomAmenityPayload {
  amenityId?: string
  name?: string
  icon?: string
}

export interface UpdateRoomAmenityPayload {
  name: string
  icon?: string
  forkForRoom?: boolean
}

/**
 * Fetch amenities attached to a room and available shared amenities
 */
export async function getRoomAmenities(
  boardingHouseId: string,
  roomId: string,
): Promise<RoomAmenitiesResponse> {
  const res = await api.get<any>(`/v1/rooms/${roomId}/amenities`, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  })
  return res?.data ?? res
}

/**
 * Attach shared amenity or create new private amenity for a room
 */
export async function addRoomAmenity(
  boardingHouseId: string,
  roomId: string,
  payload: AddRoomAmenityPayload,
): Promise<RoomAmenityItem> {
  const res = await api.post<any>(`/v1/rooms/${roomId}/amenities`, payload, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  })
  return res?.data ?? res
}

/**
 * Update amenity (updates master record if shared; forks into private if forkForRoom is true)
 */
export async function updateRoomAmenity(
  boardingHouseId: string,
  roomId: string,
  amenityId: string,
  payload: UpdateRoomAmenityPayload,
): Promise<RoomAmenityItem & { forked?: boolean }> {
  const res = await api.patch<any>(`/v1/rooms/${roomId}/amenities/${amenityId}`, payload, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  })
  return res?.data ?? res
}

/**
 * Remove amenity from room (and deletes if private)
 */
export async function deleteRoomAmenity(
  boardingHouseId: string,
  roomId: string,
  amenityId: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<any>(`/v1/rooms/${roomId}/amenities/${amenityId}`, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  })
  return res?.data ?? res
}
