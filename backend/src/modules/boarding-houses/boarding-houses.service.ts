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
  MultiPropertyOverviewResponseDto,
  PropertyBreakdownDto,
} from './dto/multi-property-overview-response.dto';
import { AiStrategyResponseDto } from './dto/ai-strategy-response.dto';
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

  // ─── UC-L-24: Advanced Multi-Property Reports & AI Strategy ───────────────

  /**
   * UC-L-24: Advanced Multi-Property Reports
   * Aggregated across all BoardingHouse WHERE ownerId = current_user.id
   */
  async getMultiPropertyOverview(
    userId: string,
  ): Promise<MultiPropertyOverviewResponseDto> {
    this.logger.log(`getMultiPropertyOverview called for user ${userId}`);

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const houses = await this.prisma.boardingHouse.findMany({
      where: {
        ownerId: userId,
        deletedAt: { gt: now },
      },
      include: {
        rooms: true,
      },
      orderBy: { createdAt: 'desc' },
    });

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
      };
    }

    const houseIds = houses.map((h) => h.id);

    // 1. Aggregated Rooms
    let totalRooms = 0;
    let occupiedRooms = 0;
    let vacantRooms = 0;
    let depositRooms = 0;
    let maintenanceRooms = 0;

    for (const h of houses) {
      totalRooms += h.rooms.length;
      occupiedRooms += h.rooms.filter((r) => r.status === 'occupied').length;
      vacantRooms += h.rooms.filter((r) => r.status === 'available').length;
      depositRooms += h.rooms.filter((r) => r.status === 'deposited').length;
      maintenanceRooms += h.rooms.filter((r) => r.status === 'maintainace').length;
    }

    const occupancyRate =
      totalRooms > 0
        ? `${Math.round((occupiedRooms / totalRooms) * 1000) / 10}%`
        : '0%';

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
      ]);

    const totalRevenueNum = Number(currentMonthPayments._sum.amount ?? 0);
    const totalExpensesNum = Number(currentMonthExpenses._sum.amount ?? 0);
    const netProfitNum = totalRevenueNum - totalExpensesNum;

    // 3. Collection Status across all properties
    const currentPeriodInvoices = await this.prisma.invoice.findMany({
      where: {
        room: { boardingHouseId: { in: houseIds } },
        createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
      },
      select: { totalAmount: true, status: true, dueDate: true },
    });

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

    // 4. Expiring contracts across all properties in next 30 days
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
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
    });

    const expiringContracts = expiringContractsRaw.map((c) => {
      const tenant = c.tenantContracts[0]?.tenant;
      const daysLeft = Math.max(
        0,
        Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );
      return {
        id: c.id,
        propertyName: c.room.boardingHouse.name,
        room: `P.${c.room.roomNumber}`,
        tenant: tenant?.username || tenant?.phoneNumber || 'Khách thuê',
        phone: tenant?.phoneNumber || '',
        daysLeft,
        endDate: c.endDate.toLocaleDateString('vi-VN'),
      };
    });

    // 5. Per-Property Comparison Breakdown
    const propertiesBreakdown: PropertyBreakdownDto[] = [];
    for (const h of houses) {
      const hTotalRooms = h.rooms.length;
      const hOccupied = h.rooms.filter((r) => r.status === 'occupied').length;
      const hVacant = h.rooms.filter((r) => r.status === 'available').length;
      const hOccRate =
        hTotalRooms > 0
          ? `${Math.round((hOccupied / hTotalRooms) * 1000) / 10}%`
          : '0%';

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
      ]);

      const hRevNum = Number(hRev._sum.amount ?? 0);
      const hExpNum = Number(hExp._sum.amount ?? 0);
      const hNetNum = hRevNum - hExpNum;

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
      });
    }

    // 6. Combined Past 6 Months Revenue History
    const monthlyRevenue: Array<{ month: string; val: number; fullAmount: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;

      const mPayments = await this.prisma.payment.aggregate({
        where: {
          invoice: { room: { boardingHouseId: { in: houseIds } } },
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
        fullAmount: this.formatMoney(totalNum),
      });
    }

    // 7. Combined Past 6 Months Occupancy History
    const occupancyChart: Array<{ month: string; occupied: number; total: number; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;

      const activeContracts = await this.prisma.contract.count({
        where: {
          room: { boardingHouseId: { in: houseIds } },
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
    };
  }

  /**
   * UC-L-24 & UC-L-12: Generate AI Marketing Strategy across all properties
   * Reuses AiConversation & AiMessage pattern with aggregated portfolio metrics.
   */
  async generateMultiPropertyAiStrategy(
    userId: string,
  ): Promise<AiStrategyResponseDto> {
    this.logger.log(`generateMultiPropertyAiStrategy called for user ${userId}`);

    const overview = await this.getMultiPropertyOverview(userId);
    const { portfolioSummary, propertiesBreakdown } = overview;

    // Find first boarding house for conversation relation constraint
    const firstHouse = await this.prisma.boardingHouse.findFirst({
      where: { ownerId: userId, deletedAt: { gt: new Date() } },
    });

    if (!firstHouse) {
      throw new BadRequestException('Bạn chưa có nhà trọ nào để tạo chiến lược tiếp thị');
    }

    const underperforming = propertiesBreakdown.filter(
      (p) => parseFloat(p.occupancyRate) < 80 || p.unpaidInvoicesCount > 2,
    );

    const vacantTotal = portfolioSummary.vacantRooms;
    const occRate = portfolioSummary.occupancyRate;

    const executiveSummary =
      portfolioSummary.totalProperties > 1
        ? `Hệ thống đang vận hành ${portfolioSummary.totalProperties} cơ sở với tổng cộng ${portfolioSummary.totalRooms} phòng. Tỷ lệ lấp đầy đạt ${occRate}, hiện còn ${vacantTotal} phòng trống cần khai thác. Doanh thu thuần tháng này ước đạt ${portfolioSummary.netProfit} VNĐ sau khi trừ chi phí vận hành.`
        : `Cơ sở hiện có ${portfolioSummary.totalRooms} phòng, đạt tỷ lệ lấp đầy ${occRate} với ${vacantTotal} phòng trống. Cần đẩy mạnh tiếp thị để đạt tỷ lệ tối ưu trên 90%.`;

    const pricingRecommendations = [
      vacantTotal > 0
        ? `Áp dụng chính sách giá linh hoạt: Giảm 5% – 8% giá thuê tháng đầu tiên cho khách ký hợp đồng từ 6 tháng trở lên cho ${vacantTotal} phòng đang trống.`
        : 'Tỷ lệ phòng trống thấp: Cân nhắc tăng nhẹ 3% – 5% giá thuê đối với các hợp đồng ký mới hoặc khi gia hạn để tối đa hóa biên lợi nhuận.',
      'Cơ cấu lại phí dịch vụ (xe máy, wifi, vệ sinh) thành gói combo trọn gói nhằm gia tăng giá trị cảm nhận cho khách thuê trẻ tuổi.',
    ];

    const marketingCampaigns = [
      'Đẩy mạnh tin đăng nổi bật trên nền tảng tìm trọ Dormio BHRP vào khung giờ vàng (11:00 - 13:00 và 19:00 - 21:00).',
      underperforming.length > 0
        ? `Tập trung chiến dịch thu hút khách cho cơ sở "${underperforming[0].name}" qua nhóm sinh viên và cư dân văn phòng trong bán kính 3km.`
        : 'Triển khai chương trình giới thiệu: Tặng 200.000đ trừ vào tiền phòng tháng kế tiếp cho người thuê hiện tại khi giới thiệu bạn bè thành công.',
      'Chụp lại ảnh phòng với góc rộng, ánh sáng tự nhiên và bổ sung video ngắn 360 độ khu vực hành lang, tiện ích chung.',
    ];

    const operationalOptimizations = [
      `Kiểm soát chi phí: Chi phí vận hành tháng này chiếm tỷ trọng đáng kể (${portfolioSummary.currentMonthExpenses} VNĐ). Cần rà soát các khoản điện nước chung và vật tư bảo trì.`,
      `Công nợ tồn đọng: Tổng tiền chưa thu là ${portfolioSummary.unpaidDebt} VNĐ trên ${portfolioSummary.unpaidInvoicesCount} hóa đơn. Nên gửi thông báo nhắc lịch tự động trước 3 ngày qua Zalo/SMS.`,
    ];

    const actionPlan30Days = [
      {
        dayRange: 'Tuần 1 (Ngày 1 - 7)',
        title: 'Rà soát danh mục phòng trống & Chụp ảnh chuẩn hóa',
        description: `Kiểm tra hiện trạng ${vacantTotal} phòng trống, hoàn tất dọn dẹp và chụp ảnh mới với góc sáng đẹp để cập nhật lên tin đăng Dormio.`,
      },
      {
        dayRange: 'Tuần 2 (Ngày 8 - 15)',
        title: 'Kích hoạt chính sách ưu đãi cọc & Đăng tin tiếp thị',
        description: 'Bật chiến dịch ưu đãi cọc linh hoạt 0.5 tháng và chia sẻ bài đăng vào các hội đồng hương sinh viên.',
      },
      {
        dayRange: 'Tuần 3 (Ngày 16 - 23)',
        title: 'Chăm sóc khách thuê hiện tại & Thu hồi công nợ',
        description: 'Gửi khảo sát nhanh về chất lượng phòng và đôn đốc xử lý các hóa đơn trễ hạn theo quy trình tự động.',
      },
      {
        dayRange: 'Tuần 4 (Ngày 24 - 30)',
        title: 'Đánh giá tỷ lệ chuyển đổi & Tái cân bằng ngân sách',
        description: 'Tổng kết số lượng khách đã chốt cọc trong tháng, điều chỉnh giá cho các phòng còn lại và lập dự trù chi phí tháng tới.',
      },
    ];

    // Persist in AiConversation and AiMessage per UC-L-24
    try {
      let conversation = await this.prisma.aiConversation.findFirst({
        where: { userId, boardingHouseId: firstHouse.id },
      });

      if (!conversation) {
        conversation = await this.prisma.aiConversation.create({
          data: {
            userId,
            boardingHouseId: firstHouse.id,
          },
        });
      }

      await this.prisma.aiMessage.create({
        data: {
          aiConversationId: conversation.id,
          role: 'user',
          content: `Yêu cầu phân tích hiệu quả kinh doanh ${portfolioSummary.totalProperties} cơ sở, tỷ lệ lấp đầy ${occRate}, doanh thu ${portfolioSummary.currentMonthRevenue} VNĐ.`,
          model: 'dormio-gpt-pro',
        },
      });

      await this.prisma.aiMessage.create({
        data: {
          aiConversationId: conversation.id,
          role: 'assistant',
          content: executiveSummary,
          model: 'dormio-gpt-pro',
        },
      });
    } catch (dbErr) {
      this.logger.warn(`Failed to persist AI messages: ${dbErr}`);
    }

    return {
      title: `Chiến lược tiếp thị & Tối ưu kinh doanh toàn hệ thống (${portfolioSummary.totalProperties} cơ sở)`,
      executiveSummary,
      pricingRecommendations,
      marketingCampaigns,
      operationalOptimizations,
      actionPlan30Days,
      createdAt: new Date().toISOString(),
    };
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
}
