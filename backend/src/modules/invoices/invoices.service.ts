import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecordMeterDto } from './dto/record-meter.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoice(dto: RecordMeterDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
      include: {
        house: {
          include: { serviceConfigs: true },
        },
        room: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng thuê');
    }

    // Lookup service pricing configs
    const elecConfig = contract.house.serviceConfigs.find((s) => s.name.includes('Điện')) || { price: 3800 };
    const waterConfig = contract.house.serviceConfigs.find((s) => s.name.includes('Nước')) || { price: 18000 };
    const otherServices = contract.house.serviceConfigs.filter((s) => !s.name.includes('Điện') && !s.name.includes('Nước'));

    const elecUsage = Math.max(0, dto.electricityEnd - dto.electricityStart);
    const waterUsage = Math.max(0, dto.waterEnd - dto.waterStart);

    const electricityAmount = elecUsage * Number(elecConfig.price);
    const waterAmount = waterUsage * Number(waterConfig.price);
    const roomAmount = Number(contract.rentalPrice);

    let serviceAmount = 0;
    otherServices.forEach((s) => {
      serviceAmount += Number(s.price);
    });

    const totalAmount = roomAmount + electricityAmount + waterAmount + serviceAmount;
    const invoiceCode = `INV-${dto.year}-${String(dto.month).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    return this.prisma.invoice.create({
      data: {
        invoiceCode,
        contractId: contract.id,
        houseId: contract.houseId,
        roomId: contract.roomId,
        month: dto.month,
        year: dto.year,
        electricityStart: dto.electricityStart,
        electricityEnd: dto.electricityEnd,
        waterStart: dto.waterStart,
        waterEnd: dto.waterEnd,
        roomAmount,
        electricityAmount,
        waterAmount,
        serviceAmount,
        totalAmount,
        status: 'UNPAID',
        dueDate,
      },
      include: {
        contract: {
          include: { tenant: true },
        },
        room: true,
      },
    });
  }

  async findAllByHouse(houseId: string) {
    return this.prisma.invoice.findMany({
      where: { houseId },
      include: {
        contract: {
          include: { tenant: true },
        },
        room: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        contract: {
          include: { tenant: true, landlord: true },
        },
        house: true,
        room: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    return invoice;
  }
}
