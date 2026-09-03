import { getStoredLocale, type SupportedLocale } from "@/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type FetchOptions = RequestInit & {
  params?: Record<string, string>;
  lang?: SupportedLocale;
  boardingHouseId?: string;
};

class ApiClient {
  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, headers, lang, boardingHouseId, ...customOptions } = options;

    // 1. Xác định active locale (từ options, query params, hoặc storage/cookie)
    const activeLocale: SupportedLocale =
      lang || (params?.lang as SupportedLocale) || getStoredLocale() || "vi";

    // 2. Tạo URLSearchParams đính kèm ngôn ngữ (?lang=en)
    const searchParams = new URLSearchParams(params || {});
    if (!searchParams.has("lang")) {
      searchParams.set("lang", activeLocale);
    }

    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ""}`;

    // 3. Thiết lập headers mặc định: JSON, Accept-Language, Auth token & X-Boarding-House-Id
    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept-Language": activeLocale,
    };

    if (typeof window !== "undefined") {
      // Authorization token
      const token = localStorage.getItem("auth_token");
      if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
      }

      // X-Boarding-House-Id multi-tenancy context
      const activeHouseId =
        boardingHouseId || localStorage.getItem("dormio_active_building_id");
      if (activeHouseId) {
        defaultHeaders["X-Boarding-House-Id"] = activeHouseId;
      }
    } else if (boardingHouseId) {
      defaultHeaders["X-Boarding-House-Id"] = boardingHouseId;
    }

    const config: RequestInit = {
      method: "GET",
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      ...customOptions,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      // Trả về dữ liệu JSON hoặc rỗng nếu 204 No Content
      if (response.status === 204) {
        return {} as T;
      }
      return (await response.json()) as T;
    } catch (error) {
      console.error(`Request to ${url} failed:`, error);
      throw error;
    }
  }

  get<T>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, data?: unknown, options?: FetchOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: FetchOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();
