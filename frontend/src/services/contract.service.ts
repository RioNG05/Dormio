import { api } from './api'

export interface PendingDepositResponse {
  depositId: string
  amount: number
  status: string
  type: string
  createdAt: string
  room: {
    id: string
    roomNumber: string
    floor: number
    roomTypeName?: string
  }
  post?: {
    id: string
    title: string
    depositAmount: number
  } | null
  tenant?: {
    id: string
    fullName: string
    phoneNumber: string
    email?: string | null
    userIdentification?: any | null
  } | null
}

export interface TenantSearchResult {
  exists: boolean
  user: {
    id: string
    phoneNumber: string
    fullName?: string | null
    email?: string | null
    hasIdentification: boolean
    identification?: any | null
  } | null
}

export interface CreateContractPlatformPayload {
  roomId: string
  startDate: string
  endDate: string
  rentPrice: number
  monthlyPaymentDate: number
  rentPaymentCycle?: number
  note?: string
}

export interface TenantIdentificationPayload {
  identityNumber: string
  fullName: string
  dateOfBirth: string
  gender: 'male' | 'female'
  nationality?: string
  placeOfOrigin?: any
  placeOfResidence?: any
  issueDate?: string
  expiryDate?: string
  note?: string
  cardFrontUrl?: string
  cardBackUrl?: string
}

export interface CreateContractDirectPayload {
  roomId: string
  startDate: string
  endDate: string
  rentPrice: number
  depositAmount: number
  monthlyPaymentDate: number
  rentPaymentCycle?: number
  note?: string
  tenantPhoneNumber: string
  tenantFullName: string
  tenantEmail?: string
  identification?: TenantIdentificationPayload
}

export interface ContractItem {
  id: string
  status: 'draft' | 'active' | 'expired' | 'canceled' | string
  startDate: string
  endDate: string
  rentPrice: number
  monthlyPaymentDate: number
  note?: string | null
  depositAmount: number
  room: {
    id: string
    roomNumber: string
    floor: number
    roomTypeName?: string
  }
  tenant?: {
    id: string
    fullName: string
    phoneNumber: string
    email?: string | null
  } | null
  documentsCount: number
  createdAt: string
}

export interface ContractListResponse {
  success: boolean
  total: number
  page: number
  limit: number
  totalPages: number
  data: ContractItem[]
}

/**
 * Checks whether a room has a pending paid platform deposit (Flow A pre-check)
 */
export async function getPendingPlatformDeposit(
  buildingId: string,
  roomId: string,
): Promise<{ success: boolean; data: PendingDepositResponse | null }> {
  return api.get<{ success: boolean; data: PendingDepositResponse | null }>(
    `/v1/landlord/contracts/rooms/${roomId}/pending-deposit`,
    {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    },
  )
}

/**
 * Searches a tenant user by phone number (Flow B helper)
 */
export async function searchTenantByPhone(
  phoneNumber: string,
): Promise<{ success: boolean; data: TenantSearchResult }> {
  return api.get<{ success: boolean; data: TenantSearchResult }>(
    `/v1/landlord/contracts/tenants/search`,
    {
      params: { phoneNumber },
    },
  )
}

/**
 * Creates contract from platform deposit (Flow A)
 */
export async function createPlatformContract(
  buildingId: string,
  payload: CreateContractPlatformPayload,
): Promise<{ success: boolean; data: any }> {
  return api.post<{ success: boolean; data: any }>(`/v1/landlord/contracts/platform`, payload, {
    headers: {
      'X-Boarding-House-Id': buildingId,
    },
  })
}

/**
 * Creates direct rental contract (Flow B)
 */
export async function createDirectContract(
  buildingId: string,
  payload: CreateContractDirectPayload,
): Promise<{ success: boolean; data: any }> {
  return api.post<{ success: boolean; data: any }>(`/v1/landlord/contracts/direct`, payload, {
    headers: {
      'X-Boarding-House-Id': buildingId,
    },
  })
}

/**
 * Retrieves paginated landlord contracts
 */
export async function getLandlordContracts(
  buildingId: string,
  params?: {
    search?: string
    status?: string
    page?: number
    limit?: number
  },
): Promise<ContractListResponse> {
  const queryParams: Record<string, string> = {}
  if (params?.search) queryParams.search = params.search
  if (params?.status) queryParams.status = params.status
  if (params?.page) queryParams.page = String(params.page)
  if (params?.limit) queryParams.limit = String(params.limit)

  return api.get<ContractListResponse>(`/v1/landlord/contracts`, {
    headers: {
      'X-Boarding-House-Id': buildingId,
    },
    params: queryParams,
  })
}

/**
 * Retrieves contract detail by ID
 */
