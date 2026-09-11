import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import {
  GrievanceDto,
  GrievanceListResponseDto,
  GrievanceDetailResponseDto,
  GrievanceImageDto,
} from './dto/grievance-response.dto';
import {
  AdminGrievanceQueryDto,
  AdminGrievanceListResponseDto,
  AdminGrievanceItemDto,
  ResolveGrievanceDto,
  RejectGrievanceDto,
  GrievanceStatusFilter,
  GrievancePriorityFilter,
} from './dto/admin-grievance.dto';
import { GrievenceStatus, GrievencePriority } from '@prisma';

@Injectable()
export class GrievancesService {
  private readonly logger = new Logger(GrievancesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to resolve active tenant contract
   */
  async resolveActiveTenantContract(tenantId: string) {
    const tenantContract = await this.prisma.tenantContract.findFirst({
      where: {
        tenantId,
        contract: {
          status: 'active',
        },
      },
      include: {
        contract: {
          include: {
            room: {
              include: {
                boardingHouse: true,
              },
            },
          },
        },
      },
    });

    if (!tenantContract || !tenantContract.contract) {
      throw new NotFoundException(
        'Không tìm thấy hợp đồng thuê phòng đang có hiệu lực của bạn.',
      );
    }

    return tenantContract.contract;
  }

  /**
   * Map raw Prisma Grievance model with relations to typed GrievanceDto
   */
  private mapToGrievanceDto(g: any): GrievanceDto {
    const images: GrievanceImageDto[] = (g.images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      createdAt: img.createdAt.toISOString(),
    }));

