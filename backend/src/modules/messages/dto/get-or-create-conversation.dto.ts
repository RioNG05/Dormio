import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class GetOrCreateConversationDto {
  @ApiProperty({
    description: 'UUID of the other participant to start or open a conversation with',
    example: 'd8c7921a-e55d-4f18-a6d1-4cb50c4587a2',
  })
  @IsUUID('4', { message: 'Participant ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Participant ID is required' })
  participantId: string

  @ApiPropertyOptional({
    description:
      'Optional initial message to send immediately after creating/opening the conversation',
    example: 'Hello, I am contacting regarding room 102',
  })
  @IsOptional()
  @IsString()
  initialMessage?: string
}
