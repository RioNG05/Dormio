import type {
  SetupBoardingHousePayload,
  SetupCustomRoomPayload,
  SetupRoomTypePayload,
  SetupServicePayload,
} from '@/services/boarding-house.service'

export type WizardStep = 1 | 2 | 3 | 4

export interface ServiceItem extends SetupServicePayload {
  id: string
}

export interface RoomTypeItem extends SetupRoomTypePayload {
  id: string
}

export interface CustomRoomData {
  roomNumber: string
  area: string
  maxOccupants: number
  roomTypeIndex: number
  serviceIndices: number[]
  isCustomized: boolean
}

export interface GeneralInfoState {
  name: string
  description: string
  country: string
  province: string
  city: string
  ward: string
  street: string
  houseNumber: string
  totalFloor: string
  builtAt: string
  thumbnail: string
}

export interface RoomsConfigState {
  floorCount: number
  roomsPerFloor: number
  nameFormat: string
  area: string
  maxOccupants: number
  roomTypeIndex: number
  serviceIndices: number[]
}

export interface BankInfoState {
  bankName: string
  accountNumber: string
  accountName: string
}

export interface AmenityItem {
  id: string
  name: string
  checked: boolean
  key?: string
  isCustom?: boolean
}

export const DEFAULT_AMENITIES: Omit<AmenityItem, 'id'>[] = [
  { name: 'WiFi', checked: true, key: 'WiFi' },
  { name: 'Điều hòa', checked: true, key: 'AirConditioner' },
  { name: 'Nóng lạnh', checked: true, key: 'WaterHeater' },
  { name: 'Tủ lạnh', checked: true, key: 'Refrigerator' },
  { name: 'Máy giặt', checked: true, key: 'WashingMachine' },
  { name: 'Giường', checked: true, key: 'Bed' },
  { name: 'Tủ quần áo', checked: true, key: 'Wardrobe' },
  { name: 'Kệ bếp', checked: true, key: 'KitchenShelf' },
  { name: 'WC riêng', checked: true, key: 'PrivateBathroom' },
  { name: 'Ban công', checked: false, key: 'Balcony' },
  { name: 'Tivi', checked: false, key: 'Tv' },
  { name: 'Bảo vệ', checked: true, key: 'SecurityGuard' },
  { name: 'Khóa vân tay', checked: true },
  { name: 'Chỗ để xe', checked: true },
  { name: 'Camera an ninh', checked: true },
  { name: 'Thang máy', checked: false },
]

export const MAX_FREE_TIER_ROOMS = 10

export const POPULAR_BANKS = [
  'MB Bank',
  'Vietcombank',
  'Techcombank',
  'VPBank',
  'ACB',
  'BIDV',
  'VietinBank',
  'TPBank',
]

export const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
