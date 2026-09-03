import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GrievancesService } from './grievances.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GrievancePriorityEnum } from './dto/create-grievance.dto';

describe('GrievancesService', () => {
  let service: GrievancesService;

  const mockTenantId = 'user-tenant-uuid-1';
  const mockContractId = 'contract-uuid-1';
  const mockRoomId = 'room-uuid-1';
  const mockBoardingHouseId = 'bh-uuid-1';

  const mockContract = {
    id: mockContractId,
    roomId: mockRoomId,
    status: 'active',
    room: {
      id: mockRoomId,
      roomNumber: '101',
      boardingHouseId: mockBoardingHouseId,
      boardingHouse: {
        id: mockBoardingHouseId,
        name: 'Dormio Tân Bình',
      },
    },
  };

  const mockTenantContract = {
    id: 'tc-uuid-1',
    tenantId: mockTenantId,
    contractId: mockContractId,
    isPrimary: true,
    contract: mockContract,
  };

  const mockGrievance = {
    id: 'grievance-uuid-1',
    tenantId: mockTenantId,
    boardingHouseId: mockBoardingHouseId,
    roomId: mockRoomId,
    title: 'Chủ trọ tự ý tăng tiền điện',
    description: 'Chủ trọ thu 5000đ/kWh thay vì 3500đ theo hợp đồng.',
    priority: 'high',
    status: 'pending',
    resolvedBy: null,
    resolutionNote: null,
    resolvedAt: null,
    createdAt: new Date('2026-08-31T15:00:00.000Z'),
    updatedAt: new Date('2026-08-31T15:00:00.000Z'),
    boardingHouse: {
      id: mockBoardingHouseId,
      name: 'Dormio Tân Bình',
    },
    room: {
      id: mockRoomId,
      roomNumber: '101',
    },
    images: [
      {
        id: 'img-1',
        url: 'https://images.com/evidence1.jpg',
        createdAt: new Date('2026-08-31T15:00:00.000Z'),
      },
    ],
    resolvedByUser: null,
  };

  const mockPrisma = {
    tenantContract: {
      findFirst: jest.fn(),
    },
    grievance: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    grievanceImage: {
      createMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrievancesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<GrievancesService>(GrievancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGrievance', () => {
    it('should throw NotFoundException if no active contract is found', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(null);

      await expect(
        service.createGrievance(mockTenantId, {
          title: 'Khiếu nại test',
          description: 'Nội dung chi tiết khiếu nại test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create grievance and images successfully', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(mockTenantContract);
      mockPrisma.grievance.create.mockResolvedValue({ id: 'grievance-uuid-1' });
      mockPrisma.grievanceImage.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
      mockPrisma.grievance.findUnique.mockResolvedValue(mockGrievance);

      const result = await service.createGrievance(mockTenantId, {
        title: 'Chủ trọ tự ý tăng tiền điện',
        description: 'Chủ trọ thu 5000đ/kWh thay vì 3500đ theo hợp đồng.',
        priority: GrievancePriorityEnum.high,
        imageUrls: ['https://images.com/evidence1.jpg'],
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('grievance-uuid-1');
      expect(result.data.title).toBe('Chủ trọ tự ý tăng tiền điện');
      expect(result.data.priority).toBe('high');
      expect(result.data.status).toBe('pending');
      expect(result.data.roomNumber).toBe('101');
      expect(result.data.images).toHaveLength(1);
    });
  });

  describe('getTenantGrievances', () => {
    it('should return list of tenant grievances', async () => {
      mockPrisma.grievance.findMany.mockResolvedValue([mockGrievance]);

      const result = await service.getTenantGrievances(mockTenantId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('grievance-uuid-1');
    });
  });

  describe('getTenantGrievanceById', () => {
    it('should return grievance detail when found and owned by tenant', async () => {
      mockPrisma.grievance.findFirst.mockResolvedValue(mockGrievance);

      const result = await service.getTenantGrievanceById(
        mockTenantId,
        'grievance-uuid-1',
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('grievance-uuid-1');
    });

    it('should throw NotFoundException when grievance is not found', async () => {
      mockPrisma.grievance.findFirst.mockResolvedValue(null);

      await expect(
        service.getTenantGrievanceById(mockTenantId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
