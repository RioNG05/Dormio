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
export async function getMyBoardingHouses(): Promise<BoardingHouseListItem[]> {
  const response = await api.get<{ success: boolean; data: BoardingHouseListItem[] }>(
    '/v1/boarding-houses',
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


