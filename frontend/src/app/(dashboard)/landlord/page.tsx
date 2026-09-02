"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building, Users, FileText, TrendingUp, TrendingDown, Plus, Activity,
  Building2, ChevronDown, ArrowUpRight, Sparkles, MapPin, CheckCircle2, ShieldCheck, Zap,
  Wrench, AlertTriangle, QrCode, Clock, Shield, Calendar, Search, Filter, Phone, Mail,
  Eye, FileCheck, DollarSign, Bell, Home, AlertCircle, Send, Check, ArrowRight, BarChart2,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/utils";
import { useTranslations } from "next-intl";

export default function LandlordDashboardPage() {
  const t = useTranslations("landlordDashboard");
  const router = useRouter();
  const { user, upgradeToLandlord, activeBuilding } = useAuth();

  // Onboarding Setup Form States for new Landlord
  const [initHouseName, setInitHouseName] = useState("");
  const [initHouseAddress, setInitHouseAddress] = useState("");
  const [initRoomCount, setInitRoomCount] = useState("10");
  const [initAveragePrice, setInitAveragePrice] = useState("4500000");
  const [rangeMode, setRangeMode] = useState<"6m" | "12m">("6m");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  const handleInitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initHouseName || !initHouseAddress) return;
    upgradeToLandlord({ houseName: initHouseName, houseAddress: initHouseAddress });
  };

  // CHECK IF LANDLORD HAS NOT CREATED THEIR FIRST HOUSE YET
  const isNewLandlord = !user?.houseName || user?.houseName === "";

  if (isNewLandlord) {
    return (
      <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-8 animate-in fade-in duration-500">

        {/* Welcome Empty State Header */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/30 shadow-lg">
            <Sparkles className="w-4 h-4 fill-[#2AC1BC]" /> {t("welcomeBadge")}
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
            {t("welcomeTitle")} <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] to-[#FF6B35] bg-clip-text text-transparent">
              Dormio Landlord Dashboard
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xl mx-auto">
            {t("welcomeSub")}
          </p>
        </div>

        {/* Onboarding Initial Setup Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-xl space-y-6">
          <div className="border-b border-zinc-100 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900">{t("formCardTitle")}</h2>
              <p className="text-xs text-zinc-500 font-medium">{t("formCardSub")}</p>
            </div>
          </div>

          <form onSubmit={handleInitSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-700">{t("houseNameLabel")}</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={t("houseNamePlaceholder")}
                    value={initHouseName}
                    onChange={(e) => setInitHouseName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-700">{t("houseAddressLabel")}</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={t("houseAddressPlaceholder")}
                    value={initHouseAddress}
                    onChange={(e) => setInitHouseAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-700">{t("roomCountLabel")}</label>
                <input
                  type="number"
                  placeholder="10"
                  value={initRoomCount}
                  onChange={(e) => setInitRoomCount(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-700">{t("avgPriceLabel")}</label>
                <input
                  type="number"
                  placeholder="4500000"
                  value={initAveragePrice}
                  onChange={(e) => setInitAveragePrice(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>

            </div>

            {/* Feature Checklist Highlights */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2">
              <span className="text-[11px] font-extrabold text-zinc-600 block">{t("integratedTitle")}</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold text-zinc-700">
                <span className="flex items-center gap-1.5 text-[#2AC1BC]"><CheckCircle2 className="w-4 h-4 shrink-0" /> {t("integratedF1")}</span>
                <span className="flex items-center gap-1.5 text-[#2AC1BC]"><CheckCircle2 className="w-4 h-4 shrink-0" /> {t("integratedF2")}</span>
                <span className="flex items-center gap-1.5 text-[#2AC1BC]"><CheckCircle2 className="w-4 h-4 shrink-0" /> {t("integratedF3")}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] to-[#FF6B35] hover:from-[#23B3AE] hover:to-[#ff5518] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#2AC1BC]/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{t("submitBtn")}</span>
            </button>
          </form>
        </div>

      </div>
    );
  }

  // Monthly Revenue Line Chart Data (12 Most Recent Months)
  const full12MonthsData = [
    { month: "09/25", val: 28, x: 0, y: 69 },
    { month: "10/25", val: 30, x: 54.5, y: 63 },
    { month: "11/25", val: 31.5, x: 109.1, y: 59 },
    { month: "12/25", val: 35, x: 163.6, y: 50 },
    { month: "01/26", val: 29, x: 218.2, y: 66 },
    { month: "02/26", val: 32, x: 272.7, y: 58 },
    { month: "03/26", val: 34, x: 327.3, y: 53 },
    { month: "04/26", val: 36.5, x: 381.8, y: 46 },
    { month: "05/26", val: 40, x: 436.4, y: 37 },
    { month: "06/26", val: 38.5, x: 490.9, y: 41 },
    { month: "07/26", val: 42, x: 545.5, y: 31 },
    { month: "08/26", val: 45, x: 600, y: 23 },
  ];

  const full6MonthsData = [
    { month: "03/26", val: 34, x: 0, y: 53 },
    { month: "04/26", val: 36.5, x: 120, y: 46 },
    { month: "05/26", val: 40, x: 240, y: 37 },
    { month: "06/26", val: 38.5, x: 360, y: 41 },
    { month: "07/26", val: 42, x: 480, y: 31 },
    { month: "08/26", val: 45, x: 600, y: 23 },
  ];

  const activeChartData = rangeMode === "6m" ? full6MonthsData : full12MonthsData;
  const linePathD = activeChartData.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`).join(" ");

  // EXPANDED RICH MOCK DATA FOR DEPOSIT NOTIFICATIONS
  const depositNotifications = [
    { id: "d1", room: "P.203", tenant: "Vũ Minh Anh", amount: 1000000, date: "Hôm nay 10:15", type: "Cọc Escrow Dormio", status: "Chờ duyệt HĐ" },
    { id: "d2", room: "P.104", tenant: "Lê Văn C", amount: 2000000, date: "Hôm qua 14:30", type: "Cọc giữ phòng 15 ngày", status: "Đã xác nhận" },
    { id: "d3", room: "P.305", tenant: "Phạm Thị Hương", amount: 1500000, date: "24/08/2026", type: "Cọc qua VietQR", status: "Chờ chuyển đến" },
    { id: "d4", room: "P.201", tenant: "Đặng Hoàng Nam", amount: 2500000, date: "22/08/2026", type: "Cọc 1 tháng tiền phòng", status: "Hoàn tất" },
  ];

  // EXPANDED RICH MOCK DATA FOR MAINTENANCE REQUESTS
  const maintenanceRequests = [
    { id: "m1", room: "P.302", issue: "Hỏng điều hòa tầng 3 (Kêu to, không mát)", priority: "high", reporter: "Đặng Hoàng Bảo", date: "Hôm nay 09:30", status: "Chưa xử lý" },
    { id: "m2", room: "P.101", issue: "Rò rỉ vòi nước phòng tắm", priority: "medium", reporter: "Nguyễn Văn A", date: "Hôm qua 16:45", status: "Đang xử lý" },
    { id: "m3", room: "P.205", issue: "Nghẽn đường ống thoát nước ban công", priority: "high", reporter: "Trần Thị Lan", date: "25/08/2026", status: "Chưa xử lý" },
    { id: "m4", room: "P.402", issue: "Hỏng công tắc đèn phòng khách", priority: "low", reporter: "Võ Hoàng Khoa", date: "24/08/2026", status: "Đã xong" },
  ];

  // EXPANDED RICH MOCK DATA FOR CONTRACT EXTENSIONS
  const expiringContracts = [
    { id: "c1", room: "P.202", tenant: "Phạm Quốc Huy", phone: "0933.222.111", daysLeft: 18, endDate: "15/09/2026" },
    { id: "c2", room: "P.105", tenant: "Trịnh Thị Mai", phone: "0988.777.666", daysLeft: 7, endDate: "04/09/2026" },
    { id: "c3", room: "P.301", tenant: "Hoàng Văn Đức", phone: "0912.345.678", daysLeft: 12, endDate: "09/09/2026" },
    { id: "c4", room: "P.404", tenant: "Bùi Quang Minh", phone: "0909.888.999", daysLeft: 25, endDate: "22/09/2026" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in duration-500">

      {/* Top Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            {t("overviewTitle", { name: activeBuilding.name })}
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            {activeBuilding.address}
          </p>
        </div>

        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[11px] font-black rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {t("vietqrActive")}
        </span>
      </div>

      {/* COMPACT & SLEEK 5 COLOR-CODED ROOM METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

        {/* 1. TỔNG SỐ PHÒNG & TỶ LỆ LẤP ĐẦY = RED */}
        <div className="px-3.5 py-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
          <div>
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">{t("statTotalRooms")}</span>
            <div className="text-lg font-black text-rose-600 leading-tight mt-0.5">{activeBuilding.totalRooms} Phòng</div>
            <span className="text-[10px] font-bold text-rose-500/80 block">{t("statOccupancy", { rate: activeBuilding.occupancyRate })}</span>
          </div>
          <Building className="w-5 h-5 text-rose-500 shrink-0 opacity-80" />
        </div>

        {/* 2. ĐANG THUÊ / ĐANG Ở = PRIMARY TEAL (#2AC1BC) */}
        <div className="px-3.5 py-3 bg-[#2AC1BC]/10 border border-[#2AC1BC]/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
          <div>
            <span className="text-[10px] font-black text-[#2AC1BC] uppercase tracking-wider block">{t("statOccupied")}</span>
            <div className="text-lg font-black text-[#2AC1BC] leading-tight mt-0.5">{activeBuilding.occupiedRooms} Phòng</div>
            <span className="text-[10px] font-bold text-[#2AC1BC]/80 block">{t("statActiveContract")}</span>
          </div>
          <Users className="w-5 h-5 text-[#2AC1BC] shrink-0 opacity-80" />
        </div>

        {/* 3. PHÒNG TRỐNG = BLUE (#3B82F6) */}
        <div className="px-3.5 py-3 bg-blue-500/10 border border-blue-500/30 rounded-3xl flex items-center justify-between transition-all hover:shadow-xs">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">{t("statVacant")}</span>
            <div className="text-lg font-black text-blue-600 leading-tight mt-0.5">{activeBuilding.vacantRooms} Phòng</div>
            <span className="text-[10px] font-bold text-blue-500/80 block">{t("statReady")}</span>
          </div>
          <Home className="w-5 h-5 text-blue-500 shrink-0 opacity-80" />
        </div>

        {/* 4. BẢO TRÌ / SẮP HẾT HẠN = PRIMARY ORANGE (#FF6B35) */}
        <div className="px-3.5 py-3 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
          <div>
            <span className="text-[10px] font-black text-[#FF6B35] uppercase tracking-wider block">{t("statMaintenance")}</span>
            <div className="text-lg font-black text-[#FF6B35] leading-tight mt-0.5">{activeBuilding.expiringRooms} Phòng</div>
            <span className="text-[10px] font-bold text-[#FF6B35]/80 block">{t("statMaintDetail")}</span>
          </div>
          <Wrench className="w-5 h-5 text-[#FF6B35] shrink-0 opacity-80" />
        </div>

        {/* 5. ĐẶT CỌC GIỮ CHỖ = PURPLE (#8B5CF6) */}
        <div className="px-3.5 py-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block">{t("statDeposit")}</span>
            <div className="text-lg font-black text-purple-600 leading-tight mt-0.5">{activeBuilding.depositRooms} Phòng</div>
            <span className="text-[10px] font-bold text-purple-500/80 block">{t("statEscrow")}</span>
          </div>
          <Shield className="w-5 h-5 text-purple-500 shrink-0 opacity-80" />
        </div>

      </div>

      {/* 2-COLUMN COMPACT LAYOUT FOR REVENUE CHART & FINANCIAL HIGHLIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* COMPACT WIDTH REVENUE LINE CHART (2/3 WIDTH) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs space-y-3">

          {/* Compact Header with Range Toggle Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2AC1BC]" />
                <h2 className="text-sm sm:text-base font-black text-zinc-900">{t("monthlyRevenueTitle")}</h2>
                <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 ml-1">
                  <button
                    onClick={() => setRangeMode("6m")}
                    className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all cursor-pointer ${rangeMode === "6m" ? "bg-[#2AC1BC] text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                      }`}
                  >
                    {t("range6m")}
                  </button>
                  <button
                    onClick={() => setRangeMode("12m")}
                    className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all cursor-pointer ${rangeMode === "12m" ? "bg-[#2AC1BC] text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                      }`}
                  >
                    {t("range12m")}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">
                {rangeMode === "6m" ? t("revenueRangeDesc6m", { name: activeBuilding.name }) : t("revenueRangeDesc12m", { name: activeBuilding.name })}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-left sm:text-right">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">{t("currentMonthLabel")}</span>
                <span className="text-base font-black text-[#2AC1BC] tracking-tight">45.000.000 ₫</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[11px] font-black flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12.5%
              </span>
            </div>
          </div>

          {/* Compact Chart Area */}
          <div className="pt-1">
            <div className="flex gap-2.5">

              {/* Y-Axis Labels */}
              <div className="flex flex-col justify-between text-[9px] font-bold text-zinc-400 py-0.5 pr-1 border-r border-zinc-100 shrink-0">
                <span>50M</span>
                <span>25M</span>
                <span>0M</span>
              </div>

              {/* SVG Canvas Container */}
              <div className="flex-1 space-y-1.5 relative">

                {/* Glassmorphism Hover Tooltip Card */}
                {hoveredIndex !== null && (
                  <div
                    className="absolute z-20 -top-8 bg-zinc-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs shadow-xl border border-white/20 transition-all duration-150 animate-in fade-in zoom-in-95 pointer-events-none"
                    style={{
                      left: `${Math.max(12, Math.min(88, (activeChartData[hoveredIndex].x / 600) * 100))}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{t("tooltipMonth", { month: activeChartData[hoveredIndex].month })}</div>
                    <div className="text-xs font-black text-[#2AC1BC]">{activeChartData[hoveredIndex].val}.000.000 ₫</div>
                    <div className="text-[8px] font-bold text-emerald-400">{t("tooltipCleared")}</div>
                  </div>
                )}

                <div className="h-36 w-full relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 100" preserveAspectRatio="none">
                    {/* Faint Horizontal Gridlines */}
                    <line x1="0" y1="10" x2="600" y2="10" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="0" y1="45" x2="600" y2="45" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="0" y1="85" x2="600" y2="85" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />

                    {/* Dynamic Smooth Line Path */}
                    <path
                      d={linePathD}
                      fill="none"
                      stroke="#2AC1BC"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Dynamic Positioned Interactive Data Nodes */}
                    {activeChartData.map((pt, i) => {
                      const isHovered = hoveredIndex === i;
                      return (
                        <g
                          key={i}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredIndex(i)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        >
                          {/* Invisible hit target for easy hovering */}
                          <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />

                          {/* Node circle */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 4.5 : i === activeChartData.length - 1 ? 3.5 : 3}
                            fill={isHovered ? "#2AC1BC" : "#ffffff"}
                            stroke="#2AC1BC"
                            strokeWidth={isHovered ? 2.5 : i === activeChartData.length - 1 ? 2 : 1.5}
                            className="transition-all duration-200"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Month Axis Labels */}
                <div className="flex justify-between items-center text-xs font-bold text-zinc-500 pt-1.5 border-t border-zinc-100">
                  {activeChartData.map((d, i) => (
                    <div key={i} className="text-center">
                      <span className="block text-[9px] font-bold text-zinc-600">{d.month}</span>
                      <span className="block text-[8px] text-[#2AC1BC] font-bold">{d.val}M</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* FINANCIAL SUMMARY KPI CARD (1/3 WIDTH) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <span className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-[#2AC1BC]" /> {t("cashflowOverview")}
              </span>
              <span className="px-2 py-0.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-full text-[10px] font-black">
                VietQR 24/7
              </span>
            </div>

            <div className="space-y-2.5 mt-3">
              <div className="p-3 bg-[#2AC1BC]/5 rounded-xl border border-[#2AC1BC]/15 space-y-0.5">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase block">{t("augustRevenue")}</span>
                <div className="text-lg font-black text-[#2AC1BC]">45.000.000 ₫</div>
                <span className="text-[10px] font-bold text-emerald-600">{t("allInvoicesPaid")}</span>
              </div>

              <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/15 space-y-0.5">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase block">{t("debtLabel")}</span>
                <div className="text-lg font-black text-rose-500">0 ₫</div>
                <span className="text-[10px] font-bold text-zinc-500">{t("noOverdue")}</span>
              </div>
            </div>
          </div>

          <Link href="/landlord/invoices" className="block pt-2 border-t border-zinc-100">
            <span className="text-[11px] font-bold text-[#2AC1BC] hover:underline flex items-center justify-between">
              {t("viewDetails")}
            </span>
          </Link>
        </div>

      </div>

      {/* COMPACT NOTIFICATION CARDS WITH RICH MULTIPLE MOCK DATA - ALL CLICKABLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* 1. THÔNG BÁO ĐẶT CỌC (CLICKABLE ➔ /landlord/deposits) */}
        <div
          onClick={() => router.push("/landlord/deposits")}
          className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-purple-500/40 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600 shrink-0" />
              <h3 className="text-sm font-black text-zinc-900 group-hover:text-purple-600 transition-colors">{t("depositNotifTitle")}</h3>
            </div>
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full text-[10px] font-black">
              {t("newCount", { count: depositNotifications.length })}
            </span>
          </div>

          <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 hide-scrollbar">
            {depositNotifications.map((item) => (
              <div key={item.id} className="p-3 bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl border border-purple-500/15 flex items-center justify-between text-xs transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-zinc-900">{item.room} — {item.tenant}</span>
                  </div>
                  <span className="text-[10px] text-purple-600 font-bold block">{item.type}: {formatVND(item.amount)}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            ))}
          </div>

          <div className="text-[11px] font-bold text-purple-600 flex items-center justify-between pt-1 border-t border-zinc-100">
            <span>{t("viewAllDeposits", { count: depositNotifications.length })}</span>
          </div>
        </div>

        {/* 2. YÊU CẦU BẢO TRÌ (CLICKABLE ➔ /landlord/complaints) */}
        <div
          onClick={() => router.push("/landlord/complaints")}
          className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-[#FF6B35]/40 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#FF6B35] shrink-0" />
              <h3 className="text-sm font-black text-zinc-900 group-hover:text-[#FF6B35] transition-colors">{t("maintRequestTitle")}</h3>
            </div>
            <span className="px-2 py-0.5 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full text-[10px] font-black">
              {t("issuesCount", { count: maintenanceRequests.length })}
            </span>
          </div>

          <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 hide-scrollbar">
            {maintenanceRequests.map((item) => (
              <div key={item.id} className="p-3 bg-[#FF6B35]/5 hover:bg-[#FF6B35]/10 rounded-2xl border border-[#FF6B35]/15 flex items-center justify-between text-xs transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-zinc-900">{item.room} — {item.issue}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold block ${item.priority === 'high' ? 'text-rose-500' : item.priority === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                    {item.priority === 'high' ? t("prioHigh") : item.priority === 'medium' ? t("prioMedium") : t("prioLow")}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#FF6B35] group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            ))}
          </div>

          <div className="text-[11px] font-bold text-[#FF6B35] flex items-center justify-between pt-1 border-t border-zinc-100">
            <span>{t("viewAllMaint", { count: maintenanceRequests.length })}</span>
          </div>
        </div>

        {/* 3. GIA HẠN HỢP ĐỒNG (CLICKABLE ➔ /landlord/contracts) */}
        <div
          onClick={() => router.push("/landlord/contracts")}
          className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <h3 className="text-sm font-black text-zinc-900 group-hover:text-amber-600 transition-colors">{t("contractExtensionTitle")}</h3>
            </div>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black">
              {t("warningsCount", { count: expiringContracts.length })}
            </span>
          </div>

          <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 hide-scrollbar">
            {expiringContracts.map((item) => (
              <div key={item.id} className="p-3 bg-amber-500/5 hover:bg-amber-500/10 rounded-2xl border border-amber-500/15 flex items-center justify-between text-xs transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-zinc-900">{item.room} — {item.tenant}</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-bold block">{t("daysLeftText", { days: item.daysLeft, date: item.endDate })}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            ))}
          </div>

          <div className="text-[11px] font-bold text-amber-600 flex items-center justify-between pt-1 border-t border-zinc-100">
            <span>{t("viewAllContracts", { count: expiringContracts.length })}</span>
          </div>
        </div>

      </div>

      {/* FLOATING QUICK ACTION SPEED DIAL BAR FOR LANDLORD */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Speed Dial Menu Items */}
        {speedDialOpen && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <button
              onClick={() => router.push("/landlord/rooms")}
              className="flex items-center gap-2.5 px-4 py-2 bg-white text-zinc-900 font-bold text-xs rounded-full shadow-lg border border-zinc-200/80 hover:bg-[#2AC1BC] hover:text-white transition-all cursor-pointer group"
            >
              <span>{t("addRoomBtn")}</span>
              <span className="p-1 bg-[#2AC1BC]/10 text-[#2AC1BC] group-hover:bg-white/20 group-hover:text-white rounded-full">
                <Plus className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => router.push("/landlord/contracts")}
              className="flex items-center gap-2.5 px-4 py-2 bg-white text-zinc-900 font-bold text-xs rounded-full shadow-lg border border-zinc-200/80 hover:bg-[#2AC1BC] hover:text-white transition-all cursor-pointer group"
            >
              <span>{t("createPdfContractBtn")}</span>
              <span className="p-1 bg-amber-500/10 text-amber-600 group-hover:bg-white/20 group-hover:text-white rounded-full">
                <FileText className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => router.push("/landlord/invoices")}
              className="flex items-center gap-2.5 px-4 py-2 bg-white text-zinc-900 font-bold text-xs rounded-full shadow-lg border border-zinc-200/80 hover:bg-[#2AC1BC] hover:text-white transition-all cursor-pointer group"
            >
              <span>{t("createVietqrInvoiceBtn")}</span>
              <span className="p-1 bg-emerald-500/10 text-emerald-600 group-hover:bg-white/20 group-hover:text-white rounded-full">
                <QrCode className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          className={`p-3.5 rounded-full shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center border ${speedDialOpen ? 'bg-zinc-900 text-white border-zinc-800 rotate-45' : 'bg-[#2AC1BC] text-white border-[#2AC1BC] hover:scale-105'
            }`}
          title={t("quickActions")}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
