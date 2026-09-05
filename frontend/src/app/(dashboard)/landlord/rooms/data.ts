export interface RoomService {
  id: string;
  name: string;
  defaultPrice: string;
  customPrice: string;
  unit: string;
  isCustom: boolean;
  isRemovable: boolean;
}

export interface Room {
  id: string;          // Formatted ID: buildingSeq + roomStr (e.g. 1101, 1205, 2101, 3101)
  fullRoomId: string;  // Unique identifier for routing (e.g. 1101, 2101, 3101)
  roomNumber: string;  // Raw room number displayed on card (e.g. 101, 205)
  building: string;    // Building ID ('b1', 'b2', 'b3')
  buildingSeq: number; // Building Sequence number (1, 2, 3...)
  floor: string;
  status: "occupied" | "vacant" | "maintenance" | "reserved" | "Đang thuê" | "Trống" | "Bảo trì" | "Đặt cọc" | string;
  contract: "active" | "expired" | "none" | string;
  invoice: "paid" | "debt" | "none" | string;
  price?: string;
  area?: string;
  tenant?: string;
  tenantPhone?: string;
  tenantCccd?: string;
  tenantId?: string;
  amenities?: string[];
  notes?: string;
}

export const defaultRoomServices: RoomService[] = [
  { id: 'bao_ve', name: 'Bảo vệ', defaultPrice: '50.000', customPrice: '60.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
  { id: 'dien', name: 'Điện', defaultPrice: '3.500', customPrice: '3.500', unit: 'đ/kWh', isCustom: true, isRemovable: false },
  { id: 'nuoc', name: 'Nước', defaultPrice: '25.000', customPrice: '25.000', unit: 'đ/m³', isCustom: true, isRemovable: false },
  { id: 'rac', name: 'Rác', defaultPrice: '20.000', customPrice: '20.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
  { id: 've_sinh', name: 'Vệ sinh', defaultPrice: '30.000', customPrice: '30.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
  { id: 'wifi', name: 'Wifi', defaultPrice: '100.000', customPrice: '100.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
];

export const generateMockRooms = (): Room[] => {
  const data: Room[] = [];
  const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
  const dem = ["Văn", "Thị", "Hữu", "Minh", "Đức", "Ngọc", "Xuân", "Thu", "Thanh", "Hải", "Thành", "Công", "Quốc", "Khánh", "Gia"];
  const ten = ["An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Khang", "Linh", "Mai", "Nam", "Oanh", "Phong", "Quang", "Sơn", "Tuấn", "Uyên", "Vinh", "Vy", "Yến", "Tâm", "Thảo", "Trang", "Trung", "Tú", "Anh", "Bảo", "Châu", "Diệp", "Hân", "Khoa"];

  const buildRooms = (buildingId: string, buildingSeq: number, floors: number, roomsPerFloor: number) => {
    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        const roomStr = `${f}${r.toString().padStart(2, '0')}`;
        const seed = parseInt(roomStr) + buildingSeq * 17;
        const isTrang = (seed % 5 === 0) || (seed % 7 === 0);
        const isBaoTri = (seed % 13 === 0);

        let status = "occupied";
        if (isTrang) status = "vacant";
        else if (isBaoTri) status = "maintenance";
        else if (seed % 11 === 0) status = "reserved";

        const hash = parseInt(roomStr) * buildingSeq * 137 + 19;
        const isRented = status === 'occupied' || status === 'reserved';
        const tenantCccd = isRented ? `00109${(1000000 + hash * 5678).toString()}` : undefined;
        const fullRoomId = `${buildingSeq}${roomStr}`;

        data.push({
          id: roomStr,
          fullRoomId: fullRoomId,
          roomNumber: roomStr,
          building: buildingId,
          buildingSeq: buildingSeq,
          floor: f.toString(),
          status: status,
          contract: isRented ? (seed % 7 === 0 ? "expired" : "active") : "none",
          invoice: isRented ? (seed % 8 === 0 ? "debt" : "paid") : "none",
          price: "3.000.000 ₫",
          area: "25",
          tenant: isRented ? `${ho[hash % ho.length]} ${dem[(hash * 3) % dem.length]} ${ten[(hash * 7) % ten.length]}` : undefined,
          tenantPhone: isRented ? `09${(10000000 + hash * 1234).toString().padStart(8, '0')}` : undefined,
          tenantCccd: tenantCccd,
          tenantId: tenantCccd,
          amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng'],
          notes: ""
        });
      }
    }
  };

  buildRooms('b1', 1, 4, 15);
  buildRooms('b2', 2, 3, 10);
  buildRooms('b3', 3, 5, 8);
  return data;
};

export const cleanRoomNumber = (val?: string): string => {
  if (!val) return "101";
  const trimmed = val.trim();
  // If it's a 4-digit number like 1408, 1101, 2101, 3408, strip the first digit (building sequence)
  if (trimmed.length === 4 && /^[1-9]\d{3}$/.test(trimmed)) {
    return trimmed.slice(1);
  }
  return trimmed;
};

const STORAGE_KEY = "dormio_rooms_store_v5";

export const getAllRooms = (): Room[] => {
  if (typeof window === "undefined") {
    return generateMockRooms();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: Room[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(r => {
          const roomNum = cleanRoomNumber(r.roomNumber || r.id);
          return {
            ...r,
            id: roomNum,
            roomNumber: roomNum,
            fullRoomId: r.fullRoomId || `${r.buildingSeq || 1}${roomNum}`
          };
        });
      }
    }
  } catch (e) {
    console.error("Error loading rooms from storage", e);
  }
  const initial = generateMockRooms();
  saveAllRooms(initial);
  return initial;
};

export const saveAllRooms = (rooms: Room[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
      window.dispatchEvent(new Event("dormio_rooms_updated"));
    } catch (e) {
      console.error("Error saving rooms to storage", e);
    }
  }
};

