import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OcrService } from './ocr.service';
import { UploadMeterReadingDto } from './dto/upload-meter-reading.dto';
import { UpdateMeterReadingDto } from './dto/update-meter-reading.dto';
import {
  ActiveMeteredServicesResponseDto,
  MeteredServiceItemDto,
} from './dto/active-metered-service-response.dto';
import {
  ConfirmReadingsResponseDto,
  InvoiceItemResponseDto,
} from './dto/confirm-readings-response.dto';
import { RecordLandlordMeterReadingDto } from './dto/record-landlord-meter-reading.dto';
import { UpdateLandlordMeterReadingDto } from './dto/update-landlord-meter-reading.dto';
import {
  LandlordRoomMeteredServicesResponseDto,
  LandlordActiveMeteredServiceItemDto,
  LandlordRoomMeterHistoryResponseDto,
  LandlordMeterPeriodHistoryDto,
  LandlordMeterReadingServiceItemDto,
} from './dto/landlord-meter-readings-response.dto';

@Injectable()
export class MeterReadingsService {
  private readonly logger = new Logger(MeterReadingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ocrService: OcrService,
  ) {}

  // ─── 1. Get Active Metered Services & Draft Readings for Tenant ─────────────

  /**
   * UC-T-03 Step 1:
   * Returns list of room's active metered services and unbilled draft readings.
   *
   * @param userId - Authenticated tenant user ID
   */
  async getActiveServicesForTenant(
    userId: string,
  ): Promise<ActiveMeteredServicesResponseDto> {
    this.logger.log(`Fetching active metered services for tenant ${userId}`);

    const tenantContract = await this.getActiveTenantContract(userId);
    const { contract } = tenantContract;
    const { roomId, room } = contract;

    // Fetch active metered services for this room
    const meteredRoomServices = await this.prisma.roomService.findMany({
      where: {
        roomId,
        service: {
          isMetered: true,
          status: 'active',
        },
      },
      include: {
        service: true,
      },
    });

    const items: MeteredServiceItemDto[] = [];
    let completedCount = 0;

    for (const rs of meteredRoomServices) {
      // Find current unbilled draft reading (invoiceId IS NULL)
      const currentReading = await this.prisma.meterReading.findFirst({
        where: {
          roomId,
          serviceId: rs.serviceId,
          invoiceId: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Find previous billed historical reading (invoiceId IS NOT NULL)
      const previousReading = await this.prisma.meterReading.findFirst({
        where: {
          roomId,
          serviceId: rs.serviceId,
          invoiceId: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });

      const isCompleted =
        currentReading !== null && currentReading.readingValue !== null;
      if (isCompleted) {
        completedCount++;
      }

      items.push({
        serviceId: rs.serviceId,
        serviceName: rs.service.name,
        unitPrice: Number(rs.service.price),
        unit: rs.service.unit,
        currentReading: currentReading
          ? {
              id: currentReading.id,
              readingValue:
                currentReading.readingValue !== null
                  ? Number(currentReading.readingValue)
                  : null,
              imageUrl: currentReading.imageUrl,
              createdAt: currentReading.createdAt.toISOString(),
            }
          : null,
        previousReading: previousReading && previousReading.readingValue !== null
          ? {
              readingValue: Number(previousReading.readingValue),
              recordedAt: previousReading.createdAt.toISOString(),
              imageUrl: previousReading.imageUrl,
            }
          : null,
        isCompleted,
      });
    }

    const totalCount = meteredRoomServices.length;

    return {
      roomId,
      roomNumber: room.roomNumber,
      contractId: contract.id,
      monthlyPaymentDate: contract.monthlyPaymentDate,
      meteredServices: items,
      totalMeteredServices: totalCount,
      completedMeteredServices: completedCount,
      isAllCompleted: totalCount > 0 && completedCount === totalCount,
    };
  }

  // ─── 2. Upload Photo & Run OCR / In-Place Upsert ────────────────────────────

  /**
   * UC-T-03 Step 2 & 3:
   * Tenant uploads photo for a metered service.
   * If readingValue is not provided, OcrService extracts it.
   * Updates in-place if an unbilled draft reading already exists (never duplicates for the cycle).
   */
  async uploadOrUpdateReading(
    userId: string,
    dto: UploadMeterReadingDto,
  ) {
    this.logger.log(
      `Tenant ${userId} uploading meter reading for service ${dto.serviceId}`,
    );

    const tenantContract = await this.getActiveTenantContract(userId);
    const { roomId } = tenantContract.contract;

    // Verify the service is an active metered service for this room
    const roomService = await this.prisma.roomService.findFirst({
      where: {
        roomId,
        serviceId: dto.serviceId,
        service: {
          isMetered: true,
          status: 'active',
        },
      },
      include: { service: true },
    });

    if (!roomService) {
      throw new BadRequestException(
        'The specified service is not an active metered service for your room',
      );
    }

    // Determine reading value (use manual value if provided, else extract via OCR)
    let extractedValue = dto.readingValue;
    if (extractedValue === undefined || extractedValue === null) {
      extractedValue = await this.ocrService.extractMeterReading(
        dto.imageUrl,
        roomService.service.name,
      );
    }

    // Check for existing unbilled draft reading
    const existingDraft = await this.prisma.meterReading.findFirst({
      where: {
        roomId,
        serviceId: dto.serviceId,
        invoiceId: null,
      },
    });

    let savedReading;
    if (existingDraft) {
      // In-place update (same ID)
      this.logger.log(
        `Updating existing draft meter reading ${existingDraft.id} in place`,
      );
      savedReading = await this.prisma.meterReading.update({
        where: { id: existingDraft.id },
        data: {
          imageUrl: dto.imageUrl,
          readingValue: extractedValue,
        },
      });
    } else {
      // Create new draft reading
      this.logger.log(
        `Creating new draft meter reading for room ${roomId}, service ${dto.serviceId}`,
      );
      savedReading = await this.prisma.meterReading.create({
        data: {
          roomId,
          serviceId: dto.serviceId,
          imageUrl: dto.imageUrl,
          readingValue: extractedValue,
          invoiceId: null,
        },
      });
    }

    return {
      id: savedReading.id,
      serviceId: savedReading.serviceId,
      serviceName: roomService.service.name,
      readingValue: Number(savedReading.readingValue),
      imageUrl: savedReading.imageUrl,
      createdAt: savedReading.createdAt.toISOString(),
    };
  }

  // ─── 3. Manual Reading Correction (UC-T-03 Step 4) ──────────────────────────

  /**
   * Updates reading value manually if tenant corrects OCR misread.
   */
  async updateReadingValue(
    userId: string,
    readingId: string,
    dto: UpdateMeterReadingDto,
  ) {
    this.logger.log(
      `Tenant ${userId} updating meter reading ${readingId} value to ${dto.readingValue}`,
    );

    const tenantContract = await this.getActiveTenantContract(userId);
    const { roomId } = tenantContract.contract;

    const reading = await this.prisma.meterReading.findUnique({
      where: { id: readingId },
      include: { service: true },
    });

    if (!reading || reading.roomId !== roomId) {
      throw new NotFoundException('Meter reading not found for your room');
    }

    if (reading.invoiceId !== null) {
      throw new BadRequestException(
        'Cannot modify a meter reading that has already been billed',
      );
    }

    const updated = await this.prisma.meterReading.update({
      where: { id: readingId },
      data: {
        readingValue: dto.readingValue,
      },
    });

    return {
      id: updated.id,
      serviceId: updated.serviceId,
      serviceName: reading.service.name,
      readingValue: Number(updated.readingValue),
      imageUrl: updated.imageUrl,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  // ─── 4. Confirm All Readings & Trigger Invoice Generation (UC-L-06 Part 3) ───

  /**
   * UC-T-03 Step 5 & UC-L-06 Part 3:
   * Validates completeness across all active metered services.
   * Atomically generates Invoice + InvoiceItems, links consumed MeterReadings,
   * writes AuditLog entry, and returns payment payload.
   */
  async confirmAndGenerateInvoice(
    userId: string,
  ): Promise<ConfirmReadingsResponseDto> {
    this.logger.log(
      `Tenant ${userId} confirming utility meter readings and requesting invoice generation`,
    );

    const tenantContract = await this.getActiveTenantContract(userId);
    const { contract } = tenantContract;
    const { roomId } = contract;

    // 1. Fetch all active metered services for the room
    const activeMeteredServices = await this.prisma.roomService.findMany({
      where: {
        roomId,
        service: {
          isMetered: true,
          status: 'active',
        },
      },
      include: { service: true },
    });

    // 2. Fetch all unbilled meter readings for this room
    const unbilledReadings = await this.prisma.meterReading.findMany({
      where: {
        roomId,
        invoiceId: null,
      },
      include: { service: true },
    });

    // 3. Server-side completeness validation: Every active metered service must have a valid unbilled reading
    for (const rs of activeMeteredServices) {
      const reading = unbilledReadings.find(
        (r) => r.serviceId === rs.serviceId && r.readingValue !== null,
      );
      if (!reading) {
        throw new BadRequestException(
          `Vui lòng nhập đầy đủ chỉ số cho dịch vụ "${rs.service.name}" trước khi xác nhận`,
        );
      }
    }

    // 4. Fetch all active flat (non-metered) services for this room
    const activeFlatServices = await this.prisma.roomService.findMany({
      where: {
        roomId,
        service: {
          isMetered: false,
          status: 'active',
        },
      },
      include: { service: true },
    });

    // 5. Calculate billing line items
    const lineItemsToCreate: Array<{
      serviceId: string | null;
      title: string;
      quantity: number;
      unitPrice: any;
      amount: number;
    }> = [];

    // 5a. Rent item (Contract.rentPrice)
    const rentPriceNum = Number(contract.rentPrice);
    lineItemsToCreate.push({
      serviceId: null,
      title: 'Tiền phòng',
      quantity: 1,
      unitPrice: contract.rentPrice,
      amount: rentPriceNum,
    });

    // 5b. Metered services items
    const consumedReadingIds: string[] = [];
    for (const rs of activeMeteredServices) {
      const reading = unbilledReadings.find((r) => r.serviceId === rs.serviceId)!;
      consumedReadingIds.push(reading.id);

      // Find previous reading for consumption delta calculation
      const previousReading = await this.prisma.meterReading.findFirst({
        where: {
          roomId,
          serviceId: rs.serviceId,
          invoiceId: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });

      const currentVal = Number(reading.readingValue);
      const prevVal = previousReading && previousReading.readingValue !== null
        ? Number(previousReading.readingValue)
        : 0;

      // Delta consumption (if previous exists and current >= prev, use delta; else use current reading)
      const consumption = (currentVal >= prevVal && prevVal > 0)
        ? (currentVal - prevVal)
        : currentVal;

      const unitPriceNum = Number(rs.service.price);
      const amount = Math.round(consumption * unitPriceNum);

      lineItemsToCreate.push({
        serviceId: rs.serviceId,
        title: `${rs.service.name} (${consumption} ${rs.service.unit})`,
        quantity: Math.max(1, Math.round(consumption)),
        unitPrice: rs.service.price,
        amount,
      });
    }

    // 5c. Flat services items
    for (const rs of activeFlatServices) {
      const unitPriceNum = Number(rs.service.price);
      lineItemsToCreate.push({
        serviceId: rs.serviceId,
        title: rs.service.name,
        quantity: 1,
        unitPrice: rs.service.price,
        amount: unitPriceNum,
      });
    }

    // 5d. Total amount calculation
    const totalAmountNum = lineItemsToCreate.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    // Compute due date (using monthlyPaymentDate of this cycle)
    const now = new Date();
    const dueDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      contract.monthlyPaymentDate || 5,
    );
    if (dueDate < now) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    // 6. DB Transaction: Create Invoice + InvoiceItems, Link Readings, Write AuditLog
    const result = await this.prisma.$transaction(async (tx) => {
      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          roomId,
          contractId: contract.id,
          totalAmount: totalAmountNum,
          status: 'unpaid',
          dueDate,
        },
      });

      // Create Invoice Items
      const createdItems: InvoiceItemResponseDto[] = [];
      for (const item of lineItemsToCreate) {
        const createdItem = await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          },
        });

        createdItems.push({
          id: createdItem.id,
          title: item.title,
          quantity: createdItem.quantity,
          unitPrice: Number(createdItem.unitPrice),
          amount: createdItem.amount,
        });
      }

      // Link consumed readings to this invoice
      if (consumedReadingIds.length > 0) {
        await tx.meterReading.updateMany({
          where: {
            id: { in: consumedReadingIds },
          },
          data: {
            invoiceId: invoice.id,
          },
        });
      }

      // AuditLog creation
      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'INVOICE',
          entityId: invoice.id,
          boardingHouseId: contract.room.boardingHouseId,
          userId,
          ipAddress: '127.0.0.1',
          newValue: {
            totalAmount: totalAmountNum,
            roomId,
            contractId: contract.id,
          },
        },
      });

