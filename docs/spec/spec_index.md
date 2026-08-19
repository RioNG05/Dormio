# Technical Specification — Boarding House Management & Rental Platform

> **IMPORTANT — Source of Truth**
>
> This file is an **index only**. The actual specification lives in the module files under `spec/`.
> AI agents must read the relevant module file before implementing any feature — do not implement from memory or guesswork based on this index alone.
>
> **Stack context**: NestJS (backend), Prisma + PostgreSQL (data layer), React Native/Expo (tenant/staff mobile), Next.js (landlord web dashboard + rental platform).

---

## Spec Files

| File | Contents |
|---|---|
| [`00-overview-and-conventions.md`](./00-overview-and-conventions.md) | Multi-tenancy, money, audit log, RBAC, async side effects — apply to ALL modules. Also contains the **schema changelog** (bug fixes and design decisions agreed on top of `schema.prisma`) and the cross-module shared infrastructure notes (chat, AI conversations, payments, notifications) |
| [`01-bhms-landlord.md`](./01-bhms-landlord.md) | UC-L-01 → UC-L-24 (+ UC-L-04b): Landlord use cases — property setup, rooms, contracts, invoices/payments, staff, shift scheduling |
| [`02-bhms-staff.md`](./02-bhms-staff.md) | UC-S-01, UC-S-02: Staff schedule viewing and timekeeping |
| [`03-bhms-tenant.md`](./03-bhms-tenant.md) | UC-T-01 → UC-T-07: Tenant notifications, payments, meter readings, grievances |
| [`04-bhrp-poster.md`](./04-bhrp-poster.md) | UC-P-01, UC-P-02: Landlord acting as poster — publishing listings, analytics |
| [`05-bhrp-platform-user.md`](./05-bhrp-platform-user.md) | UC-PU-01 → UC-PU-05: Prospective tenant — browsing, deposits, chat |
| [`06-admin.md`](./06-admin.md) | UC-A-01 → UC-A-05: Admin analytics, grievance resolution, mass notifications |

---

## Use Case Index

### MODULE 1: BHMS (Boarding House Management System)

#### Landlord (`./01-bhms-landlord.md`)

| UC | Title | Tier |
|---|---|---|
| UC-L-01 | Initialize Property Profile | Free |
| UC-L-02 | Bulk Generate Rooms | Free |
| UC-L-03 | Create/Edit Single Room | Free |
| UC-L-04 | Generate Rental Contract (External Source Flow) | Free |
| UC-L-04b | Convert Platform Deposit into Contract | Free |
| UC-L-05 | View Room Dashboard | Free |
| UC-L-06 | Automated QR Payment Collection | Free |
| UC-L-07 | View Payment History | Free |
| UC-L-08 | View Property Analytics (Dashboard) | Free |
| UC-L-09 | Manual Utility Logging | Free |
| UC-L-10 | Manual Deposit Entry | Free |
| UC-L-11 | Real-time Direct Messaging | Free |
| UC-L-12 | AI Rental Post Suggestions | Plus |
| UC-L-13 | Broadcast Announcements | Plus |
| UC-L-14 | Deposit Management | Plus |
| UC-L-15 | Export Contracts | Plus |
| UC-L-16 | Debt Tracking | Plus |
| UC-L-17 | Expense Management | Plus |
| UC-L-18 | Custom Service Management | Plus |
| UC-L-19 | Onboard Staff | Pro |
| UC-L-20 | Manage Staff | Pro |
| UC-L-21 | Shift Scheduling | Pro |
| UC-L-22 | Attendance Management | Pro |
| UC-L-23 | Multi-Property Context Switching | Pro |
| UC-L-24 | Advanced Multi-Property Reports | Pro |

#### Staff (`./02-bhms-staff.md`)

| UC | Title | Tier |
|---|---|---|
| UC-S-01 | View Schedule | Free |
| UC-S-02 | Timekeeping (Check-in/Check-out) | Free |

#### Tenant (`./03-bhms-tenant.md`)

| UC | Title | Tier |
|---|---|---|
| UC-T-01 | Receive Onboarding Notification | Free |
| UC-T-02 | Receive Billing Notification | Free |
| UC-T-03 | Upload Utility Meters via OCR | Free |
| UC-T-04 | Execute Direct Payment | Free |
| UC-T-05 | View Usage Analytics | Free |
| UC-T-06 | View Tenancy Details | Free |
| UC-T-07 | Submit Grievance/Complaint | Free |

---

### MODULE 2: BHRP (Boarding House Rental Platform)

#### Landlord acting as Poster (`./04-bhrp-poster.md`)

| UC | Title | Tier |
|---|---|---|
| UC-P-01 | Publish Rental Listing | Free |
| UC-P-02 | Poster Analytics Dashboard | Pro |

#### Prospective Tenant (`./05-bhrp-platform-user.md`)

| UC | Title | Tier |
|---|---|---|
| UC-PU-01 | Browse & Filter Listings | Free |
| UC-PU-02 | View Poster Profile | Free |
| UC-PU-03 | Save/Bookmark Listings | Free |
| UC-PU-04 | Direct Online Deposit | Free |
| UC-PU-05 | Initiate Direct Chat | Free |

---

### MODULE 3: Admin Portal

#### Admin (`./06-admin.md`)

| UC | Title | Tier |
|---|---|---|
| UC-A-01/02/03 | Global Analytics (Users / Properties / Listings) | Free |
| UC-A-04 | Manage Grievances | Free |
| UC-A-05 | Mass Notification Dispatcher | Free |

---

## Known Schema Gaps (tracked in `./00-overview-and-conventions.md`)

Quick-reference only — see the linked file for full detail before implementing anything that touches these:

1. `InvoiceItem.amount` is typed `Int`, should be `Decimal` (loses fractional units on metered billing).
2. `Grievance` has no `resolutionNote`/`resolvedBy`, and `GrievanceStatus` has no `REJECTED` value.
3. `Expense.roomId` is required — no way to record a property-wide expense not tied to one room.
4. `MeterReading` has no `status`/`confirmed` field — UC-T-03's OCR confirm step and UC-L-06's billing read must currently assume any present `readingValue` is final.