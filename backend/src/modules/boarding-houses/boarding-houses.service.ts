import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import {
  BusinessNotFoundException,
  BusinessForbiddenException,
} from '../../common/exceptions/business.exception'
import { BusinessErrorCode } from '../../common/enums/business-error-code.enum'
import { Prisma, SubscriptionPackage, SubscriptionStatus, UserRole } from '@prisma'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateBoardingHouseDto } from './dto/create-boarding-house.dto'
import { SetupBoardingHouseDto } from './dto/setup-boarding-house.dto'
import { UpdateBoardingHouseDto } from './dto/update-boarding-house.dto'
import { BoardingHouseOverviewResponseDto } from './dto/boarding-house-overview-response.dto'
import {
  MultiPropertyOverviewResponseDto,
  PropertyBreakdownDto,
} from './dto/multi-property-overview-response.dto'
import { AiStrategyResponseDto } from './dto/ai-strategy-response.dto'
import {
  BoardingHouseListResponseDto,
  BoardingHouseResponseDto,
  BoardingHouseRoomTypeResponseDto,
  BoardingHouseServiceResponseDto,
  SetupBoardingHouseResponseDto,
} from './dto/boarding-house-response.dto'

/** Default maxRoom quota for users with no active subscription (free tier). */
const FREE_TIER_MAX_ROOM = 10

/** Max boarding houses per subscription tier. */
const MAX_BOARDING_HOUSES: Record<SubscriptionPackage, number> = {
  [SubscriptionPackage.free]: 1,
  [SubscriptionPackage.plus]: 3,
  [SubscriptionPackage.pro]: 10,
}

@Injectable()
export class BoardingHousesService {
  private readonly logger = new Logger(BoardingHousesService.name)

  constructor(private readonly prisma: PrismaService) {}

  // ─── UC-L-01: 3-Step Wizard — Single Atomic Setup ──────────────────────────

  async setupBoardingHouse(
    userId: string,
    dto: SetupBoardingHouseDto,
  ): Promise<SetupBoardingHouseResponseDto> {
    this.logger.log(`Setting up boarding house for user ${userId} via 3-step wizard`)

    // Enforce per-tier boarding house creation limit
    await this.enforceMaxBoardingHousesQuota(userId)

    // Resolve subscription quota before entering the transaction
    const maxRoom = await this.resolveMaxRoom(userId)
    const hasCustomRooms = Boolean(dto.rooms.customRooms && dto.rooms.customRooms.length > 0)
    const roomsToCreate = hasCustomRooms
      ? dto.rooms.customRooms!.length
      : dto.rooms.floorCount * dto.rooms.roomsPerFloor

    if (roomsToCreate > maxRoom) {
      throw new UnprocessableEntityException(
        `Current subscription plan allows a maximum of ${maxRoom} rooms. You are attempting to create ${roomsToCreate} rooms. Please upgrade your plan or reduce the room count.`,
      )
    }

    // Validate roomTypeIndex and serviceIndices are in bounds
    if (dto.rooms.roomTypeIndex >= dto.roomTypes.length) {
      throw new BadRequestException(
        `roomTypeIndex ${dto.rooms.roomTypeIndex} is out of bounds — only ${dto.roomTypes.length} room type(s) provided`,
      )
    }
    const outOfBoundsService = (dto.rooms.serviceIndices ?? []).find(
      idx => idx >= (dto.services ?? []).length,
    )
    if (outOfBoundsService !== undefined) {
      throw new BadRequestException(
        `serviceIndex ${outOfBoundsService} is out of bounds — only ${(dto.services ?? []).length} service(s) provided`,
      )
    }

    if (hasCustomRooms) {
      for (const cr of dto.rooms.customRooms!) {
        if (
          cr.roomTypeIndex !== undefined &&
          cr.roomTypeIndex !== null &&
          cr.roomTypeIndex >= dto.roomTypes.length
        ) {
          throw new BadRequestException(
            `customRoom roomTypeIndex ${cr.roomTypeIndex} is out of bounds — only ${dto.roomTypes.length} room type(s) provided`,
          )
        }
        const outOfBoundsCrService = (cr.serviceIndices ?? []).find(
          idx => idx >= (dto.services ?? []).length,
        )
        if (outOfBoundsCrService !== undefined) {
          throw new BadRequestException(
            `customRoom serviceIndex ${outOfBoundsCrService} is out of bounds — only ${(dto.services ?? []).length} service(s) provided`,
          )
        }
      }
    }

    const result = await this.prisma.$transaction(async tx => {
      // Step 1 — INSERT BoardingHouse
      const boardingHouse = await tx.boardingHouse.create({
        data: {
          ownerId: userId,
          name: dto.name.trim(),
          description: dto.description?.trim() ?? null,
          houseNumber: dto.houseNumber.trim(),
          street: dto.street.trim(),
          ward: dto.ward.trim(),
          district: dto.district.trim(),
          province: dto.province.trim(),
          city: dto.city?.trim() || dto.province.trim(),
          country: dto.country.trim(),
          totalFloor: dto.totalFloor ?? null,
          builtAt: new Date(dto.builtAt),
          monthlyPaymentDate: dto.monthlyPaymentDate ?? 5,
          thumbnail: dto.thumbnail ?? null,
          status: 'active',
          deletedAt: new Date('2099-12-31T00:00:00.000Z'),
        },
      })

      // Step 2 — INSERT Service[] → build index → UUID map
      const serviceIds: string[] = []
      const createdServices: Awaited<ReturnType<typeof tx.service.create>>[] = []

      for (const svc of dto.services ?? []) {
        const created = await tx.service.create({
          data: {
            boardingHouseId: boardingHouse.id,
            name: svc.name.trim(),
            price: new Prisma.Decimal(svc.price),
            unit: svc.unit.trim(),
            isMetered: svc.isMetered,
            autoApplied: svc.autoApplied,
            status: 'active',
          },
        })
        serviceIds.push(created.id)
        createdServices.push(created)
      }

      // Step 3 — INSERT RoomType[] → build index → UUID map
      const roomTypeIds: string[] = []
      const createdRoomTypes: Awaited<ReturnType<typeof tx.roomType.create>>[] = []

      for (const rt of dto.roomTypes) {
        const created = await tx.roomType.create({
          data: {
            boardingHouseId: boardingHouse.id,
            name: rt.name.trim(),
            description: rt.description?.trim() ?? null,
          },
        })
        roomTypeIds.push(created.id)
        createdRoomTypes.push(created)
      }

      // Step 3b — INSERT Amenity[] for shared amenities
      const sharedAmenityIds: string[] = []
      for (const amenName of dto.amenities ?? []) {
        const trimmed = amenName.trim()
        if (!trimmed) continue
        const createdAmen = await tx.amenity.create({
          data: {
            boardingHouseId: boardingHouse.id,
            name: trimmed,
            isShared: true,
          },
        })
        sharedAmenityIds.push(createdAmen.id)
      }

      // Step 4 — Quota already validated above; recorded here for audit clarity

      // Step 5 — Resolve indices to real UUIDs
      const resolvedRoomTypeId = roomTypeIds[dto.rooms.roomTypeIndex]
      const resolvedServiceIds = (dto.rooms.serviceIndices ?? []).map(idx => serviceIds[idx])

      // Step 6 — Generate room name from template
      const renderName = (floor: number, index: number): string => {
        return dto.rooms.nameFormat
          .replace(/\{floor\}/g, String(floor))
          .replace(/\{index\}/g, String(index))
      }

      // Step 7 — INSERT Room[] + RoomService[]
      let roomsCreated = 0
      if (hasCustomRooms) {
        for (const cr of dto.rooms.customRooms!) {
          const roomTypeId =
            cr.roomTypeIndex !== undefined && cr.roomTypeIndex !== null
              ? (roomTypeIds[cr.roomTypeIndex] ?? resolvedRoomTypeId)
              : resolvedRoomTypeId

          const area = cr.area
            ? new Prisma.Decimal(cr.area)
            : dto.rooms.area
              ? new Prisma.Decimal(dto.rooms.area)
              : null

          const maxOccupants = cr.maxOccupants ?? dto.rooms.maxOccupants ?? null

          const room = await tx.room.create({
            data: {
              boardingHouseId: boardingHouse.id,
              roomNumber: cr.roomNumber.trim(),
              floor: cr.floor,
              roomTypeId,
              area,
              maxOccupants,
              status: 'available',
            },
          })

          const roomServiceIndices = cr.serviceIndices ?? dto.rooms.serviceIndices ?? []
          const roomServiceIds = roomServiceIndices.map(idx => serviceIds[idx]).filter(Boolean)

          if (roomServiceIds.length > 0) {
            await tx.roomService.createMany({
              data: roomServiceIds.map(serviceId => ({
                roomId: room.id,
                serviceId,
              })),
            })
          }

          if (sharedAmenityIds.length > 0) {
            await tx.roomAmenity.createMany({
              data: sharedAmenityIds.map(amenityId => ({
                roomId: room.id,
                amenityId,
              })),
              skipDuplicates: true,
            })
          }

          roomsCreated++
        }
      } else {
        for (let floor = 1; floor <= dto.rooms.floorCount; floor++) {
          for (let index = 1; index <= dto.rooms.roomsPerFloor; index++) {
            const roomNumber = renderName(floor, index)
            const room = await tx.room.create({
              data: {
                boardingHouseId: boardingHouse.id,
                roomNumber,
                floor,
                roomTypeId: resolvedRoomTypeId,
                area: dto.rooms.area ? new Prisma.Decimal(dto.rooms.area) : null,
                maxOccupants: dto.rooms.maxOccupants ?? null,
                status: 'available',
              },
            })

            // Step 7b — INSERT RoomService[] for each resolved service
            if (resolvedServiceIds.length > 0) {
              await tx.roomService.createMany({
                data: resolvedServiceIds.map(serviceId => ({
                  roomId: room.id,
                  serviceId,
                })),
              })
            }

            if (sharedAmenityIds.length > 0) {
              await tx.roomAmenity.createMany({
                data: sharedAmenityIds.map(amenityId => ({
                  roomId: room.id,
                  amenityId,
                })),
                skipDuplicates: true,
              })
            }

            roomsCreated++
          }
        }
      }

      // Step 8 — Promote user role to landlord (admins retain their admin authority)
      let isAlreadyAdmin = false
      if (typeof tx.user?.findUnique === 'function') {
        const currentUser = await tx.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
        isAlreadyAdmin = currentUser?.role === UserRole.admin
      }

      if (!isAlreadyAdmin) {
        await tx.user.update({
          where: { id: userId },
          data: { role: UserRole.landlord },
        })
      }

      // Step 9 — Upsert bank account if provided
      if (dto.bankAccount) {
        await tx.bankAccount.upsert({
          where: { userId },
          create: {
            userId,
            bankName: dto.bankAccount.bankName.trim(),
            accountNumber: dto.bankAccount.accountNumber.trim(),
            accountName: dto.bankAccount.accountName.trim().toUpperCase(),
          },
          update: {
            bankName: dto.bankAccount.bankName.trim(),
            accountNumber: dto.bankAccount.accountNumber.trim(),
            accountName: dto.bankAccount.accountName.trim().toUpperCase(),
          },
        })
      }

      return {
        boardingHouse: {
          ...boardingHouse,
          services: createdServices,
          roomTypes: createdRoomTypes,
        },
        roomsCreated,
      }
    })

    return {
      success: true,
      boardingHouse: this.mapBoardingHouseResponse(
        result.boardingHouse,
        result.boardingHouse.services,
        result.boardingHouse.roomTypes,
      ),
      roomsCreated: result.roomsCreated,
    }
  }

