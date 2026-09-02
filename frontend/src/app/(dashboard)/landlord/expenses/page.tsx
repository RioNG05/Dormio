"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Receipt,
  MoreHorizontal,
  Building2,
  ChevronDown,
  Wallet,
  LayoutGrid,
  List,
  Calendar,
  DollarSign,
  Check,
  X,
  FileText,
  AlertTriangle,
  Trash2,
  Edit3,
  Filter,
  Wrench,
  Sparkles,
  Clock,
  ArrowRight,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

// Define Expense Entity Interface according to Spec UC-L-17 & Prisma Schema
export interface ExpenseItem {
  id: string;
  code: string;
  name: string;
  category: "Bảo trì & Sửa chữa" | "Điện nước & Dịch vụ" | "Vệ sinh & An ninh" | "Trang thiết bị" | "Chi phí khác";
  amount: number;
  roomId?: string; // Optional: specific room or property-wide
  roomName: string; // "-" for property-wide
  status: "paid" | "pending" | "canceled";
  paidAt: string; // YYYY-MM-DD
  createdAt: string;
  description?: string;
  supplier?: string;
  paymentMethod?: "Tiền mặt" | "Chuyển khoản VietQR" | "Ví điện tử";
}

// Initial Mock Expenses for Dormio Premier
const initialExpenses: ExpenseItem[] = [
  {
    id: "exp-001",
    code: "CP-202608-01",
    name: "Bảo trì & Kiểm định Thang máy Định kỳ",
    category: "Bảo trì & Sửa chữa",
    amount: 1500000,
    roomName: "Toàn tòa nhà",
    status: "paid",
    paidAt: "2026-08-15",
    createdAt: "2026-08-15",
    description: "Bảo dưỡng hệ thống cáp và phanh khẩn cấp thang máy Schindler.",
    supplier: "Công ty Thang máy Schindler Việt Nam",
    paymentMethod: "Chuyển khoản VietQR",
  },
  {
    id: "exp-002",
    code: "CP-202608-02",
    name: "Thay Vòi Sen & Sửa Đèn Ban Công",
    category: "Bảo trì & Sửa chữa",
    amount: 450000,
    roomId: "rm-102",
    roomName: "Phòng 102",
    status: "paid",
    paidAt: "2026-08-18",
    createdAt: "2026-08-18",
    description: "Thay cụm vòi sen inox 304 và bóng đèn LED 15W ban công theo yêu cầu khách.",
    supplier: "Cửa hàng Điện nước Minh Phát",
    paymentMethod: "Tiền mặt",
  },
  {
    id: "exp-003",
    code: "CP-202608-03",
    name: "Hóa Đơn Điện Công Cộng & Sảnh Tháng 7",
    category: "Điện nước & Dịch vụ",
    amount: 2850000,
    roomName: "Toàn tòa nhà",
    status: "paid",
    paidAt: "2026-08-20",
    createdAt: "2026-08-20",
    description: "Tiền điện chạy hệ thống chiếu sáng hành lang, máy bơm nước & thang máy.",
    supplier: "Tổng công ty Điện lực EVN",
    paymentMethod: "Chuyển khoản VietQR",
  },
  {
    id: "exp-004",
    code: "CP-202608-04",
    name: "Dịch Vụ Vệ Sinh Thu Gom Rác Sinh Hoạt",
    category: "Vệ sinh & An ninh",
    amount: 800000,
    roomName: "Toàn tòa nhà",
    status: "pending",
    paidAt: "2026-08-30",
    createdAt: "2026-08-22",
    description: "Phí dịch vụ thu gom rác thải định kỳ tháng 8/2026.",
    supplier: "Hợp tác xã Môi trường Phường",
    paymentMethod: "Tiền mặt",
  },
  {
    id: "exp-005",
    code: "CP-202608-05",
    name: "Mua Mới 2 Máy Giặt Công Nghiệp LG 12kg",
    category: "Trang thiết bị",
    amount: 14200000,
    roomName: "Khu Giặt Đồ Chung",
    status: "paid",
    paidAt: "2026-08-10",
    createdAt: "2026-08-10",
    description: "Bổ sung máy giặt chung cho tầng 3 và tầng 5 phục vụ người thuê.",
    supplier: "Siêu thị Điện máy Xanh",
    paymentMethod: "Chuyển khoản VietQR",
  },
  {
    id: "exp-006",
    code: "CP-202608-06",
    name: "Nạp Bình Cứu Hỏa & Kiểm Tra Đèn Sự Cố",
    category: "Vệ sinh & An ninh",
    amount: 1200000,
    roomName: "Toàn tòa nhà",
    status: "pending",
    paidAt: "2026-08-31",
    createdAt: "2026-08-25",
    description: "Bảo dưỡng 12 bình chữa cháy bột MFZ4 và kiểm tra hệ thống báo cháy.",
    supplier: "Công ty Thiết bị PCCC An Bình",
    paymentMethod: "Chuyển khoản VietQR",
  },
  {
    id: "exp-007",
    code: "CP-202608-07",
    name: "Sửa Điều Hòa Inverter Bị Rò Rỉ Nước",
    category: "Bảo trì & Sửa chữa",
    amount: 650000,
    roomId: "rm-301",
    roomName: "Phòng 301",
    status: "paid",
    paidAt: "2026-08-26",
    createdAt: "2026-08-26",
    description: "Vệ sinh dàn lạnh, thông ống thoát nước và bổ sung gas R32.",
    supplier: "Thợ Điện lạnh Hoàng Anh",
    paymentMethod: "Chuyển khoản VietQR",
  },
];

