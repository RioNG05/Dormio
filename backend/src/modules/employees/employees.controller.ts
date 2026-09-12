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
  Req,
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
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { OnboardStaffDto } from './dto/onboard-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import {
  JobPositionDto,
  OnboardStaffResponseDto,
  SearchUserResponseDto,
  StaffItemDto,
  StaffListResponseDto,
} from './dto/staff-response.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { EmployeesService } from './employees.service';

@ApiTags('Landlord - Staff Management (UC-L-19, UC-L-20)')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Boarding-House-Id',
  description: 'Active boarding house ID context',
  required: true,
})
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@Controller('landlord/staff')
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  constructor(private readonly employeesService: EmployeesService) {}

  @Get('search-user')
  @ApiOperation({
    summary: 'UC-L-19 Step 1: Search user by phone or username',
    description:
      'Checks if a user already exists in the platform to show read-only prefilled info or prompt for new user registration.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Phone number or username fragment to search for',
    example: '0901234567',
  })
  @ApiOkResponse({
    type: SearchUserResponseDto,
    description: 'Lookup result indicating whether user exists',
  })
  async searchUser(
    @Query('q') q: string,
    @Headers('x-boarding-house-id') boardingHouseId: string,
  ): Promise<SearchUserResponseDto> {
    this.logger.log(
      `searchUser query="${q}" boardingHouseId=${boardingHouseId}`,
    );
    return this.employeesService.searchUser(q, boardingHouseId);
  }

  @Get('positions')
  @ApiOperation({
    summary: 'Get all job positions for this boarding house',
    description:
      'Retrieves the list of configured job roles (Bảo vệ, Vệ sinh, Quản lý...) and staff count per position.',
  })
  @ApiOkResponse({
    type: [JobPositionDto],
    description: 'List of job positions with active member count',
  })
  async getPositions(
    @Headers('x-boarding-house-id') boardingHouseId: string,
  ): Promise<JobPositionDto[]> {
    this.logger.log(`getPositions boardingHouseId=${boardingHouseId}`);
    return this.employeesService.getJobPositions(boardingHouseId);
  }

  @Post('positions')
  @ApiOperation({
    summary: 'UC-L-20: Create a custom job position',
    description:
      'Creates a new job role with free-text duty description for this boarding house.',
  })
  @ApiBody({ type: CreatePositionDto })
  @ApiCreatedResponse({
    type: JobPositionDto,
    description: 'The newly created job position',
  })
  @ApiResponse({ status: 409, description: 'Position name already exists' })
  async createPosition(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: CreatePositionDto,
  ): Promise<JobPositionDto> {
    this.logger.log(
      `createPosition name="${dto.name}" boardingHouseId=${boardingHouseId}`,
    );
    return this.employeesService.createJobPosition(boardingHouseId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'UC-L-20 Step 1: List all staff members for this boarding house',
    description:
      'Returns paginated staff assignments with summary counters (total, active, inactive, positions).',
  })
  @ApiOkResponse({
    type: StaffListResponseDto,
    description: 'Paginated staff assignments list with summary statistics',
  })
  async getStaffList(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Query() query: QueryStaffDto,
  ): Promise<StaffListResponseDto> {
    this.logger.log(
      `getStaffList boardingHouseId=${boardingHouseId} page=${query.page} limit=${query.limit} search="${query.search || ''}"`,
    );
    return this.employeesService.getStaffList(boardingHouseId, query);
  }

  @Post('onboard')
  @ApiOperation({
    summary: 'UC-L-19: Onboard a staff member into the boarding house',
    description:
      'If user exists, verifies eligibility and assigns role. If user is new, generates temporary credentials with mustChangePassword=true, bumps role to employee, creates assignment, and logs audit record.',
  })
  @ApiBody({ type: OnboardStaffDto })
  @ApiCreatedResponse({
    type: OnboardStaffResponseDto,
    description:
      'Staff member successfully onboarded. Returns generated password if new account.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request / validation error' })
  @ApiResponse({
    status: 409,
    description: 'Staff member is already actively assigned to this property',
  })
  async onboardStaff(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: OnboardStaffDto,
    @Req() req: Request,
  ): Promise<OnboardStaffResponseDto> {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    this.logger.log(
      `onboardStaff phone=${dto.phoneNumber} by landlord=${user.id} house=${boardingHouseId}`,
    );

    return this.employeesService.onboardStaff(
      boardingHouseId,
      user.id,
      dto,
      ipAddress,
    );
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'UC-L-20 Step 2 & 4: Update employment status (active ↔ inactive)',
    description:
      'Updates staff assignment status. Setting status to inactive cascade-cancels future scheduled shifts and sets leftAt timestamp.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee assignment UUID',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @ApiBody({ type: UpdateStaffStatusDto })
  @ApiOkResponse({
    type: StaffItemDto,
    description: 'Updated staff assignment record',
  })
  @ApiResponse({ status: 404, description: 'Staff assignment not found' })
  async updateStaffStatus(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateStaffStatusDto,
    @Req() req: Request,
  ): Promise<StaffItemDto> {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    this.logger.log(
      `updateStaffStatus assignment=${assignmentId} newStatus=${dto.status} by landlord=${user.id}`,
    );

    return this.employeesService.updateStaffStatus(
      boardingHouseId,
      assignmentId,
      user.id,
      dto,
      ipAddress,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'UC-L-20: Get staff member assignment detail',
    description:
      'Retrieves complete staff assignment profile, position duties, and contact information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee assignment UUID',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @ApiOkResponse({
    type: StaffItemDto,
    description: 'Staff member details',
  })
  @ApiResponse({ status: 404, description: 'Staff member assignment not found' })
  async getStaffDetail(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) assignmentId: string,
  ): Promise<StaffItemDto> {
    this.logger.log(
      `getStaffDetail assignment=${assignmentId} house=${boardingHouseId}`,
    );
    return this.employeesService.getStaffDetail(boardingHouseId, assignmentId);
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'UC-L-20 Step 3: Assign or re-assign role to staff member',
    description:
      'Re-assigns staff member to an existing or newly created JobPosition and updates static duty expectations.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee assignment UUID',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @ApiBody({ type: AssignRoleDto })
  @ApiOkResponse({
    type: StaffItemDto,
    description: 'Updated staff member record with newly assigned position',
  })
  @ApiResponse({ status: 404, description: 'Staff member assignment not found' })
  async assignRole(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AssignRoleDto,
    @Req() req: Request,
  ): Promise<StaffItemDto> {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    this.logger.log(
      `assignRole assignment=${assignmentId} position=${dto.positionId || dto.newPositionName} by landlord=${user.id}`,
    );

    return this.employeesService.assignRole(
      boardingHouseId,
      assignmentId,
      user.id,
      dto,
      ipAddress,
    );
  }

  @Patch('positions/:id')
  @ApiOperation({
    summary: 'UC-L-20: Update job position name and duty list description',
    description:
      'Updates the title and duty list of a job position (displayed in staff tasks in UC-S-01).',
  })
  @ApiParam({
    name: 'id',
    description: 'Job position UUID',
    example: 'c6f9e8a0-2f3b-4e1a-9f5e-7a8b9c0d1e2f',
  })
  @ApiBody({ type: UpdatePositionDto })
  @ApiOkResponse({
    type: JobPositionDto,
    description: 'Updated job position record',
  })
  @ApiResponse({ status: 404, description: 'Job position not found' })
  @ApiResponse({ status: 409, description: 'Duplicate position name' })
  async updateJobPosition(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) positionId: string,
    @Body() dto: UpdatePositionDto,
  ): Promise<JobPositionDto> {
    this.logger.log(
      `updateJobPosition position=${positionId} house=${boardingHouseId}`,
    );
    return this.employeesService.updateJobPosition(
      boardingHouseId,
      positionId,
      dto,
    );
  }

  @Delete('positions/:id')
  @ApiOperation({
    summary: 'UC-L-20: Delete an unused job position',
    description:
      'Deletes a job position. Fails with 400 if any active staff are currently assigned to this position.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job position UUID',
    example: 'c6f9e8a0-2f3b-4e1a-9f5e-7a8b9c0d1e2f',
  })
  @ApiOkResponse({
    description: 'Position successfully deleted',
  })
  @ApiResponse({ status: 400, description: 'Position has active staff assigned' })
  @ApiResponse({ status: 404, description: 'Job position not found' })
  async deleteJobPosition(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) positionId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `deleteJobPosition position=${positionId} house=${boardingHouseId}`,
    );
    return this.employeesService.deleteJobPosition(boardingHouseId, positionId);
  }
}
