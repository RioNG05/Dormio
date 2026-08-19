---
name: implement-feature
description: >-
  Full end-to-end implementation workflow for a Dormio feature.
  Forces the agent to read technical_spec → design → backend → DB → frontend → tests → verify.
  Prevents jumping straight to code without understanding requirements.
  Trigger on: "implement feature", "build feature", "add feature", "create UC-*", "implement UC-*".
---

# Skill: Implement Feature (Dormio)

> **Do NOT jump straight to code.**
> Follow this workflow top-to-bottom. Each step is a gate — complete it before moving forward.

---

## Full Workflow

```
technical_spec.md
      ↓
1. Identify UC-* requirements
      ↓
2. Understand existing architecture
      ↓
3. Design (entities, API, UI)
      ↓
4. Database (Prisma schema changes if needed)
      ↓
5. Backend (NestJS module: service + controller + DTOs)
      ↓
6. Frontend (Next.js page + service function)
      ↓
7. Tests (unit + e2e for critical paths)
      ↓
8. Verify against technical_spec (run verify-spec skill)
```

---

## Step 1 — Read & Extract Requirements

```
Action: Find the UC in docs/technical_spec.md (index table)
        Open the relevant docs/spec/XX-*.md file
        ALSO read docs/spec/00-global-conventions.md for global rules

Extract:
  - Tables involved
  - All numbered flow steps
  - Business rules (bold, constraints, edge cases)
  - What must NOT happen
  - Related UCs (e.g. UC-L-04 triggers UC-T-01)

Spec file mapping:
  UC-L-* → docs/spec/01-bhms-landlord.md
  UC-S-* → docs/spec/02-bhms-staff.md
  UC-T-* → docs/spec/03-bhms-tenant.md
  UC-P-* / UC-PU-* → docs/spec/04-bhrp.md
  UC-A-* → docs/spec/05-admin.md

Output a summary:
  Feature: [name]
  UC: [UC-L-04]
  Spec file: [docs/spec/01-bhms-landlord.md]
  Tables: [CONTRACT, CONTRACT_TENANT, DEPOSIT, USER, ROOM]
  Flow: [list of steps]
  Rules: [list of constraints]
  Related: [UC-T-01, UC-L-04b]
```

**Stop if requirements are ambiguous** — ask user before proceeding.

---

## Step 2 — Understand Existing Architecture

```
Action: Inspect current codebase
Check:
  - backend/prisma/schema.prisma — are all required models present?
  - backend/src/modules/ — which modules already exist?
  - frontend/src/app/ — which routes/pages exist?
  - backend/src/common/ — what guards/interceptors are already set up?
  - frontend/src/services/ — what service functions exist?

Output:
  - What already exists (reuse it)
  - What's missing (must create)
  - Shared utilities to reuse (findOrCreateByPhone, PrismaService, guards)
```

---

## Step 3 — Design

Before writing any code, design:

### 3a. Data Model
```
Are all required Prisma models present?
→ If not: plan schema changes (go to Step 4 first)
→ List all fields the feature reads/writes
→ Identify indexes needed for new query patterns
```

### 3b. API Contract
```
Define endpoints:
  Method  Path                                Body / Query           Response
  POST    /contracts                          CreateContractDto      ContractDto
  GET     /contracts/:id                      —                      ContractDetailDto
  PATCH   /contracts/:id/cancel               —                      ContractDto

Rules:
  - RESTful, kebab-case paths
  - All BHMS routes require X-Boarding-House-Id header
  - Response envelope: { success, data, meta? }
```

### 3c. Frontend Flow
```
Pages/components needed:
  - /landlord/contracts/new — form page
  - /landlord/contracts/[id] — detail page
  - ContractForm component
  - services/contract.service.ts functions

State: what goes in Zustand vs local state?
Navigation: where does user go before/after?
```

---

## Step 4 — Database Changes (if needed)

Load `database-change` skill for the full migration workflow.

