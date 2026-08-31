import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUE } from './notifications.service';

interface DispatchNotificationJobData {
  notificationId: string;
  type: string;
  receiverId: string;
  contractId?: string;
}

/**
 * Async processor for the 'notifications' BullMQ queue.
 *
 * This is the ONLY place where 3rd-party API calls (SMS, Zalo, Email) should
 * live — never inside the HTTP request or DB transaction that created the
 * triggering record. (Global convention: no 3rd-party calls inside TX.)
 *
 * Current state: stub implementation — logs job data.
 * Real dispatch (SMS/Zalo/Email) should be added here when integrating
 * the messaging provider.
 */
@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<DispatchNotificationJobData>): Promise<void> {
    const { notificationId, type, receiverId, contractId } = job.data;

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
