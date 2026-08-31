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
    invoice: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
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
});
