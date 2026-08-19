---
name: verify-spec
description: >-
  Verify that the current implementation matches docs/technical_spec.md.
  Reads the spec, inspects existing code, finds missing behavior, unspecified behavior,
  and inconsistencies. Returns a structured violation report.
  Trigger on: "verify spec", "check implementation", "does this match spec",
  "review against requirements", "/verify-spec".
---

# Skill: Verify Spec Compliance (Dormio)

> `docs/technical_spec.md` is the **contract**. This skill enforces it.

---

## When to Use

- After implementing any UC-* feature
- Before merging a PR
- When something "feels wrong" in the implementation
- Triggered by: `/verify-spec`, "check whether implementation matches technical_spec"

> **Source of truth**: `docs/technical_spec.md` is the index.
> Read the relevant `docs/spec/XX-*.md` module file for the actual UC requirements.
> Always also read `docs/spec/00-global-conventions.md` for cross-cutting rules.

---

## Workflow

```
1. Read docs/technical_spec.md → extract relevant UC-* requirements
         ↓
2. Identify implementation files (module, service, controller, DTO, page)
         ↓
3. Read implementation files
         ↓
4. Cross-reference: spec requirement ↔ implementation
         ↓
5. Find: MISSING behavior | WRONG behavior | UNSPECIFIED behavior
         ↓
6. Report violations by severity
```

---

## Step-by-Step Instructions

### Step 1 — Read the Spec

```
Find the UC in docs/technical_spec.md (index) → note the module file
Open the relevant docs/spec/XX-*.md file
Also read docs/spec/00-global-conventions.md for global rules
Focus on:
  - Tables used (which Prisma models are involved)
  - Flow steps (numbered list under each UC)
  - Business rules (bold text, constraints)
  - Edge cases (explicitly stated)
  - What should NOT happen (negative rules)
```

### Step 2 — Identify Scope

Determine which UC(s) are in scope.
Map UC → implementation files:

| UC | Backend files | Frontend files |
|---|---|---|
| UC-L-04 | `contracts.service.ts`, `contracts.controller.ts`, `create-contract.dto.ts` | `(dashboard)/landlord/contracts/new/page.tsx` |
| UC-PU-04 | `deposits.service.ts`, `payments.service.ts` | `(public)/listings/[id]/deposit/page.tsx` |
| etc. | | |

### Step 3 — Read Implementation

Read each relevant file. Look for:
- All service methods (do they cover all spec steps?)
- DTO validations (do they match required fields?)
- Guard usage (is `PropertyOwnershipGuard` present?)
- Transaction boundaries (are audit logs inside transactions?)
- Queue usage (are 3rd-party calls queued, not inline?)

### Step 4 — Compare

For each spec requirement, ask:
1. **Implemented?** Yes / No / Partial
2. **Correctly?** Does the code match the exact spec wording?
3. **Edge cases handled?** (quota checks, null guards, status guards)

### Step 5 — Report

Output a structured report:

```
## Spec Compliance Report — [UC-* / Feature Name]
Generated: [timestamp]

### CRITICAL (blocks correctness)
- [ ] UC-L-04 step 6: DEPOSIT must be created with type='contract', but current
      code creates PAYMENT instead. Spec says: "Do NOT create a PAYMENT row."
      File: backend/src/modules/contracts/contracts.service.ts:42

### HIGH (security / data integrity)
- [ ] UC-L-23: PropertyOwnershipGuard missing on PATCH /contracts/:id
      File: backend/src/modules/contracts/contracts.controller.ts:67

### MEDIUM (functional gap)
- [ ] UC-L-04 step 7: ROOM.status not set to 'occupied' after contract creation.
      File: backend/src/modules/contracts/contracts.service.ts

### LOW (quality / consistency)
- [ ] UC-L-04b: Form does not show "pre-filled deposit amount read-only" as specified.
      File: frontend/src/app/(dashboard)/landlord/contracts/new/page.tsx

### UNSPECIFIED BEHAVIOR (not in spec — review needed)
- [ ] PATCH /contracts/:id allows editing of rent_price. Spec does not mention
      this — confirm if intentional or a gap.

### COMPLIANT
- [x] UC-L-04 step 3: CONTRACT created with source='external' ✓
- [x] UC-L-04 step 4: CONTRACT_TENANT created with isPrimary=true ✓
- [x] UC-T-01: Onboarding notification queued async (not inline in transaction) ✓
```

---

## Key Rules to Always Check

For every feature, verify these cross-cutting concerns:

| Concern | What to check |
|---|---|
| Multi-tenancy | `PropertyOwnershipGuard` on all BHMS endpoints |
| Money | No `Float` type in any money field (must be `Decimal`) |
| Soft delete | No `prisma.X.delete()` on PAYMENT/INVOICE/CONTRACT/DEPOSIT |
| Audit log | `auditLog.create` inside same `$transaction` for required entities |
| Async 3rd-party | SMS/Email/Payment not called directly inside transaction or request handler |
| mustChangePassword | Login response includes flag; frontend redirects if true |
| Platform deposit conversion | UPDATE existing DEPOSIT.contractId, not INSERT |
| Idempotency | Payment webhook uses `transactionRef` UNIQUE constraint |
| Chat system | No duplicate messaging tables — must use CONVERSATION/MESSAGE |
| Broadcast notif | NOTIFICATION.receiverId IS NULL for broadcasts (not one row per tenant) |

---

## Example Usage

User says: "Check whether the contract creation implementation matches technical_spec."

Agent must:
1. Read `docs/technical_spec.md` UC-L-04 and UC-L-04b
2. Read `backend/src/modules/contracts/contracts.service.ts`
3. Read `backend/src/modules/contracts/contracts.controller.ts`
4. Read `frontend/src/app/(dashboard)/landlord/contracts/new/page.tsx`
5. Output the compliance report above
