export interface Customer {
  id: string;
  name: string;
  phone: string;
  room: string;
  building: string;
  cccd: string;
  joinDate: string;
  status: "Đang ở" | "Sắp hết hợp đồng" | "Đã rời" | string;
  dob?: string;
  gender?: string;
  address?: string;
  email?: string;
  job?: string;
  workplace?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const generateMockCustomers = (): Customer[] => {
  const data: Customer[] = [];
  const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
  const dem = ["Văn", "Thị", "Hữu", "Minh", "Đức", "Ngọc", "Xuân", "Thu", "Thanh", "Hải", "Thành", "Công", "Quốc", "Khánh", "Gia"];
  const ten = ["An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Khang", "Linh", "Mai", "Nam", "Oanh", "Phong", "Quang", "Sơn", "Tuấn", "Uyên", "Vinh", "Vy", "Yến", "Tâm", "Thảo", "Trang", "Trung", "Tú", "Anh", "Bảo", "Châu", "Diệp", "Hân", "Khoa"];

  const generateForBuilding = (buildingId: string, floors: number, roomsPerFloor: number) => {
    const buildingHash = buildingId === 'dormio' ? 1 : 2;

    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        const seed = f * 100 + r;
        if (seed % 5 === 0) continue; // Match skip logic in contracts

        const roomStr = `${f}${r.toString().padStart(2, '0')}`;
        const hash = parseInt(roomStr.replace(/\D/g, '') || "0") * buildingHash * 137 + 19;
        const name = `${ho[hash % ho.length]} ${dem[(hash * 3) % dem.length]} ${ten[(hash * 7) % ten.length]}`;

        // ID chính là Số CCCD của khách thuê
        const cccdNum = `00109${(1000000 + hash * 5678).toString()}`;
        const isExpiring = seed % 7 === 0;

        data.push({
          id: cccdNum,
          name,
          phone: `09${(10000000 + hash * 1234).toString()}`,
          room: roomStr,
          building: buildingId,
          cccd: cccdNum,
          joinDate: `01/0${(hash % 9) + 1}/2024`,
          status: isExpiring ? "Sắp hết hợp đồng" : "Đang ở",
          dob: "2000-01-01",
          gender: hash % 2 === 0 ? "nam" : "nu",
          address: "Khu công nghệ cao, TP.HCM",
          email: `kh${roomStr}@gmail.com`,
          job: "Sinh viên",
          workplace: "Đại học SPKT",
          note: "",
          createdAt: "10/07/2026",
          updatedAt: "10/07/2026"
        });
      }
    }
  };

  generateForBuilding('dormio', 4, 15);
  generateForBuilding('vinahouse', 3, 10);

  // Mẫu khách đã rời với ID là Số CCCD
  const oldCccd = "000000000999";
  data.push({
    id: oldCccd,
    name: "Khách Đã Rời",
    phone: "0900000000",
    room: "201",
    building: "dormio",
    cccd: oldCccd,
    joinDate: "01/01/2023",
    status: "Đã rời",
    dob: "1990-01-01",
    gender: "nam",
    address: "Hà Nội",
    email: "old@gmail.com",
    job: "Nhân viên",
    workplace: "Công ty",
    note: "Đã thanh lý hợp đồng",
    createdAt: "10/07/2026",
    updatedAt: "10/07/2026"
  });

  return data;
};

export const getCustomerById = (id: string): Customer | null => {
  const customers = generateMockCustomers();
  const rawId = decodeURIComponent(id).trim();

  // 1. Tìm chính xác theo ID (hoặc CCCD)
  let cust = customers.find(c => c.id === rawId || c.cccd === rawId);

  // 2. Tìm theo phòng hoặc legacy string nếu ID không trùng khớp trực tiếp
  if (!cust) {
    const roomStr = rawId.replace(/[^0-9]/g, '').slice(0, 3);
    if (roomStr) {
      cust = customers.find(c => c.room === roomStr || c.id.includes(roomStr));
    }
  }

  // 3. Fallback sinh mock customer dựa trên CCCD / rawId
  if (!cust) {
    const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
    const dem = ["Văn", "Thị", "Hữu", "Minh", "Đức", "Ngọc", "Xuân", "Thu", "Thanh", "Hải", "Thành", "Công", "Quốc", "Khánh", "Gia"];
    const ten = ["An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Khang", "Linh", "Mai", "Nam", "Oanh", "Phong", "Quang", "Sơn", "Tuấn", "Uyên", "Vinh", "Vy", "Yến", "Tâm", "Thảo", "Trang", "Trung", "Tú", "Anh", "Bảo", "Châu", "Diệp", "Hân", "Khoa"];

    const numericSeed = parseInt(rawId.replace(/\D/g, '') || "101") % 1000;
    const tenantName = `${ho[numericSeed % ho.length]} ${dem[(numericSeed * 3) % dem.length]} ${ten[(numericSeed * 7) % ten.length]}`;

    cust = {
      id: rawId,
      name: tenantName,
      phone: "0901234567",
      room: "101",
      building: "dormio",
      cccd: rawId,
      joinDate: "01/01/2024",
      status: "Đang ở",
      dob: "2000-01-01",
      gender: numericSeed % 2 === 0 ? "nam" : "nu",
      address: "Khu công nghệ cao, TP.HCM",
      email: `khach@gmail.com`,
      job: "Sinh viên",
      workplace: "Đại học SPKT",
      note: "",
      createdAt: "10/07/2026",
      updatedAt: "10/07/2026"
    };
  }

  return cust || null;
};
