import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
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
import { SchedulesService } from './schedules.service';

@ApiTags('Landlord - Shift Scheduling (UC-L-21)')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Boarding-House-Id',
  description: 'Active boarding house ID context',
  required: true,
})
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@Controller('landlord')
export class SchedulesController {
  private readonly logger = new Logger(SchedulesController.name);

  constructor(private readonly schedulesService: SchedulesService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // SHIFTS ENDPOINTS
  // ───────────────────────────────────────────────────────────────────────────

  @Get('shifts')
  @ApiOperation({
    summary: 'Get all shifts for this boarding house',
    description:
      'Returns shifts configured for the property. Automatically seeds default standard shifts if none exist.',
  })
  @ApiOkResponse({
    type: [ShiftItemDto],
    description: 'List of shifts for the property',
  })
  async getShifts(
    @Headers('x-boarding-house-id') boardingHouseId: string,
  ): Promise<ShiftItemDto[]> {
    this.logger.log(`GET /v1/landlord/shifts house=${boardingHouseId}`);
    return this.schedulesService.getShifts(boardingHouseId);
  }

  @Post('shifts')
  @ApiOperation({
    summary: 'Create a new shift',
    description: 'Creates a custom shift definition for this boarding house.',
  })
  @ApiBody({ type: CreateShiftDto })
  @ApiCreatedResponse({
    type: ShiftItemDto,
    description: 'Created shift details',
  })
  async createShift(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: CreateShiftDto,
  ): Promise<ShiftItemDto> {
    this.logger.log(
      `POST /v1/landlord/shifts house=${boardingHouseId} name="${dto.name}"`,
    );
    return this.schedulesService.createShift(boardingHouseId, dto);
  }

  @Patch('shifts/:id')
  @ApiOperation({
    summary: 'Update an existing shift',
    description: 'Updates shift name or start/end times.',
  })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  @ApiBody({ type: UpdateShiftDto })
  @ApiOkResponse({
    type: ShiftItemDto,
    description: 'Updated shift details',
  })
  async updateShift(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) shiftId: string,
    @Body() dto: UpdateShiftDto,
  ): Promise<ShiftItemDto> {
    this.logger.log(
      `PATCH /v1/landlord/shifts/${shiftId} house=${boardingHouseId}`,
    );
    return this.schedulesService.updateShift(boardingHouseId, shiftId, dto);
  }

