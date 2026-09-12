import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import {
  AttendanceListResponseDto,
  AttendanceRecordDto,
} from './dto/attendance-response.dto';
import { OverrideAttendanceDto } from './dto/override-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { AttendanceService } from './attendance.service';

@ApiTags('Landlord - Attendance Management (UC-L-22)')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Boarding-House-Id',
  description: 'Active boarding house ID context',
  required: true,
})
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@Controller('landlord/attendance')
export class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);

  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({
    summary: 'UC-L-22: Query attendance records with shift correlation',
    description:
      'Returns WorkSchedule items left-joined with Attendance for the requested date range, including summary metrics (on-time, late, absent, attendance rate).',
  })
  @ApiOkResponse({
    type: AttendanceListResponseDto,
    description: 'List of attendance records with statistics summary',
  })
  async getAttendance(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Query() query: QueryAttendanceDto,
  ): Promise<AttendanceListResponseDto> {
    this.logger.log(
      `GET /v1/landlord/attendance house=${boardingHouseId} query=${JSON.stringify(query)}`,
    );
    return this.attendanceService.getAttendance(boardingHouseId, query);
  }

  @Patch('override')
  @ApiOperation({
    summary: 'UC-L-22: Manual override of staff attendance',
    description:
      'Manually updates or creates an Attendance record for a WorkSchedule (not_yet | on_time | late | absent). Logs mutation in AuditLog inside the same database transaction.',
  })
  @ApiBody({ type: OverrideAttendanceDto })
  @ApiOkResponse({
    type: AttendanceRecordDto,
    description: 'Updated or created attendance record with audit trail',
  })
  async overrideAttendance(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: OverrideAttendanceDto,
    @Req() req: Request,
  ): Promise<AttendanceRecordDto> {
    this.logger.log(
      `PATCH /v1/landlord/attendance/override house=${boardingHouseId} schedule=${dto.workScheduleId} user=${user.id} status=${dto.status}`,
    );
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    return this.attendanceService.overrideAttendance(
      boardingHouseId,
      user.id,
      dto,
      ipAddress,
    );
  }
}
