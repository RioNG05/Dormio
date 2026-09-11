import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto, BrowsePostsQueryDto } from './dto/post-query.dto';
import {
  PaginatedPostsResponseDto,
  PaginatedPublicPostsResponseDto,
  PostQuotaDto,
  PostResponseDto,
  PosterProfileResponseDto,
  PublicAddressDto,
  PublicPostResponseDto,
} from './dto/post-response.dto';
import {
  DailyReachPointDto,
  PosterAnalyticsOverviewDto,
  SinglePostAnalyticsDto,
  TopPostAnalyticsDto,
} from './dto/post-analytics.dto';
import {
  PostStatus,
  SourceType,
  PostPurchaseStatus,
  SubscriptionStatus,
  Prisma,
  DepositType,
  DepositStatus,
  RoomStatus,
  PaymentType,
  PaymentMethod,
  PaymentStatus,
  AuditLogAction,
  UserRole,
} from '@prisma';
import {
  CreatePlatformDepositDto,
  InitiatePlatformDepositDto,
  ConfirmPlatformDepositDto,
  PlatformDepositInstructionDto,
} from './dto/create-platform-deposit.dto';

export const BASE_DAILY_FREE_POST_QUOTA = 3;

export interface QuotaAllocation {
  sourceType: SourceType;
  postPurchaseId: string | null;
}

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Check if user is a landlord by checking ownership of at least one boarding house.
   * Ground truth is BoardingHouse.ownerId = userId per 07-auth-and-roles.md.
   */
  async checkIsLandlord(userId: string): Promise<boolean> {
    const count = await this.prisma.boardingHouse.count({
      where: { ownerId: userId },
    });
    return count > 0;
  }

  /**
   * UC-P-01 Quota Check
   *
   * Step 3:
   * - Free posts used today by user.
   * - Total free quota:
   *   - Leasing agent (is_landlord = false): flat BASE_DAILY_FREE_POST_QUOTA = 3.
   *   - Landlord (is_landlord = true): BASE_DAILY_FREE_POST_QUOTA (3) + bonus from active UserSubscription (plus=5, pro=10, free=0).
   * - If used < total free quota: allowed as free_quote.
   * - Else: check PostPurchase for buyerId with status = 'paid' and COUNT(posts) < quantityPurchase, FIFO by activatedAt.
   * - If neither: throws ForbiddenException.
   */
  async checkQuota(
    userId: string,
    isLandlord: boolean,
  ): Promise<QuotaAllocation> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // a) Free posts used today
    const freePostsUsedToday = await this.prisma.post.count({
      where: {
        postedBy: userId,
        sourceType: SourceType.free_quote,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // b) Total free quota calculation
    let bonusQuota = 0;
    if (isLandlord) {
      const activeSub = await this.prisma.userSubscription.findFirst({
        where: {
          userId,
          status: SubscriptionStatus.active,
        },
        orderBy: {
          startDate: 'desc',
        },
        include: {
          subscriptionPlan: true,
        },
      });

      bonusQuota = activeSub?.subscriptionPlan?.dailyPostQuote ?? 0;
    }

    const totalFreeDailyQuota = BASE_DAILY_FREE_POST_QUOTA + bonusQuota;

    if (freePostsUsedToday < totalFreeDailyQuota) {
      this.logger.debug(
        `User ${userId} (isLandlord: ${isLandlord}) using free quota (${freePostsUsedToday + 1}/${totalFreeDailyQuota})`,
      );
      return {
        sourceType: SourceType.free_quote,
        postPurchaseId: null,
      };
    }

    // Fallback: check purchased credits (FIFO order by activatedAt)
    const paidPurchases = await this.prisma.postPurchase.findMany({
      where: {
        buyerId: userId,
        status: PostPurchaseStatus.paid,
      },
      orderBy: {
        activatedAt: 'asc',
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    const availableCredit = paidPurchases.find(
      (pp) => pp._count.posts < pp.quantityPurchase,
    );

    if (availableCredit) {
      this.logger.debug(
        `User ${userId} using purchased credit package ${availableCredit.id} (${availableCredit._count.posts + 1}/${availableCredit.quantityPurchase})`,
      );
      return {
        sourceType: SourceType.purchased,
        postPurchaseId: availableCredit.id,
      };
    }

    this.logger.warn(
      `User ${userId} rejected: posting quota exhausted (free: ${freePostsUsedToday}/${totalFreeDailyQuota}, purchased: 0)`,
    );
    throw new ForbiddenException(
      'Daily posting quota exhausted. Please upgrade your subscription plan or purchase post credits.',
    );
  }

  /**
   * Retrieves quota statistics for the authenticated poster.
   */
  async getQuotaStatus(userId: string): Promise<PostQuotaDto> {
    const isLandlord = await this.checkIsLandlord(userId);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const freePostsUsedToday = await this.prisma.post.count({
      where: {
        postedBy: userId,
        sourceType: SourceType.free_quote,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    let planName = 'leasing_agent';
    let bonusDailyQuota = 0;

    if (isLandlord) {
      const activeSub = await this.prisma.userSubscription.findFirst({
        where: {
          userId,
          status: SubscriptionStatus.active,
        },
        orderBy: {
          startDate: 'desc',
        },
        include: {
          subscriptionPlan: true,
        },
      });

      planName = activeSub?.planName ?? 'free';
      bonusDailyQuota = activeSub?.subscriptionPlan?.dailyPostQuote ?? 0;
    }

    const baseDailyQuota = BASE_DAILY_FREE_POST_QUOTA;
    const dailyPostQuota = baseDailyQuota + bonusDailyQuota;

    const paidPurchases = await this.prisma.postPurchase.findMany({
      where: {
        buyerId: userId,
        status: PostPurchaseStatus.paid,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    const purchasedCreditsAvailable = paidPurchases.reduce((acc, pp) => {
      const remaining = Math.max(0, pp.quantityPurchase - pp._count.posts);
      return acc + remaining;
    }, 0);

    const freePostsRemainingToday = Math.max(
      0,
      dailyPostQuota - freePostsUsedToday,
    );
    const canPublish =
      freePostsRemainingToday > 0 || purchasedCreditsAvailable > 0;

    return {
      isLandlord,
      planName,
      baseDailyQuota,
      bonusDailyQuota,
      dailyPostQuota,
      freePostsUsedToday,
      freePostsRemainingToday,
      purchasedCreditsAvailable,
      canPublish,
    };
  }

  /**
   * UC-P-01: Publish Rental Listing
   */
  async createPost(
    userId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    this.logger.log(
      `Creating post listing for user ${userId} with title "${dto.title}"`,
    );

    // Step 1 — Determine landlord-or-not
    const isLandlord = await this.checkIsLandlord(userId);

    // Step 2 — Room-linking rule (validate before quota)
    if (!isLandlord) {
      if (dto.roomId) {
        throw new BadRequestException(
          'Leasing agents can only publish general listings and cannot link to specific rooms',
        );
      }
    } else {
      if (dto.roomId) {
        const room = await this.prisma.room.findUnique({
          where: { id: dto.roomId },
          include: {
            boardingHouse: true,
          },
        });

        if (!room) {
          throw new NotFoundException(`Room with ID ${dto.roomId} was not found`);
        }

        if (room.boardingHouse.ownerId !== userId) {
          throw new ForbiddenException(
            'You do not have permission to publish a listing for a room owned by another landlord',
          );
        }
      }
    }

    // Step 3 — Quota Check
    const quota = await this.checkQuota(userId, isLandlord);

    // Step 4 — Database Insertion in transaction
    const farFuture = new Date('2099-12-31');

    const createdPost = await this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          postedBy: userId,
          roomId: dto.roomId || null,
          title: dto.title,
          content: dto.content,
          depositAmount: new Prisma.Decimal(dto.depositAmount),
          status: dto.status || PostStatus.posted,
          sourceType: quota.sourceType,
          postPurchaseId: quota.postPurchaseId,
          deletedAt: farFuture,
        },
      });

      if (dto.imageUrls && dto.imageUrls.length > 0) {
        await tx.postImage.createMany({
          data: dto.imageUrls.map((url) => ({
            postId: post.id,
            url,
          })),
        });
      }

      return post;
    });

    return this.getPostById(userId, createdPost.id);
  }

  /**
   * Retrieve a single post by ID
   */
  async getPostById(userId: string, postId: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        postImages: true,
        room: {
          include: {
            roomType: true,
            boardingHouse: true,
          },
        },
        _count: {
          select: {
            postReaches: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Listing with ID ${postId} was not found`);
    }

    return this.mapToResponseDto(post);
  }

  /**
   * Retrieve all listings posted by the current user with pagination and filters
   */
  async getMyPosts(
    userId: string,
    query: PostQueryDto,
  ): Promise<PaginatedPostsResponseDto> {
    const { page = 1, limit = 10, status, search, boardingHouseId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      postedBy: userId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (boardingHouseId) {
      where.room = {
        boardingHouseId,
      };
    }

    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        include: {
          postImages: true,
          room: {
            include: {
              roomType: true,
              boardingHouse: true,
            },
          },
          _count: {
            select: {
              postReaches: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: posts.map((post) => this.mapToResponseDto(post)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Update post status (e.g. pause/hidden or reactivate to posted)
   */
  async updatePostStatus(
    userId: string,
    postId: string,
    status: PostStatus,
    userRole?: UserRole,
  ): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Listing with ID ${postId} was not found`);
    }

    if (userRole !== UserRole.admin && post.postedBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to change the status of this listing',
      );
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { status },
    });

    return this.getPostById(userId, postId);
  }

  /**
   * Delete or archive a rental listing (admin or author)
   */
  async deletePost(
    userId: string,
    postId: string,
    userRole?: UserRole,
  ): Promise<{ success: boolean; message: string }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Listing with ID ${postId} was not found`);
    }

    if (userRole !== UserRole.admin && post.postedBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this listing',
      );
    }

    // Soft delete by setting deletedAt to current time and hiding post
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: new Date(),
        status: PostStatus.hidden,
      },
    });

    return {
      success: true,
      message: 'Bài viết/tin đăng đã được xóa thành công',
    };
  }

  /**
   * UC-P-02: Poster Analytics Dashboard Overview
   *
   * Query Post WHERE postedBy = userId, joined PostReach for aggregate view counts
   * (COUNT(PostReach) GROUP BY postId) and daily reach trends.
   */
  async getPosterAnalyticsOverview(
    userId: string,
    days: number = 14,
  ): Promise<PosterAnalyticsOverviewDto> {
    const validDays = Math.max(1, Math.min(days, 90));
    this.logger.log(
      `Calculating poster analytics overview for user ${userId} over last ${validDays} days`,
    );

    // 1. Fetch all user posts with reach and bookmark relations
    const posts = await this.prisma.post.findMany({
      where: {
        postedBy: userId,
      },
      include: {
        postImages: true,
        room: {
          include: {
            boardingHouse: true,
          },
        },
        _count: {
          select: {
            postReaches: true,
            savedPosts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalPosts = posts.length;
    const activePosts = posts.filter((p) => p.status === PostStatus.posted).length;
    const totalViews = posts.reduce((sum, p) => sum + (p._count?.postReaches ?? 0), 0);
    const totalSaved = posts.reduce((sum, p) => sum + (p._count?.savedPosts ?? 0), 0);
    const averageViewsPerPost =
      activePosts > 0 ? Math.round((totalViews / activePosts) * 10) / 10 : 0;

    const postIds = posts.map((p) => p.id);

    // 2. Fetch daily reach trend records within the time window
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (validDays - 1));
    startDate.setHours(0, 0, 0, 0);

    const reachRecords =
      postIds.length > 0
        ? await this.prisma.postReach.findMany({
          where: {
            postId: { in: postIds },
            viewedAt: { gte: startDate },
          },
          select: {
            viewedAt: true,
            viewedBy: true,
          },
        })
        : [];

    const dailyTrends = this.buildDailyTrendMap(reachRecords, validDays);

    // 3. Format top performing posts
    const topPosts: TopPostAnalyticsDto[] = [...posts]
      .sort((a, b) => (b._count?.postReaches ?? 0) - (a._count?.postReaches ?? 0))
      .map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        depositAmount: Number(p.depositAmount),
        roomNumber: p.room?.roomNumber ?? null,
        boardingHouseName: p.room?.boardingHouse?.name ?? null,
        thumbnailUrl: p.postImages?.[0]?.url ?? null,
        viewsCount: p._count?.postReaches ?? 0,
        savedCount: p._count?.savedPosts ?? 0,
        createdAt: p.createdAt,
      }));

    return {
      totalPosts,
      activePosts,
      totalViews,
      totalSaved,
      averageViewsPerPost,
      dailyTrends,
      topPosts,
    };
  }

  /**
   * UC-P-02: Single Post Drill-Down Analytics
   *
   * Same query filtered to one postId, broken out by day (GROUP BY date_trunc('day', viewedAt))
   * for a detailed trend chart.
   */
  async getSinglePostAnalytics(
    userId: string,
    postId: string,
    days: number = 14,
  ): Promise<SinglePostAnalyticsDto> {
    const validDays = Math.max(1, Math.min(days, 90));
    this.logger.log(
      `Calculating single post analytics for post ${postId} over ${validDays} days by user ${userId}`,
    );

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        postImages: true,
        room: {
          include: {
            boardingHouse: true,
          },
        },
        _count: {
          select: {
            postReaches: true,
            savedPosts: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Listing with ID ${postId} was not found`);
    }

    if (post.postedBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view analytics for a listing that does not belong to you',
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (validDays - 1));
    startDate.setHours(0, 0, 0, 0);

    const reachRecords = await this.prisma.postReach.findMany({
      where: {
        postId,
        viewedAt: { gte: startDate },
      },
      select: {
        viewedAt: true,
        viewedBy: true,
      },
    });

    const dailyTrends = this.buildDailyTrendMap(reachRecords, validDays);
    const uniqueViewersSet = new Set(reachRecords.map((r) => r.viewedBy));

    const postDto: TopPostAnalyticsDto = {
      id: post.id,
      title: post.title,
      status: post.status,
      depositAmount: Number(post.depositAmount),
      roomNumber: post.room?.roomNumber ?? null,
      boardingHouseName: post.room?.boardingHouse?.name ?? null,
      thumbnailUrl: post.postImages?.[0]?.url ?? null,
      viewsCount: post._count?.postReaches ?? 0,
      savedCount: post._count?.savedPosts ?? 0,
      createdAt: post.createdAt,
    };

    return {
      post: postDto,
      totalViews: post._count?.postReaches ?? 0,
      totalUniqueViewers: uniqueViewersSet.size,
      dailyTrends,
    };
  }

  private buildDailyTrendMap(
    records: { viewedAt: Date; viewedBy: string }[],
    days: number,
  ): DailyReachPointDto[] {
    const result: DailyReachPointDto[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        views: 0,
        uniqueViewers: 0,
      });
    }

    const uniqueUsersByDate: Record<string, Set<string>> = {};
    for (const item of result) {
      uniqueUsersByDate[item.date] = new Set<string>();
    }

    for (const record of records) {
      const recordDateStr = new Date(record.viewedAt).toISOString().split('T')[0];
      const point = result.find((p) => p.date === recordDateStr);
      if (point) {
        point.views++;
        if (record.viewedBy) {
          uniqueUsersByDate[recordDateStr]?.add(record.viewedBy);
        }
      }
    }

    for (const point of result) {
      point.uniqueViewers = uniqueUsersByDate[point.date]?.size ?? point.views;
    }

    return result;
  }

  /**
   * UC-PU-02: Get a single public post detail by ID (no auth required)
   *
   * Returns full PublicPostResponseDto. Throws NotFoundException if not found or not posted.
   */
  async getPublicPostById(postId: string): Promise<PublicPostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, status: PostStatus.posted },
      include: {
        postImages: true,
        room: {
          include: {
            roomType: true,
            boardingHouse: true,
          },
        },
        postedByUser: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            // IMPORTANT: never select phoneNumber/email in public response (UC-PU-02 rule)
          },
        },
        _count: {
          select: {
            postReaches: true,
            savedPosts: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Public listing with ID ${postId} was not found or is not available`);
    }

    this.logger.log(`Public post detail fetched: ${postId}`);
    return this.mapToPublicResponseDto(post);
  }

  /**
   * UC-PU-01: Browse & Filter Listings (public, no auth required)
   *
   * Filters: status=posted, keyword (title|content), province, district, ward,
   * minPrice/maxPrice (depositAmount), minArea/maxArea (room.area).
   * Location filters use structured BoardingHouse address fields — NOT free-text.
   */
  async browsePosts(
    query: BrowsePostsQueryDto,
  ): Promise<PaginatedPublicPostsResponseDto> {
    const {
      page = 1,
      limit = 12,
      search,
      status,
      province,
      district,
      ward,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      deletedAt: { gt: new Date() },
    };

    if (status) {
      if (status !== 'all' && (Object.values(PostStatus) as string[]).includes(status)) {
        where.status = status as PostStatus;
      }
    } else {
      where.status = PostStatus.posted;
    }

    // Keyword filter: title or content (case-insensitive)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build room+boardingHouse filter for location & area
    const roomFilter: Prisma.RoomWhereInput = {};
    const boardingHouseFilter: Prisma.BoardingHouseWhereInput = {};
    let hasLocationFilter = false;
    let hasAreaFilter = false;

    if (province) {
      boardingHouseFilter.province = { equals: province, mode: 'insensitive' };
      hasLocationFilter = true;
    }
    if (district) {
      boardingHouseFilter.district = { equals: district, mode: 'insensitive' };
      hasLocationFilter = true;
    }
    if (ward) {
      boardingHouseFilter.ward = { equals: ward, mode: 'insensitive' };
      hasLocationFilter = true;
    }
    if (hasLocationFilter) {
      roomFilter.boardingHouse = boardingHouseFilter;
    }

    if (minArea !== undefined || maxArea !== undefined) {
      const areaFilter: { gte?: string; lte?: string } = {};
      if (minArea !== undefined) areaFilter.gte = String(minArea);
      if (maxArea !== undefined) areaFilter.lte = String(maxArea);
      roomFilter.area = areaFilter as Prisma.RoomWhereInput['area'];
      hasAreaFilter = true;
    }

    if (hasLocationFilter || hasAreaFilter) {
      // Posts without a linked room are excluded when area/location filters are active
      where.room = roomFilter;
    }

    // Price filter on depositAmount (Decimal field — use string values for Prisma Decimal comparison)
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: { gte?: string; lte?: string } = {};
      if (minPrice !== undefined) priceFilter.gte = String(minPrice);
      if (maxPrice !== undefined) priceFilter.lte = String(maxPrice);
      where.depositAmount = priceFilter as Prisma.PostWhereInput['depositAmount'];
    }

    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        include: {
          postImages: true,
          room: {
            include: {
              roomType: true,
              boardingHouse: true,
            },
          },
          postedByUser: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              // IMPORTANT: never select phoneNumber/email in public response (UC-PU-02 rule)
            },
          },
          _count: {
            select: {
              postReaches: true,
              savedPosts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: posts.map((post) => this.mapToPublicResponseDto(post)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  private mapToPublicResponseDto(post: any): PublicPostResponseDto {
    const bh = post.room?.boardingHouse;
    const address: PublicAddressDto | null = bh
      ? {
        province: bh.province,
        district: bh.district,
        ward: bh.ward,
        street: bh.street,
        houseNumber: bh.houseNumber,
      }
      : null;

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      depositAmount: Number(post.depositAmount),
      status: post.status,
      createdAt: post.createdAt,
      images: (post.postImages || []).map((img: any) => ({
        id: img.id,
        url: img.url,
      })),
      room: post.room
        ? {
          id: post.room.id,
          roomNumber: post.room.roomNumber,
          floor: post.room.floor,
          area: post.room.area ? Number(post.room.area) : undefined,
          roomTypeName: post.room.roomType?.name,
          boardingHouseName: post.room.boardingHouse?.name,
          boardingHouseId: post.room.boardingHouseId,
        }
        : null,
      address,
      poster: post.postedByUser
        ? {
          id: post.postedByUser.id,
          username: post.postedByUser.username,
          avatarUrl: post.postedByUser.avatarUrl,
        }
        : null,
      viewsCount: post._count?.postReaches ?? 0,
      savedCount: post._count?.savedPosts ?? 0,
    };
  }

  private mapToResponseDto(post: any): PostResponseDto {
    return {
      id: post.id,
      postedBy: post.postedBy,
      roomId: post.roomId,
      title: post.title,
      content: post.content,
      depositAmount: Number(post.depositAmount),
      status: post.status,
      sourceType: post.sourceType,
      postPurchaseId: post.postPurchaseId,
      resultedContractId: post.resultedContractId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      images: (post.postImages || []).map((img: any) => ({
        id: img.id,
        url: img.url,
      })),
      room: post.room
        ? {
          id: post.room.id,
          roomNumber: post.room.roomNumber,
          floor: post.room.floor,
          area: post.room.area ? Number(post.room.area) : undefined,
          roomTypeName: post.room.roomType?.name,
          boardingHouseName: post.room.boardingHouse?.name,
          boardingHouseId: post.room.boardingHouseId,
        }
        : null,
      viewsCount: post._count?.postReaches ?? 0,
    };
  }

  /**
   * UC-PU-04: Platform Deposit — public user places a deposit on a rental listing.
   *
   * Atomically (single transaction):
   *  1. Validates post exists and status === posted
   *  2. If post has a linked room: validates room is available, sets room.status = deposited
   *  3. Creates DEPOSIT row (type=platform, status=pending, recordedManually=false)
   *  4. Hides the post (post.status = hidden) so it no longer appears in browse results
   *
   * No authentication required — tenant is identified only by tenantName + tenantPhone.
   */
  /**
   * UC-PU-04 Step 1-4: Initiate Direct Online Deposit on a Post
   *
   * 1. Identity verification gate: check UserIdentification WHERE userId = current_user.id.
   *    If missing -> throw ForbiddenException({ code: 'IDENTITY_VERIFICATION_REQUIRED', message: '...' })
   * 2. Confirm deposit amount (defaults to Post.depositAmount).
   * 3. Create Deposit(boardingHouseId, roomId, postId, type='platform', amount, status='pending', recordedManually=false).
   * 4. Create Payment(depositId, payerId=userId, type='charge', status='pending', amount, method='banking', qrCodeUrl).
   */
  async createPlatformDeposit(
    userId: string,
    postId: string,
    dto: InitiatePlatformDepositDto,
  ): Promise<PlatformDepositInstructionDto> {
    this.logger.log(
      `UC-PU-04: Initiate platform deposit on post ${postId} by user ${userId}`,
    );

    // 1. Identity Verification Gate (UC-PU-04 Step 1)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userIdentification: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.userIdentification) {
      throw new ForbiddenException({
        code: 'IDENTITY_VERIFICATION_REQUIRED',
        message:
          'Vui lòng hoàn thành xác minh danh tính (CCCD) trước khi thực hiện đặt cọc trực tuyến theo quy định nền tảng (UC-PU-04).',
      });
    }

    // 2. Load post with room + boarding house
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        room: {
          include: {
            boardingHouse: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} was not found`);
    }

    if (post.status !== PostStatus.posted) {
      throw new BadRequestException(
        'Tin đăng này hiện không nhận đặt cọc trực tuyến (đã tạm ẩn hoặc chưa đăng).',
      );
    }

    // Guard: post must have a linked room
    if (!post.roomId || !post.room) {
      throw new BadRequestException(
        'Tin đăng này chưa liên kết với phòng cụ thể nên không hỗ trợ đặt cọc trực tuyến. Vui lòng liên hệ trực tiếp chủ trọ.',
      );
    }

    // Validate room is available
    if (post.room.status !== RoomStatus.available) {
      throw new BadRequestException(
        'Phòng trọ này hiện không còn khả dụng để đặt cọc (đang thuê hoặc đã cọc).',
      );
    }

    // Guard: no active platform deposit already pending or paid for this post or room
    const existingActiveDeposit = await this.prisma.deposit.findFirst({
      where: {
        OR: [{ postId }, { roomId: post.roomId }],
        status: { in: [DepositStatus.pending, DepositStatus.paid] },
      },
    });
    if (existingActiveDeposit) {
      throw new BadRequestException(
        'Phòng này hiện đã có người đặt cọc giữ chỗ đang được xử lý. Vui lòng chọn phòng khác.',
      );
    }

    // Determine deposit amount (default to Post.depositAmount)
    const rawAmount =
      dto.amount !== undefined ? Number(dto.amount) : Number(post.depositAmount);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      throw new BadRequestException('Số tiền đặt cọc giữ chỗ không hợp lệ.');
    }
    const depositAmount = new Prisma.Decimal(rawAmount);

    const tenantName =
      dto.tenantName?.trim() ||
      user.userIdentification.fullName ||
      user.username ||
      'Khách thuê';
    const tenantPhone = dto.tenantPhone?.trim() || user.phoneNumber;

    // Serialize tenant info and optional note into note field
    const notePayload = JSON.stringify({
      tenantName,
      tenantPhone,
      note: dto.note?.trim() ?? null,
    });

    const transactionRef = `TXN-DEP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const bankCode = '970422'; // MBBank partner
    const accountNumber = '0987654321';
    const accountName = 'DORMIO ESCROW VIETNAM';
    const transferContent = transactionRef;
    const qrCodeUrl = `https://api.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${rawAmount}&addInfo=${encodeURIComponent(
      transferContent,
    )}`;

    // Atomic creation of Deposit (pending) + Payment (charge, pending)
    const result = await this.prisma.$transaction(async (tx) => {
      const dep = await tx.deposit.create({
        data: {
          roomId: post.roomId!,
          boardingHouseId: post.room!.boardingHouseId,
          postId: post.id,
          contractId: null,
          type: DepositType.platform,
          amount: depositAmount,
          status: DepositStatus.pending,
          recordedManually: false,
          recordedBy: null,
          note: notePayload,
        },
      });

      const payment = await tx.payment.create({
        data: {
          depositId: dep.id,
          payerId: userId,
          type: PaymentType.charge,
          status: PaymentStatus.pending,
          amount: depositAmount,
          method: PaymentMethod.banking,
          transactionRef,
          receiptNumber: `REC-DEP-${Date.now().toString().slice(-6)}`,
          paidAt: new Date(),
          qrCodeUrl,
        },
      });

      return { dep, payment };
    });

    this.logger.log(
      `UC-PU-04: Created pending deposit ${result.dep.id} and payment ${result.payment.id} for post ${postId}`,
    );

    return {
      depositId: result.dep.id,
      paymentId: result.payment.id,
      postId: post.id,
      roomId: post.roomId,
      amount: rawAmount,
      transactionRef,
      qrCodeUrl,
      bankCode,
      accountNumber,
      accountName,
      transferContent,
      status: 'pending',
      message: 'Lệnh đặt cọc đã được tạo. Vui lòng quét mã VietQR để hoàn tất chuyển khoản.',
    };
  }

  /**
   * UC-PU-04 Step 5-6: Gateway Callback on success (single transaction)
   *
   * 1. Payment.status = 'success'
   * 2. Deposit.status = 'paid'
   * 3. Room.status = 'deposited'
   * 4. AuditLog for PAYMENT & DEPOSIT inside same transaction
   * 5. Outside transaction: Notification to landlord (receiverId = post.postedBy)
   */
  async confirmPlatformDeposit(
    userId: string,
    postId: string,
    dto: ConfirmPlatformDepositDto,
  ): Promise<{ success: boolean; depositId: string; status: string; message: string }> {
    this.logger.log(
      `UC-PU-04: Confirm platform deposit ${dto.depositId} on post ${postId} by user ${userId}`,
    );

    const deposit = await this.prisma.deposit.findFirst({
      where: {
        id: dto.depositId,
        postId,
      },
      include: {
        payment: true,
        room: {
          include: {
            boardingHouse: true,
          },
        },
        post: {
          include: {
            postedByUser: true,
          },
        },
      },
    });

    if (!deposit) {
      throw new NotFoundException(`Khoản đặt cọc không tồn tại hoặc không khớp với tin đăng`);
    }

    // Idempotency: if already paid, return success immediately
    if (deposit.status === DepositStatus.paid) {
      return {
        success: true,
        depositId: deposit.id,
        status: 'paid',
        message: 'Khoản đặt cọc này đã được thanh toán thành công trước đó.',
      };
    }

    if (deposit.status !== DepositStatus.pending) {
      throw new BadRequestException(
        `Không thể xác nhận khoản đặt cọc có trạng thái: ${deposit.status}`,
      );
    }

    if (!deposit.payment) {
      throw new BadRequestException(
        'Không tìm thấy thông tin giao dịch thanh toán của khoản cọc này.',
      );
    }

    const payer = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userIdentification: true },
    });

    // Execute atomic transaction (UC-PU-04 Step 5 + Rule 4 AuditLog)
    await this.prisma.$transaction(async (tx) => {
      // 1. Payment.status = 'success'
      await tx.payment.update({
        where: { id: deposit.payment!.id },
        data: {
          status: PaymentStatus.success,
          paidAt: new Date(),
          transactionRef: dto.transactionRef || deposit.payment!.transactionRef,
        },
      });

      // 2. Deposit.status = 'paid'
      await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: DepositStatus.paid,
        },
      });

      // 3. Room.status = 'deposited'
      await tx.room.update({
        where: { id: deposit.roomId },
        data: {
          status: RoomStatus.deposited,
        },
      });

      // 4. AuditLog for PAYMENT (Rule 4)
      await tx.auditLog.create({
        data: {
          action: AuditLogAction.payment,
          entityType: 'PAYMENT',
          entityId: deposit.payment!.id,
          userId,
          boardingHouseId: deposit.boardingHouseId,
          ipAddress: '127.0.0.1',
          newValue: {
            status: PaymentStatus.success,
            amount: Number(deposit.amount),
            transactionRef: dto.transactionRef || deposit.payment!.transactionRef,
          },
        },
      });

      // 5. AuditLog for DEPOSIT (Rule 4)
      await tx.auditLog.create({
        data: {
          action: AuditLogAction.update,
          entityType: 'DEPOSIT',
          entityId: deposit.id,
          userId,
          boardingHouseId: deposit.boardingHouseId,
          ipAddress: '127.0.0.1',
          newValue: {
            status: DepositStatus.paid,
            amount: Number(deposit.amount),
          },
        },
      });
    });

    // 6. Notify the landlord outside transaction (UC-PU-04 Step 6)
    if (deposit.post?.postedBy) {
      const payerName =
        payer?.userIdentification?.fullName ||
        payer?.username ||
        'Khách thuê';
      const roomNumber = deposit.room?.roomNumber || '';
      const houseName = deposit.room?.boardingHouse?.name || 'Nhà trọ';
      const formattedAmount = Number(deposit.amount).toLocaleString('vi-VN');

      await this.prisma.notification
        .create({
          data: {
            senderId: userId,
            receiverId: deposit.post.postedBy,
            boardingHouseId: deposit.boardingHouseId,
            type: 'deposit_received',
            content: `Khách thuê ${payerName} vừa đặt cọc giữ chỗ phòng ${roomNumber} (${houseName}) với số tiền ${formattedAmount} VND. Bạn có thể tiến hành lập hợp đồng thuê (UC-L-04 Flow A).`,
            isRead: false,
          },
        })
        .catch((err) => {
          this.logger.warn(`Could not dispatch notification to landlord: ${err.message}`);
        });
    }

    this.logger.log(
      `UC-PU-04: Deposit ${deposit.id} marked paid, payment marked success, room marked deposited, landlord notified.`,
    );

    return {
      success: true,
      depositId: deposit.id,
      status: 'paid',
      message: 'Đặt cọc giữ chỗ thành công! Chủ nhà trọ đã được thông báo để tạo hợp đồng.',
    };
  }

  /**
   * UC-PU-03: Save a rental listing for the authenticated user (idempotent).
   */
  async savePost(
    userId: string,
    postId: string,
  ): Promise<{ saved: boolean; savedCount: number }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedException(
        'User account not found or expired. Please log in again.',
      );
    }

    const existing = await this.prisma.savedPost.findFirst({
      where: { postId, savedBy: userId },
    });

    if (!existing) {
      try {
        await this.prisma.savedPost.create({
          data: {
            postId,
            savedBy: userId,
          },
        });
        this.logger.log(`User ${userId} saved post ${postId}`);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2003'
        ) {
          throw new UnauthorizedException(
            'User account not found or expired. Please log in again.',
          );
        }
        throw err;
      }
    }

    const savedCount = await this.prisma.savedPost.count({
      where: { postId },
    });

    return { saved: true, savedCount };
  }

  /**
   * UC-PU-03: Unsave a rental listing for the authenticated user (idempotent).
   */
  async unsavePost(
    userId: string,
    postId: string,
  ): Promise<{ saved: boolean; savedCount: number }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.savedPost.deleteMany({
      where: { postId, savedBy: userId },
    });
    this.logger.log(`User ${userId} unsaved post ${postId}`);

    const savedCount = await this.prisma.savedPost.count({
      where: { postId },
    });

    return { saved: false, savedCount };
  }

  /**
   * UC-PU-03: Toggle save/bookmark for a rental listing.
   */
  async toggleSavePost(
    userId: string,
    postId: string,
  ): Promise<{ saved: boolean; savedCount: number }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedException(
        'User account not found or expired. Please log in again.',
      );
    }

    const existing = await this.prisma.savedPost.findFirst({
      where: { postId, savedBy: userId },
    });

    if (existing) {
      await this.prisma.savedPost.deleteMany({
        where: { postId, savedBy: userId },
      });
      this.logger.log(`User ${userId} toggled post ${postId} -> unsaved`);
      const savedCount = await this.prisma.savedPost.count({
        where: { postId },
      });
      return { saved: false, savedCount };
    } else {
      try {
        await this.prisma.savedPost.create({
          data: {
            postId,
            savedBy: userId,
          },
        });
        this.logger.log(`User ${userId} toggled post ${postId} -> saved`);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2003'
        ) {
          throw new UnauthorizedException(
            'User account not found or expired. Please log in again.',
          );
        }
        throw err;
      }
      const savedCount = await this.prisma.savedPost.count({
        where: { postId },
      });
      return { saved: true, savedCount };
    }
  }

  /**
   * UC-PU-03: Get all saved post IDs for the authenticated user.
   */
  async getSavedPostIds(userId: string): Promise<string[]> {
    const saved = await this.prisma.savedPost.findMany({
      where: { savedBy: userId },
      select: { postId: true },
    });
    return saved.map((s) => s.postId);
  }

  /**
   * UC-PU-03: Retrieve all saved rental listings for the authenticated user.
   */
  async getSavedPosts(userId: string): Promise<PublicPostResponseDto[]> {
    const savedRecords = await this.prisma.savedPost.findMany({
      where: { savedBy: userId },
      include: {
        post: {
          include: {
            postImages: true,
            room: {
              include: {
                roomType: true,
                boardingHouse: true,
              },
            },
            postedByUser: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                postReaches: true,
                savedPosts: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return savedRecords
      .filter((s) => s.post != null)
      .map((s) => this.mapToPublicResponseDto(s.post));
  }

  /**
   * UC-PU-03: Check if a post is saved by the authenticated user.
   */
  async isPostSaved(userId: string, postId: string): Promise<boolean> {
    const count = await this.prisma.savedPost.count({
      where: { postId, savedBy: userId },
    });
    return count > 0;
  }

  /**
   * UC-PU-02: View Poster Profile
   *
   * SPEC RULES:
   * Tier: Free · No auth required
   * Public subset of User: avatarUrl, username, status, createdAt, COUNT(Post WHERE postedBy=user.id).
   * Never expose phoneNumber/email here unless the viewer is authenticated and has an active
   * Conversation with this poster (or is the poster themselves) — enforced explicitly in query/DTO.
   */
  async getPosterProfile(
    posterId: string,
    viewerId: string | null,
  ): Promise<PosterProfileResponseDto> {
    this.logger.log(
      `getPosterProfile called for posterId=${posterId}, viewerId=${viewerId ?? 'anonymous'}`,
    );

    // 1. Fetch poster info
    const poster = await this.prisma.user.findUnique({
      where: { id: posterId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        status: true,
        createdAt: true,
        phoneNumber: true,
        email: true,
      },
    });

    if (!poster) {
      throw new NotFoundException(`Poster with ID ${posterId} not found`);
    }

    // 2. Check if viewer is allowed to see contact info
    let canViewContact = false;
    let hasActiveConversation = false;

    if (viewerId) {
      if (viewerId === posterId) {
        canViewContact = true;
      } else {
        const activeConversation = await this.prisma.conversation.findFirst({
          where: {
            deletedAt: null,
            OR: [
              { user1Id: viewerId, user2Id: posterId },
              { user1Id: posterId, user2Id: viewerId },
            ],
          },
        });
        if (activeConversation) {
          hasActiveConversation = true;
          canViewContact = true;
        }
      }
    }

    // 3. Count public listings
    const postCount = await this.prisma.post.count({
      where: {
        postedBy: posterId,
        status: PostStatus.posted,
      },
    });

    // 4. Fetch active public listings for this poster
    const rawPosts = await this.prisma.post.findMany({
      where: {
        postedBy: posterId,
        status: PostStatus.posted,
      },
      include: {
        postImages: true,
        room: {
          include: {
            roomType: true,
            boardingHouse: true,
          },
        },
        postedByUser: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            postReaches: true,
            savedPosts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeListings = rawPosts.map((post) =>
      this.mapToPublicResponseDto(post),
    );

    // 5. Build DTO with explicit privacy enforcement
    return {
      id: poster.id,
      username: poster.username,
      avatarUrl: poster.avatarUrl,
      bio: poster.bio,
      status: poster.status,
      createdAt: poster.createdAt,
      postCount,
      phoneNumber: canViewContact ? poster.phoneNumber : undefined,
      email: canViewContact ? poster.email : undefined,
      hasActiveConversation,
      activeListings,
    };
  }
}

