import { Test, TestingModule } from '@nestjs/testing';
import { BillingCronService } from './billing-cron.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal contract fixture matching the shape returned by fetchActiveContractsForDay */
function buildContract(overrides: {
  id?: string;
  monthlyPaymentDate?: number;
  tenantId?: string;
  isPrimary?: boolean;
  hasMeteredServices?: boolean;
  ownerId?: string;
  boardingHouseId?: string;
}) {
  const {
    id = 'contract-1',
    monthlyPaymentDate = 10,
    tenantId = 'tenant-1',
    isPrimary = true,
    hasMeteredServices = false,
    ownerId = 'landlord-1',
    boardingHouseId = 'house-1',
  } = overrides;

  return {
    id,
    monthlyPaymentDate,
    tenantContracts: [{ tenantId, isPrimary }],
    room: {
      boardingHouseId,
      boardingHouse: { ownerId },
      roomServices: hasMeteredServices
        ? [{ service: { isMetered: true, status: 'active' } }]
        : [],
    },
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  contract: { findMany: jest.fn() },
};

const mockNotificationsService = {
  createBillingReminderNotification: jest.fn(),
  createBillingDueNotification: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BillingCronService', () => {
  let service: BillingCronService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingCronService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<BillingCronService>(BillingCronService);
  });

  // ─── processBillingReminders ───────────────────────────────────────────────

  describe('processBillingReminders', () => {
    it('should send billing_reminder for each matching contract', async () => {
      const contract = buildContract({ id: 'c-1', ownerId: 'owner-1', boardingHouseId: 'bh-1', tenantId: 'tenant-1' });
      mockPrisma.contract.findMany.mockResolvedValue([contract]);

      await service.processBillingReminders(15);

      expect(mockNotificationsService.createBillingReminderNotification).toHaveBeenCalledTimes(1);
      expect(mockNotificationsService.createBillingReminderNotification).toHaveBeenCalledWith({
        senderId: 'owner-1',
        receiverId: 'tenant-1',
        boardingHouseId: 'bh-1',
        contractId: 'c-1',
      });
    });

    it('should send to the primary tenant (isPrimary=true)', async () => {
      const contract = buildContract({});
      contract.tenantContracts = [
        { tenantId: 'secondary', isPrimary: false },
        { tenantId: 'primary', isPrimary: true },
      ];
      mockPrisma.contract.findMany.mockResolvedValue([contract]);

      await service.processBillingReminders(10);

      expect(mockNotificationsService.createBillingReminderNotification).toHaveBeenCalledWith(
        expect.objectContaining({ receiverId: 'primary' }),
      );
    });

    it('should skip contracts with no tenants instead of throwing', async () => {
      const contract = buildContract({});
      contract.tenantContracts = [];
      mockPrisma.contract.findMany.mockResolvedValue([contract]);

      await expect(service.processBillingReminders(10)).resolves.not.toThrow();
      expect(mockNotificationsService.createBillingReminderNotification).not.toHaveBeenCalled();
    });

    it('should continue processing remaining contracts if one fails', async () => {
      const c1 = buildContract({ id: 'c-1', tenantId: 't-1' });
      const c2 = buildContract({ id: 'c-2', tenantId: 't-2' });
      mockPrisma.contract.findMany.mockResolvedValue([c1, c2]);
      mockNotificationsService.createBillingReminderNotification
        .mockRejectedValueOnce(new Error('DB write failed'))
        .mockResolvedValueOnce(undefined);

      await expect(service.processBillingReminders(10)).resolves.not.toThrow();

      // Both were attempted
      expect(mockNotificationsService.createBillingReminderNotification).toHaveBeenCalledTimes(2);
    });

    it('should send nothing when no contracts match the day', async () => {
      mockPrisma.contract.findMany.mockResolvedValue([]);

      await service.processBillingReminders(5);

      expect(mockNotificationsService.createBillingReminderNotification).not.toHaveBeenCalled();
    });
  });

  // ─── processBillingDue ─────────────────────────────────────────────────────

  describe('processBillingDue', () => {
    it('should send billing_due with hasMeteredServices=true when room has active metered service', async () => {
      const contract = buildContract({ id: 'c-1', hasMeteredServices: true, tenantId: 't-1' });
      mockPrisma.contract.findMany.mockResolvedValue([contract]);

      await service.processBillingDue(10);

      expect(mockNotificationsService.createBillingDueNotification).toHaveBeenCalledWith(
        expect.objectContaining({ hasMeteredServices: true }),
      );
    });

    it('should send billing_due with hasMeteredServices=false when room has no metered services', async () => {
      const contract = buildContract({ id: 'c-1', hasMeteredServices: false, tenantId: 't-1' });
      mockPrisma.contract.findMany.mockResolvedValue([contract]);

      await service.processBillingDue(10);

      expect(mockNotificationsService.createBillingDueNotification).toHaveBeenCalledWith(
        expect.objectContaining({ hasMeteredServices: false }),
      );
    });

    it('should not treat an inactive metered service as "has metered services"', async () => {
      const contract = buildContract({ id: 'c-1' });
      // Override: has a metered service but it is inactive
      contract.room.roomServices = [{ service: { isMetered: true, status: 'inactive' } }];
      mockPrisma.contract.findMany.mockResolvedValue([contract]);

      await service.processBillingDue(10);

      expect(mockNotificationsService.createBillingDueNotification).toHaveBeenCalledWith(
        expect.objectContaining({ hasMeteredServices: false }),
      );
    });

    it('should skip contracts with no tenants', async () => {
      const contract = buildContract({});
      contract.tenantContracts = [];
      mockPrisma.contract.findMany.mockResolvedValue([contract]);

      await expect(service.processBillingDue(10)).resolves.not.toThrow();
      expect(mockNotificationsService.createBillingDueNotification).not.toHaveBeenCalled();
    });

    it('should continue processing remaining contracts if one fails', async () => {
      const c1 = buildContract({ id: 'c-1', tenantId: 't-1' });
      const c2 = buildContract({ id: 'c-2', tenantId: 't-2' });
      mockPrisma.contract.findMany.mockResolvedValue([c1, c2]);
      mockNotificationsService.createBillingDueNotification
        .mockRejectedValueOnce(new Error('queue down'))
        .mockResolvedValueOnce(undefined);

      await expect(service.processBillingDue(10)).resolves.not.toThrow();
      expect(mockNotificationsService.createBillingDueNotification).toHaveBeenCalledTimes(2);
    });
  });

  // ─── runDailyBillingCron — date arithmetic ─────────────────────────────────

  describe('runDailyBillingCron', () => {
    it('should query reminder batch with day+5 and due batch with today', async () => {
      const today = new Date('2026-01-20T06:00:00Z'); // 20th of month
      jest.useFakeTimers().setSystemTime(today);

      mockPrisma.contract.findMany.mockResolvedValue([]);

      await service.runDailyBillingCron();

      // Should have been called twice: once for reminder (day 25), once for due (day 20)
      expect(mockPrisma.contract.findMany).toHaveBeenCalledTimes(2);
      const calledDays = mockPrisma.contract.findMany.mock.calls.map(
        (call) => call[0].where.monthlyPaymentDate,
      );
      expect(calledDays).toContain(25); // 20 + 5
      expect(calledDays).toContain(20); // today

      jest.useRealTimers();
    });

    it('should handle month-boundary wraparound: Jan 27 + 5 = Feb 1 (day=1)', async () => {
      // Jan 27: today=27, reminder=31? No — 27+5=Feb 1, day-of-month = 1
      const today = new Date('2026-01-27T06:00:00Z');
      jest.useFakeTimers().setSystemTime(today);

      mockPrisma.contract.findMany.mockResolvedValue([]);

      await service.runDailyBillingCron();

      const calledDays = mockPrisma.contract.findMany.mock.calls.map(
        (call) => call[0].where.monthlyPaymentDate,
      );
      expect(calledDays).toContain(1);  // Feb 1 → dayOfMonth = 1
      expect(calledDays).toContain(27); // today

      jest.useRealTimers();
    });
  });

  // ─── fetchActiveContractsForDay ────────────────────────────────────────────

  describe('fetchActiveContractsForDay', () => {
    it('should query only active contracts with the given monthlyPaymentDate', async () => {
      mockPrisma.contract.findMany.mockResolvedValue([]);

      await service.fetchActiveContractsForDay(15);

      expect(mockPrisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active', monthlyPaymentDate: 15 },
        }),
      );
    });
  });
});
