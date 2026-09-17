"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Calendar, Clock, Building2, Shield, Users,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Info, X, CheckCircle2, AlertTriangle, XCircle,
  Phone, ArrowLeft, Search,
  Camera, Eye, ShieldCheck, ArrowRight, FileText
} from "lucide-react";
import {
  MOCK_ATTENDANCES,
  AttendanceRecord,
  AttendanceWatermark,
  getLocalizedPlace,
  getLocalizedStaffName,
  getLocalizedExplanation,
  getStoredAttendances
} from "../data";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

function StaffShiftHistoryContent() {
  const t = useTranslations("staffPortal");
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [attSearchQuery, setAttSearchQuery] = useState("");
  const [attStatusFilter, setAttStatusFilter] = useState<"all" | "on_time" | "late" | "absent">("all");

  // Real-time persistent attendances
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(MOCK_ATTENDANCES);

  useEffect(() => {
    setAttendances(getStoredAttendances());
    const handleSync = () => {
      setAttendances(getStoredAttendances());
    };
    window.addEventListener("dormio_attendance_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("dormio_attendance_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Preview watermark photo modal
  const [previewImageModal, setPreviewImageModal] = useState<{
    isOpen: boolean;
    title: string;
    imageUrl: string;
    watermark?: AttendanceWatermark;
    note?: string;
  } | null>(null);

  // Pagination states (Table view: default 10)
  const [pageSizeInput, setPageSizeInput] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [windowStart, setWindowStart] = useState<number>(1);

  const getShiftName = (name: string) => {
    if (!isEn) return name;
    if (name.includes("Sáng")) return "Morning Shift (07:00 - 15:00)";
    if (name.includes("Chiều")) return "Afternoon Shift (15:00 - 23:00)";
    if (name.includes("Đêm")) return "Night Shift (23:00 - 07:00)";
    return name;
  };

  const filteredAttendances = useMemo(() => {
    return attendances.filter((item) => {
      const matchSearch =
        item.workDate.includes(attSearchQuery) ||
        item.shiftName.toLowerCase().includes(attSearchQuery.toLowerCase()) ||
        item.boardingHouseName.toLowerCase().includes(attSearchQuery.toLowerCase());
      const matchStatus = attStatusFilter === "all" || item.status === attStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [attendances, attSearchQuery, attStatusFilter]);

  const validPageSize = Math.max(1, pageSizeInput || 10);
  const totalItems = filteredAttendances.length;
  const totalPages = Math.ceil(totalItems / validPageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * validPageSize;
  const endIndex = Math.min(startIndex + validPageSize, totalItems);
  const paginatedAttendances = filteredAttendances.slice(startIndex, endIndex);

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

  const attendanceSummary = useMemo(() => {
    const total = attendances.length;
    const onTime = attendances.filter(a => a.status === "on_time").length;
    const late = attendances.filter(a => a.status === "late").length;
    const absent = attendances.filter(a => a.status === "absent").length;
    const hours = attendances.reduce((sum, a) => sum + (a.totalHours || 0), 0);
    return { total, onTime, late, absent, hours: hours.toFixed(1) };
  }, [attendances]);

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
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("metricTotalShifts")}</span>
          <div className="text-2xl font-black text-zinc-900">{attendanceSummary.total}</div>
          <span className="text-[10px] font-semibold text-zinc-500 block">{t("metricMonthSub")}</span>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("metricOnTime")}</span>
          <div className="text-2xl font-black text-[#2AC1BC]">{attendanceSummary.onTime}</div>
          <span className="text-[10px] font-bold text-emerald-600 block">{t("metricOnTimeSub")}</span>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("metricLate")}</span>
          <div className="text-2xl font-black text-amber-600">{attendanceSummary.late}</div>
          <span className="text-[10px] font-medium text-amber-600 block">{t("metricLateSub")}</span>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("metricAbsent")}</span>
          <div className="text-2xl font-black text-zinc-400">{attendanceSummary.absent}</div>
          <span className="text-[10px] font-medium text-zinc-400 block">{t("metricAbsentSub")}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("metricHours")}</span>
          <div className="text-2xl font-black text-purple-600">{attendanceSummary.hours}h</div>
          <span className="text-[10px] font-bold text-zinc-500 block">{t("metricHoursSub")}</span>
        </div>
      </div>

      {/* Filter & View Mode Controls */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={attSearchQuery}
            onChange={(e) => setAttSearchQuery(e.target.value)}
            placeholder={t("attSearchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2AC1BC]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            {(["all", "on_time", "late", "absent"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setAttStatusFilter(st);
                  setCurrentPage(1);
                  setWindowStart(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  attStatusFilter === st
                    ? "bg-[#2AC1BC] text-white shadow-2xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {st === "all" && `${t("filterAll")} (${attendanceSummary.total})`}
                {st === "on_time" && `${t("filterOnTime")} (${attendanceSummary.onTime})`}
                {st === "late" && `${t("filterLate")} (${attendanceSummary.late})`}
                {st === "absent" && `${t("filterAbsent")} (${attendanceSummary.absent})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-black text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t("tableColDate")}</th>
                  <th className="py-3 px-3">{t("tableColShift")}</th>
                  <th className="py-3 px-3">{t("tableColPlace")}</th>
                  <th className="py-3 px-3">{t("tableColCheckIn")}</th>
                  <th className="py-3 px-3">{t("tableColCheckOut")}</th>
                  <th className="py-3 px-3">{t("tableColStatus")}</th>
                  <th className="py-3 px-3">{t("tableColHours")}</th>
                  <th className="py-3 px-3">{t("tableColNote")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                {paginatedAttendances.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-zinc-900 whitespace-nowrap">{item.workDate}</td>
                    <td className="py-4 px-3 whitespace-nowrap font-bold">
                      <div>{getShiftName(item.shiftName)}</div>
                      <div className="text-[10px] text-zinc-400 font-normal">{item.shiftTime}</div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap text-zinc-600">{getLocalizedPlace(item.boardingHouseName, isEn)}</td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span>{item.checkIn || "--:--"}</span>
                        {item.checkInPhoto && (
                          <button
                            type="button"
                            onClick={() => setPreviewImageModal({
                              isOpen: true,
                              title: `${t("tableColCheckIn")}: ${item.workDate} (${getShiftName(item.shiftName)})`,
                              imageUrl: item.checkInPhoto!,
                              watermark: item.checkInWatermark ? {
                                ...item.checkInWatermark,
                                place: getLocalizedPlace(item.checkInWatermark.place, isEn),
                                staffName: getLocalizedStaffName(item.checkInWatermark.staffName, isEn)
                              } : undefined,
                              note: getLocalizedExplanation(item.checkInExplanation, isEn)
                            })}
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
                            onClick={() => setPreviewImageModal({
                              isOpen: true,
                              title: `${t("tableColCheckOut")}: ${item.workDate} (${getShiftName(item.shiftName)})`,
                              imageUrl: item.checkOutPhoto!,
                              watermark: item.checkOutWatermark ? {
                                ...item.checkOutWatermark,
                                place: getLocalizedPlace(item.checkOutWatermark.place, isEn),
                                staffName: getLocalizedStaffName(item.checkOutWatermark.staffName, isEn)
                              } : undefined,
                              note: getLocalizedExplanation(item.checkOutExplanation, isEn)
                            })}
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
                        <div className="text-amber-800 font-medium truncate" title={getLocalizedExplanation(item.checkInExplanation, isEn)}>
                          <span className="font-bold">{t("tableLateShort")}</span> &quot;{getLocalizedExplanation(item.checkInExplanation, isEn)}&quot;
                        </div>
                      ) : item.checkOutExplanation ? (
                        <div className="text-amber-800 font-medium truncate" title={getLocalizedExplanation(item.checkOutExplanation, isEn)}>
                          <span className="font-bold">{t("tableEarlyShort")}</span> &quot;{getLocalizedExplanation(item.checkOutExplanation, isEn)}&quot;
                        </div>
                      ) : item.editedByLandlord ? (
                        <span className="text-blue-600 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> {t("tableManualApproved")}
                        </span>
                      ) : (
                        getLocalizedExplanation(item.note, isEn) || "--"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Empty State */}
      {paginatedAttendances.length === 0 && (
        <div className="p-8 rounded-3xl bg-white border border-dashed border-zinc-200 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-zinc-700">
            {isEn ? "No attendance records found matching filters" : "Không tìm thấy dữ liệu chấm công phù hợp"}
          </p>
          <p className="text-[11px] text-zinc-400">
            {isEn ? "Try adjusting your search terms or filter status." : "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái."}
          </p>
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
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

    </div>
  );
}

export default function StaffShiftHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400 font-bold">Loading...</div>}>
      <StaffShiftHistoryContent />
    </Suspense>
  );
}

