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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { CheckoutSubscriptionDto } from './dto/checkout-subscription.dto';
import { TierStatusResponseDto } from './dto/tier-status-response.dto';
import { SubscriptionCheckoutResponseDto } from './dto/subscription-checkout-response.dto';
import { SubscriptionPlanItemDto } from './dto/subscription-plan-response.dto';

@ApiTags('Landlord Subscriptions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('landlord/subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({
    summary: 'Lấy danh sách các gói dịch vụ và bảng giá (Free, Plus, Pro)',
    description:
      'Trả về danh sách các gói cùng bảng giá theo tháng, quý, năm và các quyền lợi đi kèm.',
  })
  @ApiOkResponse({
    description: 'Danh sách các gói dịch vụ',
    type: [SubscriptionPlanItemDto],
  })
  async getPlans(@Request() req: any): Promise<SubscriptionPlanItemDto[]> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(`GET /api/v1/landlord/subscriptions/plans called by user ${userId}`);
    return this.subscriptionsService.getPlans();
  }

  @Get('tier-status/:planName')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái gói hiện tại cho cùng tier (Gia hạn nối tiếp)',
    description:
      'Kiểm tra xem người dùng có đang sở hữu gói cùng tier còn hạn hay không để tính toán ngày bắt đầu nối tiếp.',
  })
  @ApiParam({
    name: 'planName',
    description: 'Tên gói cần kiểm tra (plus hoặc pro)',
    example: 'plus',
  })
  @ApiOkResponse({
    description: 'Trạng thái tier hiện tại và ngày kích hoạt nối tiếp',
    type: TierStatusResponseDto,
  })
  async getTierStatus(
    @Request() req: any,
    @Param('planName') planName: string,
  ): Promise<TierStatusResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(
      `GET /api/v1/landlord/subscriptions/tier-status/${planName} called by user ${userId}`,
    );
    return this.subscriptionsService.getTierStatus(userId, planName);
  }

  @Post('checkout')
  @ApiOperation({
    summary: 'Khởi tạo phiên thanh toán PayOS đăng ký / gia hạn gói',
    description:
      'Tạo phiên thanh toán PayOS hoặc tái sử dụng mã QR hiện có nếu còn trong thời hạn 15 phút.',
  })
  @ApiOkResponse({
    description: 'Thông tin mã QR VietQR PayOS và thời hạn thanh toán',
    type: SubscriptionCheckoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Gói dịch vụ không tồn tại',
  })
  async createCheckout(
    @Request() req: any,
    @Body() dto: CheckoutSubscriptionDto,
  ): Promise<SubscriptionCheckoutResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(
      `POST /api/v1/landlord/subscriptions/checkout called by user ${userId} for ${dto.planName}`,
    );
    return this.subscriptionsService.createCheckout(userId, dto);
  }

  @Get('order-status/:orderCode')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái thanh toán gói dịch vụ theo mã đơn',
    description:
      'Dùng cho cơ chế polling từ client để kiểm tra xem đơn hàng đã được PayOS gạch nợ thành công hay chưa.',
  })
  @ApiParam({
    name: 'orderCode',
    description: 'Mã số đơn hàng PayOS dạng số nguyên',
    example: 1727289123456,
  })
  @ApiOkResponse({
    description: 'Trạng thái thanh toán',
    schema: {
      example: {
        orderCode: 1727289123456,
        status: 'success',
        isPaid: true,
      },
    },
  })
  async getOrderStatus(
    @Request() req: any,
    @Param('orderCode', ParseIntPipe) orderCode: number,
  ): Promise<{
    orderCode: number;
    status: string;
    isPaid: boolean;
    paidAt?: string;
  }> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(
      `GET /api/v1/landlord/subscriptions/order-status/${orderCode} called by user ${userId}`,
    );
    return this.subscriptionsService.getOrderStatus(userId, orderCode);
  }
}
