function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const port = process.env.NEXT_PUBLIC_API_PORT?.trim() || "3001";

  if (!envUrl) {
    return `http://localhost:${port}/api`;
  }

  // If already ends with /api
  if (envUrl.endsWith("/api")) {
    return envUrl;
  }

  // If already has a port specified (e.g. http://localhost:3001)
  if (/(:\d+)/.test(envUrl)) {
    return `${envUrl.replace(/\/$/, "")}/api`;
  }

  // If has protocol but no port (e.g. http://localhost)
  return `${envUrl.replace(/\/$/, "")}:${port}/api`;
}

const API_URL = getApiBaseUrl();


type FetchOptions = RequestInit & {
  params?: Record<string, string>;
  silent?: boolean;
};

class ApiClient {
  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, headers, silent, ...customOptions } = options;

    // 1. Tạo query params nếu có
    let url = `${API_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    // 2. Thiết lập headers chuẩn hóa (lowercase keys để tránh duplicate khi merge)
    const finalHeaders: Record<string, string> = {
      "content-type": "application/json",
    };

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        finalHeaders["authorization"] = `Bearer ${token}`;
      }

      const activeHouseId = localStorage.getItem("dormio_active_building_id");
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (activeHouseId && UUID_REGEX.test(activeHouseId)) {
        finalHeaders["x-boarding-house-id"] = activeHouseId;
      }
    }

    // Merge custom headers overriding defaults with normalized lowercase keys
    if (headers) {
      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          finalHeaders[key.toLowerCase()] = value;
        });
      } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => {
          finalHeaders[key.toLowerCase()] = value;
        });
      } else {
        Object.entries(headers).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            finalHeaders[key.toLowerCase()] = String(value);
          }
        });
      }
    }

    const config: RequestInit = {
      method: "GET",
      headers: finalHeaders,
      ...customOptions,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("dormio_logged_in");
          localStorage.removeItem("dormio_user_id");
          localStorage.removeItem("dormio_user_role");
        }
        const errorData = await response.json().catch(() => ({}));
        let message = "";
        if (typeof errorData.message === "string" && errorData.message.trim()) {
          message = errorData.message;
        } else if (Array.isArray(errorData.message) && errorData.message.length > 0) {
          message = errorData.message.join(". ");
        } else if (typeof errorData.error === "string" && errorData.error.trim()) {
          message = errorData.error;
        } else if (Array.isArray(errorData.error) && errorData.error.length > 0) {
          message = errorData.error.join(". ");
        } else {
          message = `Yêu cầu không thành công (Mã lỗi ${response.status})`;
        }
        throw new Error(message);
      }

      // Trả về dữ liệu JSON hoặc rỗng nếu 204 No Content
      if (response.status === 204) {
        return {} as T;
      }
      return await response.json() as T;
    } catch (error) {
      if (!silent) {
        console.error(`Request to ${url} failed:`, error);
      }
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

  patch<T>(endpoint: string, data?: unknown, options?: FetchOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();
