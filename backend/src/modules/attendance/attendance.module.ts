import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AttendanceController } from './attendance.controller';
import { StaffAttendanceController } from './staff-attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController, StaffAttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
