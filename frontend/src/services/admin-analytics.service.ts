import { api } from './api';

export type TimeBucketPeriod = 'week' | 'month' | 'year';
export type RevenuePeriod = 'month' | 'quarter' | 'year';

export interface AdminAnalyticsQuery {
  period?: TimeBucketPeriod;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface RevenueAnalyticsQuery {
  period?: RevenuePeriod;
  year?: number;
  startDate?: string;
  endDate?: string;
}

// ─── UC-A-01: USERS ──────────────────────────────────────────────────────────

export interface UserRoleBreakdown {
  tenant: number;
  landlord: number;
  employee: number;
  leasing_agent: number;
  admin: number;
}

export interface UserStatusBreakdown {
  active: number;
  inactive: number;
  banned: number;
}

export interface UserAnalyticsSummary {
  totalUsers: number;
  newUsersCurrentPeriod: number;
  newUsersPreviousPeriod: number;
  growthRate: number;
  byRole: UserRoleBreakdown;
  byStatus: UserStatusBreakdown;
}

export interface UserTimelineItem {
  bucket: string;
  label: string;
  count: number;
  byRole: UserRoleBreakdown;
}

export interface UserAnalyticsResponse {
  summary: UserAnalyticsSummary;
  timeline: UserTimelineItem[];
}

// ─── UC-A-02: PROPERTIES & ROOMS ─────────────────────────────────────────────

export interface RoomStatusBreakdown {
  available: number;
  deposited: number;
  occupied: number;
  maintainace: number;
}

export interface BoardingHouseStatusBreakdown {
  active: number;
  inactive: number;
  banned: number;
}

export interface RegionalPropertyBreakdown {
  name: string;
  houses: number;
  rooms: number;
  occupancyRate: number;
  share: string;
}

export interface PropertyAnalyticsSummary {
  totalHouses: number;
  newHousesCurrentPeriod: number;
  newHousesPreviousPeriod: number;
  growthRate: number;
  totalRooms: number;
  occupancyRate: number;
  housesByStatus: BoardingHouseStatusBreakdown;
  roomsByStatus: RoomStatusBreakdown;
  regions: RegionalPropertyBreakdown[];
}

export interface PropertyTimelineItem {
  bucket: string;
  label: string;
  count: number;
}

export interface PropertyAnalyticsResponse {
  summary: PropertyAnalyticsSummary;
  timeline: PropertyTimelineItem[];
}

// ─── UC-A-03: LISTINGS ───────────────────────────────────────────────────────

export interface PostStatusBreakdown {
  posted: number;
  draft: number;
  hidden: number;
}

export interface PostSourceBreakdown {
  free_quote: number;
  purchased: number;
}

export interface ListingAnalyticsSummary {
  totalPosts: number;
  newPostsCurrentPeriod: number;
  newPostsPreviousPeriod: number;
  growthRate: number;
  totalViews: number;
  totalSaved: number;
  averageViewsPerPost: number;
  byStatus: PostStatusBreakdown;
  bySourceType: PostSourceBreakdown;
}

export interface ListingTimelineItem {
  bucket: string;
  label: string;
  count: number;
}

export interface ListingAnalyticsResponse {
  summary: ListingAnalyticsSummary;
  timeline: ListingTimelineItem[];
}

// ─── UC-A-06: PLATFORM REVENUE ───────────────────────────────────────────────

export interface SubscriptionByPlan {
  plus: number;
  pro: number;
}

export interface SubscriptionByCycle {
  monthly: number;
  yearly: number;
}

export interface SubscriptionRevenueSummary {
  total: number;
  percentage: number;
  byPlan: SubscriptionByPlan;
  byCycle: SubscriptionByCycle;
}

export interface PostPurchaseRevenueSummary {
  total: number;
  percentage: number;
  totalCreditsSold: number;
  totalTransactions: number;
  averageOrderValue: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  previousPeriodRevenue: number;
  revenueGrowthRate: number;
  subscriptionRevenue: SubscriptionRevenueSummary;
  postPurchaseRevenue: PostPurchaseRevenueSummary;
}

export interface RevenueTimelineItem {
  bucket: string;
  label: string;
  totalRevenue: number;
  subscriptionPlus: number;
  subscriptionPro: number;
  postPurchase: number;
}

export interface RevenueAnalyticsResponse {
  summary: RevenueSummary;
  timeline: RevenueTimelineItem[];
}

// ─── UNIFIED OVERVIEW ────────────────────────────────────────────────────────

export interface AdminOverviewResponse {
  totalUsers: number;
  userGrowthRate: number;
  userRoles: UserRoleBreakdown;
  totalHouses: number;
  totalRooms: number;
  occupancyRate: number;
  propertyGrowthRate: number;
  platformRevenue: number;
  revenueGrowthRate: number;
  pendingGrievancesCount: number;
  urgentGrievancesCount: number;
  reportedItemsCount: number;
}

// ─── SERVICE API ─────────────────────────────────────────────────────────────

export const adminAnalyticsService = {
  async getUserAnalytics(query?: AdminAnalyticsQuery): Promise<UserAnalyticsResponse> {
    const params: Record<string, string> = {};
    if (query?.period) params.period = query.period;
    if (query?.year) params.year = query.year.toString();
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;

    const res = await api.get<{ success: boolean; data: UserAnalyticsResponse }>(
      '/v1/admin/analytics/users',
      { params },
    );
    return res.data;
  },

  async getPropertyAnalytics(query?: AdminAnalyticsQuery): Promise<PropertyAnalyticsResponse> {
    const params: Record<string, string> = {};
    if (query?.period) params.period = query.period;
    if (query?.year) params.year = query.year.toString();
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;

    const res = await api.get<{ success: boolean; data: PropertyAnalyticsResponse }>(
      '/v1/admin/analytics/properties',
      { params },
    );
    return res.data;
  },

  async getListingAnalytics(query?: AdminAnalyticsQuery): Promise<ListingAnalyticsResponse> {
    const params: Record<string, string> = {};
    if (query?.period) params.period = query.period;
    if (query?.year) params.year = query.year.toString();
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;

    const res = await api.get<{ success: boolean; data: ListingAnalyticsResponse }>(
      '/v1/admin/analytics/listings',
      { params },
    );
    return res.data;
  },

  async getRevenueAnalytics(query?: RevenueAnalyticsQuery): Promise<RevenueAnalyticsResponse> {
    const params: Record<string, string> = {};
    if (query?.period) params.period = query.period;
    if (query?.year) params.year = query.year.toString();
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;

    const res = await api.get<{ success: boolean; data: RevenueAnalyticsResponse }>(
      '/v1/admin/analytics/revenue',
      { params },
    );
    return res.data;
  },

  async getAdminOverview(): Promise<AdminOverviewResponse> {
    const res = await api.get<{ success: boolean; data: AdminOverviewResponse }>(
      '/v1/admin/analytics/overview',
    );
    return res.data;
  },
};
