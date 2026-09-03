export type SupportedLocale = "vi" | "en";

/**
 * Format currency dynamically according to active locale (VND / USD or VND display)
 */
export function formatCurrency(amount: number | string, locale: "vi" | "en" = "vi"): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount).replace(/\D/g, "")) || 0;
  if (locale === "en") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(num);
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format VND backward compatibility helper
 */
export function formatVND(amount: number): string {
  return formatCurrency(amount, "vi");
}

/**
 * Format date dynamically according to active locale
 */
export function formatDate(dateInput: string | Date, locale: "vi" | "en" = "vi"): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  if (locale === "en") {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Truncate text if too long
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Type guard for SupportedLocale
 */
export function isValidLocale(value: unknown): value is SupportedLocale {
  return value === "vi" || value === "en";
}

/**
 * Get active locale from browser storage or cookie safely
 */
export function getStoredLocale(): SupportedLocale {
  if (typeof window === "undefined") return "vi";

  try {
    const local = localStorage.getItem("dormio_lang");
    if (isValidLocale(local)) return local;

    // Check cookie NEXT_LOCALE
    const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    if (cookieMatch && isValidLocale(cookieMatch[1])) {
      return cookieMatch[1];
    }
  } catch (err) {
    console.error("Error reading stored locale:", err);
  }

  return "vi";
}

/**
 * Set active locale in browser storage, cookie, and HTML tag
 */
export function setStoredLocale(locale: SupportedLocale): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("dormio_lang", locale);
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    if (document.documentElement) {
      document.documentElement.lang = locale;
    }
  } catch (err) {
    console.error("Error persisting locale:", err);
  }
}

/**
 * Standardized DB Enum & Code Localizer for database records from Prisma
 */
export const dbEnumTranslations: Record<string, Record<string, { vi: string; en: string }>> = {
  roomStatus: {
    available: { vi: "Trống", en: "Vacant" },
    occupied: { vi: "Đang thuê", en: "Occupied" },
    deposited: { vi: "Đặt cọc", en: "Reserved" },
    maintenance: { vi: "Bảo trì", en: "Maintenance" },
  },
  contractStatus: {
    draft: { vi: "Nháp", en: "Draft" },
    active: { vi: "Hiệu lực", en: "Active" },
    expired: { vi: "Hết hạn", en: "Expired" },
    canceled: { vi: "Đã hủy", en: "Canceled" },
  },
  invoiceStatus: {
    paid: { vi: "Đã thu", en: "Paid" },
    pending: { vi: "Chưa thanh toán", en: "Pending" },
    overdue: { vi: "Quá hạn", en: "Overdue" },
    canceled: { vi: "Đã hủy", en: "Canceled" },
  },
  serviceCode: {
    dien: { vi: "Điện", en: "Electricity" },
    nuoc: { vi: "Nước", en: "Water" },
    wifi: { vi: "Wifi", en: "Internet / Wifi" },
    rac: { vi: "Rác", en: "Trash / Sanitation" },
    bao_ve: { vi: "Bảo vệ", en: "Security Guard" },
    ve_sinh: { vi: "Vệ sinh", en: "Cleaning Service" },
    gui_xe: { vi: "Gửi xe", en: "Parking Fee" },
  },
  incidentPriority: {
    high: { vi: "Mức độ cao", en: "High Priority" },
    medium: { vi: "Mức độ trung bình", en: "Medium Priority" },
    low: { vi: "Mức độ nhẹ", en: "Low Priority" },
  },
  userRole: {
    landlord: { vi: "Chủ nhà trọ", en: "Landlord" },
    tenant: { vi: "Người thuê", en: "Tenant" },
    employee: { vi: "Nhân viên", en: "Employee" },
    admin: { vi: "Quản trị viên", en: "Admin" },
  },
};

export function localizeDbEnum(
  category: keyof typeof dbEnumTranslations,
  code: string,
  locale: "vi" | "en" = "vi"
): string {
  const normCode = code?.toLowerCase().trim();
  const foundCategory = dbEnumTranslations[category];
  if (foundCategory && foundCategory[normCode]) {
    return foundCategory[normCode][locale];
  }
  return code;
}
