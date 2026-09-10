"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp, Users, DollarSign, FileSpreadsheet, Calendar,
  Building2, ChevronDown, CheckCircle2, ArrowUpRight,
  ShieldCheck, MessageSquare, Eye, Sparkles, Flame, Rocket,
  Award, Clock, Compass, Lightbulb, Zap, HelpCircle,
  Share2, MapPin, CheckCircle, BarChart3, PieChart
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function ReportsPage() {
  const { activeBuilding } = useAuth();
  const t = useTranslations("reports");
  const { locale } = useLanguage();

  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<"7_days" | "month" | "last_month" | "quarter" | "year">("month");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("b1");

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setMounted(true);
    if (activeBuilding?.id) {
      setSelectedBuildingId(activeBuilding.id);
    }
  }, [activeBuilding]);

  // Marketing Trend: Reach vs Inquiries vs Deposits
  const marketingTrendData = [
    { name: locale === "en" ? "Week 1" : "Tuần 1", reach: 1650, inquiries: 78, deposits: 5 },
    { name: locale === "en" ? "Week 2" : "Tuần 2", reach: 1980, inquiries: 92, deposits: 6 },
    { name: locale === "en" ? "Week 3" : "Tuần 3", reach: 2320, inquiries: 114, deposits: 8 },
    { name: locale === "en" ? "Week 4" : "Tuần 4", reach: 2500, inquiries: 128, deposits: 9 }
  ];

  // Marketing Funnel Stages
  const marketingFunnelStages = [
    { stage: locale === "en" ? "1. Total Impressions / Reach" : "1. Lượt xem & Tiếp cận bài đăng", count: 8450, rate: "100%", fill: "#3B82F6" },
    { stage: locale === "en" ? "2. Saved / Bookmarked" : "2. Lưu tin & Xem chi tiết phòng", count: 2180, rate: "25.8%", fill: "#8B5CF6" },
    { stage: locale === "en" ? "3. Direct Inquiries / Chats" : "3. Khách nhắn tin & Gọi điện hỏi", count: 412, rate: "18.9%", fill: "#2AC1BC" },
    { stage: locale === "en" ? "4. In-person Room Tours" : "4. Hẹn xem phòng thực tế", count: 118, rate: "28.6%", fill: "#F59E0B" },
    { stage: locale === "en" ? "5. Holding Deposits Secured" : "5. Đặt cọc giữ phòng thành công", count: 28, rate: "23.7%", fill: "#FF6B35" }
  ];

  // Lead Acquisition Channels
  const leadSources = [
    {
      source: locale === "en" ? "Dormio BHRP Portal" : "Sàn cho thuê Dormio BHRP",
      icon: Compass,
      count: 222,
      share: 54,
      conversion: "7.2%",
      color: "bg-[#2AC1BC]",
      textColor: "text-[#138e89]"
    },
    {
      source: locale === "en" ? "Nearby Map Search" : "Tìm kiếm vị trí & Bản đồ quanh trường/công ty",
      icon: MapPin,
      count: 107,
      share: 26,
      conversion: "8.4%",
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      source: locale === "en" ? "Referral & Link Sharing" : "Khách giới thiệu & Chia sẻ liên kết",
      icon: Share2,
      count: 49,
      share: 12,
      conversion: "10.2%",
      color: "bg-[#FF6B35]",
      textColor: "text-[#FF6B35]"
    },
    {
      source: locale === "en" ? "Social Networks & Others" : "Mạng xã hội (Facebook, Zalo, TikTok)",
      icon: Users,
      count: 34,
      share: 8,
      conversion: "3.8%",
      color: "bg-purple-500",
      textColor: "text-purple-600"
    }
  ];

  // Peak Inquiry Hours
  const peakHours = [
    { time: "19:00 - 22:30", period: locale === "en" ? "Evening Peak (Golden Window)" : "Buổi tối (Thời gian vàng)", percent: 48, count: 198, isGold: true },
    { time: "11:30 - 13:30", period: locale === "en" ? "Lunch Break" : "Buổi trưa (Nghỉ trưa)", percent: 32, count: 132, isGold: false },
    { time: "08:30 - 11:30", period: locale === "en" ? "Morning Working Hours" : "Buổi sáng", percent: 12, count: 49, isGold: false },
    { time: locale === "en" ? "Other Hours" : "Khung giờ khác", period: locale === "en" ? "Afternoon & Late Night" : "Chiều & Đêm muộn", percent: 8, count: 33, isGold: false }
  ];

  // Room Type Demand & Speed
  const roomTypeMetrics = [
    {
      type: locale === "en" ? "Studio Apartment" : "Studio khép kín",
      avgDays: locale === "en" ? "3.2 days" : "3.2 ngày",
      demand: t("demandUltra"),
      demandColor: "bg-[#2AC1BC]/15 text-[#138e89] border-[#2AC1BC]/30",
      share: "45%",
      inquiryGrowth: "+34%"
    },
    {
      type: locale === "en" ? "Duplex / Mezzanine" : "Gác lửng Duplex",
      avgDays: locale === "en" ? "4.5 days" : "4.5 ngày",
      demand: t("demandHigh"),
      demandColor: "bg-blue-50 text-blue-700 border-blue-200",
      share: "30%",
      inquiryGrowth: "+22%"
    },
    {
      type: locale === "en" ? "1-Bedroom (1BR)" : "Căn hộ 1 Phòng ngủ",
      avgDays: locale === "en" ? "5.8 days" : "5.8 ngày",
      demand: t("demandFair"),
      demandColor: "bg-purple-50 text-purple-700 border-purple-200",
      share: "18%",
      inquiryGrowth: "+15%"
    },
    {
      type: locale === "en" ? "2-Bedrooms (2BR)" : "Căn hộ 2 Phòng ngủ",
      avgDays: locale === "en" ? "8.0 days" : "8.0 ngày",
      demand: t("demandStable"),
      demandColor: "bg-amber-50 text-amber-700 border-amber-200",
      share: "7%",
      inquiryGrowth: "+8%"
    }
  ];

  if (!mounted) return null;

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
            <span>{locale === "en" ? "Listing Performance & Tenant Analytics" : "Báo Cáo Hiệu Quả Đăng Tin & Khách Thuê"}</span>
            <span className="px-2.5 py-0.5 text-[11px] font-black bg-[#2AC1BC]/15 text-[#138e89] rounded-full border border-[#2AC1BC]/30">
              BHRP Marketing
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            {locale === "en"
              ? "Comprehensive analytics on listing impressions, tenant inquiries, deposit conversion, and room performance."
              : "Thống kê dữ liệu các bài post tổng quan nhất, trực quan thực tế giúp chủ nhà tối ưu hóa lượt tiếp cận, liên hệ và đặt cọc."}
          </p>
        </div>

        {/* Action Controls: Building, Timeframe & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Building Selector */}
          <div className="relative">
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="pl-8.5 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] transition-colors cursor-pointer appearance-none shadow-2xs"
            >
              <option value="b1">Dormio Premier Q.1</option>
              <option value="b2">Campus Cầu Giấy</option>
              <option value="b3">Luxury Bình Thạnh</option>
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
              <option value="7_days">{locale === "en" ? "Last 7 days" : "7 ngày qua"}</option>
              <option value="month">{t("timeframeMonth")}</option>
              <option value="last_month">{t("timeframeLastMonth")}</option>
              <option value="quarter">{t("timeframeQuarter")}</option>
              <option value="year">{t("timeframeYear")}</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Export Excel Button (Primary Teal #2AC1BC) */}
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

      {/* ================= 4 HERO MARKETING KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng lượt tiếp cận bài đăng */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">{t("statReach")}</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">8,450</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#138e89] mt-1">
              <span className="px-1.5 py-0.5 rounded-md bg-[#2AC1BC]/15 text-[#138e89] inline-flex items-center gap-0.5 font-black">
                <ArrowUpRight className="w-3 h-3 text-[#2AC1BC]" />
                +28.4%
              </span>
              <span className="text-zinc-500 font-semibold">{t("comparedToLastMonth")}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Khách liên hệ hỏi thuê */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">{t("statInquiries")}</span>
            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B35] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">412</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#138e89] mt-1">
              <span className="px-1.5 py-0.5 rounded-md bg-[#2AC1BC]/15 text-[#138e89] inline-flex items-center gap-0.5 font-black">
                <ArrowUpRight className="w-3 h-3 text-[#2AC1BC]" />
                +19.2%
              </span>
              <span className="text-zinc-500 font-semibold">{t("responseRate98")}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Đặt cọc thành công */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">{t("statDeposits")}</span>
            <div className="w-9 h-9 rounded-2xl bg-[#2AC1BC]/15 text-[#2AC1BC] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{t("roomsDeposited", { count: 28 })}</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#138e89] mt-1">
              <span className="px-1.5 py-0.5 rounded-md bg-[#2AC1BC]/15 text-[#138e89] inline-flex items-center gap-0.5 font-black">
                <Award className="w-3 h-3 text-[#2AC1BC]" />
                {t("conversionRateBadge")}
              </span>
              <span className="text-zinc-500 font-semibold">{t("surpassedTarget15")}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Tiền cọc giữ qua sàn */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">{t("statDepositVolume")}</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">84.0M ₫</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 mt-1">
              <span>{t("avgDepositPerRoom")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2 INTERACTIVE CHARTS: TREND & FUNNEL ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Diễn biến Tiếp cận, Khách hỏi & Đặt cọc theo tuần */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>{t("marketingChartTitle")}</span>
                <span className="w-2 h-2 rounded-full bg-[#2AC1BC] animate-pulse" />
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {locale === "en"
                  ? "Weekly impressions, inquiries and secured deposits for rental listings."
                  : "Theo dõi lượng tiếp cận bài đăng, khách liên hệ và các lượt chốt cọc hàng tuần."}
              </p>
            </div>
            <span className="p-2 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketingTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="reach" name={locale === "en" ? "Post Views" : "Lượt xem tin"} stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="inquiries" name={locale === "en" ? "Inquiries" : "Khách hỏi"} stroke="#2AC1BC" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="deposits" name={locale === "en" ? "Deposits" : "Đặt cọc"} stroke="#FF6B35" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Phễu Chuyển Đổi Kinh Doanh Đăng Tin */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                {t("marketingFunnelTitle")}
              </h3>
              <span className="p-2 rounded-xl bg-orange-50 text-[#FF6B35]">
                <Flame className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-5">
              {locale === "en"
                ? "Step-by-step conversion funnel from initial view to successful rental deposit."
                : "Đo lường chi tiết tỷ lệ rơi rớt và chuyển đổi từ lúc khách thấy tin tới khi cọc phòng."}
            </p>

            {/* Funnel Progress Bars */}
            <div className="space-y-3.5">
              {marketingFunnelStages.map((stage, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-700">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-900 font-extrabold">{stage.count.toLocaleString()}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-600">
                        {stage.rate}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(12, 100 - i * 19)}%`,
                        backgroundColor: stage.fill
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-600">
              {locale === "en" ? "Overall Conversion (View ➔ Deposit):" : "Tỷ lệ chốt tổng thể (Xem ➔ Cọc):"}
            </span>
            <span className="font-extrabold text-[#138e89] text-sm bg-[#2AC1BC]/15 px-2.5 py-0.5 rounded-full border border-[#2AC1BC]/30">
              {t("overallConversionHigh", { rate: ((28 / 8450) * 100).toFixed(2) })}
            </span>
          </div>
        </div>
      </div>

      {/* ================= 2 VALUE-ADDED WIDGETS: NGUỒN KHÁCH & KHUNG GIỜ VÀNG ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Widget 1: Nguồn Khách Thuê & Kênh Tiếp Cận */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#2AC1BC]" />
                <span>{t("leadSourcesTitle")}</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2AC1BC]/10 text-[#138e89]">
                {t("leadSourcesBadge")}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-5">
              {t("leadSourcesSubtitle")}
            </p>

            <div className="space-y-4">
              {leadSources.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-3 bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200/60 rounded-2xl transition-all">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-zinc-800 font-bold block">{item.source}</span>
                          <span className="text-[11px] text-zinc-400 font-normal">
                            {t("conversionRateLabel")}{" "}
                            <strong className={item.textColor}>{item.conversion}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-900 font-extrabold">{item.count} {t("tenantsUnit")}</span>
                        <span className="text-zinc-500 text-[11px] font-bold block">{item.share}% {t("marketShare")}</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-200/70 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>{t("topChannel")} <strong className="text-zinc-800 font-bold">{locale === "en" ? "Dormio BHRP & Nearby Maps" : "Sàn Dormio BHRP & Bản đồ vị trí"}</strong></span>
            <span className="text-[#138e89] font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-[#2AC1BC]" />
              {t("topChannelHighlight")}
            </span>
          </div>
        </div>

        {/* Widget 2: Khung Giờ Vàng Khách Hỏi Thuê */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF6B35]" />
                <span>{t("peakHoursTitle")}</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-50 text-[#FF6B35] border border-orange-200/80">
                Peak Hours
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-5">
              {t("peakHoursSubtitle")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {peakHours.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.isGold
                      ? "bg-gradient-to-br from-[#2AC1BC]/10 via-[#2AC1BC]/5 to-transparent border-[#2AC1BC]/30 shadow-xs"
                      : "bg-zinc-50/70 border-zinc-200/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-zinc-900">{item.time}</span>
                    {item.isGold && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#2AC1BC] text-white">
                        {t("goldBadge")}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-semibold mb-2">{item.period}</div>
                  <div className="flex items-end justify-between">
                    <span className="text-xl font-black text-zinc-900">{item.percent}%</span>
                    <span className="text-xs font-bold text-zinc-400">{item.count} {t("inquiriesCountUnit")}</span>
                  </div>
                  <div className="w-full bg-zinc-200/70 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.isGold ? "bg-[#2AC1BC]" : "bg-zinc-400"}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-[#2AC1BC]/10 rounded-2xl border border-[#2AC1BC]/20 flex items-start gap-2.5 text-xs">
            <Zap className="w-4 h-4 text-[#2AC1BC] shrink-0 mt-0.5" />
            <p className="text-zinc-700 leading-relaxed font-medium">
              <strong className="text-zinc-900 font-bold">{t("peakHoursTip")}</strong> {t("peakHoursTipDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* ================= 2 VALUE-ADDED WIDGETS: SỨC HÚT THEO LOẠI PHÒNG & AI INSIGHTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Widget 3: Tốc Độ Chốt Cọc & Thị Hiếu Theo Loại Phòng (1 Cột) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2AC1BC]" />
                <span>{t("roomDemandTitle")}</span>
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              {t("roomDemandSubtitle")}
            </p>

            <div className="space-y-3">
              {roomTypeMetrics.map((rt, idx) => (
                <div key={idx} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-900">{rt.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${rt.demandColor}`}>
                      {rt.demand}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2 text-zinc-600">
                    <span>{t("closingTimeLabel")} <strong className="text-zinc-900 font-extrabold">{rt.avgDays}</strong></span>
                    <span className="text-[11px] text-[#138e89] font-bold">{rt.inquiryGrowth} {t("inquiriesGrowthLabel")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-400">
            {t("sampleDataNote")}
          </div>
        </div>

        {/* Widget 4: Dormio Smart AI Insights (2 Cột) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#2AC1BC]/20 text-[#2AC1BC] flex items-center justify-center border border-[#2AC1BC]/40">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>{t("aiInsightsTitle")}</span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#2AC1BC] text-zinc-950 rounded-full">
                      AI Powered
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {t("aiInsightsSubtitle")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
              {/* Card 1: Bổ sung hình ảnh */}
              <div className="bg-zinc-800/80 border border-zinc-700/80 p-4 rounded-2xl hover:border-[#2AC1BC]/60 transition-all">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2AC1BC] mb-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>{t("aiTip1Title")}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {t("aiTip1Desc")}
                </p>
              </div>

              {/* Card 2: Giá thuê cạnh tranh */}
              <div className="bg-zinc-800/80 border border-zinc-700/80 p-4 rounded-2xl hover:border-[#2AC1BC]/60 transition-all">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2AC1BC] mb-2">
                  <Award className="w-4 h-4" />
                  <span>{t("aiTip2Title")}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {t("aiTip2Desc")}
                </p>
              </div>

              {/* Card 3: Khung thời gian đẩy tin */}
              <div className="bg-zinc-800/80 border border-zinc-700/80 p-4 rounded-2xl hover:border-[#2AC1BC]/60 transition-all">
                <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B35] mb-2">
                  <Rocket className="w-4 h-4" />
                  <span>{t("aiTip3Title")}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {t("aiTip3Desc")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-700/60 flex items-center justify-between text-xs text-zinc-400">
            <span>{t("aiRefreshNote")}</span>
            <span className="text-[#2AC1BC] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("aiReliability")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
