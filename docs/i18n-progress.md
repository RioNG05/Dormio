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

### B. Phân Hệ Landlord Dashboard (Mở rộng phạm vi UC-L-01 -> UC-L-17 theo tiến độ Backend mới nhất):

> **CẬP NHẬT TIẾN ĐỘ**: Backend đã hoàn thiện và merge thành công đến **UC-L-17**. Tiến hành thiết lập đa ngôn ngữ toàn diện cho các trang từ UC-L-12 đến UC-L-17.

#### Các trang đã hoàn thành (UC-L-01 -> UC-L-12):
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
11. **Rental Listings & BHRP Quota** (`frontend/src/app/(dashboard)/landlord/listings/page.tsx`) — **100% COMPLETED** [UC-L-12]
    - Bản địa hóa toàn bộ giao diện quản lý tin đăng sàn phòng trọ trực tuyến BHRP.
    - Hero banner: thông tin gói thuê (`quotaLandlord`, `quotaBroker`), hạn mức reset 00:00 hàng ngày, số tin miễn phí hôm nay, lượt trả phí tích lũy, tổng tin đã đăng.
    - Bộ lọc trạng thái (Đang hiển thị, Bản nháp, Tạm ẩn), ô tìm kiếm tin đăng.
    - Hỗ trợ song song 2 chế độ hiển thị: Lưới (Grid view mặc định) và Bảng (Table view) theo Quy tắc số 9.
    - Thao tác chuyển đổi trạng thái tin đăng (Tạm ẩn tin / Đăng lại) kèm thông báo toast đa ngôn ngữ.
    - Phân trang chuẩn hóa theo Quy tắc số 9 (Nhập số/trang, window jumping 5 trang).
    - Parity từ điển đạt **3.763 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).
12. **Broadcast Announcements & Staff Tasks** (`frontend/src/app/(dashboard)/landlord/reminders/page.tsx`) — **100% COMPLETED** [UC-L-13]
    - Đa ngôn ngữ hóa toàn diện phân hệ quản lý thông báo cư dân và công việc vận hành nội bộ.
    - Hero banner: tiêu đề tòa nhà, địa chỉ, nút xem bản đồ Google Maps, phụ đề giới thiệu.
    - 4 Thẻ thống kê thời gian thực: Công việc chờ xử lý (`pendingTasks`), Mức độ khẩn cấp (`highPriority`), Tổng thông báo phát sóng (`statTotalNotifs`), Cư dân tiếp cận (`statReachedTenants`).
    - Thanh điều hướng phân đoạn (Segmented Navigation): Chuyển tab Nhắc việc vận hành vs Thông báo cư dân kèm số lượng thời gian thực.
    - Nút tác vụ chính: "Giao việc nhân viên" / "Phát thông báo mới (UC-L-13)".
    - Bộ tìm kiếm và lọc danh mục, trạng thái, mức độ ưu tiên song ngữ.
    - Hỗ trợ đầy đủ 2 chế độ hiển thị song song theo Quy tắc số 9: Dạng Lưới (Grid view mặc định) và Dạng Bảng (Table view).
    - Tab Nhắc việc vận hành: thẻ công việc (phân loại, phòng, nhân viên phụ trách, hạn hoàn thành, nút đổi trạng thái hoàn thành, xóa việc).
    - Tab Thông báo cư dân (Backend thật UC-L-13): thanh tiến độ tỷ lệ đã đọc theo %, đối tượng tiếp cận, kênh phát sóng (Hệ thống, Zalo OA, SMS), nút xem chi tiết và xóa thông báo.
    - Chuẩn hóa phân trang theo Quy tắc số 9 (Nhập số/trang, window jumping 5 trang).
    - Modal 1: Giao việc cho nhân viên tòa nhà (tiêu đề, nhân viên, phòng, danh mục, mức ưu tiên, hạn hoàn thành, ghi chú chi tiết).
    - Modal 2: Soạn & Phát sóng thông báo khách thuê (chọn mẫu nhanh, tiêu đề, phạm vi tiếp cận, kênh gửi, danh mục, nội dung).
    - Modal 3: Chi tiết thông báo phát sóng (thời gian gửi, kênh, số cư dân tiếp cận, xóa, đóng).
    - Modal 4: Xác nhận xóa thông báo.
    - Modal 5 (Quy tắc số 10): Hộp thoại Pop-up xác nhận thoát khi có dữ liệu chưa lưu ("Xác nhận đóng form", "Tiếp tục chỉnh sửa", "Hủy thay đổi & Đóng").
    - Parity từ điển đạt **3.823 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

