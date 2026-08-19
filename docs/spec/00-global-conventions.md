# Overview — Boarding House Management & Rental Platform

> **Purpose**: This is the entry point of a multi-file technical specification. Each module has its own file in this folder. AI coding agents implementing any use case (UC) below should treat Prisma model/field names as authoritative — they are copied directly from `schema.prisma`, not from an earlier ERD draft. If a model or field mentioned here doesn't exist in `schema.prisma`, treat `schema.prisma` as the source of truth and flag the mismatch instead of guessing.

**Stack**: NestJS (backend) · Prisma + PostgreSQL (data layer) · React Native/Expo (tenant/staff mobile) · Next.js (landlord web dashboard + rental platform).

**File map:**
| File | Covers |
|---|---|
| `00-overview-and-conventions.md` | This file — global rules, schema changelog |
| `01-bhms-landlord.md` | Module 1 (BHMS), actor: Landlord — UC-L-01 → UC-L-24 |
| `02-bhms-staff.md` | Module 1 (BHMS), actor: Staff — UC-S-01 → UC-S-02 |
| `03-bhms-tenant.md` | Module 1 (BHMS), actor: Tenant — UC-T-01 → UC-T-07 |
| `04-bhrp-poster.md` | Module 2 (BHRP), landlord acting as poster — UC-P-01 → UC-P-02 |
| `05-bhrp-platform-user.md` | Module 2 (BHRP), actor: Prospective Tenant — UC-PU-01 → UC-PU-05 |
| `06-admin.md` | Module 3, actor: Admin — UC-A-01 → UC-A-05 |

---

## Global Conventions (apply to every UC in every file)

- **IDs**: every model uses `String @id @default(uuid())`. All FK params in API contracts are UUID strings, not integers.
- **Multi-tenancy**: one `User` (role=`landlord`) can own multiple `BoardingHouse` rows. Every BHMS query must be scoped by `boardingHouseId` — never assume a landlord has exactly one property. List/aggregate endpoints accept `boardingHouseId` (or `boardingHouseId[]` for Pro cross-property reports) as an explicit filter, never inferred from the user alone. See UC-L-23 for the enforcement mechanism.
- **Financial records are never hard-deleted**: `Payment`, `Invoice`, `Contract`, `Deposit` use status transitions instead. Default `onDelete: Restrict` on these relations unless a UC explicitly says otherwise.
- **Money fields**: `Decimal` in Prisma → `DECIMAL(12,2)` in Postgres. Never `Float`.
- **Payment amount sign convention**: `Payment.amount` is **always positive**, including refunds (`PaymentType.REFUND`). Net revenue = `SUM(amount) WHERE type='CHARGE' AND status='SUCCESS'` minus `SUM(amount) WHERE type='REFUND' AND status='SUCCESS'`.
- **Audit logging**: any mutation to `Contract`, `Deposit`, `Payment`, `Invoice`, `EmployeeAssignment`, `Attendance`, `UserSubscription` must write an `AuditLog` row (`action`, `entityType`, `entityId`, `oldValue`, `newValue`, `userId`) inside the same DB transaction as the mutation. Implement via a Prisma middleware/interceptor, not manual calls scattered across services.
- **Role-based access**: `User.role` (`landlord | tenant | employee | admin`) gates every endpoint. Tenant-role users must never query another tenant's `Contract`/`Invoice`/`Payment`. Employee-role users are scoped to boarding houses where they have an `active` `EmployeeAssignment`.
- **Async side effects**: SMS/Zalo/Email dispatch and payment-gateway calls must go through a job queue (e.g. BullMQ), never synchronously inside the HTTP request that creates the triggering record. A flaky third-party API must never block a contract/payment/invoice write.

---

## Schema Changelog — decisions made after reviewing `schema.prisma`

These are corrections agreed on top of the uploaded schema. If your copy of `schema.prisma` doesn't yet reflect them, apply these before implementing the UCs below — several flows in this spec assume they're fixed:

1. **`Payment.payerId` must NOT be `@unique`.** It was `@unique` in the reviewed draft, which would mean each user could only ever make one payment in the entire system. Confirmed bug — remove `@unique`.
2. **`Payment.depositId` / `postPurchaseId` / `subscriptionId` / `invoiceId` must NOT be `@unique`.** Same issue — a `@unique` constraint here blocks retrying a failed payment and blocks creating a `REFUND`-type `Payment` row pointing at the same `depositId` as the original charge. Confirmed bug — remove `@unique` from all four.
3. **`PostPurchase` intentionally has no `quantityUsed` field.** Compute used quota dynamically: `COUNT(Post WHERE postPurchaseId = :id)`. This is a confirmed design choice, not a gap — do not add the field back.
4. **`Room.roomTypeId` was missing** (the `RoomType` model existed but nothing referenced it). Confirmed gap — add `roomTypeId String @map("room_type_id") @db.Uuid` + `roomType RoomType @relation(fields: [roomTypeId], references: [id])` to `Room`, and `rooms Room[]` back-relation on `RoomType`.
5. **`DepositType` enum is `{ platform, contract }` only — `hold_room` was removed.** Rationale (confirmed by product owner): *every* deposit is inherently "holding a room", so a separate `hold_room` type added no information beyond what `contractId` being null/non-null already tells you. The distinction that matters is **origin of the deposit**, not whether it's holding a room:
   - `type = 'contract'`: landlord recorded it manually/offline (`recordedManually = true`). `contractId` may be `NULL` (landlord is just holding the room for someone, no contract yet — this replaces the old `hold_room` case) or set (deposit tied to a contract created directly, the "external source" flow — see UC-L-04).
   - `type = 'platform'`: tenant paid it online through the rental platform (`recordedManually = false`), always starts with `postId` set and `contractId = NULL`, later gets `contractId` attached when a contract is created from it (UC-L-04b).
