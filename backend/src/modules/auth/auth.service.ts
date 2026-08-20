import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { User, UserRole } from '@prisma';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;
const DEFAULT_PASSWORD = '00000000';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── Register ──────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existing) {
      throw new ConflictException('phone_number_already_exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        hashedPassword,
        username: dto.fullName,
        role: UserRole.landlord, // Default: landlords self-register
        mustChangePassword: false,
      },
    });

    return {
      token: this.signToken(user),
      user: this.sanitizeUser(user),
    };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('invalid_credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!isValid) {
      throw new UnauthorizedException('invalid_credentials');
    }

    return {
      token: this.signToken(user),
      user: this.sanitizeUser(user),
      mustChangePassword: user.mustChangePassword,
    };
  }

  // ─── Change Password ────────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.hashedPassword,
    );
    if (!isValid) {
      throw new BadRequestException('current_password_incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('new_password_must_differ');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedPassword,
        mustChangePassword: false,
      },
    });
  }

  // ─── findOrCreateByPhone (used by UC-L-04 and UC-L-19) ────────────────────

  async findOrCreateByPhone(
    phoneNumber: string,
    fullName?: string,
    role: UserRole = UserRole.tenant,
  ): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existing) return existing;

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        phoneNumber,
        hashedPassword,
        username: fullName,
        role,
        mustChangePassword: true, // Force password reset on first login
      },
    });

    // Note: SMS/Zalo notification should be queued via BullMQ (NOT called here)
    // await notifQueue.add('send-welcome', { userId: user.id });

    return user;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private signToken(user: Pick<User, 'id' | 'role'>): string {
    const payload: Omit<JwtPayload, 'id'> & { sub: string } = {
      sub: user.id,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User) {
    // Never return hashedPassword to client
    const { hashedPassword: _, ...safe } = user;
    return safe;
  }
}
