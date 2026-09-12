import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PostsService } from './posts.service';
import { AiPostTone } from './dto/create-ai-post-draft.dto';

describe('PostsService - AI Rental Post Suggestions (UC-L-12)', () => {
  let service: PostsService;

  const mockPrisma: any = {
    room: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    aiConversation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    aiMessage: {
      create: jest.fn(),
    },
    boardingHouse: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  describe('generateAiPostDraft', () => {
    const mockDto = {
      roomId: 'room-1',
      tone: AiPostTone.PROFESSIONAL,
      customNotes: 'Miễn phí wifi tháng đầu',
    };

    it('throws NotFoundException if room is not found', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);

      await expect(service.generateAiPostDraft('user-1', mockDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException if room belongs to another landlord', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room-1',
        boardingHouse: {
          id: 'bh-1',
          ownerId: 'different-owner',
        },
      });

      await expect(service.generateAiPostDraft('user-1', mockDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('successfully generates AI rental post draft and records AiConversation and AiMessages', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'room-1',
        roomNumber: '202',
        floor: 2,
        area: new Prisma.Decimal('28.5'),
        maxOccupants: 2,
        status: 'available',
        image_url: 'https://example.com/room-202.jpg',
        boardingHouse: {
          id: 'bh-1',
          name: 'Sunrise Residence',
          houseNumber: '123',
          street: 'Cầu Giấy',
          ward: 'Dịch Vọng',
          district: 'Cầu Giấy',
          city: 'Hà Nội',
          ownerId: 'user-1',
          thumbnail: 'https://example.com/building.jpg',
          services: [
            { id: 's-1', name: 'Điện', price: new Prisma.Decimal('3500.00'), unit: 'kWh' },
            { id: 's-2', name: 'Nước', price: new Prisma.Decimal('25000.00'), unit: 'm3' },
          ],
        },
        roomType: {
          id: 'rt-1',
          name: 'Studio',
        },
        roomServices: [],
        contracts: [
          {
            rentPrice: new Prisma.Decimal('4000000.00'),
          },
        ],
      });

      mockPrisma.aiConversation.findFirst.mockResolvedValue(null);
      mockPrisma.aiConversation.create.mockResolvedValue({ id: 'conv-123' });
      mockPrisma.aiMessage.create.mockResolvedValue({ id: 'msg-1' });

      const result = await service.generateAiPostDraft('user-1', mockDto);

      expect(result).toBeDefined();
      expect(result.conversationId).toBe('conv-123');
      expect(result.title).toContain('P.202');
      expect(result.title).toContain('Sunrise Residence');
      expect(result.content).toContain('TỔNG QUAN PHÒNG TRỌ');
      expect(result.content).toContain('TIỆN NGHI & NỘI THẤT');
      expect(result.content).toContain('BIỂU PHÍ DỊCH VỤ');
      expect(result.depositAmount).toBe(4000000);
      expect(result.highlights).toContain('Miễn phí wifi tháng đầu');
      expect(result.imageUrls).toContain('https://example.com/room-202.jpg');

      // Verify conversation and message creation
      expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          boardingHouseId: 'bh-1',
        },
      });
      expect(mockPrisma.aiMessage.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUnlistedVacantRooms', () => {
    it('returns vacant rooms that do not have an active listing', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        {
          id: 'room-101',
          roomNumber: '101',
          floor: 1,
          area: new Prisma.Decimal('22'),
          status: 'available',
          image_url: null,
          createdAt: new Date(Date.now() - 10 * 86400000),
          updatedAt: new Date(Date.now() - 5 * 86400000),
          roomType: { name: 'Tiêu chuẩn' },
          boardingHouse: {
            id: 'bh-1',
            name: 'Nhà trọ Cầu Giấy',
            houseNumber: '123',
            street: 'Cầu Giấy',
            ward: 'Dịch Vọng',
            district: 'Cầu Giấy',
            city: 'Hà Nội',
            thumbnail: 'https://example.com/thumb.jpg',
          },
          contracts: [],
        },
      ]);

      const result = await service.getUnlistedVacantRooms('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].roomId).toBe('room-101');
      expect(result[0].roomNumber).toBe('101');
      expect(result[0].boardingHouseName).toBe('Nhà trọ Cầu Giấy');
      expect(result[0].vacantDays).toBeGreaterThanOrEqual(5);
    });
  });
});
