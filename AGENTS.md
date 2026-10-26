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
- `docs/spec/06-admin.md` — UC-A-01 → UC-A-06 (analytics, grievances, mass notifications, platform revenue)
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
13. **Centralized PayOS Payment Gateway**: All monetary payments in the system (tenant monthly invoices, platform deposits, landlord subscription upgrades, post quota purchases) MUST be routed through the platform's central payOS gateway for automated verification, webhook-based reconciliation, and audit tracking.
14. **Centralized i18n Translations**: Strictly NEVER handle i18n messages directly on UI pages or components using inline ternary operators (e.g., `isEn ? "..." : "..."`, `locale === "en" ? ... : ...`) or hardcoded strings. All localization messages MUST be defined in the `frontend/i8n/` directory (`frontend/i8n/vi.ts` and `frontend/i8n/en.ts`) and accessed via `useTranslations(namespace)` from `@/context/LanguageContext`.
15. **Standardized Business Error Codes & Client i18n Mapping**:
    - **Backend**: All domain/business errors MUST throw `BusinessException` with a typed `code` from `BusinessErrorCode` enum (`src/common/enums/business-error-code.enum.ts`). Codes and exception messages MUST be written in English. Never throw plain ad-hoc error strings for domain validation without a code.
    - **Frontend**: Every `BusinessErrorCode` MUST be mapped in `frontend/i8n/vi/errors.ts` and `frontend/i8n/en/errors.ts` under the `errors` namespace. Frontend UI MUST NOT inspect error messages using `message.includes(...)`. Errors MUST be resolved using `resolveErrorMessage(err, tErrors, fallbackMessage)` from `@/utils` to guarantee 100% localized messages with support for backend dynamic parameters (`{maxAllowed}`, `{requiredTier}`, etc.).

16. **Room-First Contract Creation**: Contracts can ONLY be created for rooms that already have active occupants (`RoomOccupant`). Landlords cannot input arbitrary phone numbers during contract creation; they must choose from existing room occupants. If a room has no occupants, the system requires adding occupant(s) first (via quick-add modal) before proceeding.
17. **Equal Co-tenancy (No isPrimary)**: All co-tenants in a room/contract have equal status and rights. The `isPrimary` distinction is eliminated. Every occupant receives equal permissions for invoice notifications, PayOS payments, meter reading submissions, and grievance reporting. When a contract is established, all active room occupants are automatically linked to the contract. Adding a tenant without a contract records them directly as an active `RoomOccupant` with an auto-provisioned tenant account (default password `88888888`, `mustChangePassword: true`).

18. **Mandatory Frontend Standards (Responsive, Reusability, Dark Mode, i18n, Loading/Empty States)**:
    - **Responsive Design (Top Priority)**: Every screen, modal, and component must be mobile-first and fluid across all devices (< 640px mobile, 640px - 1024px tablet, > 1024px desktop). Modals must fit within viewport with internal scroll (max-h-[85vh] overflow-y-auto). Tables must scroll horizontally inside responsive containers without breaking page layout. Button groups must wrap or adapt full-width on mobile.
    - **UI Component Reuse (Highest Priority)**: Strictly reuse shared components from `@/components/ui/` (`Button`, `Modal`, `EmptyState`, `TextInput`, `SelectInput`, `DateInput`, `NumberInput`, `TextareaInput`, `Pagination`, `Breadcrumb`, `ViewModeToggle`, `FilterToolbar`, `Card`, `TableRow`, `Chip`, `Text`, `Toast`, etc.) instead of writing raw HTML elements (`<button>`, custom `fixed inset-0...` modal overlays, custom empty states, ad-hoc inputs).
    - **Dark Mode**: Strictly use semantic tokens (`bg-background`, `bg-card`, `bg-surface`, `bg-card-hover`, `text-foreground`, `text-muted`, `border-line`, `bg-primary-soft`, `text-primary`, etc.) or Tailwind `dark:` variants. Never hardcode light-only styles (`bg-white`, `text-gray-900`, `border-gray-200`, raw `#ffffff`).
    - **100% Centralized i18n**: Rule #14 applies everywhere. Zero hardcoded user-facing strings or inline ternaries in JSX. All strings must be defined in `frontend/i8n/vi/` and `frontend/i8n/en/` and consumed via `useTranslations(namespace)`.
    - **Explicit Loading & Empty States**: Every async query, tab, page, table, and modal MUST render polished loading states (skeletons/spinners with contextual text) and informative empty states (using `@/components/ui/EmptyState` with icon, title, description, and primary CTA button).

19. **Occupancy-Centric Tenancy & Flexible Invoicing**:
    - **Contract-Free Tenancy**: Tenancy is rooted in Room Occupancy (`RoomOccupant`). Tenants can reside, view room/service details, submit meter readings, and pay monthly invoices via PayOS based on active `RoomOccupant` status without requiring a formal `Contract`.
    - **Contracts as On-Demand Legal Instruments**: Written contracts (`Contract`) are optional, on-demand legal agreements primarily used for official PDF export, police temporary residence registration (đăng ký tạm trú / mẫu CT01, KT3), and legal dispute resolution.
    - **Configurable Boarding House Payment Date**: Boarding houses feature a configurable `monthlyPaymentDate` (integer 1–31, default: `5`), selected during onboarding/setup and editable in landlord settings. If a room has no contract, billing defaults to this property payment date. If an active contract specifies a `monthlyPaymentDate`, the contract date applies.
    - **Default Room Rent**: For rooms without contracts, invoice rent amount defaults to `room.roomType.price`. Landlords can adjust or discount this line item directly on the invoice.

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
