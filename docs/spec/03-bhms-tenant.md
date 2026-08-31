# Module 1 — BHMS · Actor: Tenant (Người thuê trọ)

> See `00-overview-and-conventions.md` for global rules.

---

### UC-T-01 — Receive Onboarding Notification
**Tier:** Free

Triggered inside the same transaction as UC-L-04 Flow B step 10, **or** UC-AUTH-04's "Confirm" branch (Flow A only reaches this point once the tenant themselves confirms — see `07-auth-and-roles.md`). Insert `Notification(senderId=<landlord>, receiverId=<tenant>, type='contract_created', isRead=false)`, then enqueue an async job for actual SMS/Zalo/Email dispatch — never call a third-party API synchronously inside the contract transaction.

---

### UC-T-02 — Receive Billing Reminder & Due Notifications
**Tier:** Free

Two distinct notifications, both triggered by UC-L-06 Part 1's daily cron (`01-bhms-landlord.md`):
1. **5 days before `monthlyPaymentDate`**: `Notification(type='billing_reminder', content=<"sắp đến hạn đóng tiền trọ">)`.
2. **On the due date**: `Notification(type='billing_due', content=<"cần nhập chỉ số điện nước" if the room has metered services, else "hóa đơn đã sẵn sàng">)`. Note this second notification does **not** always mean an `Invoice` already exists — see UC-L-06 Part 1: if the room has metered services, the tenant must complete UC-T-03 first before any `Invoice` is created.

Both dispatch async, never synchronously inside the cron's DB transaction.

---

### UC-T-03 — Upload Utility Meters via OCR
**Tier:** Free · **Tech:** OCR API · **Models:** `MeterReading`

> This is Part 2 of the billing flow described in UC-L-06 (`01-bhms-landlord.md`) — read that first for the full picture of how this feeds into `Invoice` generation.

