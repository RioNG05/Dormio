"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  TrendingUp, BarChart2, PieChart, Users, Building2, Wallet,
  Calendar, Download, ArrowUpRight, ArrowDownRight, ShieldCheck,
  MapPin, CheckCircle2, Clock, Percent, DollarSign, Activity
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [timeBucket, setTimeBucket] = useState<"week" | "month" | "year">("month");

  // Mock aggregated metrics based on timeBucket
  const metrics = {
    week: {
      newUsers: "+420",
      newUsersChange: "+12.4%",
      newProperties: "+28",
      newPropertiesChange: "+8.1%",
      escrowVolume: isEn ? "185,000,000 ₫" : "185.000.000 ₫",
      escrowChange: "+15.3%",
      avgResolutionHours: "3.8h",
      occupancyRate: "89.2%",
    },
    month: {
      newUsers: "+1,860",
      newUsersChange: "+18.6%",
      newProperties: "+114",
      newPropertiesChange: "+11.2%",
      escrowVolume: isEn ? "840,000,000 ₫" : "840.000.000 ₫",
      escrowChange: "+22.4%",
      avgResolutionHours: "4.2h",
      occupancyRate: "88.5%",
    },
    year: {
      newUsers: "+12,480",
      newUsersChange: "+45.2%",
      newProperties: "+850",
      newPropertiesChange: "+34.5%",
      escrowVolume: isEn ? "8,450,000,000 ₫" : "8.450.000.000 ₫",
      escrowChange: "+52.0%",
      avgResolutionHours: "4.5h",
      occupancyRate: "87.8%",
    },
  }[timeBucket];

  // Regional breakdown
  const regions = [
    { name: isEn ? "Ho Chi Minh City" : "TP. Hồ Chí Minh", houses: 920, rooms: 12400, occupancy: 91, share: "48%" },
    { name: isEn ? "Hanoi Capital" : "Hà Nội", houses: 580, rooms: 7800, occupancy: 88, share: "32%" },
    { name: isEn ? "Da Nang" : "Đà Nẵng", houses: 160, rooms: 2100, occupancy: 84, share: "9%" },
    { name: isEn ? "Binh Duong" : "Bình Dương", houses: 120, rooms: 1500, occupancy: 86, share: "7%" },
    { name: isEn ? "Can Tho" : "Cần Thơ", houses: 70, rooms: 800, occupancy: 82, share: "4%" },
  ];

  // Monthly Bar Chart Heights (representing volume)
  const chartData = [
    { label: isEn ? "Apr" : "T4", users: 50, revenue: 40 },
    { label: isEn ? "May" : "T5", users: 65, revenue: 55 },
    { label: isEn ? "Jun" : "T6", users: 70, revenue: 60 },
    { label: isEn ? "Jul" : "T7", users: 85, revenue: 75 },
    { label: isEn ? "Aug" : "T8", users: 95, revenue: 90 },
    { label: isEn ? "Sep" : "T9", users: 100, revenue: 95 },
  ];

  const handleExportReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({
        period: timeBucket,
        timestamp: new Date().toISOString(),
        metrics,
        regions,
      }, null, 2)
    );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dormio-admin-analytics-${timeBucket}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wide uppercase">
              <TrendingUp className="w-3.5 h-3.5" />
              {isEn ? "System Intelligence & Analytics" : "Báo Cáo Phân Tích Toàn Diện Nền Tảng"}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              • {isEn ? "Live System Analytics" : "Dữ liệu thời gian thực"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {isEn ? "National Boarding House Operations Analytics" : "Thống Kê Vận Hành & Tăng Trưởng Nhà Trọ Toàn Quốc"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isEn
              ? "Comprehensive analytics tracking tenant demand, occupancy trends, escrow transaction security, and landlord compliance."
              : "Dữ liệu thời gian thực theo dõi tốc độ gia nhập của chủ trọ, tỷ lệ lấp đầy phòng, dòng tiền cọc giữ chỗ và thời gian xử lý khiếu nại."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Time Bucket Filter */}
          <div className="flex items-center p-1 bg-zinc-200/80 rounded-2xl">
            {(
              [
                { id: "week" as const, label: isEn ? "Week" : "Tuần" },
                { id: "month" as const, label: isEn ? "Month" : "Tháng" },
                { id: "year" as const, label: isEn ? "Year" : "Năm" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeBucket(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  timeBucket === t.id
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export Report Button */}
          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>{isEn ? "Export JSON" : "Xuất Báo Cáo"}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase">
            <span>{isEn ? "User Registration" : "Người dùng mới"}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900">{metrics.newUsers}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {metrics.newUsersChange}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">
            {isEn ? "Landlords & prospective tenants" : "Chủ trọ và khách thuê đăng ký mới"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase">
            <span>{isEn ? "New Properties" : "Nhà trọ gia nhập"}</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900">{metrics.newProperties}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {metrics.newPropertiesChange}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">
            {isEn ? "Registered boarding houses" : "Nhà trọ và khu trọ đưa vào quản lý"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase">
            <span>{isEn ? "Escrow Volume" : "Giao dịch cọc giữ chỗ"}</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-zinc-900 whitespace-nowrap">{metrics.escrowVolume}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {metrics.escrowChange}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">
            {isEn ? "Protected escrow booking deposits" : "Tổng tiền cọc đảm bảo qua nền tảng"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase">
            <span>{isEn ? "Occupancy Rate" : "Tỷ lệ lấp đầy toàn quốc"}</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900">{metrics.occupancyRate}</span>
            <span className="text-xs font-bold text-zinc-500">
              {metrics.avgResolutionHours} {isEn ? "resolution" : "xử lý"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">
            {isEn ? "Average dispute mediation speed" : "Tốc độ trung bình giải quyết khiếu nại"}
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-900">
                {isEn ? "Growth Trajectory (Recent 6 Months)" : "Biểu Đồ Tăng Trưởng Hoạt Động (6 Tháng Gần Nhất)"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isEn ? "User signups vs Escrow platform turnover" : "Số lượng người dùng mới và khối lượng giao dịch cọc bảo lãnh"}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-zinc-700">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                {isEn ? "Users" : "Người dùng"}
              </span>
              <span className="flex items-center gap-1.5 text-zinc-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {isEn ? "Revenue" : "Doanh thu"}
              </span>
            </div>
          </div>

          {/* Interactive Responsive SVG Bar Graph */}
          <div className="h-64 flex items-end justify-between gap-4 pt-6 pb-2 border-b border-zinc-100">
            {chartData.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[48px] flex items-end justify-center gap-1.5 h-full">
                  <div
                    className="w-1/2 bg-orange-500 hover:bg-orange-600 rounded-t-lg transition-all duration-300 relative group/bar"
                    style={{ height: `${bar.users}%` }}
                  >
                    <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none transition-opacity">
                      {bar.users * 120} {isEn ? "users" : "người"}
                    </div>
                  </div>
                  <div
                    className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg transition-all duration-300 relative group/bar"
                    style={{ height: `${bar.revenue}%` }}
                  >
                    <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none transition-opacity">
                      {bar.revenue * 8}M ₫
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-500">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Breakdown Card (1 col) */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-zinc-900">
              {isEn ? "Regional Distribution" : "Phân Bố Khu Vực & Tỷ Lệ Lấp Đầy"}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isEn ? "Key student and industrial hubs" : "Các trọng điểm sinh viên & khu công nghiệp"}
            </p>
          </div>

          <div className="space-y-3.5">
            {regions.map((reg, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    {reg.name}
                  </span>
                  <span className="text-zinc-900">{reg.occupancy}% {isEn ? "full" : "kín phòng"}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-orange-500 to-indigo-500 rounded-full"
                    style={{ width: `${reg.occupancy}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>{reg.houses} {isEn ? "properties" : "nhà trọ"} • {reg.rooms.toLocaleString()} {isEn ? "rooms" : "phòng"}</span>
                  <span className="font-semibold text-zinc-600">{reg.share}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isEn
                ? "100% of properties are geo-verified by coordinates."
                : "100% cơ sở được xác thực tọa độ vị trí thực tế."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
