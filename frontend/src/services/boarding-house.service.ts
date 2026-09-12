import { api } from './api';

export interface InitialServicePayload {
  name: string;
  unit: string;
  price: string;
  isMetered: boolean;
}

export interface InitialRoomTypePayload {
  name: string;
  description?: string;
}

export interface CreateBoardingHousePayload {
  name: string;
  description?: string;
  country: string;
  province: string;
  city: string;
  district: string;
  ward: string;
  street: string;
  houseNumber: string;
  totalFloor?: number;
  builtAt: string;
  services: InitialServicePayload[];
  roomTypes: InitialRoomTypePayload[];
}

export interface BoardingHouseService {
  id: string;
  name: string;
  unit: string;
  price: string;
  isMetered: boolean;
}

export interface BoardingHouseRoomType {
  id: string;
  name: string;
  description: string | null;
}

export interface BoardingHouse {
  id: string;
  name: string;
  description: string | null;
  country: string;
  province: string;
  city: string;
  district: string;
  ward: string;
  street: string;
  houseNumber: string;
  totalFloor: number | null;
  builtAt: string;
  status: 'active' | 'inactive' | 'banned';
  services: BoardingHouseService[];
  roomTypes: BoardingHouseRoomType[];
}

export interface BoardingHouseListItem extends BoardingHouse {
  totalRooms: number;
}

export interface SetupServicePayload {
  name: string;
  price: string;
  unit: string;
  isMetered: boolean;
  autoApplied: boolean;
}

export interface SetupRoomTypePayload {
  name: string;
  description?: string;
}

export interface SetupRoomsPayload {
  floorCount: number;
  roomsPerFloor: number;
  nameFormat: string;
  area?: string;
  maxOccupants?: number;
  roomTypeIndex: number;
  serviceIndices?: number[];
}

export interface SetupBoardingHousePayload {
  name: string;
  description?: string;
  houseNumber: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  city?: string;
  country: string;
  totalFloor?: number;
  builtAt: string;
  thumbnail?: string;
  services?: SetupServicePayload[];
  roomTypes: SetupRoomTypePayload[];
  rooms: SetupRoomsPayload;
}

export interface SetupBoardingHouseResponse {
  success: boolean;
  boardingHouse: BoardingHouse;
  roomsCreated: number;
}

export async function setupBoardingHouse(
  payload: SetupBoardingHousePayload,
): Promise<SetupBoardingHouseResponse> {
  const response = await api.post<SetupBoardingHouseResponse>(
    '/v1/boarding-houses/setup',
    payload,
  );
  return response;
}

export async function createBoardingHouse(
  payload: CreateBoardingHousePayload,
): Promise<BoardingHouse> {
  const response = await api.post<{ success: boolean; data: BoardingHouse }>(
    '/v1/boarding-houses',
    payload,
  );
  return response.data;
}

/**
 * Fetch all boarding houses owned by the authenticated landlord.
 * Used to populate the building selector in AuthContext with real UUIDs.
 */
export async function getMyBoardingHouses(options?: { silent?: boolean }): Promise<BoardingHouseListItem[]> {
  const response = await api.get<{ success: boolean; data: BoardingHouseListItem[] }>(
    '/v1/boarding-houses',
    options
  );
  return response.data;
}

export interface OverviewRooms {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  depositRooms: number;
  maintenanceRooms: number;
  occupancyRate: string;
}

export interface OverviewFinancial {
  currentMonthRevenue: string;
  unpaidDebt: string;
  unpaidInvoicesCount: number;
  paidInvoicesCount: number;
}

export interface OverviewRevenueMonth {
  month: string;
  val: number;
  fullAmount: string;
}

export interface OverviewDepositItem {
  id: string;
  room: string;
  tenant: string;
  amount: number;
  date: string;
  type: string;
  status: string;
}

export interface OverviewMaintenanceItem {
  id: string;
  room: string;
  issue: string;
  priority: string;
  reporter: string;
  date: string;
  status: string;
}

export interface OverviewExpiringContract {
  id: string;
  room: string;
  tenant: string;
  phone: string;
  daysLeft: number;
  endDate: string;
}

