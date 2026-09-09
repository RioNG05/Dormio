import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetOrCreateConversationDto {
  @ApiProperty({
    description: 'UUID of the other participant to start or open a conversation with',
    example: 'd8c7921a-e55d-4f18-a6d1-4cb50c4587a2',
  })
  @IsUUID('4', { message: 'Mã người tham gia phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'Mã người tham gia không được để trống' })
  participantId: string;

  @ApiPropertyOptional({
    description: 'Optional initial message to send immediately after creating/opening the conversation',
    example: 'Chào bạn, mình liên hệ về phòng 102',
  })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}
