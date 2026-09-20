import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionPackage, SubscriptionStatus, UserRole } from '@prisma';
import { SubscriptionTierGuard } from './subscription-tier.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('SubscriptionTierGuard', () => {
  let guard: SubscriptionTierGuard;
  let reflector: {
    getAllAndOverride: jest.Mock;
  };
  let prisma: {
    userSubscription: {
      findFirst: jest.Mock;
    };
    boardingHouse: {
      findUnique: jest.Mock;
    };
  };

  const USER_ID = 'user-123';
  const OWNER_ID = 'landlord-456';

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    prisma = {
      userSubscription: {
        findFirst: jest.fn(),
      },
      boardingHouse: {
        findUnique: jest.fn(),
      },
    };

    guard = new SubscriptionTierGuard(
      reflector as unknown as Reflector,
      prisma as unknown as PrismaService,
    );
  });

  const createMockContext = (req: Record<string, unknown>): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getClass: () => ({}),
      getHandler: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({}),
      switchToWs: () => ({}),
      getType: () => 'http',
    } as unknown as ExecutionContext;
  };

  it('should allow access if no @RequireTier() metadata is set', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const context = createMockContext({
      user: { id: USER_ID, role: UserRole.landlord },
      headers: {},
      method: 'GET',
      url: '/test',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(prisma.userSubscription.findFirst).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if req.user is undefined', async () => {
    reflector.getAllAndOverride.mockReturnValue(SubscriptionPackage.plus);

    const context = createMockContext({
      headers: {},
      method: 'GET',
      url: '/test',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow admin users to bypass any tier check', async () => {
    reflector.getAllAndOverride.mockReturnValue(SubscriptionPackage.pro);

    const context = createMockContext({
      user: { id: USER_ID, role: UserRole.admin },
      headers: {},
      method: 'GET',
      url: '/admin-bypass',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(prisma.userSubscription.findFirst).not.toHaveBeenCalled();
  });

  it('should deny free user when plus tier is required and return structured 403 error', async () => {
    reflector.getAllAndOverride.mockReturnValue(SubscriptionPackage.plus);
    prisma.userSubscription.findFirst.mockResolvedValue(null); // No subscription = free

    const context = createMockContext({
      user: { id: USER_ID, role: UserRole.landlord },
      headers: {},
      method: 'POST',
      url: '/expenses',
    });

    let thrownError: ForbiddenException | undefined;
    try {
      await guard.canActivate(context);
    } catch (err) {
      thrownError = err as ForbiddenException;
    }

    expect(thrownError).toBeInstanceOf(ForbiddenException);
    expect(thrownError?.getResponse()).toEqual({
      statusCode: 403,
      error: 'Forbidden',
      code: 'SUBSCRIPTION_TIER_REQUIRED',
      message: 'This feature requires the Plus plan or higher. Your current plan is Free. Please upgrade your subscription to access this feature.',
      requiredTier: SubscriptionPackage.plus,
      currentTier: SubscriptionPackage.free,
      upgradeUrl: '/pricing',
    });
  });

  it('should allow user on plus tier when plus tier is required', async () => {
    reflector.getAllAndOverride.mockReturnValue(SubscriptionPackage.plus);
    prisma.userSubscription.findFirst.mockResolvedValue({
      planName: SubscriptionPackage.plus,
    });

    const req: Record<string, unknown> = {
      user: { id: USER_ID, role: UserRole.landlord },
      headers: {},
      method: 'GET',
      url: '/expenses',
    };
    const context = createMockContext(req);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(req.subscriptionTier).toBe(SubscriptionPackage.plus);
  });

  it('should deny plus user when pro tier is required', async () => {
    reflector.getAllAndOverride.mockReturnValue(SubscriptionPackage.pro);
    prisma.userSubscription.findFirst.mockResolvedValue({
      planName: SubscriptionPackage.plus,
    });

    const context = createMockContext({
      user: { id: USER_ID, role: UserRole.landlord },
      headers: {},
      method: 'POST',
      url: '/employees',
    });

    let thrownError: ForbiddenException | undefined;
    try {
      await guard.canActivate(context);
    } catch (err) {
      thrownError = err as ForbiddenException;
    }

    expect(thrownError).toBeInstanceOf(ForbiddenException);
    expect(thrownError?.getResponse()).toEqual({
      statusCode: 403,
      error: 'Forbidden',
      code: 'SUBSCRIPTION_TIER_REQUIRED',
      message: 'This feature requires the Pro plan or higher. Your current plan is Plus. Please upgrade your subscription to access this feature.',
      requiredTier: SubscriptionPackage.pro,
      currentTier: SubscriptionPackage.plus,
      upgradeUrl: '/pricing',
    });
  });

  it('should allow user on pro tier when plus or pro tier is required', async () => {
    reflector.getAllAndOverride.mockReturnValue(SubscriptionPackage.plus);
    prisma.userSubscription.findFirst.mockResolvedValue({
      planName: SubscriptionPackage.pro,
    });

    const req: Record<string, unknown> = {
      user: { id: USER_ID, role: UserRole.landlord },
      headers: {},
      method: 'GET',
      url: '/expenses',
    };
    const context = createMockContext(req);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should check boarding house owner subscription if user is an employee', async () => {
    reflector.getAllAndOverride.mockReturnValue(SubscriptionPackage.pro);
    prisma.boardingHouse.findUnique.mockResolvedValue({ ownerId: OWNER_ID });
    prisma.userSubscription.findFirst.mockResolvedValue({
      planName: SubscriptionPackage.pro,
    });

    const context = createMockContext({
      user: { id: USER_ID, role: UserRole.employee },
      boardingHouseId: 'house-789',
      headers: {},
      method: 'GET',
      url: '/schedules',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(prisma.boardingHouse.findUnique).toHaveBeenCalledWith({
      where: { id: 'house-789' },
      select: { ownerId: true },
    });
    expect(prisma.userSubscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: OWNER_ID,
          status: SubscriptionStatus.active,
        }),
      }),
    );
  });
});
