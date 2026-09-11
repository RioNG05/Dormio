"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Search, Filter, PiggyBank, Building2, ChevronDown, MapPin,
  Eye, Calendar, DollarSign, CheckCircle2, Clock, AlertTriangle,
  ChevronLeft, ChevronRight, LayoutGrid, List, Send, RefreshCw,
  ShieldCheck, User, Phone, ArrowUpRight, Check, X, AlertCircle, FileText,
  RotateCcw, Scissors, Sparkles, Smartphone, HelpCircle, ArrowRight, Loader2
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import {
  createManualDeposit,
  getDeposits,
  refundDeposit,
  forfeitDeposit,
  DepositItem,
  DepositStats,
} from "@/services/deposit.service";
import { getRooms, RoomItem } from "@/services/room.service";

// Large Money Formatter Helper (Prevents digit wrapping)
const formatLargeMoney = (amount: number, unitBillion: string = "B ₫", unitMillion: string = "M ₫", isEn: boolean = false): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2).replace(/\.00$/, "")} ${unitBillion}`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2).replace(/\.00$/, "")} ${unitMillion}`;
  }
  return `${amount.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫`;
};

function DepositsContent() {
  const { activeBuilding } = useAuth();
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("landlord");
  const { currentLocale } = useLanguage();

  const getDepositStatusLabel = (status: string) => {
    switch (status) {
      case "Đang giữ":
      case "holding":
        return t("landlordDepositsStatusHolding");
      case "Đã hoàn":
      case "Đã hoàn cọc":
      case "refunded":
        return t("landlordDepositsStatusRefunded");
      case "Đã khấu trừ":
      case "deducted":
      case "forfeited":
        return t("landlordDepositsStatusDeducted");
      default:
        return status;
    }
  };

  const getDepositTypeLabel = (type: string) => {
    switch (type) {
      case "Cọc giữ chỗ":
      case "hold":
        return t("landlordDepositsHoldingDeposit");
      case "Cọc hợp đồng":
      case "contract":
        return t("landlordDepositsContractDeposit");
      default:
        return type;
    }
  };

  // Data states (Real backend data, NO mockups)
  const [depositsList, setDepositsList] = useState<DepositItem[]>([]);
  const [stats, setStats] = useState<DepositStats>({
    totalHoldingAmount: 0,
    totalHoldTypeAmount: 0,
    totalRefundedAmount: 0,
    totalDeductedAmount: 0,
    holdingCountTotal: 0,
    holdTypeHoldingCountTotal: 0,
    refundedCountTotal: 0,
    deductedCountTotal: 0,
    holdTypeCountTotal: 0,
    contractTypeCountTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Available rooms for manual deposit entry
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // View mode state (Rule #9: Grid is default)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Top Segment Switcher for 2 Deposit Types ("hold" vs "contract")
  const [selectedDepositTypeTab, setSelectedDepositTypeTab] = useState<"hold" | "contract">("hold");

  // Status Filter Tab per active Deposit Type (all | holding | refunded | deducted)
  const [activeStatusTab, setActiveStatusTab] = useState<"all" | "holding" | "refunded" | "deducted">("all");

  const [searchTerm, setSearchTerm] = useState("");

  // Selected Deposit for Lightbox / Details Modals
  const [selectedDeposit, setSelectedDeposit] = useState<DepositItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<DepositItem | null>(null);
  const [showRefundModal, setShowRefundModal] = useState<DepositItem | null>(null);

  // Refund & Deduction Form State (Unified Modal)
  const [refundForm, setRefundForm] = useState({
    deductedAmount: "0",
    deductionReason: "",
    note: "",
  });

  // Rule #10 Unsaved Confirmation Modal
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<"create" | "upgrade" | "refund" | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast message state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // New Manual Deposit Form State (UC-L-10 - clean empty defaults, no mockups)
  const [newDepositForm, setNewDepositForm] = useState({
    roomId: "",
    tenantName: "",
    tenantPhone: "",
    depositType: "hold" as "hold" | "contract",
    amount: "",
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    note: "",
  });

  // Upgrade Form State (Hold Deposit -> Contract Deposit)
  const [upgradeForm, setUpgradeForm] = useState({
    targetContractAmount: "",
    additionalAmount: 0,
    note: "",
  });

  // Rule #9 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for Grid

  useEffect(() => {
    setPageSize(viewMode === "grid" ? 6 : 10);
    setCurrentPage(1);
  }, [viewMode]);

  // Recalculate additional required deposit when upgrade modal target amount changes
  useEffect(() => {
    if (showUpgradeModal) {
      const target = Number(upgradeForm.targetContractAmount) || 0;
      const current = showUpgradeModal.amount;
      setUpgradeForm((prev) => ({
        ...prev,
        additionalAmount: Math.max(0, target - current),
      }));
    }
  }, [upgradeForm.targetContractAmount, showUpgradeModal]);

  // ─── Fetch Deposits from Backend API ────────────────────────────────────────

  const fetchDeposits = useCallback(async () => {
    if (!activeBuilding?.id) return;

    try {
      setIsLoading(true);

      const statusParam =
        activeStatusTab === "holding"
          ? "paid"
          : activeStatusTab === "refunded"
            ? "refund"
            : activeStatusTab === "deducted"
              ? "forfeited"
              : undefined;

      const res = await getDeposits(activeBuilding.id, {
        page: currentPage,
        limit: pageSize,
        search: searchTerm.trim() || undefined,
        status: statusParam,
        depositCategory: selectedDepositTypeTab,
      });

      setDepositsList(res.data);
      setStats(res.stats);
      setTotalItems(res.meta.total);
    } catch (err: any) {
      console.error("Error fetching deposits:", err);
      showToast(err.message || t("landlordDepositsToastLoadFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [activeBuilding?.id, selectedDepositTypeTab, activeStatusTab, searchTerm, currentPage, pageSize, isEn]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  // ─── Fetch Available Rooms for New Deposit Modal ───────────────────────────

  const fetchAvailableRooms = useCallback(async () => {
    if (!activeBuilding?.id) return;
    try {
      setIsLoadingRooms(true);
      const res = await getRooms(activeBuilding.id, { limit: 100 });
      setAvailableRooms(res.data);
    } catch (err: any) {
      console.error("Error fetching rooms for deposit modal:", err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [activeBuilding?.id]);

  useEffect(() => {
    fetchAvailableRooms();
  }, [fetchAvailableRooms]);

  // ─── Handle Create Manual Deposit (UC-L-10) ────────────────────────────────

  const handleCreateDeposit = async () => {
    if (!activeBuilding?.id) {
      showToast(t("landlordDepositsToastSelectBuilding"), "error");
      return;
    }

    if (!newDepositForm.roomId) {
      showToast(t("landlordDepositsToastSelectRoom"), "error");
      return;
    }

    if (!newDepositForm.tenantName.trim()) {
      showToast(t("landlordDepositsToastEnterName"), "error");
      return;
    }

    if (!newDepositForm.tenantPhone.trim()) {
      showToast(t("landlordDepositsToastEnterPhone"), "error");
      return;
    }

    const amt = Number(newDepositForm.amount);
    if (!amt || amt <= 0) {
      showToast(t("landlordDepositsToastAmountPositive"), "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await createManualDeposit(activeBuilding.id, {
        roomId: newDepositForm.roomId,
        amount: amt,
        tenantName: newDepositForm.tenantName.trim(),
        tenantPhone: newDepositForm.tenantPhone.trim(),
        expiryDate: newDepositForm.expiryDate || undefined,
        note: newDepositForm.note.trim() || undefined,
      });

      showToast(t("landlordDepositsToastCreateSuccess"), "success");
      setShowCreateModal(false);
      setIsFormDirty(false);

      // Reset form
      setNewDepositForm({
        roomId: "",
        tenantName: "",
        tenantPhone: "",
        depositType: "hold",
        amount: "",
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        note: "",
      });

      // Switch view to hold deposits tab and refresh
      setSelectedDepositTypeTab("hold");
      setActiveStatusTab("holding");
      await fetchDeposits();
      await fetchAvailableRooms();
    } catch (err: any) {
      console.error("Error creating manual deposit:", err);
      showToast(err.message || t("landlordDepositsToastCreateFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Handle Refund & Deduction Deposit (Unified) ───────────────────────────

  const handleRefundDeposit = async () => {
    if (!activeBuilding?.id || !showRefundModal) return;

    try {
      setIsSubmitting(true);
      const deductAmt = Math.min(showRefundModal.amount, Math.max(0, Number(refundForm.deductedAmount) || 0));

      await refundDeposit(activeBuilding.id, showRefundModal.id, {
        deductedAmount: deductAmt,
        deductionReason: refundForm.deductionReason || (deductAmt > 0 ? t("landlordDepositsDefaultDeductionReason") : undefined),
        note: refundForm.note || undefined,
      });

      showToast(t("landlordDepositsToastRefundSuccess"), "success");
      setShowRefundModal(null);
      setIsFormDirty(false);
      await fetchDeposits();
      await fetchAvailableRooms();
    } catch (err: any) {
      console.error("Error processing refund:", err);
      showToast(err.message || t("landlordDepositsToastRefundFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Handle Upgrade Hold Deposit -> Contract Deposit ───────────────────────

  const handleConfirmUpgradeToContract = () => {
    if (!showUpgradeModal) return;
    // Redirect to Contract Generation Flow with preselected room & deposit
    router.push(
      `/landlord/contracts?action=create&roomId=${encodeURIComponent(showUpgradeModal.roomId)}&depositId=${encodeURIComponent(showUpgradeModal.id)}`
    );
    setShowUpgradeModal(null);
    setIsFormDirty(false);
  };

  // ─── Rule #10 Unsaved Pop-up Confirmation Modal ────────────────────────────

  const requestCloseModal = (target: "create" | "upgrade" | "refund") => {
    if (isFormDirty) {
      setConfirmCloseTarget(target);
    } else {
      if (target === "create") setShowCreateModal(false);
      if (target === "upgrade") setShowUpgradeModal(null);
      if (target === "refund") setShowRefundModal(null);
    }
  };

  const handleConfirmCloseModal = () => {
    if (confirmCloseTarget === "create") {
      setShowCreateModal(false);
      setNewDepositForm({
        roomId: "",
        tenantName: "",
        tenantPhone: "",
        depositType: "hold",
        amount: "",
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        note: "",
      });
    }
    if (confirmCloseTarget === "upgrade") setShowUpgradeModal(null);
    if (confirmCloseTarget === "refund") setShowRefundModal(null);
    setConfirmCloseTarget(null);
    setIsFormDirty(false);
  };

  // Render Clean Status Badges
  const renderStatusBadge = (dep: DepositItem) => {
    if (dep.status === "paid") {
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#2AC1BC]/15 text-[#0d6e6b] border border-[#2AC1BC]/30">
          {t("landlordDepositsStatusHolding")}
        </span>
      );
    }

    if (dep.status === "refund") {
      const hasDeduction = (dep.deductedAmount ?? 0) > 0;
      return (
        <div className="flex flex-wrap items-center gap-1 justify-end sm:justify-start">
          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {t("landlordDepositsStatusRefunded")}
          </span>
          {hasDeduction && (
            <span
              className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200"
              title={t("landlordDepositsPartialDeductionBadge").replace("{amount}", `${dep.deductedAmount?.toLocaleString("vi-VN")} ₫`)}
            >
              {t("landlordDepositsStatusDeducted")}
            </span>
          )}
        </div>
      );
    }

    // 100% Deduction / Forfeited status
    return (
      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        {t("landlordDepositsStatusDeducted")}
      </span>
    );
  };

  // Rule #9 Pagination Window Calculation (5-page window jumping)
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const windowSize = 5;
  const currentWindowIndex = Math.floor((currentPage - 1) / windowSize);
  const windowStart = currentWindowIndex * windowSize + 1;
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
  const pageNumbers = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border backdrop-blur-md ${toast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20"
                : "bg-rose-600 text-white border-rose-500 shadow-rose-600/20"
              }`}
          >
            <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-[#2AC1BC]" /> {t("landlordDepositsTitle")}
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
            {t("landlordDepositsSubtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setShowCreateModal(true);
              setIsFormDirty(false);
              fetchAvailableRooms();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" /> {t("landlordDepositsAddNew")}
          </button>
        </div>
      </div>

      {/* Dark Hero Summary Banner */}
      <div className="bg-zinc-900 rounded-3xl p-5 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <PiggyBank className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Left Title, Address Pill with Map button, and Description */}
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              {activeBuilding?.name || (currentLocale === "en" ? "Loading boarding house..." : "Đang tải nhà trọ...")}
            </h2>

            {/* Address Pill with Integrated Map Link */}
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
                  <span>{t("landlordInvoicesViewMap")}</span> &rarr;
                </a>
              </div>
            )}

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("landlordDepositsBannerDesc")}
            </p>
          </div>

          {/* Right Stat Cards (2 Rows, 2 Cards per Row) */}
          <div className="flex flex-col items-stretch sm:items-end gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Card 1: Đang Giữ */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-2xl border border-[#2AC1BC]/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-[#2AC1BC] tracking-wider whitespace-nowrap">
                    {t("landlordDepositsStatHeld")} ({stats.holdingCountTotal})
                  </span>
                  <span className="font-black text-[#2AC1BC] text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(stats.totalHoldingAmount, t("landlordInvoicesUnitBillion"), t("landlordInvoicesUnitMillion"))}
                  </span>
                </div>
              </div>

              {/* Card 2: Cọc Giữ Chỗ */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-amber-500/10 hover:bg-amber-500/20 transition-colors rounded-2xl border border-amber-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-wider whitespace-nowrap">
                    {t("landlordDepositsStatHoldingCount").replace("{count}", String(stats.holdTypeHoldingCountTotal))}
                  </span>
                  <span className="font-black text-amber-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(stats.totalHoldTypeAmount, t("landlordInvoicesUnitBillion"), t("landlordInvoicesUnitMillion"))}
                  </span>
                </div>
              </div>

              {/* Card 3: Đã Hoàn Cọc */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-purple-500/10 hover:bg-purple-500/20 transition-colors rounded-2xl border border-purple-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-purple-400 tracking-wider whitespace-nowrap">
                    {t("landlordDepositsStatRefundedCount").replace("{count}", String(stats.refundedCountTotal))}
                  </span>
                  <span className="font-black text-purple-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(stats.totalRefundedAmount, t("landlordInvoicesUnitBillion"), t("landlordInvoicesUnitMillion"))}
                  </span>
                </div>
              </div>

              {/* Card 4: Tổng Đã Khấu Trừ */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[130px] sm:min-w-[170px]">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-extrabold text-rose-400 tracking-wider whitespace-nowrap">
                    {t("landlordDepositsStatDeductedCount").replace("{count}", String(stats.deductedCountTotal))}
                  </span>
                  <span className="font-black text-rose-400 text-xs sm:text-base leading-none mt-1 whitespace-nowrap tracking-tight">
                    {formatLargeMoney(stats.totalDeductedAmount, t("landlordInvoicesUnitBillion"), t("landlordInvoicesUnitMillion"))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Control Bar */}
      <div className="bg-white p-3.5 sm:p-4 border border-zinc-200/80 rounded-2xl shadow-2xs space-y-3.5">
        {/* Top Segmented Pill Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          {/* 2 Deposit Types Segment Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-zinc-100 p-1 rounded-2xl sm:rounded-full border border-zinc-200/80 w-full md:w-auto">
            <button
              onClick={() => {
                setSelectedDepositTypeTab("hold");
                setActiveStatusTab("all");
                setCurrentPage(1);
              }}
              className={`py-2 px-3 sm:px-4 rounded-xl sm:rounded-full text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${selectedDepositTypeTab === "hold"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t("landlordDepositsTabHoldingButton")}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedDepositTypeTab === "hold" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
                  }`}
              >
                {stats.holdTypeCountTotal}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedDepositTypeTab("contract");
                setActiveStatusTab("all");
                setCurrentPage(1);
              }}
              className={`py-2 px-3 sm:px-4 rounded-xl sm:rounded-full text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${selectedDepositTypeTab === "contract"
                  ? "bg-[#2AC1BC] text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t("landlordDepositsTabContractButton")}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedDepositTypeTab === "contract" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
                  }`}
              >
                {stats.contractTypeCountTotal}
              </span>
            </button>
          </div>

          {/* Search Box & View Switcher */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-full md:max-w-md">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder={t("landlordDepositsSearchPlaceholder")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8.5 pr-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all truncate"
              />
            </div>

            {/* View Switcher (Grid vs Table) */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "grid" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                title={t("landlordDepositsViewGrid")}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "table" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                title={t("landlordDepositsViewTable")}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 flex items-center justify-between gap-2 shrink-0 text-xs font-bold">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-zinc-400 text-[11px] font-extrabold uppercase mr-1 hidden sm:inline">{t("landlordDepositsStatusFilterLabel")}</span>

            <button
              onClick={() => {
                setActiveStatusTab("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeStatusTab === "all"
                  ? "bg-[#2AC1BC] text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
                }`}
            >
              {t("landlordDepositsStatusAll")}
            </button>

            <button
              onClick={() => {
                setActiveStatusTab("holding");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeStatusTab === "holding"
                  ? "bg-[#2AC1BC] text-white shadow-2xs"
                  : "bg-[#2AC1BC]/10 text-[#0d6e6b] hover:bg-[#2AC1BC]/20"
                }`}
            >
              {t("landlordDepositsStatusHolding")} ({selectedDepositTypeTab === "hold" ? stats.holdTypeHoldingCountTotal : stats.holdingCountTotal - stats.holdTypeHoldingCountTotal})
            </button>

            <button
              onClick={() => {
                setActiveStatusTab("refunded");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeStatusTab === "refunded"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                }`}
            >
              {t("landlordDepositsStatusRefunded")} ({stats.refundedCountTotal})
            </button>

            <button
              onClick={() => {
                setActiveStatusTab("deducted");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap border ${activeStatusTab === "deducted"
                  ? "bg-rose-500 text-white border-rose-600 shadow-2xs"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                }`}
            >
              {t("landlordDepositsStatusDeducted")} ({stats.deductedCountTotal})
            </button>
          </div>

          <span className="text-[11px] font-bold text-zinc-400 shrink-0 hidden sm:inline">
            {t("landlordDepositsCurrentViewing")} <strong className="text-zinc-800">{getDepositTypeLabel(selectedDepositTypeTab)}</strong>
          </span>
        </div>
      </div>

      {/* Main Content Display (Grid or Table View) */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white border border-zinc-200 rounded-3xl space-y-3">
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
          <p className="text-xs font-bold text-zinc-500">{t("landlordDepositsLoadingDeposits")}</p>
        </div>
      ) : depositsList.length === 0 ? (
        <div className="p-16 text-center bg-white border border-zinc-200 rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-[#2AC1BC]/10 rounded-full flex items-center justify-center mx-auto text-[#2AC1BC]">
            <PiggyBank className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-base text-zinc-800">
              {t("landlordDepositsEmptyNotFoundTitle")}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {t("landlordDepositsEmptyCategoryDesc")}
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setIsFormDirty(false);
              fetchAvailableRooms();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> {t("landlordDepositsAddDeposit")}
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9 Default) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depositsList.map((dep) => {
            const isHoldType = dep.depositCategory === "hold";
            const isHolding = dep.status === "paid";
            const isRefunded = dep.status === "refund";
            const isDeducted = dep.status === "forfeited";

            return (
              <div
                key={dep.id}
                className={`bg-white border rounded-2xl p-4 space-y-4 hover:shadow-md transition-all flex flex-col justify-between ${isHoldType && isHolding
                    ? "border-amber-300 bg-amber-50/15"
                    : isRefunded
                      ? "border-purple-200 bg-purple-50/10"
                      : isDeducted
                        ? "border-rose-200 bg-rose-50/10"
                        : "border-zinc-200/80 hover:border-[#2AC1BC]/40"
                  }`}
              >
                {/* Header Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-zinc-900">{t("landlordContractsRoomPrefix").replace("{room}", String(dep.roomNumber))}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${isHoldType
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                      >
                        {getDepositTypeLabel(isHoldType ? "Cọc giữ chỗ" : "Cọc hợp đồng")}
                      </span>
                    </div>

                    {renderStatusBadge(dep)}
                  </div>

                  {/* Tenant Details */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">{t("landlordDepositsTenant")}</span>
                      <span className="font-bold text-zinc-900">{dep.tenantName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">{t("landlordDepositsPhone")}</span>
                      <span className="font-bold text-zinc-700">{dep.tenantPhone || t("landlordDepositsNoPhone")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">{t("landlordDepositsDepositDate")}</span>
                      <span className="font-semibold text-zinc-600">{dep.depositDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">
                        {isHoldType ? t("landlordDepositsExpiryDate") : t("landlordDepositsColExpiryDate")}
                      </span>
                      <span
                        className={`font-bold ${isHoldType && isHolding ? "text-amber-600" : "text-zinc-600"
                          }`}
                      >
                        {dep.expiryDate || t("landlordDepositsNoExpiry")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Action Footer */}
                <div className="pt-3 border-t border-zinc-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">
                        {t("landlordDepositsColAmount")}
                      </span>
                      <span className="font-black text-base text-[#2AC1BC]">
                        {dep.amount.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫
                      </span>
                    </div>

                    {isHoldType && isHolding && (
                      <span className="text-[10px] font-extrabold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                        {t("landlordDepositsHoldingDeposit")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDeposit(dep)}
                      className="flex-1 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-500" /> {t("landlordDepositsBtnDetail")}
                    </button>

                    {isHoldType && isHolding && (
                      <button
                        onClick={() => {
                          setShowUpgradeModal(dep);
                          setUpgradeForm({
                            targetContractAmount: "",
                            additionalAmount: 0,
                            note: "",
                          });
                          setIsFormDirty(false);
                        }}
                        className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                        title={t("landlordDepositsTooltipUpgrade")}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> {t("landlordDepositsBtnUpgradeShort")}
                      </button>
                    )}

                    {isHolding && (
                      <button
                        onClick={() => {
                          setShowRefundModal(dep);
                          setRefundForm({ deductedAmount: "0", deductionReason: "", note: "" });
                          setIsFormDirty(false);
                        }}
                        className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                        title={t("landlordDepositsTooltipRefundDeduct")}
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> {t("landlordDepositsBtnRefundShort")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9 Parallel List View) */
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-black text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t("landlordDepositsColCode")}</th>
                  <th className="py-3 px-4">{t("landlordDepositsRoom")}</th>
                  <th className="py-3 px-4">{t("landlordDepositsColTenant")}</th>
                  <th className="py-3 px-4">{t("landlordDepositsColType")}</th>
                  <th className="py-3 px-4 text-right">{t("landlordDepositsColAmount")}</th>
                  <th className="py-3 px-4">{t("landlordDepositsColDepositDate")}</th>
                  <th className="py-3 px-4">{t("landlordDepositsColExpiryDate")}</th>
                  <th className="py-3 px-4 text-center">{t("landlordDepositsColStatus")}</th>
                  <th className="py-3 px-4 text-right">{t("landlordDepositsColActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {depositsList.map((dep) => {
                  const isHoldType = dep.depositCategory === "hold";
                  const isHolding = dep.status === "paid";

                  return (
                    <tr key={dep.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-500">
                        {dep.id.slice(0, 8)}...
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-zinc-900">
                        {t("landlordContractsRoomPrefix").replace("{room}", String(dep.roomNumber))}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900">{dep.tenantName}</div>
                        <div className="text-[10px] text-zinc-400">{dep.tenantPhone || t("landlordDepositsNoPhoneShort")}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${isHoldType
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                        >
                          {getDepositTypeLabel(isHoldType ? "Cọc giữ chỗ" : "Cọc hợp đồng")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-sm text-[#2AC1BC]">
                        {dep.amount.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 font-semibold">{dep.depositDate}</td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${isHoldType && isHolding ? "text-amber-600 font-bold" : "text-zinc-600"}`}>
                          {dep.expiryDate || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">{renderStatusBadge(dep)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDeposit(dep)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            title={t("landlordDepositsBtnDetail")}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isHoldType && isHolding && (
                            <button
                              onClick={() => {
                                setShowUpgradeModal(dep);
                                setUpgradeForm({
                                  targetContractAmount: "",
                                  additionalAmount: 0,
                                  note: "",
                                });
                                setIsFormDirty(false);
                              }}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title={t("landlordDepositsBtnUpgrade")}
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          )}

                          {isHolding && (
                            <button
                              onClick={() => {
                                setShowRefundModal(dep);
                                setRefundForm({ deductedAmount: "0", deductionReason: "", note: "" });
                                setIsFormDirty(false);
                              }}
                              className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title={t("landlordDepositsBtnRefundDeduct")}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Rule #9 Standardized Pagination Control */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <span>{t("landlordDepositsShowing")}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                setPageSize(val);
                setCurrentPage(1);
              }}
              className="w-14 px-2 py-1 bg-white border border-zinc-200 rounded-lg font-bold text-center text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
            />
            <span>{isEn ? "/ page" : "/ trang"}</span>
            <span className="text-zinc-300">|</span>
            <span>
              {startIndex + 1}-{endIndex} {t("landlordDepositsOf")} {totalItems} {t("landlordDepositsItems")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title={t("landlordDepositsTooltipPrevPage")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`min-w-8 h-8 px-2 rounded-lg font-bold transition-all cursor-pointer ${currentPage === num
                    ? "bg-[#2AC1BC] text-white shadow-2xs"
                    : "bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                  }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title={t("landlordDepositsTooltipNextPage")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── MODALS ──────────────────────────────────────────────────────────── */}

      {/* 1. DEPOSIT DETAILS MODAL */}
      {selectedDeposit && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDeposit(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">{t("landlordDepositsDetailModalTitle")}</h3>
                  <p className="text-xs text-zinc-500 font-semibold font-mono">{selectedDeposit.id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDeposit(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">{t("landlordDepositsRoom")}</span>
                  <span className="font-black text-zinc-900 text-sm">{t("landlordContractsRoomPrefix").replace("{room}", String(selectedDeposit.roomNumber))}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">{t("landlordDepositsBuilding")}</span>
                  <span className="font-bold text-zinc-800">{selectedDeposit.boardingHouseName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">{t("landlordDepositsDepositTypeLabel")}</span>
                  <span className="font-bold text-zinc-900">
                    {selectedDeposit.depositCategory === "hold" ? t("landlordDepositsHoldingDepositDetail") : t("landlordDepositsContractDepositDetail")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">{t("landlordDepositsColStatus")}</span>
                  {renderStatusBadge(selectedDeposit)}
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">{t("landlordDepositsTenant")}</span>
                  <span className="font-bold text-zinc-900">{selectedDeposit.tenantName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">{t("landlordDepositsPhone")}</span>
                  <span className="font-bold text-zinc-900">{selectedDeposit.tenantPhone || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">{t("landlordDepositsDepositDate")}</span>
                  <span className="font-bold text-zinc-800">{selectedDeposit.depositDate}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-semibold">{t("landlordDepositsExpiryDate")}</span>
                  <span className="font-bold text-amber-600">{selectedDeposit.expiryDate || t("landlordDepositsNoExpiry")}</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 bg-gradient-to-br from-[#2AC1BC]/10 to-teal-500/5 border border-[#2AC1BC]/30 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#0d6e6b] font-bold">{t("landlordDepositsInitialDepositAmount")}</span>
                  <span className="font-black text-zinc-900">
                    {selectedDeposit.originalAmount.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫
                  </span>
                </div>

                {(selectedDeposit.deductedAmount ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-xs text-rose-700">
                    <span className="font-bold">{t("landlordDepositsDeductedAmount")}</span>
                    <span className="font-black">-{selectedDeposit.deductedAmount?.toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}

                {(selectedDeposit.refundAmount ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-xs text-purple-700">
                    <span className="font-bold">{t("landlordDepositsRefundedAmount")}</span>
                    <span className="font-black">{selectedDeposit.refundAmount?.toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#2AC1BC]/20 flex justify-between items-center text-sm">
                  <span className="text-[#0d6e6b] font-black">{t("landlordDepositsCurrentlyHeld")}</span>
                  <span className="font-black text-[#2AC1BC] text-base">
                    {selectedDeposit.amount.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedDeposit.note && (
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">{t("landlordDepositsNotesLabel")}</span>
                  <p className="text-xs text-zinc-700 leading-relaxed font-medium">{selectedDeposit.note}</p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-zinc-100 bg-white flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  router.push(
                    `/landlord/messages?room=${encodeURIComponent(selectedDeposit.roomId)}&tenant=${encodeURIComponent(selectedDeposit.tenantName)}`
                  );
                }}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("landlordDepositsChatWithTenant")}
              </button>

              <div className="flex items-center gap-2">
                {selectedDeposit.depositCategory === "hold" && selectedDeposit.status === "paid" && (
                  <button
                    onClick={() => {
                      setShowUpgradeModal(selectedDeposit);
                      setUpgradeForm({
                        targetContractAmount: "",
                        additionalAmount: 0,
                        note: "",
                      });
                      setSelectedDeposit(null);
                      setIsFormDirty(false);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> {t("landlordDepositsBtnUpgrade")}
                  </button>
                )}

                {selectedDeposit.status === "paid" && (
                  <button
                    onClick={() => {
                      setShowRefundModal(selectedDeposit);
                      setRefundForm({ deductedAmount: "0", deductionReason: "", note: "" });
                      setSelectedDeposit(null);
                      setIsFormDirty(false);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> {t("landlordDepositsBtnRefundDeduct")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CREATE NEW MANUAL DEPOSIT MODAL (UC-L-10) */}
      {showCreateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseModal("create");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">{t("landlordDepositsCreateModalTitle")}</h3>
                  <p className="text-xs text-zinc-500 font-semibold">{t("landlordDepositsCreateModalSub")}</p>
                </div>
              </div>

              <button
                onClick={() => requestCloseModal("create")}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              {/* Room Selection Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    {t("landlordDepositsRoomSelectLabel")}
                  </label>
                  {isLoadingRooms ? (
                    <div className="flex items-center gap-2 py-2 text-zinc-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("landlordDepositsLoadingRooms")}
                    </div>
                  ) : (
                    <select
                      value={newDepositForm.roomId}
                      onChange={(e) => {
                        setNewDepositForm({ ...newDepositForm, roomId: e.target.value });
                        setIsFormDirty(true);
                      }}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                    >
                      <option value="">{t("landlordInvoicesSelectRoomPlaceholder")}</option>
                      {availableRooms.map((room) => {
                        const isAvail = room.status === "available";
                        const roomStatusLabel = isAvail
                          ? (isEn ? "Available - Can deposit" : "Trống - Có thể cọc")
                          : room.status === "deposited"
                            ? (isEn ? "Deposited" : "Đã cọc")
                            : (isEn ? "Rented" : "Đang thuê");
                        return (
                          <option key={room.id} value={room.id} disabled={!isAvail}>
                            {t("landlordContractsRoomPrefix").replace("{room}", String(room.roomNumber))} - {room.roomType?.name || (currentLocale === "en" ? "Room" : "Phòng")} (
                            {isAvail ? t("landlordDepositsRoomStatusAvailable") : room.status === "deposited" ? t("landlordDepositsRoomStatusDeposited") : t("landlordDepositsRoomStatusRented")})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    {t("landlordDepositsDepositTypeLabel")}
                  </label>
                  <select
                    value={newDepositForm.depositType}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, depositType: e.target.value as any });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  >
                    <option value="Cọc giữ chỗ">{t("landlordDepositsOptionHoldingDesc")}</option>
                    <option value="Cọc hợp đồng">{t("landlordDepositsOptionContractDesc")}</option>
                  </select>
                </div>
              </div>

              {/* Prospective Tenant Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    {t("landlordDepositsTenantNameLabel")}
                  </label>
                  <input
                    type="text"
                    value={newDepositForm.tenantName}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, tenantName: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder={t("landlordDepositsTenantNameExample")}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    {t("landlordDepositsTenantPhoneLabel")}
                  </label>
                  <input
                    type="tel"
                    value={newDepositForm.tenantPhone}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, tenantPhone: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder="0988xxxxxx"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              {/* Amount & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    {t("landlordDepositsDepositAmountVND")}
                  </label>
                  <input
                    type="number"
                    min={10000}
                    step={50000}
                    value={newDepositForm.amount}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, amount: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder={isEn ? "e.g. 1000000" : "Ví dụ: 1000000"}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    {t("landlordDepositsHoldingDeadline")}
                  </label>
                  <input
                    type="date"
                    value={newDepositForm.expiryDate}
                    onChange={(e) => {
                      setNewDepositForm({ ...newDepositForm, expiryDate: e.target.value });
                      setIsFormDirty(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">{t("landlordDepositsInitialNotes")}</label>
                <textarea
                  rows={3}
                  value={newDepositForm.note}
                  onChange={(e) => {
                    setNewDepositForm({ ...newDepositForm, note: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder={t("landlordDepositsInitialNotesPlaceholder")}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-white flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => requestCloseModal("create")}
                disabled={isSubmitting}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {t("landlordDepositsCancelBtn")}
              </button>
              <button
                type="button"
                onClick={handleCreateDeposit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("landlordDepositsSaving")}
                  </>
                ) : (
                  t("landlordDepositsSaveDepositAction")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. UNIFIED REFUND & DEDUCTION DEPOSIT MODAL */}
      {showRefundModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseModal("refund");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-purple-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600/10 text-purple-600 rounded-2xl shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">{t("landlordDepositsRefundModalTitle")}</h3>
                  <p className="text-xs text-zinc-500 font-semibold">
                    {t("landlordContractsRoomPrefix").replace("{room}", String(showRefundModal.roomNumber))} • {showRefundModal.tenantName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => requestCloseModal("refund")}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              {/* Held Amount Banner */}
              <div className="p-4 bg-gradient-to-r from-purple-500/10 via-zinc-50 to-purple-500/10 border border-purple-200/80 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-600 font-semibold truncate">{t("landlordDepositsCurrentHeldAmount")}</span>
                <span className="font-black text-purple-900 text-sm sm:text-base whitespace-nowrap">
                  {showRefundModal.amount.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫
                </span>
              </div>

              {/* Deduction Amount Input */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700">
                    {t("landlordDepositsDeductAmountLabel")}
                  </label>
                </div>

                <input
                  type="number"
                  min={0}
                  max={showRefundModal.amount}
                  value={refundForm.deductedAmount}
                  onChange={(e) => {
                    setRefundForm({ ...refundForm, deductedAmount: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl font-black text-rose-900 text-base focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRefundForm({ ...refundForm, deductedAmount: "0" });
                      setIsFormDirty(true);
                    }}
                    className={`py-2 px-1 text-center font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center leading-tight ${refundForm.deductedAmount === "0"
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                      }`}
                  >
                    <span className="text-[11px] sm:text-xs whitespace-nowrap">{t("landlordDepositsRefund100")}</span>
                    <span className="text-[9px] font-bold opacity-80 whitespace-nowrap">(0 ₫)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.round(showRefundModal.amount / 2);
                      setRefundForm({ ...refundForm, deductedAmount: String(half) });
                      setIsFormDirty(true);
                    }}
                    className={`py-2 px-1 text-center font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center leading-tight ${Number(refundForm.deductedAmount) === Math.round(showRefundModal.amount / 2)
                        ? "bg-rose-500 text-white shadow-2xs"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                      }`}
                  >
                    <span className="text-[11px] sm:text-xs whitespace-nowrap">{t("landlordDepositsDeduct50")}</span>
                    <span className="text-[9px] font-bold opacity-80 whitespace-nowrap">
                      ({Math.round(showRefundModal.amount / 2).toLocaleString(isEn ? "en-US" : "vi-VN")} ₫)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRefundForm({ ...refundForm, deductedAmount: String(showRefundModal.amount) });
                      setIsFormDirty(true);
                    }}
                    className={`py-2 px-1 text-center font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center leading-tight ${Number(refundForm.deductedAmount) === showRefundModal.amount
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                      }`}
                  >
                    <span className="text-[11px] sm:text-xs whitespace-nowrap">{t("landlordDepositsDeduct100")}</span>
                    <span className="text-[9px] font-bold opacity-80 whitespace-nowrap">{t("landlordDepositsForfeitDeposit")}</span>
                  </button>
                </div>
              </div>

              {/* Deduction Reason */}
              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                  {t("landlordDepositsDeductionReason")}
                </label>
                <input
                  type="text"
                  value={refundForm.deductionReason}
                  onChange={(e) => {
                    setRefundForm({ ...refundForm, deductionReason: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder={t("landlordDepositsDeductionReasonPlaceholder")}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">{t("landlordDepositsAdditionalNotes")}</label>
                <textarea
                  rows={2}
                  value={refundForm.note}
                  onChange={(e) => {
                    setRefundForm({ ...refundForm, note: e.target.value });
                    setIsFormDirty(true);
                  }}
                  placeholder={t("landlordDepositsAdditionalNotesPlaceholder")}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-white flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => requestCloseModal("refund")}
                disabled={isSubmitting}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {t("landlordDepositsCancelBtn")}
              </button>
              <button
                type="button"
                onClick={handleRefundDeposit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("landlordDepositsProcessing")}
                  </>
                ) : (
                  t("landlordDepositsConfirmRefundAction")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. UPGRADE HOLD DEPOSIT MODAL (Convert to Contract) */}
      {showUpgradeModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseModal("upgrade");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">{t("landlordDepositsUpgradeModalTitle")}</h3>
                  <p className="text-xs text-zinc-500 font-semibold">
                    {t("landlordContractsRoomPrefix").replace("{room}", String(showUpgradeModal.roomNumber))} • {showUpgradeModal.tenantName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => requestCloseModal("upgrade")}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              <div className="p-3 bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-emerald-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">
                  <strong className="text-zinc-900 font-black">{t("landlordDepositsSmartFeature")}</strong> {t("landlordDepositsSmartFeatureDesc")}
                </p>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-zinc-600 text-xs">
                  <span>{t("landlordDepositsCollectedHoldingDeposit")}</span>
                  <span className="font-black text-zinc-900 whitespace-nowrap">
                    {showUpgradeModal.amount.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-700 mb-1">
                    {t("landlordDepositsTargetContractDeposit")}
                  </label>
                  <input
                    type="number"
                    value={upgradeForm.targetContractAmount}
                    onChange={(e) => {
                      setUpgradeForm({ ...upgradeForm, targetContractAmount: e.target.value });
                      setIsFormDirty(true);
                    }}
                    placeholder={isEn ? "Enter target contract deposit amount..." : "Nhập số tiền cọc hợp đồng..."}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>

                <div className="p-3.5 bg-amber-500/10 border border-amber-300/80 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-black text-amber-700 tracking-wider block truncate">
                      {t("landlordDepositsAdditionalAmountNeeded")}
                    </span>
                    <span className="text-lg sm:text-xl font-black text-amber-900 leading-none mt-1 block whitespace-nowrap">
                      +{upgradeForm.additionalAmount.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-amber-600 shrink-0" />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-white flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => requestCloseModal("upgrade")}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                {t("landlordDepositsCancelBtn")}
              </button>
              <button
                type="button"
                onClick={handleConfirmUpgradeToContract}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> {t("landlordDepositsSignContractAndTransfer")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. RULE #10 UNSAVED POP-UP CONFIRMATION MODAL */}
      {confirmCloseTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-zinc-900">{t("landlordDepositsConfirmCloseTitle")}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {t("landlordDepositsConfirmCloseDesc")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCloseTarget(null)}
                className="flex-1 py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {t("landlordDepositsConfirmCloseKeep")}
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseModal}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                {t("landlordDepositsConfirmCloseDiscard")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandlordDepositsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
        </div>
      }
    >
      <DepositsContent />
    </Suspense>
  );
}
