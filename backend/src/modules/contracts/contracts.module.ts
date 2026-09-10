import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { TenantContractsController } from './tenant-contracts.controller';
import { LandlordContractsController } from './landlord-contracts.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

/**
 * ContractsModule
 * Handles contract operations, UC-L-04 Generate Rental Contract, UC-T-01 onboarding triggers, and UC-T-06 Tenancy Details.
 */
@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [TenantContractsController, LandlordContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}

