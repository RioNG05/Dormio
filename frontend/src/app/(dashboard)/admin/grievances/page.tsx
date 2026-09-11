"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  AlertTriangle, AlertCircle, CheckCircle2, XCircle, Search,
  Clock, Eye, LayoutGrid, Table as TableIcon, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, X, Check, Ban, RefreshCw
} from "lucide-react";
import { grievanceService, GrievanceQueueCounts } from "@/services/grievance.service";

interface GrievanceItem {
  id: string;
  tenantId?: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  boardingHouseId?: string;
  houseName: string;
  roomId?: string;
  roomNumber: string;
  landlordName: string;
  landlordPhone: string;
  category: "deposit" | "utilities" | "maintenance" | "security" | "contract" | "other";
  categoryLabel: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "resolved" | "rejected";
  title: string;
  description: string;
  evidenceImages: string[];
  createdAt: string;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export default function AdminGrievancesPage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  // Rule #9: Standardized View & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Grid is ALWAYS default
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for grid, 10 for table

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "urgent" | "high" | "medium" | "low">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "resolved" | "rejected">("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [inspectItem, setInspectItem] = useState<GrievanceItem | null>(null);
  const [resolveTargetItem, setResolveTargetItem] = useState<GrievanceItem | null>(null);
  const [actionType, setActionType] = useState<"resolve" | "reject">("resolve");
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");
  const [resolveError, setResolveError] = useState("");
  const [escalateLockLandlord, setEscalateLockLandlord] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Rule #10: Modal Reset Confirmation
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean;
    onDiscard: () => void;
  }>({ isOpen: false, onDiscard: () => {} });

