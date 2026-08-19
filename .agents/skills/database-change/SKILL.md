---
name: database-change
description: >-
  Full workflow for any Prisma schema change in Dormio.
  Covers reading spec → inspecting schema → determining entities/relations →
  updating Prisma schema → generating migration → checking constraints/indexes →
  updating backend → updating frontend → running tests.
  Trigger on: "add table", "add field", "schema change", "new entity", "add column",
  "create migration", "update schema", "add relation", "add index".
---

# Skill: Database Change Workflow (Dormio)

> Never modify the schema blindly. Follow this workflow to ensure correctness,
> consistency with the spec, and migration safety.

---

## Workflow

```
docs/technical_spec.md
         ↓
1. Understand requirement
         ↓
2. Inspect current schema.prisma
         ↓
3. Determine entities & relations
         ↓
4. Update Prisma schema
         ↓
5. Generate migration
         ↓
6. Check constraints & indexes
         ↓
7. Update backend (service/DTO)
         ↓
8. Update frontend (types/service)
         ↓
9. Run tests
```

---

## Step 1 — Understand Requirement

Read `docs/technical_spec.md` for the relevant feature.
Extract:
- Which tables are mentioned?
- Which fields are required (name, type, nullable)?
- Which constraints are specified (UNIQUE, FK, CHECK)?
- What are the query patterns? (This determines indexes)

Known schema gaps that must be added before their features:
```
GRIEVANCE         → UC-T-07, UC-A-04
MASS_NOTIFICATION_JOB → UC-A-05
USER.mustChangePassword → UC-L-19 (already in schema ✓)
SUBSCRIPTION_PLAN.maxRooms → UC-L-02 (if room limit enforced)
```

---

## Step 2 — Inspect Current Schema

```
File: backend/prisma/schema.prisma
Check:
  - Does the model already exist?
  - Are all required fields present?
  - Are existing FKs correct?
  - Are existing indexes sufficient for the new queries?
```

---

## Step 3 — Determine Entities & Relations

For any new entity, define:
```
Model:   [Name]
Purpose: [what it represents]
Fields:  [list with types and constraints]
FKs:     [which other models does it reference?]
onDelete behavior: [Restrict / Cascade / SetNull]
Unique:  [which field combos must be unique?]
Indexes: [which fields will be used in WHERE/JOIN/ORDER BY?]
```

**Example — Adding GRIEVANCE:**
```
Model:   Grievance
Purpose: Tenant complaint routed to admin queue
Fields:
  id              String (UUID PK)
  tenantId        String FK → User
  boardingHouseId String? FK → BoardingHouse (nullable context)
  category        GrievanceCategory enum
  content         Text
  status          GrievanceStatus (open|in_review|resolved|rejected)
  resolutionNote  String? (nullable)
  resolvedBy      String? FK → User (nullable, admin)
  createdAt       DateTime
  resolvedAt      DateTime? (nullable)
FKs: tenantId onDelete: Restrict, resolvedBy onDelete: SetNull
Indexes: [tenantId], [status], [boardingHouseId]
```

---

## Step 4 — Update Prisma Schema

```
File: backend/prisma/schema.prisma
```

Always include:
1. `@id @default(uuid())` on PK
2. `@map("snake_case")` on all fields
3. `@@map("table_name")` on all models
4. `@@index([...])` for query patterns
5. `@@unique([...])` for uniqueness constraints
6. `onDelete: Restrict` on financial FK references

**Example — GRIEVANCE model:**
```prisma
enum GrievanceCategory {
  overcharging
  harassment
  maintenance
  other
}

enum GrievanceStatus {
  open
  in_review
  resolved
  rejected
}

model Grievance {
  id              String             @id @default(uuid())
  tenantId        String             @map("tenant_id") @db.Uuid
  tenant          User               @relation("TenantGrievances", fields: [tenantId], references: [id], onDelete: Restrict)
  boardingHouseId String?            @map("boarding_house_id") @db.Uuid
  boardingHouse   BoardingHouse?     @relation(fields: [boardingHouseId], references: [id], onDelete: SetNull)
  category        GrievanceCategory
  content         String
  status          GrievanceStatus    @default(open)
  resolutionNote  String?            @map("resolution_note")
  resolvedById    String?            @map("resolved_by") @db.Uuid
  resolvedBy      User?              @relation("ResolvedGrievances", fields: [resolvedById], references: [id], onDelete: SetNull)
  createdAt       DateTime           @default(now()) @map("created_at")
  resolvedAt      DateTime?          @map("resolved_at")

  @@index([tenantId])
  @@index([status])
  @@index([boardingHouseId])
  @@map("grievances")
}
```

