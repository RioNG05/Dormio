---
name: postgresql
description: >-
  PostgreSQL schema design and query best practices for Dormio.
  Covers primary keys, foreign keys, constraints, indexes, unique constraints,
  transactions, isolation levels, query optimization, N+1 prevention, pagination,
  soft delete, auditing, concurrency, and data integrity.
  Trigger on: "schema design", "index", "N+1", "pagination", "query optimization",
  "constraint", "transaction", "migration", "relation", "join".
---

# Skill: PostgreSQL Best Practices (Dormio)

## Overview

Dormio uses PostgreSQL via Prisma v7 + `@prisma/adapter-pg`.
This skill covers how to design and query the DB correctly — especially for a
multi-tenant property management system with complex relations.

---

## 1. Primary Keys

Always use UUID (`String @id @default(uuid())`).
```prisma
model Room {
  id String @id @default(uuid())
}
```
Never use auto-increment integers for public-facing IDs (security via obscurity + distributed system safety).

---

## 2. Foreign Keys & Relations

- Define FK explicitly with `@relation` in Prisma.
- Financial table FKs (`PAYMENT`, `INVOICE`, `CONTRACT`, `DEPOSIT`) → `onDelete: Restrict` to prevent accidental cascade-delete.
- Soft relations (e.g. optional room on deposit): mark as `String? @db.Uuid` in Prisma.

```prisma
model Contract {
  id     String @id @default(uuid())
  roomId String @map("room_id") @db.Uuid
  room   Room   @relation(fields: [roomId], references: [id], onDelete: Restrict)
}
```

---

## 3. Constraints & Unique Indexes

Always enforce uniqueness at the DB level, not just application level:

```prisma
// Room name unique within a boarding house
model Room {
  @@unique([boardingHouseId, name])
}

// Conversation pair: user1 always < user2 (enforce in service layer)
model Conversation {
  @@unique([user1Id, user2Id])
}

// Idempotency: payment webhook deduplication
model Payment {
  transactionRef String? @unique @map("transaction_ref")
}

// Bookmark toggle: no duplicate saves
model SavedPost {
  @@unique([userId, postId])
}
```

---

## 4. Indexes

Add indexes to every FK column and any column used in WHERE filters:

```prisma
model Invoice {
  boardingHouseId String @map("boarding_house_id")
  contractId      String @map("contract_id")
  status          InvoiceStatus
  period          DateTime

  @@index([boardingHouseId])       // frequent filter
  @@index([contractId])            // join
  @@index([status])                // filter by status
  @@index([boardingHouseId, period, status]) // composite for dashboard query
}

model WorkSchedule {
  employeeId      String
  boardingHouseId String
  workDate        DateTime

  @@index([employeeId])
  @@index([boardingHouseId, workDate])  // calendar range query
}
```

Rule of thumb: every `WHERE`, `JOIN`, `ORDER BY` column used in a hot query needs an index.

---

## 5. Transactions & Isolation

Use `$transaction()` for any multi-step write that must be atomic:

```typescript
// Good: contract creation + deposit + audit in one transaction
await this.prisma.$transaction(async (tx) => {
  const contract = await tx.contract.create({ data: contractData });
  await tx.deposit.create({ data: { contractId: contract.id, ...depositData } });
  await tx.auditLog.create({ data: { entityId: contract.id, ... } });
  await tx.room.update({ where: { id: roomId }, data: { status: 'occupied' } });
});
```

Default isolation level: **READ COMMITTED** (PostgreSQL default) — sufficient for most cases.

Use `REPEATABLE READ` or `SERIALIZABLE` only for:
- Concurrent inventory checks (room availability)
- Posting quota check + insert (prevent race condition on `dailyPostQuota`)

```typescript
// Serializable for quota check + post insert (prevent double-posting race)
await this.prisma.$transaction(
  async (tx) => {
    const count = await tx.post.count({ where: { postedBy: userId, ... } });
    if (count >= quota) throw new BadRequestException('out_of_posting_quota');
    return tx.post.create({ data: postData });
  },
  { isolationLevel: 'Serializable' }
);
```

---

## 6. Query Optimization — Avoid N+1

**Bad (N+1):**
```typescript
// Fetches rooms, then for each room fetches tenants separately = N+1 queries
const rooms = await prisma.room.findMany({ where: { boardingHouseId } });
for (const room of rooms) {
  room.tenants = await prisma.contract.findMany({ where: { roomId: room.id } });
}
```

**Good (single query with include):**
```typescript
const rooms = await prisma.room.findMany({
  where: { boardingHouseId },
  include: {
    contracts: {
      where: { status: 'active' },
      include: {
        contractTenants: {
          include: { tenant: { select: { id: true, username: true, phoneNumber: true } } },
        },
      },
    },
    roomServices: {
      where: { isActive: true },
      include: { service: true },
    },
  },
});
```

