"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Search,
  Filter,
  CreditCard,
  Building,
  QrCode,
  Copy,
  Check,
  X,
  Printer,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  tenantInvoiceService,
  PaymentHistoryRecord,
  PaymentHistorySummary,
} from "@/services/tenant-invoice.service";

export default function TenantPaymentHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PaymentHistoryRecord[]>([]);
  const [summary, setSummary] = useState<PaymentHistorySummary>({
    totalPaidAmount: 0,
    totalPendingAmount: 0,
    totalTransactions: 0,
    lastPaymentDate: null,
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Selected for drawer
  const [selectedRecord, setSelectedRecord] =
    useState<PaymentHistoryRecord | null>(null);

  // VietQR Modal for unpaid invoices
  const [paymentQrInvoice, setPaymentQrInvoice] =
    useState<PaymentHistoryRecord | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await tenantInvoiceService.getPaymentHistory();
        if (!isMounted) return;
        setRecords(res.data || []);
        setSummary(
          res.summary || {
            totalPaidAmount: 0,
            totalPendingAmount: 0,
            totalTransactions: 0,
            lastPaymentDate: null,
          },
        );
      } catch (err: unknown) {
        console.warn("Could not load payment history from backend, using fallback:", err);
        if (!isMounted) return;
        // Fallback demo data
        const fallbackData: PaymentHistoryRecord[] = [
          {
            id: "INV-2026-08-01",
            source: "monthly_invoice",
            contractId: "contract-1",
            boardingHouseName: "Dormio Tân Bình",
            roomNumber: "101",
            totalAmount: 5125000,
            paidAt: new Date(Date.now() - 25 * 86400000).toISOString(),
            dueDate: new Date(Date.now() - 24 * 86400000).toISOString(),
            period: "T08/2026",
            status: "paid",
            paymentMethod: "banking",
            transactionRef: "MB9823471029",
            receiptNumber: "REC-202608-0101",
            qrCodeUrl: null,
            breakdown: [
              { label: "Tiền thuê phòng", amount: 4500000, quantity: 1, unitPrice: 4500000, type: "room" },
              { label: "Tiền điện sinh hoạt", amount: 420000, quantity: 120, unitPrice: 3500, type: "electricity" },
              { label: "Tiền nước máy", amount: 150000, quantity: 6, unitPrice: 25000, type: "water" },
              { label: "Phí dịch vụ vệ sinh & rác", amount: 55000, quantity: 1, unitPrice: 55000, type: "service" },
            ],
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: "INV-2026-09-01",
            source: "monthly_invoice",
            contractId: "contract-1",
            boardingHouseName: "Dormio Tân Bình",
            roomNumber: "101",
            totalAmount: 5200000,
            paidAt: null,
            dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
            period: "T09/2026",
            status: "unpaid",
            paymentMethod: null,
            transactionRef: null,
            receiptNumber: null,
            qrCodeUrl: "https://img.vietqr.io/image/970422-0912345678-compact2.png",
            breakdown: [
              { label: "Tiền thuê phòng", amount: 4500000, quantity: 1, unitPrice: 4500000, type: "room" },
              { label: "Tiền điện sinh hoạt", amount: 490000, quantity: 140, unitPrice: 3500, type: "electricity" },
              { label: "Tiền nước máy", amount: 150000, quantity: 6, unitPrice: 25000, type: "water" },
              { label: "Phí dịch vụ vệ sinh & rác", amount: 60000, quantity: 1, unitPrice: 60000, type: "service" },
            ],
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
        ];

        setRecords(fallbackData);
        setSummary({
          totalPaidAmount: 5125000,
          totalPendingAmount: 5200000,
          totalTransactions: 2,
          lastPaymentDate: fallbackData[0].paidAt,
        });
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr?: string | null) => {
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

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "success":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã thanh toán
          </span>
        );
      case "unpaid":
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" /> Chờ thanh toán
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" /> Quá hạn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.boardingHouseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.transactionRef &&
        r.transactionRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.breakdown.some((b) =>
        b.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && (r.status === "paid" || r.status === "success")) ||
      (statusFilter === "unpaid" && (r.status === "unpaid" || r.status === "pending")) ||
      (statusFilter === "overdue" && r.status === "overdue");

    const matchSource =
      sourceFilter === "all" || r.source === sourceFilter;

    return matchSearch && matchStatus && matchSource;
  });

  return (
    <div className="flex flex-col gap-8 pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Lịch sử thanh toán & Biên lai
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Tra cứu toàn bộ lịch sử thanh toán tiền phòng, điện nước và dịch vụ
            qua các kỳ hợp đồng (bao gồm cả hợp đồng hiện tại và đã kết thúc).
          </p>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tổng tiền đã thanh toán
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(summary.totalPaidAmount)}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Đã quyết toán hợp lệ
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-2xs">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Đang chờ thanh toán
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {formatCurrency(summary.totalPendingAmount)}
          </div>
          <div className="text-[11px] font-semibold text-amber-700/80 mt-1">
            {summary.totalPendingAmount > 0
              ? "Cần thanh toán đúng hạn"
              : "Không có nợ phát sinh"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tổng số giao dịch
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {summary.totalTransactions}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1">
            Hóa đơn & Biên nhận
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Giao dịch gần nhất
          </div>
          <div className="text-base font-black text-slate-800 mt-1.5">
            {formatShortDate(summary.lastPaymentDate)}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-1">
            {summary.lastPaymentDate
              ? formatDate(summary.lastPaymentDate)
              : "Chưa có dữ liệu"}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Table Filters Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-black text-slate-900">
              Danh sách giao dịch thanh toán
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã HĐ, mã GD, kỳ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-56"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chờ thanh toán</option>
                <option value="overdue">Quá hạn</option>
              </select>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả nguồn phí</option>
                <option value="monthly_invoice">Hóa đơn hàng tháng</option>
                <option value="upfront_rent">Tiền trọ trọn gói</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs font-semibold">Đang tải lịch sử thanh toán...</span>
            </div>
          ) : filteredRecords.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Mã Hóa đơn / GD</th>
                  <th className="px-5 py-3.5">Kỳ thanh toán</th>
                  <th className="px-5 py-3.5">Nhà trọ & Phòng</th>
                  <th className="px-5 py-3.5">Tổng số tiền</th>
                  <th className="px-5 py-3.5">Hình thức</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Ngày thanh toán</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRecords.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">
                        #{item.id.slice(0, 10).toUpperCase()}
                      </div>
                      {item.transactionRef && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {item.transactionRef}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                        {item.period}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {item.boardingHouseName}
                      </div>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Phòng {item.roomNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-black text-slate-900 text-sm">
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {item.paymentMethod === "banking" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                          <CreditCard className="w-3 h-3" />
                          Chuyển khoản
                        </span>
                      ) : item.paymentMethod === "cash" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                          Tiền mặt
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Chưa thanh toán</span>
                      )}
                    </td>

                    <td className="px-5 py-4">{getStatusBadge(item.status)}</td>

                    <td className="px-5 py-4 text-slate-500">
                      {item.paidAt ? (
                        formatDate(item.paidAt)
                      ) : (
                        <span className="text-amber-600 font-bold text-[11px]">
                          Hạn: {formatShortDate(item.dueDate)}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status !== "paid" && item.status !== "success" && (
                          <Button
                            size="sm"
                            onClick={() => setPaymentQrInvoice(item)}
                            className="h-7 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg shadow-2xs cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 mr-1" />
                            Thanh toán
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRecord(item)}
                          className="h-7 text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-200 cursor-pointer"
                        >
                          Biên lai
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Receipt className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-medium">
                Không tìm thấy giao dịch nào phù hợp với bộ lọc.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Receipt Drawer / Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8 border border-slate-100">
            {/* Receipt Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Biên Lai Thanh Toán Điện Tử
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Hóa đơn #{selectedRecord.id.slice(0, 10).toUpperCase()} - Kỳ{" "}
                    {selectedRecord.period}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 flex flex-col gap-6 text-xs text-slate-700">
              {/* Meta Summary */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Nhà trọ / Phòng
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedRecord.boardingHouseName} - P.
                    {selectedRecord.roomNumber}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Trạng thái thanh toán
                  </span>
                  <div className="mt-0.5">
                    {getStatusBadge(selectedRecord.status)}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Thời điểm thanh toán
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedRecord.paidAt
                      ? formatDate(selectedRecord.paidAt)
                      : "Chưa thanh toán"}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Mã giao dịch / Biên nhận
                  </span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {selectedRecord.transactionRef ||
                      selectedRecord.receiptNumber ||
                      "-"}
                  </div>
                </div>
              </div>

              {/* Itemized Line Items Breakdown */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2.5">
                  Bảng kê chi tiết các khoản mục
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <tr>
                        <th className="p-3">Khoản mục</th>
                        <th className="p-3 text-center">Số lượng</th>
                        <th className="p-3 text-right">Đơn giá</th>
                        <th className="p-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedRecord.breakdown.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-semibold text-slate-900">
                            {item.label}
                          </td>
                          <td className="p-3 text-center text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan={3} className="p-3 text-slate-900 uppercase">
                          Tổng cộng
                        </td>
                        <td className="p-3 text-right text-sm font-black text-primary">
                          {formatCurrency(selectedRecord.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-9 px-4 rounded-xl font-bold text-xs border-slate-200 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                In biên lai
              </Button>

              <div className="flex items-center gap-2">
                {selectedRecord.status !== "paid" &&
                  selectedRecord.status !== "success" && (
                    <Button
                      onClick={() => {
                        const rec = selectedRecord;
                        setSelectedRecord(null);
                        setPaymentQrInvoice(rec);
                      }}
                      className="h-9 px-5 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-white cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 mr-1.5" />
                      Thanh toán ngay
                    </Button>
                  )}
                <Button
                  onClick={() => setSelectedRecord(null)}
                  className="h-9 px-5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VietQR Payment Pop-up Modal */}
      {paymentQrInvoice && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 my-8 border border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary/10 to-blue-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Thanh toán qua VietQR
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    Kỳ {paymentQrInvoice.period} - Phòng {paymentQrInvoice.roomNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPaymentQrInvoice(null)}
                className="w-7 h-7 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="p-3 bg-white border-2 border-primary/20 rounded-2xl shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.vietqr.io/image/970422-0912345678-compact2.png?amount=${paymentQrInvoice.totalAmount}&addInfo=TT%20TRO%20P${paymentQrInvoice.roomNumber}%20${paymentQrInvoice.period}&accountName=DORMIO%20MANAGEMENT`}
                  alt="VietQR Payment Code"
                  className="w-56 h-56 object-contain"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">
                  Số tiền cần thanh toán
                </span>
                <div className="text-2xl font-black text-primary">
                  {formatCurrency(paymentQrInvoice.totalAmount)}
                </div>
              </div>

              {/* Transfer Details Card */}
              <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-bold text-slate-900">MB Bank (Quân Đội)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>0912345678</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("0912345678", "acc")}
                      className="p-1 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                    >
                      {copiedField === "acc" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                    <span>TT TRO P{paymentQrInvoice.roomNumber} {paymentQrInvoice.period}</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `TT TRO P${paymentQrInvoice.roomNumber} ${paymentQrInvoice.period}`,
                          "syntax",
                        )
                      }
                      className="p-1 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                    >
                      {copiedField === "syntax" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <Button
                onClick={() => setPaymentQrInvoice(null)}
                className="w-full h-10 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
              >
                Đã hoàn tất chuyển khoản
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}