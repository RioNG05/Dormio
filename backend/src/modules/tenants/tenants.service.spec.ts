import { Test, TestingModule } from '@nestjs/testing'
import { TenantsService } from './tenants.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuthService } from '../auth/auth.service'
import {
  BusinessBadRequestException,
  BusinessConflictException,
  BusinessNotFoundException,
} from '../../common/exceptions/business.exception'
import { BusinessErrorCode } from '../../common/enums/business-error-code.enum'
import { Gender, OccupantStatus, RoomStatus, UserRole } from '@prisma'

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
        update: jest.fn(),
      },
      userIdentification: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
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
        findFirst: jest.fn(),
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
      prisma.roomOccupant.findFirst.mockResolvedValue({ id: 'occ-1', status: OccupantStatus.active })
      prisma.tenantContract.findFirst.mockResolvedValue(null)

      const result = await service.searchUser('0987654321', mockBoardingHouseId)
      expect(result.found).toBe(true)
      expect(result.inBuilding).toBe(true)
    })
  })

  describe('quickAddTenant', () => {
    const mockDto = {
      roomId: mockRoomId,
      phoneNumber: '0987654321',
      fullName: 'Nguyen Van B',
    }

    it('should throw BusinessNotFoundException if room does not exist', async () => {
      prisma.room.findFirst.mockResolvedValue(null)

      await expect(
        service.quickAddTenant(mockDto, mockLandlordId, mockBoardingHouseId),
      ).rejects.toThrow(BusinessNotFoundException)
    })

    it('should throw BusinessConflictException if user is already an occupant', async () => {
      prisma.room.findFirst.mockResolvedValue({ id: mockRoomId, boardingHouseId: mockBoardingHouseId })
      authService.findOrCreateByPhone.mockResolvedValue({ id: mockTenantId })
      prisma.roomOccupant.findFirst.mockResolvedValue({ id: 'occ-existing' })

      await expect(
        service.quickAddTenant(mockDto, mockLandlordId, mockBoardingHouseId),
      ).rejects.toThrow(BusinessConflictException)
    })

    it('should throw BusinessBadRequestException if room is full', async () => {
      prisma.room.findFirst.mockResolvedValue({
        id: mockRoomId,
        boardingHouseId: mockBoardingHouseId,
        maxOccupants: 2,
      })
      authService.findOrCreateByPhone.mockResolvedValue({ id: mockTenantId })
      prisma.roomOccupant.findFirst.mockResolvedValue(null)
      prisma.tenantContract.findFirst.mockResolvedValue(null)
      prisma.roomOccupant.count.mockResolvedValue(2)

      await expect(
        service.quickAddTenant(mockDto, mockLandlordId, mockBoardingHouseId),
      ).rejects.toThrow(BusinessBadRequestException)
    })

    it('should successfully create occupant and transition room status to occupied', async () => {
      prisma.room.findFirst.mockResolvedValue({
        id: mockRoomId,
        boardingHouseId: mockBoardingHouseId,
        maxOccupants: 4,
        status: RoomStatus.available,
      })
      authService.findOrCreateByPhone.mockResolvedValue({ id: mockTenantId })
      prisma.roomOccupant.findFirst.mockResolvedValue(null)
      prisma.tenantContract.findFirst.mockResolvedValue(null)
      prisma.roomOccupant.count.mockResolvedValue(0)

      const createdOccupant = {
        id: 'occ-new',
        boardingHouseId: mockBoardingHouseId,
        roomId: mockRoomId,
        tenantId: mockTenantId,
        status: OccupantStatus.active,
        joinedAt: new Date(),
        room: { roomNumber: '101' },
        tenant: { id: mockTenantId, phoneNumber: '0987654321', username: 'Nguyen Van B' },
      }
      prisma.roomOccupant.create.mockResolvedValue(createdOccupant)

      const result = await service.quickAddTenant(mockDto, mockLandlordId, mockBoardingHouseId)

      expect(result.id).toBe('occ-new')
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
          tenant: { id: mockTenantId, phoneNumber: '0987654321', username: 'An', mustChangePassword: true },
        },
      ])

      const result = await service.getRoomOccupants(mockRoomId, mockBoardingHouseId)
      expect(result).toHaveLength(1)
      expect(result[0].tenant.fullName).toBe('An')
      expect(result[0].tenant.mustChangePassword).toBe(true)
    })
  })

  describe('updateTenant', () => {
    it('should throw BusinessNotFoundException if tenant does not belong to boarding house', async () => {
      prisma.roomOccupant.findFirst.mockResolvedValue(null)
      prisma.contract.findFirst.mockResolvedValue(null)

      await expect(
        service.updateTenant(mockLandlordId, mockBoardingHouseId, mockTenantId, { note: 'test' }),
      ).rejects.toThrow(BusinessNotFoundException)
    })

    it('should throw TENANT_PROFILE_LOCKED if tenant mustChangePassword=false and identification fields are updated', async () => {
      prisma.roomOccupant.findFirst.mockResolvedValue({
        id: 'occ-1',
        boardingHouseId: mockBoardingHouseId,
        tenantId: mockTenantId,
      })
      prisma.contract.findFirst.mockResolvedValue(null)
      prisma.user.findUnique.mockResolvedValue({
        id: mockTenantId,
        mustChangePassword: false, // Tenant has already claimed their account!
        userIdentification: { identityNumber: '001202012345' },
      })

      await expect(
        service.updateTenant(mockLandlordId, mockBoardingHouseId, mockTenantId, {
          fullName: 'New Name',
        }),
      ).rejects.toThrow(BusinessConflictException)
    })

    it('should allow updating UserIdentification if tenant mustChangePassword=true', async () => {
      prisma.roomOccupant.findFirst.mockResolvedValue({
        id: 'occ-1',
        boardingHouseId: mockBoardingHouseId,
        tenantId: mockTenantId,
      })
      prisma.contract.findFirst.mockResolvedValue(null)
      prisma.user.findUnique.mockResolvedValue({
        id: mockTenantId,
        username: 'Initial Name',
        mustChangePassword: true, // Tenant has NOT changed password yet
        userIdentification: null,
      })
      prisma.userIdentification.findUnique.mockResolvedValue(null)
      prisma.userIdentification.upsert.mockResolvedValue({})
      prisma.user.update.mockResolvedValue({})
      prisma.roomOccupant.update.mockResolvedValue({})

      const res = await service.updateTenant(mockLandlordId, mockBoardingHouseId, mockTenantId, {
        fullName: 'New Name',
        identityNumber: '001202099999',
        gender: Gender.male,
        dateOfBirth: '2001-05-10',
        placeOfResidence: { province: 'Hà Nội' },
        note: 'New note',
      })

      expect(res.success).toBe(true)
      expect(prisma.userIdentification.upsert).toHaveBeenCalled()
      expect(prisma.roomOccupant.update).toHaveBeenCalled()
    })

    it('should allow updating internal note and email even if mustChangePassword=false', async () => {
      const activeOcc = {
        id: 'occ-1',
        boardingHouseId: mockBoardingHouseId,
        tenantId: mockTenantId,
      }
      prisma.roomOccupant.findFirst.mockResolvedValue(activeOcc)
      prisma.contract.findFirst.mockResolvedValue(null)
      prisma.user.findUnique.mockResolvedValue({
        id: mockTenantId,
        mustChangePassword: false, // Activated
        userIdentification: { identityNumber: '001202012345' },
      })
      prisma.user.update.mockResolvedValue({})
      prisma.roomOccupant.update.mockResolvedValue({})

      const res = await service.updateTenant(mockLandlordId, mockBoardingHouseId, mockTenantId, {
        note: 'Only updating note',
        email: 'newemail@example.com',
      })

      expect(res.success).toBe(true)
      expect(prisma.userIdentification.upsert).not.toHaveBeenCalled()
      expect(prisma.roomOccupant.update).toHaveBeenCalledWith({
        where: { id: activeOcc.id },
        data: { note: 'Only updating note' },
      })
    })
  })
})
