"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Receipt,
  Wallet,
  LayoutGrid,
  List,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Trash2,
  Edit3,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Lock,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import {
  expenseService,
  ExpenseItem,
  ExpensesSummary,
  CreateExpensePayload,
} from "@/services/expense.service";
import { getRooms, RoomItem } from "@/services/room.service";

// Large Money Formatter Helper
const formatLargeMoney = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, "")} Tỷ ₫`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, "")}M ₫`;
  }
  return `${amount.toLocaleString("vi-VN")} ₫`;
};

export default function ExpensesPage() {
  const { activeBuilding } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([]);
  const [summary, setSummary] = useState<ExpensesSummary>({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    canceledAmount: 0,
    totalCount: 0,
    paidCount: 0,
    pendingCount: 0,
  });

  // Rule #9: Default Grid view (Grid=6, Table=10)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [pageSize, setPageSize] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Filters
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");
  const [activeStatusTab, setActiveStatusTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals state
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [deletingExpenseTarget, setDeletingExpenseTarget] = useState<ExpenseItem | null>(null);
  const [lockedExpenseTarget, setLockedExpenseTarget] = useState<ExpenseItem | null>(null);

  // Form State for Create / Edit
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    category: "Bảo trì & Sửa chữa",
    amount: "",
    roomScope: "property" as "property" | "room",
    roomId: "",
    status: "paid" as "paid" | "pending",
    paidAt: new Date().toISOString().split("T")[0],
    description: "",
  });

  // Rule #10: Form Dirty State & Confirmation Modal
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<"create" | "edit" | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update default pageSize on viewMode change per Rule #9
  useEffect(() => {
    setPageSize(viewMode === "grid" ? 6 : 10);
    setCurrentPage(1);
  }, [viewMode]);

  // Load available rooms for active building
  useEffect(() => {
    if (!activeBuilding?.id) return;
    getRooms(activeBuilding.id)
      .then((res) => {
        if (res?.data) {
          setAvailableRooms(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load rooms:", err);
      });
  }, [activeBuilding?.id]);

  // Fetch expenses from API (UC-L-17)
  const fetchExpenses = useCallback(async () => {
    if (!activeBuilding?.id) return;
    try {
      setIsLoading(true);
      const res = await expenseService.getExpenses(activeBuilding.id, {
        search: searchTerm,
        category: activeCategoryTab,
        status: activeStatusTab,
        page: currentPage,
        limit: pageSize,
      });

      if (res && res.success) {
        setExpensesList(res.data || []);
        setSummary(res.summary);
        setTotalRecords(res.meta.total || 0);
      }
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeBuilding?.id,
    searchTerm,
    activeCategoryTab,
    activeStatusTab,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Categories list
  const categoriesList = [
    "all",
    "Bảo trì & Sửa chữa",
    "Điện nước & Dịch vụ",
    "Vệ sinh & An ninh",
    "Trang thiết bị",
    "Chi phí khác",
  ];

  const resetForm = () => {
    setExpenseForm({
      name: "",
      category: "Bảo trì & Sửa chữa",
      amount: "",
      roomScope: "property",
      roomId: "",
      status: "paid",
      paidAt: new Date().toISOString().split("T")[0],
      description: "",
    });
    setIsFormDirty(false);
  };

  // Rule #10 Request Close Modal Handler
  const requestCloseModal = (target: "create" | "edit") => {
    if (isFormDirty) {
      setConfirmCloseTarget(target);
    } else {
      if (target === "create") setShowCreateModal(false);
      if (target === "edit") setEditingExpense(null);
      resetForm();
    }
  };

  const handleConfirmCloseModal = () => {
    if (confirmCloseTarget === "create") setShowCreateModal(false);
    if (confirmCloseTarget === "edit") setEditingExpense(null);
    setConfirmCloseTarget(null);
    resetForm();
  };

  // Open Edit Modal
  const openEditModal = (expense: ExpenseItem) => {
    if (expense.status === "paid") {
      setLockedExpenseTarget(expense);
      return;
    }
    setEditingExpense(expense);
    setExpenseForm({
      name: expense.name,
      category: expense.category,
      amount: String(expense.amount),
      roomScope: expense.roomId ? "room" : "property",
      roomId: expense.roomId || "",
      status: expense.status === "canceled" ? "pending" : expense.status,
      paidAt: expense.paidAt ? expense.paidAt.split("T")[0] : new Date().toISOString().split("T")[0],
      description: expense.description || "",
    });
    setIsFormDirty(false);
  };

  // Create Expense Submission (UC-L-17)
  const handleCreateExpense = async () => {
    if (!activeBuilding?.id) return;
    if (!expenseForm.name.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert("Vui lòng điền đầy đủ Tên khoản chi và Số tiền hợp lệ.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateExpensePayload = {
        name: expenseForm.name.trim(),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        paidAt: new Date(expenseForm.paidAt).toISOString(),
        status: expenseForm.status,
        roomId: expenseForm.roomScope === "room" ? expenseForm.roomId || null : null,
        description: expenseForm.description.trim() || undefined,
      };

      await expenseService.createExpense(activeBuilding.id, payload);
      setShowCreateModal(false);
      resetForm();
      await fetchExpenses();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Không thể tạo khoản chi phí.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Expense Submission (UC-L-17)
  const handleUpdateExpense = async () => {
    if (!activeBuilding?.id || !editingExpense) return;
    if (!expenseForm.name.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert("Vui lòng điền đầy đủ Tên khoản chi và Số tiền hợp lệ.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: expenseForm.name.trim(),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        paidAt: new Date(expenseForm.paidAt).toISOString(),
        status: expenseForm.status,
        roomId: expenseForm.roomScope === "room" ? expenseForm.roomId || null : null,
        description: expenseForm.description.trim() || undefined,
      };

      await expenseService.updateExpense(activeBuilding.id, editingExpense.id, payload);
      setEditingExpense(null);
      resetForm();
      await fetchExpenses();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Không thể cập nhật khoản chi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark as Paid
  const handleMarkAsPaid = async (id: string) => {
    if (!activeBuilding?.id) return;
    try {
      await expenseService.updateExpense(activeBuilding.id, id, {
        status: "paid",
        paidAt: new Date().toISOString(),
      });
      if (selectedExpense?.id === id) {
        setSelectedExpense((prev) => (prev ? { ...prev, status: "paid" } : null));
      }
      await fetchExpenses();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Không thể cập nhật trạng thái thanh toán.");
    }
  };

  // Delete Expense
  const handleDeleteExpense = (expense: ExpenseItem) => {
    if (expense.status === "paid") {
      setLockedExpenseTarget(expense);
      return;
    }
    setDeletingExpenseTarget(expense);
  };

  const confirmDeleteExpense = async () => {
    if (!activeBuilding?.id || !deletingExpenseTarget) return;
    try {
      await expenseService.deleteExpense(activeBuilding.id, deletingExpenseTarget.id);
      if (selectedExpense?.id === deletingExpenseTarget.id) setSelectedExpense(null);
      setDeletingExpenseTarget(null);
      await fetchExpenses();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Không thể xóa khoản chi phí.");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (expensesList.length === 0) {
      alert("Không có dữ liệu chi phí để xuất.");
      return;
    }

    const headers = [
      "Mã Chi Phí",
      "Tên Khoản Chi",
      "Danh Mục",
      "Phạm Vi",
      "Số Tiền (VND)",
      "Trạng Thái",
      "Ngày Chi",
      "Ghi Chú",
    ];

    const rows = expensesList.map((exp) => [
      exp.code,
      exp.name,
      exp.category,
      exp.roomName,
      exp.amount,
      exp.status === "paid" ? "Đã thanh toán" : exp.status === "pending" ? "Chờ thanh toán" : "Đã hủy",
      exp.paidAt ? exp.paidAt.split("T")[0] : "",
      exp.description || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Dormio_ChiPhi_${activeBuilding?.name || "ToaNha"}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rule #9 Pagination Calculation with 5-page window jumping
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

  // Status Badge Helper
  const renderStatusBadge = (status: ExpenseItem["status"]) => {
    if (status === "paid") {
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#2AC1BC]/15 text-[#0d6e6b] border border-[#2AC1BC]/30 flex items-center gap-1 shrink-0">
          <Check className="w-3 h-3" /> Đã thanh toán
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3 text-amber-500" /> Chờ thanh toán
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 flex items-center gap-1 shrink-0">
        <X className="w-3 h-3" /> Đã hủy
      </span>
    );
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Top Header & Actions Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#2AC1BC]" /> Quản Lý Chi Phí Vận Hành
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
            Theo dõi hóa đơn dịch vụ, chi phí bảo trì &amp; mua sắm thiết bị tòa nhà (UC-L-17).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={fetchExpenses}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#2AC1BC]" : ""}`} />
            <span>Tải lại</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" /> Thêm Khoản Chi Mới
          </button>
        </div>
      </div>

      {/* ─── Dark Hero Summary Banner ────────────────────────────────────────── */}
      <div className="bg-zinc-900 rounded-3xl p-5 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Wallet className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Left Title, Address Pill */}
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              {activeBuilding?.name || "Tòa Nhà"}
            </h2>

            {activeBuilding?.address && (
              <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all max-w-full">
                <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                <span className="text-xs font-bold text-zinc-200 truncate max-w-[200px] sm:max-w-none">
                  {activeBuilding.address}
                </span>
              </div>
            )}

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Kiểm soát ngân sách chi phí vận hành, bảo trì thiết bị và hóa đơn phát sinh minh bạch cho tòa nhà.
            </p>
          </div>

          {/* Right Stat Cards */}
          <div className="w-full lg:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full">
              {/* Card 1: Tổng Chi Phí */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[130px]">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-rose-400 tracking-wider whitespace-nowrap">
                    TỔNG CHI PHÍ
                  </span>
                  <span className="font-black text-rose-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(summary.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Card 2: Đã Thanh Toán */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-2xl border border-[#2AC1BC]/30 backdrop-blur-md min-w-[130px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-[#2AC1BC] tracking-wider whitespace-nowrap">
                    ĐÃ THANH TOÁN
                  </span>
                  <span className="font-black text-[#2AC1BC] text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(summary.paidAmount)}
                  </span>
                </div>
              </div>

              {/* Card 3: Chờ Thanh Toán */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-amber-500/10 hover:bg-amber-500/20 transition-colors rounded-2xl border border-amber-500/30 backdrop-blur-md min-w-[130px]">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-wider whitespace-nowrap">
                    CHỜ THANH TOÁN
                  </span>
                  <span className="font-black text-amber-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(summary.pendingAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Filter & Control Bar ───────────────────────────────────────── */}
      <div className="bg-white p-3.5 sm:p-4 border border-zinc-200/80 rounded-2xl shadow-sm space-y-3.5">
        {/* Category Switcher Horizontal Scroll */}
        <div className="overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 flex items-center gap-1.5 border-b border-zinc-100 pb-3">
          <span className="text-zinc-400 text-[11px] font-extrabold uppercase mr-1 hidden sm:inline shrink-0">
            Danh mục:
          </span>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategoryTab(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeCategoryTab === cat
                  ? "bg-[#2AC1BC] text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              {cat === "all" ? `Tất cả danh mục (${summary.totalCount})` : cat}
            </button>
          ))}
        </div>

        {/* Search Box & View Switcher Bar */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm mã chi phí, tên khoản chi, phòng, ghi chú..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8.5 pr-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all truncate"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Switcher (Grid vs Table) per Rule #9 */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
              title="Dạng Lưới (Grid)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
              title="Dạng Bảng (Table)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status Filter Pills Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <button
            onClick={() => {
              setActiveStatusTab("all");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeStatusTab === "all"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => {
              setActiveStatusTab("paid");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeStatusTab === "paid"
                ? "bg-[#2AC1BC] text-white"
                : "bg-[#2AC1BC]/10 text-[#0d6e6b] hover:bg-[#2AC1BC]/20"
            }`}
          >
            Đã thanh toán
          </button>
          <button
            onClick={() => {
              setActiveStatusTab("pending");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeStatusTab === "pending"
                ? "bg-amber-500 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Chờ thanh toán
          </button>
          <button
            onClick={() => {
              setActiveStatusTab("canceled");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeStatusTab === "canceled"
                ? "bg-rose-500 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Đã hủy
          </button>
        </div>
      </div>

      {/* ─── Main Content Display (Grid or Table View) ───────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-zinc-200 text-center">
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin mb-3" />
          <p className="text-sm font-bold text-zinc-700">Đang tải danh sách chi phí...</p>
        </div>
      ) : expensesList.length === 0 ? (
        <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl space-y-3">
          <Wallet className="w-12 h-12 text-zinc-300 mx-auto stroke-1" />
          <h3 className="font-extrabold text-sm text-zinc-800">
            Không tìm thấy khoản chi phí nào phù hợp
          </h3>
          <p className="text-xs text-zinc-400">
            Thử chọn danh mục khác, nhập cụm từ tìm kiếm mới hoặc tạo khoản chi phí đầu tiên.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm khoản chi mới
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9 Default) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expensesList.map((exp) => (
            <div
              key={exp.id}
              className="bg-white border border-zinc-200/80 hover:border-[#2AC1BC]/40 rounded-2xl p-4 space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                    <span className="font-black text-xs text-zinc-900">{exp.code}</span>
                  </div>
                  {renderStatusBadge(exp.status)}
                </div>

                <div>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200 inline-block mb-1.5">
                    {exp.category}
                  </span>
                  <h4 className="font-black text-sm text-zinc-900 leading-snug line-clamp-2">
                    {exp.name}
                  </h4>
                </div>

                {/* Amount Highlight */}
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-rose-800 uppercase">
                    Số tiền chi
                  </span>
                  <span className="text-base font-black text-rose-600 whitespace-nowrap">
                    -{exp.amount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                {/* Scope & Date Meta */}
                <div className="space-y-1.5 text-xs text-zinc-600 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Phạm vi:</span>
                    <span className="font-extrabold text-zinc-800">{exp.roomName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Ngày ghi nhận:</span>
                    <span className="font-semibold text-zinc-700">
                      {new Date(exp.paidAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedExpense(exp)}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex-1 text-center"
                >
                  Xem chi tiết
                </button>

                {exp.status === "pending" && (
                  <button
                    onClick={() => handleMarkAsPaid(exp.id)}
                    className="px-3 py-1.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    title="Đánh dấu đã thanh toán"
                  >
                    Đã trả
                  </button>
                )}

                <div className="flex items-center gap-1">
                  {exp.status === "paid" ? (
                    <button
                      onClick={() => openEditModal(exp)}
                      className="p-1.5 text-zinc-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Khoản chi đã thanh toán - Click để xem chi tiết khóa"
                    >
                      <Lock className="w-4 h-4 text-amber-500" />
                    </button>
                  ) : (
                    <button
                      onClick={() => openEditModal(exp)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteExpense(exp)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Xóa khoản chi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs min-w-[720px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-extrabold uppercase tracking-wider text-[10px] whitespace-nowrap">
                  <th className="py-3 px-3.5 sm:px-4 min-w-[130px]">Mã Chi Phí</th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[220px]">Tên &amp; Danh Mục</th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[120px]">Phạm Vi</th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[110px]">Ngày Ghi Nhận</th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[130px]">Số Tiền</th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[120px]">Trạng Thái</th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[110px] text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                {expensesList.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-3.5 sm:px-4 font-black text-zinc-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                        <span>{exp.code}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4">
                      <div className="min-w-[180px] max-w-[260px]">
                        <div className="font-extrabold text-zinc-900 text-xs leading-snug line-clamp-2">
                          {exp.name}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                          {exp.category}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 font-bold text-zinc-800 whitespace-nowrap">
                      {exp.roomName}
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 text-zinc-600 whitespace-nowrap">
                      {new Date(exp.paidAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 font-black text-rose-600 whitespace-nowrap">
                      -{exp.amount.toLocaleString("vi-VN")} ₫
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap">
                      {renderStatusBadge(exp.status)}
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedExpense(exp)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
                        >
                          Chi tiết
                        </button>
                        {exp.status === "paid" ? (
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1 text-zinc-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Khoản chi đã thanh toán - Click để xem chi tiết khóa"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {exp.status === "paid" ? (
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1 text-zinc-300 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Khoản chi đã thanh toán - Đã khóa không thể xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-zinc-300 hover:text-amber-500" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteExpense(exp)}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa khoản chi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Rule #9 Pagination Bar ───────────────────────────────────────────── */}
      {expensesList.length > 0 && (
        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500 font-medium">
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
              className="w-14 px-2 py-1 text-center font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2AC1BC]"
            />
            <span>/ trang</span>
            <span className="text-zinc-300">|</span>
            <span>
              {startIndex} - {endIndex} trên <span className="font-bold text-zinc-800">{totalRecords}</span> khoản chi
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                className={`min-w-[36px] h-9 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pageNum === currentPage
                    ? "text-white shadow-sm shadow-[#2AC1BC]/30"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal 1: View Detail Lightbox ───────────────────────────────────── */}
      {selectedExpense && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedExpense(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-[#2AC1BC]/5 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                <div className="p-2 sm:p-2.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl shadow-xs shrink-0">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base text-zinc-900 truncate">
                    Chi Tiết Khoản Chi {selectedExpense.code}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 font-semibold truncate">
                    {selectedExpense.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedExpense(null)}
                className="p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar text-xs">
              {/* Financial Highlight Box */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#0f5351] text-white rounded-2xl sm:rounded-3xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                    Số Tiền Thanh Toán
                  </span>
                  <span className="text-xs text-zinc-300 font-semibold whitespace-nowrap">
                    Ngày:{" "}
                    <strong className="text-white font-black whitespace-nowrap">
                      {new Date(selectedExpense.paidAt).toLocaleDateString("vi-VN")}
                    </strong>
                  </span>
                </div>

                <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-black text-[#2AC1BC] tracking-tight whitespace-nowrap">
                  <span>-{selectedExpense.amount.toLocaleString("vi-VN")}</span>
                  <span className="text-xl sm:text-2xl font-bold">₫</span>
                </div>

                <div className="pt-2.5 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-medium flex items-center justify-between gap-2">
                  <span className="shrink-0">Tên khoản chi:</span>
                  <strong className="text-white font-black text-right line-clamp-1">
                    {selectedExpense.name}
                  </strong>
                </div>
              </div>

              {/* Expense Details Breakdown Card */}
              <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-zinc-600 gap-2">
                  <span className="font-semibold text-zinc-500 shrink-0">Phạm vi áp dụng:</span>
                  <span className="font-black text-zinc-900 truncate">
                    {selectedExpense.roomName}
                  </span>
                </div>

                <div className="flex justify-between items-center text-zinc-600 border-t border-zinc-200/60 pt-2 gap-2">
                  <span className="font-semibold text-zinc-500 shrink-0">Trạng thái thanh toán:</span>
                  <div className="shrink-0">{renderStatusBadge(selectedExpense.status)}</div>
                </div>

                {selectedExpense.description && (
                  <div className="border-t border-zinc-200/60 pt-2.5 space-y-1">
                    <span className="font-extrabold text-zinc-700 block">Ghi chú chi tiết:</span>
                    <p className="text-zinc-600 leading-relaxed bg-white p-3 rounded-xl border border-zinc-200/80">
                      {selectedExpense.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3.5 sm:p-4 border-t border-zinc-100 bg-white flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer text-center whitespace-nowrap"
              >
                Đóng
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {selectedExpense.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsPaid(selectedExpense.id)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Check className="w-4 h-4 shrink-0" /> Đã Thanh Toán
                  </button>
                )}

                {selectedExpense.status === "paid" ? (
                  <button
                    onClick={() => openEditModal(selectedExpense)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 border border-amber-200 transition-all whitespace-nowrap"
                    title="Khoản chi đã thanh toán - Click để xem lý do khóa"
                  >
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" /> Đã Khóa Sửa
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const expToEdit = selectedExpense;
                      setSelectedExpense(null);
                      openEditModal(expToEdit);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Edit3 className="w-4 h-4 shrink-0" /> Chỉnh Sửa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Create / Edit Expense Modal ────────────────────────────── */}
      {(showCreateModal || editingExpense) && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseModal(showCreateModal ? "create" : "edit");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 via-white to-teal-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">
                    {showCreateModal
                      ? "Thêm Khoản Chi Phí Mới"
                      : `Chỉnh Sửa Khoản Chi ${editingExpense?.code}`}
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold">Ghi nhận chi phí vận hành tòa nhà</p>
                </div>
              </div>

              <button
                onClick={() => requestCloseModal(showCreateModal ? "create" : "edit")}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                  Tên Khoản Chi *
                </label>
                <input
                  type="text"
                  value={expenseForm.name}
                  onChange={(e) => {
                    setExpenseForm({ ...expenseForm, name: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder="Ví dụ: Thay bóng đèn hành lang Tầng 2, Phí thu gom rác..."
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    Danh Mục Chi *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, category: e.target.value });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] focus:bg-white text-xs cursor-pointer"
                  >
                    <option value="Bảo trì & Sửa chữa">Bảo trì &amp; Sửa chữa</option>
                    <option value="Điện nước & Dịch vụ">Điện nước &amp; Dịch vụ</option>
                    <option value="Vệ sinh & An ninh">Vệ sinh &amp; An ninh</option>
                    <option value="Trang thiết bị">Trang thiết bị</option>
                    <option value="Chi phí khác">Chi phí khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    Số Tiền (VNĐ) *
                  </label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, amount: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-black text-zinc-900 focus:outline-none focus:border-[#2AC1BC] focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    Phạm Vi Áp Dụng *
                  </label>
                  <select
                    value={expenseForm.roomScope}
                    onChange={(e) => {
                      const newScope = e.target.value as "property" | "room";
                      setExpenseForm({
                        ...expenseForm,
                        roomScope: newScope,
                        roomId: newScope === "room" && availableRooms.length > 0 ? availableRooms[0].id : "",
                      });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] focus:bg-white text-xs cursor-pointer"
                  >
                    <option value="property">Toàn tòa nhà (Chi phí chung)</option>
                    <option value="room">Phòng cụ thể</option>
                  </select>
                </div>

                {expenseForm.roomScope === "room" ? (
                  <div>
                    <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                      Chọn Phòng *
                    </label>
                    <select
                      value={expenseForm.roomId}
                      onChange={(e) => {
                        setExpenseForm({ ...expenseForm, roomId: e.target.value });
                        setIsFormDirty(true);
                      }}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] focus:bg-white text-xs cursor-pointer"
                    >
                      <option value="">-- Chọn phòng --</option>
                      {availableRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          Phòng {r.roomNumber} (Tầng {r.floor})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                      Trạng Thái Thanh Toán *
                    </label>
                    <select
                      value={expenseForm.status}
                      onChange={(e) => {
                        setExpenseForm({ ...expenseForm, status: e.target.value as "paid" | "pending" });
                        setIsFormDirty(true);
                      }}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] focus:bg-white text-xs cursor-pointer"
                    >
                      <option value="paid">Đã thanh toán (Paid)</option>
                      <option value="pending">Chờ thanh toán (Pending)</option>
                    </select>
                  </div>
                )}
              </div>

              {expenseForm.roomScope === "room" && (
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    Trạng Thái Thanh Toán *
                  </label>
                  <select
                    value={expenseForm.status}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, status: e.target.value as "paid" | "pending" });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] focus:bg-white text-xs cursor-pointer"
                  >
                    <option value="paid">Đã thanh toán (Paid)</option>
                    <option value="pending">Chờ thanh toán (Pending)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                  Ngày Ghi Nhận / Thanh Toán *
                </label>
                <input
                  type="date"
                  value={expenseForm.paidAt}
                  onChange={(e) => {
                    setExpenseForm({ ...expenseForm, paidAt: e.target.value });
                    setIsFormDirty(true);
                  }}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                  Ghi Chú Bổ Sung
                </label>
                <textarea
                  rows={2}
                  value={expenseForm.description}
                  onChange={(e) => {
                    setExpenseForm({ ...expenseForm, description: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder="Ghi chú thêm về đơn vị cung cấp, mã hóa đơn hoặc lý do phát sinh chi phí..."
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC] text-xs"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 bg-white flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => requestCloseModal(showCreateModal ? "create" : "edit")}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer text-center"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={showCreateModal ? handleCreateExpense : handleUpdateExpense}
                className="px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{showCreateModal ? "Lưu Khoản Chi Phí" : "Cập Nhật Khoản Chi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Rule #10 Unsaved Changes Confirmation Modal ────────────── */}
      {confirmCloseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-base text-zinc-900">Xác nhận đóng form?</h4>
              <p className="text-xs text-zinc-500 font-medium mt-1">
                Các thông tin chi phí vừa nhập chưa được lưu. Bạn có chắc muốn hủy bỏ không?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmCloseTarget(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục nhập
              </button>

              <button
                onClick={handleConfirmCloseModal}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                Hủy &amp; Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 4: Delete Confirmation Pop-up Modal ────────────────────────── */}
      {deletingExpenseTarget && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingExpenseTarget(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-150 cursor-default">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-base text-zinc-900">Xác nhận xóa khoản chi?</h4>
              <p className="text-xs text-zinc-500 font-medium mt-1.5 leading-relaxed">
                Bạn có chắc muốn xóa khoản chi{" "}
                <strong className="text-zinc-900 font-extrabold">{deletingExpenseTarget.name}</strong> (
                <span className="text-rose-600 font-bold">{deletingExpenseTarget.code}</span>)? Thao tác này
                không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingExpenseTarget(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                onClick={confirmDeleteExpense}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                Xóa khoản chi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 5: Locked Paid Expense Pop-up Modal ────────────────────────── */}
      {lockedExpenseTarget && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setLockedExpenseTarget(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-150 cursor-default">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-base text-zinc-900">Khoản chi đã được khóa</h4>
              <p className="text-xs text-zinc-500 font-medium mt-1.5 leading-relaxed">
                Khoản chi{" "}
                <strong className="text-zinc-900 font-extrabold">{lockedExpenseTarget.name}</strong> (
                <span className="text-[#2AC1BC] font-bold">{lockedExpenseTarget.code}</span>) đã thanh toán
                hoàn tất nên hệ thống khóa tính năng chỉnh sửa để đảm bảo tính minh bạch sổ sách.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setLockedExpenseTarget(null)}
                className="w-full py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}