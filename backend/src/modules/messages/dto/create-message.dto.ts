import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageAttachmentType } from '@prisma';

export class MessageAttachmentInputDto {
  @ApiProperty({
    description: 'Type of attachment (image or file)',
    enum: MessageAttachmentType,
    example: MessageAttachmentType.image,
  })
  @IsEnum(MessageAttachmentType)
  type: MessageAttachmentType;

  @ApiProperty({
    description: 'URL or storage key of the uploaded attachment',
    example: 'https://res.cloudinary.com/dormio/image/upload/v1234/chat_img.jpg',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1048576,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sizeBytes?: number;

  @ApiPropertyOptional({
    description: 'Sort order of attachment',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class CreateMessageDto {
  @ApiProperty({
    description: 'Text content of the message',
    example: 'Chào bạn, phòng 102 khi nào có thể vào xem được?',
  })
  @IsString({ message: 'Nội dung tin nhắn phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung tin nhắn không được để trống' })
  content: string;

  @ApiPropertyOptional({
    description: 'List of media or document attachments',
    type: [MessageAttachmentInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentInputDto)
  attachments?: MessageAttachmentInputDto[];
}