      return { invoice, items: createdItems };
    });

    this.logger.log(
      `Invoice ${result.invoice.id} created successfully with totalAmount ${totalAmountNum}`,
    );

    // Generate locked VietQR payload
    const vietQrPayload = `00020101021238580010A0000007270126000697042201121234567890520400005303704540${totalAmountNum}5802VN62170813DORMIO_INV_${result.invoice.id.slice(0, 8)}6304`;

    return {
      invoiceId: result.invoice.id,
      status: result.invoice.status,
      totalAmount: totalAmountNum,
      dueDate: result.invoice.dueDate.toISOString(),
      roomId,
      contractId: contract.id,
      items: result.items,
      vietQrPayload,
    };
  }

  // ─── Landlord Meter Readings (UC-L-09) ──────────────────────────────────────

  /**
   * UC-L-09: Get active metered services for a room along with last recorded readings
   */
  async getRoomMeteredServices(
    boardingHouseId: string,
    roomId: string,
  ): Promise<LandlordRoomMeteredServicesResponseDto> {
    this.logger.log(`Landlord fetching metered services for room ${roomId}`);

    const room = await this.prisma.room.findFirst({
      where: { id: roomId, boardingHouseId },
      select: { id: true, roomNumber: true },
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại trong nhà trọ này');
    }

    // Find services specifically linked to room or all metered services in this boarding house
    let meteredServices = await this.prisma.service.findMany({
      where: {
        boardingHouseId,
        isMetered: true,
        status: 'active',
        roomServices: {
          some: { roomId },
        },
      },
    });

    if (meteredServices.length === 0) {
      // Fallback: active metered services defined for the entire boarding house
      meteredServices = await this.prisma.service.findMany({
        where: {
          boardingHouseId,
          isMetered: true,
          status: 'active',
        },
      });
    }

    const services: LandlordActiveMeteredServiceItemDto[] = [];

    for (const service of meteredServices) {
      // Latest unbilled reading for this service
      const unbilled = await this.prisma.meterReading.findFirst({
        where: {
          roomId,
          serviceId: service.id,
          invoiceId: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Latest billed (or historical) reading prior to current unbilled
      const last = await this.prisma.meterReading.findFirst({
        where: {
          roomId,
          serviceId: service.id,
          ...(unbilled ? { id: { not: unbilled.id } } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      services.push({
        serviceId: service.id,
        serviceName: service.name,
        unitPrice: Number(service.price),
        unit: service.unit,
        lastReading: last
          ? {
              id: last.id,
              readingValue: Number(last.readingValue || 0),
              imageUrl: last.imageUrl,
              createdAt: last.createdAt.toISOString(),
            }
          : null,
        unbilledReading: unbilled
          ? {
              id: unbilled.id,
              readingValue: Number(unbilled.readingValue || 0),
              imageUrl: unbilled.imageUrl,
              createdAt: unbilled.createdAt.toISOString(),
            }
          : null,
      });
    }

    return {
      roomId: room.id,
      roomNumber: room.roomNumber,
      services,
    };
  }

  /**
   * UC-L-09: Get chronological meter reading history for a room grouped by cycle
   */
  async getRoomMeterHistory(
    boardingHouseId: string,
    roomId: string,
  ): Promise<LandlordRoomMeterHistoryResponseDto> {
    this.logger.log(`Landlord fetching meter history for room ${roomId}`);

    const room = await this.prisma.room.findFirst({
      where: { id: roomId, boardingHouseId },
      select: { id: true, roomNumber: true },
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại trong nhà trọ này');
    }

    const readings = await this.prisma.meterReading.findMany({
      where: { roomId },
      include: {
        service: true,
        invoice: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (readings.length === 0) {
      return {
        roomId: room.id,
        roomNumber: room.roomNumber,
        history: [],
      };
    }

    // Group readings into periods: either by invoiceId or by (year-month)
    const periodMap = new Map<string, typeof readings>();

    for (const r of readings) {
      const year = r.createdAt.getFullYear();
      const month = r.createdAt.getMonth() + 1;
      const key = r.invoiceId ? `inv_${r.invoiceId}` : `cycle_${year}_${month}`;

      const group = periodMap.get(key) || [];
      group.push(r);
      periodMap.set(key, group);
    }

    const history: LandlordMeterPeriodHistoryDto[] = [];

    for (const [, group] of periodMap.entries()) {
      const latestInGroup = group[0];
      const d = latestInGroup.createdAt;
      const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
      const yearStr = d.getFullYear().toString();
      const periodLabel = `Tháng ${monthStr}/${yearStr}`;

      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${monthStr}/${yearStr} ${d
        .getHours()
        .toString()
        .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

      const serviceItems: LandlordMeterReadingServiceItemDto[] = [];
      let groupTotalMeterCost = 0;

      for (const r of group) {
        // Find previous reading for this service before this reading's createdAt
        const prev = await this.prisma.meterReading.findFirst({
          where: {
            roomId,
            serviceId: r.serviceId,
            createdAt: { lt: r.createdAt },
          },
          orderBy: { createdAt: 'desc' },
        });

        const newReading = Number(r.readingValue || 0);
        const oldReading = prev?.readingValue ? Number(prev.readingValue) : newReading;
        const consumption = Math.max(0, newReading - oldReading);
        const unitPrice = Number(r.service?.price || 0);
        const cost = Math.round(consumption * unitPrice);
        groupTotalMeterCost += cost;

        serviceItems.push({
          id: r.id,
          serviceId: r.serviceId,
          serviceName: r.service?.name || 'Dịch vụ',
          unit: r.service?.unit || '',
          unitPrice,
          oldReading,
          newReading,
          consumption,
          cost,
          imageUrl: r.imageUrl,
          createdAt: r.createdAt.toISOString(),
        });
      }

      const invoice = latestInGroup.invoice;
      const isPaid = invoice?.status === 'paid';
      const invoiceStatus = invoice?.status ?? 'unbilled';

      history.push({
        period: periodLabel,
        date: dateStr,
        createdAt: d.toISOString(),
        services: serviceItems,
        totalMeterCost: groupTotalMeterCost,
        invoiceId: invoice?.id ?? null,
        invoiceStatus,
        isPaid,
        canEdit: !isPaid,
      });
    }

    return {
      roomId: room.id,
      roomNumber: room.roomNumber,
      history,
    };
  }

  /**
   * UC-L-09: Record utility meter readings directly by landlord
   * Skips tenant-side OCR/confirm loop and counts as final immediately.
   */
  async recordLandlordMeterReading(
    landlordId: string,
    boardingHouseId: string,
    dto: RecordLandlordMeterReadingDto,
  ) {
    this.logger.log(
      `Landlord ${landlordId} manually recording utility readings for room ${dto.roomId} in house ${boardingHouseId}`,
    );

    const room = await this.prisma.room.findFirst({
      where: { id: dto.roomId, boardingHouseId },
      include: { boardingHouse: true },
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại trong nhà trọ này');
    }

    const recordedDate = dto.recordedAt ? new Date(dto.recordedAt) : new Date();
    const createdReadings: any[] = [];

    for (const item of dto.readings) {
      const service = await this.prisma.service.findFirst({
        where: { id: item.serviceId, boardingHouseId },
      });

      if (!service) {
        throw new BadRequestException(
          `Dịch vụ với ID ${item.serviceId} không thuộc nhà trọ này`,
        );
      }

      // Check if unbilled reading exists for this room & service
      const existingDraft = await this.prisma.meterReading.findFirst({
        where: {
          roomId: dto.roomId,
          serviceId: item.serviceId,
          invoiceId: null,
        },
      });

      if (existingDraft) {
        const updated = await this.prisma.meterReading.update({
          where: { id: existingDraft.id },
          data: {
            readingValue: item.readingValue,
            imageUrl: item.imageUrl ?? existingDraft.imageUrl,
            createdAt: recordedDate,
          },
          include: { service: true },
        });
        createdReadings.push(updated);
      } else {
        const created = await this.prisma.meterReading.create({
          data: {
            roomId: dto.roomId,
            serviceId: item.serviceId,
            readingValue: item.readingValue,
            imageUrl: item.imageUrl || null,
            createdAt: recordedDate,
          },
          include: { service: true },
        });
        createdReadings.push(created);
      }
    }

    return {
      success: true,
      message: 'Đã lưu chỉ số điện nước thành công',
      count: createdReadings.length,
      data: createdReadings.map((r) => ({
        id: r.id,
        serviceId: r.serviceId,
        serviceName: r.service.name,
        readingValue: r.readingValue !== null ? Number(r.readingValue) : 0,
        imageUrl: r.imageUrl,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  /**
   * UC-L-09: Update / correct a recorded meter reading with reason
   */
  async updateLandlordMeterReading(
    landlordId: string,
    boardingHouseId: string,
    readingId: string,
    dto: UpdateLandlordMeterReadingDto,
  ) {
    this.logger.log(
      `Landlord ${landlordId} updating meter reading ${readingId} in house ${boardingHouseId}`,
    );

    const reading = await this.prisma.meterReading.findUnique({
      where: { id: readingId },
      include: {
        room: true,
        service: true,
        invoice: true,
      },
    });

    if (!reading) {
      throw new NotFoundException('Không tìm thấy bản ghi chỉ số điện nước');
    }

    if (reading.room.boardingHouseId !== boardingHouseId) {
      throw new NotFoundException('Bản ghi không thuộc nhà trọ này');
    }

    if (reading.invoice?.status === 'paid') {
      throw new BadRequestException(
        'Không thể chỉnh sửa chỉ số điện nước của hóa đơn đã thanh toán',
      );
    }

    const updated = await this.prisma.meterReading.update({
      where: { id: readingId },
      data: {
        readingValue: dto.readingValue,
        imageUrl: dto.imageUrl ?? reading.imageUrl,
      },
      include: { service: true },
    });

    return {
      success: true,
      message: 'Đã cập nhật chỉ số điện nước thành công',
      data: {
        id: updated.id,
        serviceId: updated.serviceId,
        serviceName: updated.service.name,
        readingValue:
          updated.readingValue !== null ? Number(updated.readingValue) : 0,
        imageUrl: updated.imageUrl,
        createdAt: updated.createdAt.toISOString(),
        reason: dto.reason,
      },
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async getActiveTenantContract(userId: string) {
    const tenantContract = await this.prisma.tenantContract.findFirst({
      where: {
        tenantId: userId,
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
        'Không tìm thấy hợp đồng thuê đang hoạt động cho người dùng này',
      );
    }

    return tenantContract;
  }
}
