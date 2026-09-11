import { api } from './api';

export interface InAppNotification {
  id: string;
  title?: string;
  content: string;
  type:
    | 'billing_due'
    | 'billing_reminder'
    | 'rental_payment'
    | 'contract_created'
    | 'contract_expiring'
    | 'meter_reading'
    | 'grievance'
    | 'broadcast'
    | 'happy_new_year'
    | 'system_greeting'
    | string;
  isRead: boolean;
  createdAt: string;
  boardingHouseId?: string | null;
  targetUrl?: string | null;
}

export function resolveNotificationTarget(
  notification: InAppNotification,
  userRole?: string | null,
): string | null {
  if (notification.targetUrl) {
    return notification.targetUrl;
  }

  const type = notification.type.toLowerCase();

  // Broadcast / holiday greetings: no redirection
  if (
    type === 'broadcast' ||
    type === 'happy_new_year' ||
    type === 'system_greeting' ||
    type.includes('greeting') ||
    type.includes('tet')
  ) {
    return null;
  }

  // Rental billing / payment due notifications
  if (
    type === 'billing_due' ||
    type === 'billing_reminder' ||
    type === 'rental_payment' ||
    type.includes('billing') ||
    type.includes('invoice') ||
    type.includes('payment')
  ) {
    if (userRole === 'landlord') return '/landlord/invoices';
    return '/tenant/invoices';
  }

  // Contract notifications
  if (type === 'contract_created' || type === 'contract_expiring' || type.includes('contract')) {
    if (userRole === 'landlord') return '/landlord/contracts';
    return '/tenant/contracts';
  }

  // Meter readings
  if (type === 'meter_reading' || type.includes('meter')) {
    if (userRole === 'landlord') return '/landlord/meter-readings';
    return '/tenant/meter-readings';
  }

  // Grievances / maintenance
  if (type === 'grievance' || type.includes('support')) {
    if (userRole === 'admin') return '/admin/boarding-houses';
    if (userRole === 'landlord') return '/landlord/maintenance';
    return '/tenant/support';
  }

  return null;
}

const DEFAULT_MOCK_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'mock-noti-1',
    title: 'Đến hạn thanh toán tiền trọ',
    content: 'Hóa đơn tiền phòng tháng 09/2026 đã đến hạn. Vui lòng thanh toán trước ngày 15/09/2026.',
    type: 'rental_payment',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    targetUrl: '/tenant/invoices',
  },
  {
    id: 'mock-noti-2',
    title: 'Chúc mừng năm mới từ Dormio Team',
    content: 'Dormio kính chúc Quý khách hàng và cư dân một năm mới An Khang Thịnh Vượng, Vạn Sự Như Ý!',
    type: 'happy_new_year',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    targetUrl: null,
  },
  {
    id: 'mock-noti-3',
    title: 'Hợp đồng thuê phòng mới',
    content: 'Chủ nhà trọ đã gửi bản dự thảo hợp đồng thuê phòng số P.203 cho bạn.',
    type: 'contract_created',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    targetUrl: '/tenant/contracts',
  },
  {
    id: 'mock-noti-4',
    title: 'Thông báo ghi chỉ số điện nước',
    content: 'Đã có chỉ số điện nước kỳ tháng này. Nhấn để kiểm tra và xác nhận số liệu.',
    type: 'meter_reading',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    targetUrl: '/tenant/meter-readings',
  },
];

export const notificationService = {
  async getMyNotifications(): Promise<InAppNotification[]> {
    try {
      const response = await api.get<any>('/v1/notifications', { silent: true });
      const list = response?.data || response;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
      return DEFAULT_MOCK_NOTIFICATIONS;
    } catch {
      return DEFAULT_MOCK_NOTIFICATIONS;
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      if (id.startsWith('mock-')) return;
      await api.patch(`/v1/notifications/${id}/read`, {}, { silent: true });
    } catch {
      // Graceful fallback
    }
  },
};
