import {
  Controller,
  Get,
  UseGuards,
  Request,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InvoicesService } from './invoices.service';
import { TenantInvoicesListResponseDto } from './dto/tenant-invoices-response.dto';
import { TenantUsageAnalyticsResponseDto } from './dto/usage-analytics-response.dto';
import { PaymentHistoryResponseDto } from './dto/payment-history-response.dto';

@ApiTags('Tenant Invoices & Analytics')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('tenant')
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);

  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('invoices')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả hóa đơn của khách thuê (UC-T-05)',
    description:
      'Truy vấn lịch sử hóa đơn, trạng thái thanh toán, chi tiết các mục phòng/điện/nước và ảnh chỉ số đã chốt.',
  })
  @ApiOkResponse({
    description: 'Danh sách hóa đơn của phòng khách thuê hiện tại',
    type: TenantInvoicesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hợp đồng thuê phòng của người dùng',
  })
  async getTenantInvoices(@Request() req: any): Promise<TenantInvoicesListResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(`GET /api/v1/tenant/invoices triggered by user ${userId}`);
    return this.invoicesService.getTenantInvoices(userId);
  }

  @Get('analytics/usage')
  @ApiOperation({
    summary: 'Lấy dữ liệu thống kê tiêu thụ điện nước & chi phí (UC-T-05)',
    description:
      'Truy vấn chuỗi thời gian tiêu thụ điện (kWh), nước (m3), tiền phòng và dịch vụ qua các kỳ, tính toán xu hướng tăng/giảm MoM.',
  })
  @ApiOkResponse({
    description: 'Báo cáo thống kê và biểu đồ tiêu thụ cho khách thuê',
    type: TenantUsageAnalyticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hợp đồng thuê phòng của người dùng',
  })
  async getTenantUsageAnalytics(
    @Request() req: any,
  ): Promise<TenantUsageAnalyticsResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(
      `GET /api/v1/tenant/analytics/usage triggered by user ${userId}`,
    );
    return this.invoicesService.getTenantUsageAnalytics(userId);
  }

  @Get('payments/history')
  @ApiOperation({
    summary: 'Lấy lịch sử thanh toán trọn đời của khách thuê (UC-T-08)',
    description:
      'Truy vấn tất cả các giao dịch thanh toán và hóa đơn qua mọi hợp đồng (kể cả hợp đồng đã kết thúc), chi tiết các khoản mục (tiền phòng, điện, nước, dịch vụ) và biên nhận.',
  })
  @ApiOkResponse({
    description: 'Lịch sử thanh toán và thống kê tổng tiền đã thanh toán',
    type: PaymentHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async getTenantPaymentHistory(
    @Request() req: any,
  ): Promise<PaymentHistoryResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(
      `GET /api/v1/tenant/payments/history triggered by user ${userId}`,
    );
    return this.invoicesService.getTenantPaymentHistory(userId);
  }
}

