import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import {
  ConversationResponseDto,
  MessageResponseDto,
  ParticipantDto,
  AttachmentDto,
  ContactDto,
} from './dto/conversation-response.dto';
import { UserRole } from '@prisma';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalizes participant IDs (lexicographical order) to avoid duplicate conversation rows.
   */
  private normalizeParticipants(user1Id: string, user2Id: string): [string, string] {
    return [user1Id, user2Id].sort() as [string, string];
  }

  /**
   * Helper to format a message and its attachments into MessageResponseDto.
   */
  formatMessage(msg: any): MessageResponseDto {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      isReacted: msg.isReacted ?? false,
      sentAt: msg.sentAt.toISOString(),
      readAt: msg.readAt ? msg.readAt.toISOString() : null,
      attachments: Array.isArray(msg.attachments)
        ? msg.attachments.map((att: any) => ({
            id: att.id,
            type: att.type,
            url: att.url,
            sizeBytes: att.sizeBytes,
            sortOrder: att.sortOrder,
          }))
        : [],
    };
  }

  // ─── UC-L-11 / UC-PU-05: Get or Create Conversation ────────────────────────

  /**
   * Retrieves or creates a 1-on-1 direct conversation between two users.
   * Gated: Neither participant may have role='admin'.
   *
   * @param currentUserId Initiating user ID
   * @param otherUserId Target user ID
   * @param initialMessage Optional first message to send immediately
   */
  async getOrCreateConversation(
    currentUserId: string,
    otherUserId: string,
    initialMessage?: string,
  ): Promise<ConversationResponseDto> {
    if (currentUserId === otherUserId) {
      throw new BadRequestException('Không thể tạo cuộc trò chuyện với chính mình.');
    }

    // 1. Fetch both users to enforce admin gate (Rule 4 of UC-L-11)
    const [user1, user2] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, role: true },
      }),
      this.prisma.user.findUnique({
        where: { id: otherUserId },
        select: {
          id: true,
          role: true,
          username: true,
          phoneNumber: true,
          avatarUrl: true,
          userIdentification: { select: { fullName: true } },
        },
      }),
    ]);

    if (!user1 || !user2) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    // Gate: Neither participant may have role='admin'
    if (user1.role === UserRole.admin || user2.role === UserRole.admin) {
      throw new ForbiddenException(
        'Không hỗ trợ nhắn tin trực tiếp với quản trị viên qua kênh này.',
      );
    }

    // 2. Normalize user IDs pair
    const [normU1, normU2] = this.normalizeParticipants(currentUserId, otherUserId);

    // 3. Find existing conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        user1Id: normU1,
        user2Id: normU2,
        deletedAt: null,
      },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          include: { attachments: true },
        },
      },
    });

    // 4. Create if not found
    if (!conversation) {
      const convName = `${normU1}_${normU2}`;
      conversation = await this.prisma.conversation.create({
        data: {
          name: convName,
          user1Id: normU1,
          user2Id: normU2,
        },
        include: {
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
            include: { attachments: true },
          },
        },
      });
    }

    // 5. Send initial message if provided
    let latestMsg = conversation.messages[0] ? this.formatMessage(conversation.messages[0]) : null;

    if (initialMessage && initialMessage.trim()) {
      const sent = await this.sendMessage(conversation.id, currentUserId, {
        content: initialMessage.trim(),
      });
      latestMsg = sent;
    }

    // Unread count
    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: conversation.id,
        senderId: otherUserId,
        readAt: null,
      },
    });

    // Check tenancy room context if tenant of this landlord
    const tenancyContext = await this.getTenantRoomContext(otherUserId, currentUserId);

    const participant: ParticipantDto = {
      id: user2.id,
      username: user2.username || 'Người dùng',
      fullName: user2.userIdentification?.fullName || user2.username || 'Người dùng',
      phoneNumber: user2.phoneNumber || '',
      avatarUrl: user2.avatarUrl,
      role: user2.role,
      roomName: tenancyContext?.roomName || null,
      boardingHouseName: tenancyContext?.boardingHouseName || null,
    };

    return {
      id: conversation.id,
      name: conversation.name,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: (conversation.updatedAt || conversation.createdAt).toISOString(),
      participant,
      lastMessage: latestMsg,
      unreadCount,
    };
  }

  // ─── List User Conversations ───────────────────────────────────────────────

  /**
   * Retrieves all active conversations for the given user, ordered by last activity.
   */
  async getUserConversations(userId: string): Promise<ConversationResponseDto[]> {
    const rawConversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        deletedAt: null,
      },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          include: { attachments: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result: ConversationResponseDto[] = [];

    for (const conv of rawConversations) {
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;

      const otherUser = await this.prisma.user.findUnique({
        where: { id: otherUserId },
        select: {
          id: true,
          username: true,
          phoneNumber: true,
          avatarUrl: true,
          role: true,
          userIdentification: { select: { fullName: true } },
        },
      });

      if (!otherUser) continue;

      const unreadCount = await this.prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: otherUserId,
          readAt: null,
        },
      });

      const tenancyContext = await this.getTenantRoomContext(otherUserId, userId);

      const participant: ParticipantDto = {
        id: otherUser.id,
        username: otherUser.username || 'Người dùng',
        fullName: otherUser.userIdentification?.fullName || otherUser.username || 'Người dùng',
        phoneNumber: otherUser.phoneNumber || '',
        avatarUrl: otherUser.avatarUrl,
        role: otherUser.role,
        roomName: tenancyContext?.roomName || null,
        boardingHouseName: tenancyContext?.boardingHouseName || null,
      };

      const lastMsg = conv.messages[0] ? this.formatMessage(conv.messages[0]) : null;

      result.push({
        id: conv.id,
        name: conv.name,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: (conv.updatedAt || conv.createdAt).toISOString(),
        participant,
        lastMessage: lastMsg,
        unreadCount,
      });
    }

    return result;
  }

  // ─── Get Conversation Messages ─────────────────────────────────────────────

  /**
   * Retrieves messages for a conversation, validating participant access.
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    query?: QueryMessagesDto,
  ): Promise<MessageResponseDto[]> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv || conv.deletedAt) {
      throw new NotFoundException('Cuộc trò chuyện không tồn tại.');
    }

    // Access check: User must be user1 or user2
    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem cuộc trò chuyện này.');
    }

    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 50));
    const whereClause: any = { conversationId };

    if (query?.before) {
      whereClause.sentAt = { lt: new Date(query.before) };
    }

    const messages = await this.prisma.message.findMany({
      where: whereClause,
      include: {
        attachments: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sentAt: 'asc' },
      take: limit,
    });

    return messages.map((m) => this.formatMessage(m));
  }

  // ─── Send Message ──────────────────────────────────────────────────────────

  /**
   * Persists a new message in a conversation and updates conversation timestamp.
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv || conv.deletedAt) {
      throw new NotFoundException('Cuộc trò chuyện không tồn tại.');
    }

    // Membership verification
    if (conv.user1Id !== senderId && conv.user2Id !== senderId) {
      throw new ForbiddenException('Bạn không phải thành viên của cuộc trò chuyện này.');
    }

    const now = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content: dto.content,
          sentAt: now,
          attachments: dto.attachments?.length
            ? {
                create: dto.attachments.map((att, idx) => ({
                  type: att.type,
                  url: att.url,
                  sizeBytes: att.sizeBytes || 0,
                  sortOrder: att.sortOrder ?? idx,
                })),
              }
            : undefined,
        },
        include: {
          attachments: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      // Update conversation timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: now },
      });

      return msg;
    });

    return this.formatMessage(created);
  }

  // ─── Mark Conversation As Read ─────────────────────────────────────────────

  /**
   * Marks all messages sent by the other participant as read.
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<{ success: boolean; count: number }> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv || conv.deletedAt) {
      throw new NotFoundException('Cuộc trò chuyện không tồn tại.');
    }

    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên cuộc trò chuyện này.');
    }

    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { success: true, count: result.count };
  }

  // ─── Helper: Get Room Context ──────────────────────────────────────────────

  /**
   * Checks if either user has an active tenancy contract in a house owned by the other.
   */
  private async getTenantRoomContext(
    userAId: string,
    userBId: string,
  ): Promise<{ roomName: string; boardingHouseName: string } | null> {
    // 1. Check if userA is tenant of userB
    let tenantContract = await this.prisma.tenantContract.findFirst({
      where: {
        tenantId: userAId,
        contract: {
          status: 'active',
          room: {
            boardingHouse: {
              ownerId: userBId,
            },
          },
        },
      },
      include: {
        contract: {
          include: {
            room: {
              include: {
                boardingHouse: true,
              },
            },
          },
        },
      },
    });

    // 2. Check if userB is tenant of userA
    if (!tenantContract) {
      tenantContract = await this.prisma.tenantContract.findFirst({
        where: {
          tenantId: userBId,
          contract: {
            status: 'active',
            room: {
              boardingHouse: {
                ownerId: userAId,
              },
            },
          },
        },
        include: {
          contract: {
            include: {
              room: {
                include: {
                  boardingHouse: true,
                },
              },
            },
          },
        },
      });
    }

    if (tenantContract?.contract?.room) {
      return {
        roomName: `Phòng ${tenantContract.contract.room.roomNumber}`,
        boardingHouseName: tenantContract.contract.room.boardingHouse.name,
      };
    }

    return null;
  }


  // ─── Contact Directory ─────────────────────────────────────────────────────

  /**
   * Returns contacts for initiating conversations (e.g. active tenants for landlord).
   */
  async getContacts(userId: string): Promise<ContactDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    if (user.role === UserRole.landlord) {
      const tenantContracts = await this.prisma.tenantContract.findMany({
        where: {
          contract: {
            status: 'active',
            room: {
              boardingHouse: {
                ownerId: userId,
              },
            },
          },
        },
        include: {
          tenant: {
            select: {
              id: true,
              username: true,
              phoneNumber: true,
              avatarUrl: true,
              role: true,
              userIdentification: { select: { fullName: true } },
            },
          },
          contract: {
            include: {
              room: {
                include: {
                  boardingHouse: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      const contactsMap = new Map<string, ContactDto>();

      for (const tc of tenantContracts) {
        if (!tc.tenant || tc.tenant.role === UserRole.admin) continue;
        if (!contactsMap.has(tc.tenant.id)) {
          contactsMap.set(tc.tenant.id, {
            id: tc.tenant.id,
            fullName: tc.tenant.userIdentification?.fullName || tc.tenant.username || 'Khách thuê',
            phoneNumber: tc.tenant.phoneNumber || '',
            avatarUrl: tc.tenant.avatarUrl,
            role: tc.tenant.role,
            roomName: `Phòng ${tc.contract.room.roomNumber}`,
            boardingHouseName: tc.contract.room.boardingHouse.name,
          });
        }
      }

      return Array.from(contactsMap.values());
    }

    if (user.role === UserRole.tenant) {
      const tenantContracts = await this.prisma.tenantContract.findMany({
        where: {
          tenantId: userId,
          contract: { status: 'active' },
        },
        include: {
          contract: {
            include: {
              room: {
                include: {
                  boardingHouse: {
                    include: {
                      owner: {
                        select: {
                          id: true,
                          username: true,
                          phoneNumber: true,
                          avatarUrl: true,
                          role: true,
                          userIdentification: { select: { fullName: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const contactsMap = new Map<string, ContactDto>();
      for (const tc of tenantContracts) {
        const owner = tc.contract.room.boardingHouse.owner;
        if (!owner || owner.role === UserRole.admin) continue;
        if (!contactsMap.has(owner.id)) {
          contactsMap.set(owner.id, {
            id: owner.id,
            fullName: owner.userIdentification?.fullName || owner.username || 'Chủ trọ',
            phoneNumber: owner.phoneNumber || '',
            avatarUrl: owner.avatarUrl,
            role: owner.role,
            roomName: `Phòng ${tc.contract.room.roomNumber}`,
            boardingHouseName: tc.contract.room.boardingHouse.name,
          });
        }
      }

      return Array.from(contactsMap.values());
    }

    return [];
  }
}