1. On the due date, tenant opens the web app, sees a list of the room's active metered services still needing a reading this cycle (`RoomService` where `service.isMetered=true` and no `MeterReading WHERE invoiceId IS NULL` exists yet for that `serviceId`).
2. For each, tenant uploads a photo → create `MeterReading(roomId, serviceId, imageUrl, readingValue=NULL initially, invoiceId=NULL)`.
3. Async OCR job extracts the value → `UPDATE MeterReading SET readingValue=...`.
4. Tenant reviews the extracted number in an editable input: can manually correct it if the OCR misread, or **Retake** → re-upload and update the same row in place (same `id`), never create a duplicate for the same service/cycle.
5. Tenant confirms all readings for the cycle → this is the trigger point for UC-L-06 Part 3 (invoice generation). The confirm action should be a single "Xác nhận & xem hóa đơn" button that only enables once every metered service for the room has a reading — the frontend can compute this client-side, but the backend must re-validate the same completeness condition before generating the invoice (never trust the client's "all done" signal alone).

**Schema note:** there is no separate `confirmed` boolean on `MeterReading` — a non-null `readingValue` combined with `invoiceId` still being `NULL` is what signals "ready to be billed, not yet consumed by an invoice". Once Part 3 runs, `invoiceId` gets set and the reading is considered final/historical from then on (tenant can no longer edit it — a correction after billing needs a landlord-side manual adjustment, not a tenant self-edit).

---

### UC-T-04 — Execute Direct Payment
**Tier:** Free

Once UC-T-03 completes and UC-L-06 Part 3 has generated the `Invoice` (with `totalAmount` already computed — there's no separate "view invoice, then decide to pay" gap in time, the invoice and the payment screen appear together immediately after meter confirmation), the tenant is shown the locked-amount VietQR. On webhook confirmation, this is **the exact same backend flow as UC-L-06 Part 3, step 6** — just initiated from the tenant's web app, not a separate implementation. Rooms with no metered services skip UC-T-03 entirely and the tenant lands directly on this payment screen once the due-date cron creates the invoice.

---

### UC-T-05 — View Usage Analytics
**Tier:** Free

Query `MeterReading` + `InvoiceItem` for the tenant's current active `Contract.roomId`, grouped by billing period. Tenant-scoped — verify `TenantContract.tenantId = current_user.id` before returning any data.

---

### UC-T-06 — View Tenancy Details
**Tier:** Free

Read-only aggregate: active `Contract` + `Room` + `BoardingHouse` (basic info only, never financials) + `Notification WHERE boardingHouseId=... AND receiverId IS NULL` (broadcast announcements) + `RoomService` (fee structure).

---

### UC-T-07 — Submit Grievance/Complaint
**Tier:** Free · **Models:** `Grievance`, `GrievanceImage`

1. Tenant submits `title`, `description`, `priority` (`low|medium|high`, defaults to `medium`), optional images, tied to `boardingHouseId` and `roomId`.
2. Create `Grievance(tenantId, boardingHouseId, roomId, title, description, priority, status='pending')`, then `GrievanceImage(grievanceId, url)` rows for any attachments.
3. Routes to the Admin queue (UC-A-04). Admin updates `status`/`resolvedBy`/adds resolution info → triggers a notification to the tenant on resolution or rejection.
4. Tenant polls/subscribes to their own `Grievance` rows for status tracking (`pending → in_progress → resolved` or `rejected`).

**Schema note:** `resolvedBy` and the `rejected` status value already exist in `schema.prisma`. Only `Grievance.resolutionNote` (free-text explanation) is still missing — see `00-overview-and-conventions.md` Schema Gaps §B.

---

### UC-T-08 — View Payment History
**Tier:** Free · **Models:** `Invoice`, `InvoiceItem`, `Payment`, `Contract`, `TenantContract`

1. **Scope check first**: resolve every `Contract` this tenant has ever been party to — `TenantContract WHERE tenantId = current_user.id` joined `Contract`. This must include **past/ended contracts**, not just the currently active one — a tenant who moved out should still be able to see their old payment history. Never let the query silently default to only `status='active'`.
2. **Single aggregated query**, not N+1 per invoice:
   ```
   Invoice WHERE contractId IN (<all of this tenant's contract ids>)
     ├─ InvoiceItem (joined Service, for the per-line breakdown: rent / electricity / water / other services)
     └─ Payment (0-or-1, per the Payment.invoiceId @unique constraint — see 00-overview-and-conventions.md)
   ORDER BY dueDate desc
   ```
3. **Include upfront rent payments too**: if any of the tenant's contracts used `rentPaymentCycle='upfront'`, there's a separate `Payment(contractId=<that contract>, invoiceId=NULL)` row (see `01-bhms-landlord.md` UC-L-06 Part 3, step 1) that never went through `Invoice`/`InvoiceItem` at all. Fetch these separately — `Payment WHERE contractId IN (<contract ids>)` — and merge into the same response, tagged distinctly (e.g. `source: 'upfront_rent'` vs `source: 'monthly_invoice'`) so the frontend can render a sensible line item for it (label: "Tiền trọ trọn gói") even though it has no `InvoiceItem` breakdown.
4. **Response shape per entry** (one row per `Invoice`, plus the upfront-rent rows from step 3):
   - `totalAmount` (from `Invoice.totalAmount`, or `Payment.amount` for the upfront-rent case)
   - `paidAt` (from the linked `Payment.paidAt` — `NULL` if `Invoice.status` is still `unpaid`/`overdue`, i.e. the tenant can see pending/unpaid entries in the same list, not just successfully paid ones)
   - `status` (`Invoice.status`, or `Payment.status` for upfront-rent rows)
   - `breakdown[]`: for each `InvoiceItem`, `{ label: service?.name ?? 'Tiền trọ', amount, quantity, unitPrice }` — `serviceId IS NULL` is the existing convention for the rent line item (see `01-bhms-landlord.md` UC-L-06 Part 3, step 2).
5. **Tenant-scoping guard**: verify every `Invoice`/`Payment` row returned actually traces back to a `Contract` this tenant was party to via `TenantContract` — do not filter by `roomId` alone, since a room can have had multiple tenants across different contracts over time, and one tenant must never see another tenant's payment history for the same room.

**No new schema changes needed for this UC** — it's a pure read composed entirely from existing `Invoice`/`InvoiceItem`/`Payment`/`Contract`/`TenantContract` relations.