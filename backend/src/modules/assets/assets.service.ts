import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { Prisma, AssetCondition, AuditLogAction, ContractStatus } from '@prisma'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateAssetDto } from './dto/create-asset.dto'
import { UpdateAssetDto } from './dto/update-asset.dto'
import { QueryAssetsDto } from './dto/query-assets.dto'
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto'
import {
  AssetItemDto,
  AssetsListResponseDto,
  AssetsSummaryDto,
  AssetTenantDto,
  MaintenanceLogItemDto,
  MaintenanceLogsListResponseDto,
} from './dto/asset-response.dto'

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a readable code for tracking (e.g. TS-A1B2)
   */
  private generateAssetCode(id: string): string {
    const suffix = id.replace(/-/g, '').slice(-4).toUpperCase()
    return `TS-${suffix}`
  }

  /**
   * Maps Prisma Asset entity to AssetItemDto
   */
  private mapToAssetDto(
    asset: {
      id: string
      boardingHouseId: string
      roomId: string | null
      name: string
      category: string | null
      location: string
      quantity: number
      condition: AssetCondition
      purchasePrice: Prisma.Decimal | null
      purchaseDate: Date | null
      imageUrl: string | null
      note: string | null
      depreciationYears?: number | null
      modelCode?: string | null
      serialNumber?: string | null
      warrantyPeriod?: string | null
      supplier?: string | null
      createdAt: Date
      updatedAt: Date
      room?: { id: string; roomNumber: string } | null
    },
    tenant?: AssetTenantDto | null,
  ): AssetItemDto {
    const roomName = asset.room ? `Room ${asset.room.roomNumber}` : 'Common Area / Unassigned'

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
      depreciationYears: asset.depreciationYears ?? null,
      modelCode: asset.modelCode ?? null,
      serialNumber: asset.serialNumber ?? null,
      warrantyPeriod: asset.warrantyPeriod ?? null,
      supplier: asset.supplier ?? null,
      tenant: tenant ?? null,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      boardingHouseId: asset.boardingHouseId,
    }
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
    )

    // Validate room ownership if roomId provided
    if (dto.roomId) {
      const room = await this.prisma.room.findFirst({
        where: { id: dto.roomId, boardingHouseId },
      })
      if (!room) {
        throw new BadRequestException('The selected room does not belong to this boarding house.')
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
        purchasePrice: dto.purchasePrice != null ? new Prisma.Decimal(dto.purchasePrice) : null,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        imageUrl: dto.imageUrl || null,
        note: dto.note || null,
        depreciationYears: dto.depreciationYears ?? 5,
        modelCode: dto.modelCode?.trim() || null,
        serialNumber: dto.serialNumber?.trim() || null,
        warrantyPeriod: dto.warrantyPeriod?.trim() || null,
        supplier: dto.supplier?.trim() || null,
      },
      include: {
        room: {
          select: { id: true, roomNumber: true },
        },
      },
    })

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
          newValue: asset,
        },
      })
    } catch (auditErr) {
      this.logger.warn(`Failed to create AuditLog for asset ${asset.id}:`, auditErr)
    }

    return this.mapToAssetDto(asset)
  }

  /**
   * UC-L-25: List assets with filters & summary
   */
  async getAssets(boardingHouseId: string, query: QueryAssetsDto): Promise<AssetsListResponseDto> {
    const {
      search,
      category,
      condition,
      roomId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query

    const skip = (page - 1) * limit

    const where: Prisma.AssetWhereInput = {
      boardingHouseId,
    }

    if (search && search.trim()) {
      const keyword = search.trim()
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { location: { contains: keyword, mode: 'insensitive' } },
        { category: { contains: keyword, mode: 'insensitive' } },
      ]
    }

    if (category && category.trim()) {
      where.category = { equals: category.trim(), mode: 'insensitive' }
    }

    if (condition) {
      where.condition = condition
    }

    if (roomId !== undefined) {
      if (roomId === 'null' || roomId === '') {
        where.roomId = null
      } else {
        where.roomId = roomId
      }
    }

    // Determine orderBy
    const orderBy: Prisma.AssetOrderByWithRelationInput = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'purchasePrice') {
      orderBy.purchasePrice = sortOrder
    } else if (sortBy === 'condition') {
      orderBy.condition = sortOrder
    } else {
      orderBy.createdAt = sortOrder
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
    ])

    const totalPages = Math.ceil(total / limit) || 1

    // Calculate property-level summary
    const summary: AssetsSummaryDto = {
      totalItems: allAssets.length,
      totalQuantity: allAssets.reduce((sum, a) => sum + a.quantity, 0),
      totalValue: allAssets.reduce((sum, a) => sum + Number(a.purchasePrice ?? 0) * a.quantity, 0),
      goodConditionCount: allAssets.filter(
        a => a.condition === AssetCondition.new || a.condition === AssetCondition.good,
      ).length,
      needsRepairCount: allAssets.filter(
        a => a.condition === AssetCondition.damaged || a.condition === AssetCondition.under_repair,
      ).length,
    }

    return {
      success: true,
      data: items.map(item => this.mapToAssetDto(item)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      summary,
    }
  }

  /**
   * UC-L-25: Get asset details by ID (including room tenant resolution)
   */
  async getAssetDetail(boardingHouseId: string, id: string): Promise<AssetItemDto> {
    const asset = await this.prisma.asset.findFirst({
      where: { id, boardingHouseId },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            contracts: {
              where: { status: ContractStatus.active },
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                startDate: true,
                endDate: true,
                tenantContracts: {
                                    take: 1,
                  select: {
                    tenant: {
                      select: {
                        id: true,
                        username: true,
                        phoneNumber: true,
                        email: true,
                        avatarUrl: true,
                        userIdentification: {
                          select: { fullName: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!asset) {
      throw new NotFoundException('Asset not found.')
    }

    let tenantDto: AssetTenantDto | null = null
    const activeContract = asset.room?.contracts?.[0]
    const primaryTenantContract = activeContract?.tenantContracts?.[0]
    if (primaryTenantContract?.tenant && activeContract) {
      const t = primaryTenantContract.tenant
      tenantDto = {
        id: t.id,
        name: t.userIdentification?.fullName || t.username || 'Khách thuê',
        phone: t.phoneNumber || null,
        email: t.email || null,
        avatarUrl: t.avatarUrl || null,
        contractId: activeContract.id,
        startDate: activeContract.startDate ? activeContract.startDate.toISOString() : null,
        endDate: activeContract.endDate ? activeContract.endDate.toISOString() : null,
      }
    }

    return this.mapToAssetDto(asset, tenantDto)
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
    this.logger.log(`Landlord ${landlordId} updating asset ${id} in house ${boardingHouseId}`)

    const existing = await this.prisma.asset.findFirst({
      where: { id, boardingHouseId },
    })

    if (!existing) {
      throw new NotFoundException('Asset to update not found.')
    }

    // If roomId changed and is not null, validate it
    if (dto.roomId !== undefined && dto.roomId !== null) {
      const room = await this.prisma.room.findFirst({
        where: { id: dto.roomId, boardingHouseId },
      })
      if (!room) {
        throw new BadRequestException('The selected room does not belong to this boarding house.')
      }
    }

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        category: dto.category !== undefined ? dto.category?.trim() || null : undefined,
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
        depreciationYears: dto.depreciationYears !== undefined ? dto.depreciationYears : undefined,
        modelCode: dto.modelCode !== undefined ? dto.modelCode?.trim() || null : undefined,
        serialNumber: dto.serialNumber !== undefined ? dto.serialNumber?.trim() || null : undefined,
        warrantyPeriod:
          dto.warrantyPeriod !== undefined ? dto.warrantyPeriod?.trim() || null : undefined,
        supplier: dto.supplier !== undefined ? dto.supplier?.trim() || null : undefined,
      },
      include: {
        room: {
          select: { id: true, roomNumber: true },
        },
      },
    })

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
          oldValue: existing,
          newValue: updated,
        },
      })
    } catch (auditErr) {
      this.logger.warn(`Failed to create AuditLog for asset ${id}:`, auditErr)
    }

    return this.mapToAssetDto(updated)
  }

  /**
   * UC-L-25: Delete an asset (hard delete per spec)
   */
  async deleteAsset(
    boardingHouseId: string,
    id: string,
    landlordId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Landlord ${landlordId} deleting asset ${id} in house ${boardingHouseId}`)

    const existing = await this.prisma.asset.findFirst({
      where: { id, boardingHouseId },
    })

    if (!existing) {
      throw new NotFoundException('Asset to delete not found.')
    }

    await this.prisma.asset.delete({
      where: { id },
    })

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
          oldValue: existing,
        },
      })
    } catch (auditErr) {
      this.logger.warn(`Failed to create AuditLog for asset deletion ${id}:`, auditErr)
    }

    return {
      success: true,
      message: 'Asset deleted successfully.',
    }
  }

  /**
   * UC-L-25: Retrieve maintenance logs for an asset
   */
  async getMaintenanceLogs(
    boardingHouseId: string,
    assetId: string,
  ): Promise<MaintenanceLogsListResponseDto> {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, boardingHouseId },
      select: { id: true },
    })

    if (!asset) {
      throw new NotFoundException('Asset not found.')
    }

    const logs = await this.prisma.assetMaintenanceLog.findMany({
      where: { assetId, boardingHouseId },
      orderBy: { performedAt: 'desc' },
    })

    const totalCost = logs.reduce((sum, log) => sum + Number(log.cost), 0)

    return {
      success: true,
      data: logs.map(l => ({
        id: l.id,
        assetId: l.assetId,
        boardingHouseId: l.boardingHouseId,
        type: l.type,
        description: l.description,
        cost: Number(l.cost),
        performer: l.performer,
        performedAt: l.performedAt.toISOString(),
        createdAt: l.createdAt.toISOString(),
      })),
      totalCost,
    }
  }

  /**
   * UC-L-25: Create a new maintenance / repair log for an asset
   */
  async createMaintenanceLog(
    boardingHouseId: string,
    assetId: string,
    dto: CreateMaintenanceLogDto,
    landlordId: string,
  ): Promise<MaintenanceLogItemDto> {
    this.logger.log(
      `Landlord ${landlordId} creating maintenance log for asset ${assetId} in house ${boardingHouseId}`,
    )

    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, boardingHouseId },
    })

    if (!asset) {
      throw new NotFoundException('Asset not found.')
    }

    const performedAt = dto.performedAt ? new Date(dto.performedAt) : new Date()

    const log = await this.prisma.$transaction(async tx => {
      const createdLog = await tx.assetMaintenanceLog.create({
        data: {
          assetId,
          boardingHouseId,
          type: dto.type.trim(),
          description: dto.description.trim(),
          cost: dto.cost != null ? new Prisma.Decimal(dto.cost) : new Prisma.Decimal(0),
          performer: dto.performer?.trim() || null,
          performedAt,
        },
      })

      if (dto.setCondition && dto.setCondition !== asset.condition) {
        await tx.asset.update({
          where: { id: assetId },
          data: { condition: dto.setCondition },
        })
      }

      await tx.auditLog.create({
        data: {
          action: AuditLogAction.create,
          entityType: 'ASSET_MAINTENANCE_LOG',
          entityId: createdLog.id,
          userId: landlordId,
          boardingHouseId,
          ipAddress: '127.0.0.1',
          newValue: createdLog,
        },
      })

      return createdLog
    })

    return {
      id: log.id,
      assetId: log.assetId,
      boardingHouseId: log.boardingHouseId,
      type: log.type,
      description: log.description,
      cost: Number(log.cost),
      performer: log.performer,
      performedAt: log.performedAt.toISOString(),
      createdAt: log.createdAt.toISOString(),
    }
  }

  /**
   * UC-L-25: Delete a maintenance log
   */
  async deleteMaintenanceLog(
    boardingHouseId: string,
    assetId: string,
    logId: string,
    landlordId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Landlord ${landlordId} deleting maintenance log ${logId} for asset ${assetId} in house ${boardingHouseId}`,
    )

    const existing = await this.prisma.assetMaintenanceLog.findFirst({
      where: { id: logId, assetId, boardingHouseId },
    })

    if (!existing) {
      throw new NotFoundException('Maintenance log not found.')
    }

    await this.prisma.$transaction(async tx => {
      await tx.assetMaintenanceLog.delete({
        where: { id: logId },
      })

      await tx.auditLog.create({
        data: {
          action: AuditLogAction.delete,
          entityType: 'ASSET_MAINTENANCE_LOG',
          entityId: logId,
          userId: landlordId,
          boardingHouseId,
          ipAddress: '127.0.0.1',
          oldValue: existing,
        },
      })
    })

    return {
      success: true,
      message: 'Maintenance log deleted successfully.',
    }
  }
}
