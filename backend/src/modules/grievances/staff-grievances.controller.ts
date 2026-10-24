import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  Logger,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { GrievancesService } from './grievances.service'
import {
  AdminGrievanceQueryDto,
  AdminGrievanceListResponseDto,
  AdminGrievanceItemDto,
  ResolveGrievanceDto,
} from './dto/admin-grievance.dto'

@ApiTags('Staff Grievances')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('staff/grievances')
export class StaffGrievancesController {
  private readonly logger = new Logger(StaffGrievancesController.name)

  constructor(private readonly grievancesService: GrievancesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get grievances queue for staff assigned properties',
    description: 'Retrieve all grievances reported for boarding houses where staff is assigned.',
  })
  @ApiOkResponse({
    description: 'Grievance list retrieved successfully',
    type: AdminGrievanceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getStaffGrievanceQueue(
    @Request() req: any,
    @Query() query: AdminGrievanceQueryDto,
  ): Promise<AdminGrievanceListResponseDto> {
    const staffUserId = req.user?.id || req.user?.sub
    this.logger.log(`GET /api/v1/staff/grievances called by staff ${staffUserId}`)
    return this.grievancesService.getStaffGrievanceQueue(staffUserId, query)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single grievance detail for staff',
    description: 'Retrieve details of a grievance belonging to staff assigned properties.',
  })
  @ApiParam({ name: 'id', description: 'Grievance UUID' })
  @ApiOkResponse({
    description: 'Grievance detail retrieved successfully',
    type: AdminGrievanceItemDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grievance not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getStaffGrievanceById(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<AdminGrievanceItemDto> {
    const staffUserId = req.user?.id || req.user?.sub
    this.logger.log(`GET /api/v1/staff/grievances/${id} called by staff ${staffUserId}`)
    return this.grievancesService.getStaffGrievanceById(staffUserId, id)
  }

  @Patch(':id/in-progress')
  @ApiOperation({
    summary: 'Mark grievance status as in-progress',
    description: 'Indicate that staff is actively addressing the issue.',
  })
  @ApiParam({ name: 'id', description: 'Grievance UUID' })
  @ApiOkResponse({
    description: 'Grievance marked in-progress',
    type: AdminGrievanceItemDto,
  })
  async updateStaffGrievanceStatusInProgress(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<AdminGrievanceItemDto> {
    const staffUserId = req.user?.id || req.user?.sub
    this.logger.log(`PATCH /api/v1/staff/grievances/${id}/in-progress called by staff ${staffUserId}`)
    return this.grievancesService.updateStaffGrievanceStatusInProgress(staffUserId, id)
  }

  @Patch(':id/resolve')
  @ApiOperation({
    summary: 'Resolve grievance with written response',
    description: 'Resolve grievance, store resolution note, and notify the tenant.',
  })
  @ApiParam({ name: 'id', description: 'Grievance UUID' })
  @ApiOkResponse({
    description: 'Grievance resolved successfully',
    type: AdminGrievanceItemDto,
  })
  async resolveStaffGrievance(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ResolveGrievanceDto,
  ): Promise<AdminGrievanceItemDto> {
    const staffUserId = req.user?.id || req.user?.sub
    this.logger.log(`PATCH /api/v1/staff/grievances/${id}/resolve called by staff ${staffUserId}`)
    return this.grievancesService.resolveStaffGrievance(staffUserId, id, dto)
  }
}
