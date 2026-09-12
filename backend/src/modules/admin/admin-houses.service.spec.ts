import { Test, TestingModule } from '@nestjs/testing';
import { AdminHousesService } from './admin-houses.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BoardingHouseStatus, AuditLogAction } from '@prisma';
import { NotFoundException } from '@nestjs/common';

describe('AdminHousesService', () => {
  let service: AdminHousesService;
  let prisma: any;

  const sampleDbHouses = [
    {
      id: 'uuid-house-1',
      name: 'Nhà Trọ Hưng Thịnh Thủ Đức',
      houseNumber: '45',
      street: 'Đường D1',
      ward: 'Phường Tăng Nhơn Phú A',
      district: 'TP. Thủ Đức',
      province: 'TP.HCM',
      city: 'TP.HCM',
      status: BoardingHouseStatus.active,
      createdAt: new Date('2026-07-20'),
      thumbnail: null,
      owner: {
        id: 'landlord-1',
        username: 'Nguyễn Văn Hùng',
        phoneNumber: '0988.765.432',
        email: 'hung.nguyen@yahoo.com',
      },
      rooms: Array.from({ length: 30 }, (_, i) => ({
        id: `r-${i}`,
        status: i < 27 ? 'occupied' : 'available',
      })),
      grievences: [],
    },
    {
      id: 'uuid-house-2',
      name: 'Dormio Premier Quận 1',
      houseNumber: '123',
      street: 'Nguyễn Huệ',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'Hồ Chí Minh',
      city: 'Hồ Chí Minh',
      status: BoardingHouseStatus.active,
      createdAt: new Date('2026-08-15'),
      thumbnail: null,
      owner: {
        id: 'landlord-2',
        username: 'Lê Minh Tuấn',
        phoneNumber: '0901.234.567',
        email: 'tuan.le@gmail.com',
      },
      rooms: Array.from({ length: 20 }, (_, i) => ({
        id: `r2-${i}`,
        status: i < 18 ? 'occupied' : 'available',
      })),
      grievences: [{ id: 'g-1', title: 'Thấm dột nhà vệ sinh', status: 'pending' }],
    },
  ];

  const mockPrismaService = {
    boardingHouse: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminHousesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminHousesService>(AdminHousesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getBoardingHousesForModeration', () => {
    it('should return empty list when DB has no houses', async () => {
      mockPrismaService.boardingHouse.findMany.mockResolvedValue([]);

      const result = await service.getBoardingHousesForModeration({
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should filter by property name or address (propertyQuery)', async () => {
      mockPrismaService.boardingHouse.findMany.mockResolvedValue(sampleDbHouses);

      const result = await service.getBoardingHousesForModeration({
        propertyQuery: 'Thủ Đức',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toContain('Thủ Đức');
    });

    it('should filter by landlord contact name or phone (landlordQuery)', async () => {
      mockPrismaService.boardingHouse.findMany.mockResolvedValue(sampleDbHouses);

      const result = await service.getBoardingHousesForModeration({
        landlordQuery: '0988.765.432',
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].landlordName).toBe('Nguyễn Văn Hùng');
    });

    it('should filter by total rooms range (minRooms and maxRooms)', async () => {
      mockPrismaService.boardingHouse.findMany.mockResolvedValue(sampleDbHouses);

      const result = await service.getBoardingHousesForModeration({
        minRooms: 25,
        maxRooms: 35,
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].totalRooms).toBe(30);
    });

    it('should filter by occupancy rate range (minOccupancy and maxOccupancy)', async () => {
      mockPrismaService.boardingHouse.findMany.mockResolvedValue(sampleDbHouses);

      const result = await service.getBoardingHousesForModeration({
        minOccupancy: 85,
        maxOccupancy: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
    });

    it('should filter by multiple statuses', async () => {
      mockPrismaService.boardingHouse.findMany.mockResolvedValue(sampleDbHouses);

      const result = await service.getBoardingHousesForModeration({
        status: 'active,reported',
      });

      expect(result.success).toBe(true);
      result.data.forEach((house) => {
        expect(['active', 'reported']).toContain(house.status);
      });
    });
  });

  describe('lockHouse & unlockHouse', () => {
    it('should lock a DB house and create AuditLog', async () => {
      const validUuid = '12345678-1234-4234-8234-123456789abc';
      mockPrismaService.boardingHouse.findUnique.mockResolvedValue({ id: validUuid, name: 'House DB' });

      const res = await service.lockHouse(validUuid, 'Fire code violation', 'admin-user-1');
      expect(res.success).toBe(true);
      expect(mockPrismaService.boardingHouse.update).toHaveBeenCalledWith({
        where: { id: validUuid },
        data: { status: BoardingHouseStatus.banned },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditLogAction.update,
          entityType: 'BOARDING_HOUSE',
          entityId: validUuid,
          userId: 'admin-user-1',
        }),
      });
    });

    it('should throw NotFoundException if house does not exist when locking', async () => {
      mockPrismaService.boardingHouse.findUnique.mockResolvedValue(null);

      await expect(service.lockHouse('non-existent-id', 'some reason')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should unlock a DB house and create AuditLog', async () => {
      const validUuid = '12345678-1234-4234-8234-123456789abc';
      mockPrismaService.boardingHouse.findUnique.mockResolvedValue({ id: validUuid, name: 'House DB' });

      const res = await service.unlockHouse(validUuid, 'admin-user-1');
      expect(res.success).toBe(true);
      expect(mockPrismaService.boardingHouse.update).toHaveBeenCalledWith({
        where: { id: validUuid },
        data: { status: BoardingHouseStatus.active },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditLogAction.update,
          entityType: 'BOARDING_HOUSE',
          entityId: validUuid,
          userId: 'admin-user-1',
        }),
      });
    });
  });
});
