import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateComplaintDto, UpdateComplaintStatusDto } from './dto/create-complaint.dto';

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateComplaintDto) {
    return this.prisma.complaint.create({
      data: {
        houseId: dto.houseId,
        roomId: dto.roomId,
        tenantId: dto.tenantId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
        status: 'PENDING',
        images: dto.images || [],
      },
    });
  }

  async findAllByHouse(houseId: string) {
    return this.prisma.complaint.findMany({
      where: { houseId },
      include: {
        room: true,
        tenant: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.complaint.findMany({
      where: { tenantId },
      include: {
        house: true,
        room: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateComplaintStatusDto) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new NotFoundException('Không tìm thấy báo cáo sự cố');
    }

    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedAt: dto.status === 'RESOLVED' ? new Date() : null,
      },
    });
  }
}
