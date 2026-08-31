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
  PostStatus,
  SourceType,
  PostPurchaseStatus,
  SubscriptionPackage,
  SubscriptionStatus,
  Prisma,
} from '@prisma';

export interface QuotaAllocation {
  sourceType: SourceType;
  postPurchaseId: string | null;
}

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * UC-P-01 Quota Check
   *
   * 1. Count free posts created today by user (source_type = 'free_quote').
   * 2. Find user's active subscription daily quota (defaults to 'free' plan if no active subscription).
   * 3. If used < quota: allowed as free_quote.
   * 4. Else: check PostPurchase for buyerId with status = 'paid' and COUNT(posts) < quantityPurchase, FIFO by activatedAt.
   * 5. If neither: throws ForbiddenException.
   */
  async checkQuota(userId: string): Promise<QuotaAllocation> {
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

    // b) Plan daily quota
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

    let dailyQuota = 1;
    if (activeSub?.subscriptionPlan) {
      dailyQuota = activeSub.subscriptionPlan.dailyPostQuote;
    } else {
      const freePlan = await this.prisma.subscriptionPlan.findUnique({
        where: {
          planName: SubscriptionPackage.free,
        },
      });
      if (freePlan) {
        dailyQuota = freePlan.dailyPostQuote;
      }
    }

    if (freePostsUsedToday < dailyQuota) {
      this.logger.debug(
        `User ${userId} using free quota (${freePostsUsedToday + 1}/${dailyQuota})`,
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
      `User ${userId} rejected: posting quota exhausted (free: ${freePostsUsedToday}/${dailyQuota}, purchased: 0)`,
    );
    throw new ForbiddenException(
      'Hết lượt đăng tin trong ngày. Vui lòng nâng cấp gói thành viên hoặc mua thêm lượt đăng tin.',
    );
  }

  /**
   * Retrieves quota statistics for the authenticated poster.
   */
  async getQuotaStatus(userId: string): Promise<PostQuotaDto> {
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

    let planName = 'free';
    let dailyPostQuota = 1;

    if (activeSub?.subscriptionPlan) {
      planName = activeSub.planName;
      dailyPostQuota = activeSub.subscriptionPlan.dailyPostQuote;
    } else {
      const freePlan = await this.prisma.subscriptionPlan.findUnique({
        where: {
          planName: SubscriptionPackage.free,
        },
      });
      if (freePlan) {
        dailyPostQuota = freePlan.dailyPostQuote;
      }
    }

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
      planName,
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

    // 1. Quota Check
    const quota = await this.checkQuota(userId);

    // 2. Validate Room ownership if roomId is provided
    if (dto.roomId) {
      const room = await this.prisma.room.findUnique({
        where: { id: dto.roomId },
        include: {
          boardingHouse: true,
        },
      });

      if (!room) {
        throw new NotFoundException(`Phòng với ID ${dto.roomId} không tồn tại`);
      }

      if (room.boardingHouse.ownerId !== userId) {
        throw new ForbiddenException(
          'Bạn không có quyền đăng tin cho phòng không thuộc quyền sở hữu của bạn',
        );
      }
    }

    // 3. Database Insertion in transaction
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
      throw new NotFoundException(`Tin đăng với ID ${postId} không tồn tại`);
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
      throw new NotFoundException(`Tin đăng với ID ${postId} không tồn tại`);
    }

    if (post.postedBy !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền thay đổi trạng thái của tin đăng này',
      );
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { status },
    });

    return this.getPostById(userId, postId);
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
