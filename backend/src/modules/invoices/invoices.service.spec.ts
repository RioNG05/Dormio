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
      dueDate: new Date('2026-09-05'),
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
    },
    invoice: {
      findMany: jest.fn(),
    },
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
});
