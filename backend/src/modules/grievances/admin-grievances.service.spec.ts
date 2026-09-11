import { Test, TestingModule } from '@nestjs/testing';
import { GrievancesService } from './grievances.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GrievanceStatusFilter, GrievancePriorityFilter } from './dto/admin-grievance.dto';

describe('AdminGrievancesService (UC-A-04)', () => {
  let service: GrievancesService;
  let prisma: any;

  const mockPrismaService = {
    grievance: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrievancesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GrievancesService>(GrievancesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('getAdminGrievanceQueue', () => {
    it('should retrieve pending queue ordered by priority desc, createdAt asc', async () => {
      const mockGrievances = [
        {
          id: 'grv-1',
          title: 'Khẩn cấp: Cắt điện vô cớ',
          description: 'Chủ trọ cắt điện phòng 101',
          priority: 'high',
          status: 'pending',
          tenantId: 't-1',
          tenant: {
            username: 'Dung',
            phoneNumber: '0912345678',
            email: 'dung@test.com',
            userIdentification: { fullName: 'Trần Thị Thuỳ Dung' },
          },
          boardingHouseId: 'bh-1',
          boardingHouse: {
            name: 'Dormio Sunrise',
            owner: {
              username: 'Huy',
              phoneNumber: '0344265925',
              userIdentification: { fullName: 'Nguyễn Quang Huy' },
            },
          },
          roomId: 'r-1',
          room: { roomNumber: '101' },
          resolutionNote: null,
          resolvedAt: null,
          resolvedByUser: null,
          images: [],
          createdAt: new Date('2026-09-08T09:00:00.000Z'),
          updatedAt: new Date('2026-09-08T09:00:00.000Z'),
        },
      ];

      prisma.grievance.findMany.mockResolvedValue(mockGrievances);
      prisma.grievance.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1) // pending
        .mockResolvedValueOnce(0) // in_progress
        .mockResolvedValueOnce(0) // resolved
        .mockResolvedValueOnce(0) // rejected
        .mockResolvedValueOnce(1); // urgent

      const result = await service.getAdminGrievanceQueue({
        status: GrievanceStatusFilter.PENDING,
        priority: GrievancePriorityFilter.ALL,
        page: 1,
        limit: 10,
      });

      expect(prisma.grievance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: GrievanceStatusFilter.PENDING },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
          skip: 0,
          take: 10,
        }),
      );

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].tenantName).toBe('Trần Thị Thuỳ Dung');
      expect(result.items[0].landlordName).toBe('Nguyễn Quang Huy');
      expect(result.counts.pending).toBe(1);
      expect(result.counts.urgent).toBe(1);
    });
  });

  describe('getAdminGrievanceById', () => {
    it('should return grievance detail when found', async () => {
      const mockG = {
        id: 'grv-1',
        title: 'Khiếu nại cọc',
        description: 'Chủ trọ không trả cọc',
        priority: 'high',
        status: 'pending',
        tenantId: 't-1',
        tenant: { username: 'Dung', phoneNumber: '0912345678' },
        boardingHouseId: 'bh-1',
        boardingHouse: { name: 'Dormio Sunrise', owner: { username: 'Huy' } },
        roomId: 'r-1',
        room: { roomNumber: '101' },
        images: [],
        createdAt: new Date(),
      };

      prisma.grievance.findUnique.mockResolvedValue(mockG);

      const result = await service.getAdminGrievanceById('grv-1');
      expect(result.id).toBe('grv-1');
      expect(result.title).toBe('Khiếu nại cọc');
    });

    it('should throw NotFoundException when grievance not found', async () => {
      prisma.grievance.findUnique.mockResolvedValue(null);
      await expect(service.getAdminGrievanceById('grv-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateGrievanceStatusInProgress', () => {
    it('should transition pending grievance to in_progress and log audit', async () => {
      const mockG = {
        id: 'grv-1',
        status: 'pending',
      };

      prisma.grievance.findUnique.mockResolvedValue(mockG);
      prisma.grievance.update.mockResolvedValue({
        ...mockG,
        status: 'in_progress',
        createdAt: new Date(),
      });

      const result = await service.updateGrievanceStatusInProgress('admin-1', 'grv-1');
      expect(result.status).toBe('in_progress');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'update',
            entityType: 'GRIEVANCE',
            newValue: { status: 'in_progress' },
          }),
        }),
      );
    });

    it('should throw BadRequestException if grievance already resolved', async () => {
      prisma.grievance.findUnique.mockResolvedValue({
        id: 'grv-1',
        status: 'resolved',
      });

      await expect(
        service.updateGrievanceStatusInProgress('admin-1', 'grv-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resolveGrievance', () => {
    it('should set status resolved, record resolution note, audit log, and tenant notification', async () => {
      const mockG = {
        id: 'grv-1',
        title: 'Khiếu nại trả cọc',
        status: 'pending',
        tenantId: 't-1',
      };

      prisma.grievance.findUnique.mockResolvedValue(mockG);
      prisma.grievance.update.mockResolvedValue({
        ...mockG,
        status: 'resolved',
        resolutionNote: 'Đã hoàn 100% tiền cọc',
        resolvedAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.resolveGrievance('admin-1', 'grv-1', {
        resolutionNote: 'Đã hoàn 100% tiền cọc',
        escalateLockLandlord: false,
      });

      expect(result.status).toBe('resolved');
      expect(result.resolutionNote).toBe('Đã hoàn 100% tiền cọc');

      // Verify AuditLog
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'update',
            entityType: 'GRIEVANCE',
            userId: 'admin-1',
            newValue: expect.objectContaining({
              status: 'resolved',
              resolutionNote: 'Đã hoàn 100% tiền cọc',
            }),
          }),
        }),
      );

      // Verify Notification dispatched to tenant
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            receiverId: 't-1',
            senderId: 'admin-1',
            type: 'grievance_resolved',
          }),
        }),
      );
    });
  });

  describe('rejectGrievance', () => {
    it('should set status rejected, record explanation, audit log, and tenant notification', async () => {
      const mockG = {
        id: 'grv-1',
        title: 'Khiếu nại vô lý',
        status: 'pending',
        tenantId: 't-1',
      };

      prisma.grievance.findUnique.mockResolvedValue(mockG);
      prisma.grievance.update.mockResolvedValue({
        ...mockG,
        status: 'rejected',
        resolutionNote: 'Từ chối: Giao dịch không qua nền tảng',
        resolvedAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.rejectGrievance('admin-1', 'grv-1', {
        resolutionNote: 'Từ chối: Giao dịch không qua nền tảng',
      });

      expect(result.status).toBe('rejected');
      expect(result.resolutionNote).toBe('Từ chối: Giao dịch không qua nền tảng');

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            receiverId: 't-1',
            type: 'grievance_rejected',
          }),
        }),
      );
    });
  });
});
