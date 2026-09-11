import { ExecutionContext, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PropertyOwnershipGuard } from './property-ownership.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('PropertyOwnershipGuard (UC-L-23)', () => {
  let guard: PropertyOwnershipGuard;
  let prisma: {
    boardingHouse: {
      findFirst: jest.Mock;
    };
  };

  const VALID_UUID = '11111111-1111-4111-8111-111111111111';
  const OTHER_UUID = '22222222-2222-4222-8222-222222222222';
  const USER_ID = 'user-landlord-123';

  beforeEach(() => {
    prisma = {
      boardingHouse: {
        findFirst: jest.fn(),
      },
    };
    guard = new PropertyOwnershipGuard(prisma as unknown as PrismaService);
  });

  const createMockContext = (req: any): ExecutionContext => {
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

  it('should throw BadRequestException if boarding house ID is missing from headers and params', async () => {
    const req = {
      user: { id: USER_ID },
      headers: {},
      params: {},
    };
    const context = createMockContext(req);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new BadRequestException('X-Boarding-House-Id header is required'),
    );
  });

  it('should throw BadRequestException if boarding house ID is not a valid UUID', async () => {
    const req = {
      user: { id: USER_ID },
      headers: { 'x-boarding-house-id': 'not-a-uuid' },
      params: {},
    };
    const context = createMockContext(req);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new BadRequestException('X-Boarding-House-Id must be a valid UUID'),
    );
  });

  it('should return false if user is missing from request', async () => {
    const req = {
      user: undefined,
      headers: { 'x-boarding-house-id': VALID_UUID },
      params: {},
    };
    const context = createMockContext(req);

    const result = await guard.canActivate(context);
    expect(result).toBe(false);
  });

  it('should throw ForbiddenException if user does not own the boarding house', async () => {
    const req = {
      user: { id: USER_ID },
      headers: { 'x-boarding-house-id': OTHER_UUID },
      params: {},
    };
    const context = createMockContext(req);
    prisma.boardingHouse.findFirst.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('You do not have access to this boarding house'),
    );
    expect(prisma.boardingHouse.findFirst).toHaveBeenCalledWith({
      where: { id: OTHER_UUID, ownerId: USER_ID },
      select: { id: true, name: true },
    });
  });

  it('should succeed and attach property context when user owns the boarding house (via header)', async () => {
    const req: any = {
      user: { id: USER_ID },
      headers: { 'x-boarding-house-id': VALID_UUID },
      params: {},
    };
    const context = createMockContext(req);
    const mockHouse = { id: VALID_UUID, name: 'Dormio Premier Q.1' };
    prisma.boardingHouse.findFirst.mockResolvedValue(mockHouse);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(req.boardingHouseId).toBe(VALID_UUID);
    expect(req.boardingHouse).toEqual(mockHouse);
    expect(req.headers['x-boarding-house-id']).toBe(VALID_UUID);
  });

  it('should succeed and resolve from params.id when header is omitted', async () => {
    const req: any = {
      user: { id: USER_ID },
      headers: {},
      params: { id: VALID_UUID },
    };
    const context = createMockContext(req);
    const mockHouse = { id: VALID_UUID, name: 'Campus Cầu Giấy' };
    prisma.boardingHouse.findFirst.mockResolvedValue(mockHouse);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(req.boardingHouseId).toBe(VALID_UUID);
    expect(req.boardingHouse).toEqual(mockHouse);
    expect(req.headers['x-boarding-house-id']).toBe(VALID_UUID);
  });

  it('should handle comma-separated header values if joined by HTTP parser and take the first UUID', async () => {
    const req: any = {
      user: { id: USER_ID },
      headers: { 'x-boarding-house-id': `${VALID_UUID}, ${VALID_UUID}` },
      params: {},
    };
    const context = createMockContext(req);
    const mockHouse = { id: VALID_UUID, name: 'Dormio Premier Q.1' };
    prisma.boardingHouse.findFirst.mockResolvedValue(mockHouse);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(req.boardingHouseId).toBe(VALID_UUID);
    expect(req.boardingHouse).toEqual(mockHouse);
  });
});
