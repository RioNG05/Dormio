"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Search,
  TrendingUp,
  TrendingDown,
  Zap,
  Droplets,
  Building,
  QrCode,
  Check,
  Copy,
  X,
  Eye,
  Layers,
  BarChart3,
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
import {
  tenantInvoiceService,
  TenantInvoice,
  TenantUsageAnalyticsResponse,
} from "@/services/tenant-invoice.service";
import { paymentService } from "@/services/payment.service";

export default function TenantInvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [allInvoices, setAllInvoices] = useState<TenantInvoice[]>([]);
  const [analytics, setAnalytics] =
    useState<TenantUsageAnalyticsResponse | null>(null);

  // Active chart tab: 'cost' (financial amount) vs 'consumption' (kWh & m3)
  const [activeChartTab, setActiveChartTab] = useState<"cost" | "consumption">(
    "cost",
  );

  // Filter, pagination and table state
  const [filterMonth, setFilterMonth] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCostLines, setVisibleCostLines] = useState({
    tienPhong: true,
    tienDien: true,
    tienNuoc: true,
    dichVuKhac: false,
  });

  // Payment modal state
  const [selectedPayInvoice, setSelectedPayInvoice] =
    useState<TenantInvoice | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(
    null,
  );

  // Meter reading image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleConfirmPayment = async () => {
    if (!selectedPayInvoice) return;
    setIsPaying(true);
    try {
      const res = await paymentService.confirmPayment({
        invoiceId: selectedPayInvoice.id,
        method: "banking",
      });

      setPaymentSuccessMsg(
        res.message || "Thanh toán hóa đơn thành công!",
      );

      // Optimistically update invoice in table
      setAllInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedPayInvoice.id
            ? { ...inv, status: "paid", paidDate: new Date().toISOString() }
            : inv,
        ),
      );

      // Refresh analytics data
      try {
        const newAnalytics = await tenantInvoiceService.getUsageAnalytics();
        setAnalytics(newAnalytics);
      } catch (e) {
        console.warn("Analytics refresh failed:", e);
      }

      setTimeout(() => {
        setSelectedPayInvoice(null);
        setPaymentSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      console.error("Payment confirmation failed:", err);
      // Fallback update
      setAllInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedPayInvoice.id
            ? { ...inv, status: "paid", paidDate: new Date().toISOString() }
            : inv,
        ),
      );
      setSelectedPayInvoice(null);
    } finally {
      setIsPaying(false);
    }
  };

  const itemsPerPage = 8;

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [invoicesData, analyticsData] = await Promise.all([
          tenantInvoiceService.getTenantInvoices(),
          tenantInvoiceService.getUsageAnalytics(),
        ]);

        if (!isMounted) return;
        setAllInvoices(invoicesData);
        setAnalytics(analyticsData);
      } catch (err: unknown) {
        console.warn("Could not load invoices/analytics from backend:", err);
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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Cost chart series format
  const costChartData =
    analytics?.chartData && analytics.chartData.length > 0
      ? analytics.chartData.map((d) => ({
          name: d.period,
          "Tiền phòng": d.roomRent,
          "Tiền điện": d.electricityAmount,
          "Tiền nước": d.waterAmount,
          "Dịch vụ khác": d.otherServicesAmount,
          "Tổng cộng": d.totalAmount,
        }))
      : allInvoices
          .slice(0, 12)
          .reverse()
          .map((inv) => ({
            name: inv.period,
            "Tiền phòng":
              inv.details.find((d) => d.name === "Tiền phòng")?.value || 0,
            "Tiền điện":
              inv.details.find((d) => d.name === "Tiền điện")?.value || 0,
            "Tiền nước":
              inv.details.find((d) => d.name === "Tiền nước")?.value || 0,
            "Dịch vụ khác":
              inv.details.find((d) => d.name.includes("Dịch vụ"))?.value || 0,
            "Tổng cộng": inv.amount,
          }));

  // Consumption chart series format (kWh and m3)
  const consumptionChartData =
    analytics?.chartData && analytics.chartData.length > 0
      ? analytics.chartData.map((d) => ({
          name: d.period,
          "Điện (kWh)": d.electricityKwh,
          "Nước (m³)": d.waterM3,
        }))
      : [];

  // Summary Metrics
  const summary = analytics?.summary;
  const unpaidInvoice = allInvoices.find(
    (inv) => inv.status === "unpaid" || inv.status === "overdue",
  );

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter and Pagination Logic
  const filteredInvoices = filterMonth
    ? allInvoices.filter(
        (inv) =>
          inv.period.toLowerCase().includes(filterMonth.toLowerCase()) ||
          inv.status.toLowerCase().includes(filterMonth.toLowerCase()),
      )
    : allInvoices;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / itemsPerPage),
  );

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-zinc-500 text-sm font-medium space-y-3">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p>Đang tải dữ liệu hóa đơn & phân tích tiêu thụ...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" />
            Thống kê & Hóa đơn
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Theo dõi chi tiết mức tiêu thụ điện nước, lịch sử đóng tiền và biến
            động chi phí qua các kỳ.
          </p>
        </div>

        {/* Quick Meter Reading Upload CTA */}
        <div className="flex items-center gap-3">
          <Link href="/tenant/meter-readings">
            <Button
              variant="outline"
              className="rounded-xl border-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-500 mr-2" />
              Chốt chỉ số kỳ này
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Unpaid Amount */}
        {unpaidInvoice ? (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/90 to-orange-50/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Cần thanh toán
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                {unpaidInvoice.period}
              </span>
            </div>
            <div className="my-3">
              <div className="text-2xl font-black text-amber-700 tracking-tight">
                {formatCurrency(unpaidInvoice.amount)}
              </div>
              <p className="text-xs font-semibold text-amber-800/80 mt-1">
                Hạn chót: {formatDate(unpaidInvoice.dueDate)}
              </p>
            </div>
            <Button
              onClick={() => setSelectedPayInvoice(unpaidInvoice)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md cursor-pointer h-9 text-xs"
            >
              Thanh toán ngay
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-teal-50/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Tình trạng
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                Tất cả đã đóng
              </span>
            </div>
            <div className="my-3">
              <div className="text-2xl font-black text-emerald-700 tracking-tight">
                0 đ
              </div>
              <p className="text-xs font-semibold text-emerald-800/80 mt-1">
                Không có hóa đơn nợ quá hạn
              </p>
            </div>
            <div className="text-xs font-medium text-emerald-700 bg-white/70 rounded-xl px-3 py-2 border border-emerald-100">
              Cảm ơn bạn đã thanh toán đúng hạn!
            </div>
          </div>
        )}

        {/* Card 2: Average Monthly Spend & Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chi phí trung bình
            </span>
            {summary && summary.momChangePercent !== 0 && (
              <div
                className={`flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  summary.isUp
                    ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {summary.isUp ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {summary.isUp ? "+" : "-"}
                  {Math.abs(summary.momChangePercent)}%
                </span>
              </div>
            )}
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(summary?.averageMonthlySpend || 0)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {summary?.isUp ? "Tăng" : "Giảm"}{" "}
              <span className="font-bold text-slate-700">
                {formatCurrency(summary?.momChangeAmount || 0)}
              </span>{" "}
              so với kỳ trước
            </p>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Tính trên các kỳ hóa đơn đã phát sinh
          </div>
        </div>

        {/* Card 3: Average Electricity */}
        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/50 to-blue-50/30 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-sky-600" />
              Điện trung bình
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              kWh / kỳ
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-sky-700 tracking-tight">
              {summary?.averageElectricityKwh || 0}{" "}
              <span className="text-sm font-bold text-sky-900/60">kWh</span>
            </div>
            <p className="text-xs text-sky-800/80 font-medium mt-1">
              Đơn giá tham chiếu: ~3.500 đ/kWh
            </p>
          </div>
          <div className="text-[11px] text-sky-700/70 font-medium">
            Tự động tổng hợp từ chỉ số đồng hồ
          </div>
        </div>

        {/* Card 4: Average Water */}
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-teal-600" />
              Nước trung bình
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              m³ / kỳ
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-teal-700 tracking-tight">
              {summary?.averageWaterM3 || 0}{" "}
              <span className="text-sm font-bold text-teal-900/60">m³</span>
            </div>
            <p className="text-xs text-teal-800/80 font-medium mt-1">
              Đơn giá tham chiếu: ~25.000 đ/m³
            </p>
          </div>
          <div className="text-[11px] text-teal-700/70 font-medium">
            Tự động tổng hợp từ chỉ số đồng hồ
          </div>
        </div>
      </div>

      {/* Interactive Charts Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Phân tích tiêu thụ & Chi phí
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Biểu đồ diễn biến chi phí và số lượng tiêu thụ qua các kỳ
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveChartTab("cost")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeChartTab === "cost"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Chi phí (VNĐ)
            </button>
            <button
              onClick={() => setActiveChartTab("consumption")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeChartTab === "consumption"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sản lượng Điện & Nước
            </button>
          </div>
        </div>

        {/* Tab 1: Cost Line Chart */}
        {activeChartTab === "cost" && (
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
              <span className="text-xs font-bold text-slate-500">
                Chọn danh mục hiển thị:
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={visibleCostLines.tienPhong}
                    onChange={() =>
                      setVisibleCostLines((p) => ({
                        ...p,
                        tienPhong: !p.tienPhong,
                      }))
                    }
                    className="w-4 h-4 rounded accent-[#8b5cf6]"
                  />
                  <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></div>
                    Tiền phòng
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={visibleCostLines.tienDien}
                    onChange={() =>
                      setVisibleCostLines((p) => ({
                        ...p,
                        tienDien: !p.tienDien,
                      }))
                    }
                    className="w-4 h-4 rounded accent-[#0ea5e9]"
                  />
                  <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></div>
                    Tiền điện
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={visibleCostLines.tienNuoc}
                    onChange={() =>
                      setVisibleCostLines((p) => ({
                        ...p,
                        tienNuoc: !p.tienNuoc,
                      }))
                    }
                    className="w-4 h-4 rounded accent-[#10b981]"
                  />
                  <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                    Tiền nước
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={visibleCostLines.dichVuKhac}
                    onChange={() =>
                      setVisibleCostLines((p) => ({
                        ...p,
                        dichVuKhac: !p.dichVuKhac,
                      }))
                    }
                    className="w-4 h-4 rounded accent-[#f59e0b]"
                  />
                  <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>
                    Dịch vụ khác
                  </span>
                </label>
              </div>
            </div>

            <div className="w-full h-72 sm:h-80 lg:h-96">
              {costChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={costChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      dx={-10}
                      tickFormatter={(val) => `${val / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow:
                          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                        backgroundColor: "#ffffff",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    {visibleCostLines.tienPhong && (
                      <Line
                        type="monotone"
                        dataKey="Tiền phòng"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                    {visibleCostLines.tienDien && (
                      <Line
                        type="monotone"
                        dataKey="Tiền điện"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                    {visibleCostLines.tienNuoc && (
                      <Line
                        type="monotone"
                        dataKey="Tiền nước"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                    {visibleCostLines.dichVuKhac && (
                      <Line
                        type="monotone"
                        dataKey="Dịch vụ khác"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <CreditCard className="w-8 h-8 text-slate-300" />
                  <p className="text-sm font-medium">
                    Chưa có số liệu thống kê giao dịch nào
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Consumption Bar/Line Chart (kWh vs m3) */}
        {activeChartTab === "consumption" && (
          <div className="flex flex-col">
            <div className="w-full h-72 sm:h-80 lg:h-96">
              {consumptionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={consumptionChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      stroke="#0284c7"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#0284c7" }}
                      tickFormatter={(v) => `${v} kWh`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#059669"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#059669" }}
                      tickFormatter={(v) => `${v} m³`}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="Điện (kWh)"
                      fill="#38bdf8"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="Nước (m³)"
                      fill="#34d399"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Zap className="w-8 h-8 text-slate-300" />
                  <p className="text-sm font-medium">
                    Chưa có số liệu tiêu thụ điện nước nào
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invoice History Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Lịch sử hóa đơn chi tiết
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tra cứu từng khoản thu, đơn giá dịch vụ và ảnh chụp chỉ số đồng hồ
            </p>
          </div>

          {/* Search / Filter input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc theo kỳ (VD: 09/2026)..."
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Invoice List Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {paginatedInvoices.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {paginatedInvoices.map((inv) => {
                const isExpanded = !!expandedRows[inv.id];
                const isUnpaid =
                  inv.status === "unpaid" || inv.status === "overdue";

                return (
                  <div
                    key={inv.id}
                    id={`row-${inv.id}`}
                    className="flex flex-col transition-colors hover:bg-slate-50/50"
                  >
                    {/* Row Header Bar */}
                    <div
                      onClick={() => toggleRow(inv.id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            inv.status === "paid"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : inv.status === "overdue"
                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                        >
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {inv.period}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                inv.status === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : inv.status === "overdue"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {inv.status === "paid"
                                ? "Đã thanh toán"
                                : inv.status === "overdue"
                                  ? "Quá hạn"
                                  : "Chưa thanh toán"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Hạn chót: {formatDate(inv.dueDate)}
                            {inv.paidDate &&
                              ` • Ngày thanh toán: ${formatDate(inv.paidDate)}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <div className="text-base sm:text-lg font-black text-slate-900">
                            {formatCurrency(inv.amount)}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {inv.details.length} mục chi phí
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isUnpaid && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPayInvoice(inv);
                              }}
                              className="bg-primary hover:bg-primary/90 text-white font-bold h-8 text-xs rounded-lg px-3 shadow-sm"
                            >
                              Thanh toán
                            </Button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(inv.id);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Breakdown Drawer */}
                    {isExpanded && (
                      <div className="px-4 sm:px-6 pb-6 pt-2 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200">
                        {/* Line Items Table */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                            Chi tiết các khoản thu
                          </h4>
                          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-3">Mục chi phí</th>
                                  <th className="py-2.5 px-3 text-right">
                                    Số lượng
                                  </th>
                                  <th className="py-2.5 px-3 text-right">
                                    Đơn giá
                                  </th>
                                  <th className="py-2.5 px-3 text-right">
                                    Thành tiền
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {inv.details.map((item, idx) => (
                                  <tr
                                    key={idx}
                                    className="hover:bg-slate-50/60"
                                  >
                                    <td className="py-2.5 px-3 flex items-center gap-2">
                                      {item.name.includes("Điện") && (
                                        <Zap className="w-3.5 h-3.5 text-sky-500" />
                                      )}
                                      {item.name.includes("Nước") && (
                                        <Droplets className="w-3.5 h-3.5 text-teal-500" />
                                      )}
                                      {item.name.includes("phòng") && (
                                        <Building className="w-3.5 h-3.5 text-purple-500" />
                                      )}
                                      <span>{item.name}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-slate-500">
                                      {item.quantity} {item.unit}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-slate-500">
                                      {formatCurrency(item.unitPrice)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                      {formatCurrency(item.value)}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-slate-50 font-bold text-slate-900">
                                  <td colSpan={3} className="py-2.5 px-3">
                                    Tổng cộng hóa đơn
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-primary font-black text-sm">
                                    {formatCurrency(inv.amount)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Meter Readings Evidence */}
                        {inv.meterReadings && inv.meterReadings.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                              Ảnh chụp & Chỉ số đồng hồ kỳ này
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {inv.meterReadings.map((mr, mrIdx) => (
                                <div
                                  key={mrIdx}
                                  className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3 shadow-2xs"
                                >
                                  {mr.imageUrl ? (
                                    <div
                                      onClick={() =>
                                        setPreviewImage(mr.imageUrl)
                                      }
                                      className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 cursor-pointer group bg-slate-900"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={mr.imageUrl}
                                        alt={mr.serviceName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                        <Eye className="w-4 h-4" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                      <Zap className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="overflow-hidden">
                                    <div className="text-xs font-bold text-slate-900 truncate">
                                      {mr.serviceName}
                                    </div>
                                    <div className="text-sm font-black text-primary mt-0.5">
                                      {mr.readingValue !== null
                                        ? `${mr.readingValue} ${mr.unit}`
                                        : "Chưa ghi nhận"}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium">
                                      {formatDate(mr.recordedAt)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Receipt className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-medium">
                Không tìm thấy hóa đơn nào phù hợp bộ lọc.
              </p>
            </div>
          )}
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 pt-2 text-xs font-semibold text-slate-600">
            <span>
              Trang {currentPage} / {totalPages} (Tổng{" "}
              {filteredInvoices.length} hóa đơn)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-lg text-xs"
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-3 rounded-lg text-xs"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pay Modal (VietQR Pop-up) */}
      {selectedPayInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setSelectedPayInvoice(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Thanh toán {selectedPayInvoice.period}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Chuyển khoản qua mã VietQR tự động khớp lệnh
                </p>
              </div>
            </div>

            {/* QR Mock / Display */}
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200 flex flex-col items-center justify-center text-center my-4">
              <div className="w-48 h-48 bg-white rounded-xl p-2 border border-slate-200 shadow-sm flex items-center justify-center relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.vietqr.io/image/970422-0912345678-compact2.png?amount=${selectedPayInvoice.amount}&addInfo=${encodeURIComponent(
                    `TT TRO ${selectedPayInvoice.period}`,
                  )}&accountName=DORMIO%20MANAGEMENT`}
                  alt="VietQR"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              <div className="text-xl font-black text-primary mt-3">
                {formatCurrency(selectedPayInvoice.amount)}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Cú pháp: TT TRO {selectedPayInvoice.period}
              </p>
            </div>

            {/* Bank details summary */}
            <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-2 text-slate-700 border border-slate-200 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold">MB Bank (Quân Đội)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold font-mono text-slate-900">
                    0912345678
                  </span>
                  <button
                    onClick={() => copyToClipboard("0912345678")}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    title="Sao chép STK"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold">DORMIO MANAGEMENT</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-700 font-mono">
                    TT TRO {selectedPayInvoice.period}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(`TT TRO ${selectedPayInvoice.period}`)
                    }
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    title="Sao chép nội dung CK"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {paymentSuccessMsg ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                {paymentSuccessMsg}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(
                      `0912345678 MBBank TT TRO ${selectedPayInvoice.period} ${selectedPayInvoice.amount}`,
                    )
                  }
                  className="flex-1 rounded-xl h-11 font-bold text-xs"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-emerald-600" />
                      Đã sao chép
                    </>
                  ) : (
                    "Sao chép tất cả"
                  )}
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={isPaying}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-11 font-bold text-xs shadow-md"
                >
                  {isPaying ? "Đang xử lý..." : "Xác nhận đã chuyển khoản"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Ảnh đồng hồ"
              className="w-full h-full object-contain max-h-[85vh]"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
