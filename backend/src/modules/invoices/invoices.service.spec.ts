import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('InvoicesService', () => {
  let service: InvoicesService;

  const mockUserId = 'user-tenant-uuid-1';
  const mockContractId = 'contract-uuid-1';
  const mockRoomId = 'room-uuid-1';

  const mockContract = {
    id: mockContractId,
    roomId: mockRoomId,
    rentPrice: 4500000,
    monthlyPaymentDate: 5,
    status: 'active',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    room: {
      id: mockRoomId,
      roomNumber: '101',
      boardingHouse: {
        id: 'bh-uuid-1',
        name: 'Dormio Tân Bình',
      },
    },
  };

  const mockTenantContract = {
    id: 'tc-uuid-1',
    tenantId: mockUserId,
    contractId: mockContractId,
    isPrimary: true,
    contract: mockContract,
  };

  const mockInvoices = [
    {
      id: 'inv-1',
      contractId: mockContractId,
      roomId: mockRoomId,
      totalAmount: 5125000,
      status: 'paid',
      dueDate: new Date('2026-08-05'),
      createdAt: new Date('2026-08-01'),
      payment: {
        id: 'pay-1',
        createdAt: new Date('2026-08-04'),
      },
      invoiceItems: [
        {
          id: 'item-1',
          serviceId: null,
          quantity: 1,
          unitPrice: 4500000,
          amount: 4500000,
          service: null,
        },
        {
          id: 'item-2',
          serviceId: 'srv-elec',
          quantity: 120,
          unitPrice: 3500,
          amount: 420000,
          service: {
            id: 'srv-elec',
            name: 'Điện sinh hoạt',
            unit: 'kWh',
            isMetered: true,
          },
        },
        {
          id: 'item-3',
          serviceId: 'srv-water',
          quantity: 6,
          unitPrice: 25000,
          amount: 150000,
          service: {
            id: 'srv-water',
            name: 'Nước máy sinh hoạt',
            unit: 'm³',
            isMetered: true,
          },
        },
        {
          id: 'item-4',
          serviceId: 'srv-clean',
          quantity: 1,
          unitPrice: 55000,
          amount: 55000,
          service: {
            id: 'srv-clean',
            name: 'Vệ sinh',
            unit: 'tháng',
            isMetered: false,
          },
        },
      ],
      meterReadings: [
        {
          id: 'mr-1',
          serviceId: 'srv-elec',
          readingValue: 1250,
          imageUrl: 'https://img.com/elec.jpg',
          createdAt: new Date('2026-08-01'),
          service: {
            id: 'srv-elec',
            name: 'Điện sinh hoạt',
            unit: 'kWh',
          },
        },
      ],
    },
    {
      id: 'inv-2',
      contractId: mockContractId,
      roomId: mockRoomId,
      totalAmount: 5200000,
      status: 'unpaid',
      dueDate: new Date('2026-09-15'),
      createdAt: new Date('2026-08-31'),
      payment: null,
      invoiceItems: [
        {
          id: 'item-5',
          serviceId: null,
          quantity: 1,
          unitPrice: 4500000,
          amount: 4500000,
          service: null,
        },
        {
          id: 'item-6',
          serviceId: 'srv-elec',
          quantity: 140,
          unitPrice: 3500,
          amount: 490000,
          service: {
            id: 'srv-elec',
            name: 'Điện sinh hoạt',
            unit: 'kWh',
            isMetered: true,
          },
        },
        {
          id: 'item-7',
          serviceId: 'srv-water',
          quantity: 6,
          unitPrice: 25000,
          amount: 150000,
          service: {
            id: 'srv-water',
            name: 'Nước máy sinh hoạt',
            unit: 'm³',
            isMetered: true,
          },
        },
        {
          id: 'item-8',
          serviceId: 'srv-net',
          quantity: 1,
          unitPrice: 60000,
          amount: 60000,
          service: {
            id: 'srv-net',
            name: 'Internet',
            unit: 'tháng',
            isMetered: false,
          },
        },
      ],
      meterReadings: [],
    },
  ];

  const mockPrisma = {
    tenantContract: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    room: {
      findFirst: jest.fn(),
    },
    contract: {
      findUnique: jest.fn(),
    },
    invoiceItem: {
      create: jest.fn(),
    },
    meterReading: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveActiveTenantContract', () => {
    it('should return active contract when found', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(mockTenantContract);

      const res = await service.resolveActiveTenantContract(mockUserId);
      expect(res.id).toBe(mockContractId);
      expect(res.roomId).toBe(mockRoomId);
    });

    it('should throw NotFoundException when no active contract exists', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(null);

      await expect(
        service.resolveActiveTenantContract(mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTenantInvoices', () => {
    it('should return list of mapped invoices with line items and meter readings', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(mockTenantContract);
      mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.getTenantInvoices(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      const inv1 = result.data[0];
      expect(inv1.id).toBe('inv-1');
      expect(inv1.period).toBe('Tháng 08/2026');
      expect(inv1.status).toBe('paid');
      expect(inv1.amount).toBe(5125000);
      expect(inv1.details).toHaveLength(4);
      expect(inv1.details[0].name).toBe('Tiền phòng');
      expect(inv1.details[1].name).toBe('Tiền điện');
      expect(inv1.details[1].quantity).toBe(120);
      expect(inv1.details[1].unit).toBe('kWh');
      expect(inv1.meterReadings).toHaveLength(1);
      expect(inv1.meterReadings[0].readingValue).toBe(1250);

      const inv2 = result.data[1];
      expect(inv2.id).toBe('inv-2');
      expect(inv2.period).toBe('Tháng 09/2026');
      expect(inv2.status).toBe('unpaid');
    });
  });

  describe('getTenantUsageAnalytics', () => {
    it('should return empty summary and chart data when no invoices exist', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(mockTenantContract);
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      const result = await service.getTenantUsageAnalytics(mockUserId);

      expect(result.success).toBe(true);
      expect(result.summary.currentCycleDue).toBe(0);
      expect(result.chartData).toHaveLength(0);
    });

    it('should compute consumption points, MoM trend and averages correctly', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(mockTenantContract);
      mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.getTenantUsageAnalytics(mockUserId);

      expect(result.success).toBe(true);
      expect(result.chartData).toHaveLength(2);

      // Verify chart data points
      const p1 = result.chartData[0];
      expect(p1.period).toBe('T8/26');
      expect(p1.electricityKwh).toBe(120);
      expect(p1.waterM3).toBe(6);
      expect(p1.roomRent).toBe(4500000);
      expect(p1.totalAmount).toBe(5125000);

      const p2 = result.chartData[1];
      expect(p2.period).toBe('T9/26');
      expect(p2.electricityKwh).toBe(140);
      expect(p2.waterM3).toBe(6);
      expect(p2.totalAmount).toBe(5200000);

      // Verify summary calculations
      expect(result.summary.currentCycleDue).toBe(5200000);
      expect(result.summary.averageMonthlySpend).toBe(
        Math.round((5125000 + 5200000) / 2),
      );
      expect(result.summary.averageElectricityKwh).toBe(130);
      expect(result.summary.averageWaterM3).toBe(6);
      expect(result.summary.isUp).toBe(true);
      expect(result.summary.momChangeAmount).toBe(75000);
      expect(result.summary.momChangePercent).toBe(1.5);
    });
  });

  describe('getTenantPaymentHistory', () => {
    it('should aggregate lifetime invoices and upfront payments across all contracts', async () => {
      mockPrisma.tenantContract.findMany.mockResolvedValue([
        mockTenantContract,
        {
          id: 'tc-past-1',
          tenantId: mockUserId,
          contractId: 'contract-past-1',
          isPrimary: true,
          contract: {
            id: 'contract-past-1',
            status: 'expired',
            room: {
              id: 'room-past-1',
              roomNumber: '302',
              boardingHouse: { name: 'Dormio Bình Thạnh' },
            },
          },
        },
      ]);

      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          contractId: mockContractId,
          totalAmount: 5125000,
          status: 'paid',
          dueDate: new Date('2026-08-05'),
          createdAt: new Date('2026-08-01'),
          contract: mockContract,
          payment: {
            id: 'pay-1',
            paidAt: new Date('2026-08-04'),
            method: 'banking',
            transactionRef: 'MB123',
            receiptNumber: 'REC-001',
          },
          invoiceItems: [
            {
              id: 'item-1',
              serviceId: null,
              quantity: 1,
              unitPrice: 4500000,
              amount: 4500000,
              service: null,
            },
          ],
        },
        {
          id: 'inv-2',
          contractId: mockContractId,
          totalAmount: 5200000,
          status: 'unpaid',
          dueDate: new Date('2026-09-05'),
          createdAt: new Date('2026-08-31'),
          contract: mockContract,
          payment: null,
          invoiceItems: [
            {
              id: 'item-2',
              serviceId: null,
              quantity: 1,
              unitPrice: 4500000,
              amount: 4500000,
              service: null,
            },
          ],
        },
      ]);

      mockPrisma.payment.findMany.mockResolvedValue([
        {
          id: 'pay-upfront-1',
          amount: 10000000,
          status: 'success',
          method: 'banking',
          transactionRef: 'UPFRONT-001',
          paidAt: new Date('2026-01-01'),
          depositId: null,
        },
      ]);

      const result = await service.getTenantPaymentHistory(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);

      // Verify summary calculations
      expect(result.summary.totalTransactions).toBe(3);
      expect(result.summary.totalPaidAmount).toBe(5125000 + 10000000);
      expect(result.summary.totalPendingAmount).toBe(5200000);
      expect(result.summary.lastPaymentDate).toBe(
        new Date('2026-08-04').toISOString(),
      );

      // Verify itemized breakdown on record
      const invRecord = result.data.find((r) => r.id === 'inv-1');
      expect(invRecord).toBeDefined();
      expect(invRecord?.source).toBe('monthly_invoice');
      expect(invRecord?.breakdown[0].label).toBe('Tiền thuê phòng');
      expect(invRecord?.paymentMethod).toBe('banking');
    });
  });

  // ─── Landlord Invoices Tests (UC-L-06) ───────────────────────────────────────

  describe('Landlord Invoices (UC-L-06)', () => {
    const mockBoardingHouseId = 'bh-uuid-1';
    const mockLandlordId = 'landlord-uuid-1';

    const mockLandlordInvoicesDb = [
      {
        id: 'inv-landlord-1',
        contractId: mockContractId,
        roomId: mockRoomId,
        totalAmount: 4030000,
        status: 'unpaid',
        dueDate: new Date('2026-08-20'),
        createdAt: new Date('2026-08-01'),
        room: {
          id: mockRoomId,
          roomNumber: '101',
          boardingHouseId: mockBoardingHouseId,
          boardingHouse: {
            id: mockBoardingHouseId,
            name: 'Dormio Tân Bình',
          },
        },
        contract: {
          id: mockContractId,
          tenantContracts: [
            {
              tenant: {
                id: mockUserId,
                username: 'tuannguyen',
                phoneNumber: '0912345678',
                userIdentification: {
                  fullName: 'Nguyễn Văn Tuấn',
                },
              },
            },
          ],
        },
        invoiceItems: [
          {
            id: 'item-1',
            serviceId: null,
            quantity: 1,
            unitPrice: 3500000,
            amount: 3500000,
            service: null,
          },
          {
            id: 'item-2',
            serviceId: 'srv-elec',
            quantity: 100,
            unitPrice: 3500,
            amount: 350000,
            service: { name: 'Điện', unit: 'kWh' },
          },
          {
            id: 'item-3',
            serviceId: 'srv-water',
            quantity: 12,
            unitPrice: 15000,
            amount: 180000,
            service: { name: 'Nước', unit: 'm³' },
          },
        ],
        payment: null,
        meterReadings: [
          {
            id: 'mr-1',
            serviceId: 'srv-elec',
            readingValue: 1418,
            imageUrl: 'https://example.com/meter.jpg',
            createdAt: new Date('2026-08-05'),
            service: { name: 'Điện', unit: 'kWh' },
          },
        ],
      },
    ];

    it('should list paginated landlord invoices with summary metrics', async () => {
      mockPrisma.invoice.findMany
        .mockResolvedValueOnce([
          {
            id: 'inv-landlord-1',
            status: 'unpaid',
            dueDate: new Date(Date.now() + 86400000 * 5),
            totalAmount: 4030000,
          },
        ]) // period query for summary
        .mockResolvedValueOnce(mockLandlordInvoicesDb); // paginated query

      mockPrisma.invoice.count.mockResolvedValue(1);

      const result = await service.getLandlordInvoices(
        mockBoardingHouseId,
        { page: 1, limit: 10, status: 'all', month: '08', year: '2026' },
        mockLandlordId,
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].roomName).toBe('101');
      expect(result.data[0].tenantName).toBe('Nguyễn Văn Tuấn');
      expect(result.data[0].totalAmount).toBe(4030000);
      expect(result.data[0].vietQrUrl).toContain('https://img.vietqr.io/image/');
      expect(result.summary.totalInvoicesCount).toBe(1);
      expect(result.summary.unpaidCount).toBe(1);
      expect(result.summary.totalUnpaidAmount).toBe(4030000);
    });

    it('should retrieve landlord invoice detail by ID', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(mockLandlordInvoicesDb[0]);

      const result = await service.getLandlordInvoiceDetail(
        mockBoardingHouseId,
        'inv-landlord-1',
      );

      expect(result.id).toBe('inv-landlord-1');
      expect(result.roomName).toBe('101');
      expect(result.rentAmount).toBe(3500000);
      expect(result.ocrMeterImage).toBe('https://example.com/meter.jpg');
    });

    it('should create manual invoice with line items, meter reading, and AuditLog', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({
        id: mockRoomId,
        boardingHouseId: mockBoardingHouseId,
        contracts: [{ id: mockContractId, status: 'active' }],
        roomServices: [
          { service: { id: 'srv-elec', name: 'Điện', isMetered: true, price: 3500 } },
          { service: { id: 'srv-water', name: 'Nước', isMetered: true, price: 15000 } },
        ],
      });

      mockPrisma.invoice.create.mockResolvedValue({
        id: 'inv-new-1',
        roomId: mockRoomId,
        totalAmount: 4030000,
        status: 'unpaid',
        dueDate: new Date('2026-08-20'),
      });

      mockPrisma.invoiceItem.create.mockResolvedValue({ id: 'item-new-1' });
      mockPrisma.meterReading.create.mockResolvedValue({ id: 'mr-new-1' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      // Mock detail query on return
      mockPrisma.invoice.findUnique.mockResolvedValue(mockLandlordInvoicesDb[0]);

      const result = await service.createManualInvoice(
        mockLandlordId,
        mockBoardingHouseId,
        {
          roomId: mockRoomId,
          period: '08/2026',
          dueDate: '2026-08-20',
          rentAmount: 3500000,
          elecOld: 1318,
          elecNew: 1418,
          elecRate: 3500,
          waterOld: 240,
          waterNew: 252,
          waterRate: 15000,
          serviceFees: [{ name: 'WiFi', amount: 100000 }],
        },
      );

      expect(result).toBeDefined();
      expect(mockPrisma.invoice.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'create',
            entityType: 'INVOICE',
          }),
        }),
      );
    });

    it('should record manual payment with idempotency and AuditLogs', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...mockLandlordInvoicesDb[0],
        status: 'unpaid',
        payment: null,
      });

      mockPrisma.payment.create.mockResolvedValue({
        id: 'pay-manual-1',
        method: 'cash',
        status: 'success',
      });

      mockPrisma.invoice.update.mockResolvedValue({
        id: 'inv-landlord-1',
        status: 'paid',
      });

      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-pay-1' });

      const result = await service.recordLandlordManualPayment(
        mockLandlordId,
        mockBoardingHouseId,
        'inv-landlord-1',
        { method: 'cash', note: 'Thanh toán tiền mặt' },
      );

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('pay-manual-1');
      expect(mockPrisma.payment.create).toHaveBeenCalled();
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-landlord-1' },
        data: { status: 'paid' },
      });
      // Verify AuditLogs created for PAYMENT and INVOICE (Rule 4)
      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(2);
    });

    it('should return idempotent success if invoice is already paid', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...mockLandlordInvoicesDb[0],
        status: 'paid',
        payment: { id: 'existing-pay-1' },
      });

      const result = await service.recordLandlordManualPayment(
        mockLandlordId,
        mockBoardingHouseId,
        'inv-landlord-1',
        { method: 'cash' },
      );

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('existing-pay-1');
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });
  });
});
