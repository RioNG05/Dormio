# Dormio — AI Agent Instructions

This is the **CLAUDE.md** / **AGENTS.md** for the Dormio project.
It provides the essential context that AI agents need to work effectively on this codebase.

## What is Dormio?

A SaaS platform for Vietnamese boarding house management with two main modules:
1. **BHMS** — Boarding House Management System (landlords managing properties, rooms, contracts, staff)
2. **BHRP** — Boarding House Rental Platform (public listing/search for prospective tenants)

## Tech Stack

- **Backend**: NestJS v11, Prisma v7, PostgreSQL, `@prisma/adapter-pg`
- **Frontend**: Next.js 16 App Router, React 19, TailwindCSS v4, Zustand
- **Jobs**: BullMQ + Redis
- **Real-time**: NestJS WebSocket Gateway
- **Storage**: Cloudinary or S3 (signed URLs for private files)
- **Package manager**: pnpm

## Files to Know

### Spec (Source of Truth)
- `docs/technical_spec.md` — **index file** with UC table and links to module specs
- `docs/spec/00-global-conventions.md` — cross-cutting rules (money, audit, RBAC, soft-delete)
- `docs/spec/01-bhms-landlord.md` — UC-L-01 → UC-L-24 (property, rooms, contracts, invoices, staff)
- `docs/spec/02-bhms-staff.md` — UC-S-01, UC-S-02 (schedule, timekeeping)
- `docs/spec/03-bhms-tenant.md` — UC-T-01 → UC-T-07 (notifications, payments, OCR, grievances)
- `docs/spec/04-bhrp.md` — UC-P-01/02, UC-PU-01 → UC-PU-05 (listing, deposit, chat)
- `docs/spec/05-admin.md` — UC-A-01 → UC-A-05 (analytics, grievances, mass notifications)
- `docs/spec/06-appendices.md` — media storage, payment types, schema gaps

### Code
- `backend/prisma/schema.prisma` — the database schema (Prisma v7 format)
- `backend/src/` — NestJS app (currently minimal, needs modules)
- `frontend/src/` — Next.js app (has route structure, needs implementation)
- `.agents/rules/dormio-global.md` — hard rules all agents must follow
- `.agents/skills/` — skill files for common patterns

## Skills Available

Load these skills (read their SKILL.md) when working on:
- `nestjs-module` — creating backend feature modules
- `nextjs-page` — creating frontend pages/routes
- `dormio-domain` — business domain reference (use cases, entities, rules)
- `dormio-auth` — auth implementation (JWT, RBAC, mustChangePassword)
- `postgresql` — schema design, N+1 prevention, indexes, transactions, pagination, audit
- `implement-feature` — full end-to-end feature workflow (spec → design → backend → DB → frontend → tests → verify)
- `verify-spec` — check implementation against technical_spec.md, generate violation report
- `database-change` — Prisma schema change workflow (spec → schema → migration → constraints → tests)
- `review-code` — code review: architecture, security, Prisma, NestJS, Next.js, spec compliance
- `review-api` — API contract review: naming, DTOs, auth, pagination, frontend↔backend consistency
- `prisma-cli` — Prisma CLI commands
- `prisma-client-api` — Prisma query patterns
- `prisma-upgrade-v7` — Prisma v7 migration guide

## Critical Rules (always apply, no exceptions)

