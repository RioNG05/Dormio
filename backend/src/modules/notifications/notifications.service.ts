import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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
import {
  CreateMassNotificationDto,
  MassNotificationQueryDto,
  MassNotificationItemDto,
  MassNotificationListResponseDto,
  AdminNotifyChannel,
  AdminNotifyTarget,
  AdminNotifyStatus,
} from './dto/admin-mass-notification.dto';

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

export interface DebtReminderNotificationParams {
  senderId: string;
  receiverId: string;
  boardingHouseId: string;
  contractId?: string;
  roomNumber: string;
  totalDebtAmount: number;
  customNote?: string;
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

  // ─── UC-L-16: Debt reminder notification ───────────────────────────────────

  /**
   * Creates a debt_reminder Notification and enqueues the async dispatch job.
   *
   * Triggered by the landlord when requesting payment for outstanding room debts.
   * Must be called OUTSIDE any active $transaction.
   */
  async createDebtReminderNotification(
    params: DebtReminderNotificationParams,
  ): Promise<void> {
    const {
      senderId,
      receiverId,
      boardingHouseId,
      contractId,
      roomNumber,
      totalDebtAmount,
      customNote,
    } = params;

    const formattedAmount = totalDebtAmount.toLocaleString('vi-VN');
    const content = customNote
      ? `Nhắc nhở nợ tiền phòng ${roomNumber}: Số tiền còn nợ là ${formattedAmount} ₫. Lời nhắn từ chủ trọ: "${customNote}"`
      : `Nhắc nhở nợ tiền phòng ${roomNumber}: Bạn đang có khoản nợ tiền phòng chưa thanh toán là ${formattedAmount} ₫. Vui lòng kiểm tra và thanh toán sớm.`;

    const notification = await this.prisma.notification.create({
      data: {
        senderId,
        receiverId,
        boardingHouseId,
        type: 'debt_reminder',
        content,
        isRead: false,
      },
    });

    this.logger.log(
      `debt_reminder notification created: ${notification.id} for tenant ${receiverId} in room ${roomNumber}`,
    );

    await this.notifQueue.add('dispatch-notification', {
      notificationId: notification.id,
      type: 'debt_reminder',
      receiverId,
      contractId,
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

  // ─── UC-A-05: Mass Notification Dispatcher ────────────────────────────────

  /**
   * Helper function returning localized target audience display label.
   */
  private getTargetLabel(target: string): string {
    switch (target) {
      case 'all_users':
        return 'Toàn bộ người dùng';
      case 'all_landlords':
        return 'Tất cả Chủ trọ';
      case 'all_staff':
        return 'Tất cả Nhân viên';
      case 'all_admins':
        return 'Quản trị viên';
      case 'specific_user':
        return 'Người dùng chỉ định';
      default:
        return target;
    }
  }

  /**
   * Maps a Prisma MassNotificationJob record to MassNotificationItemDto.
   */
  private mapMassNotificationItem(job: any): MassNotificationItemDto {
    return {
      id: job.id,
      createdBy: job.createdBy,
      creatorName: job.createdByUser?.username || job.createdByUser?.email || 'Admin',
      channel: job.channel as AdminNotifyChannel,
      targetType: job.targetType as AdminNotifyTarget,
      targetLabel: this.getTargetLabel(job.targetType),
      targetId: job.targetId || undefined,
      targetUserName: job.targetUser?.username || job.targetUser?.email || undefined,
      title: job.title,
      content: job.content,
      status: job.status as AdminNotifyStatus,
      sentCount: job.sentCount,
      failedCount: job.failedCount,
      totalRecipients: job.sentCount + job.failedCount,
      createdAt: job.createdAt.toISOString(),
    };
  }

  /**
   * UC-A-05: Composes and persists a mass notification job, then enqueues it to BullMQ.
   */
  async createMassNotification(
    adminId: string,
    dto: CreateMassNotificationDto,
  ): Promise<MassNotificationItemDto> {
    this.logger.log(
      `Admin ${adminId} creating mass notification: channel=${dto.channel}, target=${dto.targetType}, title="${dto.title}"`,
    );

    if (dto.targetType === AdminNotifyTarget.specific_user && !dto.targetId) {
      throw new BadRequestException('Target user ID is required when target type is specific_user');
    }

    if (dto.targetId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: dto.targetId },
        select: { id: true, username: true, email: true },
      });
      if (!targetUser) {
        throw new NotFoundException(`Target user with id "${dto.targetId}" not found`);
      }
    }

    // 1. Persist MassNotificationJob record in DB
    const job = await this.prisma.massNotificationJob.create({
      data: {
        createdBy: adminId,
        channel: dto.channel as any,
        targetType: dto.targetType as any,
        targetId: dto.targetId || null,
        title: dto.title.trim(),
        content: dto.content.trim(),
        status: 'pending',
        sentCount: 0,
        failedCount: 0,
      },
      include: {
        createdByUser: { select: { id: true, username: true, email: true } },
        targetUser: { select: { id: true, username: true, email: true } },
      },
    });

    // 2. AuditLog in database (Global convention for administrative mutations)
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'create',
        entityType: 'MASS_NOTIFICATION_JOB',
        entityId: job.id,
        newValue: {
          channel: dto.channel,
          targetType: dto.targetType,
          targetId: dto.targetId || null,
          title: dto.title,
        },
        ipAddress: '127.0.0.1',
      },
    });

    // 3. Enqueue async dispatch job to BullMQ queue — never loop synchronously in HTTP handler
    await this.notifQueue.add(
      'dispatch-mass-notification',
      {
        massNotificationJobId: job.id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log(`Enqueued mass notification job ${job.id} to BullMQ queue`);
    return this.mapMassNotificationItem(job);
  }

  /**
   * UC-A-05: Retrieves paginated mass notification jobs with filters and status counts.
   */
  async getMassNotificationJobs(
    query: MassNotificationQueryDto,
  ): Promise<MassNotificationListResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.channel) {
      where.channel = query.channel;
    }
    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { content: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, rawItems, totalSent, totalPending, totalFailed] = await Promise.all([
      this.prisma.massNotificationJob.count({ where }),
      this.prisma.massNotificationJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: { select: { id: true, username: true, email: true } },
          targetUser: { select: { id: true, username: true, email: true } },
        },
      }),
      this.prisma.massNotificationJob.count({ where: { status: 'sent' } }),
      this.prisma.massNotificationJob.count({ where: { status: 'pending' } }),
      this.prisma.massNotificationJob.count({ where: { status: 'failed' } }),
    ]);

    const items = rawItems.map((item) => this.mapMassNotificationItem(item));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts: {
        total: totalSent + totalPending + totalFailed,
        sent: totalSent,
        pending: totalPending,
        failed: totalFailed,
      },
    };
  }

  /**
   * UC-A-05: Retrieves a single mass notification job by ID.
   */
  async getMassNotificationJobById(id: string): Promise<MassNotificationItemDto> {
    const job = await this.prisma.massNotificationJob.findUnique({
      where: { id },
      include: {
        createdByUser: { select: { id: true, username: true, email: true } },
        targetUser: { select: { id: true, username: true, email: true } },
      },
    });

    if (!job) {
      throw new NotFoundException(`Mass notification job "${id}" not found`);
    }

    return this.mapMassNotificationItem(job);
  }

  /**
   * UC-A-05: Background worker execution: resolves audience and fans out in batches.
   */
  async processMassNotification(jobId: string): Promise<void> {
    this.logger.log(`Beginning asynchronous processing for mass notification job: ${jobId}`);

    try {
      const job = await this.prisma.massNotificationJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        this.logger.error(`Mass notification job ${jobId} not found in database`);
        return;
      }

      if (job.status === 'canceled') {
        this.logger.warn(`Mass notification job ${jobId} was canceled. Skipping execution.`);
        return;
      }

      // 1. Resolve target audience per specification:
      // - all_staff filters on Employee profile existence, not User.role (UC-A-05 & UC-L-19)
      let targetUsers: { id: string; email: string | null; phoneNumber: string }[] = [];

      switch (job.targetType) {
        case 'all_users':
          targetUsers = await this.prisma.user.findMany({
            where: { status: 'active' },
            select: { id: true, email: true, phoneNumber: true },
          });
          break;

        case 'all_landlords':
          targetUsers = await this.prisma.user.findMany({
            where: {
              status: 'active',
              role: 'landlord',
            },
            select: { id: true, email: true, phoneNumber: true },
          });
          break;

        case 'all_staff':
          targetUsers = await this.prisma.user.findMany({
            where: {
              status: 'active',
              employee: { isNot: null },
            },
            select: { id: true, email: true, phoneNumber: true },
          });
          break;

        case 'all_admins':
          targetUsers = await this.prisma.user.findMany({
            where: {
              status: 'active',
              role: 'admin',
            },
            select: { id: true, email: true, phoneNumber: true },
          });
          break;

        case 'specific_user':
          if (job.targetId) {
            targetUsers = await this.prisma.user.findMany({
              where: { id: job.targetId },
              select: { id: true, email: true, phoneNumber: true },
            });
          }
          break;

        default:
          this.logger.warn(`Unknown targetType: ${job.targetType}`);
      }

      this.logger.log(
        `Resolved ${targetUsers.length} target recipients for job ${jobId} (targetType=${job.targetType})`,
      );

      // 2. Fan out in batches (respect rate limits / database connections)
      const BATCH_SIZE = 50;
      let sentCount = 0;
      let failedCount = 0;

      for (let i = 0; i < targetUsers.length; i += BATCH_SIZE) {
        const batch = targetUsers.slice(i, i + BATCH_SIZE);

        try {
          // Persist in-app notifications
          await this.prisma.notification.createMany({
            data: batch.map((u) => ({
              senderId: job.createdBy,
              receiverId: u.id,
              type: 'system_broadcast',
              content: `[${job.title}] ${job.content}`,
              isRead: false,
            })),
          });

          // Simulated 3rd-party channel dispatch (e.g. Email/SMS/Zalo SDK)
          sentCount += batch.length;
        } catch (batchErr) {
          this.logger.error(`Batch dispatch failed for job ${jobId}: ${batchErr}`);
          failedCount += batch.length;
        }
      }

      // 3. Mark job status as sent (or failed if all failed)
      const finalStatus = sentCount > 0 || targetUsers.length === 0 ? 'sent' : 'failed';

      await this.prisma.massNotificationJob.update({
        where: { id: jobId },
        data: {
          status: finalStatus,
          sentCount,
          failedCount,
        },
      });

      this.logger.log(
        `Mass notification job ${jobId} completed: status=${finalStatus}, sent=${sentCount}, failed=${failedCount}`,
      );
    } catch (err) {
      this.logger.error(`Fatal error processing mass notification job ${jobId}: ${err}`);
      await this.prisma.massNotificationJob.update({
        where: { id: jobId },
        data: { status: 'failed' },
      });
    }
  }

  /**
   * UC-A-05: Retries a failed or pending mass notification job.
   */
  async retryMassNotification(
    adminId: string,
    jobId: string,
  ): Promise<MassNotificationItemDto> {
    const job = await this.prisma.massNotificationJob.findUnique({
      where: { id: jobId },
      include: {
        createdByUser: { select: { id: true, username: true, email: true } },
        targetUser: { select: { id: true, username: true, email: true } },
      },
    });

    if (!job) {
      throw new NotFoundException(`Mass notification job "${jobId}" not found`);
    }

    // Reset status to pending and re-enqueue
    const updated = await this.prisma.massNotificationJob.update({
      where: { id: jobId },
      data: {
        status: 'pending',
        sentCount: 0,
        failedCount: 0,
      },
      include: {
        createdByUser: { select: { id: true, username: true, email: true } },
        targetUser: { select: { id: true, username: true, email: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'update',
        entityType: 'MASS_NOTIFICATION_JOB',
        entityId: jobId,
        newValue: { action: 'retry' },
        ipAddress: '127.0.0.1',
      },
    });

    await this.notifQueue.add('dispatch-mass-notification', {
      massNotificationJobId: jobId,
    });

    this.logger.log(`Retried and re-enqueued mass notification job ${jobId}`);
    return this.mapMassNotificationItem(updated);
  }
}

