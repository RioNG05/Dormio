import {
  Controller,
  Get,
  Post,
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
  ApiBearerAuth,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { QueryLandlordInvoicesDto } from './dto/query-landlord-invoices.dto';
import { CreateManualInvoiceDto } from './dto/create-manual-invoice.dto';
import { ManualPaymentDto } from './dto/manual-payment.dto';
import {
  LandlordInvoicesListResponseDto,
  LandlordInvoiceItemDto,
} from './dto/landlord-invoices-response.dto';
import { QueryLandlordDebtsDto } from './dto/query-landlord-debts.dto';
import {
  LandlordDebtsResponseDto,
  SendDebtReminderDto,
  DebtReminderResponseDto,
} from './dto/landlord-debts-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Landlord Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('landlord/invoices')
export class LandlordInvoicesController {
  private readonly logger = new Logger(LandlordInvoicesController.name);

  constructor(private readonly invoicesService: InvoicesService) {}

  // ─── GET /api/v1/landlord/invoices ──────────────────────────────────────────

  @Get()
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List Landlord Invoices (UC-L-06)',
    description:
      'Retrieves paginated invoices belonging to the active boarding house context, matching Rule 9 pagination, status filtering, month/year filtering, and text search.',
  })
  @ApiOkResponse({
    description: 'Paginated list of invoices retrieved successfully',
    type: LandlordInvoicesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not authorized for this boarding house',
  })
  async getInvoices(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Query() query: QueryLandlordInvoicesDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<LandlordInvoicesListResponseDto> {
    this.logger.log(
      `GET /landlord/invoices called by user ${user?.id} for house ${boardingHouseId} (page=${query.page}, status=${query.status})`,
    );
    return this.invoicesService.getLandlordInvoices(
      boardingHouseId,
      query,
      user.id,
    );
  }

  // ─── GET /api/v1/landlord/invoices/debts ────────────────────────────────────

  @Get('debts')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List Room Debts Ledger (UC-L-16)',
    description:
      'Retrieves the outstanding debt ledger grouped by room with aging calculation (NOW() - dueDate), debt metrics, filtering by duration/aging brackets, and search.',
  })
  @ApiOkResponse({
    description: 'Room debt ledger retrieved successfully',
    type: LandlordDebtsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not authorized for this boarding house',
  })
  async getDebts(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Query() query: QueryLandlordDebtsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<LandlordDebtsResponseDto> {
    this.logger.log(
      `GET /landlord/invoices/debts called by user ${user?.id} for house ${boardingHouseId} (duration=${query.duration}, search=${query.search}, page=${query.page})`,
    );
    return this.invoicesService.getLandlordDebts(
      boardingHouseId,
      query,
      user.id,
    );
  }

  // ─── POST /api/v1/landlord/invoices/debts/flip-overdue ──────────────────────

  @Post('debts/flip-overdue')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger Overdue Status Flip Job (UC-L-16)',
    description:
      'Manually triggers flipping unpaid invoices past their due date without paid payment to overdue status.',
  })
  @ApiOkResponse({
    description: 'Overdue invoices updated successfully',
  })
  async triggerFlipOverdue(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; updatedCount: number }> {
    this.logger.log(
      `POST /landlord/invoices/debts/flip-overdue called by user ${user?.id} for house ${boardingHouseId}`,
    );
    const result = await this.invoicesService.flipOverdueInvoices(boardingHouseId);
    return { success: true, updatedCount: result.count };
  }

  // ─── POST /api/v1/landlord/invoices/debts/remind ────────────────────────────

  @Post('debts/remind')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send Debt Reminder to Tenant (UC-L-16)',
    description:
      'Dispatches an in-app and async push/SMS reminder to the primary tenant of an indebted room and generates copyable Zalo/SMS reminder text.',
  })
  @ApiOkResponse({
    description: 'Debt reminder dispatched successfully',
    type: DebtReminderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room not found in this boarding house',
  })
  async sendDebtReminder(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: SendDebtReminderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DebtReminderResponseDto> {
    this.logger.log(
      `POST /landlord/invoices/debts/remind called by user ${user?.id} for room ${dto.roomId} in house ${boardingHouseId}`,
    );
    return this.invoicesService.sendDebtReminder(
      boardingHouseId,
      user.id,
      dto,
    );
  }

  // ─── GET /api/v1/landlord/invoices/:id ──────────────────────────────────────

  @Get(':id')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Landlord Invoice Detail (UC-L-06 / UC-L-07)',
    description:
      'Retrieves complete invoice aggregate including room, primary tenant info, rent and utility breakdowns, attached meter photos, payment receipt, and VietQR locked payload.',
  })
  @ApiOkResponse({
    description: 'Invoice detail retrieved successfully',
    type: LandlordInvoiceItemDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found in this boarding house',
  })
  async getInvoiceDetail(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; data: LandlordInvoiceItemDto }> {
    this.logger.log(
      `GET /landlord/invoices/${id} called by user ${user?.id} for house ${boardingHouseId}`,
    );
    const data = await this.invoicesService.getLandlordInvoiceDetail(
      boardingHouseId,
      id,
    );
    return { success: true, data };
  }

  // ─── POST /api/v1/landlord/invoices/manual ──────────────────────────────────

  @Post('manual')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Manual Invoice (UC-L-06 / UC-L-09)',
    description:
      'Creates a manual billing invoice for a specific room with custom rent, electric and water indexes, service fees, and writes an AuditLog in the same transaction.',
  })
  @ApiCreatedResponse({
    description: 'Invoice created successfully',
    type: LandlordInvoiceItemDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room not found in this boarding house',
  })
  async createManualInvoice(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: CreateManualInvoiceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; data: LandlordInvoiceItemDto }> {
    this.logger.log(
      `POST /landlord/invoices/manual called by user ${user?.id} for room ${dto.roomId} in house ${boardingHouseId}`,
    );
    const data = await this.invoicesService.createManualInvoice(
      user.id,
      boardingHouseId,
      dto,
    );
    return { success: true, data };
  }

  // ─── POST /api/v1/landlord/invoices/:id/pay ─────────────────────────────────

  @Post(':id/pay')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record Manual Payment for Invoice (UC-L-06 Part 3)',
    description:
      'Marks invoice as paid directly by landlord (cash or bank transfer). Creates Payment record with idempotency and records AuditLogs for both Payment and Invoice.',
  })
  @ApiOkResponse({
    description: 'Payment recorded and invoice marked as paid successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found in this boarding house',
  })
  async recordManualPayment(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ManualPaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `POST /landlord/invoices/${id}/pay called by user ${user?.id} for house ${boardingHouseId}`,
    );
    return this.invoicesService.recordLandlordManualPayment(
      user.id,
      boardingHouseId,
      id,
      dto,
    );
  }
}
