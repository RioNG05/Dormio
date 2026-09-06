import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, RoomStatus, SubscriptionPackage } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  let service: RoomsService;

  const mockTx = {
    room: {
      create: jest.fn(),
    },
  };

  const mockPrisma = {
    roomType: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    userSubscription: {
      findFirst: jest.fn(),
    },
    subscriptionPlan: {
      findUnique: jest.fn(),
    },
    room: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const landlordId = 'user-uuid-1';
  const boardingHouseId = 'bh-uuid-1';
  const roomTypeId = 'rt-uuid-1';
  const serviceId1 = 'srv-uuid-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(mockTx));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  describe('bulkGenerateRooms', () => {
    const dto = {
      floorCount: 2,
      roomsPerFloor: 2,
      nameFormat: 'P{floor}0{index}',
      area: 25.5,
      maxOccupants: 2,
      roomTypeId,
      serviceIds: [serviceId1],
    };

    it('generates rooms successfully in transaction when all checks pass', async () => {
      mockPrisma.roomType.findFirst.mockResolvedValue({ id: roomTypeId, name: 'Standard' });
      mockPrisma.service.findMany.mockResolvedValue([{ id: serviceId1 }]);
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 50, planName: SubscriptionPackage.plus },
      });
      mockPrisma.room.count.mockResolvedValue(0);
      mockPrisma.room.findMany.mockResolvedValue([]); // No existing collisions

      mockTx.room.create.mockImplementation(({ data }) => ({
        id: `room-${data.roomNumber}`,
        boardingHouseId: data.boardingHouseId,
        roomNumber: data.roomNumber,
        floor: data.floor,
        area: data.area,
        maxOccupants: data.maxOccupants,
        status: RoomStatus.available,
        image_url: null,
        roomType: { id: roomTypeId, name: 'Standard', description: null },
        roomServices: [
          {
            service: {
              id: serviceId1,
              name: 'Electricity',
              price: new Prisma.Decimal('3500.00'),
              unit: 'kWh',
              isMetered: true,
            },
          },
        ],
        createdAt: new Date('2026-09-05T00:00:00.000Z'),
        updatedAt: null,
      }));

      const result = await service.bulkGenerateRooms(landlordId, boardingHouseId, dto);

      expect(mockPrisma.roomType.findFirst).toHaveBeenCalledWith({
        where: { id: roomTypeId, boardingHouseId },
      });
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: { id: { in: [serviceId1] }, boardingHouseId },
        select: { id: true },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.room.create).toHaveBeenCalledTimes(4); // 2 floors * 2 rooms
      expect(result.success).toBe(true);
      expect(result.count).toBe(4);
      expect(result.data.map((r) => r.roomNumber)).toEqual(['P101', 'P102', 'P201', 'P202']);
    });

    it('throws NotFoundException when roomTypeId does not belong to property', async () => {
      mockPrisma.roomType.findFirst.mockResolvedValue(null);

      await expect(
        service.bulkGenerateRooms(landlordId, boardingHouseId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when serviceIds do not belong to property', async () => {
      mockPrisma.roomType.findFirst.mockResolvedValue({ id: roomTypeId });
      mockPrisma.service.findMany.mockResolvedValue([]); // Service not found

      await expect(
        service.bulkGenerateRooms(landlordId, boardingHouseId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when subscription maxRoom limit is exceeded (custom plan)', async () => {
      mockPrisma.roomType.findFirst.mockResolvedValue({ id: roomTypeId });
      mockPrisma.service.findMany.mockResolvedValue([{ id: serviceId1 }]);
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 10, planName: SubscriptionPackage.free },
      });
      mockPrisma.room.count.mockResolvedValue(8); // 8 + 4 = 12 > 10

      await expect(
        service.bulkGenerateRooms(landlordId, boardingHouseId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('falls back to free plan (10 rooms) when no active subscription row exists', async () => {
      mockPrisma.roomType.findFirst.mockResolvedValue({ id: roomTypeId });
      mockPrisma.service.findMany.mockResolvedValue([{ id: serviceId1 }]);
      mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({ maxRoom: 10 });
      mockPrisma.room.count.mockResolvedValue(9); // 9 + 4 = 13 > 10

      await expect(
        service.bulkGenerateRooms(landlordId, boardingHouseId, dto),
      ).rejects.toThrow(/allows a maximum of 10 rooms/i);
    });

    it('throws ConflictException when room numbers collide with existing rooms in database', async () => {
      mockPrisma.roomType.findFirst.mockResolvedValue({ id: roomTypeId });
      mockPrisma.service.findMany.mockResolvedValue([{ id: serviceId1 }]);
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 50 },
      });
      mockPrisma.room.count.mockResolvedValue(0);
      mockPrisma.room.findMany.mockResolvedValue([{ roomNumber: 'P101' }]); // Collision

      await expect(
        service.bulkGenerateRooms(landlordId, boardingHouseId, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when template generates duplicate numbers in same batch', async () => {
      mockPrisma.roomType.findFirst.mockResolvedValue({ id: roomTypeId });
      mockPrisma.service.findMany.mockResolvedValue([{ id: serviceId1 }]);
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 50 },
      });
      mockPrisma.room.count.mockResolvedValue(0);

      const badDto = {
        ...dto,
        nameFormat: 'Room-Fixed', // No index or floor token, causes duplicates
      };

      await expect(
        service.bulkGenerateRooms(landlordId, boardingHouseId, badDto),
      ).rejects.toThrow(/duplicate room number/i);
    });
  });

  describe('getRoomMetadata', () => {
    it('returns room types, services, plan cap, and current room count', async () => {
      mockPrisma.roomType.findMany.mockResolvedValue([{ id: 'rt-1', name: 'Studio', description: null }]);
      mockPrisma.service.findMany.mockResolvedValue([
        { id: 'srv-1', name: 'Water', price: new Prisma.Decimal('25000.00'), unit: 'm³', isMetered: true },
      ]);
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 20 },
      });
      mockPrisma.room.count.mockResolvedValue(5);

      const meta = await service.getRoomMetadata(landlordId, boardingHouseId);

      expect(meta.roomTypes).toHaveLength(1);
      expect(meta.services).toHaveLength(1);
      expect(meta.maxRoom).toBe(20);
      expect(meta.currentRoomCount).toBe(5);
    });
  });

  describe('getRooms', () => {
    it('returns paginated rooms with total count', async () => {
      mockPrisma.room.count.mockResolvedValue(1);
      mockPrisma.room.findMany.mockResolvedValue([
        {
          id: 'room-1',
          boardingHouseId,
          roomNumber: '101',
          floor: 1,
          area: new Prisma.Decimal('20.0'),
          maxOccupants: 2,
          status: RoomStatus.available,
          image_url: null,
          roomType: { id: 'rt-1', name: 'Standard', description: null },
          roomServices: [],
          createdAt: new Date('2026-09-05T00:00:00.000Z'),
          updatedAt: null,
        },
      ]);

      const result = await service.getRooms(boardingHouseId, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('updateRoom', () => {
    it('updates room when room exists and no collision', async () => {
      mockPrisma.room.findFirst
        .mockResolvedValueOnce({ id: 'room-1', roomNumber: '101', boardingHouseId }) // Existing
        .mockResolvedValueOnce(null); // No collision on new number
      mockPrisma.room.update.mockResolvedValue({
        id: 'room-1',
        boardingHouseId,
        roomNumber: '102',
        floor: 1,
        area: new Prisma.Decimal('25.0'),
        maxOccupants: 2,
        status: RoomStatus.available,
        image_url: null,
        roomType: { id: 'rt-1', name: 'Standard', description: null },
        roomServices: [],
        createdAt: new Date('2026-09-05T00:00:00.000Z'),
        updatedAt: new Date('2026-09-05T00:00:00.000Z'),
      });

      const updated = await service.updateRoom(boardingHouseId, 'room-1', { roomNumber: '102' });
      expect(updated.roomNumber).toBe('102');
    });

    it('throws NotFoundException if room does not exist', async () => {
      mockPrisma.room.findFirst.mockResolvedValue(null);
      await expect(
        service.updateRoom(boardingHouseId, 'room-x', { roomNumber: '102' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if updated room number collides with another room', async () => {
      mockPrisma.room.findFirst
        .mockResolvedValueOnce({ id: 'room-1', roomNumber: '101', boardingHouseId })
        .mockResolvedValueOnce({ id: 'room-2', roomNumber: '102' }); // Collision

      await expect(
        service.updateRoom(boardingHouseId, 'room-1', { roomNumber: '102' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
