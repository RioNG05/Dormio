# Frontend — Next.js Agent Instructions

> Inherits from root AGENTS.md. These rules apply specifically to `frontend/`.

## Project Setup

- Framework: Next.js 16 App Router
- React: v19
- Styling: TailwindCSS v4 (PostCSS plugin `@tailwindcss/postcss`)
- State: Zustand (with persist middleware)
- Data tables: TanStack Table v8
- Charts: Recharts
- Icons: lucide-react
- Utils: clsx, tailwind-merge

## Dev Commands

```bash
cd frontend
pnpm dev      # Start dev server (port 3000)
pnpm build    # Build for production
pnpm lint     # Run ESLint
```

## Route Architecture (App Router)

```
src/app/
├── (auth)/                   # Public auth pages
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── change-password/page.tsx
├── (dashboard)/              # Protected dashboard
│   ├── layout.tsx            # Sidebar, topbar, auth check
│   ├── landlord/             # Landlord portal
│   │   ├── page.tsx          # Overview/analytics
│   │   ├── rooms/...
│   │   ├── contracts/...
│   │   ├── invoices/...
│   │   ├── expenses/...
│   │   ├── deposits/...
│   │   ├── staff/...
│   │   ├── schedule/...
│   │   ├── messages/...
│   │   └── settings/...
│   ├── tenant/               # Tenant portal
│   │   ├── page.tsx
│   │   ├── contract/...
│   │   ├── invoices/...
│   │   ├── meter-readings/...
│   │   └── messages/...
│   └── admin/                # Admin portal
│       ├── page.tsx
│       ├── users/...
│       ├── properties/...
│       ├── grievances/...
│       └── notifications/...
├── (public)/                 # Public rental platform (no auth)
│   ├── page.tsx              # Listing browse
│   ├── listings/[id]/...
│   └── landlords/[id]/...
└── api/                      # Next.js API routes (if needed for BFF)
```

## Component Architecture

```
src/components/
├── ui/           # Base design system (Button, Input, Modal, Card, Badge, etc.)
├── layout/       # Sidebar, Topbar, PageHeader
├── rooms/        # RoomCard, RoomList, RoomStatusBadge
├── contracts/    # ContractForm, ContractTimeline
├── invoices/     # InvoiceTable, InvoiceDetail
├── chat/         # ChatWindow, MessageBubble
└── charts/       # RevenueChart, OccupancyChart (Recharts)
```

## API Service Layer

All HTTP calls go through `src/services/`:
- `auth.service.ts`
- `room.service.ts`
- `contract.service.ts`
- `invoice.service.ts`
- `payment.service.ts`
- `notification.service.ts`
- etc.

API base URL: `process.env.NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`)

Every request to BHMS endpoints must include:
```typescript
headers: {
  "Authorization": `Bearer ${token}`,
  "x-boarding-house-id": activeBoardingHouseId,
}
```

## TailwindCSS v4 Notes

- Config is in `postcss.config.mjs` (CSS-based config, not tailwind.config.js)
- Use `cn()` helper (clsx + tailwind-merge) for conditional classes
- Dark mode support via `dark:` prefix

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
JWT_SECRET=... (for middleware server-side verify)
```

## Load the `nextjs-page` skill for detailed Next.js patterns.
