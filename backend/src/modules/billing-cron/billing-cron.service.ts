import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * BillingCronService — UC-L-06 Part 1 / UC-T-02
 *
 * Runs daily at 06:00 and fires two batches of billing notifications:
 *
 *  1. billing_reminder — for contracts where (monthlyPaymentDate - today) = 5 days
 *  2. billing_due      — for contracts where monthlyPaymentDate = today
 *
 * Each notification is written to the DB and enqueued in BullMQ individually
 * (no wrapping $transaction) so a single failure doesn't block the entire batch.
 *
 * Global rule: no 3rd-party API calls here — all dispatch is async in the
 * NotificationProcessor BullMQ worker.
 */
@Injectable()
export class BillingCronService {
  private readonly logger = new Logger(BillingCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Cron: daily at 06:00 ────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async runDailyBillingCron(): Promise<void> {
    const today = new Date();
    const dayToday = today.getDate(); // 1-31

    // Day-of-month 5 days from now (handles month-boundary wraparound)
    const fiveDaysLater = new Date(today);
    fiveDaysLater.setDate(today.getDate() + 5);
    const dayReminder = fiveDaysLater.getDate(); // 1-31

    this.logger.log(
      `[BillingCron] Running — today=${dayToday}, reminderDay=${dayReminder}`,
    );

    await Promise.all([
      this.processBillingReminders(dayReminder),
      this.processBillingDue(dayToday),
    ]);

    this.logger.log('[BillingCron] Completed');
  }

  // ─── Internal: billing_reminder batch ────────────────────────────────────────

  /**
   * Finds all active contracts where monthlyPaymentDate = targetDay and
   * sends a billing_reminder notification to the primary tenant.
   *
   * @param targetDay - the day-of-month that is 5 days from today
   */
  async processBillingReminders(targetDay: number): Promise<void> {
    const contracts = await this.fetchActiveContractsForDay(targetDay);
    this.logger.log(
      `[BillingCron] billing_reminder: ${contracts.length} contract(s) for day ${targetDay}`,
    );

    for (const contract of contracts) {
      const primaryTenant = this.getPrimaryTenant(contract);
      if (!primaryTenant) {
        this.logger.warn(
          `[BillingCron] No primary tenant found for contract ${contract.id} — skipping`,
        );
        continue;
      }

      try {
        await this.notificationsService.createBillingReminderNotification({
          senderId: contract.room.boardingHouse.ownerId,
          receiverId: primaryTenant.tenantId,
          boardingHouseId: contract.room.boardingHouseId,
          contractId: contract.id,
        });
      } catch (err) {
        // Log and continue — a single failure must not block the rest of the batch
        this.logger.error(
          `[BillingCron] Failed billing_reminder for contract ${contract.id}: ${(err as Error).message}`,
        );
      }
    }
  }

  // ─── Internal: billing_due batch ─────────────────────────────────────────────

  /**
   * Finds all active contracts where monthlyPaymentDate = today and
   * sends a billing_due notification to the primary tenant.
   * Content varies based on whether the room has active metered services.
   *
   * @param targetDay - today's day-of-month
   */
  async processBillingDue(targetDay: number): Promise<void> {
    const contracts = await this.fetchActiveContractsForDay(targetDay);
    this.logger.log(
      `[BillingCron] billing_due: ${contracts.length} contract(s) for day ${targetDay}`,
    );

    for (const contract of contracts) {
      const primaryTenant = this.getPrimaryTenant(contract);
      if (!primaryTenant) {
        this.logger.warn(
          `[BillingCron] No primary tenant found for contract ${contract.id} — skipping`,
        );
        continue;
      }

      // Check if the room has any active metered services
      const hasMeteredServices = contract.room.roomServices.some(
        (rs) => rs.service.isMetered && rs.service.status === 'active',
      );

      try {
        await this.notificationsService.createBillingDueNotification({
          senderId: contract.room.boardingHouse.ownerId,
          receiverId: primaryTenant.tenantId,
          boardingHouseId: contract.room.boardingHouseId,
          contractId: contract.id,
          hasMeteredServices,
        });
      } catch (err) {
        this.logger.error(
          `[BillingCron] Failed billing_due for contract ${contract.id}: ${(err as Error).message}`,
        );
      }
    }
  }

  // ─── Query helper ─────────────────────────────────────────────────────────────

  /**
   * Fetches all active contracts with the given monthlyPaymentDate (day-of-month),
   * including the data needed for notification params and metered-service check.
   *
   * Exposed as a separate method to make it independently testable.
   */
  async fetchActiveContractsForDay(dayOfMonth: number) {
    return this.prisma.contract.findMany({
      where: {
        status: 'active',
        monthlyPaymentDate: dayOfMonth,
      },
      select: {
        id: true,
        monthlyPaymentDate: true,
        tenantContracts: {
          select: {
            tenantId: true,
            isPrimary: true,
          },
        },
        room: {
          select: {
            boardingHouseId: true,
            boardingHouse: {
              select: { ownerId: true },
            },
            roomServices: {
              select: {
                service: {
                  select: {
                    isMetered: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private getPrimaryTenant(
    contract: Awaited<ReturnType<typeof this.fetchActiveContractsForDay>>[number],
  ) {
    return (
      contract.tenantContracts.find((tc) => tc.isPrimary) ??
      contract.tenantContracts[0] ??
      null
    );
  }
}
