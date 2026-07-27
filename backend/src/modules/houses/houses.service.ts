import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHouseDto } from './dto/create-house.dto';

@Injectable()
export class HousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(landlordId: string, dto: CreateHouseDto) {
    return this.prisma.boardingHouse.create({
      data: {
        landlordId,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        district: dto.district,
        ward: dto.ward,
        totalFloors: dto.totalFloors || 1,
        description: dto.description,
        rules: dto.rules,
      },
    });
  }

  async findAllByLandlord(landlordId: string) {
    return this.prisma.boardingHouse.findMany({
      where: { landlordId },
      include: {
        rooms: true,
        serviceConfigs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const house = await this.prisma.boardingHouse.findUnique({
      where: { id },
      include: {
        rooms: true,
        serviceConfigs: true,
      },
    });

    if (!house) {
      throw new NotFoundException('Không tìm thấy nhà trọ');
    }

    return house;
  }

  async update(id: string, dto: Partial<CreateHouseDto>) {
    await this.findOne(id);

    return this.prisma.boardingHouse.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.boardingHouse.delete({
      where: { id },
    });
  }
}
