import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Logger,
  Request,
  BadRequestException,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
} from '@nestjs/swagger'
import { VisionService } from './vision.service'
import { AiService } from './ai.service'
import { ExtractMeterReadingDto, MeterOcrResponseDto } from './dto/meter-ocr.dto'
import { ExtractIdCardDto, IdCardOcrResponseDto } from './dto/id-card-ocr.dto'
import { AiChatDto, AiChatResponseDto } from './dto/ai-chat.dto'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('AI Engine')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name)

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
    this.logger.log(
      `POST /api/v1/ai/vision/meter-reading called for serviceType: ${dto.serviceType || 'general'}`,
    )
    const data = await this.visionService.extractMeterReading(dto.imageUrl, dto.serviceType)
    return {
      success: data.isValid,
      data,
      message: data.isValid
        ? 'Nhận diện chỉ số đồng hồ thành công'
        : data.errorMessage ||
          'Ảnh tải lên không phải là công tơ hợp lệ hoặc không thể đọc được chỉ số',
    }
  }

  @Public()
  @Post('vision/id-card')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Extract identity card (ID card) information from image via Gemini Vision',
    description:
      'Uses Gemini model to extract 12-digit identity number, Full name, Date of birth, and Address from front or back ID card photo.',
  })
  @ApiOkResponse({
    description: 'ID card information extracted successfully',
    type: IdCardOcrResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid or unclear image' })
  async extractIdCard(@Body() dto: ExtractIdCardDto) {
    this.logger.log(`POST /api/v1/ai/vision/id-card called for side: ${dto.side || 'front'}`)
    const data = await this.visionService.extractIdCard(dto.imageUrl, dto.side)
    return {
      success: true,
      data,
      message: 'ID card information extracted successfully',
    }
  }

  @Public()
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chat with Dormio AI Assistant (Platform Assistant)',
    description:
      'Send conversation messages to receive business consulting for room rental, holding deposits, PayOS VietQR payments, and boarding house management.',
  })
  @ApiOkResponse({
    description: 'Response from Dormio AI Assistant',
    type: AiChatResponseDto,
  })
  async chat(@Request() req: any, @Body() dto: AiChatDto) {
    this.logger.log(`POST /api/v1/ai/chat called by user: ${req.user?.id || 'guest'}`)
    const data = await this.aiService.chat(dto, req.user?.id)
    return {
      success: true,
      data,
    }
  }
}
