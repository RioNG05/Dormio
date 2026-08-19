# MODULE 1 — BHMS: Landlord Use Cases

**Module**: Boarding House Management System (BHMS)
**Actor**: Landlord (Chủ trọ)
**Global rules**: See `docs/spec/00-global-conventions.md`

---

## UC-L-01 — Initialize Property Profile
**Tier:** Free

**Tables:** `BOARDING_HOUSE`, `SERVICE` (boarding_house_id set), `ROOM_TYPE`

**Flow:**
1. Landlord submits `name`, `address`, `description`, an array of `{ service_name, unit, default_price, is_metered }`, and an array of `{ room_type_name, description }`.
2. Backend creates `BOARDING_HOUSE` row with `owner_id = current_user.id`.
3. Backend bulk-inserts `SERVICE` rows scoped to this `boarding_house_id`. Also copy in system-default services (`SERVICE` rows where `boarding_house_id IS NULL`) as **references only** — do not clone rows; the room-level `ROOM_SERVICE` join table is what actually attaches a service (default or custom) to a room.
4. Backend bulk-inserts `ROOM_TYPE` rows scoped to this `boarding_house_id`.

**Validation:** `name` and `address` required. At least one room type recommended but not blocking (UC-L-02/03 can create ad-hoc).

---

## UC-L-02 — Bulk Generate Rooms
**Tier:** Free
**Constraint:** max room count enforced by `SUBSCRIPTION_PLAN` (currently plan table only defines `daily_post_quota`; if room-count limiting is required, add `max_rooms` column to `SUBSCRIPTION_PLAN` before implementing this constraint).

**Tables:** `ROOM`, `ROOM_TYPE`, `ROOM_SERVICE`

**Flow:**
1. Input: `floor_count`, `rooms_per_floor`, `name_format` (template string, e.g. `P{floor}0{index}`), `area`, `room_type_id`, `service_ids[]`, `default_price`.
2. Backend loops `floor = 1..floor_count`, `index = 1..rooms_per_floor`, renders `name_format` → creates one `ROOM` row per combination with `status='available'`.
3. For each created room, insert `ROOM_SERVICE` rows for every `service_id` passed, using the service's own `default_price` unless landlord overrode it in the request.
4. Response returns the generated rooms so the UI can render an editable grid; individual `PUT /rooms/:id` calls handle post-generation edits (UC-L-03 endpoint reused).

**Edge case:** name collisions (duplicate room names within the same `boarding_house_id`) must be rejected — enforce with `@@unique([boardingHouseId, name])` on `Room` in Prisma.

---

## UC-L-03 — Create Single Room
**Tier:** Free

**Tables:** `ROOM`, `ROOM_SERVICE`

**Flow:** Direct insert into `ROOM` with the given `room_type_id`, `floor`, `area`, `default_price`. On creation, auto-attach all `SERVICE` rows where `boarding_house_id` matches OR `boarding_house_id IS NULL` (system defaults) as `ROOM_SERVICE(is_active=true)`. Landlord can immediately toggle `is_active=false` per service without deleting the `ROOM_SERVICE` row (soft toggle, preserves historical pricing for past invoices).

---

## UC-L-04 — Generate Rental Contract (External Source)
**Tier:** Free

**Tables:** `CONTRACT`, `CONTRACT_TENANT`, `DEPOSIT`, `USER`

This is the **"external source" flow** (`CONTRACT.source = 'external'`) — the landlord creates the contract directly, without a prior platform-side deposit.

**Flow:**
1. Landlord searches by phone number: `SELECT * FROM "user" WHERE phone = :phone`.
   - **Found** → prefill read-only tenant info; this user becomes `CONTRACT_TENANT.tenant_id`.
   - **Not found** → landlord manually enters full name + phone → backend creates a new `USER(role='Tenant', phone, full_name, password_hash=hash('00000000'))` via shared `UserService.findOrCreateByPhone()` helper.
2. Landlord submits: `room_id`, `start_date`, `end_date`, `rent_price`, `deposit_amount`, `service_ids[]`, front/back ID card images.
3. Backend creates `CONTRACT(room_id, start_date, end_date, rent_price, source='external', status='active')`.
4. Backend creates `CONTRACT_TENANT(contract_id, tenant_id, is_primary=true)` (supports co-tenants later).
5. Upload ID card images → `CONTRACT.id_card_front_url` / `id_card_back_url` (private bucket, signed URLs only).
6. **Deposit recording:** create `DEPOSIT(boarding_house_id, room_id, contract_id=<new>, post_id=NULL, type='contract', amount=deposit_amount, status='paid', recorded_manually=true, recorded_by=<landlord>)`. **Do NOT create a `PAYMENT` row** — money did not move through the system.
7. Set `ROOM.status = 'occupied'`.
8. Trigger UC-T-01 (dispatch onboarding notification to tenant — async, outside transaction).
9. Generate printable contract (reuse UC-L-15 export logic).

