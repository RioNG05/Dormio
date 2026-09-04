import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BoardingHousesController } from './boarding-houses.controller';
import { BoardingHousesService } from './boarding-houses.service';

@Module({
  imports: [PrismaModule],
  controllers: [BoardingHousesController],
  providers: [BoardingHousesService],
  exports: [BoardingHousesService],
})
export class BoardingHousesModule {}
