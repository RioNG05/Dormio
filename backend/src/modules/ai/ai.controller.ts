import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Logger,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { VisionService } from './vision.service';
import { AiService } from './ai.service';
import { ExtractMeterReadingDto, MeterOcrResponseDto } from './dto/meter-ocr.dto';
import { ExtractIdCardDto, IdCardOcrResponseDto } from './dto/id-card-ocr.dto';
import { AiChatDto, AiChatResponseDto } from './dto/ai-chat.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('AI Engine')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly visionService: VisionService,
    private readonly aiService: AiService,
  ) {}

  @Public()
  @Post('vision/meter-reading')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trích xuất chỉ số đồng hồ điện / nước từ ảnh bằng Gemini Vision (UC-T-03 / UC-L-09)',
    description:
      'Sử dụng model gemini-3.5-flash-lite phân tích hình ảnh công tơ điện hoặc đồng hồ nước để bóc tách chỉ số hiển thị, phân tách phần nguyên và phần thập phân (số đỏ), trả về dữ liệu JSON có cấu trúc.',
  })
  @ApiOkResponse({
    description: 'Chỉ số đồng hồ được trích xuất thành công',
    type: MeterOcrResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu ảnh không hợp lệ' })
  async extractMeterReading(@Body() dto: ExtractMeterReadingDto) {
    this.logger.log(`POST /api/v1/ai/vision/meter-reading called for serviceType: ${dto.serviceType || 'general'}`);
    const data = await this.visionService.extractMeterReading(dto.imageUrl, dto.serviceType);
    return {
      success: true,
      data,
      message: 'Nhận diện chỉ số đồng hồ thành công',
    };
  }

  @Public()
  @Post('vision/id-card')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bóc tách thông tin Căn Cước Công Dân (CCCD) từ ảnh qua Gemini Vision',
    description:
      'Sử dụng model gemini-3.5-flash-lite để bóc tách 12 số CCCD, Họ tên, Ngày sinh, Địa chỉ từ ảnh mặt trước hoặc mặt sau của thẻ căn cước.',
  })
  @ApiOkResponse({
    description: 'Thông tin CCCD được trích xuất thành công',
    type: IdCardOcrResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Ảnh không hợp lệ hoặc không rõ' })
  async extractIdCard(@Body() dto: ExtractIdCardDto) {
    this.logger.log(`POST /api/v1/ai/vision/id-card called for side: ${dto.side || 'front'}`);
    const data = await this.visionService.extractIdCard(dto.imageUrl, dto.side);
    return {
      success: true,
      data,
      message: 'Bóc tách thông tin CCCD thành công',
    };
  }

  @Public()
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trò chuyện với Trợ lý AI Dormio (Platform Assistant)',
    description:
      'Gửi tin nhắn hội thoại để nhận câu trả lời tư vấn nghiệp vụ tìm phòng, đặt cọc giữ chỗ, thanh toán hóa đơn VietQR PayOS, và quy trình quản trị nhà trọ.',
  })
  @ApiOkResponse({
    description: 'Phản hồi từ trợ lý AI Dormio',
    type: AiChatResponseDto,
  })
  async chat(@Request() req: any, @Body() dto: AiChatDto) {
    this.logger.log(`POST /api/v1/ai/chat called by user: ${req.user?.id || 'guest'}`);
    const data = await this.aiService.chat(dto, req.user?.id);
    return {
      success: true,
      data,
    };
  }
}
