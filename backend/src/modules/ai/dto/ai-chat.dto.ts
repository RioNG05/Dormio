import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AiChatMessageDto {
  @ApiProperty({ example: 'user', enum: ['user', 'assistant', 'model'] })
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'assistant' | 'model';

  @ApiProperty({ example: 'Làm thế nào để đặt cọc giữ chỗ phòng online an toàn trên sàn Dormio?' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AiChatDto {
  @ApiProperty({
    description: 'Conversation messages list',
    type: [AiChatMessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiChatMessageDto)
  messages: AiChatMessageDto[];

  @ApiProperty({
    description: 'Optional Boarding House UUID context',
    example: 'd9b2d63d-a233-4123-85af-32d80d24e123',
    required: false,
  })
  @IsString()
  @IsOptional()
  boardingHouseId?: string;

  @ApiProperty({
    description: 'User language locale (vi | en)',
    example: 'vi',
    required: false,
    default: 'vi',
  })
  @IsString()
  @IsOptional()
  locale?: string;
}

export class AiChatResponseDto {
  @ApiProperty({ description: 'AI assistant generated reply text' })
  reply: string;

  @ApiProperty({ description: 'Model used for generation', example: 'gemini-3.5-flash-lite' })
  model: string;

  @ApiProperty({ description: 'Persisted AiConversation ID if authenticated', required: false })
  conversationId?: string;
}
