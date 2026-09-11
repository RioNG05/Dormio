# Dormio i18n Localization Progress & Protocol Handover

## 1. Project Overview & Working Rules
- **Stack**: Next.js 16 App Router, React 19, TailwindCSS v4, Custom LanguageContext (NO external next-intl package), TypeScript.
- **Translation Hook**: ALWAYS import `useTranslations` and `useLanguage` from `@/context/LanguageContext` (NEVER from `next-intl`).
- **Dictionaries**: `frontend/messages/vi.ts` and `frontend/messages/en.ts`.
- **Default Locale**: Vietnamese (`locale: "vi"`).

### 5 Core Constraints:
1. **Zero backend interference**: Do NOT alter API routes, service calls, query params, or backend connection logic.
2. **Zero UI layout / styling regression**: Keep 100% of existing TailwindCSS classes, inline styles, responsiveness, and components unchanged.
3. **Full bilingual coverage**: VN and EN both 100% supported; VN is default.
4. **100% Vietnamese text preservation**: Preserve exact original user-written Vietnamese strings and structure camelCase keys from them.
5. **Zero hardcoded Vietnamese strings**: All client-visible strings in JSX and UI messages must use `t("<section><Key>")`.

### Dictionary Organization Rules:
- 9 root sections: `common`, `nav`, `footer`, `auth`, `guest`, `landlord`, `tenant`, `employee`, `admin`.
- Key format: `<section><FeatureName><Element>` (camelCase).
- **Alphabetical sorting (A-Z)** within each section in both `vi.ts` and `en.ts`.
- **1-to-1 exact key parity** between `vi.ts` and `en.ts`.

### Interaction Protocol:
`User presents problem/topic -> AI proposes solution -> User approves (ok) -> AI implements`.

---

## 2. Current Progress

### Phân hệ Guest / Public (`frontend/src/app/(public)/`) — 100% COMPLETED (15/15 pages + Layout):
1. `layout.tsx` (Header, Nav, Command Palette `Ctrl+K`, Search)
2. `page.tsx` (Home Landing Page)
3. `pricing/page.tsx` (SaaS Pricing & Plan Subscribe)
4. `features/page.tsx` (Platform Features)
5. `contact/page.tsx` (Contact & Support)
6. `compare/page.tsx` (Plan Comparison Table)
7. `blog/page.tsx` (Blog List)
8. `blog/[slug]/page.tsx` (Blog Detail)
9. `rooms/page.tsx` (Rooms Search, Listings & Escrow Deposit Modal)
10. `rooms/[id]/page.tsx` (Room Detail & Real-time Cost Estimation)
11. `saved-posts/page.tsx` (Saved Rooms & Head-to-head Comparison Modal)
12. `messages/page.tsx` (Guest Chat & Deposit Negotiation)
13. `posts/create/page.tsx` (Rental Listing Creation & Package Quota Check)
14. `posts/analytics/page.tsx` (Listing Reach Analytics & Drilldown Modal)
15. `profile/page.tsx` (Multi-role Profile, AI eKYC & Security Password Reset)

- **Dictionary Status**: Exactly **2,798 keys** in `vi.ts` and `en.ts` with **0 mismatch**.

---

### Phân hệ Auth (`frontend/src/app/(auth)/`) — 100% COMPLETED (5/5 files):
1. `layout.tsx` (Auth Layout Split-Screen, Branding, Live Mockup Card, Testimonial)
2. `login/page.tsx` (Login with Phone/Email, Password, Error Handling, Demo Accounts)
3. `register/page.tsx` (Registration with Phone/Email, Full Name, Terms & Privacy Agreement)
4. `forgot-password/page.tsx` (Forgot Password OTP Request & Success Confirmation)
5. `policy/page.tsx` (Placeholder) & `register/landlord/page.tsx` (Redirect)

---

## 3. Phân Hệ Dashboard (`frontend/src/app/(dashboard)/`)

### A. Shared Dashboard Shell — 100% COMPLETED:
1. `layout.tsx` (Multi-role Sidebar for Landlord, Staff, Admin, Tenant; Property Switcher; User Profile Footer; Dynamic Document Titles)

### B. Phân Hệ Landlord Dashboard (Chỉ triển khai phạm vi UC-L-01 -> UC-L-11 đã có kết nối backend)

> **LƯU Ý ĐẶC BIỆT THEO YÊU CẦU DỰ ÁN**: Thành viên nhóm chỉ mới làm backend đến **UC-L-11** và đang code tiếp các UC sau trên nhánh riêng. Để tránh merge conflict, **tạm hoãn toàn bộ các trang thuộc UC-L-12 trở đi** (sẽ quay lại sau khi merge backend mới).

