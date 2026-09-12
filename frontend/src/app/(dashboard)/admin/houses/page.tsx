"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import {
  getAdminHouses,
  lockAdminHouse,
  unlockAdminHouse,
  AdminHouseModerationItem,
} from "@/services/boarding-house.service";
import {
  Building2, Search, Lock, Unlock,
  AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, RefreshCw, Filter, RotateCcw, Check, ChevronDown,
} from "lucide-react";

export type HouseModerationItem = AdminHouseModerationItem;

export default function AdminBoardingHouseModerationPage() {
  const { locale } = useLanguage();
  const t = useTranslations("admin");

  // Data State
  const [houses, setHouses] = useState<HouseModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Table Mode state (Table Mode only - Rule #9)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Multi-Value Column Filters State
  const [propertyQuery, setPropertyQuery] = useState("");
  const [landlordQuery, setLandlordQuery] = useState("");
  const [minRooms, setMinRooms] = useState("");
  const [maxRooms, setMaxRooms] = useState("");
  const [minOccupancy, setMinOccupancy] = useState("");
  const [maxOccupancy, setMaxOccupancy] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]); // empty = all, or combination of active, locked, reported
  const [tableStatusDropdownOpen, setTableStatusDropdownOpen] = useState(false);

  // Debounced filter inputs for responsive typing without hammering the API (300ms)
  const [debouncedProperty, setDebouncedProperty] = useState(propertyQuery);
  const [debouncedLandlord, setDebouncedLandlord] = useState(landlordQuery);
  const [debouncedMinRooms, setDebouncedMinRooms] = useState(minRooms);
  const [debouncedMaxRooms, setDebouncedMaxRooms] = useState(maxRooms);
  const [debouncedMinOccupancy, setDebouncedMinOccupancy] = useState(minOccupancy);
  const [debouncedMaxOccupancy, setDebouncedMaxOccupancy] = useState(maxOccupancy);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProperty(propertyQuery), 300);
    return () => clearTimeout(timer);
  }, [propertyQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLandlord(landlordQuery), 300);
    return () => clearTimeout(timer);
  }, [landlordQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinRooms(minRooms);
      setDebouncedMaxRooms(maxRooms);
    }, 300);
    return () => clearTimeout(timer);
  }, [minRooms, maxRooms]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinOccupancy(minOccupancy);
      setDebouncedMaxOccupancy(maxOccupancy);
    }, 300);
    return () => clearTimeout(timer);
  }, [minOccupancy, maxOccupancy]);

  // Lock Modal State
  const [lockTarget, setLockTarget] = useState<HouseModerationItem | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [lockReasonError, setLockReasonError] = useState("");
  const [isLocking, setIsLocking] = useState(false);

  // Unlock Modal State
  const [unlockTarget, setUnlockTarget] = useState<HouseModerationItem | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Status options definition
  const statusOptions = useMemo(
    () => [
      { id: "active", label: t("adminHouseModStatusActive") || "Hoạt động" },
      { id: "locked", label: t("adminHouseModStatusLocked") || "Bị khóa" },
      { id: "reported", label: t("adminHouseModStatusReported") || "Báo cáo" },
    ],
    [t]
  );

  const toggleStatusFilter = (statusId: string) => {
    setStatusFilters((prev) => {
      const next = prev.includes(statusId)
        ? prev.filter((s) => s !== statusId)
        : [...prev, statusId];
      setCurrentPage(1);
      return next;
    });
  };

  const hasActiveFilters = Boolean(
    propertyQuery.trim() ||
    landlordQuery.trim() ||
    minRooms !== "" ||
    maxRooms !== "" ||
    minOccupancy !== "" ||
    maxOccupancy !== "" ||
    statusFilters.length > 0
  );

  const resetAllFilters = () => {
    setPropertyQuery("");
    setLandlordQuery("");
    setMinRooms("");
    setMaxRooms("");
    setMinOccupancy("");
    setMaxOccupancy("");
    setStatusFilters([]);
    setCurrentPage(1);
  };

  // Fetch live boarding houses directly from backend API
  const fetchHouses = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      setError(null);
      try {
        const res = await getAdminHouses({
          propertyQuery: debouncedProperty.trim() || undefined,
          landlordQuery: debouncedLandlord.trim() || undefined,
          minRooms: debouncedMinRooms !== "" ? Number(debouncedMinRooms) : undefined,
          maxRooms: debouncedMaxRooms !== "" ? Number(debouncedMaxRooms) : undefined,
          minOccupancy: debouncedMinOccupancy !== "" ? Number(debouncedMinOccupancy) : undefined,
          maxOccupancy: debouncedMaxOccupancy !== "" ? Number(debouncedMaxOccupancy) : undefined,
          status: statusFilters.length > 0 ? statusFilters.join(",") : undefined,
          page: currentPage,
          limit: pageSize,
        });

        const list = res?.data || [];
        setHouses(list);
        const total = res?.pagination?.total ?? res?.meta?.total ?? list.length;
        setTotalItems(total);
        const pages = res?.pagination?.totalPages ?? res?.meta?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
        setTotalPages(pages);
      } catch (err: any) {
        console.error("Failed to fetch admin houses from backend:", err);
        setError(err?.message || t("adminBlogsFetchError"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      debouncedProperty,
      debouncedLandlord,
      debouncedMinRooms,
      debouncedMaxRooms,
      debouncedMinOccupancy,
      debouncedMaxOccupancy,
      statusFilters,
      currentPage,
      pageSize,
      t,
    ]
  );

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHouses(true);
    setFeedbackMsg({ type: "success", text: t("adminBlogsRefresh") });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const validPageSize = Math.max(1, Number(pageSize) || 10);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  // 5-page window jumping
  const windowStart = Math.floor((safeCurrentPage - 1) / 5) * 5 + 1;
  const windowEnd = Math.min(windowStart + 4, Math.max(1, totalPages));
  const pageNumbers = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i);
  }

  // Lock handler
  const handleOpenLock = (item: HouseModerationItem) => {
    setLockTarget(item);
    setLockReason("");
    setLockReasonError("");
  };

  const handleConfirmLock = async () => {
    if (!lockTarget) return;
    if (!lockReason.trim()) {
      setLockReasonError(t("adminHouseModLockReasonRequired"));
      return;
    }
    setIsLocking(true);
    try {
      await lockAdminHouse(lockTarget.id, lockReason.trim());
      await fetchHouses(true);
      setLockTarget(null);
      setLockReason("");
      setFeedbackMsg({ type: "success", text: t("adminHouseModLockSuccess") });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to lock house:", err);
      setLockReasonError(err?.message || "Không thể khóa tòa nhà");
    } finally {
      setIsLocking(false);
    }
  };

  // Unlock handler
  const handleOpenUnlock = (item: HouseModerationItem) => {
    setUnlockTarget(item);
  };

  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return;
    setIsUnlocking(true);
    try {
      await unlockAdminHouse(unlockTarget.id);
      await fetchHouses(true);
      setUnlockTarget(null);
      setFeedbackMsg({ type: "success", text: t("adminHouseModUnlockSuccess") });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to unlock house:", err);
      setFeedbackMsg({ type: "error", text: err?.message || "Không thể mở khóa tòa nhà" });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setIsUnlocking(false);
    }
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
            className="p-2.5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 font-bold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            title={t("adminHouseModRefresh")}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-600" : ""}`} />
            <span className="hidden sm:inline">{t("adminHouseModRefresh")}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span className="font-bold">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={() => fetchHouses()}
            className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors cursor-pointer text-xs shrink-0"
          >
            {t("adminBlogsRetry") || "Thử lại"}
          </button>
        </div>
      )}

      <span className="text-xs font-semibold text-zinc-500 pl-2">
        {t("adminBlogsShowingCount", { total: totalItems })}
      </span>

      {/* Main Content: Table Mode Only (With Column-Level Filters) */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[950px]">
          <thead>
            {/* Row 1: Column Headers */}
            <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-600 uppercase tracking-wider font-black">
              <th className="p-3.5 min-w-[240px]">{t("adminHouseModColHouseAddress")}</th>
              <th className="p-3.5 min-w-[190px]">{t("adminHouseModLandlordContact")}</th>
              <th className="p-3.5 min-w-[170px]">{t("adminHouseModTotalRooms")}</th>
              <th className="p-3.5 min-w-[170px]">{t("adminHouseModOccupancyRate")}</th>
              <th className="p-3.5 min-w-[180px]">{t("adminHouseModColStatus")}</th>
              <th className="p-3.5 text-right min-w-[90px]">{t("adminHouseModColActions")}</th>
            </tr>

            {/* Row 2: Column-level Filter Inputs Row */}
            <tr className="border-b border-zinc-200 bg-zinc-100/75">
              {/* 1. Property & Address search */}
              <th className="p-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={propertyQuery}
                    onChange={(e) => {
                      setPropertyQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={t("adminHouseModFilterPropertyPlaceholder")}
                    className="w-full pl-7 pr-6 py-1.5 bg-white border border-zinc-200 rounded-lg text-[11px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
                  />
                  {propertyQuery && (
                    <button
                      onClick={() => {
                        setPropertyQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                      title={t("adminHouseModFilterClearTooltip")}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </th>

              {/* 2. Landlord Contact search */}
              <th className="p-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={landlordQuery}
                    onChange={(e) => {
                      setLandlordQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={t("adminHouseModFilterLandlordPlaceholder")}
                    className="w-full pl-7 pr-6 py-1.5 bg-white border border-zinc-200 rounded-lg text-[11px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
                  />
                  {landlordQuery && (
                    <button
                      onClick={() => {
                        setLandlordQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                      title={t("adminHouseModFilterClearTooltip")}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </th>

              {/* 3. Total Rooms range filter */}
              <th className="p-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={minRooms}
                    onChange={(e) => {
                      setMinRooms(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={t("adminHouseModFilterFrom")}
                    className="w-16 px-1.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-[11px] text-center font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-zinc-400 text-xs">-</span>
                  <input
                    type="number"
                    min={0}
                    value={maxRooms}
                    onChange={(e) => {
                      setMaxRooms(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={t("adminHouseModFilterTo")}
                    className="w-16 px-1.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-[11px] text-center font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                  {(minRooms || maxRooms) && (
                    <button
                      onClick={() => {
                        setMinRooms("");
                        setMaxRooms("");
                        setCurrentPage(1);
                      }}
                      className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                      title={t("adminHouseModFilterClearRoomsTooltip")}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </th>

              {/* 4. Occupancy Rate range filter */}
              <th className="p-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={minOccupancy}
                    onChange={(e) => {
                      setMinOccupancy(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={t("adminHouseModFilterOccupancyFrom")}
                    className="w-16 px-1.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-[11px] text-center font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-zinc-400 text-xs">-</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={maxOccupancy}
                    onChange={(e) => {
                      setMaxOccupancy(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={t("adminHouseModFilterOccupancyTo")}
                    className="w-16 px-1.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-[11px] text-center font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                  {(minOccupancy || maxOccupancy) && (
                    <button
                      onClick={() => {
                        setMinOccupancy("");
                        setMaxOccupancy("");
                        setCurrentPage(1);
                      }}
                      className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                      title={t("adminHouseModFilterClearOccupancyTooltip")}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </th>

              {/* 5. Status multi-filter dropdown */}
              <th className="p-2 relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTableStatusDropdownOpen(!tableStatusDropdownOpen)}
                    className={`w-full px-2.5 py-1.5 bg-white border rounded-lg text-[11px] font-bold flex items-center justify-between gap-1 transition-all cursor-pointer ${statusFilters.length > 0
                      ? "border-orange-500 text-orange-700 bg-orange-50/50"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      }`}
                  >
                    <span className="truncate">
                      {statusFilters.length === 0
                        ? t("adminHouseModFilterStatusAll")
                        : t("adminHouseModFilterStatusSelected", { count: statusFilters.length })}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  </button>

                  {tableStatusDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setTableStatusDropdownOpen(false)}
                      />
                      <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl border border-zinc-200 shadow-xl p-2 z-30 space-y-1 animate-scaleIn">
                        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 px-1">
                          <span>{t("adminHouseModFilterStatusHeader")}</span>
                          {statusFilters.length > 0 && (
                            <button
                              onClick={() => {
                                setStatusFilters([]);
                                setCurrentPage(1);
                              }}
                              className="text-orange-600 hover:text-orange-700 cursor-pointer"
                            >
                              {t("adminHouseModFilterDeselect")}
                            </button>
                          )}
                        </div>
                        {statusOptions.map((opt) => {
                          const checked = statusFilters.includes(opt.id);
                          return (
                            <label
                              key={opt.id}
                              onClick={() => toggleStatusFilter(opt.id)}
                              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-50 text-xs font-semibold text-zinc-700 cursor-pointer"
                            >
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${checked
                                  ? "bg-orange-600 border-orange-600 text-white"
                                  : "border-zinc-300 bg-white"
                                  }`}
                              >
                                {checked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="flex-1">{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </th>

              {/* 6. Clear column filters action */}
              <th className="p-2 text-right">
                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title={t("adminHouseModFilterClearAll")}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-zinc-200 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-zinc-200 rounded-md w-3/4" />
                        <div className="h-2.5 bg-zinc-100 rounded-md w-1/2" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="space-y-1.5">
                      <div className="h-3.5 bg-zinc-200 rounded-md w-28" />
                      <div className="h-2.5 bg-zinc-100 rounded-md w-20" />
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="h-3.5 bg-zinc-200 rounded-md w-14" />
                  </td>
                  <td className="p-3.5">
                    <div className="h-3.5 bg-zinc-200 rounded-md w-20" />
                  </td>
                  <td className="p-3.5">
                    <div className="h-5 bg-zinc-200 rounded-full w-20" />
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="h-7 w-7 bg-zinc-200 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : houses.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-400">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-800">{t("adminBlogsNoPosts")}</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      {hasActiveFilters
                        ? t("adminHouseModEmptyFiltered")
                        : t("adminBlogsNoPostsDesc")}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetAllFilters}
                        className="mt-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t("adminHouseModFilterClearAll")}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              houses.map((item) => {
                const occupancyRate =
                  item.occupancyRate ??
                  (item.totalRooms > 0 ? Math.round((item.occupiedRooms / item.totalRooms) * 100) : 0);
                return (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="p-3.5 max-w-xs">
                      <Link href={`/admin/houses/${item.id}`} className="cursor-pointer group flex items-center gap-3">
                        <img
                          src={item.coverImage || "/house-placeholder.jpg"}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200"
                        />
                        <div>
                          <div className="font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                            {item.name}
                          </div>
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
                      <div className="font-bold text-zinc-800">
                        {item.occupiedRooms}/{item.totalRooms} ({occupancyRate}%)
                      </div>
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
              })
            )}
          </tbody>
        </table>
      </div>

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
              className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${safeCurrentPage === num
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
              {t("adminHouseModLockConfirmDesc")}
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
                className={`w-full p-2.5 bg-zinc-50 border rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-all ${lockReasonError ? "border-red-400 bg-red-50/20" : "border-zinc-200 focus:border-red-500"
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
              {t("adminHouseModUnlockConfirmDesc", { name: unlockTarget.name })}
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
