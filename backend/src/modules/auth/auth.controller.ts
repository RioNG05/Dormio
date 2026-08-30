import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  RegisterResponseDto,
  LoginResponseDto,
  ChangePasswordResponseDto,
} from './dto/auth-response.dto';
import { ApiAuth } from '../../common/swagger';
import { ApiSuccessResponse, ApiErrorResponse } from '../../common/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Register ──────────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Register a new landlord account',
    description:
      'Creates a new account with the `landlord` role. Returns a JWT token and sanitized user object. ' +
      'Each phone number can only be registered once.',
  })
  @ApiCreatedResponse({
    description: 'Registration successful — returns token and user object',
    type: ApiSuccessResponse(RegisterResponseDto),
  })
  @ApiConflictResponse({
    description: '`phone_number_already_exists` — the phone number is already registered',
    type: ApiErrorResponse,
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Login with phone number and password',
    description:
      'Returns a JWT token along with the `mustChangePassword` flag. ' +
      'If `mustChangePassword` is `true`, the frontend must redirect the user to `/change-password` ' +
      'before granting access to the dashboard.',
  })
  @ApiOkResponse({
    description: 'Login successful — check the `mustChangePassword` flag',
    type: ApiSuccessResponse(LoginResponseDto),
  })
  @ApiUnauthorizedResponse({
    description: '`invalid_credentials` — wrong phone number or password',
    type: ApiErrorResponse,
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ─── Change Password ────────────────────────────────────────────────────────

  @Patch('change-password')
  @ApiAuth()
  @ApiOperation({
    summary: 'Change account password',
    description:
      'Mandatory when `mustChangePassword` is `true` (accounts created by a landlord on behalf of a tenant/staff). ' +
      'The new password must differ from the current one and be at least 8 characters.',
  })
  @ApiOkResponse({
    description: 'Password changed successfully',
    type: ApiSuccessResponse(ChangePasswordResponseDto),
  })
  @ApiBadRequestResponse({
    description:
      '`current_password_incorrect` or `new_password_must_differ`',
    type: ApiErrorResponse,
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.authService.changePassword(user.id, dto);
    return { message: 'Password changed successfully' };
  }
}
