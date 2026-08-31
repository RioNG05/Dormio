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
import { Type } from 'class-transformer';
import { PostStatus } from '@prisma';

export class CreatePostDto {
  @ApiPropertyOptional({
    description: 'Room ID to link this rental listing with (optional)',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiProperty({
    description: 'Post listing title',
    example: 'Cho thuê phòng trọ cao cấp full nội thất Quận 1',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @ApiProperty({
    description: 'Detailed post listing description/content',
    example: 'Phòng trọ mới xây, máy lạnh, máy giặt riêng, an ninh 24/7, giờ giấc tự do...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiProperty({
    description: 'Required deposit amount in VND',
    example: 3500000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositAmount: number;

  @ApiPropertyOptional({
    description: 'List of image URLs for the rental listing',
    type: [String],
    example: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({
    description: 'Initial post status (draft or posted). Defaults to posted',
    enum: PostStatus,
    default: PostStatus.posted,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
