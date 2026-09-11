import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  NotificationsService,
  NOTIFICATION_QUEUE,
} from './notifications.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AdminNotifyChannel,
  AdminNotifyTarget,
  CreateMassNotificationDto,
} from './dto/admin-mass-notification.dto';

const mockPrisma = {
  massNotificationJob: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  notification: {
    createMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

const mockQueue = {
  add: jest.fn(),
};

const QUEUE_TOKEN = `BullQueue_${NOTIFICATION_QUEUE}`;

describe('Admin Mass Notifications (UC-A-05)', () => {
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

  describe('createMassNotification', () => {
    const adminId = 'admin-uuid-1';
    const dto: CreateMassNotificationDto = {
      channel: AdminNotifyChannel.email,
      targetType: AdminNotifyTarget.all_users,
      title: 'Platform Maintenance Notice',
      content: 'Scheduled maintenance from 01:00 to 03:00 AM.',
    };

    it('should create mass notification job, write audit log, and enqueue BullMQ job', async () => {
      const createdJob = {
        id: 'job-uuid-1',
        createdBy: adminId,
        channel: 'email',
        targetType: 'all_users',
        targetId: null,
        title: dto.title,
        content: dto.content,
        status: 'pending',
        sentCount: 0,
        failedCount: 0,
        createdAt: new Date('2026-09-11T10:00:00Z'),
        createdByUser: { id: adminId, username: 'admin1', email: 'admin@dormio.vn' },
        targetUser: null,
      };

      mockPrisma.massNotificationJob.create.mockResolvedValue(createdJob);
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-uuid' });
      mockQueue.add.mockResolvedValue({ id: 'bull-job-1' });

      const result = await service.createMassNotification(adminId, dto);

      expect(mockPrisma.massNotificationJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: adminId,
            channel: 'email',
            targetType: 'all_users',
            title: dto.title,
            status: 'pending',
          }),
        }),
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: adminId,
            action: 'create',
            entityType: 'MASS_NOTIFICATION_JOB',
            entityId: 'job-uuid-1',
          }),
        }),
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'dispatch-mass-notification',
        { massNotificationJobId: 'job-uuid-1' },
        expect.any(Object),
      );

      expect(result.id).toBe('job-uuid-1');
      expect(result.status).toBe('pending');
      expect(result.targetLabel).toBe('Toàn bộ người dùng');
    });

    it('should throw BadRequestException if targetType is specific_user without targetId', async () => {
      const invalidDto: CreateMassNotificationDto = {
        channel: AdminNotifyChannel.sms,
        targetType: AdminNotifyTarget.specific_user,
        title: 'Individual Notice',
        content: 'Your account requires verification.',
      };

      await expect(service.createMassNotification(adminId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if target user does not exist', async () => {
      const specificDto: CreateMassNotificationDto = {
        channel: AdminNotifyChannel.sms,
        targetType: AdminNotifyTarget.specific_user,
        targetId: 'non-existent-user',
        title: 'Individual Notice',
        content: 'Your account requires verification.',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.createMassNotification(adminId, specificDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMassNotificationJobs', () => {
    it('should return paginated items with metrics and status breakdown', async () => {
      const mockRawJobs = [
        {
          id: 'job-1',
          createdBy: 'admin-1',
          channel: 'email',
          targetType: 'all_landlords',
          targetId: null,
          title: 'Fire Safety Rules',
          content: 'Please verify alarms',
          status: 'sent',
          sentCount: 50,
          failedCount: 0,
          createdAt: new Date('2026-09-11T12:00:00Z'),
          createdByUser: { id: 'admin-1', username: 'admin', email: 'admin@dormio.vn' },
          targetUser: null,
        },
      ];

      mockPrisma.massNotificationJob.count
        .mockResolvedValueOnce(1) // total filtered
        .mockResolvedValueOnce(1) // sent
        .mockResolvedValueOnce(0) // pending
        .mockResolvedValueOnce(0); // failed

      mockPrisma.massNotificationJob.findMany.mockResolvedValue(mockRawJobs);

      const res = await service.getMassNotificationJobs({ page: 1, limit: 10 });

      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.counts.sent).toBe(1);
      expect(res.items[0].targetLabel).toBe('Tất cả Chủ trọ');
    });
  });

  describe('getMassNotificationJobById', () => {
    it('should return job detail when found', async () => {
      const mockJob = {
        id: 'job-1',
        createdBy: 'admin-1',
        channel: 'zalo',
        targetType: 'all_users',
        targetId: null,
        title: 'Zalo Announcement',
        content: 'Content test',
        status: 'pending',
        sentCount: 0,
        failedCount: 0,
        createdAt: new Date('2026-09-11T12:00:00Z'),
        createdByUser: { id: 'admin-1', username: 'admin', email: 'admin@dormio.vn' },
        targetUser: null,
      };

      mockPrisma.massNotificationJob.findUnique.mockResolvedValue(mockJob);

      const res = await service.getMassNotificationJobById('job-1');
      expect(res.id).toBe('job-1');
      expect(res.channel).toBe('zalo');
    });

    it('should throw NotFoundException if job not found', async () => {
      mockPrisma.massNotificationJob.findUnique.mockResolvedValue(null);
      await expect(service.getMassNotificationJobById('missing-job')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('processMassNotification (Background Worker Fan-out)', () => {
    it('should resolve all_staff audience by Employee relation and fan out in batches', async () => {
      const mockJob = {
        id: 'job-staff-1',
        createdBy: 'admin-1',
        channel: 'email',
        targetType: 'all_staff',
        targetId: null,
        title: 'Staff Meeting',
        content: 'Staff meeting tomorrow morning',
        status: 'pending',
        sentCount: 0,
        failedCount: 0,
      };

      const mockStaffUsers = [
        { id: 'user-staff-1', email: 'staff1@dormio.vn', phoneNumber: '0901' },
        { id: 'user-staff-2', email: 'staff2@dormio.vn', phoneNumber: '0902' },
      ];

      mockPrisma.massNotificationJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.user.findMany.mockResolvedValue(mockStaffUsers);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.massNotificationJob.update.mockResolvedValue({ ...mockJob, status: 'sent', sentCount: 2 });

      await service.processMassNotification('job-staff-1');

      // Check query filtered by employee profile presence per UC-A-05 requirement
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          employee: { isNot: null },
        },
        select: { id: true, email: true, phoneNumber: true },
      });

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            receiverId: 'user-staff-1',
            type: 'system_broadcast',
            content: '[Staff Meeting] Staff meeting tomorrow morning',
          }),
          expect.objectContaining({
            receiverId: 'user-staff-2',
            type: 'system_broadcast',
            content: '[Staff Meeting] Staff meeting tomorrow morning',
          }),
        ]),
      });

      expect(mockPrisma.massNotificationJob.update).toHaveBeenCalledWith({
        where: { id: 'job-staff-1' },
        data: {
          status: 'sent',
          sentCount: 2,
          failedCount: 0,
        },
      });
    });

    it('should resolve specific_user audience and mark status sent', async () => {
      const mockJob = {
        id: 'job-specific-1',
        createdBy: 'admin-1',
        channel: 'sms',
        targetType: 'specific_user',
        targetId: 'user-single',
        title: 'Urgent Notification',
        content: 'Please verify phone',
        status: 'pending',
        sentCount: 0,
        failedCount: 0,
      };

      mockPrisma.massNotificationJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-single', email: 'single@dormio.vn', phoneNumber: '0988' },
      ]);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.massNotificationJob.update.mockResolvedValue({ ...mockJob, status: 'sent', sentCount: 1 });

      await service.processMassNotification('job-specific-1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { id: 'user-single' },
        select: { id: true, email: true, phoneNumber: true },
      });

      expect(mockPrisma.massNotificationJob.update).toHaveBeenCalledWith({
        where: { id: 'job-specific-1' },
        data: {
          status: 'sent',
          sentCount: 1,
          failedCount: 0,
        },
      });
    });

    it('should handle fatal error and update status to failed', async () => {
      mockPrisma.massNotificationJob.findUnique.mockRejectedValue(new Error('DB Connection Lost'));

      await service.processMassNotification('job-error-1');

      expect(mockPrisma.massNotificationJob.update).toHaveBeenCalledWith({
        where: { id: 'job-error-1' },
        data: { status: 'failed' },
      });
    });
  });

  describe('retryMassNotification', () => {
    it('should reset job to pending, write AuditLog, and re-enqueue into BullMQ', async () => {
      const mockFailedJob = {
        id: 'job-retry-1',
        createdBy: 'admin-1',
        channel: 'email',
        targetType: 'all_users',
        targetId: null,
        title: 'Test Title',
        content: 'Test Content',
        status: 'failed',
        sentCount: 0,
        failedCount: 10,
        createdAt: new Date('2026-09-11T12:00:00Z'),
        createdByUser: { id: 'admin-1', username: 'admin', email: 'admin@dormio.vn' },
        targetUser: null,
      };

      mockPrisma.massNotificationJob.findUnique.mockResolvedValue(mockFailedJob);
      mockPrisma.massNotificationJob.update.mockResolvedValue({
        ...mockFailedJob,
        status: 'pending',
        failedCount: 0,
      });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
      mockQueue.add.mockResolvedValue({ id: 'bull-job-2' });

      const res = await service.retryMassNotification('admin-1', 'job-retry-1');

      expect(mockPrisma.massNotificationJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-retry-1' },
          data: expect.objectContaining({ status: 'pending', sentCount: 0, failedCount: 0 }),
        }),
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'admin-1',
            action: 'update',
            entityType: 'MASS_NOTIFICATION_JOB',
          }),
        }),
      );

      expect(mockQueue.add).toHaveBeenCalledWith('dispatch-mass-notification', {
        massNotificationJobId: 'job-retry-1',
      });

      expect(res.status).toBe('pending');
    });
  });
});
