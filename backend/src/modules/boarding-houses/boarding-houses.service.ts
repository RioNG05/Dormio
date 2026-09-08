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

  // ─── UC-L-01: Returning Landlord Overview Dashboard ───────────────────────

  async getDashboardOverview(
    userId: string,
    boardingHouseId: string,
  ): Promise<BoardingHouseOverviewResponseDto> {
    this.logger.log(
      `Fetching dashboard overview for user ${userId} and house ${boardingHouseId}`,
    );

    const house = await this.prisma.boardingHouse.findFirst({
      where: { id: boardingHouseId, ownerId: userId },
    });

    if (!house) {
      throw new NotFoundException('Boarding house not found or unauthorized');
    }

    // 1. Room statistics
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

    // 2. Financial metrics
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

    const [currentMonthPayments, unpaidInvoices, paidInvoicesCount] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            invoice: {
              room: { boardingHouseId },
            },
            status: 'success',
            createdAt: { gte: startOfMonth, lte: endOfMonth },
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
      ]);

    // 3. Expiring contracts within next 30 days
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringContractsRaw = await this.prisma.contract.findMany({
      where: {
        room: { boardingHouseId },
        status: 'active',
        endDate: { lte: in30Days },
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

    // 4. Deposits
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

    // 5. Maintenance requests (Grievances)
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

    // 6. Monthly revenue history (past 6 months)
    const monthlyRevenue: Array<{ month: string; val: number; fullAmount: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;

      const mPayments = await this.prisma.payment.aggregate({
        where: {
          invoice: { room: { boardingHouseId } },
          status: 'success',
          createdAt: { gte: mStart, lte: mEnd },
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

    return {
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
      revenueChart,
      depositNotifications,
      maintenanceRequests,
      expiringContracts,
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
