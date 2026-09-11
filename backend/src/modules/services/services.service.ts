import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ServiceStatus } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import {
  ServiceItemDto,
  ServiceRoomsResponseDto,
  ServicesListResponseDto,
  ServicesSummaryDto,
} from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * UC-L-18: Get all services for a boarding house with summary metrics and pagination
   */
  async getServices(
    boardingHouseId: string,
    query: QueryServicesDto,
  ): Promise<ServicesListResponseDto> {
    this.logger.log(
      `Fetching services for boarding house ${boardingHouseId} with query: ${JSON.stringify(query)}`,
    );

    const {
      search,
      isMetered,
      status,
      autoApplied,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    // Base filter scoped to boardingHouseId
    const where: Prisma.ServiceWhereInput = {
      boardingHouseId,
    };

    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { unit: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (typeof isMetered === 'boolean') {
      where.isMetered = isMetered;
    }

    if (status) {
      where.status = status;
    }

    if (typeof autoApplied === 'boolean') {
      where.autoApplied = autoApplied;
    }

    // 1. Calculate unpaginated summary metrics across all services of this property
    const allServices = await this.prisma.service.findMany({
      where: { boardingHouseId },
      select: {
        id: true,
        unit: true,
        isMetered: true,
        status: true,
      },
    });

    const summary: ServicesSummaryDto = {
      totalServices: allServices.length,
      meteredCount: allServices.filter((s) => s.isMetered).length,
      roomFixedCount: allServices.filter(
        (s) =>
          !s.isMetered &&
          (s.unit.toLowerCase().includes('phòng') ||
            s.unit.toLowerCase().includes('phong')),
      ).length,
      otherCount: allServices.filter(
        (s) =>
          !s.isMetered &&
          !s.unit.toLowerCase().includes('phòng') &&
          !s.unit.toLowerCase().includes('phong'),
      ).length,
      activeCount: allServices.filter((s) => s.status === ServiceStatus.active)
        .length,
      inactiveCount: allServices.filter(
        (s) => s.status === ServiceStatus.inactive,
      ).length,
    };

    // 2. Count matching filtered records for pagination
    const total = await this.prisma.service.count({ where });

    // 3. Query paginated records
    const skip = (page - 1) * limit;
    const services = await this.prisma.service.findMany({
      where,
      include: {
        _count: {
          select: { roomServices: true },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const items = services.map((s) => this.mapToItemDto(s, s._count.roomServices));

    return {
      success: true,
      data: items,
      summary,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * UC-L-18: Create a custom service
   */
  async createService(
    landlordId: string,
    boardingHouseId: string,
    dto: CreateServiceDto,
  ): Promise<ServiceItemDto> {
    this.logger.log(
      `Creating service '${dto.name}' for boarding house ${boardingHouseId} by landlord ${landlordId}`,
    );

    // Validate roomIds if provided
    if (dto.roomIds && dto.roomIds.length > 0) {
      const validRooms = await this.prisma.room.findMany({
        where: {
          id: { in: dto.roomIds },
          boardingHouseId,
        },
        select: { id: true },
      });

      if (validRooms.length !== dto.roomIds.length) {
        throw new NotFoundException(
          'Một hoặc nhiều phòng được chọn không thuộc tòa nhà này',
        );
      }
    }

    const priceDecimal = new Prisma.Decimal(dto.price);

    const result = await this.prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          boardingHouseId,
          name: dto.name.trim(),
          price: priceDecimal,
          unit: dto.unit.trim(),
          isMetered: dto.isMetered ?? false,
          autoApplied: dto.autoApplied ?? true,
          status: dto.status ?? ServiceStatus.active,
        },
      });

      let appliedRoomsCount = 0;

      if (dto.roomIds && dto.roomIds.length > 0) {
        await tx.roomService.createMany({
          data: dto.roomIds.map((roomId) => ({
            roomId,
            serviceId: service.id,
          })),
        });
        appliedRoomsCount = dto.roomIds.length;
      }

      return { service, appliedRoomsCount };
    });

    return this.mapToItemDto(result.service, result.appliedRoomsCount);
  }

  /**
   * UC-L-18: Get single service details
   */
  async getServiceDetail(
    boardingHouseId: string,
    serviceId: string,
  ): Promise<ServiceItemDto> {
    this.logger.log(`Fetching service ${serviceId} for house ${boardingHouseId}`);

    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        boardingHouseId,
      },
      include: {
        _count: {
          select: { roomServices: true },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ hoặc dịch vụ không thuộc tòa nhà này');
    }

    return this.mapToItemDto(service, service._count.roomServices);
  }

  /**
   * UC-L-18: Update service details
   */
  async updateService(
    boardingHouseId: string,
    serviceId: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceItemDto> {
    this.logger.log(`Updating service ${serviceId} for house ${boardingHouseId}`);

    const existingService = await this.prisma.service.findFirst({
      where: { id: serviceId, boardingHouseId },
      include: {
        _count: {
          select: { roomServices: true },
        },
      },
    });

    if (!existingService) {
      throw new NotFoundException('Không tìm thấy dịch vụ hoặc dịch vụ không thuộc tòa nhà này');
    }

    // Validate roomIds if provided
    if (dto.roomIds !== undefined) {
      if (dto.roomIds.length > 0) {
        const validRooms = await this.prisma.room.findMany({
          where: {
            id: { in: dto.roomIds },
            boardingHouseId,
          },
          select: { id: true },
        });

        if (validRooms.length !== dto.roomIds.length) {
          throw new NotFoundException('Một hoặc nhiều phòng được chọn không thuộc tòa nhà này');
        }
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Sync room services if roomIds explicitly provided
      if (dto.roomIds !== undefined) {
        await tx.roomService.deleteMany({
          where: { serviceId },
        });
        if (dto.roomIds.length > 0) {
          await tx.roomService.createMany({
            data: dto.roomIds.map((roomId) => ({
              roomId,
              serviceId,
            })),
          });
        }
      }

      const updateData: Prisma.ServiceUpdateInput = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.price !== undefined) updateData.price = new Prisma.Decimal(dto.price);
      if (dto.unit !== undefined) updateData.unit = dto.unit.trim();
      if (dto.isMetered !== undefined) updateData.isMetered = dto.isMetered;
      if (dto.autoApplied !== undefined) updateData.autoApplied = dto.autoApplied;
      if (dto.status !== undefined) updateData.status = dto.status;

      const service = await tx.service.update({
        where: { id: serviceId },
        data: updateData,
        include: {
          _count: {
            select: { roomServices: true },
          },
        },
      });

      return service;
    });

    return this.mapToItemDto(updated, updated._count.roomServices);
  }

  /**
   * UC-L-18: Delete service
   */
  async deleteService(
    boardingHouseId: string,
    serviceId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting service ${serviceId} for house ${boardingHouseId}`);

    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, boardingHouseId },
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ hoặc dịch vụ không thuộc tòa nhà này');
    }

    // Check if referenced by meter readings or invoices
    const [readingCount, invoiceItemCount] = await Promise.all([
      this.prisma.meterReading.count({ where: { serviceId } }),
      this.prisma.invoiceItem.count({ where: { serviceId } }),
    ]);

    if (readingCount > 0 || invoiceItemCount > 0) {
      throw new BadRequestException(
        'Không thể xóa dịch vụ đã phát sinh chỉ số đồng hồ hoặc hóa đơn thanh toán. Vui lòng chuyển trạng thái sang Tạm dừng.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Clean up room services first
      await tx.roomService.deleteMany({
        where: { serviceId },
      });

      await tx.service.delete({
        where: { id: serviceId },
      });
    });

    return {
      success: true,
      message: 'Đã xóa dịch vụ thành công',
    };
  }

  /**
   * UC-L-18: Get all rooms assigned to a specific service
   */
  async getServiceRooms(
    boardingHouseId: string,
    serviceId: string,
  ): Promise<ServiceRoomsResponseDto> {
    this.logger.log(`Fetching rooms assigned to service ${serviceId}`);

    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, boardingHouseId },
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ hoặc dịch vụ không thuộc tòa nhà này');
    }

    const roomServices = await this.prisma.roomService.findMany({
      where: { serviceId },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            status: true,
          },
        },
      },
      orderBy: [
        { room: { floor: 'asc' } },
        { room: { roomNumber: 'asc' } },
      ],
    });

    const rooms = roomServices.map((rs) => ({
      id: rs.room.id,
      roomNumber: rs.room.roomNumber,
      floor: rs.room.floor,
      status: String(rs.room.status),
    }));

    return {
      success: true,
      data: {
        serviceId: service.id,
        serviceName: service.name,
        appliedRoomsCount: rooms.length,
        rooms,
      },
    };
  }

  /**
   * Helper to map Prisma Service entity to ServiceItemDto
   */
  private mapToItemDto(
    service: {
      id: string;
      boardingHouseId: string;
      name: string;
      price: Prisma.Decimal;
      unit: string;
      isMetered: boolean;
      autoApplied: boolean;
      status: ServiceStatus;
      createdAt: Date;
      updatedAt?: Date | null;
    },
    appliedRoomsCount: number,
  ): ServiceItemDto {
    const priceDecimal = new Prisma.Decimal(service.price);
    return {
      id: service.id,
      boardingHouseId: service.boardingHouseId,
      name: service.name,
      price: priceDecimal.toString(),
      numericPrice: priceDecimal.toNumber(),
      unit: service.unit,
      isMetered: service.isMetered,
      autoApplied: service.autoApplied,
      status: service.status,
      appliedRoomsCount,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt ? service.updatedAt.toISOString() : null,
    };
  }
}
