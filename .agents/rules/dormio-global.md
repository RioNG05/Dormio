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

## Language & Localization Conventions

- **Source Code (English Only)**:
  - All variables, functions, classes, interfaces, types, DTOs, enums, constants, database models and columns **MUST** be named in **English**.
  - All code comments, docstrings, logger messages, and Git commit messages **MUST** be written in **English**.
- **User Interface & End-User Messages (Vietnamese Only)**:
  - All user-facing UI labels, form placeholders, table headers, buttons, toast/modal messages, validation messages shown to users, and notification content **MUST** be written in **Vietnamese**.
  - System-level error codes remain English (`UNAUTHORIZED`, `INVOICE_NOT_FOUND`), but the user-facing message/description must be in Vietnamese.

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

### Swagger / API Documentation for BHMS Endpoints

Every BHMS landlord controller endpoint **MUST** apply both decorators from `src/common/swagger`:

```typescript
import { ApiAuth, ApiBoardingHouseHeader } from '../../common/swagger';

@ApiAuth()              // applies @ApiBearerAuth('JWT') + 401/403 responses
@ApiBoardingHouseHeader() // documents X-Boarding-House-Id header with UUID format
```

- `@ApiAuth()` — shorthand for `@ApiBearerAuth('JWT')` + standard 401 Unauthorized + 403 Forbidden responses.
- `@ApiBoardingHouseHeader()` — adds `X-Boarding-House-Id` header with `required: true`, `format: uuid` and a description explaining the PropertyOwnershipGuard check.
- These two decorators are **mandatory on every non-public BHMS endpoint**. Never apply `@ApiBearerAuth()` directly; always use `@ApiAuth()` for consistency.

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

## API Logging & Swagger Documentation (MANDATORY)

Whenever writing or modifying any backend endpoint in NestJS:
1. **Endpoint Logger**: Every controller must define `private readonly logger = new Logger(ControllerName.name);` and log an info message upon entry (e.g. `this.logger.log('GET /v1/tenant/tenancy called by user ' + user.id);`).
2. **Complete Swagger**: Every controller and route must be fully documented using `@nestjs/swagger`:
   - `@ApiTags('Feature')`
   - `@ApiBearerAuth()` (if protected)
   - `@ApiOperation({ summary: '...', description: '...' })`
   - `@ApiOkResponse({ type: ResponseDto, description: '...' })`, `@ApiResponse()`, etc.
   - All request/response DTO properties must have `@ApiProperty()` or `@ApiPropertyOptional()`.

---

## Frontend Conventions (Next.js)

- Server Components by default. Use `"use client"` only for event handlers / browser APIs.
- API calls via service functions in `src/services/` — no raw fetch in components.
- Auth state in Zustand store (`src/store/`).
- Auth check in `middleware.ts` — redirect unauthenticated users to `/auth/login`.
- TailwindCSS v4 for styling. Minimize inline `style={{}}`.
- **Standardized View Modes & Pagination**:
  - Support parallel **Grid & Table/List** views on all major landlord list pages. **Grid view is ALWAYS default** (`viewMode = "grid"`).
  - Left control: `Hiển thị [ <input type="number"> ] / trang` (no word "dòng", centered number) + `| X - Y trên tổng số Z [mục]`.
  - Initial defaults: Grid view = **6/trang** (cards x2 per page), Table/List view = **10/trang**. Switching Grid ↔ List auto-updates itemsPerPage (6 vs 10).
  - 5-page window jumping: Prev/Next buttons jump by 5 pages (`windowStart ± windowSize`). Teal `#2AC1BC` for active page.
  - Table Select All checkbox: Toggling header checkbox selects/deselects **only current page items (`paginatedItems`)**.
- **Modal Reset & Pop-up Confirmation**:
  - Exiting any unsubmitted modal (via Hủy bỏ / Cancel, X icon, or backdrop click) MUST completely reset all form draft input fields.
  - If form has unsaved input changes, ALWAYS display a custom **Pop-up Confirmation Modal** ("Xác nhận đóng form" with `[Tiếp tục chỉnh sửa]` and `[Hủy thay đổi & Đóng]`) instead of browser native `alert` / `confirm`.

### Internationalization (i18n) — Frontend (MANDATORY)

Whenever creating or modifying **any frontend page, component, or layout**:

1. **Use `next-intl`** as the i18n library (`next-intl` package). Do NOT use any other i18n library.
2. **Locale routing**: All routes must be nested under a `[locale]` dynamic segment (e.g. `src/app/[locale]/...`). The `middleware.ts` must use `createMiddleware` from `next-intl/middleware` to negotiate locale from `Accept-Language` and redirect accordingly.
3. **Supported locales**: `vi` (Vietnamese, default) and `en` (English). The default locale is **`vi`**.
4. **Message files**: Store translation strings in `frontend/messages/<locale>.json` (e.g. `vi.json`, `en.json`). Mirror the same key structure across all locale files.
5. **No hardcoded user-facing strings**: Every user-visible string (labels, buttons, placeholders, headings, toast/error messages, aria-labels) **MUST** use `useTranslations()` hook (client) or `getTranslations()` (server). Hardcoded Vietnamese or English UI strings are **NOT allowed**.
6. **Translation key naming**: Use dot-notation namespacing matching the feature module (e.g. `rooms.createModal.title`, `common.actions.save`).
7. **Setup checklist** — when i18n is not yet configured in the project, set it up first:
   - Install: `pnpm add next-intl`
   - Create `frontend/messages/vi.json` and `frontend/messages/en.json`
   - Create `frontend/src/i18n/request.ts` (server-side locale config)
   - Wrap layout with `NextIntlClientProvider`
   - Configure `middleware.ts` with `createMiddleware`

---

## Language Rules

- **Backend (NestJS)**: All code, comments, log messages, error codes, DTO field names, Swagger `@ApiOperation` summaries/descriptions, `@ApiProperty` descriptions, and `@ApiResponse` descriptions MUST be written in **English**.
- **Frontend (Next.js)**: All source code (variables, functions, components, hooks, types) MUST be in **English**. User-visible strings MUST be served via `next-intl` translation keys — **never hardcoded in source**. The only place translated text lives is in `frontend/messages/<locale>.json` files.
- **Spec documents** (`docs/spec/*.md`): Vietnamese is acceptable since they target internal stakeholders.
- **This rules file and AGENTS.md files**: English.


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
- Do NOT write Vietnamese in backend code, comments, log messages, or Swagger docs — English only in `backend/`.
- Do NOT hardcode user-facing strings in frontend source code — all UI text must live in `frontend/messages/<locale>.json` and be accessed via `next-intl`.
- Do NOT skip `next-intl` setup when working on any frontend page or component — check and configure it if not already present.