    return {
      id: g.id,
      title: g.title,
      description: g.description,
      priority: g.priority,
      status: g.status,
      boardingHouseName: g.boardingHouse?.name || 'Nhà trọ Dormio',
      roomNumber: g.room?.roomNumber || '-',
      resolutionNote: g.resolutionNote || null,
      resolvedAt: g.resolvedAt ? g.resolvedAt.toISOString() : null,
      resolvedByName: g.resolvedByUser?.username || null,
      images,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt ? g.updatedAt.toISOString() : g.createdAt.toISOString(),
    };
  }

  /**
   * UC-T-07: Submit a new grievance / complaint
   */
  async createGrievance(
    tenantId: string,
    dto: CreateGrievanceDto,
  ): Promise<GrievanceDetailResponseDto> {
    this.logger.log(`Tenant ${tenantId} creating grievance: "${dto.title}"`);
    const contract = await this.resolveActiveTenantContract(tenantId);

    const result = await this.prisma.$transaction(async (tx) => {
      const grievance = await tx.grievance.create({
        data: {
          tenantId,
          boardingHouseId: contract.room.boardingHouseId,
          roomId: contract.roomId,
          title: dto.title.trim(),
          description: dto.description.trim(),
          priority: dto.priority || 'medium',
          status: 'pending',
        },
      });

      if (dto.imageUrls && dto.imageUrls.length > 0) {
        await tx.grievanceImage.createMany({
          data: dto.imageUrls.map((url) => ({
            grievanceId: grievance.id,
            url,
          })),
        });
      }

      // AuditLog creation
      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'GRIEVANCE',
          entityId: grievance.id,
          boardingHouseId: contract.room.boardingHouseId,
          userId: tenantId,
          ipAddress: '127.0.0.1',
          newValue: {
            title: dto.title,
            priority: dto.priority || 'medium',
            imageCount: dto.imageUrls?.length || 0,
          },
        },
      });

      // Fetch full grievance with relations
      const fullGrievance = await tx.grievance.findUnique({
        where: { id: grievance.id },
        include: {
          boardingHouse: true,
          room: true,
          images: true,
          resolvedByUser: true,
        },
      });

      return fullGrievance;
    });

    this.logger.log(`Grievance ${result?.id} created successfully for tenant ${tenantId}`);

    return {
      success: true,
      data: this.mapToGrievanceDto(result),
    };
  }

  /**
   * UC-T-07: Get all grievances submitted by tenant
   */
  async getTenantGrievances(
    tenantId: string,
  ): Promise<GrievanceListResponseDto> {
    this.logger.log(`Fetching grievances history for tenant ${tenantId}`);

    const grievances = await this.prisma.grievance.findMany({
      where: {
        tenantId,
      },
      include: {
        boardingHouse: true,
        room: true,
        images: true,
        resolvedByUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: grievances.map((g) => this.mapToGrievanceDto(g)),
    };
  }

  /**
   * UC-T-07: Get single grievance detail
   */
  async getTenantGrievanceById(
    tenantId: string,
    id: string,
  ): Promise<GrievanceDetailResponseDto> {
    this.logger.log(`Fetching grievance detail ${id} for tenant ${tenantId}`);

    const grievance = await this.prisma.grievance.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        boardingHouse: true,
        room: true,
        images: true,
        resolvedByUser: true,
      },
    });

    if (!grievance) {
      throw new NotFoundException(
        'Không tìm thấy khiếu nại hoặc bạn không có quyền truy cập.',
      );
    }

    return {
      success: true,
      data: this.mapToGrievanceDto(grievance),
    };
  }

  /**
   * Map raw Prisma Grievance with relations to typed AdminGrievanceItemDto
   */
  private mapToAdminGrievanceDto(g: any): AdminGrievanceItemDto {
    const images: GrievanceImageDto[] = (g.images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      createdAt: img.createdAt.toISOString(),
    }));

    const tenantName =
      g.tenant?.userIdentification?.fullName ||
      g.tenant?.username ||
      'Khách thuê';

    const landlordName =
      g.boardingHouse?.owner?.userIdentification?.fullName ||
      g.boardingHouse?.owner?.username ||
      'Chủ nhà';

    return {
      id: g.id,
      title: g.title,
      description: g.description,
      priority: g.priority,
      status: g.status,
      tenantId: g.tenantId,
      tenantName,
      tenantPhone: g.tenant?.phoneNumber || '',
      tenantEmail: g.tenant?.email || '',
      boardingHouseId: g.boardingHouseId,
      boardingHouseName: g.boardingHouse?.name || 'Nhà trọ Dormio',
      roomId: g.roomId,
      roomNumber: g.room?.roomNumber || '-',
      landlordName,
      landlordPhone: g.boardingHouse?.owner?.phoneNumber || '',
      resolutionNote: g.resolutionNote || null,
      resolvedAt: g.resolvedAt ? g.resolvedAt.toISOString() : null,
      resolvedByName: g.resolvedByUser?.username || null,
      images,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt
        ? g.updatedAt.toISOString()
        : g.createdAt.toISOString(),
    };
  }

  /**
   * UC-A-04: Get admin grievances queue with filters & priority ordering
   * Queue rule: Grievance WHERE status='pending' ORDER BY priority desc, createdAt asc.
   */
  async getAdminGrievanceQueue(
    query: AdminGrievanceQueryDto,
  ): Promise<AdminGrievanceListResponseDto> {
    this.logger.log(
      `Admin fetching grievances queue: status=${query.status}, priority=${query.priority}, page=${query.page}`,
    );

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && query.status !== GrievanceStatusFilter.ALL) {
      where.status = query.status as GrievenceStatus;
    }

    if (query.priority && query.priority !== GrievancePriorityFilter.ALL) {
      where.priority = query.priority as GrievencePriority;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { tenant: { username: { contains: s, mode: 'insensitive' } } },
        { tenant: { phoneNumber: { contains: s } } },
        { boardingHouse: { name: { contains: s, mode: 'insensitive' } } },
        { room: { roomNumber: { contains: s } } },
      ];
    }

    // Determine ordering
    // Spec rule: for pending queue, order by priority desc, createdAt asc
    let orderBy: any = [{ updatedAt: 'desc' }, { createdAt: 'desc' }];
    if (query.status === GrievanceStatusFilter.PENDING || (!query.status && !where.status)) {
      orderBy = [{ priority: 'desc' }, { createdAt: 'asc' }];
    }

    const [items, total, pendingCount, inProgressCount, resolvedCount, rejectedCount, urgentCount] =
      await Promise.all([
        this.prisma.grievance.findMany({
          where,
          include: {
            tenant: {
              include: { userIdentification: true },
            },
            boardingHouse: {
              include: {
                owner: {
                  include: { userIdentification: true },
                },
              },
            },
            room: true,
            images: true,
            resolvedByUser: true,
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.grievance.count({ where }),
        this.prisma.grievance.count({ where: { status: 'pending' } }),
        this.prisma.grievance.count({ where: { status: 'in_progress' } }),
        this.prisma.grievance.count({ where: { status: 'resolved' } }),
        this.prisma.grievance.count({ where: { status: 'rejected' } }),
        this.prisma.grievance.count({
          where: {
            priority: 'high',
            status: { in: ['pending', 'in_progress'] },
          },
        }),
      ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      items: items.map((g) => this.mapToAdminGrievanceDto(g)),
      total,
      page,
      limit,
      totalPages,
      counts: {
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        rejected: rejectedCount,
        urgent: urgentCount,
      },
    };
  }

  /**
   * UC-A-04: Get single grievance detail for admin
   */
  async getAdminGrievanceById(id: string): Promise<AdminGrievanceItemDto> {
    this.logger.log(`Admin fetching grievance detail ${id}`);

    const grievance = await this.prisma.grievance.findUnique({
      where: { id },
      include: {
        tenant: {
          include: { userIdentification: true },
        },
        boardingHouse: {
          include: {
            owner: {
              include: { userIdentification: true },
            },
          },
        },
        room: true,
        images: true,
        resolvedByUser: true,
      },
    });

    if (!grievance) {
      throw new NotFoundException(`Grievance with ID "${id}" not found.`);
    }

    return this.mapToAdminGrievanceDto(grievance);
  }

  /**
   * UC-A-04: Mark grievance as in progress (investigation active)
   */
  async updateGrievanceStatusInProgress(
    adminId: string,
    id: string,
  ): Promise<AdminGrievanceItemDto> {
    this.logger.log(`Admin ${adminId} moving grievance ${id} to in_progress`);

    const existing = await this.prisma.grievance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Grievance with ID "${id}" not found.`);
    }

    if (existing.status === 'resolved' || existing.status === 'rejected') {
      throw new BadRequestException(
        'Cannot transition resolved or rejected grievance back to in-progress.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const g = await tx.grievance.update({
        where: { id },
        data: {
          status: 'in_progress',
        },
        include: {
          tenant: { include: { userIdentification: true } },
          boardingHouse: {
            include: { owner: { include: { userIdentification: true } } },
          },
          room: true,
          images: true,
          resolvedByUser: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'update',
          entityType: 'GRIEVANCE',
          entityId: id,
          userId: adminId,
          ipAddress: '127.0.0.1',
          oldValue: { status: existing.status },
          newValue: { status: 'in_progress' },
        },
      });

      return g;
    });

    return this.mapToAdminGrievanceDto(updated);
  }

  /**
   * UC-A-04: Resolve grievance with written resolution note
   */
  async resolveGrievance(
    adminId: string,
    id: string,
    dto: ResolveGrievanceDto,
  ): Promise<AdminGrievanceItemDto> {
    this.logger.log(`Admin ${adminId} resolving grievance ${id}`);

    const existing = await this.prisma.grievance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Grievance with ID "${id}" not found.`);
    }

    const resolutionNote = dto.resolutionNote.trim();

    const updated = await this.prisma.$transaction(async (tx) => {
      const g = await tx.grievance.update({
        where: { id },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: adminId,
          resolutionNote,
        },
        include: {
          tenant: { include: { userIdentification: true } },
          boardingHouse: {
            include: { owner: { include: { userIdentification: true } } },
          },
          room: true,
          images: true,
          resolvedByUser: true,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'update',
          entityType: 'GRIEVANCE',
          entityId: id,
          userId: adminId,
          ipAddress: '127.0.0.1',
          oldValue: { status: existing.status },
          newValue: {
            status: 'resolved',
            resolutionNote,
            escalateLockLandlord: dto.escalateLockLandlord || false,
          },
        },
      });

      // Dispatch notification to tenant
      await tx.notification.create({
        data: {
          receiverId: existing.tenantId,
          senderId: adminId,
          type: 'grievance_resolved',
          isRead: false,
          content: `Đơn khiếu nại "${existing.title}" của bạn đã được giải quyết: ${resolutionNote}`,
        },
      });

      return g;
    });

    return this.mapToAdminGrievanceDto(updated);
  }

  /**
   * UC-A-04: Reject grievance with written reason
   */
  async rejectGrievance(
    adminId: string,
    id: string,
    dto: RejectGrievanceDto,
  ): Promise<AdminGrievanceItemDto> {
    this.logger.log(`Admin ${adminId} rejecting grievance ${id}`);

    const existing = await this.prisma.grievance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Grievance with ID "${id}" not found.`);
    }

    const resolutionNote = dto.resolutionNote.trim();

    const updated = await this.prisma.$transaction(async (tx) => {
      const g = await tx.grievance.update({
        where: { id },
        data: {
          status: 'rejected',
          resolvedAt: new Date(),
          resolvedBy: adminId,
          resolutionNote,
        },
        include: {
          tenant: { include: { userIdentification: true } },
          boardingHouse: {
            include: { owner: { include: { userIdentification: true } } },
          },
          room: true,
          images: true,
          resolvedByUser: true,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'update',
          entityType: 'GRIEVANCE',
          entityId: id,
          userId: adminId,
          ipAddress: '127.0.0.1',
          oldValue: { status: existing.status },
          newValue: { status: 'rejected', resolutionNote },
        },
      });

      // Dispatch notification to tenant
      await tx.notification.create({
        data: {
          receiverId: existing.tenantId,
          senderId: adminId,
          type: 'grievance_rejected',
          isRead: false,
          content: `Đơn khiếu nại "${existing.title}" của bạn đã bị từ chối: ${resolutionNote}`,
        },
      });

      return g;
    });

    return this.mapToAdminGrievanceDto(updated);
  }
}
