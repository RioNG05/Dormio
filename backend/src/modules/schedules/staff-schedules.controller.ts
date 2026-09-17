import {
  Controller,
  Get,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { QueryStaffSchedulesDto } from './dto/query-staff-schedules.dto';
import { StaffBoardingHouseResponseDto } from './dto/staff-boarding-house-response.dto';
import { StaffScheduleItemResponseDto } from './dto/staff-schedule-response.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('Staff Schedules (UC-S-01)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffSchedulesController {
  private readonly logger = new Logger(StaffSchedulesController.name);

  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('boarding-houses')
  @ApiOperation({
    summary: 'UC-S-01: Get active assigned boarding houses for staff member',
    description:
      'Retrieves the list of properties where the logged-in staff member holds an active employment assignment.',
  })
  @ApiOkResponse({
    type: [StaffBoardingHouseResponseDto],
    description: 'List of active assigned boarding houses',
  })
  async getBoardingHouses(
    @CurrentUser() user: JwtPayload,
  ): Promise<StaffBoardingHouseResponseDto[]> {
    this.logger.log(
      `Staff user ${user.id} requested active assigned boarding houses`,
    );
    return this.schedulesService.getStaffBoardingHouses(user.id);
  }

  @Get('schedules/boarding-houses')
  @ApiOperation({
    summary: 'UC-S-01: Alias for getting active assigned boarding houses',
    description:
      'Convenience endpoint alias for client navigation and schedule filtering.',
  })
  @ApiOkResponse({
    type: [StaffBoardingHouseResponseDto],
    description: 'List of active assigned boarding houses',
  })
  async getBoardingHousesAlias(
    @CurrentUser() user: JwtPayload,
  ): Promise<StaffBoardingHouseResponseDto[]> {
    this.logger.log(
      `Staff user ${user.id} requested assigned boarding houses via alias route`,
    );
    return this.schedulesService.getStaffBoardingHouses(user.id);
  }

  @Get('schedules')
  @ApiOperation({
    summary: 'UC-S-01: Get work schedule roster with shift, position, co-workers and duties for staff',
    description:
      'Retrieves work schedules within the specified date range (default current week), including shift details, role responsibilities, colleagues on duty, and task checklists.',
  })
  @ApiOkResponse({
    type: [StaffScheduleItemResponseDto],
    description: 'List of work schedules for the staff member',
  })
  async getSchedules(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryStaffSchedulesDto,
  ): Promise<StaffScheduleItemResponseDto[]> {
    this.logger.log(
      `Staff user ${user.id} requested schedules for range ${query.startDate || 'startOfWeek'} -> ${query.endDate || 'endOfWeek'}`,
    );
    return this.schedulesService.getStaffSchedules(user.id, query);
  }
}

