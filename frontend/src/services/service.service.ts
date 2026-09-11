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
  success: boolean;
  data: ServiceItem[];
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
  success: boolean;
  data: {
    serviceId: string;
    serviceName: string;
    appliedRoomsCount: number;
    rooms: ServiceAssignedRoom[];
  };
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
   * UC-L-18: Get all services for active building with optional query filters and pagination
   */
  async getServices(
    buildingId: string,
    params?: QueryServicesParams,
  ): Promise<ServicesListResponse> {
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.search) queryParams.search = params.search;
      if (typeof params.isMetered === 'boolean') {
        queryParams.isMetered = String(params.isMetered);
      }
      if (params.status) queryParams.status = params.status;
      if (typeof params.autoApplied === 'boolean') {
        queryParams.autoApplied = String(params.autoApplied);
      }
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
      if (params.page) queryParams.page = String(params.page);
      if (params.limit) queryParams.limit = String(params.limit);
    }

    return api.get<ServicesListResponse>('/v1/landlord/services', {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
      params: queryParams,
    });
  }

  /**
   * UC-L-18: Get single service details
   */
  async getServiceDetail(
    buildingId: string,
    id: string,
  ): Promise<{ success: boolean; data: ServiceItem }> {
    return api.get<{ success: boolean; data: ServiceItem }>(
      `/v1/landlord/services/${id}`,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  }

  /**
   * UC-L-18: Create a custom service
   */
  async createService(
    buildingId: string,
    payload: CreateServicePayload,
  ): Promise<{ success: boolean; data: ServiceItem }> {
    return api.post<{ success: boolean; data: ServiceItem }>(
      '/v1/landlord/services',
      payload,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  }

  /**
   * UC-L-18: Update a service
   */
  async updateService(
    buildingId: string,
    id: string,
    payload: UpdateServicePayload,
  ): Promise<{ success: boolean; data: ServiceItem }> {
    return api.patch<{ success: boolean; data: ServiceItem }>(
      `/v1/landlord/services/${id}`,
      payload,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  }

  /**
   * UC-L-18: Delete a service
   */
  async deleteService(
    buildingId: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(
      `/v1/landlord/services/${id}`,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  }

  /**
   * UC-L-18: Get rooms assigned to this service
   */
  async getServiceRooms(
    buildingId: string,
    id: string,
  ): Promise<ServiceRoomsResponse> {
    return api.get<ServiceRoomsResponse>(
      `/v1/landlord/services/${id}/rooms`,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  }
}

export const serviceService = new ServiceService();
