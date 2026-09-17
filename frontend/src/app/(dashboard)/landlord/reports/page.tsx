"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, Users, DollarSign, FileSpreadsheet, Calendar,
  Building2, ChevronDown, CheckCircle2, ArrowUpRight,
  ShieldCheck, MessageSquare, Eye, Sparkles, Flame, Rocket,
  Award, Clock, Compass, Lightbulb, Zap, HelpCircle,
  Share2, MapPin, CheckCircle, BarChart3, PieChart, Home, Loader2, Wrench, Inbox,
  LayoutGrid, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  AlertTriangle, RefreshCw, X, ArrowDownRight, Layers, Target
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, BarChart, Bar
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import { formatCurrency, formatVND } from "@/utils";
import {
  getBoardingHouseOverview,
  getMultiPropertyOverview,
  generateMultiPropertyAiStrategy,
  type BoardingHouseOverview,
  type MultiPropertyOverview,
  type MultiPropertyBreakdown,
  type AiStrategyResponse,
} from "@/services/boarding-house.service";

export default function ReportsPage() {
  const { activeBuilding, buildings, selectBuilding } = useAuth();
  const { locale } = useLanguage();
  const t = useTranslations("landlord");
  const isEn = locale === "en";

  const [mounted, setMounted] = useState(false);

  // Mode: "portfolio" (UC-L-24 Multi-Property) or "single" (UC-L-08 Single-Property)
  const [reportMode, setReportMode] = useState<"portfolio" | "single">("portfolio");

  // Single Property State
  const [singleOverview, setSingleOverview] = useState<BoardingHouseOverview | null>(null);
  const [isSingleLoading, setIsSingleLoading] = useState(false);

  // Multi-Property Portfolio State (UC-L-24)
  const [portfolioOverview, setPortfolioOverview] = useState<MultiPropertyOverview | null>(null);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);

  // AI Marketing Strategy State (UC-L-24 / UC-L-12)
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStrategy, setAiStrategy] = useState<AiStrategyResponse | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Rule #9: Grid & Table parallel view mode for Property Comparison (Default: grid)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [windowStart, setWindowStart] = useState(1);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Single Property Overview
  const fetchSingleOverview = useCallback(async (buildingId: string) => {
    if (!buildingId) return;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(buildingId)) return;

    try {
      setIsSingleLoading(true);
      const data = await getBoardingHouseOverview(buildingId);
      setSingleOverview(data);
    } catch {
      setSingleOverview(null);
    } finally {
      setIsSingleLoading(false);
    }
  }, []);

  // Fetch Multi-Property Portfolio Overview (UC-L-24)
  const fetchPortfolioOverview = useCallback(async () => {
    try {
      setIsPortfolioLoading(true);
      const data = await getMultiPropertyOverview();
      setPortfolioOverview(data);
    } catch {
      setPortfolioOverview(null);
      showToast(t("landlordReportsToastFetchError"), "error");
    } finally {
      setIsPortfolioLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setMounted(true);
    fetchPortfolioOverview();
    if (activeBuilding?.id) {
      fetchSingleOverview(activeBuilding.id);
    }
  }, [activeBuilding?.id, fetchPortfolioOverview, fetchSingleOverview]);

  // Handle AI Marketing Strategy Generation
  const handleGenerateAiStrategy = async () => {
    try {
      setIsAiGenerating(true);
      const res = await generateMultiPropertyAiStrategy();
      setAiStrategy(res);
      setShowAiModal(true);
      showToast(t("landlordReportsToastAiSuccess"), "success");
    } catch (err: any) {
      showToast(err?.message || t("landlordReportsToastAiError"), "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Pagination for Properties Breakdown (Rule #9)
  const propertiesList = portfolioOverview?.propertiesBreakdown ?? [];
  const totalItems = propertiesList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset page when pageSize or totalItems change
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Adjust windowStart for 5-page window jumping
  useEffect(() => {
    if (page < windowStart) {
      setWindowStart(Math.max(1, page - 4));
    } else if (page > windowStart + 4) {
      setWindowStart(page);
    }
  }, [page, windowStart]);

  const displayedProperties = useMemo(() => {
    const start = (page - 1) * pageSize;
    return propertiesList.slice(start, start + pageSize);
  }, [propertiesList, page, pageSize]);

  // Switch view mode and update default pageSize per Rule #9
  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    setPage(1);
    setWindowStart(1);
    setPageSize(mode === "grid" ? 6 : 10);
  };

  // Export CSV Data
  const handleExportCsv = () => {
    if (reportMode === "portfolio" && portfolioOverview) {
      const headers = [
        t("landlordReportsCsvId"),
        t("landlordReportsCsvName"),
        t("landlordReportsCsvAddress"),
        t("landlordReportsCsvTotalRooms"),
        t("landlordReportsCsvOccupied"),
        t("landlordReportsCsvVacant"),
        t("landlordReportsCsvOccupancyRate"),
        t("landlordReportsCsvRevenue"),
        t("landlordReportsCsvExpenses"),
        t("landlordReportsCsvNetProfit"),
        t("landlordReportsCsvDebt"),
        t("landlordReportsCsvExpiring"),
      ];
      const rows = (portfolioOverview.propertiesBreakdown ?? []).map((p) => [
        `"${p.id}"`,
        `"${p.name}"`,
        `"${p.address}"`,
        p.totalRooms,
        p.occupiedRooms,
        p.vacantRooms,
        `"${p.occupancyRate}"`,
        p.currentMonthRevenue,
        p.currentMonthExpenses,
        p.netProfit,
        p.unpaidDebt,
        p.expiringContractsCount,
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bao_Cao_Chuoi_Nha_Tro_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(t("landlordReportsExportSuccess"));
    } else if (singleOverview) {
      showToast(t("landlordReportsExportSingleStarting"));
    }
  };

  if (!mounted) return null;

  // Single Property Stats
  const singleRooms = singleOverview?.rooms ?? {
    totalRooms: activeBuilding?.totalRooms || 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    depositRooms: 0,
    maintenanceRooms: 0,
    occupancyRate: "0%",
  };

  const singleFinancial = singleOverview?.financial ?? {
    currentMonthRevenue: "0.00",
    unpaidDebt: "0.00",
    unpaidInvoicesCount: 0,
    paidInvoicesCount: 0,
  };

  const singleCollection = singleOverview?.collectionStatus ?? {
    paidCount: 0,
    paidAmount: "0.00",
    unpaidCount: 0,
    unpaidAmount: "0.00",
    overdueCount: 0,
    overdueAmount: "0.00",
    totalBilledAmount: "0.00",
    collectionRate: "0%",
  };

  // Multi-Property Portfolio Summary
  const portfolioSummary = portfolioOverview?.portfolioSummary ?? {
    totalProperties: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    depositRooms: 0,
    maintenanceRooms: 0,
    occupancyRate: "0%",
    currentMonthRevenue: "0.00",
    currentMonthExpenses: "0.00",
    netProfit: "0.00",
    unpaidDebt: "0.00",
    unpaidInvoicesCount: 0,
    paidInvoicesCount: 0,
    collectionRate: "0%",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-70 bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#2AC1BC]" />
          <span className="text-xs sm:text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <span>{t("landlordReportsTitle")}</span>
            <span className="px-2.5 py-0.5 text-[11px] font-black bg-[#2AC1BC]/15 text-[#138e89] rounded-full border border-[#2AC1BC]/30 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {reportMode === "portfolio" ? t("landlordReportsBadgePortfolio") : activeBuilding?.name || t("landlordReportsBadgeSingleFallback")}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            {reportMode === "portfolio"
              ? t("landlordReportsSubtitlePortfolio")
              : (activeBuilding?.address || t("landlordReportsSubtitleSingle"))}
          </p>
        </div>

        {/* Action Controls: Mode Switcher, Building Selector & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Mode Switcher Tabs */}
          <div className="bg-zinc-100 p-1 rounded-xl flex items-center gap-1 border border-zinc-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setReportMode("portfolio")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                reportMode === "portfolio"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#2AC1BC]" />
              <span>{t("landlordReportsTabPortfolio")}</span>
            </button>
            <button
              type="button"
              onClick={() => setReportMode("single")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                reportMode === "single"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span>{t("landlordReportsTabSingle")}</span>
            </button>
          </div>

          {/* Dynamic Building Selector (When in single mode) */}
          {reportMode === "single" && (
            <div className="relative">
              <select
                value={activeBuilding?.id || ""}
                onChange={(e) => selectBuilding(e.target.value)}
                className="pl-8.5 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] transition-colors cursor-pointer appearance-none shadow-2xs"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* AI Strategy Generation Button (UC-L-24 / UC-L-12) */}
          {reportMode === "portfolio" && (
            <button
              type="button"
              disabled={isAiGenerating}
              onClick={handleGenerateAiStrategy}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-linear-to-r from-[#2AC1BC] to-teal-600 hover:opacity-95 rounded-xl transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-60"
            >
              {isAiGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{isAiGenerating ? t("landlordReportsAiAnalyzing") : t("landlordReportsAiButton")}</span>
            </button>
          )}

          {/* Export Excel / CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#138e89] bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 border border-[#2AC1BC]/30 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2AC1BC]" />
            <span>{t("landlordReportsExportCsv")}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MULTI-PROPERTY PORTFOLIO (UC-L-24)                                 */}
      {/* ========================================================================= */}
      {reportMode === "portfolio" && (
        <>
          {isPortfolioLoading ? (
            <div className="py-20 text-center text-zinc-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2AC1BC]" />
              <p className="text-xs font-semibold">{t("landlordReportsPortfolioLoading")}</p>
            </div>
          ) : (
            <>
              {/* AI Marketing Strategy Banner Card */}
              <div className="bg-linear-to-r from-teal-900 via-zinc-900 to-indigo-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-teal-800/40">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#2AC1BC]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {t("landlordReportsAiBannerBadge")}
                      </span>
                      <span className="text-xs text-zinc-300">{t("landlordReportsAiBannerTag")}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                      {t("landlordReportsAiBannerTitle")}
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {t("landlordReportsAiBannerDesc", { count: portfolioSummary.totalProperties })}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isAiGenerating}
                    onClick={handleGenerateAiStrategy}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold rounded-2xl shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#2AC1BC]" />
                        <span>{t("landlordReportsAiBannerCalculating")}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>{aiStrategy ? t("landlordReportsAiBannerReview") : t("landlordReportsAiBannerGenerate")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 4 Real Portfolio KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Chain-wide Net Profit */}
                <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">{t("landlordReportsKpiNetProfit")}</span>
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                      {formatCurrency(portfolioSummary.netProfit)}
                    </span>
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mt-1">
                      <span>{t("landlordReportsKpiRevenueSub", { amount: formatCurrency(portfolioSummary.currentMonthRevenue) })}</span>
                      <span>{t("landlordReportsKpiExpensesSub", { amount: formatCurrency(portfolioSummary.currentMonthExpenses) })}</span>
                    </div>
                  </div>
                </div>

                {/* KPI 2: Chain-wide Occupancy Rate */}
                <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">{t("landlordReportsKpiOccupancyRate")}</span>
                    <div className="w-9 h-9 rounded-2xl bg-[#2AC1BC]/15 text-[#2AC1BC] flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                      {portfolioSummary.occupancyRate}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                      <span>{t("landlordReportsKpiOccupancyRoomsSub", { occupied: portfolioSummary.occupiedRooms, total: portfolioSummary.totalRooms, properties: portfolioSummary.totalProperties })}</span>
                    </div>
                  </div>
                </div>

                {/* KPI 3: Outstanding Debt */}
                <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">{t("landlordReportsKpiTotalDebt")}</span>
                    <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Flame className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight">
                      {formatCurrency(portfolioSummary.unpaidDebt)}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                      <span>{t("landlordReportsKpiUnpaidInvoicesSub", { count: portfolioSummary.unpaidInvoicesCount })}</span>
                    </div>
                  </div>
                </div>

                {/* KPI 4: Collection Progress */}
                <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">{t("landlordReportsKpiCollectionRate")}</span>
                    <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                      {portfolioSummary.collectionRate}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                      <span>{t("landlordReportsKpiPaidInvoicesSub", { count: portfolioSummary.paidInvoicesCount })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combined 6-Month Trends: Revenue & Occupancy */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 6-Month Revenue Trend */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                        <span>{t("landlordReportsRevenueChartTitle")}</span>
                        <span className="w-2 h-2 rounded-full bg-[#2AC1BC] animate-pulse" />
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {t("landlordReportsRevenueChartDesc")}
                      </p>
                    </div>
                    <span className="p-2 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC]">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>

                  {(!portfolioOverview?.revenueChart || portfolioOverview.revenueChart.length === 0) ? (
                    <div className="py-16 text-center space-y-2">
                      <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                      <p className="text-xs font-bold text-zinc-600">{t("landlordReportsChartEmptyTransactions")}</p>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={(portfolioOverview.revenueChart ?? []).map((p) => ({
                            name: `T${p.month}`,
                            revenue: p.val,
                            fullAmount: p.fullAmount,
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                          <Tooltip
                            formatter={(val: any) => [`${val}M ₫`, t("landlordReportsChartRevenueTooltip")]}
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                          />
                          <Line type="monotone" dataKey="revenue" name={t("landlordReportsChartRevenueLegend")} stroke="#2AC1BC" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 6-Month Occupancy Trend */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                        <span>{t("landlordReportsOccupancyChartTitle")}</span>
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {t("landlordReportsOccupancyChartDesc")}
                      </p>
                    </div>
                    <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <Home className="w-4 h-4" />
                    </span>
                  </div>

                  {(!portfolioOverview?.occupancyChart || portfolioOverview.occupancyChart.length === 0) ? (
                    <div className="py-16 text-center space-y-2">
                      <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                      <p className="text-xs font-bold text-zinc-600">{t("landlordReportsChartEmptyRooms")}</p>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={(portfolioOverview.occupancyChart ?? []).map((o) => ({
                            name: `T${o.month}`,
                            rate: o.occupied,
                            total: o.total,
                            count: o.count,
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                          <Tooltip
                            formatter={(val: any) => [`${val}%`, t("landlordReportsChartOccupancyTooltip")]}
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                          />
                          <Line type="monotone" dataKey="rate" name={t("landlordReportsChartOccupancyLegend")} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Cross-Property Breakdown Table / Grid (Rule #9 Compliant) */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                      <span>{t("landlordReportsCompareTitle")}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-zinc-100 text-zinc-600">
                        {t("landlordReportsCompareCount", { count: totalItems })}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {t("landlordReportsCompareDesc")}
                    </p>
                  </div>

                  {/* Rule #9 View Toggle Buttons: Grid & Table */}
                  <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleViewModeChange("grid")}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === "grid"
                          ? "bg-white text-zinc-900 shadow-xs"
                          : "text-zinc-400 hover:text-zinc-700"
                      }`}
                      title={t("landlordReportsTooltipGrid")}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewModeChange("table")}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === "table"
                          ? "bg-white text-zinc-900 shadow-xs"
                          : "text-zinc-400 hover:text-zinc-700"
                      }`}
                      title={t("landlordReportsTooltipTable")}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {displayedProperties.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                    <p className="text-xs font-bold text-zinc-600">{t("landlordReportsCompareEmpty")}</p>
                  </div>
                ) : viewMode === "grid" ? (
                  /* Grid View (Default) */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedProperties.map((p) => {
                      const occNum = parseFloat(p.occupancyRate) || 0;
                      return (
                        <div
                          key={p.id}
                          className="bg-white p-5 rounded-2xl border border-zinc-200 hover:border-[#2AC1BC]/50 hover:shadow-md transition-all space-y-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-zinc-900">{p.name}</h4>
                              <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{p.address}</p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                occNum >= 80
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : occNum >= 50
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {p.occupancyRate}
                            </span>
                          </div>

                          {/* Room Breakdown Pills */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold">
                            <div className="p-1.5 bg-zinc-50 rounded-lg">
                              <span className="text-zinc-400 block text-[10px]">{t("landlordReportsCardTotalRooms")}</span>
                              <span className="text-zinc-900">{p.totalRooms}</span>
                            </div>
                            <div className="p-1.5 bg-emerald-50/60 rounded-lg text-emerald-800">
                              <span className="text-emerald-600 block text-[10px]">{t("landlordReportsCardOccupied")}</span>
                              <span>{p.occupiedRooms}</span>
                            </div>
                            <div className="p-1.5 bg-blue-50/60 rounded-lg text-blue-800">
                              <span className="text-blue-600 block text-[10px]">{t("landlordReportsCardVacant")}</span>
                              <span>{p.vacantRooms}</span>
                            </div>
                          </div>

                          {/* Financial Breakdown */}
                          <div className="space-y-1.5 text-xs pt-1 border-t border-zinc-100 font-medium">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-500">{t("landlordReportsCardMonthlyRevenue")}</span>
                              <span className="font-bold text-zinc-900">{formatCurrency(p.currentMonthRevenue)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-500">{t("landlordReportsCardMonthlyExpenses")}</span>
                              <span className="font-bold text-zinc-700">{formatCurrency(p.currentMonthExpenses)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-500 font-bold">{t("landlordReportsCardNetProfit")}</span>
                              <span className="font-extrabold text-emerald-600">{formatCurrency(p.netProfit)}</span>
                            </div>
                            <div className="flex items-center justify-between text-rose-600 text-[11px]">
                              <span>{t("landlordReportsCardUnpaidDebt")}</span>
                              <span className="font-bold">{formatCurrency(p.unpaidDebt)}</span>
                            </div>
                          </div>

                          {/* Expiring contracts tag */}
                          {p.expiringContractsCount > 0 && (
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-800 text-[11px] font-bold flex items-center justify-between">
                              <span>{t("landlordReportsCardExpiringSoon")}</span>
                              <span className="px-1.5 py-0.5 bg-amber-200/60 rounded-md">{t("landlordReportsCardExpiringCount", { count: p.expiringContractsCount })}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Table View */
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
                        <tr>
                          <th className="p-3">{t("landlordReportsThProperty")}</th>
                          <th className="p-3 text-center">{t("landlordReportsThRooms")}</th>
                          <th className="p-3 text-center">{t("landlordReportsThOccupancy")}</th>
                          <th className="p-3 text-right">{t("landlordReportsThRevenue")}</th>
                          <th className="p-3 text-right">{t("landlordReportsThExpenses")}</th>
                          <th className="p-3 text-right">{t("landlordReportsThNetProfit")}</th>
                          <th className="p-3 text-right">{t("landlordReportsThDebt")}</th>
                          <th className="p-3 text-center">{t("landlordReportsThExpiring")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        {displayedProperties.map((p) => {
                          const occNum = parseFloat(p.occupancyRate) || 0;
                          return (
                            <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                              <td className="p-3 font-bold text-zinc-900">
                                <div>{p.name}</div>
                                <div className="text-[10px] text-zinc-400 font-normal">{p.address}</div>
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-emerald-700 font-bold">{p.occupiedRooms}</span> /{" "}
                                <span className="text-blue-700 font-bold">{p.vacantRooms}</span> /{" "}
                                <span>{p.totalRooms}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    occNum >= 80
                                      ? "bg-emerald-50 text-emerald-700"
                                      : occNum >= 50
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {p.occupancyRate}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-zinc-900">{formatCurrency(p.currentMonthRevenue)}</td>
                              <td className="p-3 text-right text-zinc-600">{formatCurrency(p.currentMonthExpenses)}</td>
                              <td className="p-3 text-right font-extrabold text-emerald-600">{formatCurrency(p.netProfit)}</td>
                              <td className="p-3 text-right font-bold text-rose-600">{formatCurrency(p.unpaidDebt)}</td>
                              <td className="p-3 text-center">
                                {p.expiringContractsCount > 0 ? (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">
                                    {p.expiringContractsCount}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Rule #9 Standardized Pagination */}
                {totalItems > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-100 text-xs font-bold text-zinc-600">
                    {/* Items per page & range */}
                    <div className="flex items-center gap-2">
                      <span>{t("landlordReportsPaginationShowing")}</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={pageSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (val > 0) setPageSize(val);
                        }}
                        className="w-14 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-center text-xs font-bold focus:outline-none focus:border-[#2AC1BC]"
                      />
                      <span>{t("landlordReportsPaginationPerPage")}</span>
                      <span className="text-zinc-400 mx-1">|</span>
                      <span>
                        {t("landlordReportsPaginationRange", {
                          start: Math.min(totalItems, (page - 1) * pageSize + 1),
                          end: Math.min(totalItems, page * pageSize),
                          total: totalItems,
                        })}
                      </span>
                    </div>

                    {/* Window Jumping 5-page buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage(1)}
                        className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title={t("landlordReportsPaginationFirst")}
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title={t("landlordReportsPaginationPrev")}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      {Array.from({ length: Math.min(5, totalPages - windowStart + 1) }, (_, i) => {
                        const pNum = windowStart + i;
                        return (
                          <button
                            key={pNum}
                            type="button"
                            onClick={() => setPage(pNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              page === pNum
                                ? "bg-[#2AC1BC] text-white shadow-xs"
                                : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            {pNum}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title={t("landlordReportsPaginationNext")}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={page === totalPages}
                        onClick={() => setPage(totalPages)}
                        className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title={t("landlordReportsPaginationLast")}
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Expiring Contracts Across All Properties */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                      <span>{t("landlordReportsExpiringTitle")}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800">
                        {t("landlordReportsExpiringBadge", { count: portfolioOverview?.expiringContracts?.length || 0 })}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {t("landlordReportsExpiringDesc")}
                    </p>
                  </div>
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>

                {(!portfolioOverview?.expiringContracts || portfolioOverview.expiringContracts.length === 0) ? (
                  <div className="py-8 text-center text-zinc-400 text-xs font-semibold">
                    {t("landlordReportsExpiringEmpty")}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(portfolioOverview.expiringContracts ?? []).map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-zinc-900">{c.propertyName} — {c.room}</div>
                          <div className="text-zinc-600 font-medium">{t("landlordReportsExpiringTenant")} {c.tenant} {c.phone && `(${c.phone})`}</div>
                          <div className="text-[11px] text-zinc-500">{t("landlordReportsExpiringEndDate")} {c.endDate}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="px-2 py-1 bg-amber-200/80 text-amber-900 rounded-lg font-black text-[11px] block">
                            {t("landlordReportsExpiringDaysLeft", { days: c.daysLeft })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SINGLE PROPERTY (UC-L-08)                                         */}
      {/* ========================================================================= */}
      {reportMode === "single" && (
        <>
          {isSingleLoading ? (
            <div className="py-20 text-center text-zinc-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2AC1BC]" />
              <p className="text-xs font-semibold">{t("landlordReportsSingleLoading")}</p>
            </div>
          ) : (
            <>
              {/* 4 Real Single-Property KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">{t("landlordReportsSingleKpiOccupancy")}</span>
                    <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                      {singleRooms.occupancyRate}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                      <span>{t("landlordReportsSingleKpiOccupancySub", { occupied: singleRooms.occupiedRooms, total: singleRooms.totalRooms })}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">{t("landlordReportsSingleKpiRevenue")}</span>
                    <div className="w-9 h-9 rounded-2xl bg-[#2AC1BC]/15 text-[#2AC1BC] flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-[#2AC1BC] tracking-tight">
                      {formatVND(Number(singleFinancial.currentMonthRevenue) || 0)}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                      <span>{t("landlordReportsSingleKpiRevenueSub", { count: singleFinancial.paidInvoicesCount })}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">{t("landlordReportsSingleKpiDebt")}</span>
                    <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Flame className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight">
                      {formatVND(Number(singleFinancial.unpaidDebt) || 0)}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                      <span>{t("landlordReportsSingleKpiDebtSub", { count: singleFinancial.unpaidInvoicesCount })}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">{t("landlordReportsSingleKpiCollection")}</span>
                    <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                      {singleCollection.collectionRate}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                      <span>{t("landlordReportsSingleKpiCollectionSub", { count: singleOverview?.depositNotifications?.length || 0 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Single Property Charts & Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                        <span>{t("landlordReportsSingleChartTitle")}</span>
                        <span className="w-2 h-2 rounded-full bg-[#2AC1BC] animate-pulse" />
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {t("landlordReportsSingleChartDesc", { name: activeBuilding?.name || "" })}
                      </p>
                    </div>
                    <span className="p-2 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC]">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>

                  {(!singleOverview?.revenueChart || singleOverview.revenueChart.length === 0) ? (
                    <div className="py-16 text-center space-y-2">
                      <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                      <p className="text-xs font-bold text-zinc-600">{t("landlordReportsChartEmptyTransactions")}</p>
                    </div>
                  ) : (
                    <div className="h-64 sm:h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={singleOverview.revenueChart.map((pt) => ({
                            name: `T${pt.month}`,
                            revenue: pt.val,
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                          <Tooltip
                            formatter={(val: any) => [`${val}M ₫`, t("landlordReportsChartRevenueTooltip")]}
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                          />
                          <Line type="monotone" dataKey="revenue" name={t("landlordReportsChartRevenueTooltip")} stroke="#2AC1BC" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 mb-1">
                      {t("landlordReportsSingleRoomStatusTitle")}
                    </h3>
                    <p className="text-xs text-zinc-500 mb-4">
                      {t("landlordReportsSingleRoomStatusDesc")}
                    </p>

                    <div className="space-y-3">
                      <div className="p-3 bg-[#2AC1BC]/10 rounded-2xl flex items-center justify-between text-xs font-bold text-[#138e89]">
                        <span>{t("landlordReportsSingleRoomOccupied")}</span>
                        <span className="text-sm font-black">{t("landlordReportsSingleRoomCount", { count: singleRooms.occupiedRooms })}</span>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-2xl flex items-center justify-between text-xs font-bold text-blue-700">
                        <span>{t("landlordReportsSingleRoomVacant")}</span>
                        <span className="text-sm font-black">{t("landlordReportsSingleRoomCount", { count: singleRooms.vacantRooms })}</span>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-2xl flex items-center justify-between text-xs font-bold text-purple-700">
                        <span>{t("landlordReportsSingleRoomDeposit")}</span>
                        <span className="text-sm font-black">{t("landlordReportsSingleRoomCount", { count: singleRooms.depositRooms })}</span>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-700">
                        <span>{t("landlordReportsSingleRoomMaintenance")}</span>
                        <span className="text-sm font-black">{t("landlordReportsSingleRoomCount", { count: singleRooms.maintenanceRooms })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                    <span>{t("landlordReportsSingleTotalLabel")} <strong className="text-zinc-900 font-bold">{t("landlordReportsSingleTotalRooms", { count: singleRooms.totalRooms })}</strong></span>
                    <span className="text-[#2AC1BC] font-extrabold">{t("landlordReportsSingleOccupancySuffix", { rate: singleRooms.occupancyRate })}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* AI MARKETING STRATEGY MODAL (UC-L-24 & UC-L-12)                           */}
      {/* ========================================================================= */}
      {showAiModal && aiStrategy && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#2AC1BC] to-teal-700 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900">{aiStrategy.title}</h3>
                  <p className="text-xs text-zinc-500">
                    {t("landlordReportsAiCreatedAt", {
                      date: new Date(aiStrategy.createdAt).toLocaleString(isEn ? "en-US" : "vi-VN"),
                    })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-950 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#138e89]">
                  <Compass className="w-3.5 h-3.5" />
                  <span>{t("landlordReportsAiSummaryHeader")}</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">{aiStrategy.executiveSummary}</p>
              </div>

              {/* 3 Strategic Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Pillar 1: Pricing */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>{t("landlordReportsAiPillarPricing")}</span>
                  </div>
                  <ul className="text-xs text-zinc-600 space-y-1.5 list-disc pl-4">
                    {aiStrategy.pricingRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Pillar 2: Marketing */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                    <Rocket className="w-4 h-4 text-blue-600" />
                    <span>{t("landlordReportsAiPillarMarketing")}</span>
                  </div>
                  <ul className="text-xs text-zinc-600 space-y-1.5 list-disc pl-4">
                    {aiStrategy.marketingCampaigns.map((camp, i) => (
                      <li key={i}>{camp}</li>
                    ))}
                  </ul>
                </div>

                {/* Pillar 3: Operations */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>{t("landlordReportsAiPillarOperations")}</span>
                  </div>
                  <ul className="text-xs text-zinc-600 space-y-1.5 list-disc pl-4">
                    {aiStrategy.operationalOptimizations.map((op, i) => (
                      <li key={i}>{op}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 30-Day Action Plan Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2AC1BC]" />
                  <span>{t("landlordReportsAiActionPlanTitle")}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiStrategy.actionPlan30Days.map((step, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl border border-zinc-200 bg-white hover:border-[#2AC1BC]/60 hover:shadow-xs transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#2AC1BC]/15 text-[#138e89]">
                          {step.dayRange}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold">
                          {t("landlordReportsAiStepPrefix", { step: i + 1 })}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-zinc-900">{step.title}</div>
                      <p className="text-[11px] text-zinc-500 leading-normal">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-zinc-100 flex items-center justify-end gap-2.5 bg-zinc-50/50">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
              >
                {t("landlordReportsAiCloseBtn")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiModal(false);
                  showToast(t("landlordReportsToastAiPlanSaved"));
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#23a5a0] rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {t("landlordReportsAiSavePlanBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
