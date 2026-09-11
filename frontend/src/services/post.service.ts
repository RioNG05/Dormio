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
  status?: string;
}

export interface PostListing {
  id: string;
  postedBy: string;
  roomId?: string | null;
  title: string;
  content: string;
  depositAmount: number;
  status: "draft" | "posted" | "hidden" | "locked";
  sourceType: "free_quote" | "purchased";
  postPurchaseId?: string | null;
  resultedContractId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  images: PostImage[];
  room?: PostRoom | null;
  viewsCount: number;
}

/** Public address derived from BoardingHouse (UC-PU-01) */
export interface PublicAddress {
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  street?: string | null;
  houseNumber?: string | null;
}

/** Public poster subset — phone/email never exposed (UC-PU-02 rule) */
export interface PublicPoster {
  id: string;
  username?: string | null;
  avatarUrl?: string | null;
}

/**
 * UC-PU-02: Public Poster Profile Response
 */
export interface PosterProfileResponse {
  id: string;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  status: string;
  createdAt: string;
  postCount: number;
  phoneNumber?: string | null;
  email?: string | null;
  hasActiveConversation: boolean;
  activeListings: PublicPostListing[];
}

/** Public listing item for UC-PU-01 browse endpoint */
export interface PublicPostListing {
  id: string;
  roomId?: string | null;
  title: string;
  content: string;
  depositAmount: number;
  status: string;
  createdAt: string;
  images: PostImage[];
  room?: PostRoom | null;
  address?: PublicAddress | null;
  poster?: PublicPoster | null;
  viewsCount: number;
  savedCount: number;
  reportsCount?: number;
  reportReasons?: string[];
  lockReason?: string;
  lockedAt?: string;
}

