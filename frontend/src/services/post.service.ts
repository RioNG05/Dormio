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
    const res = await api.get<{ success: boolean; data: PostQuotaStatus } | PostQuotaStatus>(
      "/v1/posts/quota"
    );
    if (res && typeof res === "object" && "data" in res && res.data) {
      return res.data;
    }
    return res as PostQuotaStatus;
  },

  /**
   * UC-P-01: Publish a new rental listing
   */
  async createPost(payload: CreatePostPayload): Promise<PostListing> {
    const res = await api.post<{ success: boolean; data: PostListing } | PostListing>(
      "/v1/posts",
      payload
    );
    if (res && typeof res === "object" && "data" in res && res.data) {
      return res.data;
    }
    return res as PostListing;
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

    const res = await api.get<{ success: boolean; data: PaginatedPostsResponse } | PaginatedPostsResponse>(
      "/v1/posts/my-listings",
      {
        params: queryParams,
      }
    );
    if (res && typeof res === "object" && "data" in res && res.data) {
      return res.data;
    }
    return res as PaginatedPostsResponse;
  },

  /**
   * Get post details by ID
   */
  async getPostById(id: string): Promise<PostListing> {
    const res = await api.get<{ success: boolean; data: PostListing } | PostListing>(
      `/v1/posts/${id}`
    );
    if (res && typeof res === "object" && "data" in res && res.data) {
      return res.data;
    }
    return res as PostListing;
  },

  /**
   * Update post status (e.g. pause/hidden or draft to posted)
   */
  async updatePostStatus(
    id: string,
    status: "draft" | "posted" | "hidden"
  ): Promise<PostListing> {
    const res = await api.patch<{ success: boolean; data: PostListing } | PostListing>(
      `/v1/posts/${id}/status`,
      { status }
    );
    if (res && typeof res === "object" && "data" in res && res.data) {
      return res.data;
    }
    return res as PostListing;
  },

  /**
   * UC-P-02: Get aggregate poster analytics overview
   */
  async getAnalyticsOverview(days: number = 14): Promise<PosterAnalyticsOverview> {
    const res = await api.get<{ success: boolean; data: PosterAnalyticsOverview } | PosterAnalyticsOverview>(
      "/v1/posts/analytics/overview",
      {
        params: { days: days.toString() },
      }
    );
    if (res && typeof res === "object" && "data" in res && res.data) {
      return res.data;
    }
    return res as PosterAnalyticsOverview;
  },

  /**
   * UC-P-02: Get single post drill-down analytics
   */
  async getPostAnalytics(
    postId: string,
    days: number = 14
  ): Promise<SinglePostAnalytics> {
    const res = await api.get<{ success: boolean; data: SinglePostAnalytics } | SinglePostAnalytics>(
      `/v1/posts/${postId}/analytics`,
      {
        params: { days: days.toString() },
      }
    );
    if (res && typeof res === "object" && "data" in res && res.data) {
      return res.data;
    }
    return res as SinglePostAnalytics;
  },
};
