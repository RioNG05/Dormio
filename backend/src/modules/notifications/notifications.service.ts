import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';

export const NOTIFICATION_QUEUE = 'notifications';

export interface OnboardingNotificationParams {
  /** The landlord who triggered contract creation */
  senderId: string;
  /** The tenant who should receive the notification */
  receiverId: string;
  /** Boarding house context */
  boardingHouseId: string;
  /** The contract ID for contextual content */
  contractId: string;
}

export interface BillingNotificationParams {
  /** The boarding house owner (landlord) as sender */
  senderId: string;
  /** The primary tenant of the contract */
  receiverId: string;
  boardingHouseId: string;
  contractId: string;
}

export interface BillingDueNotificationParams extends BillingNotificationParams {
  /** Whether the room has any active metered services */
  hasMeteredServices: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notifQueue: Queue,
  ) {}

  // ─── UC-T-01: Create onboarding notification ────────────────────────────────

  /**
   * Creates a Notification DB row and enqueues an async dispatch job.
   *
   * Call this OUTSIDE of any active DB transaction (per global convention):
   * 3rd-party dispatch is async and must never block the contract TX.
   *
   * @param params sender/receiver/boardingHouse context
   */
  async createOnboardingNotification(
    params: OnboardingNotificationParams,
  ): Promise<void> {
    const { senderId, receiverId, boardingHouseId, contractId } = params;

    // 1. Persist the in-app notification row
    const notification = await this.prisma.notification.create({
      data: {
        senderId,
        receiverId,
        boardingHouseId,
        type: 'contract_created',
        content: 'Chủ trọ đã tạo hợp đồng cho bạn. Vui lòng kiểm tra thông tin.',
        isRead: false,
      },
    });

    this.logger.log(
      `Onboarding notification created: ${notification.id} for tenant ${receiverId}`,
    );

    // 2. Enqueue async dispatch (SMS/Zalo/Email) — never call 3rd-party here
    await this.notifQueue.add('dispatch-notification', {
      notificationId: notification.id,
      type: 'contract_created',
      receiverId,
      contractId,
    });

    this.logger.debug(
      `Notification dispatch job enqueued for notification ${notification.id}`,
    );
  }

  // ─── Read notifications for the authenticated user ──────────────────────────

  /**
   * Returns all notifications received by a specific user, newest-first.
   * Scope: receiverId = userId (only their own notifications).
   */
  async findAllForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        receiverId: userId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        boardingHouseId: true,
        senderId: true,
        receiverId: true,
        content: true,
        type: true,
        isRead: true,
        createdAt: true,
      },
    });
  }

  // ─── Mark as read ────────────────────────────────────────────────────────────

  /**
   * Marks a notification as read.
   * Validates that the notification belongs to the requesting user.
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('notification_not_found');
    }

    if (notification.receiverId !== userId) {
      throw new ForbiddenException('notification_not_owned_by_user');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // ─── UC-T-02: Billing reminder (5 days before due date) ─────────────────────

  /**
   * Creates a billing_reminder Notification and enqueues the async dispatch job.
   *
   * Triggered by the daily billing cron (UC-L-06 Part 1) when today is exactly
   * 5 days before a contract's monthlyPaymentDate.
   *
   * Must be called OUTSIDE any active $transaction.
   */
  async createBillingReminderNotification(
    params: BillingNotificationParams,
  ): Promise<void> {
    const { senderId, receiverId, boardingHouseId, contractId } = params;

    const notification = await this.prisma.notification.create({
      data: {
        senderId,
        receiverId,
        boardingHouseId,
        type: 'billing_reminder',
        content: 'Sắp đến hạn đóng tiền trọ. Vui lòng chuẩn bị thanh toán đúng hạn.',
        isRead: false,
      },
    });

    this.logger.log(
      `billing_reminder notification created: ${notification.id} for tenant ${receiverId}`,
    );

    await this.notifQueue.add('dispatch-notification', {
      notificationId: notification.id,
      type: 'billing_reminder',
      receiverId,
      contractId,
    });
  }

  // ─── UC-T-02: Billing due (on the due date itself) ───────────────────────────

  /**
   * Creates a billing_due Notification and enqueues the async dispatch job.
   *
   * Triggered by the daily billing cron on the due date. Content varies:
   * - hasMeteredServices=true  → "cần nhập chỉ số điện nước"
   * - hasMeteredServices=false → "hóa đơn đã sẵn sàng"
   *
   * Must be called OUTSIDE any active $transaction.
   */
  async createBillingDueNotification(
    params: BillingDueNotificationParams,
  ): Promise<void> {
    const { senderId, receiverId, boardingHouseId, contractId, hasMeteredServices } =
      params;

    const content = hasMeteredServices
      ? 'Đã đến ngày thanh toán. Vui lòng nhập chỉ số điện nước để tạo hóa đơn.'
      : 'Hóa đơn tháng này đã sẵn sàng. Vui lòng thanh toán đúng hạn.';

    const notification = await this.prisma.notification.create({
      data: {
        senderId,
        receiverId,
        boardingHouseId,
        type: 'billing_due',
        content,
        isRead: false,
      },
    });

    this.logger.log(
      `billing_due notification created: ${notification.id} for tenant ${receiverId} ` +
        `(hasMeteredServices=${hasMeteredServices})`,
    );

    await this.notifQueue.add('dispatch-notification', {
      notificationId: notification.id,
      type: 'billing_due',
      receiverId,
      contractId,
      hasMeteredServices,
    });
  }
}
