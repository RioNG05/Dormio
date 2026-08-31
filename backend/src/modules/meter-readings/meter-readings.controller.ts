import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { MeterReadingsService } from './meter-readings.service';
import { UploadMeterReadingDto } from './dto/upload-meter-reading.dto';
import { UpdateMeterReadingDto } from './dto/update-meter-reading.dto';
import { ActiveMeteredServicesResponseDto } from './dto/active-metered-service-response.dto';
import { ConfirmReadingsResponseDto } from './dto/confirm-readings-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Tenant Meter Readings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenant/meter-readings')
export class MeterReadingsController {
  private readonly logger = new Logger(MeterReadingsController.name);

  constructor(private readonly meterReadingsService: MeterReadingsService) {}

  // ─── GET /api/v1/tenant/meter-readings/active-services ──────────────────────

  @Get('active-services')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active metered services and unbilled readings (UC-T-03 Step 1)',
    description:
      'Returns the room’s active metered services requiring readings this cycle, along with draft unbilled readings and previous cycle historical readings.',
  })
  @ApiOkResponse({
    description: 'Active metered services retrieved successfully',
    type: ActiveMeteredServicesResponseDto,
  })
  @ApiNotFoundResponse({ description: 'No active tenancy found for tenant' })
  async getActiveServices(@CurrentUser() user: JwtPayload) {
    this.logger.log(
      `GET /api/v1/tenant/meter-readings/active-services called by user: ${user?.id}`,
    );
    const data = await this.meterReadingsService.getActiveServicesForTenant(
      user.id,
    );
    return { success: true, data };
  }

  // ─── POST /api/v1/tenant/meter-readings/upload ─────────────────────────────

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload meter photo & run OCR / in-place upsert (UC-T-03 Step 2 & 3)',
    description:
      'Uploads a meter photo for a specific service. Automatically runs OCR extraction if no value is explicitly supplied. Updates the existing draft in-place without duplicating records.',
  })
  @ApiOkResponse({
    description: 'Meter reading saved/updated successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid service or upload payload' })
  async uploadReading(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UploadMeterReadingDto,
  ) {
    this.logger.log(
      `POST /api/v1/tenant/meter-readings/upload called by user: ${user?.id} for service: ${dto.serviceId}`,
    );
    const data = await this.meterReadingsService.uploadOrUpdateReading(
      user.id,
      dto,
    );
    return { success: true, data, message: 'Đã lưu chỉ số điện nước thành công' };
  }

  // ─── PATCH /api/v1/tenant/meter-readings/:id ────────────────────────────────

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manual reading correction (UC-T-03 Step 4)',
    description:
      'Allows tenant to manually correct an unbilled meter reading if the OCR scanner misread the dial.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the MeterReading record' })
  @ApiOkResponse({
    description: 'Meter reading value updated successfully',
  })
  @ApiNotFoundResponse({ description: 'Meter reading not found' })
  @ApiBadRequestResponse({ description: 'Reading already billed or invalid' })
  async updateReadingValue(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMeterReadingDto,
  ) {
    this.logger.log(
      `PATCH /api/v1/tenant/meter-readings/${id} called by user: ${user?.id} with value: ${dto.readingValue}`,
    );
    const data = await this.meterReadingsService.updateReadingValue(
      user.id,
      id,
      dto,
    );
    return { success: true, data, message: 'Đã cập nhật chỉ số thành công' };
  }

  // ─── POST /api/v1/tenant/meter-readings/confirm ─────────────────────────────

  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Confirm all readings & generate invoice (UC-T-03 Step 5 / UC-L-06 Part 3)',
    description:
      'Validates that all active metered services for the tenant’s room have valid readings, transactionally creates the invoice with rent and utility line items, links consumed readings, creates an audit log, and returns the VietQR payment payload.',
  })
  @ApiOkResponse({
    description: 'Readings confirmed and invoice generated successfully',
    type: ConfirmReadingsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Incomplete readings or validation error',
  })
  async confirmAndGenerateInvoice(@CurrentUser() user: JwtPayload) {
    this.logger.log(
      `POST /api/v1/tenant/meter-readings/confirm called by user: ${user?.id}`,
    );
    const data = await this.meterReadingsService.confirmAndGenerateInvoice(
      user.id,
    );
    return {
      success: true,
      data,
      message: 'Xác nhận chỉ số thành công. Hóa đơn đã được tạo!',
    };
  }
}
