import { api } from './api'

export const NOTIFICATIONS_STORAGE_KEY = 'dormio_custom_notifications'
export const NOTIFICATION_EVENT_NAME = 'dormio_notification_added'

export interface InAppNotification {
  id: string
  title?: string
  content: string
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
    | 'account_registration_success'
    | 'package_payment_success'
    | string
  isRead: boolean
  createdAt: string
  boardingHouseId?: string | null
  targetUrl?: string | null
}

export function addCustomNotification(
  noti: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'> & { id?: string },
): InAppNotification {
  const newNoti: InAppNotification = {
    id: noti.id || `custom-noti-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: noti.title,
    content: noti.content,
    type: noti.type,
    isRead: false,
    createdAt: new Date().toISOString(),
    boardingHouseId: noti.boardingHouseId || null,
    targetUrl: noti.targetUrl || null,
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      const list: InAppNotification[] = stored ? JSON.parse(stored) : []
      const updated = [newNoti, ...list.filter(item => item.id !== newNoti.id)].slice(0, 50)
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT_NAME, { detail: newNoti }))
    } catch (e) {
      console.error('Failed to save notification to localStorage', e)
    }
  }

  return newNoti
}

export function resolveNotificationTarget(
  notification: InAppNotification,
  userRole?: string | null,
): string | null {
  if (notification.targetUrl) {
    return notification.targetUrl
  }

  const type = notification.type.toLowerCase()

  // Account registration success
  if (
    type === 'account_registration_success' ||
    type.includes('register') ||
    type.includes('welcome')
  ) {
    if (userRole === 'landlord') return '/landlord'
    if (userRole === 'tenant') return '/tenant'
    return '/profile'
  }

  // Package payment success
  if (
    type === 'package_payment_success' ||
    type.includes('package') ||
    type.includes('subscription')
  ) {
    if (userRole === 'landlord') return '/landlord/reports'
    return '/pricing'
  }

  // Broadcast / holiday greetings: no redirection
  if (
    type === 'broadcast' ||
    type === 'happy_new_year' ||
    type === 'system_greeting' ||
    type === 'system_broadcast' ||
    type === 'maintenance_broadcast' ||
    type.includes('greeting') ||
    type.includes('tet') ||
    type.includes('broadcast')
  ) {
    return null
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
    if (userRole === 'landlord') return '/landlord/invoices'
    return '/tenant/invoices'
  }

  // Contract notifications
  if (type === 'contract_created' || type === 'contract_expiring' || type.includes('contract')) {
    if (userRole === 'landlord') return '/landlord/contracts'
    return '/tenant/contracts'
  }

  // Meter readings
  if (type === 'meter_reading' || type.includes('meter')) {
    if (userRole === 'landlord') return '/landlord/meter-readings'
    return '/tenant/meter-readings'
  }

  // Grievances / maintenance
  if (type === 'grievance' || type === 'grievance_resolved' || type.includes('support')) {
    if (userRole === 'admin') return '/admin/boarding-houses'
    if (userRole === 'landlord') return '/landlord/maintenance'
    return '/tenant/support'
  }

  return null
}

const DEFAULT_MOCK_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'mock-noti-register',
    title: 'Đăng ký tài khoản thành công',
    content:
      'Chào mừng bạn đến với Dormio! Tài khoản của bạn đã được khởi tạo và sẵn sàng sử dụng.',
    type: 'account_registration_success',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    targetUrl: '/profile',
  },
  {
    id: 'mock-noti-package-paid',
    title: 'Thanh toán gói dịch vụ thành công',
    content:
      'Gói cước của bạn đã được thanh toán và kích hoạt thành công qua PayOS. Chúc bạn có trải nghiệm tuyệt vời!',
    type: 'package_payment_success',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    targetUrl: '/pricing',
  },
  {
    id: 'mock-noti-1',
    title: 'Đến hạn thanh toán tiền trọ',
    content:
      'Hóa đơn tiền phòng tháng 09/2026 đã đến hạn. Vui lòng thanh toán trước ngày 15/09/2026.',
    type: 'rental_payment',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    targetUrl: '/tenant/invoices',
  },
  {
    id: 'mock-noti-2',
    title: 'Chúc mừng năm mới từ Dormio Team',
    content:
      'Dormio kính chúc Quý khách hàng và cư dân một năm mới An Khang Thịnh Vượng, Vạn Sự Như Ý!',
    type: 'happy_new_year',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    targetUrl: null,
  },
  {
    id: 'mock-noti-3',
    title: 'Hợp đồng thuê phòng mới',
    content: 'Chủ nhà trọ đã gửi bản dự thảo hợp đồng thuê phòng số P.203 cho bạn.',
    type: 'contract_created',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    targetUrl: '/tenant/contracts',
  },
  {
    id: 'mock-noti-4',
    title: 'Thông báo ghi chỉ số điện nước',
    content: 'Đã có chỉ số điện nước kỳ tháng này. Nhấn để kiểm tra và xác nhận số liệu.',
    type: 'meter_reading',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    targetUrl: '/tenant/meter-readings',
  },
]

export const notificationService = {
  async getMyNotifications(): Promise<InAppNotification[]> {
    let customList: InAppNotification[] = []
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
        if (stored) customList = JSON.parse(stored)
      } catch {
        // Fallback
      }
    }

    try {
      const response = await api.get<any>('/v1/notifications', { silent: true })
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : null

      const baseList: InAppNotification[] = list !== null ? list : DEFAULT_MOCK_NOTIFICATIONS
      const merged = [
        ...customList,
        ...baseList.filter((b: InAppNotification) => !customList.some(c => c.id === b.id)),
      ]
      return merged
    } catch {
      const merged = [
        ...customList,
        ...DEFAULT_MOCK_NOTIFICATIONS.filter((b: InAppNotification) => !customList.some(c => c.id === b.id)),
      ]
      return merged
    }
  },

  async markAsRead(id: string): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
        if (stored) {
          const list: InAppNotification[] = JSON.parse(stored)
          const updated = list.map(n => (n.id === id ? { ...n, isRead: true } : n))
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
        }
      } catch {
        // Fallback
      }
    }

    try {
      if (id.startsWith('mock-') || id.startsWith('custom-')) return
      await api.patch(`/v1/notifications/${id}/read`, {}, { silent: true })
    } catch {
      // Graceful fallback
    }
  },

  async markAllAsRead(): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
        if (stored) {
          const list: InAppNotification[] = JSON.parse(stored)
          const updated = list.map(n => ({ ...n, isRead: true }))
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
        }
      } catch {
        // Fallback
      }
    }

    try {
      await api.patch('/v1/notifications/read-all', {}, { silent: true })
    } catch {
      // Graceful fallback
    }
  },
}
