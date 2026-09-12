import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { UserRole } from '@prisma';
import { AdminHousesService } from './admin-houses.service';
import {
  AdminHousesFilterDto,
  LockHouseDto,
} from './dto/admin-houses-filter.dto';
import { AdminHousesListResponseDto } from './dto/admin-houses-response.dto';

@ApiTags('Admin Houses Moderation')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/houses')
export class AdminHousesController {
  private readonly logger = new Logger(AdminHousesController.name);

  constructor(private readonly adminHousesService: AdminHousesService) {}

  @Get()
  @ApiOperation({
    summary: 'List boarding houses for admin moderation with multi-value filtering and pagination',
    description:
      'Allows admin to filter boarding houses across property name & address, landlord contact (name, phone, email), total rooms range, occupancy rate range, and multiple statuses.',
  })
  @ApiOkResponse({
    description: 'Moderation list retrieved successfully',
    type: AdminHousesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Requires Admin role',
  })
  async getBoardingHouses(
    @Query() filter: AdminHousesFilterDto,
  ): Promise<AdminHousesListResponseDto> {
    this.logger.log(
      `GET /admin/houses called with filters: propertyQuery="${filter.propertyQuery || ''}", landlordQuery="${filter.landlordQuery || ''}", minRooms=${filter.minRooms ?? ''}, maxRooms=${filter.maxRooms ?? ''}, minOccupancy=${filter.minOccupancy ?? ''}, maxOccupancy=${filter.maxOccupancy ?? ''}, status="${filter.status || ''}", page=${filter.page || 1}, limit=${filter.limit || 10}`,
    );
    return this.adminHousesService.getBoardingHousesForModeration(filter);
  }

  @Patch(':id/lock')
  @ApiOperation({
    summary: 'Lock a boarding house due to violations or complaints',
    description:
      'Suspends property listings and operations. Records lock reason and creates an AuditLog entry.',
  })
  @ApiParam({ name: 'id', description: 'Boarding house UUID or identifier' })
  @ApiOkResponse({ description: 'Boarding house locked successfully' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Boarding house not found',
  })
  async lockHouse(
    @Param('id') id: string,
    @Body() dto: LockHouseDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    this.logger.log(`PATCH /admin/houses/${id}/lock called with reason: "${dto.reason}"`);
    return this.adminHousesService.lockHouse(id, dto.reason, user?.id);
  }

  @Patch(':id/unlock')
  @ApiOperation({
    summary: 'Unlock a previously locked boarding house',
    description:
      'Re-enables property listings and operations. Creates an AuditLog entry.',
  })
  @ApiParam({ name: 'id', description: 'Boarding house UUID or identifier' })
  @ApiOkResponse({ description: 'Boarding house unlocked successfully' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Boarding house not found',
  })
  async unlockHouse(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    this.logger.log(`PATCH /admin/houses/${id}/unlock called`);
    return this.adminHousesService.unlockHouse(id, user?.id);
  }
}
