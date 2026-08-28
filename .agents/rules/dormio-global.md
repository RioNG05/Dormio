# Dormio — Global Project Rules

> These rules apply to ALL code in this repository. AI agents (Codex, Claude, Antigravity) must follow them unconditionally.

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| Backend | NestJS | v11 |
| ORM / DB | Prisma v7 + PostgreSQL | — |
| Driver adapter | `@prisma/adapter-pg` (pg) | — |
| Frontend | Next.js App Router | v16 |
| UI | React 19 + TailwindCSS v4 | — |
| Package manager | pnpm | — |

---

## Repository Layout

```
/
├── backend/          # NestJS app (port 3001)
│   ├── src/
│   │   ├── modules/  # Feature modules (one folder per domain)
│   │   └── common/   # Guards, interceptors, decorators, pipes, filters
│   ├── prisma/schema.prisma
│   └── generated/prisma/  # DO NOT EDIT
└── frontend/         # Next.js app (port 3000)
    └── src/
        ├── app/
        │   ├── (auth)/
        │   ├── (dashboard)/
        │   │   ├── landlord/
        │   │   ├── tenant/
        │   │   └── admin/
        │   └── (public)/
        ├── components/
        ├── services/   # API call wrappers (typed)
        ├── hooks/
        ├── store/
        └── types/
```

---

## Naming Conventions

- **Prisma models**: camelCase in schema, `@@map("snake_case")` for table names.
- **NestJS files**: `<feature>.<type>.ts` e.g. `room.controller.ts`, `room.service.ts`, `room.module.ts`, `create-room.dto.ts`.
- **DTOs**: suffixed `Dto`, named by operation (`CreateRoomDto`, `UpdateRoomDto`).
- **Frontend**: PascalCase components, `use` prefix for hooks.
- **API routes**: RESTful, kebab-case paths (e.g. `/boarding-houses/:id/rooms`).
- **Env vars**: `SCREAMING_SNAKE_CASE` (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`).

---

## Money / Finance Rules

- All monetary fields: `DECIMAL(12,2)` in Postgres. Prisma type: `Decimal`. **NEVER use Float**.
- `PAYMENT.amount` is **always positive** — including refunds.
- Revenue = `SUM(amount WHERE type=CHARGE AND status=SUCCESS)` minus `SUM(amount WHERE type=REFUND AND status=SUCCESS)`.

---

## Multi-tenancy & Security

- Every BHMS endpoint must validate `X-Boarding-House-Id` header via `PropertyOwnershipGuard`.
- `PropertyOwnershipGuard`: verify `BOARDING_HOUSE.ownerId = request.user.id` — never trust client-supplied id alone.
- Tenants must never access another tenant's `CONTRACT`, `INVOICE`, or `PAYMENT`.
- Employees are scoped to their `EMPLOYEE_ASSIGNMENT.boardingHouseId` only.
- ID card images must be served via short-lived signed URLs from a private bucket only.

---

## Soft Delete / Data Integrity

- **Never hard-delete** `PAYMENT`, `INVOICE`, `CONTRACT`, `DEPOSIT`. Use status transitions only.
- All FK `onDelete` on those tables defaults to `Restrict`.

---

## Audit Logging

- Mutations to `CONTRACT`, `DEPOSIT`, `PAYMENT`, `INVOICE`, `EMPLOYEE_ASSIGNMENT`, `ATTENDANCE`, `USER_SUBSCRIPTION` must write to `AuditLog` in the **same DB transaction**.
- Implement via Prisma middleware or NestJS interceptor — NOT manually in each service.
- `AuditLog` fields: `action`, `entityType`, `entityId`, `oldValue`, `newValue`, `userId`.

---

## Async & Background Jobs

- **Never** call 3rd-party APIs (SMS, Zalo, Email, Payment Gateway) synchronously inside a DB transaction or HTTP request handler.
- Use **BullMQ + Redis** for job queues.
- Scheduled jobs: invoice generation (cron), attendance auto-mark absent, deposit auto-refund.
- Webhook idempotency: use `UNIQUE` on `PAYMENT.transactionRef` to prevent duplicate processing.

---

## WebSocket / Chat

- NestJS `@WebSocketGateway` for real-time messaging.
- Chat rooms keyed by `conversationId`.
- `CONVERSATION` user pair stored with `user1Id < user2Id` (lexicographic) for unique constraint.
- Admins cannot be participants in chat — enforce at gateway level.
- **One chat system only** — BHMS and BHRP both use `CONVERSATION`/`MESSAGE` tables.

---

## API Response Envelope

```json
// Success
{ "success": true, "data": {}, "message": "OK", "meta": { "page": 1, "limit": 20, "total": 100 } }

// Error
{ "success": false, "error": "ERROR_CODE", "message": "Human-readable explanation" }
```

---

## Frontend Conventions (Next.js)

- Server Components by default. Use `"use client"` only for event handlers / browser APIs.
- API calls via service functions in `src/services/` — no raw fetch in components.
- Auth state in Zustand store (`src/store/`).
- Auth check in `middleware.ts` — redirect unauthenticated users to `/auth/login`.
- TailwindCSS v4 for styling. Minimize inline `style={{}}`.
- **Standardized Pagination Footer**:
  - Left control: `Hiển thị [ <input type="number"> ] / trang` (no word "dòng", centered number) + `| X - Y trên tổng số Z [mục]`.
  - Initial defaults: Table/List view = **10/trang**, Grid view = **6/trang** (cards x2 per page). Switching Grid ↔ List auto-updates itemsPerPage (6 vs 10).
  - 5-page window jumping: Prev/Next buttons jump by 5 pages (`windowStart ± windowSize`). Teal `#2AC1BC` for active page.
  - Table Select All checkbox: Toggling header checkbox selects/deselects **only current page items (`paginatedItems`)**.

---

## Hard Rules (NEVER Do This)

- Do NOT use `Float` for money fields.
- Do NOT hard-delete financial records.
- Do NOT call 3rd-party APIs synchronously inside transactions.
- Do NOT trust `boarding_house_id` from client without ownership validation.
- Do NOT build a second chat system — reuse `CONVERSATION`/`MESSAGE`.
- Do NOT let `00000000` remain as a permanent password — check `mustChangePassword` on login.
- Do NOT insert a new `DEPOSIT` when converting platform deposit to contract — update the existing row.
- Do NOT generate `POST` when landlord uses AI draft — create only on explicit publish action.
