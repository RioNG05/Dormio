import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryService, CloudinaryUploadResult } from './cloudinary.service';
import { UploadImageDto } from './dto/upload-image.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Upload an image from data URL or remote URL
   */
  async uploadImage(dto: UploadImageDto): Promise<CloudinaryUploadResult> {
    this.logger.log(`Handling upload image request with folder: ${dto.folder ?? 'default'}`);
    return this.cloudinaryService.uploadImage(dto.image, dto.folder);
  }

  /**
   * Upload a raw file buffer (Multer)
   */
  async uploadFileBuffer(
    buffer: Buffer,
    folder?: string,
    filename?: string,
  ): Promise<CloudinaryUploadResult> {
    this.logger.log(`Handling file buffer upload (${buffer.length} bytes) to folder: ${folder ?? 'default'}`);
    return this.cloudinaryService.uploadFileBuffer(buffer, folder, filename);
  }

  /**
   * Helper to ensure an image string is a Cloudinary URL.
   * If the input is a base64 data URL (e.g. data:image/...), it is uploaded to Cloudinary.
   * If the input is already a web URL, it is returned as is.
   */
  async ensureCloudinaryUrl(
    imageStr?: string,
    folder: string = 'dormio/uploads',
  ): Promise<string | undefined> {
    if (!imageStr) return undefined;

    const trimmed = imageStr.trim();
    if (!trimmed) return undefined;

    // If it's a data URL, upload to Cloudinary
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:application/')) {
      try {
        this.logger.log(`Detected base64 data URL, uploading to Cloudinary (${folder})...`);
        const result = await this.cloudinaryService.uploadImage(trimmed, folder);
        return result.secureUrl || result.url;
      } catch (err) {
        this.logger.error(`Failed to upload base64 image to Cloudinary: ${err}`);
        // Return original data URL as fallback so data is not lost
        return trimmed;
      }
    }

    // Already a remote URL or object key
    return trimmed;
  }
}
