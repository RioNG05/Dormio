import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, UserRole } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BoardingHousesService } from './boarding-houses.service';

describe('BoardingHousesService', () => {
  let service: BoardingHousesService;

  const transactionClient = {
    boardingHouse: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  const mockPrisma: any = {
    $transaction: jest.fn(),
  };

  const createDto = {
    name: ' Sunrise Residence ',
    description: ' Near the university campus ',
    country: ' Vietnam ',
    province: ' Ho Chi Minh City ',
    city: ' Thu Duc City ',
    district: ' Thu Duc District ',
    ward: ' Linh Trung Ward ',
    street: ' Vo Van Ngan Street ',
    houseNumber: ' 1 ',
    totalFloor: 5,
    builtAt: '2020-01-01',
    services: [
      { name: ' Electricity ', unit: ' kWh ', price: '3500.00', isMetered: true },
    ],
    roomTypes: [
      { name: ' Studio ', description: ' Private kitchen and bathroom ' },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback(transactionClient),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardingHousesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BoardingHousesService>(BoardingHousesService);
  });

  it('creates the property, initial services and room types, then promotes the owner in one transaction', async () => {
    transactionClient.boardingHouse.create.mockResolvedValue({
      id: 'boarding-house-1',
      ...createDto,
      description: 'Near the university campus',
      name: 'Sunrise Residence',
      country: 'Vietnam',
      province: 'Ho Chi Minh City',
      city: 'Thu Duc City',
      district: 'Thu Duc District',
      ward: 'Linh Trung Ward',
      street: 'Vo Van Ngan Street',
      houseNumber: '1',
      status: 'active',
      builtAt: new Date('2020-01-01T00:00:00.000Z'),
      services: [
        {
          id: 'service-1',
          name: 'Electricity',
          unit: 'kWh',
          price: new Prisma.Decimal('3500.00'),
          isMetered: true,
        },
      ],
      roomTypes: [
        {
          id: 'room-type-1',
          name: 'Studio',
          description: 'Private kitchen and bathroom',
        },
      ],
    });
    transactionClient.user.update.mockResolvedValue({ id: 'user-1' });

    const result = await service.createInitialProfile('user-1', createDto);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transactionClient.boardingHouse.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: 'user-1',
          name: 'Sunrise Residence',
          status: 'active',
          services: {
            create: [
              expect.objectContaining({
                name: 'Electricity',
                unit: 'kWh',
                price: new Prisma.Decimal('3500.00'),
                isMetered: true,
              }),
            ],
          },
          roomTypes: {
            create: [
              {
                name: 'Studio',
                description: 'Private kitchen and bathroom',
              },
            ],
          },
        }),
      }),
    );
    expect(transactionClient.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: UserRole.landlord },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'boarding-house-1',
        status: 'active',
        services: [
          expect.objectContaining({ price: '3500.00', isMetered: true }),
        ],
      }),
    );
  });

  it('does not promote the owner when property creation fails', async () => {
    transactionClient.boardingHouse.create.mockRejectedValue(
      new Error('Database failure'),
    );

    await expect(
      service.createInitialProfile('user-1', createDto),
    ).rejects.toThrow('Database failure');

    expect(transactionClient.user.update).not.toHaveBeenCalled();
  });

  describe('setupBoardingHouse (UC-L-01 3-step wizard)', () => {
    const setupDto = {
      name: 'Ánh Dương Setup',
      description: 'Nhà trọ sinh viên',
      houseNumber: '12',
      street: 'Nguyễn Văn Tăng',
      ward: 'Long Thạnh Mỹ',
      district: 'Quận 9',
      province: 'TP. Hồ Chí Minh',
      country: 'Việt Nam',
      totalFloor: 2,
      builtAt: '2022-05-10',
      services: [
        { name: 'Điện', price: '3500.00', unit: 'kWh', isMetered: true, autoApplied: true },
        { name: 'Nước', price: '25000.00', unit: 'm³', isMetered: true, autoApplied: true },
      ],
      roomTypes: [
        { name: 'Studio', description: 'Gác lửng' },
      ],
      rooms: {
        floorCount: 2,
        roomsPerFloor: 3,
        nameFormat: 'P{floor}0{index}',
        area: '25.00',
        maxOccupants: 2,
        roomTypeIndex: 0,
        serviceIndices: [0, 1],
      },
    };

    const txClient = {
      boardingHouse: {
        create: jest.fn(),
      },
      service: {
        create: jest.fn(),
      },
      roomType: {
        create: jest.fn(),
      },
      room: {
        create: jest.fn(),
      },
      roomService: {
        createMany: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
    };

    beforeEach(() => {
      mockPrisma.userSubscription = {
        findFirst: jest.fn().mockResolvedValue(null), // free tier default (10)
      };
      mockPrisma.$transaction.mockImplementation(async (callback) =>
        callback(txClient),
      );
    });

    it('successfully executes atomic setup: house, services, roomTypes, rooms, roomServices and user promotion', async () => {
      txClient.boardingHouse.create.mockResolvedValue({
        id: 'bh-uuid',
        name: 'Ánh Dương Setup',
        description: 'Nhà trọ sinh viên',
        houseNumber: '12',
        street: 'Nguyễn Văn Tăng',
        ward: 'Long Thạnh Mỹ',
        district: 'Quận 9',
        province: 'TP. Hồ Chí Minh',
        city: 'TP. Hồ Chí Minh',
        country: 'Việt Nam',
        totalFloor: 2,
        builtAt: new Date('2022-05-10'),
        status: 'active',
        thumbnail: null,
      });

      txClient.service.create
        .mockResolvedValueOnce({
          id: 'svc-1',
          name: 'Điện',
          price: new Prisma.Decimal('3500.00'),
          unit: 'kWh',
          isMetered: true,
          autoApplied: true,
        })
        .mockResolvedValueOnce({
          id: 'svc-2',
          name: 'Nước',
          price: new Prisma.Decimal('25000.00'),
          unit: 'm³',
          isMetered: true,
          autoApplied: true,
        });

      txClient.roomType.create.mockResolvedValue({
        id: 'rt-1',
        name: 'Studio',
        description: 'Gác lửng',
      });

      let roomCounter = 1;
      txClient.room.create.mockImplementation(() =>
        Promise.resolve({ id: `room-${roomCounter++}` }),
      );
      txClient.roomService.createMany.mockResolvedValue({ count: 2 });
      txClient.user.update.mockResolvedValue({ id: 'user-1', role: UserRole.landlord });

      const res = await service.setupBoardingHouse('user-1', setupDto);

      expect(res.success).toBe(true);
      expect(res.roomsCreated).toBe(6); // 2 floors * 3 rooms
      expect(txClient.boardingHouse.create).toHaveBeenCalled();
      expect(txClient.service.create).toHaveBeenCalledTimes(2);
      expect(txClient.roomType.create).toHaveBeenCalledTimes(1);
      expect(txClient.room.create).toHaveBeenCalledTimes(6);
      expect(txClient.roomService.createMany).toHaveBeenCalledTimes(6);
      expect(txClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: UserRole.landlord },
      });
    });

    it('rejects with 422 if room count exceeds free tier limit', async () => {
      const overLimitDto = {
        ...setupDto,
        rooms: {
          ...setupDto.rooms,
          floorCount: 3,
          roomsPerFloor: 4, // 12 rooms > 10
        },
      };

      await expect(
        service.setupBoardingHouse('user-1', overLimitDto),
      ).rejects.toThrow('Gói đăng ký hiện tại chỉ cho phép tối đa 10 phòng');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects with 400 if roomTypeIndex is out of bounds', async () => {
      const badIndexDto = {
        ...setupDto,
        rooms: {
          ...setupDto.rooms,
          roomTypeIndex: 5, // only 1 room type provided
        },
      };

      await expect(
        service.setupBoardingHouse('user-1', badIndexDto),
      ).rejects.toThrow('roomTypeIndex 5 is out of bounds');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getDashboardOverview', () => {
    it('throws NotFoundException when boarding house does not belong to user', async () => {
      mockPrisma.boardingHouse = {
        findFirst: jest.fn().mockResolvedValue(null),
      };

      await expect(
        service.getDashboardOverview('user-1', 'bh-non-existent'),
      ).rejects.toThrow('Boarding house not found or unauthorized');
    });

    it('returns aggregated metrics for a valid boarding house', async () => {
      mockPrisma.boardingHouse = {
        findFirst: jest.fn().mockResolvedValue({ id: 'bh-1', ownerId: 'user-1' }),
      };
      mockPrisma.room = {
        count: jest.fn()
          .mockResolvedValueOnce(10) // total
          .mockResolvedValueOnce(6)  // occupied
          .mockResolvedValueOnce(3)  // available
          .mockResolvedValueOnce(1)  // deposited
          .mockResolvedValueOnce(0), // maintainace
      };
      mockPrisma.payment = {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: new Prisma.Decimal('15000000.00') } }),
      };
      mockPrisma.invoice = {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { totalAmount: new Prisma.Decimal('2000000.00') },
          _count: { id: 1 },
        }),
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'inv-1',
            status: 'paid',
            totalAmount: new Prisma.Decimal('15000000.00'),
            dueDate: new Date(),
          },
          {
            id: 'inv-2',
            status: 'unpaid',
            totalAmount: new Prisma.Decimal('2000000.00'),
            dueDate: new Date(Date.now() + 86400000 * 5),
          },
        ]),
      };
      mockPrisma.contract = {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(6),
      };
      mockPrisma.deposit = {
        findMany: jest.fn().mockResolvedValue([]),
      };
      mockPrisma.grievance = {
        findMany: jest.fn().mockResolvedValue([]),
      };

      const result = await service.getDashboardOverview('user-1', 'bh-1', true);

      expect(result.rooms.totalRooms).toBe(10);
      expect(result.rooms.occupiedRooms).toBe(6);
      expect(result.rooms.occupancyRate).toBe('60%');
      expect(result.financial.unpaidDebt).toBe('2000000.00');
      expect(result.financial.unpaidInvoicesCount).toBe(1);
      expect(result.financial.paidInvoicesCount).toBe(5);
      expect(result.collectionStatus).toBeDefined();
      expect(result.collectionStatus.paidCount).toBe(1);
      expect(result.collectionStatus.unpaidCount).toBe(1);
      expect(result.occupancyChart).toBeDefined();
      expect(result.occupancyChart).toHaveLength(6);
      expect(result.depositNotifications).toEqual([]);
      expect(result.maintenanceRequests).toEqual([]);
      expect(result.expiringContracts).toEqual([]);
    });
  });
});
