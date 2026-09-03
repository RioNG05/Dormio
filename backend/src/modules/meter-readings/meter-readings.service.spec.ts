import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MeterReadingsService } from './meter-readings.service';
import { OcrService } from './ocr.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('MeterReadingsService', () => {
  let service: MeterReadingsService;
  let ocrService: OcrService;

  const mockPrisma = {
    tenantContract: {
      findFirst: jest.fn(),
    },
    roomService: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    meterReading: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
    },
    invoiceItem: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockOcrService = {
    extractMeterReading: jest.fn(),
  };

  const mockUserId = 'user-tenant-uuid';
  const mockRoomId = 'room-1-uuid';
  const mockContractId = 'contract-1-uuid';
  const mockServiceElectricityId = 'service-elec-uuid';
  const mockServiceWaterId = 'service-water-uuid';

  const mockActiveTenantContract = {
    id: 'tc-1',
    tenantId: mockUserId,
    isPrimary: true,
    contract: {
      id: mockContractId,
      roomId: mockRoomId,
      rentPrice: 3500000,
      monthlyPaymentDate: 5,
      status: 'active',
      room: {
        id: mockRoomId,
        roomNumber: '302',
        boardingHouseId: 'house-1-uuid',
        boardingHouse: {
          id: 'house-1-uuid',
          name: 'Dormio House',
        },
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeterReadingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OcrService, useValue: mockOcrService },
      ],
    }).compile();

    service = module.get<MeterReadingsService>(MeterReadingsService);
    ocrService = module.get<OcrService>(OcrService);
  });

  describe('getActiveServicesForTenant (UC-T-03 Step 1)', () => {
    it('should throw NotFoundException if tenant has no active contract', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(null);

      await expect(
        service.getActiveServicesForTenant(mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return active metered services and completion state', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(
        mockActiveTenantContract,
      );

      mockPrisma.roomService.findMany.mockResolvedValue([
        {
          id: 'rs-1',
          roomId: mockRoomId,
          serviceId: mockServiceElectricityId,
          service: {
            id: mockServiceElectricityId,
            name: 'Điện',
            price: 3500,
            unit: 'kWh',
            isMetered: true,
            status: 'active',
          },
        },
      ]);

      // Draft reading exists
      mockPrisma.meterReading.findFirst
        .mockResolvedValueOnce({
          id: 'mr-draft-1',
          roomId: mockRoomId,
          serviceId: mockServiceElectricityId,
          readingValue: 1250,
          imageUrl: 'https://example.com/meter.jpg',
          invoiceId: null,
          createdAt: new Date('2026-08-31'),
        })
        // Historical reading exists
        .mockResolvedValueOnce({
          id: 'mr-hist-1',
          roomId: mockRoomId,
          serviceId: mockServiceElectricityId,
          readingValue: 1150,
          imageUrl: 'https://example.com/old_meter.jpg',
          invoiceId: 'inv-old',
          createdAt: new Date('2026-07-31'),
        });

      const result = await service.getActiveServicesForTenant(mockUserId);

      expect(result.roomId).toBe(mockRoomId);
      expect(result.totalMeteredServices).toBe(1);
      expect(result.completedMeteredServices).toBe(1);
      expect(result.isAllCompleted).toBe(true);
      expect(result.meteredServices[0].serviceName).toBe('Điện');
      expect(result.meteredServices[0].currentReading?.readingValue).toBe(1250);
      expect(result.meteredServices[0].previousReading?.readingValue).toBe(1150);
    });
  });

  describe('uploadOrUpdateReading (UC-T-03 Step 2 & 3)', () => {
    it('should extract reading via OCR if value is not provided, and create new draft', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(
        mockActiveTenantContract,
      );

      mockPrisma.roomService.findFirst.mockResolvedValue({
        id: 'rs-1',
        roomId: mockRoomId,
        serviceId: mockServiceElectricityId,
        service: {
          id: mockServiceElectricityId,
          name: 'Điện',
          isMetered: true,
          status: 'active',
        },
      });

      mockOcrService.extractMeterReading.mockResolvedValue(1450.5);

      // No existing draft reading
      mockPrisma.meterReading.findFirst.mockResolvedValue(null);

      mockPrisma.meterReading.create.mockResolvedValue({
        id: 'new-mr-1',
        serviceId: mockServiceElectricityId,
        readingValue: 1450.5,
        imageUrl: 'https://example.com/new_meter.jpg',
        createdAt: new Date('2026-08-31'),
      });

      const result = await service.uploadOrUpdateReading(mockUserId, {
        serviceId: mockServiceElectricityId,
        imageUrl: 'https://example.com/new_meter.jpg',
      });

      expect(mockOcrService.extractMeterReading).toHaveBeenCalledWith(
        'https://example.com/new_meter.jpg',
        'Điện',
      );
      expect(mockPrisma.meterReading.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          roomId: mockRoomId,
          serviceId: mockServiceElectricityId,
          imageUrl: 'https://example.com/new_meter.jpg',
          readingValue: 1450.5,
          invoiceId: null,
        }),
      });
      expect(result.readingValue).toBe(1450.5);
    });

    it('should update in-place if unbilled draft reading already exists (same id, no duplicate)', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(
        mockActiveTenantContract,
      );

      mockPrisma.roomService.findFirst.mockResolvedValue({
        id: 'rs-1',
        roomId: mockRoomId,
        serviceId: mockServiceElectricityId,
        service: {
          id: mockServiceElectricityId,
          name: 'Điện',
          isMetered: true,
          status: 'active',
        },
      });

      // Existing draft reading exists
      mockPrisma.meterReading.findFirst.mockResolvedValue({
        id: 'existing-mr-draft',
        roomId: mockRoomId,
        serviceId: mockServiceElectricityId,
        invoiceId: null,
      });

      mockPrisma.meterReading.update.mockResolvedValue({
        id: 'existing-mr-draft',
        serviceId: mockServiceElectricityId,
        readingValue: 1500,
        imageUrl: 'https://example.com/retake_meter.jpg',
        createdAt: new Date('2026-08-31'),
      });

      const result = await service.uploadOrUpdateReading(mockUserId, {
        serviceId: mockServiceElectricityId,
        imageUrl: 'https://example.com/retake_meter.jpg',
        readingValue: 1500,
      });

      expect(mockPrisma.meterReading.update).toHaveBeenCalledWith({
        where: { id: 'existing-mr-draft' },
        data: {
          imageUrl: 'https://example.com/retake_meter.jpg',
          readingValue: 1500,
        },
      });
      expect(mockPrisma.meterReading.create).not.toHaveBeenCalled();
      expect(result.id).toBe('existing-mr-draft');
      expect(result.readingValue).toBe(1500);
    });
  });

  describe('updateReadingValue (UC-T-03 Step 4)', () => {
    it('should allow tenant to manually correct unbilled reading value', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(
        mockActiveTenantContract,
      );

      mockPrisma.meterReading.findUnique.mockResolvedValue({
        id: 'mr-draft-1',
        roomId: mockRoomId,
        serviceId: mockServiceElectricityId,
        invoiceId: null,
        service: { name: 'Điện' },
      });

      mockPrisma.meterReading.update.mockResolvedValue({
        id: 'mr-draft-1',
        serviceId: mockServiceElectricityId,
        readingValue: 1320,
        imageUrl: 'https://example.com/meter.jpg',
        createdAt: new Date('2026-08-31'),
        service: { name: 'Điện' },
      });

      const result = await service.updateReadingValue(mockUserId, 'mr-draft-1', {
        readingValue: 1320,
      });

      expect(mockPrisma.meterReading.update).toHaveBeenCalledWith({
        where: { id: 'mr-draft-1' },
        data: { readingValue: 1320 },
      });
      expect(result.readingValue).toBe(1320);
    });

    it('should throw BadRequestException if reading is already billed into an invoice', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(
        mockActiveTenantContract,
      );

      mockPrisma.meterReading.findUnique.mockResolvedValue({
        id: 'mr-billed-1',
        roomId: mockRoomId,
        serviceId: mockServiceElectricityId,
        invoiceId: 'inv-123',
        service: { name: 'Điện' },
      });

      await expect(
        service.updateReadingValue(mockUserId, 'mr-billed-1', {
          readingValue: 1350,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmAndGenerateInvoice (UC-T-03 Step 5 / UC-L-06 Part 3)', () => {
    it('should throw BadRequestException if any active metered service is missing reading', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(
        mockActiveTenantContract,
      );

      // Room has 2 metered services
      mockPrisma.roomService.findMany.mockResolvedValue([
        {
          id: 'rs-1',
          serviceId: mockServiceElectricityId,
          service: { id: mockServiceElectricityId, name: 'Điện', isMetered: true, status: 'active' },
        },
        {
          id: 'rs-2',
          serviceId: mockServiceWaterId,
          service: { id: mockServiceWaterId, name: 'Nước', isMetered: true, status: 'active' },
        },
      ]);

      // Only electricity reading exists
      mockPrisma.meterReading.findMany.mockResolvedValue([
        {
          id: 'mr-elec',
          serviceId: mockServiceElectricityId,
          readingValue: 1400,
          invoiceId: null,
          service: { name: 'Điện' },
        },
      ]);

      await expect(
        service.confirmAndGenerateInvoice(mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should atomicaly create invoice, link readings, and log audit when all metered readings are ready', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(
        mockActiveTenantContract,
      );

      // Metered services
      mockPrisma.roomService.findMany
        .mockResolvedValueOnce([
          {
            id: 'rs-1',
            serviceId: mockServiceElectricityId,
            service: {
              id: mockServiceElectricityId,
              name: 'Điện',
              price: 3500,
              unit: 'kWh',
              isMetered: true,
              status: 'active',
            },
          },
        ])
        // Flat services
        .mockResolvedValueOnce([
          {
            id: 'rs-flat-1',
            serviceId: 'srv-wifi',
            service: {
              id: 'srv-wifi',
              name: 'Internet',
              price: 100000,
              unit: 'tháng',
              isMetered: false,
              status: 'active',
            },
          },
        ]);

      // Unbilled readings
      mockPrisma.meterReading.findMany.mockResolvedValue([
        {
          id: 'mr-elec',
          serviceId: mockServiceElectricityId,
          readingValue: 1400,
          invoiceId: null,
          service: { name: 'Điện', price: 3500, unit: 'kWh' },
        },
      ]);

      // Previous reading (1300 kWh -> delta 100 kWh)
      mockPrisma.meterReading.findFirst.mockResolvedValue({
        id: 'mr-prev-elec',
        serviceId: mockServiceElectricityId,
        readingValue: 1300,
        invoiceId: 'inv-prev',
      });

      mockPrisma.invoice.create.mockResolvedValue({
        id: 'inv-new-uuid',
        roomId: mockRoomId,
        contractId: mockContractId,
        totalAmount: 3950000,
        status: 'unpaid',
        dueDate: new Date('2026-09-05'),
      });

      mockPrisma.invoiceItem.create
        .mockResolvedValueOnce({
          id: 'item-rent',
          quantity: 1,
          unitPrice: 3500000,
          amount: 3500000,
        })
        .mockResolvedValueOnce({
          id: 'item-elec',
          quantity: 100,
          unitPrice: 3500,
          amount: 350000,
        })
        .mockResolvedValueOnce({
          id: 'item-wifi',
          quantity: 1,
          unitPrice: 100000,
          amount: 100000,
        });

      const result = await service.confirmAndGenerateInvoice(mockUserId);

      expect(mockPrisma.invoice.create).toHaveBeenCalled();
      expect(mockPrisma.meterReading.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['mr-elec'] } },
        data: { invoiceId: 'inv-new-uuid' },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'create',
          entityType: 'INVOICE',
          entityId: 'inv-new-uuid',
          userId: mockUserId,
        }),
      });

      expect(result.invoiceId).toBe('inv-new-uuid');
      expect(result.status).toBe('unpaid');
      expect(result.totalAmount).toBe(3950000);
      expect(result.vietQrPayload).toContain('DORMIO_INV_');
    });
  });
});
