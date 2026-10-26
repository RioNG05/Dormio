# Module 1 — BHMS · Actor: Landlord (Chủ trọ)

> See `00-overview-and-conventions.md` for global rules and the schema changelog referenced throughout this file.

---

### UC-L-01 — Initialize Property Profile
**Tier:** Free · **Models:** `BoardingHouse`, `Service`, `RoomType`

1. Landlord submits `name`, structured address fields (`country`, `province`, `city`, `district`, `ward`, `street`, `houseNumber`), `description`, `totalFloor`, `builtAt`, `monthlyPaymentDate` (optional integer 1–31, defaults to 5), plus arrays of `{ name, unit, price, isMetered }` for services and `{ name, description }` for room types.
2. Create `BoardingHouse(ownerId = current_user.id, status = 'active', monthlyPaymentDate = monthlyPaymentDate ?? 5)`.
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

**Boarding House Settings:** Encompasses property settings (`/landlord/settings`) where landlords can update property profile details, including the recurring billing day `BoardingHouse.monthlyPaymentDate` (integer 1–31, default 5).

---

### UC-L-04 — Generate Rental Contract
**Tier:** Free · **Models:** `Contract`, `TenantContract`, `Deposit`, `UserIdentification`, `ContractDocument`, `User`

> **Architectural Note on Contracts**:
> In Dormio, written contracts (`Contract`) are **optional, on-demand legal instruments**. Tenants can reside in rooms as `RoomOccupant`, view room details, submit meter readings, and pay monthly invoices via PayOS without needing a formal contract.
> The contract creation flows below (Flow A / Flow B) are used when either party requests an official signed legal agreement, or when the landlord needs to export contract documentation (UC-L-15) for police temporary residence registration (mẫu CT01/KT3) or legal compliance.
>
> There are two distinct flows here, triggered by different entry points in the UI. Both ultimately produce an `active` `Contract`, but the **landlord never manually creates a `Deposit` row in Flow A** — it already exists from UC-PU-04 before the landlord ever opens this screen. See `07-auth-and-roles.md` for the role model and the shared user-onboarding helper referenced below.

---

#### Flow A — Tenant came through the platform (a `Deposit(type='platform')` already exists)

This flow starts in `05-bhrp-platform-user.md` (UC-PU-04: tenant creates `UserIdentification`, then pays a platform deposit tied to a `Post`) — by the time the landlord reaches this screen, `Deposit(type='platform', postId=..., contractId=NULL, status='paid')` already exists.