// Large Money Formatter Helper (Prevents digit wrapping)
const formatLargeMoney = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2).replace(/\.00$/, "")} Tỷ ₫`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2).replace(/\.00$/, "")}M ₫`;
  }
  return `${amount.toLocaleString("vi-VN")} ₫`;
};

export default function ExpensesPage() {
  const t = useTranslations("expenses");
  const { activeBuilding } = useAuth();
  const router = useRouter();

  const [expensesList, setExpensesList] = useState<ExpenseItem[]>(initialExpenses);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Rule #9 default Grid

  // Category Filter Tabs
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");

  // Status Filter Tabs
  const [activeStatusTab, setActiveStatusTab] = useState<"all" | "paid" | "pending" | "canceled">("all");

  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [deletingExpenseTarget, setDeletingExpenseTarget] = useState<ExpenseItem | null>(null);
  const [lockedExpenseTarget, setLockedExpenseTarget] = useState<ExpenseItem | null>(null);

  // Form State for Create / Edit
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    category: "Bảo trì & Sửa chữa" as ExpenseItem["category"],
    amount: "",
    roomScope: "property" as "property" | "room",
    roomName: "",
    status: "paid" as "paid" | "pending",
    paidAt: new Date().toISOString().split("T")[0],
    supplier: "",
    paymentMethod: "Chuyển khoản VietQR" as ExpenseItem["paymentMethod"],
    description: "",
  });

  // Global Rule #10: Form Dirty State & Confirmation Modal
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<"create" | "edit" | null>(null);

  // Rule #9 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for Grid, 10 for Table

  useEffect(() => {
    setPageSize(viewMode === "grid" ? 6 : 10);
    setCurrentPage(1);
  }, [viewMode]);

  // Request Close Modal Handler (Rule #10)
  const requestCloseModal = (target: "create" | "edit") => {
    if (isFormDirty) {
      setConfirmCloseTarget(target);
    } else {
      if (target === "create") setShowCreateModal(false);
      if (target === "edit") setEditingExpense(null);
    }
  };

  const handleConfirmCloseModal = () => {
    if (confirmCloseTarget === "create") setShowCreateModal(false);
    if (confirmCloseTarget === "edit") setEditingExpense(null);
    setConfirmCloseTarget(null);
    setIsFormDirty(false);
  };

  // Open Edit Modal Helper
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
      roomName: expense.roomName === "Toàn tòa nhà" ? "" : expense.roomName,
      status: expense.status === "canceled" ? "pending" : expense.status,
      paidAt: expense.paidAt,
      supplier: expense.supplier || "",
      paymentMethod: expense.paymentMethod || "Chuyển khoản VietQR",
      description: expense.description || "",
    });
    setIsFormDirty(false);
  };

  // Create Expense Submission
  const handleCreateExpense = () => {
    if (!expenseForm.name.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert("Vui lòng điền đầy đủ Tên khoản chi và Số tiền hợp lệ.");
      return;
    }

    const newCode = `CP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(expensesList.length + 1).padStart(2, "0")}`;
    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      code: newCode,
      name: expenseForm.name.trim(),
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      roomName: expenseForm.roomScope === "property" ? "Toàn tòa nhà" : expenseForm.roomName.trim() || "Phòng chọn",
      roomId: expenseForm.roomScope === "room" ? "rm-custom" : undefined,
      status: expenseForm.status,
      paidAt: expenseForm.paidAt,
      createdAt: new Date().toISOString().split("T")[0],
      description: expenseForm.description.trim(),
      supplier: expenseForm.supplier.trim() || undefined,
      paymentMethod: expenseForm.paymentMethod,
    };

    setExpensesList([newExpense, ...expensesList]);
    setShowCreateModal(false);
    setIsFormDirty(false);
    resetForm();
  };

  // Edit Expense Submission
  const handleUpdateExpense = () => {
    if (!editingExpense || !expenseForm.name.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) return;

    setExpensesList(prev =>
      prev.map(item => {
        if (item.id === editingExpense.id) {
          return {
            ...item,
            name: expenseForm.name.trim(),
            category: expenseForm.category,
            amount: Number(expenseForm.amount),
            roomName: expenseForm.roomScope === "property" ? "Toàn tòa nhà" : expenseForm.roomName.trim() || "Phòng chọn",
            roomId: expenseForm.roomScope === "room" ? "rm-custom" : undefined,
            status: expenseForm.status,
            paidAt: expenseForm.paidAt,
            description: expenseForm.description.trim(),
            supplier: expenseForm.supplier.trim() || undefined,
            paymentMethod: expenseForm.paymentMethod,
          };
        }
        return item;
      })
    );

    setEditingExpense(null);
    setIsFormDirty(false);
    resetForm();
  };

  // Toggle Mark as Paid
  const handleMarkAsPaid = (id: string) => {
    setExpensesList(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: "paid",
            paidAt: new Date().toISOString().split("T")[0],
          };
        }
        return item;
      })
    );
    if (selectedExpense?.id === id) {
      setSelectedExpense(prev => (prev ? { ...prev, status: "paid" } : null));
    }
  };

  // Delete Expense Helper & Handlers
  const handleDeleteExpense = (expense: ExpenseItem) => {
    if (expense.status === "paid") {
      setLockedExpenseTarget(expense);
      return;
    }
    setDeletingExpenseTarget(expense);
  };

  const confirmDeleteExpense = () => {
    if (!deletingExpenseTarget) return;
    setExpensesList(prev => prev.filter(item => item.id !== deletingExpenseTarget.id));
    if (selectedExpense?.id === deletingExpenseTarget.id) setSelectedExpense(null);
    setDeletingExpenseTarget(null);
  };

  const resetForm = () => {
    setExpenseForm({
      name: "",
      category: "Bảo trì & Sửa chữa",
      amount: "",
      roomScope: "property",
      roomName: "",
      status: "paid",
      paidAt: new Date().toISOString().split("T")[0],
      supplier: "",
      paymentMethod: "Chuyển khoản VietQR",
      description: "",
    });
  };

  // Summary Metrics
  const totalExpenseAmount = expensesList.reduce((sum, item) => sum + (item.status !== "canceled" ? item.amount : 0), 0);
  const paidExpenseAmount = expensesList.filter(item => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);
  const pendingExpenseAmount = expensesList.filter(item => item.status === "pending").reduce((sum, item) => sum + item.amount, 0);
  const maintenanceAmount = expensesList.filter(item => item.category === "Bảo trì & Sửa chữa" && item.status !== "canceled").reduce((sum, item) => sum + item.amount, 0);

  // Category counts
  const categoriesList = ["all", "Bảo trì & Sửa chữa", "Điện nước & Dịch vụ", "Vệ sinh & An ninh", "Trang thiết bị", "Chi phí khác"];

  // Filtering Logic
  const filteredExpenses = expensesList.filter(item => {
    // Category match
    if (activeCategoryTab !== "all" && item.category !== activeCategoryTab) return false;

    // Status match
    if (activeStatusTab !== "all" && item.status !== activeStatusTab) return false;

    // Search term match
    const matchQuery =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchQuery;
  });

  // Rule #9 Pagination Calculations
  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + pageSize);

  // Status Badge Renderer Helper
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#2AC1BC]" /> {t("title")}
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
              setIsFormDirty(false);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" /> {t("addNew")}
          </button>
        </div>
      </div>

      {/* Dark Hero Summary Banner (Matching Standard Design) */}
      <div className="bg-zinc-900 rounded-3xl p-5 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Wallet className="w-64 h-64" />
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
                <span>Google Maps</span> &rarr;
              </a>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("heroSubtitle")}
            </p>
          </div>

          {/* Right Stat Cards (3 Cards in 1 Row) */}
          <div className="w-full lg:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full">
              {/* Card 1: Tổng Chi Phí */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[130px]">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-rose-400 tracking-wider whitespace-nowrap">{t("totalExpenses")}</span>
                  <span className="font-black text-white text-base sm:text-lg leading-tight mt-0.5">
                    {formatLargeMoney(totalExpenseAmount)}
                  </span>
                </div>
              </div>

              {/* Card 2: Đã Thanh Toán */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-2xl border border-[#2AC1BC]/30 backdrop-blur-md min-w-[130px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-[#2AC1BC] tracking-wider whitespace-nowrap">{t("paidExpenses")}</span>
                  <span className="font-black text-white text-base sm:text-lg leading-tight mt-0.5">
                    {formatLargeMoney(paidExpenseAmount)}
                  </span>
                </div>
              </div>

              {/* Card 3: Chờ Thanh Toán */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-amber-500/10 hover:bg-amber-500/20 transition-colors rounded-2xl border border-amber-500/30 backdrop-blur-md min-w-[130px]">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-amber-400 tracking-wider whitespace-nowrap">{t("pendingExpenses")}</span>
                  <span className="font-black text-white text-base sm:text-lg leading-tight mt-0.5">
                    {formatLargeMoney(pendingExpenseAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Control Bar */}
      <div className="bg-white p-3.5 sm:p-4 border border-zinc-200/80 rounded-2xl shadow-2xs space-y-3.5">
        {/* Category Switcher Horizontal Scroll */}
        <div className="overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 flex items-center gap-1.5 border-b border-zinc-100 pb-3">
          <span className="text-zinc-400 text-[11px] font-extrabold uppercase mr-1 hidden sm:inline shrink-0">Danh mục:</span>
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategoryTab(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeCategoryTab === cat
                ? "bg-[#2AC1BC] text-white shadow-2xs"
                : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
                }`}
            >
              {cat === "all" ? `Tất cả danh mục (${expensesList.length})` : cat}
            </button>
          ))}
        </div>

        {/* Search Box & View Switcher Bar (On the Same Row!) */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm mã chi phí, tên khoản chi, phòng, nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8.5 pr-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all truncate"
            />
          </div>

          {/* View Switcher (Grid vs Table) - Placed directly beside Search Input */}
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

        {/* Status Filter Pills Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <button
            onClick={() => { setActiveStatusTab("all"); setCurrentPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeStatusTab === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => { setActiveStatusTab("paid"); setCurrentPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeStatusTab === "paid" ? "bg-[#2AC1BC] text-white" : "bg-[#2AC1BC]/10 text-[#0d6e6b] hover:bg-[#2AC1BC]/20"
              }`}
          >
            Đã thanh toán
          </button>
          <button
            onClick={() => { setActiveStatusTab("pending"); setCurrentPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeStatusTab === "pending" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
          >
            Chờ thanh toán
          </button>
        </div>
      </div>

      {/* Main Content Display (Grid or Table View) */}
      {paginatedExpenses.length === 0 ? (
        <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl space-y-3">
          <Wallet className="w-12 h-12 text-zinc-300 mx-auto stroke-1" />
          <h3 className="font-extrabold text-sm text-zinc-800">Không tìm thấy khoản chi phí nào phù hợp</h3>
          <p className="text-xs text-zinc-400">Thử chọn danh mục khác hoặc nhập cụm từ tìm kiếm mới.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9 Default) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedExpenses.map(exp => (
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
                  <h4 className="font-black text-sm text-zinc-900 leading-snug line-clamp-2">{exp.name}</h4>
                </div>

                {/* Amount Highlight */}
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-rose-800 uppercase">Số tiền chi</span>
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
                    <span className="font-semibold text-zinc-700">{exp.paidAt}</span>
                  </div>
                  {exp.supplier && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Nhà cung cấp:</span>
                      <span className="font-semibold text-zinc-800 truncate max-w-[160px]">{exp.supplier}</span>
                    </div>
                  )}
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
                    className="px-3 py-1.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-2xs"
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
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
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
                {paginatedExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-3.5 sm:px-4 font-black text-zinc-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                        <span>{exp.code}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4">
                      <div className="min-w-[180px] max-w-[260px]">
                        <div className="font-extrabold text-zinc-900 text-xs leading-snug line-clamp-2">{exp.name}</div>
                        <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">{exp.category}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 font-bold text-zinc-800 whitespace-nowrap">{exp.roomName}</td>

                    <td className="py-3 px-3.5 sm:px-4 text-zinc-600 whitespace-nowrap">{exp.paidAt}</td>

                    <td className="py-3 px-3.5 sm:px-4 font-black text-rose-600 whitespace-nowrap">
                      -{exp.amount.toLocaleString("vi-VN")} ₫
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap">{renderStatusBadge(exp.status)}</td>

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

      {/* Pagination Bar (Standard Dormio Rule #9) */}
      <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg font-black text-zinc-900 focus:outline-none cursor-pointer"
          >
            <option value={6}>6</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <span className="text-zinc-500">
            / trang | <strong className="text-zinc-900">{totalItems > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, totalItems)}</strong> trên <strong className="text-zinc-900">{totalItems}</strong> mục
          </span>
        </div>

        {/* Page Window Jumping Controls */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${currentPage === page
                ? "bg-[#2AC1BC] text-white shadow-2xs"
                : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. VIEW DETAIL LIGHTBOX MODAL */}
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
                  <p className="text-[11px] sm:text-xs text-zinc-500 font-semibold truncate">{selectedExpense.category}</p>
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
                    Ngày: <strong className="text-white font-black whitespace-nowrap">{selectedExpense.paidAt}</strong>
                  </span>
                </div>

                <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-black text-[#2AC1BC] tracking-tight whitespace-nowrap">
                  <span>-{selectedExpense.amount.toLocaleString("vi-VN")}</span>
                  <span className="text-xl sm:text-2xl font-bold">₫</span>
                </div>

                <div className="pt-2.5 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-medium flex items-center justify-between gap-2">
                  <span className="shrink-0">Tên khoản chi:</span>
                  <strong className="text-white font-black text-right line-clamp-1">{selectedExpense.name}</strong>
                </div>
              </div>

              {/* Expense Details Breakdown Card */}
              <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-zinc-600 gap-2">
                  <span className="font-semibold text-zinc-500 shrink-0">Phạm vi áp dụng:</span>
                  <span className="font-black text-zinc-900 truncate">{selectedExpense.roomName}</span>
                </div>

                <div className="flex justify-between items-center text-zinc-600 border-t border-zinc-200/60 pt-2 gap-2">
                  <span className="font-semibold text-zinc-500 shrink-0">Trạng thái thanh toán:</span>
                  <div className="shrink-0">{renderStatusBadge(selectedExpense.status)}</div>
                </div>

                {selectedExpense.supplier && (
                  <div className="flex justify-between items-center text-zinc-600 border-t border-zinc-200/60 pt-2 gap-2">
                    <span className="font-semibold text-zinc-500 shrink-0">Nhà cung cấp / Đơn vị:</span>
                    <span className="font-extrabold text-zinc-900 truncate">{selectedExpense.supplier}</span>
                  </div>
                )}

                {selectedExpense.paymentMethod && (
                  <div className="flex justify-between items-center text-zinc-600 border-t border-zinc-200/60 pt-2 gap-2">
                    <span className="font-semibold text-zinc-500 shrink-0">Hình thức thanh toán:</span>
                    <span className="font-bold text-zinc-800 shrink-0">{selectedExpense.paymentMethod}</span>
                  </div>
                )}

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

            {/* Modal Footer Actions (2 Action Buttons in Distinct Colors) */}
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

      {/* 2. CREATE / EDIT EXPENSE MODAL */}
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
                    {showCreateModal ? "Thêm Khoản Chi Phí Mới" : `Chỉnh Sửa Khoản Chi ${editingExpense?.code}`}
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
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Tên Khoản Chi *</label>
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
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Danh Mục Chi *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, category: e.target.value as any });
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
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Số Tiền (VNĐ) *</label>
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
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Phạm Vi Áp Dụng *</label>
                  <select
                    value={expenseForm.roomScope}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, roomScope: e.target.value as any });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] focus:bg-white text-xs cursor-pointer"
                  >
                    <option value="property">Toàn tòa nhà (Chung)</option>
                    <option value="room">Phòng cụ thể</option>
                  </select>
                </div>

                {expenseForm.roomScope === "room" ? (
                  <div>
                    <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Số Phòng *</label>
                    <input
                      type="text"
                      value={expenseForm.roomName}
                      onChange={(e) => {
                        setExpenseForm({ ...expenseForm, roomName: e.target.value });
                        setIsFormDirty(true);
                      }}
                      placeholder="Ví dụ: Phòng 102"
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] focus:bg-white text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Trạng Thái Thanh Toán *</label>
                    <select
                      value={expenseForm.status}
                      onChange={(e) => {
                        setExpenseForm({ ...expenseForm, status: e.target.value as any });
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
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Trạng Thái Thanh Toán *</label>
                  <select
                    value={expenseForm.status}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, status: e.target.value as any });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] focus:bg-white text-xs cursor-pointer"
                  >
                    <option value="paid">Đã thanh toán (Paid)</option>
                    <option value="pending">Chờ thanh toán (Pending)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Ngày Ghi Nhận / Trả *</label>
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
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Hình Thức Thanh Toán</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as any });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] text-xs cursor-pointer"
                  >
                    <option value="Chuyển khoản VietQR">Chuyển khoản VietQR</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Ví điện tử">Ví điện tử</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Nhà Cung Cấp / Đơn Vị Thợ</label>
                <input
                  type="text"
                  value={expenseForm.supplier}
                  onChange={(e) => {
                    setExpenseForm({ ...expenseForm, supplier: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder="Ví dụ: Công ty Thang máy Schindler, Thợ điện Hoàng Anh..."
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">Ghi Chú Bổ Sung</label>
                <textarea
                  rows={2}
                  value={expenseForm.description}
                  onChange={(e) => {
                    setExpenseForm({ ...expenseForm, description: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder="Ghi chú thêm về hóa đơn, mã giao dịch hoặc lý do phát sinh chi phí..."
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
                onClick={showCreateModal ? handleCreateExpense : handleUpdateExpense}
                className="px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" /> {showCreateModal ? "Lưu Khoản Chi Phí" : "Cập Nhật Khoản Chi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Rule #10: Unsaved Changes Pop-up Confirmation Modal */}
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

      {/* Delete Confirmation Pop-up Modal */}
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
                Bạn có chắc muốn xóa khoản chi <strong className="text-zinc-900 font-extrabold">{deletingExpenseTarget.name}</strong> (<span className="text-rose-600 font-bold">{deletingExpenseTarget.code}</span>)? Thao tác này không thể hoàn tác.
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

      {/* Locked Paid Expense Pop-up Modal */}
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
                Khoản chi <strong className="text-zinc-900 font-extrabold">{lockedExpenseTarget.name}</strong> (<span className="text-[#2AC1BC] font-bold">{lockedExpenseTarget.code}</span>) đã thanh toán hoàn tất nên hệ thống khóa tính năng chỉnh sửa để đảm bảo tính minh bạch sổ sách.
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