13. **Deposit Management & Conversion** (`frontend/src/app/(dashboard)/landlord/deposits/page.tsx`) — **100% COMPLETED** [UC-L-10 & UC-L-14]
    - Bản địa hóa toàn diện phân hệ quản lý tiền cọc giữ chỗ và cọc hợp đồng bảo chứng thuê phòng.
    - Hero banner: tiêu đề tòa nhà (`landlordDepositsLoadingBuilding`), địa chỉ, liên kết Google Maps, phụ đề nghiệp vụ, bảo chứng Dormio Escrow.
    - 4 Thẻ thống kê tài chính: Tiền cọc đang giữ (`statHeld`), Tiền cọc đã hoàn (`statRefunded`), Tiền cọc đã khấu trừ (`statDeducted`), Số cọc đã nâng cấp hợp đồng (`statUpgraded`).
    - Phân đoạn loại cọc (Segment Filter): Cọc Giữ Chỗ Xem Phòng (`hold`) vs Cọc Hợp Đồng Thuê (`contract`) kèm số lượng đếm thời gian thực.
    - Bộ lọc trạng thái (Tất cả, Đang giữ, Đã hoàn, Đã khấu trừ) và thanh tìm kiếm đa năng.
    - Hỗ trợ đầy đủ 2 chế độ hiển thị song song theo Quy tắc số 9: Dạng Lưới (Grid view mặc định) và Dạng Bảng (Table view).
    - Thẻ phiếu cọc: mã cọc, số tiền định dạng song ngữ, loại cọc, phòng, ngày cọc, hạn chốt HĐ, trạng thái, các nút tác vụ (Chi tiết, Nâng cọc HĐ, Hoàn/Khấu trừ).
    - Chuẩn hóa phân trang theo Quy tắc số 9 (Nhập số/trang, window jumping 5 trang).
    - Modal 1: Lập phiếu thu cọc giữ chỗ mới (chọn phòng khả dụng, loại cọc, họ tên khách, SĐT, số tiền cọc, hạn giữ chỗ, phương thức thanh toán tiền mặt/VietQR, ghi chú).
    - Modal 2: Chi tiết khoản đặt cọc (mã biên lai, tiền cọc ban đầu, tiền cọc hiện giữ, số tiền hoàn trả/khấu trừ, lịch sử nâng cấp, thông tin khách thuê).
    - Modal 3: Xử lý Hoàn cọc & Khấu trừ (tùy chọn hoàn 100%, trừ 50%, khấu trừ 100% mất cọc, số tiền khấu trừ tùy chỉnh, lý do vi phạm).
    - Modal 4: Nâng cấp cọc giữ chỗ lên cọc hợp đồng (tự động tính số tiền cần thu bổ sung, nhập mục tiêu cọc HĐ, cam kết chuyển đổi bảo đảm).
    - Modal 5 (Quy tắc số 10): Hộp thoại Pop-up xác nhận đóng khi có thay đổi chưa lưu ("Xác nhận đóng form", "Tiếp tục chỉnh sửa", "Hủy thay đổi & Đóng").
    - Parity từ điển đạt **3.826 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

14. **Contract Document Export & Preview** (`frontend/src/components/landlord/ContractPreviewModal.tsx` & `contracts/page.tsx`) — **100% COMPLETED** [UC-L-15]
    - Bản địa hóa toàn diện cửa sổ xem trước, xuất và in ấn hợp đồng thuê phòng chuẩn hóa theo A4.
    - Tiêu đề modal song ngữ kèm số phòng (`landlordContractsExportTitle`), đại diện thuê (`landlordContractsExportRep`), mã hợp đồng.
    - Tác vụ in ấn trực tiếp (`landlordContractsExportPrintBtn`, `landlordContractsExportPrintTooltip`) từ khung nội dung iframe chuẩn mẫu hệ thống.
    - Tác vụ xuất lưu trữ hệ thống & tải xuống (`landlordContractsExportExportBtn`, `landlordContractsExportExporting`, `landlordContractsExportExportTooltip`) kết nối backend `exportContract(buildingId, contractId)`.
    - Trạng thái đang tải mẫu hệ thống (`landlordContractsExportPreparing`) và xử lý lỗi tải mẫu (`landlordContractsExportErrorTitle`).
    - Khung tài liệu dự phòng (Fallback Contract HTML) song ngữ linh hoạt theo ngôn ngữ hiển thị hiện tại.
    - Chân modal: hiển thị định dạng tiêu chuẩn A4 (`landlordContractsExportFormatStandard`), nút tải tệp HTML riêng biệt (`landlordContractsExportDownloadHtml`), nút đóng.
    - Các thông báo toast kết quả: tải xuống thành công (`toastDownloadSuccess`), xuất và lưu thành công (`toastExportSuccess`), thông báo lỗi (`toastExportFailed`).
    - Parity từ điển đạt **3.843 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

