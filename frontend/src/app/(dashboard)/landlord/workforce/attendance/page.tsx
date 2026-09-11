"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Edit3,
  X,
  User,
  Shield,
  Loader2,
  Download,
  RotateCcw,
  Sparkles,
  Percent,
  CalendarDays,
  FileSpreadsheet,
  Info,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  attendanceService,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceStatus,
} from "@/services/attendance.service";
import { staffService, StaffItem } from "@/services/staff.service";
import { scheduleService, ShiftItem } from "@/services/schedule.service";

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatDisplayTime(isoString: string | null): string {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function AttendancePage() {
  const { activeBuilding } = useAuth();
  const buildingId = activeBuilding?.id || "";

  // ─── Rule #9: Parallel View & Default Grid ──────────────────────────────
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [pageSize, setPageSize] = useState<number>(6); // Default Grid = 6
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [windowStart, setWindowStart] = useState<number>(1);

  // ─── Filter & Date Range States ────────────────────────────────────────
  const [datePreset, setDatePreset] = useState<"today" | "week" | "month" | "custom">("month");
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return formatDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return formatDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  });

  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("");
  const [filterShiftId, setFilterShiftId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ─── Data States ───────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalShifts: 0,
    onTimeCount: 0,
    lateCount: 0,
    absentCount: 0,
    notYetCount: 0,
    attendanceRate: 100,
  });

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ─── Modal States ──────────────────────────────────────────────────────
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Form draft
  const [overrideStatus, setOverrideStatus] = useState<AttendanceStatus>("on_time");
  const [overrideCheckIn, setOverrideCheckIn] = useState<string>("");
  const [overrideCheckOut, setOverrideCheckOut] = useState<string>("");
  const [overrideNote, setOverrideNote] = useState<string>("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Rule #10: Modal Confirmation on Unsaved Changes
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  // Switch pageSize when toggling viewMode (Grid default = 6, Table = 10)
  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    setPageSize(mode === "grid" ? 6 : 10);
    setCurrentPage(1);
    setWindowStart(1);
  };

  // ─── Date Preset Handler ───────────────────────────────────────────────
  const handleDatePresetChange = (preset: "today" | "week" | "month" | "custom") => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "today") {
      const todayStr = formatDateString(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setStartDate(formatDateString(monday));
      setEndDate(formatDateString(sunday));
    } else if (preset === "month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatDateString(first));
      setEndDate(formatDateString(last));
    }
    setCurrentPage(1);
    setWindowStart(1);
  };

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─── Load Dependencies (Staff, Shifts) ─────────────────────────────────
  const loadDependencies = useCallback(async () => {
    if (!buildingId) return;
    try {
      const [staffRes, shiftsRes] = await Promise.all([
        staffService.getStaffList(buildingId, { status: "active", limit: 100 }),
        scheduleService.getShifts(buildingId),
      ]);
      setStaffList(staffRes?.data || []);
      setShifts(shiftsRes || []);
    } catch (err) {
      console.error("Failed to load attendance dependencies:", err);
    }
  }, [buildingId]);

  // ─── Fetch Attendance Records ──────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (!buildingId) return;
    setIsLoading(true);
    try {
      const res = await attendanceService.getAttendance(buildingId, {
        startDate,
        endDate,
        employeeId: filterEmployeeId || undefined,
        shiftId: filterShiftId || undefined,
        status:
          filterStatus !== "all" ? (filterStatus as AttendanceStatus) : undefined,
        search: searchQuery || undefined,
        page: currentPage,
        limit: pageSize,
      });

      if (res?.data) {
        setRecords(res.data);
        if (res.summary) setSummary(res.summary);
        setTotalItems(res.total || res.data.length);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      showToast("error", "Không thể tải dữ liệu bảng chấm công.");
    } finally {
      setIsLoading(false);
    }
  }, [
    buildingId,
    startDate,
    endDate,
    filterEmployeeId,
    filterShiftId,
    filterStatus,
    searchQuery,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ─── Rule #10: Modal Reset and Confirmation ───────────────────────────
  const handleAttemptCloseOverride = () => {
    if (isDirty) {
      setIsConfirmCloseOpen(true);
    } else {
      performCloseOverride();
    }
  };

  const performCloseOverride = () => {
    setIsOverrideModalOpen(false);
    setSelectedRecord(null);
    setIsDirty(false);
    setOverrideStatus("on_time");
    setOverrideCheckIn("");
    setOverrideCheckOut("");
    setOverrideNote("");
  };

  const handleOpenOverride = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setOverrideStatus(record.attendanceStatus);

    if (record.checkIn) {
      const d = new Date(record.checkIn);
      setOverrideCheckIn(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    } else {
      setOverrideCheckIn(record.shiftStartTime);
    }

    if (record.checkOut) {
      const d = new Date(record.checkOut);
      setOverrideCheckOut(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    } else {
      setOverrideCheckOut(record.shiftEndTime);
    }

    setOverrideNote("");
    setIsDirty(false);
    setIsOverrideModalOpen(true);
  };

  // ─── Submit Manual Override ────────────────────────────────────────────
  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setIsSubmittingOverride(true);
    try {
      let checkInIso: string | undefined = undefined;
      let checkOutIso: string | undefined = undefined;

      if (overrideCheckIn) {
        checkInIso = new Date(
          `${selectedRecord.workDate}T${overrideCheckIn}:00`
        ).toISOString();
      }

      if (overrideCheckOut) {
        checkOutIso = new Date(
          `${selectedRecord.workDate}T${overrideCheckOut}:00`
        ).toISOString();
      }

      await attendanceService.overrideAttendance(buildingId, {
        workScheduleId: selectedRecord.workScheduleId,
        status: overrideStatus,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        note: overrideNote || undefined,
      });

      showToast("success", "Đã cập nhật chấm công thủ công và ghi nhận nhật ký!");
      performCloseOverride();
      fetchAttendance();
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Lỗi khi cập nhật chấm công"
      );
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // ─── Status Badge Styler ───────────────────────────────────────────────
  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "on_time":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Đúng giờ</span>
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Đi trễ</span>
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Vắng mặt</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold text-zinc-600 bg-zinc-100 rounded-xl border border-zinc-200">
            <HelpCircle className="w-3 h-3 text-zinc-400" />
            <span>Chưa chấm công</span>
          </span>
        );
    }
  };

  // ─── Rule #9: Standardized 5-page window jumping ────────────────────────
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = windowStart; i < windowStart + 5 && i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [windowStart, totalPages]);

  const handlePageJump = (delta: number) => {
    const nextWindow = windowStart + delta;
    if (nextWindow >= 1 && nextWindow <= totalPages) {
      setWindowStart(nextWindow);
      setCurrentPage(nextWindow);
    }
  };

  // ─── Export simulation ─────────────────────────────────────────────────
  const handleExportData = () => {
    if (records.length === 0) {
      showToast("error", "Không có dữ liệu để xuất bảng công");
      return;
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Ngày,Nhân viên,SĐT,Vị trí,Ca làm việc,Khung giờ,Check-in,Check-out,Trạng thái,Người điều chỉnh",
        ...records.map(
          (r) =>
            `"${formatDisplayDate(r.workDate)}","${r.employeeName}","${
              r.employeePhone
            }","${r.positionName || "Nhân viên"}","${r.shiftName}","${
              r.shiftStartTime
            }-${r.shiftEndTime}","${formatDisplayTime(
              r.checkIn
            )}","${formatDisplayTime(r.checkOut)}","${
              r.attendanceStatus === "on_time"
                ? "Đúng giờ"
                : r.attendanceStatus === "late"
                ? "Đi trễ"
                : r.attendanceStatus === "absent"
                ? "Vắng mặt"
                : "Chưa chấm công"
            }","${r.editedByName || ""}"`
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `bang_cham_cong_${startDate}_${endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Đã xuất bảng chấm công thành công!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-[80] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10"
              : "bg-rose-50 text-rose-800 border-rose-200 shadow-rose-500/10"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#2AC1BC] uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>UC-L-22 · Quản lý nhân sự</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Bảng chấm công nhân viên
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Theo dõi giờ làm việc, kiểm tra nhật ký check-in/out và điều chỉnh công
            tại <strong className="text-zinc-800">{activeBuilding?.name || "Tòa nhà"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            <span>Xuất bảng công (CSV)</span>
          </button>
        </div>
      </div>

      {/* ─── Metric Overview Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold uppercase text-zinc-400 mb-1">
            Tổng số ca
          </div>
          <div className="text-xl sm:text-2xl font-black text-zinc-900">
            {summary.totalShifts}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Trong kỳ lọc</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold uppercase text-emerald-600 mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đúng giờ</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {summary.onTimeCount}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Check-in chuẩn</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold uppercase text-amber-600 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Đi trễ</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            {summary.lateCount}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Quá giờ quy định</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold uppercase text-rose-600 mb-1 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Vắng mặt</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            {summary.absentCount}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Không check-in</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Chưa tới giờ</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-zinc-700">
            {summary.notYetCount}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Ca sắp tới</p>
        </div>

        <div className="p-4 bg-white border border-[#2AC1BC]/30 rounded-2xl shadow-sm bg-[#2AC1BC]/[0.02]">
          <div className="text-[11px] font-bold uppercase text-[#2AC1BC] mb-1 flex items-center gap-1">
            <Percent className="w-3 h-3" />
            <span>Chuyên cần</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2AC1BC]">
            {summary.attendanceRate}%
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Đúng giờ / Đã điểm danh</p>
        </div>
      </div>

      {/* ─── Filter & Control Bar ───────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Preset Buttons & Date Range */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200">
              <button
                onClick={() => handleDatePresetChange("today")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  datePreset === "today"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => handleDatePresetChange("week")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  datePreset === "week"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Tuần này
              </button>
              <button
                onClick={() => handleDatePresetChange("month")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  datePreset === "month"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Tháng này
              </button>
              <button
                onClick={() => setDatePreset("custom")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  datePreset === "custom"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Tùy chọn
              </button>
            </div>

            {/* Custom Date Inputs */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 border border-zinc-200 rounded-xl text-xs bg-zinc-50/60 font-semibold"
              />
              <span>→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 border border-zinc-200 rounded-xl text-xs bg-zinc-50/60 font-semibold"
              />
            </div>
          </div>

          {/* View Mode Toggle (Rule #9: Grid default) */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200 self-end md:self-auto">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Lưới</span>
            </button>
            <button
              onClick={() => handleViewModeChange("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Bảng</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT nhân viên..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-zinc-50/50"
            />
          </div>

          <select
            value={filterEmployeeId}
            onChange={(e) => {
              setFilterEmployeeId(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-zinc-50/50 cursor-pointer"
          >
            <option value="">Tất cả nhân viên ({staffList.length})</option>
            {staffList.map((s) => (
              <option key={s.employeeId} value={s.employeeId}>
                {s.fullName} ({s.positionName || "Nhân viên"})
              </option>
            ))}
          </select>

          <select
            value={filterShiftId}
            onChange={(e) => {
              setFilterShiftId(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-zinc-50/50 cursor-pointer"
          >
            <option value="">Tất cả ca làm việc ({shifts.length})</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-zinc-50/50 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái chấm công</option>
            <option value="on_time">Đúng giờ (on_time)</option>
            <option value="late">Đi trễ (late)</option>
            <option value="absent">Vắng mặt (absent)</option>
            <option value="not_yet">Chưa chấm công (not_yet)</option>
          </select>
        </div>
      </div>

      {/* ─── Content Area ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin mb-3" />
          <p className="text-xs font-bold text-zinc-500">
            Đang tải dữ liệu chấm công...
          </p>
        </div>
      ) : records.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-12 text-center text-zinc-500 py-20 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-[#2AC1BC]/10 rounded-2xl flex items-center justify-center mb-4 text-[#2AC1BC]">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-zinc-900 mb-1">
            Không có dữ liệu chấm công trong khoảng thời gian này
          </h3>
          <p className="max-w-md mx-auto mb-4 text-xs text-zinc-500 leading-relaxed">
            Chưa có ca làm việc nào được xếp hoặc chưa có ghi nhận chấm công nào
            phù hợp với bộ lọc ngày {formatDisplayDate(startDate)} đến{" "}
            {formatDisplayDate(endDate)}.
          </p>
          <button
            onClick={() => handleDatePresetChange("month")}
            className="px-4 py-2 text-xs font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 rounded-xl hover:bg-[#2AC1BC]/20 transition-colors cursor-pointer"
          >
            Xem toàn bộ tháng này
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ═══════════════════════════════════════════════════════════════════
           PARALLEL VIEW 1: GRID VIEW (Default = 6 items per page)
           ═══════════════════════════════════════════════════════════════════ */
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.map((item) => (
              <div
                key={item.workScheduleId}
                className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top card bar: Date & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-800">
                      <Calendar className="w-3.5 h-3.5 text-[#2AC1BC]" />
                      <span>{formatDisplayDate(item.workDate)}</span>
                    </div>
                    {getStatusBadge(item.attendanceStatus)}
                  </div>

                  {/* Employee details */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 font-black text-sm uppercase">
                      {item.employeeAvatar ? (
                        <img
                          src={item.employeeAvatar}
                          alt={item.employeeName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        item.employeeName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-zinc-900 truncate">
                        {item.employeeName}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {item.positionName || "Nhân viên"} · {item.employeePhone}
                      </div>
                    </div>
                  </div>

                  {/* Shift details & Working Hours */}
                  <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-2.5 space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-700">
                        {item.shiftName}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500">
                        {item.shiftStartTime} - {item.shiftEndTime}
                      </span>
                    </div>

                    {/* Check-in / Check-out timestamps */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/40 text-[11px]">
                      <div>
                        <span className="text-zinc-400 font-semibold block text-[10px] uppercase">
                          Check-in
                        </span>
                        <span className="font-bold text-zinc-800">
                          {formatDisplayTime(item.checkIn)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-semibold block text-[10px] uppercase">
                          Check-out
                        </span>
                        <span className="font-bold text-zinc-800">
                          {formatDisplayTime(item.checkOut)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edited by note if manual override */}
                  {item.editedByName && (
                    <div className="text-[10px] text-zinc-400 italic mb-2">
                      Đã điều chỉnh bởi: {item.editedByName}
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <button
                  onClick={() => handleOpenOverride(item)}
                  className="w-full mt-2 py-2 px-3 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Điều chỉnh chấm công</span>
                </button>
              </div>
            ))}
          </div>

          {/* Rule #9: Standardized Pagination Bar */}
          <div className="mt-4 p-4 bg-white border border-zinc-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold">
              <span>Hiển thị</span>
              <input
                type="number"
                min={1}
                max={100}
                value={pageSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 0) setPageSize(val);
                }}
                className="w-14 px-2 py-1 text-center font-bold border border-zinc-200 rounded-lg bg-white"
              />
              <span>/ trang</span>
              <span className="text-zinc-300">|</span>
              <span>
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalItems)} trên {totalItems}{" "}
                mục
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={windowStart <= 1}
                onClick={() => handlePageJump(-5)}
                className="px-2 py-1 text-xs font-bold text-zinc-500 hover:bg-zinc-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Lùi 5 trang"
              >
                «
              </button>
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1 text-zinc-500 hover:bg-zinc-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    currentPage === p
                      ? "bg-[#2AC1BC] text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1 text-zinc-500 hover:bg-zinc-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={windowStart + 5 > totalPages}
                onClick={() => handlePageJump(5)}
                className="px-2 py-1 text-xs font-bold text-zinc-500 hover:bg-zinc-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Tiến 5 trang"
              >
                »
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           PARALLEL VIEW 2: TABLE VIEW (Default = 10 items per page)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-400 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Ngày</th>
                  <th className="py-3.5 px-4">Nhân viên</th>
                  <th className="py-3.5 px-4">Vị trí</th>
                  <th className="py-3.5 px-4">Ca trực</th>
                  <th className="py-3.5 px-4">Khung giờ quy định</th>
                  <th className="py-3.5 px-4">Check-in</th>
                  <th className="py-3.5 px-4">Check-out</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Người điều chỉnh</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                {records.map((item) => (
                  <tr
                    key={item.workScheduleId}
                    className="hover:bg-zinc-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-zinc-900">
                      {formatDisplayDate(item.workDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-zinc-900">
                        {item.employeeName}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {item.employeePhone}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-semibold">
                      {item.positionName || "Nhân viên"}
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-800">
                      {item.shiftName}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 font-semibold">
                      {item.shiftStartTime} – {item.shiftEndTime}
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-800">
                      {formatDisplayTime(item.checkIn)}
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-800">
                      {formatDisplayTime(item.checkOut)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(item.attendanceStatus)}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-[11px]">
                      {item.editedByName || "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenOverride(item)}
                        className="p-1.5 text-zinc-400 hover:text-[#2AC1BC] hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        title="Điều chỉnh chấm công thủ công"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rule #9: Standardized Pagination Bar */}
          <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold">
              <span>Hiển thị</span>
              <input
                type="number"
                min={1}
                max={100}
                value={pageSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 0) setPageSize(val);
                }}
                className="w-14 px-2 py-1 text-center font-bold border border-zinc-200 rounded-lg bg-white"
              />
              <span>/ trang</span>
              <span className="text-zinc-300">|</span>
              <span>
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalItems)} trên {totalItems}{" "}
                mục
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={windowStart <= 1}
                onClick={() => handlePageJump(-5)}
                className="px-2 py-1 text-xs font-bold text-zinc-500 hover:bg-zinc-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Lùi 5 trang"
              >
                «
              </button>
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1 text-zinc-500 hover:bg-zinc-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    currentPage === p
                      ? "bg-[#2AC1BC] text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1 text-zinc-500 hover:bg-zinc-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={windowStart + 5 > totalPages}
                onClick={() => handlePageJump(5)}
                className="px-2 py-1 text-xs font-bold text-zinc-500 hover:bg-zinc-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                title="Tiến 5 trang"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         MODAL: MANUAL ATTENDANCE OVERRIDE (UC-L-22)
         ═══════════════════════════════════════════════════════════════════ */}
      {isOverrideModalOpen && selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleAttemptCloseOverride();
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100 animate-in zoom-in-95 duration-200"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900">
                    Điều chỉnh chấm công thủ công
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-semibold">
                    UC-L-22: Ghi đè trạng thái và lưu nhật ký kiểm toán (AuditLog)
                  </p>
                </div>
              </div>
              <button
                onClick={handleAttemptCloseOverride}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmitOverride}
              className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar"
            >
              {/* Shift info preview card */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900">
                    {selectedRecord.employeeName}
                  </span>
                  <span className="text-xs font-bold text-[#2AC1BC]">
                    {formatDisplayDate(selectedRecord.workDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold">
                  <span>
                    {selectedRecord.shiftName} ({selectedRecord.shiftStartTime} -{" "}
                    {selectedRecord.shiftEndTime})
                  </span>
                  <span>{selectedRecord.positionName || "Nhân viên"}</span>
                </div>
              </div>

              {/* Attendance Status Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                  <span>Trạng thái chấm công</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer font-bold transition-all ${
                      overrideStatus === "on_time"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="overrideStatus"
                      value="on_time"
                      checked={overrideStatus === "on_time"}
                      onChange={() => {
                        setOverrideStatus("on_time");
                        setIsDirty(true);
                      }}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Đúng giờ (on_time)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer font-bold transition-all ${
                      overrideStatus === "late"
                        ? "bg-amber-50 text-amber-800 border-amber-300 shadow-sm"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="overrideStatus"
                      value="late"
                      checked={overrideStatus === "late"}
                      onChange={() => {
                        setOverrideStatus("late");
                        setIsDirty(true);
                      }}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Đi trễ (late)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer font-bold transition-all ${
                      overrideStatus === "absent"
                        ? "bg-rose-50 text-rose-800 border-rose-300 shadow-sm"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="overrideStatus"
                      value="absent"
                      checked={overrideStatus === "absent"}
                      onChange={() => {
                        setOverrideStatus("absent");
                        setIsDirty(true);
                      }}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>Vắng mặt (absent)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer font-bold transition-all ${
                      overrideStatus === "not_yet"
                        ? "bg-zinc-100 text-zinc-800 border-zinc-300 shadow-sm"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="overrideStatus"
                      value="not_yet"
                      checked={overrideStatus === "not_yet"}
                      onChange={() => {
                        setOverrideStatus("not_yet");
                        setIsDirty(true);
                      }}
                      className="text-zinc-600 focus:ring-zinc-500"
                    />
                    <span>Chưa chấm công</span>
                  </label>
                </div>
              </div>

              {/* Time inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">
                    Giờ check-in thực tế
                  </label>
                  <input
                    type="time"
                    value={overrideCheckIn}
                    onChange={(e) => {
                      setOverrideCheckIn(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">
                    Giờ check-out thực tế
                  </label>
                  <input
                    type="time"
                    value={overrideCheckOut}
                    onChange={(e) => {
                      setOverrideCheckOut(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white"
                  />
                </div>
              </div>

              {/* Adjustment Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">
                  Lý do điều chỉnh (ghi vào AuditLog)
                </label>
                <textarea
                  rows={2}
                  value={overrideNote}
                  onChange={(e) => {
                    setOverrideNote(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Ví dụ: Nhân viên báo lỗi GPS thiết bị, chủ nhà xác nhận có mặt qua camera an ninh..."
                  className="w-full px-3 py-2 text-xs font-medium border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] resize-none"
                />
              </div>

              {/* AuditLog Notice */}
              <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[11px]">
                  Hệ thống tuân thủ <strong>Rule #4</strong>: Mọi điều chỉnh chấm
                  công thủ công của chủ nhà sẽ được lưu vào giao dịch kiểm toán
                  (AuditLog) cùng ID tài khoản và dấu thời gian thực.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleAttemptCloseOverride}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOverride}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25aba6] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingOverride ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Xác nhận điều chỉnh</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         CONFIRMATION MODAL ON UNSAVED CHANGES (Rule #10)
         ═══════════════════════════════════════════════════════════════════ */}
      {isConfirmCloseOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsConfirmCloseOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-zinc-100 p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-zinc-900">
                Xác nhận đóng form
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Bạn có thông tin điều chỉnh chấm công chưa lưu. Nếu đóng bây giờ,
                toàn bộ các thay đổi sẽ bị hủy bỏ.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmCloseOpen(false)}
                className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmCloseOpen(false);
                  performCloseOverride();
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-600/20"
              >
                Hủy thay đổi & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
