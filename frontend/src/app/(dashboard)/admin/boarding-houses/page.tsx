"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import {
  Building2, Search, Lock, Unlock, Eye,
  AlertTriangle, CheckCircle2, LayoutGrid, Table as TableIcon,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MapPin, Phone, Mail, X, RefreshCw, ShieldAlert,
} from "lucide-react";

export interface HouseModerationItem {
  id: string;
  name: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  address: string;
  totalRooms: number;
  occupiedRooms: number;
  status: "active" | "locked" | "reported";
  reportsCount: number;
  reportReasons: string[];
  lockReason?: string;
  lockedAt?: string;
  createdAt: string;
  coverImage: string;
}

export default function AdminBoardingHouseModerationPage() {
  const { locale } = useLanguage();
  const t = useTranslations("admin");

  // Initial Real/Sample Dataset for Boarding House Moderation
  const [houses, setHouses] = useState<HouseModerationItem[]>([
    {
      id: "BH-1001",
      name: "Dormio Signature Premium Q1",
      landlordName: "Lê Minh Tuấn",
      landlordPhone: "0901.234.567",
      landlordEmail: "tuan.le@gmail.com",
      address: "128 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM",
      totalRooms: 20,
      occupiedRooms: 18,
      status: "reported",
      reportsCount: 4,
      reportReasons: [
        locale === "en" ? "Self-arbitrary electricity price surge beyond contract" : "Tự ý thu tiền điện 5.000đ/kWh trái thỏa thuận hợp đồng",
        locale === "en" ? "Unresolved water leakage in multiple rooms" : "Thấm dột nhà vệ sinh kéo dài không khắc phục",
      ],
      createdAt: "2026-08-15",
      coverImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "BH-1002",
      name: "Nhà Trọ Hưng Thịnh Thủ Đức",
      landlordName: "Nguyễn Văn Hùng",
      landlordPhone: "0988.765.432",
      landlordEmail: "hung.nguyen@yahoo.com",
      address: "45 Đường D1, Phường Tăng Nhơn Phú A, TP. Thủ Đức",
      totalRooms: 35,
      occupiedRooms: 32,
      status: "active",
      reportsCount: 0,
      reportReasons: [],
      createdAt: "2026-07-20",
      coverImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "BH-1003",
      name: "Ký Túc Xá Sinh Viên Xanh Cầu Giấy",
      landlordName: "Hoàng Văn Tuấn",
      landlordPhone: "0944.556.677",
      landlordEmail: "tuan.hoang@gmail.com",
      address: "88 Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
      totalRooms: 15,
      occupiedRooms: 14,
      status: "active",
      reportsCount: 0,
      reportReasons: [],
      createdAt: "2026-06-10",
      coverImage: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "BH-1004",
      name: "Tòa Nhà Cho Thuê Bình Thạnh 18",
      landlordName: "Phạm Thu Thảo",
      landlordPhone: "0933.112.233",
      landlordEmail: "thao.pham@gmail.com",
      address: "220/15 Xô Viết Nghệ Tĩnh, Phường 21, Bình Thạnh, TP.HCM",
      totalRooms: 12,
      occupiedRooms: 2,
      status: "locked",
      reportsCount: 9,
      reportReasons: [
        locale === "en" ? "Violation of fire safety code" : "Vi phạm nghiêm trọng an toàn PCCC, bị đình chỉ",
        locale === "en" ? "Refusal to refund valid tenant deposits" : "Không hoàn trả tiền đặt cọc khi chấm dứt hợp đồng",
      ],
      lockReason: locale === "en" ? "Fire safety violation & deposit dispute" : "Đình chỉ do vi phạm an toàn PCCC và chiếm dụng tiền cọc của khách",
      lockedAt: "2026-09-05",
      createdAt: "2026-05-12",
      coverImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "BH-1005",
      name: "Dormio Airport Suites Tân Bình",
      landlordName: "Trần Bảo Ngọc",
      landlordPhone: "0977.889.900",
      landlordEmail: "ngoc.tran@gmail.com",
      address: "15 Bạch Đằng, Phường 2, Tân Bình, TP.HCM",
      totalRooms: 24,
      occupiedRooms: 20,
      status: "active",
      reportsCount: 0,
      reportReasons: [],
      createdAt: "2026-08-01",
      coverImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "BH-1006",
      name: "Nhà Trọ Thanh Xuân Eco Home",
      landlordName: "Vũ Mai Linh",
      landlordPhone: "0911.223.344",
      landlordEmail: "linh.vu@gmail.com",
      address: "91 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội",
      totalRooms: 18,
      occupiedRooms: 15,
      status: "reported",
      reportsCount: 2,
      reportReasons: [
        locale === "en" ? "Noise pollution during night hours" : "Chủ trọ không can thiệp tiếng ồn ban đêm gây ảnh hưởng sinh hoạt",
      ],
      createdAt: "2026-07-15",
      coverImage: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop&q=80",
    },
  ]);

  const [refreshing, setRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Rule #9: Standardized View & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Grid default
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked" | "reported">("all");

  // Lock Modal State
  const [lockTarget, setLockTarget] = useState<HouseModerationItem | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [lockReasonError, setLockReasonError] = useState("");
  const [isLocking, setIsLocking] = useState(false);

  // Unlock Modal State
  const [unlockTarget, setUnlockTarget] = useState<HouseModerationItem | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Rule #10: Modal Reset Confirmation Pop-up
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean;
    onDiscard: () => void;
  }>({ isOpen: false, onDiscard: () => {} });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setFeedbackMsg({ type: "success", text: t("adminBlogsRefresh") });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }, 500);
  };

  // Filtered dataset
  const filteredHouses = useMemo(() => {
    return houses.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.landlordName.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || h.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [houses, searchQuery, statusFilter]);

  // View mode change (Rule #9)
  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    setPageSize(mode === "grid" ? 6 : 10);
    setCurrentPage(1);
  };

  const totalItems = filteredHouses.length;
  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === "grid" ? 6 : 10));
  const totalPages = Math.max(1, Math.ceil(totalItems / validPageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedHouses = useMemo(() => {
    const start = (safeCurrentPage - 1) * validPageSize;
    return filteredHouses.slice(start, start + validPageSize);
  }, [filteredHouses, safeCurrentPage, validPageSize]);

  // 5-page window jumping
  const windowStart = Math.floor((safeCurrentPage - 1) / 5) * 5 + 1;
  const windowEnd = Math.min(windowStart + 4, totalPages);
  const pageNumbers = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i);
  }

  // Lock handler
  const handleOpenLock = (item: HouseModerationItem) => {
    setLockTarget(item);
    setLockReason(t("adminHouseModLockPresetDefault"));
    setLockReasonError("");
  };

  const handleConfirmLock = () => {
    if (!lockTarget) return;
    if (!lockReason.trim()) {
      setLockReasonError(t("adminHouseModLockReasonRequired"));
      return;
    }
    setIsLocking(true);
    setTimeout(() => {
      setHouses((prev) =>
        prev.map((h) => (h.id === lockTarget.id ? { ...h, status: "locked", lockReason: lockReason.trim() } : h))
      );
      setLockTarget(null);
      setLockReason("");
      setIsLocking(false);
      setFeedbackMsg({ type: "success", text: t("adminHouseModLockSuccess") });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }, 400);
  };

  // Unlock handler
  const handleOpenUnlock = (item: HouseModerationItem) => {
    setUnlockTarget(item);
  };

  const handleConfirmUnlock = () => {
    if (!unlockTarget) return;
    setIsUnlocking(true);
    setTimeout(() => {
      setHouses((prev) =>
        prev.map((h) => (h.id === unlockTarget.id ? { ...h, status: "active", lockReason: undefined } : h))
      );
      setUnlockTarget(null);
      setIsUnlocking(false);
      setFeedbackMsg({ type: "success", text: t("adminHouseModUnlockSuccess") });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }, 400);
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wide uppercase">
              <Building2 className="w-3.5 h-3.5" />
              {t("adminHouseModBadge")}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              • {t("adminBlogsLiveDb")}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {t("adminHouseModTitle")}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {t("adminHouseModSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 font-bold text-xs transition-all shadow-2xs cursor-pointer"
            title={t("adminBlogsRefresh")}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-bold">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar */}
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
              placeholder={t("adminHouseModSearchPlaceholder")}
              className="w-full pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {(
              [
                { id: "all", label: t("adminModFilterAll") },
                { id: "active", label: t("adminHouseModStatusActive") },
                { id: "locked", label: t("adminHouseModStatusLocked") },
                { id: "reported", label: t("adminHouseModStatusReported") },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                onClick={() => {
                  setStatusFilter(chip.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === chip.id
                    ? chip.id === "locked"
                      ? "bg-red-600 text-white shadow-2xs"
                      : chip.id === "reported"
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {chip.id === "locked" && <Lock className="w-3 h-3" />}
                {chip.id === "reported" && <AlertTriangle className="w-3 h-3" />}
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-orange-600 shadow-2xs font-extrabold"
                  : "text-zinc-400 hover:text-zinc-700"
              }`}
              title={t("adminModViewGrid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-orange-600 shadow-2xs font-extrabold"
                  : "text-zinc-400 hover:text-zinc-700"
              }`}
              title={t("adminModViewCard")}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Count summary */}
      {paginatedHouses.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-zinc-500">
          <span>
            {t("adminBlogsShowingCount", { count: paginatedHouses.length, total: totalItems })}
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {t("adminBlogsSortedByNewest")}
          </span>
        </div>
      )}

      {/* Main Content */}
      {paginatedHouses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">{t("adminBlogsNoPosts")}</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">{t("adminBlogsNoPostsDesc")}</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedHouses.map((item) => {
            const occupancyRate = Math.round((item.occupiedRooms / item.totalRooms) * 100) || 0;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-zinc-200/90 transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md"
              >
                <div>
                  <Link href={`/admin/boarding-houses/${item.id}`} className="block relative h-44 w-full bg-zinc-100 overflow-hidden group">
                    <img
                      src={item.coverImage || "/house-placeholder.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30" />

                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-2xs ${
                          item.status === "active"
                            ? "bg-emerald-600"
                            : item.status === "locked"
                            ? "bg-red-600 ring-2 ring-red-300"
                            : "bg-amber-600"
                        }`}
                      >
                        {item.status === "active"
                          ? t("adminHouseModStatusActive")
                          : item.status === "locked"
                          ? t("adminHouseModStatusLocked")
                          : t("adminHouseModStatusReported")}
                      </span>

                      {item.reportsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{t("adminHouseModReportsCount", { count: item.reportsCount })}</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-bold">
                      <span className="bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 truncate max-w-[65%]">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.totalRooms} {t("adminHouseModRoomsUnit")}</span>
                      </span>
                      <span className="bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {occupancyRate}% {t("adminHouseModOccupied")}
                      </span>
                    </div>
                  </Link>

                  <div className="p-4 space-y-2.5">
                    <Link
                      href={`/admin/boarding-houses/${item.id}`}
                      className="text-sm font-black text-zinc-900 line-clamp-2 hover:text-orange-600 transition-colors text-left cursor-pointer block"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100">
                      <span className="font-semibold text-zinc-700">{item.landlordName}</span>
                      <span>{item.landlordPhone}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-zinc-100 mt-2 flex items-center gap-2">
                  <Link
                    href={`/admin/boarding-houses/${item.id}`}
                    className="flex-1 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t("adminModActionInspect")}</span>
                  </Link>

                  {item.status === "locked" ? (
                    <button
                      onClick={() => handleOpenUnlock(item)}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
                      title={t("adminHouseModUnlockHouse")}
                    >
                      <Unlock className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenLock(item)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors cursor-pointer"
                      title={t("adminHouseModLockHouse")}
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE MODE */
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 uppercase tracking-wider font-bold">
                <th className="p-3.5">{t("adminHouseModColHouseAddress")}</th>
                <th className="p-3.5">{t("adminHouseModLandlordContact")}</th>
                <th className="p-3.5">{t("adminHouseModTotalRooms")}</th>
                <th className="p-3.5">{t("adminHouseModOccupancyRate")}</th>
                <th className="p-3.5">{t("adminHouseModColStatus")}</th>
                <th className="p-3.5 text-right">{t("adminHouseModColActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedHouses.map((item) => {
                const occupancyRate = Math.round((item.occupiedRooms / item.totalRooms) * 100) || 0;
                return (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="p-3.5 max-w-xs">
                      <Link href={`/admin/boarding-houses/${item.id}`} className="cursor-pointer group flex items-center gap-3">
                        <img src={item.coverImage || "/house-placeholder.jpg"} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200" />
                        <div>
                          <div className="font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">{item.name}</div>
                          <div className="text-[11px] text-zinc-400 line-clamp-1">{item.address}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-zinc-800">{item.landlordName}</div>
                      <div className="text-[11px] text-zinc-400">{item.landlordPhone}</div>
                    </td>
                    <td className="p-3.5 font-bold text-zinc-800">
                      {item.totalRooms} {t("adminHouseModRoomsUnit")}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-zinc-800">{item.occupiedRooms}/{item.totalRooms} ({occupancyRate}%)</div>
                    </td>
                    <td className="p-3.5 space-y-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                          item.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "locked"
                            ? "bg-red-100 text-red-800 ring-1 ring-red-300"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status === "active"
                          ? t("adminHouseModStatusActive")
                          : item.status === "locked"
                          ? t("adminHouseModStatusLocked")
                          : t("adminHouseModStatusReported")}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/admin/boarding-houses/${item.id}`}
                        className="inline-flex p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
                        title={t("adminModActionInspect")}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {item.status === "locked" ? (
                        <button
                          onClick={() => handleOpenUnlock(item)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          title={t("adminHouseModUnlockHouse")}
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenLock(item)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                          title={t("adminHouseModLockHouse")}
                        >
                          <Lock className="w-4 h-4" />
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

      {/* Standardized Pagination Bar */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-semibold text-zinc-600">
        <div className="flex items-center gap-2">
          <span>{t("adminBlogsPaginationShowing")}</span>
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
          <span>{t("adminBlogsPaginationPerPage")}</span>
          <span className="text-zinc-300">|</span>
          <span>
            {totalItems === 0
              ? "0"
              : `${(safeCurrentPage - 1) * validPageSize + 1}-${Math.min(
                  safeCurrentPage * validPageSize,
                  totalItems
                )}`}{" "}
            {t("adminBlogsPaginationOfPosts", { total: totalItems })}
          </span>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 5))}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
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
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LOCK HOUSE MODAL */}
      {lockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("adminHouseModLockHouse")}</h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{lockTarget.name}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Khóa tòa nhà sẽ tạm ngưng toàn bộ hoạt động đăng tin mới và thông báo đến chủ trọ giải trình.
            </p>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-700 block">
                {t("adminHouseModLockReasonLabel")} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={lockReason}
                onChange={(e) => {
                  setLockReason(e.target.value);
                  if (lockReasonError) setLockReasonError("");
                }}
                placeholder={t("adminHouseModLockReasonPlaceholder")}
                className={`w-full p-2.5 bg-zinc-50 border rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-all ${
                  lockReasonError ? "border-red-400 bg-red-50/20" : "border-zinc-200 focus:border-red-500"
                }`}
              />
              {lockReasonError && (
                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {lockReasonError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setLockTarget(null)}
                disabled={isLocking}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {t("adminBlogsCancel")}
              </button>
              <button
                onClick={handleConfirmLock}
                disabled={isLocking || !lockReason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 disabled:bg-red-300 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                {isLocking && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("adminHouseModLockHouse")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNLOCK HOUSE MODAL */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("adminHouseModUnlockHouse")}</h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{unlockTarget.name}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Bạn có chắc chắn muốn mở khóa nhà trọ &quot;{unlockTarget.name}&quot;? Toàn bộ hoạt động phòng và đăng tin sẽ được kích hoạt trở lại.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setUnlockTarget(null)}
                disabled={isUnlocking}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {t("adminBlogsCancel")}
              </button>
              <button
                onClick={handleConfirmUnlock}
                disabled={isUnlocking}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                {isUnlocking && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("adminHouseModUnlockHouse")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
