"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  Calendar, Clock, Building2, Shield, Users,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Info, X, CheckCircle2, AlertTriangle, XCircle,
  Phone, ArrowLeft, Search,
  Camera, Eye, ShieldCheck, ArrowRight, FileText,
  Loader2, Filter, RotateCcw
} from "lucide-react";
import {
  AttendanceRecord,
  AttendanceWatermark,
  getLocalizedPlace,
  getLocalizedStaffName,
  getLocalizedExplanation
} from "../data";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import {
  staffAttendanceService,
  StaffAttendanceHistorySummary,
  StaffShiftType,
} from "@/services/staff-attendance.service";

function StaffShiftHistoryContent() {
  const t = useTranslations("staffPortal");
  const { locale } = useLanguage();
  const isEn = locale === "en";

  // Dynamic Shift Types fetched from Backend (no hardcoded data)
  const [availableShifts, setAvailableShifts] = useState<StaffShiftType[]>([]);
  const [isShiftsLoading, setIsShiftsLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setIsShiftsLoading(true);
    staffAttendanceService
      .getShifts()
      .then((shifts) => {
        if (mounted) setAvailableShifts(shifts);
      })
      .catch((err) => {
        console.error("Failed to load shift types from backend:", err);
        if (mounted) setAvailableShifts([]);
      })
      .finally(() => {
        if (mounted) setIsShiftsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Filter Modal & Rule #10 Unsaved Confirmation States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [showConfirmCloseModal, setShowConfirmCloseModal] = useState<boolean>(false);

  // Modal Draft States (edited by user inside the filter modal)
  const [modalStartDate, setModalStartDate] = useState<string>("");
  const [modalEndDate, setModalEndDate] = useState<string>("");
  const [modalShift, setModalShift] = useState<string>("all");
  const [modalStatus, setModalStatus] = useState<"all" | "on_time" | "late" | "absent">("all");

  // Applied Filter States (active filters applied to backend query)
  const [appliedStartDate, setAppliedStartDate] = useState<string>("");
  const [appliedEndDate, setAppliedEndDate] = useState<string>("");
  const [appliedShift, setAppliedShift] = useState<string>("all");
  const [appliedStatus, setAppliedStatus] = useState<"all" | "on_time" | "late" | "absent">("all");

  const hasAnyAppliedFilter = useMemo(() => {
    return (
      appliedStartDate !== "" ||
      appliedEndDate !== "" ||
      appliedShift !== "all" ||
      appliedStatus !== "all"
    );
  }, [appliedStartDate, appliedEndDate, appliedShift, appliedStatus]);

  // Check if draft in modal differs from currently applied values (Rule #10)
  const hasModalChanges = useMemo(() => {
    return (
      modalStartDate !== appliedStartDate ||
      modalEndDate !== appliedEndDate ||
      modalShift !== appliedShift ||
      modalStatus !== appliedStatus
    );
  }, [modalStartDate, modalEndDate, modalShift, modalStatus, appliedStartDate, appliedEndDate, appliedShift, appliedStatus]);

  const handleOpenFilterModal = () => {
    setModalStartDate(appliedStartDate);
    setModalEndDate(appliedEndDate);
    setModalShift(appliedShift);
    setModalStatus(appliedStatus);
    setIsFilterModalOpen(true);
  };

  const handleRequestCloseFilterModal = () => {
    if (hasModalChanges) {
      setShowConfirmCloseModal(true);
    } else {
      setIsFilterModalOpen(false);
    }
  };

  const handleConfirmDiscardAndClose = () => {
    setModalStartDate(appliedStartDate);
    setModalEndDate(appliedEndDate);
    setModalShift(appliedShift);
    setModalStatus(appliedStatus);
    setShowConfirmCloseModal(false);
    setIsFilterModalOpen(false);
  };

  const handleApplyModalFilter = () => {
    setAppliedStartDate(modalStartDate);
    setAppliedEndDate(modalEndDate);
    setAppliedShift(modalShift);
    setAppliedStatus(modalStatus);
    setCurrentPage(1);
    setWindowStart(1);
    setIsFilterModalOpen(false);
  };

  const handleResetModalDrafts = () => {
    setModalStartDate("");
    setModalEndDate("");
    setModalShift("all");
    setModalStatus("all");
  };

  const handleClearAllFilters = () => {
    setAppliedStartDate("");
    setAppliedEndDate("");
    setAppliedShift("all");
    setAppliedStatus("all");
    setModalStartDate("");
    setModalEndDate("");
    setModalShift("all");
    setModalStatus("all");
    setCurrentPage(1);
    setWindowStart(1);
  };

  // Data & loading state
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<StaffAttendanceHistorySummary>({
    total: 0,
    onTime: 0,
    late: 0,
    absent: 0,
    hours: "0.0",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Pagination states (Table view: default 10)
  const [pageSizeInput, setPageSizeInput] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [windowStart, setWindowStart] = useState<number>(1);

  // Preview watermark photo modal
  const [previewImageModal, setPreviewImageModal] = useState<{
    isOpen: boolean;
    title: string;
    imageUrl: string;
    watermark?: AttendanceWatermark;
    note?: string;
  } | null>(null);

  const getShiftName = (name: string) => {
    if (!isEn) return name;
    if (name.includes("Sáng")) return "Morning Shift (07:00 - 15:00)";
    if (name.includes("Chiều")) return "Afternoon Shift (15:00 - 23:00)";
    if (name.includes("Đêm")) return "Night Shift (23:00 - 07:00)";
    return name;
  };

  // Fetch paginated history from backend API
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const validPageSize = Math.max(1, pageSizeInput || 10);
      const res = await staffAttendanceService.getHistory({
        page: currentPage,
        limit: validPageSize,
        status: appliedStatus !== "all" ? appliedStatus : undefined,
        startDate: appliedStartDate || undefined,
        endDate: appliedEndDate || undefined,
        shiftName: appliedShift !== "all" ? appliedShift : undefined,
      });

      setAttendances(res.data);
      setSummary(res.summary);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to fetch staff attendance history:", err);
      setAttendances([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSizeInput, appliedStatus, appliedStartDate, appliedEndDate, appliedShift]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Sync with check-in / check-out updates
  useEffect(() => {
    const handleSync = () => {
      fetchHistory();
    };
    window.addEventListener("dormio_attendance_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("dormio_attendance_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [fetchHistory]);

  // Pagination window helpers (Rule #9: 5-page window jumping)
  const validPageSize = Math.max(1, pageSizeInput || 10);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * validPageSize;
  const endIndex = Math.min(startIndex + validPageSize, totalItems);

  const windowEnd = Math.min(windowStart + 4, totalPages);
  const pageNumbers: number[] = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i);
  }

  const handleNextWindow = () => {
    const nextStart = windowStart + 5;
    if (nextStart <= totalPages) {
      setWindowStart(nextStart);
      setCurrentPage(nextStart);
    }
  };

  const handlePrevWindow = () => {
    const prevStart = Math.max(1, windowStart - 5);
    setWindowStart(prevStart);
    setCurrentPage(prevStart);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* HEADER BAR */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/staff"
              className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
              title={t("btnBackToOverview")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-black text-[#2AC1BC] uppercase tracking-wider">
              {isEn ? "ATTENDANCE TIMESHEET" : "NHẬT KÝ CHẤM CÔNG"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {isEn ? "Attendance History & Timesheet" : "Lịch Sử Chấm Công & Giờ Làm"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            {isEn
              ? "Audit verified clock-in/out records, punctuality rates, and photo proofs."
              : "Theo dõi chi tiết lịch sử vào/ra ca, tỷ lệ chuyên cần và hình ảnh đối chiếu thực tế."}
          </p>
        </div>

        {/* Action Link to Work Schedule */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <Link
            href="/staff/schedule"
            className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-black flex items-center gap-2 transition-all shadow-2xs border border-zinc-200/80 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#2AC1BC]" />
            <span>{isEn ? "View Work Schedule" : "Xem lịch phân ca tuần"}</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-2 animate-pulse"
              >
                <div className="h-2.5 w-16 bg-zinc-200 rounded" />
                <div className="h-7 w-12 bg-zinc-200 rounded" />
                <div className="h-2.5 w-20 bg-zinc-100 rounded" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                {t("metricTotalShifts")}
              </span>
              <div className="text-2xl font-black text-zinc-900">{summary.total}</div>
              <span className="text-[10px] font-semibold text-zinc-500 block">
                {t("metricMonthSub")}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                {t("metricOnTime")}
              </span>
              <div className="text-2xl font-black text-[#2AC1BC]">{summary.onTime}</div>
              <span className="text-[10px] font-bold text-emerald-600 block">
                {t("metricOnTimeSub")}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                {t("metricLate")}
              </span>
              <div className="text-2xl font-black text-amber-600">{summary.late}</div>
              <span className="text-[10px] font-medium text-amber-600 block">
                {t("metricLateSub")}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                {t("metricAbsent")}
              </span>
              <div className="text-2xl font-black text-zinc-400">{summary.absent}</div>
              <span className="text-[10px] font-medium text-zinc-400 block">
                {t("metricAbsentSub")}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                {t("metricHours")}
              </span>
              <div className="text-2xl font-black text-purple-600">{summary.hours}h</div>
              <span className="text-[10px] font-bold text-zinc-500 block">
                {t("metricHoursSub")}
              </span>
            </div>
          </>
        )}
      </div>

      {/* FILTER CONTROLS BAR (Above Table) */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút bấm "Sử dụng bộ lọc" */}
          <button
            type="button"
            onClick={handleOpenFilterModal}
            className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#2AC1BC] hover:text-[#22a8a4] border border-[#2AC1BC]/30 text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
            title={isEn ? "Open filter dialog" : "Mở hộp thoại bộ lọc"}
          >
            <Filter className="w-3.5 h-3.5 text-[#2AC1BC]" />
            <span>{isEn ? "Use Filters" : "Sử dụng bộ lọc"}</span>
            {hasAnyAppliedFilter && (
              <span className="w-2 h-2 rounded-full bg-[#2AC1BC] animate-pulse" />
            )}
          </button>

          {/* Khi ấn apply ở modal thì hiện filter được áp dụng ở bên cạnh */}
          {hasAnyAppliedFilter ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Date Range Chip */}
              {(appliedStartDate || appliedEndDate) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-semibold">
                  <Calendar className="w-3 h-3 text-[#2AC1BC]" />
                  <span>
                    {appliedStartDate && appliedEndDate
                      ? `${appliedStartDate} → ${appliedEndDate}`
                      : appliedStartDate
                        ? `Từ ${appliedStartDate}`
                        : `Đến ${appliedEndDate}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedStartDate("");
                      setAppliedEndDate("");
                      setCurrentPage(1);
                      setWindowStart(1);
                    }}
                    className="text-zinc-400 hover:text-red-500 ml-0.5 cursor-pointer"
                    title={isEn ? "Remove date filter" : "Bỏ lọc ngày"}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Shift Chip */}
              {appliedShift !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-semibold">
                  <Clock className="w-3 h-3 text-[#2AC1BC]" />
                  <span>{getShiftName(appliedShift)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedShift("all");
                      setCurrentPage(1);
                      setWindowStart(1);
                    }}
                    className="text-zinc-400 hover:text-red-500 ml-0.5 cursor-pointer"
                    title={isEn ? "Remove shift filter" : "Bỏ lọc ca trực"}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Status Chip */}
              {appliedStatus !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-semibold">
                  <ShieldCheck className="w-3 h-3 text-[#2AC1BC]" />
                  <span>
                    {appliedStatus === "on_time" && t("tableStatusOnTime")}
                    {appliedStatus === "late" && t("tableStatusLate")}
                    {appliedStatus === "absent" && t("tableStatusAbsent")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedStatus("all");
                      setCurrentPage(1);
                      setWindowStart(1);
                    }}
                    className="text-zinc-400 hover:text-red-500 ml-0.5 cursor-pointer"
                    title={isEn ? "Remove status filter" : "Bỏ lọc trạng thái"}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Clear All Chip */}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs text-red-600 hover:text-red-700 font-bold ml-1 hover:underline cursor-pointer"
              >
                {isEn ? "Clear all" : "Xoá tất cả"}
              </button>
            </div>
          ) : (
            <span className="text-xs text-zinc-400 font-medium italic">
              {isEn ? "No active filters" : "Chưa áp dụng bộ lọc nào"}
            </span>
          )}
        </div>

        {/* Total records count */}
        <div className="text-xs text-zinc-500 font-medium self-start md:self-center">
          {isEn ? "Total records:" : "Tổng số bản ghi:"} <strong className="text-zinc-900 font-bold">{totalItems}</strong>
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-black text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t("tableColDate")}</th>
                <th className="py-3.5 px-3">{t("tableColShift")}</th>
                <th className="py-3.5 px-3">{t("tableColCheckIn")}</th>
                <th className="py-3.5 px-3">{t("tableColCheckOut")}</th>
                <th className="py-3.5 px-3">{t("tableColStatus")}</th>
                <th className="py-3.5 px-3">{t("tableColHours")}</th>
                <th className="py-3.5 px-3">{t("tableColNote")}</th>
                <th className="py-3.5 px-3 text-center">{isEn ? "Action" : "Thao tác"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-3"><div className="h-4 w-20 bg-zinc-200 rounded" /></td>
                      <td className="py-4 px-3"><div className="h-4 w-28 bg-zinc-200 rounded" /></td>
                      <td className="py-4 px-3"><div className="h-4 w-16 bg-zinc-200 rounded" /></td>
                      <td className="py-4 px-3"><div className="h-4 w-16 bg-zinc-200 rounded" /></td>
                      <td className="py-4 px-3"><div className="h-5 w-18 bg-zinc-100 rounded-lg" /></td>
                      <td className="py-4 px-3"><div className="h-4 w-10 bg-zinc-200 rounded" /></td>
                      <td className="py-4 px-3"><div className="h-4 w-36 bg-zinc-100 rounded" /></td>
                      <td className="py-4 px-3 text-center"><div className="h-6 w-10 bg-zinc-100 rounded-lg mx-auto" /></td>
                    </tr>
                  ))}
                </>
              ) : attendances.length > 0 ? (
                attendances.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-4 px-3 font-bold text-zinc-900 whitespace-nowrap">
                      {item.workDate}
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap font-bold">
                      <div>{getShiftName(item.shiftName)}</div>
                      <div className="text-[10px] text-zinc-400 font-normal">
                        {item.shiftTime}
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span>{item.checkIn || "--:--"}</span>
                        {item.checkInPhoto && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImageModal({
                                isOpen: true,
                                title: `${t("tableColCheckIn")}: ${item.workDate} (${getShiftName(item.shiftName)})`,
                                imageUrl: item.checkInPhoto!,
                                watermark: item.checkInWatermark
                                  ? {
                                      ...item.checkInWatermark,
                                      place: getLocalizedPlace(item.checkInWatermark.place, isEn),
                                      staffName: getLocalizedStaffName(item.checkInWatermark.staffName, isEn),
                                    }
                                  : undefined,
                                note: getLocalizedExplanation(item.checkInExplanation, isEn),
                              })
                            }
                            className="p-1 rounded-md text-[#2AC1BC] hover:bg-[#2AC1BC]/10 transition-colors cursor-pointer"
                            title={t("viewWatermarkCheckIn")}
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span>{item.checkOut || "--:--"}</span>
                        {item.checkOutPhoto && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImageModal({
                                isOpen: true,
                                title: `${t("tableColCheckOut")}: ${item.workDate} (${getShiftName(item.shiftName)})`,
                                imageUrl: item.checkOutPhoto!,
                                watermark: item.checkOutWatermark
                                  ? {
                                      ...item.checkOutWatermark,
                                      place: getLocalizedPlace(item.checkOutWatermark.place, isEn),
                                      staffName: getLocalizedStaffName(item.checkOutWatermark.staffName, isEn),
                                    }
                                  : undefined,
                                note: getLocalizedExplanation(item.checkOutExplanation, isEn),
                              })
                            }
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title={t("viewWatermarkCheckOut")}
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      {item.status === "on_time" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.isEarlyCheckOut ? t("tableStatusEarly") : t("tableStatusOnTime")}
                        </span>
                      )}
                      {item.status === "late" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                          {t("tableStatusLate")}
                        </span>
                      )}
                      {item.status === "absent" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
                          {t("tableStatusAbsent")}
                        </span>
                      )}
                      {item.status === "not_yet" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-zinc-100 text-zinc-600">
                          {t("statusNotYet")}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 font-black text-[#2AC1BC]">{item.totalHours}h</td>
                    <td className="py-4 px-3 text-[11px] text-zinc-500 max-w-xs">
                      {item.checkInExplanation ? (
                        <div
                          className="text-amber-800 font-medium truncate"
                          title={getLocalizedExplanation(item.checkInExplanation, isEn)}
                        >
                          <span className="font-bold">{t("tableLateShort")}</span> &quot;
                          {getLocalizedExplanation(item.checkInExplanation, isEn)}&quot;
                        </div>
                      ) : item.checkOutExplanation ? (
                        <div
                          className="text-amber-800 font-medium truncate"
                          title={getLocalizedExplanation(item.checkOutExplanation, isEn)}
                        >
                          <span className="font-bold">{t("tableEarlyShort")}</span> &quot;
                          {getLocalizedExplanation(item.checkOutExplanation, isEn)}&quot;
                        </div>
                      ) : item.editedByLandlord ? (
                        <span className="text-blue-600 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> {t("tableManualApproved")}
                        </span>
                      ) : (
                        getLocalizedExplanation(item.note, isEn) || "--"
                      )}
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      {item.checkInPhoto || item.checkOutPhoto ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImageModal({
                              isOpen: true,
                              title: `${item.workDate} (${getShiftName(item.shiftName)})`,
                              imageUrl: (item.checkInPhoto || item.checkOutPhoto)!,
                              watermark: item.checkInWatermark
                                ? {
                                    ...item.checkInWatermark,
                                    place: getLocalizedPlace(item.checkInWatermark.place, isEn),
                                    staffName: getLocalizedStaffName(item.checkInWatermark.staffName, isEn),
                                  }
                                : undefined,
                              note: getLocalizedExplanation(item.checkInExplanation || item.checkOutExplanation || item.note, isEn),
                            })
                          }
                          className="p-1.5 rounded-xl bg-zinc-100 hover:bg-[#2AC1BC]/10 text-zinc-600 hover:text-[#2AC1BC] transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title={isEn ? "View photo proof" : "Xem ảnh đối chiếu"}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-zinc-300 font-mono text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && attendances.length === 0 && (
        <div className="p-8 rounded-3xl bg-white border border-dashed border-zinc-200 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-zinc-700">
            {isEn ? "No attendance records found matching filters" : "Không tìm thấy dữ liệu chấm công phù hợp"}
          </p>
          <p className="text-[11px] text-zinc-400">
            {isEn
              ? "Try adjusting your date, shift, or status filters."
              : "Hãy thử thay đổi ngày trực, ca làm việc hoặc bộ lọc trạng thái."}
          </p>
          {hasAnyAppliedFilter && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                <span>{isEn ? "Reset filters" : "Đặt lại bộ lọc"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* RULE #9 STANDARDIZED PAGINATION BAR */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-zinc-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span>{t("paginationShowing")}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={pageSizeInput}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setPageSizeInput(isNaN(val) ? 0 : val);
                setCurrentPage(1);
                setWindowStart(1);
              }}
              className="w-14 px-2 py-1 text-center font-bold text-zinc-900 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#2AC1BC]"
            />
            <span>{t("paginationPerPage")}</span>
          </div>

          <span className="text-zinc-300">|</span>

          <span>
            {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} {t("paginationOf")} {totalItems} {t("paginationItems")}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevWindow}
            disabled={windowStart === 1}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title={t("paginationJumpBack5")}
          >
            <ChevronsLeft className="w-4 h-4 text-zinc-600" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage === 1}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title={t("paginationPrev")}
          >
            <ChevronLeft className="w-4 h-4 text-zinc-600" />
          </button>

          {pageNumbers.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setCurrentPage(num)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                safeCurrentPage === num
                  ? "bg-[#2AC1BC] text-white shadow-2xs"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title={t("paginationNext")}
          >
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </button>

          <button
            type="button"
            onClick={handleNextWindow}
            disabled={windowStart + 5 > totalPages}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title={t("paginationJumpForward5")}
          >
            <ChevronsRight className="w-4 h-4 text-zinc-600" />
          </button>
        </div>
      </div>

      {/* WATERMARK PHOTO MODAL */}
      {previewImageModal && previewImageModal.isOpen && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden cursor-default my-auto border border-zinc-200"
          >
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#2AC1BC]" />
                <h3 className="text-sm font-black text-zinc-900 truncate">
                  {previewImageModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-zinc-950 aspect-video max-h-[380px] flex items-center justify-center">
              <img
                src={previewImageModal.imageUrl}
                alt="Audit proof"
                className="w-full h-full object-contain"
              />
            </div>

            {previewImageModal.watermark && (
              <div className="p-4 bg-zinc-900 text-white space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[#2AC1BC] font-bold">
                  <span>🕒 {previewImageModal.watermark.time}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AUDIT VERIFIED
                  </span>
                </div>
                <div className="text-zinc-200 font-sans text-xs">
                  📍 {previewImageModal.watermark.place}
                </div>
                <div className="text-zinc-400 font-sans text-[11px]">
                  👤 {previewImageModal.watermark.staffName} • GPS: {previewImageModal.watermark.coordinates}
                </div>
              </div>
            )}

            {previewImageModal.note && (
              <div className="p-4 bg-amber-50 border-t border-amber-200/80 text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {t("explanationNoteTitle")}
                </span>
                <p className="italic text-zinc-800 font-medium">
                  &quot;{previewImageModal.note}&quot;
                </p>
              </div>
            )}

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {t("btnClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER MODAL */}
      {isFilterModalOpen && (
        <div
          onClick={handleRequestCloseFilterModal}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden cursor-default my-auto border border-zinc-200 animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#2AC1BC]">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">
                    {isEn ? "Filter Shift History" : "Bộ lọc lịch sử ca trực"}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    {isEn ? "Select criteria to narrow down records" : "Chọn các tiêu chí để lọc bảng chấm công"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestCloseFilterModal}
                className="p-1.5 rounded-lg hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                title={isEn ? "Close" : "Đóng"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Ngày trực: Date Range (From - To) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#2AC1BC]" />
                    <span>{isEn ? "Shift Date Range" : "Khoảng ngày trực"}</span>
                  </label>
                  {(modalStartDate || modalEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalStartDate("");
                        setModalEndDate("");
                      }}
                      className="text-[11px] text-zinc-400 hover:text-red-500 font-semibold cursor-pointer"
                    >
                      {isEn ? "Clear dates" : "Xóa ngày"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                      {isEn ? "From date" : "Từ ngày"}
                    </span>
                    <input
                      type="date"
                      value={modalStartDate}
                      onChange={(e) => setModalStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC] transition-all cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                      {isEn ? "To date" : "Đến ngày"}
                    </span>
                    <input
                      type="date"
                      value={modalEndDate}
                      min={modalStartDate || undefined}
                      onChange={(e) => setModalEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC] transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Ca làm việc: Dynamic from backend */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2AC1BC]" />
                  <span>{isEn ? "Shift Type" : "Ca làm việc"}</span>
                </label>
                <div className="relative">
                  <select
                    value={modalShift}
                    onChange={(e) => setModalShift(e.target.value)}
                    disabled={isShiftsLoading}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="all">
                      {isEn ? "All Shifts (Default)" : "Tất cả ca làm việc (Mặc định)"}
                    </option>
                    {availableShifts.map((s) => (
                      <option key={s.id} value={s.name}>
                        {getShiftName(s.name)} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                  {isShiftsLoading && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Trạng thái chấm công */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2AC1BC]" />
                  <span>{isEn ? "Attendance Status" : "Trạng thái chấm công"}</span>
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) =>
                    setModalStatus(
                      e.target.value as "all" | "on_time" | "late" | "absent"
                    )
                  }
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC] transition-all cursor-pointer"
                >
                  <option value="all">
                    {isEn ? "All Statuses (Default)" : "Tất cả trạng thái (Mặc định)"}
                  </option>
                  <option value="on_time">{t("tableStatusOnTime") || (isEn ? "On time" : "Đúng giờ")}</option>
                  <option value="late">{t("tableStatusLate") || (isEn ? "Late" : "Đi muộn")}</option>
                  <option value="absent">{t("tableStatusAbsent") || (isEn ? "Absent" : "Vắng mặt")}</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-50/80 border-t border-zinc-200/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetModalDrafts}
                className="px-3 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title={isEn ? "Reset all fields in dialog" : "Đặt lại tất cả trường trong hộp thoại"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isEn ? "Reset" : "Thiết lập lại"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequestCloseFilterModal}
                  className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  {isEn ? "Cancel" : "Hủy bỏ"}
                </button>
                <button
                  type="button"
                  onClick={handleApplyModalFilter}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#22a8a4] rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  {isEn ? "Apply Filters" : "Áp dụng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RULE #10 CONFIRMATION MODAL */}
      {showConfirmCloseModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100"
          >
            <div className="p-6">
              <div className="flex items-center gap-2.5 mb-2 text-amber-600">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <h3 className="text-base font-bold text-zinc-900">
                  {isEn ? "Confirm Close Form" : "Xác nhận đóng form"}
                </h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {isEn
                  ? "You have unsaved filter changes. Are you sure you want to discard changes and close?"
                  : "Bạn có những thay đổi trong bộ lọc chưa được áp dụng. Bạn có chắc muốn hủy thay đổi & đóng?"}
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setShowConfirmCloseModal(false)}
                className="flex-1 px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                {isEn ? "Continue Editing" : "Tiếp tục chỉnh sửa"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscardAndClose}
                className="flex-1 px-4 py-2 text-xs font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors cursor-pointer shadow-2xs"
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

export default function StaffShiftHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-zinc-400 font-bold">
          Loading...
        </div>
      }
    >
      <StaffShiftHistoryContent />
    </Suspense>
  );
}
