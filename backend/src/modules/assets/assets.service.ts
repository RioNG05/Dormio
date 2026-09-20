import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, AssetCondition, AuditLogAction } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { QueryAssetsDto } from './dto/query-assets.dto';
import {
  AssetItemDto,
  AssetsListResponseDto,
  AssetsSummaryDto,
} from './dto/asset-response.dto';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a readable code for tracking (e.g. TS-A1B2)
   */
  private generateAssetCode(id: string): string {
    const suffix = id.replace(/-/g, '').slice(-4).toUpperCase();
    return `TS-${suffix}`;
  }

  /**
   * Maps Prisma Asset entity to AssetItemDto
   */
  private mapToAssetDto(asset: {
    id: string;
    boardingHouseId: string;
    roomId: string | null;
    name: string;
    category: string | null;
    location: string;
    quantity: number;
    condition: AssetCondition;
    purchasePrice: Prisma.Decimal | null;
    purchaseDate: Date | null;
    imageUrl: string | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
    room?: { id: string; roomNumber: string } | null;
  }): AssetItemDto {
    const roomName = asset.room
      ? `Phòng ${asset.room.roomNumber}`
      : 'Khu vực chung / Chưa gán';

    return {
      id: asset.id,
      code: this.generateAssetCode(asset.id),
      name: asset.name,
      category: asset.category,
      location: asset.location,
      roomId: asset.roomId,
      roomNumber: asset.room?.roomNumber ?? null,
      roomName,
      quantity: asset.quantity,
      condition: asset.condition,
      purchasePrice: asset.purchasePrice ? Number(asset.purchasePrice) : null,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString() : null,
      imageUrl: asset.imageUrl,
      note: asset.note,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      boardingHouseId: asset.boardingHouseId,
    };
  }

  /**
   * UC-L-25: Create a new asset
   */
  async createAsset(
    landlordId: string,
    boardingHouseId: string,
    dto: CreateAssetDto,
  ): Promise<AssetItemDto> {
    this.logger.log(
      `Landlord ${landlordId} creating asset "${dto.name}" in house ${boardingHouseId}`,
    );

    // Validate room ownership if roomId provided
    if (dto.roomId) {
      const room = await this.prisma.room.findFirst({
        where: { id: dto.roomId, boardingHouseId },
      });
      if (!room) {
        throw new BadRequestException('Phòng được chọn không thuộc nhà trọ này.');
      }
    }

    const asset = await this.prisma.asset.create({
      data: {
        boardingHouseId,
        roomId: dto.roomId || null,
        name: dto.name.trim(),
        category: dto.category?.trim() || null,
        location: dto.location.trim(),
        quantity: dto.quantity ?? 1,
        condition: dto.condition ?? AssetCondition.good,
        purchasePrice:
          dto.purchasePrice != null ? new Prisma.Decimal(dto.purchasePrice) : null,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        imageUrl: dto.imageUrl || null,
        note: dto.note || null,
      },
      include: {
        room: {
          select: { id: true, roomNumber: true },
        },
      },
    });

    // Write AuditLog
    try {
      await this.prisma.auditLog.create({
        data: {
          action: AuditLogAction.create,
          entityType: 'ASSET',
          entityId: asset.id,
          userId: landlordId,
          boardingHouseId,
          ipAddress: '127.0.0.1',
          newValue: asset as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (auditErr) {
      this.logger.warn(`Failed to create AuditLog for asset ${asset.id}:`, auditErr);
    }

    return this.mapToAssetDto(asset);
  }

  /**
   * UC-L-25: List assets with filters & summary
   */
  async getAssets(
    boardingHouseId: string,
    query: QueryAssetsDto,
  ): Promise<AssetsListResponseDto> {
    const {
      search,
      category,
      condition,
      roomId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {
      boardingHouseId,
    };

    if (search && search.trim()) {
      const keyword = search.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { location: { contains: keyword, mode: 'insensitive' } },
        { category: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (category && category.trim()) {
      where.category = { equals: category.trim(), mode: 'insensitive' };
    }

    if (condition) {
      where.condition = condition;
    }

    if (roomId) {
      const lower = roomId.trim().toLowerCase();
      if (lower === 'unassigned' || lower === 'none' || lower === 'null') {
        where.roomId = null;
      } else {
        where.roomId = roomId;
      }
    }

    const orderBy: Prisma.AssetOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'purchasePrice') {
      orderBy.purchasePrice = sortOrder;
    } else if (sortBy === 'condition') {
      orderBy.condition = sortOrder;
    } else if (sortBy === 'quantity') {
      orderBy.quantity = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [items, total, allAssets] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          room: {
            select: { id: true, roomNumber: true },
          },
        },
      }),
      this.prisma.asset.count({ where }),
      this.prisma.asset.findMany({
        where: { boardingHouseId },
        select: {
          quantity: true,
          purchasePrice: true,
          condition: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    // Calculate property-level summary
    const summary: AssetsSummaryDto = {
      totalItems: allAssets.length,
      totalQuantity: allAssets.reduce((sum, a) => sum + a.quantity, 0),
      totalValue: allAssets.reduce(
        (sum, a) => sum + (Number(a.purchasePrice ?? 0) * a.quantity),
        0,
      ),
      goodConditionCount: allAssets.filter(
        (a) => a.condition === AssetCondition.new || a.condition === AssetCondition.good,
      ).length,
      needsRepairCount: allAssets.filter(
        (a) =>
          a.condition === AssetCondition.damaged ||
          a.condition === AssetCondition.under_repair,
      ).length,
    };

    return {
      success: true,
      data: items.map((item) => this.mapToAssetDto(item)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      summary,
    };
  }

  /**
   * UC-L-25: Get asset details by ID
   */
  async getAssetDetail(
    boardingHouseId: string,
    id: string,
  ): Promise<AssetItemDto> {
    const asset = await this.prisma.asset.findFirst({
      where: { id, boardingHouseId },
      include: {
        room: {
          select: { id: true, roomNumber: true },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Không tìm thấy tài sản.');
    }

    return this.mapToAssetDto(asset);
  }

  /**
   * UC-L-25: Update asset details
   */
  async updateAsset(
    boardingHouseId: string,
    id: string,
    dto: UpdateAssetDto,
    landlordId: string,
  ): Promise<AssetItemDto> {
    this.logger.log(
      `Landlord ${landlordId} updating asset ${id} in house ${boardingHouseId}`,
    );

    const existing = await this.prisma.asset.findFirst({
      where: { id, boardingHouseId },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy tài sản cần cập nhật.');
    }

    // If roomId changed and is not null, validate it
    if (dto.roomId !== undefined && dto.roomId !== null) {
      const room = await this.prisma.room.findFirst({
        where: { id: dto.roomId, boardingHouseId },
      });
      if (!room) {
        throw new BadRequestException('Phòng được chọn không thuộc nhà trọ này.');
      }
    }

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        category:
          dto.category !== undefined ? dto.category?.trim() || null : undefined,
        location: dto.location !== undefined ? dto.location.trim() : undefined,
        roomId: dto.roomId !== undefined ? dto.roomId || null : undefined,
        quantity: dto.quantity !== undefined ? dto.quantity : undefined,
        condition: dto.condition !== undefined ? dto.condition : undefined,
        purchasePrice:
          dto.purchasePrice !== undefined
            ? dto.purchasePrice != null
              ? new Prisma.Decimal(dto.purchasePrice)
              : null
            : undefined,
        purchaseDate:
          dto.purchaseDate !== undefined
            ? dto.purchaseDate
              ? new Date(dto.purchaseDate)
              : null
            : undefined,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl || null : undefined,
        note: dto.note !== undefined ? dto.note || null : undefined,
      },
      include: {
        room: {
          select: { id: true, roomNumber: true },
        },
      },
    });

    // Write AuditLog
    try {
      await this.prisma.auditLog.create({
        data: {
          action: AuditLogAction.update,
          entityType: 'ASSET',
          entityId: id,
          userId: landlordId,
          boardingHouseId,
          ipAddress: '127.0.0.1',
          oldValue: existing as unknown as Prisma.InputJsonValue,
          newValue: updated as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (auditErr) {
      this.logger.warn(`Failed to create AuditLog for asset ${id}:`, auditErr);
    }

    return this.mapToAssetDto(updated);
  }

  /**
   * UC-L-25: Delete an asset (hard delete per spec)
   */
  async deleteAsset(
    boardingHouseId: string,
    id: string,
    landlordId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Landlord ${landlordId} deleting asset ${id} in house ${boardingHouseId}`,
    );

    const existing = await this.prisma.asset.findFirst({
      where: { id, boardingHouseId },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy tài sản cần xóa.');
    }

    await this.prisma.asset.delete({
      where: { id },
    });

    // Write AuditLog
    try {
      await this.prisma.auditLog.create({
        data: {
          action: AuditLogAction.delete,
          entityType: 'ASSET',
          entityId: id,
          userId: landlordId,
          boardingHouseId,
          ipAddress: '127.0.0.1',
          oldValue: existing as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (auditErr) {
      this.logger.warn(`Failed to create AuditLog for asset deletion ${id}:`, auditErr);
    }

    return {
      success: true,
      message: 'Đã xóa tài sản thành công.',
    };
  }
}
