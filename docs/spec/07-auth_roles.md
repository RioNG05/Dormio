# Module 0 — Authentication, Roles & Onboarding

> See `00-overview-and-conventions.md` for global rules. This file covers cross-cutting concerns that don't belong to a single actor file: registration/login, the role model, and every "a user gains a new capability" transition (Leasing Agent → Landlord, Tenant → Employee, etc).

---

## The Role Model — read this before implementing ANY permission check

`User.role` is a **single enum field** (`leasing_agent | tenant | employee | landlord | admin`), but the business rules describe **cumulative, inheriting capabilities** — a Landlord can simultaneously be an Employee somewhere else; a Tenant doesn't stop being a Tenant when they become a Landlord elsewhere. A single flat field cannot represent multiple simultaneous roles.

> **Note on the rename:** the role formerly called `poster` is now `leasing_agent` (`Người môi giới/đăng tin`). Update the `UserRole` enum in `schema.prisma` accordingly. This is a pure rename, not a capability change — everything below that describes what this role can/cannot do reflects the **latest** business rules, some of which are new (see "Posting Capability Split" further down).

**Confirmed resolution:** `User.role` stores only the **highest-achieved role, for UI/display purposes** (which onboarding banner to show, which default dashboard to land on after login). **It is NOT the source of truth for authorization.** Every permission check must instead query the actual relationship that grants that capability:

| Capability | How to check it — NOT `user.role === X` |
|---|---|
| Guest abilities (browse, search) | No auth required at all |
| Leasing Agent abilities (post listings with no room link, chat, buy post credits) | `isAuthenticated` — any logged-in `User`, regardless of `role` |
| Tenant abilities (view portal, deposit, grievance) for **a specific property** | `TenantContract WHERE tenantId = user.id AND contract.status = 'active'` joined to that `Contract.room.boardingHouseId` |
| Employee abilities (schedule, check-in/out) for **a specific property** | `EmployeeAssignment WHERE employee.userId = user.id AND boardingHouseId = X AND status = 'active'` |
| Landlord abilities (manage a property, **and** post listings linked to their own rooms) for **a specific property** | `BoardingHouse WHERE id = X AND ownerId = user.id` |
| Admin abilities (global) | `user.role === 'admin'` — this is the one case where the flat field IS authoritative, since Admin is a genuinely global, non-scoped, non-overlapping grant |

**Implementation guidance:** build NestJS guards per capability (`TenantOfPropertyGuard`, `EmployeeOfPropertyGuard`, `PropertyOwnershipGuard` — the last one already required by UC-L-23), not a single `RolesGuard(role: string)` that checks `user.role`. A `RolesGuard` checking the flat field would incorrectly deny a Landlord who is also scheduled as Employee somewhere, or a Tenant who hasn't yet "become" Landlord in the `role` field but who just successfully created a `BoardingHouse` in the same request.

