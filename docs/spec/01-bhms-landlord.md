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

### UC-L-04 — Generate Rental Contract (External Source Flow)
**Tier:** Free · **Models:** `Contract`, `TenantContract`, `Deposit`, `UserIdentification`, `ContractDocument`, `User`

This is the flow where the landlord creates the contract directly — the tenant did not come through a platform deposit.

1. **Find or create the tenant:**
   - Search `User WHERE phoneNumber = :phone`.
   - **Found** → prefill read-only tenant info; this user's `id` becomes `TenantContract.tenantId`.
   - **Not found** → landlord enters phone + name → create `User(role='tenant', phoneNumber, username, hashedPassword=hash('00000000'), mustChangePassword=true)`. Reuse a single `UserService.findOrCreateByPhone()` helper — UC-L-19 (staff onboarding) uses the exact same pattern and must call the same helper, not a duplicate implementation.
2. **Identity verification (new step vs earlier design):** check `UserIdentification WHERE userId = tenant.id`.
   - **Missing** → collect full ID card details (`identityNumber`, `fullName`, `dateOfBirth`, `gender`, `nationality`, `placeOfOrigin`, `placeOfResidence`, `issueDate`, `expiryDate`, front/back photo upload) and create the `UserIdentification` row. This only ever needs to happen once per user across their entire lifetime on the platform.
   - **Present** → skip straight to contract creation; display the existing verified identity for the landlord to confirm this is the right person.
3. Landlord submits `roomId`, `startDate`, `endDate`, `rentPrice`, `monthlyPaymentDate` (day-of-month billing anchor), `depositAmount`, `note`.
4. Create `Contract(roomId, startDate, endDate, rentPrice, monthlyPaymentDate, status='active', note)`.
5. Create `TenantContract(tenantId, contractId, isPrimary=true)` — supports adding co-tenants later via additional `TenantContract` rows for the same `contractId`.
6. **Deposit recording:** create `Deposit(roomId, boardingHouseId, contractId=<new contract>, postId=NULL, type='contract', amount=depositAmount, status='paid', recordedManually=true, recordedBy=<landlord user id>)`. **Do not create a `Payment` row** — no money moved through the system.
7. Set `Room.status = 'occupied'`.
8. Generate the printable contract file, store its URL as a `ContractDocument(contractId, url)` row — `ContractDocument` supports multiple generated exports per contract (e.g. re-exported after an amendment), so always insert a new row rather than overwriting.
9. Trigger UC-T-01 (onboarding notification).

**Routing check before step 3:** if `Room` currently has an active `Post` with an unconverted platform deposit (`Deposit WHERE type='platform' AND postId = post.id AND contractId IS NULL AND status='paid'`), the UI should route the landlord to UC-L-04b instead, to avoid creating a duplicate `contract`-type deposit for the same tenant/room.

---

### UC-L-04b — Convert Platform Deposit into Contract
*(Implied by the platform-deposit flow, not separately numbered in the source use-case doc — implement as a variant action reachable from UC-L-04's UI.)*

**Models:** `Contract`, `TenantContract`, `Deposit`, `Post`

**Precondition:** `Deposit(type='platform', postId IS NOT NULL, contractId IS NULL, status='paid')` exists.

1. Landlord opens the room, sees the pending platform deposit, selects "Create contract from this deposit".
2. Same form as UC-L-04, except the deposit amount is pre-filled read-only from `Deposit.amount` and no new payment step runs.
3. Guard: reject if `Deposit.status != 'paid'` (it may already be refunded by the auto-refund job — see UC-PU-04).
4. Create `Contract` + `TenantContract` as in UC-L-04.
5. **Update** the existing `Deposit` row: `SET contractId = <new contract id>` — do not insert a new deposit.
6. Set `Post.resultedContractId = <new contract id>` (unique FK, enforces 1:1) — this auto-closes the listing; the `Post.status` transition (`posted → hidden`, or however "closed" maps in the actual `PostStatus` enum) should be applied in the same transaction.
7. Set `Room.status = 'occupied'`.
8. Trigger UC-T-01.

No new `Payment` row here — the original `Payment(depositId=..., type=CHARGE, status=SUCCESS)` from UC-PU-04 already recorded the money.

---

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
**Tier:** Free · **Tech:** VietQR / bank webhook · **Models:** `Invoice`, `InvoiceItem`, `Payment`

1. Cron job runs per `Contract` (not a single platform-wide day) — for each `Contract WHERE status='active' AND monthlyPaymentDate` matches today, generate `Invoice(roomId, contractId, status='UNPAID', dueDate, totalAmount)`.
2. `InvoiceItem` rows: one for rent (`serviceId=NULL`), one per active `RoomService` — metered services (`Service.isMetered=true`) compute `amount` from the latest confirmed `MeterReading` for the period × unit price; flat services use `Service.price` directly. **`amount` must be `Decimal`** (see overview changelog #9 — flag if the live schema still has `Int` here).
3. `Invoice.totalAmount = SUM(InvoiceItem.amount)`.
4. Generate a VietQR string with `Invoice.totalAmount` as a locked, non-editable amount (VietQR natively supports amount-locking).
5. On bank webhook confirming transfer: create `Payment(invoiceId=..., type='CHARGE', status='SUCCESS', amount=Invoice.totalAmount, method='BANKING', transactionRef=<bank ref>)`, set `Invoice.status='PAID'`.
6. **Idempotency**: dedupe webhook retries on `transactionRef` (unique index or upsert) before inserting `Payment` — banks may redeliver the same webhook.

---

### UC-L-07 — View Payment History
**Tier:** Free

Query `Invoice` joined `InvoiceItem` and `Payment`, filtered by `roomId`, ordered by period/`createdAt desc`. Join `MeterReading.imageUrl` for the same room/period as supporting evidence.

---

### UC-L-08 — View Property Analytics (Dashboard)
**Tier:** Free · Single-property scope

- **Revenue**: `SUM(Payment.amount) WHERE type='CHARGE' AND status='SUCCESS'`, joined via `Invoice.roomId → Room.boardingHouseId`.
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

1. Trigger: `Room WHERE status='available'` with no active `Post` for X days, or an explicit landlord request.
2. Create `AiConversation(userId, boardingHouseId)`.
3. Call the AI model with room details as context → append `AiMessage(role='USER', content=<prompt>)` then `AiMessage(role='ASSISTANT', content=<draft>, model, tokenUsage)`.
4. Return the draft to prefill UC-P-01's post creation form — **this is a draft only**, no `Post` row is created until the landlord explicitly publishes (and the normal quota check in UC-P-01 still applies to AI-assisted drafts, no bypass).

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

Query `Invoice WHERE room.boardingHouseId = ... AND status IN ('UNPAID', 'OVERDUE')`, aging computed as `NOW() - dueDate`. Group by room for the ledger view. A separate job should flip `Invoice.status` from `UNPAID` to `OVERDUE` once `dueDate` passes without a matching `Payment`.

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