export interface OverviewCollectionStatus {
  paidCount: number;
  paidAmount: string;
  unpaidCount: number;
  unpaidAmount: string;
  overdueCount: number;
  overdueAmount: string;
  totalBilledAmount: string;
  collectionRate: string;
}

export interface OverviewOccupancyMonth {
  month: string;
  occupied: number;
  total: number;
  count: number;
}

export interface BoardingHouseOverview {
  rooms: OverviewRooms;
  financial: OverviewFinancial;
  collectionStatus?: OverviewCollectionStatus;
  revenueChart: OverviewRevenueMonth[];
  occupancyChart?: OverviewOccupancyMonth[];
  depositNotifications: OverviewDepositItem[];
  maintenanceRequests: OverviewMaintenanceItem[];
  expiringContracts: OverviewExpiringContract[];
}

export async function getBoardingHouseOverview(
  boardingHouseId: string,
): Promise<BoardingHouseOverview> {
  const response = await api.get<{ success: boolean; data: BoardingHouseOverview }>(
    `/v1/boarding-houses/${boardingHouseId}/overview`,
  );
  return response.data || (response as unknown as BoardingHouseOverview);
}

export async function getPropertyAnalytics(
  boardingHouseId: string,
): Promise<BoardingHouseOverview> {
  const response = await api.get<{ success: boolean; data: BoardingHouseOverview }>(
    `/v1/boarding-houses/${boardingHouseId}/analytics`,
  );
  return response.data || (response as unknown as BoardingHouseOverview);
}

// ─── UC-L-24: Multi-Property Reports & Portfolio Analytics ───────────────────

export interface MultiPropertyPortfolioSummary {
  totalProperties: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  depositRooms: number;
  maintenanceRooms: number;
  occupancyRate: string;
  currentMonthRevenue: string;
  currentMonthExpenses: string;
  netProfit: string;
  unpaidDebt: string;
  unpaidInvoicesCount: number;
  paidInvoicesCount: number;
  collectionRate: string;
}

export interface MultiPropertyBreakdown {
  id: string;
  name: string;
  address: string;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: string;
  currentMonthRevenue: string;
  currentMonthExpenses: string;
  netProfit: string;
  unpaidDebt: string;
  unpaidInvoicesCount: number;
  expiringContractsCount: number;
}

export interface MultiPropertyExpiringContract {
  id: string;
  propertyName: string;
  room: string;
  tenant: string;
  phone: string;
  daysLeft: number;
  endDate: string;
}

export interface MultiPropertyOverview {
  portfolioSummary: MultiPropertyPortfolioSummary;
  propertiesBreakdown: MultiPropertyBreakdown[];
  revenueChart: OverviewRevenueMonth[];
  occupancyChart: OverviewOccupancyMonth[];
  expiringContracts: MultiPropertyExpiringContract[];
}

export interface AiStrategyActionStep {
  dayRange: string;
  title: string;
  description: string;
}

export interface AiStrategyResponse {
  title: string;
  executiveSummary: string;
  pricingRecommendations: string[];
  marketingCampaigns: string[];
  operationalOptimizations: string[];
  actionPlan30Days: AiStrategyActionStep[];
  createdAt: string;
}

export async function getMultiPropertyOverview(): Promise<MultiPropertyOverview> {
  const response = await api.get<{ success: boolean; data: MultiPropertyOverview }>(
    '/v1/boarding-houses/multi-property/overview',
  );
  return response.data || (response as unknown as MultiPropertyOverview);
}

export async function generateMultiPropertyAiStrategy(): Promise<AiStrategyResponse> {
  const response = await api.post<{ success: boolean; data: AiStrategyResponse }>(
    '/v1/boarding-houses/multi-property/ai-strategy',
    {},
  );
  return response.data || (response as unknown as AiStrategyResponse);
}

export interface UserProfileDetails {
  id: string;
  name: string;
  username: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  role: string;
  status?: string;
  createdAt: string;
  idCardVerified?: boolean;
  idCardNumber?: string;
  totalProperties?: number;
  roomNumber?: string;
}

