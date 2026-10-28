import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { CreateGrievanceDto } from './dto/create-grievance.dto'
import { GrievanceListResponseDto, GrievanceDetailResponseDto } from './dto/grievance-response.dto'

@ApiTags('Tenant & User Grievances / Applications')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller(['tenant/grievances', 'grievances'])
export class GrievancesController {
  private readonly logger = new Logger(GrievancesController.name)

  constructor(private readonly grievancesService: GrievancesService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit grievance / inquiry / feedback to system Admin (UC-T-07)',
    description:
      'User submits a grievance, feature inquiry, or feedback with optional proof images.',
  })
  @ApiOkResponse({
    description: 'Grievance submitted successfully',
    type: GrievanceDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized or invalid token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User lease contract not found',
  })
  async createGrievance(
    @Request() req: any,
    @Body() dto: CreateGrievanceDto,
  ): Promise<GrievanceDetailResponseDto> {
    const userId = req.user?.id || req.user?.sub
    this.logger.log(`POST /api/v1/tenant/grievances triggered by user ${userId}`)
    return this.grievancesService.createGrievance(userId, dto)
  }

  @Get()
  @ApiOperation({
    summary: 'Get tenant grievance history (UC-T-07)',
    description:
      'Query all grievances submitted by the tenant, processing status, and admin resolution.',
  })
  @ApiOkResponse({
    description: 'Tenant grievance history list',
    type: GrievanceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized or invalid token',
  })
  async getTenantGrievances(@Request() req: any): Promise<GrievanceListResponseDto> {
    const userId = req.user?.id || req.user?.sub
    this.logger.log(`GET /api/v1/tenant/grievances triggered by user ${userId}`)
    return this.grievancesService.getTenantGrievances(userId)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get grievance details (UC-T-07)',
    description:
      'View grievance details, attached proof images, and admin resolution/response.',
  })
  @ApiParam({ name: 'id', description: 'Grievance UUID' })
  @ApiOkResponse({
    description: 'Grievance details',
    type: GrievanceDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grievance not found or access denied',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized or invalid token',
  })
  async getTenantGrievanceById(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<GrievanceDetailResponseDto> {
    const userId = req.user?.id || req.user?.sub
    this.logger.log(`GET /api/v1/tenant/grievances/${id} triggered by user ${userId}`)
    return this.grievancesService.getTenantGrievanceById(userId, id)
  }
}
