"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  Users, Building2, Wallet, AlertTriangle, ShieldCheck,
  Megaphone, Newspaper, TrendingUp, ArrowRight, ArrowUpRight,
  CheckCircle2, ShieldAlert, ChevronRight
} from "lucide-react";
import { adminAnalyticsService, AdminOverviewResponse } from "@/services/admin-analytics.service";

export default function AdminDashboardPage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [liveOverview, setLiveOverview] = React.useState<AdminOverviewResponse | null>(null);

  React.useEffect(() => {
    adminAnalyticsService
      .getAdminOverview()
      .then((data) => setLiveOverview(data))
      .catch((err) => console.warn("Failed to fetch live admin overview, using fallback:", err));
  }, []);

  const totalUsersVal = liveOverview
    ? new Intl.NumberFormat(isEn ? "en-US" : "vi-VN").format(liveOverview.totalUsers)
    : "12,480";

  const userSubtext = liveOverview
    ? `${liveOverview.userRoles?.tenant || 0} ${isEn ? "Tenants" : "Khách"} • ${liveOverview.userRoles?.landlord || 0} ${isEn ? "Landlords" : "Chủ trọ"} • ${liveOverview.userRoles?.employee || 0} ${isEn ? "Staff" : "NV"}`
    : isEn ? "8,920 Tenants • 3,140 Landlords • 420 Staff" : "8.920 Khách • 3.140 Chủ trọ • 420 NV";

  const userGrowth = liveOverview
    ? `${liveOverview.userGrowthRate >= 0 ? "+" : ""}${liveOverview.userGrowthRate}%`
    : "+14.2%";

  const totalHousesVal = liveOverview
    ? new Intl.NumberFormat(isEn ? "en-US" : "vi-VN").format(liveOverview.totalHouses)
    : "1,850";

  const propSubtext = liveOverview
    ? `${new Intl.NumberFormat(isEn ? "en-US" : "vi-VN").format(liveOverview.totalRooms)} ${isEn ? "rooms" : "phòng"} • ${liveOverview.occupancyRate}% ${isEn ? "Occupancy" : "lấp đầy"}`
    : isEn ? "24,600 rooms • 88.5% Occupancy" : "24.600 phòng • 88.5% lấp đầy";

  const propGrowth = liveOverview
    ? `${liveOverview.propertyGrowthRate >= 0 ? "+" : ""}${liveOverview.propertyGrowthRate}%`
    : "+8.6%";

  const revenueVal = liveOverview
    ? new Intl.NumberFormat(isEn ? "en-US" : "vi-VN").format(liveOverview.platformRevenue)
    : "148.500.000";

  const revenueGrowth = liveOverview
    ? `${liveOverview.revenueGrowthRate >= 0 ? "+" : ""}${liveOverview.revenueGrowthRate}%`
    : "+22.4%";

  const pendingGrv = liveOverview
    ? String(liveOverview.pendingGrievancesCount)
    : "7";

  const urgentGrvText = liveOverview
    ? `${liveOverview.urgentGrievancesCount} ${isEn ? "URGENT cases awaiting action" : "vụ việc KHẨN CẤP cần xử lý ngay"}`
    : isEn ? "3 URGENT cases awaiting action" : "3 vụ việc KHẨN CẤP cần xử lý ngay";

  const reportedItemsVal = liveOverview
    ? String(liveOverview.reportedItemsCount)
    : "12";

  // Dynamic quick stats from live API with fallbacks
  const stats = [
    {
      id: "users",
      label: isEn ? "Total Users" : "Tổng người dùng",
      value: totalUsersVal,
      subtext: userSubtext,
      growth: userGrowth,
      isPositive: true,
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      id: "properties",
      label: isEn ? "Houses & Rooms" : "Nhà trọ & Phòng",
      value: totalHousesVal,
      subtext: propSubtext,
      growth: propGrowth,
      isPositive: true,
      icon: Building2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      id: "revenue",
      label: isEn ? "Platform Revenue" : "Doanh thu nền tảng",
      value: revenueVal,
      unit: "₫",
      subtext: isEn ? "Subscription packages & Post credits" : "Gói dịch vụ chủ trọ & Lượt đăng tin",
      growth: revenueGrowth,
      isPositive: true,
      icon: Wallet,
      color: "text-orange-600 bg-orange-50 border-orange-100",
    },
    {
      id: "grievances",
      label: isEn ? "Pending Grievances" : "Khiếu nại chờ xử lý",
      value: pendingGrv,
      subtext: urgentGrvText,
      growth: isEn ? "Action needed" : "Cần can thiệp",
      isPositive: false,
      icon: AlertTriangle,
      color: "text-orange-600 bg-orange-50 border-orange-100",
      badge: liveOverview ? `${liveOverview.urgentGrievancesCount} ${isEn ? "URGENT" : "KHẨN CẤP"}` : isEn ? "3 URGENT" : "3 KHẨN CẤP",
      link: "/admin/grievances",
    },
    {
      id: "moderation",
      label: isEn ? "Reported Items" : "Vi phạm & Nghi vấn",
      value: reportedItemsVal,
      subtext: isEn ? "Flagged rental listings" : "Tin đăng bị báo cáo / ẩn",
      growth: isEn ? "Needs review" : "Chờ kiểm tra",
      isPositive: false,
      icon: ShieldAlert,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      badge: `${reportedItemsVal} ${isEn ? "Items" : "Mục"}`,
      link: "/admin/moderation",
    },
  ];

  // Urgent Grievances Quick Queue
  const urgentGrievances = [
    {
      id: "GRV-1092",
      tenant: "Nguyễn Thị Mai",
      tenantPhone: "0912.345.678",
      house: "Dormio Sunrise (Phòng 302)",
      landlord: "Trần Đức Nam",
      category: isEn ? "Illegal deposit withholding" : "Không chịu hoàn tiền cọc kết thúc HĐ",
      priority: "urgent",
      time: isEn ? "25 mins ago" : "25 phút trước",
    },
    {
      id: "GRV-1088",
      tenant: "Lê Hoàng Phúc",
      tenantPhone: "0988.112.233",
      house: "Ký túc xá Cao Lỗ (Phòng 104)",
      landlord: "Võ Thị Bích",
      category: isEn ? "Abrupt power cut & safety breach" : "Cắt điện vô cớ & đe dọa đuổi trọ",
      priority: "urgent",
      time: isEn ? "1 hour ago" : "1 giờ trước",
    },
    {
      id: "GRV-1085",
      tenant: "Phạm Hải Đăng",
      tenantPhone: "0909.876.543",
      house: "Nhà trọ Thảo Điền Garden (Phòng 201)",
      landlord: "Đặng Quốc Cường",
      category: isEn ? "Misleading room facilities vs listing" : "Phòng thực tế dột nát, khác 100% hình đăng",
      priority: "high",
      time: isEn ? "3 hours ago" : "3 giờ trước",
    },
  ];

  // Flagged Listings Quick Queue
  const flaggedListings = [
    {
      id: "LST-8904",
      title: isEn ? "Studio Luxury Q1 full options only 800k/month" : "Studio Cao cấp Quận 1 full nội thất chỉ 800k/tháng",
      landlord: "Lê Minh Tuấn",
      reason: isEn ? "Fraudulent price: Unrealistic bait price (800k/mo in Q1)" : "Giá ảo câu khách bất thường (800.000 ₫/tháng ở Q1)",
      reportsCount: 8,
      status: "active",
      flaggedDate: isEn ? "Today, 10:20" : "Hôm nay, 10:20",
    },
    {
      id: "LST-8891",
      title: isEn ? "Clean single room near FPT University" : "Phòng đơn khép kín gần ĐH FPT - Có gác lửng",
      landlord: "Nguyễn Văn Hùng",
      reason: isEn ? "Stolen photos from Pinterest / watermark mismatch" : "Sử dụng ảnh mạng Pinterest, không trùng cơ sở",
      reportsCount: 4,
      status: "active",
      flaggedDate: isEn ? "Yesterday" : "Hôm qua",
    },
    {
      id: "LST-8876",
      title: isEn ? "Cheap boarding house Binh Thanh - Ask deposit via personal QR" : "Nhà trọ giá rẻ Bình Thạnh - Yêu cầu cọc trước STK cá nhân",
      landlord: "Phạm Thu Thảo",
      reason: isEn ? "Bypassing escrow deposit, suspected scam" : "Ép chuyển cọc ngoài không qua nền tảng bảo vệ",
      reportsCount: 11,
      status: "active",
      flaggedDate: isEn ? "2 days ago" : "2 ngày trước",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Hero Banner & Title */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/90 text-white p-6 sm:p-8 shadow-xl">
        {/* Ambient Decorative Glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-500/25 text-orange-300 border border-orange-500/40 tracking-wider uppercase">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                {isEn ? "System Administrator Control Hub" : "Cổng Kiểm Soát Quản Trị Hệ Thống"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isEn ? "All services online" : "Hệ thống vận hành ổn định"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isEn ? "Platform Overview & Governance" : "Tổng Quan Vận Hành & Giám Sát Nền Tảng"}
            </h1>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
              {isEn
                ? "Monitor national data, moderate suspicious listings and boarding houses, resolve tenant grievances, and dispatch multi-channel announcements."
                : "Theo dõi dữ liệu toàn quốc, kiểm soát bài đăng & nhà trọ nghi vấn, xử lý khiếu nại từ khách thuê và gửi thông báo đa kênh."}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/admin/notifications"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Megaphone className="w-4 h-4 text-orange-400" />
              <span>{isEn ? "Send Broadcast" : "Gửi thông báo"}</span>
            </Link>
            <Link
              href="/admin/blogs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Newspaper className="w-4 h-4 text-amber-400" />
              <span>{isEn ? "New Blog Post" : "Soạn bài Blog"}</span>
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-600/30 cursor-pointer whitespace-nowrap"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{isEn ? "Full Analytics" : "Báo cáo chi tiết"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards - Bulletproof against text-dropping & overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="group relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs hover:shadow-md hover:border-orange-300/80 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Top row: Icon on left, Growth/Status badge on right */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  {item.growth && (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                        item.isPositive
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200/80"
                          : "text-orange-700 bg-orange-50 border-orange-200/80"
                      }`}
                    >
                      {item.isPositive && <TrendingUp className="w-3 h-3 shrink-0" />}
                      {!item.isPositive && <AlertTriangle className="w-3 h-3 shrink-0" />}
                      {item.growth}
                    </span>
                  )}
                </div>

                {/* Card Title Label (Full width, no truncation) */}
                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  {item.label}
                </span>

                {/* Main Metric Value (Bound inline with unit, NEVER drops lines) */}
                <div className="flex items-baseline gap-1 text-zinc-900 leading-none whitespace-nowrap">
                  <span className="text-2xl sm:text-[26px] font-black tracking-tight">
                    {item.value}
                  </span>
                  {item.unit && (
                    <span className="text-sm font-extrabold text-zinc-500 select-none">
                      {item.unit}
                    </span>
                  )}
                </div>

                {/* Informative Subtext */}
                <p className="text-[11px] font-medium text-zinc-500 mt-2.5 leading-relaxed">
                  {item.subtext}
                </p>
              </div>

              {/* Card Footer Link */}
              {item.link ? (
                <Link
                  href={item.link}
                  className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                >
                  <span>{isEn ? "Handle now" : "Truy cập xử lý ngay"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="mt-4 pt-3 border-t border-zinc-100/70 flex items-center justify-between text-[11px] font-medium text-zinc-400">
                  <span>{isEn ? "System verified" : "Dữ liệu xác thực"}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Operational Highlights Section (Grievance Queue & Moderation Queue) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Urgent Tenant Grievances */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">
                    {isEn ? "Urgent Tenant Grievances" : "Khiếu Nại Cần Xử Lý Khẩn Cấp"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {isEn ? "Priority complaints escalated to system admins" : "Các phản ánh có độ ưu tiên cao từ khách thuê trọ"}
                  </p>
                </div>
              </div>
              <Link
                href="/admin/grievances"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span>{isEn ? "View all (7)" : "Xem tất cả (7)"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {urgentGrievances.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 hover:bg-orange-50/30 hover:border-orange-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-600 text-white uppercase tracking-wider">
                        {item.priority === "urgent" ? (isEn ? "URGENT" : "KHẨN CẤP") : (isEn ? "HIGH" : "CAO")}
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-600">{item.id}</span>
                      <span className="text-[11px] text-zinc-400">• {item.time}</span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 leading-snug">
                      {item.category}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      <span className="font-semibold text-zinc-800">{item.tenant}</span> ({item.tenantPhone}){" "}
                      <span className="text-zinc-400">→</span>{" "}
                      <span className="text-zinc-700 font-medium">{item.house}</span>
                    </p>
                  </div>

                  <Link
                    href="/admin/grievances"
                    className="shrink-0 px-4 py-2 rounded-xl bg-white hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200/90 hover:border-orange-600 text-xs font-bold transition-all shadow-2xs text-center cursor-pointer whitespace-nowrap"
                  >
                    {isEn ? "Resolve" : "Xử lý ngay"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2: Flagged / Reported Listings */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">
                    {isEn ? "Suspicious Listings & Houses" : "Tin Đăng & Nhà Trọ Nghi Vấn"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {isEn ? "Reported by users or flagged by security filters" : "Bị người dùng báo cáo hoặc có dấu hiệu lừa đảo/giá ảo"}
                  </p>
                </div>
              </div>
              <Link
                href="/admin/moderation"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span>{isEn ? "Inspect (12)" : "Kiểm duyệt (12)"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {flaggedListings.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 hover:bg-amber-50/30 hover:border-amber-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                        {item.reportsCount} {isEn ? "Reports" : "Báo cáo"}
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-600">{item.id}</span>
                      <span className="text-[11px] text-zinc-400">• {item.flaggedDate}</span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 leading-snug">
                      {item.title}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-lg font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="line-clamp-1">{item.reason}</span>
                    </div>
                  </div>

                  <Link
                    href="/admin/moderation"
                    className="shrink-0 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-md text-center cursor-pointer whitespace-nowrap"
                  >
                    {isEn ? "Inspect & Lock" : "Kiểm tra & Khóa"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Direct Access to Admin Submodules */}
      <div className="bg-zinc-100/80 rounded-3xl p-6 sm:p-7 border border-zinc-200/80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs sm:text-sm font-black text-zinc-600 uppercase tracking-wider">
            {isEn ? "Direct Access to Admin Modules" : "Các Phân Hệ Quản Trị Hệ Thống"}
          </h2>
          <span className="text-xs font-semibold text-zinc-400">
            {isEn ? "4 core management areas" : "4 phân hệ cốt lõi"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/moderation"
            className="group p-5 rounded-2xl bg-white border border-zinc-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                {isEn ? "Content & House Moderation" : "Kiểm Duyệt & Giám Sát"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                {isEn ? "Inspect & lock fraudulent listings and properties" : "Kiểm tra từng tin đăng, khóa các cơ sở gian lận"}
              </p>
            </div>
          </Link>

          <Link
            href="/admin/grievances"
            className="group p-5 rounded-2xl bg-white border border-zinc-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                {isEn ? "Tenant Grievances" : "Khiếu Nại Khách Thuê"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                {isEn ? "Resolve or reject tenant complaints with proof" : "Xử lý mâu thuẫn cọc, an ninh, ghi chú kết luận"}
              </p>
            </div>
          </Link>

          <Link
            href="/admin/notifications"
            className="group p-5 rounded-2xl bg-white border border-zinc-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                {isEn ? "Mass Dispatcher" : "Gửi Thông Báo Hàng Loạt"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                {isEn ? "Broadcast via In-App, Email, SMS, Zalo ZNS" : "Chiến dịch In-App, Email, SMS, Zalo cho chủ trọ & khách"}
              </p>
            </div>
          </Link>

          <Link
            href="/admin/blogs"
            className="group p-5 rounded-2xl bg-white border border-zinc-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Newspaper className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                {isEn ? "Public Blog Management" : "Quản Lý Bài Viết Blog"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                {isEn ? "Draft & publish tips and legal advice articles" : "Xuất bản bài viết cẩm nang thuê trọ, mẹo kinh doanh"}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