Also add back-relation fields to `User` and `BoardingHouse` models.

---

## Step 5 — Generate Migration

```bash
cd backend

# Create and apply migration (dev only)
pnpm prisma migrate dev --name add_grievance_table

# Regenerate Prisma client
pnpm prisma generate

# Verify migration SQL
# Check: backend/prisma/migrations/<timestamp>_add_grievance_table/migration.sql
```

**Review the generated SQL:**
- Correct column types? (`TEXT`, `VARCHAR(n)`, `DECIMAL(12,2)`, `UUID`)
- FK constraints present?
- Indexes generated?
- Any unexpected `DROP` statements? (If so — STOP and investigate)

---

## Step 6 — Check Constraints & Indexes

After migration, verify in the DB or migration SQL:

```sql
-- Should see in migration.sql:
CREATE TABLE "grievances" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "boarding_house_id" UUID,
  "category" "GrievanceCategory" NOT NULL,
  "content" TEXT NOT NULL,
  "status" "GrievanceStatus" NOT NULL DEFAULT 'open',
  ...
  CONSTRAINT "grievances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "grievances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT
);
CREATE INDEX "grievances_tenant_id_idx" ON "grievances"("tenant_id");
CREATE INDEX "grievances_status_idx" ON "grievances"("status");
```

For custom CHECK constraints (not supported by Prisma schema), add to migration SQL manually:
```sql
-- Example: Payment target FK check
ALTER TABLE "payments" ADD CONSTRAINT "payment_target_check"
  CHECK (
    ("invoice_id" IS NOT NULL)::int +
    ("deposit_id" IS NOT NULL)::int +
    ("post_purchase_id" IS NOT NULL)::int +
    ("subscription_id" IS NOT NULL)::int = 1
  );
```

---

## Step 7 — Update Backend

After schema change:
1. **Create/update DTO** — add new fields with validation
2. **Update service** — use new fields in queries
3. **Update response types** — include new fields in response DTO
4. **Update AuditLog** calls if the changed entity is audited

```typescript
// dto/create-grievance.dto.ts
export class CreateGrievanceDto {
  @IsEnum(GrievanceCategory)
  category: GrievanceCategory;

  @IsString()
  @MinLength(10)
  content: string;

  @IsOptional()
  @IsUUID()
  boardingHouseId?: string;
}
```

---

## Step 8 — Update Frontend

1. **Update TypeScript types** in `frontend/src/types/`
2. **Update service functions** in `frontend/src/services/`
3. **Update any form that references the changed model**

```typescript
// types/grievance.ts
export interface Grievance {
  id: string;
  category: 'overcharging' | 'harassment' | 'maintenance' | 'other';
  content: string;
  status: 'open' | 'in_review' | 'resolved' | 'rejected';
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}
```

---

## Step 9 — Run Tests

```bash
cd backend

# Unit tests
pnpm test

# Check that existing tests still pass (no breaking changes)
# If schema changed in a breaking way (renamed column, etc.):
#   - Update test fixtures/mocks
#   - Update seed data if using Prisma db seed
```

---

## Safety Rules

- **Never** run `prisma db push` in production — always use migrations.
- **Never** rename a column directly — add new column, migrate data, drop old column in separate steps.
- **Review migration SQL** before applying — look for unexpected `DROP` statements.
- **Money fields**: must be `@db.Decimal(12, 2)` — never `Float` or `Int`.
- **UUID fields**: must have `@db.Uuid` annotation.
- **Timestamps**: use `@default(now())` for `createdAt`, `@updatedAt` for `updatedAt`.