  @Delete('shifts/:id')
  @ApiOperation({
    summary: 'Delete a shift',
    description:
      'Deletes a shift definition. Rejects if active scheduled shifts are referencing it.',
  })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  @ApiOkResponse({ description: 'Shift successfully deleted' })
  async deleteShift(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) shiftId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `DELETE /v1/landlord/shifts/${shiftId} house=${boardingHouseId}`,
    );
    await this.schedulesService.deleteShift(boardingHouseId, shiftId);
    return { success: true, message: 'Đã xóa ca làm việc thành công' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCHEDULES ENDPOINTS (UC-L-21)
  // ───────────────────────────────────────────────────────────────────────────

  @Get('schedules')
  @ApiOperation({
    summary: 'UC-L-21: Query work schedules with calendar or list filtering',
    description:
      'Returns scheduled work shifts for the property within the requested date range, including recurring indicator and summary stats.',
  })
  @ApiOkResponse({
    type: SchedulesListResponseDto,
    description: 'Paginated / range schedules list with summary statistics',
  })
  async getSchedules(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Query() query: QuerySchedulesDto,
  ): Promise<SchedulesListResponseDto> {
    this.logger.log(
      `GET /v1/landlord/schedules house=${boardingHouseId} query=${JSON.stringify(query)}`,
    );
    return this.schedulesService.getSchedules(boardingHouseId, query);
  }

  @Post('schedules/recurring')
  @ApiOperation({
    summary: 'UC-L-21 Step 2: Create recurring schedule with materialized dates',
    description:
      'Creates a RecurrencePattern and materializes every matching date in the date range as individual WorkSchedule rows.',
  })
  @ApiBody({ type: CreateRecurringScheduleDto })
  @ApiCreatedResponse({
    type: CreateRecurringResponseDto,
    description: 'Summary of created pattern and materialized schedule rows',
  })
  async createRecurringSchedule(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRecurringScheduleDto,
  ): Promise<CreateRecurringResponseDto> {
    this.logger.log(
      `POST /v1/landlord/schedules/recurring house=${boardingHouseId} user=${user.id}`,
    );
    return this.schedulesService.createRecurringSchedule(
      boardingHouseId,
      user.id,
      dto,
    );
  }

  @Post('schedules/adhoc')
  @ApiOperation({
    summary: 'UC-L-21: Create ad-hoc schedule',
    description:
      'Inserts a single WorkSchedule row with recurrenceId = null for non-recurring or on-demand tasks.',
  })
  @ApiBody({ type: CreateAdhocScheduleDto })
  @ApiCreatedResponse({
    type: WorkScheduleItemDto,
    description: 'Created ad-hoc work schedule item',
  })
  async createAdhocSchedule(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: CreateAdhocScheduleDto,
  ): Promise<WorkScheduleItemDto> {
    this.logger.log(
      `POST /v1/landlord/schedules/adhoc house=${boardingHouseId} employee=${dto.employeeId}`,
    );
    return this.schedulesService.createAdhocSchedule(boardingHouseId, dto);
  }

  @Patch('schedules/:id')
  @ApiOperation({
    summary: 'UC-L-21: Edit a single occurrence',
    description:
      'Updates a single WorkSchedule occurrence. The recurrenceId is preserved for traceability while this row is independently updated.',
  })
  @ApiParam({ name: 'id', description: 'WorkSchedule UUID' })
  @ApiBody({ type: UpdateScheduleDto })
  @ApiOkResponse({
    type: WorkScheduleItemDto,
    description: 'Updated work schedule occurrence',
  })
  async updateSchedule(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) scheduleId: string,
    @Body() dto: UpdateScheduleDto,
  ): Promise<WorkScheduleItemDto> {
    this.logger.log(
      `PATCH /v1/landlord/schedules/${scheduleId} house=${boardingHouseId}`,
    );
    return this.schedulesService.updateSchedule(
      boardingHouseId,
      scheduleId,
      dto,
    );
  }

  @Patch('schedules/recurrence/:recurrenceId')
  @ApiOperation({
    summary: 'UC-L-21: Edit whole recurrence pattern forward',
    description:
      'Overwrites all future WorkSchedule rows where recurrenceId = :id and workDate >= CURRENT_DATE.',
  })
  @ApiParam({ name: 'recurrenceId', description: 'RecurrencePattern UUID' })
  @ApiBody({ type: UpdateRecurrenceDto })
  @ApiOkResponse({
    description: 'Count of updated future schedule rows',
  })
  async updateRecurrence(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('recurrenceId', ParseUUIDPipe) recurrenceId: string,
    @Body() dto: UpdateRecurrenceDto,
  ): Promise<{ updatedCount: number; message: string }> {
    this.logger.log(
      `PATCH /v1/landlord/schedules/recurrence/${recurrenceId} house=${boardingHouseId}`,
    );
    return this.schedulesService.updateRecurrence(
      boardingHouseId,
      recurrenceId,
      dto,
    );
  }

  @Delete('schedules/:id')
  @ApiOperation({
    summary: 'UC-L-21: Delete or cancel a schedule',
    description:
      'Cancels a work schedule. If mode=future is provided and the shift is recurring, cancels all forward occurrences.',
  })
  @ApiParam({ name: 'id', description: 'WorkSchedule UUID' })
  @ApiQuery({
    name: 'mode',
    required: false,
    enum: ['single', 'future'],
    description: 'Cancellation scope (default single)',
  })
  @ApiOkResponse({ description: 'Schedule cancellation result' })
  async deleteSchedule(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) scheduleId: string,
    @Query('mode') mode?: 'single' | 'future',
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(
      `DELETE /v1/landlord/schedules/${scheduleId} house=${boardingHouseId} mode=${mode || 'single'}`,
    );
    return this.schedulesService.deleteSchedule(
      boardingHouseId,
      scheduleId,
      mode || 'single',
    );
  }
}
