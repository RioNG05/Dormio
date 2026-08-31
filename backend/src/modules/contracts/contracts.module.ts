import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { TenantContractsController } from './tenant-contracts.controller';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * ContractsModule
 * Handles contract operations, UC-T-01 onboarding triggers, and UC-T-06 Tenancy Details.
 */
@Module({
  imports: [NotificationsModule],
  controllers: [TenantContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
