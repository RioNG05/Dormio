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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma';
import { GrievancesService } from './grievances.service';
import {
  AdminGrievanceQueryDto,
  AdminGrievanceListResponseDto,
  AdminGrievanceItemDto,
  ResolveGrievanceDto,
  RejectGrievanceDto,
} from './dto/admin-grievance.dto';

@ApiTags('Admin Grievance Management')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/grievances')
export class AdminGrievancesController {
  private readonly logger = new Logger(AdminGrievancesController.name);

  constructor(private readonly grievancesService: GrievancesService) {}

  @Get()
  @ApiOperation({
    summary: 'UC-A-04: Get grievances queue with priority ordering and filters',
    description:
      'Retrieve all grievances. For pending status, strictly orders by priority desc, createdAt asc.',
  })
  @ApiOkResponse({
    description: 'Grievance queue retrieved successfully',
    type: AdminGrievanceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Requires Admin role',
  })
  async getAdminGrievanceQueue(
    @Query() query: AdminGrievanceQueryDto,
  ): Promise<AdminGrievanceListResponseDto> {
    this.logger.log(
      `GET /admin/grievances called with status=${query.status || 'all'}, priority=${query.priority || 'all'}, page=${query.page || 1}`,
    );
    return this.grievancesService.getAdminGrievanceQueue(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'UC-A-04: Get single grievance detail for admin',
    description:
      'Retrieve grievance detail including tenant info, landlord info, property, room, attached evidence images, and audit notes.',
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
  async getAdminGrievanceById(
    @Param('id') id: string,
  ): Promise<AdminGrievanceItemDto> {
    this.logger.log(`GET /admin/grievances/${id} called`);
    return this.grievancesService.getAdminGrievanceById(id);
  }

  @Patch(':id/in-progress')
  @ApiOperation({
    summary: 'UC-A-04: Move grievance to in-progress status',
    description:
      'Indicate that the administrator is actively investigating or mediating the dispute.',
  })
  @ApiParam({ name: 'id', description: 'Grievance UUID' })
  @ApiOkResponse({
    description: 'Grievance moved to in_progress successfully',
    type: AdminGrievanceItemDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot transition resolved or rejected grievance',
  })
  async updateGrievanceStatusInProgress(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<AdminGrievanceItemDto> {
    const adminId = req.user?.id || req.user?.sub;
    this.logger.log(`PATCH /admin/grievances/${id}/in-progress called by admin ${adminId}`);
    return this.grievancesService.updateGrievanceStatusInProgress(adminId, id);
  }

  @Patch(':id/resolve')
  @ApiOperation({
    summary: 'UC-A-04: Resolve grievance with written explanation note',
    description:
      'Set grievance status to resolved, record admin resolution note, timestamp, audit log, and dispatch notification to tenant.',
  })
  @ApiParam({ name: 'id', description: 'Grievance UUID' })
  @ApiOkResponse({
    description: 'Grievance resolved successfully',
    type: AdminGrievanceItemDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Resolution note missing or too short',
  })
  async resolveGrievance(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ResolveGrievanceDto,
  ): Promise<AdminGrievanceItemDto> {
    const adminId = req.user?.id || req.user?.sub;
    this.logger.log(`PATCH /admin/grievances/${id}/resolve called by admin ${adminId}`);
    return this.grievancesService.resolveGrievance(adminId, id, dto);
  }

  @Patch(':id/reject')
  @ApiOperation({
    summary: 'UC-A-04: Reject grievance with written explanation reason',
    description:
      'Set grievance status to rejected, record admin explanation, timestamp, audit log, and dispatch notification to tenant.',
  })
  @ApiParam({ name: 'id', description: 'Grievance UUID' })
  @ApiOkResponse({
    description: 'Grievance rejected successfully',
    type: AdminGrievanceItemDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Rejection reason missing or too short',
  })
  async rejectGrievance(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: RejectGrievanceDto,
  ): Promise<AdminGrievanceItemDto> {
    const adminId = req.user?.id || req.user?.sub;
    this.logger.log(`PATCH /admin/grievances/${id}/reject called by admin ${adminId}`);
    return this.grievancesService.rejectGrievance(adminId, id, dto);
  }
}
