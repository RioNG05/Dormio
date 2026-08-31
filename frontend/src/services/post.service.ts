import { api } from "./api";

export interface PostImage {
  id: string;
  url: string;
}

export interface PostRoom {
  id: string;
  roomNumber: string;
  floor: number;
  area?: number;
  roomTypeName?: string;
  boardingHouseName?: string;
  boardingHouseId?: string;
}

export interface PostListing {
  id: string;
  postedBy: string;
  roomId?: string | null;
  title: string;
  content: string;
  depositAmount: number;
  status: "draft" | "posted" | "hidden";
  sourceType: "free_quote" | "purchased";
  postPurchaseId?: string | null;
  resultedContractId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  images: PostImage[];
  room?: PostRoom | null;
  viewsCount: number;
}

export interface PostQuotaStatus {
  planName: string;
  dailyPostQuota: number;
  freePostsUsedToday: number;
  freePostsRemainingToday: number;
  purchasedCreditsAvailable: number;
  canPublish: boolean;
}

export interface CreatePostPayload {
  roomId?: string;
  title: string;
  content: string;
  depositAmount: number;
  imageUrls?: string[];
  status?: "draft" | "posted";
}

export interface PaginatedPostsResponse {
  data: PostListing[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DailyReachPoint {
  date: string;
  views: number;
  uniqueViewers: number;
}

export interface TopPostAnalytics {
  id: string;
  title: string;
  status: "draft" | "posted" | "hidden";
  depositAmount: number;
  roomNumber?: string | null;
  boardingHouseName?: string | null;
  thumbnailUrl?: string | null;
  viewsCount: number;
  savedCount: number;
  createdAt: string;
}

export interface PosterAnalyticsOverview {
  totalPosts: number;
  activePosts: number;
  totalViews: number;
  totalSaved: number;
  averageViewsPerPost: number;
  dailyTrends: DailyReachPoint[];
  topPosts: TopPostAnalytics[];
}

export interface SinglePostAnalytics {
  post: TopPostAnalytics;
  totalViews: number;
  totalUniqueViewers: number;
  dailyTrends: DailyReachPoint[];
}

export const postService = {
  /**
   * Check remaining posting quota for today and available purchased credits
   */
  async getQuota(): Promise<PostQuotaStatus> {
    return api.get<PostQuotaStatus>("/posts/quota");
  },

  /**
   * UC-P-01: Publish a new rental listing
   */
  async createPost(payload: CreatePostPayload): Promise<PostListing> {
    return api.post<PostListing>("/posts", payload);
  },

  /**
   * Get all rental listings posted by the landlord with pagination and filters
   */
  async getMyListings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    boardingHouseId?: string;
  }): Promise<PaginatedPostsResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.status) queryParams.status = params.status;
    if (params?.search) queryParams.search = params.search;
    if (params?.boardingHouseId) queryParams.boardingHouseId = params.boardingHouseId;

    return api.get<PaginatedPostsResponse>("/posts/my-listings", {
      params: queryParams,
    });
  },

  /**
   * Get post details by ID
   */
  async getPostById(id: string): Promise<PostListing> {
    return api.get<PostListing>(`/posts/${id}`);
  },

  /**
   * Update post status (e.g. pause/hidden or draft to posted)
   */
  async updatePostStatus(id: string, status: "draft" | "posted" | "hidden"): Promise<PostListing> {
    return api.patch<PostListing>(`/posts/${id}/status`, { status });
  },

  /**
   * UC-P-02: Get aggregate poster analytics overview
   */
  async getAnalyticsOverview(days: number = 14): Promise<PosterAnalyticsOverview> {
    return api.get<PosterAnalyticsOverview>("/posts/analytics/overview", {
      params: { days: days.toString() },
    });
  },

  /**
   * UC-P-02: Get single post drill-down analytics
   */
  async getPostAnalytics(postId: string, days: number = 14): Promise<SinglePostAnalytics> {
    return api.get<SinglePostAnalytics>(`/posts/${postId}/analytics`, {
      params: { days: days.toString() },
    });
  },
};
