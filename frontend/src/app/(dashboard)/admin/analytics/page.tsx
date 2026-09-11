"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  adminAnalyticsService,
  RevenueAnalyticsResponse,
  UserAnalyticsResponse,
  PropertyAnalyticsResponse,
  ListingAnalyticsResponse,
  RevenuePeriod,
  TimeBucketPeriod,
} from "@/services/admin-analytics.service";
import {
  TrendingUp,
  BarChart2,
  PieChart,
  Users,
  Building2,
  Wallet,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Bookmark,
  Share2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type ActiveTab = "revenue" | "users" | "properties" | "listings";

export default function AdminAnalyticsPage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [activeTab, setActiveTab] = useState<ActiveTab>("revenue");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("month");
  const [genericPeriod, setGenericPeriod] = useState<TimeBucketPeriod>("month");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Analytics states
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsResponse | null>(null);
  const [userData, setUserData] = useState<UserAnalyticsResponse | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyAnalyticsResponse | null>(null);
  const [listingData, setListingData] = useState<ListingAnalyticsResponse | null>(null);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [rev, usr, prop, list] = await Promise.all([
        adminAnalyticsService.getRevenueAnalytics({
          period: revenuePeriod,
          year: selectedYear,
        }).catch(() => null),
        adminAnalyticsService.getUserAnalytics({
          period: genericPeriod,
          year: selectedYear,
        }).catch(() => null),
        adminAnalyticsService.getPropertyAnalytics({
          period: genericPeriod,
          year: selectedYear,
        }).catch(() => null),
        adminAnalyticsService.getListingAnalytics({
          period: genericPeriod,
          year: selectedYear,
        }).catch(() => null),
      ]);

      if (rev) setRevenueData(rev);
      if (usr) setUserData(usr);
      if (prop) setPropertyData(prop);
      if (list) setListingData(list);
    } catch (err) {
      console.error("Failed to load admin analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [revenuePeriod, genericPeriod, selectedYear]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Currency formatter
  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return "0 ₫";
    return new Intl.NumberFormat(isEn ? "en-US" : "vi-VN").format(val) + " ₫";
  };

  const formatNumber = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return "0";
    return new Intl.NumberFormat(isEn ? "en-US" : "vi-VN").format(val);
  };

  // Export JSON/CSV Report
  const handleExportReport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      year: selectedYear,
      activeTab,
      revenueSummary: revenueData?.summary,
      userSummary: userData?.summary,
      propertySummary: propertyData?.summary,
      listingSummary: listingData?.summary,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dormio-admin-analytics-${activeTab}-${selectedYear}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Pie chart palette
  const PIE_COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wide uppercase">
              <TrendingUp className="w-3.5 h-3.5" />
              {isEn ? "Platform Intelligence & Global Analytics" : "Báo Cáo Phân Tích Toàn Diện Nền Tảng"}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              • {isEn ? "Real-time Operations" : "Dữ liệu thời gian thực"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {isEn ? "National System Operations & Platform Revenue" : "Trung Tâm Giám Sát Vận Hành & Doanh Thu Nền Tảng"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isEn
              ? "Comprehensive analytics tracking platform monetization, tenant demand, occupancy trends, and rental listings."
              : "Thống kê thời gian thực về nguồn thu nền tảng (gói dịch vụ & gói tin), tốc độ tăng trưởng người dùng, tỷ lệ lấp đầy phòng và tin đăng cho thuê."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-bold px-3 py-2 bg-white border border-zinc-200 rounded-xl shadow-xs text-zinc-700 hover:border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {isEn ? `Year ${y}` : `Năm ${y}`}
              </option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 shadow-xs transition-colors disabled:opacity-50"
            title={isEn ? "Refresh Data" : "Làm mới dữ liệu"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-orange-600" : ""}`} />
            <span className="hidden sm:inline">{isEn ? "Refresh" : "Làm mới"}</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isEn ? "Export Report" : "Xuất Báo Cáo"}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("revenue")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "revenue"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>{isEn ? "Platform Revenue (UC-A-06)" : "Doanh Thu Nền Tảng (UC-A-06)"}</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "users"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isEn ? "Users Analytics (UC-A-01)" : "Người Dùng Toàn Hệ Thống (UC-A-01)"}</span>
        </button>

        <button
          onClick={() => setActiveTab("properties")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "properties"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{isEn ? "Properties & Rooms (UC-A-02)" : "Nhà Trọ & Phòng (UC-A-02)"}</span>
        </button>

        <button
          onClick={() => setActiveTab("listings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "listings"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isEn ? "BHRP Listings (UC-A-03)" : "Tin Đăng BHRP (UC-A-03)"}</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* ──────────────────────────────────────────────────────────────────────
          TAB 1: PLATFORM REVENUE (UC-A-06)
          ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          {/* Sub-controls: Granularity Period Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-zinc-800">
                {isEn ? "Revenue Granularity Mode:" : "Chế độ tổng hợp dòng tiền:"}
              </span>
            </div>

            <div className="flex items-center p-1 bg-zinc-100 rounded-xl">
              {(
                [
                  { id: "month" as const, label: isEn ? "By Month" : "Theo Tháng" },
                  { id: "quarter" as const, label: isEn ? "By Quarter" : "Theo Quý" },
                  { id: "year" as const, label: isEn ? "By Year" : "Theo Năm" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRevenuePeriod(p.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    revenuePeriod === p.id
                      ? "bg-white text-orange-600 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Total Platform Revenue */}
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-orange-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {isEn ? "Net Platform Revenue" : "Tổng Doanh Thu Thuần Nền Tảng"}
                </span>
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-black text-zinc-900 tracking-tight">
                  {formatCurrency(revenueData?.summary.totalRevenue)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-full ${
                    (revenueData?.summary.revenueGrowthRate || 0) >= 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {(revenueData?.summary.revenueGrowthRate || 0) >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {revenueData?.summary.revenueGrowthRate || 0}%
                </span>
                <span className="text-xs text-zinc-400">
                  {isEn ? "vs previous period" : "so với kỳ trước"} (
                  {formatCurrency(revenueData?.summary.previousPeriodRevenue)})
                </span>
              </div>
            </div>

            {/* Card 2: Subscription Revenue */}
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-blue-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {isEn ? "Subscription Packages" : "Gói Thuê Bao Chủ Trọ"}
                </span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-black text-zinc-900 tracking-tight">
                  {formatCurrency(revenueData?.summary.subscriptionRevenue.total)}
                </span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {revenueData?.summary.subscriptionRevenue.percentage || 0}%
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-semibold">
                  Plus: {formatCurrency(revenueData?.summary.subscriptionRevenue.byPlan.plus)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-semibold">
                  Pro: {formatCurrency(revenueData?.summary.subscriptionRevenue.byPlan.pro)}
                </span>
              </div>
            </div>

            {/* Card 3: Post Credit Purchases */}
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {isEn ? "Post Credit Purchases" : "Gói Mua Tin Đăng BHRP"}
                </span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-black text-zinc-900 tracking-tight">
                  {formatCurrency(revenueData?.summary.postPurchaseRevenue.total)}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {revenueData?.summary.postPurchaseRevenue.percentage || 0}%
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {isEn ? "Sold" : "Đã bán"}:{" "}
                  <strong className="text-zinc-800">
                    {formatNumber(revenueData?.summary.postPurchaseRevenue.totalCreditsSold)}
                  </strong>{" "}
                  {isEn ? "credits" : "lượt tin"}
                </span>
                <span>
                  AOV:{" "}
                  <strong className="text-zinc-800">
                    {formatCurrency(revenueData?.summary.postPurchaseRevenue.averageOrderValue)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stacked Bar Chart: Revenue Timeline */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-black text-zinc-900">
                    {isEn ? "Revenue Growth Timeline" : "Biểu Đồ Tăng Trưởng Doanh Thu Nền Tảng"}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isEn
                      ? "Distribution across Plus, Pro, and Post Credit purchases"
                      : "Cơ cấu theo gói Plus, gói Pro và nạp lượt đăng tin"}
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                {revenueData?.timeline && revenueData.timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : `${v}`)}
                      />
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val))}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="subscriptionPlus" name={isEn ? "Plus Package" : "Gói Plus"} stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="subscriptionPro" name={isEn ? "Pro Package" : "Gói Pro"} stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="postPurchase" name={isEn ? "Post Credits" : "Lượt Đăng Tin"} stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                    {isEn ? "No timeline data available" : "Chưa có dữ liệu theo mốc thời gian"}
                  </div>
                )}
              </div>
            </div>

            {/* Donut Chart: Revenue Streams Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-black text-zinc-900">
                  {isEn ? "Monetization Streams" : "Tỷ Trọng Nguồn Thu Nền Tảng"}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isEn ? "Revenue breakdown by channel" : "Phần trăm đóng góp theo từng kênh thu"}
                </p>
              </div>

              <div className="h-56 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        {
                          name: isEn ? "Plus Plan" : "Gói Plus",
                          value: revenueData?.summary.subscriptionRevenue.byPlan.plus || 0,
                        },
                        {
                          name: isEn ? "Pro Plan" : "Gói Pro",
                          value: revenueData?.summary.subscriptionRevenue.byPlan.pro || 0,
                        },
                        {
                          name: isEn ? "Post Credits" : "Lượt Đăng Tin",
                          value: revenueData?.summary.postPurchaseRevenue.total || 0,
                        },
                      ]}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {PIE_COLORS.map((color, idx) => (
                        <Cell key={`cell-${idx}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 border-t border-zinc-100 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                    <span className="text-zinc-600">{isEn ? "Plus Subscriptions" : "Gói Plus"}</span>
                  </div>
                  <span className="font-bold text-zinc-900">
                    {formatCurrency(revenueData?.summary.subscriptionRevenue.byPlan.plus)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                    <span className="text-zinc-600">{isEn ? "Pro Subscriptions" : "Gói Pro"}</span>
                  </div>
                  <span className="font-bold text-zinc-900">
                    {formatCurrency(revenueData?.summary.subscriptionRevenue.byPlan.pro)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                    <span className="text-zinc-600">{isEn ? "Post Credits" : "Lượt Đăng Tin"}</span>
                  </div>
                  <span className="font-bold text-zinc-900">
                    {formatCurrency(revenueData?.summary.postPurchaseRevenue.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          TAB 2: USERS ANALYTICS (UC-A-01)
          ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* User Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Total Registered Users" : "Tổng Người Dùng"}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900">
                  {formatNumber(userData?.summary.totalUsers)}
                </span>
                <span
                  className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                    (userData?.summary.growthRate || 0) >= 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {(userData?.summary.growthRate || 0) >= 0 ? "+" : ""}
                  {userData?.summary.growthRate || 0}%
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                +{formatNumber(userData?.summary.newUsersCurrentPeriod)} {isEn ? "new in period" : "mới trong kỳ"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Tenants" : "Khách Thuê Trọ"}
              </span>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {formatNumber(userData?.summary.byRole.tenant)}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {userData?.summary.totalUsers
                  ? `${Math.round(((userData.summary.byRole.tenant || 0) / userData.summary.totalUsers) * 100)}%`
                  : "0%"}{" "}
                {isEn ? "of total users" : "tổng người dùng"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Landlords" : "Chủ Nhà Trọ"}
              </span>
              <div className="mt-2 text-2xl font-black text-orange-600">
                {formatNumber(userData?.summary.byRole.landlord)}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {userData?.summary.totalUsers
                  ? `${Math.round(((userData.summary.byRole.landlord || 0) / userData.summary.totalUsers) * 100)}%`
                  : "0%"}{" "}
                {isEn ? "of total users" : "tổng người dùng"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Staff & Agents" : "Nhân Viên & Môi Giới"}
              </span>
              <div className="mt-2 text-2xl font-black text-emerald-600">
                {formatNumber(
                  (userData?.summary.byRole.employee || 0) + (userData?.summary.byRole.leasing_agent || 0),
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {userData?.summary.byRole.employee || 0} {isEn ? "Staff" : "Nhân viên"} •{" "}
                {userData?.summary.byRole.leasing_agent || 0} {isEn ? "Agents" : "Môi giới"}
              </p>
            </div>
          </div>

          {/* User Registration Timeline Chart */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-zinc-900">
                  {isEn ? "New User Registration Trend" : "Tốc Độ Đăng Ký Tài Khoản Mới"}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isEn
                    ? "Time-bucketed user onboarding volume"
                    : "Số lượng tài khoản gia nhập hệ thống theo các mốc thời gian"}
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              {userData?.timeline && userData.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userData.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="count" name={isEn ? "Total New Users" : "Tổng tài khoản mới"} fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                  {isEn ? "No user data available" : "Chưa có dữ liệu người dùng"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          TAB 3: PROPERTIES & ROOMS ANALYTICS (UC-A-02)
          ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "properties" && (
        <div className="space-y-6">
          {/* Properties KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Boarding Houses" : "Tổng Nhà Trọ"}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900">
                  {formatNumber(propertyData?.summary.totalHouses)}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +{formatNumber(propertyData?.summary.newHousesCurrentPeriod)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {propertyData?.summary.housesByStatus.active} {isEn ? "Active" : "Đang hoạt động"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Total Rooms" : "Tổng Số Phòng"}
              </span>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {formatNumber(propertyData?.summary.totalRooms)}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {propertyData?.summary.roomsByStatus.available} {isEn ? "Available" : "Còn trống"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Occupancy Rate" : "Tỷ Lệ Lấp Đầy"}
              </span>
              <div className="mt-2 text-2xl font-black text-emerald-600">
                {propertyData?.summary.occupancyRate || 0}%
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {propertyData?.summary.roomsByStatus.occupied} {isEn ? "Occupied" : "Đang ở"} •{" "}
                {propertyData?.summary.roomsByStatus.deposited} {isEn ? "Deposited" : "Đã cọc"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Maintenance Rooms" : "Phòng Bảo Trì"}
              </span>
              <div className="mt-2 text-2xl font-black text-amber-600">
                {propertyData?.summary.roomsByStatus.maintainace || 0}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {isEn ? "Requires attention" : "Cần bảo dưỡng định kỳ"}
              </p>
            </div>
          </div>

          {/* Regional Breakdown Table */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-zinc-900">
                  {isEn ? "Regional Distribution & Occupancy" : "Phân Bổ Khu Vực & Tỷ Lệ Lấp Đầy"}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isEn ? "Operational statistics by province and city" : "Mật độ chuỗi trọ và phòng tại các tỉnh thành"}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">{isEn ? "Region / Province" : "Tỉnh / Thành Phố"}</th>
                    <th className="py-3 px-4">{isEn ? "Houses" : "Số Nhà Trọ"}</th>
                    <th className="py-3 px-4">{isEn ? "Rooms" : "Tổng Phòng"}</th>
                    <th className="py-3 px-4">{isEn ? "Occupancy" : "Tỷ Lệ Lấp Đầy"}</th>
                    <th className="py-3 px-4">{isEn ? "Share" : "Tỷ Trọng"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                  {propertyData?.summary.regions && propertyData.summary.regions.length > 0 ? (
                    propertyData.summary.regions.map((reg, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-zinc-900">{reg.name}</td>
                        <td className="py-3 px-4">{formatNumber(reg.houses)}</td>
                        <td className="py-3 px-4 font-semibold">{formatNumber(reg.rooms)}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                            {reg.occupancyRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-500">{reg.share}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-zinc-400">
                        {isEn ? "No regional data available" : "Chưa có dữ liệu phân bổ khu vực"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          TAB 4: BHRP LISTINGS ANALYTICS (UC-A-03)
          ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "listings" && (
        <div className="space-y-6">
          {/* Listings KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Total Listings" : "Tổng Tin Đăng"}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900">
                  {formatNumber(listingData?.summary.totalPosts)}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +{formatNumber(listingData?.summary.newPostsCurrentPeriod)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {listingData?.summary.byStatus.posted} {isEn ? "Active on BHRP" : "Đang hiển thị"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Total Impressions / Views" : "Lượt Xem Tin Đăng"}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-600">
                  {formatNumber(listingData?.summary.totalViews)}
                </span>
                <Eye className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {isEn ? "Average" : "Trung bình"}:{" "}
                <strong className="text-zinc-800">{listingData?.summary.averageViewsPerPost || 0}</strong>{" "}
                {isEn ? "views/post" : "lượt xem/tin"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Bookmarks / Saves" : "Lượt Lưu Tin"}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600">
                  {formatNumber(listingData?.summary.totalSaved)}
                </span>
                <Bookmark className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {isEn ? "Prospective tenant interest" : "Mức độ quan tâm của khách tìm phòng"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {isEn ? "Source Quota" : "Nguồn Đăng Tin"}
              </span>
              <div className="mt-2 text-2xl font-black text-emerald-600">
                {formatNumber(listingData?.summary.bySourceType.purchased)}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {isEn ? "Purchased credits" : "Gói tin trả phí"} •{" "}
                {formatNumber(listingData?.summary.bySourceType.free_quote)} {isEn ? "Free" : "Miễn phí"}
              </p>
            </div>
          </div>

          {/* Listings Volume Timeline Chart */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-zinc-900">
                  {isEn ? "Rental Listings Publication Trend" : "Tần Suất Đăng Tin Cho Thuê"}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isEn
                    ? "Listing publication rate on BHRP rental portal"
                    : "Biểu đồ thống kê số lượng tin đăng phát hành qua từng tháng"}
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              {listingData?.timeline && listingData.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={listingData.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="listingColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name={isEn ? "Published Listings" : "Tin đăng mới"}
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#listingColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                  {isEn ? "No listing trend data available" : "Chưa có dữ liệu tin đăng"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
