import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionPackage, SubscriptionStatus } from '@prisma';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRE_TIER_KEY } from '../decorators/require-tier.decorator';
import { JwtPayload } from '../../modules/auth/types/jwt-payload.type';

export const TIER_WEIGHTS: Record<SubscriptionPackage, number> = {
  [SubscriptionPackage.free]: 0,
  [SubscriptionPackage.plus]: 1,
  [SubscriptionPackage.pro]: 2,
};

export const TIER_DISPLAY_NAMES: Record<SubscriptionPackage, string> = {
  [SubscriptionPackage.free]: 'Free',
  [SubscriptionPackage.plus]: 'Plus',
  [SubscriptionPackage.pro]: 'Pro',
};

/**
 * Guard that enforces subscription tier requirements (free < plus < pro).
 *
 * Checks the active subscription for the authenticated user (or property owner if accessed by staff).
 * If the current tier does not meet the requirement, throws a 403 ForbiddenException with
 * code 'SUBSCRIPTION_TIER_REQUIRED' containing tier details for frontend handling.
 */
@Injectable()
export class SubscriptionTierGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionTierGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<SubscriptionPackage>(
      REQUIRE_TIER_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @RequireTier() decorator applied — allow access
    if (!requiredTier) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{
      user?: JwtPayload;
      headers: Record<string, string>;
      params?: Record<string, string>;
      boardingHouseId?: string;
      subscriptionTier?: SubscriptionPackage;
      method: string;
      url: string;
    }>();

    const user = req.user;
    if (!user) {
      this.logger.warn(`SubscriptionTierGuard invoked without authenticated user on ${req.method} ${req.url}`);
      throw new UnauthorizedException('Authentication required');
    }

    // System administrators bypass subscription tier checks
    if (user.role === 'admin') {
      this.logger.debug(`Admin user ${user.id} bypassed subscription tier check for ${requiredTier}`);
      return true;
    }

    // Resolve target user ID:
    // If the caller is an employee operating within a boarding house, check the property owner's subscription.
    let targetUserId = user.id;
    const boardingHouseId =
      req.boardingHouseId ||
      req.headers?.['x-boarding-house-id'] ||
      req.params?.boardingHouseId;

    if (user.role === 'employee' && boardingHouseId) {
      const house = await this.prisma.boardingHouse.findUnique({
        where: { id: boardingHouseId },
        select: { ownerId: true },
      });
      if (house?.ownerId) {
        targetUserId = house.ownerId;
      }
    }

    const now = new Date();
    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId: targetUserId,
        status: SubscriptionStatus.active,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      select: { planName: true },
    });

    const currentTier: SubscriptionPackage = activeSub?.planName ?? SubscriptionPackage.free;
    const currentWeight = TIER_WEIGHTS[currentTier] ?? 0;
    const requiredWeight = TIER_WEIGHTS[requiredTier] ?? 0;

    if (currentWeight < requiredWeight) {
      this.logger.warn(
        `User ${user.id} (current tier: ${currentTier}) denied access to ${requiredTier}-gated resource on ${req.method} ${req.url}`,
      );

      const requiredName = TIER_DISPLAY_NAMES[requiredTier] ?? requiredTier;
      const currentName = TIER_DISPLAY_NAMES[currentTier] ?? currentTier;

      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        code: 'SUBSCRIPTION_TIER_REQUIRED',
        message: `This feature requires the ${requiredName} plan or higher. Your current plan is ${currentName}. Please upgrade your subscription to access this feature.`,
        requiredTier,
        currentTier,
        upgradeUrl: '/pricing',
      });
    }

    req.subscriptionTier = currentTier;
    this.logger.debug(
      `User ${user.id} (tier: ${currentTier}) granted access to ${requiredTier}-gated resource on ${req.method} ${req.url}`,
    );

    return true;
  }
}
