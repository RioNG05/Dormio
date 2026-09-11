"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, Users, DollarSign, FileSpreadsheet, Calendar,
  Building2, ChevronDown, CheckCircle2, ArrowUpRight,
  ShieldCheck, MessageSquare, Eye, Sparkles, Flame, Rocket,
  Award, Clock, Compass, Lightbulb, Zap, HelpCircle,
  Share2, MapPin, CheckCircle, BarChart3, PieChart, Home, Loader2, Wrench, Inbox
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { formatVND } from "@/utils";
import {
  getBoardingHouseOverview,
  type BoardingHouseOverview,
} from "@/services/boarding-house.service";

export default function ReportsPage() {
  const { activeBuilding, buildings, selectBuilding } = useAuth();
  const t = useTranslations("reports");
  const { locale } = useLanguage();

  const [mounted, setMounted] = useState(false);
  const [overview, setOverview] = useState<BoardingHouseOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<"month" | "6m" | "year">("6m");

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOverview = useCallback(async (buildingId: string) => {
    if (!buildingId) return;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(buildingId)) return;

    try {
      setIsLoading(true);
      const data = await getBoardingHouseOverview(buildingId);
      setOverview(data);
    } catch {
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (activeBuilding?.id) {
      fetchOverview(activeBuilding.id);
    }
  }, [activeBuilding?.id, fetchOverview]);

  // Derived real revenue chart data
  const revenueChartData = useMemo(() => {
    if (!overview?.revenueChart || overview.revenueChart.length === 0) return [];
    return overview.revenueChart.map((pt) => ({
      name: `T${pt.month}`,
      revenue: pt.val,
      fullAmount: pt.fullAmount,
    }));
  }, [overview?.revenueChart]);

  if (!mounted) return null;

  const rooms = overview?.rooms ?? {
    totalRooms: activeBuilding?.totalRooms || 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    depositRooms: 0,
    maintenanceRooms: 0,
    occupancyRate: "0%",
  };

  const financial = overview?.financial ?? {
    currentMonthRevenue: "0.00",
    unpaidDebt: "0.00",
    unpaidInvoicesCount: 0,
    paidInvoicesCount: 0,
  };

  const collection = overview?.collectionStatus ?? {
    paidCount: 0,
    paidAmount: "0.00",
    unpaidCount: 0,
    unpaidAmount: "0.00",
    overdueCount: 0,
    overdueAmount: "0.00",
    totalBilledAmount: "0.00",
    collectionRate: "0%",
  };

  const deposits = overview?.depositNotifications ?? [];

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
            <span>{locale === "en" ? "Property Performance & Analytics" : "Báo Cáo & Thống Kê Nhà Trọ"}</span>
            <span className="px-2.5 py-0.5 text-[11px] font-black bg-[#2AC1BC]/15 text-[#138e89] rounded-full border border-[#2AC1BC]/30">
              {activeBuilding?.name || "Cơ sở"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            {activeBuilding?.address || "Dữ liệu vận hành, doanh thu và tỷ lệ lấp đầy phòng theo thời gian thực."}
          </p>
        </div>

        {/* Action Controls: Building, Timeframe & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Dynamic Building Selector (UC-L-23) */}
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

          {/* Timeframe Filter */}
          <div className="relative">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="pl-8.5 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] transition-colors cursor-pointer appearance-none shadow-2xs"
            >
              <option value="month">{t("timeframeMonth")}</option>
              <option value="6m">{locale === "en" ? "Last 6 Months" : "6 tháng gần nhất"}</option>
              <option value="year">{t("timeframeYear")}</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={() => showToast(t("exportSuccessExcel"))}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#138e89] bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 border border-[#2AC1BC]/30 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2AC1BC]" />
            <span>{t("exportExcel")}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-zinc-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2AC1BC]" />
          <p className="text-xs font-semibold">Đang tải số liệu báo cáo của cơ sở...</p>
        </div>
      ) : (
        <>
          {/* ================= 4 REAL KPI CARDS ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Tỷ lệ lấp đầy & Tổng số phòng */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">Tỷ lệ lấp đầy phòng</span>
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                  {rooms.occupancyRate}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                  <span>{rooms.occupiedRooms} / {rooms.totalRooms} phòng có người ở</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Doanh thu tháng này */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">Doanh thu tháng này</span>
                <div className="w-9 h-9 rounded-2xl bg-[#2AC1BC]/15 text-[#2AC1BC] flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-[#2AC1BC] tracking-tight">
                  {formatVND(Number(financial.currentMonthRevenue) || 0)}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                  <span>Đã thu {financial.paidInvoicesCount} hóa đơn</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Công nợ chưa thu */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">Công nợ chưa thu</span>
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight">
                  {formatVND(Number(financial.unpaidDebt) || 0)}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                  <span>{financial.unpaidInvoicesCount} hóa đơn chưa tất toán</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Tỷ lệ thu hồi & cọc */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">Tiến độ thu tiền & Cọc</span>
                <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                  {collection.collectionRate}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
                  <span>{deposits.length} khoản cọc giữ chỗ đang quản lý</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= REVENUE CHART & OCCUPANCY BREAKDOWN ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Real Revenue Chart (2 cols) */}
            <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                    <span>Xu hướng doanh thu thực tế qua các tháng</span>
                    <span className="w-2 h-2 rounded-full bg-[#2AC1BC] animate-pulse" />
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Biểu đồ doanh thu thực thu theo tháng của cơ sở {activeBuilding?.name}
                  </p>
                </div>
                <span className="p-2 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC]">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>

              {revenueChartData.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                  <p className="text-xs font-bold text-zinc-600">Chưa có dữ liệu giao dịch</p>
                  <p className="text-[11px] text-zinc-400">Doanh thu sẽ hiển thị khi có hóa đơn đã thanh toán.</p>
                </div>
              ) : (
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                      <Tooltip
                        formatter={(val: any) => [`${val}M ₫`, "Doanh thu"]}
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                      />
                      <Line type="monotone" dataKey="revenue" name="Doanh thu (triệu VNĐ)" stroke="#2AC1BC" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Room Status Summary (1 col) */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 mb-1">
                  Trạng Thái Phòng Trọ
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                  Phân bổ phòng ốc hiện tại của cơ sở
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-[#2AC1BC]/10 rounded-2xl flex items-center justify-between text-xs font-bold text-[#138e89]">
                    <span>Đang ở / Đã thuê</span>
                    <span className="text-sm font-black">{rooms.occupiedRooms} phòng</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-2xl flex items-center justify-between text-xs font-bold text-blue-700">
                    <span>Phòng trống sẵn sàng</span>
                    <span className="text-sm font-black">{rooms.vacantRooms} phòng</span>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-2xl flex items-center justify-between text-xs font-bold text-purple-700">
                    <span>Đang giữ chỗ / Cọc</span>
                    <span className="text-sm font-black">{rooms.depositRooms} phòng</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-700">
                    <span>Đang sửa chữa / Bảo trì</span>
                    <span className="text-sm font-black">{rooms.maintenanceRooms} phòng</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span>Tổng cộng: <strong className="text-zinc-900 font-bold">{rooms.totalRooms} phòng</strong></span>
                <span className="text-[#2AC1BC] font-extrabold">{rooms.occupancyRate} lấp đầy</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
