import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';

@ApiTags('Media & Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({
    summary: 'Upload image to Cloudinary via Base64/Data URI',
    description: 'Accepts a base64 data URI string or remote image URL and uploads to Cloudinary storage on the server side.',
  })
  @ApiOkResponse({
    type: UploadImageResponseDto,
    description: 'Image uploaded successfully to Cloudinary',
  })
  @ApiResponse({ status: 400, description: 'Invalid image data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadImage(@Body() dto: UploadImageDto): Promise<UploadImageResponseDto> {
    this.logger.log(`Invoked uploadImage with target folder: ${dto.folder ?? 'default'}`);

    if (!dto.image) {
      throw new BadRequestException('Image data is required');
    }

    const result = await this.uploadService.uploadImage(dto);
    return {
      url: result.secureUrl || result.url,
      publicId: result.publicId,
      format: result.format,
      bytes: result.bytes,
    };
  }

  @Post('file')
  @ApiOperation({
    summary: 'Upload image file directly via multipart/form-data',
    description: 'Uploads an image file (JPEG, PNG, WEBP) directly to Cloudinary storage via server-side stream.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
        folder: {
          type: 'string',
          description: 'Optional destination folder on Cloudinary',
          example: 'dormio/identifications',
        },
      },
    },
  })
  @ApiOkResponse({
    type: UploadImageResponseDto,
    description: 'File uploaded successfully to Cloudinary',
  })
  @ApiResponse({ status: 400, description: 'File missing or invalid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file?: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadImageResponseDto> {
    this.logger.log(`Invoked uploadFile with filename: ${file?.originalname}, size: ${file?.size} bytes`);

    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Uploaded file must be an image');
    }

    const result = await this.uploadService.uploadFileBuffer(
      file.buffer,
      folder || 'dormio/uploads',
      file.originalname,
    );

    return {
      url: result.secureUrl || result.url,
      publicId: result.publicId,
      format: result.format,
      bytes: result.bytes,
    };
  }
}
