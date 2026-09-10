import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateManualDepositDto } from './dto/create-manual-deposit.dto';
import { QueryDepositsDto } from './dto/query-deposits.dto';
import { RefundDepositDto } from './dto/refund-deposit.dto';
import { ForfeitDepositDto } from './dto/forfeit-deposit.dto';
import {
  DepositResponseDto,
  DepositStatsDto,
  PaginatedDepositsResponseDto,
} from './dto/deposit-response.dto';
import {
  DepositStatus,
  DepositType,
  RoomStatus,
  AuditLogAction,
  Prisma,
} from '@prisma';

interface DepositParsedMetadata {
  tenantName?: string;
  tenantPhone?: string;
  expiryDate?: string;
  originalAmount?: number;
  deductedAmount?: number;
  refundAmount?: number;
  deductionReason?: string;
  note?: string;
}

@Injectable()
export class DepositsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to parse deposit metadata stored in note column.
   */
  private parseDepositNote(noteRaw: string | null): DepositParsedMetadata {
    if (!noteRaw) return {};
    try {
      if (noteRaw.trim().startsWith('{') && noteRaw.trim().endsWith('}')) {
        return JSON.parse(noteRaw);
      }
    } catch {
      // Not JSON, fallback to plain note
    }
    return { note: noteRaw };
  }

  /**
   * Helper to serialize deposit metadata into note column.
   */
  private serializeDepositNote(meta: DepositParsedMetadata): string {
    return JSON.stringify(meta);
  }

  /**
   * Helper to format a Prisma Deposit record into a DepositResponseDto.
   */
  private formatDeposit(deposit: any): DepositResponseDto {
    const meta = this.parseDepositNote(deposit.note);

    // Resolve tenant name & phone
    let tenantName = meta.tenantName || '';
    let tenantPhone = meta.tenantPhone || '';

    if (!tenantName && deposit.contract?.tenantContracts?.[0]?.tenant) {
      const primaryTenant = deposit.contract.tenantContracts[0].tenant;
      tenantName = primaryTenant.username || primaryTenant.email || '';
      tenantPhone = primaryTenant.phoneNumber || '';
    } else if (!tenantName && deposit.payment?.payer) {
      tenantName = deposit.payment.payer.username || deposit.payment.payer.email || '';
      tenantPhone = deposit.payment.payer.phoneNumber || '';
    }

    if (!tenantName) {
      tenantName = 'Khách vãng lai';
    }

    const amountNum = Number(deposit.amount);
    const originalAmount = meta.originalAmount ?? amountNum;
    const isHoldCategory = deposit.contractId === null;

    const createdAtDate = new Date(deposit.createdAt);
    const depositDate = createdAtDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return {
      id: deposit.id,
      roomId: deposit.roomId,
      roomNumber: deposit.room?.roomNumber || 'N/A',
      boardingHouseId: deposit.boardingHouseId,
      boardingHouseName: deposit.boardingHouse?.name || 'Nhà trọ',
      contractId: deposit.contractId,
      postId: deposit.postId,
      type: deposit.type,
      depositCategory: isHoldCategory ? 'hold' : 'contract',
      amount: amountNum,
      originalAmount,
      status: deposit.status,
      recordedManually: deposit.recordedManually,
      recordedBy: deposit.recordedBy,
      tenantName,
      tenantPhone,
      expiryDate: meta.expiryDate || null,
      depositDate,
      deductedAmount: meta.deductedAmount ?? 0,
      refundAmount: meta.refundAmount ?? 0,
      deductionReason: meta.deductionReason || null,
      note: meta.note || (typeof deposit.note === 'string' && !deposit.note.startsWith('{') ? deposit.note : null),
      createdAt: deposit.createdAt.toISOString(),
    };
  }

  // ─── UC-L-10: Manual Deposit Entry ─────────────────────────────────────────

  /**
   * Records a manual deposit entry holding a room for a prospective tenant (no contract yet).
   * Atomically creates Deposit row, sets Room status to 'deposited', and writes AuditLog.
   *
   * @param boardingHouseId Target boarding house ID
   * @param landlordId Current authenticated user ID
   * @param dto Manual deposit payload
   * @param ipAddress IP address for AuditLog
   */
  async createManualDeposit(
    boardingHouseId: string,
    landlordId: string,
    dto: CreateManualDepositDto,
    ipAddress = '127.0.0.1',
  ): Promise<DepositResponseDto> {
    // 1. Validate room exists and belongs to boarding house
    const room = await this.prisma.room.findFirst({
      where: {
        id: dto.roomId,
        boardingHouseId,
      },
      include: {
        roomType: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại hoặc không thuộc nhà trọ này.');
    }

    // 2. Validate room status
    if (room.status === RoomStatus.occupied) {
      throw new BadRequestException('Phòng hiện đã có người thuê, không thể nhận cọc giữ chỗ.');
    }

    if (room.status === RoomStatus.maintainace) {
      throw new BadRequestException('Phòng đang trong thời gian bảo trì, không thể nhận cọc giữ chỗ.');
    }

    if (room.status === RoomStatus.deposited) {
      throw new BadRequestException('Phòng hiện đã được đặt cọc giữ chỗ.');
    }

    // Check if there is an active unconverted deposit for this room
    const existingActiveDeposit = await this.prisma.deposit.findFirst({
      where: {
        roomId: dto.roomId,
        boardingHouseId,
        status: DepositStatus.paid,
        contractId: null,
      },
    });

    if (existingActiveDeposit) {
      throw new BadRequestException('Phòng này hiện đã có một phiếu cọc giữ chỗ đang có hiệu lực.');
    }

    // 3. Serialize metadata note
    const noteMeta: DepositParsedMetadata = {
      tenantName: dto.tenantName?.trim(),
      tenantPhone: dto.tenantPhone?.trim(),
      expiryDate: dto.expiryDate,
      originalAmount: dto.amount,
      note: dto.note?.trim(),
    };
    const serializedNote = this.serializeDepositNote(noteMeta);

    // 4. Atomic Transaction: Deposit + Room.status = deposited + AuditLog
    const createdDeposit = await this.prisma.$transaction(async (tx) => {
      // 4a. Create Deposit row
      const deposit = await tx.deposit.create({
        data: {
          roomId: dto.roomId,
          boardingHouseId,
          contractId: null,
          postId: null,
          type: DepositType.contract,
          amount: new Prisma.Decimal(dto.amount),
          status: DepositStatus.paid,
          recordedManually: true,
          recordedBy: landlordId,
          note: serializedNote,
        },
        include: {
          room: true,
          boardingHouse: true,
        },
      });

      // 4b. Update Room status to 'deposited'
      await tx.room.update({
        where: { id: dto.roomId },
        data: { status: RoomStatus.deposited },
      });

      // 4c. Record AuditLog entry (Rule #4)
      await tx.auditLog.create({
        data: {
          action: AuditLogAction.create,
          entityType: 'DEPOSIT',
          entityId: deposit.id,
          boardingHouseId,
          userId: landlordId,
          ipAddress,
          newValue: {
            roomId: dto.roomId,
            amount: dto.amount,
            type: DepositType.contract,
            status: DepositStatus.paid,
            recordedManually: true,
            tenantName: dto.tenantName,
            tenantPhone: dto.tenantPhone,
            expiryDate: dto.expiryDate,
          },
        },
      });

      return deposit;
    });

    return this.formatDeposit(createdDeposit);
  }

  // ─── UC-L-14: Deposit Management & Listing ──────────────────────────────────

  /**
   * Retrieves paginated deposits for a boarding house with filter options and dashboard stats.
   *
   * @param boardingHouseId Target boarding house ID
   * @param query Filtering & pagination params
   */
  async getDeposits(
    boardingHouseId: string,
    query: QueryDepositsDto,
  ): Promise<PaginatedDepositsResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    // Fetch all deposits for this house to calculate accurate statistics
    const allDeposits = await this.prisma.deposit.findMany({
      where: { boardingHouseId },
      include: {
        room: true,
        boardingHouse: true,
        contract: {
          include: {
            tenantContracts: {
              include: {
                tenant: true,
              },
            },
          },
        },
        payment: {
          include: {
            payer: true,
          },
        },
        recordedByUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute Dashboard Statistics
    let totalHoldingAmount = 0;
    let totalHoldTypeAmount = 0;
    let totalRefundedAmount = 0;
    let totalDeductedAmount = 0;

    let holdingCountTotal = 0;
    let holdTypeHoldingCountTotal = 0;
    let refundedCountTotal = 0;
    let deductedCountTotal = 0;

    let holdTypeCountTotal = 0;
    let contractTypeCountTotal = 0;

    const formattedAll = allDeposits.map((d) => this.formatDeposit(d));

    for (const item of formattedAll) {
      if (item.depositCategory === 'hold') {
        holdTypeCountTotal++;
      } else {
        contractTypeCountTotal++;
      }

      if (item.status === DepositStatus.paid) {
        totalHoldingAmount += item.amount;
        holdingCountTotal++;
        if (item.depositCategory === 'hold') {
          totalHoldTypeAmount += item.amount;
          holdTypeHoldingCountTotal++;
        }
      } else if (item.status === DepositStatus.refund) {
        totalRefundedAmount += item.refundAmount || item.originalAmount;
        refundedCountTotal++;
      } else if (item.status === DepositStatus.forfeited) {
        totalDeductedAmount += item.deductedAmount || item.originalAmount;
        deductedCountTotal++;
      }

      // If partial deduction exists on refunded items
      if (item.status === DepositStatus.refund && item.deductedAmount > 0) {
        totalDeductedAmount += item.deductedAmount;
      }
    }

    const stats: DepositStatsDto = {
      totalHoldingAmount,
      totalHoldTypeAmount,
      totalRefundedAmount,
      totalDeductedAmount,
      holdingCountTotal,
      holdTypeHoldingCountTotal,
      refundedCountTotal,
      deductedCountTotal,
      holdTypeCountTotal,
      contractTypeCountTotal,
    };

    // Apply Filters
    let filtered = formattedAll;

    // Filter by depositCategory (hold vs contract)
    if (query.depositCategory) {
      filtered = filtered.filter((d) => d.depositCategory === query.depositCategory);
    }

    // Filter by type
    if (query.type) {
      filtered = filtered.filter((d) => d.type === query.type);
    }

    // Filter by status
    if (query.status) {
      filtered = filtered.filter((d) => d.status === query.status);
    }

    // Filter by search keyword
    if (query.search && query.search.trim() !== '') {
      const s = query.search.trim().toLowerCase();
      filtered = filtered.filter((d) => {
        return (
          d.roomNumber.toLowerCase().includes(s) ||
          d.tenantName.toLowerCase().includes(s) ||
          d.tenantPhone.includes(s) ||
          d.id.toLowerCase().includes(s)
        );
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedData = filtered.slice(skip, skip + limit);

    return {
      data: paginatedData,
      stats,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Retrieves single deposit details by ID.
   */
  async getDepositById(
    boardingHouseId: string,
    depositId: string,
  ): Promise<DepositResponseDto> {
    const deposit = await this.prisma.deposit.findFirst({
      where: {
        id: depositId,
        boardingHouseId,
      },
      include: {
        room: true,
        boardingHouse: true,
        contract: {
          include: {
            tenantContracts: {
              include: {
                tenant: true,
              },
            },
          },
        },
        payment: {
          include: {
            payer: true,
          },
        },
        recordedByUser: true,
      },
    });

    if (!deposit) {
      throw new NotFoundException('Phiếu đặt cọc không tồn tại hoặc không thuộc nhà trọ này.');
    }

    return this.formatDeposit(deposit);
  }

  // ─── Refund & Forfeit Flows ────────────────────────────────────────────────

  /**
   * Processes a deposit refund (partial or full) for a holding deposit.
   * If the hold deposit is refunded/deducted and room was 'deposited', restores room status to 'available'.
   *
   * @param boardingHouseId Boarding house ID
   * @param landlordId Current landlord user ID
   * @param depositId Deposit ID
   * @param dto Refund details
   * @param ipAddress Audit log client IP
   */
  async refundDeposit(
    boardingHouseId: string,
    landlordId: string,
    depositId: string,
    dto: RefundDepositDto,
    ipAddress = '127.0.0.1',
  ): Promise<DepositResponseDto> {
    const deposit = await this.prisma.deposit.findFirst({
      where: { id: depositId, boardingHouseId },
      include: { room: true },
    });

    if (!deposit) {
      throw new NotFoundException('Phiếu đặt cọc không tồn tại.');
    }

    if (deposit.status !== DepositStatus.paid) {
      throw new BadRequestException('Chỉ có thể hoàn tiền cho phiếu cọc đang ở trạng thái đã thu tiền (paid).');
    }

    const currentAmount = Number(deposit.amount);
    const deductedAmount = Math.min(currentAmount, Math.max(0, Number(dto.deductedAmount) || 0));
    const refundAmount = Math.max(0, currentAmount - deductedAmount);

    // If 100% deducted with 0 refund -> status becomes forfeited; otherwise refund
    const targetStatus = refundAmount === 0 && deductedAmount >= currentAmount
      ? DepositStatus.forfeited
      : DepositStatus.refund;

    const existingMeta = this.parseDepositNote(deposit.note);
    const updatedMeta: DepositParsedMetadata = {
      ...existingMeta,
      originalAmount: existingMeta.originalAmount ?? currentAmount,
      deductedAmount,
      refundAmount,
      deductionReason: dto.deductionReason || (deductedAmount > 0 ? 'Khấu trừ tiền cọc' : undefined),
      note: dto.note ? `${existingMeta.note || ''} [Hoàn cọc: ${dto.note}]`.trim() : existingMeta.note,
    };
    const serializedNote = this.serializeDepositNote(updatedMeta);

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update deposit
      const res = await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: targetStatus,
          amount: new Prisma.Decimal(refundAmount),
          note: serializedNote,
        },
        include: {
          room: true,
          boardingHouse: true,
        },
      });

      // 2. If hold deposit (contractId is null) and room is currently 'deposited', reset room status to 'available'
      if (!deposit.contractId && deposit.room.status === RoomStatus.deposited) {
        await tx.room.update({
          where: { id: deposit.roomId },
          data: { status: RoomStatus.available },
        });
      }

      // 3. Write AuditLog entry (Rule #4)
      await tx.auditLog.create({
        data: {
          action: AuditLogAction.update,
          entityType: 'DEPOSIT',
          entityId: depositId,
          boardingHouseId,
          userId: landlordId,
          ipAddress,
          oldValue: {
            status: deposit.status,
            amount: currentAmount,
          },
          newValue: {
            status: targetStatus,
            amount: refundAmount,
            deductedAmount,
            refundAmount,
            deductionReason: dto.deductionReason,
          },
        },
      });

      return res;
    });

    return this.formatDeposit(updated);
  }

  /**
   * Forfeits a deposit (100% deduction due to breach or cancellation).
   * Restores hold room status to 'available'.
   *
   * @param boardingHouseId Boarding house ID
   * @param landlordId Current landlord user ID
   * @param depositId Deposit ID
   * @param dto Forfeiture reason
   * @param ipAddress Audit log client IP
   */
  async forfeitDeposit(
    boardingHouseId: string,
    landlordId: string,
    depositId: string,
    dto: ForfeitDepositDto,
    ipAddress = '127.0.0.1',
  ): Promise<DepositResponseDto> {
    const deposit = await this.prisma.deposit.findFirst({
      where: { id: depositId, boardingHouseId },
      include: { room: true },
    });

    if (!deposit) {
      throw new NotFoundException('Phiếu đặt cọc không tồn tại.');
    }

    if (deposit.status !== DepositStatus.paid) {
      throw new BadRequestException('Chỉ có thể khấu trừ/tịch thu phiếu cọc đang ở trạng thái đã thu tiền (paid).');
    }

    const currentAmount = Number(deposit.amount);
    const existingMeta = this.parseDepositNote(deposit.note);
    const updatedMeta: DepositParsedMetadata = {
      ...existingMeta,
      originalAmount: existingMeta.originalAmount ?? currentAmount,
      deductedAmount: currentAmount,
      refundAmount: 0,
      deductionReason: dto.deductionReason,
      note: dto.note ? `${existingMeta.note || ''} [Tịch thu cọc: ${dto.note}]`.trim() : existingMeta.note,
    };
    const serializedNote = this.serializeDepositNote(updatedMeta);

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update deposit status to forfeited
      const res = await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: DepositStatus.forfeited,
          amount: new Prisma.Decimal(0),
          note: serializedNote,
        },
        include: {
          room: true,
          boardingHouse: true,
        },
      });

      // 2. If hold deposit (contractId is null) and room is 'deposited', reset to 'available'
      if (!deposit.contractId && deposit.room.status === RoomStatus.deposited) {
        await tx.room.update({
          where: { id: deposit.roomId },
          data: { status: RoomStatus.available },
        });
      }

      // 3. Write AuditLog entry (Rule #4)
      await tx.auditLog.create({
        data: {
          action: AuditLogAction.update,
          entityType: 'DEPOSIT',
          entityId: depositId,
          boardingHouseId,
          userId: landlordId,
          ipAddress,
          oldValue: {
            status: deposit.status,
            amount: currentAmount,
          },
          newValue: {
            status: DepositStatus.forfeited,
            amount: 0,
            deductedAmount: currentAmount,
            deductionReason: dto.deductionReason,
          },
        },
      });

      return res;
    });

    return this.formatDeposit(updated);
  }
}
