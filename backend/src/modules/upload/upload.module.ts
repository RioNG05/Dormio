import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [CloudinaryService, UploadService],
  exports: [CloudinaryService, UploadService],
})
export class UploadModule {}