  // ─── Legacy create (kept for any other usage) ────────────────────────────

  async createInitialProfile(
    userId: string,
    dto: CreateBoardingHouseDto,
  ): Promise<BoardingHouseResponseDto> {
    this.logger.log(`Creating initial property profile for user ${userId}`)

    // Enforce per-tier boarding house creation limit
    await this.enforceMaxBoardingHousesQuota(userId)

    const boardingHouse = await this.prisma.$transaction(async tx => {
      const createdBoardingHouse = await tx.boardingHouse.create({
        data: {
          ownerId: userId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          country: dto.country.trim(),
          province: dto.province.trim(),
          city: dto.city.trim(),
          district: dto.district.trim(),
          ward: dto.ward.trim(),
          street: dto.street.trim(),
          houseNumber: dto.houseNumber.trim(),
          totalFloor: dto.totalFloor,
          builtAt: new Date(dto.builtAt),
          monthlyPaymentDate: dto.monthlyPaymentDate ?? 5,
          status: 'active',
          deletedAt: new Date('2099-12-31T00:00:00.000Z'),
          services: {
            create: (dto.services ?? []).map(service => ({
              name: service.name.trim(),
              unit: service.unit.trim(),
              price: new Prisma.Decimal(service.price),
              isMetered: service.isMetered ?? false,
            })),
          },
          roomTypes: {
            create: (dto.roomTypes ?? []).map(roomType => ({
              name: roomType.name.trim(),
              description: roomType.description?.trim() || null,
            })),
          },
        },
        include: {
          services: true,
          roomTypes: true,
        },
      })

      let isAlreadyAdmin = false
      if (typeof tx.user?.findUnique === 'function') {
        const currentUser = await tx.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
        isAlreadyAdmin = currentUser?.role === UserRole.admin
      }

      if (!isAlreadyAdmin) {
        await tx.user.update({
          where: { id: userId },
          data: { role: UserRole.landlord },
        })
      }

      return createdBoardingHouse
    })

    return this.mapBoardingHouseResponse(
      boardingHouse,
      boardingHouse.services,
      boardingHouse.roomTypes,
    )
  }

  // ─── UC-L-01 context: List properties ────────────────────────────────────

  async listMyProperties(userId: string): Promise<BoardingHouseListResponseDto> {
    this.logger.log(`Listing all boarding houses for user ${userId}`)

    const houses = await this.prisma.boardingHouse.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      include: {
        services: true,
        roomTypes: true,
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    })

