"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus, Search, Filter, FileText, Download, MoreHorizontal, Receipt, Building2,
  ChevronDown, Sparkles, MapPin, FileSpreadsheet, Eye, Calendar, DollarSign,
  CheckCircle2, Clock, AlertTriangle, ChevronLeft, ChevronRight, Copy, QrCode,
  Printer, X, Check, LayoutGrid, List, Zap, Droplets, Wifi, ShieldCheck,
  Send, Smartphone, ArrowUpRight, User, RefreshCw
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";

// Invoice Item Interface
interface InvoiceItem {
  id: string;
  roomId: string;
  roomName: string;
  buildingName: string;
  tenantName: string;
  tenantPhone: string;
  period: string;
  rentAmount: number;
  elecOld: number;
  elecNew: number;
  elecRate: number;
  waterOld: number;
  waterNew: number;
  waterRate: number;
  serviceFees: { name: string; amount: number }[];
  discount: number;
  totalAmount: number;
  deadline: string;
  status: "Đã thu" | "Chưa thu" | "Quá hạn";
  createdAt: string;
  paidAt?: string;
  paymentMethod?: string;
  ocrMeterImage?: string;
}

function InvoicesContent() {
  const t = useTranslations("invoices");
  const { activeBuilding } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Params parsing
  const urlSearch = searchParams.get("search") || searchParams.get("room") || "";
  const urlId = searchParams.get("id") || "";

  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "paid" | "overdue">("all");
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("08");
  const [selectedYear, setSelectedYear] = useState("2026");

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(viewMode === "grid" ? 6 : 10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [windowStart, setWindowStart] = useState<number>(1);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  // Modals & Drawer States
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<"create" | "ocr" | "detail" | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form State for Create Invoice
  const [createForm, setCreateForm] = useState({
    roomName: "Phòng 101",
    tenantName: "Nguyễn Văn Tuấn",
    period: "08/2026",
    rentAmount: 3500000,
    elecOld: 1318,
    elecNew: 1418,
    elecRate: 3500,
    waterOld: 240,
    waterNew: 252,
    waterRate: 15000,
    wifiFee: 100000,
    trashFee: 50000,
    discount: 0,
    deadline: "20/08/2026",
  });
  const [isCreateFormDirty, setIsCreateFormDirty] = useState(false);

  // Form State for AI OCR Modal
  const [ocrMeterValue, setOcrMeterValue] = useState("1428");
  const [isOcrFormDirty, setIsOcrFormDirty] = useState(false);

  // Mock Invoices Dataset
  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    {
      id: "INV-202608-101",
      roomId: "101",
      roomName: "Phòng 101",
      buildingName: activeBuilding.name,
      tenantName: "Nguyễn Văn Tuấn",
      tenantPhone: "0988 123 456",
      period: "08/2026",
      rentAmount: 3500000,
      elecOld: 1318,
      elecNew: 1418,
      elecRate: 3500,
      waterOld: 240,
      waterNew: 252,
      waterRate: 15000,
      serviceFees: [
        { name: "Internet / Wifi tốc độ cao", amount: 100000 },
        { name: "Rác & Vệ sinh môi trường", amount: 50000 },
      ],
      discount: 0,
      totalAmount: 3500000 + (100 * 3500) + (12 * 15000) + 150000, // 4.180.000 ₫
      deadline: "20/08/2026",
      status: "Chưa thu",
      createdAt: "01/08/2026",
    },
    {
      id: "INV-202608-205",
      roomId: "205",
      roomName: "Phòng 205",
      buildingName: activeBuilding.name,
      tenantName: "Trần Thị Mai",
      tenantPhone: "0912 345 678",
      period: "08/2026",
      rentAmount: 4200000,
      elecOld: 2100,
      elecNew: 2210,
      elecRate: 3500,
      waterOld: 310,
      waterNew: 325,
      waterRate: 15000,
      serviceFees: [
        { name: "Internet / Wifi", amount: 100000 },
        { name: "Vệ sinh tòa nhà", amount: 50000 },
        { name: "Thang máy", amount: 50000 },
      ],
      discount: 100000,
      totalAmount: 4200000 + (110 * 3500) + (15 * 15000) + 200000 - 100000, // 4.710.000 ₫
      deadline: "15/08/2026",
      status: "Quá hạn",
      createdAt: "01/08/2026",
    },
    {
      id: "INV-202608-105",
      roomId: "105",
      roomName: "Phòng 105",
      buildingName: activeBuilding.name,
      tenantName: "Hoàng Minh Trí",
      tenantPhone: "0933 555 777",
      period: "08/2026",
      rentAmount: 3200000,
      elecOld: 980,
      elecNew: 1060,
      elecRate: 3500,
      waterOld: 180,
      waterNew: 190,
      waterRate: 15000,
      serviceFees: [
        { name: "Wifi & Rác", amount: 120000 },
      ],
      discount: 0,
      totalAmount: 3200000 + (80 * 3500) + (10 * 15000) + 120000, // 3.750.000 ₫
      deadline: "20/08/2026",
      status: "Đã thu",
      createdAt: "01/08/2026",
      paidAt: "12/08/2026 14:00",
      paymentMethod: "VietQR Chuyển khoản",
    },
    {
      id: "INV-202608-302",
      roomId: "302",
      roomName: "Phòng 302",
      buildingName: activeBuilding.name,
      tenantName: "Lê Văn Hùng",
      tenantPhone: "0977 111 222",
      period: "08/2026",
      rentAmount: 3800000,
      elecOld: 1450,
      elecNew: 1560,
      elecRate: 3500,
      waterOld: 210,
      waterNew: 222,
      waterRate: 15000,
      serviceFees: [
        { name: "Internet + Vệ sinh", amount: 150000 },
      ],
      discount: 0,
      totalAmount: 3800000 + (110 * 3500) + (12 * 15000) + 150000, // 4.515.000 ₫
      deadline: "20/08/2026",
      status: "Đã thu",
      createdAt: "01/08/2026",
      paidAt: "05/08/2026 09:30",
      paymentMethod: "VietQR Chuyển khoản",
    },
    {
      id: "INV-202607-101",
      roomId: "101",
      roomName: "Phòng 101",
      buildingName: activeBuilding.name,
      tenantName: "Nguyễn Văn Tuấn",
      tenantPhone: "0988 123 456",
      period: "07/2026",
      rentAmount: 3500000,
      elecOld: 1220,
      elecNew: 1318,
      elecRate: 3500,
      waterOld: 228,
      waterNew: 240,
      waterRate: 15000,
      serviceFees: [
        { name: "Internet + Rác", amount: 150000 },
      ],
      discount: 0,
      totalAmount: 3500000 + (98 * 3500) + (12 * 15000) + 150000, // 4.173.000 ₫
      deadline: "20/07/2026",
      status: "Đã thu",
      createdAt: "01/07/2026",
      paidAt: "10/07/2026 16:45",
      paymentMethod: "Tiền mặt",
    },
    {
      id: "INV-202607-205",
      roomId: "205",
      roomName: "Phòng 205",
      buildingName: activeBuilding.name,
      tenantName: "Trần Thị Mai",
      tenantPhone: "0912 345 678",
      period: "07/2026",
      rentAmount: 4200000,
      elecOld: 1980,
      elecNew: 2100,
      elecRate: 3500,
      waterOld: 295,
      waterNew: 310,
      waterRate: 15000,
      serviceFees: [
        { name: "Dịch vụ tòa nhà", amount: 200000 },
      ],
      discount: 0,
      totalAmount: 4200000 + (120 * 3500) + (15 * 15000) + 200000, // 5.045.000 ₫
      deadline: "20/07/2026",
      status: "Đã thu",
      createdAt: "01/07/2026",
      paidAt: "18/07/2026 11:20",
      paymentMethod: "VietQR Chuyển khoản",
    },
  ]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update default pageSize on viewMode change
  useEffect(() => {
    setPageSize(viewMode === "grid" ? 6 : 10);
    setCurrentPage(1);
  }, [viewMode]);

  // Handle URL deep-linking: ?id=INV-... or ?search=... or ?room=101
  useEffect(() => {
    if (urlId) {
      const matchInv = invoices.find(i => i.id.toLowerCase() === urlId.toLowerCase() || i.roomId === urlSearch);
      if (matchInv) {
        setSelectedInvoice(matchInv);
      }
    } else if (urlSearch) {
      const matchInv = invoices.find(i => i.roomId === urlSearch || i.roomName.toLowerCase().includes(urlSearch.toLowerCase()));
      if (matchInv) {
        setSelectedInvoice(matchInv);
      }
    }
  }, [urlId, urlSearch]);

  if (!isMounted) return null;

  // Invoices filtered by separate selected Month & Year
  const periodInvoices = invoices.filter((inv) => {
    const [invMonth, invYear] = inv.period.split('/');
    const matchMonth = selectedMonth === "all" || invMonth === selectedMonth;
    const matchYear = selectedYear === "all" || invYear === selectedYear;
    return matchMonth && matchYear;
  });

  // Calculate Metrics Dynamically based on selected Period
  const totalInvoicesCount = periodInvoices.length;
  const paidCount = periodInvoices.filter(i => i.status === "Đã thu").length;
  const unpaidCount = periodInvoices.filter(i => i.status === "Chưa thu").length;
  const overdueCount = periodInvoices.filter(i => i.status === "Quá hạn").length;

  const totalPaidAmount = periodInvoices.filter(i => i.status === "Đã thu").reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalUnpaidAmount = periodInvoices.filter(i => i.status !== "Đã thu").reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Filtered List Logic (Period + Search + Tab)
  const filteredInvoices = periodInvoices.filter((inv) => {
    const matchSearch =
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.tenantPhone.includes(searchTerm);

    if (!matchSearch) return false;

    if (activeTab === "unpaid") return inv.status === "Chưa thu";
    if (activeTab === "paid") return inv.status === "Đã thu";
    if (activeTab === "overdue") return inv.status === "Quá hạn";
    return true;
  });

  // Pagination Logic
  const totalItems = filteredInvoices.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Format large money amounts cleanly without wrapping
  const formatLargeMoney = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} Tỷ ₫`;
    }
    if (amount >= 100_000_000) {
      return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M ₫`;
    }
    return `${amount.toLocaleString("vi-VN")} ₫`;
  };

  // Handlers for Modals
  const handleOpenCreateModal = () => {
    setIsCreateFormDirty(false);
    setIsCreateModalOpen(true);
  };

  const handleRequestCloseCreate = () => {
    if (isCreateFormDirty) {
      setConfirmCloseTarget("create");
    } else {
      setIsCreateModalOpen(false);
    }
  };

  const handleOpenOcrModal = () => {
    setIsOcrFormDirty(false);
    setIsOcrModalOpen(true);
  };

  const handleRequestCloseOcr = () => {
    if (isOcrFormDirty) {
      setConfirmCloseTarget("ocr");
    } else {
      setIsOcrModalOpen(false);
    }
  };

  const handleConfirmCloseModal = () => {
    if (confirmCloseTarget === "create") {
      setIsCreateModalOpen(false);
      setIsCreateFormDirty(false);
    } else if (confirmCloseTarget === "ocr") {
      setIsOcrModalOpen(false);
      setIsOcrFormDirty(false);
    }
    setConfirmCloseTarget(null);
  };

  // Mark Paid Handler with custom payment method
  const handleMarkAsPaid = (invId: string, method = "Giao dịch ngoài (Tiền mặt / Chuyển khoản thủ công)") => {
    const nowStr = new Date().toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
    setInvoices(prev => prev.map(inv => inv.id === invId ? {
      ...inv,
      status: "Đã thu",
      paidAt: nowStr,
      paymentMethod: method
    } : inv));
    if (selectedInvoice && selectedInvoice.id === invId) {
      setSelectedInvoice(prev => prev ? {
        ...prev,
        status: "Đã thu",
        paidAt: nowStr,
        paymentMethod: method
      } : null);
    }
  };

  // VietQR Code Generator URL
  const getVietQrUrl = (inv: InvoiceItem) => {
    const bankBin = "970422"; // MBBank BIN
    const accountNo = "0988123456";
    const amount = inv.totalAmount;
    const memo = encodeURIComponent(`${inv.id} ${inv.roomName.replace(' ', '')}`);
    return `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=DORMIO%20BHMS`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#2AC1BC]" /> Hóa Đơn & Thanh Toán
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
            Quản lý hóa đơn hàng tháng, chốt chỉ số điện nước AI OCR & VietQR tự động.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenOcrModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200/80 rounded-xl hover:bg-amber-100 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" /> AI Quét Điện Nước OCR
          </button>

          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-50 transition-all cursor-pointer shadow-2xs whitespace-nowrap">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" /> Xuất Excel
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" /> Tạo Hóa Đơn Mới
          </button>
        </div>
      </div>

      {/* Dark Hero Summary Banner (Matching Image 2 Design) */}
      <div className="bg-zinc-900 rounded-3xl p-5 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Receipt className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Left Title, Address Pill with Map button, and Description */}
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              {activeBuilding.name}
            </h2>

            {/* Address Pill with Integrated Map Link */}
            <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all max-w-full">
              <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
              <span className="text-xs font-bold text-zinc-200 truncate max-w-[200px] sm:max-w-none">{activeBuilding.address}</span>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto sm:ml-1.5 px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <span>Xem Bản Đồ</span> &rarr;
              </a>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("bannerSub")}
            </p>
          </div>

          {/* Right Stat Cards (2 Rows, 2 Cards per Row, Non-wrapping Money Amounts) */}
          <div className="flex flex-col items-stretch sm:items-end gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Card 1: Tổng Hóa Đơn */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/10 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-zinc-400 tracking-wider whitespace-nowrap">{t("totalInvoicesShort")}</span>
                  <span className="font-black text-white text-base sm:text-lg leading-none mt-1 whitespace-nowrap truncate">{totalInvoicesCount}</span>
                </div>
              </div>

              {/* Card 2: Quá Hạn */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-rose-400 tracking-wider whitespace-nowrap">{t("overdueShort")}</span>
                  <span className="font-black text-rose-400 text-base sm:text-lg leading-none mt-1 whitespace-nowrap truncate">{overdueCount}</span>
                </div>
              </div>

              {/* Card 3: Đã Thu */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors rounded-2xl border border-emerald-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-emerald-400 tracking-wider whitespace-nowrap">{t("paidShort", { count: paidCount })}</span>
                  <span className="font-black text-emerald-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(totalPaidAmount)}
                  </span>
                </div>
              </div>

              {/* Card 4: Chưa Thu */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-amber-500/10 hover:bg-amber-500/20 transition-colors rounded-2xl border border-amber-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-wider whitespace-nowrap">{t("unpaidShort", { count: unpaidCount })}</span>
                  <span className="font-black text-amber-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(totalUnpaidAmount)}
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
              placeholder="Tìm mã hóa đơn, phòng, tên người thuê, SĐT..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
            />
          </div>

          {/* Month, Year & View Switcher Row on Mobile */}
          <div className="flex items-center gap-2 justify-between shrink-0 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Month Filter Dropdown */}
              <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 min-w-0">
                <div className="flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                  <span className="text-zinc-500 font-medium text-[11px] hidden sm:inline">Tháng:</span>
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-black text-zinc-900 focus:outline-none cursor-pointer pr-1 text-xs w-full sm:w-auto truncate"
                >
                  <option value="all">Tất cả tháng</option>
                  <option value="01">Tháng 01</option>
                  <option value="02">Tháng 02</option>
                  <option value="03">Tháng 03</option>
                  <option value="04">Tháng 04</option>
                  <option value="05">Tháng 05</option>
                  <option value="06">Tháng 06</option>
                  <option value="07">Tháng 07</option>
                  <option value="08">Tháng 08</option>
                  <option value="09">Tháng 09</option>
                  <option value="10">Tháng 10</option>
                  <option value="11">Tháng 11</option>
                  <option value="12">Tháng 12</option>
                </select>
              </div>

              {/* Year Filter Dropdown */}
              <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 min-w-0">
                <span className="text-zinc-500 font-medium text-[11px] hidden sm:inline">Năm:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-black text-zinc-900 focus:outline-none cursor-pointer pr-1 text-xs w-full sm:w-auto truncate"
                >
                  <option value="all">Tất cả năm</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "grid" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                title="Dạng Lưới (Grid)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "table" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
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
            onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${activeTab === "all" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
          >
            Tất cả ({periodInvoices.length})
          </button>

          <button
            onClick={() => { setActiveTab("unpaid"); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${activeTab === "unpaid" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
          >
            Chưa thu ({unpaidCount})
          </button>

          <button
            onClick={() => { setActiveTab("paid"); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${activeTab === "paid" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
          >
            Đã thu ({paidCount})
          </button>

          <button
            onClick={() => { setActiveTab("overdue"); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${activeTab === "overdue" ? "bg-rose-500 text-white shadow-2xs" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
          >
            Quá hạn ({overdueCount})
          </button>
        </div>
      </div>

      {/* Main Content Display (Grid or Table View) */}
      {paginatedInvoices.length === 0 ? (
        <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl space-y-3">
          <Receipt className="w-12 h-12 text-zinc-300 mx-auto stroke-1" />
          <h3 className="font-extrabold text-sm text-zinc-800">Không tìm thấy hóa đơn nào</h3>
          <p className="text-xs text-zinc-400">Thử thay đổi bộ lọc hoặc cụm từ tìm kiếm của bạn.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9 Default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedInvoices.map((inv) => {
            const isPaid = inv.status === "Đã thu";
            const isOverdue = inv.status === "Quá hạn";

            return (
              <div
                key={inv.id}
                className={`bg-white border rounded-2xl p-4 space-y-4 hover:shadow-md transition-all flex flex-col justify-between ${isPaid ? "border-emerald-200 hover:border-emerald-300" :
                  isOverdue ? "border-rose-200 hover:border-rose-300 bg-rose-50/20" :
                    "border-zinc-200/80 hover:border-[#2AC1BC]/40"
                  }`}
              >
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                    <span className="font-extrabold text-sm text-zinc-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#2AC1BC]" /> {inv.roomName}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      isOverdue ? "bg-rose-50 text-rose-700 border-rose-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-semibold">Người thuê:</span>
                      <span className="font-bold text-zinc-900">{inv.tenantName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-semibold">Kỳ thu:</span>
                      <span className="font-bold text-zinc-800">Tháng {inv.period}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-semibold">Mã hóa đơn:</span>
                      <span className="font-mono text-zinc-600 text-[11px]">{inv.id}</span>
                    </div>
                  </div>

                  {/* Fee Items Breakdown Summary */}
                  <div className="p-3 bg-zinc-50 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-zinc-600">
                      <span>Tiền phòng:</span>
                      <span className="font-bold text-zinc-800">{inv.rentAmount.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Điện ({inv.elecNew - inv.elecOld} kWh):</span>
                      <span className="font-bold text-zinc-800">{((inv.elecNew - inv.elecOld) * inv.elecRate).toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Nước ({inv.waterNew - inv.waterOld} m³):</span>
                      <span className="font-bold text-zinc-800">{((inv.waterNew - inv.waterOld) * inv.waterRate).toLocaleString("vi-VN")} ₫</span>
                    </div>
                  </div>
                </div>

                {/* Total & Action Footer */}
                <div className="pt-3 border-t border-zinc-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Tổng tiền</span>
                      <span className="font-black text-base text-[#2AC1BC]">
                        {inv.totalAmount.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold ${isOverdue ? "text-rose-600 font-black" : "text-zinc-400"}`}>
                      Hạn: {inv.deadline}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="flex-1 py-2 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Xem Chi Tiết
                    </button>
                    {!isPaid && (
                      <button
                        onClick={() => handleMarkAsPaid(inv.id)}
                        className="py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        title="Đánh dấu đã thu"
                      >
                        <Check className="w-3.5 h-3.5" /> Thu
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9 Alternative) */
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase font-black tracking-wider">
                <tr>
                  <th className="px-4 py-3">Mã HĐ</th>
                  <th className="px-4 py-3">Phòng</th>
                  <th className="px-4 py-3">Người thuê</th>
                  <th className="px-4 py-3">Kỳ thu</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th className="px-4 py-3">Hạn nộp</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold">
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold font-mono text-zinc-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#2AC1BC]" />
                      {inv.id}
                    </td>
                    <td className="px-4 py-3.5 font-black text-zinc-900">{inv.roomName}</td>
                    <td className="px-4 py-3.5 text-zinc-700">{inv.tenantName}</td>
                    <td className="px-4 py-3.5 text-zinc-600">Tháng {inv.period}</td>
                    <td className="px-4 py-3.5 font-black text-[#2AC1BC] text-sm">{inv.totalAmount.toLocaleString("vi-VN")} ₫</td>
                    <td className={`px-4 py-3.5 font-bold ${inv.status === "Quá hạn" ? "text-rose-600 font-black" : "text-zinc-600"}`}>
                      {inv.deadline}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${inv.status === "Đã thu" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        inv.status === "Quá hạn" ? "bg-rose-50 text-rose-700 border-rose-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar (Standard Dormio Rule #9) */}
      <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
        <div className="flex items-center gap-2 text-zinc-600">
          <span>Hiển thị</span>
          <input
            type="number"
            min={1}
            max={50}
            value={pageSize}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setPageSize(val);
              setCurrentPage(1);
            }}
            className="w-14 px-2 py-1 border border-zinc-200 rounded-lg text-center font-black focus:outline-none focus:border-[#2AC1BC]"
          />
          <span>/ trang</span>
          <span className="text-zinc-400">|</span>
          <span>
            {totalItems === 0 ? "0" : `${startIndex + 1}-${endIndex}`} trên {totalItems} mục
          </span>
        </div>

        {/* Page Jumping Controls */}
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-1.5 border border-zinc-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-600" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${currentPage === p ? "bg-[#2AC1BC] text-white shadow-2xs" : "hover:bg-zinc-100 text-zinc-700"
                }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-1.5 border border-zinc-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </button>
        </div>
      </div>

      {/* 📄 DETAILED INVOICE LIGHTBOX MODAL / DRAWER */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedInvoice(null); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-zinc-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900 flex items-center gap-2">
                    Chi Tiết Hóa Đơn {selectedInvoice.roomName}
                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${selectedInvoice.status === "Đã thu" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      selectedInvoice.status === "Quá hạn" ? "bg-rose-50 text-rose-700 border-rose-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                      {selectedInvoice.status}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold">Mã HĐ: {selectedInvoice.id} • Kỳ thu: Tháng {selectedInvoice.period}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs custom-scrollbar">
              {/* Tenant & Building Info Card */}
              <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Người Thuê</span>
                  <p className="font-black text-sm text-zinc-900">{selectedInvoice.tenantName}</p>
                  <p className="text-zinc-500 font-semibold">{selectedInvoice.tenantPhone}</p>
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Thời Hạn & Ngày Lập</span>
                  <p className="font-bold text-zinc-800">
                    Hạn nộp: <span className={`font-black ${selectedInvoice.status === "Quá hạn" ? "text-rose-600 font-extrabold" : "text-zinc-800"}`}>{selectedInvoice.deadline}</span>
                    {selectedInvoice.status === "Quá hạn" && (
                      <span className="ml-1.5 px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-black rounded-md border border-rose-200">Quá hạn</span>
                    )}
                  </p>
                  <p className="text-zinc-500 font-medium">Lập ngày: {selectedInvoice.createdAt}</p>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#2AC1BC]" /> Chi Tiết Các Khoản Phí
                </h4>

                <div className="border border-zinc-200 rounded-2xl overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs text-left min-w-[500px]">
                    <thead className="bg-zinc-50 border-b border-zinc-200 font-black text-zinc-500 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Khoản mục</th>
                        <th className="px-4 py-2.5">Chỉ số cũ - mới</th>
                        <th className="px-4 py-2.5 text-right">Đơn giá</th>
                        <th className="px-4 py-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold">
                      <tr>
                        <td className="px-4 py-3 font-bold text-zinc-900">Tiền phòng ({selectedInvoice.roomName})</td>
                        <td className="px-4 py-3 text-zinc-400">-</td>
                        <td className="px-4 py-3 text-right">{selectedInvoice.rentAmount.toLocaleString("vi-VN")} ₫</td>
                        <td className="px-4 py-3 text-right font-black text-zinc-900">{selectedInvoice.rentAmount.toLocaleString("vi-VN")} ₫</td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3 font-bold text-zinc-900 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" /> Tiền Điện
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {selectedInvoice.elecOld} &rarr; {selectedInvoice.elecNew} ({selectedInvoice.elecNew - selectedInvoice.elecOld} kWh)
                        </td>
                        <td className="px-4 py-3 text-right">{selectedInvoice.elecRate.toLocaleString("vi-VN")} ₫</td>
                        <td className="px-4 py-3 text-right font-black text-zinc-900">
                          {((selectedInvoice.elecNew - selectedInvoice.elecOld) * selectedInvoice.elecRate).toLocaleString("vi-VN")} ₫
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3 font-bold text-zinc-900 flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-blue-500" /> Tiền Nước
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {selectedInvoice.waterOld} &rarr; {selectedInvoice.waterNew} ({selectedInvoice.waterNew - selectedInvoice.waterOld} m³)
                        </td>
                        <td className="px-4 py-3 text-right">{selectedInvoice.waterRate.toLocaleString("vi-VN")} ₫</td>
                        <td className="px-4 py-3 text-right font-black text-zinc-900">
                          {((selectedInvoice.waterNew - selectedInvoice.waterOld) * selectedInvoice.waterRate).toLocaleString("vi-VN")} ₫
                        </td>
                      </tr>

                      {selectedInvoice.serviceFees.map((fee, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-bold text-zinc-900">{fee.name}</td>
                          <td className="px-4 py-3 text-zinc-400">Cố định / tháng</td>
                          <td className="px-4 py-3 text-right">{fee.amount.toLocaleString("vi-VN")} ₫</td>
                          <td className="px-4 py-3 text-right font-black text-zinc-900">{fee.amount.toLocaleString("vi-VN")} ₫</td>
                        </tr>
                      ))}

                      {selectedInvoice.discount > 0 && (
                        <tr className="bg-rose-50/40">
                          <td className="px-4 py-3 font-bold text-rose-700">Chiết khấu / Giảm giá</td>
                          <td className="px-4 py-3 text-zinc-400">-</td>
                          <td className="px-4 py-3 text-right text-rose-700">-{selectedInvoice.discount.toLocaleString("vi-VN")} ₫</td>
                          <td className="px-4 py-3 text-right font-black text-rose-700">-{selectedInvoice.discount.toLocaleString("vi-VN")} ₫</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation Card & VietQR Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* VietQR Bank Card */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex items-center gap-4">
                  <div className="w-24 h-24 bg-white rounded-xl p-1 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden border border-zinc-200">
                    <img src={getVietQrUrl(selectedInvoice)} alt="Mã VietQR" className="w-full h-full object-contain" />
                  </div>

                  <div className="space-y-1 text-[11px] min-w-0">
                    <span className="font-extrabold text-[#2AC1BC] flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5" /> Quét VietQR Tự Động
                    </span>
                    <p className="font-bold text-zinc-900">Ngân hàng MBBank</p>
                    <p className="font-mono text-zinc-700 font-bold">STK: 0988123456</p>
                    <p className="text-zinc-500 font-medium truncate">Nội dung: {selectedInvoice.id} {selectedInvoice.roomName.replace(' ', '')}</p>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="p-5 bg-zinc-900 text-white rounded-2xl space-y-2 text-right shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Tổng Cộng Phải Thanh Toán</span>
                  <span className="text-2xl sm:text-3xl font-black text-[#2AC1BC] block">
                    {selectedInvoice.totalAmount.toLocaleString("vi-VN")} ₫
                  </span>
                  {selectedInvoice.paidAt && (
                    <span className="text-[10px] font-bold text-emerald-400 block">
                      Đã thu tiền lúc {selectedInvoice.paidAt} ({selectedInvoice.paymentMethod})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-zinc-100 bg-white flex flex-wrap items-center justify-between gap-3">
              {/* If UNPAID: Show "Nhắc Thu Tiền Qua Chat" button */}
              {selectedInvoice.status !== "Đã thu" ? (
                <button
                  onClick={() => {
                    const roomNum = selectedInvoice.roomId;
                    const tenantName = selectedInvoice.tenantName;
                    setSelectedInvoice(null);
                    router.push(
                      `/landlord/messages?room=${encodeURIComponent(roomNum)}&tenant=${encodeURIComponent(tenantName)}&invId=${encodeURIComponent(selectedInvoice.id)}&amount=${selectedInvoice.totalAmount}&period=${encodeURIComponent(selectedInvoice.period)}&autoSend=true`
                    );
                  }}
                  className="px-4 py-2 bg-zinc-100 hover:bg-[#2AC1BC]/10 hover:text-[#2AC1BC] text-zinc-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#2AC1BC]" /> Nhắc Thu Tiền Qua Chat
                </button>
              ) : (
                /* If PAID: HIDE "Nhắc thu tiền", show Paid Confirmation Status Badge */
                <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-black rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã thu tiền ({selectedInvoice.paidAt}) — {selectedInvoice.paymentMethod}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* If UNPAID: Show "Xác Nhận Đã Thu Tiền" button */}
                {selectedInvoice.status !== "Đã thu" && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedInvoice.id, "Giao dịch ngoài (Tiền mặt / Chuyển khoản thủ công)")}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Xác Nhận Đã Thu Tiền
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ➕ CREATE NEW INVOICE MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleRequestCloseCreate(); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-zinc-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">Lập Hóa Đơn Mới</h3>
                  <p className="text-xs text-zinc-500 font-semibold">Tự động tính tiền điện nước và tạo mã VietQR thanh toán.</p>
                </div>
              </div>
              <button
                onClick={handleRequestCloseCreate}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">Chọn Phòng *</label>
                  <select
                    value={createForm.roomName}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, roomName: e.target.value });
                      setIsCreateFormDirty(true);
                    }}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-semibold text-xs focus:outline-none focus:border-[#2AC1BC]"
                  >
                    <option value="Phòng 101">Phòng 101 (Nguyễn Văn Tuấn)</option>
                    <option value="Phòng 205">Phòng 205 (Trần Thị Mai)</option>
                    <option value="Phòng 105">Phòng 105 (Hoàng Minh Trí)</option>
                    <option value="Phòng 302">Phòng 302 (Lê Văn Hùng)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">Kỳ Thanh Toán *</label>
                  <input
                    type="text"
                    value={createForm.period}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, period: e.target.value });
                      setIsCreateFormDirty(true);
                    }}
                    placeholder="08/2026"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-semibold text-xs focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              {/* Meter Readings Inputs */}
              <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-3">
                <span className="font-black text-xs text-zinc-900 uppercase tracking-wider block">Chỉ Số Điện Nước</span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-500">Điện Cũ (kWh)</label>
                    <input
                      type="number"
                      value={createForm.elecOld}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, elecOld: parseInt(e.target.value) || 0 });
                        setIsCreateFormDirty(true);
                      }}
                      className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-amber-700">Điện Mới (kWh)</label>
                    <input
                      type="number"
                      value={createForm.elecNew}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, elecNew: parseInt(e.target.value) || 0 });
                        setIsCreateFormDirty(true);
                      }}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-500">Nước Cũ (m³)</label>
                    <input
                      type="number"
                      value={createForm.waterOld}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, waterOld: parseInt(e.target.value) || 0 });
                        setIsCreateFormDirty(true);
                      }}
                      className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-blue-700">Nước Mới (m³)</label>
                    <input
                      type="number"
                      value={createForm.waterNew}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, waterNew: parseInt(e.target.value) || 0 });
                        setIsCreateFormDirty(true);
                      }}
                      className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-800"
                    />
                  </div>
                </div>
              </div>

              {/* Total Summary preview */}
              <div className="p-4 bg-[#2AC1BC]/10 border border-[#2AC1BC]/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-zinc-500 block uppercase">Dự Tính Tổng Tiền</span>
                  <span className="text-xl font-black text-[#2AC1BC]">
                    {(
                      createForm.rentAmount +
                      Math.max(0, (createForm.elecNew - createForm.elecOld)) * createForm.elecRate +
                      Math.max(0, (createForm.waterNew - createForm.waterOld)) * createForm.waterRate +
                      createForm.wifiFee + createForm.trashFee - createForm.discount
                    ).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <span className="text-[11px] font-bold text-zinc-500">Hạn nộp: {createForm.deadline}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 bg-white flex items-center justify-end gap-2">
              <button
                onClick={handleRequestCloseCreate}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  const newInv: InvoiceItem = {
                    id: `INV-202608-${createForm.roomName.replace('Phòng ', '')}`,
                    roomId: createForm.roomName.replace('Phòng ', ''),
                    roomName: createForm.roomName,
                    buildingName: activeBuilding.name,
                    tenantName: createForm.tenantName,
                    tenantPhone: "0988 123 456",
                    period: createForm.period,
                    rentAmount: createForm.rentAmount,
                    elecOld: createForm.elecOld,
                    elecNew: createForm.elecNew,
                    elecRate: createForm.elecRate,
                    waterOld: createForm.waterOld,
                    waterNew: createForm.waterNew,
                    waterRate: createForm.waterRate,
                    serviceFees: [
                      { name: "Internet / Wifi", amount: createForm.wifiFee },
                      { name: "Rác & Vệ sinh", amount: createForm.trashFee },
                    ],
                    discount: createForm.discount,
                    totalAmount: (
                      createForm.rentAmount +
                      Math.max(0, (createForm.elecNew - createForm.elecOld)) * createForm.elecRate +
                      Math.max(0, (createForm.waterNew - createForm.waterOld)) * createForm.waterRate +
                      createForm.wifiFee + createForm.trashFee - createForm.discount
                    ),
                    deadline: createForm.deadline,
                    status: "Chưa thu",
                    createdAt: new Date().toLocaleDateString("vi-VN"),
                  };

                  setInvoices([newInv, ...invoices]);
                  setIsCreateModalOpen(false);
                  setIsCreateFormDirty(false);
                }}
                className="px-5 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                Lập & Phát Hành Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 AI OCR METER READING SPLIT-SCREEN VERIFICATION MODAL */}
      {isOcrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleRequestCloseOcr(); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-zinc-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Sparkles className="w-6 h-6 fill-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900">AI OCR Đối Soát Chỉ Số Đồng Hồ Điện</h2>
                  <p className="text-xs text-zinc-500 font-medium">So sánh ảnh chụp thực tế và số liệu AI tự động nhận diện trước khi tính hóa đơn.</p>
                </div>
              </div>
              <button
                onClick={handleRequestCloseOcr}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Screen Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
              {/* Left Side: Photo with AI Bounding Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-zinc-700 uppercase tracking-wider">1. Ảnh Chụp Đồng Hồ Phòng 102</span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-extrabold">
                    AI Độ Chính Xác 99.4%
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-amber-500/50 bg-zinc-900 h-64 flex items-center justify-center group shadow-inner">
                  {/* Mock Meter Screen Visual */}
                  <div className="text-center space-y-2">
                    <div className="inline-block px-6 py-3 bg-black/80 rounded-xl border-2 border-emerald-400 font-mono text-3xl font-black text-emerald-400 tracking-widest shadow-[0_0_15px_rgba(52,211,153,0.5)] relative">
                      {ocrMeterValue}
                      <span className="absolute -top-3 -right-3 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded-full animate-bounce">
                        OCR Box
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">Đồng hồ cơ khí 1 pha — Chụp lúc 08:30 hôm nay</p>
                  </div>
                </div>
              </div>

              {/* Right Side: AI Extracted Details & Inputs */}
              <div className="space-y-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-200/80 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs font-black text-zinc-700 uppercase tracking-wider block">2. Chi Tiết Tính Tiền Điện Tháng 8</span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-zinc-200">
                      <span className="text-[10px] font-extrabold text-zinc-400 block">CHỈ SỐ CŨ</span>
                      <span className="text-base font-black text-zinc-800">1.318 kWh</span>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                      <span className="text-[10px] font-extrabold text-amber-700 block">CHỈ SỐ MỚI (AI OCR)</span>
                      <input
                        type="text"
                        value={ocrMeterValue}
                        onChange={(e) => {
                          setOcrMeterValue(e.target.value);
                          setIsOcrFormDirty(true);
                        }}
                        className="w-full text-base font-black text-amber-700 bg-transparent outline-none border-b border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-zinc-200 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-zinc-600">
                      <span>Sản lượng tiêu thụ:</span>
                      <span className="text-zinc-900 font-black">{Math.max(0, parseInt(ocrMeterValue || "0") - 1318)} kWh</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-zinc-600">
                      <span>Đơn giá điện:</span>
                      <span className="text-zinc-900">3.500 ₫ / kWh</span>
                    </div>
                    <div className="border-t border-zinc-100 pt-2 flex justify-between text-sm font-black text-zinc-900">
                      <span>Thành tiền điện:</span>
                      <span className="text-[#2AC1BC]">
                        {((Math.max(0, parseInt(ocrMeterValue || "0") - 1318)) * 3500).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={handleRequestCloseOcr}
                    className="flex-1 py-3 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => {
                      setIsOcrModalOpen(false);
                      setIsOcrFormDirty(false);
                    }}
                    className="flex-1 py-3 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Xác Nhận & Cập Nhật Hóa Đơn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ SYSTEM POP-UP CONFIRMATION MODAL (Rule #10 Dormio Standard) */}
      {confirmCloseTarget && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmCloseTarget(null); }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-zinc-200 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 border border-amber-200/80 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-zinc-900">Xác nhận đóng form</h3>
              <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                Bạn đang có thông tin chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thông tin đã nhập?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmCloseTarget(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>

              <button
                onClick={handleConfirmCloseModal}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Hủy thay đổi & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-zinc-400">Đang tải dữ liệu hóa đơn...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}

