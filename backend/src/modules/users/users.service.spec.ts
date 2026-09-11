import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    userIdentification: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('getIdentification', () => {
    it('should throw NotFoundException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getIdentification('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return hasIdentification: false when user has no identification record', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        userIdentification: null,
      });

      const result = await service.getIdentification('user-1');
      expect(result).toEqual({
        hasIdentification: false,
        identification: null,
      });
    });

    it('should return hasIdentification: true with identification details', async () => {
      const mockId = {
        id: 'id-1',
        userId: 'user-1',
        identityNumber: '001202012345',
        fullName: 'NGUYEN VAN A',
      };
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        userIdentification: mockId,
      });

      const result = await service.getIdentification('user-1');
      expect(result).toEqual({
        hasIdentification: true,
        identification: mockId,
      });
    });
  });

  describe('upsertIdentification', () => {
    const dto = {
      identityNumber: '001202012345',
      fullName: 'NGUYEN VAN A',
      dateOfBirth: '2000-01-15',
      gender: 'male' as any,
      nationality: 'Việt Nam',
      placeOfOrigin: 'Hà Nội',
      placeOfResidence: 'TP. HCM',
      issueDate: '2021-05-20',
      expiryDate: '2030-01-15',
      cardFrontUrl: 'https://example.com/front.jpg',
      cardBackUrl: 'https://example.com/back.jpg',
    };

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.upsertIdentification('user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if identityNumber is taken by another user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.userIdentification.findUnique.mockResolvedValue({
        id: 'id-2',
        userId: 'user-2', // Different user!
        identityNumber: dto.identityNumber,
      });

      await expect(service.upsertIdentification('user-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should successfully upsert identification if identityNumber belongs to current user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.userIdentification.findUnique.mockResolvedValue({
        id: 'id-1',
        userId: 'user-1', // Same user
        identityNumber: dto.identityNumber,
      });

      const savedRecord = {
        id: 'id-1',
        userId: 'user-1',
        ...dto,
      };
      prisma.userIdentification.upsert.mockResolvedValue(savedRecord);

      const result = await service.upsertIdentification('user-1', dto);
      expect(result).toEqual({
        hasIdentification: true,
        identification: savedRecord,
      });
      expect(prisma.userIdentification.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });
  });
});
