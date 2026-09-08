"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
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
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart2,
  Building,
  Home,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  FileSpreadsheet,
  ArrowUpRight,
  MapPin,
  Calendar,
  Percent,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getPropertyAnalytics,
  type BoardingHouseOverview,
} from "@/services/boarding-house.service";
import { formatVND } from "@/utils";

export default function ReportsPage() {
  const { activeBuilding, isBuildingsLoading } = useAuth();

  const [overview, setOverview] = useState<BoardingHouseOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rangeMode, setRangeMode] = useState<"6m" | "12m">("6m");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAnalytics = useCallback(async (buildingId: string) => {
    if (!buildingId) return;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(buildingId)) return;

    try {
      setIsLoading(true);
      const data = await getPropertyAnalytics(buildingId);
      setOverview(data);
    } catch (err) {
      console.error("Failed to fetch property analytics:", err);
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeBuilding?.id) {
      fetchAnalytics(activeBuilding.id);
    } else {
      setIsLoading(false);
    }
  }, [activeBuilding?.id, fetchAnalytics]);

  // Derived revenue chart data based on real backend numbers
  const revenueChartData = useMemo(() => {
    if (!overview?.revenueChart || overview.revenueChart.length === 0) return [];
    return overview.revenueChart.map((d) => ({
      name: `T${d.month}`,
      revenue: d.val,
      fullAmount: d.fullAmount,
    }));
  }, [overview?.revenueChart]);

  // Derived occupancy chart data based on real backend numbers
  const occupancyChartData = useMemo(() => {
    if (!overview?.occupancyChart || overview.occupancyChart.length === 0) return [];
    return overview.occupancyChart.map((d) => ({
      name: `T${d.month}`,
      occupied: d.occupied,
      count: d.count,
      total: d.total,
    }));
  }, [overview?.occupancyChart]);

  // Fallback defaults when data is null
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

  const expiringContracts = overview?.expiringContracts ?? [];

  if (isBuildingsLoading || (isLoading && !overview)) {
    return (
      <div className="py-24 text-center text-zinc-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2AC1BC]" />
        <p className="text-xs font-semibold">Đang tổng hợp dữ liệu báo cáo & thống kê...</p>
      </div>
    );
  }

  const hasAnyData =
    rooms.totalRooms > 0 ||
    Number(financial.currentMonthRevenue) > 0 ||
    Number(financial.unpaidDebt) > 0 ||
    revenueChartData.length > 0;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#2AC1BC]" /> Báo Cáo & Phân Tích Hiệu Suất (UC-L-08)
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
            Thống kê doanh thu thực tế, tỷ lệ lấp đầy, tiến độ thu tiền phòng và hợp đồng đến hạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-50 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" /> In / Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* Building Header Pill */}
      {activeBuilding && (
        <div className="bg-zinc-900 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2AC1BC]/20 text-[#2AC1BC] flex items-center justify-center font-black shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                {activeBuilding.name}
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-full">
                  Đang hoạt động
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#2AC1BC]" />
                {activeBuilding.address || "Chưa cập nhật địa chỉ"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Link
              href="/landlord/invoices"
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
            >
              <span>Quản lý hóa đơn</span> &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Clean Empty State when property has 0 records */}
      {!hasAnyData ? (
        <div className="py-20 px-6 text-center bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto">
            <BarChart2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-black text-base text-zinc-900">Chưa có dữ liệu thống kê nào</h3>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Tòa nhà chưa phát sinh giao dịch thu tiền, hợp đồng thuê hoặc hóa đơn nào. Dữ liệu phân tích sẽ tự động cập nhật khi bạn tạo phòng và bắt đầu vận hành.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/landlord/rooms"
              className="px-4 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-sm transition-all"
            >
              Quản lý danh sách phòng
            </Link>
            <Link
              href="/landlord/invoices"
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all"
            >
              Lập hóa đơn mới
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Top 4 KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. DOANH THU THÁNG NÀY */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs space-y-2 border-l-4 border-l-[#2AC1BC]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  DOANH THU THÁNG NÀY
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                {formatVND(Number(financial.currentMonthRevenue) || 0)}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {financial.paidInvoicesCount > 0
                    ? `Đã thu ${financial.paidInvoicesCount} hóa đơn`
                    : "Chưa ghi nhận thanh toán"}
                </span>
              </div>
            </div>

            {/* 2. TỶ LỆ LẤP ĐẦY */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs space-y-2 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  TỶ LỆ LẤP ĐẦY
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight">
                {rooms.occupancyRate}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500">
                <span>
                  {rooms.occupiedRooms}/{rooms.totalRooms} phòng đang ở ({rooms.vacantRooms} trống)
                </span>
              </div>
            </div>

            {/* 3. CÔNG NỢ CHƯA THU */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs space-y-2 border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  CÔNG NỢ TỒN
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-500 tracking-tight">
                {formatVND(Number(financial.unpaidDebt) || 0)}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>
                  {financial.unpaidInvoicesCount > 0
                    ? `${financial.unpaidInvoicesCount} hóa đơn chưa thu / quá hạn`
                    : "Không có công nợ quá hạn"}
                </span>
              </div>
            </div>

            {/* 4. TỶ LỆ THU TIỀN */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs space-y-2 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  TIẾN ĐỘ THU HỒI
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
                {collection.collectionRate}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500">
                <span>
                  Đã thu {collection.paidCount} /{" "}
                  {collection.paidCount + collection.unpaidCount + collection.overdueCount} hóa đơn kỳ này
                </span>
              </div>
            </div>
          </div>

          {/* Analytical Charts Row (Recharts) */}
          {mounted && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Chart 1: Biểu Đồ Doanh Thu Thực Tế (BarChart) */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#2AC1BC]" /> Doanh Thu Thực Nhận (6 Tháng)
                    </h2>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Dữ liệu thực tế từ giao dịch thanh toán thành công (triệu VNĐ).
                    </p>
                  </div>
                  <span className="text-xs font-black text-[#2AC1BC]">
                    Tổng tháng này: {formatVND(Number(financial.currentMonthRevenue) || 0)}
                  </span>
                </div>

                {revenueChartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-2">
                    <BarChart2 className="w-8 h-8 text-zinc-300" />
                    <p className="text-xs font-bold text-zinc-500">Chưa có dữ liệu doanh thu</p>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#71717a", fontSize: 10 }}
                          tickFormatter={(val) => `${val}M`}
                        />
                        <Tooltip
                          cursor={{ fill: "#f4f4f5" }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e4e4e7",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                          formatter={(value: any, name: any, item: any) => [
                            `${item?.payload?.fullAmount || value} ₫`,
                            "Doanh thu thực nhận",
                          ]}
                        />
                        <Bar dataKey="revenue" fill="#2AC1BC" radius={[6, 6, 0, 0]} maxBarSize={45}>
                          {revenueChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === revenueChartData.length - 1 ? "#2AC1BC" : "#8dd8d5"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Chart 2: Biểu Đồ Tỷ Lệ Lấp Đầy (LineChart) */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" /> Xu Hướng Tỷ Lệ Lấp Đầy (%)
                    </h2>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Biến động tỷ lệ thuê phòng theo từng tháng hoạt động.
                    </p>
                  </div>
                  <span className="text-xs font-black text-blue-600">
                    Hiện tại: {rooms.occupancyRate}
                  </span>
                </div>

                {occupancyChartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-2">
                    <Users className="w-8 h-8 text-zinc-300" />
                    <p className="text-xs font-bold text-zinc-500">Chưa có dữ liệu phòng thuê</p>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={occupancyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }}
                          dy={8}
                        />
                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#71717a", fontSize: 10 }}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e4e4e7",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                          formatter={(value: any, name: any, item: any) => [
                            `${value}% (${item?.payload?.count || 0}/${item?.payload?.total || 0} phòng)`,
                            "Tỷ lệ lấp đầy",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="occupied"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: "#ffffff", stroke: "#3b82f6" }}
                          activeDot={{ r: 6, fill: "#3b82f6" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collection Status & Room Breakdown Widgets (UC-L-08) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Collection Status Breakdown */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-xs font-black uppercase text-zinc-900 tracking-wider">
                  Trạng Thái Thu Tiền Kỳ Này
                </h3>
                <span className="text-xs font-black text-emerald-600">
                  {collection.collectionRate}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${
                      Number(collection.collectionRate.replace("%", "")) || 0
                    }%`,
                  }}
                  className="bg-emerald-500 h-full transition-all"
                  title="Đã thu"
                />
                <div
                  style={{
                    width: `${
                      collection.unpaidCount > 0
                        ? (collection.unpaidCount /
                            (collection.paidCount + collection.unpaidCount + collection.overdueCount || 1)) *
                          100
                        : 0
                    }%`,
                  }}
                  className="bg-amber-400 h-full transition-all"
                  title="Chưa thu"
                />
                <div
                  style={{
                    width: `${
                      collection.overdueCount > 0
                        ? (collection.overdueCount /
                            (collection.paidCount + collection.unpaidCount + collection.overdueCount || 1)) *
                          100
                        : 0
                    }%`,
                  }}
                  className="bg-rose-500 h-full transition-all"
                  title="Quá hạn"
                />
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-zinc-700">Đã thu</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-700">{collection.paidAmount} ₫</span>
                    <span className="text-[10px] text-zinc-400 block">({collection.paidCount} HĐ)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="font-bold text-zinc-700">Chưa thu</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-700">{collection.unpaidAmount} ₫</span>
                    <span className="text-[10px] text-zinc-400 block">({collection.unpaidCount} HĐ)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-rose-50/60 rounded-xl border border-rose-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-bold text-zinc-700">Quá hạn</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-600">{collection.overdueAmount} ₫</span>
                    <span className="text-[10px] text-zinc-400 block">({collection.overdueCount} HĐ)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Distribution Breakdown */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-xs font-black uppercase text-zinc-900 tracking-wider">
                  Phân Bổ Tình Trạng Phòng
                </h3>
                <span className="text-xs font-bold text-zinc-500">
                  Tổng {rooms.totalRooms} phòng
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">ĐANG THUÊ</span>
                  <span className="text-lg font-black text-emerald-600 block mt-0.5">
                    {rooms.occupiedRooms}
                  </span>
                  <span className="text-[10px] text-zinc-400">Khách đang ở</span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">PHÒNG TRỐNG</span>
                  <span className="text-lg font-black text-blue-600 block mt-0.5">
                    {rooms.vacantRooms}
                  </span>
                  <span className="text-[10px] text-zinc-400">Sẵn sàng nhận khách</span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">ĐẶT CỌC</span>
                  <span className="text-lg font-black text-purple-600 block mt-0.5">
                    {rooms.depositRooms}
                  </span>
                  <span className="text-[10px] text-zinc-400">Đang giữ chỗ</span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">BẢO TRÌ</span>
                  <span className="text-lg font-black text-amber-600 block mt-0.5">
                    {rooms.maintenanceRooms}
                  </span>
                  <span className="text-[10px] text-zinc-400">Đang sửa chữa</span>
                </div>
              </div>
            </div>

            {/* Expiring Contracts within 30 Days (UC-L-08) */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-xs font-black uppercase text-zinc-900 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Hợp Đồng Sắp Hết Hạn (&lt; 30 Ngày)
                </h3>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black">
                  {expiringContracts.length}
                </span>
              </div>

              {expiringContracts.length === 0 ? (
                <div className="py-8 text-center space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-zinc-700">Tất cả hợp đồng ổn định</p>
                  <p className="text-[11px] text-zinc-400">
                    Không có hợp đồng nào hết hạn trong vòng 30 ngày tới.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {expiringContracts.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-black text-zinc-900">
                          {c.room} — {c.tenant}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Hạn kết thúc: <span className="font-bold text-amber-800">{c.endDate}</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-amber-200/70 text-amber-900 font-black rounded-lg text-[10px] shrink-0">
                        Còn {c.daysLeft} ngày
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/landlord/contracts"
                className="block pt-2 border-t border-zinc-100 text-[11px] font-bold text-[#2AC1BC] hover:underline"
              >
                Xem toàn bộ hợp đồng &rarr;
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
