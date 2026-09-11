import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, ServiceStatus } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: any;

  const mockBoardingHouseId = 'c0b89b43-b9dc-46d2-8bfe-ec5a7a72dcf3';
  const mockServiceId = '8f7a6344-7ff5-4e78-bc40-5494d6e9f1a2';
  const mockLandlordId = 'usr-landlord-1';

  const mockServiceEntity = {
    id: mockServiceId,
    boardingHouseId: mockBoardingHouseId,
    name: 'Điện sinh hoạt',
    price: new Prisma.Decimal(3500),
    unit: 'kWh',
    isMetered: true,
    autoApplied: true,
    status: ServiceStatus.active,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    _count: {
      roomServices: 5,
    },
  };

  beforeEach(async () => {
    prisma = {
      service: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      room: {
        findMany: jest.fn(),
      },
      roomService: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      meterReading: {
        count: jest.fn(),
      },
      invoiceItem: {
        count: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  describe('getServices', () => {
    it('should return paginated services and unpaginated summary counts', async () => {
      prisma.service.findMany
        .mockResolvedValueOnce([
          { id: '1', unit: 'kWh', isMetered: true, status: ServiceStatus.active },
          { id: '2', unit: 'phòng/tháng', isMetered: false, status: ServiceStatus.active },
          { id: '3', unit: 'xe/tháng', isMetered: false, status: ServiceStatus.inactive },
        ])
        .mockResolvedValueOnce([mockServiceEntity]);

      prisma.service.count.mockResolvedValue(1);

      const result = await service.getServices(mockBoardingHouseId, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Điện sinh hoạt');
      expect(result.items[0].appliedRoomsCount).toBe(5);
      expect(result.summary.totalServices).toBe(3);
      expect(result.summary.meteredCount).toBe(1);
      expect(result.summary.roomFixedCount).toBe(1);
      expect(result.summary.otherCount).toBe(1);
      expect(result.summary.activeCount).toBe(2);
      expect(result.summary.inactiveCount).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('createService', () => {
    it('should create a service without roomIds', async () => {
      prisma.service.create.mockResolvedValue(mockServiceEntity);

      const result = await service.createService(mockLandlordId, mockBoardingHouseId, {
        name: 'Điện sinh hoạt',
        price: 3500,
        unit: 'kWh',
        isMetered: true,
        autoApplied: true,
      });

      expect(result.name).toBe('Điện sinh hoạt');
      expect(prisma.service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Điện sinh hoạt',
            unit: 'kWh',
            isMetered: true,
          }),
        }),
      );
    });

    it('should attach rooms when roomIds are valid', async () => {
      const roomIds = ['room-1', 'room-2'];
      prisma.room.findMany.mockResolvedValue([{ id: 'room-1' }, { id: 'room-2' }]);
      prisma.service.create.mockResolvedValue(mockServiceEntity);
      prisma.roomService.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createService(mockLandlordId, mockBoardingHouseId, {
        name: 'Giữ xe máy',
        price: 120000,
        unit: 'xe/tháng',
        roomIds,
      });

      expect(result.appliedRoomsCount).toBe(2);
      expect(prisma.roomService.createMany).toHaveBeenCalledWith({
        data: [
          { roomId: 'room-1', serviceId: mockServiceId },
          { roomId: 'room-2', serviceId: mockServiceId },
        ],
      });
    });

    it('should throw NotFoundException if room does not belong to house', async () => {
      prisma.room.findMany.mockResolvedValue([{ id: 'room-1' }]);

      await expect(
        service.createService(mockLandlordId, mockBoardingHouseId, {
          name: 'Giữ xe máy',
          price: 120000,
          unit: 'xe/tháng',
          roomIds: ['room-1', 'room-foreign'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getServiceDetail', () => {
    it('should return service detail if found', async () => {
      prisma.service.findFirst.mockResolvedValue(mockServiceEntity);

      const result = await service.getServiceDetail(mockBoardingHouseId, mockServiceId);

      expect(result.id).toBe(mockServiceId);
      expect(result.name).toBe('Điện sinh hoạt');
    });

    it('should throw NotFoundException if service not found', async () => {
      prisma.service.findFirst.mockResolvedValue(null);

      await expect(
        service.getServiceDetail(mockBoardingHouseId, 'unknown-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateService', () => {
    it('should update service details', async () => {
      prisma.service.findFirst.mockResolvedValue(mockServiceEntity);
      prisma.service.update.mockResolvedValue({
        ...mockServiceEntity,
        name: 'Điện sinh hoạt (Mới)',
        price: new Prisma.Decimal(3800),
      });

      const result = await service.updateService(mockBoardingHouseId, mockServiceId, {
        name: 'Điện sinh hoạt (Mới)',
        price: 3800,
      });

      expect(result.name).toBe('Điện sinh hoạt (Mới)');
      expect(result.numericPrice).toBe(3800);
    });

    it('should throw NotFoundException if service to update does not exist', async () => {
      prisma.service.findFirst.mockResolvedValue(null);

      await expect(
        service.updateService(mockBoardingHouseId, 'unknown-id', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteService', () => {
    it('should delete service and its room attachments when no billing data exists', async () => {
      prisma.service.findFirst.mockResolvedValue(mockServiceEntity);
      prisma.meterReading.count.mockResolvedValue(0);
      prisma.invoiceItem.count.mockResolvedValue(0);
      prisma.roomService.deleteMany.mockResolvedValue({ count: 5 });
      prisma.service.delete.mockResolvedValue(mockServiceEntity);

      const result = await service.deleteService(mockBoardingHouseId, mockServiceId);

      expect(result.success).toBe(true);
      expect(prisma.roomService.deleteMany).toHaveBeenCalledWith({
        where: { serviceId: mockServiceId },
      });
      expect(prisma.service.delete).toHaveBeenCalledWith({
        where: { id: mockServiceId },
      });
    });

    it('should throw BadRequestException if service is linked to meter readings or invoices', async () => {
      prisma.service.findFirst.mockResolvedValue(mockServiceEntity);
      prisma.meterReading.count.mockResolvedValue(3);
      prisma.invoiceItem.count.mockResolvedValue(0);

      await expect(
        service.deleteService(mockBoardingHouseId, mockServiceId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getServiceRooms', () => {
    it('should return rooms assigned to this service', async () => {
      prisma.service.findFirst.mockResolvedValue(mockServiceEntity);
      prisma.roomService.findMany.mockResolvedValue([
        {
          room: {
            id: 'room-1',
            roomNumber: '101',
            floor: 1,
            status: 'occupied',
          },
        },
        {
          room: {
            id: 'room-2',
            roomNumber: '102',
            floor: 1,
            status: 'available',
          },
        },
      ]);

      const result = await service.getServiceRooms(mockBoardingHouseId, mockServiceId);

      expect(result.serviceId).toBe(mockServiceId);
      expect(result.appliedRoomsCount).toBe(2);
      expect(result.rooms[0].roomNumber).toBe('101');
      expect(result.rooms[1].roomNumber).toBe('102');
    });
  });
});
