"use client";

import React, { useState, useMemo } from "react";
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
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Camera,
  UploadCloud,
  Copy,
  Check,
  X,
  Zap,
  Droplets,
  Download,
  Info,
  ShieldCheck,
  RefreshCw,
  LayoutGrid,
  List,
  Calendar,
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
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils";

interface InvoiceItem {
  name: string;
  value: number;
}

interface Invoice {
  id: string;
  period: string;
  amount: number;
  status: "paid" | "unpaid";
  dueDate: string;
  createdDate: string;
  paidDate: string | null;
  details: InvoiceItem[];
}

export default function TenantInvoicesPage() {
  const t = useTranslations("tenantPortal");
  const { locale } = useLanguage();

  // Mock Invoices Dataset (12 cycles)
  const initialInvoices: Invoice[] = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const month = 7 - (i % 12);
      const year = 2026 - Math.floor(i / 12);
      const mStr = month <= 0 ? 12 + month : month;
      const yStr = month <= 0 ? year - 1 : year;
      const pStr = `${mStr.toString().padStart(2, "0")}/${yStr}`;
      const dienAmount = 350000 + ((i * 37) % 20) * 12000;
      const nuocAmount = 120000 + ((i * 19) % 10) * 10000;
      const amount = 3500000 + dienAmount + nuocAmount + 150000;

      return {
        id: `INV-${pStr.replace("/", "")}`,
        period: pStr,
        amount: amount,
        status: i === 0 ? "unpaid" : "paid",
        dueDate: `05/${pStr}`,
        createdDate: `01/${pStr}`,
        paidDate: i === 0 ? null : `04/${pStr}`,
        details: [
          { name: t("roomRent"), value: 3500000 },
          { name: t("electricityFee"), value: dienAmount },
          { name: t("waterFee"), value: nuocAmount },
          { name: t("otherServices"), value: 150000 },
        ],
      };
    });
  }, [t]);

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "paid">(
    "all"
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals state
  const [selectedPayInvoice, setSelectedPayInvoice] = useState<Invoice | null>(
    null
  );
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState<string | null>(null);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  // Meter Reading OCR State
  const [electricPrev] = useState(1250);
  const [electricCurrent, setElectricCurrent] = useState(1342);
  const [waterPrev] = useState(85);
  const [waterCurrent, setWaterCurrent] = useState(93);
  const [electricImage, setElectricImage] = useState<string | null>(
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80"
  );
  const [waterImage, setWaterImage] = useState<string | null>(
    "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80"
  );
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [ocrSuccessNotice, setOcrSuccessNotice] = useState(false);

  // Chart Lines Visibility
  const [visibleLines, setVisibleLines] = useState({
    electricity: true,
    water: true,
    services: true,
    roomRent: false,
  });

  // Current unpaid invoice
  const currentUnpaid = invoices.find((inv) => inv.status === "unpaid");
  const prevInvoice = invoices[1];
  const diff = currentUnpaid && prevInvoice ? currentUnpaid.amount - prevInvoice.amount : 0;
  const percentDiff = prevInvoice ? ((Math.abs(diff) / prevInvoice.amount) * 100).toFixed(1) : "0";
  const isUp = diff > 0;

  // Chart dataset (last 12 cycles chronological)
  const chartData = useMemo(() => {
    return [...invoices]
      .reverse()
      .map((inv) => ({
        name: inv.period,
        [t("roomRent")]: inv.details[0]?.value || 0,
        [t("electricityFee")]: inv.details[1]?.value || 0,
        [t("waterFee")]: inv.details[2]?.value || 0,
        [t("otherServices")]: inv.details[3]?.value || 0,
      }));
  }, [invoices, t]);

  // Filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchText =
        inv.id.toLowerCase().includes(filterText.toLowerCase()) ||
        inv.period.includes(filterText);
      const matchStatus =
        statusFilter === "all" || inv.status === statusFilter;
      return matchText && matchStatus;
    });
  }, [invoices, filterText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(key);
    setTimeout(() => setHasCopied(null), 2000);
  };

  // Mock Confirm VietQR Payment
  const handleConfirmPaid = (invoiceId: string) => {
    setIsPaidSuccess(true);
    setTimeout(() => {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, status: "paid", paidDate: "04/07/2026" }
            : inv
        )
      );
      setIsPaidSuccess(false);
      setSelectedPayInvoice(null);
    }, 1200);
  };

  // Mock OCR Scan Simulation
  const handleSimulateOCR = () => {
    setIsScanningOCR(true);
    setTimeout(() => {
      setElectricCurrent(1348);
      setWaterCurrent(95);
      setIsScanningOCR(false);
      setOcrSuccessNotice(true);
      setTimeout(() => setOcrSuccessNotice(false), 3000);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {t("invoicesTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
            {t("invoicesSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsMeterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#2AC1BC]/20 cursor-pointer transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>{t("btnOpenMeterModal")}</span>
          </Button>
        </div>
      </div>

      {/* Quick Unpaid Alert Banner (Styled in Brand Orange) */}
      {currentUnpaid && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-white border border-orange-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B35] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#FF6B35]/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-900">
                  {t("needPayment")} &bull; {currentUnpaid.period}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                  {t("unpaid")}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mt-1">
                <div className="text-xl sm:text-2xl font-black text-zinc-900">
                  {formatCurrency(currentUnpaid.amount, locale)}
                </div>
                {isUp ? (
                  <span className="inline-flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+{percentDiff}%
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />-{percentDiff}%
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-1">
                {t("dueDate")}:{" "}
                <span className="font-bold text-zinc-700">
                  {currentUnpaid.dueDate}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setSelectedPayInvoice(currentUnpaid)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold shadow-xs shadow-[#FF6B35]/20 cursor-pointer transition-all"
          >
            <span>{t("payNow")}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Chart Section: 12-Month Expense Trends */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              {t("chartTitle")}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {locale === "en"
                ? "Monthly electricity and water spending fluctuations"
                : "Theo dõi mức chi phí tiêu thụ điện, nước qua từng tháng"}
            </p>
          </div>

          {/* Toggle Lines */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                setVisibleLines((p) => ({ ...p, electricity: !p.electricity }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                visibleLines.electricity
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "bg-zinc-50 border-zinc-200 text-zinc-400"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              {t("electricityFee")}
            </button>
            <button
              onClick={() =>
                setVisibleLines((p) => ({ ...p, water: !p.water }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                visibleLines.water
                  ? "bg-sky-50 border-sky-300 text-sky-700"
                  : "bg-zinc-50 border-zinc-200 text-zinc-400"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              {t("waterFee")}
            </button>
            <button
              onClick={() =>
                setVisibleLines((p) => ({ ...p, services: !p.services }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                visibleLines.services
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "bg-zinc-50 border-zinc-200 text-zinc-400"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              {t("otherServices")}
            </button>
            <button
              onClick={() =>
                setVisibleLines((p) => ({ ...p, roomRent: !p.roomRent }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                visibleLines.roomRent
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-zinc-50 border-zinc-200 text-zinc-400"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {t("roomRent")}
            </button>
          </div>
        </div>

        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
                formatter={(val: any) => [formatCurrency(Number(val), locale)]}
              />
              {visibleLines.electricity && (
                <Line
                  type="monotone"
                  dataKey={t("electricityFee")}
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#f59e0b" }}
                  activeDot={{ r: 6 }}
                />
              )}
              {visibleLines.water && (
                <Line
                  type="monotone"
                  dataKey={t("waterFee")}
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#0ea5e9" }}
                  activeDot={{ r: 6 }}
                />
              )}
              {visibleLines.services && (
                <Line
                  type="monotone"
                  dataKey={t("otherServices")}
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#a855f7" }}
                  activeDot={{ r: 6 }}
                />
              )}
              {visibleLines.roomRent && (
                <Line
                  type="monotone"
                  dataKey={t("roomRent")}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Invoice History Table Section */}
      <div className="rounded-3xl bg-white border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                statusFilter === "all"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {locale === "en" ? "All Invoices" : "Tất cả"}
            </button>
            <button
              onClick={() => {
                setStatusFilter("unpaid");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                statusFilter === "unpaid"
                  ? "bg-[#FF6B35] text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {t("unpaid")}
            </button>
            <button
              onClick={() => {
                setStatusFilter("paid");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                statusFilter === "paid"
                  ? "bg-[#2AC1BC] text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {t("paid")}
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
                title={locale === "en" ? "Grid View" : "Dạng Lưới"}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
                title={locale === "en" ? "Table View" : "Dạng Bảng"}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("filterByYearMonth")}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#2AC1BC] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Content: Grid or Table */}
        {viewMode === "grid" ? (
          /* Invoices Grid View */
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {paginatedInvoices.map((inv) => (
              <div
                key={inv.id}
                className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group space-y-4"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-zinc-900">
                        {inv.period}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                        {inv.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {t("dueDate")}: {inv.dueDate}
                      </span>
                    </div>
                  </div>

                  {inv.status === "paid" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {t("paid")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                      <Clock className="w-3 h-3 text-amber-600" />
                      {t("unpaid")}
                    </span>
                  )}
                </div>

                {/* Amount */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    {t("totalAmount")}
                  </span>
                  <span className="text-xl font-black text-zinc-900 mt-0.5 block">
                    {formatCurrency(inv.amount, locale)}
                  </span>
                </div>

                {/* Itemized Mini Summary */}
                <div className="space-y-1.5 text-xs">
                  {inv.details.map((item, dIdx) => (
                    <div
                      key={dIdx}
                      className="flex items-center justify-between text-zinc-600 text-[11px]"
                    >
                      <span className="text-zinc-400">{item.name}</span>
                      <span className="font-semibold text-zinc-800">
                        {formatCurrency(item.value, locale)}
                      </span>
                    </div>
                  ))}
                  {inv.paidDate && (
                    <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-100">
                      {t("paidDate")}:{" "}
                      <span className="font-bold text-zinc-700">
                        {inv.paidDate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-100">
                  {inv.status === "unpaid" ? (
                    <Button
                      size="sm"
                      onClick={() => setSelectedPayInvoice(inv)}
                      className="w-full h-9 rounded-xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold cursor-pointer transition-all shadow-xs shadow-[#FF6B35]/20 flex items-center justify-center gap-1.5"
                    >
                      <span>{t("payNow")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <div className="w-full py-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t("paid")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Invoices Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 w-12 text-center">#</th>
                  <th className="px-5 py-3.5">{t("invoiceId")}</th>
                  <th className="px-5 py-3.5">{t("billPeriod")}</th>
                  <th className="px-5 py-3.5">{t("totalAmount")}</th>
                  <th className="px-5 py-3.5">{t("dueDate")}</th>
                  <th className="px-5 py-3.5">{t("paymentStatus")}</th>
                  <th className="px-5 py-3.5 text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginatedInvoices.map((inv, idx) => {
                  const isExpanded = !!expandedRows[inv.id];
                  return (
                    <React.Fragment key={inv.id}>
                      <tr
                        id={`row-${inv.id}`}
                        className="hover:bg-zinc-50/70 transition-colors"
                      >
                        <td className="px-5 py-4 text-center text-zinc-400 font-semibold">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="px-5 py-4 font-black text-zinc-900">
                          {inv.id}
                        </td>
                        <td className="px-5 py-4 font-bold text-zinc-800">
                          {inv.period}
                        </td>
                        <td className="px-5 py-4 font-black text-zinc-900">
                          {formatCurrency(inv.amount, locale)}
                        </td>
                        <td className="px-5 py-4 text-zinc-500 font-medium">
                          {inv.dueDate}
                        </td>
                        <td className="px-5 py-4">
                          {inv.status === "paid" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {t("paid")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {t("unpaid")}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.status === "unpaid" && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedPayInvoice(inv)}
                                className="h-8 px-3 rounded-lg bg-[#FF6B35] hover:bg-[#e85a26] text-white text-[11px] font-bold cursor-pointer transition-all shadow-2xs"
                              >
                                {t("payNow")}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(inv.id)}
                              className="h-8 px-2.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-[11px] font-bold cursor-pointer"
                            >
                              <span>
                                {isExpanded
                                  ? t("hideBreakdown")
                                  : t("viewBreakdown")}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 ml-1" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 ml-1" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Breakdown View */}
                      {isExpanded && (
                        <tr className="bg-zinc-50/60 border-b border-zinc-100 animate-in fade-in duration-150">
                          <td colSpan={7} className="px-5 py-4">
                            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
                              <div className="text-xs font-black uppercase tracking-wider text-zinc-400">
                                {locale === "en"
                                  ? "Itemized Breakdown"
                                  : "Bảng kê chi tiết khoản thu"}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                {inv.details.map((item, dIdx) => (
                                  <div
                                    key={dIdx}
                                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex flex-col justify-between"
                                  >
                                    <span className="text-[11px] font-semibold text-zinc-400">
                                      {item.name}
                                    </span>
                                    <span className="text-xs font-black text-zinc-900 mt-1">
                                      {formatCurrency(item.value, locale)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {inv.paidDate && (
                                <div className="text-[11px] text-zinc-400 pt-1">
                                  {t("paidDate")}:{" "}
                                  <span className="font-bold text-zinc-700">
                                    {inv.paidDate}
                                  </span>{" "}
                                  &bull; VietQR Auto-Reconciled
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="px-5 py-3.5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="text-xs font-semibold text-zinc-400">
            {locale === "en"
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                  currentPage * itemsPerPage,
                  filteredInvoices.length
                )} of ${filteredInvoices.length} invoices`
              : `Hiển thị ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                  currentPage * itemsPerPage,
                  filteredInvoices.length
                )} trên ${filteredInvoices.length} hóa đơn`}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-zinc-900 cursor-pointer disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === i + 1
                    ? "bg-[#2AC1BC] text-white shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-zinc-900 cursor-pointer disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal 1: Dynamic VietQR Payment */}
      {selectedPayInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedPayInvoice(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-zinc-200 my-auto"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-zinc-900">
                    {t("vietQrTitle")}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {t("vietQrSubtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayInvoice(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body: 2 Columns on Desktop */}
            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 custom-scrollbar">
              {/* Left Column: QR Code */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="w-48 h-48 bg-white p-2.5 rounded-2xl shadow-xs border border-zinc-100 flex items-center justify-center">
                  <img
                    src={`https://api.vietqr.io/image/970436-0123456789-qfT2fS.jpg?amount=${selectedPayInvoice.amount}&addInfo=DORMIO%20101%20${selectedPayInvoice.id}&accountName=NGUYEN%20VAN%20RIO`}
                    alt="VietQR Payment Code"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg";
                    }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-2.5 text-center leading-relaxed">
                  {t("scanTip")}
                </p>
              </div>

              {/* Right Column: Bank Details with 1-Click Copy */}
              <div className="space-y-2 text-xs flex flex-col justify-center">
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase">
                    {t("bankName")}
                  </span>
                  <span className="font-bold text-zinc-800">
                    Vietcombank (VCB)
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase">
                      {t("accountNumber")}
                    </span>
                    <span className="font-black text-zinc-900 tracking-wider">
                      0123 456 789
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("0123456789", "acc")}
                    className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg cursor-pointer transition-colors"
                  >
                    {hasCopied === "acc" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase">
                    {t("accountHolder")}
                  </span>
                  <span className="font-bold text-zinc-900">
                    NGUYEN VAN RIO
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase">
                      {t("totalAmount")}
                    </span>
                    <span className="font-black text-[#FF6B35] text-sm">
                      {formatCurrency(selectedPayInvoice.amount, locale)}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        selectedPayInvoice.amount.toString(),
                        "amount"
                      )
                    }
                    className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg cursor-pointer transition-colors"
                  >
                    {hasCopied === "amount" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase">
                      {t("transferContent")}
                    </span>
                    <span className="font-black text-[#2AC1BC] tracking-wider">
                      DORMIO 101 {selectedPayInvoice.id}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `DORMIO 101 ${selectedPayInvoice.id}`,
                        "content"
                      )
                    }
                    className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg cursor-pointer transition-colors"
                  >
                    {hasCopied === "content" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-5 border-t border-zinc-100 bg-zinc-50/60 shrink-0">
              <Button
                onClick={() => handleConfirmPaid(selectedPayInvoice.id)}
                disabled={isPaidSuccess}
                className="w-full py-3 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs font-bold cursor-pointer transition-all shadow-sm shadow-[#2AC1BC]/20 flex items-center justify-center gap-2"
              >
                {isPaidSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 animate-bounce" />
                    <span>{t("ocrSuccess")}</span>
                  </>
                ) : (
                  <span>{t("btnConfirmPaid")}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Submit Utility Meter Readings via OCR */}
      {isMeterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsMeterModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-zinc-200 my-auto"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900">
                    {t("meterModalTitle")}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {t("meterModalSubtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMeterModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-zinc-700 custom-scrollbar">
              {ocrSuccessNotice && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{t("ocrSuccess")}</span>
                </div>
              )}

              {/* Electric Meter Box */}
              <div className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="font-black text-zinc-900 text-sm">
                      {t("electricMeter")}
                    </span>
                  </div>
                  <button
                    onClick={handleSimulateOCR}
                    disabled={isScanningOCR}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isScanningOCR ? "animate-spin" : ""
                      }`}
                    />
                    <span>
                      {isScanningOCR ? t("ocrScanning") : "Quét lại OCR"}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Image Preview / Upload */}
                  <div className="sm:col-span-1">
                    <div className="relative h-28 rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-100">
                      {electricImage ? (
                        <img
                          src={electricImage}
                          alt="Electric Meter"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                          <UploadCloud className="w-6 h-6 mb-1" />
                          <span className="text-[10px]">
                            {t("uploadPhoto")}
                          </span>
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-bold text-[11px]">
                        {t("changePhoto")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setElectricImage(
                                URL.createObjectURL(e.target.files[0])
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Readings Input */}
                  <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                        {t("previousReading")}
                      </label>
                      <input
                        type="number"
                        disabled
                        value={electricPrev}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                        {t("currentReading")} (OCR)
                      </label>
                      <input
                        type="number"
                        value={electricCurrent}
                        onChange={(e) =>
                          setElectricCurrent(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-black text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div className="col-span-2 pt-1 flex items-center justify-between text-xs font-bold text-zinc-600">
                      <span>{t("consumption")}:</span>
                      <span className="text-amber-600 font-black text-sm">
                        {Math.max(0, electricCurrent - electricPrev)} kWh
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Water Meter Box */}
              <div className="p-5 rounded-2xl border border-sky-200/80 bg-sky-50/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-sky-500" />
                    <span className="font-black text-zinc-900 text-sm">
                      {t("waterMeter")}
                    </span>
                  </div>
                  <button
                    onClick={handleSimulateOCR}
                    disabled={isScanningOCR}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isScanningOCR ? "animate-spin" : ""
                      }`}
                    />
                    <span>
                      {isScanningOCR ? t("ocrScanning") : "Quét lại OCR"}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Image Preview / Upload */}
                  <div className="sm:col-span-1">
                    <div className="relative h-28 rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-100">
                      {waterImage ? (
                        <img
                          src={waterImage}
                          alt="Water Meter"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                          <UploadCloud className="w-6 h-6 mb-1" />
                          <span className="text-[10px]">
                            {t("uploadPhoto")}
                          </span>
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-bold text-[11px]">
                        {t("changePhoto")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setWaterImage(
                                URL.createObjectURL(e.target.files[0])
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Readings Input */}
                  <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                        {t("previousReading")}
                      </label>
                      <input
                        type="number"
                        disabled
                        value={waterPrev}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                        {t("currentReading")} (OCR)
                      </label>
                      <input
                        type="number"
                        value={waterCurrent}
                        onChange={(e) =>
                          setWaterCurrent(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-sky-300 text-xs font-black text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                    <div className="col-span-2 pt-1 flex items-center justify-between text-xs font-bold text-zinc-600">
                      <span>{t("consumption")}:</span>
                      <span className="text-sky-600 font-black text-sm">
                        {Math.max(0, waterCurrent - waterPrev)} m³
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/50">
              <button
                onClick={() => setIsMeterModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold cursor-pointer"
              >
                {t("btnClose")}
              </button>

              <button
                onClick={() => {
                  alert(t("meterSuccessNotice"));
                  setIsMeterModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs font-bold cursor-pointer transition-all shadow-sm shadow-[#2AC1BC]/20"
              >
                {t("btnConfirmMeters")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
