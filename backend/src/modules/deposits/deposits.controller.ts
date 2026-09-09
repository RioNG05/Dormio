import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { DepositsService } from './deposits.service';
import { CreateManualDepositDto } from './dto/create-manual-deposit.dto';
import { QueryDepositsDto } from './dto/query-deposits.dto';
import { RefundDepositDto } from './dto/refund-deposit.dto';
import { ForfeitDepositDto } from './dto/forfeit-deposit.dto';
import {
  DepositResponseDto,
  PaginatedDepositsResponseDto,
} from './dto/deposit-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Landlord Deposits')
@ApiBearerAuth('JWT')
@ApiHeader({
  name: 'X-Boarding-House-Id',
  description: 'UUID of the boarding house being managed',
  required: true,
})
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@Controller('landlord/deposits')
export class DepositsController {
  private readonly logger = new Logger(DepositsController.name);

  constructor(private readonly depositsService: DepositsService) {}

  // ─── POST /api/v1/landlord/deposits ────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Manual Deposit Entry (UC-L-10)',
    description:
      'Creates a manual deposit for a room without a contract (room holding flow). ' +
      'Sets target Room status to deposited, creates Deposit record, and logs AuditLog in one transaction.',
  })
  @ApiCreatedResponse({
    description: 'Manual deposit created successfully',
    type: DepositResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Room is occupied, under maintenance, or already deposited',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room not found or does not belong to this boarding house',
  })
  async createManualDeposit(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateManualDepositDto,
    @Req() req: Request,
  ): Promise<DepositResponseDto> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    this.logger.log(
      `POST /landlord/deposits called by user ${user.id} for boardingHouse ${boardingHouseId} (roomId: ${dto.roomId}, amount: ${dto.amount})`,
    );

    return this.depositsService.createManualDeposit(
      boardingHouseId,
      user.id,
      dto,
      ipAddress,
    );
  }

  // ─── GET /api/v1/landlord/deposits ─────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List Boarding House Deposits (UC-L-14)',
    description:
      'Queries all deposits for the target boarding house with search, status filtering, category filtering, and statistics aggregation.',
  })
  @ApiOkResponse({
    description: 'Paginated deposit list with dashboard statistics',
    type: PaginatedDepositsResponseDto,
  })
  async getDeposits(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryDepositsDto,
  ): Promise<PaginatedDepositsResponseDto> {
    this.logger.log(
      `GET /landlord/deposits called by user ${user.id} for boardingHouse ${boardingHouseId} with query: ${JSON.stringify(query)}`,
    );

    return this.depositsService.getDeposits(boardingHouseId, query);
  }

  // ─── GET /api/v1/landlord/deposits/:id ─────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: 'Get Deposit Details',
    description: 'Retrieves single deposit details with room, contract, tenant, and payment relations.',
  })
  @ApiOkResponse({
    description: 'Deposit details',
    type: DepositResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deposit not found',
  })
  async getDepositById(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) depositId: string,
  ): Promise<DepositResponseDto> {
    this.logger.log(
      `GET /landlord/deposits/${depositId} called by user ${user.id} for boardingHouse ${boardingHouseId}`,
    );

    return this.depositsService.getDepositById(boardingHouseId, depositId);
  }

  // ─── PATCH /api/v1/landlord/deposits/:id/refund ────────────────────────────

  @Patch(':id/refund')
  @ApiOperation({
    summary: 'Refund Deposit',
    description:
      'Processes a partial or full refund for a holding deposit. If hold room was deposited, restores room status to available.',
  })
  @ApiOkResponse({
    description: 'Deposit refunded successfully',
    type: DepositResponseDto,
  })
  async refundDeposit(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) depositId: string,
    @Body() dto: RefundDepositDto,
    @Req() req: Request,
  ): Promise<DepositResponseDto> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    this.logger.log(
      `PATCH /landlord/deposits/${depositId}/refund called by user ${user.id} (deducted: ${dto.deductedAmount})`,
    );

    return this.depositsService.refundDeposit(
      boardingHouseId,
      user.id,
      depositId,
      dto,
      ipAddress,
    );
  }

  // ─── PATCH /api/v1/landlord/deposits/:id/forfeit ───────────────────────────

  @Patch(':id/forfeit')
  @ApiOperation({
    summary: 'Forfeit Deposit',
    description:
      'Deducts 100% of the deposit and marks it as forfeited. Restores hold room status to available.',
  })
  @ApiOkResponse({
    description: 'Deposit forfeited successfully',
    type: DepositResponseDto,
  })
  async forfeitDeposit(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) depositId: string,
    @Body() dto: ForfeitDepositDto,
    @Req() req: Request,
  ): Promise<DepositResponseDto> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    this.logger.log(
      `PATCH /landlord/deposits/${depositId}/forfeit called by user ${user.id}`,
    );

    return this.depositsService.forfeitDeposit(
      boardingHouseId,
      user.id,
      depositId,
      dto,
      ipAddress,
    );
  }
}
