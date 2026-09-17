"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense, useRef } from "react";
import Link from "next/link";
import {
  Calendar, Clock, Building2, Shield, Users,
  ChevronLeft, ChevronRight, Info, X, CheckCircle2,
  AlertTriangle, Phone, ArrowLeft, ArrowRight,
  Camera, Eye, CheckSquare, Sparkles, User, FileText,
  Trash2, Upload, BellRing, RefreshCw
} from "lucide-react";
import {
  DutyTaskItem,
  getLocalizedPlace,
  getLocalizedStaffName,
  getCurrentWeekDays,
  getTodayISODate
} from "../data";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import {
  staffScheduleService,
  StaffBoardingHouse,
  StaffScheduleItem,
} from "@/services/staff-schedule.service";
import {
  staffAttendanceService,
  StaffTodayOverview,
} from "@/services/staff-attendance.service";

function StaffScheduleContent() {
  const t = useTranslations("staffPortal");
  const { locale } = useLanguage();
  const isEn = locale === "en";

  // Boarding houses list & filter
  const [boardingHouses, setBoardingHouses] = useState<StaffBoardingHouse[]>([]);
  const [isHousesLoading, setIsHousesLoading] = useState<boolean>(true);
  const [selectedHouse, setSelectedHouse] = useState<string>("all");

  // Week anchor date for navigation (Mon-Sun window)
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => new Date());

  // Schedules state
  const [schedules, setSchedules] = useState<StaffScheduleItem[]>([]);
  const [isSchedulesLoading, setIsSchedulesLoading] = useState<boolean>(true);

  // Selected schedule item for unified detail modal
  const [selectedSchedule, setSelectedSchedule] = useState<StaffScheduleItem | null>(null);

  // Today's attendance overview & duties checklist state
  const [todayOverview, setTodayOverview] = useState<StaffTodayOverview | null>(null);
  const [todayDuties, setTodayDuties] = useState<DutyTaskItem[]>([]);
  const [isDutiesLoading, setIsDutiesLoading] = useState<boolean>(true);

  // Today's ISO date string
  const todayStr = getTodayISODate();

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type?: "success" | "info" | "warning" } | null>(null);
  const showToast = (message: string, type: "success" | "info" | "warning" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Helper translations for shift names
  const getShiftName = (name: string) => {
    if (name.includes("Sáng")) return `${t("shiftMorning")} (07:00 - 15:00)`;
    if (name.includes("Chiều")) return `${t("shiftAfternoon")} (15:00 - 23:00)`;
    if (name.includes("Đêm")) return `${t("shiftNight")} (23:00 - 07:00)`;
    return name;
  };

  const getPositionName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("bảo vệ") || lower.includes("an ninh") || lower.includes("security")) return t("positionSecurity");
    if (lower.includes("vệ sinh") || lower.includes("cleaning")) return t("positionCleaning");
    if (lower.includes("kỹ thuật") || lower.includes("bảo trì") || lower.includes("technical")) return t("positionTechnical");
    return name;
  };

  // Dynamic week days based on weekAnchor (Mon-Sun)
  const weekDays = useMemo(() => {
    const rawDays = getCurrentWeekDays(weekAnchor);
    const labels = [t("dayMon"), t("dayTue"), t("dayWed"), t("dayThu"), t("dayFri"), t("daySat"), t("daySun")];
    return rawDays.map((d, idx) => ({
      label: labels[idx] || d.label,
      date: d.date,
      dayNum: d.dayNum,
      isToday: d.isToday
    }));
  }, [weekAnchor, t]);

  const startDate = weekDays[0]?.date;
  const endDate = weekDays[weekDays.length - 1]?.date;

  // Real-time dynamic today indicator label
  const todayLabel = useMemo(() => {
    const now = new Date();
    const dayOfWeekIndex = now.getDay();
    const dayNames = [t("daySun"), t("dayMon"), t("dayTue"), t("dayWed"), t("dayThu"), t("dayFri"), t("daySat")];
    const dayName = dayNames[dayOfWeekIndex] || "";
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}`;
    return t("todayWithDayDate", { day: dayName, date: formattedDate });
  }, [t]);

  // 1. Fetch active assigned boarding houses
  useEffect(() => {
    let mounted = true;
    setIsHousesLoading(true);
    staffScheduleService
      .getBoardingHouses()
      .then((houses) => {
        if (mounted) setBoardingHouses(houses);
      })
      .catch((err) => {
        console.error("Failed to load staff boarding houses:", err);
        if (mounted) setBoardingHouses([]);
      })
      .finally(() => {
        if (mounted) setIsHousesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch schedules for current week window & selected property
  const fetchSchedules = useCallback(async () => {
    if (!startDate || !endDate) return;
    setIsSchedulesLoading(true);
    try {
      const items = await staffScheduleService.getSchedules({
        startDate,
        endDate,
        boardingHouseId: selectedHouse,
      });
      setSchedules(items);
    } catch (err) {
      console.error("Failed to load staff schedules:", err);
      setSchedules([]);
    } finally {
      setIsSchedulesLoading(false);
    }
  }, [startDate, endDate, selectedHouse]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // 3. Fetch today's duties checklist & sync with attendance overview
  const fetchTodayDuties = useCallback(async () => {
    setIsDutiesLoading(true);
    try {
      const overview = await staffAttendanceService.getTodayOverview();
      setTodayOverview(overview);
      if (overview?.schedule?.duties && Array.isArray(overview.schedule.duties)) {
        setTodayDuties(overview.schedule.duties);
      } else {
        setTodayDuties([]);
      }
    } catch (err) {
      console.error("Failed to load today duties overview:", err);
      setTodayOverview(null);
      setTodayDuties([]);
    } finally {
      setIsDutiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayDuties();

    const handleSync = () => {
      fetchTodayDuties();
    };

    window.addEventListener("dormio_attendance_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("dormio_attendance_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [fetchTodayDuties]);

  // Navigation handlers
  const handlePrevWeek = () => {
    setWeekAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setWeekAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleCurrentWeek = () => {
    setWeekAnchor(new Date());
  };

  // Helper to extract duty lines from item
  const getDutyLines = (item: StaffScheduleItem) => {
    if (item.duties && item.duties.length > 0) {
      return item.duties.map(d => d.title);
    }
    if (!item.position.description) return [];
    return item.position.description.split("\n").filter(Boolean).map(line => line.replace(/^[•\s\d.-]+/, ""));
  };

  // =========================================================================
  // NHIỆM VỤ HÔM NAY (TODAY'S TASKS) STATE & HANDLERS
  // =========================================================================
  const [activeDutyForProof, setActiveDutyForProof] = useState<DutyTaskItem | null>(null);
  const [dutyDraftPhoto, setDutyDraftPhoto] = useState<string | null>(null);
  const [dutyDraftNote, setDutyDraftNote] = useState<string>("");
  const dutyFileInputRef = useRef<HTMLInputElement>(null);

  // Enlarged photo preview lightbox
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{
    isOpen: boolean;
    title: string;
    imageUrl: string;
    note?: string;
  } | null>(null);

  const handleOpenDutyProofModal = (duty: DutyTaskItem) => {
    setActiveDutyForProof(duty);
    setDutyDraftPhoto(duty.photoProof || null);
    setDutyDraftNote(duty.note || "");
  };

  const handleToggleDuty = async (duty: DutyTaskItem) => {
    if (duty.requiresPhoto && !duty.photoProof && !duty.completed) {
      handleOpenDutyProofModal(duty);
      showToast(t("toastDutyProofRequired"), "warning");
      return;
    }

    if (!todayOverview?.schedule?.id) {
      showToast(t("toastNoActiveShiftDuty"), "warning");
      return;
    }

    try {
      const res = await staffAttendanceService.saveDutyProof({
        workScheduleId: todayOverview.schedule.id,
        dutyId: duty.id,
        markCompleted: !duty.completed,
      });

      if (res?.schedule?.duties) {
        setTodayDuties(res.schedule.duties);
      }
      window.dispatchEvent(new CustomEvent("dormio_attendance_updated"));
      showToast(t("toastDutyStatusUpdated"), "success");
    } catch (err: any) {
      showToast(err?.message || t("toastDutyUpdateFailed"), "warning");
    }
  };

  const handleSaveDutyProof = async (markComplete: boolean) => {
    if (!activeDutyForProof) return;

    if (
      markComplete &&
      activeDutyForProof.requiresPhoto &&
      !dutyDraftPhoto &&
      !activeDutyForProof.photoProof
    ) {
      showToast(t("toastDutyProofRequired"), "warning");
      return;
    }

    if (!todayOverview?.schedule?.id) {
      showToast(t("toastNoActiveShiftProof"), "warning");
      return;
    }

    try {
      const res = await staffAttendanceService.saveDutyProof({
        workScheduleId: todayOverview.schedule.id,
        dutyId: activeDutyForProof.id,
        photo: dutyDraftPhoto || undefined,
        note: dutyDraftNote.trim() || undefined,
        markCompleted: markComplete,
      });

      if (res?.schedule?.duties) {
        setTodayDuties(res.schedule.duties);
      }
      window.dispatchEvent(new CustomEvent("dormio_attendance_updated"));
      setActiveDutyForProof(null);

      if (markComplete) {
        showToast(t("toastDutyCompleted"), "success");
      } else {
        showToast(t("toastDutyProgressUpdated"), "info");
      }
    } catch (err: any) {
      showToast(err?.message || t("toastDutyProofSaveFailed"), "warning");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setDutyDraftPhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Progress metrics
  const totalDuties = todayDuties.length;
  const completedDuties = todayDuties.filter((d) => d.completed).length;
  const progressPercent = totalDuties > 0 ? Math.round((completedDuties / totalDuties) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              toast.type === "warning"
                ? "bg-amber-900 text-amber-100 border-amber-800"
                : toast.type === "success"
                  ? "bg-emerald-900 text-emerald-100 border-emerald-800"
                  : "bg-zinc-900 text-white border-zinc-800"
            }`}
          >
            {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {(!toast.type || toast.type === "info") && <Sparkles className="w-4 h-4 text-[#2AC1BC] shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

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
              {t("schedTag")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {t("schedTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            {t("schedSubtitle")}
          </p>
        </div>

        {/* Action Button to Attendance History */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <Link
            href="/staff/shift-history"
            className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-black flex items-center gap-2 transition-all shadow-2xs border border-zinc-200/80 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-[#2AC1BC]" />
            <span>{t("btnViewAttendanceHistory")}</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: WORK SCHEDULE ROSTER (LỊCH PHÂN CA TUẦN)                         */}
      {/* ========================================================================= */}
      <div className="space-y-5 animate-in fade-in duration-150">
        {/* Controls Bar */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* House selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-400" />
            {isHousesLoading ? (
              <div className="h-8 w-44 bg-zinc-100 rounded-xl animate-pulse" />
            ) : (
              <select
                value={selectedHouse}
                onChange={(e) => setSelectedHouse(e.target.value)}
                className="px-3.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
              >
                <option value="all">{t("filterAllHouses")}</option>
                {boardingHouses.map((house) => (
                  <option key={house.id} value={house.id}>
                    {getLocalizedPlace(house.name, isEn)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCurrentWeek}
              className="text-xs font-bold text-zinc-600 hover:text-[#2AC1BC] flex items-center gap-1.5 transition-colors cursor-pointer"
              title={t("titleReturnCurrentWeek")}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC]" />
              <span>{todayLabel}</span>
            </button>
          </div>
        </div>

        {/* Week Navigation bar */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 cursor-pointer transition-colors"
                title={t("titlePrevWeek")}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 cursor-pointer transition-colors"
                title={t("titleNextWeek")}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Nút bấm "Xem lịch hôm nay" để trở về lịch làm việc của tuần hiện tại */}
            <button
              type="button"
              onClick={handleCurrentWeek}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#2AC1BC] hover:text-[#22a8a4] border border-[#2AC1BC]/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title={t("titleTodaySchedule")}
            >
              <Calendar className="w-3.5 h-3.5 text-[#2AC1BC]" />
              <span>{t("btnTodaySchedule")}</span>
            </button>

            <span className="text-xs sm:text-sm font-black text-zinc-900 ml-1">
              {t("weekLabel")}
            </span>
          </div>

          <span className="text-xs font-semibold text-zinc-500 bg-zinc-50 px-3 py-1 rounded-xl border border-zinc-200/80 font-mono self-start sm:self-center">
            {startDate} — {endDate}
          </span>
        </div>

        {/* SKELETON LOADING STATE FOR WEEK CALENDAR */}
        {isSchedulesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDays.map((_, idx) => (
              <div
                key={idx}
                className="min-h-[260px] rounded-2xl border border-zinc-200/90 p-3 bg-white shadow-2xs flex flex-col justify-between animate-pulse"
              >
                <div className="border-b border-zinc-100 pb-2 mb-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-3 w-10 bg-zinc-200 rounded" />
                    <div className="h-5 w-12 bg-zinc-200 rounded" />
                  </div>
                </div>
                <div className="space-y-2 flex-1 pt-2">
                  <div className="h-16 bg-zinc-100 rounded-xl" />
                  <div className="h-16 bg-zinc-100 rounded-xl" />
                </div>
                <div className="pt-2 border-t border-zinc-100 mt-2">
                  <div className="h-3 w-14 mx-auto bg-zinc-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* WEEKLY CALENDAR GRID (7 columns) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {weekDays.map((day, index) => {
                const schedulesForDay = schedules.filter((s) => s.workDate === day.date);

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
                        <span
                          className={`text-base font-black ${
                            day.isToday ? "text-[#2AC1BC]" : "text-zinc-900"
                          }`}
                        >
                          {day.dayNum}/{day.date.split("-")[1] || "09"}
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
                            onClick={() => setSelectedSchedule(item)}
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
                            </div>

                            <div className="text-[11px] font-bold text-zinc-900">
                              {item.shift.startTime} - {item.shift.endTime}
                            </div>

                            <div className="text-[10px] text-zinc-500 font-semibold truncate mt-1">
                              {getLocalizedPlace(item.boardingHouseName, isEn)}
                            </div>

                            {item.coWorkers && item.coWorkers.length > 0 && (
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
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: NHIỆM VỤ HÔM NAY (TODAY'S TASKS CHECKLIST)                      */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4 border-t border-zinc-200/80">
        {/* Section Header & Progress Card */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-[#2AC1BC]/10 text-[#2AC1BC]">
                <CheckSquare className="w-4 h-4" />
              </span>
              <span className="text-xs font-black text-[#2AC1BC] uppercase tracking-wider">
                {t("todayDutiesTag")}
              </span>
              <span className="text-xs text-zinc-400 font-medium">• {todayStr}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-900">
              {t("todayDutiesTitle")}
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              {t("todayDutiesDesc")}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3.5 min-w-[200px] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-600">
                  {t("dutyProgressLabel")}
                </span>
                <span className="font-black text-[#2AC1BC] text-sm font-mono">
                  {completedDuties}/{totalDuties} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-linear-to-r from-[#2AC1BC] to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SKELETON LOADING STATE FOR DUTIES */}
        {isDutiesLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-white rounded-2xl border border-zinc-200/90 p-4" />
            <div className="h-20 bg-white rounded-2xl border border-zinc-200/90 p-4" />
            <div className="h-20 bg-white rounded-2xl border border-zinc-200/90 p-4" />
          </div>
        ) : todayDuties.length > 0 ? (
          /* Duties List */
          <div className="space-y-3">
            {todayDuties.map((duty, idx) => (
              <div
                key={duty.id}
                className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  duty.completed
                    ? "border-emerald-200 bg-emerald-50/20"
                    : "border-zinc-200/90 hover:border-[#2AC1BC]/50 shadow-2xs"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <input
                    type="checkbox"
                    checked={duty.completed}
                    onChange={() => handleToggleDuty(duty)}
                    className="w-5 h-5 rounded-md text-[#2AC1BC] focus:ring-[#2AC1BC] mt-1 cursor-pointer shrink-0"
                  />

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-400">
                        #{idx + 1}
                      </span>
                      <h3
                        className={`text-sm font-black text-zinc-900 leading-snug ${
                          duty.completed ? "line-through text-zinc-500" : ""
                        }`}
                      >
                        {duty.title}
                      </h3>
                      {duty.requiresPhoto ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-amber-600" />
                          {t("dutyPhotoRequired")}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 text-zinc-500">
                          {t("dutyPhotoOptional")}
                        </span>
                      )}
                    </div>

                    {duty.note && (
                      <p className="text-xs text-zinc-600 italic bg-white/70 p-2 rounded-xl border border-zinc-200/60 inline-block font-medium">
                        Ghi chú: &quot;{duty.note}&quot;
                      </p>
                    )}

                    {duty.completedAt && (
                      <span className="text-[11px] text-emerald-600 font-bold block">
                        ✓ {t("dutyCompletedAt", { time: duty.completedAt })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: Photo proof thumbnail and action button */}
                <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                  {duty.photoProof && (
                    <div
                      onClick={() =>
                        setPreviewPhotoModal({
                          isOpen: true,
                          title: duty.title,
                          imageUrl: duty.photoProof!,
                          note: duty.note,
                        })
                      }
                      className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-[#2AC1BC] cursor-pointer group transition-colors"
                      title={t("titleEnlargePhoto")}
                    >
                      <img
                        src={duty.photoProof}
                        alt="Proof"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="text-left pr-1 hidden sm:block">
                        <span className="text-[10px] font-bold text-zinc-700 group-hover:text-[#2AC1BC] block flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" /> {t("dutyAuditProof")}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono">
                          {duty.photoProofTime || todayStr}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenDutyProofModal(duty)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#2AC1BC]" />
                    <span>{t("btnUpdateDetails")}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State: Thông báo không có nhiệm vụ */
          <div className="p-8 rounded-3xl bg-white border border-dashed border-zinc-200 text-center space-y-2.5">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-zinc-800">
              {t("noTasksAssigned")}
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {t("noTasksAssignedDesc")}
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED SHIFT DETAIL MODAL: GỘP THÔNG TIN CA LÀM & NHIỆM VỤ CA LÀM       */}
      {/* ========================================================================= */}
      {selectedSchedule && (
        <div
          onClick={() => setSelectedSchedule(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl p-6 sm:p-7 space-y-5 animate-scaleIn cursor-default my-auto border border-zinc-200 max-h-[90vh] overflow-y-auto"
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

            {/* UNIFIED CONTENT: SHIFT INFO + CO-WORKERS + DUTIES (NO TABS) */}
            <div className="space-y-5">
              {/* 1. General Shift Info */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">{t("detailDate")}</span>
                  <span className="font-bold text-zinc-900">{selectedSchedule.workDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">{t("detailPlace")}</span>
                  <span className="font-bold text-zinc-900">
                    {getLocalizedPlace(selectedSchedule.boardingHouseName, isEn)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">{t("detailPosition")}</span>
                  <span className="font-bold text-[#2AC1BC]">
                    {getPositionName(selectedSchedule.position.name)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">{t("detailShiftType")}</span>
                  <span className="font-bold text-zinc-700">
                    {selectedSchedule.isRecurring ? t("shiftTypeRecurring") : t("shiftTypeOneTime")}
                  </span>
                </div>
              </div>

              {/* 2. Co-workers on duty */}
              {selectedSchedule.coWorkers && selectedSchedule.coWorkers.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#2AC1BC]" />
                    <span>{t("detailCoworkersTitle")}</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedSchedule.coWorkers.map((cw) => (
                      <div
                        key={cw.id}
                        className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              cw.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                cw.name
                              )}&background=2AC1BC&color=fff`
                            }
                            alt={cw.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                          />
                          <div>
                            <span className="font-bold text-zinc-900 block">
                              {getLocalizedStaffName(cw.name, isEn)}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {getPositionName(cw.positionName)}
                            </span>
                          </div>
                        </div>
                        {cw.phone && (
                          <a
                            href={`tel:${cw.phone}`}
                            className="p-1.5 rounded-lg bg-white border border-zinc-200 text-[#2AC1BC] hover:bg-teal-50 shadow-2xs"
                            title={`Gọi cho ${cw.name}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Fixed Daily Routine Duties */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#2AC1BC]" />
                    <span>{t("routineDutiesTitle")}</span>
                  </h4>
                  <span className="text-[10px] font-bold text-[#2AC1BC] px-2.5 py-0.5 rounded-full bg-[#2AC1BC]/10 border border-[#2AC1BC]/20">
                    {getPositionName(selectedSchedule.position.name)}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 space-y-2.5">
                  {getDutyLines(selectedSchedule).length > 0 ? (
                    getDutyLines(selectedSchedule).map((line, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-[#2AC1BC] mt-1.5 shrink-0" />
                        <span className="leading-relaxed font-medium">{line}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-400 italic">
                      {t("noRoutineDuties")}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Additional tasks / Landlord reminders */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-amber-500" />
                  <span>{t("landlordTasksTitle")}</span>
                </h4>

                {selectedSchedule.additionalTasks && selectedSchedule.additionalTasks.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-black text-amber-900">
                          {t("upcomingDeadlines", { count: selectedSchedule.additionalTasks.length })}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 font-bold text-[10px]">
                        {selectedSchedule.workDate}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-amber-200/60">
                      {selectedSchedule.additionalTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-zinc-900">{task.title}</span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                              {task.deadline}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-zinc-600 leading-snug">{task.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-zinc-500 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {t("noAdditionalTasks")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Close Button */}
            <div className="pt-3 border-t border-zinc-100">
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

      {/* ========================================================================= */}
      {/* DUTY PROOF & NOTE MODAL                                                   */}
      {/* ========================================================================= */}
      {activeDutyForProof && (
        <div
          onClick={() => setActiveDutyForProof(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 cursor-default my-auto border border-zinc-200 animate-scaleIn"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2AC1BC]" />
                <h3 className="text-base font-black text-zinc-900 truncate">
                  {t("dutyModalHeader")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDutyForProof(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task Info */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                {t("taskTitleLabel")}
              </span>
              <h4 className="text-xs font-black text-zinc-900 leading-snug">
                {activeDutyForProof.title}
              </h4>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
                {activeDutyForProof.requiresPhoto ? (
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <Camera className="w-3 h-3 text-amber-600" />
                    {t("proofMandatory")}
                  </span>
                ) : (
                  <span className="text-zinc-500">
                    {t("proofOptional")}
                  </span>
                )}
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={dutyFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Photo Upload / Preview */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-600 block">
                {t("auditPhotoLabel")}
              </label>

              {dutyDraftPhoto ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <img
                    src={dutyDraftPhoto}
                    alt="Proof"
                    className="w-16 h-16 rounded-xl object-cover border border-zinc-200"
                  />
                  <div className="space-y-1 text-xs flex-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ {t("photoAttached")}
                    </span>
                    <p className="text-[11px] text-zinc-500 font-mono">{todayStr}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDutyDraftPhoto(null)}
                    className="p-2 rounded-xl bg-white hover:bg-red-50 text-zinc-400 hover:text-red-600 border border-zinc-200 transition-colors cursor-pointer"
                    title={t("deletePhoto")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => dutyFileInputRef.current?.click()}
                  className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-zinc-300 hover:border-[#2AC1BC] bg-zinc-50/70 hover:bg-[#2AC1BC]/5 text-zinc-700 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-[#2AC1BC]" />
                  <span>{t("clickToCapturePhoto")}</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    {t("autoTimestampDesc")}
                  </span>
                </button>
              )}
            </div>

            {/* Note input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-600 block">
                {t("dutyNoteLabel")}
              </label>
              <textarea
                rows={3}
                value={dutyDraftNote}
                onChange={(e) => setDutyDraftNote(e.target.value)}
                placeholder={t("dutyNotePlaceholder")}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2AC1BC] leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setActiveDutyForProof(null)}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {t("btnCancel")}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveDutyProof(false)}
                  className="px-4 py-2.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{t("saveProgress")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveDutyProof(true)}
                  className="px-4.5 py-2.5 bg-[#2AC1BC] hover:bg-[#22a8a4] text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("btnCompleteDuty")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHOTO PREVIEW LIGHTBOX                                                    */}
      {/* ========================================================================= */}
      {previewPhotoModal && previewPhotoModal.isOpen && (
        <div
          onClick={() => setPreviewPhotoModal(null)}
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
                  {previewPhotoModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-zinc-950 aspect-video max-h-[380px] flex items-center justify-center">
              <img
                src={previewPhotoModal.imageUrl}
                alt="Audit proof"
                className="w-full h-full object-contain"
              />
            </div>

            {previewPhotoModal.note && (
              <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-700 space-y-1">
                <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] block">
                  {t("lightboxNoteLabel")}
                </span>
                <p className="italic text-zinc-900 font-medium leading-relaxed">
                  &quot;{previewPhotoModal.note}&quot;
                </p>
              </div>
            )}

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
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
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-zinc-400 font-bold">
          Loading...
        </div>
      }
    >
      <StaffScheduleContent />
    </Suspense>
  );
}
