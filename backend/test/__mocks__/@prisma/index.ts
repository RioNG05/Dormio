/**
 * Manual mock for the @prisma path alias (generated/prisma).
 *
 * In unit tests, PrismaService is provided as a jest mock via TestingModule,
 * so we never need the real Prisma client. This stub exports the enums and
 * types used by services so TypeScript is satisfied.
 */

export enum UserRole {
  landlord = 'landlord',
  tenant = 'tenant',
  employee = 'employee',
  admin = 'admin',
}

export enum UserStatus {
  active = 'active',
  inactive = 'inactive',
  banned = 'banned',
}

// Minimal PrismaClient stub — never instantiated in unit tests
export class PrismaClient {}

// Re-export everything as unknown to satisfy any other import
export default {};
