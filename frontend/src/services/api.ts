const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type FetchOptions = RequestInit & {
  params?: Record<string, string>;
};

class ApiClient {
  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, headers, ...customOptions } = options;

    // 1. Tạo query params nếu có
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    // 2. Thiết lập headers mặc định (JSON và Authorization token từ localStorage nếu ở client-side)
    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      method: "GET",
      headers: {
        ...defaultHeaders,
        ...headers,
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
      return await response.json() as T;
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
