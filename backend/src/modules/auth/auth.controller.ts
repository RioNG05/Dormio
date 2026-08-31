import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // ─── Register ──────────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Register a new landlord account' })
  @ApiResponse({ status: 201, description: 'Account created, token returned' })
  @ApiResponse({ status: 409, description: 'Phone number already exists' })
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`POST /auth/register called with phoneNumber: ${dto.phoneNumber}`);
    return this.authService.register(dto);
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Login with phone number and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Check mustChangePassword flag.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    this.logger.log(`POST /auth/login called with identifier: ${dto.identifier}`);
    return this.authService.login(dto);
  }

  // ─── Change Password ────────────────────────────────────────────────────────

  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password (required when mustChangePassword is true)',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(`PATCH /auth/change-password called by user: ${user?.id}`);
    await this.authService.changePassword(user.id, dto);
    return { message: 'Password changed successfully' };
  }
}