**Guard:** If this room has an active `POST` with a `DEPOSIT(type='platform', contract_id=NULL)`, route landlord to UC-L-04b instead. Do not let the landlord double-create a contract-type deposit.

---

## UC-L-04b — Convert Platform Deposit into Contract
**Tier:** Free
_(Implied by spec; variant action on UC-L-04)_

**Tables:** `CONTRACT`, `CONTRACT_TENANT`, `DEPOSIT`, `POST`

**Precondition:** existing `DEPOSIT(type='platform', post_id IS NOT NULL, contract_id IS NULL, status='paid')`.

**Flow:**
1. Landlord sees pending platform deposit, clicks "Create contract from this deposit".
2. Same input form as UC-L-04, **except**: deposit amount pre-filled and read-only from existing `DEPOSIT.amount`.
3. Backend creates `CONTRACT(source='platform', ...)` and `CONTRACT_TENANT`.
4. Backend **updates the existing `DEPOSIT` row**: `SET contract_id = <new contract id>` — do **NOT** insert a new deposit row.
5. Backend sets `POST.resulted_contract_id = <new>` and `POST.status = 'closed'`.
6. Set `ROOM.status = 'occupied'`, trigger UC-T-01.
7. Guard: reject if `DEPOSIT.status != 'paid'` (may have been auto-refunded).

**No new `PAYMENT` row** — the original charge from UC-PU-04 already recorded the money.

---

## UC-L-05 — View Room Dashboard
**Tier:** Free

**Query composition** (single aggregated endpoint, avoid N+1):
```
Room
 ├─ ROOM_SERVICE (join SERVICE) WHERE is_active=true
 ├─ CONTRACT WHERE status='active' (join CONTRACT_TENANT → USER for tenant list)
 └─ CONTRACT (all, ordered by start_date desc) — rental history
```
Return as a single DTO. Do not make the frontend fire 4 separate requests.

---

## UC-L-06 — Automated QR Payment Collection
**Tier:** Free · **Tech:** Bank API / VietQR

**Tables:** `INVOICE`, `INVOICE_DETAIL`, `PAYMENT`

**Flow:**
1. Monthly cron job (per `boarding_house_id`, configurable billing day) generates `INVOICE(room_id, contract_id, period, status='unpaid', due_date)` for every occupied room with an active contract.
2. `INVOICE_DETAIL` rows: one row with `service_id=NULL` for rent (`description='Tiền phòng'`), plus one per active `ROOM_SERVICE`. Metered (`is_metered=true`): amount = latest confirmed `METER_READING` × unit price. Flat: amount = service fixed price.
3. `INVOICE.total_amount = SUM(INVOICE_DETAIL.amount)`.
4. VietQR string generated using landlord's linked bank account + `INVOICE.total_amount` as a **fixed, non-editable amount**.
5. Bank webhook → match by VietQR reference/memo → create `PAYMENT(invoice_id, type='charge', status='success', amount, method='bank_transfer', transaction_ref=<bank ref>)` + set `INVOICE.status='paid'`.
6. **Webhook idempotency is critical:** dedupe on `PAYMENT.transaction_ref` UNIQUE constraint before insert — banks may retry delivery.

---

## UC-L-07 — View Payment History
**Tier:** Free

Query: `INVOICE` joined `INVOICE_DETAIL` and `PAYMENT`, filtered by `room_id`, ordered by `period desc`. Attach `METER_READING.image_url` for the same period/room for evidence images.

---

## UC-L-08 — View Property Analytics (Dashboard)
**Tier:** Free

Single-property scope (`boarding_house_id` fixed). Metrics:
- **Revenue over time**: `SUM(PAYMENT.amount) WHERE type='charge' AND status='success'`, grouped by period, joined through `INVOICE.room_id → ROOM.boarding_house_id`.
- **Occupancy rate**: `COUNT(ROOM WHERE status='occupied') / COUNT(ROOM)`.
- **Expiring contracts**: `CONTRACT WHERE status='active' AND end_date BETWEEN NOW() AND NOW() + interval '30 days'`.
- **Monthly collection status**: `INVOICE` grouped by `status` for current period.
- **Expense history**: `EXPENSE WHERE boarding_house_id=...`.

