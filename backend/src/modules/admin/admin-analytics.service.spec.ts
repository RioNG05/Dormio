import { Test, TestingModule } from '@nestjs/testing';
import { AdminAnalyticsService } from './admin-analytics.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TimeBucketPeriod } from './dto/admin-analytics.dto';
import { RevenuePeriod } from './dto/revenue-analytics.dto';
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

describe('AdminAnalyticsService', () => {
  let service: AdminAnalyticsService;
  let prisma: any;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    boardingHouse: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    room: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    post: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    postReach: {
      count: jest.fn(),
    },
    savedPost: {
      count: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
    postPurchase: {
      findMany: jest.fn(),
    },
    grievance: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminAnalyticsService>(AdminAnalyticsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('getUserAnalytics (UC-A-01)', () => {
    it('should aggregate user counts, roles, statuses and timeline', async () => {
      prisma.user.count
        .mockResolvedValueOnce(12480) // totalUsers
        .mockResolvedValueOnce(1860) // current period
        .mockResolvedValueOnce(1500); // prev period

      prisma.user.groupBy
        .mockResolvedValueOnce([
          { role: UserRole.tenant, _count: 8000 },
          { role: UserRole.landlord, _count: 3000 },
          { role: UserRole.employee, _count: 1000 },
          { role: UserRole.leasing_agent, _count: 400 },
          { role: UserRole.admin, _count: 80 },
        ])
        .mockResolvedValueOnce([
          { status: UserStatus.active, _count: 12000 },
          { status: UserStatus.inactive, _count: 400 },
          { status: UserStatus.banned, _count: 80 },
        ]);

      prisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          role: UserRole.tenant,
          createdAt: new Date('2026-01-15T10:00:00.000Z'),
        },
        {
          id: 'u2',
          role: UserRole.landlord,
          createdAt: new Date('2026-02-20T12:00:00.000Z'),
        },
      ]);

      const result = await service.getUserAnalytics({
        period: TimeBucketPeriod.MONTH,
        year: 2026,
      });

      expect(result.summary.totalUsers).toBe(12480);
      expect(result.summary.newUsersCurrentPeriod).toBe(1860);
      expect(result.summary.newUsersPreviousPeriod).toBe(1500);
      expect(result.summary.growthRate).toBe(24.0);
      expect(result.summary.byRole.tenant).toBe(8000);
      expect(result.summary.byRole.landlord).toBe(3000);
      expect(result.summary.byStatus.active).toBe(12000);
      expect(result.timeline).toHaveLength(12);
      expect(result.timeline[0].count).toBe(1); // Jan
      expect(result.timeline[1].count).toBe(1); // Feb
    });

    it('should handle zero previous period registrations gracefully', async () => {
      prisma.user.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(0);

      prisma.user.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.getUserAnalytics({
        period: TimeBucketPeriod.MONTH,
        year: 2026,
      });

      expect(result.summary.growthRate).toBe(100.0);
    });
  });

  describe('getPropertyAnalytics (UC-A-02)', () => {
    it('should aggregate houses, rooms, occupancy rate, and regional share', async () => {
      prisma.boardingHouse.count
        .mockResolvedValueOnce(10) // totalHouses
        .mockResolvedValueOnce(2) // current
        .mockResolvedValueOnce(1); // prev

      prisma.boardingHouse.groupBy.mockResolvedValue([
        { status: BoardingHouseStatus.active, _count: 10 },
      ]);

      prisma.room.count.mockResolvedValue(100);
      prisma.room.groupBy.mockResolvedValue([
        { status: RoomStatus.occupied, _count: 80 },
        { status: RoomStatus.deposited, _count: 5 },
        { status: RoomStatus.available, _count: 10 },
        { status: RoomStatus.maintainace, _count: 5 },
      ]);

      prisma.boardingHouse.findMany
        .mockResolvedValueOnce([
          {
            id: 'bh-1',
            city: 'TP. Hồ Chí Minh',
            province: 'TP. Hồ Chí Minh',
            rooms: [
              { id: 'r1', status: RoomStatus.occupied },
              { id: 'r2', status: RoomStatus.available },
            ],
          },
        ])
        .mockResolvedValueOnce([
          { id: 'bh-1', createdAt: new Date('2026-03-01T00:00:00.000Z') },
        ]);

      const result = await service.getPropertyAnalytics({
        period: TimeBucketPeriod.MONTH,
        year: 2026,
      });

      expect(result.summary.totalHouses).toBe(10);
      expect(result.summary.totalRooms).toBe(100);
      expect(result.summary.occupancyRate).toBe(85.0); // (80 + 5) / 100 * 100
      expect(result.summary.regions).toHaveLength(1);
      expect(result.summary.regions[0].name).toBe('TP. Hồ Chí Minh');
      expect(result.summary.regions[0].houses).toBe(1);
      expect(result.summary.regions[0].rooms).toBe(2);
      expect(result.summary.regions[0].occupancyRate).toBe(50.0);
    });
  });

  describe('getListingAnalytics (UC-A-03)', () => {
    it('should aggregate post statuses, source quotas, reach and bookmarks', async () => {
      prisma.post.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(30);

      prisma.post.groupBy
        .mockResolvedValueOnce([
          { status: PostStatus.posted, _count: 180 },
          { status: PostStatus.draft, _count: 15 },
          { status: PostStatus.hidden, _count: 5 },
        ])
        .mockResolvedValueOnce([
          { sourceType: SourceType.free_quote, _count: 150 },
          { sourceType: SourceType.purchased, _count: 50 },
        ]);

      prisma.postReach.count.mockResolvedValue(5000);
      prisma.savedPost.count.mockResolvedValue(350);
      prisma.post.findMany.mockResolvedValue([
        { id: 'p1', createdAt: new Date('2026-01-10T00:00:00.000Z') },
      ]);

      const result = await service.getListingAnalytics({
        period: TimeBucketPeriod.MONTH,
        year: 2026,
      });

      expect(result.summary.totalPosts).toBe(200);
      expect(result.summary.byStatus.posted).toBe(180);
      expect(result.summary.bySourceType.purchased).toBe(50);
      expect(result.summary.totalViews).toBe(5000);
      expect(result.summary.totalSaved).toBe(350);
      expect(result.summary.averageViewsPerPost).toBe(25.0);
    });
  });

  describe('getRevenueAnalytics (UC-A-06)', () => {
    it('should correctly calculate gross, refunds, net revenue, subscriptions and post purchases', async () => {
      const mockPaymentsCurrent = [
        // Plus Monthly subscription charge
        {
          id: 'pay-1',
          type: PaymentType.charge,
          amount: '199000',
          subscriptionId: 'sub-1',
          postPurchaseId: null,
          paidAt: new Date('2026-01-10T10:00:00.000Z'),
          subscription: {
            planName: SubscriptionPackage.plus,
            billingCycle: BillingCycle.monthly,
          },
          postPurchase: null,
        },
        // Pro Yearly subscription charge
        {
          id: 'pay-2',
          type: PaymentType.charge,
          amount: '3990000',
          subscriptionId: 'sub-2',
          postPurchaseId: null,
          paidAt: new Date('2026-01-15T10:00:00.000Z'),
          subscription: {
            planName: SubscriptionPackage.pro,
            billingCycle: BillingCycle.yearly,
          },
          postPurchase: null,
        },
        // Post credit purchase charge
        {
          id: 'pay-3',
          type: PaymentType.charge,
          amount: '300000',
          subscriptionId: null,
          postPurchaseId: 'post-pur-1',
          paidAt: new Date('2026-02-05T10:00:00.000Z'),
          subscription: null,
          postPurchase: { id: 'post-pur-1' },
        },
        // Refund
        {
          id: 'pay-4',
          type: PaymentType.refund,
          amount: '199000',
          subscriptionId: null,
          postPurchaseId: null,
          paidAt: new Date('2026-02-10T10:00:00.000Z'),
          subscription: null,
          postPurchase: null,
        },
      ];

      const mockPaymentsPrev = [
        {
          id: 'pay-prev-1',
          type: PaymentType.charge,
          amount: '2000000',
        },
      ];

      prisma.payment.findMany
        .mockResolvedValueOnce(mockPaymentsCurrent)
        .mockResolvedValueOnce(mockPaymentsPrev);

      prisma.postPurchase.findMany.mockResolvedValue([
        { quantityPurchase: 10, totalAmount: '300000' },
      ]);

      const result = await service.getRevenueAnalytics({
        period: RevenuePeriod.MONTH,
        year: 2026,
      });

      // Total gross: 199,000 + 3,990,000 + 300,000 = 4,489,000
      // Total refund: 199,000
      // Net: 4,290,000
      expect(result.summary.totalRevenue).toBe(4290000);
      expect(result.summary.previousPeriodRevenue).toBe(2000000);
      expect(result.summary.revenueGrowthRate).toBe(114.5);

      // Subscription breakdown
      expect(result.summary.subscriptionRevenue.total).toBe(4189000);
      expect(result.summary.subscriptionRevenue.byPlan.plus).toBe(199000);
      expect(result.summary.subscriptionRevenue.byPlan.pro).toBe(3990000);
      expect(result.summary.subscriptionRevenue.byCycle.monthly).toBe(199000);
      expect(result.summary.subscriptionRevenue.byCycle.yearly).toBe(3990000);

      // Post purchase breakdown
      expect(result.summary.postPurchaseRevenue.total).toBe(300000);
      expect(result.summary.postPurchaseRevenue.totalCreditsSold).toBe(10);
      expect(result.summary.postPurchaseRevenue.totalTransactions).toBe(1);
      expect(result.summary.postPurchaseRevenue.averageOrderValue).toBe(300000);

      // Timeline check
      expect(result.timeline).toHaveLength(12);
      expect(result.timeline[0].label).toBe('T1');
      expect(result.timeline[0].totalRevenue).toBe(4189000);
      expect(result.timeline[0].subscriptionPlus).toBe(199000);
      expect(result.timeline[0].subscriptionPro).toBe(3990000);
      expect(result.timeline[1].label).toBe('T2');
      // T2 has charge 300,000 and refund 199,000 -> net 101,000
      expect(result.timeline[1].totalRevenue).toBe(101000);
      expect(result.timeline[1].postPurchase).toBe(300000);
    });

    it('should support quarterly breakdown', async () => {
      prisma.payment.findMany
        .mockResolvedValueOnce([
          {
            id: 'pay-1',
            type: PaymentType.charge,
            amount: '500000',
            subscriptionId: 'sub-1',
            postPurchaseId: null,
            paidAt: new Date('2026-01-10T00:00:00.000Z'),
            subscription: {
              planName: SubscriptionPackage.plus,
              billingCycle: BillingCycle.monthly,
            },
          },
          {
            id: 'pay-2',
            type: PaymentType.charge,
            amount: '1500000',
            subscriptionId: null,
            postPurchaseId: 'post-1',
            paidAt: new Date('2026-05-10T00:00:00.000Z'), // Q2
            subscription: null,
          },
        ])
        .mockResolvedValueOnce([]);

      prisma.postPurchase.findMany.mockResolvedValue([]);

      const result = await service.getRevenueAnalytics({
        period: RevenuePeriod.QUARTER,
        year: 2026,
      });

      expect(result.timeline).toHaveLength(4);
      expect(result.timeline[0].label).toBe('Q1');
      expect(result.timeline[0].totalRevenue).toBe(500000);
      expect(result.timeline[1].label).toBe('Q2');
      expect(result.timeline[1].totalRevenue).toBe(1500000);
      expect(result.timeline[2].label).toBe('Q3');
      expect(result.timeline[2].totalRevenue).toBe(0);
    });
  });

  describe('getAdminOverview', () => {
    it('should return combined snapshot of all admin dimensions', async () => {
      jest.spyOn(service, 'getUserAnalytics').mockResolvedValue({
        summary: {
          totalUsers: 1000,
          growthRate: 15.0,
          byRole: { tenant: 800, landlord: 200, employee: 0, leasing_agent: 0, admin: 0 },
        },
      } as any);

      jest.spyOn(service, 'getPropertyAnalytics').mockResolvedValue({
        summary: {
          totalHouses: 50,
          totalRooms: 500,
          occupancyRate: 90.0,
          growthRate: 10.0,
        },
      } as any);

      jest.spyOn(service, 'getRevenueAnalytics').mockResolvedValue({
        summary: {
          totalRevenue: 50000000,
          revenueGrowthRate: 20.0,
        },
      } as any);

      prisma.grievance.count
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(2); // urgent

      prisma.post.count.mockResolvedValue(8); // hidden/reported

      const overview = await service.getAdminOverview();

      expect(overview.totalUsers).toBe(1000);
      expect(overview.totalHouses).toBe(50);
      expect(overview.platformRevenue).toBe(50000000);
      expect(overview.pendingGrievancesCount).toBe(5);
      expect(overview.urgentGrievancesCount).toBe(2);
      expect(overview.reportedItemsCount).toBe(8);
    });
  });
});
