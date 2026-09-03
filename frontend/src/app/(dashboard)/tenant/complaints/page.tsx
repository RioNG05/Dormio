"use client";

import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  ShieldAlert,
  Trash2,
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  Plus,
  Camera,
  Check,
  ShieldCheck,
  Calendar,
  FolderGit2,
  Hourglass,
  ArrowRight,
  Sparkles,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

interface ComplaintItem {
  id: string;
  categoryKeys: (
    | "catDeposit"
    | "catPriceHike"
    | "catSafety"
    | "catBreach"
    | "catFraud"
    | "catOther"
  )[];
  customCategory?: string;
  priority: "normal" | "urgent";
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  date: string;
  status: "unresponded" | "responded";
  images?: string[];
  adminResponse?: {
    responderVi: string;
    responderEn: string;
    time: string;
    contentVi: string;
    contentEn: string;
    actionTakenVi?: string;
    actionTakenEn?: string;
  };
}

export default function TenantComplaintsPage() {
  const t = useTranslations("tenantPortal");
  const { locale } = useLanguage();

  // Initial Mock Dataset
  const [complaints, setComplaints] = useState<ComplaintItem[]>([
    {
      id: "REP-2026-001",
      categoryKeys: ["catDeposit", "catBreach"],
      priority: "urgent",
      titleVi: "Chủ trọ tự ý giữ tiền cọc khi đề nghị gia hạn hợp đồng",
      titleEn: "Landlord arbitrarily holding deposit upon contract renewal",
      descVi:
        "Chủ nhà trọ yêu cầu đóng thêm 1 tháng tiền cọc trái với điều khoản 4.2 trong hợp đồng điện tử Dormio đã ký kết.",
      descEn:
        "The landlord requested an additional 1-month deposit contrary to clause 4.2 in the verified Dormio e-contract.",
      date: "14/07/2026",
      status: "unresponded",
      images: [
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80",
      ],
    },
    {
      id: "REP-2026-002",
      categoryKeys: ["catPriceHike"],
      priority: "normal",
      titleVi:
        "Tiền điện phòng thu 4.500đ/kWh cao hơn mức cam kết 3.800đ/kWh",
      titleEn:
        "Electricity sub-meter unit price billed higher than registered tier",
      descVi:
        "Hóa đơn tháng trước áp đơn giá điện 4.500đ/kWh, sai lệch so với bảng giá niêm yết khi ký hợp đồng trên Dormio.",
      descEn:
        "Invoice #INV-062026 calculated power at 4,500 VND/kWh instead of 3,800 VND/kWh listed on the verified platform listing.",
      date: "05/07/2026",
      status: "responded",
      images: [],
      adminResponse: {
        responderVi: "Ban Pháp Chế & Trọng Tài Escrow Dormio",
        responderEn: "Dormio Escrow & Compliance Arbitration",
        time: "07/07/2026 14:20",
        contentVi:
          "BQT Dormio đã trực tiếp làm việc với chủ trọ Nguyễn Văn Rio. Chủ trọ xác nhận do sơ suất nhập sai biểu giá và đã hoàn trừ 210.000 ₫ trực tiếp vào kỳ hóa đơn tháng 07/2026 của phòng bạn.",
        contentEn:
          "Dormio Admin verified the dispute with landlord Nguyen Van Rio. The landlord acknowledged a billing calculation error and refunded ₫210,000 directly into your July 2026 billing balance.",
        actionTakenVi: "Cảnh cáo chủ trọ & Hoàn trừ tiền chênh lệch",
        actionTakenEn: "Landlord officially warned & difference refunded",
      },
    },
    {
      id: "REP-2026-003",
      categoryKeys: ["catSafety", "catBreach"],
      priority: "urgent",
      titleVi: "Cửa từ tầng trệt bị kẹt mở suốt đêm, không có người trực",
      titleEn: "Ground floor magnetic lock broken, leaving vehicle area unsafe",
      descVi:
        "Cửa khóa vân tay tầng trệt bị bung chốt suốt 3 đêm liền, người lạ có thể tự do ra vào khu để xe của người thuê.",
      descEn:
        "Magnetic door latch has been broken for 3 consecutive nights posing severe safety concerns for tenant motorcycles.",
      date: "28/06/2026",
      status: "responded",
      images: [],
      adminResponse: {
        responderVi: "Bộ Phận Kiểm Tra Tiêu Chuẩn Nhà Trọ Dormio",
        responderEn: "Dormio Boarding House Standards Inspectorate",
        time: "29/06/2026 11:00",
        contentVi:
          "BQT Dormio đã phát lệnh yêu cầu chủ trọ khắc phục trong 24 giờ. Đội ngũ kỹ thuật khóa đã hoàn thành thay mới bộ nam châm khóa từ và kiểm tra lại toàn bộ thẻ RFID vào trưa ngày 29/06.",
        contentEn:
          "Dormio Admin issued an urgent 24-hour compliance notice. A professional lock technician team replaced the magnetic lock solenoid and re-tested all RFID tenant cards on June 29.",
        actionTakenVi: "Đã khắc phục hoàn tất trong 24 giờ",
        actionTakenEn: "Fully resolved within 24 hours",
      },
    },
  ]);

  // States
  const [filterStatus, setFilterStatus] = useState<
    "all" | "unresponded" | "responded"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] =
    useState<ComplaintItem | null>(null);

  // Available predefined categories
  const categoryOptions: {
    key:
      | "catDeposit"
      | "catPriceHike"
      | "catSafety"
      | "catBreach"
      | "catFraud"
      | "catOther";
    label: string;
  }[] = [
    { key: "catDeposit", label: t("catDeposit") },
    { key: "catPriceHike", label: t("catPriceHike") },
    { key: "catSafety", label: t("catSafety") },
    { key: "catBreach", label: t("catBreach") },
    { key: "catFraud", label: t("catFraud") },
    { key: "catOther", label: t("catOther") },
  ];

  // New Complaint Form State (Multi-select + Custom other category)
  const [selectedCatKeys, setSelectedCatKeys] = useState<
    (
      | "catDeposit"
      | "catPriceHike"
      | "catSafety"
      | "catBreach"
      | "catFraud"
      | "catOther"
    )[]
  >(["catDeposit"]);
  const [customOtherText, setCustomOtherText] = useState("");
  const [newPriority, setNewPriority] = useState<"normal" | "urgent">("normal");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);
  const [formSuccess, setFormSuccess] = useState(false);

  // Stats calculation: Total, Unresponded, Responded
  const stats = useMemo(() => {
    const total = complaints.length;
    const unresponded = complaints.filter(
      (c) => c.status === "unresponded"
    ).length;
    const responded = complaints.filter((c) => c.status === "responded").length;
    const resolutionRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    return { total, unresponded, responded, resolutionRate };
  }, [complaints]);

  // Helper to resolve category label
  const getCategoryLabel = (key: string, customVal?: string) => {
    if (key === "catOther") {
      return customVal || t("catOther");
    }
    return t(key as any) || key;
  };

  // Filtered List
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchStatus =
        filterStatus === "all" || c.status === filterStatus;
      const title = locale === "en" ? c.titleEn : c.titleVi;
      const desc = locale === "en" ? c.descEn : c.descVi;

      const matchSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [complaints, filterStatus, searchQuery, locale]);

  // Toggle category in multi-select
  const toggleCategory = (
    key:
      | "catDeposit"
      | "catPriceHike"
      | "catSafety"
      | "catBreach"
      | "catFraud"
      | "catOther"
  ) => {
    if (selectedCatKeys.includes(key)) {
      if (selectedCatKeys.length > 1) {
        setSelectedCatKeys(selectedCatKeys.filter((k) => k !== key));
      }
    } else {
      setSelectedCatKeys([...selectedCatKeys, key]);
    }
  };

  // Handle Image Upload Mock
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setNewImages((prev) => [...prev, url]);
    }
  };

  // Handle Form Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const newId = `REP-2026-${(complaints.length + 1)
      .toString()
      .padStart(3, "0")}`;
    const dateStr = new Date().toLocaleDateString(
      locale === "en" ? "en-US" : "vi-VN"
    );

    const created: ComplaintItem = {
      id: newId,
      categoryKeys: selectedCatKeys,
      customCategory: customOtherText.trim() || undefined,
      priority: newPriority,
      titleVi: newTitle.trim(),
      titleEn: newTitle.trim(),
      descVi: newDescription.trim(),
      descEn: newDescription.trim(),
      date: dateStr,
      status: "unresponded",
      images: newImages,
    };

    setComplaints([created, ...complaints]);
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setIsCreateModalOpen(false);
      // Reset form
      setNewTitle("");
      setNewDescription("");
      setCustomOtherText("");
      setNewImages([]);
      setSelectedCatKeys(["catDeposit"]);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto px-1 sm:px-0">
      {/* Top Header with Protected Escrow Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-[#2AC1BC] text-[11px] font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {locale === "en"
                ? "Dormio Escrow Tenant Protection"
                : "Bảo vệ quyền lợi khách thuê bởi Dormio Escrow"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {t("complaintsTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed max-w-3xl">
            {t("complaintsSubtitle")}
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#2AC1BC] to-[#20a8a3] hover:from-[#20a8a3] hover:to-[#1a938f] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#2AC1BC]/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("btnNewComplaint")}</span>
        </Button>
      </div>

      {/* Main Content Card */}
      <div className="rounded-3xl bg-white border border-zinc-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-zinc-50/50">
          {/* Status Capsule Filter Tabs with Badge Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto p-1 bg-zinc-100/80 rounded-2xl">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 flex items-center gap-2 ${
                filterStatus === "all"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <span>{t("tabAllIssues")}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  filterStatus === "all"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-200 text-zinc-700"
                }`}
              >
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus("unresponded")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 flex items-center gap-2 ${
                filterStatus === "unresponded"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{t("statusUnresponded")}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  filterStatus === "unresponded"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {stats.unresponded}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus("responded")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 flex items-center gap-2 ${
                filterStatus === "responded"
                  ? "bg-[#2AC1BC] text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("statusResponded")}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  filterStatus === "responded"
                    ? "bg-[#239e9a] text-white"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {stats.responded}
              </span>
            </button>
          </div>

          {/* Right Tools: View Mode & Search */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-xl shrink-0 shadow-2xs">
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

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === "en"
                    ? "Search by ID, title..."
                    : "Tìm mã, tiêu đề khiếu nại..."
                }
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#2AC1BC] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Content: Case-File Cards Grid or Table */}
        {viewMode === "grid" ? (
          /* Grid View (Case-File Cards) */
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredComplaints.map((item) => {
              const displayTitle =
                locale === "en" ? item.titleEn : item.titleVi;
              const displayDesc = locale === "en" ? item.descEn : item.descVi;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs hover:shadow-lg hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between space-y-4 group relative"
                >
                  {/* Top Dossier Meta */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-lg border border-zinc-200/60">
                        {item.id}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-orange-50 text-[#FF6B35] border border-orange-200/80">
                        {locale === "en" ? "Dormio Admin" : "BQT Dormio"}
                      </span>
                    </div>

                    {/* Priority Badge */}
                    {item.priority === "urgent" ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase flex items-center gap-1 shadow-2xs">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{t("priorityUrgent")}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[10px] font-semibold">
                        {t("priorityNormal")}
                      </span>
                    )}
                  </div>

                  {/* Multi-Categories Tag Cloud (Fixed height for uniform vertical baseline) */}
                  <div className="min-h-[52px] flex flex-wrap content-start gap-1.5">
                    {item.categoryKeys.map((catKey, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 border border-[#2AC1BC]/20 px-2 py-0.5 rounded-lg h-fit"
                      >
                        {getCategoryLabel(catKey, item.customCategory)}
                      </span>
                    ))}
                  </div>

                  {/* Title & Description Snippet (Strictly balanced heights) */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-zinc-900 leading-snug line-clamp-2 h-[42px]">
                      {displayTitle}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-normal h-[36px]">
                      {displayDesc}
                    </p>
                  </div>

                  {/* Compact Evidence Attachment Pill */}
                  <div className="flex items-center h-7">
                    {item.images && item.images.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setSelectedComplaint(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 text-[11px] font-semibold text-zinc-700 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#2AC1BC]" />
                        <span>
                          {item.images.length}{" "}
                          {locale === "en"
                            ? "evidence attached"
                            : "ảnh bằng chứng"}
                        </span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-zinc-400">
                        <FileText className="w-3.5 h-3.5 text-zinc-300" />
                        <span>{locale === "en" ? "No files" : "Không có tệp"}</span>
                      </span>
                    )}
                  </div>

                  {/* Card Footer: Status Pill & Action Button */}
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                    {/* Status indicator */}
                    <div>
                      {item.status === "responded" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{t("statusResponded")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>{t("statusUnresponded")}</span>
                        </span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setSelectedComplaint(item)}
                      className="h-8 px-3 rounded-xl bg-zinc-50 hover:bg-zinc-900 hover:text-white border border-zinc-200/80 text-zinc-700 text-xs font-bold cursor-pointer transition-all flex items-center gap-1 group/btn shadow-2xs"
                    >
                      <span>
                        {locale === "en" ? "View Details" : "Xem kết quả"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 min-w-[700px]">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">
                    {locale === "en" ? "Complaint ID" : "Mã khiếu nại"}
                  </th>
                  <th className="px-5 py-3.5">
                    {locale === "en" ? "Category" : "Danh mục vi phạm"}
                  </th>
                  <th className="px-5 py-3.5">
                    {locale === "en" ? "Title" : "Tiêu đề khiếu nại"}
                  </th>
                  <th className="px-5 py-3.5">
                    {locale === "en" ? "Urgency" : "Mức độ"}
                  </th>
                  <th className="px-5 py-3.5">
                    {locale === "en" ? "Date" : "Ngày gửi"}
                  </th>
                  <th className="px-5 py-3.5">
                    {locale === "en" ? "Status" : "Trạng thái"}
                  </th>
                  <th className="px-5 py-3.5 text-right">
                    {locale === "en" ? "Actions" : "Thao tác"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredComplaints.map((item) => {
                  const displayTitle =
                    locale === "en" ? item.titleEn : item.titleVi;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-zinc-900">
                        {item.id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.categoryKeys.map((catKey, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 px-1.5 py-0.5 rounded"
                            >
                              {getCategoryLabel(catKey, item.customCategory)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-zinc-900 max-w-xs truncate">
                        {displayTitle}
                      </td>
                      <td className="px-5 py-4">
                        {item.priority === "urgent" ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase">
                            {t("priorityUrgent")}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[10px] font-semibold">
                            {t("priorityNormal")}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-zinc-500">{item.date}</td>
                      <td className="px-5 py-4">
                        {item.status === "responded" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{t("statusResponded")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{t("statusUnresponded")}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => setSelectedComplaint(item)}
                          className="h-8 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold cursor-pointer transition-colors"
                        >
                          <span>{locale === "en" ? "Details" : "Chi tiết"}</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Create New Grievance / Report to Admin */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col border border-zinc-200 my-auto"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-zinc-900">
                  {t("modalCreateTitle")}
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                  {t("modalCreateSubtitle")}
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleCreateSubmit}
              className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs custom-scrollbar"
            >
              {formSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{t("createSuccess")}</span>
                </div>
              )}

              {/* Multi-select Categories */}
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1.5 uppercase">
                  {t("fieldCategory")} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoryOptions.map((cat, idx) => {
                    const isSelected = selectedCatKeys.includes(cat.key);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleCategory(cat.key)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2AC1BC]/10 border-[#2AC1BC] text-[#2AC1BC] font-bold shadow-2xs"
                            : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        <span className="text-[11px]">{cat.label}</span>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[#2AC1BC] border-[#2AC1BC] text-white"
                              : "border-zinc-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Category input if "Khác" is selected */}
                {selectedCatKeys.includes("catOther") && (
                  <div className="mt-2.5 animate-in fade-in duration-200">
                    <input
                      type="text"
                      required
                      value={customOtherText}
                      onChange={(e) => setCustomOtherText(e.target.value)}
                      placeholder={t("customCategoryPlaceholder")}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#2AC1BC] text-xs font-medium focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1 uppercase">
                  {t("fieldPriority")}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPriority("normal")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                      newPriority === "normal"
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                        : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {t("priorityNormal")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPriority("urgent")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                      newPriority === "urgent"
                        ? "bg-rose-500 text-white border-rose-500 shadow-2xs"
                        : "bg-zinc-50 border-zinc-200 text-rose-600 hover:bg-rose-50"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t("priorityUrgent")}</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1 uppercase">
                  {t("fieldTitle")} *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    locale === "en"
                      ? "e.g. Landlord arbitrarily increasing deposit..."
                      : "Ví dụ: Chủ trọ tự ý tăng tiền cọc sai hợp đồng..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#2AC1BC] transition-colors"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1 uppercase">
                  {t("fieldDescription")} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={
                    locale === "en"
                      ? "Describe specific violation, disputed amount, and breached clauses..."
                      : "Mô tả cụ thể hành vi vi phạm, số tiền tranh chấp, và điều khoản bị vi phạm..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#2AC1BC] transition-colors resize-none"
                />
              </div>

              {/* Image Attachments */}
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1.5 uppercase">
                  {t("fieldAttachments")}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {newImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 group"
                    >
                      <img
                        src={img}
                        alt="Upload"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewImages(newImages.filter((_, i) => i !== idx))
                        }
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-zinc-300 hover:border-[#2AC1BC] bg-zinc-50 flex flex-col items-center justify-center text-zinc-400 hover:text-[#2AC1BC] transition-colors cursor-pointer">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-bold">
                      {locale === "en" ? "+ Evidence" : "+ Bằng chứng"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadImage}
                    />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-zinc-600 hover:bg-zinc-100 text-xs font-bold cursor-pointer"
                >
                  {t("btnClose")}
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  {t("btnSubmit")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Admin Official Response View */}
      {selectedComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedComplaint(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col border border-zinc-200 my-auto"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                    {selectedComplaint.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedComplaint.status === "responded"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {selectedComplaint.status === "responded"
                      ? t("statusResponded")
                      : t("statusUnresponded")}
                  </span>
                </div>
                <h3 className="text-base font-black text-zinc-900 mt-1">
                  {locale === "en"
                    ? selectedComplaint.titleEn
                    : selectedComplaint.titleVi}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Tenant's Original Complaint + Admin Official Response */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs custom-scrollbar">
              {/* Original Complaint Details */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-zinc-400">
                    {locale === "en"
                      ? "Original Grievance Information"
                      : "Thông tin khiếu nại gốc"}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {selectedComplaint.date}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {selectedComplaint.categoryKeys.map((catKey, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 px-2 py-0.5 rounded-md"
                    >
                      {getCategoryLabel(
                        catKey,
                        selectedComplaint.customCategory
                      )}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-zinc-700 leading-relaxed font-medium">
                  {locale === "en"
                    ? selectedComplaint.descEn
                    : selectedComplaint.descVi}
                </p>

                {selectedComplaint.images &&
                  selectedComplaint.images.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                        {locale === "en"
                          ? "Evidence photos:"
                          : "Hình ảnh bằng chứng đính kèm:"}
                      </span>
                      <div className="flex items-center gap-2">
                        {selectedComplaint.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-200"
                          >
                            <img
                              src={img}
                              alt="Evidence"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Admin Official Response Section */}
              {selectedComplaint.status === "responded" &&
              selectedComplaint.adminResponse ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/60 border border-emerald-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-emerald-950 block">
                          {t("adminResponseTitle")}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          {locale === "en"
                            ? selectedComplaint.adminResponse.responderEn
                            : selectedComplaint.adminResponse.responderVi}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {selectedComplaint.adminResponse.time}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-800 leading-relaxed font-medium bg-white/80 p-3.5 rounded-xl border border-emerald-100">
                    {locale === "en"
                      ? selectedComplaint.adminResponse.contentEn
                      : selectedComplaint.adminResponse.contentVi}
                  </p>

                  {(selectedComplaint.adminResponse.actionTakenEn ||
                    selectedComplaint.adminResponse.actionTakenVi) && (
                    <div className="text-[11px] text-emerald-900 font-semibold flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>
                          {locale === "en"
                            ? "Action Taken: "
                            : "Biện pháp xử lý: "}
                        </strong>
                        {locale === "en"
                          ? selectedComplaint.adminResponse.actionTakenEn
                          : selectedComplaint.adminResponse.actionTakenVi}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Pending Response Notice: Clean single line */
                <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white border border-amber-200/80 flex flex-col items-center justify-center gap-2.5 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
                    <Hourglass className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-amber-900">
                    {locale === "en"
                      ? "Awaiting response from Dormio Admin"
                      : "Đang chờ Ban Quản trị Dormio phản hồi"}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-zinc-100 bg-zinc-50/60 flex justify-end shrink-0">
              <Button
                onClick={() => setSelectedComplaint(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
              >
                {t("btnClose")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}