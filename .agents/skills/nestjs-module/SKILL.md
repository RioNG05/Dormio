---
name: nestjs-module
description: >-
  Step-by-step guide for creating a NestJS feature module in the Dormio backend.
  Covers module structure, controller, service, DTOs, guards, and Prisma integration.
  Trigger on: "create module", "add endpoint", "new NestJS module", "generate controller/service".
---

# Skill: Create a NestJS Feature Module (Dormio Backend)

## Overview

The Dormio backend is NestJS v11 + Prisma v7 with `@prisma/adapter-pg`.
All feature modules live in `backend/src/modules/<feature>/`.

---

## 1. Folder Structure

```
backend/src/modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
└── dto/
    ├── create-<feature>.dto.ts
    └── update-<feature>.dto.ts
```

---

## 2. Module Template

```typescript
import { Module } from "@nestjs/common";
import { FeatureController } from "./feature.controller";
import { FeatureService } from "./feature.service";

@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
```

Register in `app.module.ts` imports array.

---

## 3. PrismaService (shared, in common/prisma/)

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Make `PrismaModule` `@Global()` so all modules can inject without re-importing.

---

## 4. Service Pattern

```typescript
@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(boardingHouseId: string) {
    // Always scope BHMS queries by boardingHouseId
    return this.prisma.room.findMany({ where: { boardingHouseId } });
  }

  async create(dto: CreateRoomDto, userId: string) {
    // Use $transaction for mutations that need AuditLog
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({ data: dto });
      // AuditLog is only required for: CONTRACT, DEPOSIT, PAYMENT, INVOICE,
      // EMPLOYEE_ASSIGNMENT, ATTENDANCE, USER_SUBSCRIPTION
      return room;
    });
  }
}
```

---

## 5. Controller Pattern (with Logger & Swagger)

```typescript
@ApiTags("Rooms")
@ApiBearerAuth()
@Controller("rooms")
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
export class RoomController {
  private readonly logger = new Logger(RoomController.name);

  constructor(private readonly service: RoomService) {}

  @Get()
  @ApiOperation({ summary: "List all rooms for a boarding house" })
  @ApiOkResponse({ description: "Rooms retrieved successfully", type: [RoomResponseDto] })
  async findAll(
    @Request() req,
    @Headers("x-boarding-house-id") boardingHouseId: string
  ) {
    this.logger.log(`GET /rooms called for boardingHouseId: ${boardingHouseId} by user: ${req.user?.id}`);
    const data = await this.service.findAll(boardingHouseId);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: "Create a room" })
  @ApiOkResponse({ description: "Room created successfully", type: RoomResponseDto })
  async create(
    @Body() dto: CreateRoomDto,
    @Request() req,
    @Headers("x-boarding-house-id") boardingHouseId: string
  ) {
    this.logger.log(`POST /rooms called by user: ${req.user?.id}`);
    const data = await this.service.create(
      { ...dto, boardingHouseId },
      req.user.id
    );
    return { success: true, data };
  }
}
```

---

## 6. PropertyOwnershipGuard (create once in common/guards/)

```typescript
@Injectable()
export class PropertyOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const boardingHouseId = req.headers["x-boarding-house-id"];
    const userId = req.user?.id;
    if (!boardingHouseId || !userId) return false;
    const house = await this.prisma.boardingHouse.findFirst({
      where: { id: boardingHouseId, ownerId: userId },
    });
    return !!house;
  }
}
```

---

## 7. Response Format

```typescript
// Success list
return { success: true, data: list, meta: { total, page, limit } };
// Success single
return { success: true, data: item };
// Errors: throw NestJS built-in exceptions
throw new NotFoundException("Room not found");
throw new ForbiddenException("You do not own this boarding house");
throw new BadRequestException("out_of_posting_quota");
```

---

## 8. Checklist
- [ ] Module added to `app.module.ts` imports
- [ ] `PropertyOwnershipGuard` on all BHMS routes
- [ ] `AuditLog` in same `$transaction` for financial mutations
- [ ] Money fields: `Decimal` type, never `number`/`float`
- [ ] No hard-delete on financial records
- [ ] No 3rd-party calls inside DB transactions
- [ ] `Logger` instantiated and logs when each endpoint is called
- [ ] Complete Swagger annotations (`@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, `@ApiProperty`, etc.) added
