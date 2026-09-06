import { api } from './api';

export interface RoomTypeItem {
  id: string;
  name: string;
  description?: string | null;
}

export interface RoomServiceItem {
  id: string;
  name: string;
  price: string;
  unit: string;
  isMetered: boolean;
}

export interface RoomItem {
  id: string;
  boardingHouseId: string;
  roomNumber: string;
  floor: number;
  area?: string | null;
  maxOccupants?: number | null;
  status: 'available' | 'deposited' | 'occupied' | 'maintainace' | string;
  imageUrl?: string | null;
  roomType: RoomTypeItem;
  services: RoomServiceItem[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface RoomMetadata {
  roomTypes: RoomTypeItem[];
  services: RoomServiceItem[];
  maxRoom: number;
  currentRoomCount: number;
}

export interface BulkGeneratePayload {
  floorCount: number;
  roomsPerFloor: number;
  nameFormat: string;
  area?: number;
  maxOccupants?: number;
  roomTypeId: string;
  serviceIds?: string[];
}

export interface BulkGenerateResult {
  success: boolean;
  count: number;
  data: RoomItem[];
}

export interface RoomListResult {
  data: RoomItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoomQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  floor?: number;
}

/**
 * Bulk generate rooms for a boarding house (UC-L-02)
 */
export async function bulkGenerateRooms(
  boardingHouseId: string,
  payload: BulkGeneratePayload,
): Promise<BulkGenerateResult> {
  return api.post<BulkGenerateResult>('/v1/rooms/bulk-generate', payload, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  });
}

/**
 * Fetch room metadata (room types, services, plan quota)
 */
export async function getRoomMetadata(boardingHouseId: string): Promise<RoomMetadata> {
  return api.get<RoomMetadata>('/v1/rooms/metadata', {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  });
}

/**
 * List rooms with pagination and filters
 */
export async function getRooms(
  boardingHouseId: string,
  query?: RoomQueryParams,
): Promise<RoomListResult> {
  const params: Record<string, string> = {};
  if (query?.page) params.page = String(query.page);
  if (query?.limit) params.limit = String(query.limit);
  if (query?.search) params.search = query.search;
  if (query?.status) params.status = query.status;
  if (query?.floor !== undefined) params.floor = String(query.floor);

  return api.get<RoomListResult>('/v1/rooms', {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
    params,
  });
}

/**
 * Update single room attributes
 */
export async function updateRoom(
  boardingHouseId: string,
  roomId: string,
  payload: Partial<{
    roomNumber: string;
    floor: number;
    area: number;
    maxOccupants: number;
    roomTypeId: string;
    status: string;
  }>,
): Promise<RoomItem> {
  return api.patch<RoomItem>(`/v1/rooms/${roomId}`, payload, {
    headers: {
      'x-boarding-house-id': boardingHouseId,
    },
  });
}
