import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiAuth } from '../../common/swagger';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { BoardingHousesService } from './boarding-houses.service';
import { CreateBoardingHouseDto } from './dto/create-boarding-house.dto';
import {
  BoardingHouseListResponseDto,
  BoardingHouseResponseDto,
  CreateBoardingHouseResponseDto,
} from './dto/boarding-house-response.dto';

@ApiTags('Boarding Houses')
@Controller('boarding-houses')
export class BoardingHousesController {
  private readonly logger = new Logger(BoardingHousesController.name);

  constructor(
    private readonly boardingHousesService: BoardingHousesService,
  ) {}

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
