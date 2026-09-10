import {
  Controller,
  Get,
  Param,
  Query,
  Headers,
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
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { PaymentsService } from './payments.service';
import { QueryLandlordPaymentsDto } from './dto/query-landlord-payments.dto';
import {
  LandlordPaymentsResponseDto,
  LandlordPaymentItemDto,
} from './dto/landlord-payments-response.dto';

@ApiTags('Landlord Payments & Revenue')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@Controller('landlord/payments')
export class LandlordPaymentsController {
  private readonly logger = new Logger(LandlordPaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Tra cứu lịch sử thanh toán kèm hóa đơn & chỉ số điện nước (UC-L-07)',
    description:
      'Lấy danh sách các giao dịch thanh toán thành công của nhà trọ, kết hợp chi tiết hóa đơn (InvoiceItem) và hình ảnh công tơ điện nước (MeterReading.imageUrl) làm bằng chứng.',
  })
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    description: 'ID nhà trọ cần tra cứu (bắt buộc)',
    required: true,
  })
  @ApiOkResponse({
    description: 'Danh sách lịch sử thanh toán kèm số liệu tổng hợp',
    type: LandlordPaymentsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền truy cập nhà trọ này',
  })
  async getLandlordPayments(
    @Request() req: any,
    @Headers('X-Boarding-House-Id') boardingHouseId: string,
    @Query() query: QueryLandlordPaymentsDto,
  ): Promise<LandlordPaymentsResponseDto> {
    const landlordId = req.user?.id || req.user?.sub;
    this.logger.log(
      `GET /api/v1/landlord/payments for house ${boardingHouseId} by landlord ${landlordId}`,
    );

    return this.paymentsService.getLandlordPayments(
      boardingHouseId,
      query,
      landlordId,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết biên nhận điện tử & bằng chứng thanh toán (UC-L-07)',
    description:
      'Lấy chi tiết giao dịch thanh toán bao gồm thông tin khách thuê, số biên nhận, chi tiết từng dịch vụ và hình ảnh đồng hồ thực tế.',
  })
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    description: 'ID nhà trọ (bắt buộc)',
    required: true,
  })
  @ApiParam({ name: 'id', description: 'ID giao dịch thanh toán (UUID)' })
  @ApiOkResponse({
    description: 'Chi tiết giao dịch thanh toán',
    type: LandlordPaymentItemDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy giao dịch thanh toán',
  })
  async getLandlordPaymentDetail(
    @Request() req: any,
    @Headers('X-Boarding-House-Id') boardingHouseId: string,
    @Param('id') paymentId: string,
  ): Promise<LandlordPaymentItemDto> {
    const landlordId = req.user?.id || req.user?.sub;
    this.logger.log(
      `GET /api/v1/landlord/payments/${paymentId} for house ${boardingHouseId} by landlord ${landlordId}`,
    );

    return this.paymentsService.getLandlordPaymentDetail(
      boardingHouseId,
      paymentId,
      landlordId,
    );
  }
}
