import { api } from './api'

export interface SearchTenantResult {
  success: boolean
  found: boolean
  inBuilding: boolean
  user: {
    id: string
    phoneNumber: string
    fullName: string
    email?: string | null
    avatarUrl?: string | null
  } | null
}

export interface QuickAddTenantPayload {
  phoneNumber: string
  fullName: string
  roomId: string
  note?: string
}

export interface RoomOccupantDto {
  id: string
  boardingHouseId: string
  roomId: string
  roomNumber: string
  tenantId: string
  status: 'active' | 'moved_out'
  joinedAt: string
  leftAt?: string | null
  note?: string | null
  tenant: {
    id: string
    phoneNumber: string
    fullName: string
    email?: string | null
    avatarUrl?: string | null
    identityNumber?: string | null
    dateOfBirth?: string | null
    gender?: string | null
    placeOfResidence?: any
    cardFrontUrl?: string | null
    cardBackUrl?: string | null
    hasAccount: boolean
    mustChangePassword?: boolean
  }
}

export interface LandlordTenantItem {
  id: string
  userId: string
  fullName: string
  phoneNumber: string
  roomId?: string
  roomNumber: string
  boardingHouseId: string
  tenancyType: 'contract' | 'direct_occupant'
  contractId?: string
  status: string
  joinedAt: string
  endDate?: string
  daysRemaining?: number
  email?: string | null
  identityNumber?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  address?: string | null
  cardFrontUrl?: string | null
  cardBackUrl?: string | null
  hasAccount: boolean
  mustChangePassword?: boolean
}

export interface LandlordTenantListResult {
  data: LandlordTenantItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UpdateLandlordTenantPayload {
  fullName?: string
  identityNumber?: string
  dateOfBirth?: string
  gender?: 'male' | 'female'
  placeOfResidence?: any
  email?: string
  job?: string
  workplace?: string
  note?: string
}

export const searchTenantByPhone = async (
  boardingHouseId: string,
  phone: string,
): Promise<SearchTenantResult> => {
  const res = await api.get<any>(
    `/v1/landlord/tenants/search-user?phone=${encodeURIComponent(phone)}`,
    {
      headers: { 'X-Boarding-House-Id': boardingHouseId },
    },
  )
  return res?.data ?? res
}

export const quickAddTenant = async (
  boardingHouseId: string,
  payload: QuickAddTenantPayload,
): Promise<RoomOccupantDto> => {
  const res = await api.post<any>(
    '/v1/landlord/tenants/quick-add',
    payload,
    {
      headers: { 'X-Boarding-House-Id': boardingHouseId },
    },
  )
  return res?.data ?? res
}

export const getRoomOccupants = async (
  boardingHouseId: string,
  roomId: string,
): Promise<RoomOccupantDto[]> => {
  const res = await api.get<any>(
    `/v1/landlord/tenants/rooms/${encodeURIComponent(roomId)}/occupants`,
    {
      headers: { 'X-Boarding-House-Id': boardingHouseId },
    },
  )
  const payload = res?.data ?? res
  return Array.isArray(payload) ? payload : []
}

export const getLandlordTenants = async (
  boardingHouseId: string,
  query?: { page?: number; limit?: number; search?: string; roomId?: string; status?: string },
): Promise<LandlordTenantListResult> => {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', String(query.page))
  if (query?.limit) params.set('limit', String(query.limit))
  if (query?.search) params.set('search', query.search)
  if (query?.roomId) params.set('roomId', query.roomId)
  if (query?.status) params.set('status', query.status)

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const res = await api.get<any>(
    `/v1/landlord/tenants${queryString}`,
    {
      headers: { 'X-Boarding-House-Id': boardingHouseId },
    },
  )
  const payload = res?.data ?? res
  const rawList = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : []

  return {
    data: rawList,
    total: payload?.total ?? rawList.length,
    page: payload?.page ?? 1,
    limit: payload?.limit ?? 10,
    totalPages: payload?.totalPages ?? 1,
  }
}

export const updateLandlordTenant = async (
  boardingHouseId: string,
  tenantIdOrUserId: string,
  payload: UpdateLandlordTenantPayload,
): Promise<{ success: boolean; message: string }> => {
  const res = await api.patch<any>(
    `/v1/landlord/tenants/${encodeURIComponent(tenantIdOrUserId)}`,
    payload,
    {
      headers: { 'X-Boarding-House-Id': boardingHouseId },
    },
  )
  return res?.data ?? res
}

export const checkoutOccupant = async (
  boardingHouseId: string,
  occupantId: string,
): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete<any>(
    `/v1/landlord/tenants/occupants/${encodeURIComponent(occupantId)}`,
    {
      headers: { 'X-Boarding-House-Id': boardingHouseId },
    },
  )
  return res?.data ?? res
}
