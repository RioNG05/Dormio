import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PostStatus } from '@prisma';

export class CreatePostDto {
  @ApiPropertyOptional({
    description: 'Room ID to link this rental listing with (optional)',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && !value.trim() ? undefined : value))
  @IsUUID('all', { message: 'Invalid room ID UUID format' })
  roomId?: string;

  @ApiProperty({
    description: 'Post listing title',
    example: 'Premium Studio Room for Rent with Full Amenities',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  title: string;

  @ApiProperty({
    description: 'Detailed post listing description/content',
    example: 'Newly built studio apartment with air conditioning, private washing machine, 24/7 security...',
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content cannot be empty' })
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  content: string;

  @ApiProperty({
    description: 'Required deposit amount in VND',
    example: 3500000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Deposit amount must be a number' })
  @Min(0, { message: 'Deposit amount cannot be less than 0' })
  depositAmount: number;

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
    description: 'Initial post status (draft or posted). Defaults to posted',
    enum: PostStatus,
    default: PostStatus.posted,
  })
  @IsOptional()
  @IsEnum(PostStatus, { message: 'Invalid post status (allowed: draft, posted, hidden)' })
  status?: PostStatus;
}