Recommend a single materialized/cached response refreshed periodically rather than computing all 5 metrics synchronously on every load.

---

## UC-L-09 — Manual Utility Logging
**Tier:** Free

Insert `METER_READING(room_id, service_id, period, reading_value, image_url=NULL, status='confirmed')` directly — landlord input skips the OCR/confirm step, immediately `confirmed`.

---

## UC-L-10 — Manual Deposit Entry
**Tier:** Free

Insert `DEPOSIT(type='hold', room_id, contract_id=NULL, post_id=NULL, amount, status='paid', recorded_manually=true, recorded_by=<landlord>)`. The "chủ trọ tự giữ chỗ" case — distinct from `contract` and `platform` types.

---

## UC-L-11 — Real-time Direct Messaging
**Tier:** Free · **Tech:** WebSockets

**Tables:** `CONVERSATION`, `MESSAGE`, `MESSAGE_ATTACHMENT`

**Flow:**
1. `GET or CREATE conversation` between `user1_id`/`user2_id` — normalize so `user1_id < user2_id` for unique-constraint-friendly lookup: `@@unique([user1Id, user2Id])`.
2. Message send: insert `MESSAGE(conversation_id, sender_id, content, sent_at, is_read=false)`; if attachments, insert `MESSAGE_ATTACHMENT` rows.
3. Broadcast via WebSocket room keyed by `conversation_id` to both participants.
4. **This same infrastructure is reused for UC-PU-05** — do not build a separate chat system.
5. Enforce: `sender.role != 'Admin' AND receiver.role != 'Admin'` — grievances use UC-T-07/UC-A-04.

---

## UC-L-12 — AI Rental Post Suggestions
**Tier:** Plus

**Tables:** `AI_CONVERSATION`, `AI_MESSAGE`, `ROOM`, `POST`

**Flow:**
1. Detect `ROOM WHERE status='available'` with no active `POST` for X days, or landlord explicitly requests.
2. Create `AI_CONVERSATION(user_id, boarding_house_id, purpose='post_suggestion')`.
3. Call AI model with room details → append `AI_MESSAGE(role='user')` then `AI_MESSAGE(role='assistant', content=<draft>, model, token_usage)`.
4. Return draft content + suggested images to prefill the UC-P-01 form. **`POST` is NOT created until landlord explicitly publishes.**

---

## UC-L-13 — Broadcast Announcements
**Tier:** Plus

Insert `NOTIFICATION(boarding_house_id=<target>, sender_id=<landlord>, receiver_id=NULL, title, content, type='announcement')`. `receiver_id IS NULL` = broadcast convention — fan-out to tenants happens at delivery time (async job), not by creating one row per tenant.

---

## UC-L-14 — Deposit Management
**Tier:** Plus

Query: `DEPOSIT WHERE boarding_house_id=... ORDER BY created_at desc`, joined to `ROOM` and optionally `CONTRACT`/`POST` depending on `type`. Filter by `status` and `type` in the UI.

---

## UC-L-15 — Export Contracts
**Tier:** Plus

Read `CONTRACT` + `CONTRACT_TENANT` (joined `USER`) + `ROOM` + `DEPOSIT` (via `contract_id`) → render to PDF/Word template server-side. Same HTML template serves `/print` (browser print dialog) and the PDF pipe endpoint.

---

## UC-L-16 — Debt Tracking
**Tier:** Plus

Query: `INVOICE WHERE room.boarding_house_id=... AND status IN ('unpaid','overdue')`, computing aging as `NOW() - due_date`. Group by room for the ledger view.

---

## UC-L-17 — Expense Management
**Tier:** Plus

CRUD on `EXPENSE(boarding_house_id, room_id nullable, description, amount, expense_date, created_by)`.

---

## UC-L-18 — Custom Service Management
**Tier:** Plus

Insert `SERVICE(boarding_house_id=<this property>, name, unit, default_price, is_metered)`. Once created, selectable in UC-L-02/03/09's service pickers (query filters `boarding_house_id = X OR boarding_house_id IS NULL`).

---

## UC-L-19 — Onboard Staff
**Tier:** Pro

