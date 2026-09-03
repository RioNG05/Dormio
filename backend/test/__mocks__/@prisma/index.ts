/**
 * Manual mock for the @prisma path alias (generated/prisma).
 *
 * In unit tests, PrismaService is provided as a jest mock via TestingModule,
 * so we never need the real Prisma client. This stub exports the enums and
 * types used by services so TypeScript and Jest runtime are satisfied.
 */

export enum UserRole {
  leasing_agent = 'leasing_agent',
  tenant = 'tenant',
  employee = 'employee',
  landlord = 'landlord',
  admin = 'admin',
}

export enum UserStatus {
  active = 'active',
  inactive = 'inactive',
  banned = 'banned',
}

export enum BoardingHouseStatus {
  active = 'active',
  inactive = 'inactive',
  banned = 'banned',
}

export enum RoomStatus {
  available = 'available',
  deposited = 'deposited',
  occupied = 'occupied',
  maintainace = 'maintainace',
}

export enum ContractStatus {
  draft = 'draft',
  active = 'active',
  expired = 'expired',
  canceled = 'canceled',
}

export enum SubscriptionPackage {
  free = 'free',
  plus = 'plus',
  pro = 'pro',
}

export enum SubscriptionStatus {
  pending = 'pending',
  active = 'active',
  expired = 'expired',
  canceled = 'canceled',
}

export enum BillingCycle {
  monthly = 'monthly',
  yearly = 'yearly',
}

export enum ExpenseStatus {
  pending = 'pending',
  paid = 'paid',
  canceled = 'canceled',
}

export enum ServiceStatus {
  active = 'active',
  inactive = 'inactive',
}

export enum DepositType {
  contract = 'contract',
  platform = 'platform',
}

export enum DepositStatus {
  pending = 'pending',
  paid = 'paid',
  refund = 'refund',
  forfeited = 'forfeited',
}

export enum PostStatus {
  draft = 'draft',
  posted = 'posted',
  hidden = 'hidden',
}

export enum SourceType {
  free_quote = 'free_quote',
  purchased = 'purchased',
}

export enum PostPurchaseStatus {
  pending = 'pending',
  paid = 'paid',
  canceled = 'canceled',
  failed = 'failed',
}

export enum InvoiceStatus {
  unpaid = 'unpaid',
  paid = 'paid',
  overdue = 'overdue',
}

export enum PaymentType {
  charge = 'charge',
  refund = 'refund',
}

export enum PaymentMethod {
  cash = 'cash',
  banking = 'banking',
}

export enum PaymentStatus {
  pending = 'pending',
  success = 'success',
  failed = 'failed',
}

export class Decimal {
  private val: number;
  constructor(value: number | string) {
    this.val = Number(value);
  }
  toNumber(): number {
    return this.val;
  }
  toString(): string {
    return String(this.val);
  }
}

export const Prisma = {
  Decimal,
};

// Minimal PrismaClient stub — never instantiated in unit tests
export class PrismaClient {}

export default {};
