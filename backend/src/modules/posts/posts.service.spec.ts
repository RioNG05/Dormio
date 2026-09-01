import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  PostStatus,
  SourceType,
  PostPurchaseStatus,
  SubscriptionPackage,
  SubscriptionStatus,
} from '@prisma';

describe('PostsService', () => {
  let service: PostsService;

  const mockPrisma = {
    boardingHouse: {
      count: jest.fn(),
    },
    post: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    postImage: {
      createMany: jest.fn(),
    },
    userSubscription: {
      findFirst: jest.fn(),
    },
    subscriptionPlan: {
      findUnique: jest.fn(),
    },
    postPurchase: {
      findMany: jest.fn(),
    },
    postReach: {
      findMany: jest.fn(),
    },
    room: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  describe('checkQuota', () => {
    const userId = 'test-user-id';

    it('should grant free_quote to leasing agent (base quota = 3) without subscription lookup', async () => {
      // 2 free posts used today, base quota = 3
      mockPrisma.post.count.mockResolvedValue(2);

      const allocation = await service.checkQuota(userId, false);

      expect(allocation).toEqual({
        sourceType: SourceType.free_quote,
        postPurchaseId: null,
      });
      expect(mockPrisma.userSubscription.findFirst).not.toHaveBeenCalled();
    });

    it('should grant free_quote to landlord with plus subscription (3 base + 5 bonus = 8 quota)', async () => {
      // 5 free posts used today, landlord with plus (bonus=5)
      mockPrisma.post.count.mockResolvedValue(5);
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        userId,
        planName: SubscriptionPackage.plus,
        status: SubscriptionStatus.active,
        subscriptionPlan: {
          planName: SubscriptionPackage.plus,
          dailyPostQuote: 5,
        },
      });

      const allocation = await service.checkQuota(userId, true);

      expect(allocation).toEqual({
        sourceType: SourceType.free_quote,
        postPurchaseId: null,
      });
    });

    it('should fallback to purchased post credits (FIFO) when free quota is exhausted', async () => {
      // 3 free posts used today for leasing agent (base quota is 3)
      mockPrisma.post.count.mockResolvedValue(3);

      // 2 paid packages: first package fully used (5/5), second package available (2/5)
      mockPrisma.postPurchase.findMany.mockResolvedValue([
        {
          id: 'pp-package-1',
          buyerId: userId,
          quantityPurchase: 5,
          status: PostPurchaseStatus.paid,
          activatedAt: new Date('2026-08-01'),
          _count: { posts: 5 },
        },
        {
          id: 'pp-package-2',
          buyerId: userId,
          quantityPurchase: 5,
          status: PostPurchaseStatus.paid,
          activatedAt: new Date('2026-08-10'),
          _count: { posts: 2 },
        },
      ]);

      const allocation = await service.checkQuota(userId, false);

      expect(allocation).toEqual({
        sourceType: SourceType.purchased,
        postPurchaseId: 'pp-package-2',
      });
    });

    it('should throw ForbiddenException if both free quota and purchased credits are exhausted', async () => {
      mockPrisma.post.count.mockResolvedValue(3);

      mockPrisma.postPurchase.findMany.mockResolvedValue([
        {
          id: 'pp-package-1',
          buyerId: userId,
          quantityPurchase: 3,
          status: PostPurchaseStatus.paid,
          activatedAt: new Date('2026-08-01'),
          _count: { posts: 3 },
        },
      ]);

      await expect(service.checkQuota(userId, false)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createPost', () => {
    const landlordId = 'landlord-1';
    const leasingAgentId = 'agent-1';

    const createDto = {
      title: 'Premium studio room in district 1',
      content: 'Full furniture, 24/7 security, high speed internet...',
      depositAmount: 3500000,
      roomId: 'room-1',
      imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    };

    it('should reject leasing agent with BadRequestException if roomId is provided', async () => {
      mockPrisma.boardingHouse.count.mockResolvedValue(0); // Not a landlord

      await expect(
        service.createPost(leasingAgentId, createDto),
      ).rejects.toThrow(
        'Leasing agents can only publish general listings and cannot link to specific rooms',
      );
    });

    it('should throw NotFoundException if landlord links roomId that does not exist', async () => {
      mockPrisma.boardingHouse.count.mockResolvedValue(1); // Is a landlord
      mockPrisma.room.findUnique.mockResolvedValue(null);

      await expect(service.createPost(landlordId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if room belongs to another landlord', async () => {
      mockPrisma.boardingHouse.count.mockResolvedValue(1); // Is a landlord
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room-1',
        boardingHouse: {
          ownerId: 'different-landlord-id',
        },
      });

      await expect(service.createPost(landlordId, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should successfully create post and post images inside transaction for landlord', async () => {
      mockPrisma.boardingHouse.count.mockResolvedValue(1);
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.userSubscription.findFirst.mockResolvedValue(null);

      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room-1',
        boardingHouse: {
          ownerId: landlordId,
        },
      });

      const createdPostMock = {
        id: 'post-100',
        postedBy: landlordId,
        roomId: 'room-1',
        title: createDto.title,
        content: createDto.content,
        depositAmount: 3500000,
        status: PostStatus.posted,
        sourceType: SourceType.free_quote,
        postPurchaseId: null,
        createdAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          post: {
            create: jest.fn().mockResolvedValue(createdPostMock),
          },
          postImage: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return cb(tx);
      });

      mockPrisma.post.findUnique.mockResolvedValue({
        ...createdPostMock,
        postImages: [
          { id: 'img-1', url: createDto.imageUrls[0] },
          { id: 'img-2', url: createDto.imageUrls[1] },
        ],
        room: {
          id: 'room-1',
          roomNumber: '101',
          floor: 1,
          area: 25,
          roomType: { name: 'Studio' },
          boardingHouse: { name: 'Dormio House 1', id: 'bh-1' },
        },
        _count: { postReaches: 0 },
      });

      const result = await service.createPost(landlordId, createDto);

      expect(result.id).toEqual('post-100');
      expect(result.title).toEqual(createDto.title);
      expect(result.sourceType).toEqual(SourceType.free_quote);
      expect(result.images).toHaveLength(2);
    });

    it('should successfully create general listing for leasing agent without roomId', async () => {
      mockPrisma.boardingHouse.count.mockResolvedValue(0);
      mockPrisma.post.count.mockResolvedValue(0);

      const agentDto = {
        title: 'General listing by leasing agent',
        content: 'Convenient location, modern amenities...',
        depositAmount: 2000000,
        imageUrls: [],
      };

      const createdPostMock = {
        id: 'post-200',
        postedBy: leasingAgentId,
        roomId: null,
        title: agentDto.title,
        content: agentDto.content,
        depositAmount: 2000000,
        status: PostStatus.posted,
        sourceType: SourceType.free_quote,
        postPurchaseId: null,
        createdAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          post: {
            create: jest.fn().mockResolvedValue(createdPostMock),
          },
          postImage: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return cb(tx);
      });

      mockPrisma.post.findUnique.mockResolvedValue({
        ...createdPostMock,
        postImages: [],
        room: null,
        _count: { postReaches: 0 },
      });

      const result = await service.createPost(leasingAgentId, agentDto);

      expect(result.id).toEqual('post-200');
      expect(result.roomId).toBeNull();
      expect(result.sourceType).toEqual(SourceType.free_quote);
    });
  });

  describe('updatePostStatus', () => {
    const userId = 'user-1';
    const postId = 'post-1';

    it('should throw ForbiddenException when non-author attempts to update status', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: postId,
        postedBy: 'other-user',
      });

      await expect(
        service.updatePostStatus(userId, postId, PostStatus.hidden),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update status when author requests it', async () => {
      mockPrisma.post.findUnique
        .mockResolvedValueOnce({
          id: postId,
          postedBy: userId,
          status: PostStatus.posted,
        })
        .mockResolvedValueOnce({
          id: postId,
          postedBy: userId,
          status: PostStatus.hidden,
          postImages: [],
          room: null,
          depositAmount: 3000000,
          createdAt: new Date(),
          _count: { postReaches: 5 },
        });

      mockPrisma.post.update.mockResolvedValue({
        id: postId,
        status: PostStatus.hidden,
      });

      const result = await service.updatePostStatus(
        userId,
        postId,
        PostStatus.hidden,
      );

      expect(result.status).toEqual(PostStatus.hidden);
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { status: PostStatus.hidden },
      });
    });
  });

  describe('getPosterAnalyticsOverview', () => {
    const userId = 'poster-1';

    it('should aggregate post counts, views, bookmarks and generate daily trend points', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Room 101',
          status: PostStatus.posted,
          depositAmount: 3000000,
          room: { roomNumber: '101', boardingHouse: { name: 'Dormio Premier' } },
          postImages: [{ id: 'img-1', url: 'https://example.com/1.jpg' }],
          _count: { postReaches: 10, savedPosts: 3 },
          createdAt: new Date(),
        },
        {
          id: 'post-2',
          title: 'Room 201',
          status: PostStatus.posted,
          depositAmount: 4000000,
          room: null,
          postImages: [],
          _count: { postReaches: 5, savedPosts: 1 },
          createdAt: new Date(),
        },
      ];

      mockPrisma.post.findMany.mockResolvedValue(mockPosts);

      const today = new Date();
      mockPrisma.postReach.findMany.mockResolvedValue([
        { viewedAt: today, viewedBy: 'user-a' },
        { viewedAt: today, viewedBy: 'user-b' },
      ]);

      const result = await service.getPosterAnalyticsOverview(userId, 7);

      expect(result.totalPosts).toEqual(2);
      expect(result.activePosts).toEqual(2);
      expect(result.totalViews).toEqual(15);
      expect(result.totalSaved).toEqual(4);
      expect(result.averageViewsPerPost).toEqual(7.5);
      expect(result.dailyTrends).toHaveLength(7);
      expect(result.topPosts[0].id).toEqual('post-1');
    });
  });

  describe('getSinglePostAnalytics', () => {
    const userId = 'poster-1';
    const postId = 'post-1';

    it('should throw ForbiddenException if user is not post author', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: postId,
        postedBy: 'other-user',
      });

      await expect(
        service.getSinglePostAnalytics(userId, postId, 7),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return single post drill-down with daily trends and unique viewers', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: postId,
        postedBy: userId,
        title: 'Room 101',
        status: PostStatus.posted,
        depositAmount: 3500000,
        room: { roomNumber: '101', boardingHouse: { name: 'Dormio House' } },
        postImages: [{ id: 'img-1', url: 'https://example.com/1.jpg' }],
        _count: { postReaches: 8, savedPosts: 2 },
        createdAt: new Date(),
      });

      const today = new Date();
      mockPrisma.postReach.findMany.mockResolvedValue([
        { viewedAt: today, viewedBy: 'user-a' },
        { viewedAt: today, viewedBy: 'user-a' }, // duplicate viewer
        { viewedAt: today, viewedBy: 'user-b' },
      ]);

      const result = await service.getSinglePostAnalytics(userId, postId, 7);

      expect(result.post.id).toEqual(postId);
      expect(result.totalViews).toEqual(8);
      expect(result.totalUniqueViewers).toEqual(2);
      expect(result.dailyTrends).toHaveLength(7);
    });
  });
});
