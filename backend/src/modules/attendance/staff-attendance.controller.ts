import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
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

