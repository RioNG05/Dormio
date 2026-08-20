import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../modules/auth/types/jwt-payload.type';

/**
 * Guard that verifies the authenticated landlord actually owns the boarding house
 * specified in the `X-Boarding-House-Id` request header.
 *
 * MUST be applied on every BHMS (landlord-facing) endpoint.
 * Always apply AFTER JwtAuthGuard so req.user is populated.
 *
 * @example
 * @UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
 * @Controller('rooms')
 */
@Injectable()
export class PropertyOwnershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user: JwtPayload;
      headers: Record<string, string>;
    }>();

    const boardingHouseId = req.headers['x-boarding-house-id'];
    const userId = req.user?.id;

    if (!boardingHouseId) {
      throw new BadRequestException('X-Boarding-House-Id header is required');
    }

    if (!userId) {
      return false;
    }

    const house = await this.prisma.boardingHouse.findFirst({
      where: { id: boardingHouseId, ownerId: userId },
      select: { id: true },
    });

    if (!house) {
      throw new ForbiddenException(
        'You do not have access to this boarding house',
      );
    }

    return true;
  }
}