6. **`Deposit.recordedBy` must be nullable (`String?`)**, not required. It only has a value when `recordedManually = true`. Platform deposits (`type = 'platform'`) have no human "recorder" — `recordedBy` stays `NULL` for those.
7. **`Contract` has no `source` field.** The platform-vs-external distinction from earlier design discussions is no longer stored as an explicit enum on `Contract`. Derive it when needed: a contract came from the platform if it has an associated `Deposit WHERE type='platform'`, or equivalently if its linked `Post.resultedContractId` points back to it. Don't reintroduce a `source` column — derive, don't duplicate.
8. **Identity/ID-card data moved from `Contract` to `UserIdentification`** — a 1:1 profile per `User` (`userId @unique`), holding `identityNumber`, `fullName`, `dateOfBirth`, `gender`, `nationality`, `placeOfOrigin`/`placeOfResidence` (JSON), issue/expiry dates, and `cardFrontUrl`/`cardBackUrl`. This is a meaningful upgrade from the earlier per-contract image fields: **a tenant verifies their identity once**, and it's reused across every contract they sign, rather than re-uploading ID photos each time. See UC-L-04 for how this interacts with contract creation.
9. **`InvoiceItem.amount` is typed `Int`.** This looks like it should be `Decimal` (line items are money, e.g. electricity cost for the period) — flag this to the schema owner before running a production migration; the spec below assumes it will be corrected to `Decimal` since storing money as `Int` truncates fractional units and breaks the `SUM` reconciliation used throughout the billing flows.
10. **`Room.status` gained a `deposited` value** (`available | deposited | occupied | maintainace`\*) not present in earlier drafts — a room moves to `deposited` once a platform deposit exists for it and back to `available` if that deposit is refunded without becoming a contract, or to `occupied` once a contract is created. This is a genuine improvement (previously a room in this in-between state would still show as `available`, which is misleading). *(Note: enum value is spelled `maintainace` in the schema — a typo for `maintenance`. Match the existing spelling in code until the schema is corrected; do not silently "fix" the string in application code, or comparisons against the DB enum will break.)*
11. **`BoardingHouse` address is now structured** (`country`, `province`, `city`, `district`, `ward`, `street`, `houseNumber`) instead of a single `address` string. Any UC referencing "địa chỉ" now means this full structured object — search/filter UIs (UC-PU-01) should expose province/district as separate filter facets rather than free-text address search.
12. **`Contract.monthlyPaymentDate`** (an `Int`, day-of-month) is new — this is the billing anchor day used by UC-L-06's invoice-generation cron instead of a fixed platform-wide billing day. The cron must read this per-contract, not assume every contract bills on the 1st.

---

## Cross-Module Shared Infrastructure

These are implemented once and reused by multiple UCs across different files — do not reimplement per module:

- **`Conversation` / `Message` / `MessageAttachment`**: shared by UC-L-11 (landlord↔tenant chat in BHMS) and UC-PU-05 (prospective tenant↔poster chat in BHRP). Same tables, same WebSocket gateway.
- **`AiConversation` / `AiMessage`**: shared by UC-L-12 (post suggestions) and UC-L-24 (cross-property strategy reports). Differentiate by `boardingHouseId` (single property vs `NULL` for cross-property context) — there is no separate `purpose` enum in the current schema, so the calling service must pass enough context in the first `AiMessage(role=USER)` prompt for the distinction to be meaningful downstream (e.g. when rendering conversation history back to the landlord).
- **`Payment`**: the single settlement table for `Invoice`, `Deposit`, `PostPurchase`, and `UserSubscription` — see UC-L-06, UC-PU-04, UC-P-01, and the landlord's plan-purchase flow respectively. Exactly one of the four target FKs should be set per row (enforce with an application-layer check and/or a raw-SQL `CHECK` constraint added via a manual Prisma migration, since Prisma's schema language has no native `CHECK` support).
- **`AuditLog`**: see Global Conventions above.
- **`Notification`**: `receiverId = NULL` is the broadcast convention (used by UC-L-13, UC-T-01, UC-T-02, UC-A-04's resolution alerts). Fan-out to individual recipients happens at delivery time, not by pre-creating one row per recipient.