Quick checklist:
- [ ] Update `backend/prisma/schema.prisma`
- [ ] Add new models or fields
- [ ] Add `@@index` for new query patterns
- [ ] Add `@@unique` where uniqueness is required
- [ ] Run `pnpm prisma migrate dev --name <description>` (in backend/)
- [ ] Run `pnpm prisma generate` to regenerate client
- [ ] Verify migration SQL looks correct (check `/backend/prisma/migrations/`)

---

## Step 5 — Backend Implementation

Load `nestjs-module` skill for the module pattern.

### 5a. Create module folder
```
backend/src/modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
└── dto/
    ├── create-<feature>.dto.ts
    └── update-<feature>.dto.ts
```

### 5b. Service — implement all flow steps from spec

Map each numbered spec step to a code block:
```typescript
async createContract(dto: CreateContractDto, userId: string) {
  // Step 1: find or create tenant user
  const tenant = await this.userService.findOrCreateByPhone(dto.phoneNumber, dto.fullName);

  return this.prisma.$transaction(async (tx) => {
    // Step 3: create CONTRACT
    const contract = await tx.contract.create({ data: { ...dto, source: 'external' } });

    // Step 4: create CONTRACT_TENANT
    await tx.contractTenant.create({ data: { contractId: contract.id, tenantId: tenant.id, isPrimary: true } });

    // Step 6: create DEPOSIT (external flow — no PAYMENT row)
    await tx.deposit.create({ data: { type: 'contract', contractId: contract.id, recordedManually: true, recordedBy: userId, ... } });

    // Step 7: set ROOM.status = occupied
    await tx.room.update({ where: { id: dto.roomId }, data: { status: 'occupied' } });

    // AuditLog (required for CONTRACT + DEPOSIT)
    await tx.auditLog.createMany({ data: [ auditEntry('CONTRACT', contract.id, ...), auditEntry('DEPOSIT', ...) ] });

    return contract;
  });

  // Step 8: trigger UC-T-01 async (OUTSIDE transaction)
  await this.notifQueue.add('send-notification', { tenantId: tenant.id, type: 'contract_created' });
}
```

### 5c. Controller — apply guards
```typescript
@Controller('contracts')
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
export class ContractsController { ... }
```

### 5d. Register module in app.module.ts

---

## Step 6 — Frontend Implementation

Load `nextjs-page` skill for the page pattern.

### 6a. Service function
```typescript
// services/contract.service.ts
export async function createContract(dto: CreateContractRequest, boardingHouseId: string) {
  const res = await fetch(`${API}/contracts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, 'x-boarding-house-id': boardingHouseId },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).data;
}
```

### 6b. Page component
- Server component for read-only pages (list, detail)
- Client component for forms (create, edit)
- `export const metadata` on every page
- Auth + boarding house context from Zustand store

---

## Step 7 — Tests

### Unit tests (backend service)
```typescript
describe('ContractsService', () => {
  it('creates contract with external source', async () => { ... });
  it('creates deposit but no payment for external flow', async () => { ... });
  it('sets room status to occupied', async () => { ... });
  it('throws if room not in boarding house', async () => { ... });
});
```

### E2E (critical flows only)
- Happy path: full contract creation
- Guard: request without X-Boarding-House-Id → 403
- Guard: wrong boarding house → 403

---

## Step 8 — Verify Against Spec

**Load and run the `verify-spec` skill.**

Confirm:
- Every numbered flow step in the UC has a corresponding code path
- All business rules are enforced
- No unspecified side effects introduced
- Cross-cutting rules (PropertyOwnershipGuard, AuditLog, no hard-delete, Decimal money) are satisfied

---

## Example

User: "Implement room rental contract feature."

Agent must:
1. Read UC-L-04 and UC-L-04b from docs/technical_spec.md
2. Inspect schema.prisma for CONTRACT, DEPOSIT, CONTRACT_TENANT models
3. Design: POST /contracts endpoint + ConvertDepositToContract variant
4. Check if schema needs changes (GRIEVANCE missing? No — not relevant here)
5. Create ContractsModule with service covering all 9 flow steps
6. Create frontend form page at /landlord/contracts/new
7. Write unit tests for service
8. Run verify-spec → confirm UC-L-04 compliance
