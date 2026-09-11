import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import {
  ExpenseItemDto,
  ExpensesListResponseDto,
  ExpensesSummaryDto,
} from './dto/expense-response.dto';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a readable tracking code for an expense (e.g. CP-202608-01)
   */
  private generateExpenseCode(id: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const suffix = id.slice(-4).toUpperCase();
    return `CP-${year}${month}-${suffix}`;
  }

  /**
   * Helper to map Prisma expense entity to DTO
   */
  private mapToExpenseDto(expense: {
    id: string;
    boardingHouseId: string;
    roomId: string | null;
    name: string;
    description: string | null;
    category: string;
    status: 'pending' | 'paid' | 'canceled';
    amount: Prisma.Decimal;
    createdAt: Date;
    paidAt: Date;
    room?: { id: string; roomNumber: string } | null;
  }): ExpenseItemDto {
    const roomName = expense.room
      ? `Phòng ${expense.room.roomNumber}`
      : 'Toàn tòa nhà';

    return {
      id: expense.id,
      code: this.generateExpenseCode(expense.id, expense.paidAt),
      name: expense.name,
      description: expense.description,
      category: expense.category,
      amount: Number(expense.amount),
      status: expense.status,
      paidAt: expense.paidAt.toISOString(),
      createdAt: expense.createdAt.toISOString(),
      boardingHouseId: expense.boardingHouseId,
      roomId: expense.roomId,
      roomName,
      roomNumber: expense.room?.roomNumber ?? null,
    };
  }

  /**
   * UC-L-17: Create a new expense (property-wide or room-specific)
   */
  async createExpense(
    landlordId: string,
    boardingHouseId: string,
    dto: CreateExpenseDto,
  ): Promise<ExpenseItemDto> {
    this.logger.log(
      `Landlord ${landlordId} creating expense "${dto.name}" for house ${boardingHouseId} (amount=${dto.amount})`,
    );

    // If room is specified, verify it belongs to this boarding house
    if (dto.roomId) {
      const room = await this.prisma.room.findFirst({
        where: {
          id: dto.roomId,
          boardingHouseId,
        },
      });
      if (!room) {
        throw new BadRequestException('Phòng được chọn không thuộc nhà trọ này.');
      }
    }

    const expense = await this.prisma.expense.create({
      data: {
        boardingHouseId,
        roomId: dto.roomId || null,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        category: dto.category.trim(),
        amount: new Prisma.Decimal(dto.amount),
        status: dto.status || 'paid',
        paidAt: new Date(dto.paidAt),
      },
      include: {
        room: {
          select: { id: true, roomNumber: true },
        },
      },
    });

    return this.mapToExpenseDto(expense);
  }

  /**
   * UC-L-17: Query paginated expenses with filters and summary metrics
   */
  async getExpenses(
    boardingHouseId: string,
    query: QueryExpensesDto,
    landlordId: string,
  ): Promise<ExpensesListResponseDto> {
    this.logger.log(
      `Landlord ${landlordId} querying expenses for house ${boardingHouseId} (category=${query.category}, status=${query.status}, page=${query.page})`,
    );

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 6);
    const skip = (page - 1) * limit;

    // 1. Base house scope filter
    const baseWhere: Prisma.ExpenseWhereInput = {
      boardingHouseId,
    };

    // 2. Category filter
    let categoryWhere: Prisma.ExpenseWhereInput = {};
    if (query.category && query.category !== 'all') {
      categoryWhere = { category: query.category };
    }

    // 3. Status filter
    let statusWhere: Prisma.ExpenseWhereInput = {};
    if (query.status && query.status !== 'all') {
      statusWhere = { status: query.status };
    }

    // 4. Room filter
    let roomWhere: Prisma.ExpenseWhereInput = {};
    if (query.roomId && query.roomId !== 'all') {
      if (query.roomId === 'property_wide') {
        roomWhere = { roomId: null };
      } else {
        roomWhere = { roomId: query.roomId };
      }
    }

    // 5. Date filter (by month and year)
    let dateWhere: Prisma.ExpenseWhereInput = {};
    const selectedYear = query.year && query.year !== 'all' ? Number(query.year) : null;
    const selectedMonth = query.month && query.month !== 'all' ? Number(query.month) : null;

    if (selectedYear && selectedMonth) {
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
      dateWhere = { paidAt: { gte: start, lte: end } };
    } else if (selectedYear) {
      const start = new Date(selectedYear, 0, 1);
      const end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      dateWhere = { paidAt: { gte: start, lte: end } };
    }

    // 6. Search filter
    let searchWhere: Prisma.ExpenseWhereInput = {};
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      searchWhere = {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { category: { contains: term, mode: 'insensitive' } },
          { room: { roomNumber: { contains: term, mode: 'insensitive' } } },
        ],
      };
    }

    const where: Prisma.ExpenseWhereInput = {
      ...baseWhere,
      ...categoryWhere,
      ...statusWhere,
      ...roomWhere,
      ...dateWhere,
      ...searchWhere,
    };

    // 7. Calculate Summary Metrics across period (unpaginated, matching house & date filter)
    const periodWhere: Prisma.ExpenseWhereInput = {
      ...baseWhere,
      ...dateWhere,
    };

    const periodExpenses = await this.prisma.expense.findMany({
      where: periodWhere,
      select: {
        id: true,
        amount: true,
        status: true,
      },
    });

    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let canceledAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;

    for (const exp of periodExpenses) {
      const amt = Number(exp.amount);
      totalAmount += amt;

      if (exp.status === 'paid') {
        paidAmount += amt;
        paidCount++;
      } else if (exp.status === 'pending') {
        pendingAmount += amt;
        pendingCount++;
      } else if (exp.status === 'canceled') {
        canceledAmount += amt;
      }
    }

    const summary: ExpensesSummaryDto = {
      totalAmount,
      paidAmount,
      pendingAmount,
      canceledAmount,
      totalCount: periodExpenses.length,
      paidCount,
      pendingCount,
    };

    // 8. Sorting
    let orderBy: Prisma.ExpenseOrderByWithRelationInput[] = [
      { paidAt: 'desc' },
      { createdAt: 'desc' },
    ];
    if (query.sortBy === 'date_asc') {
      orderBy = [{ paidAt: 'asc' }, { createdAt: 'asc' }];
    } else if (query.sortBy === 'amount_desc') {
      orderBy = [{ amount: 'desc' }, { paidAt: 'desc' }];
    } else if (query.sortBy === 'amount_asc') {
      orderBy = [{ amount: 'asc' }, { paidAt: 'desc' }];
    }

    // 9. Query paginated records
    const [total, expenses] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        include: {
          room: {
            select: { id: true, roomNumber: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: expenses.map((e) => this.mapToExpenseDto(e)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      summary,
    };
  }

  /**
   * UC-L-17: Get single expense detail
   */
  async getExpenseDetail(
    boardingHouseId: string,
    id: string,
  ): Promise<ExpenseItemDto> {
    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        boardingHouseId,
      },
      include: {
        room: {
          select: { id: true, roomNumber: true },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException('Không tìm thấy khoản chi phí này.');
    }

    return this.mapToExpenseDto(expense);
  }

  /**
   * UC-L-17: Update an expense
   */
  async updateExpense(
    boardingHouseId: string,
    id: string,
    dto: UpdateExpenseDto,
    landlordId: string,
  ): Promise<ExpenseItemDto> {
    this.logger.log(
      `Landlord ${landlordId} updating expense ${id} for house ${boardingHouseId}`,
    );

    const existing = await this.prisma.expense.findFirst({
      where: {
        id,
        boardingHouseId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy khoản chi phí cần cập nhật.');
    }

    // If updating roomId, verify room belongs to boarding house
    if (dto.roomId) {
      const room = await this.prisma.room.findFirst({
        where: {
          id: dto.roomId,
          boardingHouseId,
        },
      });
      if (!room) {
        throw new BadRequestException('Phòng được chọn không thuộc nhà trọ này.');
      }
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description:
          dto.description !== undefined ? dto.description.trim() || null : undefined,
        category: dto.category !== undefined ? dto.category.trim() : undefined,
        amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
        paidAt: dto.paidAt !== undefined ? new Date(dto.paidAt) : undefined,
        roomId: dto.roomId !== undefined ? dto.roomId || null : undefined,
      },
      include: {
        room: {
          select: { id: true, roomNumber: true },
        },
      },
    });

    return this.mapToExpenseDto(updated);
  }

  /**
   * UC-L-17: Delete an expense
   */
  async deleteExpense(
    boardingHouseId: string,
    id: string,
    landlordId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Landlord ${landlordId} deleting expense ${id} for house ${boardingHouseId}`,
    );

    const existing = await this.prisma.expense.findFirst({
      where: {
        id,
        boardingHouseId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy khoản chi phí cần xóa.');
    }

    await this.prisma.expense.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Đã xóa khoản chi phí thành công.',
    };
  }
}
