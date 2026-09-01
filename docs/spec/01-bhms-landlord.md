# Module 1 — BHMS · Actor: Landlord (Chủ trọ)

> See `00-overview-and-conventions.md` for global rules and the schema changelog referenced throughout this file.

---

### UC-L-01 — Initialize Property Profile
**Tier:** Free · **Models:** `BoardingHouse`, `Service`, `RoomType`

1. Landlord submits `name`, structured address fields (`country`, `province`, `city`, `district`, `ward`, `street`, `houseNumber`), `description`, `totalFloor`, `builtAt`, plus arrays of `{ name, unit, price, isMetered }` for services and `{ name, description }` for room types.
2. Create `BoardingHouse(ownerId = current_user.id, status = 'active')`.
3. Bulk-insert `Service` rows with `boardingHouseId` set to this property. System-default services (if any convention for "global" services is added later) are a separate concern — do not clone rows, `RoomService` is what attaches a service to a specific room (UC-L-02/03).
4. Bulk-insert `RoomType` rows scoped to this `boardingHouseId`.

**Validation:** `name` and full address block required.

---

### UC-L-02 — Bulk Generate Rooms
**Tier:** Free · **Constraint:** `SUBSCRIPTION_PLAN.maxRoom` · **Models:** `Room`, `RoomType`, `RoomService`

