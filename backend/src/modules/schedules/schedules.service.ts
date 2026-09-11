import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ScheduleStatus } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAdhocScheduleDto } from './dto/create-adhoc-schedule.dto';
import { CreateRecurringScheduleDto } from './dto/create-recurring-schedule.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { QuerySchedulesDto } from './dto/query-schedules.dto';
import {
  CreateRecurringResponseDto,
  SchedulesListResponseDto,
  WorkScheduleItemDto,
} from './dto/schedule-response.dto';
import { ShiftItemDto } from './dto/shift-response.dto';
import { UpdateRecurrenceDto } from './dto/update-recurrence.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

const DEFAULT_SHIFTS = [
  { name: 'Ca sáng', startTime: '06:00', endTime: '14:00' },
  { name: 'Ca chiều', startTime: '14:00', endTime: '22:00' },
  { name: 'Ca đêm', startTime: '22:00', endTime: '06:00' },
  { name: 'Hành chính', startTime: '08:00', endTime: '17:00' },
];

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Format a Date object to "HH:mm" string
   */
  private formatTime(date: Date): string {
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Parse a "HH:mm" string into a Date object (anchored at 1970-01-01 UTC)
   */
  private parseTimeString(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
    return date;
  }

  /**
   * Parse target days of week from string.
   * Supports: "2,4,6", "T2,T4,T6", "MON,WED,FRI", "1,3,5", "CN", "0"
   * Returns Set of JS UTC day numbers: 0 (Sun), 1 (Mon), ..., 6 (Sat)
   */
  private parseTargetDays(daysOfWeekStr: string): Set<number> {
    const tokens = (daysOfWeekStr || '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const targetDays = new Set<number>();

    for (const t of tokens) {
      if (t === '2' || t === 'T2' || t === 'THU2' || t === 'MON') {
        targetDays.add(1); // Monday
      } else if (t === '3' || t === 'T3' || t === 'THU3' || t === 'TUE') {
        targetDays.add(2); // Tuesday
      } else if (t === '4' || t === 'T4' || t === 'THU4' || t === 'WED') {
        targetDays.add(3); // Wednesday
      } else if (t === '5' || t === 'T5' || t === 'THU5' || t === 'THU') {
        targetDays.add(4); // Thursday
      } else if (t === '6' || t === 'T6' || t === 'THU6' || t === 'FRI') {
        targetDays.add(5); // Friday
      } else if (t === '7' || t === 'T7' || t === 'THU7' || t === 'SAT') {
        targetDays.add(6); // Saturday
      } else if (
        t === 'CN' ||
        t === 'CHUNHAT' ||
        t === '8' ||
        t === '0' ||
        t === 'SUN'
      ) {
        targetDays.add(0); // Sunday
      } else if (!isNaN(Number(t))) {
        const n = Number(t);
        if (n >= 0 && n <= 6) {
          targetDays.add(n);
        }
      }
    }

    return targetDays;
  }

  /**
   * Parse date string "YYYY-MM-DD" to Date at UTC 00:00:00
   */
  private parseDateOnly(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  /**
   * Format Date to "YYYY-MM-DD" string
   */
  private formatDateOnly(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SHIFT MANAGEMENT (UC-L-21 Step 1)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Get all shifts for a boarding house.
   * If none exist yet, automatically seed the 4 default shifts for the property.
   */
  async getShifts(boardingHouseId: string): Promise<ShiftItemDto[]> {
    this.logger.log(`getShifts boardingHouseId=${boardingHouseId}`);

    let shifts = await this.prisma.shift.findMany({
      where: { boardingHouseId },
      orderBy: { startTime: 'asc' },
    });

    if (shifts.length === 0) {
      this.logger.log(
        `Seeding default shifts for boarding house ${boardingHouseId}`,
      );
      await this.prisma.$transaction(
        DEFAULT_SHIFTS.map((s) =>
          this.prisma.shift.create({
            data: {
              boardingHouseId,
              name: s.name,
              startTime: this.parseTimeString(s.startTime),
              endTime: this.parseTimeString(s.endTime),
            },
          }),
        ),
      );

      shifts = await this.prisma.shift.findMany({
        where: { boardingHouseId },
        orderBy: { startTime: 'asc' },
      });
    }

    return shifts.map((s) => ({
      id: s.id,
      boardingHouseId: s.boardingHouseId,
      name: s.name,
      startTime: this.formatTime(s.startTime),
      endTime: this.formatTime(s.endTime),
      createdAt: s.createdAt.toISOString(),
    }));
  }

  /**
   * Create a new shift for the property
   */
  async createShift(
    boardingHouseId: string,
    dto: CreateShiftDto,
  ): Promise<ShiftItemDto> {
    this.logger.log(
      `createShift boardingHouseId=${boardingHouseId} name="${dto.name}"`,
    );

    const existing = await this.prisma.shift.findFirst({
      where: {
        boardingHouseId,
        name: { equals: dto.name.trim(), mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ca làm việc "${dto.name}" đã tồn tại tại nhà trọ này`,
      );
    }

    const created = await this.prisma.shift.create({
      data: {
        boardingHouseId,
        name: dto.name.trim(),
        startTime: this.parseTimeString(dto.startTime),
        endTime: this.parseTimeString(dto.endTime),
      },
    });

    return {
      id: created.id,
      boardingHouseId: created.boardingHouseId,
      name: created.name,
      startTime: this.formatTime(created.startTime),
      endTime: this.formatTime(created.endTime),
      createdAt: created.createdAt.toISOString(),
    };
  }

  /**
   * Update an existing shift
   */
  async updateShift(
    boardingHouseId: string,
    shiftId: string,
    dto: UpdateShiftDto,
  ): Promise<ShiftItemDto> {
    this.logger.log(
      `updateShift boardingHouseId=${boardingHouseId} shiftId=${shiftId}`,
    );

    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, boardingHouseId },
    });

    if (!shift) {
      throw new NotFoundException('Không tìm thấy ca làm việc');
    }

    const updated = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        startTime:
          dto.startTime !== undefined
            ? this.parseTimeString(dto.startTime)
            : undefined,
        endTime:
          dto.endTime !== undefined
            ? this.parseTimeString(dto.endTime)
            : undefined,
      },
    });

    return {
      id: updated.id,
      boardingHouseId: updated.boardingHouseId,
      name: updated.name,
      startTime: this.formatTime(updated.startTime),
      endTime: this.formatTime(updated.endTime),
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Delete a shift if not referenced by active schedules
   */
  async deleteShift(boardingHouseId: string, shiftId: string): Promise<void> {
    this.logger.log(
      `deleteShift boardingHouseId=${boardingHouseId} shiftId=${shiftId}`,
    );

    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, boardingHouseId },
      include: {
        workSchedules: {
          where: { status: 'scheduled' },
          take: 1,
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Không tìm thấy ca làm việc');
    }

    if (shift.workSchedules.length > 0) {
      throw new BadRequestException(
        'Không thể xóa ca làm việc đang có lịch trực đã lên lịch.',
      );
    }

    await this.prisma.shift.delete({
      where: { id: shiftId },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCHEDULES MANAGEMENT (UC-L-21 Step 2, Ad-hoc, Overrides, Query)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Query work schedules with calendar or list filtering
   */
  async getSchedules(
    boardingHouseId: string,
    query: QuerySchedulesDto,
  ): Promise<SchedulesListResponseDto> {
    this.logger.log(
      `getSchedules boardingHouseId=${boardingHouseId} query=${JSON.stringify(query)}`,
    );

    // Default to current month window if not provided
    const now = new Date();
    const defaultStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const defaultEnd = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    );

    const startDate = query.startDate
      ? this.parseDateOnly(query.startDate)
      : defaultStart;
    const endDate = query.endDate
      ? new Date(this.parseDateOnly(query.endDate).getTime() + 86400000 - 1)
      : defaultEnd;

    const where: any = {
      boardingHouseId,
      workDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.shiftId) {
      where.shiftId = query.shiftId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const search = query.search.trim();
      where.employee = {
        user: {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { phoneNumber: { contains: search } },
            {
              userIdentification: {
                fullName: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        },
      };
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const [total, items, allRangeSchedules] = await Promise.all([
      this.prisma.workSchedule.count({ where }),
      this.prisma.workSchedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ workDate: 'asc' }, { shift: { startTime: 'asc' } }],
        include: {
          employee: {
            include: {
              user: {
                include: { userIdentification: true },
              },
              employeeAssignments: {
                where: { boardingHouseId, status: 'active' },
                include: { position: true },
                take: 1,
              },
            },
          },
          shift: true,
          attendances: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      // Query light data in range for summary stats
      this.prisma.workSchedule.findMany({
        where: {
          boardingHouseId,
          workDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          status: true,
          recurrenceId: true,
        },
      }),
    ]);

    const scheduledCount = allRangeSchedules.filter(
      (s) => s.status === 'scheduled',
    ).length;
    const canceledCount = allRangeSchedules.filter(
      (s) => s.status === 'canceled',
    ).length;
    const recurringCount = allRangeSchedules.filter(
      (s) => s.recurrenceId !== null,
    ).length;
    const adhocCount = allRangeSchedules.filter(
      (s) => s.recurrenceId === null,
    ).length;

    const mappedData: WorkScheduleItemDto[] = items.map((item) => {
      const assignment = item.employee.employeeAssignments[0];
      const attendance = item.attendances[0];
      const isRecurring = item.recurrenceId !== null;

      const userName =
        item.employee.user.userIdentification?.fullName ||
        item.employee.user.username ||
        item.employee.user.phoneNumber;

      return {
        id: item.id,
        boardingHouseId: item.boardingHouseId,
        employeeId: item.employeeId,
        employeeName: userName,
        employeePhone: item.employee.user.phoneNumber,
        employeeAvatar: item.employee.user.avatarUrl,
        positionName: assignment?.position?.name || 'Nhân viên',
        shiftId: item.shiftId,
        shiftName: item.shift.name,
        startTime: this.formatTime(item.shift.startTime),
        endTime: this.formatTime(item.shift.endTime),
        workDate: this.formatDateOnly(item.workDate),
        recurrenceId: item.recurrenceId,
        isRecurring,
        status: item.status,
        note: null,
        attendanceStatus: attendance?.status || null,
        checkIn: attendance?.checkIn ? attendance.checkIn.toISOString() : null,
        checkOut: attendance?.checkOut ? attendance.checkOut.toISOString() : null,
        createdAt: item.createdAt.toISOString(),
      };
    });

    return {
      data: mappedData,
      summary: {
        totalSchedules: allRangeSchedules.length,
        scheduledCount,
        canceledCount,
        recurringCount,
        adhocCount,
      },
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Create Recurring Schedule (UC-L-21 Step 2)
   * Materializes each matching day as individual WorkSchedule rows.
   */
  async createRecurringSchedule(
    boardingHouseId: string,
    currentUserId: string,
    dto: CreateRecurringScheduleDto,
  ): Promise<CreateRecurringResponseDto> {
    this.logger.log(
      `createRecurringSchedule boardingHouseId=${boardingHouseId} shiftId=${dto.shiftId} days=${dto.daysOfWeek} range=${dto.startDate}->${dto.endDate}`,
    );

    // 1. Verify shift
    const shift = await this.prisma.shift.findFirst({
      where: { id: dto.shiftId, boardingHouseId },
    });
    if (!shift) {
      throw new NotFoundException('Ca làm việc không tồn tại tại nhà trọ này');
    }

    // 2. Verify all employees belong to property
    const activeAssignments = await this.prisma.employeeAssignment.findMany({
      where: {
        boardingHouseId,
        employeeId: { in: dto.employeeIds },
        status: 'active',
      },
    });

    const activeEmployeeIds = new Set(activeAssignments.map((a) => a.employeeId));
    const missingEmployees = dto.employeeIds.filter(
      (id) => !activeEmployeeIds.has(id),
    );
    if (missingEmployees.length > 0) {
      throw new BadRequestException(
        'Một số nhân viên được chọn không hoạt động tại nhà trọ này',
      );
    }

    // 3. Parse target days of week
    const targetDays = this.parseTargetDays(dto.daysOfWeek);
    if (targetDays.size === 0) {
      throw new BadRequestException(
        'Vui lòng chọn ít nhất một ngày trong tuần (ví dụ: 2,4,6 hoặc T2,T4,T6)',
      );
    }

    // 4. Parse date range
    const start = this.parseDateOnly(dto.startDate);
    const end = this.parseDateOnly(dto.endDate);
    if (start > end) {
      throw new BadRequestException(
        'Ngày bắt đầu không được lớn hơn ngày kết thúc',
      );
    }

    // Pre-calculate matching dates
    const matchingDates: Date[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      if (targetDays.has(curr.getUTCDay())) {
        matchingDates.push(new Date(curr));
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    if (matchingDates.length === 0) {
      throw new BadRequestException(
        'Không có ngày nào trong khoảng thời gian đã chọn trùng với các ngày trong tuần đã chọn',
      );
    }

    let totalMaterialized = 0;
    let patternsCreated = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const employeeId of dto.employeeIds) {
        // Create RecurrencePattern
        const pattern = await tx.recurrencePattern.create({
          data: {
            employeeId,
            boardingHouseId,
            shiftId: dto.shiftId,
            daysOfWeek: dto.daysOfWeek,
            startTime: shift.startTime,
            endTime: shift.endTime,
            createdBy: currentUserId,
          },
        });
        patternsCreated++;

        // Materialize individual WorkSchedule rows for each matching date
        for (const date of matchingDates) {
          // Check if already exists for this employee and shift on this day
          const existingSchedule = await tx.workSchedule.findFirst({
            where: {
              employeeId,
              boardingHouseId,
              shiftId: dto.shiftId,
              workDate: date,
            },
          });

          if (!existingSchedule) {
            await tx.workSchedule.create({
              data: {
                employeeId,
                boardingHouseId,
                shiftId: dto.shiftId,
                workDate: date,
                recurrenceId: pattern.id,
                status: 'scheduled',
              },
            });
            totalMaterialized++;
          } else if (existingSchedule.status === 'canceled') {
            // Re-activate if was canceled
            await tx.workSchedule.update({
              where: { id: existingSchedule.id },
              data: {
                status: 'scheduled',
                recurrenceId: pattern.id,
              },
            });
            totalMaterialized++;
          }
        }
      }
    });

    return {
      success: true,
      patternsCreated,
      schedulesMaterialized: totalMaterialized,
      message: `Đã phân ca lặp lại và tạo thành công ${totalMaterialized} lịch làm việc cho ${patternsCreated} nhân viên.`,
    };
  }

  /**
   * Create Ad-hoc schedule (single WorkSchedule insert with recurrenceId = null)
   */
  async createAdhocSchedule(
    boardingHouseId: string,
    dto: CreateAdhocScheduleDto,
  ): Promise<WorkScheduleItemDto> {
    this.logger.log(
      `createAdhocSchedule boardingHouseId=${boardingHouseId} employeeId=${dto.employeeId} shiftId=${dto.shiftId} date=${dto.workDate}`,
    );

    // Verify shift
    const shift = await this.prisma.shift.findFirst({
      where: { id: dto.shiftId, boardingHouseId },
    });
    if (!shift) {
      throw new NotFoundException('Ca làm việc không tồn tại tại nhà trọ này');
    }

    // Verify employee
    const assignment = await this.prisma.employeeAssignment.findFirst({
      where: {
        boardingHouseId,
        employeeId: dto.employeeId,
        status: 'active',
      },
      include: {
        employee: { include: { user: true } },
        position: true,
      },
    });

    if (!assignment) {
      throw new BadRequestException(
        'Nhân viên không hoạt động tại nhà trọ này',
      );
    }

    const workDate = this.parseDateOnly(dto.workDate);

    // Insert single WorkSchedule with recurrenceId = null
    const created = await this.prisma.workSchedule.create({
      data: {
        employeeId: dto.employeeId,
        boardingHouseId,
        shiftId: dto.shiftId,
        workDate,
        recurrenceId: null,
        status: 'scheduled',
      },
      include: {
        shift: true,
        employee: {
          include: {
            user: {
              include: { userIdentification: true },
            },
          },
        },
      },
    });

    const employeeName =
      created.employee.user.userIdentification?.fullName ||
      created.employee.user.username ||
      created.employee.user.phoneNumber;

    return {
      id: created.id,
      boardingHouseId: created.boardingHouseId,
      employeeId: created.employeeId,
      employeeName,
      employeePhone: created.employee.user.phoneNumber,
      employeeAvatar: created.employee.user.avatarUrl,
      positionName: assignment.position?.name || 'Nhân viên',
      shiftId: created.shiftId,
      shiftName: created.shift.name,
      startTime: this.formatTime(created.shift.startTime),
      endTime: this.formatTime(created.shift.endTime),
      workDate: this.formatDateOnly(created.workDate),
      recurrenceId: null,
      isRecurring: false,
      status: created.status,
      note: dto.note || null,
      attendanceStatus: null,
      checkIn: null,
      checkOut: null,
      createdAt: created.createdAt.toISOString(),
    };
  }

  /**
   * Edit a single occurrence (UC-L-21: recurrenceId is retained, row becomes independently editable)
   */
  async updateSchedule(
    boardingHouseId: string,
    scheduleId: string,
    dto: UpdateScheduleDto,
  ): Promise<WorkScheduleItemDto> {
    this.logger.log(
      `updateSchedule boardingHouseId=${boardingHouseId} scheduleId=${scheduleId}`,
    );

    const existing = await this.prisma.workSchedule.findFirst({
      where: { id: scheduleId, boardingHouseId },
      include: {
        shift: true,
        employee: {
          include: {
            user: true,
            employeeAssignments: {
              where: { boardingHouseId, status: 'active' },
              include: { position: true },
              take: 1,
            },
          },
        },
        attendances: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy ca làm việc');
    }

    if (dto.shiftId && dto.shiftId !== existing.shiftId) {
      const shift = await this.prisma.shift.findFirst({
        where: { id: dto.shiftId, boardingHouseId },
      });
      if (!shift) {
        throw new BadRequestException('Ca làm việc mới không tồn tại');
      }
    }

    const updated = await this.prisma.workSchedule.update({
      where: { id: scheduleId },
      data: {
        shiftId: dto.shiftId || existing.shiftId,
        workDate: dto.workDate
          ? this.parseDateOnly(dto.workDate)
          : existing.workDate,
        status: dto.status || existing.status,
      },
      include: {
        shift: true,
        employee: {
          include: {
            user: {
              include: { userIdentification: true },
            },
            employeeAssignments: {
              where: { boardingHouseId, status: 'active' },
              include: { position: true },
              take: 1,
            },
          },
        },
        attendances: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    const assignment = updated.employee.employeeAssignments[0];
    const attendance = updated.attendances[0];

    const employeeName =
      updated.employee.user.userIdentification?.fullName ||
      updated.employee.user.username ||
      updated.employee.user.phoneNumber;

    return {
      id: updated.id,
      boardingHouseId: updated.boardingHouseId,
      employeeId: updated.employeeId,
      employeeName,
      employeePhone: updated.employee.user.phoneNumber,
      employeeAvatar: updated.employee.user.avatarUrl,
      positionName: assignment?.position?.name || 'Nhân viên',
      shiftId: updated.shiftId,
      shiftName: updated.shift.name,
      startTime: this.formatTime(updated.shift.startTime),
      endTime: this.formatTime(updated.shift.endTime),
      workDate: this.formatDateOnly(updated.workDate),
      recurrenceId: updated.recurrenceId,
      isRecurring: updated.recurrenceId !== null,
      status: updated.status,
      note: dto.note || null,
      attendanceStatus: attendance?.status || null,
      checkIn: attendance?.checkIn ? attendance.checkIn.toISOString() : null,
      checkOut: attendance?.checkOut ? attendance.checkOut.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Edit Whole Pattern forward (UC-L-21: overwrites all WorkSchedule where recurrenceId = :id and workDate >= CURRENT_DATE)
   */
  async updateRecurrence(
    boardingHouseId: string,
    recurrenceId: string,
    dto: UpdateRecurrenceDto,
  ): Promise<{ updatedCount: number; message: string }> {
    this.logger.log(
      `updateRecurrence boardingHouseId=${boardingHouseId} recurrenceId=${recurrenceId}`,
    );

    const pattern = await this.prisma.recurrencePattern.findFirst({
      where: { id: recurrenceId, boardingHouseId },
    });

    if (!pattern) {
      throw new NotFoundException('Không tìm thấy mẫu lặp ca');
    }

    if (dto.shiftId && dto.shiftId !== pattern.shiftId) {
      const shift = await this.prisma.shift.findFirst({
        where: { id: dto.shiftId, boardingHouseId },
      });
      if (!shift) {
        throw new BadRequestException('Ca làm việc mới không tồn tại');
      }

      await this.prisma.recurrencePattern.update({
        where: { id: recurrenceId },
        data: {
          shiftId: dto.shiftId,
          startTime: shift.startTime,
          endTime: shift.endTime,
        },
      });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const updateData: any = {};
    if (dto.shiftId) updateData.shiftId = dto.shiftId;
    if (dto.status) updateData.status = dto.status;

    const res = await this.prisma.workSchedule.updateMany({
      where: {
        recurrenceId,
        boardingHouseId,
        workDate: { gte: today },
      },
      data: updateData,
    });

    return {
      updatedCount: res.count,
      message: `Đã cập nhật ${res.count} ca làm việc từ hôm nay trở đi.`,
    };
  }

  /**
   * Delete / Cancel a schedule
   * mode = 'single': cancels or deletes single WorkSchedule
   * mode = 'future': cancels/deletes all future occurrences for recurrenceId
   */
  async deleteSchedule(
    boardingHouseId: string,
    scheduleId: string,
    mode: 'single' | 'future' = 'single',
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(
      `deleteSchedule boardingHouseId=${boardingHouseId} scheduleId=${scheduleId} mode=${mode}`,
    );

    const schedule = await this.prisma.workSchedule.findFirst({
      where: { id: scheduleId, boardingHouseId },
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy ca làm việc');
    }

    if (mode === 'future' && schedule.recurrenceId) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const res = await this.prisma.workSchedule.updateMany({
        where: {
          recurrenceId: schedule.recurrenceId,
          boardingHouseId,
          workDate: { gte: today },
        },
        data: { status: 'canceled' },
      });

      return {
        deletedCount: res.count,
        message: `Đã hủy ${res.count} ca làm việc định kỳ trong tương lai.`,
      };
    }

    // Cancel single schedule
    await this.prisma.workSchedule.update({
      where: { id: scheduleId },
      data: { status: 'canceled' },
    });

    return {
      deletedCount: 1,
      message: 'Đã hủy ca làm việc thành công.',
    };
  }
}
