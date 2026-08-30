# Overview — Boarding House Management & Rental Platform

> **Purpose**: This is the entry point of a multi-file technical specification, regenerated to match the uploaded `schema.prisma` and the latest business-flow descriptions (role model, contract confirm/reject, meter-first billing, staff/tenant onboarding with OTP). AI coding agents should treat Prisma model/field names here as authoritative — copied directly from `schema.prisma`. If something here conflicts with your copy of `schema.prisma`, the schema file wins; flag the mismatch instead of guessing.

**Stack**: NestJS (backend) · Prisma + PostgreSQL · Next.js (web only — landlord dashboard, tenant portal, staff portal, rental platform, admin portal all served as responsive web apps in the browser; no native mobile app).

**File map:**
| File | Covers |
|---|---|
| `00-overview-and-conventions.md` | This file — global rules, schema gaps |
| `07-auth-and-roles.md` | **Read this early** — the role model, registration, becoming a Landlord, staff/tenant onboarding with random password + OTP, contract confirm/reject |
| `01-bhms-landlord.md` | UC-L-01 → UC-L-24: Landlord — property, rooms, contracts, billing, staff, scheduling |
| `02-bhms-staff.md` | UC-S-01, UC-S-02: Staff schedule & timekeeping |
| `03-bhms-tenant.md` | UC-T-01 → UC-T-07: Tenant notifications, meter-first billing, grievances |
| `04-bhrp-poster.md` | UC-P-01, UC-P-02: Landlord acting as poster on the rental platform |
| `05-bhrp-platform-user.md` | UC-PU-01 → UC-PU-05: Prospective tenant — browsing, identity + deposit, chat |
| `06-admin.md` | UC-A-01 → UC-A-05: Admin analytics, grievance resolution, mass notifications |

---

## Global Conventions

