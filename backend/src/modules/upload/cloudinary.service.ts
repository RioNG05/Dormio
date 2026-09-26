import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('cloudinary.cloudName');
    const apiKey = this.configService.get<string>('cloudinary.apiKey');
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log(`Cloudinary configured successfully with cloud_name: ${cloudName}`);
    } else {
      this.isConfigured = false;
      this.logger.warn('Cloudinary credentials missing in configuration (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
    }
  }

  /**
   * Check if Cloudinary is ready to handle uploads
   */
  public get configured(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload an image from base64 data string or URL to Cloudinary.
   * Throws BadRequestException directly to client if Cloudinary fails or is unconfigured.
   */
  async uploadImage(
    imageDataOrUrl: string,
    folder: string = 'dormio/uploads',
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      this.logger.error('Cloudinary not configured in environment variables.');
      throw new BadRequestException(
        'Dịch vụ lưu trữ Cloudinary chưa được cấu hình. Vui lòng kiểm tra lại CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
      );
    }

    try {
      this.logger.log(`Uploading image to Cloudinary folder: ${folder}...`);
      const result: UploadApiResponse = await cloudinary.uploader.upload(imageDataOrUrl, {
        folder,
        resource_type: 'image',
      });

      this.logger.log(`Uploaded successfully: ${result.secure_url} (publicId: ${result.public_id})`);
      return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error: any) {
      const err = error as UploadApiErrorResponse;
      const rawErrorMsg = err?.message || error?.message || String(error);
      this.logger.error(`Cloudinary upload failed: ${rawErrorMsg}`);
      throw new BadRequestException(
        `Tải ảnh lên Cloudinary thất bại: ${rawErrorMsg}`,
      );
    }
  }

  /**
   * Upload an Express Multer file buffer to Cloudinary using upload_stream.
   * Throws BadRequestException directly to client if Cloudinary fails or is unconfigured.
   */
  async uploadFileBuffer(
    buffer: Buffer,
    folder: string = 'dormio/uploads',
    filename?: string,
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      this.logger.error('Cloudinary not configured in environment variables.');
      throw new BadRequestException(
        'Dịch vụ lưu trữ Cloudinary chưa được cấu hình. Vui lòng kiểm tra lại CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            const rawMsg = error?.message || 'Lỗi không xác định từ Cloudinary';
            this.logger.error(`Cloudinary buffer upload failed: ${rawMsg}`);
            return reject(
              new BadRequestException(`Tải tệp lên Cloudinary thất bại: ${rawMsg}`),
            );
          }
          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );

      uploadStream.end(buffer);
    });
  }
}
