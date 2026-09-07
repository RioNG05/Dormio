import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoomStatus, SubscriptionPackage, SubscriptionStatus } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BulkGenerateRoomsDto } from './dto/bulk-generate-rooms.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomQueryDto } from './dto/room-query.dto';
import {
  BulkGenerateRoomsResponseDto,
  RoomListResponseDto,
  RoomMetadataResponseDto,
  RoomResponseDto,
} from './dto/room-response.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

interface PlannedRoom {
  floor: number;
  roomNumber: string;
}

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * UC-L-02: Bulk generate rooms for a boarding house with subscription cap check
   */
  async bulkGenerateRooms(
    landlordId: string,
    boardingHouseId: string,
    dto: BulkGenerateRoomsDto,
  ): Promise<BulkGenerateRoomsResponseDto> {
    this.logger.log(
      `Bulk generating rooms for boarding house ${boardingHouseId} by landlord ${landlordId}`,
    );

    // 1. Verify RoomType exists and belongs to this property
    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, boardingHouseId },
    });
    if (!roomType) {
      throw new NotFoundException(
        `RoomType with ID ${dto.roomTypeId} was not found for this property`,
      );
    }

    // 2. Verify Services belong to this property if supplied
    const serviceIds = dto.serviceIds ?? [];
    if (serviceIds.length > 0) {
      const validServices = await this.prisma.service.findMany({
        where: { id: { in: serviceIds }, boardingHouseId },
        select: { id: true },
      });
      if (validServices.length !== serviceIds.length) {
        throw new BadRequestException(
          'One or more selected serviceIds are invalid or do not belong to this property',
        );
      }
    }

    // 3. Check Subscription Plan Room Limit (UC-L-02 Step 2)
    const maxRoom = await this.resolveMaxRoomLimit(landlordId);
    const currentRoomCount = await this.prisma.room.count({
      where: { boardingHouseId },
    });

    const totalToGenerate = dto.floorCount * dto.roomsPerFloor;
    if (currentRoomCount + totalToGenerate > maxRoom) {
      throw new BadRequestException(
        `Cannot generate ${totalToGenerate} rooms. Your active subscription allows a maximum of ${maxRoom} rooms for this property (currently ${currentRoomCount}/${maxRoom}). Please upgrade your plan.`,
      );
    }

    // 4. Generate room numbers according to template
    const plannedRooms: PlannedRoom[] = [];
    const generatedNumberSet = new Set<string>();

    for (let floor = 1; floor <= dto.floorCount; floor++) {
      for (let index = 1; index <= dto.roomsPerFloor; index++) {
        const roomNumber = this.renderRoomNumber(dto.nameFormat, floor, index);

        if (generatedNumberSet.has(roomNumber)) {
          throw new BadRequestException(
            `The nameFormat template produces duplicate room number '${roomNumber}' in the current batch. Please adjust the template.`,
          );
        }

        generatedNumberSet.add(roomNumber);
        plannedRooms.push({ floor, roomNumber });
      }
    }

    // 5. Edge case: check collision with existing rooms in this boarding house
    const existingCollisions = await this.prisma.room.findMany({
      where: {
        boardingHouseId,
        roomNumber: { in: Array.from(generatedNumberSet) },
      },
      select: { roomNumber: true },
    });

    if (existingCollisions.length > 0) {
      const collisionList = existingCollisions.map((r) => r.roomNumber).join(', ');
      throw new ConflictException(
        `Room number(s) already exist in this property: ${collisionList}`,
      );
    }

    type CreatedRoomWithRelations = Prisma.RoomGetPayload<{
      include: {
        roomType: true;
        roomServices: {
          include: {
            service: true;
          };
        };
      };
    }>;

    // 6. Bulk insert in a single transaction
    const createdRooms = await this.prisma.$transaction(async (tx) => {
      const rooms: CreatedRoomWithRelations[] = [];
      for (const planned of plannedRooms) {
        const room = await tx.room.create({
          data: {
            boardingHouseId,
            roomNumber: planned.roomNumber,
            floor: planned.floor,
            area: dto.area !== undefined ? new Prisma.Decimal(dto.area) : null,
            maxOccupants: dto.maxOccupants ?? null,
            roomTypeId: dto.roomTypeId,
            status: RoomStatus.available,
            roomServices: {
              create: serviceIds.map((serviceId) => ({
                serviceId,
              })),
            },
          },
          include: {
            roomType: true,
            roomServices: {
              include: {
                service: true,
              },
            },
          },
        });
        rooms.push(room);
      }
      return rooms;
    });

    return {
      success: true,
      count: createdRooms.length,
      data: createdRooms.map((room) => this.mapRoomToDto(room)),
    };
  }

  /**
   * Get metadata for room generation (room types, services, plan limits)
   */
  async getRoomMetadata(
    landlordId: string,
    boardingHouseId: string,
  ): Promise<RoomMetadataResponseDto> {
    this.logger.log(`Fetching room metadata for boarding house ${boardingHouseId}`);

    const [roomTypes, services, maxRoom, currentRoomCount] = await Promise.all([
      this.prisma.roomType.findMany({
        where: { boardingHouseId },
        orderBy: { name: 'asc' },
      }),
      this.prisma.service.findMany({
        where: { boardingHouseId },
        orderBy: { name: 'asc' },
      }),
      this.resolveMaxRoomLimit(landlordId),
      this.prisma.room.count({
        where: { boardingHouseId },
      }),
    ]);

    return {
      roomTypes: roomTypes.map((rt) => ({
        id: rt.id,
        name: rt.name,
        description: rt.description,
      })),
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        price: String(s.price),
        unit: s.unit,
        isMetered: s.isMetered,
      })),
      maxRoom,
      currentRoomCount,
    };
  }

  /**
   * Query rooms with pagination & filters
   */
  async getRooms(
    boardingHouseId: string,
    query: RoomQueryDto,
  ): Promise<RoomListResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomWhereInput = {
      boardingHouseId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.floor !== undefined ? { floor: query.floor } : {}),
      ...(query.search
        ? {
            roomNumber: {
              contains: query.search.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [total, rooms] = await Promise.all([
      this.prisma.room.count({ where }),
      this.prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
        include: {
          roomType: true,
          roomServices: {
            include: {
              service: true,
            },
          },
        },
      }),
    ]);

    return {
      data: rooms.map((room) => this.mapRoomToDto(room)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * UC-L-03: Create a single room with subscription quota check and service attachment
   */
  async createRoom(
    landlordId: string,
    boardingHouseId: string,
    dto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    this.logger.log(
      `Creating single room '${dto.roomNumber}' for boarding house ${boardingHouseId} by landlord ${landlordId}`,
    );

    // 1. Subscription Plan Room Limit check (UC-L-03)
    const maxRoom = await this.resolveMaxRoomLimit(landlordId);
    const currentRoomCount = await this.prisma.room.count({
      where: { boardingHouseId },
    });

    if (currentRoomCount + 1 > maxRoom) {
      throw new BadRequestException(
        `Cannot create room. Your active subscription allows a maximum of ${maxRoom} rooms for this property (currently ${currentRoomCount}/${maxRoom}). Please upgrade your plan.`,
      );
    }

    // 2. RoomType check
    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, boardingHouseId },
    });
    if (!roomType) {
      throw new NotFoundException(
        `RoomType with ID ${dto.roomTypeId} was not found for this property`,
      );
    }

    // 3. Room number collision check within this boarding house
    const existingRoom = await this.prisma.room.findFirst({
      where: {
        boardingHouseId,
        roomNumber: dto.roomNumber.trim(),
      },
    });
    if (existingRoom) {
      throw new ConflictException(
        `Room number '${dto.roomNumber.trim()}' already exists in this property`,
      );
    }

    // 4. Resolve services to attach
    let serviceIdsToAttach: string[] = [];
    if (dto.serviceIds && dto.serviceIds.length > 0) {
      const validServices = await this.prisma.service.findMany({
        where: { id: { in: dto.serviceIds }, boardingHouseId },
        select: { id: true },
      });
      if (validServices.length !== dto.serviceIds.length) {
        throw new BadRequestException(
          'One or more selected serviceIds are invalid or do not belong to this property',
        );
      }
      serviceIdsToAttach = dto.serviceIds;
    } else {
      // Auto-attach active autoApplied services for this property (spec requirement)
      const autoServices = await this.prisma.service.findMany({
        where: {
          boardingHouseId,
          status: 'active',
          autoApplied: true,
        },
        select: { id: true },
      });
      serviceIdsToAttach = autoServices.map((s) => s.id);
    }

    // 5. Create room and attached services in a transaction
    const created = await this.prisma.$transaction(async (tx) => {
      return tx.room.create({
        data: {
          boardingHouseId,
          roomNumber: dto.roomNumber.trim(),
          floor: dto.floor,
          roomTypeId: dto.roomTypeId,
          area: dto.area !== undefined ? new Prisma.Decimal(dto.area) : null,
          maxOccupants: dto.maxOccupants ?? null,
          status: dto.status ?? RoomStatus.available,
          image_url: dto.imageUrl ?? null,
          roomServices: {
            create: serviceIdsToAttach.map((serviceId) => ({ serviceId })),
          },
        },
        include: {
          roomType: true,
          roomServices: {
            include: {
              service: true,
            },
          },
        },
      });
    });

    return this.mapRoomToDto(created);
  }

  /**
   * UC-L-03/05: Get single room details with joined relations
   */
  async getRoomById(
    boardingHouseId: string,
    roomId: string,
  ): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, boardingHouseId },
      include: {
        roomType: true,
        roomServices: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} was not found in this property`);
    }

    return this.mapRoomToDto(room);
  }

  /**
   * UC-L-03: Update room attributes and synchronize services
   */
  async updateRoom(
    boardingHouseId: string,
    roomId: string,
    dto: UpdateRoomDto,
  ): Promise<RoomResponseDto> {
    this.logger.log(`Updating room ${roomId} in boarding house ${boardingHouseId}`);

    const existingRoom = await this.prisma.room.findFirst({
      where: { id: roomId, boardingHouseId },
    });
    if (!existingRoom) {
      throw new NotFoundException(`Room with ID ${roomId} was not found in this property`);
    }

    if (dto.roomNumber && dto.roomNumber !== existingRoom.roomNumber) {
      const collision = await this.prisma.room.findFirst({
        where: {
          boardingHouseId,
          roomNumber: dto.roomNumber.trim(),
          id: { not: roomId },
        },
      });
      if (collision) {
        throw new ConflictException(
          `Room number '${dto.roomNumber.trim()}' already exists in this property`,
        );
      }
    }

    if (dto.roomTypeId) {
      const roomType = await this.prisma.roomType.findFirst({
        where: { id: dto.roomTypeId, boardingHouseId },
      });
      if (!roomType) {
        throw new NotFoundException(
          `RoomType with ID ${dto.roomTypeId} was not found for this property`,
        );
      }
    }

    // Validate services if provided
    if (dto.serviceIds && dto.serviceIds.length > 0) {
      const validServices = await this.prisma.service.findMany({
        where: { id: { in: dto.serviceIds }, boardingHouseId },
        select: { id: true },
      });
      if (validServices.length !== dto.serviceIds.length) {
        throw new BadRequestException(
          'One or more selected serviceIds are invalid or do not belong to this property',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Synchronize services if serviceIds array is provided
      if (dto.serviceIds !== undefined) {
        const existingRoomServices = await tx.roomService.findMany({
          where: { roomId },
          select: { id: true, serviceId: true },
        });

        const currentServiceIdSet = new Set(existingRoomServices.map((rs) => rs.serviceId));
        const targetServiceIdSet = new Set(dto.serviceIds);

        const toRemove = existingRoomServices.filter(
          (rs) => !targetServiceIdSet.has(rs.serviceId),
        );
        const toAdd = dto.serviceIds.filter((id) => !currentServiceIdSet.has(id));

        if (toRemove.length > 0) {
          await tx.roomService.deleteMany({
            where: { id: { in: toRemove.map((rs) => rs.id) } },
          });
        }

        if (toAdd.length > 0) {
          await tx.roomService.createMany({
            data: toAdd.map((serviceId) => ({ roomId, serviceId })),
          });
        }
      }

      return tx.room.update({
        where: { id: roomId },
        data: {
          ...(dto.roomNumber ? { roomNumber: dto.roomNumber.trim() } : {}),
          ...(dto.floor !== undefined ? { floor: dto.floor } : {}),
          ...(dto.area !== undefined ? { area: new Prisma.Decimal(dto.area) } : {}),
          ...(dto.maxOccupants !== undefined ? { maxOccupants: dto.maxOccupants } : {}),
          ...(dto.roomTypeId ? { roomTypeId: dto.roomTypeId } : {}),
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.imageUrl !== undefined ? { image_url: dto.imageUrl } : {}),
        },
        include: {
          roomType: true,
          roomServices: {
            include: {
              service: true,
            },
          },
        },
      });
    });

    return this.mapRoomToDto(updated);
  }

  /**
   * Helper to resolve active subscription max room limit or free tier fallback
   */
  private async resolveMaxRoomLimit(landlordId: string): Promise<number> {
    const now = new Date();
    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId: landlordId,
        status: SubscriptionStatus.active,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        subscriptionPlan: true,
      },
    });

    if (activeSub?.subscriptionPlan?.maxRoom) {
      return activeSub.subscriptionPlan.maxRoom;
    }

    const freePlan = await this.prisma.subscriptionPlan.findUnique({
      where: { planName: SubscriptionPackage.free },
    });

    return freePlan?.maxRoom ?? 10;
  }

  /**
   * Template renderer for room numbers
   * Supports: {floor}, {floor:02}, {index}, {index:02}
   */
  private renderRoomNumber(template: string, floor: number, index: number): string {
    return template
      .replace(/\{floor:0?2\}/g, String(floor).padStart(2, '0'))
      .replace(/\{floor\}/g, String(floor))
      .replace(/\{index:0?2\}/g, String(index).padStart(2, '0'))
      .replace(/\{index\}/g, String(index))
      .trim();
  }

  /**
   * Helper to map Prisma entity to clean response DTO
   */
  private mapRoomToDto(
    room: Prisma.RoomGetPayload<{
      include: {
        roomType: true;
        roomServices: {
          include: {
            service: true;
          };
        };
      };
    }>,
  ): RoomResponseDto {
    return {
      id: room.id,
      boardingHouseId: room.boardingHouseId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      area: room.area ? String(room.area) : null,
      maxOccupants: room.maxOccupants,
      status: room.status,
      imageUrl: room.image_url,
      roomType: {
        id: room.roomType.id,
        name: room.roomType.name,
        description: room.roomType.description,
      },
      services: room.roomServices.map((rs) => ({
        id: rs.service.id,
        name: rs.service.name,
        price: String(rs.service.price),
        unit: rs.service.unit,
        isMetered: rs.service.isMetered,
      })),
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt?.toISOString() ?? null,
    };
  }
}
