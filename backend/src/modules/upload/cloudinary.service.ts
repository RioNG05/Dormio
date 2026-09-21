import { Injectable, Logger } from '@nestjs/common';
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
      this.logger.warn('Cloudinary credentials missing in configuration. Uploads will run in fallback mode.');
    }
  }

  /**
   * Check if Cloudinary is ready to handle uploads
   */
  public get configured(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload an image from base64 data string or URL to Cloudinary
   */
  async uploadImage(
    imageDataOrUrl: string,
    folder: string = 'dormio/uploads',
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      this.logger.warn('Cloudinary not configured; returning provided data as local URL fallback.');
      return {
        url: imageDataOrUrl,
        secureUrl: imageDataOrUrl,
        publicId: `mock_${Date.now()}`,
        format: 'jpeg',
        bytes: imageDataOrUrl.length,
      };
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
    } catch (error) {
      const err = error as UploadApiErrorResponse;
      this.logger.error(`Cloudinary upload failed: ${err.message || error}`, err);
      throw error;
    }
  }

  /**
   * Upload an Express Multer file buffer to Cloudinary using upload_stream
   */
  async uploadFileBuffer(
    buffer: Buffer,
    folder: string = 'dormio/uploads',
    filename?: string,
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      return {
        url: base64,
        secureUrl: base64,
        publicId: `mock_${Date.now()}`,
        format: 'jpeg',
        bytes: buffer.length,
      };
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
            this.logger.error(`Cloudinary buffer upload failed: ${error?.message}`);
            return reject(error);
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
