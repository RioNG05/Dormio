import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { QueryAssetsDto } from './dto/query-assets.dto';
import {
  AssetsListResponseDto,
  AssetItemDto,
} from './dto/asset-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireTier } from '../../common/decorators/require-tier.decorator';
import { ApiAuth, ApiBoardingHouseHeader } from '../../common/swagger';
import { SubscriptionPackage } from '@prisma';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Landlord Assets')
@ApiAuth()
@ApiBoardingHouseHeader()
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@RequireTier(SubscriptionPackage.plus)
@Controller('landlord/assets')
export class AssetsController {
  private readonly logger = new Logger(AssetsController.name);

  constructor(private readonly assetsService: AssetsService) {}

  // ─── POST /api/v1/landlord/assets ─────────────────────────────────────────

  @Post()
  @RequireTier(SubscriptionPackage.plus)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Asset (UC-L-25)',
    description:
      'Creates a new asset record (room-linked or common area) for the active boarding house. Requires Plus subscription tier or higher.',
  })
  @ApiCreatedResponse({
    description: 'Asset record created successfully',
    type: AssetItemDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires Plus subscription tier or landlord does not own this boarding house',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or room does not belong to active boarding house',
  })
  async createAsset(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: CreateAssetDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; data: AssetItemDto }> {
    this.logger.log(
      `POST /landlord/assets called by user ${user?.id} for house ${boardingHouseId} (name="${dto.name}", location="${dto.location}")`,
    );
    const data = await this.assetsService.createAsset(
      user.id,
      boardingHouseId,
      dto,
    );
    return { success: true, data };
  }

  // ─── GET /api/v1/landlord/assets ──────────────────────────────────────────

  @Get()
  @RequireTier(SubscriptionPackage.plus)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List Assets (UC-L-25)',
    description:
      'Retrieves paginated assets for the active boarding house context with category, condition, roomId, and search filters alongside summary counts. Requires Plus subscription tier or higher.',
  })
  @ApiOkResponse({
    description: 'Assets list retrieved successfully',
    type: AssetsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires Plus subscription tier or landlord does not own this boarding house',
  })
  async getAssets(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Query() query: QueryAssetsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssetsListResponseDto> {
    this.logger.log(
      `GET /landlord/assets called by user ${user?.id} for house ${boardingHouseId} (page=${query.page}, category=${query.category}, condition=${query.condition})`,
    );
    return this.assetsService.getAssets(boardingHouseId, query);
  }

  // ─── GET /api/v1/landlord/assets/:id ──────────────────────────────────────

  @Get(':id')
  @RequireTier(SubscriptionPackage.plus)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Asset Detail (UC-L-25)',
    description:
      'Retrieves details of a specific asset by UUID. Requires Plus subscription tier or higher.',
  })
  @ApiOkResponse({
    description: 'Asset details retrieved successfully',
    type: AssetItemDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires Plus subscription tier or landlord does not own this boarding house',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async getAssetDetail(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; data: AssetItemDto }> {
    this.logger.log(
      `GET /landlord/assets/${id} called by user ${user?.id} for house ${boardingHouseId}`,
    );
    const data = await this.assetsService.getAssetDetail(boardingHouseId, id);
    return { success: true, data };
  }

  // ─── PATCH /api/v1/landlord/assets/:id ────────────────────────────────────

  @Patch(':id')
  @RequireTier(SubscriptionPackage.plus)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Asset (UC-L-25)',
    description:
      'Updates asset information, room reassignment, condition status, or warranty notes. Requires Plus subscription tier or higher.',
  })
  @ApiOkResponse({
    description: 'Asset updated successfully',
    type: AssetItemDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires Plus subscription tier or landlord does not own this boarding house',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or invalid roomId',
  })
  async updateAsset(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; data: AssetItemDto }> {
    this.logger.log(
      `PATCH /landlord/assets/${id} called by user ${user?.id} for house ${boardingHouseId}`,
    );
    const data = await this.assetsService.updateAsset(
      boardingHouseId,
      id,
      dto,
      user.id,
    );
    return { success: true, data };
  }

  // ─── DELETE /api/v1/landlord/assets/:id ───────────────────────────────────

  @Delete(':id')
  @RequireTier(SubscriptionPackage.plus)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Asset (UC-L-25)',
    description:
      'Deletes an asset record permanently and records an AuditLog. Requires Plus subscription tier or higher.',
  })
  @ApiOkResponse({
    description: 'Asset deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Đã xóa tài sản thành công.' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires Plus subscription tier or landlord does not own this boarding house',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async deleteAsset(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `DELETE /landlord/assets/${id} called by user ${user?.id} for house ${boardingHouseId}`,
    );
    return this.assetsService.deleteAsset(boardingHouseId, id, user.id);
  }
}
