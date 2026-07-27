import { create } from "zustand";
import { BoardingHouse } from "@/types";

interface HouseState {
  houses: BoardingHouse[];
  selectedHouseId: string | null;
  selectedHouse: BoardingHouse | null;
  setHouses: (houses: BoardingHouse[]) => void;
  selectHouse: (houseId: string) => void;
}

const DEFAULT_MOCK_HOUSES: BoardingHouse[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    landlordId: "22222222-2222-2222-2222-222222222222",
    name: "Dormio House Quận 1",
    address: "123 Nguyễn Huệ",
    city: "TP. Hồ Chí Minh",
    district: "Quận 1",
    ward: "Phường Bến Nghé",
    totalFloors: 5,
    description: "Tòa nhà căn hộ dịch vụ cao cấp full nội thất",
    rules: "Giờ giấc tự do, giữ vệ sinh chung",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    landlordId: "22222222-2222-2222-2222-222222222222",
    name: "Dormio Student House Cầu Giấy",
    address: "45 Chùa Láng",
    city: "Hà Nội",
    district: "Đống Đa",
    ward: "Phường Láng Thượng",
    totalFloors: 4,
    description: "Chung cư mini giá rẻ gần các trường đại học",
    rules: "Không tụ tập quá 23h",
  },
];

export const useHouseStore = create<HouseState>((set) => ({
  houses: DEFAULT_MOCK_HOUSES,
  selectedHouseId: DEFAULT_MOCK_HOUSES[0].id,
  selectedHouse: DEFAULT_MOCK_HOUSES[0],

  setHouses: (houses: BoardingHouse[]) => {
    set({
      houses,
      selectedHouseId: houses.length > 0 ? houses[0].id : null,
      selectedHouse: houses.length > 0 ? houses[0] : null,
    });
  },

  selectHouse: (houseId: string) => {
    set((state) => {
      const house = state.houses.find((h) => h.id === houseId) || null;
      return { selectedHouseId: houseId, selectedHouse: house };
    });
  },
}));
