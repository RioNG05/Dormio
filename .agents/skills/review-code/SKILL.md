---
name: review-code
description: >-
  Comprehensive code review for Dormio codebase. Checks architecture, TypeScript,
  NestJS, Next.js, Prisma, PostgreSQL, security, performance, error handling,
  validation, testing, and technical specification compliance.
  Trigger on: "review code", "code review", "review this file", "review PR",
  "/review-code", "check this implementation".
---

# Skill: Code Review (Dormio)

> Output a structured report with severity levels.
> Never just list issues — always explain WHY it is a problem and HOW to fix it.

---

## Review Dimensions

1. Architecture & Design
2. TypeScript correctness
3. NestJS patterns
4. Next.js patterns
5. Prisma / PostgreSQL
6. Security
7. Performance
8. Error handling & validation
9. Testing coverage
10. Technical spec compliance

---

## Output Format

```
## Code Review Report — [file or feature name]
Reviewed: [timestamp]

### CRITICAL
Issues that break correctness, security, or data integrity.

### HIGH
Issues that cause bugs, data loss risk, or security vulnerabilities under edge cases.

### MEDIUM
Functional gaps, missing validation, inconsistencies.

### LOW
Style, naming, minor inconsistencies with project conventions.

### POSITIVE
What's done well — acknowledge good patterns.
```

---

## Dimension 1 — Architecture & Design

Check:
- [ ] Module boundaries respected (no cross-module direct imports bypassing service layer)
- [ ] Shared logic extracted to `common/` (not duplicated across modules)
- [ ] `PrismaService` injected, not instantiated directly
- [ ] No circular dependencies
- [ ] Response shape follows envelope `{ success, data, meta? }`
- [ ] File naming follows convention: `<feature>.<type>.ts`

**Red flags:**
```typescript
// BAD: business logic in controller
@Post()
async create(@Body() dto) {
  if (dto.name.length < 3) throw ...; // validation belongs in DTO / pipe
  const room = new PrismaClient().room.create(...); // never instantiate directly
}
```

---

## Dimension 2 — TypeScript

Check:
- [ ] No `any` types — use explicit types or generics
- [ ] DTO fields typed, not `Record<string, any>`
- [ ] Response types defined (not `Promise<any>`)
- [ ] Prisma model types used from `generated/prisma`, not re-declared manually
- [ ] Optional fields marked `?`, not `| undefined` everywhere

```typescript
// BAD
async findAll(): Promise<any> { ... }
const data: any = await this.service.create(body as any);

// GOOD
async findAll(): Promise<RoomDto[]> { ... }
```

---

## Dimension 3 — NestJS Patterns

Check:
- [ ] `PropertyOwnershipGuard` on all BHMS controller methods
- [ ] `JwtAuthGuard` on all authenticated endpoints
- [ ] `@Roles()` + `RolesGuard` on admin-only endpoints
- [ ] Validation pipe applied globally (or per-DTO with `class-validator`)
- [ ] Exception filters using `HttpException` subclasses (not `throw new Error()`)
- [ ] No business logic in controllers — delegate to service
- [ ] No Prisma calls in controllers — only in services
- [ ] Module registered in `app.module.ts`

```typescript
// BAD: no guards, logic in controller
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.prisma.room.findUnique({ where: { id } }); // prisma in controller!
}

// GOOD
@Get(':id')
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
async findOne(@Param('id') id: string) {
  return { success: true, data: await this.roomService.findOne(id) };
}
```

---

## Dimension 4 — Next.js Patterns

Check:
- [ ] Server components by default — `"use client"` only when required
- [ ] No raw `fetch()` in components — use `services/` functions
- [ ] No secrets in client components or `NEXT_PUBLIC_*` env vars
- [ ] `export const metadata` on every page
- [ ] Auth check via `middleware.ts`, not repeated in each page
- [ ] Loading and error states handled (`loading.tsx`, `error.tsx`, Suspense)
- [ ] Dynamic routes use `generateStaticParams` when appropriate

```typescript
// BAD: raw fetch in component, no auth header
export default async function RoomsPage() {
  const rooms = await fetch('http://localhost:3001/rooms').then(r => r.json());
}

// GOOD
export default async function RoomsPage() {
  const rooms = await getRooms(boardingHouseId); // service function handles auth
}
```

---

## Dimension 5 — Prisma / PostgreSQL

