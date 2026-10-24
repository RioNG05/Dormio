import { Module } from '@nestjs/common'
import { GrievancesService } from './grievances.service'
import { GrievancesController } from './grievances.controller'
import { AdminGrievancesController } from './admin-grievances.controller'
import { LandlordGrievancesController } from './landlord-grievances.controller'
import { StaffGrievancesController } from './staff-grievances.controller'
import { PrismaModule } from '../../common/prisma/prisma.module'
import { UploadModule } from '../upload/upload.module'

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [
    GrievancesController,
    AdminGrievancesController,
    LandlordGrievancesController,
    StaffGrievancesController,
  ],
  providers: [GrievancesService],
  exports: [GrievancesService],
})
export class GrievancesModule {}
