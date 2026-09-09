import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetOrCreateConversationDto } from './dto/get-or-create-conversation.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import {
  ConversationResponseDto,
  MessageResponseDto,
  ContactDto,
} from './dto/conversation-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Messages')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  // ─── GET /api/v1/messages/conversations ────────────────────────────────────

  @Get('conversations')
  @ApiOperation({
    summary: 'List User Conversations (UC-L-11 / UC-PU-05)',
    description:
      'Retrieves all active 1-on-1 conversations for the current user, with partner profile, unread count, and last message.',
  })
  @ApiOkResponse({
    description: 'List of conversations',
    type: [ConversationResponseDto],
  })
  async getConversations(
    @CurrentUser() user: JwtPayload,
  ): Promise<ConversationResponseDto[]> {
    this.logger.log(`GET /messages/conversations called by user ${user.id}`);
    return this.messagesService.getUserConversations(user.id);
  }

  // ─── GET /api/v1/messages/contacts ─────────────────────────────────────────

  @Get('contacts')
  @ApiOperation({
    summary: 'List Contacts for Messaging Directory',
    description:
      'Returns active tenant contacts for landlords, or landlord contacts for tenants.',
  })
  @ApiOkResponse({
    description: 'List of contacts',
    type: [ContactDto],
  })
  async getContacts(@CurrentUser() user: JwtPayload): Promise<ContactDto[]> {
    this.logger.log(`GET /messages/contacts called by user ${user.id}`);
    return this.messagesService.getContacts(user.id);
  }


  // ─── POST /api/v1/messages/conversations ───────────────────────────────────

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Get or Create Conversation (UC-L-11 / UC-PU-05)',
    description:
      'Finds existing conversation or creates a new one between current user and target participant. ' +
      'Gated: neither user may be an admin.',
  })
  @ApiCreatedResponse({
    description: 'Conversation opened or created',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot message an admin user',
  })
  async getOrCreateConversation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GetOrCreateConversationDto,
  ): Promise<ConversationResponseDto> {
    this.logger.log(
      `POST /messages/conversations called by user ${user.id} targeting participant ${dto.participantId}`,
    );

    const conv = await this.messagesService.getOrCreateConversation(
      user.id,
      dto.participantId,
      dto.initialMessage,
    );

    if (dto.initialMessage && conv.lastMessage) {
      this.messagesGateway.broadcastNewMessage(conv.id, conv.lastMessage);
    }

    return conv;
  }

  // ─── GET /api/v1/messages/conversations/:id/messages ───────────────────────

  @Get('conversations/:id/messages')
  @ApiOperation({
    summary: 'Get Conversation Messages',
    description:
      'Retrieves chronological messages for a conversation. Verifies user is a participant.',
  })
  @ApiOkResponse({
    description: 'List of messages with attachments',
    type: [MessageResponseDto],
  })
  async getConversationMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Query() query: QueryMessagesDto,
  ): Promise<MessageResponseDto[]> {
    this.logger.log(
      `GET /messages/conversations/${conversationId}/messages called by user ${user.id}`,
    );

    return this.messagesService.getConversationMessages(conversationId, user.id, query);
  }

  // ─── POST /api/v1/messages/conversations/:id/messages ──────────────────────

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send Direct Message (UC-L-11)',
    description:
      'Persists message and attachments, updates conversation, and broadcasts to WebSocket room.',
  })
  @ApiCreatedResponse({
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Body() dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    this.logger.log(
      `POST /messages/conversations/${conversationId}/messages called by user ${user.id}`,
    );

    const message = await this.messagesService.sendMessage(conversationId, user.id, dto);

    // Broadcast via WebSocket room
    this.messagesGateway.broadcastNewMessage(conversationId, message);

    return message;
  }

  // ─── PATCH /api/v1/messages/conversations/:id/read ─────────────────────────

  @Patch('conversations/:id/read')
  @ApiOperation({
    summary: 'Mark Messages as Read',
    description:
      'Marks all messages sent to current user in this conversation as read and broadcasts event.',
  })
  @ApiOkResponse({
    description: 'Messages marked as read',
  })
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) conversationId: string,
  ): Promise<{ success: boolean; count: number }> {
    this.logger.log(
      `PATCH /messages/conversations/${conversationId}/read called by user ${user.id}`,
    );

    const result = await this.messagesService.markConversationAsRead(conversationId, user.id);
    this.messagesGateway.broadcastMessagesRead(conversationId, user.id);

    return result;
  }
}
