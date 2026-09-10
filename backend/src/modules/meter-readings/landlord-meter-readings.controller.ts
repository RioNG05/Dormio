import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Headers,
  UseGuards,
  Request,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiOkResponse,
  ApiParam,
  ApiHeader,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { MeterReadingsService } from './meter-readings.service';
import { RecordLandlordMeterReadingDto } from './dto/record-landlord-meter-reading.dto';
import { UpdateLandlordMeterReadingDto } from './dto/update-landlord-meter-reading.dto';
import {
  LandlordRoomMeteredServicesResponseDto,
  LandlordRoomMeterHistoryResponseDto,
} from './dto/landlord-meter-readings-response.dto';

@ApiTags('Landlord Meter Readings')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@Controller('landlord/meter-readings')
export class LandlordMeterReadingsController {
  private readonly logger = new Logger(LandlordMeterReadingsController.name);

  constructor(private readonly meterReadingsService: MeterReadingsService) {}

  @Get('room/:roomId/services')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy danh sách dịch vụ đo lường & chỉ số gần nhất của phòng (UC-L-09)',
    description:
      'Trả về danh sách các dịch vụ đo lường (Điện, Nước) đang hoạt động của phòng kèm chỉ số cũ và chỉ số nháp chưa thanh toán.',
  })
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    description: 'ID nhà trọ (bắt buộc)',
    required: true,
  })
  @ApiParam({ name: 'roomId', description: 'UUID của phòng' })
  @ApiOkResponse({
    description: 'Danh sách dịch vụ đo lường của phòng',
    type: LandlordRoomMeteredServicesResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Không tìm thấy phòng trong nhà trọ này' })
  async getRoomMeteredServices(
    @Request() req: any,
    @Headers('X-Boarding-House-Id') boardingHouseId: string,
    @Param('roomId') roomId: string,
  ) {
    this.logger.log(
      `GET /api/v1/landlord/meter-readings/room/${roomId}/services called by landlord: ${req.user?.id}`,
    );
    const data = await this.meterReadingsService.getRoomMeteredServices(
      boardingHouseId,
      roomId,
    );
    return { success: true, data };
  }

  @Get('room/:roomId/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy lịch sử chốt chỉ số điện nước theo chu kỳ cho phòng (UC-L-09)',
    description:
      'Truy vấn toàn bộ lịch sử chốt số điện nước của phòng, phân nhóm theo chu kỳ hóa đơn, tính toán lượng tiêu thụ và thành tiền tương ứng.',
  })
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    description: 'ID nhà trọ (bắt buộc)',
    required: true,
  })
  @ApiParam({ name: 'roomId', description: 'UUID của phòng' })
  @ApiOkResponse({
    description: 'Lịch sử chốt số điện nước của phòng',
    type: LandlordRoomMeterHistoryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Không tìm thấy phòng trong nhà trọ này' })
  async getRoomMeterHistory(
    @Request() req: any,
    @Headers('X-Boarding-House-Id') boardingHouseId: string,
    @Param('roomId') roomId: string,
  ) {
    this.logger.log(
      `GET /api/v1/landlord/meter-readings/room/${roomId}/history called by landlord: ${req.user?.id}`,
    );
    const data = await this.meterReadingsService.getRoomMeterHistory(
      boardingHouseId,
      roomId,
    );
    return { success: true, data };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chủ trọ ghi nhận chỉ số điện nước thủ công (UC-L-09)',
    description:
      'Ghi nhận trực tiếp chỉ số điện nước (Điện, Nước) vào hệ thống mà không cần qua bước OCR/confirm của khách thuê. Dữ liệu được tính là chốt chính thức ngay lập tức.',
  })
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    description: 'ID nhà trọ (bắt buộc)',
    required: true,
  })
  @ApiOkResponse({
    description: 'Đã lưu chỉ số điện nước thành công',
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy phòng trong nhà trọ này' })
  async recordMeterReading(
    @Request() req: any,
    @Headers('X-Boarding-House-Id') boardingHouseId: string,
    @Body() dto: RecordLandlordMeterReadingDto,
  ) {
    this.logger.log(
      `POST /api/v1/landlord/meter-readings called by landlord: ${req.user?.id} for room: ${dto.roomId}`,
    );
    return this.meterReadingsService.recordLandlordMeterReading(
      req.user?.id,
      boardingHouseId,
      dto,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chủ trọ chỉnh sửa/điều chỉnh chỉ số điện nước kèm lý do (UC-L-09)',
    description:
      'Cho phép chủ trọ điều chỉnh chỉ số điện nước khi phát hiện sai sót (yêu cầu điền lý do bắt buộc). Chỉ áp dụng cho các chỉ số thuộc kỳ chưa thanh toán.',
  })
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    description: 'ID nhà trọ (bắt buộc)',
    required: true,
  })
  @ApiParam({ name: 'id', description: 'UUID của bản ghi MeterReading cần sửa' })
  @ApiOkResponse({
    description: 'Đã cập nhật chỉ số điện nước thành công',
  })
  @ApiBadRequestResponse({ description: 'Hóa đơn đã thanh toán hoặc dữ liệu không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy bản ghi chỉ số điện nước' })
  async updateMeterReading(
    @Request() req: any,
    @Headers('X-Boarding-House-Id') boardingHouseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLandlordMeterReadingDto,
  ) {
    this.logger.log(
      `PATCH /api/v1/landlord/meter-readings/${id} called by landlord: ${req.user?.id}`,
    );
    return this.meterReadingsService.updateLandlordMeterReading(
      req.user?.id,
      boardingHouseId,
      id,
      dto,
    );
  }
}
