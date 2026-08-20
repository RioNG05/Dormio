import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma';

export const ROLES_KEY = 'roles';

/**
 * Restrict route access to specific user roles.
 *
 * @example
 * @Roles('landlord', 'admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('dashboard')
 * async getDashboard() {}
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
