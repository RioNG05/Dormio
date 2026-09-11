import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AdminAnalyticsQueryDto,
  TimeBucketPeriod,
  UserAnalyticsResponseDto,
  PropertyAnalyticsResponseDto,
  ListingAnalyticsResponseDto,
  AdminOverviewResponseDto,
  RegionalPropertyBreakdownDto,
} from './dto/admin-analytics.dto';
import {
  RevenuePeriod,
  RevenueQueryDto,
  RevenueResponseDto,
  RevenueTimelineItemDto,
} from './dto/revenue-analytics.dto';
import {
  UserRole,
  UserStatus,
  BoardingHouseStatus,
  RoomStatus,
  PostStatus,
  SourceType,
  PaymentType,
  PaymentStatus,
  SubscriptionPackage,
  BillingCycle,
} from '@prisma';

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── UC-A-01: USERS ANALYTICS ──────────────────────────────────────────────

  async getUserAnalytics(
    query: AdminAnalyticsQueryDto,
  ): Promise<UserAnalyticsResponseDto> {
    this.logger.log(`Fetching user analytics: period=${query.period}, year=${query.year}`);

    const period = query.period || TimeBucketPeriod.MONTH;
    const year = query.year || new Date().getFullYear();
    const { startDate, endDate, prevStartDate, prevEndDate } = this.resolveDateRanges(
      period,
      year,
      query.startDate,
      query.endDate,
    );

    // 1. Total counts & Role/Status breakdowns
    const [totalUsers, usersByRole, usersByStatus, currentPeriodUsers, prevPeriodUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
        this.prisma.user.groupBy({
          by: ['status'],
          _count: true,
        }),
        this.prisma.user.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.user.count({
          where: {
            createdAt: { gte: prevStartDate, lte: prevEndDate },
          },
        }),
      ]);

    const roleMap = {
      tenant: 0,
      landlord: 0,
      employee: 0,
      leasing_agent: 0,
      admin: 0,
    };
    usersByRole.forEach((item) => {
      if (item.role in roleMap) {
        roleMap[item.role as keyof typeof roleMap] = item._count;
      }
    });

    const statusMap = {
      active: 0,
      inactive: 0,
      banned: 0,
    };
    usersByStatus.forEach((item) => {
      if (item.status in statusMap) {
        statusMap[item.status as keyof typeof statusMap] = item._count;
      }
    });

    const growthRate = this.calculateGrowthRate(currentPeriodUsers, prevPeriodUsers);

    // 2. Timeline records
    const usersInWindow = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const timeline = this.buildUserTimeline(period, year, startDate, endDate, usersInWindow);

    return {
      summary: {
        totalUsers,
        newUsersCurrentPeriod: currentPeriodUsers,
        newUsersPreviousPeriod: prevPeriodUsers,
        growthRate,
        byRole: roleMap,
        byStatus: statusMap,
      },
      timeline,
    };
  }

  // ─── UC-A-02: PROPERTIES & ROOMS ANALYTICS ─────────────────────────────────

  async getPropertyAnalytics(
    query: AdminAnalyticsQueryDto,
  ): Promise<PropertyAnalyticsResponseDto> {
    this.logger.log(`Fetching property analytics: period=${query.period}, year=${query.year}`);

    const period = query.period || TimeBucketPeriod.MONTH;
    const year = query.year || new Date().getFullYear();
    const { startDate, endDate, prevStartDate, prevEndDate } = this.resolveDateRanges(
      period,
      year,
      query.startDate,
      query.endDate,
    );

    const [
      totalHouses,
      housesByStatusGroup,
      totalRooms,
      roomsByStatusGroup,
      currentHouses,
      prevHouses,
      allHousesWithRooms,
      housesInWindow,
    ] = await Promise.all([
      this.prisma.boardingHouse.count(),
      this.prisma.boardingHouse.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.room.count(),
      this.prisma.room.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.boardingHouse.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.boardingHouse.count({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      this.prisma.boardingHouse.findMany({
        select: {
          id: true,
          city: true,
          province: true,
          rooms: {
            select: { id: true, status: true },
          },
        },
      }),
      this.prisma.boardingHouse.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const housesStatusMap = {
      active: 0,
      inactive: 0,
      banned: 0,
    };
    housesByStatusGroup.forEach((h) => {
      if (h.status in housesStatusMap) {
        housesStatusMap[h.status as keyof typeof housesStatusMap] = h._count;
      }
    });

    const roomsStatusMap = {
      available: 0,
      deposited: 0,
      occupied: 0,
      maintainace: 0,
    };
    roomsByStatusGroup.forEach((r) => {
      if (r.status in roomsStatusMap) {
        roomsStatusMap[r.status as keyof typeof roomsStatusMap] = r._count;
      }
    });

    const occupiedRooms = roomsStatusMap.occupied + roomsStatusMap.deposited;
    const occupancyRate =
      totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0;
    const growthRate = this.calculateGrowthRate(currentHouses, prevHouses);

    // Regional aggregation
    const regionAgg: Record<
      string,
      { houses: number; rooms: number; occupiedRooms: number }
    > = {};

    for (const h of allHousesWithRooms) {
      const regionName = h.province?.trim() || h.city?.trim() || 'Khác';
      if (!regionAgg[regionName]) {
        regionAgg[regionName] = { houses: 0, rooms: 0, occupiedRooms: 0 };
      }
      regionAgg[regionName].houses += 1;
      regionAgg[regionName].rooms += h.rooms.length;
      regionAgg[regionName].occupiedRooms += h.rooms.filter(
        (r) => r.status === RoomStatus.occupied || r.status === RoomStatus.deposited,
      ).length;
    }

    const regions: RegionalPropertyBreakdownDto[] = Object.entries(regionAgg)
      .map(([name, data]) => {
        const occRate =
          data.rooms > 0 ? Number(((data.occupiedRooms / data.rooms) * 100).toFixed(1)) : 0;
        const sharePct =
          totalRooms > 0 ? `${Math.round((data.rooms / totalRooms) * 100)}%` : '0%';
        return {
          name,
          houses: data.houses,
          rooms: data.rooms,
          occupancyRate: occRate,
          share: sharePct,
        };
      })
      .sort((a, b) => b.rooms - a.rooms)
      .slice(0, 10);

    const timeline = this.buildGenericTimeline(
      period,
      year,
      startDate,
      endDate,
      housesInWindow.map((h) => h.createdAt),
    );

    return {
      summary: {
        totalHouses,
        newHousesCurrentPeriod: currentHouses,
        newHousesPreviousPeriod: prevHouses,
        growthRate,
        totalRooms,
        occupancyRate,
        housesByStatus: housesStatusMap,
        roomsByStatus: roomsStatusMap,
        regions,
      },
      timeline,
    };
  }

  // ─── UC-A-03: LISTINGS (BHRP) ANALYTICS ────────────────────────────────────

  async getListingAnalytics(
    query: AdminAnalyticsQueryDto,
  ): Promise<ListingAnalyticsResponseDto> {
    this.logger.log(`Fetching listing analytics: period=${query.period}, year=${query.year}`);

    const period = query.period || TimeBucketPeriod.MONTH;
    const year = query.year || new Date().getFullYear();
    const { startDate, endDate, prevStartDate, prevEndDate } = this.resolveDateRanges(
      period,
      year,
      query.startDate,
      query.endDate,
    );

    const [
      totalPosts,
      postsByStatusGroup,
      postsBySourceGroup,
      currentPosts,
      prevPosts,
      totalViews,
      totalSaved,
      postsInWindow,
    ] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.post.groupBy({
        by: ['sourceType'],
        _count: true,
      }),
      this.prisma.post.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.post.count({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      this.prisma.postReach.count(),
      this.prisma.savedPost.count(),
      this.prisma.post.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const statusMap = {
      posted: 0,
      draft: 0,
      hidden: 0,
    };
    postsByStatusGroup.forEach((p) => {
      if (p.status in statusMap) {
        statusMap[p.status as keyof typeof statusMap] = p._count;
      }
    });

    const sourceMap = {
      free_quote: 0,
      purchased: 0,
    };
    postsBySourceGroup.forEach((p) => {
      if (p.sourceType in sourceMap) {
        sourceMap[p.sourceType as keyof typeof sourceMap] = p._count;
      }
    });

    const growthRate = this.calculateGrowthRate(currentPosts, prevPosts);
    const averageViewsPerPost =
      totalPosts > 0 ? Number((totalViews / totalPosts).toFixed(1)) : 0;

    const timeline = this.buildGenericTimeline(
      period,
      year,
      startDate,
      endDate,
      postsInWindow.map((p) => p.createdAt),
    );

    return {
      summary: {
        totalPosts,
        newPostsCurrentPeriod: currentPosts,
        newPostsPreviousPeriod: prevPosts,
        growthRate,
        totalViews,
        totalSaved,
        averageViewsPerPost,
        byStatus: statusMap,
        bySourceType: sourceMap,
      },
      timeline,
    };
  }

  // ─── UC-A-06: PLATFORM REVENUE DASHBOARD ───────────────────────────────────

  async getRevenueAnalytics(query: RevenueQueryDto): Promise<RevenueResponseDto> {
    this.logger.log(`Fetching platform revenue analytics: period=${query.period}, year=${query.year}`);

    const period = query.period || RevenuePeriod.MONTH;
    const year = query.year || new Date().getFullYear();

    const { startDate, endDate, prevStartDate, prevEndDate } = this.resolveRevenueRanges(
      period,
      year,
      query.startDate,
      query.endDate,
    );

    // Fetch platform payments in current and previous periods
    const [currentPayments, prevPayments, postPurchasesInPeriod] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.success,
          paidAt: { gte: startDate, lte: endDate },
          OR: [
            { subscriptionId: { not: null } },
            { postPurchaseId: { not: null } },
          ],
        },
        include: {
          subscription: true,
          postPurchase: true,
        },
      }),
      this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.success,
          paidAt: { gte: prevStartDate, lte: prevEndDate },
          OR: [
            { subscriptionId: { not: null } },
            { postPurchaseId: { not: null } },
          ],
        },
      }),
      this.prisma.postPurchase.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'paid',
        },
        select: {
          quantityPurchase: true,
          totalAmount: true,
        },
      }),
    ]);

    // Current period aggregations
    let totalGrossRevenue = 0;
    let totalRefunds = 0;
    let subPlusTotal = 0;
    let subProTotal = 0;
    let subMonthlyTotal = 0;
    let subYearlyTotal = 0;
    let postPurchaseTotal = 0;
    let postPurchaseCount = 0;

    for (const p of currentPayments) {
      const amount = Number(p.amount);
      if (p.type === PaymentType.charge) {
        totalGrossRevenue += amount;

        if (p.subscriptionId && p.subscription) {
          if (p.subscription.planName === SubscriptionPackage.plus) {
            subPlusTotal += amount;
          } else if (p.subscription.planName === SubscriptionPackage.pro) {
            subProTotal += amount;
          }

          if (p.subscription.billingCycle === BillingCycle.monthly) {
            subMonthlyTotal += amount;
          } else if (p.subscription.billingCycle === BillingCycle.yearly) {
            subYearlyTotal += amount;
          }
        } else if (p.postPurchaseId) {
          postPurchaseTotal += amount;
          postPurchaseCount += 1;
        }
      } else if (p.type === PaymentType.refund) {
        totalRefunds += amount;
      }
    }

    const netTotalRevenue = Math.max(0, totalGrossRevenue - totalRefunds);
    const subTotalRevenue = subPlusTotal + subProTotal;

    // Previous period revenue
    let prevGross = 0;
    let prevRefund = 0;
    for (const p of prevPayments) {
      const amt = Number(p.amount);
      if (p.type === PaymentType.charge) {
        prevGross += amt;
      } else if (p.type === PaymentType.refund) {
        prevRefund += amt;
      }
    }
    const prevPeriodRevenue = Math.max(0, prevGross - prevRefund);
    const revenueGrowthRate = this.calculateGrowthRate(netTotalRevenue, prevPeriodRevenue);

    // Percentages
    const subPercentage =
      netTotalRevenue > 0
        ? Number(((subTotalRevenue / netTotalRevenue) * 100).toFixed(1))
        : 0;
    const postPercentage =
      netTotalRevenue > 0
        ? Number(((postPurchaseTotal / netTotalRevenue) * 100).toFixed(1))
        : 0;

    const totalCreditsSold = postPurchasesInPeriod.reduce(
      (sum, item) => sum + item.quantityPurchase,
      0,
    );
    const averageOrderValue =
      postPurchaseCount > 0 ? Math.round(postPurchaseTotal / postPurchaseCount) : 0;

    // Timeline breakdown
    const timeline = this.buildRevenueTimeline(
      period,
      year,
      startDate,
      endDate,
      currentPayments,
    );

    return {
      summary: {
        totalRevenue: netTotalRevenue,
        previousPeriodRevenue: prevPeriodRevenue,
        revenueGrowthRate,
        subscriptionRevenue: {
          total: subTotalRevenue,
          percentage: subPercentage,
          byPlan: {
            plus: subPlusTotal,
            pro: subProTotal,
          },
          byCycle: {
            monthly: subMonthlyTotal,
            yearly: subYearlyTotal,
          },
        },
        postPurchaseRevenue: {
          total: postPurchaseTotal,
          percentage: postPercentage,
          totalCreditsSold,
          totalTransactions: postPurchaseCount,
          averageOrderValue,
        },
      },
      timeline,
    };
  }

  // ─── ADMIN OVERVIEW SNAPSHOT ───────────────────────────────────────────────

  async getAdminOverview(): Promise<AdminOverviewResponseDto> {
    this.logger.log('Fetching admin dashboard unified overview snapshot');

    const currentYear = new Date().getFullYear();
    const userAnalytics = await this.getUserAnalytics({
      period: TimeBucketPeriod.MONTH,
      year: currentYear,
    });
    const propertyAnalytics = await this.getPropertyAnalytics({
      period: TimeBucketPeriod.MONTH,
      year: currentYear,
    });
    const revenueAnalytics = await this.getRevenueAnalytics({
      period: RevenuePeriod.MONTH,
      year: currentYear,
    });

    const [pendingGrievancesCount, urgentGrievancesCount, reportedItemsCount] =
      await Promise.all([
        this.prisma.grievance.count({
          where: { status: 'pending' },
        }),
        this.prisma.grievance.count({
          where: { status: 'pending', priority: 'high' },
        }),
        this.prisma.post.count({
          where: { status: PostStatus.hidden },
        }),
      ]);

    return {
      totalUsers: userAnalytics.summary.totalUsers,
      userGrowthRate: userAnalytics.summary.growthRate,
      userRoles: userAnalytics.summary.byRole,
      totalHouses: propertyAnalytics.summary.totalHouses,
      totalRooms: propertyAnalytics.summary.totalRooms,
      occupancyRate: propertyAnalytics.summary.occupancyRate,
      propertyGrowthRate: propertyAnalytics.summary.growthRate,
      platformRevenue: revenueAnalytics.summary.totalRevenue,
      revenueGrowthRate: revenueAnalytics.summary.revenueGrowthRate,
      pendingGrievancesCount,
      urgentGrievancesCount,
      reportedItemsCount,
    };
  }

  // ─── HELPER METHODS ────────────────────────────────────────────────────────

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100.0 : 0.0;
    }
    const diff = current - previous;
    return Number(((diff / previous) * 100).toFixed(1));
  }

  private resolveDateRanges(
    period: TimeBucketPeriod,
    year: number,
    customStart?: string,
    customEnd?: string,
  ) {
    if (customStart && customEnd) {
      const startDate = new Date(customStart);
      const endDate = new Date(customEnd);
      const duration = endDate.getTime() - startDate.getTime();
      const prevStartDate = new Date(startDate.getTime() - duration);
      const prevEndDate = new Date(startDate.getTime());
      return { startDate, endDate, prevStartDate, prevEndDate };
    }

    if (period === TimeBucketPeriod.WEEK) {
      // Last 12 weeks
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 84); // 12 weeks
      const prevEndDate = new Date(startDate);
      const prevStartDate = new Date();
      prevStartDate.setDate(prevEndDate.getDate() - 84);
      return { startDate, endDate, prevStartDate, prevEndDate };
    }

    if (period === TimeBucketPeriod.YEAR) {
      // 5 years window
      const startDate = new Date(`${year - 4}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      const prevStartDate = new Date(`${year - 9}-01-01T00:00:00.000Z`);
      const prevEndDate = new Date(`${year - 5}-12-31T23:59:59.999Z`);
      return { startDate, endDate, prevStartDate, prevEndDate };
    }

    // Default: full calendar year
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    const prevStartDate = new Date(`${year - 1}-01-01T00:00:00.000Z`);
    const prevEndDate = new Date(`${year - 1}-12-31T23:59:59.999Z`);
    return { startDate, endDate, prevStartDate, prevEndDate };
  }

  private resolveRevenueRanges(
    period: RevenuePeriod,
    year: number,
    customStart?: string,
    customEnd?: string,
  ) {
    if (customStart && customEnd) {
      const startDate = new Date(customStart);
      const endDate = new Date(customEnd);
      const duration = endDate.getTime() - startDate.getTime();
      const prevStartDate = new Date(startDate.getTime() - duration);
      const prevEndDate = new Date(startDate.getTime());
      return { startDate, endDate, prevStartDate, prevEndDate };
    }

    if (period === RevenuePeriod.YEAR) {
      const startDate = new Date(`${year - 4}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      const prevStartDate = new Date(`${year - 9}-01-01T00:00:00.000Z`);
      const prevEndDate = new Date(`${year - 5}-12-31T23:59:59.999Z`);
      return { startDate, endDate, prevStartDate, prevEndDate };
    }

    // Default month or quarter for given year
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    const prevStartDate = new Date(`${year - 1}-01-01T00:00:00.000Z`);
    const prevEndDate = new Date(`${year - 1}-12-31T23:59:59.999Z`);
    return { startDate, endDate, prevStartDate, prevEndDate };
  }

  private buildUserTimeline(
    period: TimeBucketPeriod,
    year: number,
    startDate: Date,
    endDate: Date,
    users: { id: string; role: UserRole; createdAt: Date }[],
  ) {
    if (period === TimeBucketPeriod.MONTH) {
      const buckets = Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        const bucketDate = new Date(Date.UTC(year, i, 1));
        const label = `T${monthNum}`;
        return {
          bucket: bucketDate.toISOString(),
          label,
          count: 0,
          byRole: {
            tenant: 0,
            landlord: 0,
            employee: 0,
            leasing_agent: 0,
            admin: 0,
          },
        };
      });

      for (const u of users) {
        const m = u.createdAt.getUTCMonth();
        if (m >= 0 && m < 12) {
          buckets[m].count += 1;
          if (u.role in buckets[m].byRole) {
            buckets[m].byRole[u.role as keyof (typeof buckets)[0]['byRole']] += 1;
          }
        }
      }
      return buckets;
    }

    // Generic week or year grouping
    return this.buildGenericTimeline(
      period,
      year,
      startDate,
      endDate,
      users.map((u) => u.createdAt),
    ).map((b) => ({
      ...b,
      byRole: {
        tenant: 0,
        landlord: 0,
        employee: 0,
        leasing_agent: 0,
        admin: 0,
      },
    }));
  }

  private buildGenericTimeline(
    period: TimeBucketPeriod,
    year: number,
    startDate: Date,
    endDate: Date,
    dates: Date[],
  ) {
    if (period === TimeBucketPeriod.MONTH) {
      const buckets = Array.from({ length: 12 }, (_, i) => ({
        bucket: new Date(Date.UTC(year, i, 1)).toISOString(),
        label: `T${i + 1}`,
        count: 0,
      }));

      for (const d of dates) {
        const m = d.getUTCMonth();
        if (m >= 0 && m < 12) {
          buckets[m].count += 1;
        }
      }
      return buckets;
    }

    if (period === TimeBucketPeriod.WEEK) {
      // 12 weeks
      const buckets = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i * 7);
        return {
          bucket: d.toISOString(),
          label: `W${i + 1}`,
          count: 0,
        };
      });

      for (const d of dates) {
        const diffDays = Math.floor(
          (d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const wIdx = Math.floor(diffDays / 7);
        if (wIdx >= 0 && wIdx < 12) {
          buckets[wIdx].count += 1;
        }
      }
      return buckets;
    }

    // YEAR: 5 years
    const buckets = Array.from({ length: 5 }, (_, i) => {
      const y = year - 4 + i;
      return {
        bucket: new Date(Date.UTC(y, 0, 1)).toISOString(),
        label: `${y}`,
        count: 0,
      };
    });

    for (const d of dates) {
      const y = d.getUTCFullYear();
      const idx = y - (year - 4);
      if (idx >= 0 && idx < 5) {
        buckets[idx].count += 1;
      }
    }
    return buckets;
  }

  private buildRevenueTimeline(
    period: RevenuePeriod,
    year: number,
    startDate: Date,
    endDate: Date,
    payments: any[],
  ): RevenueTimelineItemDto[] {
    if (period === RevenuePeriod.QUARTER) {
      const quarters: RevenueTimelineItemDto[] = [
        {
          bucket: new Date(Date.UTC(year, 0, 1)).toISOString(),
          label: 'Q1',
          totalRevenue: 0,
          subscriptionPlus: 0,
          subscriptionPro: 0,
          postPurchase: 0,
        },
        {
          bucket: new Date(Date.UTC(year, 3, 1)).toISOString(),
          label: 'Q2',
          totalRevenue: 0,
          subscriptionPlus: 0,
          subscriptionPro: 0,
          postPurchase: 0,
        },
        {
          bucket: new Date(Date.UTC(year, 6, 1)).toISOString(),
          label: 'Q3',
          totalRevenue: 0,
          subscriptionPlus: 0,
          subscriptionPro: 0,
          postPurchase: 0,
        },
        {
          bucket: new Date(Date.UTC(year, 9, 1)).toISOString(),
          label: 'Q4',
          totalRevenue: 0,
          subscriptionPlus: 0,
          subscriptionPro: 0,
          postPurchase: 0,
        },
      ];

      for (const p of payments) {
        const m = p.paidAt.getUTCMonth();
        const qIdx = Math.floor(m / 3);
        const amt = Number(p.amount);
        if (qIdx >= 0 && qIdx < 4) {
          if (p.type === PaymentType.charge) {
            quarters[qIdx].totalRevenue += amt;
            if (p.subscription?.planName === SubscriptionPackage.plus) {
              quarters[qIdx].subscriptionPlus += amt;
            } else if (p.subscription?.planName === SubscriptionPackage.pro) {
              quarters[qIdx].subscriptionPro += amt;
            } else if (p.postPurchaseId) {
              quarters[qIdx].postPurchase += amt;
            }
          } else if (p.type === PaymentType.refund) {
            quarters[qIdx].totalRevenue = Math.max(0, quarters[qIdx].totalRevenue - amt);
          }
        }
      }
      return quarters;
    }

    if (period === RevenuePeriod.YEAR) {
      const years: RevenueTimelineItemDto[] = Array.from({ length: 5 }, (_, i) => {
        const y = year - 4 + i;
        return {
          bucket: new Date(Date.UTC(y, 0, 1)).toISOString(),
          label: `${y}`,
          totalRevenue: 0,
          subscriptionPlus: 0,
          subscriptionPro: 0,
          postPurchase: 0,
        };
      });

      for (const p of payments) {
        const y = p.paidAt.getUTCFullYear();
        const idx = y - (year - 4);
        const amt = Number(p.amount);
        if (idx >= 0 && idx < 5) {
          if (p.type === PaymentType.charge) {
            years[idx].totalRevenue += amt;
            if (p.subscription?.planName === SubscriptionPackage.plus) {
              years[idx].subscriptionPlus += amt;
            } else if (p.subscription?.planName === SubscriptionPackage.pro) {
              years[idx].subscriptionPro += amt;
            } else if (p.postPurchaseId) {
              years[idx].postPurchase += amt;
            }
          } else if (p.type === PaymentType.refund) {
            years[idx].totalRevenue = Math.max(0, years[idx].totalRevenue - amt);
          }
        }
      }
      return years;
    }

    // Default: MONTH (12 months)
    const months: RevenueTimelineItemDto[] = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      return {
        bucket: new Date(Date.UTC(year, i, 1)).toISOString(),
        label: `T${monthNum}`,
        totalRevenue: 0,
        subscriptionPlus: 0,
        subscriptionPro: 0,
        postPurchase: 0,
      };
    });

    for (const p of payments) {
      const m = p.paidAt.getUTCMonth();
      const amt = Number(p.amount);
      if (m >= 0 && m < 12) {
        if (p.type === PaymentType.charge) {
          months[m].totalRevenue += amt;
          if (p.subscription?.planName === SubscriptionPackage.plus) {
            months[m].subscriptionPlus += amt;
          } else if (p.subscription?.planName === SubscriptionPackage.pro) {
            months[m].subscriptionPro += amt;
          } else if (p.postPurchaseId) {
            months[m].postPurchase += amt;
          }
        } else if (p.type === PaymentType.refund) {
          months[m].totalRevenue = Math.max(0, months[m].totalRevenue - amt);
        }
      }
    }
    return months;
  }
}
