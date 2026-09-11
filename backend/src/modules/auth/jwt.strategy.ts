import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { UserRole } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtPayload } from './types/jwt-payload.type';

interface RawJwtPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Passport JWT strategy.
 * Extracts token from Authorization: Bearer <token>.
 * Validates user existence and status in the database.
 * The return value is attached to `req.user` as JwtPayload.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: RawJwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status === 'banned') {
      throw new UnauthorizedException(
        'User account not found or deactivated. Please log in again.',
      );
    }

    return {
      id: user.id,
      role: user.role,
    };
  }
}
