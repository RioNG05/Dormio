"use client";

import React, { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Megaphone, Bell, Mail, MessageSquare, Send, CheckCircle2,
  Clock, AlertCircle, Search, Filter, LayoutGrid, Table as TableIcon,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X,
  Plus, Users, Smartphone, Eye, Calendar, Sparkles, AlertTriangle
} from "lucide-react";

interface NotificationCampaign {
  id: string;
  name: string;
  title: string;
  content: string;
  targetGroup: "all_users" | "all_landlords" | "all_tenants" | "all_staff" | "all_admins" | "specific_user";
  targetLabel: string;
  targetId?: string;
  channels: ("in_app" | "email" | "sms" | "zalo")[];
  status: "sent" | "pending" | "failed" | "canceled";
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  scheduledFor?: string;
  createdBy: string;
}

export default function AdminNotificationsPage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  // Rule #9: Standardized View & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Grid is ALWAYS default
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for grid, 10 for table

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "pending" | "failed" | "canceled">("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Composer Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeName, setComposeName] = useState("");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [composeTarget, setComposeTarget] = useState<NotificationCampaign["targetGroup"]>("all_users");
  const [specificUserId, setSpecificUserId] = useState("");
  const [composeChannels, setComposeChannels] = useState<("in_app" | "email" | "sms" | "zalo")[]>(["in_app"]);
  const [composeScheduleType, setComposeScheduleType] = useState<"now" | "later">("now");
  const [composeScheduleTime, setComposeScheduleTime] = useState("");
  const [formError, setFormError] = useState("");

  // Inspect Campaign Modal
  const [inspectCampaign, setInspectCampaign] = useState<NotificationCampaign | null>(null);

  // Rule #10: Modal Reset Confirmation
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean;
    onDiscard: () => void;
  }>({ isOpen: false, onDiscard: () => {} });

  // Initial Campaigns Data
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([
    {
      id: "CMP-401",
      name: isEn ? "System Maintenance Window Sept 10" : "Thông báo bảo trì hệ thống định kỳ 10/09",
      title: isEn ? "Scheduled Platform Maintenance from 01:00 to 04:00 AM" : "Bảo trì nâng cấp hạ tầng máy chủ từ 01:00 đến 04:00 sáng 10/09",
      content: isEn
        ? "Dormio will undergo scheduled maintenance to upgrade database read replicas. Services may be intermittently interrupted. Invoices and contracts will resume normally after 04:00 AM."
        : "Hệ thống Dormio sẽ tiến hành nâng cấp hạ tầng máy chủ và tối ưu hóa cổng thanh toán VietQR vào rạng sáng 10/09. Mọi hoạt động quản lý phòng và thanh toán sẽ hoạt động trở lại bình thường sau 04:00 sáng.",
      targetGroup: "all_users",
      targetLabel: isEn ? "All Users" : "Toàn bộ người dùng",
      channels: ["in_app", "email", "zalo"],
      status: "sent",
      totalRecipients: 12480,
      sentCount: 12450,
      failedCount: 30,
      createdAt: "2026-09-07 15:30",
      createdBy: "Admin Quản Trị",
    },
    {
      id: "CMP-402",
      name: isEn ? "Fire Safety Compliance Reminder for Landlords" : "Nhắc nhở tuân thủ quy chuẩn PCCC đối với Chủ trọ",
      title: isEn ? "Mandatory: Review Fire Safety Protocols & Emergency Exits" : "Khẩn: Tự kiểm tra trang thiết bị PCCC & Lối thoát hiểm nhà trọ",
      content: isEn
        ? "In accordance with local regulations, landlords are requested to inspect smoke detectors, fire extinguishers, and clear emergency exit corridors across all boarding house properties."
        : "Thực hiện theo chỉ đạo của cơ quan chức năng, kính đề nghị các Quý Chủ trọ tiến hành rà soát bình chữa cháy, kiểm tra hệ thống chuông báo khói và đảm bảo hành lang thoát hiểm không bị cản trở.",
      targetGroup: "all_landlords",
      targetLabel: isEn ? "All Landlords" : "Tất cả Chủ trọ",
      channels: ["in_app", "email", "sms"],
      status: "sent",
      totalRecipients: 3140,
      sentCount: 3125,
      failedCount: 15,
      createdAt: "2026-09-05 10:00",
      createdBy: "Admin Quản Trị",
    },
    {
      id: "CMP-403",
      name: isEn ? "Autumn Student Rental Promotion: Zero Fee Escrow" : "Ưu đãi mùa tựu trường: Miễn phí giữ chỗ phòng trọ",
      title: isEn ? "Exclusive: 0% Escrow deposit fee for university students" : "Đặc quyền sinh viên: Miễn phí 100% phí bảo lãnh cọc giữ chỗ",
      content: isEn
        ? "Welcome back to school! All verified students booking rooms on Dormio BHRP enjoy 100% deposit protection guarantee with zero transaction fee until October 31."
        : "Chào đón tân sinh viên! Giữ chỗ phòng trọ an toàn 100% qua Dormio được bảo lãnh hoàn tiền nếu phòng không đúng thực tế, hoàn toàn không thu phí trung gian đến hết ngày 31/10.",
      targetGroup: "all_tenants",
      targetLabel: isEn ? "All Tenants" : "Tất cả Khách thuê",
      channels: ["in_app", "zalo"],
      status: "pending",
      totalRecipients: 8920,
      sentCount: 6840,
      failedCount: 12,
      createdAt: "2026-09-08 08:00",
      createdBy: "Admin Quản Trị",
    },
    {
      id: "CMP-404",
      name: isEn ? "Upcoming: New Staff Shift Attendance Guide" : "Thông báo cập nhật quy trình chấm công GPS nhân viên",
      title: isEn ? "New: GPS Radius check-in window starts next Monday" : "Cập nhật tính năng: Bán kính chấm công GPS có hiệu lực từ Thứ Hai",
      content: isEn
        ? "Staff members can now check-in to cleaning and security shifts using the updated GPS boundary feature on mobile."
        : "Nhân viên vận hành và bảo vệ chú ý: Tính năng chấm công theo bán kính GPS tòa nhà sẽ chính thức kích hoạt từ tuần tới. Vui lòng bật định vị khi vào ca.",
      targetGroup: "all_staff",
      targetLabel: isEn ? "All Staff" : "Tất cả Nhân viên",
      channels: ["in_app"],
      status: "pending",
      totalRecipients: 420,
      sentCount: 0,
      failedCount: 0,
      createdAt: "2026-09-08 11:30",
      scheduledFor: "2026-09-11 08:00",
      createdBy: "Admin Quản Trị",
    },
  ]);

  // Filtered dataset
  const currentDataset = useMemo(() => {
    return campaigns.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      const matchChannel =
        channelFilter === "all" ||
        item.channels.includes(channelFilter as any);

      return matchSearch && matchStatus && matchChannel;
    });
  }, [campaigns, searchQuery, statusFilter, channelFilter]);

  // View mode toggle
  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    setPageSize(mode === "grid" ? 6 : 10);
    setCurrentPage(1);
  };

  const totalItems = currentDataset.length;
  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === "grid" ? 6 : 10));
  const totalPages = Math.max(1, Math.ceil(totalItems / validPageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * validPageSize;
    return currentDataset.slice(start, start + validPageSize);
  }, [currentDataset, safeCurrentPage, validPageSize]);

  // 5-page window jumping
  const windowStart = Math.floor((safeCurrentPage - 1) / 5) * 5 + 1;
  const windowEnd = Math.min(windowStart + 4, totalPages);
  const pageNumbers = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i);
  }

  // Selection
  const isAllCurrentSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.includes(item.id));

  const toggleSelectAllCurrent = () => {
    if (isAllCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedItems.some((item) => item.id === id)));
    } else {
      const pageIds = paginatedItems.map((item) => item.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Compose Channels toggle
  const toggleComposeChannel = (ch: "in_app" | "email" | "sms" | "zalo") => {
    setComposeChannels((prev) => {
      if (prev.includes(ch)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((c) => c !== ch);
      } else {
        return [...prev, ch];
      }
    });
  };

  // Rule #10: Check dirty form on close
  const isComposerDirty =
    composeName.trim().length > 0 ||
    composeTitle.trim().length > 0 ||
    composeContent.trim().length > 0 ||
    specificUserId.trim().length > 0;

  const handleRequestCloseComposer = () => {
    if (isComposerDirty) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setIsComposeOpen(false);
          resetComposer();
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} });
        },
      });
    } else {
      setIsComposeOpen(false);
      resetComposer();
    }
  };

  const resetComposer = () => {
    setComposeName("");
    setComposeTitle("");
    setComposeContent("");
    setComposeTarget("all_users");
    setSpecificUserId("");
    setComposeChannels(["in_app"]);
    setComposeScheduleType("now");
    setComposeScheduleTime("");
    setFormError("");
  };

  // Send campaign
  const handleSendCampaign = () => {
    if (!composeTitle.trim() || !composeContent.trim()) {
      setFormError(isEn ? "Please fill in notification title and message content." : "Vui lòng nhập tiêu đề và nội dung thông báo.");
      return;
    }

    if (composeTarget === "specific_user" && !specificUserId.trim()) {
      setFormError(isEn ? "Please enter recipient User UUID or Phone Number." : "Vui lòng nhập mã User UUID hoặc số điện thoại của người nhận.");
      return;
    }

    const newId = `CMP-${Math.floor(Math.random() * 900) + 410}`;
    let recipients = 12480;
    let label = isEn ? "All Users" : "Toàn bộ người dùng";
    if (composeTarget === "all_landlords") {
      recipients = 3140;
      label = isEn ? "All Landlords" : "Tất cả Chủ trọ";
    } else if (composeTarget === "all_tenants") {
      recipients = 8920;
      label = isEn ? "All Tenants" : "Tất cả Khách thuê";
    } else if (composeTarget === "all_staff") {
      recipients = 420;
      label = isEn ? "All Staff" : "Tất cả Nhân viên";
    } else if (composeTarget === "all_admins") {
      recipients = 15;
      label = isEn ? "All Admins" : "Quản trị viên";
    } else if (composeTarget === "specific_user") {
      recipients = 1;
      label = `${isEn ? "User" : "Người dùng"}: ${specificUserId.trim()}`;
    }

    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);

    const newCampaign: NotificationCampaign = {
      id: newId,
      name: composeName.trim() || composeTitle.trim(),
      title: composeTitle.trim(),
      content: composeContent.trim(),
      targetGroup: composeTarget,
      targetLabel: label,
      targetId: composeTarget === "specific_user" ? specificUserId.trim() : undefined,
      channels: composeChannels,
      status: composeScheduleType === "now" ? "pending" : "pending",
      totalRecipients: recipients,
      sentCount: composeScheduleType === "now" ? Math.floor(recipients * 0.85) : 0,
      failedCount: 0,
      createdAt: nowStr,
      scheduledFor: composeScheduleType === "later" ? composeScheduleTime : undefined,
      createdBy: "Admin Quản Trị",
    };

    setCampaigns((prev) => [newCampaign, ...prev]);
    setIsComposeOpen(false);
    resetComposer();
  };

  // Helper Channel Icon
  const renderChannelBadges = (channels: NotificationCampaign["channels"]) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {channels.map((ch) => {
        switch (ch) {
          case "in_app":
            return (
              <span key={ch} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                <Bell className="w-3 h-3" />
                In-App
              </span>
            );
          case "email":
            return (
              <span key={ch} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                <Mail className="w-3 h-3" />
                Email
              </span>
            );
          case "sms":
            return (
              <span key={ch} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                <Smartphone className="w-3 h-3" />
                SMS
              </span>
            );
          case "zalo":
            return (
              <span key={ch} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-50 text-cyan-800 border border-cyan-200">
                <MessageSquare className="w-3 h-3" />
                Zalo ZNS
              </span>
            );
        }
      })}
    </div>
  );

  const renderStatusBadge = (status: NotificationCampaign["status"]) => {
    switch (status) {
      case "sent":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
            {isEn ? "SENT" : "ĐÃ GỬI"}
          </span>
        );
      case "pending":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
            {isEn ? "PENDING" : "CHỜ XỬ LÝ"}
          </span>
        );
      case "failed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200">
            {isEn ? "FAILED" : "THẤT BẠI"}
          </span>
        );
      case "canceled":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-zinc-100 text-zinc-600 border border-zinc-200">
            {isEn ? "CANCELED" : "ĐÃ HỦY"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wide uppercase">
              <Megaphone className="w-3.5 h-3.5" />
              {isEn ? "Mass Dispatcher" : "Gửi Thông Báo Hàng Loạt"}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              • {isEn ? "Multi-channel broadcast campaign engine" : "Động cơ thông báo đa kênh toàn quốc"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {isEn ? "Mass Notification Dispatcher" : "Chiến Dịch Gửi Thông Báo Đa Kênh"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isEn
              ? "Broadcast system notices, maintenance alerts, and marketing offers across In-App, Email, SMS, and Zalo ZNS."
              : "Phát thông báo bảo trì, cảnh báo an ninh PCCC, hoặc tin tức cập nhật đến từng nhóm đối tượng qua App, Email, SMS Brandname và Zalo."}
          </p>
        </div>

        <button
          onClick={() => setIsComposeOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isEn ? "Compose Campaign" : "Tạo Chiến Dịch Mới"}</span>
        </button>
      </div>

      {/* Control Bar: Search, Filters, View Mode (Rule #9) */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={isEn ? "Search campaign name, title, text..." : "Tìm tên chiến dịch, tiêu đề thông báo..."}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status chips aligned with Prisma NotifyStatus */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {(
              [
                { id: "all", label: isEn ? "All" : "Tất cả" },
                { id: "sent", label: isEn ? "Sent" : "Đã gửi" },
                { id: "pending", label: isEn ? "Pending" : "Chờ xử lý" },
                { id: "failed", label: isEn ? "Failed" : "Thất bại" },
                { id: "canceled", label: isEn ? "Canceled" : "Đã hủy" },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                onClick={() => {
                  setStatusFilter(chip.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === chip.id
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Channel filter dropdown */}
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 cursor-pointer focus:outline-none focus:border-orange-500"
          >
            <option value="all">{isEn ? "All Channels" : "Mọi kênh gửi"}</option>
            <option value="in_app">In-App Notification</option>
            <option value="email">Email Broadcast</option>
            <option value="sms">SMS Brandname</option>
            <option value="zalo">Zalo ZNS</option>
          </select>
        </div>

        {/* View Mode (Rule #9) */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-orange-600 shadow-2xs font-extrabold" : "text-zinc-400 hover:text-zinc-700"
              }`}
              title={isEn ? "Grid View (Default)" : "Chế độ Lưới (Mặc định)"}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-orange-600 shadow-2xs font-extrabold" : "text-zinc-400 hover:text-zinc-700"
              }`}
              title={isEn ? "Table View" : "Chế độ Bảng"}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Select All on Current Page Bar */}
      {paginatedItems.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-zinc-500">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllCurrentSelected}
              onChange={toggleSelectAllCurrent}
              className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <span>{isEn ? "Select all on this page" : "Chọn tất cả trên trang này"}</span>
          </label>
          <span>
            {isEn
              ? `Showing ${paginatedItems.length} of ${totalItems} campaigns`
              : `Hiển thị ${paginatedItems.length} trên ${totalItems} chiến dịch`}
          </span>
        </div>
      )}

      {/* Main Content */}
      {paginatedItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">
            {isEn ? "No campaigns found" : "Không tìm thấy chiến dịch nào"}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {isEn
              ? "Try adjusting filters or compose a new broadcast campaign."
              : "Thử thay đổi bộ lọc hoặc tạo một chiến dịch phát thông báo mới."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9: Default 6 items) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const percent = item.totalRecipients > 0
              ? Math.min(100, Math.round((item.sentCount / item.totalRecipients) * 100))
              : 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md p-5 space-y-4 ${
                  isSelected ? "border-orange-500 ring-2 ring-orange-500/20" : "border-zinc-200/90"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-black text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                        {item.id}
                      </span>
                    </div>

                    {renderStatusBadge(item.status)}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-zinc-900 line-clamp-1 hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                      {item.name}
                    </p>
                  </div>

                  {renderChannelBadges(item.channels)}

                  <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>

                  {/* Delivery progress bar */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-700">
                        {isEn ? "Audience:" : "Đối tượng:"} <span className="text-orange-600">{item.targetLabel}</span>
                      </span>
                      <span className="font-bold text-zinc-900">{percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-orange-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{item.sentCount.toLocaleString()} / {item.totalRecipients.toLocaleString()}</span>
                      {item.failedCount > 0 && (
                        <span className="text-orange-600 font-bold">{item.failedCount} {isEn ? "failed" : "lỗi"}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px]">{item.createdAt}</span>
                  <button
                    onClick={() => setInspectCampaign(item)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isEn ? "View Report" : "Xem báo cáo"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9: Default 10 items) */
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 uppercase tracking-wider font-bold">
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={isAllCurrentSelected}
                    onChange={toggleSelectAllCurrent}
                    className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">{isEn ? "Campaign & Title" : "Chiến dịch & Tiêu đề"}</th>
                <th className="p-3.5">{isEn ? "Channels" : "Kênh gửi"}</th>
                <th className="p-3.5">{isEn ? "Target Audience" : "Nhóm đối tượng"}</th>
                <th className="p-3.5">{isEn ? "Progress" : "Tiến độ gửi"}</th>
                <th className="p-3.5">{isEn ? "Status" : "Trạng thái"}</th>
                <th className="p-3.5 text-right">{isEn ? "Actions" : "Hành động"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const percent = item.totalRecipients > 0
                  ? Math.min(100, Math.round((item.sentCount / item.totalRecipients) * 100))
                  : 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-zinc-50/80 transition-colors ${
                      isSelected ? "bg-orange-50/30" : ""
                    }`}
                  >
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5 space-y-0.5 max-w-xs">
                      <div className="font-mono text-[10px] text-zinc-400 font-bold">{item.id}</div>
                      <div className="font-bold text-zinc-900 line-clamp-1">{item.title}</div>
                      <div className="text-[11px] text-zinc-500 line-clamp-1">{item.name}</div>
                    </td>

                    <td className="p-3.5">
                      {renderChannelBadges(item.channels)}
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-zinc-800">{item.targetLabel}</span>
                      <div className="text-[11px] text-zinc-400">
                        {item.totalRecipients.toLocaleString()} {isEn ? "users" : "người nhận"}
                      </div>
                    </td>

                    <td className="p-3.5 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span>{item.sentCount.toLocaleString()}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      {renderStatusBadge(item.status)}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setInspectCampaign(item)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                        title={isEn ? "View details" : "Xem chi tiết"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Standardized Pagination Bar (Rule #9) */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-semibold text-zinc-600">
        <div className="flex items-center gap-2">
          <span>{isEn ? "Showing" : "Hiển thị"}</span>
          <input
            type="number"
            min={1}
            max={100}
            value={pageSize}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setPageSize(val);
              setCurrentPage(1);
            }}
            className="w-14 px-2 py-1 text-center bg-zinc-50 border border-zinc-200 rounded-lg font-bold text-zinc-900 focus:outline-none focus:border-orange-500"
          />
          <span>{isEn ? "/ page" : "/ trang"}</span>
          <span className="text-zinc-300">|</span>
          <span>
            {totalItems === 0
              ? "0"
              : `${(safeCurrentPage - 1) * validPageSize + 1}-${Math.min(
                  safeCurrentPage * validPageSize,
                  totalItems
                )}`}{" "}
            {isEn ? `of ${totalItems} campaigns` : `trên ${totalItems} chiến dịch`}
          </span>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "First page" : "Trang đầu"}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 5))}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "Previous 5 pages" : "Lùi 5 trang"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                safeCurrentPage === num
                  ? "bg-orange-600 text-white shadow-2xs"
                  : "border border-zinc-200 hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 5))}
            disabled={safeCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "Next 5 pages" : "Tiến 5 trang"}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "Last page" : "Trang cuối"}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* COMPOSE CAMPAIGN MODAL (Rule #10 compliant) */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-zinc-900">
                  {isEn ? "Compose Mass Broadcast Campaign" : "Soạn Chiến Dịch Thông Báo Hàng Loạt"}
                </h2>
              </div>
              <button
                onClick={handleRequestCloseComposer}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Campaign Internal Name */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  {isEn ? "Internal Campaign Name:" : "Tên chiến dịch quản lý nội bộ:"}
                </label>
                <input
                  type="text"
                  value={composeName}
                  onChange={(e) => setComposeName(e.target.value)}
                  placeholder={isEn ? "e.g., Autumn 2026 Student Promotion" : "Ví dụ: Thông báo bảo trì máy chủ tháng 09/2026"}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-semibold text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Channels Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 block">
                  {isEn ? "Select Dispatch Channels (Pick 1 or multiple):" : "Chọn kênh phát thông báo (Chọn 1 hoặc nhiều kênh):"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "in_app" as const, label: "In-App Notification", icon: Bell, color: "text-blue-600 bg-blue-50" },
                    { id: "email" as const, label: "Email Broadcast", icon: Mail, color: "text-purple-600 bg-purple-50" },
                    { id: "sms" as const, label: "SMS Brandname", icon: Smartphone, color: "text-amber-600 bg-amber-50" },
                    { id: "zalo" as const, label: "Zalo ZNS", icon: MessageSquare, color: "text-cyan-600 bg-cyan-50" },
                  ].map((ch) => {
                    const isSelected = composeChannels.includes(ch.id);
                    const Icon = ch.icon;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleComposeChannel(ch.id)}
                        className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isSelected
                            ? "border-orange-500 bg-orange-50/50 text-orange-700 shadow-2xs"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="w-4 h-4" />
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-orange-600 bg-orange-600 text-white" : "border-zinc-300"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <span className="text-[11px] leading-tight">{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience Group (Prisma NofifyTarget) */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 block">
                  {isEn ? "Target Audience Group:" : "Nhóm đối tượng nhận thông báo:"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "all_users" as const, label: isEn ? "All Users (12.4k)" : "Tất cả User (12.4k)" },
                    { id: "all_landlords" as const, label: isEn ? "All Landlords (3.1k)" : "Chủ trọ (3.1k)" },
                    { id: "all_tenants" as const, label: isEn ? "All Tenants (8.9k)" : "Khách thuê (8.9k)" },
                    { id: "all_staff" as const, label: isEn ? "All Staff (420)" : "Nhân viên (420)" },
                    { id: "all_admins" as const, label: isEn ? "All Admins (15)" : "Quản trị viên (15)" },
                    { id: "specific_user" as const, label: isEn ? "Specific User" : "User cụ thể" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setComposeTarget(t.id)}
                      className={`px-3 py-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        composeTarget === t.id
                          ? "border-orange-500 bg-orange-50 text-orange-700 shadow-2xs"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {composeTarget === "specific_user" && (
                  <div className="space-y-1 pt-1">
                    <label className="font-bold text-zinc-700 block">
                      {isEn ? "Recipient User ID or Phone Number:" : "Mã User UUID hoặc SĐT người nhận:"}
                    </label>
                    <input
                      type="text"
                      value={specificUserId}
                      onChange={(e) => setSpecificUserId(e.target.value)}
                      placeholder={isEn ? "e.g., 0912.345.678 or user-uuid" : "Ví dụ: 0912.345.678 hoặc mã UUID người dùng"}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Title / Subject */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  {isEn ? "Notification Title / Email Subject:" : "Tiêu đề thông báo / Chủ đề Email:"}
                </label>
                <input
                  type="text"
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  placeholder={isEn ? "Enter notification headline..." : "Nhập tiêu đề nổi bật gửi đến người dùng..."}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Content / Body */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  {isEn ? "Message Body Content:" : "Nội dung chi tiết thông báo:"}
                </label>
                <textarea
                  rows={5}
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder={isEn ? "Type message body here..." : "Nhập toàn bộ nội dung thông báo cần truyền tải..."}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Schedule options */}
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-700">
                    <input
                      type="radio"
                      name="schedule"
                      checked={composeScheduleType === "now"}
                      onChange={() => setComposeScheduleType("now")}
                      className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>{isEn ? "Send Immediately" : "Gửi ngay bây giờ"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-700">
                    <input
                      type="radio"
                      name="schedule"
                      checked={composeScheduleType === "later"}
                      onChange={() => setComposeScheduleType("later")}
                      className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>{isEn ? "Schedule for later" : "Lên lịch phát sau"}</span>
                  </label>
                </div>

                {composeScheduleType === "later" && (
                  <input
                    type="datetime-local"
                    value={composeScheduleTime}
                    onChange={(e) => setComposeScheduleTime(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={handleRequestCloseComposer}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>
              <button
                onClick={handleSendCampaign}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isEn ? "Dispatch Campaign" : "Phát Lệnh Gửi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT REPORT MODAL */}
      {inspectCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-zinc-400">({inspectCampaign.id})</span>
                <h3 className="text-base font-black text-zinc-900 line-clamp-1">
                  {inspectCampaign.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectCampaign(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 block">
                  {isEn ? "Delivered Title" : "Tiêu đề phát đi"}
                </span>
                <h4 className="text-sm font-black text-zinc-900">{inspectCampaign.title}</h4>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-700 leading-relaxed">
                {inspectCampaign.content}
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">{isEn ? "Target" : "Đối tượng"}</span>
                  <span className="font-bold text-zinc-900 text-sm mt-0.5 block">{inspectCampaign.targetLabel}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">{isEn ? "Created By" : "Người khởi tạo"}</span>
                  <span className="font-bold text-zinc-800 text-sm mt-0.5 block">{inspectCampaign.createdBy}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">{isEn ? "Sent Count" : "Đã chuyển thành công"}</span>
                  <span className="font-black text-emerald-600 text-sm mt-0.5 block">{inspectCampaign.sentCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">{isEn ? "Failed Count" : "Số lượng thất bại"}</span>
                  <span className="font-black text-orange-600 text-sm mt-0.5 block">{inspectCampaign.failedCount}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">
                  {isEn ? "Active Channels" : "Các kênh đã truyền thông điệp"}
                </span>
                {renderChannelBadges(inspectCampaign.channels)}
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end">
              <button
                onClick={() => setInspectCampaign(null)}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {isEn ? "Close" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule #10: Custom Pop-up Confirmation Modal */}
      {confirmCloseModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-scaleIn">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                {isEn ? "Discard Campaign Draft?" : "Xác nhận đóng form"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {isEn
                  ? "You have unsaved campaign content. Are you sure you want to discard changes and close?"
                  : "Bạn có nội dung thông báo chưa gửi. Bạn có chắc muốn đóng và hủy các nội dung đã nhập?"}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {isEn ? "Continue Editing" : "Tiếp tục chỉnh sửa"}
              </button>
              <button
                onClick={confirmCloseModal.onDiscard}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors cursor-pointer shadow-2xs"
              >
                {isEn ? "Discard & Close" : "Hủy thay đổi & Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
