# 🏠 Dormio — Nền Tảng Quản Lý & Cho Thuê Nhà Trọ Thông Minh

<p align="center">
  <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80" alt="Dormio Banner" width="100%" style="border-radius: 12px; max-height: 360px; object-fit: cover;" />
</p>

<p align="center">
  <strong>Giải pháp SaaS toàn diện cho mô hình quản lý phòng trọ (BHMS) và sàn kết nối người thuê trọ (BHRP) tại Việt Nam.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Next.js-v16.2-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Prisma-v7-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 📌 Mục lục

- [Giới thiệu tổng quan](#-giới-thiệu-tổng-quan)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt & Khởi chạy từng bước](#-hướng-dẫn-cài-đặt--khởi-chạy-từng-bước)
  - [1. Clone dự án và cài đặt dependencies](#1-clone-dự-án-và-cài-đặt-dependencies)
  - [2. Cấu hình biến môi trường (.env)](#2-cấu-hình-biến-môi-trường-env)
  - [3. Khởi động cơ sở dữ liệu trên Docker](#3-khởi-động-cơ-sở-dữ-liệu-trên-docker)
  - [4. Đồng bộ Schema Prisma](#4-đồng-bộ-schema-prisma)
  - [5. Nạp dữ liệu mẫu (Database Seeding)](#5-nạp-dữ-liệu-mẫu-database-seeding)
  - [6. Khởi chạy ứng dụng (Backend & Frontend)](#6-khởi-chạy-ứng-dụng-backend--frontend)
- [Tài khoản thử nghiệm mặc định](#-tài-khoản-thử-nghiệm-mặc-định)
- [Danh mục cổng & Đường dẫn dịch vụ](#-danh-mục-cổng--đường-dẫn-dịch-vụ)
- [Bảng lệnh tắt (NPM / PNPM Scripts)](#-bảng-lệnh-tắt-npm--pnpm-scripts)
- [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
- [Kiểm thử & Đảm bảo chất lượng](#-kiểm-thử--đảm-bảo-chất-lượng)

---

## 🌟 Giới thiệu tổng quan

**Dormio** là nền tảng quản lý nhà trọ và căn hộ dịch vụ bao gồm hai phân hệ chính:

1. **BHMS (Boarding House Management System)**:
   - Dành cho **Chủ trọ (Landlord)**: Quản lý nhiều cơ sở nhà trọ, danh sách phòng, hợp đồng điện tử, chu kỳ thanh toán, bảng giá dịch vụ, nhân sự/lịch làm việc, khiếu nại và báo cáo doanh thu tài chính.
   - Dành cho **Người thuê (Tenant)**: Đọc chỉ số điện nước tự động qua ảnh chụp (AI OCR), theo dõi biểu đồ tiêu thụ & phân tích chi phí MoM, thanh toán trực tiếp qua mã VietQR khóa số tiền, gửi phản ánh/khiếu nại, và tra cứu biên lai điện tử.
   - Dành cho **Nhân viên (Staff / Employee)**: Xem lịch phân ca, ca trực, và chấm công tại điểm làm việc.
2. **BHRP (Boarding House Rental Platform)**:
   - Cổng thông tin tìm kiếm phòng trọ công khai, xem tiện ích phòng, đăng tin cho thuê trọ, đặt cọc giữ chỗ trực tuyến, và nhắn tin trao đổi thời gian thực.

---

## 🛠 Công nghệ sử dụng

| Tầng | Công nghệ / Thư viện |
| :--- | :--- |
| **Backend** | [NestJS v11](https://nestjs.com/), [TypeScript 5](https://www.typescriptlang.org/), [Swagger / OpenAPI](https://swagger.io/), [JWT & Passport](http://www.passportjs.org/) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/), [Prisma ORM v7](https://www.prisma.io/) với `@prisma/adapter-pg` |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TailwindCSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [Recharts](https://recharts.org/) |
| **Hàng đợi & Tác vụ nền** | [BullMQ](https://docs.bullmq.io/) + [Redis 7](https://redis.io/) |
| **Containerization** | [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) |
| **Giao tiếp Realtime** | WebSocket (NestJS WebSockets Gateway / Socket.io) |

---

## 📋 Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo máy của bạn đã cài đặt các công cụ sau:
- **Node.js**: Phiên bản `>= 20.x` (khuyến nghị Node LTS)
- **pnpm**: Phiên bản `>= 9.x` (`npm install -g pnpm`)
- **Docker** và **Docker Compose** (ví dụ Docker Desktop trên Windows/macOS hoặc Docker Engine trên Linux)
- **Git**

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy từng bước

### 1. Clone dự án và cài đặt dependencies

Mở Terminal và thực thi lệnh:

```bash
# Clone repository
git clone https://github.com/RioNG05/Dormio.git
cd Dormio

# Cài đặt toàn bộ dependencies cho Root, Backend và Frontend
pnpm run install:all
```

*(Hoặc cài đặt độc lập từng phần bằng `pnpm install`, `pnpm run install:be`, `pnpm run install:fe`)*

---

### 2. Cấu hình biến môi trường (.env)

Tạo file `.env` ở thư mục gốc (Root) và thư mục `backend/.env` từ file mẫu `.env.example`:

#### Tại thư mục gốc `Dormio/.env`:
```env
POSTGRES_USER=dormio
POSTGRES_PASSWORD=dormio123
POSTGRES_DB=dormio_db
POSTGRES_PORT=5432

REDIS_PASSWORD=redis123
REDIS_PORT=6379

PGADMIN_EMAIL=admin@dormio.vn
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5050
```

#### Tại thư mục `backend/.env`:
```env
PORT=8080
NODE_ENV=development

DATABASE_URL="postgresql://dormio:dormio123@localhost:5432/dormio_db?schema=public"

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

JWT_SECRET=dormio_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

---

### 3. Khởi động cơ sở dữ liệu trên Docker

Khởi chạy các container PostgreSQL 16, Redis 7 và PgAdmin 4 bằng Docker Compose:

```bash
# Khởi động các container dưới nền (-d)
pnpm run docker:up
```

Kiểm tra trạng thái hoạt động của các container:
```bash
pnpm run docker:ps
```

> **Gợi ý kiểm tra logs khi cần thiết**:
> - Xem log PostgreSQL: `pnpm run docker:logs:db`
> - Xem log Redis: `pnpm run docker:logs:redis`

---

### 4. Đồng bộ Schema Prisma

Đẩy cấu trúc bảng từ `schema.prisma` vào database PostgreSQL và sinh Prisma Client:

```bash
# Đẩy schema lên database
pnpm run db:push

# Tạo Prisma Client type-safe
pnpm run db:generate
```

---

### 5. Nạp dữ liệu mẫu (Database Seeding)

Dormio cung cấp bộ dữ liệu mẫu phong phú (tài khoản Admin/Chủ trọ, Khách thuê, Nhân viên, Nhà trọ, Phòng, Chỉ số công tơ, Hóa đơn chưa thanh toán, Khiếu nại, Ca làm việc):

```bash
# Chạy script seeding dữ liệu
pnpm run seed
```

---

### 6. Khởi chạy ứng dụng (Backend & Frontend)

Bạn có thể chạy đồng thời cả Backend và Frontend chỉ với **1 câu lệnh duy nhất**:

```bash
pnpm run dev
```

Hoặc chạy riêng biệt ở 2 cửa sổ terminal:

```bash
# Terminal 1 — Khởi chạy NestJS Backend (Cổng 8080)
pnpm run dev:be

# Terminal 2 — Khởi chạy Next.js Frontend (Cổng 3000)
pnpm run dev:fe
```

---

## 👥 Tài khoản thử nghiệm mặc định

Dữ liệu seed sẵn sàng với các vai trò người dùng sau:

| Vai trò | Số điện thoại | Mật khẩu | Mô tả / Mục đích kiểm thử |
| :--- | :--- | :--- | :--- |
| **Admin / Master Landlord** | `0344265925` | `88888888` | Quản trị viên hệ thống & Chủ chuỗi nhà trọ Dormio |
| **Khách thuê 1 (Tenant)** | `0912345678` | `Secret@123` | Trần Thị Thuỳ Dung — Có hóa đơn tháng cần thanh toán & chỉ số điện nước |
| **Khách thuê 2 (Tenant)** | `0987654321` | `Secret@123` | Lê Hoàng Nam — Khách thuê phòng trọ |
| **Nhân viên (Staff / Employee)** | `0901122334` | `Secret@123` | Phạm Văn Bảo — Nhân viên kỹ thuật & vận hành |
| **Chủ trọ 2 (Landlord)** | `0933445566` | `Secret@123` | Võ Minh Trí — Chủ trọ độc lập (kiểm thử đa chủ trọ) |

---

## 🌐 Danh mục cổng & Đường dẫn dịch vụ

Sau khi khởi chạy, bạn có thể truy cập các dịch vụ qua các đường dẫn sau:

| Dịch vụ | Đường dẫn (URL) | Ghi chú |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Giao diện người dùng Next.js 16 |
| **Backend REST API** | [http://localhost:8080/api/v1](http://localhost:8080/api/v1) | NestJS REST API |
| **Swagger API Docs** | [http://localhost:8080/api/docs](http://localhost:8080/api/docs) | Tài liệu API tương tác trực tiếp |
| **Prisma Studio** | [http://localhost:5555](http://localhost:5555) | Giao diện duyệt và sửa DB trực quan (`pnpm run db:studio`) |
| **PgAdmin 4** | [http://localhost:5050](http://localhost:5050) | Đăng nhập: `admin@dormio.vn` / `admin123` |
| **PostgreSQL Database** | `localhost:5432` | User: `dormio`, DB: `dormio_db`, Pass: `dormio123` |
| **Redis Cache / BullMQ** | `localhost:6379` | Password: `redis123` |

---

## ⌨️ Bảng lệnh tắt (NPM / PNPM Scripts)

Toàn bộ các tác vụ vận hành có thể gọi nhanh từ thư mục gốc:

### Cài đặt & Khởi chạy
- `pnpm run install:all` : Cài đặt node_modules cho Root, Backend và Frontend.
- `pnpm run dev` : Chạy đồng thời dev server Backend và Frontend.
- `pnpm run dev:be` : Chạy riêng NestJS backend với chế độ watch.
- `pnpm run dev:fe` : Chạy riêng Next.js frontend.

### Cơ sở dữ liệu & Prisma
- `pnpm run db:push` : Đồng bộ schema Prisma trực tiếp vào cơ sở dữ liệu PostgreSQL.
- `pnpm run db:generate` : Sinh Prisma Client mới nhất theo schema.
- `pnpm run db:migrate` : Tạo và chạy Prisma migration trong môi trường dev.
- `pnpm run seed` : Nạp toàn bộ dữ liệu mẫu (mock users, rooms, contracts, invoices).
- `pnpm run db:studio` : Mở giao diện Prisma Studio trên trình duyệt.
- `pnpm run db:reset` : Xóa sạch và tạo mới toàn bộ cơ sở dữ liệu.

### Docker Compose
- `pnpm run docker:up` : Bật các container Postgres, Redis, PgAdmin dưới nền.
- `pnpm run docker:down` : Dừng các container Docker.
- `pnpm run docker:restart` : Khởi động lại các container.
- `pnpm run docker:logs` : Xem live logs của tất cả các container.
- `pnpm run docker:clean` : Dừng và xóa toàn bộ volumes dữ liệu.

### Kiểm thử & Build
- `pnpm run test` : Chạy toàn bộ Unit Tests của Backend (Jest).
- `pnpm run build` : Biên dịch production cho cả Backend và Frontend.
- `pnpm run lint` : Kiểm tra cú pháp và định dạng mã nguồn (ESLint).

---

## 📂 Cấu trúc thư mục dự án

```text
Dormio/
├── backend/                  # NestJS v11 Application
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma Schema (PostgreSQL Models)
│   │   └── seed.ts           # Database Seeder script
│   ├── src/
│   │   ├── common/           # Decorators, Filters, Guards (JWT/RBAC), PrismaModule
│   │   ├── config/           # Typed configuration loader
│   │   ├── modules/
│   │   │   ├── auth/         # Xác thực, Đăng nhập, Đổi mật khẩu
│   │   │   ├── billing-cron/ # Cron tự động quét và tính hóa đơn hàng tháng
│   │   │   ├── contracts/    # Hợp đồng thuê phòng
│   │   │   ├── grievances/   # Tiếp nhận và xử lý khiếu nại (UC-T-07)
│   │   │   ├── invoices/     # Quản lý hóa đơn & lịch sử thanh toán (UC-T-05, UC-T-08)
│   │   │   ├── meter-readings/# Nhập chỉ số đồng hồ điện nước qua AI OCR (UC-T-03)
│   │   │   ├── notifications/# Hệ thống thông báo đa kênh
│   │   │   └── payments/     # Quyết toán VietQR trực tiếp & Webhook (UC-T-04, UC-L-06)
│   │   ├── app.module.ts     # Root NestJS Module
│   │   └── main.ts           # Entry point Backend
│   └── tsconfig.json
│
├── frontend/                 # Next.js 16 App Router (React 19, Tailwind v4)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # /login, /register, /forgot-password
│   │   │   ├── (dashboard)/
│   │   │   │   ├── landlord/ # Giao diện dành cho Chủ trọ
│   │   │   │   └── tenant/   # Giao diện dành cho Khách thuê (/invoices, /meter-readings, /complaints)
│   │   │   ├── (public)/     # Trang chủ, danh sách phòng trọ, tin đăng cho thuê
│   │   │   └── layout.tsx    # Root layout & Navigation
│   │   ├── components/       # UI Components tái sử dụng
│   │   └── services/         # Client API Services (Axios/Fetch Wrapper)
│   └── package.json
│
├── docs/                     # Đặc tả kỹ thuật & Hướng dẫn Use Cases
│   └── spec/                 # 00-global-conventions -> 07-auth_roles
├── docker-compose.yml        # Docker compose config (Postgres 16, Redis 7, PgAdmin)
├── package.json              # Root workspace management
└── README.md
```

---

## 🧪 Kiểm thử & Đảm bảo chất lượng

Dự án áp dụng kiểm thử đơn vị (Unit Test) cho tất cả các service nghiệp vụ và luồng thanh toán / tính toán hóa đơn:

```bash
# Chạy toàn bộ test suites của Backend
pnpm run test:be
```

Kết quả kiểm thử mẫu:
```text
PASS src/app.controller.spec.ts
PASS src/modules/payments/payments.service.spec.ts
PASS src/modules/meter-readings/meter-readings.service.spec.ts
PASS src/modules/notifications/notifications.service.spec.ts
PASS src/modules/contracts/contracts.service.spec.ts
PASS src/modules/invoices/invoices.service.spec.ts
PASS src/modules/billing-cron/billing-cron.service.spec.ts
PASS src/modules/grievances/grievances.service.spec.ts

Test Suites: 8 passed, 8 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        9.483 s
```

---

## 📄 Bản quyền & Đóng góp

- Dự án được phát triển và sở hữu bởi **Dormio Development Team**.
- Mọi thắc mắc hoặc yêu cầu đóng góp tính năng, vui lòng tạo Issue hoặc gửi Pull Request.