import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuthService } from '../auth/auth.service'
import {
  BusinessBadRequestException,
  BusinessConflictException,
  BusinessNotFoundException,
} from '../../common/exceptions/business.exception'
import { BusinessErrorCode } from '../../common/enums/business-error-code.enum'
import { QuickAddTenantDto } from './dto/quick-add-tenant.dto'
import { QueryTenantsDto } from './dto/query-tenants.dto'
import { SearchTenantResponseDto } from './dto/search-tenant-response.dto'
import { RoomOccupantResponseDto } from './dto/room-occupant-response.dto'
import { LandlordTenantItemDto, LandlordTenantListResponseDto } from './dto/tenant-list-response.dto'
import { UpdateLandlordTenantDto } from './dto/update-landlord-tenant.dto'
import { ContractStatus, Gender, OccupantStatus, RoomStatus, UserRole } from '@prisma'

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Search user by phone number (UC-L-04B Step 1)
   * Determines if phone exists in Dormio, and whether user is already active in this house.
   */
  async searchUser(phoneNumber: string, boardingHouseId: string): Promise<SearchTenantResponseDto> {
    const trimmed = (phoneNumber || '').trim()
    this.logger.log(`searchUser phone="${trimmed}" boardingHouseId="${boardingHouseId}"`)

    if (!trimmed) {
      return { success: true, found: false, inBuilding: false, user: null }
    }

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: trimmed },
      include: {
        userIdentification: true,
      },
    })

    if (!user) {
      return {
        success: true,
        found: false,
        inBuilding: false,
        user: null,
      }
    }

    // Check if user is already an active resident in this boarding house
    // 1. Through active RoomOccupant
    const activeOccupant = await this.prisma.roomOccupant.findFirst({
      where: {
        tenantId: user.id,
        boardingHouseId,
        status: OccupantStatus.active,
      },
    })

    // 2. Through active Contract
    const activeContract = await this.prisma.tenantContract.findFirst({
      where: {
        tenantId: user.id,
        contract: {
          room: { boardingHouseId },
          status: ContractStatus.active,
        },
      },
    })

    const inBuilding = !!activeOccupant || !!activeContract

    const displayName =
      user.userIdentification?.fullName || user.username || user.phoneNumber

    return {
      success: true,
      found: true,
      inBuilding,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        fullName: displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    }
  }

  /**
   * Quick Add Tenant to Room without contract (UC-L-04B)
   * Resolves or provisions User account with default password '88888888' and mustChangePassword=true
   */
  async quickAddTenant(
    dto: QuickAddTenantDto,
    landlordId: string,
    boardingHouseId: string,
  ): Promise<RoomOccupantResponseDto> {
    this.logger.log(`quickAddTenant phone="${dto.phoneNumber}" roomId="${dto.roomId}"`)

    // 1. Validate room exists and belongs to this boarding house
    const room = await this.prisma.room.findFirst({
      where: { id: dto.roomId, boardingHouseId },
    })

    if (!room) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.ROOM_NOT_FOUND,
        'Room not found or does not belong to this boarding house.',
      )
    }

    // 2. Resolve or create user via shared findOrCreateByPhone
    const tenantUser = await this.authService.findOrCreateByPhone(
      dto.phoneNumber.trim(),
      dto.fullName.trim(),
      UserRole.tenant,
    )

    // 3. Ensure user is not already residing in this boarding house
    const existingOccupancy = await this.prisma.roomOccupant.findFirst({
      where: {
        tenantId: tenantUser.id,
        boardingHouseId,
        status: OccupantStatus.active,
      },
    })

    const existingContract = await this.prisma.tenantContract.findFirst({
      where: {
        tenantId: tenantUser.id,
        contract: {
          room: { boardingHouseId },
          status: ContractStatus.active,
        },
      },
    })

    if (existingOccupancy || existingContract) {
      throw new BusinessConflictException(
        BusinessErrorCode.TENANT_ALREADY_IN_HOUSE,
        'Tenant is already an active resident in this boarding house.',
      )
    }

    // 4. Check room capacity
    const currentOccupantsCount = await this.prisma.roomOccupant.count({
      where: { roomId: dto.roomId, status: OccupantStatus.active },
    })

    if (room.maxOccupants && currentOccupantsCount >= room.maxOccupants) {
      throw new BusinessBadRequestException(
        BusinessErrorCode.ROOM_MAX_OCCUPANTS_REACHED,
        `Room has reached its maximum capacity of ${room.maxOccupants} occupants.`,
      )
    }

    // 5. Execute creation within a transaction
    const occupant = await this.prisma.$transaction(async (tx) => {
      const created = await tx.roomOccupant.create({
        data: {
          boardingHouseId,
          roomId: dto.roomId,
          tenantId: tenantUser.id,
          status: OccupantStatus.active,
          note: dto.note?.trim() || null,
        },
        include: {
          room: true,
          tenant: {
            include: {
              userIdentification: true,
            },
          },
        },
      })

      // Update room status to occupied if currently available
      if (room.status === RoomStatus.available) {
        await tx.room.update({
          where: { id: room.id },
          data: { status: RoomStatus.occupied },
        })
      }

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'ROOM_OCCUPANT',
          entityId: created.id,
          boardingHouseId,
          userId: landlordId,
          ipAddress: '127.0.0.1',
          newValue: {
            occupantId: created.id,
            roomId: created.roomId,
            tenantId: created.tenantId,
            phoneNumber: dto.phoneNumber,
            fullName: dto.fullName,
          },
        },
      })

      return created
    })

    return this.mapToRoomOccupantDto(occupant)
  }

  /**
   * Get active occupants in a room (used by Contract Creation wizard)
   */
  async getRoomOccupants(
    roomId: string,
    boardingHouseId: string,
  ): Promise<RoomOccupantResponseDto[]> {
    this.logger.log(`getRoomOccupants roomId="${roomId}" boardingHouseId="${boardingHouseId}"`)

    const room = await this.prisma.room.findFirst({
      where: { id: roomId, boardingHouseId },
    })

    if (!room) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.ROOM_NOT_FOUND,
        'Room not found or does not belong to this boarding house.',
      )
    }

    const occupants = await this.prisma.roomOccupant.findMany({
      where: {
        roomId,
        boardingHouseId,
        status: OccupantStatus.active,
      },
      include: {
        room: true,
        tenant: {
          include: {
            userIdentification: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return occupants.map((occ) => this.mapToRoomOccupantDto(occ))
  }

  /**
   * Get unified list of tenants for the boarding house (contracts + room occupants)
   */
  async getLandlordTenants(
    boardingHouseId: string,
    query: QueryTenantsDto,
  ): Promise<LandlordTenantListResponseDto> {
    this.logger.log(`getLandlordTenants boardingHouseId="${boardingHouseId}"`)
    const page = Math.max(1, query.page || 1)
    const limit = Math.max(1, query.limit || 10)
    const search = (query.search || '').trim().toLowerCase()

    // 1. Fetch all active/draft contracts in this house
    const contracts = await this.prisma.contract.findMany({
      where: {
        room: { boardingHouseId },
        status: { in: [ContractStatus.active, ContractStatus.draft] },
        ...(query.roomId ? { roomId: query.roomId } : {}),
      },
      include: {
        room: true,
        tenantContracts: {
          include: {
            tenant: {
              include: { userIdentification: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 2. Fetch all RoomOccupants in this house
    const occupants = await this.prisma.roomOccupant.findMany({
      where: {
        boardingHouseId,
        ...(query.roomId ? { roomId: query.roomId } : {}),
        ...(query.status && query.status !== 'all'
          ? { status: query.status as OccupantStatus }
          : { status: OccupantStatus.active }),
      },
      include: {
        room: true,
        tenant: {
          include: { userIdentification: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const items: LandlordTenantItemDto[] = []
    const seenTenantIds = new Set<string>()

    // Helper for formatting residence address
    const formatResidence = (ident: any) => {
      if (!ident?.placeOfResidence) return null
      if (typeof ident.placeOfResidence === 'string') return ident.placeOfResidence
      if (typeof ident.placeOfResidence === 'object') {
        return Object.values(ident.placeOfResidence).filter(Boolean).join(', ')
      }
      return null
    }

    // Map contract tenants
    for (const c of contracts) {
      const daysRemaining = c.endDate
        ? Math.max(0, Math.ceil((c.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : undefined

      const contractStatusStr =
        c.status === ContractStatus.active
          ? daysRemaining !== undefined && daysRemaining <= 30
            ? 'Sắp hết hợp đồng'
            : 'Đang ở'
          : c.status === ContractStatus.draft
            ? 'Sắp hết hợp đồng'
            : 'Đã rời'

      for (const tc of c.tenantContracts) {
        if (!tc.tenant) continue
        seenTenantIds.add(tc.tenant.id)
        const ident = tc.tenant.userIdentification
        const fullName =
          ident?.fullName || tc.tenant.username || tc.tenant.phoneNumber

        items.push({
          id: `contract_${tc.id}`,
          userId: tc.tenant.id,
          fullName,
          phoneNumber: tc.tenant.phoneNumber,
          roomId: c.roomId,
          roomNumber: c.room?.roomNumber || '—',
          boardingHouseId,
          tenancyType: 'contract',
          contractId: c.id,
          status: contractStatusStr,
          joinedAt: c.startDate ? c.startDate.toISOString().split('T')[0] : '—',
          endDate: c.endDate ? c.endDate.toISOString().split('T')[0] : undefined,
          daysRemaining,
          email: tc.tenant.email,
          identityNumber: ident?.identityNumber || null,
          dateOfBirth: ident?.dateOfBirth ? ident.dateOfBirth.toISOString().split('T')[0] : null,
          gender: ident?.gender || null,
          address: formatResidence(ident),
          cardFrontUrl: ident?.cardFrontUrl || null,
          cardBackUrl: ident?.cardBackUrl || null,
          hasAccount: true,
          mustChangePassword: Boolean(tc.tenant.mustChangePassword),
        })
      }
    }

    // Map room occupants (who are not yet added via contract)
    for (const occ of occupants) {
      if (seenTenantIds.has(occ.tenantId)) {
        continue // Already listed under contract
      }

      const ident = occ.tenant.userIdentification
      const fullName =
        ident?.fullName || occ.tenant.username || occ.tenant.phoneNumber

      items.push({
        id: occ.id,
        userId: occ.tenant.id,
        fullName,
        phoneNumber: occ.tenant.phoneNumber,
        roomId: occ.roomId,
        roomNumber: occ.room?.roomNumber || '—',
        boardingHouseId,
        tenancyType: 'direct_occupant',
        contractId: undefined,
        status: occ.status === OccupantStatus.active ? 'Đang ở' : 'Đã rời',
        joinedAt: occ.joinedAt.toISOString().split('T')[0],
        endDate: undefined,
        daysRemaining: undefined,
        email: occ.tenant.email,
        identityNumber: ident?.identityNumber || null,
        dateOfBirth: ident?.dateOfBirth ? ident.dateOfBirth.toISOString().split('T')[0] : null,
        gender: ident?.gender || null,
        address: formatResidence(ident),
        cardFrontUrl: ident?.cardFrontUrl || null,
        cardBackUrl: ident?.cardBackUrl || null,
        hasAccount: true,
        mustChangePassword: Boolean(occ.tenant.mustChangePassword),
      })
    }

    // Filter by search
    const filtered = items.filter((item) => {
      if (!search) return true
      return (
        item.fullName.toLowerCase().includes(search) ||
        item.phoneNumber.includes(search) ||
        (item.identityNumber && item.identityNumber.includes(search)) ||
        item.roomNumber.toLowerCase().includes(search)
      )
    })

    const total = filtered.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginated = filtered.slice(offset, offset + limit)

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    }
  }

  /**
   * Update tenant information by landlord (UC-L-04B & Customer Modal).
   * If mustChangePassword === true (tenant hasn't activated/logged in yet),
   * landlord is permitted to edit their UserIdentification.
   * If mustChangePassword === false, landlord cannot modify official identification.
   */
  async updateTenant(
    landlordId: string,
    boardingHouseId: string,
    tenantIdOrUserId: string,
    dto: UpdateLandlordTenantDto,
  ) {
    this.logger.log(
      `updateTenant landlordId="${landlordId}" boardingHouseId="${boardingHouseId}" target="${tenantIdOrUserId}"`,
    )

    // Resolve target userId (supports either occupantId, contractId, or direct userId)
    let targetUserId = tenantIdOrUserId
    if (targetUserId.startsWith('cust_')) {
      targetUserId = targetUserId.replace(/^cust_/, '')
    }
    if (targetUserId.startsWith('contract_')) {
      targetUserId = targetUserId.replace(/^contract_/, '')
    }

    // Check if target is an occupant ID
    const foundOccupant = await this.prisma.roomOccupant.findFirst({
      where: { id: targetUserId, boardingHouseId },
      include: { tenant: true },
    })

    if (foundOccupant) {
      targetUserId = foundOccupant.tenantId
    }

    // Check if target is a tenantContract ID
    const foundTc = await this.prisma.tenantContract.findFirst({
      where: {
        id: targetUserId,
        contract: { room: { boardingHouseId } },
      },
      include: { tenant: true },
    })
    if (foundTc) {
      targetUserId = foundTc.tenantId
    }

    // Verify tenant belongs to this boarding house (occupant or contract)
    const [activeOccupant, activeContract] = await Promise.all([
      this.prisma.roomOccupant.findFirst({
        where: {
          boardingHouseId,
          tenantId: targetUserId,
        },
      }),
      this.prisma.contract.findFirst({
        where: {
          room: { boardingHouseId },
          tenantContracts: {
            some: { tenantId: targetUserId },
          },
        },
      }),
    ])

    if (!activeOccupant && !activeContract) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.TENANT_NOT_FOUND,
        'Tenant not found in this boarding house.',
      )
    }

    const tenantUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { userIdentification: true },
    })

    if (!tenantUser) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.TENANT_NOT_FOUND,
        'Tenant user account not found.',
      )
    }

    const hasIdentificationUpdates =
      dto.fullName !== undefined ||
      dto.identityNumber !== undefined ||
      dto.dateOfBirth !== undefined ||
      dto.gender !== undefined ||
      dto.placeOfResidence !== undefined

    if (hasIdentificationUpdates) {
      if (!tenantUser.mustChangePassword) {
        throw new BusinessConflictException(
          BusinessErrorCode.TENANT_PROFILE_LOCKED,
          'Tenant has already activated their account and changed their password. Personal identification cannot be modified by the landlord.',
        )
      }

      if (dto.identityNumber) {
        const existingIdent = await this.prisma.userIdentification.findUnique({
          where: { identityNumber: dto.identityNumber },
        })
        if (existingIdent && existingIdent.userId !== targetUserId) {
          throw new BusinessConflictException(
            BusinessErrorCode.COMMON_VALIDATION_ERROR,
            'Citizen identification number (CCCD) is already registered by another account.',
          )
        }
      }

      const placeOfResidence =
        typeof dto.placeOfResidence === 'string'
          ? { address: dto.placeOfResidence }
          : dto.placeOfResidence || tenantUser.userIdentification?.placeOfResidence || {}

      const dateOfBirth = dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : tenantUser.userIdentification?.dateOfBirth || new Date('2000-01-01')

      await this.prisma.userIdentification.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          identityNumber: dto.identityNumber || `TMP_${Date.now()}`,
          fullName: dto.fullName?.trim() || tenantUser.username || '',
          dateOfBirth,
          gender: dto.gender || Gender.male,
          nationnality: 'Việt Nam',
          placeOfOrigin: {},
          placeOfResidence,
          issueDate: new Date(),
          expiryDate: new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000),
          personalIdentification: randomUUID(),
          note: dto.note || '',
          cardFrontUrl: '',
          cardBackUrl: '',
        },
        update: {
          ...(dto.identityNumber ? { identityNumber: dto.identityNumber } : {}),
          ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
          ...(dto.dateOfBirth ? { dateOfBirth } : {}),
          ...(dto.gender ? { gender: dto.gender } : {}),
          ...(dto.placeOfResidence !== undefined ? { placeOfResidence } : {}),
        },
      })
    }

    // Update email and username if applicable
    if (dto.email !== undefined || (dto.fullName && tenantUser.mustChangePassword)) {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: {
          ...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
          ...(dto.fullName && tenantUser.mustChangePassword ? { username: dto.fullName.trim() } : {}),
        },
      })
    }

    // Update note on active occupant if exists
    if (dto.note !== undefined && activeOccupant) {
      await this.prisma.roomOccupant.update({
        where: { id: activeOccupant.id },
        data: { note: dto.note.trim() },
      })
    }

    return {
      success: true,
      message: 'Tenant updated successfully',
    }
  }

  /**
   * Check out an occupant
   */
  async checkoutOccupant(occupantId: string, landlordId: string, boardingHouseId: string) {
    this.logger.log(`checkoutOccupant occupantId="${occupantId}" boardingHouseId="${boardingHouseId}"`)

    const occupant = await this.prisma.roomOccupant.findFirst({
      where: { id: occupantId, boardingHouseId },
      include: { room: true },
    })

    if (!occupant) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.TENANT_NOT_FOUND,
        'Occupant record not found.',
      )
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.roomOccupant.update({
        where: { id: occupantId },
        data: {
          status: OccupantStatus.moved_out,
          leftAt: new Date(),
        },
      })

      // Check if room has remaining active occupants
      const remainingOccupants = await tx.roomOccupant.count({
        where: { roomId: occupant.roomId, status: OccupantStatus.active },
      })

      const remainingContracts = await tx.contract.count({
        where: { roomId: occupant.roomId, status: ContractStatus.active },
      })

      if (remainingOccupants === 0 && remainingContracts === 0) {
        await tx.room.update({
          where: { id: occupant.roomId },
          data: { status: RoomStatus.available },
        })
      }

      await tx.auditLog.create({
        data: {
          action: 'update',
          entityType: 'ROOM_OCCUPANT',
          entityId: occupantId,
          boardingHouseId,
          userId: landlordId,
          ipAddress: '127.0.0.1',
          newValue: { status: OccupantStatus.moved_out },
        },
      })

      return { success: true, message: 'Occupant checked out successfully.' }
    })
  }

  private mapToRoomOccupantDto(occupant: any): RoomOccupantResponseDto {
    const ident = occupant.tenant?.userIdentification
    return {
      id: occupant.id,
      boardingHouseId: occupant.boardingHouseId,
      roomId: occupant.roomId,
      roomNumber: occupant.room?.roomNumber || '—',
      tenantId: occupant.tenantId,
      status: occupant.status,
      joinedAt: occupant.joinedAt,
      leftAt: occupant.leftAt,
      note: occupant.note,
      tenant: {
        id: occupant.tenant?.id,
        phoneNumber: occupant.tenant?.phoneNumber,
        fullName:
          ident?.fullName ||
          occupant.tenant?.username ||
          occupant.tenant?.phoneNumber,
        email: occupant.tenant?.email,
        avatarUrl: occupant.tenant?.avatarUrl,
        identityNumber: ident?.identityNumber || null,
        dateOfBirth: ident?.dateOfBirth ? ident.dateOfBirth.toISOString() : null,
        gender: ident?.gender || null,
        placeOfResidence: ident?.placeOfResidence || null,
        cardFrontUrl: ident?.cardFrontUrl || null,
        cardBackUrl: ident?.cardBackUrl || null,
        hasAccount: true,
        mustChangePassword: Boolean(occupant.tenant?.mustChangePassword),
      },
    }
  }
}
