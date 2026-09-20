import { SetMetadata } from '@nestjs/common';
import { SubscriptionPackage } from '@prisma';

export const REQUIRE_TIER_KEY = 'required_tier';

/**
 * Restrict route access to users with a minimum subscription tier.
 * Tiers follow the hierarchy: free < plus < pro.
 *
 * @param tier Minimum subscription tier required to access this endpoint
 *
 * @example
 * @RequireTier(SubscriptionPackage.plus)
 * @Get('expenses')
 * async getExpenses() {}
 */
export const RequireTier = (tier: SubscriptionPackage) =>
  SetMetadata(REQUIRE_TIER_KEY, tier);
