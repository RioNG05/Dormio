"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Building2,
  Sparkles,
  CheckCircle2,
  Wrench,
  QrCode,
  Clock,
  Shield,
  Home,
  BarChart2,
  ChevronRight,
  Inbox,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/utils";
import {
  getBoardingHouseOverview,
  type BoardingHouseOverview,
} from "@/services/boarding-house.service";

export default function LandlordDashboardPage() {
  const router = useRouter();
  const { buildings, isBuildingsLoading, activeBuilding } = useAuth();

  const [overview, setOverview] = useState<BoardingHouseOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rangeMode, setRangeMode] = useState<"6m" | "12m">("6m");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // UC-L-01: Gated access. Users with 0 properties must be directed to /landlord/setup
  useEffect(() => {
    if (!isBuildingsLoading && buildings.length === 0) {
      router.replace("/landlord/setup");
    }
  }, [isBuildingsLoading, buildings.length, router]);

  const fetchOverview = useCallback(async (buildingId: string) => {
    if (!buildingId) return;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(buildingId)) return;

    try {
      setIsLoading(true);
      const data = await getBoardingHouseOverview(buildingId);
      setOverview(data);
    } catch {
      // Fallback: If API fails or building has no records yet, keep null or empty
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeBuilding?.id) {
      fetchOverview(activeBuilding.id);
    }
  }, [activeBuilding?.id, fetchOverview]);

  // Derived revenue chart calculation
  const chartData = useMemo(() => {
    if (!overview?.revenueChart || overview.revenueChart.length === 0) return [];
    const raw = overview.revenueChart;
    const sliceCount = rangeMode === "6m" ? 6 : 12;
    const sliced = raw.slice(-sliceCount);

    const maxVal = Math.max(...sliced.map((d) => d.val), 10);
    const count = sliced.length;

    return sliced.map((pt, i) => {
      const x = count > 1 ? (i / (count - 1)) * 600 : 300;
      const y = 90 - (pt.val / maxVal) * 75; // leave margin top and bottom
      return {
        ...pt,
        x,
        y,
      };
    });
  }, [overview?.revenueChart, rangeMode]);

  const linePathD = useMemo(() => {
    if (chartData.length === 0) return "";
    return chartData.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`).join(" ");
  }, [chartData]);

  // Gating check: if no buildings yet, show loading spinner while redirecting to /landlord/setup
  if (isBuildingsLoading || buildings.length === 0 || !activeBuilding?.id) {
    return (
      <div className="py-24 text-center text-zinc-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2AC1BC]" />
        <p className="text-xs font-semibold">
          {buildings.length === 0
            ? "Đang chuyển hướng tới trang thiết lập nhà trọ..."
            : "Đang tải dữ liệu tổng quan tòa nhà..."}
        </p>
      </div>
    );
  }

  // ─── SCENARIO 2: LANDLORD WITH AT LEAST 1 PROPERTY ──────────────────────────
  const rooms = overview?.rooms ?? {
    totalRooms: activeBuilding.totalRooms || 0,
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

  const depositNotifications = overview?.depositNotifications ?? [];
  const maintenanceRequests = overview?.maintenanceRequests ?? [];
  const expiringContracts = overview?.expiringContracts ?? [];

  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in duration-500">
      {/* Top Header Title & Create Building Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            Tổng Quan — {activeBuilding.name}
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            {activeBuilding.address || "Chưa cập nhật địa chỉ"}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/landlord/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-200 hover:border-[#2AC1BC] hover:text-[#2AC1BC] text-zinc-700 text-xs font-bold rounded-xl shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#2AC1BC]" />
            <span>+ Tạo nhà trọ mới</span>
          </Link>
          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[11px] font-black rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            VIETQR 24/7 ACTIVE
          </span>
        </div>
      </div>

      {isLoading && !overview ? (
        <div className="py-16 text-center text-zinc-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2AC1BC]" />
          <p className="text-xs font-semibold">Đang tải dữ liệu tổng quan tòa nhà...</p>
        </div>
      ) : (
        <>
          {/* 5 COLOR-CODED ROOM METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. TỔNG SỐ PHÒNG */}
            <div className="px-3.5 py-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">
                  TỔNG SỐ PHÒNG
                </span>
                <div className="text-lg font-black text-rose-600 leading-tight mt-0.5">
                  {rooms.totalRooms} Phòng
                </div>
                <span className="text-[10px] font-bold text-rose-500/80 block">
                  Lấp đầy: {rooms.occupancyRate}
                </span>
              </div>
              <Building className="w-5 h-5 text-rose-500 shrink-0 opacity-80" />
            </div>

            {/* 2. ĐANG THUÊ */}
            <div className="px-3.5 py-3 bg-[#2AC1BC]/10 border border-[#2AC1BC]/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
              <div>
                <span className="text-[10px] font-black text-[#2AC1BC] uppercase tracking-wider block">
                  ĐANG THUÊ / ĐANG Ở
                </span>
                <div className="text-lg font-black text-[#2AC1BC] leading-tight mt-0.5">
                  {rooms.occupiedRooms} Phòng
                </div>
                <span className="text-[10px] font-bold text-[#2AC1BC]/80 block">
                  {rooms.occupiedRooms > 0 ? "Hợp đồng hiệu lực" : "Chưa có khách thuê"}
                </span>
              </div>
              <Users className="w-5 h-5 text-[#2AC1BC] shrink-0 opacity-80" />
            </div>

            {/* 3. PHÒNG TRỐNG */}
            <div className="px-3.5 py-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">
                  PHÒNG TRỐNG
                </span>
                <div className="text-lg font-black text-blue-600 leading-tight mt-0.5">
                  {rooms.vacantRooms} Phòng
                </div>
                <span className="text-[10px] font-bold text-blue-500/80 block">
                  Sẵn sàng đón khách
                </span>
              </div>
              <Home className="w-5 h-5 text-blue-500 shrink-0 opacity-80" />
            </div>

            {/* 4. BẢO TRÌ */}
            <div className="px-3.5 py-3 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
              <div>
                <span className="text-[10px] font-black text-[#FF6B35] uppercase tracking-wider block">
                  BẢO TRÌ
                </span>
                <div className="text-lg font-black text-[#FF6B35] leading-tight mt-0.5">
                  {rooms.maintenanceRooms} Phòng
                </div>
                <span className="text-[10px] font-bold text-[#FF6B35]/80 block">
                  {rooms.maintenanceRooms > 0 ? "Đang xử lý sự cố" : "Không có sự cố"}
                </span>
              </div>
              <Wrench className="w-5 h-5 text-[#FF6B35] shrink-0 opacity-80" />
            </div>

            {/* 5. ĐẶT CỌC GIỮ CHỖ */}
            <div className="px-3.5 py-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs col-span-2 sm:col-span-1">
              <div>
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block">
                  ĐẶT CỌC GIỮ CHỖ
                </span>
                <div className="text-lg font-black text-purple-600 leading-tight mt-0.5">
                  {rooms.depositRooms} Phòng
                </div>
                <span className="text-[10px] font-bold text-purple-500/80 block">
                  {rooms.depositRooms > 0 ? "Đang giữ chỗ" : "Chưa có tiền cọc"}
                </span>
              </div>
              <Shield className="w-5 h-5 text-purple-500 shrink-0 opacity-80" />
            </div>
          </div>

          {/* 2-COLUMN LAYOUT: REVENUE CHART & CASHFLOW KPI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* REVENUE LINE CHART (2/3 WIDTH) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#2AC1BC]" />
                    <h2 className="text-sm sm:text-base font-black text-zinc-900">
                      Doanh Thu Hàng Tháng
                    </h2>
                    <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 ml-1">
                      <button
                        type="button"
                        onClick={() => setRangeMode("6m")}
                        className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all cursor-pointer ${
                          rangeMode === "6m"
                            ? "bg-[#2AC1BC] text-white shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        6 Tháng
                      </button>
                      <button
                        type="button"
                        onClick={() => setRangeMode("12m")}
                        className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all cursor-pointer ${
                          rangeMode === "12m"
                            ? "bg-[#2AC1BC] text-white shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        12 Tháng
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Biến động dòng tiền thực nhận tòa <strong>{activeBuilding.name}</strong>.
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">
                    THÁNG NÀY
                  </span>
                  <span className="text-base font-black text-[#2AC1BC] tracking-tight">
                    {formatVND(Number(financial.currentMonthRevenue) || 0)}
                  </span>
                </div>
              </div>

              {/* Chart Content or Empty State */}
              {chartData.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-zinc-700">Không có dữ liệu doanh thu</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs">
                    Chưa phát sinh giao dịch thanh toán hoặc hóa đơn nào trong khoảng thời gian này.
                  </p>
                </div>
              ) : (
                <div className="pt-1">
                  <div className="flex gap-2.5">
                    {/* SVG Canvas Container */}
                    <div className="flex-1 space-y-1.5 relative">
                      {hoveredIndex !== null && chartData[hoveredIndex] && (
                        <div
                          className="absolute z-20 -top-8 bg-zinc-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs shadow-xl border border-white/20 transition-all duration-150 animate-in fade-in zoom-in-95 pointer-events-none"
                          style={{
                            left: `${Math.max(12, Math.min(88, (chartData[hoveredIndex].x / 600) * 100))}%`,
                            transform: "translateX(-50%)",
                          }}
                        >
                          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                            Tháng {chartData[hoveredIndex].month}
                          </div>
                          <div className="text-xs font-black text-[#2AC1BC]">
                            {formatVND(Number(chartData[hoveredIndex].fullAmount) || 0)}
                          </div>
                        </div>
                      )}

                      <div className="h-36 w-full relative flex items-end">
                        <svg
                          className="w-full h-full overflow-visible"
                          viewBox="0 0 600 100"
                          preserveAspectRatio="none"
                        >
                          <line x1="0" y1="15" x2="600" y2="15" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                          <line x1="0" y1="50" x2="600" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                          <line x1="0" y1="85" x2="600" y2="85" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                          <path
                            d={linePathD}
                            fill="none"
                            stroke="#2AC1BC"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {chartData.map((pt, i) => (
                            <circle
                              key={i}
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredIndex === i ? 4.5 : 3}
                              fill={hoveredIndex === i ? "#2AC1BC" : "#ffffff"}
                              stroke="#2AC1BC"
                              strokeWidth={2}
                              className="cursor-pointer transition-all"
                              onMouseEnter={() => setHoveredIndex(i)}
                              onMouseLeave={() => setHoveredIndex(null)}
                            />
                          ))}
                        </svg>
                      </div>

                      {/* Month Labels */}
                      <div className="flex justify-between items-center text-xs font-bold text-zinc-500 pt-1.5 border-t border-zinc-100">
                        {chartData.map((d, i) => (
                          <div key={i} className="text-center">
                            <span className="block text-[9px] font-bold text-zinc-600">{d.month}</span>
                            <span className="block text-[8px] text-[#2AC1BC] font-bold">{d.val}M</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FINANCIAL SUMMARY KPI CARD (1/3 WIDTH) */}
            <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                  <span className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-[#2AC1BC]" /> Tổng Quan Dòng Tiền
                  </span>
                  <span className="px-2 py-0.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-full text-[10px] font-black">
                    Thu hồi: {collection.collectionRate}
                  </span>
                </div>

                <div className="space-y-3 mt-3">
                  <div className="p-3.5 bg-[#2AC1BC]/5 rounded-2xl border border-[#2AC1BC]/15 space-y-1">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase block">
                      DOANH THU THÁNG NÀY
                    </span>
                    <div className="text-xl font-black text-[#2AC1BC]">
                      {formatVND(Number(financial.currentMonthRevenue) || 0)}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 block">
                      {financial.paidInvoicesCount > 0
                        ? `Đã thanh toán ${financial.paidInvoicesCount} hóa đơn`
                        : "Chưa có hóa đơn thanh toán trong tháng"}
                    </span>
                  </div>

                  <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/15 space-y-1">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase block">
                      CÔNG NỢ CHƯA THU
                    </span>
                    <div className="text-xl font-black text-rose-500">
                      {formatVND(Number(financial.unpaidDebt) || 0)}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 block">
                      {financial.unpaidInvoicesCount > 0
                        ? `${financial.unpaidInvoicesCount} hóa đơn chưa thu / quá hạn`
                        : "Không có công nợ quá hạn"}
                    </span>
                  </div>
                </div>
              </div>

              <Link href="/landlord/invoices" className="block pt-2 border-t border-zinc-100">
                <span className="text-[11px] font-bold text-[#2AC1BC] hover:underline flex items-center justify-between">
                  Xem danh sách hóa đơn &rarr;
                </span>
              </Link>
            </div>
          </div>

          {/* 3 NOTIFICATION / DETAIL CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. THÔNG BÁO ĐẶT CỌC */}
            <div
              onClick={() => router.push("/landlord/deposits")}
              className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs hover:border-purple-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                  <h3 className="text-sm font-black text-zinc-900 group-hover:text-purple-600 transition-colors">
                    Thông Báo Đặt Cọc
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full text-[10px] font-black">
                  {depositNotifications.length} Mới
                </span>
              </div>

              {depositNotifications.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-400 flex items-center justify-center mx-auto">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-zinc-700">Không có dữ liệu đặt cọc nào</p>
                  <p className="text-[11px] text-zinc-400">Chưa có giao dịch đặt cọc giữ chỗ nào phát sinh.</p>
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                  {depositNotifications.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl border border-purple-500/15 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-zinc-900">
                            {item.room} — {item.tenant}
                          </span>
                        </div>
                        <span className="text-[10px] text-purple-600 font-bold block">
                          {item.type}: {formatVND(item.amount)}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[11px] font-bold text-purple-600 flex items-center justify-between pt-1 border-t border-zinc-100">
                <span>Xem tất cả cọc giữ chỗ &rarr;</span>
              </div>
            </div>

            {/* 2. YÊU CẦU BẢO TRÌ */}
            <div
              onClick={() => router.push("/landlord/complaints")}
              className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs hover:border-[#FF6B35]/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#FF6B35] shrink-0" />
                  <h3 className="text-sm font-black text-zinc-900 group-hover:text-[#FF6B35] transition-colors">
                    Yêu Cầu Bảo Trì
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full text-[10px] font-black">
                  {maintenanceRequests.length} Sự cố
                </span>
              </div>

              {maintenanceRequests.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-zinc-700">Không có yêu cầu bảo trì nào</p>
                  <p className="text-[11px] text-zinc-400">Tất cả thiết bị và phòng ốc đang hoạt động bình thường.</p>
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                  {maintenanceRequests.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#FF6B35]/5 hover:bg-[#FF6B35]/10 rounded-2xl border border-[#FF6B35]/15 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-zinc-900">
                            {item.room} — {item.issue}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold block ${
                            item.priority === "high"
                              ? "text-rose-500"
                              : item.priority === "medium"
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {item.priority === "high"
                            ? "Mức độ cao"
                            : item.priority === "medium"
                            ? "Mức độ trung bình"
                            : "Mức độ nhẹ"}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#FF6B35] group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[11px] font-bold text-[#FF6B35] flex items-center justify-between pt-1 border-t border-zinc-100">
                <span>Xem tất cả phiếu bảo trì &rarr;</span>
              </div>
            </div>

            {/* 3. GIA HẠN HỢP ĐỒNG */}
            <div
              onClick={() => router.push("/landlord/contracts")}
              className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs hover:border-amber-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <h3 className="text-sm font-black text-zinc-900 group-hover:text-amber-600 transition-colors">
                    Gia Hạn Hợp Đồng
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black">
                  {expiringContracts.length} Cảnh báo
                </span>
              </div>

              {expiringContracts.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-zinc-700">Không có hợp đồng sắp hết hạn</p>
                  <p className="text-[11px] text-zinc-400">Tất cả hợp đồng đang trong thời hạn ổn định (&gt; 30 ngày).</p>
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                  {expiringContracts.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-amber-500/5 hover:bg-amber-500/10 rounded-2xl border border-amber-500/15 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-zinc-900">
                            {item.room} — {item.tenant}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-600 font-bold block">
                          Còn {item.daysLeft} ngày (Hạn {item.endDate})
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[11px] font-bold text-amber-600 flex items-center justify-between pt-1 border-t border-zinc-100">
                <span>Xem tất cả hợp đồng &rarr;</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FLOATING QUICK ACTION SPEED DIAL BAR */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {speedDialOpen && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <button
              type="button"
              onClick={() => router.push("/landlord/rooms")}
              className="flex items-center gap-2.5 px-4 py-2 bg-white text-zinc-900 font-bold text-xs rounded-full shadow-lg border border-zinc-200/80 hover:bg-[#2AC1BC] hover:text-white transition-all cursor-pointer group"
            >
              <span>Thêm Phòng Mới</span>
              <span className="p-1 bg-[#2AC1BC]/10 text-[#2AC1BC] group-hover:bg-white/20 group-hover:text-white rounded-full">
                <Plus className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/landlord/contracts")}
              className="flex items-center gap-2.5 px-4 py-2 bg-white text-zinc-900 font-bold text-xs rounded-full shadow-lg border border-zinc-200/80 hover:bg-[#2AC1BC] hover:text-white transition-all cursor-pointer group"
            >
              <span>Tạo Hợp Đồng PDF</span>
              <span className="p-1 bg-amber-500/10 text-amber-600 group-hover:bg-white/20 group-hover:text-white rounded-full">
                <FileText className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/landlord/invoices")}
              className="flex items-center gap-2.5 px-4 py-2 bg-white text-zinc-900 font-bold text-xs rounded-full shadow-lg border border-zinc-200/80 hover:bg-[#2AC1BC] hover:text-white transition-all cursor-pointer group"
            >
              <span>Lập Hóa Đơn VietQR</span>
              <span className="p-1 bg-emerald-500/10 text-emerald-600 group-hover:bg-white/20 group-hover:text-white rounded-full">
                <QrCode className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          className={`p-3.5 rounded-full shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center border ${
            speedDialOpen
              ? "bg-zinc-900 text-white border-zinc-800 rotate-45"
              : "bg-[#2AC1BC] text-white border-[#2AC1BC] hover:scale-105"
          }`}
          title="Thao tác nhanh"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
