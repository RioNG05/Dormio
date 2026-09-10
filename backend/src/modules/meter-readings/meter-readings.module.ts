import { Module } from '@nestjs/common';
import { MeterReadingsController } from './meter-readings.controller';
import { LandlordMeterReadingsController } from './landlord-meter-readings.controller';
import { MeterReadingsService } from './meter-readings.service';
import { OcrService } from './ocr.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MeterReadingsController, LandlordMeterReadingsController],
  providers: [MeterReadingsService, OcrService],
  exports: [MeterReadingsService, OcrService],
})
export class MeterReadingsModule {}
