import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Hỗ trợ gộp class CSS Tailwind một cách thông minh và an toàn
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { formatCurrency, formatVND, formatDate } from "@/utils";
