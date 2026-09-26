import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PayOsService } from './payos.service';
import { PaymentsController } from './payments.controller';
import { LandlordPaymentsController } from './landlord-payments.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, LandlordPaymentsController],
  providers: [PaymentsService, PayOsService],
  exports: [PaymentsService, PayOsService],
})
export class PaymentsModule {}
