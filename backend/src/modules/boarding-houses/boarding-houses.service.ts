import { Injectable, Logger } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBoardingHouseDto } from './dto/create-boarding-house.dto';
import {
  BoardingHouseListResponseDto,
  BoardingHouseResponseDto,
  BoardingHouseRoomTypeResponseDto,
  BoardingHouseServiceResponseDto,
} from './dto/boarding-house-response.dto';

@Injectable()
export class BoardingHousesService {
  private readonly logger = new Logger(BoardingHousesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createInitialProfile(
    userId: string,
    dto: CreateBoardingHouseDto,
  ): Promise<BoardingHouseResponseDto> {
    this.logger.log(`Creating initial property profile for user ${userId}`);

    const boardingHouse = await this.prisma.$transaction(async (tx) => {
      const createdBoardingHouse = await tx.boardingHouse.create({
        data: {
          ownerId: userId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          country: dto.country.trim(),
          province: dto.province.trim(),
          city: dto.city.trim(),
          district: dto.district.trim(),
          ward: dto.ward.trim(),
          street: dto.street.trim(),
          houseNumber: dto.houseNumber.trim(),
          totalFloor: dto.totalFloor,
          builtAt: new Date(dto.builtAt),
          status: 'active',
          deletedAt: new Date('2099-12-31T00:00:00.000Z'),
          services: {
            create: (dto.services ?? []).map((service) => ({
              name: service.name.trim(),
              unit: service.unit.trim(),
              price: new Prisma.Decimal(service.price),
              isMetered: service.isMetered ?? false,
            })),
          },
          roomTypes: {
            create: (dto.roomTypes ?? []).map((roomType) => ({
              name: roomType.name.trim(),
              description: roomType.description?.trim() || null,
            })),
          },
        },
        include: {
          services: true,
          roomTypes: true,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: UserRole.landlord },
      });

      return createdBoardingHouse;
    });

    return {
      id: boardingHouse.id,
      name: boardingHouse.name,
      description: boardingHouse.description,
      country: boardingHouse.country,
      province: boardingHouse.province,
      city: boardingHouse.city,
      ward: boardingHouse.ward,
      district: boardingHouse.district,
      street: boardingHouse.street,
      houseNumber: boardingHouse.houseNumber,
      totalFloor: boardingHouse.totalFloor,
      builtAt: boardingHouse.builtAt.toISOString(),
      status: boardingHouse.status,
      services: boardingHouse.services.map(
        (service): BoardingHouseServiceResponseDto => ({
          id: service.id,
          name: service.name,
          unit: service.unit,
          price: this.formatMoney(service.price),
          isMetered: service.isMetered,
        }),
      ),
      roomTypes: boardingHouse.roomTypes.map(
        (roomType): BoardingHouseRoomTypeResponseDto => ({
          id: roomType.id,
          name: roomType.name,
          description: roomType.description,
        }),
      ),
    };
  }

  /**
   * List all boarding houses owned by a landlord (UC-L-01 context)
   */
  async listMyProperties(userId: string): Promise<BoardingHouseListResponseDto> {
    this.logger.log(`Listing all boarding houses for user ${userId}`);

    const houses = await this.prisma.boardingHouse.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      include: {
        services: true,
        roomTypes: true,
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    return {
      success: true,
      data: houses.map((house) => ({
        id: house.id,
        name: house.name,
        description: house.description,
        country: house.country,
        province: house.province,
        city: house.city,
        ward: house.ward,
        district: house.district,
        street: house.street,
        houseNumber: house.houseNumber,
        totalFloor: house.totalFloor,
        builtAt: house.builtAt.toISOString(),
        status: house.status,
        totalRooms: house._count.rooms,
        services: house.services.map(
          (service): BoardingHouseServiceResponseDto => ({
            id: service.id,
            name: service.name,
            unit: service.unit,
            price: this.formatMoney(service.price),
            isMetered: service.isMetered,
          }),
        ),
        roomTypes: house.roomTypes.map(
          (roomType): BoardingHouseRoomTypeResponseDto => ({
            id: roomType.id,
            name: roomType.name,
            description: roomType.description,
          }),
        ),
      })),
    };
  }

  private formatMoney(value: unknown): string {
    const [integerPart, decimalPart = ''] = String(value).split('.');
    return `${integerPart}.${decimalPart.padEnd(2, '0').slice(0, 2)}`;
  }
}