#### Các trang trong phạm vi UC-L-01 -> UC-L-11:
1. **Landlord Overview / Dashboard Home** (`frontend/src/app/(dashboard)/landlord/page.tsx`) — **100% COMPLETED** [UC-L-01]
2. **Rooms Management** (`frontend/src/app/(dashboard)/landlord/rooms/page.tsx`) — **100% COMPLETED** [UC-L-02, UC-L-03]
3. **Boarding House Setup 3-Step Wizard** (`frontend/src/app/(dashboard)/landlord/setup/page.tsx`) — **100% COMPLETED** [UC-L-01 Wizard]
4. **Room Detail & Meter Readings** (`frontend/src/app/(dashboard)/landlord/rooms/[id]/page.tsx`) — **100% COMPLETED** [UC-L-05, UC-L-09]
5. **Contracts Management** (`frontend/src/app/(dashboard)/landlord/contracts/page.tsx`) — **100% COMPLETED** [UC-L-04 Flow A & B]
6. **Invoices & Billing History** (`frontend/src/app/(dashboard)/landlord/invoices/page.tsx`) — **100% COMPLETED** [UC-L-06, UC-L-07]
7. **Manual Deposits** (`frontend/src/app/(dashboard)/landlord/deposits/page.tsx`) — **100% COMPLETED** [UC-L-10]
8. **Real-time Messages / Chat** (`frontend/src/app/(dashboard)/landlord/messages/page.tsx`) — **100% COMPLETED** [UC-L-11]
9. **Customers & External Tenant Link** (`frontend/src/app/(dashboard)/landlord/customers/page.tsx`) — **100% COMPLETED** [Customer list & external tenant link]
10. **Customer Detail & ID Cards** (`frontend/src/app/(dashboard)/landlord/customers/[id]/page.tsx`) — **100% COMPLETED** [Customer profile, ID documents, stay history & edit modal]
- **Trạng thái phân hệ Landlord**: **100% HOÀN THÀNH TOÀN BỘ 10 TRANG THEO YÊU CẦU** (Tổng cộng từ điển đạt **3.413 keys**, parity 1:1, 0 lỗi TypeScript, 0 duplicate keys).

#### Các trang tạm hoãn (Thuộc UC-L-12 trở đi, tránh merge conflict):
- `listings/page.tsx` [UC-L-12 — AI Rental Post Suggestions]
- `reminders/page.tsx` [UC-L-13 — Broadcast Announcements]
- `debts/page.tsx` [UC-L-16 — Debt Tracking]
- `expenses/page.tsx` [UC-L-17 — Expense Management]
- `services/page.tsx` [UC-L-18 — Custom Service Management]
- `workforce/page.tsx` [UC-L-19, UC-L-20 — Staff Onboarding & Management]
- `reports/page.tsx` [UC-L-24 — Advanced Multi-Property Reports]

---

### C. Phân Hệ Tenant Dashboard (`frontend/src/app/(dashboard)/tenant/`) — ĐANG TRIỂN KHAI:

1. **Tenant Dashboard Overview / Home** (`frontend/src/app/(dashboard)/tenant/page.tsx`) — **100% COMPLETED**
   - Đa ngôn ngữ hóa toàn bộ phòng trọ đang thuê, thời hạn hợp đồng, thanh tiến độ thuê.
   - Bảng giá dịch vụ cố định/theo chỉ số công tơ, danh sách tiện nghi phòng.
   - Bảng thông báo từ BQL tòa nhà (phân trang 4 tin/trang, nhãn ngày tháng, modal xem chi tiết tin).
   - Modal Hợp đồng thuê phòng điện tử (con dấu xác thực kỹ thuật số, bên A/bên B, điều khoản, link tải đính kèm).
   - Xử lý trạng thái rỗng (chưa có hợp đồng phòng, chưa có dịch vụ, chưa có thông báo).
   - Banner cảnh báo hóa đơn chưa thanh toán với đường dẫn thanh toán nhanh.
   - Parity từ điển đạt **3.510 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

