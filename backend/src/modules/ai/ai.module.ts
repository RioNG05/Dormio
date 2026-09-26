import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { VisionService } from './vision.service';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AiController],
  providers: [VisionService, AiService],
  exports: [VisionService, AiService],
})
export class AiModule {}
