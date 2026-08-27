export interface MaintenanceLog {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: string;
  performer: string;
}

export interface Asset {
  id: string; // Dynamic format: [Building Prefix]-[SKU], e.g. DORMIO-Q1-ML-DK-101
  sku: string; // Custom SKU entered by landlord, e.g. ML-DK-101
  name: string;
  category: "Điện lạnh" | "Nội thất" | "Gia dụng" | "Điện nước" | "An ninh" | string;
  building: string;
  buildingName?: string;
  room: string;
  status: "Đang sử dụng" | "Sẵn sàng" | "Bảo trì" | "Hỏng hóc" | string;
  dateAdded: string;
  value: string; // Formatted value
  numericValue: number; // Raw numeric cost
  purchaseDate?: string; // e.g. 10/01/2024
  purchaseValue?: number; // Raw initial cost
  depreciationYears?: number; // Useful life in years e.g. 5
  modelCode?: string;
  serialNumber?: string;
  warrantyPeriod?: string;
  supplier?: string;
  note?: string;
  images?: string[];
  maintenanceLogs?: MaintenanceLog[];
}

export function calculateDepreciation(asset: Asset) {
  const purchaseValue = asset.purchaseValue || asset.numericValue || 0;
  const years = asset.depreciationYears || 5; // Default 5 years
  const totalMonths = years * 12;

  // Parse purchase date or fallback
  let pDate = new Date(2024, 0, 10);
  if (asset.purchaseDate) {
    const parts = asset.purchaseDate.split("/");
    if (parts.length === 3) {
      pDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      const d = new Date(asset.purchaseDate);
      if (!isNaN(d.getTime())) pDate = d;
    }
  }

  const now = new Date();
  const monthsUsed = Math.max(
    0,
    (now.getFullYear() - pDate.getFullYear()) * 12 + (now.getMonth() - pDate.getMonth())
  );

  const monthlyDepreciation = totalMonths > 0 ? purchaseValue / totalMonths : 0;
  const accumulatedDepreciation = Math.min(purchaseValue, Math.round(monthlyDepreciation * monthsUsed));
  const currentValue = Math.max(0, purchaseValue - accumulatedDepreciation);
  const remainingPercent = purchaseValue > 0 ? Math.round((currentValue / purchaseValue) * 100) : 0;
  const depreciatedPercent = 100 - remainingPercent;

  return {
    purchaseValue,
    totalMonths,
    monthsUsed,
    monthlyDepreciation,
    accumulatedDepreciation,
    currentValue,
    remainingPercent,
    depreciatedPercent
  };
}

export const initialMockAssets: Asset[] = [
  {
    id: "DORMIO-Q1-ML-DK-101",
    sku: "ML-DK-101",
    name: "Máy lạnh Daikin 1.5HP Inverter",
    category: "Điện lạnh",
    building: "dormio",
    buildingName: "Dormio Premier Quận 1",
    room: "101",
    status: "Đang sử dụng",
    dateAdded: "10/01/2024",
    purchaseDate: "10/01/2024",
    purchaseValue: 8500000,
    depreciationYears: 5,
    value: "8.500.000 ₫",
    numericValue: 8500000,
    modelCode: "FTKF35XVMV",
    serialNumber: "DKN-2026-9812",
    warrantyPeriod: "10/01/2028 (24 tháng)",
    supplier: "Điện Máy Xanh",
    note: "Máy hoạt động tốt, làm lạnh nhanh.",
    maintenanceLogs: [
      {
        id: "LOG-01",
        date: "15/06/2026",
        type: "Vệ sinh & Nạp gas",
        description: "Bảo dưỡng định kỳ 6 tháng, vệ sinh lưới lọc và bơm thêm gas R32.",
        cost: "250.000 ₫",
        performer: "Thợ điện lạnh Tuấn"
      }
    ]
  },
  {
    id: "DORMIO-Q1-TL-AQ-102",
    sku: "TL-AQ-102",
    name: "Tủ lạnh Aqua 90L Mini",
    category: "Điện lạnh",
    building: "dormio",
    buildingName: "Dormio Premier Quận 1",
    room: "102",
    status: "Đang sử dụng",
    dateAdded: "12/01/2025",
    purchaseDate: "12/01/2025",
    purchaseValue: 2800000,
    depreciationYears: 4,
    value: "2.800.000 ₫",
    numericValue: 2800000,
    modelCode: "AQR-95AR",
    serialNumber: "AQU-88712",
    warrantyPeriod: "12/01/2027 (12 tháng)",
    supplier: "Nguyễn Kim",
    note: "Bàn giao theo phòng 102.",
    maintenanceLogs: []
  },
  {
    id: "DORMIO-Q1-MG-TS-85",
    sku: "MG-TS-85",
    name: "Máy giặt Toshiba 8.5kg Cửa trên",
    category: "Điện lạnh",
    building: "dormio",
    buildingName: "Dormio Premier Quận 1",
    room: "Khu sinh hoạt chung",
    status: "Bảo trì",
    dateAdded: "15/02/2025",
    purchaseDate: "15/02/2025",
    purchaseValue: 4500000,
    depreciationYears: 5,
    value: "4.500.000 ₫",
    numericValue: 4500000,
    modelCode: "AW-K900DV",
    serialNumber: "TSB-66201",
    warrantyPeriod: "15/02/2027",
    supplier: "Điện Máy Cho Lớn",
    note: "Đang kiểm tra dây curoa kêu to.",
    maintenanceLogs: [
      {
        id: "LOG-02",
        date: "20/07/2026",
        type: "Sửa chữa linh kiện",
        description: "Thay tụ khởi động động cơ máy giặt.",
        cost: "350.000 ₫",
        performer: "Trung tâm bảo hành Toshiba"
      }
    ]
  },
  {
    id: "DORMIO-Q1-G-MDF-1620",
    sku: "G-MDF-1620",
    name: "Giường gỗ công nghiệp MDF 1m6 x 2m",
    category: "Nội thất",
    building: "dormio",
    buildingName: "Dormio Premier Quận 1",
    room: "Kho",
    status: "Sẵn sàng",
    dateAdded: "20/03/2025",
    purchaseDate: "20/03/2025",
    purchaseValue: 1800000,
    depreciationYears: 6,
    value: "1.800.000 ₫",
    numericValue: 1800000,
    modelCode: "G-MDF-1620",
    supplier: "Nội thất Hòa Phát",
    note: "Còn mới 99%, dự phòng cho phòng 204.",
    maintenanceLogs: []
  },
  {
    id: "DORMIO-Q1-BT-SH-201",
    sku: "BT-SH-201",
    name: "Bếp từ đôi Sunhouse MAMA",
    category: "Gia dụng",
    building: "dormio",
    buildingName: "Dormio Premier Quận 1",
    room: "201",
    status: "Hỏng hóc",
    dateAdded: "05/04/2025",
    purchaseDate: "05/04/2025",
    purchaseValue: 1200000,
    depreciationYears: 3,
    value: "1.200.000 ₫",
    numericValue: 1200000,
    modelCode: "SHB9101",
    supplier: "Sunhouse Việt Nam",
    note: "Khách báo mặt kính nứt, cần thay thế.",
    maintenanceLogs: []
  }
];
