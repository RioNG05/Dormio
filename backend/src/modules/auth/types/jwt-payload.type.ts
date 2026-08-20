import type { UserRole } from '@prisma';

/**
 * Shape of the JWT payload stored in the token and attached to `req.user`.
 */
export interface JwtPayload {
  /** User ID (UUID) */
  id: string;
  /** User role from Prisma UserRole enum */
  role: UserRole;
}
