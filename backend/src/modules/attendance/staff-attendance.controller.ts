import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { AttendanceService } from './attendance.service';
import { StaffCheckInDto } from './dto/staff-check-in.dto';
import { StaffCheckOutDto } from './dto/staff-check-out.dto';
import { StaffDutyProofDto } from './dto/staff-duty-proof.dto';
import { StaffTodayOverviewResponseDto } from './dto/staff-today-response.dto';
import { StaffMonthlySummaryResponseDto } from './dto/staff-monthly-summary-response.dto';
import { QueryStaffMonthlyDto } from './dto/query-staff-monthly.dto';
import { QueryStaffAttendanceHistoryDto } from './dto/query-staff-attendance-history.dto';
import { StaffAttendanceHistoryResponseDto } from './dto/staff-attendance-history-response.dto';
import { StaffShiftTypeResponseDto } from './dto/staff-shift-type-response.dto';

@ApiTags('Staff Attendance (UC-S-01 & UC-S-02)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff/attendance')
export class StaffAttendanceController {
  private readonly logger = new Logger(StaffAttendanceController.name);

  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('today')
  @ApiOperation({
    summary: "UC-S-01: Get today's work schedule, attendance, co-workers and duties for logged-in staff",
    description:
      'Retrieves the active work schedule for the current date, existing attendance status, shift colleagues, and daily duty checklist.',
  })
  @ApiOkResponse({
    type: StaffTodayOverviewResponseDto,
    description: 'Current day schedule, attendance record and duties',
  })
  async getTodayOverview(
    @CurrentUser() user: JwtPayload,
  ): Promise<StaffTodayOverviewResponseDto> {
    this.logger.log(`Staff user ${user.id} requested today attendance overview`);
    return this.attendanceService.getTodayStaffAttendance(user.id);
  }

  @Get('monthly-summary')
  @ApiOperation({
    summary: "UC-S-01: Get logged-in staff's monthly attendance summary metrics",
    description:
      'Returns aggregate work stats (total shifts, total hours, on-time rate, late count, early checkout count) for the specified or current month.',
  })
  @ApiOkResponse({
    type: StaffMonthlySummaryResponseDto,
    description: 'Monthly attendance summary metrics',
  })
  async getMonthlySummary(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryStaffMonthlyDto,
  ): Promise<StaffMonthlySummaryResponseDto> {
    this.logger.log(
      `Staff user ${user.id} requested monthly attendance summary for ${query.month || 'current month'}`,
    );
    return this.attendanceService.getStaffMonthlySummary(user.id, query.month);
  }

  @Get('history')
  @ApiOperation({
    summary:
      'UC-S-01 & UC-S-02: Get paginated timesheet history, attendance metrics, and photo watermark data for staff',
    description:
      'Retrieves clock-in/out records with filtering (search, status, date range), overall punctuality metrics, photo proofs and GPS audit watermarks.',
  })
  @ApiOkResponse({
    type: StaffAttendanceHistoryResponseDto,
    description: 'Paginated timesheet records and summary metrics',
  })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryStaffAttendanceHistoryDto,
  ): Promise<StaffAttendanceHistoryResponseDto> {
    this.logger.log(
      `Staff user ${user.id} requested attendance history page=${query.page || 1} limit=${query.limit || 10} search=${query.search || ''} status=${query.status || 'all'}`,
    );
    return this.attendanceService.getStaffAttendanceHistory(user.id, query);
  }

  @Get('shifts')
  @ApiOperation({
    summary: 'UC-S-01: Get distinct shift types for logged-in staff member',
    description:
      'Retrieves the shift definitions configured for the staff member\'s assigned properties and work schedules.',
  })
  @ApiOkResponse({
    type: [StaffShiftTypeResponseDto],
    description: 'List of available shift types for the staff member',
  })
  async getShifts(
    @CurrentUser() user: JwtPayload,
  ): Promise<StaffShiftTypeResponseDto[]> {
    this.logger.log(`Staff user ${user.id} requested available shift types`);
    return this.attendanceService.getStaffShifts(user.id);
  }

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-S-02: Submit staff check-in with GPS photo watermark and explanation',
    description:
      'Validates shift window, records check-in timestamp with photo and watermark, sets on_time or late status, and updates audit log.',
  })
  @ApiOkResponse({
    type: StaffTodayOverviewResponseDto,
    description: 'Updated attendance overview after successful check-in',
  })
  async checkIn(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StaffCheckInDto,
    @Req() req: Request,
  ): Promise<StaffTodayOverviewResponseDto> {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    this.logger.log(
      `Staff user ${user.id} submitting check-in for schedule ${dto.workScheduleId} from IP ${ipAddress}`,
    );
    return this.attendanceService.staffCheckIn(user.id, dto, ipAddress);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-S-02: Submit staff check-out with GPS photo watermark and early explanation',
    description:
      'Validates shift completion, records check-out timestamp, calculates working hours, and updates audit log.',
  })
  @ApiOkResponse({
    type: StaffTodayOverviewResponseDto,
    description: 'Updated attendance overview after successful check-out',
  })
  async checkOut(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StaffCheckOutDto,
    @Req() req: Request,
  ): Promise<StaffTodayOverviewResponseDto> {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    this.logger.log(
      `Staff user ${user.id} submitting check-out for schedule ${dto.workScheduleId} from IP ${ipAddress}`,
    );
    return this.attendanceService.staffCheckOut(user.id, dto, ipAddress);
  }

  @Post('duty-proof')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-S-01: Submit photo proof and progress note for duty task',
    description:
      'Attaches photo proof and completion status to a duty task item within the current attendance session.',
  })
  @ApiOkResponse({
    type: StaffTodayOverviewResponseDto,
    description: 'Updated attendance overview with updated duty checklist',
  })
  async saveDutyProof(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StaffDutyProofDto,
  ): Promise<StaffTodayOverviewResponseDto> {
    this.logger.log(
      `Staff user ${user.id} updating duty proof for task ${dto.dutyId}`,
    );
    return this.attendanceService.saveStaffDutyProof(user.id, dto);
  }
}

