# Technical Specification — Boarding House Management & Rental Platform

> **IMPORTANT — Source of Truth**
>
> This file is now an **index**. The actual specification has been split into module files under `docs/spec/`.
> AI agents must read the relevant module file before implementing any feature — do not implement from memory or guesswork.
>
> **Stack context**: NestJS (backend), Prisma v7 + PostgreSQL (data layer), Next.js (landlord web + rental platform).

---

## Spec Files

| File | Contents |
|---|---|
| [`docs/spec/00-global-conventions.md`](./spec/00-global-conventions.md) | Multi-tenancy, money, audit log, soft delete, RBAC — apply to ALL modules |
| [`docs/spec/01-bhms-landlord.md`](./spec/01-bhms-landlord.md) | UC-L-01 → UC-L-24: Landlord use cases (property, rooms, contracts, invoices, staff, schedules) |
| [`docs/spec/02-bhms-staff.md`](./spec/02-bhms-staff.md) | UC-S-01, UC-S-02: Staff scheduling and timekeeping |
| [`docs/spec/03-bhms-tenant.md`](./spec/03-bhms-tenant.md) | UC-T-01 → UC-T-07: Tenant notifications, payments, meter readings, grievances |
| [`docs/spec/04-bhrp.md`](./spec/04-bhrp.md) | UC-P-01, UC-P-02, UC-PU-01 → UC-PU-05: Rental platform listing, deposit, chat |
| [`docs/spec/05-admin.md`](./spec/05-admin.md) | UC-A-01 → UC-A-05: Admin analytics, grievances, mass notifications |
| [`docs/spec/06-appendices.md`](./spec/06-appendices.md) | Media storage, payment types, known schema gaps |

---

## Use Case Index

### MODULE 1: BHMS

#### Landlord (`docs/spec/01-bhms-landlord.md`)

| UC | Title | Tier |
|---|---|---|
| UC-L-01 | Initialize Property Profile | Free |
| UC-L-02 | Bulk Generate Rooms | Free |
| UC-L-03 | Create Single Room | Free |
| UC-L-04 | Generate Rental Contract (external) | Free |
| UC-L-04b | Convert Platform Deposit into Contract | Free |
| UC-L-05 | View Room Dashboard | Free |
| UC-L-06 | Automated QR Payment Collection | Free |
| UC-L-07 | View Payment History | Free |
| UC-L-08 | View Property Analytics | Free |
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

#### Staff (`docs/spec/02-bhms-staff.md`)

| UC | Title | Tier |
|---|---|---|
| UC-S-01 | View Schedule | Free |
| UC-S-02 | Timekeeping (Check-in/Check-out) | Free |

#### Tenant (`docs/spec/03-bhms-tenant.md`)

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

### MODULE 2: BHRP (`docs/spec/04-bhrp.md`)

| UC | Title | Actor | Tier |
|---|---|---|---|
| UC-P-01 | Publish Rental Listing | Poster | Free |
| UC-P-02 | Poster Analytics Dashboard | Poster | Pro |
| UC-PU-01 | Browse & Filter Listings | Platform User | Free |
| UC-PU-02 | View Poster Profile | Platform User | Free |
| UC-PU-03 | Save/Bookmark Listings | Platform User | Free |
| UC-PU-04 | Direct Online Deposit | Platform User | Free |
| UC-PU-05 | Initiate Direct Chat | Platform User | Free |

---

### MODULE 3: Admin Portal (`docs/spec/05-admin.md`)

| UC | Title | Tier |
|---|---|---|
| UC-A-01/02/03 | Global Analytics | Free |
| UC-A-04 | Manage Grievances | Free |
| UC-A-05 | Mass Notification Dispatcher | Free |

---

## How to Use This Spec

When implementing any feature:
1. Find the UC number in the table above
2. Open the corresponding spec file
3. Read `00-global-conventions.md` for cross-cutting rules
4. Load `dormio-domain` skill for entity quick-reference
5. Load `implement-feature` skill for the full implementation workflow
