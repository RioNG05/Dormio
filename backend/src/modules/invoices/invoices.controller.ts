import { Controller, Get, Param, Query, UseGuards, Request, Logger, HttpStatus } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { InvoicesService } from './invoices.service'
import { TenantInvoiceDto, TenantInvoicesListResponseDto } from './dto/tenant-invoices-response.dto'
import { TenantUsageAnalyticsResponseDto } from './dto/usage-analytics-response.dto'
import { PaymentHistoryResponseDto } from './dto/payment-history-response.dto'

@ApiTags('Tenant Invoices & Analytics')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('tenant')
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name)

  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('invoices')
  @ApiOperation({
    summary: 'Get all tenant invoices (UC-T-05)',
    description:
      'Query invoice history, payment status, breakdown of room/electricity/water items, and final meter reading photos.',
  })
  @ApiOkResponse({
    description: 'List of invoices for tenant room',
    type: TenantInvoicesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized or invalid token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User lease contract not found',
  })
  @ApiQuery({
    name: 'contractId',
    required: false,
    description: 'Filter invoices by specific room contract ID (multi-room tenant)',
  })
  async getTenantInvoices(
    @Request() req: any,
    @Query('contractId') contractId?: string,
  ): Promise<TenantInvoicesListResponseDto> {
    const userId = req.user?.id || req.user?.sub
    this.logger.log(`GET /api/v1/tenant/invoices (contractId=${contractId}) triggered by user ${userId}`)
    return this.invoicesService.getTenantInvoices(userId, contractId)
  }

  @Get('invoices/:id')
  @ApiOperation({
    summary: 'Get tenant invoice details by ID (UC-T-05)',
    description:
      'Query invoice details, line items, and meter reading indices for payment.',
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiOkResponse({
    description: 'Invoice details',
    type: TenantInvoiceDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
  })
  async getTenantInvoiceById(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<TenantInvoiceDto> {
    const userId = req.user?.id || req.user?.sub
    this.logger.log(`GET /api/v1/tenant/invoices/${id} triggered by user ${userId}`)
    return this.invoicesService.getTenantInvoiceById(userId, id)
  }

  @Get('analytics/usage')
  @ApiOperation({
    summary: 'Get utility consumption & spend analytics (UC-T-05)',
    description:
      'Query time series of electricity (kWh), water (m3), rent, and services across cycles, computing MoM trends.',
  })
  @ApiOkResponse({
    description: 'Usage analytics report and consumption chart for tenant',
    type: TenantUsageAnalyticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized or invalid token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User lease contract not found',
  })
  async getTenantUsageAnalytics(@Request() req: any): Promise<TenantUsageAnalyticsResponseDto> {
    const userId = req.user?.id || req.user?.sub
    this.logger.log(`GET /api/v1/tenant/analytics/usage triggered by user ${userId}`)
    return this.invoicesService.getTenantUsageAnalytics(userId)
  }

  @Get('payments/history')
  @ApiOperation({
    summary: 'Get lifetime payment history for tenant (UC-T-08)',
    description:
      'Query all payment transactions and invoices across all contracts (including terminated), line item breakdown, and receipts.',
  })
  @ApiOkResponse({
    description: 'Payment history and summary of total paid amount',
    type: PaymentHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized or invalid token',
  })
  async getTenantPaymentHistory(@Request() req: any): Promise<PaymentHistoryResponseDto> {
    const userId = req.user?.id || req.user?.sub
    this.logger.log(`GET /api/v1/tenant/payments/history triggered by user ${userId}`)
    return this.invoicesService.getTenantPaymentHistory(userId)
  }
}
