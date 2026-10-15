import { api } from './api'

export interface AdminUserItem {
  id: string
  username: string | null
  phoneNumber: string
  email: string | null
  avatarUrl: string | null
  role: 'leasing_agent' | 'tenant' | 'employee' | 'landlord' | 'admin'
  status: 'active' | 'inactive' | 'banned'
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string | null
  fullName: string | null
  identityNumber: string | null
  isIdentityVerified: boolean
  housesCount: number
  contractsCount: number
  postsCount: number
  subscriptionPackage: string | null
  lastActiveAt: string | null
}

export interface AdminUserIdentification {
  identityNumber: string
  fullName: string
  dateOfBirth: string
  gender: string
  cardFrontUrl?: string
  cardBackUrl?: string
  placeOfResidence?: any
  placeOfOrigin?: any
  issueDate?: string
}

export interface AdminUserBankAccount {
  bankName: string
  accountNumber: string
  accountName: string
}

export interface AdminUserActivity {
  id: string
  action: 'create' | 'update' | 'delete' | 'login' | 'payment'
  entityType: string
  entityId: string
  oldValue?: any
  newValue?: any
  ipAddress: string
  createdAt: string
}

export interface AdminUserDetail extends AdminUserItem {
  bio?: string | null
  identification?: AdminUserIdentification | null
  bankAccount?: AdminUserBankAccount | null
  houseNames: string[]
  recentActivities: AdminUserActivity[]
}

export interface AdminUsersSummary {
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  inactiveUsers: number
  landlordsCount: number
  tenantsCount: number
  employeesCount: number
}

export interface AdminUsersListResponse {
  items: AdminUserItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  summary: AdminUsersSummary
}

export interface AdminUsersFilter {
  query?: string
  role?: string
  status?: string
  joinedFrom?: string
  joinedTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AdminUserActivitiesResponse {
  items: AdminUserActivity[]
  total: number
  page: number
  limit: number
}

export const adminUsersService = {
  /**
   * Fetch paginated users list with filters and platform user KPIs
   */
  async getUsers(filter: AdminUsersFilter = {}): Promise<AdminUsersListResponse> {
    const params: Record<string, string> = {}
    if (filter.query) params.query = filter.query
    if (filter.role) params.role = filter.role
    if (filter.status) params.status = filter.status
    if (filter.joinedFrom) params.joinedFrom = filter.joinedFrom
    if (filter.joinedTo) params.joinedTo = filter.joinedTo
    if (filter.page) params.page = filter.page.toString()
    if (filter.limit) params.limit = filter.limit.toString()
    if (filter.sortBy) params.sortBy = filter.sortBy
    if (filter.sortOrder) params.sortOrder = filter.sortOrder

    const res = await api.get<any>('/v1/admin/users', { params })
    const data = res?.data || res
    return (data?.data || data) as AdminUsersListResponse
  },

  /**
   * Fetch complete user detail including identity KYC and recent activity
   */
  async getUserDetail(id: string): Promise<AdminUserDetail> {
    const res = await api.get<any>(`/v1/admin/users/${id}`)
    const data = res?.data || res
    return (data?.data || data) as AdminUserDetail
  },

  /**
   * Fetch user audit logs / activity history
   */
  async getUserActivities(
    id: string,
    page = 1,
    limit = 20,
  ): Promise<AdminUserActivitiesResponse> {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    }
    const res = await api.get<any>(`/v1/admin/users/${id}/activities`, {
      params,
    })
    const data = res?.data || res
    return (data?.data || data) as AdminUserActivitiesResponse
  },

  /**
   * Update user status (active, inactive, banned)
   */
  async updateUserStatus(
    id: string,
    payload: { status: 'active' | 'inactive' | 'banned'; reason?: string },
  ) {
    const res = await api.patch<any>(`/v1/admin/users/${id}/status`, payload)
    return res?.data || res
  },

  /**
   * Update user role
   */
  async updateUserRole(
    id: string,
    payload: { role: string; reason?: string },
  ) {
    const res = await api.patch<any>(`/v1/admin/users/${id}/role`, payload)
    return res?.data || res
  },

  /**
   * Reset user password
   */
  async resetUserPassword(
    id: string,
    payload: { mustChangePassword?: boolean; temporaryPassword?: string } = {},
  ) {
    const res = await api.post<any>(`/v1/admin/users/${id}/reset-password`, payload)
    return res?.data || res
  },
}

