import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BoardingHousesService } from './boarding-houses.service';

describe('BoardingHousesService - Multi-Property Reports (UC-L-24)', () => {
  let service: BoardingHousesService;

  const mockPrisma: any = {
    boardingHouse: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    room: {
      findMany: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    expense: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    contract: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    aiConversation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    aiMessage: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardingHousesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BoardingHousesService>(BoardingHousesService);
  });

  describe('getMultiPropertyOverview', () => {
    it('returns empty overview with zeros when landlord has no properties', async () => {
      mockPrisma.boardingHouse.findMany.mockResolvedValue([]);

      const result = await service.getMultiPropertyOverview('landlord-empty');

      expect(result.portfolioSummary.totalProperties).toBe(0);
      expect(result.portfolioSummary.totalRooms).toBe(0);
      expect(result.portfolioSummary.occupancyRate).toBe('0%');
      expect(result.portfolioSummary.currentMonthRevenue).toBe('0.00');
      expect(result.portfolioSummary.currentMonthExpenses).toBe('0.00');
      expect(result.portfolioSummary.netProfit).toBe('0.00');
      expect(result.propertiesBreakdown).toEqual([]);
      expect(result.revenueChart).toEqual([]);
      expect(result.occupancyChart).toEqual([]);
      expect(result.expiringContracts).toEqual([]);
    });

    it('aggregates data across multiple properties correctly', async () => {
      mockPrisma.boardingHouse.findMany.mockResolvedValue([
        {
          id: 'bh-1',
          name: 'Nhà trọ Cầu Giấy',
          address: '123 Cầu Giấy',
          city: 'Hà Nội',
          district: 'Cầu Giấy',
          ward: 'Dịch Vọng',
          houseNumber: '123',
          street: 'Cầu Giấy',
          ownerId: 'user-1',
          rooms: [
            { id: 'r-1', boardingHouseId: 'bh-1', status: 'occupied' },
            { id: 'r-2', boardingHouseId: 'bh-1', status: 'available' },
          ],
        },
        {
          id: 'bh-2',
          name: 'Nhà trọ Đống Đa',
          address: '456 Xã Đàn',
          city: 'Hà Nội',
          district: 'Đống Đa',
          ward: 'Nam Đồng',
          houseNumber: '456',
          street: 'Xã Đàn',
          ownerId: 'user-1',
          rooms: [
            { id: 'r-3', boardingHouseId: 'bh-2', status: 'occupied' },
            { id: 'r-4', boardingHouseId: 'bh-2', status: 'occupied' },
          ],
        },
      ]);

      // Portfolio-wide aggregations
      mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('30000000.00') },
      });
      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('7000000.00') },
      });
      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: { totalAmount: new Prisma.Decimal('1000000.00') },
        _count: { id: 1 },
      });
      mockPrisma.invoice.count.mockResolvedValue(12);

      // Invoices for collection status
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          totalAmount: new Prisma.Decimal('30000000.00'),
          status: 'paid',
          dueDate: new Date(),
        },
        {
          totalAmount: new Prisma.Decimal('1000000.00'),
          status: 'unpaid',
          dueDate: new Date(Date.now() + 86400000 * 5),
        },
      ]);

      // Expiring contracts
      const now = new Date();
      mockPrisma.contract.findMany.mockResolvedValue([
        {
          id: 'c-1',
          code: 'HD-001',
          boardingHouseId: 'bh-1',
          roomId: 'r-1',
          endDate: new Date(now.getTime() + 10 * 86400000),
          actualRentPrice: new Prisma.Decimal('3500000.00'),
          room: {
            roomNumber: '101',
            boardingHouse: { name: 'Nhà trọ Cầu Giấy' },
          },
          tenantContracts: [
            {
              tenant: { username: 'Nguyễn Văn A', phoneNumber: '0912345678' },
            },
          ],
        },
      ]);

      // Contract counts and payments for trends
      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.contract.count.mockResolvedValue(3);

      const result = await service.getMultiPropertyOverview('user-1');

      expect(result.portfolioSummary.totalProperties).toBe(2);
      expect(result.portfolioSummary.totalRooms).toBe(4);
      expect(result.portfolioSummary.occupiedRooms).toBe(3);
      expect(result.portfolioSummary.occupancyRate).toBe('75%');
      expect(result.portfolioSummary.currentMonthRevenue).toBe('30000000.00');
      expect(result.portfolioSummary.currentMonthExpenses).toBe('7000000.00');
      expect(result.portfolioSummary.netProfit).toBe('23000000.00');
      expect(result.portfolioSummary.unpaidDebt).toBe('1000000.00');
      expect(result.portfolioSummary.unpaidInvoicesCount).toBe(1);

      expect(result.propertiesBreakdown).toHaveLength(2);
      expect(result.propertiesBreakdown[0].id).toBe('bh-1');
      expect(result.propertiesBreakdown[0].totalRooms).toBe(2);
      expect(result.propertiesBreakdown[0].occupiedRooms).toBe(1);
      expect(result.propertiesBreakdown[0].occupancyRate).toBe('50%');

      expect(result.expiringContracts).toHaveLength(1);
      expect(result.expiringContracts[0].propertyName).toBe('Nhà trọ Cầu Giấy');
      expect(result.expiringContracts[0].room).toBe('P.101');
      expect(result.expiringContracts[0].tenant).toBe('Nguyễn Văn A');
    });
  });

  describe('generateMultiPropertyAiStrategy', () => {
    it('analyzes vacancy and returns actionable multi-property marketing strategy', async () => {
      mockPrisma.boardingHouse.findFirst = jest.fn().mockResolvedValue({
        id: 'bh-1',
        name: 'Nhà trọ Cầu Giấy',
        ownerId: 'user-1',
      });

      mockPrisma.boardingHouse.findMany.mockResolvedValue([
        {
          id: 'bh-1',
          name: 'Nhà trọ Cầu Giấy',
          address: '123 Cầu Giấy',
          city: 'Hà Nội',
          district: 'Cầu Giấy',
          ward: 'Dịch Vọng',
          houseNumber: '123',
          street: 'Cầu Giấy',
          ownerId: 'user-1',
          rooms: [
            { id: 'r-1', boardingHouseId: 'bh-1', status: 'occupied' },
            { id: 'r-2', boardingHouseId: 'bh-1', status: 'available' },
          ],
        },
      ]);

      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal('5000000.00') } });
      mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal('1000000.00') } });
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { totalAmount: new Prisma.Decimal('0.00') }, _count: { id: 0 } });
      mockPrisma.invoice.count.mockResolvedValue(1);
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.contract.findMany.mockResolvedValue([]);
      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.contract.count.mockResolvedValue(1);

      mockPrisma.aiConversation.findFirst.mockResolvedValue(null);
      mockPrisma.aiConversation.create.mockResolvedValue({ id: 'ai-conv-1', userId: 'user-1' });
      mockPrisma.aiMessage.create.mockResolvedValue({ id: 'ai-msg-1' });

      const result = await service.generateMultiPropertyAiStrategy('user-1');

      expect(result).toBeDefined();
      expect(result.title).toContain('Chiến lược tiếp thị');
      expect(result.executiveSummary).toBeDefined();
      expect(result.pricingRecommendations.length).toBeGreaterThan(0);
      expect(result.marketingCampaigns.length).toBeGreaterThan(0);
      expect(result.operationalOptimizations.length).toBeGreaterThan(0);
      expect(result.actionPlan30Days.length).toBeGreaterThan(0);
      expect(mockPrisma.aiConversation.create).toHaveBeenCalled();
      expect(mockPrisma.aiMessage.create).toHaveBeenCalledTimes(2); // user prompt + assistant response
    });
  });
});