  // Initial Mock Dataset
  const [grievances, setGrievances] = useState<GrievanceItem[]>([
    {
      id: "GRV-1092",
      tenantName: "Nguyễn Thị Mai",
      tenantPhone: "0912.345.678",
      tenantEmail: "mai.nguyen@gmail.com",
      landlordName: "Trần Đức Nam",
      landlordPhone: "0908.123.456",
      houseName: "Dormio Sunrise Q7",
      roomNumber: "P.302",
      category: "deposit",
      categoryLabel: isEn ? "Deposit Withholding" : "Không hoàn tiền cọc kết thúc HĐ",
      priority: "urgent",
      status: "pending",
      title: isEn ? "Landlord refuses to return 5M deposit after 30 days of contract end" : "Chủ trọ cố tình không trả 5 triệu tiền cọc dù đã bàn giao phòng 1 tháng",
      description: isEn
        ? "I completed the full 12-month contract, handed over room 302 in clean condition without damage. Landlord promised to refund via bank transfer within 3 days but has ignored calls and blocked my Zalo for 30 days."
        : "Em đã hoàn thành đủ hợp đồng 1 năm và bàn giao phòng sạch sẽ, biên bản không hư hỏng gì. Chủ trọ hẹn 3 ngày chuyển khoản trả cọc nhưng đến nay đã hơn 30 ngày vẫn không chuyển, gọi điện không bắt máy và chặn Zalo của em.",
      evidenceImages: [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&auto=format&fit=crop&q=80",
      ],
      createdAt: "2026-09-08 09:15",
    },
    {
      id: "GRV-1088",
      tenantName: "Lê Hoàng Phúc",
      tenantPhone: "0988.112.233",
      tenantEmail: "phuc.le@gmail.com",
      landlordName: "Võ Thị Bích",
      landlordPhone: "0934.998.877",
      houseName: "Ký túc xá Cao Lỗ",
      roomNumber: "P.104",
      category: "utilities",
      categoryLabel: isEn ? "Illegal Power Cut & Threat" : "Cắt điện vô cớ & đe dọa đuổi trọ",
      priority: "urgent",
      status: "pending",
      title: isEn ? "Power cut deliberately during heatwave without notice" : "Cắt cầu dao điện giữa trưa nắng gay gắt dù đã đóng đủ tiền phòng",
      description: isEn
        ? "I paid all rent and electricity bills on time. Because I asked for official meter photos, the landlord angrily cut the breaker to my room and threatened to throw my belongings on the street."
        : "Tôi đã nộp đủ tiền phòng và tiền điện nước theo hóa đơn. Khi tôi xin hình ảnh công tơ điện để đối soát thì chủ trọ mắng chửi, sau đó dập cầu dao điện phòng tôi và dọa vứt đồ ra đường nếu không thích ở.",
      evidenceImages: [
        "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80",
      ],
      createdAt: "2026-09-08 08:30",
    },
    {
      id: "GRV-1085",
      tenantName: "Phạm Hải Đăng",
      tenantPhone: "0909.876.543",
      tenantEmail: "dang.pham@yahoo.com",
      landlordName: "Đặng Quốc Cường",
      landlordPhone: "0918.445.566",
      houseName: "Nhà trọ Thảo Điền Garden",
      roomNumber: "P.201",
      category: "maintenance",
      categoryLabel: isEn ? "Severe Ceiling Leak" : "Dột trần nghiêm trọng hỏng đồ đạc",
      priority: "high",
      status: "in_progress",
      title: isEn ? "Rainwater leaks heavily onto bed and laptop, landlord ignores for 2 weeks" : "Trần nhà dột nước xối xả làm hỏng máy tính, báo 2 tuần không sửa",
      description: isEn
        ? "During the recent heavy rains, water poured through the ceiling plaster directly onto my work desk and bed. I reported it repeatedly but the landlord refuses to fix the roof."
        : "Mùa mưa nước từ trần nhà chảy thành dòng xuống giường và bàn làm việc làm ướt hỏng laptop. Em đã chụp ảnh gửi chủ trọ 4 lần nhưng họ chỉ ậm ừ và bảo tự che bạt.",
      evidenceImages: [
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
      ],
      createdAt: "2026-09-07 14:20",
    },
    {
      id: "GRV-1079",
      tenantName: "Trần Bảo Vy",
      tenantPhone: "0966.554.433",
      tenantEmail: "vy.tran@gmail.com",
      landlordName: "Nguyễn Văn Hùng",
      landlordPhone: "0988.765.432",
      houseName: "Nhà trọ Hưng Thịnh",
      roomNumber: "P.12",
      category: "contract",
      categoryLabel: isEn ? "Arbitrary Rent Hike" : "Tự ý tăng giá tiền phòng giữa hợp đồng",
      priority: "medium",
      status: "pending",
      title: isEn ? "Arbitrary rent increase of 500k contrary to signed contract" : "Tăng tiền phòng thêm 500k trái với thỏa thuận hợp đồng còn hiệu lực 6 tháng",
      description: isEn
        ? "Contract signed at 3,200,000 VND fixed for 1 year until Feb 2027. Landlord sent an SMS asking for 3,700,000 VND starting this month or vacate within 3 days."
        : "Hợp đồng ký cam kết giá 3.200.000 ₫ cố định trong 1 năm đến tháng 02/2027. Tháng này chủ trọ gửi tin nhắn đòi thu 3.700.000 ₫, nếu không đồng ý thì yêu cầu dọn đi trong 3 ngày.",
      evidenceImages: [],
      createdAt: "2026-09-06 18:00",
    },
    {
      id: "GRV-1070",
      tenantName: "Vũ Tuấn Anh",
      tenantPhone: "0972.334.455",
      tenantEmail: "anh.vu@gmail.com",
      landlordName: "Hoàng Văn Tuấn",
      landlordPhone: "0944.556.677",
      houseName: "Dormio Green Hanoi",
      roomNumber: "P.405",
      category: "security",
      categoryLabel: isEn ? "Building Door Lock Broken" : "Cửa từ an ninh tòa nhà bị hỏng kéo dài",
      priority: "low",
      status: "resolved",
      title: isEn ? "Building entrance door kept open at night due to broken sensor" : "Cửa từ chính ra vào ban đêm không khóa được do hư cảm biến",
      description: isEn
        ? "The entrance smart lock has been unlatched for 10 days, allowing strangers to walk in freely. Requested prompt repair for security."
        : "Cửa từ tòa nhà bị kẹt không tự khóa được, người lạ có thể tự do ra vào tầng trọ lúc nửa đêm. Đề nghị ban quản lý thay chốt.",
      evidenceImages: [],
      createdAt: "2026-09-04 10:10",
      resolutionNote: isEn
        ? "Contacted landlord to send technician. Lock was replaced on Sept 5. Tenant confirmed fixed."
        : "Admin đã liên hệ chủ trọ điều phối thợ sửa khóa. Đã hoàn tất thay thế bo mạch cảm ứng ngày 05/09. Khách thuê đã xác nhận hoạt động tốt.",
      resolvedAt: "2026-09-05 16:30",
      resolvedBy: "Admin Quản Trị",
    },
    {
      id: "GRV-1065",
      tenantName: "Dương Quốc Bảo",
      tenantPhone: "0938.887.766",
      tenantEmail: "bao.duong@gmail.com",
      landlordName: "Lê Minh Tuấn",
      landlordPhone: "0901.234.567",
      houseName: "Dormio Signature Q1",
      roomNumber: "P.204",
      category: "deposit",
      categoryLabel: isEn ? "Bait and Switch Room" : "Phòng thực tế khác xa trên hình",
      priority: "high",
      status: "resolved",
      title: isEn ? "Received dark basement room instead of booked sunny balcony room" : "Nhận phòng tối tăm ẩm thấp, khác hoàn toàn hình ảnh ban công lúc cọc",
      description: isEn
        ? "I transferred 2M deposit through the app for Room 204 with a balcony. When moving in, landlord said room 204 is taken and forced me to stay in a windowless room."
        : "Tôi cọc giữ chỗ 2 triệu qua ứng dụng cho phòng có ban công. Đến ngày dọn vào thì chủ bảo phòng đó người khác ở rồi, bắt tôi ở phòng không có cửa sổ dưới tầng hầm.",
      evidenceImages: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80",
      ],
      createdAt: "2026-09-03 11:45",
      resolutionNote: isEn
        ? "Mediated between both parties. Platform refunded 100% of deposit back to tenant. Landlord listing penalized."
        : "Admin đã làm việc với hai bên: Yêu cầu chủ trọ trả lại phòng ban công hoặc hoàn cọc 100%. Chủ trọ đã đồng ý hoàn trả toàn bộ 2.000.000 ₫ cọc qua ví nền tảng. Tin đăng của chủ trọ bị đưa vào diện giám sát.",
      resolvedAt: "2026-09-03 17:15",
      resolvedBy: "Admin Quản Trị",
    },
    {
      id: "GRV-1052",
      tenantName: "Lý Gia Hân",
      tenantPhone: "0915.223.344",
      tenantEmail: "han.ly@gmail.com",
      landlordName: "Phạm Thu Thảo",
      landlordPhone: "0933.112.233",
      houseName: "Nhà trọ Bình Thạnh 18",
      roomNumber: "P.03",
      category: "deposit",
      categoryLabel: isEn ? "Deposit Scam" : "Lừa đảo tiền cọc xem phòng",
      priority: "urgent",
      status: "rejected",
      title: isEn ? "Grievance against unregistered external listing" : "Yêu cầu bồi thường cọc chuyển khoản ngoài không qua hệ thống",
      description: isEn
        ? "I found a Facebook listing claiming to be Dormio and sent 1M to personal bank. Found out it was a scammer."
        : "Em tìm thấy tin đăng trên Facebook mạo danh Dormio và chuyển cọc 1 triệu qua tài khoản lạ, sau đó bị lừa. Em muốn Dormio bồi thường.",
      evidenceImages: [],
      createdAt: "2026-09-01 09:00",
      resolutionNote: isEn
        ? "Rejected: Transaction occurred entirely on Facebook without any contract or escrow booking on Dormio. Advised tenant to report to local cyber police."
        : "Từ chối xử lý hoàn cọc: Giao dịch diễn ra hoàn toàn ngoài nền tảng (trên Facebook cá nhân), không có mã hợp đồng hay giao dịch cọc giữ chỗ của Dormio. Đã hướng dẫn người dùng thu thập chứng từ báo công an khu vực.",
      resolvedAt: "2026-09-01 14:00",
      resolvedBy: "Admin Quản Trị",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [liveCounts, setLiveCounts] = useState<GrievanceQueueCounts | null>(null);

  const fetchLiveGrievances = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await grievanceService.getAdminGrievanceQueue({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? (priorityFilter === "urgent" ? "high" : priorityFilter) : undefined,
        search: searchQuery.trim() || undefined,
        page: 1,
        limit: 100, // Fetch up to 100 for comprehensive client-side operations
      });

      if (res && res.items && res.items.length > 0) {
        const mapped: GrievanceItem[] = res.items.map((item) => ({
          id: item.id,
          tenantId: item.tenantId,
          tenantName: item.tenantName,
          tenantPhone: item.tenantPhone,
          tenantEmail: item.tenantEmail,
          boardingHouseId: item.boardingHouseId,
          houseName: item.boardingHouseName,
          roomId: item.roomId,
          roomNumber: item.roomNumber,
          landlordName: item.landlordName,
          landlordPhone: item.landlordPhone,
          category: "deposit",
          categoryLabel: isEn ? "Grievance / Dispute" : "Khiếu nại / Tranh chấp",
          priority: item.priority === "high" ? "urgent" : item.priority,
          status: item.status,
          title: item.title,
          description: item.description,
          evidenceImages: (item.images || []).map((img) => img.url),
          createdAt: item.createdAt.replace("T", " ").substring(0, 16),
          resolutionNote: item.resolutionNote || undefined,
          resolvedAt: item.resolvedAt ? item.resolvedAt.replace("T", " ").substring(0, 16) : undefined,
          resolvedBy: item.resolvedByName || undefined,
        }));
        setGrievances(mapped);
        if (res.counts) setLiveCounts(res.counts);
      }
    } catch (err) {
      console.warn("Failed to fetch live grievances queue, keeping fallback:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, priorityFilter, searchQuery, isEn]);

  useEffect(() => {
    fetchLiveGrievances();
  }, [fetchLiveGrievances]);

  // Filtered dataset
  const currentDataset = useMemo(() => {
    return grievances.filter((item) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.tenantName.toLowerCase().includes(q) ||
        item.tenantPhone.includes(q) ||
        item.landlordName.toLowerCase().includes(q) ||
        item.houseName.toLowerCase().includes(q) ||
        item.roomNumber.toLowerCase().includes(q);

      // Priority
      const matchPriority = priorityFilter === "all" || item.priority === priorityFilter;

      // Status
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchPriority && matchStatus;
    });
  }, [grievances, searchQuery, priorityFilter, statusFilter]);

  // View mode & pagination
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

  // Selection on current page
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

  // Open Resolution Modal
  const handleOpenResolveModal = (item: GrievanceItem, type: "resolve" | "reject") => {
    setResolveTargetItem(item);
    setActionType(type);
    setResolutionNoteInput(item.resolutionNote || "");
    setResolveError("");
    setEscalateLockLandlord(false);
  };

  // Confirm Resolution
  const handleConfirmResolution = async () => {
    if (!resolveTargetItem) return;

    if (!resolutionNoteInput.trim()) {
      setResolveError(isEn ? "Please enter a resolution note or audit explanation." : "Vui lòng nhập kết luận xử lý / ghi chú giải quyết.");
      return;
    }

    try {
      if (actionType === "resolve") {
        await grievanceService.resolveGrievance(resolveTargetItem.id, {
          resolutionNote: resolutionNoteInput.trim(),
          escalateLockLandlord,
        });
      } else {
        await grievanceService.rejectGrievance(resolveTargetItem.id, {
          resolutionNote: resolutionNoteInput.trim(),
        });
      }
    } catch (err) {
      console.warn("API call failed, updating locally:", err);
    }

    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);

    setGrievances((prev) =>
      prev.map((g) =>
        g.id === resolveTargetItem.id
          ? {
              ...g,
              status: actionType === "resolve" ? "resolved" : "rejected",
              resolutionNote: resolutionNoteInput.trim(),
              resolvedAt: nowStr,
              resolvedBy: "Admin Quản Trị",
            }
          : g
      )
    );

    setResolveTargetItem(null);
    setResolutionNoteInput("");
    setResolveError("");
  };

  // Mark In-Progress handler
  const handleMarkInProgress = async (item: GrievanceItem) => {
    try {
      await grievanceService.updateGrievanceInProgress(item.id);
    } catch (err) {
      console.warn("Failed to mark in-progress:", err);
    }

    setGrievances((prev) =>
      prev.map((g) => (g.id === item.id ? { ...g, status: "in_progress" } : g))
    );

    if (inspectItem?.id === item.id) {
      setInspectItem((prev) => (prev ? { ...prev, status: "in_progress" } : null));
    }
  };

  // Rule #10: Modal close with unsaved confirmation
  const handleRequestCloseResolveModal = () => {
    const initialNote = resolveTargetItem?.resolutionNote || "";
    const hasChanged = resolutionNoteInput.trim() !== initialNote.trim() || escalateLockLandlord;

    if (hasChanged && (resolutionNoteInput.trim().length > 0 || escalateLockLandlord)) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setResolveTargetItem(null);
          setResolutionNoteInput("");
          setResolveError("");
          setEscalateLockLandlord(false);
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} });
        },
      });
    } else {
      setResolveTargetItem(null);
      setResolutionNoteInput("");
      setResolveError("");
      setEscalateLockLandlord(false);
    }
  };

  // Helper badge renderers
  const renderPriorityBadge = (p: GrievanceItem["priority"]) => {
    switch (p) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-600 text-white uppercase tracking-wider animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            {isEn ? "URGENT" : "KHẨN CẤP"}
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white uppercase tracking-wider">
            {isEn ? "HIGH" : "CAO"}
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 uppercase tracking-wider">
            {isEn ? "MEDIUM" : "TRUNG BÌNH"}
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-600 uppercase tracking-wider">
            {isEn ? "LOW" : "THẤP"}
          </span>
        );
    }
  };

  const renderStatusBadge = (s: GrievanceItem["status"]) => {
    switch (s) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            {isEn ? "PENDING" : "CHỜ XỬ LÝ"}
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            {isEn ? "IN PROGRESS" : "ĐANG XỬ LÝ"}
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            {isEn ? "RESOLVED" : "ĐÃ GIẢI QUYẾT"}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-700 border border-zinc-200">
            <XCircle className="w-3 h-3" />
            {isEn ? "REJECTED" : "TỪ CHỐI"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wide uppercase">
              <AlertTriangle className="w-3.5 h-3.5" />
              {isEn ? "Tenant Grievance Queue" : "Quản Lý Khiếu Nại Tenant"}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              • {isEn ? "Prioritized dispute resolution" : "Hàng đợi xử lý tranh chấp ưu tiên"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {isEn ? "Tenant Grievances & Dispute Resolution" : "Hồ Sơ Khiếu Nại & Tranh Chấp Thuê Trọ"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isEn
              ? "Investigate complaints reported by tenants regarding deposits, unjust eviction, power cuts, or unlivable facilities."
              : "Tiếp nhận và xử lý mâu thuẫn giữa khách thuê và chủ trọ về tiền cọc, tự ý cắt điện nước, tăng giá phòng hoặc hư hại không sửa."}
          </p>
        </div>

        {/* Priority KPI summary */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-800">
            <span className="text-[10px] font-black uppercase tracking-wider block text-orange-600">
              {isEn ? "Urgent Queue" : "Khẩn cấp"}
            </span>
            <span className="text-lg font-black leading-tight block">
              {liveCounts ? liveCounts.urgent : grievances.filter((g) => g.priority === "urgent" && g.status === "pending").length} {isEn ? "cases" : "vụ việc"}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800">
            <span className="text-[10px] font-black uppercase tracking-wider block text-amber-600">
              {isEn ? "Pending Total" : "Tổng chờ xử lý"}
            </span>
            <span className="text-lg font-black leading-tight block">
              {liveCounts ? liveCounts.pending : grievances.filter((g) => g.status === "pending").length} {isEn ? "cases" : "vụ việc"}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, View Mode (Rule #9) */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={isEn ? "Search tenant, phone, house, room..." : "Tìm khách thuê, SĐT, nhà trọ, số phòng..."}
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

          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {(
              [
                { id: "all", label: isEn ? "All Priorities" : "Tất cả mức độ" },
                { id: "urgent", label: isEn ? "Urgent" : "Khẩn cấp" },
                { id: "high", label: isEn ? "High" : "Cao" },
                { id: "medium", label: isEn ? "Medium" : "Trung bình" },
                { id: "low", label: isEn ? "Low" : "Thấp" },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                onClick={() => {
                  setPriorityFilter(chip.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  priorityFilter === chip.id
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {(
              [
                { id: "all", label: isEn ? "All Status" : "Tất cả trạng thái" },
                { id: "pending", label: isEn ? "Pending" : "Chờ xử lý" },
                { id: "in_progress", label: isEn ? "In Progress" : "Đang xử lý" },
                { id: "resolved", label: isEn ? "Resolved" : "Đã giải quyết" },
                { id: "rejected", label: isEn ? "Rejected" : "Đã từ chối" },
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
        </div>

        {/* View mode toggle (Rule #9) & Refresh */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto">
          <button
            onClick={() => fetchLiveGrievances(true)}
            disabled={refreshing || loading}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
            title={isEn ? "Refresh queue" : "Làm mới danh sách"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-orange-600" : ""}`} />
            <span className="hidden sm:inline">{isEn ? "Refresh" : "Làm mới"}</span>
          </button>
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
            <span>
              {isEn ? "Select all on this page" : "Chọn tất cả trên trang này"}
            </span>
          </label>
          <span>
            {isEn
              ? `Showing ${paginatedItems.length} of ${totalItems} grievances`
              : `Hiển thị ${paginatedItems.length} trên ${totalItems} khiếu nại`}
          </span>
        </div>
      )}

      {/* List content */}
      {paginatedItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">
            {isEn ? "No grievances match your criteria" : "Không có khiếu nại nào theo bộ lọc"}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {isEn
              ? "All caught up or try clearing your search query and priority filters."
              : "Tất cả khiếu nại đã được xử lý hoặc thử điều chỉnh từ khóa tìm kiếm."}
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setPriorityFilter("all");
              setStatusFilter("all");
            }}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isEn ? "Reset filters" : "Đặt lại bộ lọc"}
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9: Default 6 items) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isUrgent = item.priority === "urgent";

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md p-5 space-y-4 ${
                  isUrgent && item.status === "pending"
                    ? "border-orange-300 bg-orange-50/15 ring-1 ring-orange-200"
                    : isSelected
                    ? "border-orange-500 ring-2 ring-orange-500/20"
                    : "border-zinc-200/90"
                }`}
              >
                {/* Card Top */}
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
                    <div className="flex items-center gap-1.5">
                      {renderPriorityBadge(item.priority)}
                      {renderStatusBadge(item.status)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-zinc-900 line-clamp-2 hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>
                    <span className="inline-block mt-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      🏷️ {item.categoryLabel}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Evidence thumbnails */}
                  {item.evidenceImages.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-zinc-400">
                        {isEn ? "Proof:" : "Minh chứng:"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {item.evidenceImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPreviewImage(img)}
                            className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 hover:scale-105 transition-transform cursor-pointer"
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parties involved */}
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-semibold">{isEn ? "Tenant:" : "Khách thuê:"}</span>
                      <span className="font-bold text-zinc-900">{item.tenantName} ({item.tenantPhone})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-semibold">{isEn ? "Property:" : "Nhà & Phòng:"}</span>
                      <span className="font-semibold text-zinc-800">{item.houseName} • {item.roomNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-semibold">{isEn ? "Landlord:" : "Chủ trọ:"}</span>
                      <span className="font-semibold text-zinc-800">{item.landlordName}</span>
                    </div>
                  </div>

                  {/* Resolution note preview if resolved */}
                  {item.resolutionNote && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="font-black text-[11px] uppercase flex items-center gap-1 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isEn ? "Official Resolution Conclusion:" : "Kết luận giải quyết:"}
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-2">
                        {item.resolutionNote}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
                  <button
                    onClick={() => setInspectItem(item)}
                    className="flex-1 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{isEn ? "Details" : "Chi tiết"}</span>
                  </button>

                  {item.status === "pending" || item.status === "in_progress" ? (
                    <>
                      <button
                        onClick={() => handleOpenResolveModal(item, "reject")}
                        className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
                        title={isEn ? "Reject grievance" : "Từ chối xử lý"}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenResolveModal(item, "resolve")}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isEn ? "Resolve" : "Xử lý"}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpenResolveModal(item, "resolve")}
                      className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      {isEn ? "Edit Note" : "Sửa kết luận"}
                    </button>
                  )}
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
                <th className="p-3.5">{isEn ? "Code & Priority" : "Mã & Độ ưu tiên"}</th>
                <th className="p-3.5">{isEn ? "Grievance Subject" : "Nội dung khiếu nại"}</th>
                <th className="p-3.5">{isEn ? "Tenant & Landlord" : "Khách thuê / Chủ trọ"}</th>
                <th className="p-3.5">{isEn ? "Status" : "Trạng thái"}</th>
                <th className="p-3.5 text-right">{isEn ? "Actions" : "Hành động"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);

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

                    <td className="p-3.5 space-y-1">
                      <span className="font-mono text-xs font-black text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md inline-block">
                        {item.id}
                      </span>
                      <div>{renderPriorityBadge(item.priority)}</div>
                      <div className="text-[10px] text-zinc-400">{item.createdAt}</div>
                    </td>

                    <td className="p-3.5 max-w-xs space-y-1">
                      <div className="font-bold text-zinc-900 line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 line-clamp-2 leading-tight">
                        {item.description}
                      </div>
                      <span className="inline-block text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        {item.categoryLabel}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <div className="font-bold text-zinc-900">
                          {item.tenantName}{" "}
                          <span className="text-zinc-400 font-normal">({item.tenantPhone})</span>
                        </div>
                        <div className="text-[11px] text-zinc-600">
                          {item.houseName} • <span className="font-bold">{item.roomNumber}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {isEn ? "Landlord:" : "Chủ:"} {item.landlordName} ({item.landlordPhone})
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      {renderStatusBadge(item.status)}
                    </td>

                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setInspectItem(item)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                        title={isEn ? "View details" : "Xem chi tiết"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {item.status === "pending" || item.status === "in_progress" ? (
                        <button
                          onClick={() => handleOpenResolveModal(item, "resolve")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          {isEn ? "Resolve" : "Xử lý"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenResolveModal(item, "resolve")}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 font-bold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                        >
                          {isEn ? "Note" : "Ghi chú"}
                        </button>
                      )}
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
            {isEn ? `of ${totalItems} grievances` : `trên ${totalItems} khiếu nại`}
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

      {/* INSPECT DETAIL MODAL */}
      {inspectItem && (
        <div
          onClick={() => setInspectItem(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col cursor-default"
          >
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <h2 className="text-base font-black text-zinc-900">
                  {isEn ? "Grievance Dossier & Evidence" : "Hồ Sơ Khiếu Nại & Minh Chứng"}
                </h2>
                <span className="font-mono text-xs font-bold text-zinc-400">({inspectItem.id})</span>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {renderPriorityBadge(inspectItem.priority)}
                  <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    {inspectItem.categoryLabel}
                  </span>
                </div>
                <span className="text-zinc-400 font-medium">{inspectItem.createdAt}</span>
              </div>

              <div>
                <h3 className="text-base font-black text-zinc-900 leading-snug">
                  {inspectItem.title}
                </h3>
              </div>

              {/* Parties summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                    {isEn ? "Complainant (Tenant)" : "Người khiếu nại (Khách thuê)"}
                  </span>
                  <div className="font-bold text-zinc-900 text-sm">{inspectItem.tenantName}</div>
                  <div className="text-zinc-600 font-mono">{inspectItem.tenantPhone}</div>
                  <div className="text-zinc-400">{inspectItem.tenantEmail}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                    {isEn ? "Accused Landlord & Property" : "Chủ trọ & Cơ sở bị phản ánh"}
                  </span>
                  <div className="font-bold text-zinc-900 text-sm">{inspectItem.landlordName}</div>
                  <div className="text-zinc-600 font-mono">{inspectItem.landlordPhone}</div>
                  <div className="text-zinc-700 font-semibold">{inspectItem.houseName} ({inspectItem.roomNumber})</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">
                  {isEn ? "Detailed Description from Tenant:" : "Nội dung phản ánh chi tiết từ khách:"}
                </h4>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-zinc-700 leading-relaxed">
                  {inspectItem.description}
                </div>
              </div>

              {/* Evidence Images */}
              {inspectItem.evidenceImages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">
                    {isEn ? "Evidence Photos & Documents:" : "Hình ảnh & Biên bản làm bằng chứng:"}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {inspectItem.evidenceImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImage(img)}
                        className="h-32 rounded-xl overflow-hidden border border-zinc-200 cursor-pointer group relative"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                          {isEn ? "Enlarge" : "Phóng to"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Resolution Note */}
              {inspectItem.resolutionNote && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-black text-xs uppercase flex items-center gap-1 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    {isEn ? "Recorded Admin Resolution:" : "Kết luận & Hướng giải quyết của Admin:"}
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {inspectItem.resolutionNote}
                  </p>
                  {inspectItem.resolvedAt && (
                    <span className="text-[10px] text-emerald-700 block">
                      {isEn ? `Resolved at: ${inspectItem.resolvedAt} by ${inspectItem.resolvedBy}` : `Xử lý lúc: ${inspectItem.resolvedAt} bởi ${inspectItem.resolvedBy}`}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {isEn ? "Close" : "Đóng"}
              </button>

              {inspectItem.status === "pending" && (
                <button
                  onClick={() => handleMarkInProgress(inspectItem)}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isEn ? "Mark Investigating" : "Đang điều tra"}</span>
                </button>
              )}

              {inspectItem.status !== "resolved" && inspectItem.status !== "rejected" && (
                <button
                  onClick={() => {
                    const target = inspectItem;
                    setInspectItem(null);
                    handleOpenResolveModal(target, "resolve");
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{isEn ? "Take Resolution Action" : "Đưa ra Kết luận Xử lý"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL (Rule #10 compliant) */}
      {resolveTargetItem && (
        <div
          onClick={handleRequestCloseResolveModal}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleIn cursor-default"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    actionType === "resolve" ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-700"
                  }`}>
                    {actionType === "resolve" ? <CheckCircle2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900">
                      {actionType === "resolve"
                        ? (isEn ? "Resolve Tenant Grievance" : "Xác Nhận Giải Quyết Khiếu Nại")
                        : (isEn ? "Reject Tenant Grievance" : "Từ Chối Giải Quyết Khiếu Nại")}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">
                      {resolveTargetItem.id} • {resolveTargetItem.tenantName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRequestCloseResolveModal}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Type switcher */}
              <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActionType("resolve")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    actionType === "resolve" ? "bg-white text-emerald-700 shadow-2xs" : "text-zinc-500"
                  }`}
                >
                  {isEn ? "Approve / Resolve" : "Giải quyết thỏa đáng"}
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("reject")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    actionType === "reject" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500"
                  }`}
                >
                  {isEn ? "Reject / Invalid" : "Từ chối / Khiếu nại sai"}
                </button>
              </div>

              {resolveError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{resolveError}</span>
                </div>
              )}

              {/* Resolution note input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">
                  {isEn ? "Resolution Note & Verdict (Mandatory):" : "Kết luận & Hướng giải quyết (Bắt buộc):"}
                </label>
                <textarea
                  rows={4}
                  value={resolutionNoteInput}
                  onChange={(e) => setResolutionNoteInput(e.target.value)}
                  placeholder={
                    actionType === "resolve"
                      ? (isEn
                          ? "State clear findings, mediation agreement, refund amount (if any), or landlord rectification deadline..."
                          : "Ghi rõ thỏa thuận hai bên: Yêu cầu chủ trọ hoàn cọc, sửa chữa thiết bị trước ngày nào, hoặc nền tảng trích quỹ bảo lãnh...")
                      : (isEn
                          ? "Explain why the grievance is invalid or outside the jurisdiction of the platform..."
                          : "Giải thích rõ lý do từ chối: Giao dịch ngoài nền tảng, hoặc khách thuê vi phạm điều khoản hợp đồng trước...")
                  }
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Escalation Checkbox */}
              {actionType === "resolve" && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50/60 border border-orange-200/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={escalateLockLandlord}
                    onChange={(e) => setEscalateLockLandlord(e.target.checked)}
                    className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500 mt-0.5 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-orange-900 block">
                      {isEn ? "Escalate & Suspend Landlord's Listing" : "Chuyển kiểm duyệt khóa tin đăng của Chủ trọ này"}
                    </span>
                    <span className="text-orange-700 font-medium text-[11px]">
                      {isEn
                        ? "Automatically flag this boarding house in Moderation module for policy violation audit."
                        : "Tự động đánh dấu cơ sở này trong mô-đun Kiểm duyệt để khóa phòng tránh lừa thêm khách khác."}
                    </span>
                  </div>
                </label>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={handleRequestCloseResolveModal}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>
              <button
                onClick={handleConfirmResolution}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 ${
                  actionType === "resolve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-zinc-900 hover:bg-zinc-800"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEn ? "Save Verdict" : "Lưu Kết Luận"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW ENLARGED IMAGE */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-3xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Evidence" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Rule #10: Custom Pop-up Confirmation Modal */}
      {confirmCloseModal.isOpen && (
        <div
          onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-scaleIn cursor-default"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                {isEn ? "Discard Resolution Draft?" : "Xác nhận đóng form"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {isEn
                  ? "You have unsaved resolution notes. Are you sure you want to discard changes and close?"
                  : "Bạn có ghi chú xử lý chưa lưu. Bạn có chắc muốn đóng và hủy các nội dung đã nhập?"}
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
