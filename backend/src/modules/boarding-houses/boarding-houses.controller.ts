import { Body, Controller, Get, Logger, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { ApiAuth } from '../../common/swagger';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { BoardingHousesService } from './boarding-houses.service';
import { CreateBoardingHouseDto } from './dto/create-boarding-house.dto';
import { SetupBoardingHouseDto } from './dto/setup-boarding-house.dto';
import { BoardingHouseOverviewResponseDto } from './dto/boarding-house-overview-response.dto';
import {
  BoardingHouseListResponseDto,
  BoardingHouseResponseDto,
  CreateBoardingHouseResponseDto,
  SetupBoardingHouseResponseDto,
} from './dto/boarding-house-response.dto';

@ApiTags('Boarding Houses')
@Controller('boarding-houses')
export class BoardingHousesController {
  private readonly logger = new Logger(BoardingHousesController.name);

  constructor(
    private readonly boardingHousesService: BoardingHousesService,
  ) {}

  @Post('setup')
  @ApiAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Setup a boarding house via 3-step wizard (UC-L-01)',
    description:
      'Creates a boarding house with services, room types, generates rooms in bulk, and promotes user role to landlord in a single atomic transaction.',
  })
  @ApiCreatedResponse({
    description: 'Boarding house setup completed successfully',
    type: SetupBoardingHouseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input payload' })
  @ApiResponse({ status: 422, description: 'Room count exceeds subscription quota' })
  async setupBoardingHouse(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetupBoardingHouseDto,
  ): Promise<SetupBoardingHouseResponseDto> {
    this.logger.log(`POST /boarding-houses/setup called by user ${user.id}`);
    return this.boardingHousesService.setupBoardingHouse(user.id, dto);
  }

  @Get(':id/overview')
  @ApiAuth()
  @UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
  @ApiOperation({
    summary: 'Lấy dữ liệu tổng quan & phân tích kinh doanh nhà trọ (UC-L-01 & UC-L-08)',
    description:
      'Trả về số liệu tổng quan bao gồm thống kê phòng, doanh thu thực tế, công nợ, trạng thái thu tiền (collectionStatus), hợp đồng sắp hết hạn và dòng tiền 6 tháng.',
  })
  @ApiOkResponse({
    description: 'Dữ liệu tổng quan được truy xuất thành công',
    type: BoardingHouseOverviewResponseDto,
  })
  async getDashboardOverview(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) boardingHouseId: string,
  ): Promise<BoardingHouseOverviewResponseDto> {
    this.logger.log(`GET /boarding-houses/${boardingHouseId}/overview called by user ${user.id}`);
    return this.boardingHousesService.getDashboardOverview(user.id, boardingHouseId);
  }

  @Get(':id/analytics')
  @ApiAuth()
  @UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
  @ApiOperation({
    summary: 'Báo cáo & Phân tích chuyên sâu nhà trọ (UC-L-08)',
    description:
      'Truy xuất báo cáo chi tiết về doanh thu, tỷ lệ lấp đầy, tiến độ thu tiền và xu hướng dòng tiền phục vụ trang Báo cáo & Thống kê.',
  })
  @ApiOkResponse({
    description: 'Dữ liệu báo cáo và phân tích được truy xuất thành công',
    type: BoardingHouseOverviewResponseDto,
  })
  async getPropertyAnalytics(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) boardingHouseId: string,
  ): Promise<BoardingHouseOverviewResponseDto> {
    this.logger.log(`GET /boarding-houses/${boardingHouseId}/analytics called by user ${user.id}`);
    return this.boardingHousesService.getDashboardOverview(user.id, boardingHouseId);
  }

  @Get()
  @ApiAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'List all boarding houses owned by the authenticated landlord',
    description:
      'Returns all properties owned by the current user. Used by the frontend to populate the building selector with real UUIDs.',
  })
  @ApiOkResponse({
    description: 'Properties listed successfully',
    type: BoardingHouseListResponseDto,
  })
  async listMyProperties(
    @CurrentUser() user: JwtPayload,
  ): Promise<BoardingHouseListResponseDto> {
    this.logger.log(`GET /boarding-houses called by user ${user.id}`);
    return this.boardingHousesService.listMyProperties(user.id);
  }

  @Post()
  @ApiAuth()
  @ApiOperation({
    summary: 'Initialize a property profile (UC-L-01)',
    description:
      'Creates an active boarding house owned by the authenticated user, its initial services and room types, and promotes the user display role to landlord in one transaction.',
  })
  @ApiCreatedResponse({
    description: 'Property profile initialized successfully',
    type: CreateBoardingHouseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'The property profile payload is invalid' })
  async createInitialProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBoardingHouseDto,
  ): Promise<BoardingHouseResponseDto> {
    this.logger.log(`POST /boarding-houses called by user ${user.id}`);
    return this.boardingHousesService.createInitialProfile(user.id, dto);
  }
}
