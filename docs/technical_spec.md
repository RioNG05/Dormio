# Technical Specification — Boarding House Management & Rental Platform

> **Purpose**: This document translates the business use cases into implementation-ready specs. It references the entities defined in `boarding_house_erd.mermaid` (same directory). AI coding agents should treat table/field names here as authoritative and consistent with that ERD — implement against them directly, do not invent alternate names.
>
> **Stack context**: NestJS (backend), Prisma + PostgreSQL (data layer), React Native/Expo (tenant/staff mobile), Next.js (landlord web dashboard + rental platform).

---

## 0. Global Conventions (apply to every use case below)

- **Multi-tenancy**: one `USER` (role=Owner) can own multiple `BOARDING_HOUSE` rows. Nearly every query in BHMS must be scoped by `boarding_house_id` — never assume a landlord has exactly one property. All list/aggregate endpoints must accept `boarding_house_id` (or `boarding_house_id[]` for cross-property Pro reports) as a required/optional filter, not infer it from the user alone.
- **Soft business-state vs hard delete**: financial records (`PAYMENT`, `INVOICE`, `CONTRACT`, `DEPOSIT`) must never be hard-deleted. Use status transitions instead. FK `onDelete` on these should default to `Restrict`.
- **Money fields**: all `decimal` fields use `DECIMAL(12,2)` in Postgres (VND has no reliable minor unit but keep 2dp for compatibility with future currencies). Never use `float`.
- **Payment amount sign convention**: `PAYMENT.amount` is **always positive**, including refunds. Net revenue = `SUM(amount) WHERE type='charge' AND status='success'` minus `SUM(amount) WHERE type='refund' AND status='success'`. Never store negative amounts.
- **Audit logging**: any mutation to `CONTRACT`, `DEPOSIT`, `PAYMENT`, `INVOICE`, `EMPLOYEE_ASSIGNMENT`, `ATTENDANCE`, `USER_SUBSCRIPTION` must write a row to `AUDIT_LOG` (`action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `user_id`) inside the same DB transaction as the mutation. Do this via a Prisma middleware / interceptor, not by remembering to call it manually in every service method.
- **Role-based access**: `USER.role` gates every endpoint. Tenant-role users must never be able to query another tenant's `CONTRACT`/`INVOICE`/`PAYMENT`. Employee-role users are scoped to their `EMPLOYEE_ASSIGNMENT` boarding houses only.

---

# MODULE 1: Boarding House Management System (BHMS)

## Actor: Landlord (Chủ trọ)

### UC-L-01 — Initialize Property Profile
**Tier:** Free

**Tables:** `BOARDING_HOUSE`, `SERVICE` (boarding_house_id set), `ROOM_TYPE`

**Flow:**
1. Landlord submits `name`, `address`, `description`, an array of `{ service_name, unit, default_price, is_metered }`, and an array of `{ room_type_name, description }`.
2. Backend creates `BOARDING_HOUSE` row with `owner_id = current_user.id`.
3. Backend bulk-inserts `SERVICE` rows scoped to this `boarding_house_id`. Also copy in system-default services (`SERVICE` rows where `boarding_house_id IS NULL`) as **references only** — do not clone rows; the room-level `ROOM_SERVICE` join table is what actually attaches a service (default or custom) to a room.
4. Backend bulk-inserts `ROOM_TYPE` rows scoped to this `boarding_house_id`.

**Validation:** `name` and `address` required. At least one room type recommended but not blocking (UC-L-02/03 can create ad-hoc).

---

### UC-L-02 — Bulk Generate Rooms
**Tier:** Free · **Constraint:** max room count enforced by `SUBSCRIPTION_PLAN` (see §Plan Limits below — currently plan table only defines `daily_post_quota`; if room-count limiting is required, add `max_rooms` column to `SUBSCRIPTION_PLAN` before implementing this constraint).

**Tables:** `ROOM`, `ROOM_TYPE`, `ROOM_SERVICE`

**Flow:**
1. Input: `floor_count`, `rooms_per_floor`, `name_format` (template string, e.g. `P{floor}0{index}`), `area`, `room_type_id`, `service_ids[]`, `default_price`.
2. Backend loops `floor = 1..floor_count`, `index = 1..rooms_per_floor`, renders `name_format` → creates one `ROOM` row per combination with `status='available'`.
3. For each created room, insert `ROOM_SERVICE` rows for every `service_id` passed, using the service's own `default_price` unless landlord overrode it in the request.
4. Response returns the generated rooms so the UI can render an editable grid; individual `PUT /rooms/:id` calls handle post-generation edits (UC-L-03 endpoint reused).

**Edge case:** name collisions (duplicate room names within the same `boarding_house_id`) must be rejected — enforce with `@@unique([boardingHouseId, name])` on `Room` in Prisma.

---

### UC-L-03 — Create Single Room
**Tier:** Free

**Tables:** `ROOM`, `ROOM_SERVICE`

**Flow:** Direct insert into `ROOM` with the given `room_type_id`, `floor`, `area`, `default_price`. On creation, auto-attach all `SERVICE` rows where `boarding_house_id` matches OR `boarding_house_id IS NULL` (system defaults) as `ROOM_SERVICE(is_active=true)`. Landlord can immediately toggle `is_active=false` per service without deleting the `ROOM_SERVICE` row (soft toggle, preserves historical pricing for past invoices).

---

### UC-L-04 — Generate Rental Contract
**Tier:** Free

**Tables:** `CONTRACT`, `CONTRACT_TENANT`, `DEPOSIT`, `USER`

This is the **"external source" flow** (`CONTRACT.source = 'external'`) discussed in the conversation — the landlord is creating the contract directly, without a prior platform-side deposit.

**Flow:**
1. Landlord searches by phone number: `SELECT * FROM "user" WHERE phone = :phone`.
   - **Found** → prefill read-only tenant info (name, phone, email); this user becomes `CONTRACT_TENANT.tenant_id`.
   - **Not found** → landlord manually enters full name + phone → backend creates a new `USER(role='Tenant', phone, full_name, password_hash=hash('00000000'))` (same default-password pattern as UC-L-19 staff onboarding — reuse one shared `UserService.findOrCreateByPhone()` helper for both flows).
2. Landlord submits: `room_id`, `start_date`, `end_date`, `rent_price`, `deposit_amount`, `service_ids[]` (subset of the room's active `ROOM_SERVICE`), front/back ID card images.
3. Backend creates `CONTRACT(room_id, start_date, end_date, rent_price, source='external', status='active')`.
4. Backend creates `CONTRACT_TENANT(contract_id, tenant_id, is_primary=true)` (supports adding co-tenants later via the same table).
5. Upload ID card images → `CONTRACT.id_card_front_url` / `id_card_back_url` (see §Media below for storage pattern).
6. **Deposit recording (per the "external source" business rule agreed in conversation):** create `DEPOSIT(boarding_house_id, room_id, contract_id=<new contract id>, post_id=NULL, type='contract', amount=deposit_amount, status='paid', recorded_manually=true, recorded_by=<landlord user_id>)`. **Do NOT create a `PAYMENT` row** — money did not move through the system.
7. Set `ROOM.status = 'occupied'`.
8. Trigger UC-T-01 (dispatch onboarding notification to tenant).
9. Generate printable contract (reuse UC-L-15 export logic).

**Important distinction from the platform flow:** if this room currently has an **active `POST`** with a **prior platform deposit** (i.e. a `DEPOSIT(type='platform', contract_id=NULL)` tied to that post, from UC-PU-04), the landlord should instead be routed to a **different UI action** ("Convert platform deposit to contract") — see UC-L-04b below. Do not let the landlord accidentally double-create a `contract`-type deposit when a `platform`-type deposit already exists for that tenant/room.

---

### UC-L-04b — Convert Platform Deposit into Contract *(implied by conversation, not explicitly numbered in features.md — implement as a variant action on UC-L-04)*
**Tables:** `CONTRACT`, `CONTRACT_TENANT`, `DEPOSIT`, `POST`

**Preconditions:** an existing `DEPOSIT(type='platform', post_id IS NOT NULL, contract_id IS NULL, status='paid')`.

**Flow:**
1. Landlord opens the room, sees the pending platform deposit, clicks "Create contract from this deposit".
2. Same input form as UC-L-04, **except no new deposit payment step** — the deposit amount is pre-filled and read-only from the existing `DEPOSIT.amount`.
3. Backend creates `CONTRACT(source='platform', ...)` and `CONTRACT_TENANT`.
4. Backend **updates the existing `DEPOSIT` row**: `SET contract_id = <new contract id>` (do not insert a new deposit row).
5. Backend sets `POST.resulted_contract_id = <new contract id>` and `POST.status = 'closed'` (auto-close, per the design decision).
6. Set `ROOM.status = 'occupied'`, trigger UC-T-01.

**No new `PAYMENT` row is created here either** — the original `PAYMENT(deposit_id=..., type='charge', status='success')` from UC-PU-04 already recorded the money.

---

### UC-L-05 — View Room Dashboard
**Tier:** Free

**Query composition** (single aggregated endpoint, avoid N+1):
```
Room
 ├─ ROOM_SERVICE (join SERVICE) WHERE is_active=true
 ├─ CONTRACT WHERE status='active' (join CONTRACT_TENANT → USER for tenant list)
 └─ CONTRACT (all, ordered by start_date desc) — rental history
```
Return as a single DTO; do not make the frontend fire 4 separate requests.

---

### UC-L-06 — Automated QR Payment Collection
**Tier:** Free · **Tech Note:** Bank API/VietQR integration

**Tables:** `INVOICE`, `INVOICE_DETAIL`, `PAYMENT`

**Flow:**
1. Monthly cron job (per `boarding_house_id`, configurable billing day) generates `INVOICE(room_id, contract_id, period, status='unpaid', due_date)` for every occupied room with an active contract.
2. `INVOICE_DETAIL` rows are inserted: one row with `service_id=NULL` for rent (`description='Tiền phòng'`), plus one row per active `ROOM_SERVICE` — for metered services (`is_metered=true`), amount is computed from the latest confirmed `METER_READING` for that period × unit price; for flat services, amount = the service's fixed price.
3. `INVOICE.total_amount = SUM(INVOICE_DETAIL.amount)`.
4. VietQR string is generated using the landlord's linked bank account + `INVOICE.total_amount` as a **fixed, non-editable amount** (VietQR spec supports amount-locking natively — do not build a "let tenant type an amount" flow).
5. Bank sends a webhook on successful transfer → backend matches by VietQR reference/memo → creates `PAYMENT(invoice_id=..., type='charge', status='success', amount=INVOICE.total_amount, method='bank_transfer', transaction_ref=<bank ref>)` and sets `INVOICE.status='paid'`.
6. **Webhook idempotency is critical**: banks may retry webhook delivery. Dedupe on `transaction_ref` with a unique constraint on `PAYMENT.transaction_ref` before insert, or use an upsert.

---

### UC-L-07 — View Payment History
**Tier:** Free

Query: `INVOICE` joined `INVOICE_DETAIL` and `PAYMENT`, filtered by `room_id`, ordered by `period desc`. Attach `METER_READING.image_url` for the same period/room for the "evidence" images mentioned in the use case.

---

### UC-L-08 — View Property Analytics (Dashboard)
**Tier:** Free

Single-property scope (`boarding_house_id` fixed). Metrics and their sources:
- **Revenue over time**: `SUM(PAYMENT.amount) WHERE type='charge' AND status='success'`, grouped by period, joined through `INVOICE.room_id → ROOM.boarding_house_id`.
- **Occupancy rate**: `COUNT(ROOM WHERE status='occupied') / COUNT(ROOM)`.
- **Expiring contracts**: `CONTRACT WHERE status='active' AND end_date BETWEEN NOW() AND NOW() + interval '30 days'`.
- **Monthly collection status**: `INVOICE` grouped by `status` for current period.
- **Expense history**: `EXPENSE WHERE boarding_house_id=...`.

Recommend a single materialized/cached response refreshed periodically rather than computing all 5 metrics synchronously on every dashboard load if the property has a large room count.

---

### UC-L-09 — Manual Utility Logging
**Tier:** Free

Insert `METER_READING(room_id, service_id, period, reading_value, image_url=NULL, status='confirmed')` directly — landlord input skips the OCR/confirm step tenants go through (UC-T-03), and is immediately `confirmed`.

---

### UC-L-10 — Manual Deposit Entry
**Tier:** Free

Insert `DEPOSIT(type='hold', room_id, contract_id=NULL, post_id=NULL, amount, status='paid', recorded_manually=true, recorded_by=<landlord>)`. `created_at` auto-captures timestamp (no separate field needed). This is the "chủ trọ tự giữ chỗ" case — distinct from both `contract` and `platform` deposit types.

---

### UC-L-11 — Real-time Direct Messaging
**Tier:** Free · **Tech Note:** WebSockets

**Tables:** `CONVERSATION`, `MESSAGE`, `MESSAGE_ATTACHMENT`

**Flow:**
1. `GET or CREATE conversation` between `user1_id`/`user2_id` — normalize so `user1_id < user2_id` to make the lookup unique-constraint-friendly: `@@unique([user1Id, user2Id])` in Prisma, with a service-layer helper that always sorts the pair before querying/inserting.
2. Message send: insert `MESSAGE(conversation_id, sender_id, content, sent_at, is_read=false)`; if attachments present, insert `MESSAGE_ATTACHMENT` rows (`type='image'|'file'`) linked by `message_id`.
3. Broadcast via WebSocket room keyed by `conversation_id` to both participants.
4. **This same infrastructure is reused for UC-PU-05** — do not build a separate chat system for the rental platform. A landlord and a prospective tenant messaging from a listing page hit the exact same `CONVERSATION`/`MESSAGE` tables.
5. Enforce at the gateway level: `sender.role != 'Admin' AND receiver.role != 'Admin'` — landlords cannot message Admins via this channel (grievances go through UC-T-07/UC-A-04 instead).

---

### UC-L-12 — AI Rental Post Suggestions
**Tier:** Plus

**Tables:** `AI_CONVERSATION`, `AI_MESSAGE`, `ROOM`, `POST`

**Flow:**
1. Backend detects `ROOM WHERE status='available'` with no active `POST` for X days (configurable), or landlord explicitly requests suggestions.
2. Create `AI_CONVERSATION(user_id, boarding_house_id, purpose='post_suggestion')`.
3. Call the AI model with room details (type, area, price, services) as context → append `AI_MESSAGE(role='user', content=<prompt>)` then `AI_MESSAGE(role='assistant', content=<generated post draft>, model, token_usage)`.
4. Return draft content + suggested images (reuse room photos already in `MEDIA`-equivalent room image storage if present) to prefill the UC-P-01 post creation form. **This is a draft only** — `POST` is not created until the landlord explicitly publishes.

---

### UC-L-13 — Broadcast Announcements
**Tier:** Plus

Insert `NOTIFICATION(boarding_house_id=<target>, sender_id=<landlord>, receiver_id=NULL, title, content, type='announcement')`. `receiver_id IS NULL` is the broadcast convention (already established) — fan-out to individual tenants happens at delivery time (push/SMS/Zalo), not by creating one row per tenant.

---

### UC-L-14 — Deposit Management
**Tier:** Plus

Query: `DEPOSIT WHERE boarding_house_id=... ORDER BY created_at desc`, joined to `ROOM` and optionally `CONTRACT`/`POST` depending on `type`. Filter by `status` and `type` in the UI.

---

### UC-L-15 — Export Contracts
**Tier:** Plus

Read `CONTRACT` + `CONTRACT_TENANT` (joined `USER`) + `ROOM` + `DEPOSIT` (via `contract_id`) → render into a PDF/Word template. Use a templating library (e.g. `docx` templater or headless Chromium → PDF) server-side; do not regenerate this logic client-side since the same export must also work for the browser print-dialog trigger mentioned in the use case (render the same HTML template, one path serves `/print`, the other pipes to PDF).

---

### UC-L-16 — Debt Tracking
**Tier:** Plus

Query: `INVOICE WHERE room.boarding_house_id=... AND status IN ('unpaid','overdue')`, computing aging as `NOW() - due_date`. Group by room for the ledger view.

---

### UC-L-17 — Expense Management
**Tier:** Plus

Straightforward CRUD on `EXPENSE(boarding_house_id, room_id nullable, description, amount, expense_date, created_by)`.

---

### UC-L-18 — Custom Service Management
**Tier:** Plus

Insert `SERVICE(boarding_house_id=<this property>, name, unit, default_price, is_metered)`. Once created, it becomes selectable in UC-L-02/03/09's service pickers (query already filters `boarding_house_id = X OR boarding_house_id IS NULL`, so no extra wiring needed beyond the insert).

---

### UC-L-19 — Onboard Staff
**Tier:** Pro

**Tables:** `USER`, `EMPLOYEE`, `EMPLOYEE_ASSIGNMENT`, `JOB_POSITION`

**Flow:**
1. Landlord searches by phone or name: `SELECT * FROM "user" WHERE phone = :q OR full_name ILIKE :q`.
   - **Found** → display read-only profile card (phone, name, email) — **not editable**, per spec.
   - **Not found** → landlord manually enters phone + name → `UserService.findOrCreateByPhone()` (same shared helper as UC-L-04) creates `USER(role='Tenant' default, phone, full_name, password_hash=hash('00000000'))`. Note: a person can hold both a Tenant and Employee "hat" simultaneously under the same `USER` row — role is not exclusive; treat `EMPLOYEE` existence as the real signal of "is staff", not `USER.role` alone.
2. If no `EMPLOYEE` row exists yet for this `user_id`, create one: `EMPLOYEE(user_id)`.
3. Create `EMPLOYEE_ASSIGNMENT(employee_id, boarding_house_id=<current property>, position_id, status='active', joined_at=NOW())`. `position_id` must reference an existing `JOB_POSITION` for this property (landlord picks one, or creates a new one inline — see UC-L-20).
4. **Security requirement**: force password reset (or at minimum flag `must_change_password=true` on `USER` — this field is not yet in the ERD; add it) on first login for accounts created with the default password, and never allow `00000000` to remain as a permanent password. Send the credentials via the same SMS/Zalo channel as UC-T-01.

---

### UC-L-20 — Manage Staff
**Tier:** Pro

**Tables:** `EMPLOYEE_ASSIGNMENT`, `JOB_POSITION`

**Flow:**
1. List view: `EMPLOYEE_ASSIGNMENT WHERE boarding_house_id=... ` joined `EMPLOYEE → USER` and `JOB_POSITION`.
2. "Update employment status" = `PATCH EMPLOYEE_ASSIGNMENT.status` (`active` ↔ `inactive` only — confirmed in conversation, no other states needed).
3. "Assign general roles" = create/select `JOB_POSITION(boarding_house_id, name, description)` and set `EMPLOYEE_ASSIGNMENT.position_id`. `description` is the free-text duty list (e.g. "lau sàn, dọn phòng trọ, dọn máy giặt") the staff member sees in UC-S-01 — this is **not** the same concept as a shift/task; it's a static role description, confirmed explicitly in conversation.
4. Setting `status='inactive'` should also cascade-cancel any future `WORK_SCHEDULE` rows for that employee at that property (`work_date >= today`) — implement as an application-layer side effect, not a DB trigger, so it can be logged to `AUDIT_LOG`.

---

### UC-L-21 — Shift Scheduling
**Tier:** Pro

**Tables:** `SHIFT`, `RECURRENCE_PATTERN`, `WORK_SCHEDULE`

**Flow — recurring schedule:**
1. Landlord defines a `SHIFT(boarding_house_id, name, start_time, end_time)` once (e.g. "Ca sáng 07:00–15:00") if it doesn't already exist for this property.
2. Landlord picks employee(s), shift, `days_of_week` (e.g. `"2,4,6"`), `start_date`, `end_date` → backend creates one `RECURRENCE_PATTERN` row, then **materializes** every matching date in range as individual `WORK_SCHEDULE(employee_id, shift_id, boarding_house_id, work_date, recurrence_pattern_id=<pattern id>, status='scheduled')` rows (confirmed decision: pre-generate concrete rows per week, not computed on the fly).

**Flow — ad-hoc task:** single `WORK_SCHEDULE` insert with `recurrence_pattern_id=NULL`.

**Flow — edit a single occurrence:** `UPDATE WORK_SCHEDULE SET ... WHERE id = :id` — untouched `recurrence_pattern_id` link is kept for traceability but this row is now independently editable.

**Flow — edit the whole pattern:** `UPDATE WORK_SCHEDULE SET shift_id/status = ... WHERE recurrence_pattern_id = :id AND work_date >= CURRENT_DATE`. **Confirmed behavior: this overwrites everything going forward, including rows that were previously edited individually** — no protection flag. Show a confirmation dialog client-side before firing this (e.g. "This will overwrite N scheduled shifts, including any you've customized. Continue?") since the backend performs no such check.

**Visual weekly/monthly calendar**: query `WORK_SCHEDULE WHERE boarding_house_id=... AND work_date BETWEEN :start AND :end`, group by `work_date` then `employee_id` for rendering. Mark rows where `recurrence_pattern_id IS NOT NULL` with a "recurring" indicator in the UI.

---

### UC-L-22 — Attendance Management
**Tier:** Pro

**Tables:** `ATTENDANCE`, `WORK_SCHEDULE`

Query: `WORK_SCHEDULE` left-joined `ATTENDANCE` (0-or-1 relationship) for the requested date range, joined `EMPLOYEE → USER` for the name and `SHIFT` for shift times.

**Manual override**: `PATCH ATTENDANCE.status` to one of `on_time | late | absent`, set `edited_by=<landlord user_id>`, `updated_at=NOW()`. If no `ATTENDANCE` row exists yet for a given `WORK_SCHEDULE` (staff never checked in), landlord's override creates one.

---

### UC-L-23 — Multi-Property Context Switching
**Tier:** Pro · **Tech Note:** critical architectural requirement

**Implementation requirement:** every BHMS API route (except account-level endpoints like `/me`, `/subscriptions`) must require an `X-Boarding-House-Id` header or equivalent context param, validated server-side against `BOARDING_HOUSE.owner_id = current_user.id` **on every single request** — never trust a client-supplied `boarding_house_id` without this ownership check. This is the single most important guard in the whole system; a missing check here is a cross-tenant data leak. Implement as a NestJS Guard (`PropertyOwnershipGuard`) applied globally to the BHMS module, not as an ad-hoc check duplicated in each controller.

Frontend: persist the "active workspace" selection (e.g. in a cookie or local state keyed by user), but re-validate server-side regardless per the rule above.

---

### UC-L-24 — Advanced Multi-Property Reports
**Tier:** Pro

Same metrics as UC-L-08 but aggregated across **all** `BOARDING_HOUSE WHERE owner_id = current_user.id` (no single `boarding_house_id` filter). "AI-generated marketing strategies" reuses the `AI_CONVERSATION`/`AI_MESSAGE` pattern from UC-L-12 with `purpose='report_analysis'`, `boarding_house_id=NULL` (cross-property context) and the aggregated metrics fed in as prompt context.

---

## Actor: Staff (Nhân viên)

### UC-S-01 — View Schedule
**Tier:** Free

Query: `WORK_SCHEDULE WHERE employee_id = <current user's EMPLOYEE.id> AND boarding_house_id IN (<their active EMPLOYEE_ASSIGNMENT boarding houses>)`. To show "co-workers on the same shift", also query `WORK_SCHEDULE WHERE shift_id=... AND work_date=... AND boarding_house_id=...` for other employees, joined `USER` for display names. Include `JOB_POSITION.description` so the staff member sees their duty list (per UC-L-20 design) alongside the schedule.

### UC-S-02 — Timekeeping (Check-in/Check-out)
**Tier:** Free

**Business rule (hard constraint, must be enforced server-side, not just UI-side):**
- Check-in allowed only within `[SHIFT.start_time - 10 minutes, SHIFT.start_time]` on `WORK_SCHEDULE.work_date`.
- Check-out allowed only within `[SHIFT.end_time, SHIFT.end_time + 12 hours]`.
- Requests outside these windows return `403` — do not silently accept and let the landlord fix it later; use UC-L-22's manual override path for legitimate exceptions instead.

**Flow:**
1. `POST /attendance/check-in { work_schedule_id }` → validate window → upsert `ATTENDANCE(work_schedule_id, check_in=NOW(), status='on_time' or 'late' depending on whether check_in > shift.start_time)`.
2. `POST /attendance/check-out { work_schedule_id }` → validate window → `UPDATE ATTENDANCE SET check_out=NOW()`.
3. If no check-in ever occurred and the window fully lapses, a scheduled job should mark the corresponding `ATTENDANCE` as `status='absent'` (create the row if missing) so UC-L-22's dashboard reflects it without landlord manual entry.

---

## Actor: Tenant (Người thuê trọ)

### UC-T-01 — Receive Onboarding Notification
**Tier:** Free

Triggered inside the same transaction as UC-L-04 step 8 / UC-L-04b step 6. Insert `NOTIFICATION(sender_id=<landlord>, receiver_id=<tenant>, type='contract_created')`, and enqueue an async job to actually dispatch SMS/Zalo/Email (do not call 3rd-party APIs synchronously inside the contract-creation transaction — use a queue so a flaky SMS provider never blocks contract creation).

### UC-T-02 — Receive Billing Notification
**Tier:** Free

Triggered by the same cron job as UC-L-06 step 1, immediately after `INVOICE` creation. Insert `NOTIFICATION(receiver_id=<tenant>, type='billing_due', content=<amount + deep link to /invoices/:id>)`, dispatch via async job.

### UC-T-03 — Upload Utility Meters via OCR
**Tier:** Free · **Tech Note:** OCR API

**Flow:**
1. Tenant uploads image → store immediately, create `METER_READING(room_id, service_id, period, image_url, status='pending')`.
2. Async OCR job extracts `reading_value` → `UPDATE METER_READING SET reading_value=..., status still 'pending'` (OCR result is a suggestion, not final).
3. Tenant reviews the extracted number in the UI: **Confirm** → `status='confirmed'`; **Retake** → tenant re-uploads, previous `METER_READING` row can be updated in place (same `id`) rather than creating a duplicate, since it's not yet confirmed.
4. Only `status='confirmed'` readings feed into UC-L-06's invoice generation.

### UC-T-04 — Execute Direct Payment
**Tier:** Free

Reads the `INVOICE` generated by UC-L-06, renders the same locked-amount VietQR. On webhook confirmation, same `PAYMENT` insert logic as UC-L-06 — **this is the same backend flow as UC-L-06 step 5, just initiated from the tenant's app**, not a separate implementation.

### UC-T-05 — View Usage Analytics
**Tier:** Free

Query `METER_READING` + `INVOICE_DETAIL` for the tenant's current active `CONTRACT.room_id`, grouped by `period`. Tenant-scoped — verify `CONTRACT_TENANT.tenant_id = current_user.id` before returning any data.

### UC-T-06 — View Tenancy Details
**Tier:** Free

Read-only aggregate: `CONTRACT` (active, for this tenant) + `ROOM` + `BOARDING_HOUSE` (basic info only, not financials) + `NOTIFICATION WHERE boarding_house_id=... AND receiver_id IS NULL` (broadcast announcements) + `ROOM_SERVICE` (fee structure).

### UC-T-07 — Submit Grievance/Complaint
**Tier:** Free

**New table required, not yet in ERD** — add:
```
GRIEVANCE
- id PK
- tenant_id FK -> USER
- boarding_house_id FK "nullable, for context"
- category string "overcharging | harassment | maintenance | other"
- content text
- status string "open | in_review | resolved | rejected"
- resolution_note text "nullable"
- resolved_by FK -> USER "nullable, admin who resolved it"
- created_at
- resolved_at "nullable"
```
Flow: tenant creates `GRIEVANCE(status='open')` → routes to Admin queue (UC-A-04) → admin updates `status`/`resolution_note` → triggers UC-T notification via Email/Zalo on resolution. Tenant polls/subscribes to their own `GRIEVANCE` rows for status tracking.

---

# MODULE 2: Boarding House Rental Platform (BHRP)

## Actor: Poster / Landlord (Người đăng)

### UC-P-01 — Publish Rental Listing
**Tier:** Free

**Tables:** `POST`, `POST_IMAGE`, `POST_PURCHASE`

**Flow:**
1. **Quota check first** (business logic agreed in conversation):
   ```sql
   -- a) how many free posts today?
   SELECT COUNT(*) FROM post
   WHERE posted_by = :userId AND source_type = 'free_quota' AND created_at::date = CURRENT_DATE;
   -- b) plan's daily quota
   SELECT sp.daily_post_quota FROM subscription_plan sp
   WHERE sp.name = COALESCE(
     (SELECT plan FROM user_subscription WHERE user_id=:userId AND status='active' ORDER BY start_date DESC LIMIT 1),
     'Free'
   );
   ```
   - If (a) < (b): allowed, `source_type='free_quota'`, `post_purchase_id=NULL`.
   - Else, check `POST_PURCHASE WHERE user_id=:userId AND status='paid' AND quantity_used < quantity_purchased` (oldest `activated_at` first — FIFO): if found, `source_type='purchased'`, `post_purchase_id=<that row>`, increment `quantity_used`.
   - Else: reject with a clear "out of posting quota, buy more or wait until tomorrow" error — do not silently fail.
2. Input: `room_id` (nullable — see below), `content`, `deposit_amount`, `image_urls[]`. If the poster is a Landlord and provides `room_id`, validate `ROOM.boarding_house_id`'s owner matches the poster — this is the "link post directly to a BHMS room" requirement.
3. Insert `POST(room_id, posted_by, content, deposit_amount, source_type, post_purchase_id, status='active')`, then `POST_IMAGE` rows.
4. If landlord used UC-L-12's AI draft, prefill `content`/images from the `AI_MESSAGE` output but still run the same quota check — AI-assisted drafting does not bypass quota.

### UC-P-02 — Poster Analytics Dashboard
**Tier:** Pro

Query `POST WHERE posted_by=:userId`, joined `POST_REACH` for aggregate view counts. Drill-down = same query filtered to one `post_id`, with `POST_REACH` broken out by day for a trend chart.

---

## Actor: Platform User / Prospective Tenant (Người thuê trọ)

### UC-PU-01 — Browse & Filter Listings
**Tier:** Free · No auth required

Standard filtered query on `POST WHERE status='active'`, joined `ROOM` for location/price/services filters. No `user_id` context needed — ensure this endpoint is on the public route group (no auth guard).

### UC-PU-02 — View Poster Profile
**Tier:** Free · No auth required

Public subset of `USER`: `avatar_url, full_name, status, created_at, COUNT(POST WHERE posted_by=user.id)`. Never expose `phone`/`email` here unless the viewer is authenticated and has an active `CONVERSATION` with this poster (privacy boundary — enforce explicitly, don't just "forget" to select those columns).

### UC-PU-03 — Save/Bookmark Listings
**Tier:** Free (requires auth)

Simple `SAVED_POST(user_id, post_id)` insert/delete, `@@unique([userId, postId])` to make bookmarking idempotent (toggle, not accumulate duplicates).

### UC-PU-04 — Direct Online Deposit
**Tier:** Free · **Tech Note:** Payment Gateway

**This is the "platform deposit" flow** discussed at length in conversation.

**Flow:**
1. User views a `POST`, clicks deposit, confirms `amount` (defaults to `POST.deposit_amount`).
2. Backend creates `DEPOSIT(boarding_house_id=<derived from POST.room_id>, room_id=<POST.room_id>, contract_id=NULL, post_id=<post id>, type='platform', amount, status='pending', recorded_manually=false)`.
3. Backend creates `PAYMENT(deposit_id=<new deposit>, payer_id=<current user>, type='charge', status='pending', amount, method, qr_code_url or gateway redirect url)`.
4. Gateway callback on success → `PAYMENT.status='success'`, `DEPOSIT.status='paid'` (single transaction).
5. Alert the landlord: `NOTIFICATION(sender_id=NULL/system, receiver_id=<POST.posted_by>, type='deposit_received', content=<link to the deposit/room>)`.
6. **Auto-refund job** (confirmed requirement): a scheduled job scans `DEPOSIT WHERE type='platform' AND status='paid' AND contract_id IS NULL AND created_at < NOW() - interval 'X days'` (X = configurable hold period, needs a product decision — not yet specified, default suggestion: 7 days) → for each, call the payment gateway's refund API using the original `PAYMENT.transaction_ref` → on success, insert `PAYMENT(type='refund', original_payment_id=<original charge id>, deposit_id=<same deposit>, amount=<same amount>, status='success')` and set `DEPOSIT.status='refunded'`. This must run **before** a landlord can call UC-L-04b on a stale deposit — add a guard in UC-L-04b to reject if `DEPOSIT.status != 'paid'`.

### UC-PU-05 — Initiate Direct Chat
**Tier:** Free · Must share infra with UC-L-11

Directly reuses `CONVERSATION`/`MESSAGE` — see UC-L-11 flow. No separate implementation.

---

# MODULE 3: Admin Portal

## Actor: System Administrator (Admin)

### UC-A-01/02/03 — Global Analytics (User / Property / Listing)
**Tier:** Free

Time-bucketed counts:
```sql
SELECT date_trunc('week', created_at) AS bucket, COUNT(*)
FROM "user" -- or boarding_house / post
GROUP BY bucket ORDER BY bucket;
```
Support `week|month|year` bucket size as a query param. These are admin-only, global (no `boarding_house_id` scoping) — gate behind `role='Admin'` guard.

### UC-A-04 — Manage Grievances
**Tier:** Free

CRUD on the `GRIEVANCE` table introduced in UC-T-07. Admin queue: `GRIEVANCE WHERE status='open' ORDER BY created_at asc`. On resolution: `UPDATE GRIEVANCE SET status, resolution_note, resolved_by, resolved_at=NOW()`, then enqueue Email/Zalo dispatch job to `tenant_id`.

### UC-A-05 — Mass Notification Dispatcher
**Tier:** Free · **Tech Note:** async job queues, Zalo ZNS/SMS/SMTP

**New table required, not yet in ERD** — add:
```
MASS_NOTIFICATION_JOB
- id PK
- created_by FK -> USER (admin)
- channel string "zalo | sms | email"
- target_type string "all_users | all_landlords | all_staff | all_admins | specific_user"
- target_user_id FK "nullable, used when target_type='specific_user'"
- content text
- status string "pending | processing | completed | failed"
- total_recipients int
- sent_count int
- created_at
```
Flow: admin composes message → insert `MASS_NOTIFICATION_JOB(status='pending')` → background worker resolves the target audience (query `USER` by `role`, or single user), fans out via the channel's 3rd-party API in batches (respect rate limits), updates `sent_count` incrementally, sets `status='completed'` when done. Use a proper job queue (e.g. BullMQ with Redis) — do not attempt to loop over thousands of recipients synchronously in the HTTP request handler.

---

# Appendix A — Media Storage Reference

Per the earlier design decision (real FK, not polymorphic): images live as **direct fields** on their owning table for single-image cases (`USER.avatar_url`, `CONTRACT.id_card_front_url`/`id_card_back_url`, `METER_READING.image_url`), and as **dedicated join tables with real FK** for multi-image cases (`POST_IMAGE.post_id`, `MESSAGE_ATTACHMENT.message_id`). Upload flow for all of them: client requests a signed upload URL from the backend → uploads directly to cloud storage (Cloudinary/S3) → backend receives the resulting URL and writes it to the relevant field/row. ID card images (`CONTRACT.id_card_front_url/back_url`) must be stored in a **private bucket**; serve them only via short-lived signed URLs generated at request time, never as public URLs.

# Appendix B — Payment Type Reference

`PAYMENT` has exactly 4 mutually-exclusive nullable target FKs (`invoice_id`, `deposit_id`, `post_purchase_id`, `subscription_id`) enforced by a `CHECK` constraint (exactly one non-null). `type` distinguishes `charge` vs `refund`; `original_payment_id` self-references the charge a refund is reversing. `receipt_number` is only populated (and only required, for accounting/tax purposes) when `post_purchase_id` or `subscription_id` is set — these are the two transaction types where money is actual platform revenue rather than a pass-through (deposits) or handled by the separate `INVOICE` billing cycle (monthly rent).

# Appendix C — Known Gaps to Resolve Before Implementation

1. `SUBSCRIPTION_PLAN` currently only defines `daily_post_quota` — if UC-L-02's "max room limit depends on plan" is to be enforced, add a `max_rooms` column.
2. `USER` needs a `must_change_password` boolean to support UC-L-19's default-password security requirement (referenced above but not yet in the ERD — add before implementing staff onboarding).
3. `GRIEVANCE` and `MASS_NOTIFICATION_JOB` tables are newly introduced in this document and must be added to `boarding_house_erd.mermaid` before schema generation.
4. The platform-deposit auto-refund hold period (UC-PU-04) needs a product decision on the exact number of days; treat as a configurable env var, not a hardcoded constant.