1. Landlord receives `Notification(type='deposit_received')` (from UC-PU-04 step 5) and opens the room, sees the pending platform deposit, selects "Create contract from this deposit".
2. Guard: reject if `Deposit.status != 'paid'` (it may already be auto-refunded — see UC-PU-04's refund job).
3. Landlord submits `startDate`, `endDate`, `rentPrice`, `monthlyPaymentDate`, `rentPaymentCycle`, `note`. **Deposit amount is read-only**, pre-filled from the existing `Deposit.amount` — no new payment step runs here.
4. Create `Contract(roomId, startDate, endDate, rentPrice, monthlyPaymentDate, rentPaymentCycle, note, status='draft')` — **starts as `draft`, not `active`.** This is a deliberate change: the contract only takes effect once the tenant explicitly confirms it (see `07-auth-and-roles.md`, UC-AUTH-04).
5. Create `TenantContract(tenantId=<the depositing user>, contractId)`. (All co-tenants share equal rights and permissions; `isPrimary` is abolished).
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
6. Link all active room occupants to contract: for each occupant in room, create `TenantContract(tenantId, contractId)`.
7. **Deposit recording:** create `Deposit(roomId, boardingHouseId, contractId=<new contract>, postId=NULL, type='contract', amount=depositAmount, status='paid', recordedManually=true, recordedBy=<landlord user id>)`. **Do not create a `Payment` row** — no money moved through the system.
8. Set `Room.status = 'occupied'`.
9. Generate the printable contract file → `ContractDocument(contractId, url)`.
10. Trigger UC-T-01 (onboarding notification).

**Routing note:** the UI should decide Flow A vs Flow B based on whether the target room currently has an unconverted platform deposit (`Deposit WHERE type='platform' AND roomId=X AND contractId IS NULL AND status='paid'`) — if one exists, route to Flow A; otherwise Flow B. Don't let the landlord accidentally run Flow B on a room that already has a pending platform deposit, or a duplicate `contract`-type deposit gets created for the same tenant/room.

---

### UC-L-04B — Thêm khách thuê vào phòng không cần hợp đồng (RoomOccupant)
**Tier:** Free · **Models:** `RoomOccupant`, `User`, `Room`

1. **Primary Tenancy Flow:** Tenants do NOT require a formal contract to reside in a room, submit utility meter readings, receive monthly invoices, or pay via PayOS. Adding an occupant directly creates an active `RoomOccupant`.
2. **Quick-Add Flow:** Landlord clicks "Thêm khách thuê" on Customers tab, Room details, or Contract Creation Wizard.
3. **Enter Phone Number:**
   - If phone already exists in this boarding house: Reject with warning `TENANT_ALREADY_IN_HOUSE`.
   - If phone exists in Dormio system (different property or registered): Autofill tenant name, lock name input.
   - If phone does not exist in system: Prompt landlord to enter full name. System auto-provisions a `User(phoneNumber, fullName, role='tenant', mustChangePassword=true, defaultPassword='88888888')`.
4. Landlord selects Room (or prefilled).
5. System creates `RoomOccupant(boardingHouseId, roomId, tenantId, status='active', joinedAt=NOW())`.
6. Room status updates to `occupied` if currently vacant.
7. **Immediate Tenant Capabilities:** The tenant can immediately log in (using default password `88888888`), update their password, view room details, submit monthly utility meter readings (UC-T-03), and pay monthly invoices via PayOS (UC-T-04) without waiting for any written contract.

---

### Room-First Contract Creation Rule & Equal Co-tenancy
1. **Room-First Constraint:** Landlords cannot create contracts with arbitrary phone numbers. The target room must already have active occupants (via `RoomOccupant`). The landlord selects the contract signer/representative from the active occupants of that room. If the room has no occupants, landlord must click "Thêm người thuê vào phòng" first.
2. **Equal Co-tenancy:** When a contract is established, all active occupants in that room are automatically linked via `TenantContract(tenantId, contractId)`. All co-tenants share equal permissions: invoice notifications, PayOS billing payments, meter reading submissions, and grievance reporting.


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

> **Occupancy-Centric Billing Flow**:
> Monthly billing evaluates all **occupied rooms** (`Room.status = 'occupied'`) or rooms with active contracts. A formal contract is not required.
> - **Payment Due Date**: Resolved from `Contract.monthlyPaymentDate` if an active contract exists; otherwise defaults to `BoardingHouse.monthlyPaymentDate` (default 5, configurable 1–31 in setup & settings).
> - **Room Rent Price**: If an active contract exists, rent is determined by `Contract.rentPrice` and its `rentPaymentCycle`. If no contract exists, rent defaults to `room.roomType.price`. Landlords can adjust or discount this line item directly on the invoice.
> - **Equal Co-tenancy**: All active `RoomOccupant`s in the room have equal rights to receive reminders and pay invoices via PayOS.
> - **Meter-First Ordering**: If the room has metered services, meter readings must be recorded before final invoice generation (see UC-T-03 / UC-L-09).

**Part 1 — Reminders (cron, daily):**
1. For each occupied room (`Room.status = 'occupied'` or active contract), determine its effective monthly payment day:
   - Use `Contract.monthlyPaymentDate` if contract exists; otherwise use `BoardingHouse.monthlyPaymentDate` (default 5).
   - Compute days remaining until the payment day for the current cycle.
2. **5 days before**: Send `Notification(type='billing_reminder', content='sắp đến hạn đóng tiền trọ')` to all active occupants (`RoomOccupant`) in the room (dispatched async).
3. **On the due date itself**:
   - Check whether the room has any `RoomService` (active, joined `Service.status='active'`) where `Service.isMetered=true`.
   - **No metered services** → skip straight to Part 3 (generate the invoice immediately — nothing to wait for).
   - **Has metered services** → send `Notification(type='billing_due', content='cần nhập chỉ số điện nước')` to all active occupants of the room. **No `Invoice` row is created at this point.**

**Part 2 — Tenant submits meter readings (see UC-T-03 for the full OCR flow):**
1. Tenant uploads a photo per metered `Service` in their room → `MeterReading(roomId, serviceId, imageUrl, readingValue=<OCR result>, invoiceId=NULL)`.
2. Tenant reviews/corrects the reading value and confirms.
3. Once **every** active metered `RoomService` for the room has a corresponding `MeterReading WHERE invoiceId IS NULL` created since the last invoice, proceed to Part 3.

**Part 3 — Generate the Invoice (triggered by Part 1's "no metered services" branch, or by Part 2 step 3):**
1. Determine rent line item:
   - **Room has active `Contract`**: check `rentPaymentCycle` (`monthly` → always include; `quarterly` / `biannual` / `yearly` → if cycle matches; `upfront` → omitted). Rent amount = `Contract.rentPrice`.
   - **Room has NO contract**: always include monthly rent defaulting to `room.roomType.price`.
2. Build `InvoiceItem` rows: one for rent if applicable (`serviceId=NULL`, `amount=rentPrice`), plus one per active `RoomService` — metered services read `amount = MeterReading.readingValue × Service.price`; flat services use `Service.price` directly.
3. Create `Invoice(roomId, contractId = contract?.id ?? NULL, status='unpaid', dueDate=<this cycle's payment date>, totalAmount=SUM(InvoiceItem.amount))`.
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

> **Purpose**: Contracts in Dormio are created on-demand as official legal instruments. Exporting contracts as PDF documents allows landlords and tenants to print or submit them to local police/authorities (Công an phường/xã) for temporary residence registration (đăng ký tạm trú / mẫu CT01, KT3) and official legal compliance.

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

---

### UC-L-25 — Asset Management
**Tier:** Plus · **Models:** `Asset` (new — not yet in `schema.prisma`, see Schema Gaps below)

Standard CRUD, scoped by `boardingHouseId` like everything else in BHMS (goes through `PropertyOwnershipGuard`, UC-L-23).

**Flow:**
1. **Create**: landlord submits `name`, `category`, `location`, `roomId` (optional — if set, validate `Room.boardingHouseId` matches the current property, same ownership-scoping pattern as every other room-linked create in this file), `quantity`, `condition`, `purchasePrice`, `purchaseDate`, `imageUrl`, `note`. Insert `Asset(boardingHouseId=<current property>, ...)`.
2. **List/filter**: `Asset WHERE boardingHouseId = ...`, filterable by `roomId` (including an explicit "chưa gán phòng" / unassigned filter for `roomId IS NULL`), `category`, and `condition`. Join `Room.roomNumber` for display when assigned.
3. **Edit**: `PATCH` any field, including reassigning `roomId` (e.g. moving a shared fan from storage into Room 101) or updating `condition` (e.g. `good → under_repair` after a maintenance report).
4. **Delete**: hard delete is acceptable here (unlike the financial models in Global Conventions) — an asset record carries no downstream financial/audit obligation the way `Contract`/`Payment`/`Invoice` do. Still worth an `AuditLog` entry for traceability, but no `Restrict`/soft-delete requirement.
5. **Relation to `Expense` (UC-L-17)**: these are two different concerns and should **not** be merged — `Expense` is a financial ledger entry (money spent, e.g. "sửa chữa đồ đạc, bảo trì phòng" per the original use-case doc), while `Asset` is an inventory record (what physical items exist and where). A repair `Expense` may reference which `Asset` was repaired for better reporting later, but that's an optional enhancement (`Expense.assetId String?`), not required for this UC — flagging it here as a natural follow-up rather than scope-creeping it into this feature now.

**Media storage**: `Asset.imageUrl` does not cleanly fit either existing group in `00-overview-and-conventions.md`'s Media Storage table — it isn't public rental-listing content like `Room.image_url` (an asset photo is never shown to prospective tenants), but it also isn't sensitive PII/legal-document content like `UserIdentification`/`ContractDocument`. **Recommendation: route it through the private S3 tier** (same pattern as `GrievanceImage`) — internal-only operational photos default to private unless there's a specific reason to make them public, and there isn't one here. Add a row for this in the Media Storage table if/when this UC is implemented.

**Schema Gaps note**: `Asset` is a net-new model — add it to `schema.prisma` and to `boarding_house_erd_v2.mermaid` before implementation. No existing model can be repurposed for this (it's a distinct concern from `Expense`, `Room`, and `Service`).