export interface AdminBoardingHouseDetail {
  id: string;
  name: string;
  description: string | null;
  address: string;
  rawAddress?: {
    houseNumber: string;
    street: string;
    ward: string;
    district: string;
    city: string;
    province: string;
    country: string;
  };
  builtAt: string;
  totalFloor: number;
  status: 'active' | 'inactive' | 'locked' | 'reported' | 'banned';
  lockReason?: string;
  lockedAt?: string;
  thumbnail: string;
  stats: {
    totalRooms: number;
    occupiedRooms: number;
    vacantRooms: number;
    occupancyRate: number;
  };
  owner: UserProfileDetails;
  services: {
    id: string;
    name: string;
    price: number;
    unit: string;
    autoApplied: boolean;
    isMetered: boolean;
  }[];
  roomTypes: {
    id: string;
    name: string;
    description: string | null;
    area: number;
    basePrice: number;
    roomsCount: number;
  }[];
  grievances: {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
    createdAt: string;
    resolvedAt?: string | null;
    resolutionNote?: string | null;
    images?: string[];
    sender: UserProfileDetails;
  }[];
}

export async function getBoardingHouseDetail(id: string): Promise<AdminBoardingHouseDetail> {
  const response = await api.get<any>(`/v1/boarding-houses/${id}/details`);
  return (response?.data?.data || response?.data || response) as AdminBoardingHouseDetail;
}

export interface AdminHousesFilterParams {
  propertyQuery?: string;
  landlordQuery?: string;
  minRooms?: number | string;
  maxRooms?: number | string;
  minOccupancy?: number | string;
  maxOccupancy?: number | string;
  status?: string; // Comma-separated or single, e.g. "active,reported"
  page?: number;
  limit?: number;
}

export interface AdminHouseModerationItem {
  id: string;
  name: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  address: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  status: 'active' | 'locked' | 'reported';
  reportsCount: number;
  reportReasons: string[];
  lockReason?: string;
  lockedAt?: string;
  createdAt: string;
  coverImage: string;
}

export interface AdminHousesListResponse {
  success: boolean;
  data: AdminHouseModerationItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Fetch boarding houses for admin moderation with multi-value filtering and pagination.
 */
export async function getAdminHouses(
  params?: AdminHousesFilterParams,
): Promise<AdminHousesListResponse> {
  const queryParams: Record<string, string> = {};

  if (params?.propertyQuery?.trim()) queryParams.propertyQuery = params.propertyQuery.trim();
  if (params?.landlordQuery?.trim()) queryParams.landlordQuery = params.landlordQuery.trim();
  if (params?.minRooms !== undefined && params.minRooms !== '' && params.minRooms !== null) {
    queryParams.minRooms = String(params.minRooms);
  }
  if (params?.maxRooms !== undefined && params.maxRooms !== '' && params.maxRooms !== null) {
    queryParams.maxRooms = String(params.maxRooms);
  }
  if (params?.minOccupancy !== undefined && params.minOccupancy !== '' && params.minOccupancy !== null) {
    queryParams.minOccupancy = String(params.minOccupancy);
  }
  if (params?.maxOccupancy !== undefined && params.maxOccupancy !== '' && params.maxOccupancy !== null) {
    queryParams.maxOccupancy = String(params.maxOccupancy);
  }
  if (params?.status && params.status !== 'all') {
    queryParams.status = params.status;
  }
  if (params?.page) queryParams.page = String(params.page);
  if (params?.limit) queryParams.limit = String(params.limit);

  const response = await api.get<AdminHousesListResponse>('/v1/admin/houses', {
    params: queryParams,
    silent: true,
  });

  return response;
}

/**
 * Lock a boarding house with reason.
 */
export async function lockAdminHouse(id: string, reason: string): Promise<any> {
  return api.patch(`/v1/admin/houses/${id}/lock`, { reason });
}

/**
 * Unlock a boarding house.
 */
export async function unlockAdminHouse(id: string): Promise<any> {
  return api.patch(`/v1/admin/houses/${id}/unlock`);
}