Check:
- [ ] No `Float` for money fields — must use `Decimal`
- [ ] No N+1: related data fetched via `include`, not sequential queries
- [ ] Mutations on financial entities use `$transaction()` with `auditLog`
- [ ] No hard-delete on CONTRACT/PAYMENT/INVOICE/DEPOSIT
- [ ] Pagination on all list queries (`skip`, `take`, `count`)
- [ ] `select` used to exclude sensitive fields (`hashedPassword`)
- [ ] `$transaction` used for multi-step atomic operations
- [ ] Unique constraints enforced at DB level, not just app level

```typescript
// BAD: N+1
const rooms = await prisma.room.findMany({ where: { boardingHouseId } });
for (const r of rooms) { r.contracts = await prisma.contract.findMany(...); }

// GOOD
const rooms = await prisma.room.findMany({
  where: { boardingHouseId },
  include: { contracts: { where: { status: 'active' }, include: { contractTenants: true } } },
});
```

---

## Dimension 6 — Security

Check:
- [ ] `PropertyOwnershipGuard` on every BHMS endpoint (no bypass)
- [ ] Tenant data scoped: `contractTenants.some(ct => ct.tenantId === userId)`
- [ ] Employee data scoped: filtered by `EMPLOYEE_ASSIGNMENT.boardingHouseId`
- [ ] Phone/email not exposed in public poster profile unless authenticated
- [ ] ID card images served via signed URLs only (never public URL)
- [ ] JWT secret in env var, not hardcoded
- [ ] Password hashed with bcrypt (cost factor ≥ 10)
- [ ] No sensitive data in error messages returned to client
- [ ] Webhook endpoints validate signature (payment gateway)

```typescript
// BAD: no ownership check on delete
@Delete(':id')
async remove(@Param('id') id: string) { return this.service.remove(id); }

// GOOD
@Delete(':id')
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard) // validates X-Boarding-House-Id
async remove(@Param('id') id: string, @Request() req) {
  return this.service.remove(id, req.user.id);
}
```

---

## Dimension 7 — Performance

Check:
- [ ] No missing indexes on FK columns and common WHERE fields
- [ ] Dashboard aggregations use `$transaction([...])` in parallel, not sequential
- [ ] Large fan-out operations (mass notifications) use BullMQ, not inline loops
- [ ] Cron jobs use scheduled BullMQ, not `setInterval` in server code
- [ ] No `SELECT *` when only a few fields needed
- [ ] Chat messages use cursor pagination, not offset
- [ ] Analytics queries consider `GROUP BY` + aggregate vs loading all rows

---

## Dimension 8 — Error Handling & Validation

Check:
- [ ] All DTO fields have `class-validator` decorators
- [ ] Controller methods catch expected errors and re-throw as `HttpException`
- [ ] Prisma `PrismaClientKnownRequestError` caught (e.g. unique constraint violation → 409)
- [ ] HTTP status codes correct: 200/201/204/400/401/403/404/409/422
- [ ] Quota/limit errors return clear error codes (e.g. `out_of_posting_quota`)

```typescript
// GOOD: catch Prisma unique violation
try {
  return await this.prisma.room.create({ data: dto });
} catch (e) {
  if (e.code === 'P2002') throw new ConflictException('Room name already exists in this boarding house');
  throw e;
}
```

---

## Dimension 9 — Testing

Check:
- [ ] Unit tests exist for the service
- [ ] Happy path tested
- [ ] Edge cases tested (quota exceeded, room not in boarding house, etc.)
- [ ] Guard behavior tested (missing header → 403)
- [ ] Financial flow tests: correct entity created, no wrong entity created
  (e.g. external contract: DEPOSIT created, PAYMENT NOT created)

---

## Dimension 10 — Spec Compliance

Load `verify-spec` skill and run a quick compliance check:
- [ ] All UC flow steps have corresponding code
- [ ] No extra behavior not in spec (unless explicitly noted)
- [ ] Cross-cutting rules: AuditLog, soft-delete, Decimal money, async queue, single chat system

---

## Severity Definitions

| Level | Meaning |
|---|---|
| CRITICAL | Breaks correctness or security — must fix before merging |
| HIGH | Causes bugs or data integrity issues under real conditions |
| MEDIUM | Missing behavior, functional gap, weak validation |
| LOW | Style issue, naming mismatch, minor convention deviation |
