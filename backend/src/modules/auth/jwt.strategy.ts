import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { UserRole } from '@prisma';
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
 * The return value is attached to `req.user` as JwtPayload.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  validate(payload: RawJwtPayload): JwtPayload {
    return {
      id: payload.sub,
      role: payload.role,
    };
  }
}
