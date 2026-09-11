import { api } from './api';

export type ServiceStatus = 'active' | 'inactive';

export interface ServiceItem {
  id: string;
  boardingHouseId: string;
  name: string;
  price: string;
  numericPrice: number;
  unit: string;
  isMetered: boolean;
  autoApplied: boolean;
  status: ServiceStatus;
  appliedRoomsCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ServicesSummary {
  totalServices: number;
  meteredCount: number;
  roomFixedCount: number;
  otherCount: number;
  activeCount: number;
  inactiveCount: number;
}

export interface ServicesListResponse {
  items: ServiceItem[];
  summary: ServicesSummary;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServiceAssignedRoom {
  id: string;
  roomNumber: string;
  floor: number;
  status: string;
}

export interface ServiceRoomsResponse {
  serviceId: string;
  serviceName: string;
  appliedRoomsCount: number;
  rooms: ServiceAssignedRoom[];
}

export interface CreateServicePayload {
  name: string;
  price: number;
  unit: string;
  isMetered?: boolean;
  autoApplied?: boolean;
  status?: ServiceStatus;
  roomIds?: string[];
}

export interface UpdateServicePayload {
  name?: string;
  price?: number;
  unit?: string;
  isMetered?: boolean;
  autoApplied?: boolean;
  status?: ServiceStatus;
  roomIds?: string[];
}

export interface QueryServicesParams {
  search?: string;
  isMetered?: boolean;
  status?: ServiceStatus;
  autoApplied?: boolean;
  sortBy?: 'createdAt' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class ServiceService {
  /**
   * UC-L-18: Get all services with optional query filters and pagination
   */
  async getServices(params?: QueryServicesParams): Promise<ServicesListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.search) searchParams.append('search', params.search);
      if (typeof params.isMetered === 'boolean') {
        searchParams.append('isMetered', String(params.isMetered));
      }
      if (params.status) searchParams.append('status', params.status);
      if (typeof params.autoApplied === 'boolean') {
        searchParams.append('autoApplied', String(params.autoApplied));
      }
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      if (params.page) searchParams.append('page', String(params.page));
      if (params.limit) searchParams.append('limit', String(params.limit));
    }

    const queryString = searchParams.toString();
    const endpoint = `/landlord/services${queryString ? `?${queryString}` : ''}`;
    return api.get<ServicesListResponse>(endpoint);
  }

  /**
   * UC-L-18: Get single service details
   */
  async getServiceDetail(id: string): Promise<ServiceItem> {
    return api.get<ServiceItem>(`/landlord/services/${id}`);
  }

  /**
   * UC-L-18: Create a custom service
   */
  async createService(payload: CreateServicePayload): Promise<ServiceItem> {
    return api.post<ServiceItem>('/landlord/services', payload);
  }

  /**
   * UC-L-18: Update a service
   */
  async updateService(id: string, payload: UpdateServicePayload): Promise<ServiceItem> {
    return api.patch<ServiceItem>(`/landlord/services/${id}`, payload);
  }

  /**
   * UC-L-18: Delete a service
   */
  async deleteService(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/landlord/services/${id}`);
  }

  /**
   * UC-L-18: Get rooms assigned to this service
   */
  async getServiceRooms(id: string): Promise<ServiceRoomsResponse> {
    return api.get<ServiceRoomsResponse>(`/landlord/services/${id}/rooms`);
  }
}

export const serviceService = new ServiceService();
