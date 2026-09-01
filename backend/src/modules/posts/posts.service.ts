import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import {
  PaginatedPostsResponseDto,
  PostQuotaDto,
  PostResponseDto,
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
  SubscriptionPackage,
  SubscriptionStatus,
  Prisma,
} from '@prisma';

export const BASE_DAILY_FREE_POST_QUOTA = 3;

export interface QuotaAllocation {
  sourceType: SourceType;
  postPurchaseId: string | null;
}

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
  ): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Listing with ID ${postId} was not found`);
    }

    if (post.postedBy !== userId) {
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
}
