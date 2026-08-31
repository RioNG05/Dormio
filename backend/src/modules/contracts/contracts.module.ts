import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * ContractsModule — stub for UC-L-04 (full implementation pending).
 * Imports NotificationsModule to wire UC-T-01 onboarding notification.
 */
@Module({
  imports: [NotificationsModule],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
