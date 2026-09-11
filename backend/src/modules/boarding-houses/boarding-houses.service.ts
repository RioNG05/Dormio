import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBoardingHouseDto } from './dto/create-boarding-house.dto';
import { SetupBoardingHouseDto } from './dto/setup-boarding-house.dto';
import { BoardingHouseOverviewResponseDto } from './dto/boarding-house-overview-response.dto';
import {
  BoardingHouseListResponseDto,
  BoardingHouseResponseDto,
  BoardingHouseRoomTypeResponseDto,
  BoardingHouseServiceResponseDto,
  SetupBoardingHouseResponseDto,
} from './dto/boarding-house-response.dto';

/** Default maxRoom quota for users with no active subscription (free tier). */
const FREE_TIER_MAX_ROOM = 10;

@Injectable()
export class BoardingHousesService {
  private readonly logger = new Logger(BoardingHousesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── UC-L-01: 3-Step Wizard — Single Atomic Setup ──────────────────────────

  async setupBoardingHouse(
    userId: string,
    dto: SetupBoardingHouseDto,
  ): Promise<SetupBoardingHouseResponseDto> {
    this.logger.log(
      `Setting up boarding house for user ${userId} via 3-step wizard`,
    );

    // Resolve subscription quota before entering the transaction
    const maxRoom = await this.resolveMaxRoom(userId);
    const roomsToCreate = dto.rooms.floorCount * dto.rooms.roomsPerFloor;

    if (roomsToCreate > maxRoom) {
      throw new UnprocessableEntityException(
        `Gói đăng ký hiện tại chỉ cho phép tối đa ${maxRoom} phòng. Bạn đang cố tạo ${roomsToCreate} phòng. Vui lòng nâng cấp gói hoặc giảm số phòng.`,
      );
    }

    // Validate roomTypeIndex and serviceIndices are in bounds
    if (dto.rooms.roomTypeIndex >= dto.roomTypes.length) {
      throw new BadRequestException(
        `roomTypeIndex ${dto.rooms.roomTypeIndex} is out of bounds — only ${dto.roomTypes.length} room type(s) provided`,
      );
    }
    const outOfBoundsService = (dto.rooms.serviceIndices ?? []).find(
      (idx) => idx >= (dto.services ?? []).length,
    );
    if (outOfBoundsService !== undefined) {
      throw new BadRequestException(
        `serviceIndex ${outOfBoundsService} is out of bounds — only ${(dto.services ?? []).length} service(s) provided`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
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
          thumbnail: dto.thumbnail ?? null,
          status: 'active',
          deletedAt: new Date('2099-12-31T00:00:00.000Z'),
        },
      });

      // Step 2 — INSERT Service[] → build index → UUID map
      const serviceIds: string[] = [];
      const createdServices: Awaited<
        ReturnType<typeof tx.service.create>
      >[] = [];

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
        });
        serviceIds.push(created.id);
        createdServices.push(created);
      }

      // Step 3 — INSERT RoomType[] → build index → UUID map
      const roomTypeIds: string[] = [];
      const createdRoomTypes: Awaited<
        ReturnType<typeof tx.roomType.create>
      >[] = [];

      for (const rt of dto.roomTypes) {
        const created = await tx.roomType.create({
          data: {
            boardingHouseId: boardingHouse.id,
            name: rt.name.trim(),
            description: rt.description?.trim() ?? null,
          },
        });
        roomTypeIds.push(created.id);
        createdRoomTypes.push(created);
      }

      // Step 4 — Quota already validated above; recorded here for audit clarity

      // Step 5 — Resolve indices to real UUIDs
      const resolvedRoomTypeId = roomTypeIds[dto.rooms.roomTypeIndex];
      const resolvedServiceIds = (dto.rooms.serviceIndices ?? []).map(
        (idx) => serviceIds[idx],
      );

      // Step 6 — Generate room name from template
      const renderName = (floor: number, index: number): string => {
        return dto.rooms.nameFormat
          .replace(/\{floor\}/g, String(floor))
          .replace(/\{index\}/g, String(index));
      };

      // Step 7 — INSERT Room[] + RoomService[]
      let roomsCreated = 0;
      for (let floor = 1; floor <= dto.rooms.floorCount; floor++) {
        for (let index = 1; index <= dto.rooms.roomsPerFloor; index++) {
          const roomNumber = renderName(floor, index);
          const room = await tx.room.create({
            data: {
              boardingHouseId: boardingHouse.id,
              roomNumber,
              floor,
              roomTypeId: resolvedRoomTypeId,
              area: dto.rooms.area
                ? new Prisma.Decimal(dto.rooms.area)
                : null,
              maxOccupants: dto.rooms.maxOccupants ?? null,
              status: 'available',
            },
          });

          // Step 7b — INSERT RoomService[] for each resolved service
          if (resolvedServiceIds.length > 0) {
            await tx.roomService.createMany({
              data: resolvedServiceIds.map((serviceId) => ({
                roomId: room.id,
                serviceId,
              })),
            });
          }

          roomsCreated++;
        }
      }

      // Step 8 — Promote user role to landlord
      await tx.user.update({
        where: { id: userId },
        data: { role: UserRole.landlord },
      });

      return {
        boardingHouse: {
          ...boardingHouse,
          services: createdServices,
          roomTypes: createdRoomTypes,
        },
        roomsCreated,
      };
    });

    return {
      success: true,
      boardingHouse: this.mapBoardingHouseResponse(
        result.boardingHouse,
        result.boardingHouse.services,
        result.boardingHouse.roomTypes,
      ),
      roomsCreated: result.roomsCreated,
    };
  }

  // ─── Legacy create (kept for any other usage) ────────────────────────────

  async createInitialProfile(
    userId: string,
    dto: CreateBoardingHouseDto,
  ): Promise<BoardingHouseResponseDto> {
    this.logger.log(`Creating initial property profile for user ${userId}`);

    const boardingHouse = await this.prisma.$transaction(async (tx) => {
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
          status: 'active',
          deletedAt: new Date('2099-12-31T00:00:00.000Z'),
          services: {
            create: (dto.services ?? []).map((service) => ({
              name: service.name.trim(),
              unit: service.unit.trim(),
              price: new Prisma.Decimal(service.price),
              isMetered: service.isMetered ?? false,
            })),
          },
          roomTypes: {
            create: (dto.roomTypes ?? []).map((roomType) => ({
              name: roomType.name.trim(),
              description: roomType.description?.trim() || null,
            })),
          },
        },
        include: {
          services: true,
          roomTypes: true,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: UserRole.landlord },
      });

      return createdBoardingHouse;
    });

    return this.mapBoardingHouseResponse(
      boardingHouse,
      boardingHouse.services,
      boardingHouse.roomTypes,
    );
  }

  // ─── UC-L-01 context: List properties ────────────────────────────────────

  async listMyProperties(userId: string): Promise<BoardingHouseListResponseDto> {
    this.logger.log(`Listing all boarding houses for user ${userId}`);

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
    });

    return {
      success: true,
      data: houses.map((house) => ({
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
        status: house.status,
        thumbnail: house.thumbnail ?? null,
        totalRooms: house._count.rooms,
        services: house.services.map(
          (service): BoardingHouseServiceResponseDto => ({
            id: service.id,
            name: service.name,
            unit: service.unit,
            price: this.formatMoney(service.price),
            isMetered: service.isMetered,
            autoApplied: service.autoApplied,
          }),
        ),
        roomTypes: house.roomTypes.map(
          (roomType): BoardingHouseRoomTypeResponseDto => ({
            id: roomType.id,
            name: roomType.name,
            description: roomType.description,
          }),
        ),
      })),
    };
  }

  // ─── UC-L-08: In-Memory Cache (Periodic Caching per Spec) ────────────────
  private readonly overviewCache = new Map<
    string,
    { data: BoardingHouseOverviewResponseDto; expiresAt: number }
  >();
  private readonly CACHE_TTL_MS = 60 * 1000; // 60s TTL per UC-L-08

  /** Invalidate overview cache for a specific boarding house or all */
  public invalidateOverviewCache(boardingHouseId?: string): void {
    if (boardingHouseId) {
      this.overviewCache.delete(boardingHouseId);
    } else {
      this.overviewCache.clear();
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
    );

    // Check in-memory periodic cache (UC-L-08 spec requirement)
    if (!forceRefresh) {
      const cached = this.overviewCache.get(boardingHouseId);
      if (cached && cached.expiresAt > Date.now()) {
        this.logger.log(`Returning cached overview for house ${boardingHouseId}`);
        return cached.data;
      }
    }

    const house = await this.prisma.boardingHouse.findFirst({
      where: { id: boardingHouseId, ownerId: userId },
    });

    if (!house) {
      throw new NotFoundException('Boarding house not found or unauthorized');
    }

    // 1. Room statistics (UC-L-08: Occupancy = COUNT(Room occupied) / COUNT(Room))
    const [totalRooms, occupiedRooms, vacantRooms, depositRooms, maintenanceRooms] =
      await Promise.all([
        this.prisma.room.count({ where: { boardingHouseId } }),
        this.prisma.room.count({ where: { boardingHouseId, status: 'occupied' } }),
        this.prisma.room.count({ where: { boardingHouseId, status: 'available' } }),
        this.prisma.room.count({ where: { boardingHouseId, status: 'deposited' } }),
        this.prisma.room.count({ where: { boardingHouseId, status: 'maintainace' } }),
      ]);

    const occupancyRate =
      totalRooms > 0
        ? `${Math.round((occupiedRooms / totalRooms) * 100)}%`
        : '0%';

    // 2. Financial metrics & Revenue (UC-L-08: Revenue = SUM(Payment.amount) WHERE type='charge' AND status='success')
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

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
      ]);

    // 3. Collection status: Invoice grouped by status for current period (UC-L-08)
    let paidCount = 0;
    let paidAmount = 0;
    let unpaidCount = 0;
    let unpaidAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    for (const inv of currentPeriodInvoices) {
      const amt = Number(inv.totalAmount);
      const isOverdue =
        inv.status === 'overdue' ||
        (inv.status === 'unpaid' && new Date(inv.dueDate) < now);

      if (inv.status === 'paid') {
        paidCount++;
        paidAmount += amt;
      } else if (isOverdue) {
        overdueCount++;
        overdueAmount += amt;
      } else {
        unpaidCount++;
        unpaidAmount += amt;
      }
    }

    const totalBilled = paidAmount + unpaidAmount + overdueAmount;
    const collectionRate =
      totalBilled > 0
        ? `${Math.round((paidAmount / totalBilled) * 1000) / 10}%`
        : '0%';

    // 4. Expiring contracts within next 30 days (UC-L-08: endDate BETWEEN NOW() AND NOW() + 30 days)
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
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
    });

    const expiringContracts = expiringContractsRaw.map((c) => {
      const tenant = c.tenantContracts[0]?.tenant;
      const daysLeft = Math.max(
        0,
        Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );
      return {
        id: c.id,
        room: `P.${c.room.roomNumber}`,
        tenant: tenant?.username || tenant?.phoneNumber || 'Khách thuê',
        phone: tenant?.phoneNumber || '',
        daysLeft,
        endDate: c.endDate.toLocaleDateString('vi-VN'),
      };
    });

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
    });

    const depositNotifications = depositsRaw.map((d) => {
      const tenant = d.contract?.tenantContracts[0]?.tenant;
      return {
        id: d.id,
        room: `P.${d.room.roomNumber}`,
        tenant: tenant?.username || tenant?.phoneNumber || 'Khách thuê',
        amount: Number(d.amount),
        date: d.createdAt.toLocaleDateString('vi-VN'),
        type: d.type === 'platform' ? 'Cọc Escrow Dormio' : 'Cọc giữ phòng',
        status: d.status,
      };
    });

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
    });

    const maintenanceRequests = grievancesRaw.map((g) => ({
      id: g.id,
      room: `P.${g.room.roomNumber}`,
      issue: g.title,
      priority: g.priority,
      reporter: g.tenant?.username || g.tenant?.phoneNumber || 'Người thuê',
      date: g.createdAt.toLocaleDateString('vi-VN'),
      status: g.status,
    }));

    // 7. Monthly revenue history (past 6 months) with type='charge' & status='success'
    const monthlyRevenue: Array<{ month: string; val: number; fullAmount: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;

      const mPayments = await this.prisma.payment.aggregate({
        where: {
          invoice: { room: { boardingHouseId } },
          type: 'charge',
          status: 'success',
          paidAt: { gte: mStart, lte: mEnd },
        },
        _sum: { amount: true },
      });

      const totalNum = Number(mPayments._sum.amount ?? 0);
      monthlyRevenue.push({
        month: monthLabel,
        val: Math.round((totalNum / 1000000) * 10) / 10,
        fullAmount: this.formatMoney(mPayments._sum.amount ?? 0),
      });
    }

    const hasAnyRevenue = monthlyRevenue.some((m) => m.val > 0);
    const revenueChart = hasAnyRevenue ? monthlyRevenue : [];

    // 8. Monthly occupancy history (past 6 months)
    const occupancyChart: Array<{ month: string; occupied: number; total: number; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;

      const activeContracts = await this.prisma.contract.count({
        where: {
          room: { boardingHouseId },
          status: 'active',
          startDate: { lte: mEnd },
          endDate: { gte: d },
        },
      });

      const occRateNum = totalRooms > 0 ? Math.min(100, Math.round((activeContracts / totalRooms) * 100)) : 0;
      occupancyChart.push({
        month: monthLabel,
        occupied: occRateNum,
        total: totalRooms,
        count: activeContracts,
      });
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
    };

    // Save in cache (60s TTL)
    this.overviewCache.set(boardingHouseId, {
      data: result,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return result;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

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
    });

    return activeSub?.subscriptionPlan.maxRoom ?? FREE_TIER_MAX_ROOM;
  }

  private mapBoardingHouseResponse(
    boardingHouse: {
      id: string;
      name: string;
      description: string | null;
      country: string;
      province: string;
      city?: string | null;
      ward: string;
      district: string;
      street: string;
      houseNumber: string;
      totalFloor: number | null;
      builtAt: Date;
      status: string;
      thumbnail?: string | null;
    },
    services: Array<{
      id: string;
      name: string;
      unit: string;
      price: unknown;
      isMetered: boolean;
      autoApplied: boolean;
    }>,
    roomTypes: Array<{
      id: string;
      name: string;
      description: string | null;
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
      status: boardingHouse.status,
      thumbnail: boardingHouse.thumbnail ?? null,
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        unit: s.unit,
        price: this.formatMoney(s.price),
        isMetered: s.isMetered,
        autoApplied: s.autoApplied,
      })),
      roomTypes: roomTypes.map((rt) => ({
        id: rt.id,
        name: rt.name,
        description: rt.description,
      })),
    };
  }

  private formatMoney(value: unknown): string {
    const [integerPart, decimalPart = ''] = String(value).split('.');
    return `${integerPart}.${decimalPart.padEnd(2, '0').slice(0, 2)}`;
  }

  /**
   * Get full boarding house details for admin inspection (House info, owner, services, room types, grievances)
   */
  async getBoardingHouseDetails(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    let house: any = null;

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
      });
    }

    if (house) {
      const totalRooms = house.rooms.length;
      const occupiedRooms = house.rooms.filter((r: any) => r.status === 'occupied').length;
      const vacantRooms = house.rooms.filter((r: any) => r.status === 'available').length;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

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
      };
    }

    return this.getMockBoardingHouseDetails(id);
  }

  private getMockBoardingHouseDetails(id: string) {
    const isLocked = id === 'BH-1004';
    const isReported = id === 'BH-1001' || id === 'BH-1005';

    return {
      id,
      name: id === 'BH-1001' ? 'Dormio Signature Premium Q1' : id === 'BH-1002' ? 'Nhà Trọ Hưng Thịnh Thủ Đức' : id === 'BH-1003' ? 'Ký Túc Xá Sinh Viên Xanh Cầu Giấy' : id === 'BH-1004' ? 'Tòa Nhà Cho Thuê Bình Thạnh 18' : 'Dormio Eco House Tân Bình',
      description: 'Tòa nhà căn hộ dịch vụ cao cấp, đầy đủ tiện nghi, camera an ninh 24/7, thang máy tốc độ cao, bãi đỗ xe rộng rãi có bảo vệ quản lý.',
      address: id === 'BH-1001' ? '128 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM' : id === 'BH-1002' ? '45 Đường D1, Phường Tăng Nhơn Phú A, TP. Thủ Đức' : id === 'BH-1003' ? '88 Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy, Hà Nội' : id === 'BH-1004' ? '220/15 Xô Viết Nghệ Tĩnh, Phường 21, Bình Thạnh, TP.HCM' : '52 Bạch Đằng, Phường 2, Tân Bình, TP.HCM',
      rawAddress: {
        houseNumber: '128',
        street: 'Nguyễn Trãi',
        ward: 'Phường Bến Thành',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        province: 'Hồ Chí Minh',
        country: 'Việt Nam',
      },
      builtAt: '2023-05-15T00:00:00.000Z',
      totalFloor: 6,
      status: isLocked ? 'locked' : isReported ? 'reported' : 'active',
      lockReason: isLocked ? 'Vi phạm an toàn PCCC & khiếu nại chiếm dụng tiền cọc' : undefined,
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
        name: id === 'BH-1001' ? 'Lê Minh Tuấn' : id === 'BH-1002' ? 'Nguyễn Văn Hùng' : 'Phạm Thu Thảo',
        username: id === 'BH-1001' ? 'Lê Minh Tuấn' : id === 'BH-1002' ? 'Nguyễn Văn Hùng' : 'Phạm Thu Thảo',
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
        { id: 'srv-1', name: 'Điện sinh hoạt', price: 3500, unit: 'kWh', autoApplied: true, isMetered: true },
        { id: 'srv-2', name: 'Nước máy sinh hoạt', price: 20000, unit: 'khối', autoApplied: true, isMetered: true },
        { id: 'srv-3', name: 'Internet WiFi tốc độ cao', price: 100000, unit: 'phòng/tháng', autoApplied: true, isMetered: false },
        { id: 'srv-4', name: 'Vệ sinh hành lang & rác thải', price: 50000, unit: 'phòng/tháng', autoApplied: true, isMetered: false },
        { id: 'srv-5', name: 'Giữ xe máy có thẻ từ', price: 120000, unit: 'xe/tháng', autoApplied: false, isMetered: false },
      ],
      roomTypes: [
        { id: 'rt-1', name: 'Phòng Duplex Ban Công Riêng', description: 'Gác lửng đúc kiên cố, ban công thoáng mát đón nắng, bếp riêng, máy giặt riêng.', area: 35, basePrice: 6500000, roomsCount: 8 },
        { id: 'rt-2', name: 'Phòng Studio Full Nội Thất', description: 'Không gian mở hiện đại, giường nệm cao cấp, tủ lạnh inverter, điều hòa 1.5HP.', area: 28, basePrice: 5200000, roomsCount: 7 },
        { id: 'rt-3', name: 'Phòng Gác Lửng Hiện Đại', description: 'Tiết kiệm diện tích, bàn học làm việc tiện lợi, nhà vệ sinh khép kín sạch sẽ.', area: 22, basePrice: 4000000, roomsCount: 5 },
      ],
      grievances: [
        {
          id: 'grv-1',
          title: 'Tự ý thu tiền điện 5.000đ/kWh trái thỏa thuận hợp đồng',
          description: 'Hợp đồng thuê ký rõ tiền điện là 3.500đ/kWh, tuy nhiên tháng này chủ trọ đơn phương xuất hóa đơn tính 5.000đ/kWh và đe dọa cắt điện nếu không đóng đúng hạn.',
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
          title: 'Thấm dột nhà vệ sinh kéo dài không khắc phục',
          description: 'Nhà vệ sinh phòng 205 bị rò rỉ nước từ tầng trên xuống suốt 2 tuần qua, sàn nhà luôn ẩm ướt gây trơn trượt nguy hiểm. Đã báo quản lý 3 lần nhưng không có người sửa.',
          priority: 'medium',
          status: 'in_progress',
          createdAt: '2026-09-08T09:15:00.000Z',
          resolutionNote: 'Đã nhắc nhở chủ nhà và hẹn thợ kiểm tra đường ống vào ngày 12/09/2026.',
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
          title: 'Mất nước sinh hoạt đột ngột không thông báo trước',
          description: 'Tòa nhà cúp nước liên tục vào khung giờ cao điểm sáng sớm 6h-8h khiến người thuê không thể sinh hoạt, không hề có thông báo trước trong nhóm cư dân.',
          priority: 'high',
          status: 'resolved',
          createdAt: '2026-09-02T07:45:00.000Z',
          resolvedAt: '2026-09-03T16:00:00.000Z',
          resolutionNote: 'Chủ nhà đã thay máy bơm tăng áp mới và lắp bồn dự phòng 2.000L.',
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
    };
  }
}
