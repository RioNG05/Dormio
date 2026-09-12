import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AdminHousesFilterDto } from './dto/admin-houses-filter.dto';
import {
  AdminHouseItemDto,
  AdminHousesListResponseDto,
} from './dto/admin-houses-response.dto';
import { BoardingHouseStatus, AuditLogAction } from '@prisma';

@Injectable()
export class AdminHousesService {
  private readonly logger = new Logger(AdminHousesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all boarding houses for moderation with multi-value filtering and pagination.
   */
  async getBoardingHousesForModeration(
    filter: AdminHousesFilterDto,
  ): Promise<AdminHousesListResponseDto> {
    this.logger.log(
      `getBoardingHousesForModeration called with filters: propertyQuery="${filter.propertyQuery || ''}", landlordQuery="${filter.landlordQuery || ''}", minRooms=${filter.minRooms ?? ''}, maxRooms=${filter.maxRooms ?? ''}, minOccupancy=${filter.minOccupancy ?? ''}, maxOccupancy=${filter.maxOccupancy ?? ''}, status="${filter.status || ''}", page=${filter.page || 1}, limit=${filter.limit || 10}`,
    );

    // 1. Fetch DB Boarding Houses
    let dbHouses: AdminHouseItemDto[] = [];
    try {
      const houses = await this.prisma.boardingHouse.findMany({
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
            },
          },
          rooms: {
            select: {
              id: true,
              status: true,
            },
          },
          grievences: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      dbHouses = houses.map((h) => {
        const totalRooms = h.rooms.length;
        const occupiedRooms = h.rooms.filter((r) => r.status === 'occupied').length;
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
        const reportsCount = h.grievences.length;
        const reportReasons = h.grievences.map((g) => g.title).filter(Boolean);

        let status: 'active' | 'locked' | 'reported' = 'active';
        if (h.status === BoardingHouseStatus.banned || h.status === BoardingHouseStatus.inactive) {
          status = 'locked';
        } else if (reportsCount > 0) {
          status = 'reported';
        }

        const address = `${h.houseNumber} ${h.street}, ${h.ward}, ${h.district}, ${h.province || h.city}`;

        return {
          id: h.id,
          name: h.name,
          landlordName: h.owner?.username || 'Chủ trọ',
          landlordPhone: h.owner?.phoneNumber || '0901.000.000',
          landlordEmail: h.owner?.email || 'landlord@dormio.vn',
          address,
          totalRooms,
          occupiedRooms,
          occupancyRate,
          status,
          reportsCount,
          reportReasons,
          createdAt: h.createdAt.toISOString().slice(0, 10),
          coverImage: h.thumbnail || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
        };
      });
    } catch (err: any) {
      this.logger.warn(`Could not query database houses: ${err?.message}`);
    }

    // 2. Multi-value Filtering directly on real database houses
    const propertyQuery = (filter.propertyQuery || '').trim().toLowerCase();
    const landlordQuery = (filter.landlordQuery || '').trim().toLowerCase();
    const minRooms = filter.minRooms !== undefined && filter.minRooms !== null ? Number(filter.minRooms) : null;
    const maxRooms = filter.maxRooms !== undefined && filter.maxRooms !== null ? Number(filter.maxRooms) : null;
    const minOccupancy = filter.minOccupancy !== undefined && filter.minOccupancy !== null ? Number(filter.minOccupancy) : null;
    const maxOccupancy = filter.maxOccupancy !== undefined && filter.maxOccupancy !== null ? Number(filter.maxOccupancy) : null;

    // Status multi-value parsing (e.g. "active,reported" or "all")
    const rawStatus = (filter.status || '').trim().toLowerCase();
    const selectedStatuses = rawStatus && rawStatus !== 'all'
      ? rawStatus.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const filtered = dbHouses.filter((h) => {
      // 1. Column: Property & Address search
      if (propertyQuery) {
        const matchesProperty =
          h.name.toLowerCase().includes(propertyQuery) ||
          h.address.toLowerCase().includes(propertyQuery);
        if (!matchesProperty) return false;
      }

      // 2. Column: Landlord Contact search (name or phone or email)
      if (landlordQuery) {
        const matchesLandlord =
          h.landlordName.toLowerCase().includes(landlordQuery) ||
          h.landlordPhone.toLowerCase().includes(landlordQuery) ||
          h.landlordEmail.toLowerCase().includes(landlordQuery);
        if (!matchesLandlord) return false;
      }

      // 3. Column: Total Rooms range
      if (minRooms !== null && !isNaN(minRooms) && h.totalRooms < minRooms) {
        return false;
      }
      if (maxRooms !== null && !isNaN(maxRooms) && h.totalRooms > maxRooms) {
        return false;
      }

      // 4. Column: Occupancy Rate range
      if (minOccupancy !== null && !isNaN(minOccupancy) && h.occupancyRate < minOccupancy) {
        return false;
      }
      if (maxOccupancy !== null && !isNaN(maxOccupancy) && h.occupancyRate > maxOccupancy) {
        return false;
      }

      // 5. Column: Status multi-value filter
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(h.status)) {
          return false;
        }
      }

      return true;
    });

    // 4. Pagination
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Number(filter.limit) || 10);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginated,
      pagination: {
        total,
        page: safePage,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Lock a boarding house with reason and audit log.
   */
  async lockHouse(id: string, reason: string, adminId?: string) {
    this.logger.log(`lockHouse called for houseId=${id} by adminId=${adminId || 'admin'}`);

    const house = await this.prisma.boardingHouse.findUnique({ where: { id } });
    if (!house) {
      throw new NotFoundException(`Boarding house with ID ${id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.boardingHouse.update({
        where: { id },
        data: { status: BoardingHouseStatus.banned },
      });

      if (adminId) {
        await tx.auditLog.create({
          data: {
            action: AuditLogAction.update,
            entityType: 'BOARDING_HOUSE',
            entityId: id,
            boardingHouseId: id,
            userId: adminId,
            ipAddress: '127.0.0.1',
            newValue: {
              action: 'lock_house',
              reason,
              lockedAt: new Date().toISOString(),
            },
          },
        });
      }
    });

    return {
      success: true,
      message: 'Boarding house locked successfully',
      id,
      status: 'locked',
      reason,
    };
  }

  /**
   * Unlock a boarding house and reactivate operations.
   */
  async unlockHouse(id: string, adminId?: string) {
    this.logger.log(`unlockHouse called for houseId=${id} by adminId=${adminId || 'admin'}`);

    const house = await this.prisma.boardingHouse.findUnique({ where: { id } });
    if (!house) {
      throw new NotFoundException(`Boarding house with ID ${id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.boardingHouse.update({
        where: { id },
        data: { status: BoardingHouseStatus.active },
      });

      if (adminId) {
        await tx.auditLog.create({
          data: {
            action: AuditLogAction.update,
            entityType: 'BOARDING_HOUSE',
            entityId: id,
            boardingHouseId: id,
            userId: adminId,
            ipAddress: '127.0.0.1',
            newValue: {
              action: 'unlock_house',
              unlockedAt: new Date().toISOString(),
            },
          },
        });
      }
    });

    return {
      success: true,
      message: 'Boarding house unlocked successfully',
      id,
      status: 'active',
    };
  }
}
