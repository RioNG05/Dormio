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
  id: string;          // Formatted ID: buildingSeq + roomStr (e.g. 1101, 1205, 2101)
  roomNumber: string;  // Raw room number (e.g. 101, 205)
  building: string;    // Building ID ('b1', 'b2', 'dormio', 'vinahouse')
  buildingSeq: number; // Building Sequence number (1, 2...)
  floor: string;
  status: "Đang thuê" | "Trống" | "Bảo trì" | "Đặt cọc" | string;
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
        const seed = f * 100 + r;
        const isTrang = seed % 5 === 0;
        const isBaoTri = seed % 17 === 0;

        let status = "Đang thuê";
        if (isTrang) status = "Trống";
        else if (isBaoTri) status = "Bảo trì";
        else if (seed % 11 === 0) status = "Đặt cọc";

        const hash = parseInt(roomStr) * buildingSeq * 137 + 19;
        const isRented = status === 'Đang thuê' || status === 'Đặt cọc';
        const tenantCccd = isRented ? `00109${(1000000 + hash * 5678).toString()}` : undefined;

        // Formula: buildingSeq + roomStr (e.g., 1101, 1205, 2101)
        const fullRoomId = `${buildingSeq}${roomStr}`;

        data.push({
          id: fullRoomId,
          roomNumber: roomStr,
          building: buildingId,
          buildingSeq,
          floor: f.toString(),
          status: status,
          contract: isRented ? (seed % 7 === 0 ? "expired" : "active") : "none",
          invoice: isRented ? (seed % 8 === 0 ? "debt" : "paid") : "none",
          price: "3.000.000 ₫",
          area: "25",
          tenant: isRented ? `${ho[hash % ho.length]} ${dem[(hash * 3) % dem.length]} ${ten[(hash * 7) % ten.length]}` : undefined,
          tenantPhone: isRented ? `09${(10000000 + hash * 1234).toString()}` : undefined,
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
  return data;
};

export const getRoomById = (id: string): Room | null => {
  const rooms = generateMockRooms();
  const rawId = decodeURIComponent(id).trim();

  // 1. Direct match by full id (e.g. 1101)
  let found = rooms.find(r => r.id === rawId);

  // 2. Legacy fallback match by building-room string (e.g. b1-101 or dormio-101 or 101)
  if (!found) {
    if (rawId.includes('-')) {
      const parts = rawId.split('-');
      const roomNum = parts[1];
      const seq = parts[0] === 'b2' || parts[0] === 'vinahouse' ? 2 : 1;
      found = rooms.find(r => r.id === `${seq}${roomNum}`);
    } else if (rawId.length === 3) {
      // If only raw 3-digit room number passed, default to building 1
      found = rooms.find(r => r.id === `1${rawId}`);
    }
  }

  // 3. Fallback generator if id is completely dynamic
  if (!found) {
    const bSeq = rawId.startsWith('2') ? 2 : 1;
    const roomStr = rawId.slice(1) || "101";

    found = {
      id: rawId,
      roomNumber: roomStr,
      building: bSeq === 1 ? 'b1' : 'b2',
      buildingSeq: bSeq,
      floor: roomStr.charAt(0) || "1",
      status: "Đang thuê",
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
