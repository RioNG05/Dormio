/**
 * Định dạng số tiền sang định dạng tiền tệ VND (ví dụ: 3000000 -> 3.000.000 đ)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Định dạng ngày tháng sang kiểu Việt Nam (ví dụ: 2026-07-02 -> 02/07/2026)
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.NumberFormat("vi-VN", {
    minimumIntegerDigits: 2,
  }).format(date.getDate()) + "/" +
    new Intl.NumberFormat("vi-VN", {
      minimumIntegerDigits: 2,
    }).format(date.getMonth() + 1) + "/" +
    date.getFullYear();
}

/**
 * Rút gọn văn bản nếu quá dài
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
