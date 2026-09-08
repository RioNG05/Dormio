import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockUserId = 'user-tenant-uuid-1';
  const mockInvoiceId = 'inv-uuid-1';
  const mockContractId = 'contract-uuid-1';
  const mockRoomId = 'room-uuid-1';
  const mockBoardingHouseId = 'bh-uuid-1';

  const mockInvoice = {
    id: mockInvoiceId,
    contractId: mockContractId,
    roomId: mockRoomId,
    totalAmount: 5200000,
    status: 'unpaid',
    dueDate: new Date('2026-09-05'),
    createdAt: new Date('2026-08-31'),
    payment: null,
    contract: {
      id: mockContractId,
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
      tenantContracts: [
        {
          id: 'tc-1',
          tenantId: mockUserId,
          contractId: mockContractId,
          isPrimary: true,
        },
      ],
    },
  };

  const mockPayment = {
    id: 'pay-uuid-1',
    invoiceId: mockInvoiceId,
    payerId: mockUserId,
    type: 'charge',
    amount: 5200000,
    method: 'banking',
    status: 'success',
    transactionRef: 'MB9823471029',
    receiptNumber: 'REC-202609-1234',
    paidAt: new Date('2026-09-01T08:30:00.000Z'),
  };

  const mockPrisma = {
    boardingHouse: {
      findUnique: jest.fn(),
    },
    invoice: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVietQrInstruction', () => {
    it('should throw NotFoundException when invoice does not exist', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(
        service.getVietQrInstruction(mockUserId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not party to the contract', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...mockInvoice,
        contract: {
          ...mockInvoice.contract,
          tenantContracts: [{ tenantId: 'other-user-uuid' }],
        },
      });

      await expect(
        service.getVietQrInstruction(mockUserId, mockInvoiceId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should generate locked VietQR instruction properly', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await service.getVietQrInstruction(
        mockUserId,
        mockInvoiceId,
      );

      expect(result.invoiceId).toBe(mockInvoiceId);
      expect(result.amount).toBe(5200000);
      expect(result.bankCode).toBe('970422');
      expect(result.accountNumber).toBe('0912345678');
      expect(result.roomNumber).toBe('101');
      expect(result.transferSyntax).toContain('TT TRO P101');
      expect(result.qrCodeUrl).toContain('vietqr.io');
    });
  });

  describe('confirmInvoicePayment', () => {
    it('should return existing payment if already marked paid (idempotency)', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...mockInvoice,
        status: 'paid',
        payment: mockPayment,
      });

      const result = await service.confirmInvoicePayment(mockUserId, {
        invoiceId: mockInvoiceId,
      });

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('pay-uuid-1');
      expect(result.invoiceStatus).toBe('paid');
    });

    it('should create payment and update invoice status to paid in transaction', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue(mockPayment);
      mockPrisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: 'paid',
      });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.confirmInvoicePayment(mockUserId, {
        invoiceId: mockInvoiceId,
        transactionRef: 'MB9823471029',
      });

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('pay-uuid-1');
      expect(result.invoiceStatus).toBe('paid');
      expect(result.receiptNumber).toBeDefined();
    });
  });

  describe('handleVietQrWebhook', () => {
    it('should deduplicate if transactionRef was already processed', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await service.handleVietQrWebhook({
        transactionRef: 'MB9823471029',
        amount: 5200000,
        transferContent: 'TT TRO P101 T09/2026',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('already processed');
    });
  });

  describe('getLandlordPayments (UC-L-07)', () => {
    const mockLandlordId = 'landlord-uuid-1';

    it('should throw ForbiddenException if boarding house does not belong to landlord', async () => {
      mockPrisma.boardingHouse.findUnique.mockResolvedValue({
        id: mockBoardingHouseId,
        landlordId: 'other-landlord-uuid',
      });

      await expect(
        service.getLandlordPayments(
          mockBoardingHouseId,
          { page: 1, limit: 10 },
          mockLandlordId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should query payments with joined invoice, invoiceItem, and meter readings', async () => {
      mockPrisma.boardingHouse.findUnique.mockResolvedValue({
        id: mockBoardingHouseId,
        landlordId: mockLandlordId,
      });

      const fullPayment = {
        ...mockPayment,
        payer: {
          id: mockUserId,
          username: 'nguyenvana',
          phoneNumber: '0988123456',
          userIdentification: {
            fullName: 'Nguyễn Văn A',
          },
        },
        invoice: {
          ...mockInvoice,
          room: {
            id: mockRoomId,
            roomNumber: '101',
            roomType: { name: 'Studio' },
          },
          invoiceItems: [
            {
              id: 'item-1',
              serviceId: null,
              service: null,
              quantity: 1,
              unitPrice: 3500000,
              amount: 3500000,
            },
          ],
          meterReadings: [
            {
              id: 'mr-1',
              serviceId: 'srv-elec',
              service: { name: 'Điện' },
              readingValue: 125,
              imageUrl: 'https://cloudinary.com/meter1.jpg',
              createdAt: new Date('2026-09-01'),
            },
          ],
        },
      };

      mockPrisma.payment.findMany
        .mockResolvedValueOnce([
          { amount: 5200000, method: 'banking' },
          { amount: 1500000, method: 'cash' },
        ])
        .mockResolvedValueOnce([fullPayment]);

      const result = await service.getLandlordPayments(
        mockBoardingHouseId,
        { page: 1, limit: 10, method: 'all' },
        mockLandlordId,
      );

      expect(result.summary.totalRevenue).toBe(6700000);
      expect(result.summary.totalTransactions).toBe(2);
      expect(result.summary.bankingRevenue).toBe(5200000);
      expect(result.summary.cashRevenue).toBe(1500000);
      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].payerName).toBe('Nguyễn Văn A');
      expect(result.payments[0].meterReadings).toHaveLength(1);
      expect(result.payments[0].meterReadings[0].imageUrl).toBe(
        'https://cloudinary.com/meter1.jpg',
      );
    });
  });

  describe('getLandlordPaymentDetail (UC-L-07)', () => {
    const mockLandlordId = 'landlord-uuid-1';

    it('should throw NotFoundException if payment does not exist or house does not match', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.getLandlordPaymentDetail(mockBoardingHouseId, 'non-existent-pay'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return detailed payment item with receipt and items', async () => {
      const fullPayment = {
        ...mockPayment,
        payer: {
          id: mockUserId,
          username: 'nguyenvana',
          phoneNumber: '0988123456',
          userIdentification: {
            fullName: 'Nguyễn Văn A',
          },
        },
        invoice: {
          ...mockInvoice,
          room: {
            id: mockRoomId,
            roomNumber: '101',
            boardingHouseId: mockBoardingHouseId,
            roomType: { name: 'Studio' },
            boardingHouse: {
              id: mockBoardingHouseId,
              landlordId: mockLandlordId,
            },
          },
          invoiceItems: [],
          meterReadings: [],
        },
      };

      mockPrisma.payment.findUnique.mockResolvedValue(fullPayment);

      const result = await service.getLandlordPaymentDetail(
        mockBoardingHouseId,
        'pay-uuid-1',
        mockLandlordId,
      );

      expect(result.id).toBe('pay-uuid-1');
      expect(result.roomNumber).toBe('101');
      expect(result.amount).toBe(5200000);
      expect(result.receiptNumber).toBe('REC-202609-1234');
    });
  });
});
