import { useEffect, useState } from "react";

/**
 * Hook giúp trì hoãn việc cập nhật giá trị (ví dụ: dùng cho ô tìm kiếm để tránh gọi API quá nhiều lần khi gõ phím)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