- **IDs**: every model uses `String @id @default(uuid())`. All FK params in API contracts are UUID strings.
- **Multi-tenancy**: one `User` can own multiple `BoardingHouse` rows (see `07-auth-and-roles.md` — ownership, not `role`, is what makes someone a "landlord" for a given property). Every BHMS query must be scoped by `boardingHouseId`, validated server-side via `PropertyOwnershipGuard` (UC-L-23) on every request.
- **Authorization is relationship-based, not `role`-based** — see `07-auth-and-roles.md` for the full explanation. This is the single most important architectural rule in the whole system; do not write a naive `@Roles('landlord')` guard anywhere in the codebase.
- **Financial records are never hard-deleted**: `Payment`, `Invoice`, `Contract`, `Deposit` use status transitions. Default `onDelete: Restrict` unless a UC says otherwise.
- **Money fields**: `Decimal` in Prisma → `DECIMAL(12,2)` in Postgres. Never `Float`. (See Schema Gaps — `InvoiceItem.amount` currently violates this.)
- **Payment amount sign convention**: `Payment.amount` is always positive, including refunds (`PaymentType.refund`). Net revenue = `SUM(amount) WHERE type='charge' AND status='success'` minus `SUM(amount) WHERE type='refund' AND status='success'`.
- **Payment ↔ target linkage**: `Payment` has five nullable target FKs — `invoiceId`, `depositId`, `postPurchaseId`, `subscriptionId`, `contractId` (the last one is for `rentPaymentCycle='upfront'` one-time rent payments). **All five are `@unique`** in the current schema — each target can have at most one `Payment` row, ever. This has three consequences every implementer must understand:
  1. **No retry-by-inserting.** If a charge fails, update the existing `Payment` row's `status`/`transactionRef` in place — do not insert a second row for the same target. Failed-attempt history lives in `AuditLog`, not in multiple `Payment` rows.
  2. **Refunds don't reuse the target FK.** A refund is a **new** `Payment` row, but it leaves `depositId` (or whichever target FK) `NULL` — that slot is already taken by the original charge. Instead, link the two via the self-relation: `Payment.refundPaymentId` (on the **original charge** row) points at the refund row's `id`. To find a deposit's refund: `Payment WHERE depositId = X` → follow `.refundPaymentId` → that's the refund. See UC-PU-04 in `05-bhrp-platform-user.md` for a worked example.
  3. **The "which target" constraint is conditional on `type`, not a flat "exactly one of five" rule** — this was missing from earlier drafts of this spec and must be enforced:
     - `type = 'charge'` → **exactly one** of the five target FKs must be non-null. A charge with zero targets is an orphaned payment (paying for nothing); a charge with two or more targets is ambiguous (which one actually got the money?).
     - `type = 'refund'` → **all five target FKs must be `NULL`.** A refund is identified purely through the reverse of `refundPaymentId` (i.e. some charge row points at it) — it never sets its own `depositId`/`invoiceId`/etc., because that slot already belongs to the original charge (per point 2 above).

     Enforce with a raw-SQL `CHECK` constraint added via a manual Prisma migration (Prisma's schema language has no native `CHECK` support):
     ```sql
     ALTER TABLE payments ADD CONSTRAINT chk_payment_target_by_type CHECK (
       (type = 'charge' AND (
         (invoice_id IS NOT NULL)::int + (deposit_id IS NOT NULL)::int +
         (post_purchase_id IS NOT NULL)::int + (subscription_id IS NOT NULL)::int +
         (contract_id IS NOT NULL)::int = 1
       ))
       OR
       (type = 'refund' AND
         invoice_id IS NULL AND deposit_id IS NULL AND post_purchase_id IS NULL AND
         subscription_id IS NULL AND contract_id IS NULL
       )
     );
     ```
     Mirror this check at the application/service layer too (don't rely on the DB constraint alone to surface a clean error message to the caller) — validate before insert, not just let the DB reject it.
- **Audit logging**: any mutation to `Contract`, `Deposit`, `Payment`, `Invoice`, `EmployeeAssignment`, `Attendance`, `UserSubscription` must write an `AuditLog` row inside the same transaction as the mutation. Implement via a Prisma middleware/interceptor.
- **Async side effects**: SMS/Zalo/Email dispatch and payment-gateway calls go through a job queue (e.g. BullMQ), never synchronously inside the HTTP request that creates the triggering record.

---

## Cross-Module Shared Infrastructure

- **`Conversation` / `Message` / `MessageAttachment`**: shared by UC-L-11 (landlord↔tenant chat) and UC-PU-05 (prospective tenant↔poster chat). Same tables, same WebSocket gateway.
- **`AiConversation` / `AiMessage`**: shared by UC-L-12 (post suggestions) and UC-L-24 (cross-property strategy reports) — see Schema Gaps below regarding `boardingHouseId` needing to become nullable for the latter.
- **`Payment`**: the single settlement table for `Invoice`, `Deposit`, `PostPurchase`, `UserSubscription`, and upfront-rent `Contract` payments. See the refund pattern above.
- **`Notification`**: `receiverId = NULL` is the broadcast convention (UC-L-13, UC-T-01, UC-A-04). Fan-out to individual recipients happens at delivery time.
- **`UserService.findOrCreateByPhone()`**: shared helper for "landlord types a phone number, system finds-or-creates a `User`", used identically by UC-L-04 Flow B (tenant) and UC-L-19 (staff) — including generating a random password and flagging `mustChangePassword=true`. See `07-auth-and-roles.md` UC-AUTH-03 for the full first-login OTP flow this triggers. Do not implement this twice.

---

## Schema Gaps — must be resolved before implementing the affected use cases

Grouped by severity. These are gaps found while writing the business-flow spec against the uploaded `schema.prisma` — none of them are implemented yet.

### A. Required fields that must become nullable (will cause INSERT failures otherwise)

These model a state that only exists *after* some later event — as written, Prisma will refuse to create the row before that event ever happens, which breaks the normal lifecycle:

| Model.field | Why it must be nullable |
|---|---|
| `Attendance.checkIn` / `checkOut` | A shift starts with neither set; `checkOut` in particular is only known after the tenant/employee finishes their shift (UC-S-02). |
| `Grievance.resolvedAt` | Only set once an admin resolves it (UC-A-04) — every `pending` grievance needs this to be `NULL`. |
| `EmployeeAssignment.leftAt` | Only set when the assignment ends — an `active` assignment has no end date yet. |
| `Message.readAt` | Only set once the recipient reads it — most messages start unread. |
| `Expense.paidAt` | `Expense.status` defaults to `pending`; a pending expense hasn't been paid yet. |

### B. Missing fields/models needed for specific flows

| Addition | Needed for |
|---|---|
| `MeterReading.invoiceId` (nullable FK → `Invoice`) | UC-L-06/UC-T-03's meter-first billing flow — without this there's no way to tell which readings are "unconsumed" vs already billed into a past invoice. |
| `Contract.confirmedAt`, `Contract.rejectedAt`, `Contract.rejectionReason` (nullable) | UC-AUTH-04 — the tenant confirm/reject step for platform-originated contracts. |
| `OtpCode` model (new table: `id`, `userId`, `codeHash`, `purpose`, `expiresAt`, `verifiedAt`, `attemptCount`, `createdAt`) | UC-AUTH-03 — first-login SMS verification for accounts created via the manual phone-entry flow. |
| `Grievance.resolutionNote` (nullable text) | UC-A-04 — `GrievenceStatus` already includes `rejected`, but there's no field to record *why* something was resolved or rejected. |
| `AiConversation.boardingHouseId` → make nullable | UC-L-24's cross-property AI strategy reports have no single `boardingHouseId` to attach to. |

### C. Data-type / design concerns to flag to the schema owner

| Field | Concern |
|---|---|
| `InvoiceItem.amount` (`Int`) | Should be `Decimal` — a metered utility line item can have fractional cost; `Int` truncates it and breaks `SUM` reconciliation against `Invoice.totalAmount`. |
| `Expense.roomId` (required) | No way to record a property-wide expense not tied to one room (e.g. a shared-area repair). |
| `TenantContract.contractId` (required) | The business description mentions landlords can "add someone to a room without a contract" — as written, that's not possible without a `Contract` row existing (see the footnote in `01-bhms-landlord.md` UC-L-04 Flow B). Confirm whether every occupancy really does need a backing `Contract` row (our working assumption), or whether a lighter-weight "occupant without contract" concept needs to be introduced.

---

## Role Model — summary (full detail in `07-auth-and-roles.md`)

`User.role` (`poster | tenant | employee | landlord | admin`) is a **display-only "highest achieved role" label**. It is never the sole basis for a permission check except for `admin`. Every other capability is derived from a relationship: `BoardingHouse.ownerId` (landlord-for-property), active `EmployeeAssignment` (employee-for-property), active `TenantContract` (tenant-for-property), or simply being authenticated at all (poster-level capabilities). Read `07-auth-and-roles.md` before writing any guard, controller, or authorization check anywhere in the codebase.

---

## Media Storage — Cloudinary + AWS S3, used together from day one

Two providers, split strictly by **sensitivity** — not a single provider, and not a "start simple, migrate later" plan. Build both integrations from the start:

| Group | Fields | Provider | Delivery |
|---|---|---|---|
| **Public, display-optimized images** | `User.avatarUrl`, `Room.image_url`, `PostImage.url`, `BoardingHouse.thumbnail` | **Cloudinary** | `type: upload` (public). Enable `f_auto,q_auto` for automatic format/compression, and eager transformations at upload time to pre-generate thumbnails. This is Cloudinary's strength — image CDN + on-the-fly transforms — keep it scoped to exactly this group. |
| **Private images (PII)** | `UserIdentification.cardFrontUrl`/`cardBackUrl`, `GrievanceImage.url`, `MessageAttachment.url` (when `type='image'`) | **AWS S3** | Private bucket, `Block Public Access` fully enabled. Store only the **S3 object key** in the DB field, never a URL. Generate a **pre-signed URL** (`GetObjectCommand` + `getSignedUrl`, short expiry — e.g. 5–15 minutes) at request time via the AWS SDK, on every read. Never persist a signed URL anywhere — it expires and leaks the signature if cached. |
| **Documents (non-image)** | `ContractDocument.url`, `MessageAttachment.url` (when `type='file'`) | **AWS S3** | Same private-bucket + presigned-URL pattern. S3 is the right home for this from the start — proper Lifecycle rules (e.g. transition old contract documents to Glacier/Deep Archive after N months), and no image-CDN features are relevant to a PDF/Word file, so there's no reason to route it through Cloudinary even temporarily. |

**Why split this way instead of one provider for everything:** Cloudinary's value (transforms, CDN, `f_auto/q_auto`) only applies to images meant for public display — it adds nothing for a private ID card photo or a contract PDF, where the actual requirement is strict access control and durable storage, which is S3's strength. Running both from day one avoids a later migration and keeps each provider doing only what it's good at.

**Implementation notes:**
- Two upload services in the codebase: `CloudinaryUploadService` (public image group) and `S3UploadService` (private image + document group) — route by field/use-case at the call site, not by a runtime content-type sniff.
- **Cloudinary upload flow:** client requests a signed upload signature from the backend → uploads directly to Cloudinary from the client → backend receives the resulting `public_id`/URL and writes it to the relevant field.
- **S3 upload flow:** client requests a pre-signed `PUT` URL from the backend (`PutObjectCommand` + `getSignedUrl`) → uploads directly to S3 from the client → backend receives the resulting object key and writes it to the relevant field. Never proxy file bytes through the NestJS server itself in either flow — presigned/signed direct upload avoids the extra hop and memory/bandwidth cost on the API server.
- S3 bucket: enable default encryption at rest (SSE-S3 or SSE-KMS) in addition to Block Public Access — defense in depth, don't rely solely on "we always generate presigned URLs" as the only safeguard.
- **Key naming convention (S3 objects)**: `{entityType}/{entityId}/{uuid}.{ext}` (e.g. `contracts/8f2a.../4c1e....pdf`, `identifications/User-9b3.../front.jpg`) — predictable prefixes make lifecycle rules, per-entity cleanup on delete, and cost auditing by prefix straightforward.
- `MessageAttachment.type` (`image | file`) determines routing: `image` still goes to **S3**, not Cloudinary, because message attachments in a private conversation are not "public display" content even when they happen to be an image — sensitivity, not file type, drives the routing decision.

**Hard rule regardless of the above:** `UserIdentification.cardFrontUrl/cardBackUrl` and `ContractDocument.url` must never be reachable via a permanent, unsigned URL from either provider. Leaking either is a serious personal-data/legal-document exposure — treat any code path that returns a public/unsigned URL for these two fields as a bug blocking release, not a style preference.