export const getRoomById = (id: string): Room | null => {
  const rooms = getAllRooms();
  const rawId = decodeURIComponent(id).trim();

  // 1. Direct match by fullRoomId or id (e.g. 1101, 2101, 3101) or roomNumber
  let found = rooms.find(r => r.fullRoomId === rawId || r.id === rawId || r.roomNumber === rawId);

  // 2. Fallback match by compound or building-room string (e.g. b1-101 or 101)
  if (!found) {
    if (rawId.includes('-')) {
      const parts = rawId.split('-');
      const roomNum = parts[1];
      const seq = parts[0] === 'b2' ? 2 : parts[0] === 'b3' ? 3 : 1;
      found = rooms.find(r => r.fullRoomId === `${seq}${roomNum}` || (r.roomNumber === roomNum && r.buildingSeq === seq));
    } else if (rawId.length === 3) {
      // If only raw 3-digit room number passed, default to building 1
      found = rooms.find(r => r.fullRoomId === `1${rawId}` || r.roomNumber === rawId);
    }
  }

  // 3. Fallback generator if id is completely dynamic
  if (!found) {
    const bSeq = rawId.startsWith('2') ? 2 : rawId.startsWith('3') ? 3 : 1;
    const roomStr = rawId.length > 3 ? rawId.slice(1) : rawId;

    found = {
      id: roomStr,
      fullRoomId: rawId,
      roomNumber: roomStr,
      building: bSeq === 1 ? 'b1' : bSeq === 2 ? 'b2' : 'b3',
      buildingSeq: bSeq,
      floor: roomStr.charAt(0) || "1",
      status: "occupied",
      contract: "active",
      invoice: "paid",
      price: "3.000.000 ₫",
      area: "25",
      tenant: "Nguyễn Văn A",
      tenantPhone: "0901234567",
      tenantCccd: "001090123456",
      tenantId: "001090123456",
      amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng'],
      notes: ""
    };
  }

  return found || null;
};

export const updateRoom = (id: string, updates: Partial<Room>): Room | null => {
  const rooms = getAllRooms();
  const rawId = decodeURIComponent(id).trim();
  const index = rooms.findIndex(r => r.fullRoomId === rawId || r.id === rawId || r.roomNumber === rawId);
  if (index !== -1) {
    const updated = { ...rooms[index], ...updates };
    rooms[index] = updated;
    saveAllRooms(rooms);
    return updated;
  }
  return null;
};
