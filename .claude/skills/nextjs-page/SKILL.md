---
name: nextjs-page
description: >-
  Guide for creating Next.js pages, layouts and API routes in the Dormio frontend.
  Covers App Router conventions, server components, client components, service layer,
  auth middleware, and TailwindCSS v4 styling.
  Trigger on: "create page", "add route", "new next.js page", "frontend screen".
---

# Skill: Create a Next.js Page (Dormio Frontend)

## Overview

Dormio frontend is Next.js 16 App Router + React 19 + TailwindCSS v4 + Zustand.
The app has three dashboard areas: landlord, tenant, admin.

---

## 1. Route Structure

```
frontend/src/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx          # shared sidebar/nav
│   ├── landlord/
│   │   ├── page.tsx        # /landlord (dashboard overview)
│   │   ├── rooms/
│   │   │   ├── page.tsx    # /landlord/rooms (list)
│   │   │   └── [id]/page.tsx  # /landlord/rooms/:id
│   │   └── ...
│   ├── tenant/
│   └── admin/
└── (public)/               # public listing platform (no auth)
    ├── page.tsx
    └── listings/[id]/page.tsx
```

---

## 2. Server Component (default)

```tsx
// app/(dashboard)/landlord/rooms/page.tsx
import { getRooms } from "@/services/room.service";
import { RoomList } from "@/components/rooms/RoomList";

export const metadata = { title: "Rooms — Dormio" };

export default async function RoomsPage() {
  const rooms = await getRooms(); // server-side fetch
  return (
    <main>
      <h1 className="text-2xl font-semibold">Rooms</h1>
      <RoomList rooms={rooms} />
    </main>
  );
}
```

---

## 3. Client Component (use sparingly)

```tsx
"use client";
import { useState } from "react";

export function CreateRoomForm() {
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/rooms", { method: "POST", body: JSON.stringify({ name }) });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## 4. Service Layer (src/services/)

All API calls go through typed service functions — never raw fetch in components:

```typescript
// services/room.service.ts
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getRooms(boardingHouseId: string) {
  const res = await fetch(`${API}/rooms`, {
    headers: {
      "x-boarding-house-id": boardingHouseId,
      Authorization: `Bearer ${getToken()}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch rooms");
  const json = await res.json();
  return json.data;
}
```

---

## 5. Auth Middleware

```typescript
// middleware.ts (repo root of frontend)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/(dashboard)/:path*"],
};
```

---

## 6. Zustand Auth Store (src/store/)

```typescript
// store/auth.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: User | null;
  activeBoardingHouseId: string | null;
  setAuth: (token: string, user: User) => void;
  setActiveBoardingHouse: (id: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeBoardingHouseId: null,
      setAuth: (token, user) => set({ token, user }),
      setActiveBoardingHouse: (id) => set({ activeBoardingHouseId: id }),
      logout: () => set({ token: null, user: null, activeBoardingHouseId: null }),
    }),
    { name: "dormio-auth" }
  )
);
```

---

## 7. TailwindCSS v4 Patterns

```tsx
// Use Tailwind v4 utilities. No @apply in components — use class strings.
// Layout
<div className="flex min-h-screen bg-background">
  <aside className="w-64 bg-card border-r border-border">...</aside>
  <main className="flex-1 p-6">...</main>
</div>

// Cards
<div className="rounded-xl border border-border bg-card p-6 shadow-sm">...</div>

// Form inputs
<input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />

// Primary button
<button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
  Save
</button>
```

---

## 8. Checklist

- [ ] Server component by default, `"use client"` only when needed
- [ ] API calls via `src/services/` functions, not inline fetch in components
- [ ] Auth middleware guards dashboard routes
- [ ] Active boarding house from Zustand store, passed as `x-boarding-house-id` header
- [ ] `export const metadata` set on every page
- [ ] TailwindCSS v4 classes, no inline `style` unless animating dynamic values
