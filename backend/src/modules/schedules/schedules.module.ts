import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SchedulesController } from './schedules.controller';
import { StaffSchedulesController } from './staff-schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [PrismaModule],
  controllers: [SchedulesController, StaffSchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
