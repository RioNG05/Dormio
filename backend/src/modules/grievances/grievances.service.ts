import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import {
  GrievanceDto,
  GrievanceListResponseDto,
  GrievanceDetailResponseDto,
  GrievanceImageDto,
} from './dto/grievance-response.dto';

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
}
