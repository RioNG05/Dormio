import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  NotificationsService,
  NOTIFICATION_QUEUE,
} from './notifications.service';
import { PrismaService } from '../../common/prisma/prisma.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  tenantContract: {
    count: jest.fn(),
  },
};

const mockQueue = {
  add: jest.fn(),
};

// BullMQ generates the queue injection token as `BullQueue_<name>`.
// We avoid importing the ESM-only `getQueueToken` helper from @nestjs/bullmq
// to keep Jest (CommonJS) happy, and instead replicate its simple logic here.
const QUEUE_TOKEN = `BullQueue_${NOTIFICATION_QUEUE}`;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QUEUE_TOKEN, useValue: mockQueue },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  // ─── createOnboardingNotification ─────────────────────────────────────────

  describe('createOnboardingNotification', () => {
    const params = {
      senderId: 'landlord-uuid',
      receiverId: 'tenant-uuid',
      boardingHouseId: 'house-uuid',
      contractId: 'contract-uuid',
    };

    it('should persist a Notification row with correct fields', async () => {
      const createdRow = { id: 'notif-uuid', ...params };
      mockPrisma.notification.create.mockResolvedValue(createdRow);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.createOnboardingNotification(params);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          senderId: params.senderId,
          receiverId: params.receiverId,
          boardingHouseId: params.boardingHouseId,
          type: 'contract_created',
          content: expect.any(String),
          isRead: false,
        },
      });
    });

    it('should enqueue a dispatch job AFTER creating the DB row', async () => {
      const createdRow = { id: 'notif-uuid' };
      mockPrisma.notification.create.mockResolvedValue(createdRow);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.createOnboardingNotification(params);

      expect(mockQueue.add).toHaveBeenCalledWith('dispatch-notification', {
        notificationId: createdRow.id,
        type: 'contract_created',
        receiverId: params.receiverId,
        contractId: params.contractId,
      });

      // Verify ordering: DB create happens before queue add
      const createOrder =
        mockPrisma.notification.create.mock.invocationCallOrder[0];
      const queueOrder = mockQueue.add.mock.invocationCallOrder[0];
      expect(createOrder).toBeLessThan(queueOrder);
    });

    it('should not enqueue a job if the DB write fails', async () => {
      mockPrisma.notification.create.mockRejectedValue(
        new Error('DB constraint violation'),
      );

      await expect(
        service.createOnboardingNotification(params),
      ).rejects.toThrow('DB constraint violation');

      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  // ─── findAllForUser ────────────────────────────────────────────────────────

  describe('findAllForUser', () => {
    it('should return notifications scoped to the given userId', async () => {
      const notifications = [
        { id: 'n1', receiverId: 'user-1', isRead: false },
        { id: 'n2', receiverId: 'user-1', isRead: true },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(notifications);

      const result = await service.findAllForUser('user-1');

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { receiverId: 'user-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toEqual(notifications);
    });

    it('should return an empty array when the user has no notifications', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      const result = await service.findAllForUser('user-with-no-notifs');
      expect(result).toEqual([]);
    });
  });

  // ─── markAsRead ────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark the notification as read when it belongs to the user', async () => {
      const notif = { id: 'notif-1', receiverId: 'user-1', isRead: false };
      mockPrisma.notification.findUnique.mockResolvedValue(notif);
      mockPrisma.notification.update.mockResolvedValue({
        ...notif,
        isRead: true,
      });

      await service.markAsRead('notif-1', 'user-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
    });

    it('should throw NotFoundException when the notification does not exist', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('bad-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the notification belongs to another user', async () => {
      const notif = { id: 'notif-1', receiverId: 'other-user', isRead: false };
      mockPrisma.notification.findUnique.mockResolvedValue(notif);

      await expect(
        service.markAsRead('notif-1', 'requesting-user'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });
  });

  // ─── UC-L-13: broadcastAnnouncement ───────────────────────────────────────

  describe('broadcastAnnouncement', () => {
    const dto = {
      title: 'Thông báo cắt nước bảo trì',
      content: 'Bảo trì đường ống nước từ 9h đến 11h.',
      category: 'Điện nước',
      targetScope: 'Toàn bộ tòa nhà',
      channel: 'Thông báo hệ thống',
    };

    it('should create a broadcast Notification with receiverId = null and enqueue job', async () => {
      const mockCreated = {
        id: 'announcement-1',
        boardingHouseId: 'house-1',
        senderId: 'landlord-1',
        receiverId: null,
        type: 'announcement',
        content: JSON.stringify(dto),
        isRead: false,
        createdAt: new Date('2026-08-28T09:00:00.000Z'),
        sender: {
          username: 'landlord_john',
          userIdentification: { fullName: 'John Landlord' },
        },
      };

      mockPrisma.notification.create.mockResolvedValue(mockCreated);
      mockPrisma.tenantContract.count.mockResolvedValue(15);
      mockQueue.add.mockResolvedValue({ id: 'job-announcement' });

      const result = await service.broadcastAnnouncement('house-1', 'landlord-1', dto);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          boardingHouseId: 'house-1',
          senderId: 'landlord-1',
          receiverId: null,
          type: 'announcement',
          content: expect.any(String),
          isRead: false,
        },
        include: expect.any(Object),
      });

      expect(mockQueue.add).toHaveBeenCalledWith('dispatch-broadcast-announcement', {
        notificationId: 'announcement-1',
        boardingHouseId: 'house-1',
        channel: 'Thông báo hệ thống',
        type: 'announcement',
      });

      expect(result.id).toBe('announcement-1');
      expect(result.title).toBe(dto.title);
      expect(result.totalTarget).toBe(15);
      expect(result.sender).toBe('John Landlord');
    });
  });

  // ─── UC-L-13: getBoardingHouseAnnouncements ────────────────────────────────

  describe('getBoardingHouseAnnouncements', () => {
    it('should return paginated announcements for the boarding house', async () => {
      const mockItem = {
        id: 'ann-1',
        boardingHouseId: 'house-1',
        senderId: 'landlord-1',
        receiverId: null,
        type: 'announcement',
        content: JSON.stringify({
          title: 'Họp cư dân',
          content: 'Họp định kỳ tối chủ nhật.',
          category: 'Nội quy',
          targetScope: 'Toàn bộ tòa nhà',
          channel: 'Thông báo hệ thống',
        }),
        isRead: false,
        createdAt: new Date('2026-08-28T09:00:00.000Z'),
        sender: {
          username: 'manager',
          userIdentification: null,
        },
      };

      mockPrisma.notification.count.mockResolvedValue(1);
      mockPrisma.notification.findMany.mockResolvedValue([mockItem]);
      mockPrisma.tenantContract.count.mockResolvedValue(20);

      const res = await service.getBoardingHouseAnnouncements('house-1', {
        page: 1,
        limit: 10,
      });

      expect(res.success).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].title).toBe('Họp cư dân');
      expect(res.meta.total).toBe(1);
      expect(res.summary.totalTargetTenants).toBe(20);
    });
  });

  // ─── deleteAnnouncement ───────────────────────────────────────────────────

  describe('deleteAnnouncement', () => {
    it('should delete the announcement when it exists and belongs to the house', async () => {
      const mockNotif = {
        id: 'ann-1',
        boardingHouseId: 'house-1',
        type: 'announcement',
      };
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotif);
      mockPrisma.notification.delete.mockResolvedValue(mockNotif);

      await service.deleteAnnouncement('house-1', 'ann-1');

      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'ann-1' },
      });
    });

    it('should throw NotFoundException if announcement does not exist', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteAnnouncement('house-1', 'missing-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if announcement belongs to another boarding house', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'ann-1',
        boardingHouseId: 'other-house',
        type: 'announcement',
      });

      await expect(
        service.deleteAnnouncement('house-1', 'ann-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