15. **Overdue Rental Debt Tracking & Reminders** (`frontend/src/app/(dashboard)/landlord/debts/page.tsx`) — **100% COMPLETED** [UC-L-16]
    - Bản địa hóa toàn diện phân hệ sổ công nợ tiền phòng, phân nhóm thời gian nợ và nhắc nợ đa kênh.
    - Tiêu đề trang (`landlordDebtsTitle`), phụ đề nghiệp vụ (`landlordDebtsSubtitle`), nút đồng bộ hạn nợ (`landlordDebtsSyncBtn`, `landlordDebtsSyncTooltip`, `landlordDebtsSyncing`), nút xuất dữ liệu Excel/CSV (`landlordDebtsExportExcel`, `landlordDebtsExportNoData`).
    - 4 Thẻ KPI tài chính: Tổng tiền nợ (`landlordDebtsTotalDebt`), Nợ quá hạn (`landlordDebtsOverdueDebt`, `landlordDebtsOverdueNotice`), Nợ xấu ≥3 tháng (`landlordDebtsBadDebt3Months`, `landlordDebtsBadDebtRooms`), Số phòng nợ (`landlordDebtsDebtorRooms`, `landlordDebtsAtBuilding`).
    - Bộ lọc & điều khiển: Ô tìm kiếm đa năng (`landlordDebtsSearchPlaceholder`), bộ lọc thời gian nợ (`all`, `overdue`, `1_month`, `2_months`, `bad_debt`), sắp xếp (`debt_desc`, `aging_desc`, `room_asc`), nút chuyển đổi chế độ Lưới vs Bảng.
    - Trạng thái tải dữ liệu (`landlordDebtsLoadingTitle`, `landlordDebtsLoadingDesc`) và trạng thái danh sách trống (`landlordDebtsEmptyFilteredTitle`, `landlordDebtsEmptyFilteredDesc`, `landlordDebtsEmptyAllPaidDesc`, `landlordDebtsClearFilter`).
    - Hỗ trợ đầy đủ 2 chế độ hiển thị song song theo Quy tắc số 9: Dạng Lưới (Grid view mặc định) và Dạng Bảng (Table view).
    - Thẻ nợ dạng Lưới & dòng dạng Bảng: nhãn trạng thái nợ đa màu, số phòng, tầng, họ tên khách thuê, số điện thoại, số kỳ nợ, tổng tiền nợ, tiền nợ quá hạn, nợ từ ngày, nút xem hóa đơn, nút gửi nhắc nợ.
    - Chuẩn hóa phân trang theo Quy tắc số 9 (Nhập số/trang, window jumping 5 trang: `Hiển thị [X] / trang | X-Y trên Z phòng nợ`).
    - Modal 1: Danh sách hóa đơn nợ theo phòng (tổng dư nợ cần thanh toán, số kỳ hóa đơn, chi tiết từng kỳ, hạn thanh toán, nút thu tiền ngay, nút đóng).
    - Modal 2: Gửi thông báo nhắc nợ (khách nhận, số điện thoại, ghi chú thêm từ chủ trọ tùy chọn, nội dung tin nhắn mẫu song ngữ, nút sao chép Zalo/SMS, nút gửi qua App Dormio).
    - Modal 3: Ghi nhận thu tiền mặt/chuyển khoản (số tiền thu theo kỳ, phương thức tiền mặt hoặc chuyển khoản ngoài, ghi chú thanh toán, nút xác nhận thu tiền).
    - Modal 4 (Quy tắc số 10): Hộp thoại Pop-up xác nhận đóng khi có thay đổi chưa lưu ("Xác nhận đóng form", "Tiếp tục chỉnh sửa", "Hủy thay đổi & Đóng").
    - Parity từ điển đạt **3.935 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

