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
    const userId = 'landlord-user-id';

    it('should grant free_quote if user has not exceeded daily free quota', async () => {
      // 0 free posts used today
      mockPrisma.post.count.mockResolvedValue(0);
      // No active subscription, fallback to free plan (quota = 1)
      mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
        planName: SubscriptionPackage.free,
        dailyPostQuote: 1,
      });

      const allocation = await service.checkQuota(userId);

      expect(allocation).toEqual({
        sourceType: SourceType.free_quote,
        postPurchaseId: null,
      });
    });

    it('should grant free_quote if user has active pro subscription with higher daily quota', async () => {
      // 3 free posts used today
      mockPrisma.post.count.mockResolvedValue(3);
      // Active Pro plan with quota = 20
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        userId,
        planName: SubscriptionPackage.pro,
        status: SubscriptionStatus.active,
        subscriptionPlan: {
          planName: SubscriptionPackage.pro,
          dailyPostQuote: 20,
        },
      });

      const allocation = await service.checkQuota(userId);

      expect(allocation).toEqual({
        sourceType: SourceType.free_quote,
        postPurchaseId: null,
      });
    });

    it('should fallback to purchased post credits (FIFO) when free quota is exhausted', async () => {
      // 1 free post used today (free plan quota is 1)
      mockPrisma.post.count.mockResolvedValue(1);
      mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
        planName: SubscriptionPackage.free,
        dailyPostQuote: 1,
      });

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

      const allocation = await service.checkQuota(userId);

      expect(allocation).toEqual({
        sourceType: SourceType.purchased,
        postPurchaseId: 'pp-package-2',
      });
    });

    it('should throw ForbiddenException if both free quota and purchased credits are exhausted', async () => {
      mockPrisma.post.count.mockResolvedValue(1);
      mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
        planName: SubscriptionPackage.free,
        dailyPostQuote: 1,
      });

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

      await expect(service.checkQuota(userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createPost', () => {
    const userId = 'landlord-1';
    const createDto = {
      title: 'Phòng trọ cao cấp trung tâm Quận 1',
      content: 'Đầy đủ tiện nghi, giờ giấc tự do...',
      depositAmount: 3500000,
      roomId: 'room-1',
      imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    };

    it('should throw NotFoundException if linked roomId does not exist', async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
        dailyPostQuote: 1,
      });

      mockPrisma.room.findUnique.mockResolvedValue(null);

      await expect(service.createPost(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if room belongs to another landlord', async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
        dailyPostQuote: 1,
      });

      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room-1',
        boardingHouse: {
          ownerId: 'different-landlord-id',
        },
      });

      await expect(service.createPost(userId, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should successfully create post and post images inside transaction', async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
        dailyPostQuote: 1,
      });

      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room-1',
        boardingHouse: {
          ownerId: userId,
        },
      });

      const createdPostMock = {
        id: 'post-100',
        postedBy: userId,
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

      const result = await service.createPost(userId, createDto);

      expect(result.id).toEqual('post-100');
      expect(result.title).toEqual(createDto.title);
      expect(result.sourceType).toEqual(SourceType.free_quote);
      expect(result.images).toHaveLength(2);
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
});
