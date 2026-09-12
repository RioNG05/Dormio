import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminHousesController } from './admin-houses.controller';
import { AdminHousesService } from './admin-houses.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminAnalyticsController, AdminHousesController],
  providers: [AdminAnalyticsService, AdminHousesService],
  exports: [AdminAnalyticsService, AdminHousesService],
})
export class AdminModule {}