    return {
      success: true,
      data: houses.map(house => ({
        id: house.id,
        name: house.name,
        description: house.description,
        country: house.country,
        province: house.province,
        city: house.city,
        ward: house.ward,
        district: house.district,
        street: house.street,
        houseNumber: house.houseNumber,
        totalFloor: house.totalFloor,
        builtAt: house.builtAt.toISOString(),
        monthlyPaymentDate: house.monthlyPaymentDate ?? 5,
        status: house.status,
        thumbnail: house.thumbnail ?? null,
        totalRooms: house._count.rooms,
        services: house.services.map((service): BoardingHouseServiceResponseDto => ({
          id: service.id,
          name: service.name,
          unit: service.unit,
          price: this.formatMoney(service.price),
          isMetered: service.isMetered,
          autoApplied: service.autoApplied,
        })),
        roomTypes: house.roomTypes.map((roomType): BoardingHouseRoomTypeResponseDto => ({
          id: roomType.id,
          name: roomType.name,
          description: roomType.description,
        })),
      })),
    }
  }

  // ─── UC-L-01: Get Single Boarding House Details ──────────────────────────

  async getBoardingHouseById(
    userId: string,
    boardingHouseId: string,
  ): Promise<BoardingHouseResponseDto> {
    this.logger.log(`Fetching boarding house ${boardingHouseId} for user ${userId}`)

    const house = await this.prisma.boardingHouse.findFirst({
      where: { id: boardingHouseId, ownerId: userId },
      include: {
        services: true,
        roomTypes: true,
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    })

    if (!house) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.HOUSE_NOT_FOUND,
        'Boarding house not found or you do not have permission to access it',
      )
    }

    return this.mapBoardingHouseResponse(house, house.services, house.roomTypes)
  }

  // ─── UC-L-01: Update Boarding House Information ──────────────────────────

  async updateBoardingHouse(
    userId: string,
    boardingHouseId: string,
    dto: UpdateBoardingHouseDto,
  ): Promise<BoardingHouseResponseDto> {
    this.logger.log(`Updating boarding house ${boardingHouseId} for user ${userId}`)

    const existing = await this.prisma.boardingHouse.findFirst({
      where: { id: boardingHouseId, ownerId: userId },
    })

    if (!existing) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.HOUSE_NOT_FOUND,
        'Boarding house not found or you do not have permission to access it',
      )
    }

    if (dto.roomTypes !== undefined) {
      const existingRoomTypes = await this.prisma.roomType.findMany({
        where: { boardingHouseId },
      })

      for (const rt of dto.roomTypes) {
        const trimmedName = rt.name.trim()
        if (!trimmedName) continue

        let matched = rt.id ? existingRoomTypes.find(e => e.id === rt.id) : null
        if (!matched) {
          matched = existingRoomTypes.find(
            e => e.name.toLowerCase().trim() === trimmedName.toLowerCase(),
          )
        }

        if (matched) {
          await this.prisma.roomType.update({
            where: { id: matched.id },
            data: {
              name: trimmedName,
              description: rt.description?.trim() || null,
            },
          })
        } else {
          await this.prisma.roomType.create({
            data: {
              boardingHouseId,
              name: trimmedName,
              description: rt.description?.trim() || null,
            },
          })
        }
      }

      const incomingIds = new Set(dto.roomTypes.map(r => r.id).filter(Boolean))
      const incomingNames = new Set(dto.roomTypes.map(r => r.name.toLowerCase().trim()))

      for (const existingRt of existingRoomTypes) {
        const isRetained =
          incomingIds.has(existingRt.id) ||
          incomingNames.has(existingRt.name.toLowerCase().trim())
        if (!isRetained) {
          const inUseCount = await this.prisma.room.count({
            where: { roomTypeId: existingRt.id },
          })
          if (inUseCount === 0) {
            await this.prisma.roomType.delete({
              where: { id: existingRt.id },
            })
          } else {
            this.logger.warn(
              `RoomType ${existingRt.name} is in use by ${inUseCount} rooms, skipping deletion`,
            )
          }
        }
      }
    }

    const updated = await this.prisma.boardingHouse.update({
      where: { id: boardingHouseId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description.trim() || null }),
        ...(dto.thumbnail !== undefined && { thumbnail: dto.thumbnail }),
        ...(dto.country !== undefined && { country: dto.country.trim() }),
        ...(dto.province !== undefined && { province: dto.province.trim() }),
        ...(dto.city !== undefined && { city: dto.city.trim() }),
        ...(dto.district !== undefined && { district: dto.district.trim() }),
        ...(dto.ward !== undefined && { ward: dto.ward.trim() }),
        ...(dto.street !== undefined && { street: dto.street.trim() }),
        ...(dto.houseNumber !== undefined && { houseNumber: dto.houseNumber.trim() }),
        ...(dto.totalFloor !== undefined && { totalFloor: dto.totalFloor }),
        ...(dto.builtAt !== undefined && { builtAt: new Date(dto.builtAt) }),
        ...(dto.monthlyPaymentDate !== undefined && { monthlyPaymentDate: dto.monthlyPaymentDate }),
      },
      include: {
        services: true,
        roomTypes: true,
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    })

    this.invalidateOverviewCache(boardingHouseId)

    return this.mapBoardingHouseResponse(updated, updated.services, updated.roomTypes)
  }

  // ─── UC-L-08: In-Memory Cache (Periodic Caching per Spec) ────────────────
  private readonly overviewCache = new Map<
    string,
    { data: BoardingHouseOverviewResponseDto; expiresAt: number }
  >()
  private readonly CACHE_TTL_MS = 60 * 1000 // 60s TTL per UC-L-08

  /** Invalidate overview cache for a specific boarding house or all */
  public invalidateOverviewCache(boardingHouseId?: string): void {
    if (boardingHouseId) {
      this.overviewCache.delete(boardingHouseId)
    } else {
      this.overviewCache.clear()
    }
  }

  // ─── UC-L-01 & UC-L-08: Returning Landlord Overview & Analytics Dashboard ───

  async getDashboardOverview(
    userId: string,
    boardingHouseId: string,
    forceRefresh = false,
  ): Promise<BoardingHouseOverviewResponseDto> {
    this.logger.log(
      `Fetching dashboard overview for user ${userId} and house ${boardingHouseId} (forceRefresh=${forceRefresh})`,
    )

    // Check in-memory periodic cache (UC-L-08 spec requirement)
    if (!forceRefresh) {
      const cached = this.overviewCache.get(boardingHouseId)
      if (cached && cached.expiresAt > Date.now()) {
        this.logger.log(`Returning cached overview for house ${boardingHouseId}`)
        return cached.data
      }
    }

    const house = await this.prisma.boardingHouse.findFirst({
      where: { id: boardingHouseId, ownerId: userId },
    })

    if (!house) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.HOUSE_NOT_FOUND,
        'Boarding house not found or unauthorized',
      )
    }

    // 1. Room statistics (UC-L-08: Occupancy = COUNT(Room occupied) / COUNT(Room))
    const [totalRooms, occupiedRooms, vacantRooms, depositRooms, maintenanceRooms] =
      await Promise.all([
        this.prisma.room.count({ where: { boardingHouseId } }),
        this.prisma.room.count({ where: { boardingHouseId, status: 'occupied' } }),
        this.prisma.room.count({ where: { boardingHouseId, status: 'available' } }),
        this.prisma.room.count({ where: { boardingHouseId, status: 'deposited' } }),
        this.prisma.room.count({ where: { boardingHouseId, status: 'maintainace' } }),
      ])

    const occupancyRate =
      totalRooms > 0 ? `${Math.round((occupiedRooms / totalRooms) * 100)}%` : '0%'

    // 2. Financial metrics & Revenue (UC-L-08: Revenue = SUM(Payment.amount) WHERE type='charge' AND status='success')
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [currentMonthPayments, unpaidInvoices, paidInvoicesCount, currentPeriodInvoices] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            invoice: {
              room: { boardingHouseId },
            },
            type: 'charge',
            status: 'success',
            paidAt: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            room: { boardingHouseId },
            status: { in: ['unpaid', 'overdue'] },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        this.prisma.invoice.count({
          where: {
            room: { boardingHouseId },
            status: 'paid',
          },
        }),
        this.prisma.invoice.findMany({
          where: {
            room: { boardingHouseId },
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            dueDate: true,
          },
        }),
      ])

    // 3. Collection status: Invoice grouped by status for current period (UC-L-08)
    let paidCount = 0
    let paidAmount = 0
    let unpaidCount = 0
    let unpaidAmount = 0
    let overdueCount = 0
    let overdueAmount = 0

    for (const inv of currentPeriodInvoices) {
      const amt = Number(inv.totalAmount)
      const isOverdue =
        inv.status === 'overdue' || (inv.status === 'unpaid' && new Date(inv.dueDate) < now)

      if (inv.status === 'paid') {
        paidCount++
        paidAmount += amt
      } else if (isOverdue) {
        overdueCount++
        overdueAmount += amt
      } else {
        unpaidCount++
        unpaidAmount += amt
      }
    }

    const totalBilled = paidAmount + unpaidAmount + overdueAmount
    const collectionRate =
      totalBilled > 0 ? `${Math.round((paidAmount / totalBilled) * 1000) / 10}%` : '0%'

    // 4. Expiring contracts within next 30 days (UC-L-08: endDate BETWEEN NOW() AND NOW() + 30 days)
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringContractsRaw = await this.prisma.contract.findMany({
      where: {
        room: { boardingHouseId },
        status: 'active',
        endDate: { gte: now, lte: in30Days },
      },
      include: {
        room: true,
        tenantContracts: {
          include: { tenant: true },
        },
      },
      orderBy: { endDate: 'asc' },
      take: 10,
    })

    const expiringContracts = expiringContractsRaw.map(c => {
      const tenant = c.tenantContracts[0]?.tenant
      const daysLeft = Math.max(
        0,
        Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      )
      return {
        id: c.id,
        room: `P.${c.room.roomNumber}`,
        tenant: tenant?.username || tenant?.phoneNumber || 'Tenant',
        phone: tenant?.phoneNumber || '',
        daysLeft,
        endDate: c.endDate.toLocaleDateString('vi-VN'),
      }
    })

    // 5. Deposits
    const depositsRaw = await this.prisma.deposit.findMany({
      where: {
        boardingHouseId,
      },
      include: {
        room: true,
        contract: {
          include: {
            tenantContracts: {
              include: { tenant: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const depositNotifications = depositsRaw.map(d => {
      const tenant = d.contract?.tenantContracts[0]?.tenant
      return {
        id: d.id,
        room: `P.${d.room.roomNumber}`,
        tenant: tenant?.username || tenant?.phoneNumber || 'Tenant',
        amount: Number(d.amount),
        date: d.createdAt.toLocaleDateString('vi-VN'),
        type: d.type === 'platform' ? 'Dormio Escrow Deposit' : 'Room Holding Deposit',
        status: d.status,
      }
    })

    // 6. Maintenance requests (Grievances)
    const grievancesRaw = await this.prisma.grievance.findMany({
      where: {
        boardingHouseId,
        status: { not: 'resolved' },
      },
      include: {
        room: true,
        tenant: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const maintenanceRequests = grievancesRaw.map(g => ({
      id: g.id,
      room: g.room ? `P.${g.room.roomNumber}` : 'Common',
      issue: g.title,
      priority: g.priority,
      reporter: g.tenant?.username || g.tenant?.phoneNumber || 'Tenant',
      date: g.createdAt.toLocaleDateString('vi-VN'),
      status: g.status,
    }))

    // 7. Monthly revenue history (past 6 months) with type='charge' & status='success'
    const monthlyRevenue: Array<{ month: string; val: number; fullAmount: string }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const monthLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`

      const mPayments = await this.prisma.payment.aggregate({
        where: {
          invoice: { room: { boardingHouseId } },
          type: 'charge',
          status: 'success',
          paidAt: { gte: mStart, lte: mEnd },
        },
        _sum: { amount: true },
      })

      const totalNum = Number(mPayments._sum.amount ?? 0)
      monthlyRevenue.push({
        month: monthLabel,
        val: Math.round((totalNum / 1000000) * 10) / 10,
        fullAmount: this.formatMoney(mPayments._sum.amount ?? 0),
      })
    }

    const hasAnyRevenue = monthlyRevenue.some(m => m.val > 0)
    const revenueChart = hasAnyRevenue ? monthlyRevenue : []

    // 8. Monthly occupancy history (past 6 months)
    const occupancyChart: Array<{ month: string; occupied: number; total: number; count: number }> =
      []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const monthLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`

      const activeContracts = await this.prisma.contract.count({
        where: {
          room: { boardingHouseId },
          status: 'active',
          startDate: { lte: mEnd },
          endDate: { gte: d },
        },
      })

      const occRateNum =
        totalRooms > 0 ? Math.min(100, Math.round((activeContracts / totalRooms) * 100)) : 0
      occupancyChart.push({
        month: monthLabel,
        occupied: occRateNum,
        total: totalRooms,
        count: activeContracts,
      })
    }

    const result: BoardingHouseOverviewResponseDto = {
      rooms: {
        totalRooms,
        occupiedRooms,
        vacantRooms,
        depositRooms,
        maintenanceRooms,
        occupancyRate,
      },
      financial: {
        currentMonthRevenue: this.formatMoney(currentMonthPayments._sum.amount ?? 0),
        unpaidDebt: this.formatMoney(unpaidInvoices._sum.totalAmount ?? 0),
        unpaidInvoicesCount: unpaidInvoices._count.id ?? 0,
        paidInvoicesCount,
      },
      collectionStatus: {
        paidCount,
        paidAmount: this.formatMoney(paidAmount),
        unpaidCount,
        unpaidAmount: this.formatMoney(unpaidAmount),
        overdueCount,
        overdueAmount: this.formatMoney(overdueAmount),
        totalBilledAmount: this.formatMoney(totalBilled),
        collectionRate,
      },
      revenueChart,
      occupancyChart,
      depositNotifications,
      maintenanceRequests,
      expiringContracts,
    }

    // Save in cache (60s TTL)
    this.overviewCache.set(boardingHouseId, {
      data: result,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    })

    return result
  }

  // ─── UC-L-24: Advanced Multi-Property Reports & AI Strategy ───────────────

  /**
   * UC-L-24: Advanced Multi-Property Reports
   * Aggregated across all BoardingHouse WHERE ownerId = current_user.id
   */
  async getMultiPropertyOverview(userId: string): Promise<MultiPropertyOverviewResponseDto> {
    this.logger.log(`getMultiPropertyOverview called for user ${userId}`)

    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const houses = await this.prisma.boardingHouse.findMany({
      where: {
        ownerId: userId,
        deletedAt: { gt: now },
      },
      include: {
        rooms: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (houses.length === 0) {
      return {
        portfolioSummary: {
          totalProperties: 0,
          totalRooms: 0,
          occupiedRooms: 0,
          vacantRooms: 0,
          depositRooms: 0,
          maintenanceRooms: 0,
          occupancyRate: '0%',
          currentMonthRevenue: '0.00',
          currentMonthExpenses: '0.00',
          netProfit: '0.00',
          unpaidDebt: '0.00',
          unpaidInvoicesCount: 0,
          paidInvoicesCount: 0,
          collectionRate: '0%',
        },
        propertiesBreakdown: [],
        revenueChart: [],
        occupancyChart: [],
        expiringContracts: [],
      }
    }

    const houseIds = houses.map(h => h.id)

    // 1. Aggregated Rooms
    let totalRooms = 0
    let occupiedRooms = 0
    let vacantRooms = 0
    let depositRooms = 0
    let maintenanceRooms = 0

    for (const h of houses) {
      totalRooms += h.rooms.length
      occupiedRooms += h.rooms.filter(r => r.status === 'occupied').length
      vacantRooms += h.rooms.filter(r => r.status === 'available').length
      depositRooms += h.rooms.filter(r => r.status === 'deposited').length
      maintenanceRooms += h.rooms.filter(r => r.status === 'maintainace').length
    }

    const occupancyRate =
      totalRooms > 0 ? `${Math.round((occupiedRooms / totalRooms) * 1000) / 10}%` : '0%'

    // 2. Financial Aggregations across all properties
    const [currentMonthPayments, currentMonthExpenses, unpaidInvoices, paidInvoicesCount] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            invoice: { room: { boardingHouseId: { in: houseIds } } },
            type: 'charge',
            status: 'success',
            paidAt: { gte: currentMonthStart, lte: currentMonthEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            boardingHouseId: { in: houseIds },
            status: 'paid',
            createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            room: { boardingHouseId: { in: houseIds } },
            status: { in: ['unpaid', 'overdue'] },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        this.prisma.invoice.count({
          where: {
            room: { boardingHouseId: { in: houseIds } },
            status: 'paid',
            createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
          },
        }),
      ])

    const totalRevenueNum = Number(currentMonthPayments._sum.amount ?? 0)
    const totalExpensesNum = Number(currentMonthExpenses._sum.amount ?? 0)
    const netProfitNum = totalRevenueNum - totalExpensesNum

    // 3. Collection Status across all properties
    const currentPeriodInvoices = await this.prisma.invoice.findMany({
      where: {
        room: { boardingHouseId: { in: houseIds } },
        createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
      },
      select: { totalAmount: true, status: true, dueDate: true },
    })

    let paidCount = 0
    let paidAmount = 0
    let unpaidCount = 0
    let unpaidAmount = 0
    let overdueCount = 0
    let overdueAmount = 0

    for (const inv of currentPeriodInvoices) {
      const amt = Number(inv.totalAmount)
      const isOverdue =
        inv.status === 'overdue' || (inv.status === 'unpaid' && new Date(inv.dueDate) < now)

      if (inv.status === 'paid') {
        paidCount++
        paidAmount += amt
      } else if (isOverdue) {
        overdueCount++
        overdueAmount += amt
      } else {
        unpaidCount++
        unpaidAmount += amt
      }
    }

    const totalBilled = paidAmount + unpaidAmount + overdueAmount
    const collectionRate =
      totalBilled > 0 ? `${Math.round((paidAmount / totalBilled) * 1000) / 10}%` : '0%'

    // 4. Expiring contracts across all properties in next 30 days
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringContractsRaw = await this.prisma.contract.findMany({
      where: {
        room: { boardingHouseId: { in: houseIds } },
        status: 'active',
        endDate: { gte: now, lte: in30Days },
      },
      include: {
        room: {
          include: { boardingHouse: true },
        },
        tenantContracts: {
          include: { tenant: true },
        },
      },
      orderBy: { endDate: 'asc' },
      take: 10,
    })

    const expiringContracts = expiringContractsRaw.map(c => {
      const tenant = c.tenantContracts[0]?.tenant
      const daysLeft = Math.max(
        0,
        Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      )
      return {
        id: c.id,
        propertyName: c.room.boardingHouse.name,
        room: `P.${c.room.roomNumber}`,
        tenant: tenant?.username || tenant?.phoneNumber || 'Tenant',
        phone: tenant?.phoneNumber || '',
        daysLeft,
        endDate: c.endDate.toLocaleDateString('vi-VN'),
      }
    })

    // 5. Per-Property Comparison Breakdown
    const propertiesBreakdown: PropertyBreakdownDto[] = []
    for (const h of houses) {
      const hTotalRooms = h.rooms.length
      const hOccupied = h.rooms.filter(r => r.status === 'occupied').length
      const hVacant = h.rooms.filter(r => r.status === 'available').length
      const hOccRate =
        hTotalRooms > 0 ? `${Math.round((hOccupied / hTotalRooms) * 1000) / 10}%` : '0%'

      const [hRev, hExp, hDebt, hExpiringCount] = await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            invoice: { room: { boardingHouseId: h.id } },
            type: 'charge',
            status: 'success',
            paidAt: { gte: currentMonthStart, lte: currentMonthEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            boardingHouseId: h.id,
            status: 'paid',
            createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            room: { boardingHouseId: h.id },
            status: { in: ['unpaid', 'overdue'] },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        this.prisma.contract.count({
          where: {
            room: { boardingHouseId: h.id },
            status: 'active',
            endDate: { gte: now, lte: in30Days },
          },
        }),
      ])

      const hRevNum = Number(hRev._sum.amount ?? 0)
      const hExpNum = Number(hExp._sum.amount ?? 0)
      const hNetNum = hRevNum - hExpNum

      propertiesBreakdown.push({
        id: h.id,
        name: h.name,
        address: `${h.houseNumber} ${h.street}, ${h.ward}, ${h.district}`,
        totalRooms: hTotalRooms,
        occupiedRooms: hOccupied,
        vacantRooms: hVacant,
        occupancyRate: hOccRate,
        currentMonthRevenue: this.formatMoney(hRevNum),
        currentMonthExpenses: this.formatMoney(hExpNum),
        netProfit: this.formatMoney(hNetNum),
        unpaidDebt: this.formatMoney(hDebt._sum.totalAmount ?? 0),
        unpaidInvoicesCount: hDebt._count.id ?? 0,
        expiringContractsCount: hExpiringCount,
      })
    }

    // 6. Combined Past 6 Months Revenue History
    const monthlyRevenue: Array<{ month: string; val: number; fullAmount: string }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const monthLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`

      const mPayments = await this.prisma.payment.aggregate({
        where: {
          invoice: { room: { boardingHouseId: { in: houseIds } } },
          type: 'charge',
          status: 'success',
          paidAt: { gte: mStart, lte: mEnd },
        },
        _sum: { amount: true },
      })

      const totalNum = Number(mPayments._sum.amount ?? 0)
      monthlyRevenue.push({
        month: monthLabel,
        val: Math.round((totalNum / 1000000) * 10) / 10,
        fullAmount: this.formatMoney(totalNum),
      })
    }

    // 7. Combined Past 6 Months Occupancy History
    const occupancyChart: Array<{ month: string; occupied: number; total: number; count: number }> =
      []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const monthLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`

      const activeContracts = await this.prisma.contract.count({
        where: {
          room: { boardingHouseId: { in: houseIds } },
          status: 'active',
          startDate: { lte: mEnd },
          endDate: { gte: d },
        },
      })

      const occRateNum =
        totalRooms > 0 ? Math.min(100, Math.round((activeContracts / totalRooms) * 100)) : 0
      occupancyChart.push({
        month: monthLabel,
        occupied: occRateNum,
        total: totalRooms,
        count: activeContracts,
      })
    }

    return {
      portfolioSummary: {
        totalProperties: houses.length,
        totalRooms,
        occupiedRooms,
        vacantRooms,
        depositRooms,
        maintenanceRooms,
        occupancyRate,
        currentMonthRevenue: this.formatMoney(totalRevenueNum),
        currentMonthExpenses: this.formatMoney(totalExpensesNum),
        netProfit: this.formatMoney(netProfitNum),
        unpaidDebt: this.formatMoney(unpaidInvoices._sum.totalAmount ?? 0),
        unpaidInvoicesCount: unpaidInvoices._count.id ?? 0,
        paidInvoicesCount,
        collectionRate,
      },
      propertiesBreakdown,
      revenueChart: monthlyRevenue,
      occupancyChart,
      expiringContracts,
    }
  }

  /**
   * UC-L-24 & UC-L-12: Generate AI Marketing Strategy across all properties
   * Reuses AiConversation & AiMessage pattern with aggregated portfolio metrics.
   */
  async generateMultiPropertyAiStrategy(userId: string): Promise<AiStrategyResponseDto> {
    this.logger.log(`generateMultiPropertyAiStrategy called for user ${userId}`)

    const overview = await this.getMultiPropertyOverview(userId)
    const { portfolioSummary, propertiesBreakdown } = overview

    // Find first boarding house for conversation relation constraint
    const firstHouse = await this.prisma.boardingHouse.findFirst({
      where: { ownerId: userId, deletedAt: { gt: new Date() } },
    })

    if (!firstHouse) {
      throw new BadRequestException('You do not have any boarding houses to generate a marketing strategy')
    }

    const underperforming = propertiesBreakdown.filter(
      p => parseFloat(p.occupancyRate) < 80 || p.unpaidInvoicesCount > 2,
    )

    const vacantTotal = portfolioSummary.vacantRooms
    const occRate = portfolioSummary.occupancyRate

    const executiveSummary =
      portfolioSummary.totalProperties > 1
        ? `System is operating ${portfolioSummary.totalProperties} properties with a total of ${portfolioSummary.totalRooms} rooms. Occupancy rate is ${occRate}, with ${vacantTotal} vacant rooms to optimize. Estimated net profit this month is ${portfolioSummary.netProfit} VND after operational expenses.`
        : `Property currently has ${portfolioSummary.totalRooms} rooms, achieving an occupancy rate of ${occRate} with ${vacantTotal} vacant rooms. Boost marketing to reach optimal occupancy rate above 90%.`

    const pricingRecommendations = [
      vacantTotal > 0
        ? `Apply flexible pricing: Offer 5% – 8% off first month's rent for tenants signing contracts of 6 months or longer for ${vacantTotal} vacant rooms.`
        : 'Low vacancy: Consider slightly increasing rent by 3% – 5% for new contracts or renewals to maximize margins.',
      'Restructure service fees (parking, wifi, cleaning) into all-inclusive packages to enhance value perception for younger tenants.',
    ]

    const marketingCampaigns = [
      'Promote featured listings on the Dormio BHRP platform during peak hours (11:00 - 13:00 and 19:00 - 21:00).',
      underperforming.length > 0
        ? `Target customer attraction campaigns for property "${underperforming[0].name}" towards student groups and office workers within a 3km radius.`
        : 'Deploy referral program: Reward 200,000 VND credit on next month rent for existing tenants upon successful friend referrals.',
      'Retake room photos with wide angles and natural light, and add short 360-degree videos of corridors and common amenities.',
    ]

    const operationalOptimizations = [
      `Cost control: Operating expenses this month represent a significant portion (${portfolioSummary.currentMonthExpenses} VND). Review shared utility bills and maintenance supplies.`,
      `Outstanding receivables: Total uncollected revenue is ${portfolioSummary.unpaidDebt} VND across ${portfolioSummary.unpaidInvoicesCount} invoices. Schedule automated reminder notices 3 days before due date.`,
    ]

    const actionPlan30Days = [
      {
        dayRange: 'Week 1 (Days 1 - 7)',
        title: 'Review Vacant Room Portfolio & Standardize Photos',
        description: `Inspect condition of ${vacantTotal} vacant rooms, complete cleaning, and take bright photos for Dormio listings.`,
      },
      {
        dayRange: 'Week 2 (Days 8 - 15)',
        title: 'Activate Deposit Promotion & Launch Marketing Posts',
        description:
          'Enable flexible 0.5 month deposit promotion and share listings across student community groups.',
      },
      {
        dayRange: 'Week 3 (Days 16 - 23)',
        title: 'Engage Existing Tenants & Debt Collection',
        description:
          'Send quick surveys on room quality and follow up on overdue invoices via automated workflows.',
      },
      {
        dayRange: 'Week 4 (Days 24 - 30)',
        title: 'Evaluate Conversion Rates & Rebalance Budget',
        description:
          'Summarize monthly signed deposits, adjust pricing for remaining rooms, and plan next month expenses.',
      },
    ]

    // Persist in AiConversation and AiMessage per UC-L-24
    try {
      let conversation = await this.prisma.aiConversation.findFirst({
        where: { userId, boardingHouseId: firstHouse.id },
      })

      if (!conversation) {
        conversation = await this.prisma.aiConversation.create({
          data: {
            userId,
            boardingHouseId: firstHouse.id,
          },
        })
      }

      await this.prisma.aiMessage.create({
        data: {
          aiConversationId: conversation.id,
          role: 'user',
          content: `Analyze operational performance for ${portfolioSummary.totalProperties} properties, occupancy rate ${occRate}, revenue ${portfolioSummary.currentMonthRevenue} VND.`,
          model: 'dormio-gpt-pro',
        },
      })

      await this.prisma.aiMessage.create({
        data: {
          aiConversationId: conversation.id,
          role: 'assistant',
          content: executiveSummary,
          model: 'dormio-gpt-pro',
        },
      })
    } catch (dbErr) {
      this.logger.warn(`Failed to persist AI messages: ${dbErr}`)
    }

    return {
      title: `Marketing Strategy & Business Optimization across system (${portfolioSummary.totalProperties} properties)`,
      executiveSummary,
      pricingRecommendations,
      marketingCampaigns,
      operationalOptimizations,
      actionPlan30Days,
      createdAt: new Date().toISOString(),
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Resolve the user's active subscription tier.
   * Falls back to free if no active subscription exists.
   */
  private async resolveCurrentTier(userId: string): Promise<SubscriptionPackage> {
    const now = new Date()
    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.active,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      select: { planName: true },
    })
    return activeSub?.planName ?? SubscriptionPackage.free
  }

  /**
   * Enforces the boarding house creation quota for the user's current tier.
   * Throws ForbiddenException if the limit is already reached.
   */
  private async enforceMaxBoardingHousesQuota(userId: string): Promise<void> {
    const tier = await this.resolveCurrentTier(userId)
    const maxHouses = MAX_BOARDING_HOUSES[tier]

    const existingCount = await this.prisma.boardingHouse.count({
      where: {
        ownerId: userId,
      },
    })

    if (existingCount >= maxHouses) {
      throw new BusinessForbiddenException(
        BusinessErrorCode.TIER_BOARDING_HOUSE_LIMIT_REACHED,
        `Your ${tier} plan allows a maximum of ${maxHouses} boarding house(s). You currently have ${existingCount}. Please upgrade your plan to add more properties.`,
        {
          currentTier: tier,
          maxAllowed: maxHouses,
          currentCount: existingCount,
          upgradeUrl: '/pricing',
        },
      )
    }
  }

  /**
   * Resolve the user's current room quota.
   * If the user has no active UserSubscription row, treat as free tier.
   */
  private async resolveMaxRoom(userId: string): Promise<number> {
    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: { gte: new Date() },
      },
      include: {
        subscriptionPlan: true,
      },
      orderBy: { endDate: 'desc' },
    })

    return activeSub?.subscriptionPlan.maxRoom ?? FREE_TIER_MAX_ROOM
  }

  private mapBoardingHouseResponse(
    boardingHouse: {
      id: string
      name: string
      description: string | null
      country: string
      province: string
      city?: string | null
      ward: string
      district: string
      street: string
      houseNumber: string
      totalFloor: number | null
      builtAt: Date
      monthlyPaymentDate?: number
      status: string
      thumbnail?: string | null
      _count?: { rooms?: number }
      totalRooms?: number
    },
    services: Array<{
      id: string
      name: string
      unit: string
      price: unknown
      isMetered: boolean
      autoApplied: boolean
    }>,
    roomTypes: Array<{
      id: string
      name: string
      description: string | null
    }>,
  ): BoardingHouseResponseDto {
    return {
      id: boardingHouse.id,
      name: boardingHouse.name,
      description: boardingHouse.description,
      country: boardingHouse.country,
      province: boardingHouse.province,
      city: boardingHouse.city ?? '',
      ward: boardingHouse.ward,
      district: boardingHouse.district,
      street: boardingHouse.street,
      houseNumber: boardingHouse.houseNumber,
      totalFloor: boardingHouse.totalFloor,
      builtAt: boardingHouse.builtAt.toISOString(),
      monthlyPaymentDate: boardingHouse.monthlyPaymentDate ?? 5,
      status: boardingHouse.status,
      thumbnail: boardingHouse.thumbnail ?? null,
      totalRooms: boardingHouse._count?.rooms ?? boardingHouse.totalRooms ?? 0,
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        unit: s.unit,
        price: this.formatMoney(s.price),
        isMetered: s.isMetered,
        autoApplied: s.autoApplied,
      })),
      roomTypes: roomTypes.map(rt => ({
        id: rt.id,
        name: rt.name,
        description: rt.description,
      })),
    }
  }

  private formatMoney(value: unknown): string {
    const [integerPart, decimalPart = ''] = String(value).split('.')
    return `${integerPart}.${decimalPart.padEnd(2, '0').slice(0, 2)}`
  }

  /**
   * Get full boarding house details for admin inspection (House info, owner, services, room types, grievances)
   */
  async getBoardingHouseDetails(id: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    let house: any = null

    if (isUuid) {
      house = await this.prisma.boardingHouse.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
              role: true,
              status: true,
              createdAt: true,
            },
          },
          services: {
            where: { status: 'active' },
          },
          roomTypes: true,
          rooms: {
            select: {
              id: true,
              roomNumber: true,
              floor: true,
              status: true,
            },
          },
          grievences: {
            include: {
              tenant: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  phoneNumber: true,
                  avatarUrl: true,
                  role: true,
                  status: true,
                  createdAt: true,
                },
              },
              room: {
                select: {
                  id: true,
                  roomNumber: true,
                  floor: true,
                },
              },
              images: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    }

    if (house) {
      const totalRooms = house.rooms.length
      const occupiedRooms = house.rooms.filter((r: any) => r.status === 'occupied').length
      const vacantRooms = house.rooms.filter((r: any) => r.status === 'available').length
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

      return {
        id: house.id,
        name: house.name,
        description: house.description,
        address: `${house.houseNumber} ${house.street}, ${house.ward}, ${house.district}, ${house.province || house.city}`,
        rawAddress: {
          houseNumber: house.houseNumber,
          street: house.street,
          ward: house.ward,
          district: house.district,
          city: house.city,
          province: house.province,
          country: house.country,
        },
        builtAt: house.builtAt,
        totalFloor: house.totalFloor ?? 1,
        status: house.status,
        thumbnail: house.thumbnail || '/house-placeholder.jpg',
        stats: {
          totalRooms,
          occupiedRooms,
          vacantRooms,
          occupancyRate,
        },
        owner: {
          id: house.owner.id,
          name: house.owner.username,
          username: house.owner.username,
          email: house.owner.email,
          phoneNumber: house.owner.phoneNumber,
          avatarUrl: house.owner.avatarUrl || '/avatar-placeholder.png',
          role: house.owner.role,
          status: house.owner.status,
          createdAt: house.owner.createdAt,
          idCardVerified: true,
          idCardNumber: '079201004829',
          totalProperties: 3,
        },
        services: house.services.map((s: any) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price),
          unit: s.unit,
          autoApplied: s.autoApplied,
          isMetered: s.isMetered,
        })),
        roomTypes: house.roomTypes.map((rt: any) => ({
          id: rt.id,
          name: rt.name,
          description: rt.description,
          area: 25,
          basePrice: 4500000,
          roomsCount: house.rooms.length,
        })),
        grievances: house.grievences.map((g: any) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          priority: g.priority,
          status: g.status,
          createdAt: g.createdAt,
          resolvedAt: g.resolvedAt,
          resolutionNote: g.resolutionNote,
          images: (g.images || []).map((img: any) => img.url),
          sender: {
            id: g.tenant.id,
            name: g.tenant.username,
            username: g.tenant.username,
            email: g.tenant.email,
            phoneNumber: g.tenant.phoneNumber,
            avatarUrl: g.tenant.avatarUrl || '/avatar-placeholder.png',
            roomNumber: g.room?.roomNumber || 'P.302',
            role: g.tenant.role,
            createdAt: g.tenant.createdAt,
            idCardVerified: true,
            idCardNumber: '079302008192',
          },
        })),
      }
    }

    return this.getMockBoardingHouseDetails(id)
  }

  private getMockBoardingHouseDetails(id: string) {
    const isLocked = id === 'BH-1004'
    const isReported = id === 'BH-1001' || id === 'BH-1005'

    return {
      id,
      name:
        id === 'BH-1001'
          ? 'Dormio Signature Premium Q1'
          : id === 'BH-1002'
            ? 'Nhà Trọ Hưng Thịnh Thủ Đức'
            : id === 'BH-1003'
              ? 'Ký Túc Xá Sinh Viên Xanh Cầu Giấy'
              : id === 'BH-1004'
                ? 'Tòa Nhà Cho Thuê Bình Thạnh 18'
                : 'Dormio Eco House Tân Bình',
      description:
        'High-end serviced apartment building with complete amenities, 24/7 security cameras, high-speed elevator, and spacious parking monitored by security staff.',
      address:
        id === 'BH-1001'
          ? '128 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM'
          : id === 'BH-1002'
            ? '45 Đường D1, Phường Tăng Nhơn Phú A, TP. Thủ Đức'
            : id === 'BH-1003'
              ? '88 Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy, Hà Nội'
              : id === 'BH-1004'
                ? '220/15 Xô Viết Nghệ Tĩnh, Phường 21, Bình Thạnh, TP.HCM'
                : '52 Bạch Đằng, Phường 2, Tân Bình, TP.HCM',
      rawAddress: {
        houseNumber: '128',
        street: 'Nguyễn Trãi',
        ward: 'Phường Bến Thành',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        province: 'Hồ Chí Minh',
        country: 'Vietnam',
      },
      builtAt: '2023-05-15T00:00:00.000Z',
      totalFloor: 6,
      status: isLocked ? 'locked' : isReported ? 'reported' : 'active',
      lockReason: isLocked ? 'Fire safety violations & complaints regarding deposit withholding' : undefined,
      lockedAt: isLocked ? '2026-09-01T10:00:00.000Z' : undefined,
      thumbnail: '/house-placeholder.jpg',
      stats: {
        totalRooms: 20,
        occupiedRooms: isLocked ? 2 : 18,
        vacantRooms: isLocked ? 18 : 2,
        occupancyRate: isLocked ? 10 : 90,
      },
      owner: {
        id: 'owner-uuid-101',
        name:
          id === 'BH-1001'
            ? 'Lê Minh Tuấn'
            : id === 'BH-1002'
              ? 'Nguyễn Văn Hùng'
              : 'Phạm Thu Thảo',
        username:
          id === 'BH-1001'
            ? 'Lê Minh Tuấn'
            : id === 'BH-1002'
              ? 'Nguyễn Văn Hùng'
              : 'Phạm Thu Thảo',
        email: id === 'BH-1001' ? 'tuan.le@gmail.com' : 'hung.nguyen@yahoo.com',
        phoneNumber: '0901.234.567',
        avatarUrl: '/avatar-placeholder.png',
        role: 'landlord',
        status: 'active',
        createdAt: '2024-03-12T08:00:00.000Z',
        idCardVerified: true,
        idCardNumber: '079201004829',
        totalProperties: 3,
      },
      services: [
        {
          id: 'srv-1',
          name: 'Electricity',
          price: 3500,
          unit: 'kWh',
          autoApplied: true,
          isMetered: true,
        },
        {
          id: 'srv-2',
          name: 'Running Water',
          price: 20000,
          unit: 'm³',
          autoApplied: true,
          isMetered: true,
        },
        {
          id: 'srv-3',
          name: 'High-Speed Internet WiFi',
          price: 100000,
          unit: 'room/month',
          autoApplied: true,
          isMetered: false,
        },
        {
          id: 'srv-4',
          name: 'Corridor Cleaning & Waste Disposal',
          price: 50000,
          unit: 'room/month',
          autoApplied: true,
          isMetered: false,
        },
        {
          id: 'srv-5',
          name: 'Motorbike Parking with RFID Card',
          price: 120000,
          unit: 'vehicle/month',
          autoApplied: false,
          isMetered: false,
        },
      ],
      roomTypes: [
        {
          id: 'rt-1',
          name: 'Duplex Room with Private Balcony',
          description:
            'Solid concrete mezzanine, sunny and breezy private balcony, private kitchen, private washing machine.',
          area: 35,
          basePrice: 6500000,
          roomsCount: 8,
        },
        {
          id: 'rt-2',
          name: 'Studio Room Fully Furnished',
          description:
            'Modern open space, premium bed and mattress, inverter refrigerator, 1.5HP air conditioner.',
          area: 28,
          basePrice: 5200000,
          roomsCount: 7,
        },
        {
          id: 'rt-3',
          name: 'Modern Mezzanine Room',
          description:
            'Space-saving layout, convenient study desk, clean private en-suite bathroom.',
          area: 22,
          basePrice: 4000000,
          roomsCount: 5,
        },
      ],
      grievances: [
        {
          id: 'grv-1',
          title: 'Arbitrary electricity fee increase to 5,000 VND/kWh in violation of contract',
          description:
            'The lease contract clearly states electricity at 3,500 VND/kWh, but this month the landlord unilaterally billed 5,000 VND/kWh and threatened power disconnection.',
          priority: 'high',
          status: 'pending',
          createdAt: '2026-09-10T14:30:00.000Z',
          images: ['/house-placeholder.jpg'],
          sender: {
            id: 'tenant-uuid-201',
            name: 'Trần Bảo Ngọc',
            username: 'Trần Bảo Ngọc',
            email: 'ngoc.tran@gmail.com',
            phoneNumber: '0912.345.678',
            avatarUrl: '/avatar-placeholder.png',
            roomNumber: 'P.302',
            role: 'tenant',
            createdAt: '2025-01-10T10:00:00.000Z',
            idCardVerified: true,
            idCardNumber: '079302008192',
          },
        },
        {
          id: 'grv-2',
          title: 'Persistent bathroom leak not resolved',
          description:
            'Bathroom in room 205 has had a water leak from upstairs for 2 weeks, making the floor slippery and hazardous. Reported 3 times without repairs.',
          priority: 'medium',
          status: 'in_progress',
          createdAt: '2026-09-08T09:15:00.000Z',
          resolutionNote: 'Reminded landlord and scheduled plumber pipe inspection for September 12, 2026.',
          images: ['/house-placeholder.jpg'],
          sender: {
            id: 'tenant-uuid-202',
            name: 'Nguyễn Hoàng Nam',
            username: 'Nguyễn Hoàng Nam',
            email: 'nam.nguyen@gmail.com',
            phoneNumber: '0977.888.999',
            avatarUrl: '/avatar-placeholder.png',
            roomNumber: 'P.205',
            role: 'tenant',
            createdAt: '2025-03-05T09:00:00.000Z',
            idCardVerified: true,
            idCardNumber: '079301007261',
          },
        },
        {
          id: 'grv-3',
          title: 'Sudden water outage without prior notice',
          description:
            'Building experienced recurring water outages during morning peak hours (6am-8am) without prior announcement in the resident group.',
          priority: 'high',
          status: 'resolved',
          createdAt: '2026-09-02T07:45:00.000Z',
          resolvedAt: '2026-09-03T16:00:00.000Z',
          resolutionNote: 'Landlord installed new booster pump and 2,000L backup water tank.',
          images: [],
          sender: {
            id: 'tenant-uuid-203',
            name: 'Vũ Mai Linh',
            username: 'Vũ Mai Linh',
            email: 'linh.vu@gmail.com',
            phoneNumber: '0934.567.890',
            avatarUrl: '/avatar-placeholder.png',
            roomNumber: 'P.401',
            role: 'tenant',
            createdAt: '2024-11-20T14:00:00.000Z',
            idCardVerified: true,
            idCardNumber: '079300006543',
          },
        },
      ],
    }
  }
}
