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

export async function createBoardingHouse(
  payload: CreateBoardingHousePayload,
): Promise<BoardingHouse> {
  const response = await api.post<{ success: boolean; data: BoardingHouse }>(
    '/v1/boarding-houses',
    payload,
  );
  return response.data;
}
