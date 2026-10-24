import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Headers,
  UseGuards,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { TenantsService } from './tenants.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { User, UserRole } from '@prisma'
import { SearchTenantQueryDto } from './dto/search-tenant-query.dto'
import { SearchTenantResponseDto } from './dto/search-tenant-response.dto'
import { QuickAddTenantDto } from './dto/quick-add-tenant.dto'
import { QueryTenantsDto } from './dto/query-tenants.dto'
import { RoomOccupantResponseDto } from './dto/room-occupant-response.dto'
import { LandlordTenantListResponseDto } from './dto/tenant-list-response.dto'

@ApiTags('Landlord Tenants')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Boarding-House-Id',
  required: true,
  description: 'Target Boarding House UUID context',
})
@UseGuards(JwtAuthGuard, RolesGuard, PropertyOwnershipGuard)
@Roles(UserRole.landlord)
@Controller('landlord/tenants')
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name)

  constructor(private readonly tenantsService: TenantsService) {}

  @Get('search-user')
  @ApiOperation({
    summary: 'Search user by phone number for tenant lookup',
    description:
      'Checks if a user exists in Dormio system, and whether they are already residing in the specified boarding house.',
  })
  @ApiOkResponse({ type: SearchTenantResponseDto })
  async searchUser(
    @Query() query: SearchTenantQueryDto,
    @Headers('x-boarding-house-id') boardingHouseId: string,
  ): Promise<SearchTenantResponseDto> {
    this.logger.log(
      `searchUser phone="${query.phone}" boardingHouseId="${boardingHouseId}"`,
    )
    return this.tenantsService.searchUser(query.phone, boardingHouseId)
  }

  @Post('quick-add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Quick add tenant to a room without contract',
    description:
      'Provisions a tenant user account with default password (88888888) if needed and assigns them as an active room occupant.',
  })
  @ApiResponse({ status: 201, type: RoomOccupantResponseDto })
  async quickAddTenant(
    @Body() dto: QuickAddTenantDto,
    @CurrentUser() user: User,
    @Headers('x-boarding-house-id') boardingHouseId: string,
  ): Promise<RoomOccupantResponseDto> {
    this.logger.log(
      `quickAddTenant phone="${dto.phoneNumber}" roomId="${dto.roomId}" boardingHouseId="${boardingHouseId}"`,
    )
    return this.tenantsService.quickAddTenant(dto, user.id, boardingHouseId)
  }

  @Get('rooms/:roomId/occupants')
  @ApiOperation({
    summary: 'Get all active occupants of a specific room',
    description:
      'Returns active residents in the room, used for contract creation or room management.',
  })
  @ApiParam({ name: 'roomId', description: 'Room UUID' })
  @ApiOkResponse({ type: [RoomOccupantResponseDto] })
  async getRoomOccupants(
    @Param('roomId') roomId: string,
    @Headers('x-boarding-house-id') boardingHouseId: string,
  ): Promise<RoomOccupantResponseDto[]> {
    this.logger.log(
      `getRoomOccupants roomId="${roomId}" boardingHouseId="${boardingHouseId}"`,
    )
    return this.tenantsService.getRoomOccupants(roomId, boardingHouseId)
  }

  @Get()
  @ApiOperation({
    summary: 'Get unified tenant list for boarding house',
    description:
      'Aggregates all residents across contracts and direct room occupants with search and pagination.',
  })
  @ApiOkResponse({ type: LandlordTenantListResponseDto })
  async getLandlordTenants(
    @Query() query: QueryTenantsDto,
    @Headers('x-boarding-house-id') boardingHouseId: string,
  ): Promise<LandlordTenantListResponseDto> {
    this.logger.log(`getLandlordTenants boardingHouseId="${boardingHouseId}"`)
    return this.tenantsService.getLandlordTenants(boardingHouseId, query)
  }

  @Delete('occupants/:id')
  @ApiOperation({
    summary: 'Check out an occupant from a room',
    description: 'Marks the RoomOccupant as moved_out and frees up room capacity.',
  })
  async checkoutOccupant(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Headers('x-boarding-house-id') boardingHouseId: string,
  ) {
    this.logger.log(
      `checkoutOccupant occupantId="${id}" boardingHouseId="${boardingHouseId}"`,
    )
    return this.tenantsService.checkoutOccupant(id, user.id, boardingHouseId)
  }
}

