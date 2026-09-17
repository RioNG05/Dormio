"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Clock, CheckCircle2, AlertCircle, Building2, User,
  Calendar, Shield, Phone, CheckSquare,
  Sparkles, MapPin, LogOut, ArrowRight,
  RefreshCw, Check, Users, Camera, Image as
    Upload, Eye, X, AlertTriangle, ShieldCheck, FileText,
  Info, Lock
} from "lucide-react";
import {
  evaluateCheckInWindow,
  evaluateCheckOutWindow,
  Shift,
  JobPosition,
  WorkScheduleItem,
  AttendanceRecord,
  AttendanceWatermark,
  DutyTaskItem,
  getLocalizedPlace,
  getLocalizedStaffName,
  getLocalizedExplanation,
  getTodayISODate,
  saveAttendanceRecord
} from "./data";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { staffAttendanceService, StaffMonthlySummary } from "@/services/staff-attendance.service";

function getDutyTitle(duty: DutyTaskItem, _isEn = false): string {
  return duty.title;
}

function getDutyNote(note?: string, _isEn = false): string {
  return note || "";
}

export default function StaffOverviewPage() {
  const t = useTranslations("staffPortal");
  const { locale } = useLanguage();

  // Live Clock
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Mount state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);

  const { user } = useAuth();

  // Today's schedule & duties state (initialized to null to represent no mock data)
  const [todaySchedule, setTodaySchedule] = useState<WorkScheduleItem | null>(null);
  const [dutyList, setDutyList] = useState<DutyTaskItem[]>([]);
  const [staffName, setStaffName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const todayAdditionalTasks: any[] = [];

  // Active attendance state
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);

  // Monthly summary state (UC-S-02)
  const [monthlySummary, setMonthlySummary] = useState<StaffMonthlySummary | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Fetch live overview from backend (UC-S-01 & UC-S-02)
  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await staffAttendanceService.getTodayOverview();
      if (data) {
        if (data.staffName) {
          setStaffName(data.staffName);
        }
        if (data.schedule && data.schedule.id) {
          setTodaySchedule(data.schedule);
          if (data.schedule.duties && Array.isArray(data.schedule.duties)) {
            setDutyList(data.schedule.duties);
          } else {
            setDutyList([]);
          }
        } else {
          setTodaySchedule(null);
          setDutyList([]);
        }

        if (data.attendance && data.attendance.id) {
          setAttendance(data.attendance);
          saveAttendanceRecord(data.attendance);
        } else {
          setAttendance(null);
        }
      } else {
        setTodaySchedule(null);
        setAttendance(null);
        setDutyList([]);
      }
    } catch (err: any) {
      console.warn("Could not fetch today's staff overview from backend:", err);
      setTodaySchedule(null);
      setAttendance(null);
      setDutyList([]);
      setFetchError(err?.message || (locale === "en" ? "Failed to load schedule from server" : "Không thể tải dữ liệu ca làm việc từ máy chủ"));
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  // Fetch monthly attendance summary from backend (UC-S-02)
  const fetchMonthlySummary = useCallback(async () => {
    try {
      const summary = await staffAttendanceService.getMonthlySummary();
      if (summary) {
        setMonthlySummary(summary);
      }
    } catch (err) {
      console.warn("Could not fetch monthly attendance summary from backend:", err);
    }
  }, []);

  // Safe client-side mount & lifecycle sync
  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());

    fetchOverview();
    fetchMonthlySummary();

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleAttendanceEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AttendanceRecord>;
      if (customEvent.detail) {
        setAttendance(customEvent.detail);
      }
    };
    window.addEventListener("dormio_attendance_updated", handleAttendanceEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("dormio_attendance_updated", handleAttendanceEvent);
    };
  }, [fetchOverview, fetchMonthlySummary]);

  // Format current effective time string (HH:mm:ss)
  const effectiveTimeString = currentTime
    ? currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : "00:00:00";

  const effectiveHHMM = currentTime
    ? currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "00:00";

  // Evaluate check-in & check-out window constraints (UC-S-02)
  const checkInEval = useMemo(() => {
    if (!todaySchedule) {
      return { allowed: false, isLate: false, isTooEarly: false, reason: "" };
    }
    return evaluateCheckInWindow(
      todaySchedule.shift,
      effectiveHHMM,
      Boolean(attendance?.checkIn)
    );
  }, [todaySchedule, effectiveHHMM, attendance?.checkIn]);

  const checkOutEval = useMemo(() => {
    if (!todaySchedule) {
      return { allowed: false, isEarly: false, reason: "" };
    }
    return evaluateCheckOutWindow(
      todaySchedule.shift,
      effectiveHHMM,
      Boolean(attendance?.checkIn),
      Boolean(attendance?.checkOut)
    );
  }, [todaySchedule, effectiveHHMM, attendance?.checkIn, attendance?.checkOut]);

  // Modals state
  const [activeModal, setActiveModal] = useState<"checkin" | "checkout" | "duty_proof" | null>(null);
  const [selectedDutyForProof, setSelectedDutyForProof] = useState<DutyTaskItem | null>(null);

  // Full-screen Image Preview Lightbox
  const [previewImageModal, setPreviewImageModal] = useState<{
    isOpen: boolean;
    title: string;
    imageUrl: string;
    watermark?: AttendanceWatermark;
    note?: string;
  } | null>(null);

  // Rule #10: Unsaved changes confirmation modal
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [hasFormDraftChanges, setHasFormDraftChanges] = useState(false);

  const getShiftName = (s: Shift) => {
    if (locale !== "en") return s.name;
    if (s.id === "shift-morning") return "Morning Shift";
    if (s.id === "shift-afternoon") return "Afternoon Shift";
    if (s.id === "shift-night") return "Night Shift";
    return s.name;
  };

  const getPositionName = (posOrName: string | JobPosition) => {
    const name = typeof posOrName === "string" ? posOrName : posOrName.name;
    if (locale !== "en") return name;
    const lower = name.toLowerCase();
    if (lower.includes("bảo vệ") || lower.includes("an ninh")) return "Head of Security";
    if (lower.includes("vệ sinh")) return "Cleaning Specialist";
    if (lower.includes("kỹ thuật") || lower.includes("bảo trì")) return "Technical Specialist";
    return name;
  };

  const todayStr = todaySchedule?.workDate || getTodayISODate();
  const todayFormattedDate = locale === "en"
    ? (currentTime || new Date()).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : (currentTime || new Date()).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const monthlySummaryTitle = useMemo(() => {
    const rawMonth = monthlySummary?.month || (todaySchedule?.workDate ? todaySchedule.workDate.substring(0, 7) : "");
    if (rawMonth && /^\d{4}-\d{2}$/.test(rawMonth)) {
      const [year, month] = rawMonth.split("-");
      if (locale === "en") {
        const monthNames = [
          "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
          "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
        ];
        const mIndex = parseInt(month, 10) - 1;
        const mName = monthNames[mIndex] || month;
        return `${mName} ${year} WORK SUMMARY`;
      }
      return `TỔNG KẾT CÔNG THÁNG ${month}/${year}`;
    }
    return locale === "en" ? "MONTHLY WORK SUMMARY" : "TỔNG KẾT CÔNG THÁNG";
  }, [monthlySummary?.month, todaySchedule?.workDate, locale]);

  // Handle opening Check-in modal
  const handleOpenCheckIn = () => {
    if (!todaySchedule) return;
    if (attendance?.checkIn) {
      showToast(locale === "en" ? "Check-in record is locked and cannot be edited!" : "Hồ sơ Check-in đã chốt, không thể chỉnh sửa lại!", "info");
      return;
    }
    if (!checkInEval.allowed) {
      showToast(
        locale === "en"
          ? (checkInEval.isLate
            ? "Shift has already ended. Cannot check in."
            : "Check-in only opens 10 minutes prior to shift start.")
          : checkInEval.reason,
        "warning"
      );
      return;
    }
    setHasFormDraftChanges(false);
    setActiveModal("checkin");
  };

  // Handle opening Check-out modal
  const handleOpenCheckOut = () => {
    if (!todaySchedule) return;
    if (attendance?.checkOut) {
      showToast(locale === "en" ? "Check-out record is locked and cannot be edited!" : "Hồ sơ Check-out đã chốt, không thể chỉnh sửa lại!", "info");
      return;
    }
    if (!checkOutEval.allowed) {
      showToast(locale === "en" ? "Please check in first before checking out." : checkOutEval.reason, "warning");
      return;
    }
    setHasFormDraftChanges(false);
    setActiveModal("checkout");
  };

  // Dismiss / close modal directly
  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedDutyForProof(null);
    setHasFormDraftChanges(false);
    setShowConfirmClose(false);
  };

  const handleConfirmDiscardClose = () => {
    setShowConfirmClose(false);
    setActiveModal(null);
    setSelectedDutyForProof(null);
    setHasFormDraftChanges(false);
  };

  // Submit Check-in
  const handleConfirmCheckIn = (payload: {
    photo: string;
    watermark: AttendanceWatermark;
    capturedTime: string;
    capturedDate?: string;
    explanation?: string;
  }) => {
    if (!todaySchedule) return;

    const [h, m] = payload.capturedTime.split(":").map(Number);
    const capturedMinutes = (h || 0) * 60 + (m || 0);
    const [startH, startM] = todaySchedule.shift.startTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const isLate = capturedMinutes > startMinutes || checkInEval.isLate;
    const newStatus: "on_time" | "late" = isLate ? "late" : "on_time";

    const baseAttendance: AttendanceRecord = attendance || {
      id: "att-today",
      workScheduleId: todaySchedule.id,
      workDate: payload.capturedDate || todaySchedule.workDate,
      boardingHouseName: todaySchedule.boardingHouseName,
      shiftName: todaySchedule.shift.name,
      shiftTime: `${todaySchedule.shift.startTime} - ${todaySchedule.shift.endTime}`,
      checkIn: null,
      checkOut: null,
      status: "not_yet",
      totalHours: 0,
      editedByLandlord: false,
    };

    const updated: AttendanceRecord = {
      ...baseAttendance,
      workDate: payload.capturedDate || baseAttendance.workDate,
      checkIn: payload.capturedTime,
      status: newStatus,
      checkInPhoto: payload.photo,
      checkInWatermark: payload.watermark,
      checkInExplanation: payload.explanation,
      note: isLate
        ? (locale === "en"
          ? `Checked in late at ${payload.capturedTime} at ${getLocalizedPlace(payload.watermark.place, true)}. Explanation: "${getLocalizedExplanation(payload.explanation, true) || "None"}"`
          : `Check-in muộn lúc ${payload.capturedTime} tại ${payload.watermark.place}. Giải trình: "${payload.explanation || "Chưa có"}"`)
        : (locale === "en"
          ? `Checked in on-time at ${payload.capturedTime} at ${getLocalizedPlace(payload.watermark.place, true)}.`
          : `Check-in đúng giờ lúc ${payload.capturedTime} tại ${payload.watermark.place}.`)
    };

    setAttendance(updated);
    saveAttendanceRecord(updated);

    setActiveModal(null);
    setHasFormDraftChanges(false);
    showToast(
      isLate
        ? (locale === "en"
          ? `Checked in successfully (Late at ${payload.capturedTime}) at ${getLocalizedPlace(payload.watermark.place, true)}`
          : `Đã Check-in thành công (Muộn ${payload.capturedTime}) tại ${payload.watermark.place}`)
        : (locale === "en"
          ? `Checked in successfully at ${payload.capturedTime} at ${getLocalizedPlace(payload.watermark.place, true)} (On-time!)`
          : `Đã Check-in thành công lúc ${payload.capturedTime} tại ${payload.watermark.place} (Đúng giờ!)`),
      isLate ? "warning" : "success"
    );

    // Sync to backend API
    staffAttendanceService
      .checkIn({
        workScheduleId: todaySchedule.id,
        photo: payload.photo,
        watermark: payload.watermark,
        explanation: payload.explanation,
        capturedTime: payload.capturedTime,
      })
      .then((res) => {
        if (res?.attendance) {
          setAttendance(res.attendance);
          saveAttendanceRecord(res.attendance);
        }
        if (res?.schedule?.duties) {
          setDutyList(res.schedule.duties);
        }
        staffAttendanceService.getMonthlySummary().then((sum) => sum && setMonthlySummary(sum)).catch(() => { });
      })
      .catch((err) => {
        console.warn("Backend check-in sync failed (local state active):", err);
      });
  };

  // Submit Check-out
  const handleConfirmCheckOut = (payload: {
    photo: string;
    watermark: AttendanceWatermark;
    capturedTime: string;
    capturedDate?: string;
    explanation?: string;
  }) => {
    if (!todaySchedule) return;

    const [h, m] = payload.capturedTime.split(":").map(Number);
    const capturedMinutes = (h || 0) * 60 + (m || 0);
    const [endH, endM] = todaySchedule.shift.endTime.split(":").map(Number);
    const endMinutes = endH * 60 + endM;
    const isEarly = capturedMinutes < endMinutes || checkOutEval.isEarly;

    const baseAttendance: AttendanceRecord = attendance || {
      id: "att-today",
      workScheduleId: todaySchedule.id,
      workDate: todaySchedule.workDate,
      boardingHouseName: todaySchedule.boardingHouseName,
      shiftName: todaySchedule.shift.name,
      shiftTime: `${todaySchedule.shift.startTime} - ${todaySchedule.shift.endTime}`,
      checkIn: null,
      checkOut: null,
      status: "not_yet",
      totalHours: 0,
      editedByLandlord: false,
    };

    const updated: AttendanceRecord = {
      ...baseAttendance,
      checkOut: payload.capturedTime,
      totalHours: isEarly ? 7.5 : 8,
      isEarlyCheckOut: isEarly,
      checkOutPhoto: payload.photo,
      checkOutWatermark: payload.watermark,
      checkOutExplanation: payload.explanation,
      note: isEarly
        ? (locale === "en"
          ? `Checked out early at ${payload.capturedTime} at ${getLocalizedPlace(payload.watermark.place, true)}. Explanation: "${getLocalizedExplanation(payload.explanation, true) || "None"}"`
          : `Check-out sớm lúc ${payload.capturedTime} tại ${payload.watermark.place}. Giải trình: "${payload.explanation || "Chưa có"}"`)
        : (locale === "en"
          ? `Checked out completed at ${payload.capturedTime} at ${getLocalizedPlace(payload.watermark.place, true)}.`
          : `Check-out hoàn thành lúc ${payload.capturedTime} tại ${payload.watermark.place}.`)
    };

    setAttendance(updated);
    saveAttendanceRecord(updated);

    setActiveModal(null);
    setHasFormDraftChanges(false);
    showToast(
      isEarly
        ? (locale === "en"
          ? `Checked out early at ${payload.capturedTime} at ${getLocalizedPlace(payload.watermark.place, true)} with explanation.`
          : `Đã Check-out sớm lúc ${payload.capturedTime} tại ${payload.watermark.place} kèm giải trình.`)
        : (locale === "en"
          ? `Checked out successfully at ${payload.capturedTime} at ${getLocalizedPlace(payload.watermark.place, true)}!`
          : `Đã Check-out thành công lúc ${payload.capturedTime} tại ${payload.watermark.place}!`),
      isEarly ? "warning" : "success"
    );

    // Sync to backend API
    staffAttendanceService
      .checkOut({
        workScheduleId: todaySchedule.id,
        photo: payload.photo,
        watermark: payload.watermark,
        explanation: payload.explanation,
        capturedTime: payload.capturedTime,
      })
      .then((res) => {
        if (res?.attendance) {
          setAttendance(res.attendance);
          saveAttendanceRecord(res.attendance);
        }
        if (res?.schedule?.duties) {
          setDutyList(res.schedule.duties);
        }
        staffAttendanceService.getMonthlySummary().then((sum) => sum && setMonthlySummary(sum)).catch(() => { });
      })
      .catch((err) => {
        console.warn("Backend check-out sync failed (local state active):", err);
      });
  };

  // Toggle duty task status
  const handleToggleDuty = (duty: DutyTaskItem) => {
    if (!todaySchedule) return;

    // If task requires photo and doesn't have proof yet, require photo first
    if (duty.requiresPhoto && !duty.photoProof && !duty.completed) {
      setSelectedDutyForProof(duty);
      setActiveModal("duty_proof");
      showToast(
        locale === "en"
          ? "This task requires photo proof. Please capture or upload a photo before completing!"
          : "Nhiệm vụ này yêu cầu ảnh đối chiếu. Vui lòng chụp hoặc tải ảnh trước khi hoàn thành!",
        "warning"
      );
      return;
    }

    const updated = dutyList.map(item => {
      if (item.id === duty.id) {
        const nextCompleted = !item.completed;
        return {
          ...item,
          completed: nextCompleted,
          completedAt: nextCompleted ? effectiveTimeString : undefined
        };
      }
      return item;
    });

    setDutyList(updated);
    try {
      localStorage.setItem("dormio_staff_today_duties", JSON.stringify(updated));
    } catch {
      // Fallback
    }

    // Backend sync
    staffAttendanceService
      .saveDutyProof({
        workScheduleId: todaySchedule.id,
        dutyId: duty.id,
        markCompleted: !duty.completed,
      })
      .catch((err) => {
        console.warn("Backend task toggle sync warning:", err);
      });
  };

  // Save Duty Proof / Update Progress / Mark Completed
  const handleSaveDutyProof = (payload: {
    dutyId: string;
    photo?: string;
    note?: string;
    proofTime?: string;
    markCompleted?: boolean;
  }) => {
    if (!todaySchedule) return;
    const targetDuty = dutyList.find(d => d.id === payload.dutyId);
    if (!targetDuty) return;

    if (payload.markCompleted && targetDuty.requiresPhoto && !payload.photo && !targetDuty.photoProof) {
      showToast(
        locale === "en"
          ? "This task requires photo proof before completing!"
          : "Nhiệm vụ này bắt buộc phải có ảnh đối chiếu mới được hoàn thành!",
        "warning"
      );
      return;
    }

    const now = new Date();
    const actualProofTime = payload.proofTime || `${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} - ${now.toLocaleDateString("vi-VN")}`;
    const nowTimeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

    const updated = dutyList.map(item => {
      if (item.id === payload.dutyId) {
        const isCompleted = payload.markCompleted ?? item.completed;
        return {
          ...item,
          photoProof: payload.photo || item.photoProof,
          photoProofTime: payload.photo ? actualProofTime : item.photoProofTime,
          note: payload.note !== undefined ? payload.note : item.note,
          completed: isCompleted,
          completedAt: isCompleted ? (item.completedAt || nowTimeStr) : undefined
        };
      }
      return item;
    });

    setDutyList(updated);
    try {
      localStorage.setItem("dormio_staff_today_duties", JSON.stringify(updated));
    } catch {
      // Fallback
    }

    setActiveModal(null);
    setSelectedDutyForProof(null);
    setHasFormDraftChanges(false);

    if (payload.markCompleted) {
      showToast(locale === "en" ? "Task completed successfully!" : "Đã lưu ảnh và hoàn thành nhiệm vụ!", "success");
    } else {
      showToast(locale === "en" ? "Progress updated successfully!" : "Đã cập nhật tiến độ nhiệm vụ!", "info");
    }

    // Sync to backend API
    staffAttendanceService
      .saveDutyProof({
        workScheduleId: todaySchedule.id,
        dutyId: payload.dutyId,
        photo: payload.photo,
        note: payload.note,
        markCompleted: payload.markCompleted,
      })
      .then((res) => {
        if (res?.schedule?.duties) {
          setDutyList(res.schedule.duties);
        }
      })
      .catch((err) => {
        console.warn("Backend duty proof sync warning:", err);
      });
  };


  const currentStaffName = staffName || user?.name || (locale === "en" ? "Staff Member" : "Nhân viên");
  const completedCount = dutyList.filter(d => d.completed).length;

  if (isLoading || !isMounted) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-pulse">
        {/* Banner Skeleton */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1">
            <div className="h-5 w-24 bg-zinc-200 rounded-full" />
            <div className="h-8 w-64 bg-zinc-200 rounded-xl" />
            <div className="h-4 w-48 bg-zinc-100 rounded-md" />
          </div>
          <div className="h-14 w-48 bg-zinc-200 rounded-2xl shrink-0" />
        </div>

        {/* 2-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-6 sm:p-7 space-y-6">
              <div className="flex justify-between items-center pb-5 border-b border-zinc-100">
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-zinc-200 rounded-md" />
                  <div className="h-7 w-52 bg-zinc-200 rounded-lg" />
                </div>
                <div className="h-8 w-32 bg-zinc-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="h-20 bg-zinc-100 rounded-2xl" />
                <div className="h-20 bg-zinc-100 rounded-2xl" />
                <div className="h-20 bg-zinc-100 rounded-2xl" />
              </div>
              <div className="h-48 bg-zinc-100 rounded-2xl" />
              <div className="space-y-3 pt-2">
                <div className="h-5 w-36 bg-zinc-200 rounded-md" />
                <div className="h-16 bg-zinc-50 rounded-2xl border border-zinc-100" />
                <div className="h-16 bg-zinc-50 rounded-2xl border border-zinc-100" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
              <div className="h-5 w-32 bg-zinc-200 rounded-md" />
              <div className="h-16 bg-zinc-100 rounded-2xl" />
              <div className="h-16 bg-zinc-100 rounded-2xl" />
            </div>
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
              <div className="h-5 w-40 bg-zinc-200 rounded-md" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-zinc-100 rounded-2xl" />
                <div className="h-20 bg-zinc-100 rounded-2xl" />
                <div className="h-20 bg-zinc-100 rounded-2xl" />
                <div className="h-20 bg-zinc-100 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">

      {/* Toast popup */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white ${toast.type === "success" ? "bg-[#2AC1BC]" : toast.type === "warning" ? "bg-amber-600" : "bg-zinc-800"
            }`}>
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* TOP BANNER: GREETING & CLOCK */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#2AC1BC]/15 text-[#2AC1BC]">
              {t("badge")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {t("greeting", { name: currentStaffName })}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            {t("greetingSubtitle", { date: todayFormattedDate })}
          </p>
        </div>

        {/* Live Digital Clock Widget */}
        <div className="flex flex-col items-start md:items-end z-10 shrink-0">
          <div className="bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-md border border-zinc-800 flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#2AC1BC] animate-pulse" />
            <div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-emerald-400">
                {effectiveTimeString}
              </div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">
                {t("realSystemTime")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN SECTION: 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMN LEFT (2 SPAN): TODAY'S SHIFT CARD & SMART TIMEKEEPING BUTTONS OR EMPTY STATE */}
        {!todaySchedule ? (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-8 sm:p-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto shadow-inner">
                <Calendar className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900">
                  {locale === "en" ? "No Shift Scheduled for Today" : "Không có lịch trực hôm nay"}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  {fetchError
                    ? fetchError
                    : (locale === "en"
                      ? "You do not have any work shifts assigned for today. You can check upcoming shifts in the Schedule tab or review past attendance history."
                      : "Hôm nay bạn không có ca trực nào được phân công. Bạn có thể kiểm tra lịch phân ca sắp tới tại tab Lịch trực & Nhiệm vụ hoặc tra cứu lịch sử chấm công.")}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    fetchOverview();
                    fetchMonthlySummary();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#2AC1BC]" />
                  <span>{locale === "en" ? "Refresh Data" : "Tải lại dữ liệu"}</span>
                </button>

                <Link
                  href="/staff/schedule"
                  className="py-2.5 px-4 rounded-xl bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm shadow-[#2AC1BC]/20"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{locale === "en" ? "View Shift Schedule" : "Xem lịch trực & nhiệm vụ"}</span>
                </Link>

                <Link
                  href="/staff/shift-history"
                  className="py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <Clock className="w-3.5 h-3.5 text-[#2AC1BC]" />
                  <span>{locale === "en" ? "Shift History" : "Lịch sử chấm công"}</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 space-y-6">

            {/* TODAY'S SHIFT HERO CARD */}
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-6 sm:p-7 space-y-6">

              {/* Header of Shift Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] animate-ping" />
                    <span className="text-xs font-black text-[#2AC1BC] uppercase tracking-wider">
                      {t("todayShiftTitle")}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900">
                    {getShiftName(todaySchedule.shift)} ({todaySchedule.shift.startTime} - {todaySchedule.shift.endTime})
                  </h2>
                </div>

                {/* Status Badge */}
                <div>
                  {attendance?.checkOut ? (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-700 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {locale === "en" ? "SHIFT COMPLETED" : "ĐÃ HOÀN THÀNH CA"}
                    </span>
                  ) : attendance?.checkIn ? (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#2AC1BC]/15 text-[#2AC1BC] inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 animate-spin" />
                      {locale === "en" ? "ON DUTY" : "ĐANG TRONG CA TRỰC"}
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-100 text-amber-800 inline-flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {locale === "en" ? "NOT CHECKED IN" : "CHƯA CHECK-IN"}
                    </span>
                  )}
                </div>
              </div>

              {/* Shift Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 block uppercase">
                    {locale === "en" ? "Shift Location" : "Địa điểm trực"}
                  </span>
                  <div className="flex items-center gap-2 font-black text-zinc-900 text-xs sm:text-sm">
                    <Building2 className="w-4 h-4 text-[#2AC1BC]" />
                    <span className="truncate">{todaySchedule.boardingHouseName}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 block uppercase">
                    {locale === "en" ? "Assigned Role" : "Vị trí đảm nhiệm"}
                  </span>
                  <div className="flex items-center gap-2 font-black text-zinc-900 text-xs sm:text-sm">
                    <Shield className="w-4 h-4 text-[#2AC1BC]" />
                    <span className="truncate">{getPositionName(todaySchedule.position)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 block uppercase">
                    {locale === "en" ? "Shift Duration" : "Thời lượng ca"}
                  </span>
                  <div className="flex items-center gap-2 font-black text-zinc-900 text-xs sm:text-sm">
                    <Clock className="w-4 h-4 text-[#2AC1BC]" />
                    <span>
                      {locale === "en" ? `${todaySchedule.shift.durationHours} Hours (8h work)` : `${todaySchedule.shift.durationHours} Tiếng (8h công)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* TIMEKEEPING ACTION CONTAINER (UC-S-02) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-linear-to-br from-zinc-50 to-zinc-100/80 border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#2AC1BC]" />
                    <span>{t("attendanceTitle")}</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    {t("attendanceSubtitle")}
                  </span>
                </div>

                {/* Status details line */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Check In info */}
                  <div className="p-3.5 rounded-xl bg-white border border-zinc-200 flex flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block">{t("checkInTime")}</span>
                        <span className="font-black text-zinc-900 text-sm">
                          {attendance?.checkIn ? `${attendance.checkIn}` : "--:--:--"}
                        </span>
                      </div>
                      <div>
                        {attendance?.checkIn ? (
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${attendance.status === "late" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                            {attendance.status === "late" ? t("statusLate") : t("statusOnTime")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-bold">{t("windowCheckIn")}</span>
                        )}
                      </div>
                    </div>

                    {/* Photo & Watermark pill if checked in */}
                    {attendance?.checkIn && attendance?.checkInPhoto && (
                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={attendance.checkInPhoto}
                            alt="Check-in proof"
                            className="w-8 h-8 rounded-lg object-cover border border-zinc-200 cursor-pointer hover:opacity-80"
                            onClick={() => setPreviewImageModal({
                              isOpen: true,
                              title: locale === "en" ? "Check-in Verification Photo" : "Ảnh Xác Thực Check-in",
                              imageUrl: attendance.checkInPhoto!,
                              watermark: attendance.checkInWatermark ? {
                                ...attendance.checkInWatermark,
                                place: getLocalizedPlace(attendance.checkInWatermark.place, locale === "en"),
                                staffName: getLocalizedStaffName(attendance.checkInWatermark.staffName, locale === "en")
                              } : undefined,
                              note: getLocalizedExplanation(attendance.checkInExplanation, locale === "en")
                            })}
                          />
                          <div className="text-[10px] text-zinc-500 font-medium">
                            <span className="text-zinc-800 font-bold block truncate max-w-[150px]" title={getLocalizedPlace(attendance.checkInWatermark?.place || todaySchedule.boardingHouseName, locale === "en")}>
                              📍 {getLocalizedPlace(attendance.checkInWatermark?.place || todaySchedule.boardingHouseName, locale === "en")}
                            </span>
                            <span className="text-zinc-500 block truncate max-w-[150px]">
                              🕒 {attendance.checkInWatermark?.time || (locale === "en" ? "Time & Place stamped" : "Đã in dấu thời gian")}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal({
                            isOpen: true,
                            title: locale === "en" ? "Check-in Verification Photo" : "Ảnh Xác Thực Check-in",
                            imageUrl: attendance.checkInPhoto!,
                            watermark: attendance.checkInWatermark ? {
                              ...attendance.checkInWatermark,
                              place: getLocalizedPlace(attendance.checkInWatermark.place, locale === "en"),
                              staffName: getLocalizedStaffName(attendance.checkInWatermark.staffName, locale === "en")
                            } : undefined,
                            note: getLocalizedExplanation(attendance.checkInExplanation, locale === "en")
                          })}
                          className="text-[10px] font-bold text-[#2AC1BC] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> {t("viewPhoto")}
                        </button>
                      </div>
                    )}

                    {/* Explanation snippet if present */}
                    {attendance?.checkInExplanation && (
                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900">
                        <span className="font-bold block">
                          {attendance.status === "late" ? t("explanationLate") : t("explanationCheckIn")}
                        </span>
                        <p className="italic text-zinc-700 truncate">&quot;{getLocalizedExplanation(attendance.checkInExplanation, locale === "en")}&quot;</p>
                      </div>
                    )}
                  </div>

                  {/* Check Out info */}
                  <div className="p-3.5 rounded-xl bg-white border border-zinc-200 flex flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block">{t("checkOutTime")}</span>
                        <span className="font-black text-zinc-900 text-sm">
                          {attendance?.checkOut ? `${attendance.checkOut}` : "--:--:--"}
                        </span>
                      </div>
                      <div>
                        {attendance?.checkOut ? (
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${attendance.isEarlyCheckOut ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                            {attendance.isEarlyCheckOut ? t("statusEarly") : t("statusCompleted")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-bold">{t("windowCheckOut")}</span>
                        )}
                      </div>
                    </div>

                    {/* Photo & Watermark pill if checked out */}
                    {attendance?.checkOut && attendance?.checkOutPhoto && (
                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={attendance.checkOutPhoto}
                            alt="Check-out proof"
                            className="w-8 h-8 rounded-lg object-cover border border-zinc-200 cursor-pointer hover:opacity-80"
                            onClick={() => setPreviewImageModal({
                              isOpen: true,
                              title: locale === "en" ? "Check-out Verification Photo" : "Ảnh Xác Thực Check-out",
                              imageUrl: attendance.checkOutPhoto!,
                              watermark: attendance.checkOutWatermark ? {
                                ...attendance.checkOutWatermark,
                                place: getLocalizedPlace(attendance.checkOutWatermark.place, locale === "en"),
                                staffName: getLocalizedStaffName(attendance.checkOutWatermark.staffName, locale === "en")
                              } : undefined,
                              note: getLocalizedExplanation(attendance.checkOutExplanation, locale === "en")
                            })}
                          />
                          <div className="text-[10px] text-zinc-500 font-medium">
                            <span className="text-zinc-800 font-bold block truncate max-w-[150px]" title={getLocalizedPlace(attendance.checkOutWatermark?.place || todaySchedule.boardingHouseName, locale === "en")}>
                              📍 {getLocalizedPlace(attendance.checkOutWatermark?.place || todaySchedule.boardingHouseName, locale === "en")}
                            </span>
                            <span className="text-zinc-500 block truncate max-w-[150px]">
                              🕒 {attendance.checkOutWatermark?.time || (locale === "en" ? "Time & Place stamped" : "Đã in dấu thời gian")}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal({
                            isOpen: true,
                            title: locale === "en" ? "Check-out Verification Photo" : "Ảnh Xác Thực Check-out",
                            imageUrl: attendance.checkOutPhoto!,
                            watermark: attendance.checkOutWatermark ? {
                              ...attendance.checkOutWatermark,
                              place: getLocalizedPlace(attendance.checkOutWatermark.place, locale === "en"),
                              staffName: getLocalizedStaffName(attendance.checkOutWatermark.staffName, locale === "en")
                            } : undefined,
                            note: getLocalizedExplanation(attendance.checkOutExplanation, locale === "en")
                          })}
                          className="text-[10px] font-bold text-[#2AC1BC] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> {t("viewPhoto")}
                        </button>
                      </div>
                    )}

                    {/* Explanation snippet if early check-out */}
                    {attendance?.checkOutExplanation && (
                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900">
                        <span className="font-bold block">{t("explanationEarly")}</span>
                        <p className="italic text-zinc-700 truncate">&quot;{getLocalizedExplanation(attendance.checkOutExplanation, locale === "en")}&quot;</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">

                  {/* Check In Button */}
                  {attendance?.checkIn ? (
                    <button
                      type="button"
                      onClick={() => setPreviewImageModal({
                        isOpen: true,
                        title: locale === "en" ? "Check-in Verification Photo (Locked - View only)" : "Ảnh Xác Thực Check-in (Đã chốt - Không thể chỉnh sửa)",
                        imageUrl: attendance.checkInPhoto || "",
                        watermark: attendance.checkInWatermark ? {
                          ...attendance.checkInWatermark,
                          place: getLocalizedPlace(attendance.checkInWatermark.place, locale === "en"),
                          staffName: getLocalizedStaffName(attendance.checkInWatermark.staffName, locale === "en")
                        } : undefined,
                        note: getLocalizedExplanation(attendance.checkInExplanation, locale === "en")
                      })}
                      className="py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-all cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t("btnCheckInLocked")}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!checkInEval.allowed}
                      onClick={handleOpenCheckIn}
                      className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${checkInEval.allowed
                          ? "bg-[#2AC1BC] hover:bg-[#25ad87] text-white shadow-md shadow-[#2AC1BC]/25"
                          : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                        }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>
                        {checkInEval.isLate ? t("btnCheckInLate") : t("btnCheckInOnTime")}
                      </span>
                    </button>
                  )}

                  {/* Check Out Button */}
                  {attendance?.checkOut ? (
                    <button
                      type="button"
                      onClick={() => setPreviewImageModal({
                        isOpen: true,
                        title: locale === "en" ? "Check-out Verification Photo (Locked - View only)" : "Ảnh Xác Thực Check-out (Đã chốt - Không thể chỉnh sửa)",
                        imageUrl: attendance.checkOutPhoto || "",
                        watermark: attendance.checkOutWatermark ? {
                          ...attendance.checkOutWatermark,
                          place: getLocalizedPlace(attendance.checkOutWatermark.place, locale === "en"),
                          staffName: getLocalizedStaffName(attendance.checkOutWatermark.staffName, locale === "en")
                        } : undefined,
                        note: getLocalizedExplanation(attendance.checkOutExplanation, locale === "en")
                      })}
                      className="py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-all cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t("btnCheckOutLocked")}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!checkOutEval.allowed}
                      onClick={handleOpenCheckOut}
                      className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${checkOutEval.allowed
                          ? "bg-[#2AC1BC] hover:bg-[#25ad87] text-white shadow-md shadow-[#2AC1BC]/25"
                          : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                        }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>
                        {checkOutEval.isEarly ? t("btnCheckOutEarly") : t("btnCheckOutNormal")}
                      </span>
                    </button>
                  )}
                </div>

                {/* Explanatory Notice */}
                <div className="p-3 rounded-xl bg-white border border-zinc-200/90 text-[11px] text-zinc-500 space-y-1">
                  <div className="font-bold text-zinc-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2AC1BC]" />
                    <span>{t("rulesTitle")}</span>
                  </div>
                  <p className="leading-relaxed">{t("rule1")}</p>
                  <p className="leading-relaxed">{t("rule2")}</p>
                </div>
              </div>

              {/* CHECKLIST (NHIỆM VỤ CA LÀM • DUTY LIST UC-S-01) */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-zinc-800 text-xs font-black uppercase tracking-wider">
                    <CheckSquare className="w-4 h-4 text-[#2AC1BC]" />
                    <span>{t("checklistTitle")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <span className="text-[11px] font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 px-2.5 py-1 rounded-lg">
                      {t("checklistProgress", { completed: completedCount, total: dutyList.length })}
                    </span>
                    <Link
                      href="/staff/schedule"
                      className="text-[11px] font-bold text-[#2AC1BC] hover:underline flex items-center gap-1"
                    >
                      <span>{locale === "en" ? "View in Schedule" : "Xem trong Lịch trực & Nhiệm vụ"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Additional Tasks / Landlord Reminders Due Today Banner */}
                {todayAdditionalTasks.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span className="text-xs font-bold text-amber-950">
                        {t("todayAdditionalNotice", { count: todayAdditionalTasks.length })}
                      </span>
                    </div>
                    <Link
                      href="/staff/schedule"
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-2xs cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t("btnViewTodayAdditional", { count: todayAdditionalTasks.length })}</span>
                    </Link>
                  </div>
                )}

                {dutyList.length > 0 ? (
                  <div className="space-y-3">
                    {dutyList.map((duty) => (
                      <div
                        key={duty.id}
                        className={`p-4 rounded-2xl border transition-all ${duty.completed
                            ? "bg-emerald-50/40 border-emerald-200/80 text-zinc-800"
                            : "bg-white border-zinc-200 text-zinc-800 hover:border-[#2AC1BC]/40"
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

                          {/* Left: Checkbox + Title + Proof Tag */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={duty.completed}
                              onChange={() => handleToggleDuty(duty)}
                              className="mt-1 w-4 h-4 rounded text-[#2AC1BC] focus:ring-[#2AC1BC] cursor-pointer shrink-0"
                            />
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-xs font-bold leading-snug ${duty.completed ? "line-through text-zinc-400" : "text-zinc-900"}`}>
                                  {getDutyTitle(duty, locale === "en")}
                                </span>

                                {/* Requirement Tag */}
                                {duty.requiresPhoto ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200/80 inline-flex items-center gap-1 shrink-0">
                                    <Camera className="w-3 h-3 text-amber-600" />
                                    {t("requiresPhoto")}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-500 inline-flex items-center gap-1 shrink-0">
                                    {t("photoOptional")}
                                  </span>
                                )}
                              </div>

                              {duty.note && (
                                <p className="text-[11px] text-zinc-500 font-medium italic">
                                  {t("notePrefix", { note: getDutyNote(duty.note, locale === "en") })}
                                </p>
                              )}

                              {duty.completedAt && (
                                <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> {t("completedAtPrefix", { time: duty.completedAt })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Photo proof thumbnail + Update details action button */}
                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pl-7 sm:pl-0">
                            {duty.photoProof && (
                              <div
                                onClick={() => setPreviewImageModal({
                                  isOpen: true,
                                  title: `${t("dutyProofTitle")}: ${getDutyTitle(duty, locale === "en")}`,
                                  imageUrl: duty.photoProof!,
                                  watermark: {
                                    time: duty.photoProofTime || (duty.completedAt ? `${duty.completedAt} - ${todayStr}` : effectiveTimeString),
                                    place: getLocalizedPlace(todaySchedule.boardingHouseName || (locale === "en" ? "Assigned Building" : "Toà nhà trực"), locale === "en"),
                                    staffName: getLocalizedStaffName(currentStaffName, locale === "en")
                                  },
                                  note: getDutyNote(duty.note, locale === "en")
                                })}
                                className="relative group cursor-pointer"
                                title={t("clickToEnlargeProof")}
                              >
                                <img
                                  src={duty.photoProof}
                                  alt="Proof thumbnail"
                                  className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs group-hover:opacity-80 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDutyForProof(duty);
                                setActiveModal("duty_proof");
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#2AC1BC]" />
                              <span>{t("btnUpdateDetails")}</span>
                            </button>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center space-y-1">
                    <CheckSquare className="w-5 h-5 text-zinc-400 mx-auto" />
                    <p className="text-xs font-bold text-zinc-600">
                      {locale === "en" ? "No duty tasks assigned for this shift" : "Không có nhiệm vụ ca làm nào được giao"}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {locale === "en" ? "All core duties have been settled or none were assigned." : "Ca trực này hiện không có danh mục nhiệm vụ bắt buộc."}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* COLUMN RIGHT (1 SPAN): CO-WORKERS ON SHIFT & QUICK METRICS */}
        <div className="space-y-6">

          {/* CO-WORKERS ON THE SAME SHIFT (UC-S-01) */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2 text-zinc-800 text-xs font-black uppercase tracking-wider">
                <Users className="w-4 h-4 text-[#2AC1BC]" />
                <span>{t("coworkersTitle")}</span>
              </div>
              {todaySchedule && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#2AC1BC]/10 text-[#2AC1BC]">
                  {t("coworkersCount", { count: todaySchedule.coWorkers.length })}
                </span>
              )}
            </div>

            {todaySchedule && todaySchedule.coWorkers.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.coWorkers.map((cw) => (
                  <div key={cw.id} className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={cw.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cw.name)}&background=2AC1BC&color=fff`}
                        alt={cw.name}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-zinc-900 truncate">{cw.name}</h4>
                        <p className="text-[11px] font-semibold text-zinc-500 truncate">{getPositionName(cw.positionName)}</p>
                      </div>
                    </div>
                    {cw.phone ? (
                      <a
                        href={`tel:${cw.phone}`}
                        title={t("callCoworker", { name: cw.name })}
                        className="p-2 rounded-xl bg-white border border-zinc-200 text-[#2AC1BC] hover:bg-[#2AC1BC]/10 transition-colors shrink-0 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-400 text-xs font-medium space-y-1">
                <Users className="w-6 h-6 text-zinc-300 mx-auto" />
                <p>{todaySchedule ? t("onlyStaffAssigned") : (locale === "en" ? "No scheduled shifts today" : "Chưa có dữ liệu ca trực hôm nay")}</p>
                <p className="text-[11px] text-zinc-400">
                  {todaySchedule ? t("coworkerNote") : (locale === "en" ? "Co-workers will appear here when a shift is active." : "Danh sách đồng nghiệp cùng ca sẽ xuất hiện khi có ca trực.")}
                </p>
              </div>
            )}

            {todaySchedule && todaySchedule.coWorkers.length > 0 && (
              <div className="pt-2 text-[11px] text-zinc-400 leading-tight">
                {t("coworkerNote")}
              </div>
            )}
          </div>

          {/* MONTHLY SUMMARY METRICS WIDGET */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider">
              {monthlySummaryTitle}
            </h3>

            {monthlySummary && monthlySummary.totalShifts > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    {t("metricTotalShifts") || (locale === "en" ? "TOTAL SHIFTS" : "TỔNG CA TRỰC")}
                  </span>
                  <div className="text-xl font-black text-zinc-900">
                    {t("shiftsUnit", { count: monthlySummary.totalShifts })}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {locale === "en" ? `${monthlySummary.totalHours} hrs` : `${monthlySummary.totalHours} giờ công`}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    {t("onTimeLabel") || (locale === "en" ? "ON TIME" : "ĐÚNG GIỜ")}
                  </span>
                  <div className="text-xl font-black text-[#2AC1BC]">
                    {monthlySummary.onTimeRate}%
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold">
                    {t("onTimeStandard", {
                      count: `${monthlySummary.onTimeCount}/${monthlySummary.totalShifts}`
                    })}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    {t("lateLabel") || (locale === "en" ? "LATE" : "ĐI MUỘN")}
                  </span>
                  <div className="text-xl font-black text-amber-600">
                    {t("shiftsUnit", { count: monthlySummary.lateCount })}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">{t("lateHasExplanation")}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    {t("earlyLabel") || (locale === "en" ? "EARLY LEAVE" : "VỀ SỚM")}
                  </span>
                  <div className="text-xl font-black text-amber-600">
                    {t("shiftsUnit", { count: monthlySummary.earlyCount })}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">{t("earlyApproved")}</span>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400">
                  <Calendar className="w-4 h-4 text-[#2AC1BC]" />
                </div>
                <div className="text-xs font-bold text-zinc-700">
                  {locale === "en" ? "No attendance data for this month" : "Chưa có dữ liệu chấm công tháng này"}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {locale === "en"
                    ? "Your shift hours, attendance rate, and punctuality records will be summarized here."
                    : "Tổng giờ công, số ca trực và tỷ lệ chuyên cần sẽ được tự động tổng hợp tại đây khi hoàn thành các ca làm việc."}
                </p>
              </div>
            )}

            <Link
              href="/staff/shift-history"
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>{t("viewAttendanceHistory")}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#2AC1BC]" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CHECK-IN / CHECK-OUT WITH CAMERA WATERMARK & EXPLANATION SECTION */}
      {/* ========================================================================= */}
      {activeModal && (activeModal === "checkin" || activeModal === "checkout") && todaySchedule && (
        <CheckInOutCameraModal
          mode={activeModal}
          isLate={activeModal === "checkin" ? checkInEval.isLate : false}
          isEarly={activeModal === "checkout" ? checkOutEval.isEarly : false}
          shiftName={todaySchedule.shift.name}
          shiftStartTime={todaySchedule.shift.startTime}
          shiftEndTime={todaySchedule.shift.endTime}
          effectiveTime={effectiveTimeString}
          boardingHouseName={todaySchedule.boardingHouseName}
          staffName={currentStaffName}
          onClose={handleCloseModal}
          onSubmit={(data) => {
            if (activeModal === "checkin") {
              handleConfirmCheckIn(data);
            } else {
              handleConfirmCheckOut(data);
            }
          }}
          onChangeDraft={() => setHasFormDraftChanges(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DUTY TASK PHOTO PROOF UPLOAD (LANDLORD REQUIRED AUDIT)            */}
      {/* ========================================================================= */}
      {activeModal === "duty_proof" && selectedDutyForProof && todaySchedule && (
        <DutyProofModal
          duty={selectedDutyForProof}
          boardingHouseName={todaySchedule.boardingHouseName}
          effectiveTime={effectiveTimeString}
          staffName={currentStaffName}
          onClose={handleCloseModal}
          onSubmit={(payload) => handleSaveDutyProof(payload)}
          onChangeDraft={() => setHasFormDraftChanges(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FULL SCREEN IMAGE VIEWER WITH WATERMARK AUDIT STAMP             */}
      {/* ========================================================================= */}
      {previewImageModal && previewImageModal.isOpen && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 text-white rounded-3xl border border-zinc-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col cursor-default"
          >

            {/* Lightbox Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2AC1BC]" />
                <h3 className="font-bold text-sm sm:text-base text-zinc-100">
                  {previewImageModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-only audit banner */}
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t("auditLockedBanner")}</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider">{t("auditVerified")}</span>
            </div>

            {/* Lightbox Image with Watermark Overlay */}
            <div className="relative bg-black flex items-center justify-center max-h-[460px] overflow-hidden">
              <img
                src={previewImageModal.imageUrl}
                alt="Enlarged Proof"
                className="w-full h-auto max-h-[460px] object-contain"
              />

              {/* Stamped Watermark HUD on the Photo */}
              {previewImageModal.watermark && (
                <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-white text-xs space-y-1 shadow-lg pointer-events-none">
                  <div className="flex items-center justify-between font-black text-[#2AC1BC] text-[11px] uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {previewImageModal.watermark.time}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                      {t("validLocation")}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{getLocalizedPlace(previewImageModal.watermark.place, locale === "en")}</span>
                  </div>
                  <div className="text-[10px] text-zinc-300 flex items-center justify-between pt-0.5 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-zinc-400" /> {getLocalizedStaffName(previewImageModal.watermark.staffName, locale === "en")}
                    </span>
                    <span className="font-mono text-zinc-400">
                      {previewImageModal.watermark.coordinates || (locale === "en" ? "GPS coordinates recorded" : "Đã ghi nhận tọa độ GPS")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Note / Explanation section if present */}
            {previewImageModal.note && (
              <div className="p-4 bg-zinc-800/80 border-t border-zinc-700/60 text-xs space-y-1">
                <span className="font-bold text-zinc-300 block">{t("explanationNoteTitle")}</span>
                <p className="text-zinc-300 italic">&quot;{getLocalizedExplanation(previewImageModal.note, locale === "en")}&quot;</p>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {t("btnClose")}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RULE #10 POP-UP CONFIRMATION MODAL ("Xác nhận đóng form")                 */}
      {/* ========================================================================= */}
      {showConfirmClose && (
        <div
          onClick={() => setShowConfirmClose(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-sm w-full p-6 space-y-5 text-center cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-zinc-900">{t("confirmCloseTitle")}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {t("confirmCloseDesc")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmClose(false)}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-xs hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {t("btnContinueEditing")}
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscardClose}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                {t("btnDiscardAndClose")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// =======================================================================================
// HELPER: ISOLATED LIVE CLOCK BADGE (PREVENTS FULL MODAL RE-RENDERING & SCREEN JITTER)
// =======================================================================================
function LiveClockBadge() {
  const { locale } = useLanguage();
  const [clockStr, setClockStr] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, "0");
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const y = now.getFullYear();
      const h = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      if (locale === "en") {
        setClockStr(`${m}/${d}/${y} ${h}:${min}:${s}`);
      } else {
        setClockStr(`${d}/${m}/${y} ${h}:${min}:${s}`);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [locale]);

  return (
    <span className="text-[11px] font-mono font-bold text-cyan-900 bg-cyan-50 border border-cyan-200/90 px-2.5 py-1 rounded-lg flex items-center gap-1.5 tabular-nums shrink-0 shadow-2xs">
      <Clock className="w-3.5 h-3.5 text-[#2AC1BC]" />
      <span>{clockStr || "--/--/---- --:--:--"}</span>
    </span>
  );
}

// =======================================================================================
// HELPER: REAL-WORLD REVERSE GEOCODING (STRICTLY ACTUAL ADDRESS, NO BOARDING HOUSE SUFFIX)
// =======================================================================================
async function resolveRealGpsAddress(lat: number, lng: number, isEn = false): Promise<{ address: string; coordinates: string }> {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`;
  const coords = `${latStr}, ${lngStr}`;

  // 1. Nominatim OpenStreetMap (Standard Street & Administrative Address)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${isEn ? "en" : "vi"}`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.street || addr.pedestrian || addr.suburb;
        const ward = addr.suburb || addr.quarter || addr.neighbourhood || addr.village;
        const district = addr.city_district || addr.district || addr.county;
        const city = addr.city || addr.state || addr.province;

        const parts = [street, ward, district, city].filter(Boolean);
        const unique = parts.filter((item, idx) => parts.indexOf(item) === idx);
        if (unique.length >= 2) {
          return { address: getLocalizedPlace(unique.join(", "), isEn), coordinates: coords };
        }
      }
      if (data && data.display_name) {
        return {
          address: getLocalizedPlace(data.display_name.split(",").slice(0, 4).join(",").trim(), isEn),
          coordinates: coords
        };
      }
    }
  } catch {
    // Fallback to secondary provider
  }

  // 2. BigDataCloud Reverse Geocoding Client API
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${isEn ? "en" : "vi"}`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      const parts = [
        data.locality || data.localityInfo?.administrative?.[3]?.name,
        data.city || data.principalSubdivisionCode || data.localityInfo?.administrative?.[2]?.name,
        data.principalSubdivision || data.countryName
      ].filter(Boolean);
      if (parts.length > 0) {
        return { address: getLocalizedPlace(parts.join(", "), isEn), coordinates: coords };
      }
    }
  } catch {
    // Offline / timeout fallback
  }

  // 3. Fallback: Pure GPS Coordinates (No boarding house name added)
  return {
    address: isEn ? `GPS Coordinates: ${coords}` : `Tọa độ GPS: ${coords}`,
    coordinates: coords
  };
}

// =======================================================================================
// SUB-COMPONENT: CHECK-IN / CHECK-OUT REAL DEVICE CAMERA MODAL (NO UPLOAD ALLOWED)
// =======================================================================================
interface CheckInOutCameraModalProps {
  mode: "checkin" | "checkout";
  isLate: boolean;
  isEarly: boolean;
  shiftName: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  effectiveTime: string;
  boardingHouseName: string;
  staffName?: string;
  onClose: () => void;
  onSubmit: (data: {
    photo: string;
    watermark: AttendanceWatermark;
    capturedTime: string;
    capturedDate?: string;
    explanation?: string;
  }) => void;
  onChangeDraft: () => void;
}

function CheckInOutCameraModal({
  mode,
  isLate,
  isEarly,
  shiftName,
  shiftStartTime,
  shiftEndTime,
  effectiveTime,
  boardingHouseName,
  staffName,
  onClose,
  onSubmit,
  onChangeDraft
}: CheckInOutCameraModalProps) {
  const t = useTranslations("staffPortal");
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const isRequireExplanation = isLate || isEarly;

  // Real Camera Hardware Refs & States
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraStatus, setCameraStatus] = useState<"starting" | "ready" | "error" | "unsupported">("starting");
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Real device Geolocation & Reverse Geocoding (Pure GPS, NO boarding house appended)
  const [geoState, setGeoState] = useState<{
    status: "locating" | "ready" | "error";
    place: string;
    coordinates: string;
    accuracy?: number;
    error?: string;
  }>({
    status: "locating",
    place: isEn ? "Locating actual GPS coordinates & address..." : "Đang dò tìm tọa độ & địa chỉ GPS thực tế...",
    coordinates: "",
  });

  // Captured states at the exact moment of taking photo
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedWatermark, setCapturedWatermark] = useState<AttendanceWatermark | null>(null);
  const [capturedTime, setCapturedTime] = useState<string | null>(null);
  const [capturedDate, setCapturedDate] = useState<string | null>(null);

  const [isFlashing, setIsFlashing] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(null);

  // Preset reason chips for Check-in (Late / Handover)
  const checkInLatePresets = isEn ? [
    "Traffic congestion during commute",
    "Assisted tenant with emergency issue",
    "Notified & approved by Landlord",
    "Unexpected personal health issue",
    "Heavy rain & street flooding"
  ] : [
    "Kẹt xe trên đường di chuyển",
    "Hỗ trợ giải quyết sự cố cho khách thuê khẩn cấp",
    "Đã thông báo & có sự đồng ý của Chủ trọ",
    "Vấn đề sức khỏe cá nhân đột xuất",
    "Thời tiết mưa lớn, ngập úng"
  ];

  const checkInOnTimePresets = isEn ? [
    "Shift handover & keys received in full",
    "Checked lobby security & cameras",
    "Heavy traffic (Arrived close to shift time)",
    "Assisted tenant with emergency issue",
    "Notified & approved by Landlord",
    "Personal health issue needs support"
  ] : [
    "Đã nhận bàn giao ca & chìa khóa đầy đủ",
    "Đã kiểm tra hệ thống camera & an ninh sảnh",
    "Kẹt xe trên đường di chuyển (Đến sát giờ)",
    "Hỗ trợ giải quyết sự cố cho khách thuê khẩn cấp",
    "Đã thông báo & có sự đồng ý của Chủ trọ",
    "Lý do sức khỏe cá nhân cần hỗ trợ"
  ];

  // Preset reason chips for Check-out (Early / Normal)
  const checkOutEarlyPresets = isEn ? [
    "Handed over shift early to on-duty co-worker",
    "Urgent family matter",
    "Notified & approved by Landlord",
    "Health issue requires early rest"
  ] : [
    "Đã bàn giao ca sớm cho đồng nghiệp cùng trực",
    "Gia đình có việc hiếu hỉ khẩn cấp",
    "Đã thông báo & có sự đồng ý của Chủ trọ",
    "Lý do sức khỏe cần nghỉ ngơi sớm"
  ];

  const checkOutNormalPresets = isEn ? [
    "Handed over shift & keys to next shift staff",
    "Checked gate lock, cameras & lobby facilities",
    "Shift completed safely, no incidents",
    "Notified & approved by Landlord"
  ] : [
    "Đã bàn giao ca trực & chìa khóa cho ca tiếp theo",
    "Đã kiểm tra khóa cổng, camera & tài sản sảnh",
    "Ca trực hoàn thành an toàn, không có sự cố",
    "Đã thông báo & có sự đồng ý của Chủ trọ"
  ];

  const currentPresets = mode === "checkin"
    ? (isLate ? checkInLatePresets : checkInOnTimePresets)
    : (isEarly ? checkOutEarlyPresets : checkOutNormalPresets);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Request actual Geolocation & Reverse Geocoding
  const locateUser = () => {
    setGeoState(prev => ({
      ...prev,
      status: "locating",
      place: isEn ? "Locating actual GPS coordinates..." : "Đang định vị vị trí GPS thực tế...",
      coordinates: "",
      error: undefined
    }));

    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoState({
        status: "error",
        place: isEn ? "Device does not support Geolocation" : "Thiết bị không hỗ trợ Geolocation",
        coordinates: isEn ? "GPS not available" : "GPS Không khả dụng",
        error: isEn ? "Browser does not support Geolocation" : "Trình duyệt không hỗ trợ Geolocation"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        const { address, coordinates } = await resolveRealGpsAddress(lat, lng, isEn);

        setGeoState({
          status: "ready",
          place: address,
          coordinates: coordinates,
          accuracy: acc
        });
      },
      (err) => {
        let errorMsg = isEn ? "Cannot obtain GPS coordinates" : "Không thể lấy tọa độ GPS";
        if (err.code === 1) errorMsg = isEn ? "GPS permission denied" : "Quyền GPS bị từ chối";
        else if (err.code === 2) errorMsg = isEn ? "Location unavailable" : "Vị trí không khả dụng";
        else if (err.code === 3) errorMsg = isEn ? "GPS timeout" : "Hết thời gian tìm GPS";

        setGeoState({
          status: "error",
          place: isEn ? "GPS permission not granted" : "Chưa cấp quyền truy cập GPS",
          coordinates: isEn ? "GPS not ready" : "GPS chưa khả dụng",
          error: errorMsg
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  // Start real device camera via getUserMedia
  const startCamera = async (modeToUse: "user" | "environment") => {
    stopCamera();
    setCameraStatus("starting");
    setCameraError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unsupported");
      setCameraError(isEn ? "This browser or device does not support direct camera API." : "Trình duyệt hoặc thiết bị này không hỗ trợ API truy cập Camera trực tiếp.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: modeToUse },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => { });
      }
      setCameraStatus("ready");
    } catch (err: any) {
      console.warn("Camera init error:", err);
      setCameraStatus("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(isEn ? "Camera access denied. Please allow camera access in your browser settings." : "Quyền truy cập Camera bị từ chối. Vui lòng cho phép quyền máy ảnh trong cài đặt trình duyệt.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError(isEn ? "No camera device found on this machine/device." : "Không tìm thấy thiết bị Camera trên máy tính/thiết bị này.");
      } else {
        setCameraError(isEn ? `Cannot connect to Camera (${err.message || "Hardware error"}).` : `Không thể kết nối Camera (${err.message || "Lỗi phần cứng"}).`);
      }
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    locateUser();

    return () => {
      stopCamera();
    };
  }, []);

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCaptureRealFrame = () => {
    if (!videoRef.current || cameraStatus !== "ready" || geoState.status === "locating") return;

    setIsFlashing(true);
    onChangeDraft();

    try {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, "0");
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const y = now.getFullYear();
      const h = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");

      const snapDateStr = isEn ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
      const snapTimeStr = `${h}:${min}:${s}`;
      const snapIsoDate = `${y}-${m}-${d}`;
      const snapFullDateTime = `${snapDateStr} ${snapTimeStr}`;

      const activePlace = getLocalizedPlace(
        geoState.status === "ready" ? geoState.place : (isEn ? "GPS address undetermined" : "Không xác định được địa chỉ GPS"),
        isEn
      );
      const activeCoords = geoState.status === "ready" ? geoState.coordinates : (isEn ? "GPS unverified" : "GPS chưa xác thực");

      const activeWatermark: AttendanceWatermark = {
        time: snapFullDateTime,
        place: activePlace,
        staffName: getLocalizedStaffName(staffName || (isEn ? "Staff Member" : "Nhân viên"), isEn),
        coordinates: activeCoords
      };

      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        if (facingMode === "user") {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const barHeight = Math.max(90, Math.floor(height * 0.22));
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, height - barHeight, width, barHeight);

        // Safe left padding: at least 36px or 4% of width to prevent cutoff
        const padX = Math.max(36, Math.floor(width * 0.04));
        const fontSize = Math.max(13, Math.min(22, Math.floor(width * 0.024)));

        ctx.fillStyle = "#2AC1BC";
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.fillText(`🕒 ${activeWatermark.time} | ${isEn ? "LIVE VERIFIED" : "XÁC THỰC THỜI GIAN THỰC"}`, padX, height - barHeight + fontSize + 8);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${fontSize - 1}px sans-serif`;
        ctx.fillText(`📍 ${activeWatermark.place}`, padX, height - barHeight + (fontSize * 2) + 16);

        ctx.fillStyle = "#CBD5E1";
        ctx.font = `${fontSize - 2}px sans-serif`;
        ctx.fillText(`👤 ${activeWatermark.staffName}  •  GPS: ${activeWatermark.coordinates}${geoState.accuracy ? ` (±${geoState.accuracy}m)` : ""}`, padX, height - barHeight + (fontSize * 3) + 24);

        setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.92));
        setCapturedWatermark(activeWatermark);
        setCapturedTime(snapTimeStr);
        setCapturedDate(snapIsoDate);
        stopCamera();
      }
    } catch (err) {
      console.error("Failed to capture video frame:", err);
    } finally {
      setTimeout(() => setIsFlashing(false), 250);
    }
  };

  const handleFallbackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChangeDraft();
    setIsFlashing(true);

    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    const h = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");

    const snapDateStr = isEn ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
    const snapTimeStr = `${h}:${min}:${s}`;
    const snapIsoDate = `${y}-${m}-${d}`;
    const snapFullDateTime = `${snapDateStr} ${snapTimeStr}`;

    const activePlace = getLocalizedPlace(
      geoState.status === "ready" ? geoState.place : (isEn ? "GPS address undetermined" : "Không xác định được địa chỉ GPS"),
      isEn
    );
    const activeCoords = geoState.status === "ready" ? geoState.coordinates : (isEn ? "GPS unverified" : "GPS chưa xác thực");

    const activeWatermark: AttendanceWatermark = {
      time: snapFullDateTime,
      place: activePlace,
      staffName: getLocalizedStaffName(staffName || (isEn ? "Staff Member" : "Nhân viên"), isEn),
      coordinates: activeCoords
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = img.width || 640;
        const height = img.height || 480;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);

          const barHeight = Math.max(90, Math.floor(height * 0.22));
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          ctx.fillRect(0, height - barHeight, width, barHeight);

          const padX = Math.max(36, Math.floor(width * 0.04));
          const fontSize = Math.max(13, Math.min(22, Math.floor(width * 0.024)));

          ctx.fillStyle = "#2AC1BC";
          ctx.font = `bold ${fontSize}px monospace`;
          ctx.fillText(`🕒 ${activeWatermark.time} | ${isEn ? "LIVE VERIFIED" : "XÁC THỰC THỜI GIAN THỰC"}`, padX, height - barHeight + fontSize + 8);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = `bold ${fontSize - 1}px sans-serif`;
          ctx.fillText(`📍 ${activeWatermark.place}`, padX, height - barHeight + (fontSize * 2) + 16);

          ctx.fillStyle = "#CBD5E1";
          ctx.font = `${fontSize - 2}px sans-serif`;
          ctx.fillText(`👤 ${activeWatermark.staffName}  •  GPS: ${activeWatermark.coordinates}${geoState.accuracy ? ` (±${geoState.accuracy}m)` : ""}`, padX, height - barHeight + (fontSize * 3) + 24);

          setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.92));
          setCapturedWatermark(activeWatermark);
          setCapturedTime(snapTimeStr);
          setCapturedDate(snapIsoDate);
          stopCamera();
        }
        setIsFlashing(false);
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setCapturedWatermark(null);
    setCapturedTime(null);
    setCapturedDate(null);
    onChangeDraft();
    startCamera(facingMode);
  };

  const handleSelectChip = (reason: string) => {
    setSelectedQuickReason(reason);
    setExplanation(reason);
    onChangeDraft();
  };

  const isFormValid = Boolean(capturedPhoto && capturedWatermark && capturedTime) && (!isRequireExplanation || explanation.trim().length > 0);

  return (
    <div
      onClick={() => {
        stopCamera();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-xl w-full my-auto overflow-hidden flex flex-col cursor-default"
      >

        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${mode === "checkin" ? "bg-[#2AC1BC]" : "bg-emerald-600"}`}>
              {mode === "checkin" ? <Camera className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-900">
                {mode === "checkin" ? t("modalCheckInTitle") : t("modalCheckOutTitle")}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">{shiftName} • {boardingHouseName}</p>
            </div>
          </div>
          <button type="button" onClick={() => { stopCamera(); onClose(); }} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-black text-[11px] uppercase tracking-wide">{t("cameraNotice")}</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Stable Non-Jitter Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-zinc-700 flex items-center gap-1.5 shrink-0">
                <Camera className="w-4 h-4 text-[#2AC1BC]" />
                <span>{t("cameraLabel", { facing: facingMode === "user" ? t("cameraFront") : t("cameraRear") })}</span>
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Isolated Live Clock Badge */}
                <LiveClockBadge />

                {/* Stable GPS Status Badge */}
                {geoState.status === "locating" && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0">
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                    {t("locatingGps")}
                  </span>
                )}
                {geoState.status === "ready" && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0" title={geoState.place}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    {t("gpsReady", { coords: geoState.coordinates })}
                  </span>
                )}
                {geoState.status === "error" && (
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-1 rounded-lg flex items-center gap-1 shrink-0" title={geoState.error}>
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    {t("gpsDisabled")}
                    <button type="button" onClick={locateUser} className="text-[#2AC1BC] hover:underline ml-1 cursor-pointer font-bold">{t("gpsRetry")}</button>
                  </span>
                )}
              </div>
            </div>

            {/* Resolved GPS Address Banner (Pure address, no boarding house suffix) */}
            {geoState.status === "ready" && (
              <div className="px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 text-[11px] font-medium flex items-center gap-1.5 truncate border border-zinc-200/80 shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="font-bold text-zinc-900 shrink-0">{t("realLocation")}</span>
                <span className="truncate text-zinc-700" title={getLocalizedPlace(geoState.place, isEn)}>{getLocalizedPlace(geoState.place, isEn)}</span>
              </div>
            )}

            {/* Camera Viewport (aspect-video with object-contain to prevent any text clipping) */}
            <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border-2 border-zinc-800 shadow-inner group aspect-video max-h-[360px] w-full flex items-center justify-center">
              {!capturedPhoto ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-contain ${facingMode === "user" ? "scale-x-[-1]" : ""} ${cameraStatus === "ready" ? "block" : "hidden"}`}
                  />
                  {cameraStatus === "starting" && (
                    <div className="text-center p-6 text-zinc-400 text-xs space-y-3">
                      <RefreshCw className="w-8 h-8 text-[#2AC1BC] animate-spin mx-auto" />
                      <p className="font-semibold text-zinc-300">{t("cameraStarting")}</p>
                    </div>
                  )}
                  {(cameraStatus === "error" || cameraStatus === "unsupported") && (
                    <div className="text-center p-6 text-zinc-400 text-xs space-y-3 max-w-sm">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="font-bold text-zinc-200">{cameraError}</p>
                      <input
                        ref={fallbackFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFallbackImageUpload}
                      />
                      <div className="flex flex-col sm:flex-row gap-2 pt-1 justify-center">
                        <button type="button" onClick={() => startCamera(facingMode)} className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer">{t("retryCamera")}</button>
                        <button type="button" onClick={() => fallbackFileInputRef.current?.click()} className="px-3 py-1.5 rounded-xl bg-[#2AC1BC]/20 hover:bg-[#2AC1BC]/30 text-[#2AC1BC] border border-[#2AC1BC]/40 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{t("btnUploadDuty")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {cameraStatus === "ready" && (
                    <button type="button" onClick={handleToggleFacingMode} className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <RefreshCw className="w-3.5 h-3.5 text-[#2AC1BC]" />
                      {facingMode === "user" ? t("cameraRear") : t("cameraFront")}
                    </button>
                  )}
                  <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between"><div className="flex justify-between p-2"><div className="w-4 h-4 border-t-2 border-l-2 border-[#2AC1BC]" /><div className="w-4 h-4 border-t-2 border-r-2 border-[#2AC1BC]" /></div><div className="flex justify-between p-2"><div className="w-4 h-4 border-b-2 border-l-2 border-[#2AC1BC]" /><div className="w-4 h-4 border-b-2 border-r-2 border-[#2AC1BC]" /></div></div>
                </>
              ) : (
                <img src={capturedPhoto} alt="Captured frame" className="w-full h-full object-contain animate-in fade-in duration-200" />
              )}
              {isFlashing && <div className="absolute inset-0 bg-white animate-out fade-out duration-250 pointer-events-none z-30" />}
            </div>

            {/* Captured Watermark Verification HUD below picture */}
            {capturedPhoto && capturedWatermark && (
              <div className="p-3.5 bg-zinc-900 rounded-2xl text-white text-xs border border-zinc-800 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#2AC1BC] flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5" /> {capturedWatermark.time}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                    {t("stampedReal")}
                  </span>
                </div>
                <div className="text-zinc-200 text-[11px] font-medium flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{getLocalizedPlace(capturedWatermark.place, isEn)}</span>
                </div>
                <div className="text-zinc-400 text-[10px] flex items-center justify-between pt-1 border-t border-zinc-800">
                  <span>{getLocalizedStaffName(capturedWatermark.staffName, isEn)}</span>
                  <span className="font-mono text-zinc-300">GPS: {capturedWatermark.coordinates}</span>
                </div>
              </div>
            )}

            {/* Snap Button */}
            <div className="flex items-center justify-center gap-3 pt-1">
              {!capturedPhoto ? (
                <button
                  type="button"
                  disabled={cameraStatus !== "ready" || geoState.status === "locating"}
                  onClick={handleCaptureRealFrame}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${cameraStatus === "ready" && geoState.status !== "locating"
                      ? "bg-[#2AC1BC] hover:bg-[#25ad87] text-white shadow-[#2AC1BC]/25"
                      : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                    }`}
                >
                  {geoState.status === "locating" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#2AC1BC]" />
                      <span>{t("waitingGps")}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>{t("btnCaptureNow")}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRetakePhoto}
                  className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{t("btnRetake")}</span>
                </button>
              )}
            </div>
          </div>

          {/* EXPLANATION / NOTE SECTION */}
          <div className="space-y-3 pt-1 border-t border-zinc-100">
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-amber-900 uppercase">
                    {mode === "checkin"
                      ? (isLate ? t("lateCheckInTitle") : t("onTimeCheckInTitle"))
                      : (isEarly ? t("earlyCheckOutTitle") : t("normalCheckOutTitle"))}
                  </h4>
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    {mode === "checkin"
                      ? (isLate
                        ? t("lateCheckInDesc", { time: shiftStartTime || "07:00" })
                        : t("onTimeCheckInDesc"))
                      : (isEarly
                        ? t("earlyCheckOutDesc", { time: shiftEndTime || "15:00" })
                        : t("normalCheckOutDesc"))}
                  </p>
                </div>
              </div>

              {/* Preset Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider">
                  {t("commonReasonsTitle")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentPresets.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectChip(chip)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${selectedQuickReason === chip
                          ? "bg-amber-600 text-white shadow-2xs border border-amber-600"
                          : "bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/80 shadow-2xs"
                        }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1">
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => {
                    setExplanation(e.target.value);
                    onChangeDraft();
                  }}
                  placeholder={
                    mode === "checkin"
                      ? (isLate
                        ? t("placeholderExplanation")
                        : t("placeholderNote"))
                      : (isEarly
                        ? t("placeholderExplanation")
                        : t("placeholderCheckOutNote"))
                  }
                  className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs text-zinc-900 font-medium focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/20"
                />
                {isRequireExplanation && !explanation.trim() ? (
                  <span className="text-[10px] font-bold text-red-600 block">
                    {t("explanationRequiredNotice")}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700/80 font-medium block">
                    {t("explanationOptionalNotice")}
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
          >
            {t("btnCancel")}
          </button>
          <button
            type="button"
            disabled={!isFormValid}
            onClick={() => {
              if (capturedPhoto && capturedWatermark && capturedTime && isFormValid) {
                stopCamera();
                onSubmit({
                  photo: capturedPhoto,
                  watermark: capturedWatermark,
                  capturedTime: capturedTime,
                  capturedDate: capturedDate || undefined,
                  explanation: explanation.trim() || undefined
                });
              }
            }}
            className={`py-2.5 px-5 rounded-xl font-bold text-xs text-white transition-all cursor-pointer flex items-center gap-1.5 ${isFormValid
                ? "bg-[#2AC1BC] hover:bg-[#25ad87] shadow-md shadow-[#2AC1BC]/25"
                : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
              }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {mode === "checkin" ? t("btnConfirmCheckIn") : t("btnConfirmCheckOut")}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

// =======================================================================================
// SUB-COMPONENT: DUTY PROOF UPLOAD MODAL (LANDLORD AUDIT REQUIREMENT)
// =======================================================================================
interface DutyProofModalProps {
  duty: DutyTaskItem;
  boardingHouseName: string;
  effectiveTime: string;
  staffName?: string;
  onClose: () => void;
  onSubmit: (payload: { dutyId: string; photo?: string; note?: string; proofTime?: string; markCompleted?: boolean }) => void;
  onChangeDraft: () => void;
}

function DutyProofModal({
  duty,
  boardingHouseName,
  effectiveTime,
  staffName,
  onClose,
  onSubmit,
  onChangeDraft
}: DutyProofModalProps) {
  const t = useTranslations("staffPortal");
  const { locale } = useLanguage();

  const [photo, setPhoto] = useState<string>(duty.photoProof || "");
  const [note, setNote] = useState(duty.note || "");
  const [warningNotice, setWarningNotice] = useState<string | null>(null);
  const [proofTimeStr] = useState<string>(() => {
    const now = new Date();
    const loc = locale === "en" ? "en-US" : "vi-VN";
    return `${now.toLocaleDateString(loc)} ${now.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}`;
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChangeDraft();
      setWarningNotice(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-lg w-full my-auto overflow-hidden flex flex-col cursor-default"
      >

        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2AC1BC] text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                {t("dutyProofTitle")}
              </h3>
              <p className="text-xs text-zinc-500 font-medium truncate max-w-xs">
                {getDutyTitle(duty, locale === "en")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">

          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200/80 text-xs text-teal-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#2AC1BC] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t("dutyProofNotice")}
            </p>
          </div>

          {/* Photo Preview Frame */}
          {photo ? (
            <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-16/10 flex items-center justify-center border border-zinc-800 shadow-inner">
              <img
                src={photo}
                alt="Duty proof"
                className="w-full h-full object-cover"
              />

              {/* Embedded Watermark Stamp */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/75 backdrop-blur-md rounded-xl p-2.5 border border-white/15 text-white text-[10px] space-y-0.5">
                <div className="flex items-center justify-between font-black text-[#2AC1BC]">
                  <span>🕒 {proofTimeStr}</span>
                  <span className="text-emerald-400 font-bold">{t("stampedReal")}</span>
                </div>
                <div className="text-zinc-200 font-medium truncate">
                  📍 {getLocalizedPlace(boardingHouseName, locale === "en")}
                </div>
                <div className="text-zinc-400 text-[9px]">
                  👤 {getLocalizedStaffName(staffName || (locale === "en" ? "Staff Member" : "Nhân viên"), locale === "en")}
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl border-2 border-dashed border-zinc-300 hover:border-[#2AC1BC] bg-zinc-50 hover:bg-[#2AC1BC]/5 aspect-16/10 flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-2xs text-[#2AC1BC]">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-700">
                  {locale === "en" ? "Upload or capture verification photo" : "Chụp hoặc tải ảnh đối chiếu hiện trường"}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {duty.requiresPhoto ? t("requiresPhoto") : t("photoOptional")}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-[#2AC1BC]" />
              <span>{t("btnCaptureNewDuty")}</span>
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="py-2 px-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span>{t("btnUploadDuty")}</span>
            </button>
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 block">
              {t("dutyNoteLabel")}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                onChangeDraft();
              }}
              placeholder={t("dutyNotePlaceholder")}
              className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:outline-none focus:border-[#2AC1BC]"
            />
          </div>

          {/* Warning notice if required photo is missing */}
          {warningNotice && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{warningNotice}</span>
            </div>
          )}

        </div>

        {/* Footer with 2 separate action buttons: Update Progress & Complete Task */}
        <div className="p-4 sm:p-5 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
          >
            {t("btnCancel")}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onSubmit({
                  dutyId: duty.id,
                  photo: photo || undefined,
                  note: note.trim() || undefined,
                  proofTime: proofTimeStr,
                  markCompleted: false
                });
              }}
              className="py-2.5 px-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <span>{t("btnUpdateProgress")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (duty.requiresPhoto && !photo) {
                  setWarningNotice(t("photoProofRequiredWarning"));
                  return;
                }
                onSubmit({
                  dutyId: duty.id,
                  photo: photo || undefined,
                  note: note.trim() || undefined,
                  proofTime: proofTimeStr,
                  markCompleted: true
                });
              }}
              className="py-2.5 px-4.5 rounded-xl bg-[#2AC1BC] hover:bg-[#25ad87] text-white font-bold text-xs transition-all shadow-md shadow-[#2AC1BC]/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t("btnCompleteDuty")}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
