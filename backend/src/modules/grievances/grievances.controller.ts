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
import { GrievancesService } from './grievances.service';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import {
  GrievanceListResponseDto,
  GrievanceDetailResponseDto,
} from './dto/grievance-response.dto';

@ApiTags('Tenant Grievances & Complaints')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('tenant/grievances')
export class GrievancesController {
  private readonly logger = new Logger(GrievancesController.name);

  constructor(private readonly grievancesService: GrievancesService) {}

  @Post()
  @ApiOperation({
    summary: 'Gửi đơn khiếu nại / tố cáo lên Ban Quản Trị hệ thống (UC-T-07)',
    description:
      'Khách thuê gửi đơn khiếu nại (chủ trọ vi phạm, tự ý tăng giá, lừa đảo, dịch vụ kém) kèm bằng chứng ảnh.',
  })
  @ApiOkResponse({
    description: 'Đơn khiếu nại đã được tiếp nhận thành công',
    type: GrievanceDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hợp đồng thuê phòng của người dùng',
  })
  async createGrievance(
    @Request() req: any,
    @Body() dto: CreateGrievanceDto,
  ): Promise<GrievanceDetailResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(`POST /api/v1/tenant/grievances triggered by user ${userId}`);
    return this.grievancesService.createGrievance(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy lịch sử các khiếu nại của khách thuê (UC-T-07)',
    description:
      'Truy vấn tất cả khiếu nại mà khách thuê đã gửi, trạng thái xử lý và phản hồi từ BQT.',
  })
  @ApiOkResponse({
    description: 'Danh sách khiếu nại của khách thuê',
    type: GrievanceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async getTenantGrievances(
    @Request() req: any,
  ): Promise<GrievanceListResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(`GET /api/v1/tenant/grievances triggered by user ${userId}`);
    return this.grievancesService.getTenantGrievances(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết một đơn khiếu nại (UC-T-07)',
    description:
      'Xem chi tiết khiếu nại, hình ảnh bằng chứng và kết quả giải quyết / phản hồi từ BQT.',
  })
  @ApiParam({ name: 'id', description: 'Mã định danh khiếu nại (UUID)' })
  @ApiOkResponse({
    description: 'Chi tiết khiếu nại',
    type: GrievanceDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy khiếu nại hoặc không có quyền truy cập',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async getTenantGrievanceById(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<GrievanceDetailResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    this.logger.log(
      `GET /api/v1/tenant/grievances/${id} triggered by user ${userId}`,
    );
    return this.grievancesService.getTenantGrievanceById(userId, id);
  }
}