**Tables:** `USER`, `EMPLOYEE`, `EMPLOYEE_ASSIGNMENT`, `JOB_POSITION`

**Flow:**
1. Landlord searches by phone or name: `SELECT * FROM "user" WHERE phone = :q OR full_name ILIKE :q`.
   - **Found** → display read-only profile card — **not editable**.
   - **Not found** → `UserService.findOrCreateByPhone()` creates `USER(role='Tenant', phone, full_name, password_hash=hash('00000000'), mustChangePassword=true)`.
   - Note: a person can be both Tenant and Employee under the same `USER` row. Employee status = `EMPLOYEE` table existence, not `USER.role` alone.
2. If no `EMPLOYEE` row for this `user_id`, create one: `EMPLOYEE(user_id)`.
3. Create `EMPLOYEE_ASSIGNMENT(employee_id, boarding_house_id=<current>, position_id, status='active', joined_at=NOW())`.
4. **Security:** `mustChangePassword=true` on first login; send credentials via SMS/Zalo async job.

---

## UC-L-20 — Manage Staff
**Tier:** Pro

**Tables:** `EMPLOYEE_ASSIGNMENT`, `JOB_POSITION`

**Flow:**
1. List: `EMPLOYEE_ASSIGNMENT WHERE boarding_house_id=...` joined `EMPLOYEE → USER` and `JOB_POSITION`.
2. Update status: `PATCH EMPLOYEE_ASSIGNMENT.status` (`active` ↔ `inactive` only).
3. Assign role: create/select `JOB_POSITION(boarding_house_id, name, description)` and set `EMPLOYEE_ASSIGNMENT.position_id`. `description` = free-text duty list, not a shift/task.
4. Setting `status='inactive'` must cascade-cancel future `WORK_SCHEDULE` rows for that employee at that property (`work_date >= today`) — application-layer side effect, logged to `AUDIT_LOG`.

---

## UC-L-21 — Shift Scheduling
**Tier:** Pro

**Tables:** `SHIFT`, `RECURRENCE_PATTERN`, `WORK_SCHEDULE`

**Flow — recurring:**
1. Define `SHIFT(boarding_house_id, name, start_time, end_time)` if not already existing.
2. Pick employee(s), shift, `days_of_week`, `start_date`, `end_date` → create `RECURRENCE_PATTERN` row, then **materialize** every matching date as individual `WORK_SCHEDULE(employee_id, shift_id, boarding_house_id, work_date, recurrence_pattern_id, status='scheduled')` rows.

**Flow — ad-hoc:** single `WORK_SCHEDULE` insert with `recurrence_pattern_id=NULL`.

**Flow — edit single occurrence:** `UPDATE WORK_SCHEDULE SET ... WHERE id = :id`.

**Flow — edit whole pattern:** `UPDATE WORK_SCHEDULE SET ... WHERE recurrence_pattern_id = :id AND work_date >= CURRENT_DATE`. **Overwrites everything going forward, including individually-edited rows.** Show confirmation dialog client-side (no server-side protection flag).

**Calendar query:** `WORK_SCHEDULE WHERE boarding_house_id=... AND work_date BETWEEN :start AND :end`, group by `work_date` then `employee_id`. Mark recurring rows with indicator.

---

## UC-L-22 — Attendance Management
**Tier:** Pro

**Tables:** `ATTENDANCE`, `WORK_SCHEDULE`

Query: `WORK_SCHEDULE` left-joined `ATTENDANCE` (0-or-1) for date range, joined `EMPLOYEE → USER` and `SHIFT`.

**Manual override:** `PATCH ATTENDANCE.status` to `on_time | late | absent`, set `edited_by=<landlord>`, `updated_at=NOW()`. If no `ATTENDANCE` row exists (staff never checked in), landlord's override creates one.

---

## UC-L-23 — Multi-Property Context Switching
**Tier:** Pro
_(See `00-global-conventions.md` for the full guard requirement)_

Frontend: persist the "active workspace" selection (cookie or local state keyed by user), but re-validate server-side on every request regardless.

---

## UC-L-24 — Advanced Multi-Property Reports
**Tier:** Pro

Same metrics as UC-L-08 but aggregated across **all** `BOARDING_HOUSE WHERE owner_id = current_user.id` (no single `boarding_house_id` filter). AI-generated marketing strategies reuse `AI_CONVERSATION`/`AI_MESSAGE` with `purpose='report_analysis'`, `boarding_house_id=NULL`, and aggregated metrics as prompt context.