export async function getContractById(
  buildingId: string,
  contractId: string,
): Promise<{ success: boolean; data: any }> {
  return api.get<{ success: boolean; data: any }>(`/v1/landlord/contracts/${contractId}`, {
    headers: {
      'X-Boarding-House-Id': buildingId,
    },
  })
}

export interface UpdateContractPayload {
  rentPrice?: number
  depositAmount?: number
  monthlyPaymentDate?: number
  endDate?: string
  note?: string
  reason: string
}

/**
 * Updates contract details (rent price, deposit, payment date, end date, reason)
 */
export async function updateContract(
  buildingId: string,
  contractId: string,
  payload: UpdateContractPayload,
): Promise<{ success: boolean; data: any }> {
  return api.patch<{ success: boolean; data: any }>(
    `/v1/landlord/contracts/${contractId}`,
    payload,
    {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    },
  )
}

export interface ExportContractResponse {
  documentId: string
  contractId: string
  url: string
  downloadUrl: string
  printUrl: string
  createdAt: string
  html?: string
}

export interface ContractDocumentItem {
  id: string
  contractId: string
  url: string
  downloadUrl: string
  printUrl: string
  createdAt: string
}

/**
 * Exports a contract document (persists ContractDocument, returns URLs and rendered HTML)
 */
export async function exportContract(
  buildingId: string,
  contractId: string,
): Promise<{ success: boolean; data: ExportContractResponse }> {
  return api.post<{ success: boolean; data: ExportContractResponse }>(
    `/v1/landlord/contracts/${contractId}/export`,
    {},
    {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    },
  )
}

/**
 * Retrieves list of documents generated for a contract
 */
export async function getContractDocuments(
  buildingId: string,
  contractId: string,
): Promise<{ success: boolean; data: ContractDocumentItem[] }> {
  return api.get<{ success: boolean; data: ContractDocumentItem[] }>(
    `/v1/landlord/contracts/${contractId}/documents`,
    {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    },
  )
}

/**
 * Fetches the rendered contract HTML template for preview or printing
 */
export async function getContractPrintHtml(
  buildingId: string,
  contractId: string,
  autoPrint: boolean = false,
): Promise<string> {
  return api.getText(`/v1/landlord/contracts/${contractId}/print`, {
    headers: {
      'X-Boarding-House-Id': buildingId,
    },
    params: {
      autoPrint: autoPrint ? 'true' : 'false',
    },
  })
}

/**
 * Triggers download of a contract document
 */
export async function downloadContractDocument(
  buildingId: string,
  contractId: string,
  documentId: string,
  filename?: string,
): Promise<void> {
  const blob = await api.getBlob(
    `/v1/landlord/contracts/${contractId}/documents/${documentId}/download`,
    {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    },
  )
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename || `hop-dong-${contractId.substring(0, 8)}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(downloadUrl)
}

/**
 * Fetches rendered contract HTML template for active tenant's tenancy
 */
export async function getTenantContractPrintHtml(
  autoPrint: boolean = false,
  contractId?: string,
): Promise<string> {
  return api.getText('/v1/tenant/tenancy/print', {
    params: {
      autoPrint: autoPrint ? 'true' : 'false',
      ...(contractId ? { contractId } : {}),
    },
  })
}

/**
 * Exports active tenant's contract document
 */
export async function exportTenantContract(contractId?: string): Promise<{
  success: boolean
  data: ExportContractResponse
}> {
  return api.post<{ success: boolean; data: ExportContractResponse }>(
    '/v1/tenant/tenancy/export',
    undefined,
    {
      params: contractId ? { contractId } : undefined,
    },
  )
}

/**
 * Triggers download of a contract document for tenant
 */
export async function downloadTenantContractDocument(
  documentId: string,
  filename?: string,
  contractId?: string,
): Promise<void> {
  const blob = await api.getBlob(`/v1/tenant/tenancy/documents/${documentId}/download`, {
    params: contractId ? { contractId } : undefined,
  })
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename || `hop-dong-thue-tro-${documentId.substring(0, 8)}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(downloadUrl)
}

export interface TenantTenancyItem {
  contractId: string
  roomId: string
  roomNumber: string
  floor: number
  roomTypeName?: string
  boardingHouseId: string
  boardingHouseName: string
  boardingHouseAddress: string
  rentPrice: number
  isPrimary: boolean
  startDate: string
  endDate: string
  coverPhotoUrl?: string
}

/**
 * Fetches all active room tenancies for the current tenant user across boarding houses
 */
export async function getMyTenancies(options?: {
  silent?: boolean
}): Promise<TenantTenancyItem[]> {
  const res = await api.get<{ success: boolean; data: TenantTenancyItem[] }>(
    '/v1/tenant/tenancies',
    options,
  )
  const data = (res as any)?.data ?? res
  return Array.isArray(data) ? data : []
}
