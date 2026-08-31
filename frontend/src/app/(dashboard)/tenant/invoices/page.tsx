"use client";

import React, { useState, useEffect } from "react";
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
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/services/api";

interface InvoiceItemDetail {
  name: string;
  value: number;
}

interface InvoiceRecord {
  id: string;
  period: string;
  amount: number;
  status: "paid" | "unpaid" | "overdue";
  dueDate: string;
  createdDate: string;
  paidDate: string | null;
  details: InvoiceItemDetail[];
}

export default function TenantInvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [allInvoices, setAllInvoices] = useState<InvoiceRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchInvoices() {
      try {
        const response = await api.get<{ success: boolean; data: InvoiceRecord[] }>("/v1/tenant/invoices");
        if (isMounted && response?.data) {
          setAllInvoices(response.data);
        }
      } catch (err) {
        console.warn("Could not load invoices from backend:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchInvoices();

    return () => {
      isMounted = false;
    };
  }, []);

  // Chart Data format (last 12 months for better visual)
  const chartData = allInvoices.slice(0, 12).reverse().map((inv) => ({
    name: inv.period,
    "Tiền phòng": inv.details.find((d) => d.name === "Tiền phòng")?.value || 0,
    "Tiền điện": inv.details.find((d) => d.name === "Tiền điện")?.value || 0,
    "Tiền nước": inv.details.find((d) => d.name === "Tiền nước")?.value || 0,
    "Dịch vụ khác": inv.details.find((d) => d.name.includes("Dịch vụ"))?.value || 0,
  }));

  // Trend logic
  const currentInvoice = allInvoices.find((inv) => inv.status === "unpaid") || allInvoices[0];
  const prevInvoice = allInvoices[1];
  const diff = currentInvoice && prevInvoice ? currentInvoice.amount - prevInvoice.amount : 0;
  const percentDiff =
    prevInvoice && prevInvoice.amount > 0 ? (Math.abs(diff) / prevInvoice.amount * 100).toFixed(1) : "0";
  const isUp = diff > 0;

  // States
  const [filterMonth, setFilterMonth] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleLines, setVisibleLines] = useState({
    tienPhong: false,
    tienDien: true,
    tienNuoc: true,
    dichVuKhac: false,
  });
  const itemsPerPage = 12;

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const isExpanding = !prev[id];

      setTimeout(() => {
        const element = document.getElementById(`row-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, isExpanding ? 150 : 50);

      return { ...prev, [id]: isExpanding };
    });
  };

  // Filter and Pagination Logic
  const filteredInvoices = filterMonth
    ? allInvoices.filter((inv) => inv.period.includes(filterMonth))
    : allInvoices;

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));

  // Ensure current page is valid when filtering changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filterMonth, totalPages, currentPage]);

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-zinc-500 text-sm font-medium">
        Đang tải thông tin hoá đơn...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thông tin hoá đơn</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Theo dõi số tiền cần đóng và biến động chi phí qua các tháng.
          </p>
        </div>

        {/* Card: Số tiền cần thanh toán */}
        {currentInvoice && currentInvoice.status === "unpaid" ? (
          <div className="w-full md:w-auto shrink-0 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm flex items-center gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Cần thanh toán</h2>
              </div>
              <div className="flex items-end gap-3 mt-1">
                <div className="text-xl font-extrabold text-amber-600 leading-none">
                  {formatCurrency(currentInvoice.amount)}
                </div>
                {prevInvoice && (
                  isUp ? (
                    <div className="flex items-center gap-0.5 text-xs font-bold text-rose-500 mb-0.5" title="Tăng so với tháng trước">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{percentDiff}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 text-xs font-bold text-emerald-500 mb-0.5" title="Giảm so với tháng trước">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>-{percentDiff}%</span>
                    </div>
                  )
                )}
              </div>
              <p className="text-[11px] font-semibold text-amber-700/80 mt-1.5">
                Hạn chót: {currentInvoice.dueDate}
              </p>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-md border-0 h-10 rounded-xl px-6 font-bold cursor-pointer">
              Thanh toán
            </Button>
          </div>
        ) : (
          <div className="w-full md:w-auto shrink-0 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Tình trạng thanh toán</div>
              <div className="text-sm font-bold text-emerald-700 mt-0.5">Không có hoá đơn cần thanh toán</div>
            </div>
          </div>
        )}
      </div>

      {/* Chart: Thống kê chi phí */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Thống kê chi phí (12 tháng gần nhất)
          </h2>

          {chartData.length > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-zinc-600 hover:text-zinc-900 select-none">
                <input
                  type="checkbox"
                  checked={visibleLines.tienPhong}
                  onChange={() => setVisibleLines((prev) => ({ ...prev, tienPhong: !prev.tienPhong }))}
                  className="w-4 h-4 rounded accent-[#8b5cf6]"
                />
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></div>Tiền phòng
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-zinc-600 hover:text-zinc-900 select-none">
                <input
                  type="checkbox"
                  checked={visibleLines.tienDien}
                  onChange={() => setVisibleLines((prev) => ({ ...prev, tienDien: !prev.tienDien }))}
                  className="w-4 h-4 rounded accent-[#0ea5e9]"
                />
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></div>Tiền điện
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-zinc-600 hover:text-zinc-900 select-none">
                <input
                  type="checkbox"
                  checked={visibleLines.tienNuoc}
                  onChange={() => setVisibleLines((prev) => ({ ...prev, tienNuoc: !prev.tienNuoc }))}
                  className="w-4 h-4 rounded accent-[#10b981]"
                />
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>Tiền nước
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-zinc-600 hover:text-zinc-900 select-none">
                <input
                  type="checkbox"
                  checked={visibleLines.dichVuKhac}
                  onChange={() => setVisibleLines((prev) => ({ ...prev, dichVuKhac: !prev.dichVuKhac }))}
                  className="w-4 h-4 rounded accent-[#f59e0b]"
                />
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>Dịch vụ khác
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="w-full h-72 sm:h-80 lg:h-96">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#71717a" }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  dx={-10}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: "#f4f4f5" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                {visibleLines.tienPhong && (
                  <Line type="monotone" dataKey="Tiền phòng" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                )}
                {visibleLines.tienDien && (
                  <Line type="monotone" dataKey="Tiền điện" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                )}
                {visibleLines.tienNuoc && (
                  <Line type="monotone" dataKey="Tiền nước" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                )}
                {visibleLines.dichVuKhac && (
                  <Line type="monotone" dataKey="Dịch vụ khác" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-3 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <CreditCard className="w-8 h-8 text-zinc-300" />
              <p className="text-sm font-medium">Chưa có số liệu thống kê giao dịch nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Lịch sử thanh toán Dashboard */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm flex flex-col">
        <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-50/50 gap-4 rounded-t-2xl">
          <h2 className="text-base font-bold text-zinc-900">Lịch sử hoá đơn</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm kiếm kỳ thanh toán..."
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="pl-9 pr-4 h-9 rounded-lg border border-zinc-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-bold uppercase tracking-wider text-xs">
                <th className="px-6 py-4">Mã hoá đơn</th>
                <th className="px-6 py-4">Kỳ thanh toán</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedInvoices.map((inv) => (
                <React.Fragment key={inv.id}>
                  <tr id={`row-${inv.id}`} className={`hover:bg-zinc-50 transition-colors ${expandedRows[inv.id] ? "bg-zinc-50/50" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900">{inv.id}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">Hạn: {inv.dueDate}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-700">
                      Tháng {inv.period}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 text-base">
                        {formatCurrency(inv.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {inv.status === "paid" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã thanh toán
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> Chờ thanh toán
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(inv.id)}
                        className="text-primary hover:text-primary-hover font-bold hover:bg-primary/10 rounded-lg h-8 gap-1 cursor-pointer"
                      >
                        {expandedRows[inv.id] ? "Thu gọn" : "Xem chi tiết"}
                        {expandedRows[inv.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </td>
                  </tr>

                  {/* Expanded Breakdown Rows */}
                  {expandedRows[inv.id] && (
                    <tr className="bg-zinc-50/70 border-b border-zinc-100 animate-in fade-in duration-200">
                      <td colSpan={5} className="p-6">
                        <div className="max-w-2xl bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                              Chi tiết các khoản phí
                            </div>
                            <div className="text-xs font-semibold text-zinc-500">
                              Ngày lập: {inv.createdDate}
                            </div>
                          </div>

                          <div className="space-y-2.5 text-sm">
                            {inv.details.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-zinc-700">
                                <span>{item.name}</span>
                                <span className="font-semibold text-zinc-900">{formatCurrency(item.value)}</span>
                              </div>
                            ))}
                            <div className="border-t border-zinc-100 pt-3 flex justify-between items-center font-bold text-base text-zinc-900">
                              <span>Tổng thanh toán</span>
                              <span className="text-primary">{formatCurrency(inv.amount)}</span>
                            </div>
                          </div>
                          {inv.status === "unpaid" && (
                            <div className="mt-6 flex justify-center">
                              <Button className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white shadow-sm h-10 rounded-lg px-8 font-bold cursor-pointer">
                                Thanh toán hoá đơn này
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {paginatedInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium">
                    {filterMonth
                      ? `Không tìm thấy hoá đơn nào khớp với "${filterMonth}"`
                      : "Chưa có số liệu thống kê giao dịch nào"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50 rounded-b-2xl">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-9 px-4 text-zinc-600 font-semibold bg-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trang trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    currentPage === idx + 1
                      ? "bg-primary text-white shadow-sm"
                      : "text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-9 px-4 text-zinc-600 font-semibold bg-white cursor-pointer"
            >
              Trang sau <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
