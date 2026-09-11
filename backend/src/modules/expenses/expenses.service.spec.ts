import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma';

describe('ExpensesService', () => {
  let service: ExpensesService;

  const mockLandlordId = 'landlord-uuid-1';
  const mockBoardingHouseId = 'bh-uuid-1';
  const mockRoomId = 'room-uuid-101';

  const mockExpense = {
    id: 'exp-uuid-1',
    boardingHouseId: mockBoardingHouseId,
    roomId: null,
    name: 'Bảo trì thang máy định kỳ',
    description: 'Bảo dưỡng hệ thống cáp thang máy.',
    category: 'Bảo trì & Sửa chữa',
    amount: new Prisma.Decimal(1500000),
    status: 'paid',
    paidAt: new Date('2026-08-15'),
    createdAt: new Date('2026-08-15'),
    room: null,
  };

  const mockPrisma = {
    expense: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    room: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExpense', () => {
    it('should create a property-wide expense successfully when roomId is omitted', async () => {
      mockPrisma.expense.create.mockResolvedValue(mockExpense);

      const result = await service.createExpense(mockLandlordId, mockBoardingHouseId, {
        name: 'Bảo trì thang máy định kỳ',
        category: 'Bảo trì & Sửa chữa',
        amount: 1500000,
        paidAt: '2026-08-15T00:00:00.000Z',
        description: 'Bảo dưỡng hệ thống cáp thang máy.',
        status: 'paid',
      });

      expect(result.id).toBe('exp-uuid-1');
      expect(result.name).toBe('Bảo trì thang máy định kỳ');
      expect(result.roomName).toBe('Toàn tòa nhà');
      expect(result.amount).toBe(1500000);
      expect(mockPrisma.room.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.expense.create).toHaveBeenCalled();
    });

    it('should create a room-specific expense when valid roomId is provided', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({ id: mockRoomId, boardingHouseId: mockBoardingHouseId });
      mockPrisma.expense.create.mockResolvedValue({
        ...mockExpense,
        roomId: mockRoomId,
        room: { id: mockRoomId, roomNumber: '101' },
      });

      const result = await service.createExpense(mockLandlordId, mockBoardingHouseId, {
        name: 'Sửa điều hòa phòng 101',
        category: 'Bảo trì & Sửa chữa',
        amount: 450000,
        paidAt: '2026-08-18T00:00:00.000Z',
        roomId: mockRoomId,
      });

      expect(result.roomId).toBe(mockRoomId);
      expect(result.roomName).toBe('Phòng 101');
      expect(mockPrisma.room.findFirst).toHaveBeenCalledWith({
        where: { id: mockRoomId, boardingHouseId: mockBoardingHouseId },
      });
    });

    it('should throw BadRequestException if roomId does not belong to boarding house', async () => {
      mockPrisma.room.findFirst.mockResolvedValue(null);

      await expect(
        service.createExpense(mockLandlordId, mockBoardingHouseId, {
          name: 'Khoản chi không hợp lệ',
          category: 'Chi phí khác',
          amount: 100000,
          paidAt: '2026-08-18T00:00:00.000Z',
          roomId: 'invalid-room-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getExpenses', () => {
    it('should return paginated expenses with summary metrics', async () => {
      const mockItems = [
        mockExpense,
        {
          ...mockExpense,
          id: 'exp-uuid-2',
          amount: new Prisma.Decimal(500000),
          status: 'pending',
          paidAt: new Date('2026-08-20'),
        },
      ];

      mockPrisma.expense.findMany
        .mockResolvedValueOnce([
          { id: 'exp-1', amount: new Prisma.Decimal(1500000), status: 'paid' },
          { id: 'exp-2', amount: new Prisma.Decimal(500000), status: 'pending' },
        ]) // period summary query
        .mockResolvedValueOnce(mockItems); // paginated query

      mockPrisma.expense.count.mockResolvedValue(2);

      const result = await service.getExpenses(
        mockBoardingHouseId,
        { page: 1, limit: 6, category: 'all', status: 'all' },
        mockLandlordId,
      );

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(2);
      expect(result.summary.totalAmount).toBe(2000000);
      expect(result.summary.paidAmount).toBe(1500000);
      expect(result.summary.pendingAmount).toBe(500000);
      expect(result.summary.totalCount).toBe(2);
    });

    it('should filter by room scope "property_wide"', async () => {
      mockPrisma.expense.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.expense.count.mockResolvedValue(0);

      await service.getExpenses(
        mockBoardingHouseId,
        { roomId: 'property_wide' },
        mockLandlordId,
      );

      expect(mockPrisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roomId: null,
          }),
        }),
      );
    });
  });

  describe('getExpenseDetail', () => {
    it('should return expense detail when found', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(mockExpense);

      const result = await service.getExpenseDetail(mockBoardingHouseId, 'exp-uuid-1');
      expect(result.id).toBe('exp-uuid-1');
      expect(result.name).toBe(mockExpense.name);
    });

    it('should throw NotFoundException when expense does not exist', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(
        service.getExpenseDetail(mockBoardingHouseId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateExpense', () => {
    it('should update expense successfully', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(mockExpense);
      mockPrisma.expense.update.mockResolvedValue({
        ...mockExpense,
        name: 'Tên chi phí mới',
        amount: new Prisma.Decimal(2000000),
      });

      const result = await service.updateExpense(
        mockBoardingHouseId,
        'exp-uuid-1',
        { name: 'Tên chi phí mới', amount: 2000000 },
        mockLandlordId,
      );

      expect(result.name).toBe('Tên chi phí mới');
      expect(result.amount).toBe(2000000);
    });

    it('should throw NotFoundException if expense does not exist', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(
        service.updateExpense(
          mockBoardingHouseId,
          'non-existent-id',
          { name: 'Updated' },
          mockLandlordId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense successfully', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(mockExpense);
      mockPrisma.expense.delete.mockResolvedValue(mockExpense);

      const result = await service.deleteExpense(
        mockBoardingHouseId,
        'exp-uuid-1',
        mockLandlordId,
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.expense.delete).toHaveBeenCalledWith({
        where: { id: 'exp-uuid-1' },
      });
    });

    it('should throw NotFoundException if expense to delete not found', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteExpense(mockBoardingHouseId, 'non-existent', mockLandlordId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
