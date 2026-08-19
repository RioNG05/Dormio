# Backend — NestJS Agent Instructions

> Inherits from root AGENTS.md. These rules apply specifically to `backend/`.

## Project Setup

- Runtime: Node.js 20+, pnpm
- Framework: NestJS v11 (`@nestjs/common`, `@nestjs/core`, etc.)
- ORM: Prisma v7 with `@prisma/adapter-pg` driver adapter
- Generated client: `../generated/prisma` (from `prisma/schema.prisma`)

## Dev Commands

```bash
cd backend
pnpm start:dev          # Start with hot reload (port 3001)
pnpm build              # Build for production
pnpm test               # Run Jest unit tests
pnpm prisma:generate    # Re-generate Prisma client after schema changes
pnpm prisma:migrate:dev # Apply migration in dev
pnpm prisma:studio      # Open Prisma Studio
```

## Module Convention

Create modules in `src/modules/<feature>/`.
Load the `nestjs-module` skill for the full pattern.

Key shared infrastructure (create once, use everywhere):
- `src/common/prisma/` — PrismaService, PrismaModule (@Global)
- `src/common/guards/` — JwtAuthGuard, RolesGuard, PropertyOwnershipGuard
- `src/common/interceptors/` — ResponseInterceptor (wraps responses), AuditInterceptor
- `src/common/decorators/` — @Roles(), @CurrentUser()
- `src/common/filters/` — GlobalExceptionFilter

## Prisma Usage

- Import from `generated/prisma` (not `@prisma/client`).
- Use `PrismaPg` adapter pattern (already set up in PrismaService).
- Always use `$transaction()` for mutations that require AuditLog.
- Money fields: `Decimal` type. Pass as string from DTO, Prisma handles conversion.

## Environment Variables

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
REDIS_URL=redis://...
CLOUDINARY_URL=... (or S3 equivalents)
PLATFORM_DEPOSIT_HOLD_DAYS=7
```

## BullMQ Job Queues

Queues to create:
- `notifications` — send SMS/Zalo/Email async
- `ocr` — process meter reading images
- `payment-webhook` — process payment gateway callbacks
- `auto-refund` — scheduled deposit refunds
- `attendance-absent` — mark absent after shift window

## WebSocket

NestJS WebSocket gateway for chat. Load `nestjs-module` skill for WebSocket pattern.
Chat rooms: `conversationId`. Events: `message:send`, `message:received`, `typing`.
