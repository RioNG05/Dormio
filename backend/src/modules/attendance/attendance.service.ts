import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, AuditLogAction, ScheduleStatus } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AttendanceListResponseDto,
  AttendanceRecordDto,
  AttendanceSummaryDto,
} from './dto/attendance-response.dto';
import { OverrideAttendanceDto } from './dto/override-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Format a Date object to "HH:mm" string (24h)
   */
  private formatTime(date: Date): string {
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
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

  /**
   * Parse date string "YYYY-MM-DD" to Date at UTC 00:00:00
   */
  private parseDateOnly(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  /**
   * UC-L-22: Query WorkSchedule left-joined Attendance for date range
   */
  async getAttendance(
    boardingHouseId: string,
    query: QueryAttendanceDto,
  ): Promise<AttendanceListResponseDto> {
    this.logger.log(
      `getAttendance house=${boardingHouseId} query=${JSON.stringify(query)}`,
    );

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

    // First, fetch all matching schedules in range for summary stats
    const allRangeSchedules = await this.prisma.workSchedule.findMany({
      where,
      include: {
        attendances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    let onTimeCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let notYetCount = 0;

    for (const s of allRangeSchedules) {
      const att = s.attendances[0];
      const st = att ? att.status : AttendanceStatus.not_yet;
      if (st === AttendanceStatus.on_time) onTimeCount++;
      else if (st === AttendanceStatus.late) lateCount++;
      else if (st === AttendanceStatus.absent) absentCount++;
      else notYetCount++;
    }

    const totalShifts = allRangeSchedules.length;
    const evaluatedCount = totalShifts - notYetCount;
    const attendanceRate =
      evaluatedCount > 0
        ? Math.round(((onTimeCount + lateCount) / evaluatedCount) * 1000) / 10
        : 100;

    const summary: AttendanceSummaryDto = {
      totalShifts,
      onTimeCount,
      lateCount,
      absentCount,
      notYetCount,
      attendanceRate,
    };

    // If query.status filter is active, filter schedules in memory or in query
    let filteredIds: string[] | null = null;
    if (query.status) {
      filteredIds = allRangeSchedules
        .filter((s) => {
          const att = s.attendances[0];
          const st = att ? att.status : AttendanceStatus.not_yet;
          return st === query.status;
        })
        .map((s) => s.id);

      where.id = { in: filteredIds };
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const [total, schedules] = await Promise.all([
      this.prisma.workSchedule.count({ where }),
      this.prisma.workSchedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ workDate: 'desc' }, { shift: { startTime: 'asc' } }],
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
          attendances: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              editedByUser: {
                include: { userIdentification: true },
              },
            },
          },
        },
      }),
    ]);

    const mappedData: AttendanceRecordDto[] = schedules.map((item) => {
      const attendance = item.attendances[0];
      const assignment = item.employee.employeeAssignments[0];
      const userName =
        item.employee.user.userIdentification?.fullName ||
        item.employee.user.username ||
        item.employee.user.phoneNumber;

      const editedByName = attendance?.editedByUser
        ? attendance.editedByUser.userIdentification?.fullName ||
          attendance.editedByUser.username ||
          'Chủ nhà'
        : null;

      return {
        workScheduleId: item.id,
        attendanceId: attendance?.id || null,
        employeeId: item.employeeId,
        employeeName: userName,
        employeePhone: item.employee.user.phoneNumber,
        employeeAvatar: item.employee.user.avatarUrl,
        positionName: assignment?.position?.name || 'Nhân viên',
        shiftId: item.shiftId,
        shiftName: item.shift.name,
        shiftStartTime: this.formatTime(item.shift.startTime),
        shiftEndTime: this.formatTime(item.shift.endTime),
        workDate: this.formatDateOnly(item.workDate),
        scheduleStatus: item.status,
        attendanceStatus: attendance ? attendance.status : AttendanceStatus.not_yet,
        checkIn: attendance?.checkIn ? attendance.checkIn.toISOString() : null,
        checkOut: attendance?.checkOut ? attendance.checkOut.toISOString() : null,
        editedBy: attendance?.editedBy || null,
        editedByName,
        updatedAt: attendance?.updatedAt ? attendance.updatedAt.toISOString() : null,
      };
    });

    return {
      data: mappedData,
      summary,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * UC-L-22: Manual Override of Attendance
   * Updates status, check-in, check-out, sets editedBy=<landlord user id>, updatedAt=NOW().
   * If no attendance row exists, creates one.
   * Complies with Rule 4: AuditLog created in the same DB transaction.
   */
  async overrideAttendance(
    boardingHouseId: string,
    currentUserId: string,
    dto: OverrideAttendanceDto,
    ipAddress = '127.0.0.1',
  ): Promise<AttendanceRecordDto> {
    this.logger.log(
      `overrideAttendance house=${boardingHouseId} schedule=${dto.workScheduleId} user=${currentUserId} status=${dto.status}`,
    );

    const schedule = await this.prisma.workSchedule.findFirst({
      where: {
        id: dto.workScheduleId,
        boardingHouseId,
      },
      include: {
        shift: true,
        employee: {
          include: {
            user: { include: { userIdentification: true } },
            employeeAssignments: {
              where: { boardingHouseId, status: 'active' },
              include: { position: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy ca làm việc tại nhà trọ này');
    }

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: { workScheduleId: dto.workScheduleId },
    });

    const checkInDate = dto.checkIn !== undefined ? (dto.checkIn ? new Date(dto.checkIn) : null) : undefined;
    const checkOutDate = dto.checkOut !== undefined ? (dto.checkOut ? new Date(dto.checkOut) : null) : undefined;

    const result = await this.prisma.$transaction(async (tx) => {
      let attRecord;

      if (existingAttendance) {
        // UPDATE existing Attendance
        attRecord = await tx.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            status: dto.status,
            checkIn: checkInDate !== undefined ? checkInDate : existingAttendance.checkIn,
            checkOut: checkOutDate !== undefined ? checkOutDate : existingAttendance.checkOut,
            editedBy: currentUserId,
            updatedAt: new Date(),
          },
          include: {
            editedByUser: {
              include: { userIdentification: true },
            },
          },
        });

        // Rule 4: AuditLog in same transaction
        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            boardingHouseId,
            action: AuditLogAction.update,
            entityType: 'ATTENDANCE',
            entityId: existingAttendance.id,
            oldValue: {
              status: existingAttendance.status,
              checkIn: existingAttendance.checkIn,
              checkOut: existingAttendance.checkOut,
              editedBy: existingAttendance.editedBy,
            },
            newValue: {
              status: dto.status,
              checkIn: attRecord.checkIn,
              checkOut: attRecord.checkOut,
              editedBy: currentUserId,
              note: dto.note || null,
            },
            ipAddress,
          },
        });
      } else {
        // CREATE new Attendance row
        attRecord = await tx.attendance.create({
          data: {
            workScheduleId: dto.workScheduleId,
            employeeId: schedule.employeeId,
            status: dto.status,
            checkIn: checkInDate || null,
            checkOut: checkOutDate || null,
            editedBy: currentUserId,
          },
          include: {
            editedByUser: {
              include: { userIdentification: true },
            },
          },
        });

        // Rule 4: AuditLog in same transaction
        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            boardingHouseId,
            action: AuditLogAction.create,
            entityType: 'ATTENDANCE',
            entityId: attRecord.id,
            oldValue: { status: AttendanceStatus.not_yet },
            newValue: {
              workScheduleId: dto.workScheduleId,
              employeeId: schedule.employeeId,
              status: dto.status,
              checkIn: attRecord.checkIn,
              checkOut: attRecord.checkOut,
              editedBy: currentUserId,
              note: dto.note || null,
            },
            ipAddress,
          },
        });
      }

      return attRecord;
    });

    const assignment = schedule.employee.employeeAssignments[0];
    const userName =
      schedule.employee.user.userIdentification?.fullName ||
      schedule.employee.user.username ||
      schedule.employee.user.phoneNumber;

    const editedByName = result.editedByUser
      ? result.editedByUser.userIdentification?.fullName ||
        result.editedByUser.username ||
        'Chủ nhà'
      : 'Chủ nhà';

    return {
      workScheduleId: schedule.id,
      attendanceId: result.id,
      employeeId: schedule.employeeId,
      employeeName: userName,
      employeePhone: schedule.employee.user.phoneNumber,
      employeeAvatar: schedule.employee.user.avatarUrl,
      positionName: assignment?.position?.name || 'Nhân viên',
      shiftId: schedule.shiftId,
      shiftName: schedule.shift.name,
      shiftStartTime: this.formatTime(schedule.shift.startTime),
      shiftEndTime: this.formatTime(schedule.shift.endTime),
      workDate: this.formatDateOnly(schedule.workDate),
      scheduleStatus: schedule.status,
      attendanceStatus: result.status,
      checkIn: result.checkIn ? result.checkIn.toISOString() : null,
      checkOut: result.checkOut ? result.checkOut.toISOString() : null,
      editedBy: result.editedBy,
      editedByName,
      updatedAt: result.updatedAt ? result.updatedAt.toISOString() : null,
    };
  }
}
