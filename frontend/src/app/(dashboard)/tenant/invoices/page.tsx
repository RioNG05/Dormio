"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Camera,
  UploadCloud,
  Copy,
  Check,
  X,
  Zap,
  Droplets,
  Download,
  Info,
  ShieldCheck,
  RefreshCw,
  LayoutGrid,
  List,
  Calendar,
  Eye,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils";
import {
  tenantInvoiceService,
  TenantInvoice,
  TenantUsageAnalyticsResponse,
} from "@/services/tenant-invoice.service";

export default function TenantInvoicesPage() {
  const router = useRouter();
  const t = useTranslations("tenantPortal");
  const { locale } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [allInvoices, setAllInvoices] = useState<TenantInvoice[]>([]);
  const [analytics, setAnalytics] = useState<TenantUsageAnalyticsResponse | null>(null);

  // Active chart tab: 'cost' (financial amount) vs 'consumption' (kWh & m3)
  const [activeChartTab, setActiveChartTab] = useState<"cost" | "consumption">("cost");

  // View Mode: 'grid' (default, Rule #9) vs 'table'
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters & pagination
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === "grid" ? 6 : 10;

  // Chart line toggles
  const [visibleLines, setVisibleLines] = useState({
    electricity: true,
    water: true,
    services: true,
    roomRent: false,
  });

  // Image preview modal (for inspection of past meter pictures)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 1. Fetch real invoices & usage analytics from backend
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [invoicesData, analyticsData] = await Promise.all([
          tenantInvoiceService.getTenantInvoices().catch(() => []),
          tenantInvoiceService.getUsageAnalytics().catch(() => null),
        ]);

        if (!isMounted) return;
        setAllInvoices(invoicesData || []);
        setAnalytics(analyticsData);
      } catch (err: unknown) {
        console.warn("Could not load invoices from backend, using fallback:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeInvoices = allInvoices;

  // Current unpaid invoice and month-over-month calculation
  const currentUnpaid = activeInvoices.find((inv) => inv.status === "unpaid" || inv.status === "overdue");
  const prevInvoice = activeInvoices[1];
  const diff = currentUnpaid && prevInvoice ? currentUnpaid.amount - prevInvoice.amount : 0;
  const percentDiff = prevInvoice ? ((Math.abs(diff) / Math.max(1, prevInvoice.amount)) * 100).toFixed(1) : "0";
  const isUp = diff > 0;

  // Real Cost Chart Data
  const costChartData = useMemo(() => {
    if (analytics?.chartData && analytics.chartData.length > 0) {
      return analytics.chartData.map((d) => ({
        name: d.period,
        [t("roomRent")]: d.roomRent,
        [t("electricityFee")]: d.electricityAmount,
        [t("waterFee")]: d.waterAmount,
        [t("otherServices")]: d.otherServicesAmount,
        total: d.totalAmount,
      }));
    }

    if (activeInvoices.length > 0) {
      return [...activeInvoices].reverse().map((inv) => ({
        name: inv.period,
        [t("roomRent")]: inv.details.find((d) => d.name.toLowerCase().includes("phòng") || d.name === t("roomRent"))?.value || 0,
        [t("electricityFee")]: inv.details.find((d) => d.name.toLowerCase().includes("điện") || d.name === t("electricityFee"))?.value || 0,
        [t("waterFee")]: inv.details.find((d) => d.name.toLowerCase().includes("nước") || d.name === t("waterFee"))?.value || 0,
        [t("otherServices")]: inv.details.find((d) => d.name.toLowerCase().includes("dịch vụ") || d.name === t("otherServices"))?.value || 0,
        total: inv.amount,
      }));
    }

    return [];
  }, [analytics, activeInvoices, t]);

  // Real Consumption Chart Data (kWh & m3)
  const consumptionChartData = useMemo(() => {
    if (analytics?.chartData && analytics.chartData.length > 0) {
      return analytics.chartData.map((d) => ({
        name: d.period,
        [t("electricKwh")]: d.electricityKwh,
        [t("waterM3")]: d.waterM3,
      }));
    }

    if (activeInvoices.length > 0) {
      return [...activeInvoices].reverse().map((inv) => {
        const elec = inv.details.find((d) => d.name.toLowerCase().includes("điện"))?.quantity || 0;
        const water = inv.details.find((d) => d.name.toLowerCase().includes("nước"))?.quantity || 0;
        return {
          name: inv.period,
          [t("electricKwh")]: elec,
          [t("waterM3")]: water,
        };
      });
    }

    return [];
  }, [analytics, activeInvoices, t]);

  // Filtering Logic
  const filteredInvoices = useMemo(() => {
    return activeInvoices.filter((inv) => {
      const matchText =
        inv.id.toLowerCase().includes(filterText.toLowerCase()) ||
        inv.period.includes(filterText);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "unpaid" && (inv.status === "unpaid" || inv.status === "overdue")) ||
        (statusFilter === "paid" && inv.status === "paid");
      return matchText && matchStatus;
    });
  }, [activeInvoices, filterText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };


  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {t("invoicesTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            {t("invoicesSubtitle")}
          </p>
        </div>
      </div>

      {/* Quick Summary Banner: Current Unpaid Bill */}
      {currentUnpaid && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-white border border-orange-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B35] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#FF6B35]/30">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-900">
                  {t("currentBillingCycle")}: {currentUnpaid.period}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                  {t("unpaid")}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mt-1">
                <div className="text-xl sm:text-2xl font-black text-zinc-900">
                  {formatCurrency(currentUnpaid.amount, locale)}
                </div>
                {isUp ? (
                  <span className="inline-flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+{percentDiff}%
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />-{percentDiff}%
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-1">
                {t("dueDate")}:{" "}
                <span className="font-bold text-zinc-700">
                  {currentUnpaid.dueDate}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={() =>
              router.push(
                `/tenant/invoices/${currentUnpaid.id}`
              )
            }
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold shadow-xs shadow-[#FF6B35]/20 cursor-pointer transition-all"
          >
            <span>{t("payNow")}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Analytics Chart Section: Cost vs Consumption */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              {t("chartTitle")}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t("chartSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle Tabs: Cost vs Consumption */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl">
              <button
                onClick={() => setActiveChartTab("cost")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === "cost"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t("chartTabCost")}
              </button>
              <button
                onClick={() => setActiveChartTab("consumption")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === "consumption"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t("chartTabConsumption")}
              </button>
            </div>

            {/* Toggle Lines for Cost Chart */}
            {activeChartTab === "cost" && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setVisibleLines((p) => ({ ...p, electricity: !p.electricity }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    visibleLines.electricity
                      ? "bg-amber-50 border-amber-300 text-amber-700"
                      : "bg-zinc-50 border-zinc-200 text-zinc-400"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  {t("electricityFee")}
                </button>
                <button
                  onClick={() => setVisibleLines((p) => ({ ...p, water: !p.water }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    visibleLines.water
                      ? "bg-sky-50 border-sky-300 text-sky-700"
                      : "bg-zinc-50 border-zinc-200 text-zinc-400"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  {t("waterFee")}
                </button>
                <button
                  onClick={() => setVisibleLines((p) => ({ ...p, services: !p.services }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    visibleLines.services
                      ? "bg-purple-50 border-purple-300 text-purple-700"
                      : "bg-zinc-50 border-zinc-200 text-zinc-400"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  {t("otherServices")}
                </button>
                <button
                  onClick={() => setVisibleLines((p) => ({ ...p, roomRent: !p.roomRent }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    visibleLines.roomRent
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-zinc-50 border-zinc-200 text-zinc-400"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {t("roomRent")}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="w-full h-64 sm:h-72">
          {(activeChartTab === "cost" && costChartData.length === 0) ||
          (activeChartTab === "consumption" && consumptionChartData.length === 0) ? (
            <div className="w-full h-full rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center text-zinc-400 text-xs gap-2">
              <Receipt className="w-8 h-8 text-zinc-300" />
              <span className="font-semibold">{t("noBillingHistory")}</span>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === "cost" ? (
              <LineChart data={costChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val) || 0, locale)}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                {visibleLines.electricity && (
                  <Line type="monotone" dataKey={t("electricityFee")} stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                )}
                {visibleLines.water && (
                  <Line type="monotone" dataKey={t("waterFee")} stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                )}
                {visibleLines.services && (
                  <Line type="monotone" dataKey={t("otherServices")} stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                )}
                {visibleLines.roomRent && (
                  <Line type="monotone" dataKey={t("roomRent")} stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                )}
              </LineChart>
            ) : (
              <BarChart data={consumptionChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey={t("electricKwh")} fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey={t("waterM3")} fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Main Billing Table & Grid Card Section */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                statusFilter === "all"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {t("allInvoices")}
            </button>
            <button
              onClick={() => {
                setStatusFilter("unpaid");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                statusFilter === "unpaid"
                  ? "bg-[#FF6B35] text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {t("unpaid")}
            </button>
            <button
              onClick={() => {
                setStatusFilter("paid");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                statusFilter === "paid"
                  ? "bg-[#2AC1BC] text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {t("paid")}
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* View Mode Toggle: Grid vs Table (Rule #9) */}
            <div className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
                title={t("gridView")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
                title={t("tableView")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("filterByYearMonth")}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#2AC1BC] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Content: Grid or Table */}
        {filteredInvoices.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-zinc-800">
              {t("noInvoicesTitle")}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {t("noInvoicesDesc")}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Invoices Grid View */
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {paginatedInvoices.map((inv) => (
              <div
                key={inv.id}
                className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group space-y-4"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-zinc-900">
                        {inv.period}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                        {inv.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {t("dueDate")}: {inv.dueDate}
                      </span>
                    </div>
                  </div>

                  {inv.status === "paid" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {t("paid")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                      <Clock className="w-3 h-3 text-amber-600" />
                      {t("unpaid")}
                    </span>
                  )}
                </div>

                {/* Amount */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    {t("totalAmount")}
                  </span>
                  <span className="text-xl font-black text-zinc-900 mt-0.5 block">
                    {formatCurrency(inv.amount, locale)}
                  </span>
                </div>

                {/* Line Items Accordion */}
                <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                  <button
                    onClick={() => toggleRow(inv.id)}
                    className="w-full flex items-center justify-between text-xs font-bold text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  >
                    <span>{t("viewDetails")}</span>
                    {expandedRows[inv.id] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedRows[inv.id] && (
                    <div className="space-y-2 pt-2 border-t border-dashed border-zinc-200">
                      {inv.details.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">{item.name}</span>
                          <span className="font-bold text-zinc-800">
                            {formatCurrency(item.value, locale)}
                          </span>
                        </div>
                      ))}

                      {/* Meter Photos (if present) */}
                      {inv.meterReadings && inv.meterReadings.length > 0 && (
                        <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-zinc-400">{t("meterPhotosLabel")}</span>
                          {inv.meterReadings.map((mr, mIdx) => (
                            mr.imageUrl && (
                              <button
                                key={mIdx}
                                onClick={() => setPreviewImage(mr.imageUrl)}
                                className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded text-[10px] font-bold text-zinc-600 flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>{mr.serviceName}</span>
                              </button>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="border-t border-zinc-100 pt-3 flex items-center justify-end">
                  {inv.status !== "paid" ? (
                    <Button
                      onClick={() =>
                        router.push(
                          `/tenant/invoices/${inv.id}`
                        )
                      }
                      className="w-full py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold shadow-xs shadow-[#FF6B35]/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{t("payNow")}</span>
                    </Button>
                  ) : (
                    <div className="text-[11px] text-zinc-400 font-medium w-full text-center">
                      {inv.paidDate ? t("paidOnDate", { date: inv.paidDate }) : t("paid")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-black text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t("tablePeriod")}</th>
                  <th className="px-6 py-4">{t("tableCode")}</th>
                  <th className="px-6 py-4">{t("tableAmount")}</th>
                  <th className="px-6 py-4">{t("tableDueDate")}</th>
                  <th className="px-6 py-4">{t("tableStatus")}</th>
                  <th className="px-6 py-4 text-right">{t("tableAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {paginatedInvoices.map((inv) => (
                  <React.Fragment key={inv.id}>
                    <tr className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-6 py-4 font-black text-zinc-900">
                        {inv.period}
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-500">
                        {inv.id}
                      </td>
                      <td className="px-6 py-4 font-black text-zinc-900">
                        {formatCurrency(inv.amount, locale)}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 font-medium">
                        {inv.dueDate}
                      </td>
                      <td className="px-6 py-4">
                        {inv.status === "paid" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {t("paid")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {t("unpaid")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleRow(inv.id)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
                            title={t("viewDetails")}
                          >
                            {expandedRows[inv.id] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {inv.status !== "paid" && (
                            <Button
                              onClick={() =>
                                router.push(
                                  `/tenant/invoices/${inv.id}`
                                )
                              }
                              size="sm"
                              className="px-3 py-1.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold cursor-pointer transition-all"
                            >
                              {t("payNow")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Table Row Expanded Details */}
                    {expandedRows[inv.id] && (
                      <tr className="bg-zinc-50/60">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">
                              {t("serviceBreakdownForPeriod", { period: inv.period })}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {inv.details.map((item, idx) => (
                                <div key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                  <span className="text-[10px] font-bold text-zinc-400 block">
                                    {item.name}
                                  </span>
                                  <span className="text-xs font-black text-zinc-900 mt-0.5 block">
                                    {formatCurrency(item.value, locale)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {inv.meterReadings && inv.meterReadings.length > 0 && (
                              <div className="pt-2 flex items-center gap-3">
                                <span className="text-xs font-bold text-zinc-500">{t("meterReadingsLabel")}</span>
                                {inv.meterReadings.map((mr, mIdx) => (
                                  <div key={mIdx} className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-zinc-700">
                                      {mr.serviceName}: <strong>{mr.readingValue} {mr.unit}</strong>
                                    </span>
                                    {mr.imageUrl && (
                                      <button
                                        onClick={() => setPreviewImage(mr.imageUrl)}
                                        className="text-[#2AC1BC] hover:underline font-bold text-xs flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" /> {t("viewPhoto")}
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Standard Pagination Bar (Rule #9) */}
        {filteredInvoices.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/50">
            <div className="text-xs font-medium text-zinc-500">
              {t("showingInvoicesRange", {
                from: (currentPage - 1) * itemsPerPage + 1,
                to: Math.min(
                  currentPage * itemsPerPage,
                  filteredInvoices.length
                ),
                total: filteredInvoices.length,
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-zinc-900 cursor-pointer disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === i + 1
                      ? "bg-[#2AC1BC] text-white shadow-xs"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-zinc-900 cursor-pointer disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 3: Meter Image Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-4 overflow-hidden border border-zinc-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-black text-zinc-900">{t("meterReadingPhotoTitle")}</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-80 w-full rounded-2xl overflow-hidden bg-zinc-100">
              <img src={previewImage} alt="Meter reading" className="w-full h-full object-contain" />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl"
              >
                {t("btnClose")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
