"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Search,
  Filter,
  ArrowDownLeft,
  Eye,
  Calendar,
  Building2,
  MapPin,
  FileSpreadsheet,
  Receipt,
  User,
  Phone,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Printer,
  X,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Maximize2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  landlordPaymentService,
  LandlordPaymentItem,
  LandlordPaymentsSummary,
} from "@/services/landlord-payment.service";
import { getRooms, RoomItem } from "@/services/room.service";

function PaymentsContent() {
  const { activeBuilding } = useAuth();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("search") || searchParams.get("room") || "";

  // View Mode: Grid (default, 6/page) & Table (10/page) per Rule 9
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [pageSize, setPageSize] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>(urlSearch);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "banking" | "cash">("all");

  // Server Data
  const [payments, setPayments] = useState<LandlordPaymentItem[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [summary, setSummary] = useState<LandlordPaymentsSummary>({
    totalRevenue: 0,
    totalTransactions: 0,
    bankingRevenue: 0,
    cashRevenue: 0,
  });
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals & Lightbox
  const [selectedPayment, setSelectedPayment] = useState<LandlordPaymentItem | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Sync pageSize with viewMode default
  useEffect(() => {
    setPageSize(viewMode === "grid" ? 6 : 10);
    setCurrentPage(1);
  }, [viewMode]);

  // Load available rooms for room filter
  useEffect(() => {
    if (!activeBuilding?.id) return;
    let isCancelled = false;

    async function loadRooms() {
      try {
        const res = await getRooms(activeBuilding.id, {
          limit: 100,
        });
        if (!isCancelled && res?.data) {
          setAvailableRooms(res.data);
        }
      } catch (err) {
        console.error("Failed to load rooms for filter:", err);
      }
    }

    loadRooms();
    return () => {
      isCancelled = true;
    };
  }, [activeBuilding?.id]);

  // Fetch payments list
  const fetchPayments = async () => {
    if (!activeBuilding?.id) {
      setPayments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const methodParam =
        activeTab !== "all"
          ? activeTab
          : selectedMethod !== "all"
          ? selectedMethod
          : undefined;

      const res = await landlordPaymentService.getLandlordPayments(
        activeBuilding.id,
        {
          roomId: selectedRoom !== "all" ? selectedRoom : undefined,
          search: searchQuery.trim() || undefined,
          method: methodParam,
          month: selectedMonth !== "all" ? selectedMonth : undefined,
          year: selectedYear !== "all" ? selectedYear : undefined,
          page: currentPage,
          limit: pageSize,
        },
      );

      if (res) {
        setPayments(res.payments || []);
        setTotalRecords(res.pagination?.total || 0);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error("Error loading payment history:", err);
      setPayments([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [
    activeBuilding?.id,
    currentPage,
    pageSize,
    searchQuery,
    selectedRoom,
    selectedMethod,
    selectedMonth,
    selectedYear,
    activeTab,
  ]);

  // Format money helper
  const formatMoney = (amount: number) => {
    return `${amount.toLocaleString("vi-VN")} ₫`;
  };

  const formatLargeMoney = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, "")} Tỷ ₫`;
    }
    if (amount >= 100_000_000) {
      return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M ₫`;
    }
    return `${amount.toLocaleString("vi-VN")} ₫`;
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes(),
      ).padStart(2, "0")} - ${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1,
      ).padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Pagination Logic with 5-page window jumping (Rule #9)
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const windowSize = 5;
  const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
  const visiblePages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  );
  const startIndex = totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, totalRecords);

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#2AC1BC]" /> Lịch Sử Thu Tiền & Thanh Toán
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
            Theo dõi tất cả giao dịch thanh toán thành công, biên nhận điện tử và hình ảnh công tơ điện nước (UC-L-07).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Link
            href="/landlord/invoices"
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-50 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <Receipt className="w-4 h-4 text-zinc-500 shrink-0" /> Quản Lý Hóa Đơn
          </Link>

          <Link
            href="/landlord/invoices?status=unpaid"
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <ArrowUpRight className="w-4 h-4 shrink-0" /> Ghi Nhận Thu Tiền Mới
          </Link>
        </div>
      </div>

      {/* Dark Hero Summary Banner (Matching Dormio BHMS Standard) */}
      <div className="bg-zinc-900 rounded-3xl p-5 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <CreditCard className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Left Title, Address Pill with Map button */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[#2AC1BC]/20 text-[#2AC1BC] text-[10px] font-black uppercase rounded-lg border border-[#2AC1BC]/30">
                Sổ Quỹ Thu Tiền
              </span>
              <span className="text-zinc-400 text-xs font-bold">UC-L-07</span>
            </div>

            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              {activeBuilding?.name || "Tòa Nhà Cho Thuê"}
            </h2>

            {activeBuilding?.address && (
              <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all max-w-full">
                <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                <span className="text-xs font-bold text-zinc-200 truncate max-w-[200px] sm:max-w-none">
                  {activeBuilding.address}
                </span>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto sm:ml-1.5 px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Xem Bản Đồ</span> &rarr;
                </a>
              </div>
            )}

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Tổng hợp giao dịch tiền phòng và dịch vụ đã thu thành công qua hệ thống ngân hàng VietQR hoặc ghi nhận tiền mặt trực tiếp.
            </p>
          </div>

          {/* Right Stat Cards (2 Rows, 2 Cards per Row) */}
          <div className="flex flex-col items-stretch sm:items-end gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Card 1: Tổng Doanh Thu Đã Thu */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors rounded-2xl border border-emerald-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-emerald-400 tracking-wider whitespace-nowrap">
                    TỔNG THU ĐÃ VỀ
                  </span>
                  <span className="font-black text-emerald-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(summary.totalRevenue)}
                  </span>
                </div>
              </div>

              {/* Card 2: Tổng Giao Dịch */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/10 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-zinc-400 tracking-wider whitespace-nowrap">
                    SỐ GIAO DỊCH
                  </span>
                  <span className="font-black text-white text-base sm:text-lg leading-none mt-1 whitespace-nowrap truncate">
                    {summary.totalTransactions}
                  </span>
                </div>
              </div>

              {/* Card 3: Thu VietQR / Ngân Hàng */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors rounded-2xl border border-indigo-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-indigo-300 tracking-wider whitespace-nowrap">
                    VIETQR / NGÂN HÀNG
                  </span>
                  <span className="font-black text-indigo-300 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(summary.bankingRevenue)}
                  </span>
                </div>
              </div>

              {/* Card 4: Thu Tiền Mặt */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-amber-500/10 hover:bg-amber-500/20 transition-colors rounded-2xl border border-amber-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-wider whitespace-nowrap">
                    TIỀN MẶT
                  </span>
                  <span className="font-black text-amber-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(summary.cashRevenue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Tabs Control Bar */}
      <div className="bg-white p-3.5 sm:p-4 border border-zinc-200/80 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo mã giao dịch, số phòng, số biên nhận, tên khách..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC] transition-all"
            />
          </div>

          {/* Filter Dropdowns Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Room Filter Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800">
              <span className="text-zinc-500 font-medium text-[11px] hidden sm:inline">Phòng:</span>
              <select
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-black text-zinc-900 focus:outline-none cursor-pointer pr-1 text-xs max-w-[120px] truncate"
              >
                <option value="all">Tất cả phòng</option>
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Phòng {r.roomNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Method Filter Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800">
              <span className="text-zinc-500 font-medium text-[11px] hidden sm:inline">Hình thức:</span>
              <select
                value={selectedMethod}
                onChange={(e) => {
                  setSelectedMethod(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-black text-zinc-900 focus:outline-none cursor-pointer pr-1 text-xs"
              >
                <option value="all">Tất cả hình thức</option>
                <option value="banking">VietQR / Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
              </select>
            </div>

            {/* Month Filter Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800">
              <span className="text-zinc-500 font-medium text-[11px] hidden sm:inline">Tháng:</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-black text-zinc-900 focus:outline-none cursor-pointer pr-1 text-xs"
              >
                <option value="all">Tất cả tháng</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800">
              <span className="text-zinc-500 font-medium text-[11px] hidden sm:inline">Năm:</span>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-black text-zinc-900 focus:outline-none cursor-pointer pr-1 text-xs"
              >
                <option value="all">Tất cả năm</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            {/* View Switcher (Rule 9) */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "grid"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
                title="Dạng Lưới (Grid - Mặc định)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "table"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
                title="Dạng Bảng (Table)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs font-extrabold border-t border-zinc-100 pt-3">
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === "all"
                ? "bg-[#2AC1BC] text-white shadow-2xs"
                : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
            }`}
          >
            Tất cả giao dịch ({summary.totalTransactions})
          </button>

          <button
            onClick={() => {
              setActiveTab("banking");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === "banking"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            VietQR / Ngân hàng ({formatLargeMoney(summary.bankingRevenue)})
          </button>

          <button
            onClick={() => {
              setActiveTab("cash");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === "cash"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Tiền mặt ({formatLargeMoney(summary.cashRevenue)})
          </button>
        </div>
      </div>

      {/* Main Content Display (Grid or Table View) */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-zinc-200 rounded-3xl">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#2AC1BC] border-t-transparent rounded-full" />
          <p className="text-xs text-zinc-500 font-bold">Đang tải lịch sử giao dịch...</p>
        </div>
      ) : payments.length === 0 ? (
        /* Clean Empty State (No Mockup Data!) */
        <div className="py-16 px-6 text-center bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-black text-base text-zinc-900">Chưa có dữ liệu thanh toán nào</h3>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Tòa nhà hiện chưa phát sinh giao dịch thanh toán thành công nào theo bộ lọc đã chọn. Giao dịch sẽ tự động hiển thị tại đây khi khách thuê quét mã VietQR hoặc khi bạn xác nhận thu tiền.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedRoom("all");
                setSelectedMethod("all");
                setSelectedMonth("all");
                setSelectedYear("all");
                setActiveTab("all");
              }}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
            <Link
              href="/landlord/invoices?status=unpaid"
              className="px-4 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-sm transition-all"
            >
              Xem hóa đơn cần thu
            </Link>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Parallel Grid View (Default - Rule 9) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((p) => {
            const isBanking = p.method === "banking";
            const evidencePhotos = p.meterReadings.filter((mr) => mr.imageUrl);

            return (
              <div
                key={p.id}
                className="bg-white border border-zinc-200/80 hover:border-[#2AC1BC]/50 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Method Accent Stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isBanking ? "bg-indigo-500" : "bg-amber-500"
                  }`}
                />

                <div className="space-y-4">
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2.5 py-1 bg-zinc-900 text-white font-black text-xs rounded-xl shrink-0">
                        {p.roomNumber}
                      </span>
                      {p.roomTypeName && (
                        <span className="text-[11px] font-bold text-zinc-500 truncate">
                          {p.roomTypeName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          isBanking
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                            : "bg-amber-50 text-amber-700 border border-amber-200/80"
                        }`}
                      >
                        {isBanking ? "VietQR" : "Tiền mặt"}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Thành công
                      </span>
                    </div>
                  </div>

                  {/* Payment Amount & Period Callout */}
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                        Kỳ Hóa Đơn {p.period}
                      </span>
                      <span className="text-xl font-black text-emerald-600 tracking-tight block mt-0.5">
                        +{formatMoney(p.amount)}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-500">
                      {p.items.length} khoản thu
                    </span>
                  </div>

                  {/* Payer Info & Receipt Numbers */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-600">
                      <span className="font-medium text-zinc-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-400" /> Người nộp:
                      </span>
                      <span className="font-bold text-zinc-900 truncate max-w-[150px]">
                        {p.payerName}
                      </span>
                    </div>

                    {p.payerPhone && (
                      <div className="flex items-center justify-between text-zinc-600">
                        <span className="font-medium text-zinc-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-400" /> SĐT:
                        </span>
                        <span className="font-bold text-zinc-700">{p.payerPhone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-zinc-600">
                      <span className="font-medium text-zinc-400 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-zinc-400" /> Số biên nhận:
                      </span>
                      <span className="font-mono font-bold text-zinc-800 text-[11px]">
                        {p.receiptNumber || `REC-${p.id.substring(0, 8)}`}
                      </span>
                    </div>

                    {p.transactionRef && (
                      <div className="flex items-center justify-between text-zinc-600">
                        <span className="font-medium text-zinc-400 text-[11px]">Mã GD ngân hàng:</span>
                        <span className="font-mono text-zinc-500 text-[10px] truncate max-w-[140px]">
                          {p.transactionRef}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Supporting Evidence Meter Photos Pill (UC-L-07) */}
                  {evidencePhotos.length > 0 && (
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-amber-600" /> {evidencePhotos.length} ảnh đồng hồ
                      </span>
                      <div className="flex items-center gap-1.5">
                        {evidencePhotos.slice(0, 2).map((photo, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPreviewImageUrl(photo.imageUrl)}
                            className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-200 hover:border-[#2AC1BC] transition-all cursor-pointer relative group/thumb"
                            title={`Xem ảnh ${photo.serviceName}: ${photo.readingValue}`}
                          >
                            <img
                              src={photo.imageUrl || ""}
                              alt={photo.serviceName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="w-2.5 h-2.5 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Timestamp & Action */}
                <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" /> {formatDateTime(p.paidAt)}
                  </span>

                  <button
                    onClick={() => setSelectedPayment(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-700 text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem Biên Nhận
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Parallel Table View (Rule 9) */
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Số Biên Nhận / Mã GD</th>
                  <th className="px-4 py-3.5">Phòng</th>
                  <th className="px-4 py-3.5">Khách Thuê</th>
                  <th className="px-4 py-3.5">Kỳ Hóa Đơn</th>
                  <th className="px-4 py-3.5">Thời Gian Thu</th>
                  <th className="px-4 py-3.5">Số Tiền Đã Thu</th>
                  <th className="px-4 py-3.5">Hình Thức</th>
                  <th className="px-4 py-3.5">Bằng Chứng</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {payments.map((p) => {
                  const isBanking = p.method === "banking";
                  const evidencePhotos = p.meterReadings.filter((mr) => mr.imageUrl);

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono font-black text-zinc-900 text-xs">
                          {p.receiptNumber || `REC-${p.id.substring(0, 8)}`}
                        </div>
                        {p.transactionRef && (
                          <div className="text-[10px] font-mono text-zinc-400 mt-0.5 truncate max-w-[140px]">
                            {p.transactionRef}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-black text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg">
                          {p.roomNumber}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-zinc-900">{p.payerName}</div>
                        {p.payerPhone && (
                          <div className="text-[11px] text-zinc-400 font-medium">{p.payerPhone}</div>
                        )}
                      </td>

                      <td className="px-4 py-4 font-bold text-zinc-700">
                        {p.period}
                      </td>

                      <td className="px-4 py-4 text-zinc-500 font-medium">
                        {formatDateTime(p.paidAt)}
                      </td>

                      <td className="px-4 py-4 font-black text-emerald-600 text-sm whitespace-nowrap">
                        +{formatMoney(p.amount)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                            isBanking
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                              : "bg-amber-50 text-amber-700 border border-amber-200/80"
                          }`}
                        >
                          {isBanking ? "VietQR" : "Tiền mặt"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {evidencePhotos.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {evidencePhotos.slice(0, 2).map((photo, idx) => (
                              <button
                                key={idx}
                                onClick={() => setPreviewImageUrl(photo.imageUrl)}
                                className="w-6 h-6 rounded overflow-hidden border border-zinc-200 hover:border-[#2AC1BC] cursor-pointer"
                                title={`Xem ${photo.serviceName}: ${photo.readingValue}`}
                              >
                                <img
                                  src={photo.imageUrl || ""}
                                  alt={photo.serviceName}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                            {evidencePhotos.length > 2 && (
                              <span className="text-[10px] text-zinc-400 font-bold">
                                +{evidencePhotos.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-700 font-black rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Biên Nhận
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standardized View & Pagination Bar (Rule #9) */}
      {totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-600 shadow-2xs">
          {/* Left: Displayed Range & Custom Page Size Input */}
          <div className="flex items-center gap-3">
            <span>
              Hiển thị{" "}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="mx-1 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg font-black text-zinc-900 focus:outline-none cursor-pointer"
              >
                <option value="6">6</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>{" "}
              / trang
            </span>
            <span className="text-zinc-300">|</span>
            <span>
              <span className="text-zinc-900 font-black">
                {startIndex}-{endIndex}
              </span>{" "}
              trên{" "}
              <span className="text-zinc-900 font-black">{totalRecords}</span> giao dịch
            </span>
          </div>

          {/* Right: 5-Page Window Jumping Pagination Controls */}
          <div className="flex items-center gap-1">
            {/* First Page Button */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Về trang đầu"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Jump -5 Pages */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 5))}
              disabled={currentPage <= 5}
              className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Lùi 5 trang"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* 5-Page Window Number Buttons */}
            {visiblePages.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? "bg-[#2AC1BC] text-white shadow-2xs"
                    : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                {pageNum}
              </button>
            ))}

            {/* Jump +5 Pages */}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 5))}
              disabled={currentPage + 5 > totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Tiến 5 trang"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page Button */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Đến trang cuối"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Electronic Receipt & Detail Modal (UC-L-07) */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 p-6 sm:p-8 space-y-6 relative print:p-0 print:border-none print:shadow-none">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase">
                    Thanh Toán Hoàn Tất
                  </span>
                  <span className="text-zinc-400 text-xs font-semibold">
                    {formatDateTime(selectedPayment.paidAt)}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                  <Receipt className="w-6 h-6 text-[#2AC1BC]" /> Biên Nhận Điện Tử
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Mã biên nhận:{" "}
                  <span className="text-zinc-700 font-bold">
                    {selectedPayment.receiptNumber || `REC-${selectedPayment.id}`}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handlePrintReceipt}
                  className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                  title="In biên nhận"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                  title="Đóng modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Payer & Property Info Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  THÔNG TIN PHÒNG & KHÁCH HÀNG
                </span>
                <div className="font-black text-zinc-900 text-sm">
                  Phòng {selectedPayment.roomNumber}{" "}
                  {selectedPayment.roomTypeName && `(${selectedPayment.roomTypeName})`}
                </div>
                <div className="text-zinc-600 font-semibold">
                  Người thanh toán: <span className="text-zinc-900 font-black">{selectedPayment.payerName}</span>
                </div>
                {selectedPayment.payerPhone && (
                  <div className="text-zinc-500">
                    Số điện thoại: <span className="font-bold text-zinc-700">{selectedPayment.payerPhone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 sm:border-l sm:border-zinc-200 sm:pl-4">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  THÔNG TIN GIAO DỊCH
                </span>
                <div className="text-zinc-700">
                  Hình thức:{" "}
                  <span className="font-black text-zinc-900">
                    {selectedPayment.method === "banking"
                      ? "Chuyển khoản VietQR"
                      : "Tiền mặt trực tiếp"}
                  </span>
                </div>
                {selectedPayment.transactionRef && (
                  <div className="text-zinc-500 font-mono text-[11px] truncate">
                    Mã GD: {selectedPayment.transactionRef}
                  </div>
                )}
                <div className="text-zinc-700">
                  Kỳ thanh toán: <span className="font-black text-[#2AC1BC]">{selectedPayment.period}</span>
                </div>
              </div>
            </div>

            {/* Invoice Breakdown Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider">
                Chi Tiết Các Khoản Đã Thu
              </h4>
              <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Nội dung</th>
                      <th className="px-3 py-2.5 text-center">Số lượng</th>
                      <th className="px-4 py-2.5 text-right">Đơn giá</th>
                      <th className="px-4 py-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {selectedPayment.items.length > 0 ? (
                      selectedPayment.items.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-3 font-bold text-zinc-900">
                            {item.serviceName}
                          </td>
                          <td className="px-3 py-3 text-center text-zinc-600 font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-600 font-medium">
                            {formatMoney(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-zinc-900">
                            {formatMoney(item.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3 font-bold text-zinc-900">
                          Tiền phòng & Dịch vụ trọn gói kỳ {selectedPayment.period}
                        </td>
                        <td className="px-3 py-3 text-center text-zinc-600 font-medium">1</td>
                        <td className="px-4 py-3 text-right text-zinc-600 font-medium">
                          {formatMoney(selectedPayment.amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-zinc-900">
                          {formatMoney(selectedPayment.amount)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-zinc-50 border-t border-zinc-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-black text-zinc-900 text-right">
                        TỔNG CỘNG ĐÃ THANH TOÁN:
                      </td>
                      <td className="px-4 py-3 font-black text-emerald-600 text-base text-right whitespace-nowrap">
                        {formatMoney(selectedPayment.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Supporting Evidence Meter Photos (UC-L-07) */}
            {selectedPayment.meterReadings.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Bằng Chứng Chỉ Số Đồng Hồ (UC-L-07)
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Ảnh chụp đối soát chỉ số điện / nước
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedPayment.meterReadings.map((mr) => (
                    <div
                      key={mr.id}
                      className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-2xl flex items-center gap-3"
                    >
                      {mr.imageUrl ? (
                        <button
                          onClick={() => setPreviewImageUrl(mr.imageUrl)}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-amber-300/80 shrink-0 relative group/photo cursor-pointer"
                        >
                          <img
                            src={mr.imageUrl}
                            alt={mr.serviceName}
                            className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-400">
                          <Camera className="w-6 h-6 stroke-1" />
                        </div>
                      )}

                      <div className="space-y-1 min-w-0 text-xs">
                        <span className="font-extrabold text-zinc-900 block truncate">
                          Đồng hồ {mr.serviceName}
                        </span>
                        <span className="text-amber-800 font-black text-sm block">
                          Chỉ số: {mr.readingValue}
                        </span>
                        {mr.imageUrl && (
                          <button
                            onClick={() => setPreviewImageUrl(mr.imageUrl)}
                            className="text-[11px] font-bold text-[#2AC1BC] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Xem ảnh phóng to</span> &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between print:hidden">
              <span className="text-[11px] text-zinc-400">
                Xác thực số hóa bởi Dormio BHMS
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> In Biên Nhận
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Meter Reading Photos */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
              title="Đóng ảnh"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImageUrl}
              alt="Bằng chứng công tơ điện nước"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <p className="text-white/80 text-xs font-semibold mt-3">
              Ảnh chụp công tơ thực tế đính kèm kỳ thanh toán
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-zinc-400 font-bold">
          Đang tải trang thanh toán...
        </div>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}
