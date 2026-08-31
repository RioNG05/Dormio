import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum GrievancePriorityEnum {
  low = 'low',
  medium = 'medium',
  high = 'high',
}

export class CreateGrievanceDto {
  @ApiProperty({
    example: 'Chủ trọ tự ý tăng tiền điện sai thỏa thuận hợp đồng',
    description: 'Tiêu đề khiếu nại / tố cáo',
  })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  @MinLength(5, { message: 'Tiêu đề phải có ít nhất 5 ký tự' })
  @MaxLength(255, { message: 'Tiêu đề không được vượt quá 255 ký tự' })
  title: string;

  @ApiProperty({
    example:
      'Chủ nhà tự ý thông báo tăng giá điện từ 3.500đ lên 5.000đ/kWh mà không có sự đồng ý của người thuê...',
    description: 'Mô tả chi tiết nội dung khiếu nại',
  })
  @IsNotEmpty({ message: 'Nội dung chi tiết không được để trống' })
  @IsString({ message: 'Nội dung phải là chuỗi ký tự' })
  @MinLength(10, { message: 'Nội dung chi tiết phải có ít nhất 10 ký tự' })
  description: string;

  @ApiPropertyOptional({
    enum: GrievancePriorityEnum,
    default: GrievancePriorityEnum.medium,
    description: 'Mức độ ưu tiên / tính cấp thiết (low, medium, high)',
  })
  @IsOptional()
  @IsEnum(GrievancePriorityEnum, {
    message: 'Mức độ ưu tiên phải là low, medium hoặc high',
  })
  priority?: GrievancePriorityEnum;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://res.cloudinary.com/dormio/image/upload/evidence1.jpg',
      'https://res.cloudinary.com/dormio/image/upload/evidence2.jpg',
    ],
    description: 'Danh sách URL ảnh bằng chứng đính kèm (tối đa 5 ảnh)',
  })
  @IsOptional()
  @IsArray({ message: 'imageUrls phải là một mảng chuỗi' })
  @ArrayMaxSize(5, { message: 'Chỉ được đính kèm tối đa 5 ảnh bằng chứng' })
  @IsString({ each: true, message: 'Mỗi URL ảnh phải là chuỗi hợp lệ' })
  imageUrls?: string[];
}
