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

  const mockPrisma = {
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
});
