import { Injectable, Logger } from '@nestjs/common'
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
import { ContractStatus, OccupantStatus, RoomStatus, UserRole } from '@prisma'

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
      },
    }
  }
}

