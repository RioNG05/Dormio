import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUE, NotificationsService } from './notifications.service';

interface DispatchNotificationJobData {
  notificationId?: string;
  type?: string;
  receiverId?: string;
  contractId?: string;
  boardingHouseId?: string;
  channel?: string;
  massNotificationJobId?: string;
}

/**
 * Async processor for the 'notifications' BullMQ queue.
 *
 * This is the ONLY place where 3rd-party API calls (SMS, Zalo, Email) should
 * live — never inside the HTTP request or DB transaction that created the
 * triggering record. (Global convention: no 3rd-party calls inside TX.)
 */
@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<DispatchNotificationJobData>): Promise<void> {
    // ─── UC-A-05: Mass Notification Dispatcher ──────────────────────────────
    if (job.name === 'dispatch-mass-notification') {
      const jobId = job.data.massNotificationJobId;
      this.logger.log(`[${job.name}] Processing mass notification dispatch — jobId=${jobId}`);
      if (jobId) {
        await this.notificationsService.processMassNotification(jobId);
      }
      return;
    }

    const { notificationId, type, receiverId, contractId, boardingHouseId, channel } = job.data;

    if (job.name === 'dispatch-broadcast-announcement') {
      this.logger.log(
        `[${job.name}] Processing broadcast announcement dispatch — ` +
          `notificationId=${notificationId}, boardingHouseId=${boardingHouseId}, channel=${channel || 'system'}`,
      );
      // Real channel integration (e.g. multi-channel SMS / Zalo / push notification to residents)
      return;
    }

    this.logger.log(
      `[${job.name}] Processing notification dispatch — ` +
        `id=${notificationId}, type=${type}, receiverId=${receiverId}, contractId=${contractId ?? 'N/A'}`,
    );

    // TODO: integrate real dispatch when messaging provider is available
    // Examples of what goes here (NOT in the service or controller):
    //   await this.smsService.send(receiverId, message);
    //   await this.zaloService.send(receiverId, message);
    //   await this.emailService.send(receiverEmail, subject, body);

    this.logger.debug(
      `[${job.name}] Stub dispatch completed — real channel integration pending`,
    );
  }
}
