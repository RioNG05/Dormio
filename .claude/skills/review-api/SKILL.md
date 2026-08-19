---
name: review-api
description: >-
  API contract review for Dormio NestJS + Next.js. Checks endpoint naming,
  HTTP methods, status codes, DTOs, validation, error responses, pagination,
  filtering, authorization, authentication, response DTOs, and consistency
  between frontend and backend.
  Trigger on: "review api", "check api", "api contract", "api consistency",
  "/review-api", "does frontend match backend".
---

# Skill: API Contract Review (Dormio)

> Ensures the frontend and backend share the same API contract.
> Mismatches cause runtime errors that are hard to debug.

---

## Output Format

```
## API Review Report — [module / feature]
Reviewed: [timestamp]

### Contract Violations (frontend ↔ backend mismatch)
### Naming Issues
### HTTP Method Issues
### Status Code Issues
### DTO / Validation Issues
### Auth / Authorization Issues
### Pagination / Filtering Issues
### Response Structure Issues
### Missing Endpoints
### Consistent ✓
```

---

## Step-by-Step Workflow

### Step 1 — Map Endpoints

List all endpoints defined in the NestJS controller:
```
GET    /rooms                → findAll(boardingHouseId, page, limit)
POST   /rooms                → create(CreateRoomDto)
GET    /rooms/:id            → findOne(id)
PATCH  /rooms/:id            → update(id, UpdateRoomDto)
DELETE /rooms/:id            → remove(id)  [soft: status change only]
GET    /rooms/:id/dashboard  → getRoomDashboard(id)
```

Then check each endpoint in the frontend service layer (`src/services/*.service.ts`):
- Does the URL path match exactly?
- Are headers sent correctly (`x-boarding-house-id`, `Authorization`)?
- Is the request body shape correct?
- Is the response shape consumed correctly?

### Step 2 — Check Each Dimension

---

## Dimension 1 — Endpoint Naming

Rules:
- Paths: kebab-case, plural nouns (`/boarding-houses`, `/room-services`, not `/boardingHouses`)
- Nested resources: `/boarding-houses/:id/rooms` (parent context in path)
- Actions that aren't CRUD: use verb suffix (`/contracts/:id/cancel`, `/invoices/:id/mark-paid`)
- No verbs in main CRUD paths (`/rooms/create` ← wrong)

```
BAD:  GET /getRooms
BAD:  POST /createRoom
BAD:  POST /rooms/create
GOOD: GET /rooms
GOOD: POST /rooms
```

---

## Dimension 2 — HTTP Methods

| Operation | Method | Notes |
|---|---|---|
| List / search | GET | query params for filter/page |
| Get single | GET | `:id` in path |
| Create | POST | body: CreateDto |
| Full replace | PUT | rarely used in Dormio |
| Partial update | PATCH | body: UpdateDto (all optional) |
| Status transition | PATCH | e.g. PATCH /contracts/:id/cancel |
| Delete (soft) | PATCH or DELETE | prefer PATCH for status change |
| Trigger action | POST | e.g. POST /attendance/check-in |
| File upload | POST | multipart/form-data |

```
BAD:  POST /rooms/:id/delete  (use DELETE or PATCH)
BAD:  GET  /rooms/:id/update  (GET must be idempotent)
GOOD: PATCH /rooms/:id        (partial update)
GOOD: PATCH /contracts/:id/cancel  (status transition)
```

---

## Dimension 3 — HTTP Status Codes

| Scenario | Status |
|---|---|
| GET success | 200 |
| POST success (created) | 201 |
| PATCH/DELETE success | 200 or 204 |
| Bad request / validation fail | 400 |
| Not authenticated | 401 |
| Forbidden (wrong role / not owner) | 403 |
| Not found | 404 |
| Conflict (duplicate) | 409 |
| Unprocessable entity (business rule) | 422 |
| Internal error | 500 |

Dormio-specific:
- Out of posting quota → 400 with code `out_of_posting_quota`
- Check-in outside window → 403
- Wrong boarding house (guard) → 403
- Duplicate room name → 409

---

## Dimension 4 — DTOs & Validation

Check CreateDto and UpdateDto:

```typescript
// CreateRoomDto — must validate all required fields
export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;                     // required

  @IsNumber()
  @Min(1)
  floor: number;                    // required

  @IsOptional()
  @IsDecimal()                      // Decimal, not number!
  defaultPrice?: string;

  @IsUUID()
  roomTypeId: string;               // required, valid UUID

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  serviceIds?: string[];
}

// UpdateRoomDto — all optional (PATCH semantics)
// Use PartialType(CreateRoomDto) from @nestjs/mapped-types
export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
```

Issues to flag:
- [ ] Required fields missing `@IsNotEmpty()` or `@IsString()`
- [ ] Money fields not using `@IsDecimal()` (must not be `@IsNumber()`)
- [ ] UUIDs not validated with `@IsUUID()`
- [ ] Array items not validated with `{ each: true }`
- [ ] UpdateDto has required fields (should be all optional)
- [ ] DTO allows fields that spec says are read-only (e.g. `source` on Contract)

---

