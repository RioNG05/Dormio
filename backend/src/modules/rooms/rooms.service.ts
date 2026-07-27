import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        houseId: dto.houseId,
        code: dto.code,
        title: dto.title,
        floor: dto.floor || 1,
        price: dto.price,
        depositAmount: dto.depositAmount || dto.price,
        areaSqm: dto.areaSqm,
        maxOccupants: dto.maxOccupants || 2,
        status: dto.status || 'AVAILABLE',
        facilities: dto.facilities || [],
        images: dto.images || [],
      },
    });
  }

  async findAllByHouse(houseId: string) {
    return this.prisma.room.findMany({
      where: { houseId },
      include: {
        assets: true,
        contracts: {
          where: { status: 'ACTIVE' },
          include: { tenant: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        house: true,
        assets: true,
        contracts: true,
        invoices: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy thông tin phòng trọ');
    }

    return room;
  }

  async update(id: string, dto: Partial<CreateRoomDto>) {
    await this.findOne(id);
    return this.prisma.room.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.room.delete({
      where: { id },
    });
  }
}
