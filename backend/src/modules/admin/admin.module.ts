import { Module } from '@nestjs/common'
import { PrismaModule } from '../../common/prisma/prisma.module'
import { AdminAnalyticsController } from './admin-analytics.controller'
import { AdminAnalyticsService } from './admin-analytics.service'
import { AdminHousesController } from './admin-houses.controller'
import { AdminHousesService } from './admin-houses.service'
import { AdminUsersController } from './admin-users.controller'
import { AdminUsersService } from './admin-users.service'

@Module({
  imports: [PrismaModule],
  controllers: [AdminAnalyticsController, AdminHousesController, AdminUsersController],
  providers: [AdminAnalyticsService, AdminHousesService, AdminUsersService],
  exports: [AdminAnalyticsService, AdminHousesService, AdminUsersService],
})
export class AdminModule {}