## Dimension 5 — Authorization & Authentication

For every endpoint, verify:

```
Public (no auth):
  GET  /posts              (UC-PU-01: browse listings)
  GET  /posts/:id          (UC-PU-02: view poster profile)

Authenticated (JWT only):
  POST /posts/:id/save     (UC-PU-03: bookmark)
  POST /posts/:id/deposit  (UC-PU-04: platform deposit)

BHMS (JWT + PropertyOwnershipGuard):
  ALL  /rooms              (X-Boarding-House-Id header required)
  ALL  /contracts          (X-Boarding-House-Id header required)
  ALL  /invoices           (X-Boarding-House-Id header required)

Admin only (JWT + RolesGuard([admin])):
  GET  /admin/analytics    (UC-A-01/02/03)
  ALL  /admin/grievances   (UC-A-04)

Tenant scoped (JWT, data filtered to own contracts):
  GET  /tenant/invoices    (only caller's contracts)
  GET  /tenant/contracts   (only contracts where tenantId = userId)
```

Flag any endpoint missing guards, or where scoping is not enforced in service.

---

## Dimension 6 — Pagination & Filtering

All list endpoints must support:
```
Query params:
  page    (default: 1)
  limit   (default: 20, max: 100)
  orderBy (field name)
  order   (asc | desc)

Feature-specific filters (example for /rooms):
  status        (available | occupied | deposited | maintenance)
  roomTypeId    (UUID)
  floor         (number)
```

Response meta:
```json
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 87, "totalPages": 5 }
}
```

**Frontend must**:
- Pass `page`/`limit` as query params
- Read `meta.total` for pagination UI
- Not re-fetch all data on filter change — update query params

---

## Dimension 7 — Response DTOs

Never return the raw Prisma object — transform to a response DTO:

```typescript
// BAD: returns hashedPassword, all internal fields
return this.prisma.user.findUnique({ where: { id } });

// GOOD: explicit select or transform
select: {
  id: true, username: true, phoneNumber: true, avatarUrl: true, role: true
}
// OR use a mapper:
return new UserResponseDto(user);
```

Check:
- [ ] `hashedPassword` never in any response
- [ ] Private fields not exposed to wrong roles
- [ ] `contract.idCardFrontUrl` served as signed URL, not stored URL
- [ ] Nested relations return only needed fields (not full nested objects)

---

## Dimension 8 — Error Response Consistency

All errors must follow:
```json
{
  "success": false,
  "error": "ROOM_NOT_FOUND",
  "message": "Room with id abc123 does not exist"
}
```

Custom error codes to standardize:
```
ROOM_NOT_FOUND
CONTRACT_NOT_FOUND
OUT_OF_POSTING_QUOTA
BOARDING_HOUSE_ACCESS_DENIED
DEPOSIT_ALREADY_CONVERTED
CHECK_IN_WINDOW_EXPIRED
DUPLICATE_ROOM_NAME
DUPLICATE_PAYMENT
```

---

## Dimension 9 — Frontend ↔ Backend Consistency Check

For each service function in `frontend/src/services/`:

```typescript
// Check 1: URL matches controller path exactly
// Backend: @Controller('boarding-houses') @Get(':id/rooms')
// Frontend: fetch(`${API}/boarding-houses/${id}/rooms`) ✓

// Check 2: Headers correct
headers: {
  'Authorization': `Bearer ${token}`,      // required for all authenticated
  'x-boarding-house-id': boardingHouseId,  // required for all BHMS
}

// Check 3: Body matches DTO
body: JSON.stringify({
  name: dto.name,       // must match CreateRoomDto field names
  floor: dto.floor,
  defaultPrice: dto.defaultPrice?.toString(), // Decimal as string
})

// Check 4: Response parsing correct
const json = await res.json();
return json.data;  // not json directly — envelope!
```

---

## Example Report

```
## API Review Report — ContractsModule
Reviewed: 2026-08-19

### Contract Violations (frontend ↔ backend mismatch)
CRITICAL: Frontend sends POST /contract (singular), backend expects POST /contracts (plural).
          File: frontend/src/services/contract.service.ts:12

HIGH: Frontend does not send X-Boarding-House-Id header on PATCH /contracts/:id.
      Backend will return 403 for all update requests.
      File: frontend/src/services/contract.service.ts:28

### DTO / Validation Issues
HIGH: CreateContractDto.depositAmount typed as @IsNumber() but must be @IsDecimal()
      (Decimal field, not Float). Risk: precision loss.
      File: backend/src/modules/contracts/dto/create-contract.dto.ts:15

MEDIUM: UpdateContractDto.source is not marked @IsOptional() — required field in PATCH DTO.
        File: backend/src/modules/contracts/dto/update-contract.dto.ts

### Response Structure Issues
MEDIUM: GET /contracts/:id returns raw Prisma object including contractTenants.tenant.hashedPassword.
        File: backend/src/modules/contracts/contracts.service.ts:45

### Consistent ✓
- POST /contracts returns 201 ✓
- PATCH /contracts/:id/cancel uses correct PATCH method ✓
- Pagination meta included in GET /contracts response ✓
```
