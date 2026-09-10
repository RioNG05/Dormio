import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole, MessageAttachmentType } from '@prisma';

describe('MessagesService', () => {
  let service: MessagesService;

  const mockUser1Id = '11111111-1111-1111-1111-111111111111';
  const mockUser2Id = '22222222-2222-2222-2222-222222222222';
  const mockAdminId = '99999999-9999-9999-9999-999999999999';

  const mockUser1 = {
    id: mockUser1Id,
    username: 'landlord_john',
    role: UserRole.landlord,
    phoneNumber: '0901234567',
    avatarUrl: null,
    userIdentification: { fullName: 'John Doe' },
  };

  const mockUser2 = {
    id: mockUser2Id,
    username: 'tenant_alice',
    role: UserRole.tenant,
    phoneNumber: '0987654321',
    avatarUrl: null,
    userIdentification: { fullName: 'Alice Smith' },
  };

  const mockAdminUser = {
    id: mockAdminId,
    username: 'admin_master',
    role: UserRole.admin,
    phoneNumber: '0999999999',
    avatarUrl: null,
  };

  const transactionClient = {
    message: {
      create: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    conversation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    tenantContract: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback(transactionClient),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  describe('getOrCreateConversation (UC-L-11)', () => {
    it('should find existing conversation with normalized user pair', async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === mockUser1Id) return Promise.resolve(mockUser1);
        if (where.id === mockUser2Id) return Promise.resolve(mockUser2);
        return Promise.resolve(null);
      });

      const existingConv = {
        id: 'conv-uuid-1',
        name: `${mockUser1Id}_${mockUser2Id}`,
        user1Id: mockUser1Id,
        user2Id: mockUser2Id,
        createdAt: new Date('2026-09-01T10:00:00.000Z'),
        updatedAt: new Date('2026-09-01T10:00:00.000Z'),
        messages: [],
      };

      mockPrisma.conversation.findFirst.mockResolvedValue(existingConv);
      mockPrisma.message.count.mockResolvedValue(0);
      mockPrisma.tenantContract.findFirst.mockResolvedValue(null);

      // Call with reversed order (user2, user1)
      const result = await service.getOrCreateConversation(mockUser2Id, mockUser1Id);

      // Verify normalization: user1Id < user2Id
      expect(mockPrisma.conversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user1Id: mockUser1Id,
            user2Id: mockUser2Id,
            deletedAt: null,
          },
        }),
      );

      expect(result.id).toBe('conv-uuid-1');
      expect(result.participant.id).toBe(mockUser1Id);
    });

    it('should create new conversation if none exists', async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === mockUser1Id) return Promise.resolve(mockUser1);
        if (where.id === mockUser2Id) return Promise.resolve(mockUser2);
        return Promise.resolve(null);
      });

      mockPrisma.conversation.findFirst.mockResolvedValue(null);

      const createdConv = {
        id: 'conv-new-1',
        name: `${mockUser1Id}_${mockUser2Id}`,
        user1Id: mockUser1Id,
        user2Id: mockUser2Id,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      };

      mockPrisma.conversation.create.mockResolvedValue(createdConv);
      mockPrisma.message.count.mockResolvedValue(0);
      mockPrisma.tenantContract.findFirst.mockResolvedValue(null);

      const result = await service.getOrCreateConversation(mockUser1Id, mockUser2Id);

      expect(mockPrisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            name: `${mockUser1Id}_${mockUser2Id}`,
            user1Id: mockUser1Id,
            user2Id: mockUser2Id,
          },
        }),
      );
      expect(result.id).toBe('conv-new-1');
    });

    it('should throw ForbiddenException if either user is an admin (Rule 4 of UC-L-11)', async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.id === mockUser1Id) return Promise.resolve(mockUser1);
        if (where.id === mockAdminId) return Promise.resolve(mockAdminUser);
        return Promise.resolve(null);
      });

      await expect(
        service.getOrCreateConversation(mockUser1Id, mockAdminId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if user chats with themselves', async () => {
      await expect(
        service.getOrCreateConversation(mockUser1Id, mockUser1Id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendMessage', () => {
    it('should persist message and attachments and update conversation updatedAt', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        user1Id: mockUser1Id,
        user2Id: mockUser2Id,
        deletedAt: null,
      });

      const createdMsg = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: mockUser1Id,
        content: 'Hello with picture',
        isReacted: false,
        sentAt: new Date('2026-09-09T14:00:00.000Z'),
        readAt: null,
        attachments: [
          {
            id: 'att-1',
            type: MessageAttachmentType.image,
            url: 'https://image.png',
            sizeBytes: 2048,
            sortOrder: 0,
          },
        ],
      };

      transactionClient.message.create.mockResolvedValue(createdMsg);
      transactionClient.conversation.update.mockResolvedValue({});

      const result = await service.sendMessage('conv-1', mockUser1Id, {
        content: 'Hello with picture',
        attachments: [
          {
            type: MessageAttachmentType.image,
            url: 'https://image.png',
            sizeBytes: 2048,
          },
        ],
      });

      expect(transactionClient.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversationId: 'conv-1',
            senderId: mockUser1Id,
            content: 'Hello with picture',
          }),
        }),
      );

      expect(transactionClient.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-1' },
        }),
      );

      expect(result.id).toBe('msg-1');
      expect(result.attachments).toHaveLength(1);
    });

    it('should throw ForbiddenException if sender is not participant', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        user1Id: mockUser1Id,
        user2Id: mockUser2Id,
        deletedAt: null,
      });

      await expect(
        service.sendMessage('conv-1', 'outsider-id', { content: 'test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markConversationAsRead', () => {
    it('should update readAt for unread messages sent to user', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        user1Id: mockUser1Id,
        user2Id: mockUser2Id,
        deletedAt: null,
      });

      mockPrisma.message.updateMany.mockResolvedValue({ count: 3 });

      const res = await service.markConversationAsRead('conv-1', mockUser1Id);

      expect(mockPrisma.message.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            conversationId: 'conv-1',
            senderId: { not: mockUser1Id },
            readAt: null,
          },
        }),
      );

      expect(res.count).toBe(3);
    });
  });

  describe('getContacts', () => {
    it('should return active tenants for a landlord user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser1);
      mockPrisma.tenantContract.findMany.mockResolvedValue([
        {
          tenant: mockUser2,
          contract: {
            room: {
              roomNumber: '101',
              boardingHouse: { name: 'Dormio Mansion' },
            },
          },
        },
      ]);

      const contacts = await service.getContacts(mockUser1Id);

      expect(contacts).toHaveLength(1);
      expect(contacts[0].fullName).toBe('Alice Smith');
      expect(contacts[0].roomName).toBe('Phòng 101');
      expect(contacts[0].boardingHouseName).toBe('Dormio Mansion');
    });
  });
});

