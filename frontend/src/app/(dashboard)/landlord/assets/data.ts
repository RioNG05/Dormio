export interface MaintenanceLog {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: string;
  performer: string;
}

export interface Asset {
  id: string;
  sku: string;
  name: string;
  category: "Điện lạnh" | "Nội thất" | "Gia dụng" | "Điện nước" | "An ninh" | string;
  building: string;
  buildingName?: string;
  room: string;
  roomId?: string | null;
  status: "Đang sử dụng" | "Sẵn sàng" | "Bảo trì" | "Hỏng hóc" | "Đã mất" | "Đã thanh lý" | string;
  dateAdded: string;
  value: string; // Formatted value
  numericValue: number; // Raw numeric cost
  purchaseDate?: string;
  purchaseValue?: number;
  depreciationYears?: number;
  modelCode?: string;
  serialNumber?: string;
  warrantyPeriod?: string;
  supplier?: string;
  note?: string;
  images?: string[];
  maintenanceLogs?: MaintenanceLog[];
}

export function calculateDepreciation(asset: Asset | { purchaseValue?: number; numericValue?: number; purchasePrice?: number | null; purchaseDate?: string | null; depreciationYears?: number }) {
  const purchaseValue =
    (asset as Asset).purchaseValue ||
    (asset as Asset).numericValue ||
    (asset as { purchasePrice?: number | null }).purchasePrice ||
    0;
  const years = (asset as Asset).depreciationYears || 5;
  const totalMonths = years * 12;

  let pDate = new Date();
  if (asset.purchaseDate) {
    if (asset.purchaseDate.includes("/")) {
      const parts = asset.purchaseDate.split("/");
      if (parts.length === 3) {
        pDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
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
    depreciatedPercent,
  };
}

// Cleared mock data — UI consumes real backend API
export const initialMockAssets: Asset[] = [];
