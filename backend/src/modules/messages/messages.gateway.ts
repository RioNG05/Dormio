import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/conversation-response.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validates JWT authentication token when a socket client connects.
   */
  async handleConnection(client: Socket) {
    try {
      const authHeader =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string) ||
        (client.handshake.query?.token as string);

      if (!authHeader) {
        this.logger.warn(`Client connected without auth token: ${client.id}`);
        client.disconnect();
        return;
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();

      const jwtSecret = this.configService.get<string>('jwt.secret', 'secret');
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: jwtSecret,
      });

      // Attach user payload to socket
      client.data.user = payload;
      this.logger.log(`Socket client authenticated: user=${payload.id}, socketId=${client.id}`);
    } catch (err: any) {
      this.logger.error(`WebSocket authentication failed for socket ${client.id}: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket client disconnected: ${client.id}`);
  }

  /**
   * Client joins a conversation room to receive real-time messages.
   */
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const roomName = `room_${data.conversationId}`;
    client.join(roomName);
    this.logger.log(`User ${client.data.user?.id} joined room ${roomName}`);
    return { event: 'joined', conversationId: data.conversationId };
  }

  /**
   * Client leaves a conversation room.
   */
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const roomName = `room_${data.conversationId}`;
    client.leave(roomName);
    this.logger.log(`User ${client.data.user?.id} left room ${roomName}`);
    return { event: 'left', conversationId: data.conversationId };
  }

  /**
   * Handles real-time message sending via WebSocket directly.
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; attachments?: any[] },
  ) {
    const senderId = client.data.user?.id;
    if (!senderId || !data?.conversationId) return;

    const dto: CreateMessageDto = {
      content: data.content,
      attachments: data.attachments,
    };

    const created = await this.messagesService.sendMessage(data.conversationId, senderId, dto);

    // Broadcast to room
    this.broadcastNewMessage(data.conversationId, created);

    return created;
  }

  /**
   * Broadcasts a newly sent message to all participants currently joined in the room.
   */
  broadcastNewMessage(conversationId: string, message: MessageResponseDto) {
    const roomName = `room_${conversationId}`;
    this.server.to(roomName).emit('new_message', message);
    this.logger.log(`Broadcasted new_message to ${roomName} (msgId: ${message.id})`);
  }

  /**
   * Broadcasts messages_read notification to the room.
   */
  broadcastMessagesRead(conversationId: string, readerId: string) {
    const roomName = `room_${conversationId}`;
    this.server.to(roomName).emit('messages_read', { conversationId, readerId });
  }
}