1. **Money fields**: `DECIMAL(12,2)` in DB, `Decimal` in Prisma — never `Float`
2. **Never hard-delete** PAYMENT, INVOICE, CONTRACT, DEPOSIT — use status transitions
3. **PropertyOwnershipGuard** on every BHMS endpoint — validate `X-Boarding-House-Id` ownership server-side
4. **AuditLog** in same DB transaction for mutations to: CONTRACT, DEPOSIT, PAYMENT, INVOICE, EMPLOYEE_ASSIGNMENT, ATTENDANCE, USER_SUBSCRIPTION
5. **No 3rd-party API calls** (SMS, email, payment) inside DB transactions — use BullMQ queues
6. **One chat system** — reuse CONVERSATION/MESSAGE for both BHMS and BHRP
7. **mustChangePassword** — check on login; block dashboard if true, redirect to change-password
8. **Platform deposit conversion** — UPDATE existing DEPOSIT row, never INSERT new one
9. **Standardized View & Pagination**: All landlord list modules must support parallel **Grid & Table/List** views with **Grid view as default** (`viewMode = "grid"`). Pagination: `Hiển thị [<input type="number">] / trang | X-Y trên Z [mục]`, 5-page window jumping (`windowStart ± 5`), default Grid=6, Table=10, Select-All applies to current page only.
10. **Modal Reset Behavior**: Exiting any unsubmitted modal (via Hủy bỏ / Cancel, X icon, or backdrop click) MUST completely reset all form draft fields. If there are unsaved input changes, ALWAYS show a custom **Pop-up Confirmation Modal** ("Xác nhận đóng form" with `[Tiếp tục chỉnh sửa]` & `[Hủy thay đổi & Đóng]`) instead of browser native `alert`/`confirm`.
11. **API Logging & Swagger**: Whenever writing/updating any backend API endpoint:
    - **Logger**: Always add a `Logger` (e.g., `private readonly logger = new Logger(ControllerName.name)`) and log an info message whenever the endpoint is invoked.
    - **Swagger**: Always write complete Swagger documentation for the controller, methods, and DTOs (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`, `@ApiOkResponse`, `@ApiResponse`, `@ApiProperty`, etc.).
12. **Language Convention (English Codebase)**: All source code (variables, functions, classes, interfaces, types, DTOs, enums, DB models/columns), comments, docstrings, logs, git commit messages, and technical documentation MUST be written in **English**. **Vietnamese** is strictly reserved for user-facing UI labels, client-visible messages/toasts, notification contents, and localized business display text.

## Module Breakdown

```
Use Cases → Module folders (to create in backend/src/modules/):
- auth          (login, register, change-password, findOrCreateByPhone)
- users         (profile, UserIdentification)
- boarding-houses (CRUD, multi-property context)
- rooms         (bulk generate, CRUD, status, room-services)
- contracts     (external + platform flows, CONTRACT_TENANT, DEPOSIT link)
- invoices      (generation cron, INVOICE_DETAIL, metered/flat calc)
- payments      (VietQR webhook, idempotency, refund)
- meter-readings (OCR upload, confirm flow)
- deposits      (manual, contract, platform, auto-refund)
- services      (system defaults, custom per boarding house)
- expenses      (CRUD)
- notifications  (broadcast, targeted, async dispatch)
- messages       (WebSocket chat, CONVERSATION/MESSAGE)
- posts          (listing BHRP, quota check, AI draft)
- employees      (onboard, assign, job positions)
- schedules      (shifts, recurrence, materialized WORK_SCHEDULE)
- attendance     (check-in/out window validation, manual override)
- subscriptions  (plan limits, billing)
- ai             (AI_CONVERSATION, AI_MESSAGE for suggestions/reports)
- admin          (analytics, grievances, mass-notifications)
- grievances     (UC-T-07, UC-A-04)

Frontend pages (in frontend/src/app/):
- (auth)/login, (auth)/register, (auth)/change-password
- (dashboard)/landlord/* — property, rooms, contracts, invoices, staff, schedule
- (dashboard)/tenant/* — contract, invoices, meter readings, chat
- (dashboard)/admin/* — analytics, grievances, notifications
- (public)/* — listings, search, post detail, chat
```

## Current State

Backend: only `AppModule` exists, all feature modules need to be created.
Frontend: route structure exists, most pages are empty or scaffolded.
Prisma schema: comprehensive and mostly complete. Missing: GRIEVANCE and MASS_NOTIFICATION_JOB tables.

## When Starting a New Feature

1. Find the UC number in `docs/technical_spec.md` index → open the relevant `docs/spec/XX-*.md` file
2. Read `docs/spec/00-global-conventions.md` for cross-cutting rules that always apply
3. Check `backend/prisma/schema.prisma` for the relevant models
4. Load `dormio-domain` skill for entity quick-reference
5. Load `implement-feature` skill for the full workflow (spec → design → backend → DB → frontend → tests → verify)
6. Follow global rules in `.agents/rules/dormio-global.md`
