export interface ContractMember {
  name: string;
  relation: string;
  phone: string;
  cccd?: string;
}

export interface ContractServiceItem {
  id: string | number;
  name: string;
  type: string;
  price: number;
  unit: string;
  applied: boolean;
}

export interface ContractHistoryItem {
  date: string;
  user: string;
  content: string;
}

export interface Contract {
  id: string; // Format: HD-[DDMMYYYY]-[seq]-[room] e.g. HD-01012026-1-101
  building: string;
  buildingName: string;
  buildingSeq: number;
  room: string;
  roomType: string;
  tenant: string;
  tenantPhone: string;
  tenantCccd: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  signDate: string;
  isOverdue: boolean;
  price: string;
  priceNumber: number;
  deposit: string;
  depositNumber: number;
  paymentDate: string;
  paymentStatus: "Đã thu đủ" | "Còn nợ" | string;
  status: "Đang hiệu lực" | "Quá hạn" | "Đã chấm dứt" | "Sắp hết hạn" | string;
  history: ContractHistoryItem[];
  members: ContractMember[];
  services: ContractServiceItem[];
  checkoutNotice?: {
    date: string;
    note: string;
  };
}

export const generateMockContracts = (): Contract[] => {
  const data: Contract[] = [];
  const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
  const dem = ["Văn", "Thị", "Hữu", "Minh", "Đức", "Ngọc", "Xuân", "Thu", "Thanh", "Hải", "Thành", "Công", "Quốc", "Khánh", "Gia"];
  const ten = ["An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Khang", "Linh", "Mai", "Nam", "Oanh", "Phong", "Quang", "Sơn", "Tuấn", "Uyên", "Vinh", "Vy", "Yến", "Tâm", "Thảo", "Trang", "Trung", "Tú", "Anh", "Bảo", "Châu", "Diệp", "Hân", "Khoa"];

  const generateForBuilding = (buildingId: string, buildingSeq: number, floors: number, roomsPerFloor: number) => {
    let contractCounter = 1;

    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= roomsPerFloor; r++) {
        const seed = f * 100 + r;
        if (seed % 5 === 0) continue; // Match vacancy skip

        const roomStr = `${f}${r.toString().padStart(2, '0')}`;
        const isOverdue = seed % 4 === 0;
        const hash = parseInt(roomStr) * buildingSeq * 137 + 19;
        const tenantName = `${ho[hash % ho.length]} ${dem[(hash * 3) % dem.length]} ${ten[(hash * 7) % ten.length]}`;
        const cccdNum = `00109${(1000000 + hash * 5678).toString()}`;
        const phoneNum = `09${(10000000 + hash * 1234).toString()}`;

        const mems: ContractMember[] = [];
        if (seed % 2 === 0) {
          mems.push({ name: 'Người thân ' + contractCounter, relation: 'Gia đình', phone: '090' + (1000000 + seed * 123), cccd: '001099887766' });
          if (seed % 3 === 0) mems.push({ name: 'Bạn bè ' + contractCounter, relation: 'Bạn bè', phone: '091' + (1000000 + seed * 456), cccd: '001099887755' });
        }

        const roomType = r % 3 === 0 ? 'Penthouse' : r % 2 === 0 ? 'Studio' : '1PN';
        const priceNum = r % 3 === 0 ? 5000000 : r % 2 === 0 ? 4000000 : 3500000;
        const priceStr = `${priceNum.toLocaleString('vi-VN')} ₫`;

        // Format contract ID standard: HD-[SignDate DDMMYYYY]-[seq]-[room]
        const signDateDDMMYYYY = "01012026";
        const contractId = `HD-${signDateDDMMYYYY}-${buildingSeq}-${roomStr}`;

        let status = "Đang hiệu lực";
        if (isOverdue) status = "Quá hạn";
        else if (seed % 7 === 0) status = "Sắp hết hạn";

        data.push({
          id: contractId,
          building: buildingId,
          buildingName: buildingSeq === 1 ? "Dormio Premier Quận 1" : "Dormio Campus Cầu Giấy",
          buildingSeq,
          room: roomStr,
          roomType,
          tenant: tenantName,
          tenantPhone: phoneNum,
          tenantCccd: cccdNum,
          tenantId: cccdNum,
          signDate: "01/01/2026",
          startDate: "01/01/2026",
          endDate: "01/01/2027",
          isOverdue,
          price: priceStr,
          priceNumber: priceNum,
          deposit: priceStr,
          depositNumber: priceNum,
          paymentDate: `${(contractCounter % 28) + 1}`,
          paymentStatus: isOverdue ? 'Còn nợ' : (contractCounter % 2 === 0 ? 'Đã thu đủ' : 'Còn nợ'),
          status,
          history: [
            { date: "01/01/2026", user: "Admin (Chủ trọ)", content: "Khởi tạo hợp đồng mới thành công" }
          ],
          members: mems,
          services: [
            { id: 1, name: "Bảo vệ", type: "Cố định", price: 60000, unit: "đ/phòng", applied: true },
            { id: 2, name: "Điện", type: "Đồng hồ", price: 3500, unit: "đ/kWh", applied: true },
            { id: 3, name: "Nước", type: "Đồng hồ", price: 25000, unit: "đ/m³", applied: true },
            { id: 4, name: "Rác", type: "Cố định", price: 20000, unit: "đ/phòng", applied: true },
            { id: 5, name: "Vệ sinh", type: "Cố định", price: 30000, unit: "đ/phòng", applied: true },
            { id: 6, name: "Wifi", type: "Cố định", price: 100000, unit: "đ/phòng", applied: true },
          ]
        });

        contractCounter++;
      }
    }
  };

  generateForBuilding('dormio', 1, 4, 15);
  generateForBuilding('vinahouse', 2, 3, 10);

  return data;
};

export const getContractById = (id: string): Contract | null => {
  const contracts = generateMockContracts();
  const rawId = decodeURIComponent(id).trim();

  // 1. Direct match by contract ID (e.g. HD-01012026-1-101)
  let found = contracts.find(c => c.id === rawId);
  if (found) return found;

  // 2. Loose match by room number (e.g. 101, 1101, 2201)
  const roomOnly = rawId.replace(/\D/g, '');
  if (roomOnly) {
    found = contracts.find(c => c.room === roomOnly || `${c.buildingSeq}${c.room}` === roomOnly);
    if (found) return found;
  }

  return contracts[0] || null;
};
