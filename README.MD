# 🏠 Dormio — Smart Boarding House Management & Rental Platform

<p align="center">
  <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80" alt="Dormio Banner" width="100%" style="border-radius: 12px; max-height: 360px; object-fit: cover;" />
</p>

<p align="center">
  <strong>An enterprise-grade SaaS platform tailored for the Vietnamese boarding house and serviced apartment ecosystem.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Next.js-v16.2-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Prisma-v7-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/PayOS-Integrated-0052CC?style=flat-square" alt="PayOS" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Core Platform Modules](#-core-platform-modules)
- [Key Architectural Invariants](#-key-architectural-invariants)
- [Tech Stack](#-tech-stack)
- [System Requirements](#-system-requirements)
- [Step-by-Step Installation & Quickstart](#-step-by-step-installation--quickstart)
  - [1. Clone Repository & Install Dependencies](#1-clone-repository--install-dependencies)
  - [2. Environment Configuration (.env)](#2-environment-configuration-env)
  - [3. Running in Development Environment](#3-running-in-development-environment)
    - [Option A: Hybrid Development (Recommended)](#-option-a-hybrid-development-recommended-for-daily-dev)
    - [Option B: Full Docker Development Stack](#-option-b-full-docker-development-stack-all-in-docker)
- [Default Test Accounts & Credentials](#-default-test-accounts--credentials)
- [Port Mappings & Service Endpoints](#-port-mappings--service-endpoints)
- [NPM / PNPM Script Reference](#-npm--pnpm-script-reference)
- [Project Directory Structure](#-project-directory-structure)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Engineering Guidelines & Conventions](#-engineering-guidelines--conventions)
- [License & Contributions](#-license--contributions)

---

## 🌟 Overview

**Dormio** is an all-in-one SaaS platform engineered specifically for the Vietnamese rental housing sector. It solves the fragmentation between property management operations and public room rental acquisition by unifying two primary subsystems into a cohesive ecosystem:

1. **BHMS (Boarding House Management System)**: An operational management suite for landlords, property managers, tenants, and staff members across multiple boarding houses.
2. **BHRP (Boarding House Rental Platform)**: A high-reach public marketplace where prospective tenants discover verified rooms, make online holding deposits, and communicate directly with property owners.

---

## 🏢 Core Platform Modules

### 1. BHMS (Boarding House Management System)

- **Multi-Property Context (Landlords)**: Switch effortlessly between multiple boarding houses. Manage room categories, pricing tiers, amenities, and floor plans.
- **Bulk Room Generator**: Batch generate dozens of rooms with custom numbering patterns, surface areas, base prices, and attached default utility services.
- **Tenancy Contracts**:
  - **Flow A (Platform Flow)**: Seamlessly promotes an existing online holding deposit into a formalized tenancy contract without duplicate financial entries.
  - **Flow B (Direct / Offline Flow)**: Creates walk-in contracts with identity card (CCCD) uploads, co-tenant tracking, and deposit recording.
- **Automated Billing & AI OCR**:
  - Monthly automated invoice generation powered by background cron jobs.
  - Camera-based utility meter capture with **Gemini AI OCR** for automated electricity and water reading extraction.
  - Month-over-Month (MoM) consumption analytics and anomaly alerts.
- **Centralized PayOS Payment Gateway**:
  - Dynamic VietQR generation locking the exact amount and reference code.
  - Real-time webhook reconciliation updating invoice states to `paid` instantly.
- **Staff Shifts & Geofenced Timekeeping**:
  - Recurring shift generation with designated position titles (cleaning, security, technician).
  - Geofenced check-in and check-out validation with GPS coordinate distance calculation and time-window enforcement.
- **Grievance Resolution & Asset Tracking**:
  - Tenant complaint ticketing with image attachments and severity levels.
  - Fixed-asset lifecycle logging per room (air conditioners, water heaters, furniture).

### 2. BHRP (Boarding House Rental Platform)

- **Public Room Discovery**: Map-based and attribute-based search (price range, district, radius, room amenities, pet policies).
- **Listing Posts & Quotas**: Tier-based listing quotas for landlords with AI-assisted post description drafting.
- **Online Holding Deposits**: Prospective tenants can place financial deposits via PayOS with an automated 7-day holding release / forfeiture policy.
- **Real-time Communication**: Direct WebSocket chat messaging between prospective tenants, landlords, and leasing agents with file/image attachments.

---

## 🛡 Key Architectural Invariants

The Dormio codebase enforces several strict architectural rules to guarantee financial accuracy, regulatory compliance, and multi-tenant security:

| Rule | Implementation & Guarantee |
| :--- | :--- |
| **Monetary Precision** | All monetary values are strictly defined as `DECIMAL(12,2)` in PostgreSQL and `Decimal` in Prisma. Floating-point numbers are strictly forbidden. |
| **No Hard Deletes** | Legal and financial entities (`PAYMENT`, `INVOICE`, `CONTRACT`, `DEPOSIT`) are **never** hard-deleted. State transitions (`active`, `terminated`, `expired`, `cancelled`) preserve auditability. |
| **Server-Side Ownership Guard** | Every BHMS endpoint requires an `X-Boarding-House-Id` header validated via `PropertyOwnershipGuard` to verify user authority over the target property. |
| **Atomic Audit Logging** | Mutations affecting contracts, deposits, payments, invoices, employee assignments, and user subscriptions write an `AuditLog` within the **same database transaction**. |
| **Split Media Storage** | **Cloudinary** handles public optimized assets (`f_auto, q_auto`); **AWS S3** / private storage manages sensitive PII documents (CCCD identity photos, paper contracts, grievance evidence) via presigned URLs. |
| **Standardized Business Error Codes** | Backend business errors throw `BusinessException` with typed `BusinessErrorCode` enums, automatically mapped to client-side translations in both Vietnamese and English (`vi` / `en`). |
| **Standardized Views & Modals** | Landlord list views support parallel **Grid & Table** view modes with Grid default (`viewMode = "grid"`), 5-page window jumping (`windowStart ± 5`), and unsaved changes confirmation dialogs on modal dismissal. |

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | [NestJS v11](https://nestjs.com/) (Modular Monolith, Fastify/Express engine), [TypeScript 5](https://www.typescriptlang.org/) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/), [Prisma ORM v7](https://www.prisma.io/) with `@prisma/adapter-pg` driver adapter |
| **Frontend Framework** | [Next.js 16.2](https://nextjs.org/) (App Router, Server & Client Components), [React 19](https://react.dev/) |
| **Styling & Icons** | [TailwindCSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/) |
| **State & Localization** | [Zustand](https://github.com/pmndrs/zustand), Custom Centralized `LanguageContext` (Vietnamese & English) |
| **Background Queues** | [BullMQ](https://docs.bullmq.io/) + [Redis 7](https://redis.io/) (for asynchronous emails, webhooks, billing cron) |
| **Payment Gateway** | [PayOS](https://payos.vn/) (VietQR centralized automated payment reconciliation) |
| **AI & Vision OCR** | Google Gemini API (meter reading digit recognition, rental post generation) |
| **Realtime WebSockets** | NestJS WebSocket Gateway (Socket.io) |
| **Containerization** | Docker, Docker Compose (Alpine-based development and production stacks) |
| **API Documentation** | Swagger / OpenAPI 3.0 via `@nestjs/swagger` |

---

## 📋 System Requirements

Ensure the following tools are installed on your workstation:

- **Node.js**: `>= 20.x` (LTS recommended)
- **pnpm**: `>= 9.x` (`npm install -g pnpm`)
- **Docker & Docker Compose**: Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- **Git**

---

## 🚀 Step-by-Step Installation & Quickstart

### 1. Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/RioNG05/Dormio.git
cd Dormio

# Install all workspace dependencies (Root, Backend, and Frontend)
pnpm run install:all
```

*(Alternatively, install packages individually via `pnpm install`, `pnpm run install:be`, and `pnpm run install:fe`)*

---

### 2. Environment Configuration (.env)

Set up the environment configuration files in the root, backend, and frontend directories:

```bash
# 1. Backend environment
cp api/.env.example api/.env

# 2. Frontend environment
cp web/.env.example web/.env.development
```

#### Root Environment (`Dormio/.env`)
Used by `docker-compose.yml` to provision PostgreSQL, Redis, and pgAdmin:
```env
POSTGRES_USER=dormio
POSTGRES_PASSWORD=dormio123
POSTGRES_DB=dormio_db
POSTGRES_PORT=5432

REDIS_PASSWORD=redis123
REDIS_PORT=6379

PGADMIN_EMAIL=admin@gmail.com
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5050
```

#### Backend Environment (`Dormio/api/.env`)
```env
# ─── Frontend & Application ──────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development

# ─── Database & Cache ────────────────────────────────────────────────────────
DATABASE_URL="postgresql://dormio:dormio123@localhost:5432/dormio_db"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# ─── Authentication ──────────────────────────────────────────────────────────
JWT_SECRET=change_this_secret_before_production
JWT_EXPIRES_IN=7d

# ─── Storage (Cloudinary & S3) ────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ─── Platform & Business Rules ───────────────────────────────────────────────
PLATFORM_DEPOSIT_HOLD_DAYS=7

# ─── Payment Gateway (PayOS) ─────────────────────────────────────────────────
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

# ─── AI (Google Gemini) ──────────────────────────────────────────────────────
AI_API_KEY=
AI_BASE_URL=
AI_MODEL_IMAGE=gemini-3.5-flash-lite
AI_MODEL_TEXT=gemini-3.5-flash-lite

# ─── Google Maps ─────────────────────────────────────────────────────────────
GOOGLE_MAPS_API_KEY=
```

#### Frontend Environment (`Dormio/web/.env.development`)
```env
# Public backend API host & port
NEXT_PUBLIC_API_URL=http://localhost
NEXT_PUBLIC_API_PORT=3001

# Google Analytics Measurement ID
NEXT_PUBLIC_GA_ID=
```

---

### 3. Running in Development Environment

Dormio supports two development workflows depending on your preference and system setup:

#### ⚡ Option A: Hybrid Development (Recommended for Daily Dev)
> **Fastest hot-reload with minimal RAM footprint.** Runs only the database and caching infrastructure (PostgreSQL 16, Redis 7, pgAdmin 4) in lightweight Docker containers, while running NestJS and Next.js natively on your host machine.

1. **Start database and caching services in Docker:**
   ```bash
   pnpm run docker:db    # or: pnpm run docker:up
   ```

2. **Synchronize database schema and generate Prisma client:**
   ```bash
   pnpm run db:push      # Push schema models directly to PostgreSQL
   pnpm run db:generate  # Generate typed Prisma Client
   ```
   *(For migration-based workflow, use `pnpm run db:migrate` instead of `db:push`)*

3. **Seed comprehensive mock database:**
   Populates administrators, landlords, properties, rooms, tenants, contracts, invoices, meter readings, grievances, and staff shifts:
   ```bash
   pnpm run seed
   ```

4. **Launch development servers:**
   Run both Backend (Port 3001) and Frontend (Port 3000) concurrently with a single command:
   ```bash
   pnpm run dev
   ```
   *(Alternatively, run them in separate terminal sessions: `pnpm run dev:be` for NestJS in watch mode, and `pnpm run dev:fe` for Next.js App Router)*

---

#### 🐳 Option B: Full Docker Development Stack (All-in-Docker)
> **Zero host setup required.** Runs the entire application stack (PostgreSQL, Redis, pgAdmin, Backend NestJS, and Frontend Next.js) inside Docker containers with source code bind-mounts for real-time live reloading.

1. **Launch the entire development stack:**
   ```bash
   # Build & run in foreground (streams live container logs)
   pnpm run docker:dev     # or: docker compose up --build

   # Or run in background (detached mode)
   pnpm run docker:dev:d   # or: docker compose up -d --build
   ```

2. **Database synchronization inside Docker:**
   When running the Docker dev stack for the first time, synchronize schema and seed data via:
   ```bash
   # Push schema to the Docker PostgreSQL container
   pnpm run db:push

   # Seed mock data
   pnpm run seed
   ```

3. **Helpful Docker management commands:**
   ```bash
   pnpm run docker:logs     # View aggregate logs from all services
   pnpm run docker:logs:be  # Stream Backend logs only
   pnpm run docker:logs:fe  # Stream Frontend logs only
   pnpm run docker:ps       # View status of running containers
   pnpm run docker:down     # Gracefully stop all containers
   pnpm run docker:clean    # Stop and delete containers + volume data (Factory Reset)
   ```

---

## 🌐 Port Mappings & Service Endpoints

| Service | Access URL | Description / Notes |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Next.js 16 Web Application (Portals for Landlord, Tenant, Staff, Admin) |
| **Backend REST API** | [http://localhost:3001/api/v1](http://localhost:3001/api/v1) | NestJS REST API with URI versioning |
| **Swagger API Docs** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | Interactive Swagger OpenAPI documentation |
| **OpenAPI Specification** | [http://localhost:3001/api/docs-json](http://localhost:3001/api/docs-json) | Raw JSON OpenAPI contract |
| **Prisma Studio** | [http://localhost:5555](http://localhost:5555) | Web-based database browser (`pnpm run db:studio`) |
| **pgAdmin 4** | [http://localhost:5050](http://localhost:5050) | Credentials: `admin@gmail.com` / `admin123` |
| **PostgreSQL Database** | `localhost:5432` | User: `dormio`, Database: `dormio_db`, Password: `dormio123` |
| **Redis Cache / BullMQ** | `localhost:6379` | Password: `redis123` |

---

## 🛠 NPM / PNPM Script Reference

| Command | Description |
| :--- | :--- |
| **Development** | |
| `pnpm run dev` | Runs both NestJS Backend and Next.js Frontend concurrently with hot-reload |
| `pnpm run dev:be` | Runs NestJS Backend in watch mode on port 3001 |
| `pnpm run dev:fe` | Runs Next.js Frontend development server on port 3000 |
| **Database & Prisma** | |
| `pnpm run db:push` | Fast-sync Prisma schema directly to PostgreSQL (no migration files generated) |
| `pnpm run db:migrate` | Runs Prisma schema migrations for developmental incremental changes |
| `pnpm run db:generate` | Regenerates typed Prisma Client library after schema modifications |
| `pnpm run seed` | Seeds complete development mock dataset (41 tables, contracts, invoices, users) |
| `pnpm run seed:prod` | Safe idempotent seed for production (subscription tiers, admin accounts) |
| `pnpm run db:studio` | Launches web-based Prisma Studio GUI at `http://localhost:5555` |
| `pnpm run db:reset` | Drops database, executes migrations from scratch, and runs seeder |
| **Docker Development** | |
| `pnpm run docker:db` | Starts PostgreSQL, Redis, and pgAdmin containers in background |
| `pnpm run docker:up` | Starts local infrastructure services |
| `pnpm run docker:dev` | Builds and runs entire application stack in Docker with volume hot-reloading |
| `pnpm run docker:dev:d` | Runs entire Docker dev stack in detached background mode |
| `pnpm run docker:down` | Gracefully stops all local Docker containers |
| `pnpm run docker:logs` | Streams real-time Docker compose log output |
| `pnpm run docker:logs:be` | Streams real-time Backend container logs |
| `pnpm run docker:logs:fe` | Streams real-time Frontend container logs |
| `pnpm run docker:clean` | Stops containers and purges volumes (resets local database) |
| **Production Deployment (Low-RAM VPS Workflow)** | |
| `pnpm run deploy:be` | Builds production Backend image (`linux/amd64`) and exports `dormio-api.tar` |
| `pnpm run deploy:fe` | Builds production Frontend image (`linux/amd64`) and exports `dormio-web.tar` |
| `pnpm run deploy:all` | Builds both Backend & Frontend and exports both `.tar` archives |
| **Testing & Quality** | |
| `pnpm run test:be` | Executes all Jest unit tests in the backend |
| `pnpm run test:be:cov` | Runs backend unit tests and generates coverage report |
| `pnpm run lint` | Runs ESLint across both frontend and backend |
| `pnpm run format` | Runs Prettier code formatting on all TypeScript and TSX files |

---

## 📂 Project Directory Structure

```text
Dormio/
├── api/                       # NestJS v11 REST API Application
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL relational schema models
│   │   └── seed.ts                # Database seeder script
│   ├── src/
│   │   ├── common/                # Decorators, filters, guards, interceptors, PrismaModule
│   │   │   ├── enums/             # Business error code enum & domain enums
│   │   │   ├── exceptions/        # BusinessException hierarchy
│   │   │   ├── filters/           # Global HttpExceptionFilter
│   │   │   └── guards/            # JwtAuthGuard, RolesGuard, PropertyOwnershipGuard
│   │   ├── config/                # Environment configuration loader
│   │   ├── modules/               # 25 Specialized Feature Modules
│   │   │   ├── admin/             # Platform analytics, revenue, mass notices (UC-A-01 -> 06)
│   │   │   ├── ai/                # AI conversational assistant & report generation
│   │   │   ├── assets/            # Room fixtures and asset lifecycle
│   │   │   ├── attendance/        # Timekeeping, check-in/out, GPS distance verification
│   │   │   ├── auth/              # JWT authentication, registration, password reset
│   │   │   ├── billing-cron/      # Automated monthly invoice generation cron
│   │   │   ├── boarding-houses/   # Property CRUD & multi-property context (UC-L-01 -> 03)
│   │   │   ├── contracts/         # Tenancy contracts (Flow A Platform & Flow B Direct)
│   │   │   ├── deposits/          # Holding & security deposits (UC-L-20 -> 22)
│   │   │   ├── employees/         # Staff onboarding & property assignment (UC-L-19)
│   │   │   ├── expenses/          # Boarding house operational expense tracking
│   │   │   ├── grievances/        # Tenant complaints & resolution workflow (UC-T-07)
│   │   │   ├── invoices/          # Metered & flat utility calculation, invoices (UC-L-15)
│   │   │   ├── maps/              # Google Maps location services & geocoding
│   │   │   ├── messages/          # Real-time WebSocket chat (BHMS & BHRP)
│   │   │   ├── meter-readings/    # Gemini AI OCR for electricity & water meters (UC-T-03)
│   │   │   ├── notifications/     # In-app, push, and broadcast notifications
│   │   │   ├── payments/          # Centralized PayOS VietQR payments & webhook reconciliation
│   │   │   ├── posts/             # Public rental listing posts & quotas (UC-P-01)
│   │   │   ├── rooms/             # Bulk generation, pricing, status, services (UC-L-05 -> 10)
│   │   │   ├── schedules/         # Staff shift patterns and recurring calendar (UC-S-01)
│   │   │   ├── services/          # Catalog of utility and recurring services
│   │   │   ├── subscriptions/     # Landlord subscription tiers & posting quota billing
│   │   │   ├── upload/            # Cloudinary and AWS S3 upload handlers
│   │   │   └── users/             # User profile and CCCD identification (UC-PU-01)
│   │   ├── app.module.ts          # Root module wiring dependencies
│   │   └── main.ts                # Application bootstrap (CORS, Swagger, validation)
│   └── tsconfig.json
│
├── web/                      # Next.js 16 App Router (React 19, TailwindCSS v4)
│   ├── i8n/                       # Centralized localization dictionaries (vi.ts, en.ts)
│   │   ├── vi/                    # Vietnamese translations (errors, common, modules)
│   │   └── en/                    # English translations
│   ├── src/
│   │   ├── app/                   # App Router route tree
│   │   │   ├── (auth)/            # Login, registration, password recovery
│   │   │   ├── (dashboard)/       # Authenticated role portals
│   │   │   │   ├── admin/         # Platform administration & analytics
│   │   │   │   ├── landlord/      # Properties, rooms, contracts, invoices, staff
│   │   │   │   ├── staff/         # Shift schedule, timekeeping check-in/out
│   │   │   │   └── tenant/        # Invoices, meter readings, grievances, contracts
│   │   │   ├── (public)/          # Landing page, room search, post detail, booking
│   │   │   └── layout.tsx         # Root layout with Language & Auth Providers
│   │   ├── components/            # Reusable UI component library
│   │   ├── context/               # LanguageContext (i18n) and session context
│   │   ├── services/              # Type-safe HTTP API client services
│   │   ├── store/                 # Zustand stores (property context, active filters)
│   │   └── utils/                 # Business error resolver & formatting helpers
│   └── package.json
│
├── docs/                          # Technical Specifications & Architecture Docs
│   ├── technical_spec.md          # Master index file of use cases
│   └── spec/                      # Detailed modular specs (00-global to 07-auth)
├── docker-compose.yml             # Local Docker Compose setup (Postgres, Redis, pgAdmin)
├── package.json                   # Root workspace orchestration
└── README.md                      # Project documentation
```

---

## 🧪 Testing & Quality Assurance

Dormio enforces comprehensive automated testing across core financial and operational services:

```bash
# Run all backend unit tests
pnpm run test:be

# Run tests with code coverage report
pnpm run test:be:cov
```

Key test suites covering critical domain logic include:
- `payments.service.spec.ts` — PayOS webhook signature verification, idempotency, invoice status updates.
- `invoices.service.spec.ts` — Metered tier computation, late fee penalties, subtotal calculation.
- `contracts.service.spec.ts` — Deposit linking, tenancy date validations, early termination rules.
- `meter-readings.service.spec.ts` — Reading validations, MoM consumption variance checks.
- `attendance.service.spec.ts` — Geofence radius checks, shift window allowances.
- `http-exception.filter.spec.ts` — Standardized `BusinessErrorCode` formatting and error responses.

---

## 📐 Engineering Guidelines & Conventions

1. **English Codebase**: All source code (variables, functions, classes, interfaces, DTOs, enums, database columns), comments, log messages, commit messages, and documentation must be written in **English**. Vietnamese is strictly reserved for user-facing UI labels, client-visible toasts, and localized notification texts.
2. **Business Exceptions & Client i18n Mapping**:
   - Backend domain errors must throw a `BusinessException` with a typed code from `BusinessErrorCode`.
   - Frontend components resolve errors using `resolveErrorMessage(err, tErrors, fallbackMessage)` from `@/utils`, ensuring localized messages in both Vietnamese and English without fragile substring checking.
3. **Property Ownership Guard**: Every BHMS controller must inject and apply `PropertyOwnershipGuard` on routes that mutate or read property-scoped data (`X-Boarding-House-Id`).
4. **API Logging & Documentation**:
   - All backend controllers must initialize a `Logger` instance and log endpoint invocations.
   - All endpoints must include complete Swagger annotations (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`, `@ApiResponse`).

---

## 📄 License & Contributions

- **Ownership**: Developed and maintained by the **Dormio Development Team**.
- **Contributions**: Contributions, bug reports, and feature requests are welcome via GitHub Issues and Pull Requests. Please review the project specifications under `/docs` prior to submitting changes.