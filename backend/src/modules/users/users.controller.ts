import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
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
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpsertUserIdentificationDto } from './dto/upsert-user-identification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Users & Identification')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get(['identification', 'me/identification'])
  @ApiOperation({
    summary: 'Get user identity verification details (UC-PU-04 Gate)',
    description:
      'Checks whether the authenticated user has verified their national ID (CCCD). Required prior to placing direct online deposits.',
  })
  @ApiOkResponse({
    description: 'User identification status and data',
    schema: {
      example: {
        hasIdentification: true,
        identification: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          identityNumber: '001202012345',
          fullName: 'NGUYEN VAN A',
          gender: 'male',
        },
      },
    },
  })
  async getIdentification(@CurrentUser() user: JwtPayload) {
    this.logger.log(`GET /api/v1/users/identification called by user ${user.id}`);
    return this.usersService.getIdentification(user.id);
  }

  @Post(['identification', 'me/identification'])
  @Put(['identification', 'me/identification'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit or update user identity verification (UC-PU-04 Gate)',
    description:
      'Saves national citizen identification details. Reused for all future platform deposits and rental contracts.',
  })
  @ApiCreatedResponse({
    description: 'Identification saved successfully',
    schema: {
      example: {
        hasIdentification: true,
        identification: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          identityNumber: '001202012345',
          fullName: 'NGUYEN VAN A',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Citizen ID number is already registered by another account',
  })
  async upsertIdentification(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertUserIdentificationDto,
  ) {
    this.logger.log(
      `POST /api/v1/users/identification called by user ${user.id} with CCCD ${dto.identityNumber}`,
    );
    return this.usersService.upsertIdentification(user.id, dto);
  }
}
