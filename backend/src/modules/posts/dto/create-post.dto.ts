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
  @IsUUID('all', { message: 'ID phòng liên kết không đúng định dạng UUID' })
  roomId?: string;

  @ApiProperty({
    description: 'Post listing title',
    example: 'Cho thuê phòng trọ cao cấp full nội thất Quận 1',
  })
  @IsString({ message: 'Tiêu đề tin đăng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tiêu đề tin đăng không được để trống' })
  @MinLength(5, { message: 'Tiêu đề tin đăng phải có ít nhất 5 ký tự' })
  title: string;

  @ApiProperty({
    description: 'Detailed post listing description/content',
    example: 'Phòng trọ mới xây, máy lạnh, máy giặt riêng, an ninh 24/7, giờ giấc tự do...',
  })
  @IsString({ message: 'Nội dung mô tả phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung bài đăng không được để trống' })
  @MinLength(10, { message: 'Nội dung bài đăng phải có ít nhất 10 ký tự' })
  content: string;

  @ApiProperty({
    description: 'Required deposit amount in VND',
    example: 3500000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Số tiền cọc giữ chỗ phải là số' })
  @Min(0, { message: 'Số tiền cọc không được nhỏ hơn 0' })
  depositAmount: number;

  @ApiPropertyOptional({
    description: 'List of image URLs for the rental listing',
    type: [String],
    example: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
  })
  @IsOptional()
  @IsArray({ message: 'Danh sách hình ảnh phải là mảng' })
  @IsString({ each: true, message: 'Đường dẫn hình ảnh phải là chuỗi hợp lệ' })
  imageUrls?: string[];

  @ApiPropertyOptional({
    description: 'Initial post status (draft or posted). Defaults to posted',
    enum: PostStatus,
    default: PostStatus.posted,
  })
  @IsOptional()
  @IsEnum(PostStatus, { message: 'Trạng thái bài đăng không hợp lệ (draft, posted, hidden)' })
  status?: PostStatus;
}