**When does `User.role` actually get updated, then?** Only to reflect the *highest* capability the person has ever reached, in this fixed order: `leasing_agent < tenant < employee < landlord`, with `admin` set only by another Admin (never a self-service transition). Concretely:
- On successful registration: `role = 'leasing_agent'`.
- The moment a `TenantContract` is created for a user whose current `role = 'leasing_agent'`: bump `role = 'tenant'`.
- The moment an `EmployeeAssignment` is created for a user whose current `role` is `'leasing_agent'` or `'tenant'`: bump `role = 'employee'`.
- The moment a `BoardingHouse` is successfully created with `ownerId = user.id`: bump `role = 'landlord'` **regardless of prior role** (`landlord` outranks `employee`/`tenant` in the display hierarchy — this only affects which dashboard they land on by default, it never revokes their Tenant or Employee capabilities, which remain fully queryable via the relation tables above).
- Never downgrade `role` automatically (e.g. a `TenantContract` ending doesn't revert `role` back to `leasing_agent`) — it's a "highest ever reached" marker, not a live state machine.

---

## Posting Capability Split — Leasing Agent vs Landlord (architecture note)

**Everything related to `Post` — creating, viewing, managing listings — lives entirely in the BHRP module** (`04-bhrp-poster.md` / `05-bhrp-platform-user.md`), never in BHMS (`01-bhms-landlord.md`), **even for landlords**. `Landlord` inherits every `leasing_agent` capability plus property ownership, but posting itself is not a BHMS screen/endpoint that happens to also check `role='landlord'` — it's a single shared BHRP flow that behaves differently based on whether the caller **owns a `BoardingHouse` or not**:

| | Leasing Agent (no `BoardingHouse` owned) | Landlord (owns ≥1 `BoardingHouse`) |
|---|---|---|
| Can post a listing | Yes | Yes |
| Can link the listing to an existing `Room` | **No — `Post.roomId` must be `NULL`.** General info only (title, content, price, images, target area/description as free text). | Yes — `Post.roomId` may reference any `Room` they own, validated via `Room.boardingHouse.ownerId = user.id`. |
| Where the capability lives | BHRP only | BHRP only (not duplicated into BHMS) |
| Base daily free post quota | 3/day, flat | Same base 3/day, **plus a bonus from their active property-management `SubscriptionPlan`** — see "Post Quota Rules" below |
| Property-management `SubscriptionPlan` (Free/Plus/Pro) | **Does not apply to them at all** — not even an implicit `Free` tier; the concept simply doesn't exist for a pure leasing agent | Applies — this is the BHMS Free/Plus/Pro tier from UC-L-02/UC-L-23 etc. |
| Can buy extra `PostPurchase` credits | Yes | Yes — same mechanism, completely independent of the property-management plan |

See UC-P-01 in `04-bhrp-poster.md` for the full implementation of this split, and UC-AUTH-02 below for how a `leasing_agent` becomes a `landlord` in the first place.

---

## UC-AUTH-01 — Register / Login
**Models:** `User`, `OtpCode` (only for the phone-verification path in UC-AUTH-03)

1. **Registration**: primary method is `phoneNumber` + password. Optional `email` can also be supplied for authentication (i.e. login is possible via either `phoneNumber` or `email`, both unique). Create `User(role='leasing_agent', status='active', mustChangePassword=false)` — self-registered users pick their own password, so no forced reset.
2. **Login**: accept either identifier (`phoneNumber` or `email`) + password. Standard JWT/session issuance — no special notes beyond normal NestJS auth patterns.
3. Before registration is a `Guest` — this "role" is never persisted; it's simply the absence of a valid session. Do not create placeholder `User` rows for guests.

---

## UC-AUTH-02 — Become a Landlord
**Models:** `BoardingHouse`, `Room`, `RoomType`, `User`

1. Any authenticated user (any `role`) clicks "Tạo nhà trọ".
2. Full property + initial room creation form, same data as UC-L-01/UC-L-02 combined into one onboarding flow (`BoardingHouse` fields, `RoomType[]`, initial `Room[]`).
3. **Only on successful creation** of the `BoardingHouse` row does the role bump happen (`role = 'landlord'` per the rule above) — if room/type creation fails partway through, the whole onboarding transaction should roll back (including the role bump) so the user isn't left in an inconsistent "labeled landlord but no property" state.

---

## UC-AUTH-03 — Staff Onboarding by Phone (with Random Password + OTP)
**Models:** `User`, `Employee`, `EmployeeAssignment`, `OtpCode`

This refines UC-L-19 (`01-bhms-landlord.md`) with the exact security flow now specified:

1. Landlord searches `User WHERE phoneNumber = :phone`.
   - **Found** → read-only prefill, proceed to `EmployeeAssignment` creation directly (this user already has credentials, no password/OTP steps needed).
   - **Not found** → landlord enters name + phone → backend generates a **cryptographically random password** (not a fixed default like `00000000` — this is a deliberate change from earlier drafts, driven by the business requirement) → create `User(phoneNumber, username, hashedPassword=hash(randomPassword), mustChangePassword=true, role='leasing_agent')`. The random password is shown once to the landlord (or sent directly to the new staff member's phone via SMS — product decision, either is compatible with this schema) so they can pass it along.
2. Create `Employee(userId)` if it doesn't exist yet, then `EmployeeAssignment(...)` as in UC-L-19. Per the role rule above, bump `role='employee'` if this user's current role is `leasing_agent`.
3. **First login verification (only for accounts created via this manual flow, not for pre-existing users):** when this `User` first attempts to log in:
   - Generate a 6-digit numeric OTP, store `OtpCode(userId, codeHash=hash(otp), purpose='login_verification', expiresAt=NOW()+5min, attemptCount=0)`.
   - Dispatch the plain OTP via SMS (async job, per Global Conventions).
   - User submits the OTP → backend compares hash, checks `expiresAt` and `attemptCount < 5` (lock out after 5 wrong tries, require a fresh OTP request) → on match, set `OtpCode.verifiedAt=NOW()` and issue a session token scoped to **only** allow a password-change request next (don't grant a full session yet).
   - User sets a new password → `User.hashedPassword` updated, `mustChangePassword=false` → now issue a full session token.
4. **Security note:** never log or store the plaintext OTP anywhere outside the SMS dispatch job's transient memory — only `codeHash` persists in `OtpCode`.

---

## UC-AUTH-04 — Tenant Confirms/Rejects a Draft Contract
**Models:** `Contract`, `TenantContract`, `Notification`

This is the second half of the "platform" contract-creation flow (see UC-L-04 in `01-bhms-landlord.md` for the landlord's side — this UC covers what happens after the landlord submits a `draft` contract).

1. Landlord creates `Contract(status='draft', ...)` and `TenantContract`.
2. Notify the tenant: `Notification(receiverId=<tenant>, type='contract_pending_confirmation', content=<deep link>)`, dispatched async.
3. Tenant reviews the draft contract terms in the web app.
   - **Confirm** → `PATCH Contract SET status='active', confirmedAt=NOW()`. Contract is now in effect immediately. Trigger the same `Room.status='occupied'` update and `ContractDocument` generation as the direct-creation flow.
   - **Reject** → `PATCH Contract SET status='canceled', rejectedAt=NOW(), rejectionReason=<tenant's free-text reason>`. Notify the landlord of the rejection + reason. The associated platform `Deposit` (still `status='paid'`, `contractId` now pointing at this canceled contract) should be evaluated by the same auto-refund job described in UC-PU-04 — treat a rejected-contract deposit the same as an unconverted one for refund purposes, since the tenant explicitly declined to proceed.

**Note on schema additions required:** `confirmedAt`, `rejectedAt`, and `rejectionReason` do not exist on `Contract` in the uploaded `schema.prisma` — see `boarding_house_erd_v2.mermaid` and the "Schema Gaps" section in `00-overview-and-conventions.md`. Add these three fields before implementing this UC.