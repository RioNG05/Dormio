import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContractDto) {
    const contractCode = `HD-${Date.now().toString().slice(-6)}`;

    // Create contract and update room status to RENTED in transaction
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          contractCode,
          houseId: dto.houseId,
          roomId: dto.roomId,
          landlordId: dto.landlordId,
          tenantId: dto.tenantId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          rentalPrice: dto.rentalPrice,
          depositAmount: dto.depositAmount,
          status: 'ACTIVE',
          notes: dto.notes,
        },
      });

      await tx.room.update({
        where: { id: dto.roomId },
        data: { status: 'RENTED' },
      });

      return contract;
    });
  }

  async findAllByHouse(houseId: string) {
    return this.prisma.contract.findMany({
      where: { houseId },
      include: {
        room: true,
        tenant: true,
        landlord: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        house: true,
        room: true,
        tenant: true,
        invoices: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng');
    }

    return contract;
  }

  async terminate(id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: { id },
        data: { status: 'TERMINATED' },
      });

      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: 'AVAILABLE' },
      });

      return updatedContract;
    });
  }
}
