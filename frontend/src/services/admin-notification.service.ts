import { api } from './api';

export type AdminNotifyChannel = 'in_app' | 'zalo' | 'sms' | 'email';

export type AdminNotifyTarget =
  | 'all_users'
  | 'all_landlords'
  | 'all_staff'
  | 'all_admins'
  | 'specific_user';

export type AdminNotifyStatus = 'pending' | 'sent' | 'failed' | 'canceled';

export interface MassNotificationItem {
  id: string;
  createdBy: string;
  creatorName?: string;
  channel: AdminNotifyChannel;
  targetType: AdminNotifyTarget;
  targetLabel: string;
  targetId?: string;
  targetUserName?: string;
  title: string;
  content: string;
  status: AdminNotifyStatus;
  sentCount: number;
  failedCount: number;
  totalRecipients: number;
  createdAt: string;
}

export interface MassNotificationStatusCounts {
  total: number;
  sent: number;
  pending: number;
  failed: number;
}

export interface MassNotificationListResponse {
  items: MassNotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: MassNotificationStatusCounts;
}

export interface CreateMassNotificationPayload {
  channel: AdminNotifyChannel;
  targetType: AdminNotifyTarget;
  targetId?: string;
  title: string;
  content: string;
}

export const adminNotificationService = {
  /**
   * UC-A-05: Retrieves paginated list of mass notification jobs with filters and status counters.
   */
  async getMassNotificationJobs(params?: {
    status?: string;
    channel?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<MassNotificationListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.status && params.status !== 'all') {
      queryParams.status = params.status;
    }
    if (params?.channel && params.channel !== 'all') {
      queryParams.channel = params.channel;
    }
    if (params?.search?.trim()) {
      queryParams.search = params.search.trim();
    }
    if (params?.page) {
      queryParams.page = String(params.page);
    }
    if (params?.limit) {
      queryParams.limit = String(params.limit);
    }

    const res = await api.get<any>('/v1/admin/notifications/mass', {
      params: queryParams,
    });
    return res?.data ?? res;
  },

  /**
   * UC-A-05: Retrieves single mass notification job detail.
   */
  async getMassNotificationJobById(id: string): Promise<MassNotificationItem> {
    const res = await api.get<any>(`/v1/admin/notifications/mass/${id}`);
    return res?.data ?? res;
  },

  /**
   * UC-A-05: Creates and enqueues a new mass notification job.
   */
  async createMassNotificationJob(
    payload: CreateMassNotificationPayload,
  ): Promise<MassNotificationItem> {
    const res = await api.post<any>('/v1/admin/notifications/mass', payload);
    return res?.data ?? res;
  },

  /**
   * UC-A-05: Retries a failed or stalled mass notification job.
   */
  async retryMassNotificationJob(id: string): Promise<MassNotificationItem> {
    const res = await api.post<any>(`/v1/admin/notifications/mass/${id}/retry`, {});
    return res?.data ?? res;
  },
};
