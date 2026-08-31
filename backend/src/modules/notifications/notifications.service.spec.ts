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
});