1. Input: `floorCount`, `roomsPerFloor`, `nameFormat` (template, e.g. `P{floor}0{index}`), `area`, `roomTypeId`, `serviceIds[]`, default rent price.
2. Before generating, check the landlord's current active `SubscriptionPlan.maxRoom` against `COUNT(Room WHERE boardingHouseId = :id)` + the number about to be created. Reject with a clear over-limit error if it would exceed the plan's cap. No active `UserSubscription` → treat as `free` plan (see `00-overview` for the "no subscription row = Free" convention, still true here).
3. Loop `floor = 1..floorCount`, `index = 1..roomsPerFloor`, render `nameFormat` → insert one `Room` row per combination with `status = 'available'`, `roomTypeId` set (per changelog item #4 in the overview file — this FK must exist).
4. For each created room, insert `RoomService` rows for every `serviceId` passed.
5. Response returns the generated rooms for an editable grid; individual edits reuse the `PATCH /rooms/:id` endpoint from UC-L-03.

**Edge case:** enforce `@@unique([boardingHouseId, roomNumber])` on `Room` to reject name collisions within a property.

---

### UC-L-03 — Create/Edit Single Room
**Tier:** Free · **Models:** `Room`, `RoomService`

Direct insert/update on `Room` (`roomNumber`, `floor`, `area`, `maxOccupants`, `roomTypeId`, rent price if stored per-room, `image_url`). On creation, auto-attach relevant `Service` rows as `RoomService`. Landlord can detach a service by deleting its `RoomService` row — note `RoomService` has no `isActive`/soft-toggle field in the current schema, so removing a service from a room is a hard delete of that join row; if past invoices need to preserve historical pricing for a since-removed service, that data must already live on the `InvoiceItem` row (`unitPrice`, `quantity` snapshotted at generation time), not be re-derived from `RoomService` later.

---

### UC-L-04 — Generate Rental Contract
**Tier:** Free · **Models:** `Contract`, `TenantContract`, `Deposit`, `UserIdentification`, `ContractDocument`, `User`

> There are two distinct flows here, triggered by different entry points in the UI. Both ultimately produce an `active` `Contract`, but the **landlord never manually creates a `Deposit` row in Flow A** — it already exists from UC-PU-04 before the landlord ever opens this screen. See `07-auth-and-roles.md` for the role model and the shared user-onboarding helper referenced below.

---

#### Flow A — Tenant came through the platform (a `Deposit(type='platform')` already exists)

This flow starts in `05-bhrp-platform-user.md` (UC-PU-04: tenant creates `UserIdentification`, then pays a platform deposit tied to a `Post`) — by the time the landlord reaches this screen, `Deposit(type='platform', postId=..., contractId=NULL, status='paid')` already exists.

1. Landlord receives `Notification(type='deposit_received')` (from UC-PU-04 step 5) and opens the room, sees the pending platform deposit, selects "Create contract from this deposit".
2. Guard: reject if `Deposit.status != 'paid'` (it may already be auto-refunded — see UC-PU-04's refund job).
3. Landlord submits `startDate`, `endDate`, `rentPrice`, `monthlyPaymentDate`, `rentPaymentCycle`, `note`. **Deposit amount is read-only**, pre-filled from the existing `Deposit.amount` — no new payment step runs here.
4. Create `Contract(roomId, startDate, endDate, rentPrice, monthlyPaymentDate, rentPaymentCycle, note, status='draft')` — **starts as `draft`, not `active`.** This is a deliberate change: the contract only takes effect once the tenant explicitly confirms it (see `07-auth-and-roles.md`, UC-AUTH-04).
5. Create `TenantContract(tenantId=<the depositing user>, contractId, isPrimary=true)`.
6. **Update** the existing `Deposit` row: `SET contractId = <new contract id>` — never insert a new `Deposit` for this flow.
7. Set `Post.resultedContractId = <new contract id>` (unique FK, 1:1) and `Post.status = 'hidden'` — auto-closes the listing immediately, even though the contract itself is still `draft`. (If the tenant later rejects the contract, the post stays closed — re-opening a rejected listing is a separate landlord action, not automatic.)
8. Set `Room.status = 'deposited'` (already the correct status since UC-PU-04's deposit step set it — no change needed here, listed for clarity).
9. Trigger UC-AUTH-04 (notify tenant, awaiting their confirm/reject decision). **Do not generate `ContractDocument` yet and do not trigger UC-T-01 yet** — both happen only once the tenant confirms (see UC-AUTH-04 step 3, "Confirm" branch), since a `draft`/possibly-rejected contract shouldn't produce a signed document or an onboarding notification.

**No new `Payment` row anywhere in this flow** — the original `Payment(depositId=..., type='charge', status='success')` from UC-PU-04 already recorded the money, and this flow only ever updates existing rows (`Deposit.contractId`, `Post.resultedContractId`/`status`).

---

#### Flow B — Landlord creates the contract directly (tenant did not come through the platform)

1. Landlord opens a room, clicks "Tạo hợp đồng".
2. **Find or create the tenant:**
   - Search `User WHERE phoneNumber = :phone`.
   - **Found** → prefill read-only tenant info (name, phone, email); this user's `id` becomes `TenantContract.tenantId`. Skip straight to step 3.
   - **Not found** → landlord enters phone + name → call the shared `UserService.findOrCreateByPhone()` helper (see `07-auth-and-roles.md`, UC-AUTH-03 — **this exact helper is also used by UC-L-19 staff onboarding**, do not duplicate the logic): generates a random password, creates `User(role='leasing_agent', mustChangePassword=true, ...)`. The tenant's first login triggers the OTP verification flow described in UC-AUTH-03 — this UC does not need to handle that itself, just call the helper and move on.
3. **Identity verification:** check `UserIdentification WHERE userId = tenant.id`.
   - **Missing** → collect full ID card details and create the `UserIdentification` row (this only ever needs to happen once per user, reused across every future contract).
   - **Present** → skip straight to contract creation, display existing verified identity for landlord confirmation.
4. Landlord submits `roomId`, `startDate`, `endDate`, `rentPrice`, `monthlyPaymentDate`, `rentPaymentCycle`, `depositAmount`, `note`.
5. Create `Contract(..., status='active')` — **this flow goes straight to `active`, no `draft`/confirmation step**, since the landlord is directly attesting the arrangement is already agreed (this is the key behavioral difference from Flow A).
6. Create `TenantContract(tenantId, contractId, isPrimary=true)`.
7. **Deposit recording:** create `Deposit(roomId, boardingHouseId, contractId=<new contract>, postId=NULL, type='contract', amount=depositAmount, status='paid', recordedManually=true, recordedBy=<landlord user id>)`. **Do not create a `Payment` row** — no money moved through the system.
8. Set `Room.status = 'occupied'`.
9. Generate the printable contract file → `ContractDocument(contractId, url)`.
10. Trigger UC-T-01 (onboarding notification).

**Routing note:** the UI should decide Flow A vs Flow B based on whether the target room currently has an unconverted platform deposit (`Deposit WHERE type='platform' AND roomId=X AND contractId IS NULL AND status='paid'`) — if one exists, route to Flow A; otherwise Flow B. Don't let the landlord accidentally run Flow B on a room that already has a pending platform deposit, or a duplicate `contract`-type deposit gets created for the same tenant/room.

---

*(The general capability "chủ trọ có thể thêm người vào phòng mà không cần hợp đồng" from the source business description is interpreted here as: no physical/paper contract document is legally required for occupancy to be recorded — but the system still creates a `Contract` row via Flow B as the internal record of the arrangement, since `TenantContract.contractId` is a required (non-nullable) FK and there is no way to associate a tenant with a room in the current schema without one. If the intent was instead "occupancy can exist with zero `Contract` row at all" (e.g. for very informal arrangements), that needs a schema change — `TenantContract.contractId` would need to become nullable, or a separate `RoomOccupant` concept would need to be introduced. Flag this to the product owner if Flow B's "always creates a Contract row" assumption is wrong.)*


### UC-L-05 — View Room Dashboard
**Tier:** Free

Single aggregated query, not 4 separate round-trips:
```
Room
 ├─ RoomService → Service
 ├─ Contract WHERE status='active' → TenantContract → User (current tenants)
 └─ Contract (all, order by startDate desc) — rental history
```

---

### UC-L-06 — Automated QR Payment Collection
**Tier:** Free · **Tech:** VietQR / bank webhook · **Models:** `Invoice`, `InvoiceItem`, `Payment`, `MeterReading`, `Notification`

> **This flow's ordering changed from earlier drafts**: `Invoice` is no longer created blindly on the billing day. Per the confirmed business rule, the tenant must submit utility meter readings **first**; only once those are in does the system compute the final total and create the `Invoice` (with `totalAmount` already set — there is no "draft/empty invoice" state). This UC is split into three parts below; UC-T-03/UC-T-04 in `03-bhms-tenant.md` are the tenant-facing counterparts of parts 2–3 and should link back here rather than duplicating the generation logic.

**Part 1 — Reminders (cron, daily):**
1. For each `Contract WHERE status='active'`, compute days until `monthlyPaymentDate` this cycle.
2. **5 days before**: `Notification(receiverId=<tenant>, type='billing_reminder')`, dispatched via Zalo/SMS/Email (async job).
3. **On the due date itself**:
   - Check whether the room has any `RoomService` (active, joined `Service.status='active'`) where `Service.isMetered=true`.
   - **No metered services** → skip straight to Part 3 (generate the invoice immediately — nothing to wait for).
   - **Has metered services** → send `Notification(type='billing_due', content='cần nhập chỉ số điện nước')` and stop here. **No `Invoice` row is created at this point.** The presence/absence of an `Invoice` for this billing cycle is itself the signal of "awaiting tenant meter input" — no separate status field is needed for this waiting state.

**Part 2 — Tenant submits meter readings (see UC-T-03 for the full OCR flow):**
1. Tenant uploads a photo per metered `Service` in their room → `MeterReading(roomId, serviceId, imageUrl, readingValue=<OCR result>, invoiceId=NULL)`.
2. Tenant reviews/corrects the OCR value, confirms.
3. Once **every** active metered `RoomService` for the room has a corresponding `MeterReading WHERE invoiceId IS NULL` created since the last invoice, proceed to Part 3. (Query: `COUNT(RoomService WHERE roomId=X AND service.isMetered=true AND service.status='active')` must equal `COUNT(DISTINCT serviceId FROM MeterReading WHERE roomId=X AND invoiceId IS NULL)`.)

**Part 3 — Generate the Invoice (triggered by Part 1's "no metered services" branch, or by Part 2 step 3):**
1. Determine whether a rent line item applies this cycle, based on `Contract.rentPaymentCycle`:
   - `monthly` → always include.
   - `quarterly` → include only if the number of full months since `Contract.startDate` is a multiple of 3.
   - `biannual` → multiple of 6. `yearly` → multiple of 12.
   - `upfront` → **never** include here — upfront rent is a one-time `Payment(contractId=...)` made at contract creation, not a recurring `InvoiceItem` (see the note on `rentPaymentCycle='upfront'` in the schema conventions).
2. Build `InvoiceItem` rows: one for rent if applicable (`serviceId=NULL`, `amount=Contract.rentPrice`), one per active `RoomService` — metered services read `amount = MeterReading.readingValue × Service.price` from the just-confirmed reading; flat services use `Service.price` directly.
3. Create `Invoice(roomId, contractId, status='unpaid', dueDate=<this cycle's monthlyPaymentDate>, totalAmount=SUM(InvoiceItem.amount))`.
4. **Link the consumed readings**: `UPDATE MeterReading SET invoiceId = <new invoice id> WHERE id IN (<the readings used in step 2>)` — this both marks them as "spent" (so the next cycle's query in Part 2 step 3 doesn't double-count them) and gives a permanent audit trail of which reading justified which invoice line.
5. Generate a VietQR string with `Invoice.totalAmount` locked (non-editable).
6. On bank webhook confirming transfer: create `Payment(invoiceId=..., type='charge', status='success', amount=Invoice.totalAmount, method='banking', transactionRef=<bank ref>)`, set `Invoice.status='paid'`.
7. **Idempotency**: dedupe webhook retries on `transactionRef` (unique index or upsert) before inserting `Payment` — banks may redeliver the same webhook.

**Schema addition required for this flow:** `MeterReading.invoiceId` (nullable FK) does not exist in the uploaded `schema.prisma` yet — see `boarding_house_erd_v2.mermaid` and the Schema Gaps section in `00-overview-and-conventions.md`. This flow cannot be implemented without it (there would be no way to know which readings are "unconsumed" vs already billed).

---

### UC-L-07 — View Payment History
**Tier:** Free

Query `Invoice` joined `InvoiceItem` and `Payment`, filtered by `roomId`, ordered by period/`createdAt desc`. Join `MeterReading.imageUrl` for the same room/period as supporting evidence.

---

### UC-L-08 — View Property Analytics (Dashboard)
**Tier:** Free · Single-property scope

- **Revenue**: `SUM(Payment.amount) WHERE type='charge' AND status='success'`, joined via `Invoice.roomId → Room.boardingHouseId`.
- **Occupancy**: `COUNT(Room WHERE status='occupied') / COUNT(Room)`.
- **Expiring contracts**: `Contract WHERE status='active' AND endDate BETWEEN NOW() AND NOW() + interval '30 days'`.
- **Collection status**: `Invoice` grouped by `status` for the current period.
- **Expenses**: `Expense WHERE boardingHouseId = ...`.

Cache/refresh periodically rather than recomputing all metrics synchronously on every load for properties with many rooms.

---

### UC-L-09 — Manual Utility Logging
**Tier:** Free

Insert `MeterReading(roomId, serviceId, readingValue, imageUrl=NULL, createdAt)` directly — landlord entries skip the tenant-side OCR/confirm loop (UC-T-03) and count as final immediately (no separate `status` field on `MeterReading` in the current schema — its mere existence for the billing period is what UC-L-06 reads).

---

### UC-L-10 — Manual Deposit Entry
**Tier:** Free

Insert `Deposit(type='contract', roomId, contractId=NULL, postId=NULL, amount, status='paid', recordedManually=true, recordedBy=<landlord>)`. This is the "landlord is holding the room for someone, no contract yet" case — see overview changelog #5 for why this no longer uses a distinct `hold_room` type.

---

### UC-L-11 — Real-time Direct Messaging
**Tier:** Free · **Tech:** WebSockets · **Models:** `Conversation`, `Message`, `MessageAttachment`

See "Cross-Module Shared Infrastructure" in the overview file — this exact implementation is reused verbatim by UC-PU-05.

1. `getOrCreateConversation(user1, user2)` — normalize the pair (e.g. sort by id) before querying/inserting so lookups are consistent.
2. Send: insert `Message(conversationId, senderId, content, sentAt, isReacted=false)`; if attachments present, insert `MessageAttachment(messageId, type, url, sizeBytes, sortOrder)` rows.
3. Broadcast via a WebSocket room keyed by `conversationId`.
4. Gate at the gateway level: neither participant may have `role='admin'` — admin communication goes through UC-A-04/UC-T-07 instead.

---

### UC-L-12 — AI Rental Post Suggestions
**Tier:** Plus · **Models:** `AiConversation`, `AiMessage`, `Room`, `Post`

> **Architecture note:** this UC only *generates a draft* using property data that lives in BHMS (`Room`). It does not create a `Post` and does not duplicate any posting logic — actually publishing still goes through UC-P-01 in `04-bhrp-poster.md`, which is where the room-linking rule and quota check are enforced. This UC's output is purely an input to that flow, per the "Posting Capability Split" architecture note in `07-auth-and-roles.md`.

1. Trigger: `Room WHERE status='available'` with no active `Post` for X days, or an explicit landlord request.
2. Create `AiConversation(userId, boardingHouseId)`.
3. Call the AI model with room details as context → append `AiMessage(role='USER', content=<prompt>)` then `AiMessage(role='ASSISTANT', content=<draft>, model, tokenUsage)`.
4. Return the draft to prefill UC-P-01's post creation form — **this is a draft only**, no `Post` row is created until the landlord explicitly publishes (and the normal room-linking rule + quota check in UC-P-01 still apply to AI-assisted drafts, no bypass).

---

### UC-L-13 — Broadcast Announcements
**Tier:** Plus

Insert `Notification(boardingHouseId=<target>, senderId=<landlord>, receiverId=NULL, content, type='announcement', isRead=false)`. `receiverId IS NULL` is the broadcast convention — see overview file.

---

### UC-L-14 — Deposit Management
**Tier:** Plus

Query `Deposit WHERE boardingHouseId = ... ORDER BY createdAt desc`, joined `Room` and (depending on `type`) `Contract`/`Post`. Filter UI by `status` and `type` (`platform | contract`, per the corrected enum).

---

### UC-L-15 — Export Contracts
**Tier:** Plus

Read `Contract` + `TenantContract` (joined `User`) + `Room` + `Deposit` (via `contractId`) → render via a server-side template (headless Chromium → PDF, or a `.docx` templater). Store the output as a new `ContractDocument(contractId, url)` row — support both the direct-print trigger and the downloadable-file trigger from the same rendered HTML template so the two code paths never drift apart.

---

### UC-L-16 — Debt Tracking
**Tier:** Plus

Query `Invoice WHERE room.boardingHouseId = ... AND status IN ('unpaid', 'overdue')`, aging computed as `NOW() - dueDate`. Group by room for the ledger view. A separate job should flip `Invoice.status` from `unpaid` to `overdue` once `dueDate` passes without a matching `Payment`.

---

### UC-L-17 — Expense Management
**Tier:** Plus

CRUD on `Expense(boardingHouseId, roomId, name, description, category, amount, status, paidAt)`. Note `roomId` is required in the current schema (not nullable) — a purely property-wide expense (not tied to one room) needs product clarification on how it should be recorded; flag this to the schema owner rather than picking an arbitrary room.

---

### UC-L-18 — Custom Service Management
**Tier:** Plus

Insert `Service(boardingHouseId=<this property>, name, price, unit, isMetered, autoApplied)`. Once created it's selectable in UC-L-02/03's service pickers (already filtered by `boardingHouseId`).

---

### UC-L-19 — Onboard Staff
**Tier:** Pro · **Models:** `User`, `EmployeeProfile`, `EmployeeAssignment`, `JobPosition`

1. Search `User WHERE phoneNumber = :q OR username ILIKE :q`.
   - **Found** → display read-only profile card, not editable.
   - **Not found** → `UserService.findOrCreateByPhone()` (same helper as UC-L-04) creates `User(phoneNumber, username, hashedPassword=hash('00000000'), mustChangePassword=true)`. A person can simultaneously be a tenant elsewhere and staff here — `EmployeeProfile` existence is the real "is staff" signal, not `User.role` alone (a `User.role` field still exists but should be treated as the person's *primary* identity, not an exclusivity switch).
2. If `EmployeeProfile WHERE userId = :id` doesn't exist yet, create it.
3. Create `EmployeeAssignment(employeeId, boardingHouseId=<current property>, positionId, status='active', joinedAt=NOW())`. `positionId` must reference an existing `JobPosition` for this property (or create one inline — UC-L-20).
4. **Security**: `mustChangePassword=true` forces a password reset on first login for default-password accounts — never let `00000000` remain permanent. Dispatch credentials via the same async SMS/Zalo channel as UC-T-01.

---

### UC-L-20 — Manage Staff
**Tier:** Pro · **Models:** `EmployeeAssignment`, `JobPosition`

1. List: `EmployeeAssignment WHERE boardingHouseId=...` joined `EmployeeProfile → User` and `JobPosition`.
2. "Update employment status" = `PATCH EmployeeAssignment.status` — only `active ↔ inactive` (confirmed, no other states).
3. "Assign role" = create/select `JobPosition(boardingHouseId, name, description)` and set `EmployeeAssignment.positionId`. `description` is the free-text duty list (e.g. "lau sàn, dọn phòng trọ, dọn máy giặt") shown to the staff member in UC-S-01 — a static role description, not a per-shift task.
4. Setting `status='inactive'` should cascade-cancel future `WorkSchedule` rows (`workDate >= today`) for that employee at that property — application-layer side effect (so it's logged via `AuditLog`), not a DB trigger.

---

### UC-L-21 — Shift Scheduling
**Tier:** Pro · **Models:** `Shift`, `RecurrencePattern`, `WorkSchedule`

**Recurring schedule:**
1. Define `Shift(boardingHouseId, name, startTime, endTime)` once per property if it doesn't already exist.
2. Landlord picks employee(s), shift, `daysOfWeek` (e.g. `"2,4,6"`), date range → create one `RecurrencePattern(employeeId, boardingHouseId, shiftId, daysOfWeek, startTime, endTime, createdBy)` row, then **materialize** every matching date as individual `WorkSchedule(employeeId, shiftId, boardingHouseId, workDate, recurrenceId=<pattern id>, status='scheduled')` rows — pre-generated per week, not computed on the fly.

**Ad-hoc task:** single `WorkSchedule` insert with `recurrenceId=NULL`.

**Edit a single occurrence:** `UPDATE WorkSchedule WHERE id = :id` — `recurrenceId` stays for traceability but the row is now independently editable.

**Edit the whole pattern:** `UPDATE WorkSchedule SET ... WHERE recurrenceId = :id AND workDate >= CURRENT_DATE`. **Confirmed behavior: this overwrites everything going forward, including individually-edited rows — no protection flag exists.** Show a client-side confirmation dialog before firing this ("This will overwrite N scheduled shifts, including any you've customized") since the backend performs no such check itself.

**Calendar view**: `WorkSchedule WHERE boardingHouseId=... AND workDate BETWEEN :start AND :end`, grouped by date then employee. Mark rows where `recurrenceId IS NOT NULL` with a "recurring" indicator.

---

### UC-L-22 — Attendance Management
**Tier:** Pro · **Models:** `Attendance`, `WorkSchedule`

Query `WorkSchedule` left-joined `Attendance` for the requested date range, joined `EmployeeProfile → User` and `Shift`.

**Manual override**: `PATCH Attendance.status` (`not_yet | on_time | late | absent`), set `editedBy=<landlord user id>`, `updatedAt=NOW()`. If no `Attendance` row exists yet for a `WorkSchedule` (staff never checked in), the override creates one.

---

### UC-L-23 — Multi-Property Context Switching
**Tier:** Pro · **Critical architectural requirement**

Every BHMS route (except account-level endpoints like `/me`, `/subscriptions`) must require a `boardingHouseId` context, validated server-side against `BoardingHouse.ownerId = current_user.id` **on every single request** — never trust a client-supplied `boardingHouseId` without this check. Implement as a NestJS Guard (`PropertyOwnershipGuard`) applied globally to the BHMS module, not duplicated ad-hoc per controller. This is the single most important guard in the system; a missing check here is a cross-tenant data leak.

---

### UC-L-24 — Advanced Multi-Property Reports
**Tier:** Pro

Same metrics as UC-L-08, aggregated across **all** `BoardingHouse WHERE ownerId = current_user.id` (no single-property filter). "AI-generated marketing strategy" reuses UC-L-12's `AiConversation`/`AiMessage` pattern with `boardingHouseId = NULL` (cross-property context) and the aggregated metrics fed in as prompt context.