export interface BrowsePostsParams {
  search?: string;
  status?: string;
  province?: string;
  district?: string;
  ward?: string;
  property?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedPublicPostsResponse {
  data: PublicPostListing[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PostQuotaStatus {
  isLandlord: boolean;
  planName: string;
  baseDailyQuota: number;
  bonusDailyQuota: number;
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

export interface UpdatePostPayload {
  title?: string;
  content?: string;
  depositAmount?: number;
  imageUrls?: string[];
  status?: "draft" | "posted" | "hidden" | "locked";
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
   * UC-PU-01: Browse & filter public rental listings (no auth required)
   * Location filters use structured BoardingHouse address fields — NOT free-text.
   */
  async browsePosts(
    params?: BrowsePostsParams
  ): Promise<PaginatedPublicPostsResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.province) queryParams.province = params.province;
    if (params?.district) queryParams.district = params.district;
    if (params?.ward) queryParams.ward = params.ward;
    if (params?.property && params.property !== "all") queryParams.property = params.property;
    if (params?.minPrice !== undefined) queryParams.minPrice = String(params.minPrice);
    if (params?.maxPrice !== undefined) queryParams.maxPrice = String(params.maxPrice);
    if (params?.minArea !== undefined) queryParams.minArea = String(params.minArea);
    if (params?.maxArea !== undefined) queryParams.maxArea = String(params.maxArea);
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    const res = await api.get<
      { success: boolean; data: PaginatedPublicPostsResponse } | PaginatedPublicPostsResponse
    >("/v1/posts/browse", { params: queryParams });
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PaginatedPublicPostsResponse }).data;
    }
    return res as PaginatedPublicPostsResponse;
  },

  /**
   * Get distinct property / boarding house names for listing filters
   */
  async getProperties(): Promise<string[]> {
    const res = await api.get<{ success: boolean; data: string[] } | string[]>(
      "/v1/posts/properties"
    );
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: string[] }).data;
    }
    return (res as string[]) || [];
  },

  /**
   * Check remaining posting quota for today and available purchased credits
   */
  async getQuota(): Promise<PostQuotaStatus> {
    const res = await api.get<{ success: boolean; data: PostQuotaStatus } | PostQuotaStatus>(
      "/v1/posts/quota"
    );
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PostQuotaStatus }).data;
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
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PostListing }).data;
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
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PaginatedPostsResponse }).data;
    }
    return res as PaginatedPostsResponse;
  },

  /**
   * UC-PU-02: Get public poster profile by ID (no auth required, privacy-guarded contact)
   */
  async getPosterProfile(id: string): Promise<PosterProfileResponse> {
    const res = await api.get<
      { success: boolean; data: PosterProfileResponse } | PosterProfileResponse
    >(`/v1/posts/posters/${id}`);
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PosterProfileResponse }).data;
    }
    return res as PosterProfileResponse;
  },

  /**
   * Get a single public post detail by ID (no auth required)
   * Returns full post info including images, room, address and poster (no phone/email).
   */
  async getPublicPostById(id: string): Promise<PublicPostListing> {
    const res = await api.get<
      { success: boolean; data: PublicPostListing } | PublicPostListing
    >(`/v1/posts/browse/${id}`);
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PublicPostListing }).data;
    }
    return res as PublicPostListing;
  },

  /**
   * UC-PU-04: Place a platform deposit on a rental listing (no auth required).
   * Creates a DEPOSIT record, marks the room as deposited and hides the post.
   */
  async submitPlatformDeposit(
    postId: string,
    payload: { tenantName: string; tenantPhone: string; note?: string }
  ): Promise<{ depositId: string; postId: string; message: string }> {
    return api.post<{ depositId: string; postId: string; message: string }>(
      `/v1/posts/browse/${postId}/deposit`,
      payload
    );
  },

  /**
   * Get post details by ID
   */
  async getPostById(id: string): Promise<PostListing> {
    const res = await api.get<{ success: boolean; data: PostListing } | PostListing>(
      `/v1/posts/${id}`
    );
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PostListing }).data;
    }
    return res as PostListing;
  },

  /**
   * Update post status (e.g. pause/hidden, publish draft, or lock)
   */
  async updatePostStatus(
    id: string,
    status: "draft" | "posted" | "hidden" | "locked"
  ): Promise<PostListing> {
    const res = await api.patch<{ success: boolean; data: PostListing } | PostListing>(
      `/v1/posts/${id}/status`,
      { status }
    );
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PostListing }).data;
    }
    return res as PostListing;
  },

  /**
   * Update post listing content (title, content, deposit, images, status)
   */
  async updatePost(
    id: string,
    payload: UpdatePostPayload
  ): Promise<PostListing> {
    const res = await api.patch<{ success: boolean; data: PostListing } | PostListing>(
      `/v1/posts/${id}`,
      payload
    );
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PostListing }).data;
    }
    return res as PostListing;
  },

  /**
   * Delete or archive a rental listing (requires auth, author or admin).
   * Supports an optional or mandatory deletion reason to notify the author.
   */
  async deletePost(
    id: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/v1/posts/${id}`, {
      body: reason ? JSON.stringify({ reason }) : undefined,
      params: reason ? { reason } : undefined,
    });
    return res;
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
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PosterAnalyticsOverview }).data;
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
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: SinglePostAnalytics }).data;
    }
    return res as SinglePostAnalytics;
  },

  /**
   * UC-PU-03: Save/bookmark a rental listing (requires auth)
   */
  async savePost(id: string): Promise<{ saved: boolean; savedCount: number }> {
    const res = await api.post<
      { success: boolean; data: { saved: boolean; savedCount: number } } | { saved: boolean; savedCount: number }
    >(`/v1/posts/${id}/save`);
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: { saved: boolean; savedCount: number } }).data;
    }
    return res as { saved: boolean; savedCount: number };
  },

  /**
   * UC-PU-03: Unsave/remove bookmark for a rental listing (requires auth)
   */
  async unsavePost(id: string): Promise<{ saved: boolean; savedCount: number }> {
    const res = await api.delete<
      { success: boolean; data: { saved: boolean; savedCount: number } } | { saved: boolean; savedCount: number }
    >(`/v1/posts/${id}/save`);
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: { saved: boolean; savedCount: number } }).data;
    }
    return res as { saved: boolean; savedCount: number };
  },

  /**
   * UC-PU-03: Toggle save/bookmark status for a rental listing (requires auth)
   */
  async toggleSavePost(id: string): Promise<{ saved: boolean; savedCount: number }> {
    const res = await api.post<
      { success: boolean; data: { saved: boolean; savedCount: number } } | { saved: boolean; savedCount: number }
    >(`/v1/posts/${id}/toggle-save`);
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: { saved: boolean; savedCount: number } }).data;
    }
    return res as { saved: boolean; savedCount: number };
  },

  /**
   * UC-PU-03: Get all saved post IDs for current user (requires auth)
   */
  async getSavedPostIds(): Promise<string[]> {
    const res = await api.get<{ success: boolean; data: string[] } | string[]>(
      "/v1/posts/saved/ids"
    );
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: string[] }).data;
    }
    return (res as string[]) || [];
  },

  /**
   * UC-PU-03: Get all saved rental listings for current user (requires auth)
   */
  async getSavedPosts(): Promise<PublicPostListing[]> {
    const res = await api.get<
      { success: boolean; data: PublicPostListing[] } | PublicPostListing[]
    >("/v1/posts/saved/all");
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PublicPostListing[] }).data;
    }
    return (res as PublicPostListing[]) || [];
  },

  /**
   * UC-PU-03: Check if a post is bookmarked by current user (requires auth)
   */
  async isPostSaved(id: string): Promise<boolean> {
    const res = await api.get<
      { success: boolean; data: { isSaved: boolean } } | { isSaved: boolean }
    >(`/v1/posts/${id}/is-saved`);
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: { isSaved: boolean } }).data.isSaved;
    }
    return (res as { isSaved: boolean })?.isSaved ?? false;
  },

  /**
   * UC-PU-04: Initiate platform deposit with VietQR instruction
   */
  async initiatePlatformDeposit(
    postId: string,
    payload: InitiatePlatformDepositPayload = {}
  ): Promise<PlatformDepositInstruction> {
    const res = await api.post<
      { success: boolean; data: PlatformDepositInstruction } | PlatformDepositInstruction
    >(`/v1/posts/browse/${postId}/deposit`, payload);
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: PlatformDepositInstruction }).data;
    }
    return res as PlatformDepositInstruction;
  },

  /**
   * UC-PU-04: Confirm platform deposit transaction
   */
  async confirmPlatformDeposit(
    postId: string,
    depositId: string,
    transactionRef?: string
  ): Promise<ConfirmPlatformDepositResponse> {
    const res = await api.post<
      { success: boolean; data: ConfirmPlatformDepositResponse } | ConfirmPlatformDepositResponse
    >(`/v1/posts/browse/${postId}/deposit/confirm`, { depositId, transactionRef });
    if (res && typeof res === "object" && "success" in res) {
      return (res as { success: boolean; data: ConfirmPlatformDepositResponse }).data;
    }
    return res as ConfirmPlatformDepositResponse;
  },
};

export interface InitiatePlatformDepositPayload {
  amount?: number;
  tenantName?: string;
  tenantPhone?: string;
  note?: string;
}

export interface PlatformDepositInstruction {
  depositId: string;
  paymentId: string;
  postId: string;
  roomId?: string;
  amount: number;
  transactionRef: string;
  qrCodeUrl: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  status: string;
  message: string;
}

export interface ConfirmPlatformDepositResponse {
  success: boolean;
  depositId: string;
  status: string;
  message: string;
}
