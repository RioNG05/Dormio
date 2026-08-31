import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({ format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiPropertyOptional({ format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  boardingHouseId: string | null;

  @ApiProperty({ format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  senderId: string;

  @ApiPropertyOptional({ format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  receiverId: string | null;

  @ApiProperty({ example: 'Chủ trọ đã tạo hợp đồng cho bạn.' })
  content: string;

  @ApiProperty({
    description: 'Notification type identifier',
    example: 'contract_created',
    enum: ['contract_created', 'billing_reminder', 'billing_due', 'broadcast'],
  })
  type: string;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;
}