16. **Operating Expense Management** (`frontend/src/app/(dashboard)/landlord/expenses/page.tsx`) — **100% COMPLETED** [UC-L-17]
    - Bản địa hóa toàn diện phân hệ quản lý chi phí vận hành, bảo trì thiết bị và hóa đơn tòa nhà.
    - Tiêu đề trang (`landlordExpensesTitle`), phụ đề nghiệp vụ (`landlordExpensesSubtitle`), nút tải lại danh sách (`landlordExpensesReload`), nút xuất Excel/CSV (`landlordExpensesExportExcel`, `landlordExpensesAlertNoDataExport`), nút thêm khoản chi mới (`landlordExpensesAddNew`).
    - Dark Hero Summary Banner: Tiêu đề tòa nhà (`landlordExpensesBuildingFallback`), địa chỉ với biểu tượng MapPin, phụ đề ngân sách (`landlordExpensesHeroSubtitle`), 3 thẻ tài chính định dạng số tiền lớn thông minh (`TỔNG CHI PHÍ` - `formatLargeMoney`, `ĐÃ THANH TOÁN`, `CHỜ THANH TOÁN`).
    - Thanh bộ lọc & điều khiển: Thanh cuộn danh mục (`Bảo trì & Sửa chữa`, `Điện nước & Dịch vụ`, `Vệ sinh & An ninh`, `Trang thiết bị`, `Chi phí khác`, `Tất cả danh mục ({count})`), ô tìm kiếm đa năng (`landlordExpensesSearchPlaceholder`), nút chuyển đổi chế độ Lưới vs Bảng, 4 pill lọc trạng thái (`Tất cả`, `Đã thanh toán`, `Chờ thanh toán`, `Đã hủy`).
    - Trạng thái tải dữ liệu (`landlordExpensesLoading`) và trạng thái danh sách rỗng (`landlordExpensesNotFound`, `landlordExpensesNotFoundDesc`).
    - Hỗ trợ đầy đủ 2 chế độ hiển thị song song theo Quy tắc số 9: Dạng Lưới (Grid view mặc định: 6 mục/trang) và Dạng Bảng (Table view: 10 mục/trang).
    - Thẻ chi phí dạng Lưới & dòng bảng dạng Bảng: nhãn trạng thái đa màu sắc, mã chi phí, danh mục, tên khoản chi, số tiền chi âm nổi bật, phạm vi áp dụng (Toàn tòa nhà hoặc Tên phòng), ngày ghi nhận, nút xem chi tiết, nút đánh dấu đã trả, biểu tượng khóa đối với khoản chi đã thanh toán (đảm bảo tính minh bạch sổ sách).
    - Chuẩn hóa phân trang theo Quy tắc số 9 (Nhập số/trang, window jumping 5 trang: `Hiển thị [X] / trang | X-Y trên Z khoản chi`).
    - Modal 1: Chi tiết khoản chi (Header mã chi phí, Financial highlight card, tên khoản chi, phạm vi áp dụng, trạng thái thanh toán, ghi chú chi tiết, nút đóng, nút đánh dấu đã trả, nút khóa sửa / chỉnh sửa).
    - Modal 2: Thêm mới & Chỉnh sửa khoản chi phí (Tên khoản chi, danh mục, số tiền, phạm vi áp dụng toàn tòa / phòng cụ thể, chọn phòng khả dụng từ API, trạng thái thanh toán, ngày ghi nhận, ghi chú bổ sung, nút hủy, nút lưu/cập nhật).
    - Modal 3 (Quy tắc số 10): Pop-up xác nhận thoát khi có thay đổi chưa lưu ("Xác nhận đóng form?", "Tiếp tục nhập", "Hủy & Đóng").
    - Modal 4: Pop-up xác nhận xóa khoản chi (tên và mã khoản chi, nút hủy bỏ, nút xóa).
    - Modal 5: Pop-up thông báo khoản chi đã khóa sửa/xóa do đã thanh toán để bảo toàn sổ sách kế toán.
    - Parity từ điển đạt **3.984 keys** (1:1 giữa `vi.ts` và `en.ts`, 0 lỗi chênh lệch, 0 lỗi TypeScript).

---

#### Tổng kết tiến độ phân hệ Landlord Dashboard (UC-L-01 -> UC-L-17):
- **Đã hoàn thành 100%** toàn bộ 16 màn hình & modal nghiệp vụ từ **UC-L-01 đến UC-L-17** theo đúng tiến độ của backend!
- Tất cả các trang tuân thủ tuyệt đối **Quy tắc số 9** (Mặc định Grid view, song song Table view, phân trang chuẩn hóa với window jumping 5 trang) và **Quy tắc số 10** (Pop-up xác nhận đóng form khi có thay đổi draft chưa lưu).

#### Các trang tiếp theo khi backend hoàn thiện (Thuộc UC-L-18 trở đi):
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



