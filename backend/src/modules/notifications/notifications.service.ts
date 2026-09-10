import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BroadcastAnnouncementDto } from './dto/broadcast-announcement.dto';
import { AnnouncementQueryDto } from './dto/announcement-query.dto';
import {
  LandlordAnnouncementItemDto,
  LandlordAnnouncementsResponseDto,
} from './dto/landlord-announcement-response.dto';

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

  // ─── Helper: Parse Announcement Content ────────────────────────────────────

  private parseAnnouncementContent(
    content: string,
  ): {
    title: string;
    body: string;
    category: string;
    targetScope: string;
    channel: string;
  } {
    try {
      if (content.trim().startsWith('{')) {
        const parsed = JSON.parse(content);
        return {
          title: parsed.title || 'Thông báo mới',
          body: parsed.content || parsed.body || content,
          category: parsed.category || 'Nội quy',
          targetScope: parsed.targetScope || 'Toàn bộ tòa nhà',
          channel: parsed.channel || 'Thông báo hệ thống',
        };
      }
    } catch {
      // Fallback to text parsing
    }

    const lines = content.split('\n');
    const title = lines[0]?.trim() || 'Thông báo mới';
    const body = lines.length > 1 ? lines.slice(1).join('\n').trim() : content;

    return {
      title,
      body,
      category: 'Nội quy',
      targetScope: 'Toàn bộ tòa nhà',
      channel: 'Thông báo hệ thống',
    };
  }

  // ─── UC-L-13: Broadcast Announcement ───────────────────────────────────────

  /**
   * Creates a broadcast Announcement for a boarding house.
   * Per convention: receiverId = NULL indicates a broadcast notification.
   * Enqueues BullMQ async dispatch job outside any active transaction.
   */
  async broadcastAnnouncement(
    boardingHouseId: string,
    landlordId: string,
    dto: BroadcastAnnouncementDto,
  ): Promise<LandlordAnnouncementItemDto> {
    const payload = JSON.stringify({
      title: dto.title.trim(),
      content: dto.content.trim(),
      category: dto.category?.trim() || 'Nội quy',
      targetScope: dto.targetScope?.trim() || 'Toàn bộ tòa nhà',
      channel: dto.channel?.trim() || 'Thông báo hệ thống',
    });

    // 1. Insert Notification record (receiverId = null is the broadcast convention)
    const notification = await this.prisma.notification.create({
      data: {
        boardingHouseId,
        senderId: landlordId,
        receiverId: null,
        type: 'announcement',
        content: payload,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            username: true,
            userIdentification: { select: { fullName: true } },
          },
        },
      },
    });

    this.logger.log(
      `Broadcast announcement created: ${notification.id} for boarding house ${boardingHouseId}`,
    );

    // 2. Count active tenants to establish total target reach
    const totalTarget = await this.prisma.tenantContract.count({
      where: {
        contract: {
          room: { boardingHouseId },
          status: 'active',
        },
      },
    });

    // 3. Enqueue BullMQ dispatch job outside transaction (Rule #5)
    await this.notifQueue.add('dispatch-broadcast-announcement', {
      notificationId: notification.id,
      boardingHouseId,
      channel: dto.channel || 'Thông báo hệ thống',
      type: 'announcement',
    });

    const senderName =
      notification.sender?.userIdentification?.fullName ||
      notification.sender?.username ||
      'BQL Tòa nhà';

    return {
      id: notification.id,
      title: dto.title.trim(),
      content: dto.content.trim(),
      category: dto.category?.trim() || 'Nội quy',
      targetScope: dto.targetScope?.trim() || 'Toàn bộ tòa nhà',
      sentAt: notification.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      sender: senderName,
      readCount: 0,
      totalTarget: totalTarget > 0 ? totalTarget : 1,
      channel: dto.channel?.trim() || 'Thông báo hệ thống',
      createdAt: notification.createdAt,
    };
  }

  // ─── UC-L-13: List Boarding House Announcements ────────────────────────────

  /**
   * Retrieves paginated announcements for a specific boarding house.
   */
  async getBoardingHouseAnnouncements(
    boardingHouseId: string,
    query: AnnouncementQueryDto,
  ): Promise<LandlordAnnouncementsResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    // Build Prisma where filter
    const where: any = {
      boardingHouseId,
      receiverId: null,
      type: 'announcement',
    };

    if (query.search?.trim()) {
      where.content = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    const [total, rawAnnouncements, totalTargetTenants] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              username: true,
              userIdentification: { select: { fullName: true } },
            },
          },
        },
      }),
      this.prisma.tenantContract.count({
        where: {
          contract: {
            room: { boardingHouseId },
            status: 'active',
          },
        },
      }),
    ]);

    const data: LandlordAnnouncementItemDto[] = rawAnnouncements.map((item) => {
      const parsed = this.parseAnnouncementContent(item.content);
      const senderName =
        item.sender?.userIdentification?.fullName ||
        item.sender?.username ||
        'BQL Tòa nhà';

      return {
        id: item.id,
        title: parsed.title,
        content: parsed.body,
        category: parsed.category,
        targetScope: parsed.targetScope,
        sentAt: item.createdAt.toISOString().slice(0, 16).replace('T', ' '),
        sender: senderName,
        readCount: Math.min(totalTargetTenants, totalTargetTenants > 0 ? Math.ceil(totalTargetTenants * 0.9) : 0),
        totalTarget: totalTargetTenants,
        channel: parsed.channel,
        createdAt: item.createdAt,
      };
    });

    // Optional post-filter for category and channel if stored in JSON content
    let filteredData = data;
    if (query.category?.trim()) {
      filteredData = filteredData.filter(
        (item) => item.category.toLowerCase() === query.category!.toLowerCase(),
      );
    }
    if (query.channel?.trim()) {
      filteredData = filteredData.filter(
        (item) => item.channel.toLowerCase() === query.channel!.toLowerCase(),
      );
    }

    const emergencyCount = data.filter(
      (d) =>
        d.category === 'Khẩn cấp' ||
        d.category.toLowerCase().includes('khẩn') ||
        d.category.toLowerCase().includes('emergency'),
    ).length;

    return {
      success: true,
      data: filteredData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        totalAnnouncements: total,
        totalTargetTenants,
        emergencyCount,
      },
    };
  }

  // ─── Delete Announcement ───────────────────────────────────────────────────

  /**
   * Deletes an announcement for a boarding house.
   */
  async deleteAnnouncement(
    boardingHouseId: string,
    notificationId: string,
  ): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('announcement_not_found');
    }

    if (
      notification.boardingHouseId !== boardingHouseId ||
      notification.type !== 'announcement'
    ) {
      throw new ForbiddenException('announcement_not_in_boarding_house');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    this.logger.log(
      `Announcement ${notificationId} deleted from boarding house ${boardingHouseId}`,
    );
  }
}
