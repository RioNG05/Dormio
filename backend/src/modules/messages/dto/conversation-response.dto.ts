import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageAttachmentType, UserRole } from '@prisma';

export class AttachmentDto {
  @ApiProperty({ example: 'att-uuid-1' })
  id: string;

  @ApiProperty({ enum: MessageAttachmentType, example: MessageAttachmentType.image })
  type: MessageAttachmentType;

  @ApiProperty({ example: 'https://res.cloudinary.com/dormio/image/upload/v1/chat_img.jpg' })
  url: string;

  @ApiProperty({ example: 1048576 })
  sizeBytes: number;

  @ApiProperty({ example: 0 })
  sortOrder: number;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'msg-uuid-1' })
  id: string;

  @ApiProperty({ example: 'conv-uuid-1' })
  conversationId: string;

  @ApiProperty({ example: 'user-uuid-1' })
  senderId: string;

  @ApiProperty({ example: 'Chào bạn, phòng 102 khi nào xem được?' })
  content: string;

  @ApiProperty({ example: false })
  isReacted: boolean;

  @ApiProperty({ example: '2026-09-09T14:30:00.000Z' })
  sentAt: string;

  @ApiPropertyOptional({ example: '2026-09-09T14:35:00.000Z', nullable: true })
  readAt: string | null;

  @ApiProperty({ type: [AttachmentDto] })
  attachments: AttachmentDto[];
}

export class ParticipantDto {
  @ApiProperty({ example: 'user-uuid-2' })
  id: string;

  @ApiPropertyOptional({ example: 'tenant_mai', nullable: true })
  username?: string | null;

  @ApiProperty({ example: 'Trần Thị Mai' })
  fullName: string;

  @ApiProperty({ example: '0977234567' })
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/dormio/image/upload/avatar.jpg', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.tenant })
  role: UserRole;

  @ApiPropertyOptional({ example: 'Phòng 102', nullable: true })
  roomName?: string | null;

  @ApiPropertyOptional({ example: 'Dormio Premier Quận 1', nullable: true })
  boardingHouseName?: string | null;
}

export class ConversationResponseDto {
  @ApiProperty({ example: 'conv-uuid-1' })
  id: string;

  @ApiProperty({ example: 'user1_user2' })
  name: string;

  @ApiProperty({ example: '2026-09-01T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-09T14:30:00.000Z' })
  updatedAt: string;

  @ApiProperty({ type: ParticipantDto })
  participant: ParticipantDto;

  @ApiPropertyOptional({ type: MessageResponseDto, nullable: true })
  lastMessage?: MessageResponseDto | null;

  @ApiProperty({ example: 2 })
  unreadCount: number;
}

export class ContactDto {
  @ApiProperty({ example: 'user-uuid-2' })
  id: string;

  @ApiProperty({ example: 'Trần Thị Mai' })
  fullName: string;

  @ApiProperty({ example: '0977234567' })
  phoneNumber: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.tenant })
  role: UserRole;

  @ApiPropertyOptional({ example: 'Phòng 102', nullable: true })
  roomName?: string | null;

  @ApiPropertyOptional({ example: 'Dormio Premier', nullable: true })
  boardingHouseName?: string | null;
}