2. **Invoices & VietQR Payment** (`frontend/src/app/(dashboard)/tenant/invoices/page.tsx`) — **100% COMPLETED**
   - Bản địa hóa toàn diện biểu đồ phân tích chi phí tiêu thụ (Chi phí vs Sản lượng điện kWh & nước m³).
   - Thanh điều khiển lọc trạng thái (Tất cả, Chưa thanh toán, Đã thanh toán), tìm kiếm theo kỳ/mã hóa đơn.
   - Hỗ trợ đầy đủ 2 chế độ hiển thị song song: Dạng Lưới (Grid) và Dạng Bảng (Table).
   - Modal thanh toán VietQR động (mã QR, thông tin ngân hàng kèm nút sao chép 1 chạm, hướng dẫn nội dung chuyển khoản, mô phỏng xác thực).
   - Modal chốt chỉ số điện nước & quét nhận diện ảnh OCR.
   - Modal xem chi tiết ảnh công tơ điện nước thực tế.
   - Phân trang chuẩn hóa theo Quy tắc số 9 (`Showing X-Y of Z invoices` / `Hiển thị X-Y trên Z hóa đơn`).
   - Parity từ điển đạt **3.541 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

3. **Utility Meter Readings & OCR** (`frontend/src/app/(dashboard)/tenant/meter-readings/page.tsx`) — **100% COMPLETED**
   - Đa ngôn ngữ hóa toàn bộ Header Banner, chu kỳ thanh toán, hạn chốt chỉ số (`monthlyClosingDate`).
   - Thanh tiến độ nhập chỉ số kỳ này (`allMetersReady`, `metersRemainingCount`), huy hiệu trạng thái hoàn thành/chờ nhập.
   - Thẻ dịch vụ đồng hồ đo (Điện, Nước, Dịch vụ đo đếm): đơn giá, kỳ trước, trạng thái đã nhập, chụp/tải ảnh công tơ (`takeMeterPhoto`, `retakePhoto`), quét OCR tự động (`ocrScanning`), form chỉnh sửa thủ công, lượng tiêu thụ và tạm tính dịch vụ.
   - Thanh tác vụ cố định với cảnh báo khóa dữ liệu (`confirmWarningNotice`).
   - Modal tóm tắt xác nhận chỉ số bảng điện tử (Dịch vụ, Chỉ số cũ, Chỉ số mới, Tiêu thụ) và trạng thái lập hóa đơn.
   - Modal thông báo khởi tạo hóa đơn thành công kèm chi tiết khoản thu và các nút điều hướng (Xem danh sách, Thanh toán VietQR).
   - Parity từ điển đạt **3.588 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

4. **Tenant Grievances / Complaints** (`frontend/src/app/(dashboard)/tenant/complaints/page.tsx`) — **100% COMPLETED**
   - Bản địa hóa toàn bộ Header Banner bảo vệ quyền lợi Escrow (`tenantEscrowProtectedBadge`).
   - Bộ lọc trạng thái con nhộng (Tất cả, Chưa phản hồi, Đã phản hồi) kèm số lượng khiếu nại thực tế.
   - Hỗ trợ đầy đủ 2 chế độ hiển thị song song theo Quy tắc số 9: Dạng Lưới (Grid view mặc định) và Dạng Bảng (Table view).
   - Thẻ khiếu nại (mã số, huy hiệu BQT Dormio, mức độ ưu tiên, trích đoạn phản hồi từ BQT, ngày gửi định dạng song ngữ, trạng thái).
   - Bảng danh sách khiếu nại chi tiết (mã, tiêu đề, mức độ, ngày gửi, trạng thái, nút xem chi tiết).
   - Thanh phân trang chuẩn hóa (`Hiển thị X-Y trên Z khiếu nại` / `Showing X-Y of Z complaints`).
   - Modal 1: Gửi khiếu nại chính thức tới Ban Quản Trị (mức độ nghiêm trọng, tiêu đề, mô tả chi tiết sự việc, tải tối đa 5 ảnh bằng chứng, các thông báo lỗi kiểm thực dữ liệu).
   - Modal 2: Chi tiết hồ sơ khiếu nại & phản hồi thanh tra độc lập từ BQT Dormio Escrow (ảnh bằng chứng đính kèm, thông tin phòng trọ).
   - Modal 3: Xác nhận thoát form khi có thay đổi chưa lưu (Pop-up Modal theo Quy tắc số 10: "Xác nhận đóng form", "Tiếp tục chỉnh sửa", "Hủy thay đổi & Đóng").
   - Modal 4: Phóng to xem ảnh bằng chứng hiện trường.
   - Parity từ điển đạt **3.634 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

