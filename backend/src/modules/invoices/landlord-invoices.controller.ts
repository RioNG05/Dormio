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