**Example: "Get all rooms with current tenants" (UC-L-05)**
```typescript
// One query, full room dashboard DTO
const room = await prisma.room.findUnique({
  where: { id: roomId },
  include: {
    roomServices: { where: { isActive: true }, include: { service: true } },
    contracts: {
      where: { status: 'active' },
      include: {
        contractTenants: { include: { tenant: true } },
        deposit: true,
      },
    },
    // Rental history: last 10 contracts
    _count: false,
  },
});
```

**Select only needed fields:**
```typescript
// Don't select hashedPassword, sensitive fields
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, username: true, phoneNumber: true, role: true, avatarUrl: true },
});
```

---

## 7. Pagination

Always paginate list endpoints. Use cursor-based or offset:

```typescript
// Offset pagination (simple, good for non-realtime lists)
async findAll(boardingHouseId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await this.prisma.$transaction([
    this.prisma.room.findMany({
      where: { boardingHouseId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.room.count({ where: { boardingHouseId } }),
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// Cursor pagination (better for infinite scroll, realtime feeds)
async getMessages(conversationId: string, cursor?: string, limit = 30) {
  return this.prisma.message.findMany({
    where: { conversationId },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { sentAt: 'desc' },
  });
}
```

---

## 8. Soft Delete Pattern

Never hard-delete financial or contract records. Use status fields:

```typescript
// Bad
await prisma.contract.delete({ where: { id } });

// Good — status transition
await prisma.contract.update({
  where: { id },
  data: { status: 'canceled' },
});
```

For non-financial entities that need soft delete (e.g. posts):
```prisma
model Post {
  deletedAt DateTime? @map("deleted_at")  // null = not deleted
  @@index([deletedAt])
}
```
```typescript
// Always filter soft-deleted in queries
where: { deletedAt: null, boardingHouseId }
```

---

## 9. Audit Logging

Write audit rows in the same `$transaction` as the mutation:

```typescript
await prisma.$transaction(async (tx) => {
  const old = await tx.contract.findUnique({ where: { id } });
  const updated = await tx.contract.update({
    where: { id },
    data: { status: 'canceled' },
  });
  await tx.auditLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'Contract',
      entityId: id,
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(updated),
      userId,
    },
  });
  return updated;
});
```

Required entities: `Contract`, `Deposit`, `Payment`, `Invoice`, `EmployeeAssignment`, `Attendance`, `UserSubscription`.

---

## 10. Concurrency & Data Integrity

**Optimistic locking** (use `version` field for concurrent edits):
```prisma
model Contract {
  version Int @default(0)
}
```
```typescript
// Only update if version matches (prevents lost updates)
await prisma.contract.updateMany({
  where: { id, version: expectedVersion },
  data: { status: 'canceled', version: { increment: 1 } },
});
```

**CHECK constraints** (add via `@@check` or raw migration):
```sql
-- PAYMENT must have exactly one target FK non-null
ALTER TABLE payments ADD CONSTRAINT payment_target_check
  CHECK (
    (invoice_id IS NOT NULL)::int +
    (deposit_id IS NOT NULL)::int +
    (post_purchase_id IS NOT NULL)::int +
    (subscription_id IS NOT NULL)::int = 1
  );
```
Add via Prisma migration custom SQL: create empty migration then add raw SQL.

---

## 11. Composite Queries for Dashboard (avoid multiple round-trips)

```typescript
// UC-L-08: Property analytics — one $transaction for all metrics
const [revenue, rooms, expiringContracts, invoiceSummary, expenses] =
  await this.prisma.$transaction([
    this.prisma.payment.aggregate({
      where: { invoice: { room: { boardingHouseId } }, type: 'CHARGE', status: 'SUCCESS' },
      _sum: { amount: true },
    }),
    this.prisma.room.groupBy({
      by: ['status'],
      where: { boardingHouseId },
      _count: true,
    }),
    this.prisma.contract.findMany({
      where: {
        room: { boardingHouseId },
        status: 'active',
        endDate: { gte: new Date(), lte: addDays(new Date(), 30) },
      },
      include: { contractTenants: { include: { tenant: true } }, room: true },
    }),
    this.prisma.invoice.groupBy({
      by: ['status'],
      where: { room: { boardingHouseId }, period: currentPeriod },
      _count: true,
      _sum: { totalAmount: true },
    }),
    this.prisma.expense.findMany({
      where: { boardingHouseId },
      orderBy: { expenseDate: 'desc' },
      take: 10,
    }),
  ]);
```

---

## 12. Checklist Before Writing Any Query

- [ ] Does this query join through multiple relations? Use `include` not multiple queries.
- [ ] Is this a list endpoint? Add `skip`/`take` pagination + `count` in `$transaction`.
- [ ] Are all WHERE columns indexed?
- [ ] Does the mutation touch financial data? Use `$transaction` + `auditLog`.
- [ ] Is this a concurrent write-critical path? Consider `Serializable` isolation.
- [ ] Does this touch `hashedPassword`? Use `select` to exclude it explicitly.
