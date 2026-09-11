"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  Clock,
  Send,
  Eye,
  CheckCircle2,
  Copy,
  Check,
  X,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  Receipt,
  CreditCard,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import {
  landlordInvoiceService,
  RoomDebtItem,
  LandlordDebtsSummary,
  ManualPaymentPayload,
} from "@/services/landlord-invoice.service";

export default function LandlordDebtsPage() {
  const { activeBuilding } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  // Rule #9: Grid view as default (Grid=6, Table=10)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [pageSize, setPageSize] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [durationFilter, setDurationFilter] = useState<
    "all" | "current" | "overdue" | "1_month" | "2_months" | "bad_debt"
  >("all");
  const [sortBy, setSortBy] = useState<"debt_desc" | "aging_desc" | "room_asc">("debt_desc");

  // Selection (Rule #9: applies to current page only)
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Data states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debtRooms, setDebtRooms] = useState<RoomDebtItem[]>([]);
  const [summary, setSummary] = useState<LandlordDebtsSummary>({
    totalDebtAmount: 0,
    overdueDebtAmount: 0,
    badDebtAmount: 0,
    debtorRoomsCount: 0,
    totalInvoicesCount: 0,
    agingDistribution: {
      under30Days: 0,
      under30DaysAmount: 0,
      from31To60Days: 0,
      from31To60DaysAmount: 0,
      over60Days: 0,
      over60DaysAmount: 0,
    },
  });

  // Modals
  const [invoicesModalRoom, setInvoicesModalRoom] = useState<RoomDebtItem | null>(null);
  const [reminderModalRoom, setReminderModalRoom] = useState<RoomDebtItem | null>(null);
  const [reminderNote, setReminderNote] = useState("");
  const [isReminderDirty, setIsReminderDirty] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderCopied, setReminderCopied] = useState(false);
  const [reminderSuccessMessage, setReminderSuccessMessage] = useState<string | null>(null);

  // Manual payment modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<{
    id: string;
    period: string;
    totalAmount: number;
    roomNumber: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "banking">("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [isPaymentDirty, setIsPaymentDirty] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Rule #10: Unsaved changes confirmation modal
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<"reminder" | "payment" | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update default pageSize on viewMode change per Rule #9
  useEffect(() => {
    const defaultSize = viewMode === "grid" ? 6 : 10;
    setPageSize(defaultSize);
    setCurrentPage(1);
    setSelectedRoomIds([]);
  }, [viewMode]);

  // Fetch debts from API (UC-L-16)
  const fetchDebts = useCallback(async () => {
    if (!activeBuilding?.id) return;
    try {
      setIsLoading(true);
      const res = await landlordInvoiceService.getLandlordDebts(activeBuilding.id, {
        search: searchTerm,
        duration: durationFilter,
        sortBy,
        page: currentPage,
        limit: pageSize,
      });

      if (res && res.success) {
        setDebtRooms(res.data || []);
        setSummary(res.summary);
        setTotalRecords(res.meta.total || 0);
      }
    } catch (err) {
      console.error("Failed to load debts:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeBuilding?.id, searchTerm, durationFilter, sortBy, currentPage, pageSize]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  // Trigger manual overdue check
  const handleTriggerFlip = async () => {
    if (!activeBuilding?.id) return;
    try {
      setIsRefreshing(true);
      await landlordInvoiceService.flipOverdueInvoices(activeBuilding.id);
      await fetchDebts();
    } catch (err) {
      console.error("Failed to trigger overdue check:", err);
      setIsRefreshing(false);
    }
  };

  // Rule #9 Pagination Calculation
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const windowSize = 5;
  const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
  const visiblePages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  );
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalRecords);

  // Format currency
  const formatVND = (amt: number) => amt.toLocaleString("vi-VN") + " ₫";

  // Reminder message template
  const buildReminderText = (room: RoomDebtItem, customNote: string) => {
    const tenantName = room.tenant?.name || "Khách thuê";
    const amountStr = formatVND(room.totalDebtAmount);
    return `[Dormio - ${room.buildingName}]\nKính gửi anh/chị ${tenantName} (Phòng ${room.roomNumber}),\nHệ thống xin thông báo hiện tại phòng đang có dư nợ tiền trọ/dịch vụ chưa thanh toán: ${amountStr} (${room.invoicesCount} kỳ hóa đơn).\n${customNote ? `Ghi chú từ chủ trọ: "${customNote}"\n` : ""}Kính mong anh/chị thu xếp thanh toán sớm để đảm bảo quyền lợi thuê phòng. Trân trọng cảm ơn!`;
  };

  // Copy reminder to clipboard
  const handleCopyReminder = (room: RoomDebtItem) => {
    const text = buildReminderText(room, reminderNote);
    navigator.clipboard.writeText(text);
    setReminderCopied(true);
    setTimeout(() => setReminderCopied(false), 2500);
  };

  // Send in-app reminder
  const handleSendInAppReminder = async (room: RoomDebtItem) => {
    if (!activeBuilding?.id) return;
    try {
      setIsSendingReminder(true);
      const res = await landlordInvoiceService.sendDebtReminder(
        activeBuilding.id,
        room.roomId,
        reminderNote || undefined,
      );
      if (res && res.success) {
        setReminderSuccessMessage(res.message || "Đã gửi thông báo nhắc nợ thành công!");
        setTimeout(() => {
          setReminderSuccessMessage(null);
          setReminderModalRoom(null);
          setReminderNote("");
          setIsReminderDirty(false);
        }, 1800);
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Không thể gửi thông báo nhắc nợ";
      alert(errorMsg);
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Record manual payment
  const handleRecordPayment = async () => {
    if (!activeBuilding?.id || !paymentModalInvoice) return;
    try {
      setIsSubmittingPayment(true);
      const payload: ManualPaymentPayload = {
        method: paymentMethod,
        note: paymentNote || undefined,
      };
      await landlordInvoiceService.recordManualPayment(
        activeBuilding.id,
        paymentModalInvoice.id,
        payload,
      );

      // Close modal and refresh
      setPaymentModalInvoice(null);
      setPaymentNote("");
      setIsPaymentDirty(false);
      setInvoicesModalRoom(null);
      await fetchDebts();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Ghi nhận thanh toán thất bại");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Rule #10 Modal close handlers
  const handleRequestCloseReminder = () => {
    if (isReminderDirty) {
      setConfirmCloseTarget("reminder");
    } else {
      setReminderModalRoom(null);
      setReminderNote("");
      setIsReminderDirty(false);
    }
  };

  const handleRequestClosePayment = () => {
    if (isPaymentDirty) {
      setConfirmCloseTarget("payment");
    } else {
      setPaymentModalInvoice(null);
      setPaymentNote("");
      setIsPaymentDirty(false);
    }
  };

  const handleConfirmDiscard = () => {
    if (confirmCloseTarget === "reminder") {
      setReminderModalRoom(null);
      setReminderNote("");
      setIsReminderDirty(false);
    } else if (confirmCloseTarget === "payment") {
      setPaymentModalInvoice(null);
      setPaymentNote("");
      setIsPaymentDirty(false);
    }
    setConfirmCloseTarget(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (debtRooms.length === 0) {
      alert("Không có dữ liệu công nợ để xuất.");
      return;
    }

    const headers = [
      "Phòng",
      "Tầng",
      "Khách thuê",
      "Số điện thoại",
      "Số tiền nợ (VND)",
      "Nợ quá hạn (VND)",
      "Số ngày nợ cao nhất",
      "Tình trạng",
      "Số lượng hóa đơn",
    ];

    const rows = debtRooms.map((r) => [
      r.roomNumber,
      r.floor !== null ? `Tầng ${r.floor}` : "-",
      r.tenant?.name || "Chưa có tên",
      r.tenant?.phone || "-",
      r.totalDebtAmount,
      r.overdueAmount,
      r.maxAgingDays,
      r.agingCategory === "bad_debt"
        ? "Nợ xấu"
        : r.agingCategory === "2_months"
        ? "Quá hạn 2 tháng"
        : r.agingCategory === "1_month"
        ? "Quá hạn 1 tháng"
        : "Đến hạn",
      r.invoicesCount,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.map((val) => `"${val}"`).join(","))].join(
        "\n",
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Dormio_Cong_No_${activeBuilding?.name || "ToaNha"}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rule #9 Select All toggle
  const isAllCurrentPageSelected =
    debtRooms.length > 0 && debtRooms.every((r) => selectedRoomIds.includes(r.roomId));

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      setSelectedRoomIds((prev) =>
        prev.filter((id) => !debtRooms.some((r) => r.roomId === id)),
      );
    } else {
      const pageIds = debtRooms.map((r) => r.roomId);
      setSelectedRoomIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
    );
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900">
                Sổ Công Nợ Tiền Phòng
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Theo dõi các khoản nợ tiền phòng quá hạn, tự động phân nhóm theo phòng và gửi nhắc nhở Zalo / SMS (UC-L-16).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={handleTriggerFlip}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Đồng bộ lại hạn nợ và cập nhật trạng thái quá hạn"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} />
            <span>{isRefreshing ? "Đang đồng bộ..." : "Cập nhật nợ"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* ─── Metric KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Debt */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Tổng tiền nợ
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600 tracking-tight block">
              {formatVND(summary.totalDebtAmount)}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium mt-1 block">
              {summary.totalInvoicesCount} hóa đơn chưa thu
            </span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-rose-500/10 transition-all" />
        </div>

        {/* Overdue Debt */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Nợ quá hạn
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 tracking-tight block">
              {formatVND(summary.overdueDebtAmount)}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium mt-1 block">
              Đã vượt ngày hẹn thanh toán
            </span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-all" />
        </div>

        {/* Bad Debt (>60 days) */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Nợ xấu (≥3 tháng)
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-600 tracking-tight block">
              {formatVND(summary.badDebtAmount)}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium mt-1 block">
              {summary.agingDistribution.over60Days} phòng nợ trên 60 ngày
            </span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-all" />
        </div>

        {/* Debtor Rooms */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Khách nợ
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-zinc-900 tracking-tight block">
              {summary.debtorRoomsCount} <span className="text-sm font-bold text-zinc-500">phòng</span>
            </span>
            <span className="text-[11px] text-teal-600 font-bold mt-1 block">
              Tại tòa {activeBuilding?.name || "hiện tại"}
            </span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-teal-500/10 transition-all" />
        </div>
      </div>

      {/* ─── Filter & Control Bar ─────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo số phòng, tên khách thuê, số điện thoại..."
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Duration Filter */}
          <select
            value={durationFilter}
            onChange={(e) => {
              setDurationFilter(e.target.value as typeof durationFilter);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">Tất cả thời gian nợ</option>
            <option value="overdue">Nợ quá hạn</option>
            <option value="1_month">Nợ 1 tháng (≤ 30 ngày)</option>
            <option value="2_months">Nợ 2 tháng (31 - 60 ngày)</option>
            <option value="bad_debt">Nợ từ 3 tháng trở lên (Nợ xấu)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as typeof sortBy);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="debt_desc">Tiền nợ: Cao → Thấp</option>
            <option value="aging_desc">Thời gian nợ: Lâu nhất</option>
            <option value="room_asc">Số phòng: Tăng dần</option>
          </select>

          {/* View Mode Toggle per Rule #9 */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white text-teal-600 shadow-sm font-bold"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
              title="Chế độ lưới (Mặc định)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-white text-teal-600 shadow-sm font-bold"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
              title="Chế độ danh sách / bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Loading / Empty / Content ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-zinc-200 text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
          <p className="text-sm font-bold text-zinc-700">Đang tải dữ liệu công nợ...</p>
          <p className="text-xs text-zinc-400 mt-1">Hệ thống đang đối chiếu các hóa đơn chưa thu.</p>
        </div>
      ) : debtRooms.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-zinc-200 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-zinc-900">Không có dữ liệu công nợ phù hợp</h3>
          <p className="text-xs text-zinc-500 max-w-md mt-1.5">
            {searchTerm || durationFilter !== "all"
              ? "Không tìm thấy phòng nào có khoản nợ thỏa mãn bộ lọc tìm kiếm hiện tại."
              : "Thật tuyệt vời! Tất cả các phòng tại tòa nhà này đều đã thanh toán đủ tiền phòng và dịch vụ."}
          </p>
          {(searchTerm || durationFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setDurationFilter("all");
              }}
              className="mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold text-zinc-700 transition-all"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ─── Grid View (Default per Rule #9) ─────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {debtRooms.map((room) => {
            const isSelected = selectedRoomIds.includes(room.roomId);

            const isBadDebt = room.agingCategory === "bad_debt";
            const is2Months = room.agingCategory === "2_months";

            const badgeBg = isBadDebt
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : is2Months
              ? "bg-rose-100 text-rose-700 border-rose-200"
              : room.maxAgingDays > 0
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-sky-100 text-sky-700 border-sky-200";

            const badgeLabel = isBadDebt
              ? "Nợ xấu (>60 ngày)"
              : is2Months
              ? "Nợ 2 tháng"
              : room.maxAgingDays > 0
              ? `Quá hạn ${room.maxAgingDays} ngày`
              : "Đến hạn thanh toán";

            return (
              <div
                key={room.roomId}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden group ${
                  isSelected ? "border-teal-500 ring-2 ring-teal-500/20" : "border-zinc-200"
                }`}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-zinc-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRoom(room.roomId)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500/20 border-zinc-300 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-zinc-900 group-hover:text-teal-600 transition-colors">
                            Phòng {room.roomNumber}
                          </span>
                          {room.floor !== null && (
                            <span className="text-[10px] font-bold text-zinc-500 px-2 py-0.5 bg-zinc-100 rounded-md">
                              Tầng {room.floor}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 font-medium block">
                          {room.buildingName}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${badgeBg}`}
                    >
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Tenant Details */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">
                          {room.tenant?.name || "Chưa có khách thuê"}
                        </span>
                        {room.tenant?.phone ? (
                          <a
                            href={`tel:${room.tenant.phone}`}
                            className="text-[11px] text-zinc-500 hover:text-teal-600 flex items-center gap-1 font-semibold"
                          >
                            <Phone className="w-3 h-3" />
                            {room.tenant.phone}
                          </a>
                        ) : (
                          <span className="text-[11px] text-zinc-400">Không có số điện thoại</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Số kỳ nợ
                      </span>
                      <span className="text-xs font-black text-zinc-700">
                        {room.invoicesCount} hóa đơn
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Financial Breakdown */}
                <div className="p-5 bg-zinc-50/60 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-zinc-500">Tổng tiền nợ:</span>
                    <span className="text-lg font-black text-rose-600 tracking-tight">
                      {formatVND(room.totalDebtAmount)}
                    </span>
                  </div>

                  {room.overdueAmount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">Trong đó quá hạn:</span>
                      <span className="font-extrabold text-amber-600">
                        {formatVND(room.overdueAmount)}
                      </span>
                    </div>
                  )}

                  {/* Oldest Debt Date */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-200/60">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      Nợ từ ngày:
                    </span>
                    <span className="font-bold text-zinc-700">
                      {new Date(room.oldestDueDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-white border-t border-zinc-100 flex items-center gap-2">
                  <button
                    onClick={() => setInvoicesModalRoom(room)}
                    className="flex-1 py-2 px-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Xem hóa đơn</span>
                  </button>

                  <button
                    onClick={() => {
                      setReminderModalRoom(room);
                      setReminderNote("");
                      setIsReminderDirty(false);
                      setReminderCopied(false);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-teal-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Nhắc nợ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── Table View (Rule #9) ────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 text-zinc-500 uppercase tracking-wider font-extrabold border-b border-zinc-200 text-[11px]">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500/20 border-zinc-300 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Phòng & Khách thuê</th>
                  <th className="p-4">Số điện thoại</th>
                  <th className="p-4 text-right">Tổng tiền nợ</th>
                  <th className="p-4 text-right">Nợ quá hạn</th>
                  <th className="p-4 text-center">Số kỳ</th>
                  <th className="p-4">Nợ từ ngày</th>
                  <th className="p-4 text-center">Tình trạng</th>
                  <th className="p-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {debtRooms.map((room) => {
                  const isSelected = selectedRoomIds.includes(room.roomId);
                  const isBadDebt = room.agingCategory === "bad_debt";
                  const is2Months = room.agingCategory === "2_months";

                  const badgeBg = isBadDebt
                    ? "bg-purple-100 text-purple-700 border-purple-200"
                    : is2Months
                    ? "bg-rose-100 text-rose-700 border-rose-200"
                    : room.maxAgingDays > 0
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-sky-100 text-sky-700 border-sky-200";

                  const badgeLabel = isBadDebt
                    ? "Nợ xấu"
                    : is2Months
                    ? "Nợ 2 tháng"
                    : room.maxAgingDays > 0
                    ? `${room.maxAgingDays} ngày`
                    : "Đến hạn";

                  return (
                    <tr
                      key={room.roomId}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        isSelected ? "bg-teal-50/40" : ""
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRoom(room.roomId)}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500/20 border-zinc-300 cursor-pointer"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs">
                            {room.roomNumber}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block">
                              Phòng {room.roomNumber}
                              {room.floor !== null && (
                                <span className="text-[10px] text-zinc-400 font-normal ml-1.5">
                                  (Tầng {room.floor})
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-medium">
                              {room.tenant?.name || "Chưa có người thuê"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        {room.tenant?.phone ? (
                          <a
                            href={`tel:${room.tenant.phone}`}
                            className="text-xs text-zinc-700 hover:text-teal-600 font-semibold"
                          >
                            {room.tenant.phone}
                          </a>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <span className="font-black text-rose-600 text-sm">
                          {formatVND(room.totalDebtAmount)}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <span className="font-extrabold text-amber-600">
                          {formatVND(room.overdueAmount)}
                        </span>
                      </td>

                      <td className="p-4 text-center font-bold text-zinc-700">
                        {room.invoicesCount} kỳ
                      </td>

                      <td className="p-4 text-zinc-600 font-medium">
                        {new Date(room.oldestDueDate).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${badgeBg}`}
                        >
                          {badgeLabel}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setInvoicesModalRoom(room)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all"
                            title="Xem chi tiết hóa đơn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setReminderModalRoom(room);
                              setReminderNote("");
                              setIsReminderDirty(false);
                              setReminderCopied(false);
                            }}
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-all font-bold"
                            title="Gửi nhắc nợ Zalo / App"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Rule #9 Pagination Bar ───────────────────────────────────────────── */}
      {debtRooms.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span>Hiển thị</span>
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= 100) {
                  setPageSize(val);
                  setCurrentPage(1);
                }
              }}
              className="w-14 px-2 py-1 text-center font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <span>/ trang</span>
            <span className="text-zinc-300">|</span>
            <span>
              {startIndex} - {endIndex} trên <span className="font-bold text-zinc-800">{totalRecords}</span> phòng nợ
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {visiblePages.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  backgroundColor: pageNum === currentPage ? "#2AC1BC" : undefined,
                }}
                className={`min-w-[36px] h-9 px-3 rounded-xl text-xs font-bold transition-all ${
                  pageNum === currentPage
                    ? "text-white shadow-sm shadow-[#2AC1BC]/30"
                    : "text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal 1: Invoices List for Room ──────────────────────────────────── */}
      {invoicesModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-black text-zinc-900">
                    Danh Sách Hóa Đơn Nợ — Phòng {invoicesModalRoom.roomNumber}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Khách thuê:{" "}
                  <span className="font-bold text-zinc-800">
                    {invoicesModalRoom.tenant?.name || "Chưa có tên"}
                  </span>{" "}
                  • SĐT:{" "}
                  <span className="font-bold text-zinc-800">
                    {invoicesModalRoom.tenant?.phone || "Chưa có"}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setInvoicesModalRoom(null)}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/60 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoices List */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-rose-700 uppercase tracking-wider block">
                    Tổng dư nợ cần thanh toán
                  </span>
                  <span className="text-2xl font-black text-rose-600">
                    {formatVND(invoicesModalRoom.totalDebtAmount)}
                  </span>
                </div>
                <span className="px-3 py-1 bg-white text-rose-600 font-black text-xs rounded-full border border-rose-200 shadow-sm">
                  {invoicesModalRoom.invoicesCount} kỳ hóa đơn
                </span>
              </div>

              <div className="space-y-3">
                {invoicesModalRoom.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl border border-zinc-200 bg-white hover:border-teal-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-zinc-900">
                          Kỳ {inv.period}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            inv.status === "overdue"
                              ? "bg-rose-100 text-rose-700 border-rose-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                          }`}
                        >
                          {inv.status === "overdue" ? "Quá hạn" : "Chưa thu"}
                        </span>
                        {inv.agingDays > 0 && (
                          <span className="text-[10px] font-bold text-zinc-400">
                            (Quá hạn {inv.agingDays} ngày)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 mt-1 block">
                        Hạn thanh toán: {new Date(inv.dueDate).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-base font-black text-rose-600">
                        {formatVND(inv.totalAmount)}
                      </span>

                      <button
                        onClick={() => {
                          setPaymentModalInvoice({
                            id: inv.id,
                            period: inv.period,
                            totalAmount: inv.totalAmount,
                            roomNumber: invoicesModalRoom.roomNumber,
                          });
                          setPaymentMethod("cash");
                          setPaymentNote("");
                          setIsPaymentDirty(false);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all border border-emerald-200 flex items-center gap-1 active:scale-95"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Thu tiền ngay</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end">
              <button
                onClick={() => setInvoicesModalRoom(null)}
                className="px-5 py-2.5 bg-white border border-zinc-300 text-zinc-700 font-bold rounded-xl text-xs hover:bg-zinc-100 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Send Debt Reminder ─────────────────────────────────────── */}
      {reminderModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-black">
                    Nhắc Nợ Tiền Phòng — P.{reminderModalRoom.roomNumber}
                  </h3>
                  <p className="text-xs text-teal-100">
                    Gửi thông báo ứng dụng hoặc sao chép tin nhắn gửi qua Zalo / SMS
                  </p>
                </div>
              </div>

              <button
                onClick={handleRequestCloseReminder}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {reminderSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{reminderSuccessMessage}</span>
                </div>
              )}

              {/* Tenant info banner */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Khách nhận</span>
                  <span className="font-extrabold text-zinc-800 block">
                    {reminderModalRoom.tenant?.name || "Chưa có tên"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Số điện thoại</span>
                  <span className="font-extrabold text-zinc-800 block">
                    {reminderModalRoom.tenant?.phone || "Chưa có"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Số tiền nợ</span>
                  <span className="font-black text-rose-600 block text-sm">
                    {formatVND(reminderModalRoom.totalDebtAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Số kỳ nợ</span>
                  <span className="font-extrabold text-zinc-800 block">
                    {reminderModalRoom.invoicesCount} kỳ hóa đơn
                  </span>
                </div>
              </div>

              {/* Custom Memo Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">
                  Ghi chú thêm từ chủ trọ (tùy chọn)
                </label>
                <input
                  type="text"
                  value={reminderNote}
                  onChange={(e) => {
                    setReminderNote(e.target.value);
                    setIsReminderDirty(true);
                  }}
                  placeholder="Ví dụ: Vui lòng thanh toán trước 18h ngày 20 để tránh phạt chậm..."
                  className="w-full px-3.5 py-2 text-xs text-zinc-800 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Message Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Nội dung tin nhắn mẫu
                  </label>
                  <button
                    onClick={() => handleCopyReminder(reminderModalRoom)}
                    className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    {reminderCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép Zalo / SMS</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                  {buildReminderText(reminderModalRoom, reminderNote)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2.5">
              <button
                onClick={handleRequestCloseReminder}
                className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 font-bold rounded-xl text-xs hover:bg-zinc-100 transition-all"
              >
                Hủy bỏ
              </button>

              <button
                disabled={isSendingReminder}
                onClick={() => handleSendInAppReminder(reminderModalRoom)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-teal-600/20 disabled:opacity-50"
              >
                {isSendingReminder ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Gửi qua App Dormio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Manual Payment Recording ────────────────────────────────── */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-zinc-900">
                  Ghi Nhận Thu Tiền Phòng {paymentModalInvoice.roomNumber}
                </h3>
              </div>
              <button
                onClick={handleRequestClosePayment}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <span className="text-[11px] font-extrabold text-emerald-700 uppercase block">
                  Số tiền thu (Kỳ {paymentModalInvoice.period})
                </span>
                <span className="text-2xl font-black text-emerald-700 block mt-1">
                  {formatVND(paymentModalInvoice.totalAmount)}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Hình thức thanh toán</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cash");
                      setIsPaymentDirty(true);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === "cash"
                        ? "bg-teal-50 border-teal-500 text-teal-700"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("banking");
                      setIsPaymentDirty(true);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === "banking"
                        ? "bg-teal-50 border-teal-500 text-teal-700"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    Chuyển khoản ngoài
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Ghi chú thanh toán (tùy chọn)</label>
                <textarea
                  rows={2}
                  value={paymentNote}
                  onChange={(e) => {
                    setPaymentNote(e.target.value);
                    setIsPaymentDirty(true);
                  }}
                  placeholder="Ví dụ: Khách trả tiền mặt tại phòng..."
                  className="w-full px-3 py-2 text-xs text-zinc-800 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2.5">
              <button
                onClick={handleRequestClosePayment}
                className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 font-bold rounded-xl text-xs hover:bg-zinc-100 transition-all"
              >
                Hủy bỏ
              </button>

              <button
                disabled={isSubmittingPayment}
                onClick={handleRecordPayment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSubmittingPayment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Xác nhận thu tiền</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Rule #10: Unsaved Changes Confirmation Modal ─────────────────────── */}
      {confirmCloseTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-zinc-900">Xác nhận đóng form</h4>
              <p className="text-xs text-zinc-500 mt-1">
                Bạn có thay đổi chưa được lưu. Nếu đóng ngay bây giờ, các thông tin vừa nhập sẽ bị hủy bỏ.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmCloseTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm shadow-rose-600/20"
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
