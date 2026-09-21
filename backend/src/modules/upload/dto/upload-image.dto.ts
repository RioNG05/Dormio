import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadImageDto {
  @ApiProperty({
    description: 'Base64 image data URL (data:image/jpeg;base64,...) or remote image URL to upload',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
  })
  @IsString()
  @IsNotEmpty()
  image!: string;

  @ApiPropertyOptional({
    description: 'Target Cloudinary folder for organization',
    example: 'dormio/identifications',
    default: 'dormio/uploads',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
