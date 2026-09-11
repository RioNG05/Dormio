import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '@prisma';

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'Updated post listing title',
    example: 'Căn hộ Duplex cao cấp view đẹp Quận 1',
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated post listing description / markdown content',
    example: 'Thông tin chi tiết căn hộ đã được cập nhật...',
  })
  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Updated required deposit amount in VND',
    example: 3500000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Deposit amount must be a number' })
  @Min(0, { message: 'Deposit amount cannot be less than 0' })
  depositAmount?: number;

  @ApiPropertyOptional({
    description: 'List of image URLs for the rental listing',
    type: [String],
    example: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
  })
  @IsOptional()
  @IsArray({ message: 'imageUrls must be an array' })
  @IsString({ each: true, message: 'Each image URL must be a valid string' })
  imageUrls?: string[];

  @ApiPropertyOptional({
    description: 'Listing status (draft, posted, hidden, locked)',
    enum: PostStatus,
  })
  @IsOptional()
  @IsEnum(PostStatus, { message: 'Invalid post status (allowed: draft, posted, hidden, locked)' })
  status?: PostStatus;
}
