import { Module } from '@nestjs/common';
import { MeterReadingsController } from './meter-readings.controller';
import { MeterReadingsService } from './meter-readings.service';
import { OcrService } from './ocr.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MeterReadingsController],
  providers: [MeterReadingsService, OcrService],
  exports: [MeterReadingsService, OcrService],
})
export class MeterReadingsModule {}
