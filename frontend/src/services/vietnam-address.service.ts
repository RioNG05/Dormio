/**
 * Vietnam Administrative Address Service
 * Integrates with https://provinces.open-api.vn/api/v2/
 * Provides Province -> Ward cascading data with fallback support.
 */

export interface Province {
  code: number;
  name: string;
  codename: string;
  division_type?: string;
  phone_code?: number;
}

export interface Ward {
  code: number;
  name: string;
  codename: string;
  division_type?: string;
  province_code?: number;
}

export const FALLBACK_PROVINCES: Province[] = [
  { code: 1, name: "Thành phố Hà Nội", codename: "ha_noi" },
  { code: 4, name: "Tỉnh Cao Bằng", codename: "cao_bang" },
  { code: 8, name: "Tỉnh Tuyên Quang", codename: "tuyen_quang" },
  { code: 11, name: "Tỉnh Điện Biên", codename: "dien_bien" },
  { code: 12, name: "Tỉnh Lai Châu", codename: "lai_chau" },
  { code: 14, name: "Tỉnh Sơn La", codename: "son_la" },
  { code: 15, name: "Tỉnh Lào Cai", codename: "lao_cai" },
  { code: 19, name: "Tỉnh Thái Nguyên", codename: "thai_nguyen" },
  { code: 20, name: "Tỉnh Lạng Sơn", codename: "lang_son" },
  { code: 22, name: "Tỉnh Quảng Ninh", codename: "quang_ninh" },
  { code: 24, name: "Tỉnh Bắc Ninh", codename: "bac_ninh" },
  { code: 25, name: "Tỉnh Phú Thọ", codename: "phu_tho" },
  { code: 31, name: "Thành phố Hải Phòng", codename: "hai_phong" },
  { code: 33, name: "Tỉnh Hưng Yên", codename: "hung_yen" },
  { code: 37, name: "Tỉnh Ninh Bình", codename: "ninh_binh" },
  { code: 38, name: "Tỉnh Thanh Hóa", codename: "thanh_hoa" },
  { code: 40, name: "Tỉnh Nghệ An", codename: "nghe_an" },
  { code: 42, name: "Tỉnh Hà Tĩnh", codename: "ha_tinh" },
  { code: 44, name: "Tỉnh Quảng Trị", codename: "quang_tri" },
  { code: 46, name: "Thành phố Huế", codename: "hue" },
  { code: 48, name: "Thành phố Đà Nẵng", codename: "da_nang" },
  { code: 51, name: "Tỉnh Quảng Ngãi", codename: "quang_ngai" },
  { code: 52, name: "Tỉnh Gia Lai", codename: "gia_lai" },
  { code: 56, name: "Tỉnh Khánh Hòa", codename: "khanh_hoa" },
  { code: 66, name: "Tỉnh Đắk Lắk", codename: "dak_lak" },
  { code: 68, name: "Tỉnh Lâm Đồng", codename: "lam_dong" },
  { code: 75, name: "Tỉnh Đồng Nai", codename: "dong_nai" },
  { code: 79, name: "Thành phố Hồ Chí Minh", codename: "ho_chi_minh" },
  { code: 80, name: "Tỉnh Tây Ninh", codename: "tay_ninh" },
  { code: 82, name: "Tỉnh Đồng Tháp", codename: "dong_thap" },
  { code: 86, name: "Tỉnh Vĩnh Long", codename: "vinh_long" },
  { code: 91, name: "Tỉnh An Giang", codename: "an_giang" },
  { code: 92, name: "Thành phố Cần Thơ", codename: "can_tho" },
  { code: 96, name: "Tỉnh Cà Mau", codename: "ca_mau" },
];

const wardsCache = new Map<number, Ward[]>();

/**
 * Fetch list of all provinces in Vietnam from Open API v2
 */
export async function fetchProvinces(): Promise<Province[]> {
  try {
    const res = await fetch("https://provinces.open-api.vn/api/v2/");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Province[] = await res.json();
    return data && data.length > 0 ? data : FALLBACK_PROVINCES;
  } catch (error) {
    console.warn("Using fallback provinces due to fetch error:", error);
    return FALLBACK_PROVINCES;
  }
}

/**
 * Fetch wards for a given province code with depth=2
 */
export async function fetchWardsByProvince(provinceCode: number): Promise<Ward[]> {
  if (wardsCache.has(provinceCode)) {
    return wardsCache.get(provinceCode)!;
  }

  try {
    const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const wards: Ward[] = data.wards || [];
    wardsCache.set(provinceCode, wards);
    return wards;
  } catch (error) {
    console.error(`Failed to fetch wards for province ${provinceCode}:`, error);
    return [];
  }
}

/**
 * Normalize Vietnamese text for loose matching
 */
function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\b(thanh pho|tinh|tp|quan|huyen|phuong|xa|thi tran|tt)\b/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Match a location name from map geocoding against the known list of provinces
 */
export function matchProvince(name: string, provinces: Province[]): Province | undefined {
  if (!name) return undefined;
  const target = normalizeVietnamese(name);

  // Exact or contains match
  const found = provinces.find((p) => {
    const pNorm = normalizeVietnamese(p.name);
    return pNorm === target || target.includes(pNorm) || pNorm.includes(target);
  });

  return found;
}
