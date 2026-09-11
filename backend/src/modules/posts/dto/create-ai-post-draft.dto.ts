import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum AiPostTone {
  PROFESSIONAL = 'professional',
  YOUTHFUL = 'youthful',
  BUDGET = 'budget',
}

export class CreateAiPostDraftDto {
  @ApiProperty({
    description: 'ID of the room to draft a rental listing for (must belong to landlord)',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiPropertyOptional({
    description: 'Tone of voice for the rental post',
    enum: AiPostTone,
    default: AiPostTone.PROFESSIONAL,
    example: AiPostTone.PROFESSIONAL,
  })
  @IsOptional()
  @IsEnum(AiPostTone)
  tone?: AiPostTone = AiPostTone.PROFESSIONAL;

  @ApiPropertyOptional({
    description: 'Custom notes or special highlights to include (e.g. Free parking, New AC)',
    example: 'Gần trạm xe buýt và đại học, miễn phí tiền gửi xe tháng đầu',
  })
  @IsOptional()
  @IsString()
  customNotes?: string;
}

export class AiPostDraftResponseDto {
  @ApiProperty({
    description: 'ID of the AI conversation record tracking this draft session',
    example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  })
  conversationId: string;

  @ApiProperty({
    description: 'AI-generated catchy title for the rental post',
    example: 'Cho thuê phòng Studio cao cấp P.302 Sunrise Residence - 28m², Ban công thoáng mát Cầu Giấy',
  })
  title: string;

  @ApiProperty({
    description: 'Full markdown-formatted description ready for publication',
    example: '🏠 PHÒNG TRỌ CAO CẤP FULL NỘI THẤT - GIỜ GIẤC TỰ DO...',
  })
  content: string;

  @ApiProperty({
    description: 'Suggested deposit amount in VND based on room rate',
    example: 3500000,
  })
  depositAmount: number;

  @ApiProperty({
    description: 'Key highlights and feature tags extracted for badges',
    example: ['Ban công riêng', 'Full nội thất', 'Giờ giấc tự do', 'Khóa vân tay'],
    type: [String],
  })
  highlights: string[];

  @ApiProperty({
    description: 'Image URLs associated with the room or boarding house for prefilling',
    example: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af'],
    type: [String],
  })
  imageUrls: string[];

  @ApiProperty({
    description: 'Timestamp when this AI draft was generated',
    example: '2026-09-12T02:00:00.000Z',
  })
  createdAt: string;
}
