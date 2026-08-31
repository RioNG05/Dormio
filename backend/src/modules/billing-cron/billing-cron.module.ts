import { Module } from '@nestjs/common';
import { BillingCronService } from './billing-cron.service';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * BillingCronModule — owns the UC-L-06 Part 1 / UC-T-02 daily billing cron.
 *
 * ScheduleModule.forRoot() is registered once in AppModule.
 * This module only declares the service that contains the @Cron handler.
 */
@Module({
  imports: [NotificationsModule],
  providers: [BillingCronService],
  exports: [BillingCronService],
})
export class BillingCronModule {}
