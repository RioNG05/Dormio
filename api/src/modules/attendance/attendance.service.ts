import { BadRequestException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common'
import {
  BusinessNotFoundException,
  BusinessBadRequestException,
} from '../../common/exceptions/business.exception'
import { BusinessErrorCode } from '../../common/enums/business-error-code.enum'
import { AttendanceStatus, AuditLogAction, ScheduleStatus } from '@prisma'
import { PrismaService } from '../../common/prisma/prisma.service'
import {
  AttendanceListResponseDto,
  AttendanceRecordDto,
  AttendanceSummaryDto,
} from './dto/attendance-response.dto'
import { OverrideAttendanceDto } from './dto/override-attendance.dto'
import { QueryAttendanceDto } from './dto/query-attendance.dto'
import { StaffCheckInDto } from './dto/staff-check-in.dto'
import { StaffCheckOutDto } from './dto/staff-check-out.dto'
import { StaffDutyProofDto } from './dto/staff-duty-proof.dto'
import { StaffDutyDto, StaffTodayOverviewResponseDto } from './dto/staff-today-response.dto'
import { StaffMonthlySummaryResponseDto } from './dto/staff-monthly-summary-response.dto'
import { QueryStaffAttendanceHistoryDto } from './dto/query-staff-attendance-history.dto'
import {
  StaffAttendanceHistoryItemDto,
  StaffAttendanceHistoryResponseDto,
} from './dto/staff-attendance-history-response.dto'
import { StaffShiftTypeResponseDto } from './dto/staff-shift-type-response.dto'

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Format a Date object to "HH:mm" string (24h)
   */
  private formatTime(date: Date): string {
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  /**
   * Format Date to "YYYY-MM-DD" string
   */
  private formatDateOnly(date: Date): string {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Parse date string "YYYY-MM-DD" to Date at UTC 00:00:00
   */
  private parseDateOnly(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  }

  /**
   * UC-L-22: Query WorkSchedule left-joined Attendance for date range
   */
  async getAttendance(
    boardingHouseId: string,
    query: QueryAttendanceDto,
  ): Promise<AttendanceListResponseDto> {
    this.logger.log(`getAttendance house=${boardingHouseId} query=${JSON.stringify(query)}`)

    const now = new Date()
    const defaultStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
    const defaultEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999))

    const startDate = query.startDate ? this.parseDateOnly(query.startDate) : defaultStart
    const endDate = query.endDate
      ? new Date(this.parseDateOnly(query.endDate).getTime() + 86400000 - 1)
      : defaultEnd

    const where: any = {
      boardingHouseId,
      workDate: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (query.employeeId) {
      where.employeeId = query.employeeId
    }

    if (query.shiftId) {
      where.shiftId = query.shiftId
    }

    if (query.search) {
      const search = query.search.trim()
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
      }
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
    })

    let onTimeCount = 0
    let lateCount = 0
    let absentCount = 0
    let notYetCount = 0

    for (const s of allRangeSchedules) {
      const att = s.attendances[0]
      const st = att ? att.status : AttendanceStatus.not_yet
      if (st === AttendanceStatus.on_time) onTimeCount++
      else if (st === AttendanceStatus.late) lateCount++
      else if (st === AttendanceStatus.absent) absentCount++
      else notYetCount++
    }

    const totalShifts = allRangeSchedules.length
    const evaluatedCount = totalShifts - notYetCount
    const attendanceRate =
      evaluatedCount > 0
        ? Math.round(((onTimeCount + lateCount) / evaluatedCount) * 1000) / 10
        : 100

    const summary: AttendanceSummaryDto = {
      totalShifts,
      onTimeCount,
      lateCount,
      absentCount,
      notYetCount,
      attendanceRate,
    }

    // If query.status filter is active, filter schedules in memory or in query
    let filteredIds: string[] | null = null
    if (query.status) {
      filteredIds = allRangeSchedules
        .filter(s => {
          const att = s.attendances[0]
          const st = att ? att.status : AttendanceStatus.not_yet
          return st === query.status
        })
        .map(s => s.id)

      where.id = { in: filteredIds }
    }

    const page = query.page && query.page > 0 ? query.page : 1
    const limit = query.limit && query.limit > 0 ? query.limit : 10
    const skip = (page - 1) * limit

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
    ])

    const mappedData: AttendanceRecordDto[] = schedules.map(item => {
      const attendance = item.attendances[0]
      const assignment = item.employee.employeeAssignments[0]
      const userName =
        item.employee.user.userIdentification?.fullName ||
        item.employee.user.username ||
        item.employee.user.phoneNumber

      const editedByName = attendance?.editedByUser
        ? attendance.editedByUser.userIdentification?.fullName ||
          attendance.editedByUser.username ||
          'Landlord'
        : null

      return {
        workScheduleId: item.id,
        attendanceId: attendance?.id || null,
        employeeId: item.employeeId,
        employeeName: userName,
        employeePhone: item.employee.user.phoneNumber,
        employeeAvatar: item.employee.user.avatarUrl,
        positionName: assignment?.position?.name || 'Staff',
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
      }
    })

    return {
      data: mappedData,
      summary,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    }
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
    )

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
    })

    if (!schedule) {
      throw new NotFoundException('Work shift not found in this boarding house')
    }

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: { workScheduleId: dto.workScheduleId },
    })

    const checkInDate =
      dto.checkIn !== undefined ? (dto.checkIn ? new Date(dto.checkIn) : null) : undefined
    const checkOutDate =
      dto.checkOut !== undefined ? (dto.checkOut ? new Date(dto.checkOut) : null) : undefined

    const result = await this.prisma.$transaction(async tx => {
      let attRecord

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
        })

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
        })
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
        })

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
        })
      }

      return attRecord
    })

    const assignment = schedule.employee.employeeAssignments[0]
    const userName =
      schedule.employee.user.userIdentification?.fullName ||
      schedule.employee.user.username ||
      schedule.employee.user.phoneNumber

    const editedByName = result.editedByUser
      ? result.editedByUser.userIdentification?.fullName ||
        result.editedByUser.username ||
        'Landlord'
      : 'Landlord'

    return {
      workScheduleId: schedule.id,
      attendanceId: result.id,
      employeeId: schedule.employeeId,
      employeeName: userName,
      employeePhone: schedule.employee.user.phoneNumber,
      employeeAvatar: schedule.employee.user.avatarUrl,
      positionName: assignment?.position?.name || 'Staff',
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
    }
  }

  /**
   * Helper to return default duties based on job position name
   */
  private getDefaultDutiesForPosition(positionName?: string): StaffDutyDto[] {
    const name = (positionName || '').toLowerCase()
    if (name.includes('vệ sinh') || name.includes('tạp vụ') || name.includes('clean')) {
      return [
        {
          id: 'duty-clean-1',
          title: 'Sweep and mop corridor floors for all levels 1 to 4 and stairwells',
          requiresPhoto: true,
          completed: false,
        },
        {
          id: 'duty-clean-2',
          title: 'Collect waste from each floor and transfer to municipal collection point',
          requiresPhoto: true,
          completed: false,
        },
        {
          id: 'duty-clean-3',
          title: 'Clean shared laundry area and ensure washing machines operate normally',
          requiresPhoto: false,
          completed: false,
          note: 'Laundry area well-ventilated, washing machines in good condition',
        },
        {
          id: 'duty-clean-4',
          title: 'Replenish hand soap and sanitizers in ground floor shared restrooms',
          requiresPhoto: true,
          completed: false,
        },
      ]
    }

    if (name.includes('kỹ thuật') || name.includes('bảo trì') || name.includes('maint')) {
      return [
        {
          id: 'duty-maint-1',
          title: 'Check electricity and water meter readings periodically',
          requiresPhoto: true,
          completed: false,
          note: 'Record periodic shift meter readings',
        },
        {
          id: 'duty-maint-2',
          title: 'Check rooftop water pump pressure and solar water heaters',
          requiresPhoto: true,
          completed: false,
        },
        {
          id: 'duty-maint-3',
          title: 'Inspect corridor lighting and fire extinguisher inspection seals',
          requiresPhoto: true,
          completed: false,
        },
        {
          id: 'duty-maint-4',
          title: 'Promptly handle electrical and plumbing issues reported by residents during shift',
          requiresPhoto: false,
          completed: false,
        },
      ]
    }

    // Default: Security & Building Operations
    return [
      {
        id: 'duty-sec-1',
        title: 'Control main gate security and arrange motorbike parking orderly',
        requiresPhoto: true,
        completed: false,
      },
      {
        id: 'duty-sec-2',
        title: 'Check morning gate opening (06:00) and verify automated gate lock function',
        requiresPhoto: true,
        completed: false,
      },
      {
        id: 'duty-sec-3',
        title: 'Monitor security cameras on floors 1, 2, 3 and maintain duty logbook',
        requiresPhoto: false,
        completed: false,
        note: 'Monitoring actively during shift',
      },
      {
        id: 'duty-sec-4',
        title: 'Patrol noise levels, maintain public order, and securely lock gates at night (23:00)',
        requiresPhoto: true,
        completed: false,
      },
    ]
  }

  /**
   * Helper to format response DTO for staff overview
   */
  private buildStaffTodayOverview(
    employee: any,
    schedule: any,
    attendance: any,
    coWorkers: any[],
  ): StaffTodayOverviewResponseDto {
    const activeAssignment = employee.employeeAssignments[0]
    const positionName = activeAssignment?.position?.name || 'Staff'
    const positionDesc = activeAssignment?.position?.description || null
    const positionId = activeAssignment?.position?.id || 'default-pos'

    const defaultDuties = this.getDefaultDutiesForPosition(positionName)
    const duties: StaffDutyDto[] =
      attendance?.dutyTasks && Array.isArray(attendance.dutyTasks)
        ? attendance.dutyTasks
        : defaultDuties

    const staffName =
      employee.user.userIdentification?.fullName ||
      employee.user.username ||
      employee.user.phoneNumber

    const shiftStartTimeStr = this.formatTime(schedule.shift.startTime)
    const shiftEndTimeStr = this.formatTime(schedule.shift.endTime)
    const durationHours = Math.max(
      1,
      Math.round(
        (schedule.shift.endTime.getTime() - schedule.shift.startTime.getTime()) / (1000 * 60 * 60),
      ),
    )

    let totalHours = 0
    let isEarlyCheckOut = false
    if (attendance?.checkIn && attendance?.checkOut) {
      const diffMs = attendance.checkOut.getTime() - attendance.checkIn.getTime()
      totalHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10)
    }

    if (attendance?.checkOut) {
      const [endH, endM] = shiftEndTimeStr.split(':').map(Number)
      const checkOutH = attendance.checkOut.getUTCHours()
      const checkOutM = attendance.checkOut.getUTCMinutes()
      if (checkOutH * 60 + checkOutM < endH * 60 + endM) {
        isEarlyCheckOut = true
      }
    }

    const boardingHouseAddress =
      [
        schedule.boardingHouse.houseNumber,
        schedule.boardingHouse.street,
        schedule.boardingHouse.ward,
        schedule.boardingHouse.district,
        schedule.boardingHouse.city,
      ]
        .filter(Boolean)
        .join(', ') || schedule.boardingHouse.name

    return {
      employeeId: employee.id,
      staffName,
      staffPhone: employee.user.phoneNumber,
      staffAvatar: employee.user.avatarUrl || null,
      schedule: {
        id: schedule.id,
        workDate: this.formatDateOnly(schedule.workDate),
        boardingHouseId: schedule.boardingHouseId,
        boardingHouseName: schedule.boardingHouse.name,
        boardingHouseAddress,
        shift: {
          id: schedule.shift.id,
          name: schedule.shift.name,
          startTime: shiftStartTimeStr,
          endTime: shiftEndTimeStr,
          durationHours,
        },
        position: {
          id: positionId,
          name: positionName,
          description: positionDesc,
        },
        status: schedule.status,
        isRecurring: !!schedule.recurrenceId,
        coWorkers,
        duties,
      },
      attendance: {
        id: attendance?.id || '',
        workScheduleId: schedule.id,
        workDate: this.formatDateOnly(schedule.workDate),
        boardingHouseName: schedule.boardingHouse.name,
        shiftName: schedule.shift.name,
        shiftTime: `${shiftStartTimeStr} - ${shiftEndTimeStr}`,
        checkIn: attendance?.checkIn ? this.formatTime(attendance.checkIn) : null,
        checkOut: attendance?.checkOut ? this.formatTime(attendance.checkOut) : null,
        status: attendance?.status || AttendanceStatus.not_yet,
        totalHours,
        editedByLandlord: !!attendance?.editedBy,
        note: attendance?.note || undefined,
        checkInPhoto: attendance?.checkInPhoto || undefined,
        checkInWatermark: attendance?.checkInWatermark || undefined,
        checkInExplanation: attendance?.checkInExplanation || undefined,
        checkOutPhoto: attendance?.checkOutPhoto || undefined,
        checkOutWatermark: attendance?.checkOutWatermark || undefined,
        checkOutExplanation: attendance?.checkOutExplanation || undefined,
        isEarlyCheckOut,
      },
    }
  }

  /**
   * UC-S-01 & UC-S-02: Get today's staff schedule, attendance, duties and co-workers
   */
  async getTodayStaffAttendance(userId: string): Promise<StaffTodayOverviewResponseDto> {
    this.logger.log(`getTodayStaffAttendance for user ${userId}`)

    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: {
          include: { userIdentification: true },
        },
        employeeAssignments: {
          where: { status: 'active' },
          include: {
            position: true,
            boardingHouse: true,
          },
        },
      },
    })

    if (!employee) {
      throw new NotFoundException('Staff profile not found for this account.')
    }

    const activeAssignment =
      employee.employeeAssignments[0] ||
      (await this.prisma.employeeAssignment.findFirst({
        where: { employeeId: employee.id },
        include: { position: true, boardingHouse: true },
      }))

    if (!activeAssignment) {
      throw new BadRequestException('Staff is not assigned to any boarding house.')
    }

    const now = new Date()
    const todayDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    )
    const todayEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
    )

    let schedule = await this.prisma.workSchedule.findFirst({
      where: {
        employeeId: employee.id,
        workDate: {
          gte: todayDate,
          lte: todayEnd,
        },
      },
      include: {
        shift: true,
        boardingHouse: true,
        attendances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!schedule) {
      let shift = await this.prisma.shift.findFirst({
        where: { boardingHouseId: activeAssignment.boardingHouseId },
      })

      if (!shift) {
        shift = await this.prisma.shift.create({
          data: {
            boardingHouseId: activeAssignment.boardingHouseId,
            name: 'Morning Shift (07:00 - 15:00)',
            startTime: new Date('1970-01-01T07:00:00Z'),
            endTime: new Date('1970-01-01T15:00:00Z'),
          },
        })
      }

      schedule = await this.prisma.workSchedule.create({
        data: {
          employeeId: employee.id,
          boardingHouseId: activeAssignment.boardingHouseId,
          shiftId: shift.id,
          workDate: todayDate,
          status: ScheduleStatus.scheduled,
        },
        include: {
          shift: true,
          boardingHouse: true,
          attendances: true,
        },
      })
    }

    let attendance = schedule.attendances?.[0]
    if (!attendance) {
      const initialDuties = this.getDefaultDutiesForPosition(activeAssignment.position?.name)
      attendance = await this.prisma.attendance.create({
        data: {
          workScheduleId: schedule.id,
          employeeId: employee.id,
          status: AttendanceStatus.not_yet,
          dutyTasks: initialDuties as any,
        },
      })
    }

    const coWorkerAssignments = await this.prisma.employeeAssignment.findMany({
      where: {
        boardingHouseId: schedule.boardingHouseId,
        status: 'active',
        employeeId: { not: employee.id },
      },
      include: {
        employee: {
          include: {
            user: {
              include: { userIdentification: true },
            },
          },
        },
        position: true,
      },
      take: 10,
    })

    const coWorkers = coWorkerAssignments.map(a => ({
      id: a.employee.id,
      name:
        a.employee.user.userIdentification?.fullName ||
        a.employee.user.username ||
        a.employee.user.phoneNumber,
      phone: a.employee.user.phoneNumber,
      positionName: a.position?.name || 'Staff',
      avatar: a.employee.user.avatarUrl || null,
    }))

    return this.buildStaffTodayOverview(employee, schedule, attendance, coWorkers)
  }

  /**
   * UC-S-02: Staff Check-in with photo proof, GPS watermark and optional late explanation
   */
  async staffCheckIn(
    userId: string,
    dto: StaffCheckInDto,
    ipAddress: string,
  ): Promise<StaffTodayOverviewResponseDto> {
    this.logger.log(`staffCheckIn for user ${userId}, schedule ${dto.workScheduleId}`)

    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    })
    if (!employee) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.ATTEND_STAFF_PROFILE_NOT_FOUND,
        'Staff profile not found.',
      )
    }

    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: dto.workScheduleId },
      include: {
        shift: true,
        boardingHouse: true,
      },
    })

    if (!schedule || schedule.employeeId !== employee.id) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.ATTEND_SCHEDULE_NOT_FOUND,
        'Work schedule not found or does not belong to you.',
      )
    }

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        workScheduleId: dto.workScheduleId,
        employeeId: employee.id,
      },
    })

    if (existingAttendance?.checkIn) {
      throw new BusinessBadRequestException(
        BusinessErrorCode.ATTEND_ALREADY_CHECKED_IN,
        'You have already checked in for this shift.',
      )
    }

    const now = new Date()
    let h: number
    let m: number
    if (dto.capturedTime) {
      const [parsedH, parsedM] = dto.capturedTime.split(':').map(Number)
      h = parsedH || 0
      m = parsedM || 0
    } else {
      // Vietnam UTC+7
      h = (now.getUTCHours() + 7) % 24
      m = now.getUTCMinutes()
    }

    const checkInDate = new Date(
      Date.UTC(
        schedule.workDate.getUTCFullYear(),
        schedule.workDate.getUTCMonth(),
        schedule.workDate.getUTCDate(),
        h,
        m,
        now.getUTCSeconds(),
        0,
      ),
    )

    const [startH, startM] = this.formatTime(schedule.shift.startTime).split(':').map(Number)
    const shiftStartMinutes = startH * 60 + startM
    const checkInMinutes = h * 60 + m
    const isLate = checkInMinutes > shiftStartMinutes
    const newStatus = isLate ? AttendanceStatus.late : AttendanceStatus.on_time

    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const boardingHouseAddress =
      [
        schedule.boardingHouse.houseNumber,
        schedule.boardingHouse.street,
        schedule.boardingHouse.ward,
        schedule.boardingHouse.district,
        schedule.boardingHouse.city,
      ]
        .filter(Boolean)
        .join(', ') || schedule.boardingHouse.name
    const placeStr = dto.watermark?.place || boardingHouseAddress
    const note = isLate
      ? `Late check-in at ${timeStr} at ${placeStr}. Explanation: "${dto.explanation || 'None'}"`
      : `On-time check-in at ${timeStr} at ${placeStr}.`

    await this.prisma.$transaction(async tx => {
      let recordId: string
      if (existingAttendance) {
        const updated = await tx.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            checkIn: checkInDate,
            status: newStatus,
            checkInPhoto: dto.photo || null,
            checkInWatermark: (dto.watermark as any) || null,
            checkInExplanation: dto.explanation || null,
            note,
          },
        })
        recordId = updated.id
      } else {
        const created = await tx.attendance.create({
          data: {
            workScheduleId: dto.workScheduleId,
            employeeId: employee.id,
            checkIn: checkInDate,
            status: newStatus,
            checkInPhoto: dto.photo || null,
            checkInWatermark: (dto.watermark as any) || null,
            checkInExplanation: dto.explanation || null,
            note,
          },
        })
        recordId = created.id
      }

      // Rule 4: AuditLog in same transaction
      await tx.auditLog.create({
        data: {
          userId,
          boardingHouseId: schedule.boardingHouseId,
          action: AuditLogAction.update,
          entityType: 'ATTENDANCE',
          entityId: recordId,
          oldValue: existingAttendance
            ? { status: existingAttendance.status, checkIn: existingAttendance.checkIn }
            : { status: AttendanceStatus.not_yet },
          newValue: {
            status: newStatus,
            checkIn: checkInDate,
            capturedTime: timeStr,
            checkInExplanation: dto.explanation || null,
          },
          ipAddress,
        },
      })
    })

    return this.getTodayStaffAttendance(userId)
  }

  /**
   * UC-S-02: Staff Check-out with photo proof, GPS watermark and optional early explanation
   */
  async staffCheckOut(
    userId: string,
    dto: StaffCheckOutDto,
    ipAddress: string,
  ): Promise<StaffTodayOverviewResponseDto> {
    this.logger.log(`staffCheckOut for user ${userId}, schedule ${dto.workScheduleId}`)

    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    })
    if (!employee) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.ATTEND_STAFF_PROFILE_NOT_FOUND,
        'Staff profile not found.',
      )
    }

    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: dto.workScheduleId },
      include: {
        shift: true,
        boardingHouse: true,
      },
    })

    if (!schedule || schedule.employeeId !== employee.id) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.ATTEND_SCHEDULE_NOT_FOUND,
        'Work schedule not found or does not belong to you.',
      )
    }

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        workScheduleId: dto.workScheduleId,
        employeeId: employee.id,
      },
    })

    if (!attendance || !attendance.checkIn) {
      throw new BusinessBadRequestException(
        BusinessErrorCode.ATTEND_NOT_CHECKED_IN,
        'You need to check in before checking out.',
      )
    }

    if (attendance.checkOut) {
      throw new BusinessBadRequestException(
        BusinessErrorCode.ATTEND_ALREADY_CHECKED_OUT,
        'You have already completed check-out for this shift.',
      )
    }

    const now = new Date()
    let h: number
    let m: number
    if (dto.capturedTime) {
      const [parsedH, parsedM] = dto.capturedTime.split(':').map(Number)
      h = parsedH || 0
      m = parsedM || 0
    } else {
      // Vietnam UTC+7
      h = (now.getUTCHours() + 7) % 24
      m = now.getUTCMinutes()
    }

    const checkOutDate = new Date(
      Date.UTC(
        schedule.workDate.getUTCFullYear(),
        schedule.workDate.getUTCMonth(),
        schedule.workDate.getUTCDate(),
        h,
        m,
        now.getUTCSeconds(),
        0,
      ),
    )

    const [endH, endM] = this.formatTime(schedule.shift.endTime).split(':').map(Number)
    const shiftEndMinutes = endH * 60 + endM
    const checkOutMinutes = h * 60 + m
    const isEarly = checkOutMinutes < shiftEndMinutes

    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const boardingHouseAddress =
      [
        schedule.boardingHouse.houseNumber,
        schedule.boardingHouse.street,
        schedule.boardingHouse.ward,
        schedule.boardingHouse.district,
        schedule.boardingHouse.city,
      ]
        .filter(Boolean)
        .join(', ') || schedule.boardingHouse.name
    const placeStr = dto.watermark?.place || boardingHouseAddress
    const appendNote = isEarly
      ? `Early check-out at ${timeStr} at ${placeStr}. Explanation: "${dto.explanation || 'None'}"`
      : `Check-out completed at ${timeStr} at ${placeStr}.`
    const combinedNote = attendance.note ? `${attendance.note} | ${appendNote}` : appendNote

    await this.prisma.$transaction(async tx => {
      await tx.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: checkOutDate,
          checkOutPhoto: dto.photo || null,
          checkOutWatermark: (dto.watermark as any) || null,
          checkOutExplanation: dto.explanation || null,
          note: combinedNote,
        },
      })

      // Rule 4: AuditLog in same transaction
      await tx.auditLog.create({
        data: {
          userId,
          boardingHouseId: schedule.boardingHouseId,
          action: AuditLogAction.update,
          entityType: 'ATTENDANCE',
          entityId: attendance.id,
          oldValue: { checkOut: attendance.checkOut, status: attendance.status },
          newValue: {
            checkOut: checkOutDate,
            capturedTime: timeStr,
            checkOutExplanation: dto.explanation || null,
            isEarly,
          },
          ipAddress,
        },
      })
    })

    return this.getTodayStaffAttendance(userId)
  }

  /**
   * UC-S-01: Update Duty Task Proof and Progress
   */
  async saveStaffDutyProof(
    userId: string,
    dto: StaffDutyProofDto,
  ): Promise<StaffTodayOverviewResponseDto> {
    this.logger.log(`saveStaffDutyProof for user ${userId}, task ${dto.dutyId}`)

    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        employeeAssignments: {
          where: { status: 'active' },
          include: { position: true },
        },
      },
    })

    if (!employee) {
      throw new NotFoundException('Staff profile not found.')
    }

    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: dto.workScheduleId },
    })

    if (!schedule || schedule.employeeId !== employee.id) {
      throw new NotFoundException('Invalid work schedule.')
    }

    let attendance = await this.prisma.attendance.findFirst({
      where: {
        workScheduleId: dto.workScheduleId,
        employeeId: employee.id,
      },
    })

    const activeAssignment = employee.employeeAssignments[0]
    const defaultDuties = this.getDefaultDutiesForPosition(activeAssignment?.position?.name)

    if (!attendance) {
      attendance = await this.prisma.attendance.create({
        data: {
          workScheduleId: dto.workScheduleId,
          employeeId: employee.id,
          status: AttendanceStatus.not_yet,
          dutyTasks: defaultDuties as any,
        },
      })
    }

    const duties: StaffDutyDto[] =
      attendance.dutyTasks && Array.isArray(attendance.dutyTasks)
        ? (attendance.dutyTasks as unknown as StaffDutyDto[])
        : defaultDuties

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
    const fullProofTimeStr = `${timeStr}:${String(now.getSeconds()).padStart(2, '0')} - ${dateStr}`

    const updatedDuties = duties.map(duty => {
      if (duty.id === dto.dutyId) {
        const isCompleted = dto.markCompleted !== undefined ? dto.markCompleted : duty.completed
        return {
          ...duty,
          photoProof: dto.photo || duty.photoProof,
          photoProofTime: dto.photo ? fullProofTimeStr : duty.photoProofTime,
          note: dto.note !== undefined ? dto.note : duty.note,
          completed: isCompleted,
          completedAt: isCompleted ? duty.completedAt || timeStr : undefined,
        }
      }
      return duty
    })

    await this.prisma.$transaction(async tx => {
      await tx.attendance.update({
        where: { id: attendance.id },
        data: {
          dutyTasks: updatedDuties as any,
        },
      })

      // Rule 4: AuditLog in same transaction
      await tx.auditLog.create({
        data: {
          userId,
          boardingHouseId: schedule.boardingHouseId,
          action: AuditLogAction.update,
          entityType: 'ATTENDANCE',
          entityId: attendance.id,
          oldValue: { dutyTasks: attendance.dutyTasks as any },
          newValue: { dutyTasks: updatedDuties as any, dutyId: dto.dutyId },
          ipAddress: '127.0.0.1',
        },
      })
    })

    return this.getTodayStaffAttendance(userId)
  }

  /**
   * UC-S-01: Get monthly attendance summary metrics for logged-in staff
   */
  async getStaffMonthlySummary(
    userId: string,
    month?: string,
  ): Promise<StaffMonthlySummaryResponseDto> {
    this.logger.log(
      `getStaffMonthlySummary for user ${userId}, requested month: ${month || 'current'}`,
    )

    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    })

    if (!employee) {
      throw new NotFoundException('Staff profile not found for this account.')
    }

    let targetYear: number
    let targetMonth: number // 0-indexed for Date
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number)
      targetYear = y
      targetMonth = m - 1
    } else {
      const now = new Date()
      targetYear = now.getUTCFullYear()
      targetMonth = now.getUTCMonth()
    }

    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0))
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999))
    const monthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`

    const schedules = await this.prisma.workSchedule.findMany({
      where: {
        employeeId: employee.id,
        workDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        shift: true,
        attendances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    let totalHours = 0
    let onTimeCount = 0
    let lateCount = 0
    let earlyCount = 0

    for (const item of schedules) {
      const att = item.attendances?.[0]
      if (!att) continue

      if (att.status === AttendanceStatus.on_time) {
        onTimeCount++
      } else if (att.status === AttendanceStatus.late) {
        lateCount++
      }

      if (att.checkIn && att.checkOut) {
        const diffMs = att.checkOut.getTime() - att.checkIn.getTime()
        const hours = Math.max(0, diffMs / (1000 * 60 * 60))
        totalHours += hours

        const shiftEndTimeStr = this.formatTime(item.shift.endTime)
        const [endH, endM] = shiftEndTimeStr.split(':').map(Number)
        const checkOutH = att.checkOut.getUTCHours()
        const checkOutM = att.checkOut.getUTCMinutes()
        if (checkOutH * 60 + checkOutM < endH * 60 + endM) {
          earlyCount++
        }
      } else if (att.checkOutExplanation) {
        earlyCount++
      }
    }

    const totalAttended = onTimeCount + lateCount
    const onTimeRate =
      totalAttended > 0 ? Math.round((onTimeCount / totalAttended) * 1000) / 10 : 100

    return {
      month: monthKey,
      totalShifts: schedules.length,
      totalHours: Math.round(totalHours * 10) / 10,
      onTimeRate,
      onTimeCount,
      lateCount,
      earlyCount,
    }
  }

  /**
   * UC-S-01: Get distinct shifts available for the logged-in staff member
   */
  async getStaffShifts(userId: string): Promise<StaffShiftTypeResponseDto[]> {
    this.logger.log(`getStaffShifts for userId=${userId}`)

    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        employeeAssignments: {
          where: { status: 'active' },
          select: { boardingHouseId: true },
        },
      },
    })

    if (!employee) {
      throw new NotFoundException('Staff profile not found for this account.')
    }

    const assignedHouseIds = employee.employeeAssignments.map(a => a.boardingHouseId)

    // Fetch shifts from assigned boarding houses
    let shiftsFromHouses = await this.prisma.shift.findMany({
      where: {
        boardingHouseId: { in: assignedHouseIds },
      },
      orderBy: { startTime: 'asc' },
    })

    // Auto-seed default shifts if none exist yet for the active assigned properties
    if (shiftsFromHouses.length === 0 && assignedHouseIds.length > 0) {
      const houseId = assignedHouseIds[0]
      this.logger.log(`Auto-seeding default shifts for house ${houseId}`)
      await Promise.all([
        this.prisma.shift.create({
          data: {
            boardingHouseId: houseId,
            name: 'Morning Shift (07:00 - 15:00)',
            startTime: new Date('1970-01-01T07:00:00Z'),
            endTime: new Date('1970-01-01T15:00:00Z'),
          },
        }),
        this.prisma.shift.create({
          data: {
            boardingHouseId: houseId,
            name: 'Afternoon Shift (15:00 - 23:00)',
            startTime: new Date('1970-01-01T15:00:00Z'),
            endTime: new Date('1970-01-01T23:00:00Z'),
          },
        }),
        this.prisma.shift.create({
          data: {
            boardingHouseId: houseId,
            name: 'Night Shift (23:00 - 07:00)',
            startTime: new Date('1970-01-01T23:00:00Z'),
            endTime: new Date('1970-01-01T07:00:00Z'),
          },
        }),
      ])

      shiftsFromHouses = await this.prisma.shift.findMany({
        where: {
          boardingHouseId: { in: assignedHouseIds },
        },
        orderBy: { startTime: 'asc' },
      })
    }

    const shiftMap = new Map<string, StaffShiftTypeResponseDto>()

    for (const s of shiftsFromHouses) {
      shiftMap.set(s.id, {
        id: s.id,
        name: s.name,
        startTime: this.formatTime(s.startTime),
        endTime: this.formatTime(s.endTime),
      })
    }

    // Also include any shifts from employee's schedules (e.g. historical or cross-house)
    const schedules = await this.prisma.workSchedule.findMany({
      where: { employeeId: employee.id },
      select: { shift: true },
      take: 100,
    })

    for (const item of schedules) {
      if (item.shift && !shiftMap.has(item.shift.id)) {
        shiftMap.set(item.shift.id, {
          id: item.shift.id,
          name: item.shift.name,
          startTime: this.formatTime(item.shift.startTime),
          endTime: this.formatTime(item.shift.endTime),
        })
      }
    }

    return Array.from(shiftMap.values())
  }

  /**
   * UC-S-01 & UC-S-02: Get paginated timesheet history, metrics, and photo watermark data for staff
   */
  async getStaffAttendanceHistory(
    userId: string,
    query: QueryStaffAttendanceHistoryDto,
  ): Promise<StaffAttendanceHistoryResponseDto> {
    this.logger.log(
      `getStaffAttendanceHistory for userId=${userId}, query=${JSON.stringify(query)}`,
    )

    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    })

    if (!employee) {
      throw new NotFoundException('Staff profile not found for this account.')
    }

    const where: any = {
      employeeId: employee.id,
      status: { not: ScheduleStatus.canceled },
    }

    if (query.startDate && query.endDate) {
      where.workDate = {
        gte: this.parseDateOnly(query.startDate),
        lte: new Date(this.parseDateOnly(query.endDate).getTime() + 86400000 - 1),
      }
    } else if (query.startDate) {
      where.workDate = {
        gte: this.parseDateOnly(query.startDate),
      }
    } else if (query.endDate) {
      where.workDate = {
        lte: new Date(this.parseDateOnly(query.endDate).getTime() + 86400000 - 1),
      }
    }

    const allSchedules = await this.prisma.workSchedule.findMany({
      where,
      include: {
        shift: true,
        boardingHouse: true,
        attendances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ workDate: 'desc' }, { shift: { startTime: 'asc' } }],
    })

    const now = new Date()
    const todayDateStr = this.formatDateOnly(now)

    let onTimeCount = 0
    let lateCount = 0
    let absentCount = 0
    let totalWorkHours = 0

    const allItems: StaffAttendanceHistoryItemDto[] = allSchedules.map(item => {
      const att = item.attendances?.[0]
      const workDateStr = this.formatDateOnly(item.workDate)

      // Status resolution
      let itemStatus: string
      if (att?.status) {
        itemStatus = att.status
      } else if (workDateStr < todayDateStr) {
        itemStatus = 'absent'
      } else {
        itemStatus = 'not_yet'
      }

      // Hours & early checkout calculation
      let hours = 0
      let isEarlyCheckOut = false
      if (att?.checkIn && att?.checkOut) {
        const diffMs = att.checkOut.getTime() - att.checkIn.getTime()
        hours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10)

        const shiftEndTimeStr = this.formatTime(item.shift.endTime)
        const [endH, endM] = shiftEndTimeStr.split(':').map(Number)
        const checkOutH = att.checkOut.getUTCHours()
        const checkOutM = att.checkOut.getUTCMinutes()
        if (checkOutH * 60 + checkOutM < endH * 60 + endM) {
          isEarlyCheckOut = true
        }
      } else if (att?.checkOutExplanation) {
        isEarlyCheckOut = true
      }

      // Accumulate metrics
      if (itemStatus === 'on_time') onTimeCount++
      else if (itemStatus === 'late') lateCount++
      else if (itemStatus === 'absent') absentCount++
      totalWorkHours += hours

      const shiftStartStr = this.formatTime(item.shift.startTime)
      const shiftEndStr = this.formatTime(item.shift.endTime)

      return {
        id: att?.id || item.id,
        workScheduleId: item.id,
        workDate: workDateStr,
        boardingHouseName: item.boardingHouse.name,
        shiftName: item.shift.name,
        shiftTime: `${shiftStartStr} - ${shiftEndStr}`,
        checkIn: att?.checkIn ? this.formatTime(att.checkIn) : null,
        checkOut: att?.checkOut ? this.formatTime(att.checkOut) : null,
        status: itemStatus,
        totalHours: hours,
        editedByLandlord: !!att?.editedBy,
        note: att?.note || null,
        checkInPhoto: att?.checkInPhoto || null,
        checkInWatermark: (att?.checkInWatermark as any) || null,
        checkInExplanation: att?.checkInExplanation || null,
        checkOutPhoto: att?.checkOutPhoto || null,
        checkOutWatermark: (att?.checkOutWatermark as any) || null,
        checkOutExplanation: att?.checkOutExplanation || null,
        isEarlyCheckOut,
      }
    })

    const summary = {
      total: allSchedules.length,
      onTime: onTimeCount,
      late: lateCount,
      absent: absentCount,
      hours: (Math.round(totalWorkHours * 10) / 10).toFixed(1),
    }

    // Filter by status if specified
    let filteredItems = allItems
    if (query.status && query.status !== 'all') {
      filteredItems = filteredItems.filter(i => i.status === query.status)
    }

    // Filter by search keyword (date, shift, property)
    if (query.search) {
      const q = query.search.trim().toLowerCase()
      filteredItems = filteredItems.filter(
        i =>
          i.workDate.toLowerCase().includes(q) ||
          i.shiftName.toLowerCase().includes(q) ||
          i.boardingHouseName.toLowerCase().includes(q),
      )
    }

    // Filter by specific work date if specified
    if (query.date && query.date.trim()) {
      const targetDate = query.date.trim()
      filteredItems = filteredItems.filter(i => i.workDate.includes(targetDate))
    }

    // Filter by shift name if specified
    if (query.shiftName && query.shiftName !== 'all' && query.shiftName.trim()) {
      const targetShift = query.shiftName.trim().toLowerCase()
      filteredItems = filteredItems.filter(i => i.shiftName.toLowerCase().includes(targetShift))
    }

    // Pagination (Rule #9)
    const page = query.page && query.page > 0 ? query.page : 1
    const limit = query.limit && query.limit > 0 ? query.limit : 10
    const total = filteredItems.length
    const totalPages = Math.ceil(total / limit) || 1
    const startIndex = (page - 1) * limit
    const data = filteredItems.slice(startIndex, startIndex + limit)

    return {
      data,
      summary,
      page,
      limit,
      total,
      totalPages,
    }
  }
}
