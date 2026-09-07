import { api } from './api';

export interface PendingDepositResponse {
  depositId: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
  room: {
    id: string;
    roomNumber: string;
    floor: number;
    roomTypeName?: string;
  };
  post?: {
    id: string;
    title: string;
    depositAmount: number;
  } | null;
  tenant?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email?: string | null;
    userIdentification?: any | null;
  } | null;
}

export interface TenantSearchResult {
  exists: boolean;
  user: {
    id: string;
    phoneNumber: string;
    fullName?: string | null;
    email?: string | null;
    hasIdentification: boolean;
    identification?: any | null;
  } | null;
}

export interface CreateContractPlatformPayload {
  roomId: string;
  startDate: string;
  endDate: string;
  rentPrice: number;
  monthlyPaymentDate: number;
  rentPaymentCycle?: number;
  note?: string;
}

export interface TenantIdentificationPayload {
  identityNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  nationality?: string;
  placeOfOrigin?: any;
  placeOfResidence?: any;
  issueDate?: string;
  expiryDate?: string;
  note?: string;
  cardFrontUrl?: string;
  cardBackUrl?: string;
}

export interface CreateContractDirectPayload {
  roomId: string;
  startDate: string;
  endDate: string;
  rentPrice: number;
  depositAmount: number;
  monthlyPaymentDate: number;
  rentPaymentCycle?: number;
  note?: string;
  tenantPhoneNumber: string;
  tenantFullName: string;
  tenantEmail?: string;
  identification?: TenantIdentificationPayload;
}

export interface ContractItem {
  id: string;
  status: 'draft' | 'active' | 'expired' | 'canceled' | string;
  startDate: string;
  endDate: string;
  rentPrice: number;
  monthlyPaymentDate: number;
  note?: string | null;
  depositAmount: number;
  room: {
    id: string;
    roomNumber: string;
    floor: number;
    roomTypeName?: string;
  };
  tenant?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email?: string | null;
  } | null;
  documentsCount: number;
  createdAt: string;
}

export interface ContractListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: ContractItem[];
}

/**
 * Checks whether a room has a pending paid platform deposit (Flow A pre-check)
 */
export async function getPendingPlatformDeposit(
  buildingId: string,
  roomId: string,
): Promise<{ success: boolean; data: PendingDepositResponse | null }> {
  return api.get<{ success: boolean; data: PendingDepositResponse | null }>(
    `/landlord/contracts/rooms/${roomId}/pending-deposit`,
    {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    },
  );
}

/**
 * Searches a tenant user by phone number (Flow B helper)
 */
export async function searchTenantByPhone(
  phoneNumber: string,
): Promise<{ success: boolean; data: TenantSearchResult }> {
  return api.get<{ success: boolean; data: TenantSearchResult }>(
    `/landlord/contracts/tenants/search`,
    {
      params: { phoneNumber },
    },
  );
}

/**
 * Creates contract from platform deposit (Flow A)
 */
export async function createPlatformContract(
  buildingId: string,
  payload: CreateContractPlatformPayload,
): Promise<{ success: boolean; data: any }> {
  return api.post<{ success: boolean; data: any }>(
    `/landlord/contracts/platform`,
    payload,
    {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    },
  );
}

/**
 * Creates direct rental contract (Flow B)
 */
export async function createDirectContract(
  buildingId: string,
  payload: CreateContractDirectPayload,
): Promise<{ success: boolean; data: any }> {
  return api.post<{ success: boolean; data: any }>(
    `/landlord/contracts/direct`,
    payload,
    {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    },
  );
}

/**
 * Retrieves paginated landlord contracts
 */
export async function getLandlordContracts(
  buildingId: string,
  params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  },
): Promise<ContractListResponse> {
  const queryParams: Record<string, string> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.status) queryParams.status = params.status;
  if (params?.page) queryParams.page = String(params.page);
  if (params?.limit) queryParams.limit = String(params.limit);

  return api.get<ContractListResponse>(`/landlord/contracts`, {
    headers: {
      'X-Boarding-House-Id': buildingId,
    },
    params: queryParams,
  });
}

/**
 * Retrieves contract detail by ID
 */
export async function getContractById(
  buildingId: string,
  contractId: string,
): Promise<{ success: boolean; data: any }> {
  return api.get<{ success: boolean; data: any }>(
    `/landlord/contracts/${contractId}`,
    {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    },
  );
}
