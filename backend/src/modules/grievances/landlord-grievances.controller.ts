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

@ApiTags('Landlord Grievances')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('landlord/grievances')
export class LandlordGrievancesController {
  private readonly logger = new Logger(LandlordGrievancesController.name)

  constructor(private readonly grievancesService: GrievancesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get grievances queue for landlord properties',
    description: 'Retrieve all grievances reported for boarding houses owned by the landlord.',
  })
  @ApiOkResponse({
    description: 'Grievance list retrieved successfully',
    type: AdminGrievanceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getLandlordGrievanceQueue(
    @Request() req: any,
    @Query() query: AdminGrievanceQueryDto,
  ): Promise<AdminGrievanceListResponseDto> {
    const landlordId = req.user?.id || req.user?.sub
    this.logger.log(`GET /api/v1/landlord/grievances called by landlord ${landlordId}`)
    return this.grievancesService.getLandlordGrievanceQueue(landlordId, query)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single grievance detail for landlord',
    description: 'Retrieve details of a grievance belonging to landlord properties.',
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
  async getLandlordGrievanceById(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<AdminGrievanceItemDto> {
    const landlordId = req.user?.id || req.user?.sub
    this.logger.log(`GET /api/v1/landlord/grievances/${id} called by landlord ${landlordId}`)
    return this.grievancesService.getLandlordGrievanceById(landlordId, id)
  }

  @Patch(':id/in-progress')
  @ApiOperation({
    summary: 'Mark grievance status as in-progress',
    description: 'Indicate that landlord is currently addressing the issue.',
  })
  @ApiParam({ name: 'id', description: 'Grievance UUID' })
  @ApiOkResponse({
    description: 'Grievance marked in-progress',
    type: AdminGrievanceItemDto,
  })
  async updateLandlordGrievanceStatusInProgress(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<AdminGrievanceItemDto> {
    const landlordId = req.user?.id || req.user?.sub
    this.logger.log(`PATCH /api/v1/landlord/grievances/${id}/in-progress called by landlord ${landlordId}`)
    return this.grievancesService.updateLandlordGrievanceStatusInProgress(landlordId, id)
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
  async resolveLandlordGrievance(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ResolveGrievanceDto,
  ): Promise<AdminGrievanceItemDto> {
    const landlordId = req.user?.id || req.user?.sub
    this.logger.log(`PATCH /api/v1/landlord/grievances/${id}/resolve called by landlord ${landlordId}`)
    return this.grievancesService.resolveLandlordGrievance(landlordId, id, dto)
  }
}
