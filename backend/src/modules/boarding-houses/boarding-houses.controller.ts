import { Body, Controller, Logger, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiAuth } from '../../common/swagger';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { BoardingHousesService } from './boarding-houses.service';
import { CreateBoardingHouseDto } from './dto/create-boarding-house.dto';
import {
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
