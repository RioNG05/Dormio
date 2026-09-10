import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContractStatus, Prisma, RoomStatus, SubscriptionPackage } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  let service: RoomsService;

  const mockTx = {
    room: {
      create: jest.fn(),
      update: jest.fn(),
    },
    roomService: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
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
    roomService: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
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

  describe('createRoom', () => {
    const createDto = {
      roomNumber: '101',
      floor: 1,
      roomTypeId,
      area: 25.5,
      maxOccupants: 2,
      status: RoomStatus.available,
    };

    it('creates a single room successfully and auto-attaches active autoApplied services when serviceIds is not provided', async () => {
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 10, planName: SubscriptionPackage.free },
      });
      mockPrisma.room.count.mockResolvedValue(2);
      mockPrisma.roomType.findFirst.mockResolvedValue({ id: roomTypeId, name: 'Studio' });
      mockPrisma.room.findFirst.mockResolvedValue(null); // No collision
      mockPrisma.service.findMany.mockResolvedValue([{ id: serviceId1 }]); // Auto-applied active services

      mockTx.room.create.mockResolvedValue({
        id: 'room-new-1',
        boardingHouseId,
        roomNumber: '101',
        floor: 1,
        area: new Prisma.Decimal('25.5'),
        maxOccupants: 2,
        status: RoomStatus.available,
        image_url: null,
        roomType: { id: roomTypeId, name: 'Studio', description: null },
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
        createdAt: new Date('2026-09-07T00:00:00.000Z'),
        updatedAt: null,
      });

      const result = await service.createRoom(landlordId, boardingHouseId, createDto);

      expect(result.id).toBe('room-new-1');
      expect(result.roomNumber).toBe('101');
      expect(result.services).toHaveLength(1);
      expect(mockTx.room.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roomNumber: '101',
            floor: 1,
            roomTypeId,
            roomServices: {
              create: [{ serviceId: serviceId1 }],
            },
          }),
        }),
      );
    });

    it('creates a single room with specified serviceIds when provided', async () => {
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 10 },
      });
      mockPrisma.room.count.mockResolvedValue(2);
      mockPrisma.roomType.findFirst.mockResolvedValue({ id: roomTypeId, name: 'Studio' });
      mockPrisma.room.findFirst.mockResolvedValue(null);
      mockPrisma.service.findMany.mockResolvedValue([{ id: serviceId1 }]); // Valid service check

      mockTx.room.create.mockResolvedValue({
        id: 'room-new-2',
        boardingHouseId,
        roomNumber: '102',
        floor: 1,
        area: new Prisma.Decimal('25.5'),
        maxOccupants: 2,
        status: RoomStatus.available,
        image_url: 'https://example.com/photo.jpg',
        roomType: { id: roomTypeId, name: 'Studio', description: null },
        roomServices: [],
        createdAt: new Date('2026-09-07T00:00:00.000Z'),
        updatedAt: null,
      });

      const result = await service.createRoom(landlordId, boardingHouseId, {
        ...createDto,
        roomNumber: '102',
        imageUrl: 'https://example.com/photo.jpg',
        serviceIds: [serviceId1],
      });

      expect(result.roomNumber).toBe('102');
      expect(result.imageUrl).toBe('https://example.com/photo.jpg');
    });

    it('throws BadRequestException when room creation would exceed subscription quota', async () => {
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 5 },
      });
      mockPrisma.room.count.mockResolvedValue(5); // Already at 5/5

      await expect(
        service.createRoom(landlordId, boardingHouseId, createDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when roomTypeId does not exist for the property', async () => {
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 10 },
      });
      mockPrisma.room.count.mockResolvedValue(0);
      mockPrisma.roomType.findFirst.mockResolvedValue(null); // Not found

      await expect(
        service.createRoom(landlordId, boardingHouseId, createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when roomNumber already exists in the boarding house', async () => {
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 10 },
      });
      mockPrisma.room.count.mockResolvedValue(1);
      mockPrisma.roomType.findFirst.mockResolvedValue({ id: roomTypeId });
      mockPrisma.room.findFirst.mockResolvedValue({ id: 'existing-room', roomNumber: '101' });

      await expect(
        service.createRoom(landlordId, boardingHouseId, createDto),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when selected serviceIds do not belong to the property', async () => {
      mockPrisma.userSubscription.findFirst.mockResolvedValue({
        subscriptionPlan: { maxRoom: 10 },
      });
      mockPrisma.room.count.mockResolvedValue(1);
      mockPrisma.roomType.findFirst.mockResolvedValue({ id: roomTypeId });
      mockPrisma.room.findFirst.mockResolvedValue(null);
      mockPrisma.service.findMany.mockResolvedValue([]); // 0 of 1 valid

      await expect(
        service.createRoom(landlordId, boardingHouseId, {
          ...createDto,
          serviceIds: ['foreign-srv-id'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRoomById', () => {
    it('returns room when found', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({
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
      });

      const result = await service.getRoomById(boardingHouseId, 'room-1');
      expect(result.id).toBe('room-1');
      expect(result.roomNumber).toBe('101');
    });

    it('throws NotFoundException when room does not exist in the boarding house', async () => {
      mockPrisma.room.findFirst.mockResolvedValue(null);

      await expect(service.getRoomById(boardingHouseId, 'unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRoom', () => {
    it('updates room when room exists and no collision', async () => {
      mockPrisma.room.findFirst
        .mockResolvedValueOnce({ id: 'room-1', roomNumber: '101', boardingHouseId }) // Existing
        .mockResolvedValueOnce(null); // No collision on new number
      mockTx.room.update.mockResolvedValue({
        id: 'room-1',
        boardingHouseId,
        roomNumber: '102',
        floor: 1,
        area: new Prisma.Decimal('25.0'),
        maxOccupants: 2,
        status: RoomStatus.available,
        image_url: 'https://example.com/updated.jpg',
        roomType: { id: 'rt-1', name: 'Standard', description: null },
        roomServices: [],
        createdAt: new Date('2026-09-05T00:00:00.000Z'),
        updatedAt: new Date('2026-09-05T00:00:00.000Z'),
      });

      const updated = await service.updateRoom(boardingHouseId, 'room-1', {
        roomNumber: '102',
        imageUrl: 'https://example.com/updated.jpg',
      });
      expect(updated.roomNumber).toBe('102');
      expect(updated.imageUrl).toBe('https://example.com/updated.jpg');
    });

    it('synchronizes services when serviceIds is provided', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({
        id: 'room-1',
        roomNumber: '101',
        boardingHouseId,
      });
      mockPrisma.service.findMany.mockResolvedValue([{ id: 'srv-2' }]);
      mockTx.roomService.findMany.mockResolvedValue([
        { id: 'rs-1', serviceId: 'srv-1' }, // Old service to be removed
      ]);
      mockTx.roomService.deleteMany.mockResolvedValue({ count: 1 });
      mockTx.roomService.createMany.mockResolvedValue({ count: 1 });
      mockTx.room.update.mockResolvedValue({
        id: 'room-1',
        boardingHouseId,
        roomNumber: '101',
        floor: 1,
        area: new Prisma.Decimal('25.0'),
        maxOccupants: 2,
        status: RoomStatus.available,
        image_url: null,
        roomType: { id: 'rt-1', name: 'Standard', description: null },
        roomServices: [
          {
            service: {
              id: 'srv-2',
              name: 'New Service',
              price: new Prisma.Decimal('50000.00'),
              unit: 'month',
              isMetered: false,
            },
          },
        ],
        createdAt: new Date('2026-09-05T00:00:00.000Z'),
        updatedAt: new Date('2026-09-05T00:00:00.000Z'),
      });

      const updated = await service.updateRoom(boardingHouseId, 'room-1', {
        serviceIds: ['srv-2'],
      });

      expect(mockTx.roomService.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['rs-1'] } },
      });
      expect(mockTx.roomService.createMany).toHaveBeenCalledWith({
        data: [{ roomId: 'room-1', serviceId: 'srv-2' }],
      });
      expect(updated.services).toHaveLength(1);
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

  describe('getRoomDashboard', () => {
    const roomId = 'room-uuid-1';

    it('throws NotFoundException when room does not exist in property', async () => {
      mockPrisma.room.findFirst.mockResolvedValue(null);

      await expect(service.getRoomDashboard(boardingHouseId, roomId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.room.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: roomId, boardingHouseId },
        }),
      );
    });

    it('returns full aggregated dashboard when room is occupied with active contract and tenants', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({
        id: roomId,
        boardingHouseId,
        roomNumber: '101',
        floor: 1,
        area: new Prisma.Decimal('28.5'),
        maxOccupants: 2,
        status: RoomStatus.occupied,
        image_url: 'https://example.com/room101.jpg',
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        updatedAt: null,
        roomType: {
          id: 'rt-1',
          name: 'Studio Master',
          description: 'With balcony',
        },
        roomServices: [
          {
            service: {
              id: 'srv-1',
              name: 'Electricity',
              price: new Prisma.Decimal('3500.00'),
              unit: 'kWh',
              isMetered: true,
            },
          },
        ],
        contracts: [
          {
            id: 'contract-1',
            startDate: new Date('2026-09-01T00:00:00.000Z'),
            endDate: new Date('2027-09-01T00:00:00.000Z'),
            rentPrice: new Prisma.Decimal('3500000.00'),
            monthlyPaymentDate: 5,
            status: ContractStatus.active,
            note: 'Monthly rent on 5th',
            deposit: {
              id: 'dep-1',
              amount: new Prisma.Decimal('3500000.00'),
              status: 'active',
              type: 'room_deposit',
            },
            tenantContracts: [
              {
                isPrimary: true,
                tenant: {
                  id: 'tenant-1',
                  username: 'annguyen',
                  phoneNumber: '0912345678',
                  email: 'an@example.com',
                  avatarUrl: null,
                  userIdentification: {
                    fullName: 'Nguyen Van An',
                    identityNumber: '079201009999',
                    dateOfBirth: new Date('1998-05-12T00:00:00.000Z'),
                    gender: 'male',
                  },
                },
              },
            ],
            contractDocuments: [
              {
                id: 'doc-1',
                url: 'https://storage.example.com/contract-1.pdf',
                createdAt: new Date('2026-09-01T00:00:00.000Z'),
              },
            ],
          },
        ],
        invoices: [
          {
            id: 'inv-1',
            totalAmount: new Prisma.Decimal('3850000.00'),
            status: 'paid',
            dueDate: new Date('2026-09-10T00:00:00.000Z'),
            createdAt: new Date('2026-09-01T00:00:00.000Z'),
            payment: {
              status: 'completed',
              method: 'bank_transfer',
            },
          },
        ],
        meterReadings: [
          {
            id: 'mr-1',
            serviceId: 'srv-1',
            readingValue: new Prisma.Decimal('1240.50'),
            imageUrl: 'https://example.com/meter.jpg',
            createdAt: new Date('2026-09-01T00:00:00.000Z'),
            service: {
              name: 'Electricity',
            },
          },
        ],
      });

      const result = await service.getRoomDashboard(boardingHouseId, roomId);

      expect(result.room.id).toBe(roomId);
      expect(result.room.roomNumber).toBe('101');
      expect(result.room.roomType.name).toBe('Studio Master');
      expect(result.services).toHaveLength(1);
      expect(result.currentContract).not.toBeNull();
      expect(result.currentContract?.rentPrice).toBe('3500000');
      expect(result.currentContract?.tenants).toHaveLength(1);
      expect(result.currentContract?.tenants[0].fullName).toBe('Nguyen Van An');
      expect(result.currentContract?.tenants[0].hasIdentification).toBe(true);
      expect(result.rentalHistory).toHaveLength(1);
      expect(result.rentalHistory[0].primaryTenantName).toBe('Nguyen Van An');
      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].totalAmount).toBe('3850000');
      expect(result.meterReadings).toHaveLength(1);
      expect(result.meterReadings[0].serviceName).toBe('Electricity');
    });

    it('returns clean aggregate with currentContract: null when room is vacant', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({
        id: roomId,
        boardingHouseId,
        roomNumber: '102',
        floor: 1,
        area: new Prisma.Decimal('20.0'),
        maxOccupants: 2,
        status: RoomStatus.available,
        image_url: null,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        updatedAt: null,
        roomType: {
          id: 'rt-1',
          name: 'Standard Room',
          description: null,
        },
        roomServices: [],
        contracts: [],
        invoices: [],
        meterReadings: [],
      });

      const result = await service.getRoomDashboard(boardingHouseId, roomId);

      expect(result.room.id).toBe(roomId);
      expect(result.room.status).toBe(RoomStatus.available);
      expect(result.currentContract).toBeNull();
      expect(result.rentalHistory).toEqual([]);
      expect(result.invoices).toEqual([]);
      expect(result.meterReadings).toEqual([]);
    });
  });
});
