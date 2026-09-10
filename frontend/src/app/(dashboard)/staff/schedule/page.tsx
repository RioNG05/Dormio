"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar, Clock, Building2, Shield, Users,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Filter, Info, X, CheckCircle2, AlertTriangle, XCircle,
  Phone, Repeat, ArrowLeft, LayoutGrid, List, Search,
  Camera, Eye, ShieldCheck, CheckSquare, Sparkles, User
} from "lucide-react";
import {
  MOCK_WORK_SCHEDULES,
  WorkScheduleItem,
  JOB_POSITIONS,
  MOCK_ATTENDANCES,
  AttendanceRecord,
  AttendanceWatermark,
  getLocalizedPlace,
  getLocalizedStaffName,
  getLocalizedExplanation,
  getCurrentWeekDays,
  getStoredAttendances,
  MOCK_STAFF_TASKS
} from "../data";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

function StaffScheduleAndAttendanceContent() {
  const t = useTranslations("staffPortal");
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const searchParams = useSearchParams();

  // Top-level Tab state: "shifts" (Lịch phân ca) vs "attendance" (Nhật ký chấm công)
  const initialTab = searchParams.get("tab") === "attendance" ? "attendance" : "shifts";
  const [activeHubTab, setActiveHubTab] = useState<"shifts" | "attendance">(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "attendance" || tabParam === "shifts") {
      setActiveHubTab(tabParam);
    }
  }, [searchParams]);

  // =========================================================================
  // TAB 1: WORK SCHEDULES (LỊCH PHÂN CA)
  // =========================================================================
  // View mode: "week" or "list"
  const [viewMode, setViewMode] = useState<"week" | "list">("week");

  // Filter by boarding house
  const [selectedHouse, setSelectedHouse] = useState<string>("all");

  // Selected schedule item for detail modal
  const [selectedSchedule, setSelectedSchedule] = useState<WorkScheduleItem | null>(null);

  // Modal sub-tab: "info" vs "duties" (Tách lịch làm việc và nhiệm vụ ca làm ra riêng)
  const [modalActiveTab, setModalActiveTab] = useState<"info" | "duties">("info");

  // Helper translations for dynamic mock data
  const getShiftName = (name: string) => {
    if (!isEn) return name;
    if (name.includes("Sáng")) return "Morning Shift (07:00 - 15:00)";
    if (name.includes("Chiều")) return "Afternoon Shift (15:00 - 23:00)";
    if (name.includes("Đêm")) return "Night Shift (23:00 - 07:00)";
    return name;
  };

  const getPositionName = (name: string) => {
    if (!isEn) return name;
    const lower = name.toLowerCase();
    if (lower.includes("bảo vệ") || lower.includes("an ninh")) return "Head of Security";
    if (lower.includes("vệ sinh")) return "Cleaning Specialist";
    if (lower.includes("kỹ thuật") || lower.includes("bảo trì")) return "Technical Specialist";
    return name;
  };

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    if (selectedHouse === "all") return MOCK_WORK_SCHEDULES;
    return MOCK_WORK_SCHEDULES.filter(s => s.boardingHouseId === selectedHouse);
  }, [selectedHouse]);

  // Dynamic week days based on actual real date (Current week Mon-Sun)
  const weekDays = useMemo(() => {
    const rawDays = getCurrentWeekDays(new Date());
    const labels = [t("dayMon"), t("dayTue"), t("dayWed"), t("dayThu"), t("dayFri"), t("daySat"), t("daySun")];
    return rawDays.map((d, idx) => ({
      label: labels[idx] || d.label,
      date: d.date,
      dayNum: d.dayNum,
      isToday: d.isToday
    }));
  }, [t]);

  const getDutyLines = (item: WorkScheduleItem) => {
    if (!isEn) {
      return item.position.description.split("\n").filter(Boolean).map(line => line.replace(/^[•\s\d.-]+/, ""));
    }
    if (item.position.name.includes("Bảo vệ")) {
      return [
        "Check gate security, monitor vehicle entries and exits in the area.",
        "Patrol corridors, common spaces, and lock building gates at 23:00.",
        "Handle tenant noise complaints or nighttime incidents."
      ];
    }
    if (item.position.name.includes("Vệ sinh")) {
      return [
        "Sweep and mop communal corridors and stairwells.",
        "Clear trash bins and sanitize shared sanitary areas.",
        "Check soap and paper amenities in public restrooms."
      ];
    }
    if (item.position.name.includes("Kỹ thuật")) {
      return [
        "Check and record water and electrical meters on building panels.",
        "Inspect emergency lighting, water pumps, and electrical safety.",
        "Process quick repair requests for room fixtures."
      ];
    }
    return item.position.description.split("\n").filter(Boolean).map(line => line.replace(/^[•\s\d.-]+/, ""));
  };

  // Check additional tasks on the selected schedule date
  const additionalTasksOnSelectedDate = useMemo(() => {
    if (!selectedSchedule) return [];
    return MOCK_STAFF_TASKS.filter(
      t => t.isCustomTask && t.deadline.startsWith(selectedSchedule.workDate)
    );
  }, [selectedSchedule]);

  // =========================================================================
  // TAB 2: ATTENDANCE HISTORY (NHẬT KÝ CHẤM CÔNG)
  // =========================================================================
  const [attViewMode, setAttViewMode] = useState<"grid" | "table">("grid");
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

  // Pagination states (Rule #9: default Grid=6, Table=10)
  const [pageSizeInput, setPageSizeInput] = useState<number>(attViewMode === "grid" ? 6 : 10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [windowStart, setWindowStart] = useState<number>(1);

  const handleAttViewModeChange = (mode: "grid" | "table") => {
    setAttViewMode(mode);
    const newSize = mode === "grid" ? 6 : 10;
    setPageSizeInput(newSize);
    setCurrentPage(1);
    setWindowStart(1);
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

  const validPageSize = Math.max(1, pageSizeInput || (attViewMode === "grid" ? 6 : 10));
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
      
      {/* HEADER BAR & MAIN TAB SWITCHER */}
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
              {t("hubTag")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {t("hubTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            {t("hubSubtitle")}
          </p>
        </div>

        {/* 2-Tab Navigation Switcher */}
        <div className="flex p-1.5 bg-zinc-100/90 rounded-2xl border border-zinc-200/80 self-start md:self-center shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveHubTab("shifts")}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeHubTab === "shifts"
                ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/60"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeHubTab === "shifts" ? "text-[#2AC1BC]" : "text-zinc-400"}`} />
            <span>{t("tabWorkSchedule")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHubTab("attendance")}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeHubTab === "attendance"
                ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/60"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Clock className={`w-4 h-4 ${activeHubTab === "attendance" ? "text-[#2AC1BC]" : "text-zinc-400"}`} />
            <span>{t("tabAttendance")}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: WORK SCHEDULE ROSTER (LỊCH PHÂN CA)                             */}
      {/* ========================================================================= */}
      {activeHubTab === "shifts" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Controls Bar for Shifts */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* House selector */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedHouse}
                onChange={(e) => setSelectedHouse(e.target.value)}
                className="px-3.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
              >
                <option value="all">{t("filterAllHouses")}</option>
                <option value="b1">{isEn ? "HOLA Dormitory (Block A)" : "KTX HOLA (Khu A)"}</option>
                <option value="b2">{isEn ? "Dormio Campus Cau Giay" : "Dormio Campus Cầu Giấy"}</option>
              </select>
            </div>

            {/* View Mode Toggle: Week vs List */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "week"
                      ? "bg-[#2AC1BC] text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {t("btnWeekView")}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-[#2AC1BC] text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {t("btnListView")}
                </button>
              </div>
            </div>
          </div>

          {/* Week Navigation bar */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-3.5 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs sm:text-sm font-black text-zinc-900">
                {t("weekLabel")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC]" />
              <span className="text-xs font-bold text-zinc-600">
                {t("todayIndicator")}
              </span>
            </div>
          </div>

          {/* VIEW MODE 1: WEEKLY CALENDAR GRID */}
          {viewMode === "week" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {weekDays.map((day, index) => {
                const schedulesForDay = filteredSchedules.filter(s => s.workDate === day.date);

                return (
                  <div
                    key={index}
                    className={`min-h-[260px] rounded-2xl border p-3 flex flex-col justify-between transition-all ${
                      day.isToday
                        ? "bg-[#2AC1BC]/5 border-[#2AC1BC] shadow-xs"
                        : "bg-white border-zinc-200/90 shadow-2xs"
                    }`}
                  >
                    {/* Day Header */}
                    <div className="border-b border-zinc-100 pb-2 mb-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                          {day.label}
                        </span>
                        <span className={`text-base font-black ${day.isToday ? "text-[#2AC1BC]" : "text-zinc-900"}`}>
                          {day.dayNum}/09
                        </span>
                      </div>
                      {day.isToday && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-[#2AC1BC] text-white">
                          {t("todayBadge")}
                        </span>
                      )}
                    </div>

                    {/* Shifts List for Day */}
                    <div className="space-y-2 flex-1">
                      {schedulesForDay.length > 0 ? (
                        schedulesForDay.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedSchedule(item);
                              setModalActiveTab("info");
                            }}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
                              item.status === "completed"
                                ? "bg-zinc-50 border-zinc-200 text-zinc-700"
                                : "bg-white border-[#2AC1BC]/40 hover:border-[#2AC1BC]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-black text-[#2AC1BC] uppercase truncate">
                                {getShiftName(item.shift.name)}
                              </span>
                              {item.isRecurring && (
                                <span title={t("recurringShiftTooltip")} className="inline-flex shrink-0">
                                  <Repeat className="w-3 h-3 text-zinc-400" />
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] font-bold text-zinc-900">
                              {item.shift.startTime} - {item.shift.endTime}
                            </div>

                            <div className="text-[10px] text-zinc-500 font-semibold truncate mt-1">
                              {getLocalizedPlace(item.boardingHouseName, isEn)}
                            </div>

                            {item.coWorkers.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1.5 pt-1 border-t border-zinc-100">
                                <Users className="w-3 h-3" />
                                <span>{t("plusCoworkers", { count: item.coWorkers.length })}</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-center py-8 text-[11px] text-zinc-400 font-medium italic">
                          {t("offShift")}
                        </div>
                      )}
                    </div>

                    {/* Day Footer note */}
                    <div className="pt-2 text-[10px] text-zinc-400 font-semibold text-center border-t border-zinc-100 mt-2">
                      {t("shiftCountPerDay", { count: schedulesForDay.length })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: UPCOMING LIST VIEW */}
          {viewMode === "list" && (
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-zinc-100 font-black text-xs text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2AC1BC]" />
                <span>{t("listHeaderTitle")}</span>
              </div>

              <div className="divide-y divide-zinc-100">
                {filteredSchedules.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedSchedule(item);
                      setModalActiveTab("info");
                    }}
                    className="p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 ${
                        item.workDate === "2026-09-09"
                          ? "bg-[#2AC1BC] text-white"
                          : "bg-zinc-100 text-zinc-800"
                      }`}>
                        <span className="text-[10px] uppercase">{item.workDate.slice(-2)}</span>
                        <span className="text-xs font-black">{isEn ? "SEP" : "T09"}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-zinc-900">
                            {getShiftName(item.shift.name)} ({item.shift.startTime} - {item.shift.endTime})
                          </span>
                          {item.isRecurring && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 flex items-center gap-1">
                              <Repeat className="w-2.5 h-2.5" /> {t("recurringBadge")}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-[#2AC1BC]" />
                            {getLocalizedPlace(item.boardingHouseName, isEn)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-[#2AC1BC]" />
                            {getPositionName(item.position.name)}
                          </span>
                          {item.coWorkers.length > 0 && (
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Users className="w-3.5 h-3.5" />
                              {t("withCoworkers", { names: item.coWorkers.map(c => getLocalizedStaffName(c.name, isEn)).join(", ") })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        item.status === "completed"
                          ? "bg-zinc-100 text-zinc-600"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {item.status === "completed" ? t("shiftStatusCompleted") : t("shiftStatusUpcoming")}
                      </span>
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-[#2AC1BC] hover:bg-[#2AC1BC]/10 transition-colors shadow-2xs"
                      >
                        {t("btnViewDuties")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ATTENDANCE HISTORY & TIMESHEET (NHẬT KÝ CHẤM CÔNG)               */}
      {/* ========================================================================= */}
      {activeHubTab === "attendance" && (
        <div className="space-y-6 animate-in fade-in duration-150">
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

              {/* View Mode Toggle: Grid vs Table */}
              <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200 ml-2">
                <button
                  type="button"
                  onClick={() => handleAttViewModeChange("grid")}
                  className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    attViewMode === "grid"
                      ? "bg-[#2AC1BC] text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                  title={t("viewGridTitle")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAttViewModeChange("table")}
                  className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    attViewMode === "table"
                      ? "bg-[#2AC1BC] text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                  title={t("viewTableTitle")}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* DISPLAY MODE 1: GRID VIEW (Default per Rule #9) */}
          {attViewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedAttendances.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-5 space-y-4 hover:border-[#2AC1BC]/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-zinc-100 text-[#2AC1BC]">
                          <Calendar className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-black text-zinc-900">{item.workDate}</span>
                      </div>

                      {item.status === "on_time" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {t("tableStatusOnTime")}
                        </span>
                      )}
                      {item.status === "late" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {t("tableStatusLate")}
                        </span>
                      )}
                      {item.status === "absent" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {t("tableStatusAbsent")}
                        </span>
                      )}
                      {item.status === "not_yet" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-zinc-100 text-zinc-600">
                          {t("statusNotYet")}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-zinc-900">{getShiftName(item.shiftName)}</h4>
                      <p className="text-xs text-zinc-500 font-semibold">{item.shiftTime}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2.5 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("tableColCheckIn")}</span>
                          <span className="font-bold text-zinc-800 font-mono text-sm">
                            {item.checkIn || "--:--"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("tableColCheckOut")}</span>
                          <span className="font-bold text-zinc-800 font-mono text-sm">
                            {item.checkOut || "--:--"}
                          </span>
                        </div>
                      </div>

                      {(item.checkInPhoto || item.checkOutPhoto) && (
                        <div className="pt-2 border-t border-zinc-200/70 flex items-center gap-3">
                          {item.checkInPhoto && (
                            <div
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
                              className="flex items-center gap-1.5 cursor-pointer group"
                              title={t("viewWatermarkCheckIn")}
                            >
                              <img
                                src={item.checkInPhoto}
                                alt="Check-in"
                                className="w-7 h-7 rounded-lg object-cover border border-zinc-200 group-hover:border-[#2AC1BC] transition-colors"
                              />
                              <span className="text-[10px] font-bold text-zinc-600 group-hover:text-[#2AC1BC] flex items-center gap-0.5">
                                <Camera className="w-2.5 h-2.5 text-[#2AC1BC]" /> {t("checkInBadge")}
                              </span>
                            </div>
                          )}

                          {item.checkOutPhoto && (
                            <div
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
                              className="flex items-center gap-1.5 cursor-pointer group"
                              title={t("viewWatermarkCheckOut")}
                            >
                              <img
                                src={item.checkOutPhoto}
                                alt="Check-out"
                                className="w-7 h-7 rounded-lg object-cover border border-zinc-200 group-hover:border-[#2AC1BC] transition-colors"
                              />
                              <span className="text-[10px] font-bold text-zinc-600 group-hover:text-[#2AC1BC] flex items-center gap-0.5">
                                <Camera className="w-2.5 h-2.5 text-emerald-600" /> {t("checkOutBadge")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {item.checkInExplanation && (
                      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-[11px] text-amber-900 space-y-0.5">
                        <span className="font-bold flex items-center gap-1 text-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          {t("lateExplanationPrefix")}
                        </span>
                        <p className="italic text-zinc-700 leading-tight">
                          &quot;{getLocalizedExplanation(item.checkInExplanation, isEn)}&quot;
                        </p>
                      </div>
                    )}

                    {item.checkOutExplanation && (
                      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-[11px] text-amber-900 space-y-0.5">
                        <span className="font-bold flex items-center gap-1 text-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          {t("earlyExplanationPrefix")}
                        </span>
                        <p className="italic text-zinc-700 leading-tight">
                          &quot;{getLocalizedExplanation(item.checkOutExplanation, isEn)}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium">
                      {getLocalizedPlace(item.boardingHouseName, isEn)}
                    </span>
                    <span className="font-black text-[#2AC1BC]">
                      {t("workHours", { hours: item.totalHours })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DISPLAY MODE 2: TABLE VIEW */}
          {attViewMode === "table" && (
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHIFT DETAIL MODAL: TÁCH RIÊNG 2 TAB "THÔNG TIN CA" & "NHIỆM VỤ CA"        */}
      {/* ========================================================================= */}
      {selectedSchedule && (
        <div
          onClick={() => setSelectedSchedule(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl p-6 sm:p-7 space-y-5 animate-scaleIn cursor-default my-auto border border-zinc-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-[#2AC1BC] uppercase tracking-wider block">
                  {t("detailTag")}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-zinc-900">
                  {getShiftName(selectedSchedule.shift.name)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal 2-Tab Switcher: Thông tin ca làm vs Nhiệm vụ ca làm */}
            <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs">
              <button
                type="button"
                onClick={() => setModalActiveTab("info")}
                className={`flex-1 py-2 rounded-lg font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalActiveTab === "info"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Info className="w-3.5 h-3.5 text-[#2AC1BC]" />
                <span>{t("modalTabShiftInfo")}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab("duties")}
                className={`flex-1 py-2 rounded-lg font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalActiveTab === "duties"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#2AC1BC]" />
                <span>{t("modalTabShiftDuties")}</span>
              </button>
            </div>

            {/* TAB CONTENT A: THÔNG TIN CA LÀM */}
            {modalActiveTab === "info" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">{t("detailDate")}</span>
                    <span className="font-bold text-zinc-900">{selectedSchedule.workDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">{t("detailPlace")}</span>
                    <span className="font-bold text-zinc-900">{getLocalizedPlace(selectedSchedule.boardingHouseName, isEn)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">{t("detailPosition")}</span>
                    <span className="font-bold text-[#2AC1BC]">{getPositionName(selectedSchedule.position.name)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">{t("detailShiftType")}</span>
                    <span className="font-bold text-zinc-700">
                      {selectedSchedule.isRecurring ? t("shiftTypeRecurring") : t("shiftTypeOneTime")}
                    </span>
                  </div>
                </div>

                {selectedSchedule.coWorkers.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#2AC1BC]" />
                      <span>{t("detailCoworkersTitle")}</span>
                    </h4>
                    <div className="space-y-2">
                      {selectedSchedule.coWorkers.map((cw) => (
                        <div key={cw.id} className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <img src={cw.avatar} alt={cw.name} className="w-8 h-8 rounded-full object-cover border border-zinc-200" />
                            <div>
                              <span className="font-bold text-zinc-900 block">{getLocalizedStaffName(cw.name, isEn)}</span>
                              <span className="text-[10px] text-zinc-500">{getPositionName(cw.positionName)}</span>
                            </div>
                          </div>
                          <a href={`tel:${cw.phone}`} className="p-1.5 rounded-lg bg-white border border-zinc-200 text-[#2AC1BC] hover:bg-teal-50 shadow-2xs">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT B: NHIỆM VỤ CA LÀM (HIỂN THỊ NHIỆM VỤ HÀNG NGÀY + NÚT CHUYỂN NHIỆM VỤ BỔ SUNG NẾU CÓ) */}
            {modalActiveTab === "duties" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* 1. Daily routine tasks for this position */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#2AC1BC]" />
                      <span>{isEn ? "Fixed Daily Routine Duties" : "Nhiệm vụ hàng ngày cố định"}</span>
                    </h4>
                    <span className="text-[10px] font-bold text-[#2AC1BC] px-2.5 py-0.5 rounded-full bg-[#2AC1BC]/10 border border-[#2AC1BC]/20">
                      {getPositionName(selectedSchedule.position.name)}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 space-y-2.5">
                    {getDutyLines(selectedSchedule).map((line, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-[#2AC1BC] mt-1.5 shrink-0" />
                        <span className="leading-relaxed font-medium">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Additional tasks / Landlord reminders deadline on this date */}
                {additionalTasksOnSelectedDate.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-black text-amber-900">
                          {isEn
                            ? `Upcoming Additional Deadlines (${additionalTasksOnSelectedDate.length})`
                            : `Có ${additionalTasksOnSelectedDate.length} nhiệm vụ bổ sung / nhắc nhở trong ngày!`}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 font-bold text-[10px]">
                        {selectedSchedule.workDate}
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                      {isEn
                        ? "Landlord assigned additional ad-hoc tasks or urgent reminders due on this date."
                        : "Chủ trọ có giao thêm các nhắc nhở, kiểm tra đột xuất hoặc xử lý sự cố có hạn chót trong ngày này."}
                    </p>

                    <Link
                      href={`/staff/tasks?tab=additional&date=${selectedSchedule.workDate}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>
                        {isEn
                          ? `View Additional Tasks (${additionalTasksOnSelectedDate.length}) →`
                          : `Nhiệm vụ bổ sung (${additionalTasksOnSelectedDate.length}) →`}
                      </span>
                    </Link>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-zinc-500 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {isEn
                        ? "No additional tasks/reminders on this day. Only routine daily duties apply."
                        : "Ngày này không có nhiệm vụ bổ sung. Chỉ thực hiện nhiệm vụ hàng ngày cố định."}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {t("btnClose")}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default function StaffSchedulePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400 font-bold">Loading...</div>}>
      <StaffScheduleAndAttendanceContent />
    </Suspense>
  );
}
