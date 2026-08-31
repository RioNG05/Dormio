import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import {
  VietQrPaymentInstructionDto,
} from './dto/initiate-payment.dto';
import {
  ConfirmPaymentDto,
  PaymentExecutionResultDto,
  VietQrWebhookDto,
} from './dto/confirm-payment.dto';

@ApiTags('Payments & VietQR')
@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('tenant/payments/instruction/:invoiceId')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy hướng dẫn thanh toán VietQR với số tiền khóa cố định (UC-T-04)',
    description:
      'Tạo mã QR VietQR kèm số tài khoản, tên người thụ hưởng và cú pháp chuyển khoản chính xác.',
  })
  @ApiParam({ name: 'invoiceId', description: 'Mã định danh hóa đơn (UUID)' })
  @ApiOkResponse({
    description: 'Thông tin thanh toán VietQR',
    type: VietQrPaymentInstructionDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hóa đơn',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền truy cập hóa đơn này',
  })
  async getVietQrInstruction(
    @Request() req: any,
    @Param('invoiceId') invoiceId: string,
  ): Promise<VietQrPaymentInstructionDto> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(
      `GET /api/v1/tenant/payments/instruction/${invoiceId} by user ${userId}`,
    );
    return this.paymentsService.getVietQrInstruction(userId, invoiceId);
  }

  @Post('tenant/payments/confirm')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Xác nhận / Quyết toán thanh toán hóa đơn trực tiếp (UC-T-04)',
    description:
      'Ghi nhận giao dịch thanh toán thành công, chuyển trạng thái hóa đơn sang đã thanh toán, xuất biên nhận điện tử và gửi thông báo.',
  })
  @ApiOkResponse({
    description: 'Kết quả quyết toán giao dịch',
    type: PaymentExecutionResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hóa đơn',
  })
  async confirmInvoicePayment(
    @Request() req: any,
    @Body() dto: ConfirmPaymentDto,
  ): Promise<PaymentExecutionResultDto> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(
      `POST /api/v1/tenant/payments/confirm for invoice ${dto.invoiceId} by user ${userId}`,
    );
    return this.paymentsService.confirmInvoicePayment(userId, dto);
  }

  @Public()
  @Post('payments/webhook/vietqr')
  @ApiOperation({
    summary: 'Webhook tiếp nhận thông báo biến động số dư từ cổng VietQR / Ngân hàng (UC-L-06)',
    description:
      'Tiếp nhận dữ liệu webhook tự động từ ngân hàng đối tác, kiểm tra tính duy nhất (idempotency) và cập nhật trạng thái hóa đơn.',
  })
  @ApiOkResponse({
    description: 'Xử lý webhook thành công',
    schema: {
      example: {
        success: true,
        message: 'Hóa đơn đã được quyết toán tự động qua VietQR.',
      },
    },
  })
  async handleVietQrWebhook(
    @Body() dto: VietQrWebhookDto,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `POST /api/v1/payments/webhook/vietqr received ref: ${dto.transactionRef}`,
    );
    return this.paymentsService.handleVietQrWebhook(dto);
  }
}
