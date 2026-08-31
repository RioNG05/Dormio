import { Controller, Get, HttpStatus, HttpCode, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { TenancyDetailsDto } from './dto/tenancy-details.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Tenant Tenancy')
@ApiBearerAuth()
@Controller('tenant/tenancy')
export class TenantContractsController {
  private readonly logger = new Logger(TenantContractsController.name);

  constructor(private readonly contractsService: ContractsService) {}

  // ─── GET /api/v1/tenant/tenancy ─────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Tenancy Details (UC-T-06)',
    description:
      'Returns the read-only aggregate of active contract, room, boarding house, fee structure, and broadcast announcements for the authenticated tenant.',
  })
  @ApiOkResponse({
    description: 'Tenancy details retrieved successfully (or null if no active tenancy)',
    type: TenancyDetailsDto,
  })
  async getMyTenancy(@CurrentUser() user: JwtPayload) {
    this.logger.log(`GET /api/v1/tenant/tenancy called by user: ${user?.id}`);
    const data = await this.contractsService.getMyTenancyDetails(user.id);
    return { success: true, data };
  }
}
