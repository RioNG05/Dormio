import { api } from './api';

export interface LandlordAnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: string;
  targetScope: string;
  sentAt: string;
  sender: string;
  readCount: number;
  totalTarget: number;
  channel: string;
  createdAt: string;
}

export interface AnnouncementPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LandlordAnnouncementsSummary {
  totalAnnouncements: number;
  totalTargetTenants: number;
  emergencyCount: number;
}

export interface LandlordAnnouncementsResponse {
  success: boolean;
  data: LandlordAnnouncementItem[];
  meta: AnnouncementPaginationMeta;
  summary: LandlordAnnouncementsSummary;
}

export interface BroadcastAnnouncementPayload {
  title: string;
  content: string;
  category?: string;
  targetScope?: string;
  channel?: string;
}

export const announcementService = {
  /**
   * Retrieves paginated broadcast announcements for a boarding house (UC-L-13)
   */
  async getAnnouncements(
    buildingId: string,
    params?: {
      search?: string;
      category?: string;
      channel?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<LandlordAnnouncementsResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.category && params.category !== 'all' && params.category !== '') {
      queryParams.category = params.category;
    }
    if (params?.channel && params.channel !== 'all' && params.channel !== '') {
      queryParams.channel = params.channel;
    }
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return api.get<LandlordAnnouncementsResponse>(`/v1/landlord/notifications/announcements`, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
      params: queryParams,
    });
  },

  /**
   * Broadcasts a new announcement to the boarding house residents (UC-L-13)
   */
  async broadcastAnnouncement(
    buildingId: string,
    payload: BroadcastAnnouncementPayload,
  ): Promise<{ success: boolean; data: LandlordAnnouncementItem }> {
    return api.post<{ success: boolean; data: LandlordAnnouncementItem }>(
      `/v1/landlord/notifications/broadcast`,
      payload,
      {
        headers: {
          'X-Boarding-House-Id': buildingId,
        },
      },
    );
  },

  /**
   * Deletes an announcement
   */
  async deleteAnnouncement(
    buildingId: string,
    announcementId: string,
  ): Promise<void> {
    await api.delete(`/v1/landlord/notifications/${announcementId}`, {
      headers: {
        'X-Boarding-House-Id': buildingId,
      },
    });
  },
};
