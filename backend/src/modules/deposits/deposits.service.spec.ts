import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  DepositStatus,
  DepositType,
  RoomStatus,
  AuditLogAction,
  Prisma,
} from '@prisma';

describe('DepositsService', () => {
  let service: DepositsService;

  const mockBoardingHouseId = 'house-uuid-1';
  const mockLandlordId = 'landlord-uuid-1';
  const mockRoomId = 'room-uuid-1';

  const mockRoom = {
    id: mockRoomId,
    boardingHouseId: mockBoardingHouseId,
    roomNumber: '102',
    status: RoomStatus.available,
    roomType: { name: 'Standard Studio' },
  };

  const transactionClient = {
    deposit: {
      create: jest.fn(),
      update: jest.fn(),
    },
    room: {
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockPrisma = {
    room: {
      findFirst: jest.fn(),
    },
    deposit: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback(transactionClient),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DepositsService>(DepositsService);
  });

  describe('createManualDeposit (UC-L-10)', () => {
    const createDto = {
      roomId: mockRoomId,
      amount: 1500000,
      tenantName: 'Trần Thị Mai',
      tenantPhone: '0977234567',
      expiryDate: '2026-09-25',
      note: 'Cọc giữ chỗ hẹn ký hợp đồng',
    };

    it('should successfully create manual deposit, update room status to deposited, and log audit', async () => {
      mockPrisma.room.findFirst.mockResolvedValue(mockRoom);
      mockPrisma.deposit.findFirst.mockResolvedValue(null); // No existing active deposit

      const createdDbDeposit = {
        id: 'deposit-uuid-1',
        roomId: mockRoomId,
        boardingHouseId: mockBoardingHouseId,
        contractId: null,
        postId: null,
        type: DepositType.contract,
        amount: new Prisma.Decimal(1500000),
        status: DepositStatus.paid,
        recordedManually: true,
        recordedBy: mockLandlordId,
        note: JSON.stringify({
          tenantName: 'Trần Thị Mai',
          tenantPhone: '0977234567',
          expiryDate: '2026-09-25',
          originalAmount: 1500000,
          note: 'Cọc giữ chỗ hẹn ký hợp đồng',
        }),
        createdAt: new Date('2026-08-15T10:00:00.000Z'),
        room: mockRoom,
        boardingHouse: { name: 'Dormio Premier Quận 1' },
      };

      transactionClient.deposit.create.mockResolvedValue(createdDbDeposit);
      transactionClient.room.update.mockResolvedValue({
        ...mockRoom,
        status: RoomStatus.deposited,
      });
      transactionClient.auditLog.create.mockResolvedValue({ id: 'audit-uuid-1' });

      const result = await service.createManualDeposit(
        mockBoardingHouseId,
        mockLandlordId,
        createDto,
        '127.0.0.1',
      );

      // Verify room check
      expect(mockPrisma.room.findFirst).toHaveBeenCalledWith({
        where: { id: mockRoomId, boardingHouseId: mockBoardingHouseId },
        include: { roomType: true },
      });

      // Verify deposit creation in transaction
      expect(transactionClient.deposit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roomId: mockRoomId,
            boardingHouseId: mockBoardingHouseId,
            contractId: null,
            postId: null,
            type: DepositType.contract,
            status: DepositStatus.paid,
            recordedManually: true,
            recordedBy: mockLandlordId,
          }),
        }),
      );

      // Verify room status update in transaction
      expect(transactionClient.room.update).toHaveBeenCalledWith({
        where: { id: mockRoomId },
        data: { status: RoomStatus.deposited },
      });

      // Verify AuditLog creation in transaction (Rule #4)
      expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditLogAction.create,
          entityType: 'DEPOSIT',
          entityId: 'deposit-uuid-1',
          boardingHouseId: mockBoardingHouseId,
          userId: mockLandlordId,
        }),
      });

      // Verify result
      expect(result.id).toBe('deposit-uuid-1');
      expect(result.amount).toBe(1500000);
      expect(result.tenantName).toBe('Trần Thị Mai');
      expect(result.tenantPhone).toBe('0977234567');
      expect(result.depositCategory).toBe('hold');
    });

    it('should throw NotFoundException if room does not exist in boarding house', async () => {
      mockPrisma.room.findFirst.mockResolvedValue(null);

      await expect(
        service.createManualDeposit(mockBoardingHouseId, mockLandlordId, createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if room is already occupied', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({
        ...mockRoom,
        status: RoomStatus.occupied,
      });

      await expect(
        service.createManualDeposit(mockBoardingHouseId, mockLandlordId, createDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if room is under maintenance', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({
        ...mockRoom,
        status: RoomStatus.maintainace,
      });

      await expect(
        service.createManualDeposit(mockBoardingHouseId, mockLandlordId, createDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if room is already deposited', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({
        ...mockRoom,
        status: RoomStatus.deposited,
      });

      await expect(
        service.createManualDeposit(mockBoardingHouseId, mockLandlordId, createDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if room already has active hold deposit', async () => {
      mockPrisma.room.findFirst.mockResolvedValue(mockRoom);
      mockPrisma.deposit.findFirst.mockResolvedValue({
        id: 'existing-deposit',
        status: DepositStatus.paid,
        contractId: null,
      });

      await expect(
        service.createManualDeposit(mockBoardingHouseId, mockLandlordId, createDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDeposits (UC-L-14)', () => {
    it('should list deposits and compute dashboard stats accurately', async () => {
      const mockDeposits = [
        {
          id: 'dep-1',
          roomId: mockRoomId,
          boardingHouseId: mockBoardingHouseId,
          contractId: null,
          postId: null,
          type: DepositType.contract,
          amount: new Prisma.Decimal(1000000),
          status: DepositStatus.paid,
          recordedManually: true,
          recordedBy: mockLandlordId,
          note: JSON.stringify({ tenantName: 'Tenant One', tenantPhone: '0912345678' }),
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
          room: { roomNumber: '101' },
          boardingHouse: { name: 'Dormio Premier Quận 1' },
        },
        {
          id: 'dep-2',
          roomId: mockRoomId,
          boardingHouseId: mockBoardingHouseId,
          contractId: 'contract-uuid-1',
          postId: null,
          type: DepositType.contract,
          amount: new Prisma.Decimal(3500000),
          status: DepositStatus.paid,
          recordedManually: true,
          recordedBy: mockLandlordId,
          note: null,
          contract: {
            tenantContracts: [{ tenant: { username: 'Contract Tenant', phoneNumber: '0988888888' } }],
          },
          createdAt: new Date('2026-08-05T00:00:00.000Z'),
          room: { roomNumber: '102' },
          boardingHouse: { name: 'Dormio Premier Quận 1' },
        },
      ];

      mockPrisma.deposit.findMany.mockResolvedValue(mockDeposits);

      const result = await service.getDeposits(mockBoardingHouseId, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.stats.totalHoldingAmount).toBe(4500000);
      expect(result.stats.totalHoldTypeAmount).toBe(1000000);
      expect(result.stats.holdTypeCountTotal).toBe(1);
      expect(result.stats.contractTypeCountTotal).toBe(1);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('refundDeposit', () => {
    it('should process refund, update room status to available for hold deposit, and write audit log', async () => {
      const mockDeposit = {
        id: 'dep-1',
        roomId: mockRoomId,
        boardingHouseId: mockBoardingHouseId,
        contractId: null,
        amount: new Prisma.Decimal(1000000),
        status: DepositStatus.paid,
        note: JSON.stringify({ tenantName: 'Tenant One', tenantPhone: '0912345678' }),
        room: { id: mockRoomId, status: RoomStatus.deposited, roomNumber: '101' },
        boardingHouse: { name: 'House 1' },
      };

      mockPrisma.deposit.findFirst.mockResolvedValue(mockDeposit);

      transactionClient.deposit.update.mockResolvedValue({
        ...mockDeposit,
        status: DepositStatus.refund,
        amount: new Prisma.Decimal(1000000),
        createdAt: new Date(),
      });
      transactionClient.room.update.mockResolvedValue({
        ...mockRoom,
        status: RoomStatus.available,
      });
      transactionClient.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.refundDeposit(
        mockBoardingHouseId,
        mockLandlordId,
        'dep-1',
        { deductedAmount: 0, note: 'Hoàn 100%' },
        '127.0.0.1',
      );

      // Verify room status reset to available
      expect(transactionClient.room.update).toHaveBeenCalledWith({
        where: { id: mockRoomId },
        data: { status: RoomStatus.available },
      });

      // Verify audit log
      expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditLogAction.update,
          entityType: 'DEPOSIT',
          entityId: 'dep-1',
        }),
      });

      expect(result.status).toBe(DepositStatus.refund);
    });

    it('should throw BadRequestException if deposit is not paid', async () => {
      mockPrisma.deposit.findFirst.mockResolvedValue({
        id: 'dep-1',
        status: DepositStatus.refund,
        room: { status: RoomStatus.available },
      });

      await expect(
        service.refundDeposit(mockBoardingHouseId, mockLandlordId, 'dep-1', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forfeitDeposit', () => {
    it('should forfeit deposit, restore room status to available, and write audit log', async () => {
      const mockDeposit = {
        id: 'dep-1',
        roomId: mockRoomId,
        boardingHouseId: mockBoardingHouseId,
        contractId: null,
        amount: new Prisma.Decimal(1000000),
        status: DepositStatus.paid,
        note: JSON.stringify({ tenantName: 'Tenant One', tenantPhone: '0912345678' }),
        room: { id: mockRoomId, status: RoomStatus.deposited, roomNumber: '101' },
        boardingHouse: { name: 'House 1' },
      };

      mockPrisma.deposit.findFirst.mockResolvedValue(mockDeposit);

      transactionClient.deposit.update.mockResolvedValue({
        ...mockDeposit,
        status: DepositStatus.forfeited,
        amount: new Prisma.Decimal(0),
        createdAt: new Date(),
      });
      transactionClient.room.update.mockResolvedValue({
        ...mockRoom,
        status: RoomStatus.available,
      });
      transactionClient.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.forfeitDeposit(
        mockBoardingHouseId,
        mockLandlordId,
        'dep-1',
        { deductionReason: 'Khách bùng cọc' },
        '127.0.0.1',
      );

      // Verify room status reset to available
      expect(transactionClient.room.update).toHaveBeenCalledWith({
        where: { id: mockRoomId },
        data: { status: RoomStatus.available },
      });

      // Verify deposit status updated
      expect(transactionClient.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DepositStatus.forfeited,
          }),
        }),
      );

      expect(result.status).toBe(DepositStatus.forfeited);
    });
  });
});
