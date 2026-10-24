import { Test, TestingModule } from '@nestjs/testing'
import { TenantsService } from './tenants.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuthService } from '../auth/auth.service'
import {
  BusinessBadRequestException,
  BusinessConflictException,
  BusinessNotFoundException,
} from '../../common/exceptions/business.exception'
import { OccupantStatus, RoomStatus, UserRole } from '@prisma'

describe('TenantsService', () => {
  let service: TenantsService
  let prisma: any
  let authService: any

  const mockBoardingHouseId = 'bh-uuid-1'
  const mockRoomId = 'room-uuid-1'
  const mockTenantId = 'tenant-uuid-1'
  const mockLandlordId = 'landlord-uuid-1'

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      roomOccupant: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      tenantContract: {
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      room: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      contract: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    }

    authService = {
      findOrCreateByPhone: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
      ],
    }).compile()

    service = module.get<TenantsService>(TenantsService)
  })

  describe('searchUser', () => {
    it('should return found=false when phone does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await service.searchUser('0987654321', mockBoardingHouseId)
      expect(result.found).toBe(false)
      expect(result.inBuilding).toBe(false)
      expect(result.user).toBeNull()
    })

    it('should return found=true and inBuilding=false when user exists in system but not in this house', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: mockTenantId,
        phoneNumber: '0987654321',
        username: 'Nguyen Van An',
        email: 'an@example.com',
        userIdentification: { fullName: 'Nguyen Van An' },
      })
      prisma.roomOccupant.findFirst.mockResolvedValue(null)
      prisma.tenantContract.findFirst.mockResolvedValue(null)

      const result = await service.searchUser('0987654321', mockBoardingHouseId)
      expect(result.found).toBe(true)
      expect(result.inBuilding).toBe(false)
      expect(result.user?.fullName).toBe('Nguyen Van An')
    })

    it('should return inBuilding=true when user is an active occupant in this house', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: mockTenantId,
        phoneNumber: '0987654321',
        username: 'Nguyen Van An',
        userIdentification: null,
      })
      prisma.roomOccupant.findFirst.mockResolvedValue({ id: 'occ-1' })

      const result = await service.searchUser('0987654321', mockBoardingHouseId)
      expect(result.found).toBe(true)
      expect(result.inBuilding).toBe(true)
    })
  })

  describe('quickAddTenant', () => {
    it('should throw NotFoundException if room does not exist', async () => {
      prisma.room.findFirst.mockResolvedValue(null)

      await expect(
        service.quickAddTenant(
          { phoneNumber: '0987654321', fullName: 'Nguyen Van An', roomId: mockRoomId },
          mockLandlordId,
          mockBoardingHouseId,
        ),
      ).rejects.toThrow(BusinessNotFoundException)
    })

    it('should throw ConflictException if tenant is already residing in this house', async () => {
      prisma.room.findFirst.mockResolvedValue({ id: mockRoomId, boardingHouseId: mockBoardingHouseId })
      authService.findOrCreateByPhone.mockResolvedValue({ id: mockTenantId, phoneNumber: '0987654321' })
      prisma.roomOccupant.findFirst.mockResolvedValue({ id: 'existing-occ' })

      await expect(
        service.quickAddTenant(
          { phoneNumber: '0987654321', fullName: 'Nguyen Van An', roomId: mockRoomId },
          mockLandlordId,
          mockBoardingHouseId,
        ),
      ).rejects.toThrow(BusinessConflictException)
    })

    it('should throw BadRequestException if room has reached max occupants', async () => {
      prisma.room.findFirst.mockResolvedValue({
        id: mockRoomId,
        boardingHouseId: mockBoardingHouseId,
        maxOccupants: 2,
      })
      authService.findOrCreateByPhone.mockResolvedValue({ id: mockTenantId, phoneNumber: '0987654321' })
      prisma.roomOccupant.findFirst.mockResolvedValue(null)
      prisma.tenantContract.findFirst.mockResolvedValue(null)
      prisma.roomOccupant.count.mockResolvedValue(2)

      await expect(
        service.quickAddTenant(
          { phoneNumber: '0987654321', fullName: 'Nguyen Van An', roomId: mockRoomId },
          mockLandlordId,
          mockBoardingHouseId,
        ),
      ).rejects.toThrow(BusinessBadRequestException)
    })

    it('should successfully create RoomOccupant and transition room to occupied', async () => {
      prisma.room.findFirst.mockResolvedValue({
        id: mockRoomId,
        boardingHouseId: mockBoardingHouseId,
        status: RoomStatus.available,
        roomNumber: '101',
      })
      authService.findOrCreateByPhone.mockResolvedValue({
        id: mockTenantId,
        phoneNumber: '0987654321',
        username: 'Nguyen Van An',
      })
      prisma.roomOccupant.findFirst.mockResolvedValue(null)
      prisma.tenantContract.findFirst.mockResolvedValue(null)
      prisma.roomOccupant.count.mockResolvedValue(0)
      prisma.roomOccupant.create.mockResolvedValue({
        id: 'occ-123',
        boardingHouseId: mockBoardingHouseId,
        roomId: mockRoomId,
        tenantId: mockTenantId,
        status: OccupantStatus.active,
        joinedAt: new Date(),
        room: { roomNumber: '101' },
        tenant: { id: mockTenantId, phoneNumber: '0987654321', username: 'Nguyen Van An' },
      })

      const res = await service.quickAddTenant(
        { phoneNumber: '0987654321', fullName: 'Nguyen Van An', roomId: mockRoomId },
        mockLandlordId,
        mockBoardingHouseId,
      )

      expect(res.id).toBe('occ-123')
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: mockRoomId },
        data: { status: RoomStatus.occupied },
      })
      expect(prisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('getRoomOccupants', () => {
    it('should return room occupants', async () => {
      prisma.room.findFirst.mockResolvedValue({ id: mockRoomId, boardingHouseId: mockBoardingHouseId })
      prisma.roomOccupant.findMany.mockResolvedValue([
        {
          id: 'occ-1',
          boardingHouseId: mockBoardingHouseId,
          roomId: mockRoomId,
          tenantId: mockTenantId,
          status: OccupantStatus.active,
          joinedAt: new Date(),
          room: { roomNumber: '101' },
          tenant: { id: mockTenantId, phoneNumber: '0987654321', username: 'An' },
        },
      ])

      const result = await service.getRoomOccupants(mockRoomId, mockBoardingHouseId)
      expect(result).toHaveLength(1)
      expect(result[0].tenant.fullName).toBe('An')
    })
  })
})