5. **Real-time Messages / Chat** (`frontend/src/app/(dashboard)/tenant/messages/page.tsx`) — **100% COMPLETED**
   - Đa ngôn ngữ hóa giao diện nhắn tin thời gian thực WebSocket với Chủ trọ & Ban quản lý.
   - Cột hội thoại bên trái: số lượng kênh/liên hệ (`tenantChannelsCount`), ô tìm kiếm, các tab lọc (Tất cả, Chủ nhà, Nhân viên, Chưa đọc), huy hiệu vai trò (Chủ Nhà Trọ, Quản Lý / Nhân Viên, Cư Dân), trạng thái rỗng và nút bắt đầu hội thoại với chủ trọ.
   - Khung chat chính: thanh tiêu đề trò chuyện (nút quay lại di động, trạng thái trực tuyến `onlineNow`, gọi điện, mở ngăn thông tin), danh sách tin nhắn với định dạng thời gian song ngữ tự động (`en-US` / `vi-VN`).
   - Thẻ lối tắt hóa đơn tương tác nhúng trực tiếp trong bóng tin nhắn ("Hóa Đơn Tiền Phòng Kỳ Này", "Chờ thanh toán", "Xem & Thanh toán").
   - Thanh gợi ý trả lời nhanh (Quick Prompt Pills) đa ngôn ngữ (xác nhận đóng tiền, kiểm tra thiết bị, lịch thu gom rác, cảm ơn BQL).
   - Thanh soạn thảo tin nhắn: đính kèm ảnh/tệp tin, nhãn kích thước dung lượng, trạng thái đang gửi (`isSending`), xem trước tệp chờ gửi.
   - Ngăn thông tin phòng & hợp đồng bên phải (Right Drawer): thẻ tổng quan phòng thuê, giá thuê theo tháng, thẻ hóa đơn đến hạn kỳ này kèm đường dẫn thanh toán, danh mục hình ảnh và tài liệu đã chia sẻ.
   - Modal xem trước ảnh đính kèm (Lightbox Preview).
   - Parity từ điển đạt **3.662 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

6. **Tenant Room Detail** (`frontend/src/app/(dashboard)/tenant/rooms/[id]/page.tsx`) — **100% COMPLETED**
   - Đa ngôn ngữ hóa toàn bộ banner chi tiết phòng trọ, huy hiệu hợp đồng hiệu lực (`tenantActiveTenancyBadge`).
   - Khối thông số kỹ thuật phòng thuê (`tenantRoomSpecifications`): diện tích sàn (`tenantFloorArea`), tầng (`tenantFloorLevel`), số người ở tối đa (`tenantMaxOccupants`).
   - Khối tài chính tiền phòng: giá thuê hàng tháng (`tenantMonthlyRent`), hạn đóng tiền phòng (`tenantRentDueOnDay`), tiền cọc lưu giữ (`tenantDeposit`).
   - Khối dịch vụ tiện ích đã đăng ký (`tenantRegisteredServices`): đơn giá, loại dịch vụ (theo đồng hồ / cố định).
   - Thẻ chủ nhà / quản lý tòa nhà: thông tin liên hệ, nút gọi điện, nút mở hội thoại nhắn tin nhanh qua hệ thống.
   - Các nút tác vụ nhanh: xem danh sách hóa đơn, gửi phản ánh / yêu cầu sửa chữa.
   - Xử lý trạng thái rỗng và không tìm thấy phòng với thông báo chi tiết và nút quay lại tổng quan.
   - Parity từ điển đạt **3.680 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

7. **Tenant Profile** (`frontend/src/app/(dashboard)/tenant/profile/page.tsx`) — **100% COMPLETED**
   - Bản địa hóa thông điệp chuyển hướng tự động sang Trang Hồ Sơ Cá Nhân Dùng Chung (`tenantRedirectingToProfile`).
   - Parity từ điển đạt **3.681 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

8. **Bills Redirect** (`frontend/src/app/(dashboard)/tenant/bills/page.tsx`) — **100% COMPLETED** (Redirect sạch `/tenant/invoices`)

> **KẾT QUẢ PHÂN HỆ TENANT DASHBOARD**: **100% HOÀN THÀNH TOÀN BỘ 8/8 TRANG**. Toàn bộ giao diện cư dân đã hỗ trợ song ngữ Anh - Việt hoàn chỉnh, chuẩn hóa từ điển, 0 lỗi TypeScript, giữ nguyên 100% kết nối backend và logic thanh toán VietQR, OCR chốt chỉ số, Escrow khiếu nại.

---

### D. Phân Hệ Tiếp Theo: Staff Dashboard (`frontend/src/app/(dashboard)/staff/`) hoặc Admin Dashboard (`frontend/src/app/(dashboard)/admin/`)



