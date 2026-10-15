import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
  HttpStatus,
  Ip,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.type'
import { UserRole } from '@prisma'
import { AdminUsersService } from './admin-users.service'
import { AdminUsersFilterDto } from './dto/admin-users-filter.dto'
import {
  AdminUsersListResponseDto,
  AdminUserDetailDto,
  AdminUserActivitiesResponseDto,
} from './dto/admin-users-response.dto'
import {
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  ResetUserPasswordDto,
} from './dto/admin-user-action.dto'

@ApiTags('Admin User Management')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/users')
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name)

  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users for administrative monitoring with search, role/status filters, and summary KPIs',
    description:
      'Provides paginated user listing with search across name/phone/email/CCCD, role & status filtering, registration date range, and high-level platform user statistics.',
  })
  @ApiOkResponse({
    description: 'User list and summary metrics retrieved successfully',
    type: AdminUsersListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Requires Admin role',
  })
  async getUsers(@Query() filter: AdminUsersFilterDto): Promise<AdminUsersListResponseDto> {
    this.logger.log(
      `GET /admin/users called with filter: query="${filter.query || ''}", role="${filter.role || ''}", status="${filter.status || ''}", page=${filter.page || 1}, limit=${filter.limit || 10}`,
    )
    return this.adminUsersService.getUsers(filter)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get comprehensive user profile, eKYC identification, bank account, and recent system activity',
    description:
      'Retrieves detailed user records including registration timestamp, identity cards, boarding houses/contracts, and latest 15 system audit logs.',
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiOkResponse({
    description: 'Detailed user profile retrieved successfully',
    type: AdminUserDetailDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserDetail(@Param('id') id: string): Promise<AdminUserDetailDto> {
    this.logger.log(`GET /admin/users/${id} called`)
    return this.adminUsersService.getUserDetail(id)
  }

  @Get(':id/activities')
  @ApiOperation({
    summary: 'Get paginated system action history / audit logs for a specific user',
    description:
      'Returns timeline of actions (login, contract creation, payment, profile updates) executed by or affecting the specified user.',
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({
    description: 'User activity logs retrieved successfully',
    type: AdminUserActivitiesResponseDto,
  })
  async getUserActivities(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<AdminUserActivitiesResponseDto> {
    this.logger.log(`GET /admin/users/${id}/activities called: page=${page || 1}, limit=${limit || 20}`)
    return this.adminUsersService.getUserActivities(id, page, limit)
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update user account status (active, inactive, banned)',
    description:
      'Allows admin to ban, unban, or deactivate a user account with mandatory/optional audit log justification reason.',
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiOkResponse({ description: 'User status successfully modified and audited' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() currentUser: JwtPayload,
    @Ip() ipAddress: string,
  ) {
    this.logger.log(
      `PATCH /admin/users/${id}/status called by admin=${currentUser.id}: targetStatus=${dto.status}`,
    )
    return this.adminUsersService.updateUserStatus(id, dto, currentUser.id, ipAddress)
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'Update assigned role for user',
    description:
      'Enables administrators to grant landlord, staff, tenant, or admin privileges with complete audit trail.',
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiOkResponse({ description: 'User role successfully modified and audited' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: JwtPayload,
    @Ip() ipAddress: string,
  ) {
    this.logger.log(
      `PATCH /admin/users/${id}/role called by admin=${currentUser.id}: targetRole=${dto.role}`,
    )
    return this.adminUsersService.updateUserRole(id, dto, currentUser.id, ipAddress)
  }

  @Post(':id/reset-password')
  @ApiOperation({
    summary: 'Administratively reset user password and require password change on next login',
    description:
      'Sets a temporary password and flags mustChangePassword=true to force the user to set a new password upon login.',
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiOkResponse({ description: 'Password reset completed and recorded in audit log' })
  async resetUserPassword(
    @Param('id') id: string,
    @Body() dto: ResetUserPasswordDto,
    @CurrentUser() currentUser: JwtPayload,
    @Ip() ipAddress: string,
  ) {
    this.logger.log(`POST /admin/users/${id}/reset-password called by admin=${currentUser.id}`)
    return this.adminUsersService.resetUserPassword(id, dto, currentUser.id, ipAddress)
  }
}
