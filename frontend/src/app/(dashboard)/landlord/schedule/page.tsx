"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Repeat,
  Sparkles,
  User,
  Shield,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  CalendarDays,
  LayoutGrid,
  List,
  Layers,
  Settings,
  Search,
  Loader2,
  Info,
  Check,
  Building2,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { staffService, StaffItem } from "@/services/staff.service";
import {
  scheduleService,
  ShiftItem,
  WorkScheduleItem,
  SchedulesSummary,
} from "@/services/schedule.service";

// Days of week helper (Mon to Sun)
const DAYS_OF_WEEK = [
  { key: "2", label: "Thứ 2", short: "T2", dayIndex: 1 },
  { key: "3", label: "Thứ 3", short: "T3", dayIndex: 2 },
  { key: "4", label: "Thứ 4", short: "T4", dayIndex: 3 },
  { key: "5", label: "Thứ 5", short: "T5", dayIndex: 4 },
  { key: "6", label: "Thứ 6", short: "T6", dayIndex: 5 },
  { key: "7", label: "Thứ 7", short: "T7", dayIndex: 6 },
  { key: "CN", label: "Chủ Nhật", short: "CN", dayIndex: 0 },
];

function getMondayOfCurrentWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

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

export default function WorkforceSchedulePage() {
  const { activeBuilding } = useAuth();
  const buildingId = activeBuilding?.id || "";

  // ─── View & Navigation States ──────────────────────────────────────────
  // Rule #9: Standardized View & Pagination (Grid default = 6, Table = 10)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    getMondayOfCurrentWeek()
  );

  // List View Pagination (Rule #9)
  const [listPage, setListPage] = useState<number>(1);
  const [listPageSize, setListPageSize] = useState<number>(10);
  const [totalListItems, setTotalListItems] = useState<number>(0);
  const [windowStart, setWindowStart] = useState<number>(1);

  // ─── Filter States ─────────────────────────────────────────────────────
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("");
  const [filterShiftId, setFilterShiftId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ─── Data States ───────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<WorkScheduleItem[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [summary, setSummary] = useState<SchedulesSummary>({
    totalSchedules: 0,
    scheduledCount: 0,
    canceledCount: 0,
    recurringCount: 0,
    adhocCount: 0,
  });

  // Feedback banner
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ─── Modal States ──────────────────────────────────────────────────────
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isAdhocModalOpen, setIsAdhocModalOpen] = useState(false);
  const [isShiftsModalOpen, setIsShiftsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] =
    useState<WorkScheduleItem | null>(null);

  // Rule #10: Modal confirmation state for unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [pendingModalToClose, setPendingModalToClose] = useState<
    "recurring" | "adhoc" | "shifts" | "edit" | null
  >(null);

  // ─── Modal Form Drafts ─────────────────────────────────────────────────
  // Recurring form
  const [recurringEmployeeIds, setRecurringEmployeeIds] = useState<string[]>([]);
  const [recurringShiftId, setRecurringShiftId] = useState<string>("");
  const [recurringDays, setRecurringDays] = useState<string[]>(["2", "4", "6"]);
  const [recurringStartDate, setRecurringStartDate] = useState<string>(
    formatDateString(new Date())
  );
  const [recurringEndDate, setRecurringEndDate] = useState<string>(
    formatDateString(new Date(Date.now() + 30 * 86400000))
  );
  const [recurringNote, setRecurringNote] = useState<string>("");
  const [isSubmittingRecurring, setIsSubmittingRecurring] = useState(false);

  // Ad-hoc form
  const [adhocEmployeeId, setAdhocEmployeeId] = useState<string>("");
  const [adhocShiftId, setAdhocShiftId] = useState<string>("");
  const [adhocWorkDate, setAdhocWorkDate] = useState<string>(
    formatDateString(new Date())
  );
  const [adhocNote, setAdhocNote] = useState<string>("");
  const [isSubmittingAdhoc, setIsSubmittingAdhoc] = useState(false);

  // Shifts management form
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftStart, setNewShiftStart] = useState("08:00");
  const [newShiftEnd, setNewShiftEnd] = useState("17:00");
  const [isCreatingShift, setIsCreatingShift] = useState(false);

  // Edit occurrence form
  const [editShiftId, setEditShiftId] = useState<string>("");
  const [editWorkDate, setEditWorkDate] = useState<string>("");
  const [editStatus, setEditStatus] = useState<"scheduled" | "canceled">(
    "scheduled"
  );
  const [editScope, setEditScope] = useState<"single" | "future">("single");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // ─── Compute 7 days for current week ───────────────────────────────────
  const weekDays = useMemo(() => {
    const days: { date: Date; dateString: string; label: string; short: string; isToday: boolean }[] = [];
    const todayStr = formatDateString(new Date());

    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedWeekStart);
      d.setDate(selectedWeekStart.getDate() + i);
      const dateStr = formatDateString(d);
      const info = DAYS_OF_WEEK[i];
      days.push({
        date: d,
        dateString: dateStr,
        label: info.label,
        short: info.short,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [selectedWeekStart]);

  const weekRangeLabel = useMemo(() => {
    const startStr = formatDisplayDate(formatDateString(weekDays[0].date));
    const endStr = formatDisplayDate(formatDateString(weekDays[6].date));
    return `${startStr} – ${endStr}`;
  }, [weekDays]);

  // ─── Load Shifts & Staff ───────────────────────────────────────────────
  const loadInitialDependencies = useCallback(async () => {
    if (!buildingId) return;
    try {
      const [shiftsRes, staffRes] = await Promise.all([
        scheduleService.getShifts(buildingId),
        staffService.getStaffList(buildingId, { status: "active", limit: 100 }),
      ]);
      setShifts(shiftsRes || []);
      if (shiftsRes?.length > 0 && !recurringShiftId) {
        setRecurringShiftId(shiftsRes[0].id);
        setAdhocShiftId(shiftsRes[0].id);
      }
      setStaffList(staffRes?.data || []);
    } catch (err) {
      console.error("Failed to load shifts/staff:", err);
    }
  }, [buildingId, recurringShiftId]);

  // ─── Fetch Schedules ───────────────────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    if (!buildingId) return;
    setIsLoading(true);
    try {
      // If calendar mode, query week range; if list mode, query active month or params
      let startDate: string;
      let endDate: string;

      if (viewMode === "calendar") {
        startDate = formatDateString(weekDays[0].date);
        endDate = formatDateString(weekDays[6].date);
      } else {
        // Query broader month range for list view
        const cur = new Date(selectedWeekStart);
        const monthStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
        const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
        startDate = formatDateString(monthStart);
        endDate = formatDateString(monthEnd);
      }

      const res = await scheduleService.getSchedules(buildingId, {
        startDate,
        endDate,
        employeeId: filterEmployeeId || undefined,
        shiftId: filterShiftId || undefined,
        status:
          filterStatus !== "all"
            ? (filterStatus as "scheduled" | "canceled")
            : undefined,
        search: searchQuery || undefined,
        page: viewMode === "list" ? listPage : 1,
        limit: viewMode === "list" ? listPageSize : 1000,
      });

      if (res?.data) {
        setSchedules(res.data);
        if (res.summary) setSummary(res.summary);
        setTotalListItems(res.total || res.data.length);
      }
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      showToast("error", "Không thể tải danh sách ca làm việc.");
    } finally {
      setIsLoading(false);
    }
  }, [
    buildingId,
    viewMode,
    weekDays,
    selectedWeekStart,
    filterEmployeeId,
    filterShiftId,
    filterStatus,
    searchQuery,
    listPage,
    listPageSize,
  ]);

  useEffect(() => {
    loadInitialDependencies();
  }, [loadInitialDependencies]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // ─── Toast helper ──────────────────────────────────────────────────────
  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─── Week navigation ───────────────────────────────────────────────────
  const handlePrevWeek = () => {
    const prev = new Date(selectedWeekStart);
    prev.setDate(selectedWeekStart.getDate() - 7);
    setSelectedWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedWeekStart);
    next.setDate(selectedWeekStart.getDate() + 7);
    setSelectedWeekStart(next);
  };

  const handleCurrentWeek = () => {
    setSelectedWeekStart(getMondayOfCurrentWeek());
  };

  // ─── Rule #10: Modal Reset and Confirmation ───────────────────────────
  const handleAttemptCloseModal = (
    modalType: "recurring" | "adhoc" | "shifts" | "edit"
  ) => {
    if (isDirty) {
      setPendingModalToClose(modalType);
      setIsConfirmCloseOpen(true);
    } else {
      performCloseModal(modalType);
    }
  };

  const performCloseModal = (
    modalType: "recurring" | "adhoc" | "shifts" | "edit"
  ) => {
    setIsDirty(false);
    if (modalType === "recurring") {
      setIsRecurringModalOpen(false);
      setRecurringEmployeeIds([]);
      setRecurringDays(["2", "4", "6"]);
      setRecurringStartDate(formatDateString(new Date()));
      setRecurringEndDate(
        formatDateString(new Date(Date.now() + 30 * 86400000))
      );
      setRecurringNote("");
    } else if (modalType === "adhoc") {
      setIsAdhocModalOpen(false);
      setAdhocEmployeeId("");
      setAdhocWorkDate(formatDateString(new Date()));
      setAdhocNote("");
    } else if (modalType === "shifts") {
      setIsShiftsModalOpen(false);
      setNewShiftName("");
      setNewShiftStart("08:00");
      setNewShiftEnd("17:00");
    } else if (modalType === "edit") {
      setIsEditModalOpen(false);
      setSelectedScheduleForEdit(null);
      setEditScope("single");
    }
  };

  // ─── Recurring Schedule Submit ─────────────────────────────────────────
  const handleSubmitRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recurringEmployeeIds.length === 0) {
      showToast("error", "Vui lòng chọn ít nhất một nhân viên");
      return;
    }
    if (!recurringShiftId) {
      showToast("error", "Vui lòng chọn ca làm việc");
      return;
    }
    if (recurringDays.length === 0) {
      showToast("error", "Vui lòng chọn ít nhất một ngày trong tuần");
      return;
    }

    setIsSubmittingRecurring(true);
    try {
      const res = await scheduleService.createRecurringSchedule(buildingId, {
        employeeIds: recurringEmployeeIds,
        shiftId: recurringShiftId,
        daysOfWeek: recurringDays.join(","),
        startDate: recurringStartDate,
        endDate: recurringEndDate,
        note: recurringNote || undefined,
      });

      showToast(
        "success",
        res?.message || "Đã tạo và phân ca làm việc lặp lại thành công!"
      );
      performCloseModal("recurring");
      fetchSchedules();
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Lỗi khi tạo ca làm việc định kỳ"
      );
    } finally {
      setIsSubmittingRecurring(false);
    }
  };

  // ─── Ad-hoc Schedule Submit ────────────────────────────────────────────
  const handleSubmitAdhoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adhocEmployeeId) {
      showToast("error", "Vui lòng chọn nhân viên");
      return;
    }
    if (!adhocShiftId) {
      showToast("error", "Vui lòng chọn ca làm việc");
      return;
    }
    if (!adhocWorkDate) {
      showToast("error", "Vui lòng chọn ngày làm việc");
      return;
    }

    setIsSubmittingAdhoc(true);
    try {
      await scheduleService.createAdhocSchedule(buildingId, {
        employeeId: adhocEmployeeId,
        shiftId: adhocShiftId,
        workDate: adhocWorkDate,
        note: adhocNote || undefined,
      });

      showToast("success", "Đã xếp ca làm việc đột xuất thành công!");
      performCloseModal("adhoc");
      fetchSchedules();
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Lỗi khi xếp ca làm việc đột xuất"
      );
    } finally {
      setIsSubmittingAdhoc(false);
    }
  };

  // ─── Shift Template Create ─────────────────────────────────────────────
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName.trim()) {
      showToast("error", "Tên ca làm việc không được để trống");
      return;
    }

    setIsCreatingShift(true);
    try {
      const created = await scheduleService.createShift(buildingId, {
        name: newShiftName.trim(),
        startTime: newShiftStart,
        endTime: newShiftEnd,
      });

      showToast("success", `Đã tạo ca làm việc "${created.name}" thành công!`);
      setNewShiftName("");
      setShifts((prev) => [...prev, created]);
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Lỗi khi tạo ca làm việc"
      );
    } finally {
      setIsCreatingShift(false);
    }
  };

  // ─── Delete Shift Template ─────────────────────────────────────────────
  const handleDeleteShift = async (shiftId: string, shiftName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ca mẫu "${shiftName}"?`)) return;
    try {
      await scheduleService.deleteShift(buildingId, shiftId);
      showToast("success", "Đã xóa ca mẫu thành công");
      setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Không thể xóa ca đang có lịch làm việc"
      );
    }
  };

  // ─── Open Edit Modal ───────────────────────────────────────────────────
  const handleOpenEditModal = (item: WorkScheduleItem) => {
    setSelectedScheduleForEdit(item);
    setEditShiftId(item.shiftId);
    setEditWorkDate(item.workDate);
    setEditStatus(item.status);
    setEditScope("single");
    setIsDirty(false);
    setIsEditModalOpen(true);
  };

  // ─── Submit Edit Occurrence / Pattern ──────────────────────────────────
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleForEdit) return;

    setIsSubmittingEdit(true);
    try {
      if (editScope === "future" && selectedScheduleForEdit.recurrenceId) {
        // Edit whole pattern forward (UC-L-21)
        const res = await scheduleService.updateRecurrence(
          buildingId,
          selectedScheduleForEdit.recurrenceId,
          {
            shiftId: editShiftId,
            status: editStatus,
          }
        );
        showToast(
          "success",
          res?.message || "Đã cập nhật toàn bộ các ca định kỳ trong tương lai!"
        );
      } else {
        // Edit single occurrence (UC-L-21)
        await scheduleService.updateSchedule(
          buildingId,
          selectedScheduleForEdit.id,
          {
            shiftId: editShiftId,
            workDate: editWorkDate,
            status: editStatus,
          }
        );
        showToast("success", "Đã cập nhật ca làm việc thành công!");
      }

      performCloseModal("edit");
      fetchSchedules();
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Lỗi khi cập nhật ca làm việc"
      );
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // ─── Cancel / Delete Single Schedule ───────────────────────────────────
  const handleDeleteSchedule = async (item: WorkScheduleItem) => {
    const isRecurring = item.isRecurring && item.recurrenceId;
    let mode: "single" | "future" = "single";

    if (isRecurring) {
      const confirmAction = confirm(
        `Ca trực này thuộc chuỗi phân ca lặp lại.\n\nBấm "OK" để chỉ hủy ca ngày ${formatDisplayDate(
          item.workDate
        )}.\nBấm "Cancel" nếu bạn muốn xem tùy chọn hủy chuỗi tương lai trong modal Chỉnh sửa.`
      );
      if (!confirmAction) return;
    } else {
      if (
        !confirm(
          `Bạn có chắc muốn hủy ca trực của ${item.employeeName} vào ngày ${formatDisplayDate(
            item.workDate
          )}?`
        )
      )
        return;
    }

    try {
      await scheduleService.deleteSchedule(buildingId, item.id, mode);
      showToast("success", "Đã hủy ca làm việc thành công");
      fetchSchedules();
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Lỗi khi hủy ca làm việc"
      );
    }
  };

  // ─── Shift Badge Styler ────────────────────────────────────────────────
  const getShiftBadgeStyle = (shiftName: string) => {
    const lower = (shiftName || "").toLowerCase();
    if (lower.includes("sáng")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (lower.includes("chiều")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (lower.includes("đêm")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  // ─── Rule #9: List View Pagination Calculation ─────────────────────────
  const totalListPages = Math.ceil(totalListItems / listPageSize) || 1;
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = windowStart; i < windowStart + 5 && i <= totalListPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [windowStart, totalListPages]);

  const handlePageJump = (delta: number) => {
    const nextWindow = windowStart + delta;
    if (nextWindow >= 1 && nextWindow <= totalListPages) {
      setWindowStart(nextWindow);
      setListPage(nextWindow);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Toast notification */}
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

      {/* ─── Top Header & Primary Actions ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#2AC1BC] uppercase tracking-wider mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>UC-L-21 · Quản lý nhân sự</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Lịch làm việc & Phân ca
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Phân ca định kỳ hàng tuần, xếp ca đột xuất và theo dõi lịch trực tại{" "}
            <strong className="text-zinc-800">
              {activeBuilding?.name || "Tòa nhà hiện tại"}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setIsDirty(false);
              setIsShiftsModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            <span>Quản lý ca mẫu</span>
          </button>

          <button
            onClick={() => {
              setIsDirty(false);
              setIsAdhocModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Phân ca đơn lẻ</span>
          </button>

          <button
            onClick={() => {
              setIsDirty(false);
              setIsRecurringModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25aba6] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Phân ca lặp lại</span>
          </button>
        </div>
      </div>

      {/* ─── Metric Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Tổng ca trực
            </span>
            <Layers className="w-4 h-4 text-[#2AC1BC]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-zinc-900">
            {summary.totalSchedules}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Trong khoảng thời gian</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Đã lên lịch
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {summary.scheduledCount}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Sẵn sàng thực hiện</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Ca lặp lại
            </span>
            <Repeat className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600">
            {summary.recurringCount}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Tự động hàng tuần</p>
        </div>

        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Ca đột xuất
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            {summary.adhocCount}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Phân theo nhu cầu</p>
        </div>
      </div>

      {/* ─── Control Bar: Date Navigator, Filters & View Mode Switcher ───── */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Week Date Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer border border-zinc-200"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer border border-zinc-200"
            >
              Hôm nay
            </button>

            <button
              onClick={handleNextWeek}
              className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer border border-zinc-200"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pl-2 text-sm font-bold text-zinc-800">
              <CalendarIcon className="w-4 h-4 text-[#2AC1BC]" />
              <span>{weekRangeLabel}</span>
            </div>
          </div>

          {/* View Mode Switcher (Rule #9) */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200">
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lịch tuần</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Danh sách</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-zinc-50/50"
            />
          </div>

          <select
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-zinc-50/50 cursor-pointer"
          >
            <option value="">Tất cả nhân viên ({staffList.length})</option>
            {staffList.map((s) => (
              <option key={s.employeeId} value={s.employeeId}>
                {s.fullName} ({s.positionName})
              </option>
            ))}
          </select>

          <select
            value={filterShiftId}
            onChange={(e) => setFilterShiftId(e.target.value)}
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
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-zinc-50/50 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="scheduled">Đã lên lịch</option>
            <option value="canceled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* ─── Main Content Views ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin mb-3" />
          <p className="text-xs font-bold text-zinc-500">
            Đang tải lịch phân ca làm việc...
          </p>
        </div>
      ) : viewMode === "calendar" ? (
        /* ═══════════════════════════════════════════════════════════════════
           VIEW 1: 7-DAY WEEK CALENDAR GRID
           ═══════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const daySchedules = schedules.filter(
              (s) => s.workDate === day.dateString
            );

            return (
              <div
                key={day.dateString}
                className={`flex flex-col bg-white border rounded-2xl shadow-sm overflow-hidden transition-all min-h-[380px] ${
                  day.isToday
                    ? "border-[#2AC1BC] ring-2 ring-[#2AC1BC]/20 bg-[#2AC1BC]/[0.01]"
                    : "border-zinc-200/90"
                }`}
              >
                {/* Column Day Header */}
                <div
                  className={`p-3 text-center border-b transition-colors ${
                    day.isToday
                      ? "bg-[#2AC1BC]/10 border-[#2AC1BC]/30 text-[#1fa8a3]"
                      : "bg-zinc-50/80 border-zinc-100 text-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-extrabold">{day.label}</span>
                    {day.isToday && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-[#2AC1BC] text-white rounded-full">
                        Hôm nay
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-400 mt-0.5">
                    {formatDisplayDate(day.dateString)}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 mt-1">
                    {daySchedules.length} ca trực
                  </div>
                </div>

                {/* Shifts Container */}
                <div className="p-2.5 flex-1 space-y-2 overflow-y-auto max-h-[520px] custom-scrollbar">
                  {daySchedules.length === 0 ? (
                    <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300 mb-2">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-400">
                        Chưa có ca trực
                      </span>
                    </div>
                  ) : (
                    daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`p-3 rounded-xl border text-left transition-all relative group ${
                          schedule.status === "canceled"
                            ? "bg-zinc-50/60 border-zinc-200 opacity-60 line-through"
                            : "bg-white border-zinc-200 hover:border-[#2AC1BC]/60 hover:shadow-md"
                        }`}
                      >
                        {/* Status & Recurring Badge */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${getShiftBadgeStyle(
                              schedule.shiftName
                            )}`}
                          >
                            {schedule.shiftName}
                          </span>

                          {schedule.isRecurring ? (
                            <span
                              className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100"
                              title="Ca lặp lại hàng tuần"
                            >
                              <Repeat className="w-2.5 h-2.5" />
                              <span>Lặp</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md">
                              Đơn lẻ
                            </span>
                          )}
                        </div>

                        {/* Employee info */}
                        <div className="font-extrabold text-xs text-zinc-900 truncate">
                          {schedule.employeeName}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-semibold truncate mb-2">
                          {schedule.positionName || "Nhân viên"}
                        </div>

                        {/* Working hours */}
                        <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-600 mb-2">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>

                        {/* Action Buttons (visible on hover or focus) */}
                        <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-zinc-100">
                          <button
                            onClick={() => handleOpenEditModal(schedule)}
                            className="p-1 text-zinc-400 hover:text-[#2AC1BC] hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa ca này"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {schedule.status !== "canceled" && (
                            <button
                              onClick={() => handleDeleteSchedule(schedule)}
                              className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hủy ca này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           VIEW 2: STANDARDIZED LIST / TABLE VIEW (Rule #9)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          {schedules.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-[#2AC1BC]/10 rounded-2xl flex items-center justify-center text-[#2AC1BC] mb-3">
                <CalendarIcon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-zinc-900 mb-1">
                Không tìm thấy ca làm việc
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Chưa có ca làm việc nào trong khoảng thời gian hoặc theo bộ lọc
                đã chọn. Bấm vào nút bên dưới để phân ca.
              </p>
              <button
                onClick={() => {
                  setIsDirty(false);
                  setIsRecurringModalOpen(true);
                }}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25aba6] transition-all cursor-pointer"
              >
                + Bắt đầu phân ca lặp lại
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Ngày làm việc</th>
                    <th className="py-3.5 px-4">Nhân viên</th>
                    <th className="py-3.5 px-4">Vị trí</th>
                    <th className="py-3.5 px-4">Ca trực</th>
                    <th className="py-3.5 px-4">Khung giờ</th>
                    <th className="py-3.5 px-4">Loại phân ca</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {schedules.map((item) => (
                    <tr
                      key={item.id}
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
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${getShiftBadgeStyle(
                            item.shiftName
                          )}`}
                        >
                          {item.shiftName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-zinc-700">
                        {item.startTime} – {item.endTime}
                      </td>
                      <td className="py-3 px-4">
                        {item.isRecurring ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            <Repeat className="w-2.5 h-2.5" />
                            <span>Lặp lại hàng tuần</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                            Đơn lẻ (Đột xuất)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.status === "scheduled" ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100">
                            Đã lên lịch
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-zinc-400 bg-zinc-100 rounded-md">
                            Đã hủy
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-zinc-400 hover:text-[#2AC1BC] hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {item.status !== "canceled" && (
                            <button
                              onClick={() => handleDeleteSchedule(item)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hủy ca"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Rule #9: Standardized Pagination Bar */}
              <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold">
                  <span>Hiển thị</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={listPageSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) setListPageSize(val);
                    }}
                    className="w-14 px-2 py-1 text-center font-bold border border-zinc-200 rounded-lg bg-white"
                  />
                  <span>/ trang</span>
                  <span className="text-zinc-300">|</span>
                  <span>
                    {(listPage - 1) * listPageSize + 1}-
                    {Math.min(listPage * listPageSize, totalListItems)} trên{" "}
                    {totalListItems} mục
                  </span>
                </div>

                {/* 5-page window jumping */}
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
                    disabled={listPage <= 1}
                    onClick={() => setListPage((p) => Math.max(p - 1, 1))}
                    className="p-1 text-zinc-500 hover:bg-zinc-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      onClick={() => setListPage(p)}
                      className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        listPage === p
                          ? "bg-[#2AC1BC] text-white shadow-sm"
                          : "text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    disabled={listPage >= totalListPages}
                    onClick={() =>
                      setListPage((p) => Math.min(p + 1, totalListPages))
                    }
                    className="p-1 text-zinc-500 hover:bg-zinc-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    disabled={windowStart + 5 > totalListPages}
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
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         MODAL 1: PHÂN CA LẶP LẠI (UC-L-21 Step 2 Materialization)
         ═══════════════════════════════════════════════════════════════════ */}
      {isRecurringModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget)
              handleAttemptCloseModal("recurring");
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100 animate-in zoom-in-95 duration-200"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900">
                    Phân ca làm việc lặp lại
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-semibold">
                    UC-L-21: Tạo chuỗi lịch tự động và kết xuất thành các ca
                    trực độc lập theo tuần
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAttemptCloseModal("recurring")}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmitRecurring}
              className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar"
            >
              {/* Select Employees */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                    <span>Chọn nhân viên được phân ca</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (recurringEmployeeIds.length === staffList.length) {
                        setRecurringEmployeeIds([]);
                      } else {
                        setRecurringEmployeeIds(
                          staffList.map((s) => s.employeeId)
                        );
                      }
                      setIsDirty(true);
                    }}
                    className="text-[11px] font-bold text-[#2AC1BC] hover:underline cursor-pointer"
                  >
                    {recurringEmployeeIds.length === staffList.length
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả"}
                  </button>
                </div>

                {staffList.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Chưa có nhân viên đang hoạt động tại tòa nhà này. Vui lòng
                      thêm nhân viên trước.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-zinc-200 rounded-xl bg-zinc-50/50">
                    {staffList.map((s) => {
                      const isChecked = recurringEmployeeIds.includes(
                        s.employeeId
                      );
                      return (
                        <label
                          key={s.employeeId}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "bg-white border-[#2AC1BC] text-zinc-900 shadow-sm"
                              : "bg-transparent border-transparent hover:bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRecurringEmployeeIds((prev) => [
                                  ...prev,
                                  s.employeeId,
                                ]);
                              } else {
                                setRecurringEmployeeIds((prev) =>
                                  prev.filter((id) => id !== s.employeeId)
                                );
                              }
                              setIsDirty(true);
                            }}
                            className="rounded text-[#2AC1BC] focus:ring-[#2AC1BC]"
                          />
                          <div className="truncate">
                            <span className="font-bold">{s.fullName}</span>
                            <span className="text-[10px] text-zinc-400 ml-1">
                              ({s.positionName || "Nhân viên"})
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Select Shift */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                  <span>Ca làm việc</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={recurringShiftId}
                  onChange={(e) => {
                    setRecurringShiftId(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white cursor-pointer"
                >
                  <option value="">-- Chọn ca làm việc --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Days of Week */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                    <span>Các ngày trong tuần</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecurringDays(["2", "3", "4", "5", "6"]);
                        setIsDirty(true);
                      }}
                      className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800"
                    >
                      T2 - T6
                    </button>
                    <span className="text-zinc-300">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecurringDays(["2", "4", "6"]);
                        setIsDirty(true);
                      }}
                      className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800"
                    >
                      T2, 4, 6
                    </button>
                    <span className="text-zinc-300">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecurringDays(["3", "5", "7"]);
                        setIsDirty(true);
                      }}
                      className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800"
                    >
                      T3, 5, 7
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = recurringDays.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setRecurringDays((prev) =>
                              prev.filter((k) => k !== d.key)
                            );
                          } else {
                            setRecurringDays((prev) => [...prev, d.key]);
                          }
                          setIsDirty(true);
                        }}
                        className={`py-2 px-1 text-center rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2AC1BC] text-white border-[#2AC1BC] shadow-sm shadow-[#2AC1BC]/20"
                            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                    <span>Bắt đầu từ ngày</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={recurringStartDate}
                    onChange={(e) => {
                      setRecurringStartDate(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                    <span>Đến ngày</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={recurringEndDate}
                    onChange={(e) => {
                      setRecurringEndDate(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white"
                  />
                </div>
              </div>

              {/* Duty Note */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700">
                  Ghi chú nhiệm vụ chung cho chuỗi ca
                </label>
                <textarea
                  rows={2}
                  value={recurringNote}
                  onChange={(e) => {
                    setRecurringNote(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Ví dụ: Giám sát an ninh, ghi nhận khách ra vào và bàn giao sổ trực..."
                  className="w-full px-4 py-2.5 text-xs font-medium border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] resize-none"
                />
              </div>

              {/* Pre-calculation Alert */}
              <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Hệ thống sẽ tự động tạo mẫu lặp và <strong>kết xuất</strong>{" "}
                  thành các ca trực cụ thể theo từng ngày. Sau khi tạo, bạn có
                  thể điều chỉnh riêng lẻ từng ca mà không ảnh hưởng tới toàn
                  chuỗi.
                </span>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleAttemptCloseModal("recurring")}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRecurring}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25aba6] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRecurring ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang kết xuất ca trực...</span>
                    </>
                  ) : (
                    <span>Xác nhận phân ca lặp lại</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         MODAL 2: PHÂN CA ĐƠN LẺ (AD-HOC)
         ═══════════════════════════════════════════════════════════════════ */}
      {isAdhocModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleAttemptCloseModal("adhoc");
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100 animate-in zoom-in-95 duration-200"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900">
                    Phân ca làm việc đơn lẻ (Đột xuất)
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-semibold">
                    Xếp ca làm việc một lần không định kỳ cho nhân viên
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAttemptCloseModal("adhoc")}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitAdhoc}
              className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                  <span>Chọn nhân viên</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={adhocEmployeeId}
                  onChange={(e) => {
                    setAdhocEmployeeId(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white cursor-pointer"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {staffList.map((s) => (
                    <option key={s.employeeId} value={s.employeeId}>
                      {s.fullName} ({s.positionName || "Nhân viên"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                    <span>Ca làm việc</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={adhocShiftId}
                    onChange={(e) => {
                      setAdhocShiftId(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn ca --</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                    <span>Ngày làm việc</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={adhocWorkDate}
                    onChange={(e) => {
                      setAdhocWorkDate(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700">
                  Ghi chú công việc đột xuất
                </label>
                <textarea
                  rows={3}
                  value={adhocNote}
                  onChange={(e) => {
                    setAdhocNote(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Ví dụ: Hỗ trợ kiểm tra đường ống nước phòng 204..."
                  className="w-full px-4 py-2.5 text-xs font-medium border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleAttemptCloseModal("adhoc")}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdhoc}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25aba6] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAdhoc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Xác nhận xếp ca</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         MODAL 3: QUẢN LÝ CA LÀM VIỆC MẪU (SHIFTS CRUD)
         ═══════════════════════════════════════════════════════════════════ */}
      {isShiftsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleAttemptCloseModal("shifts");
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100 animate-in zoom-in-95 duration-200"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-zinc-100 text-zinc-800 rounded-2xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900">
                    Cấu hình ca làm việc mẫu
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-semibold">
                    Quản lý danh sách các khung giờ và ca làm việc tại tòa nhà
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAttemptCloseModal("shifts")}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {/* Add New Shift */}
              <form
                onSubmit={handleCreateShift}
                className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3"
              >
                <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#2AC1BC]" />
                  <span>Thêm ca làm việc mới</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="Tên ca (ví dụ: Ca gãy)"
                    value={newShiftName}
                    onChange={(e) => {
                      setNewShiftName(e.target.value);
                      setIsDirty(true);
                    }}
                    className="px-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white"
                  />
                  <input
                    type="time"
                    value={newShiftStart}
                    onChange={(e) => {
                      setNewShiftStart(e.target.value);
                      setIsDirty(true);
                    }}
                    className="px-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white"
                  />
                  <input
                    type="time"
                    value={newShiftEnd}
                    onChange={(e) => {
                      setNewShiftEnd(e.target.value);
                      setIsDirty(true);
                    }}
                    className="px-3 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isCreatingShift}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25aba6] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingShift ? "Đang tạo..." : "+ Thêm ca"}
                  </button>
                </div>
              </form>

              {/* Current Shifts List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700">
                  Danh sách ca làm việc hiện hành ({shifts.length})
                </label>
                <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                  {shifts.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 text-[11px] font-extrabold rounded-xl border ${getShiftBadgeStyle(
                            s.name
                          )}`}
                        >
                          {s.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>
                            {s.startTime} – {s.endTime}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteShift(s.id, s.name)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa ca mẫu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex items-center justify-end bg-zinc-50/60">
              <button
                type="button"
                onClick={() => handleAttemptCloseModal("shifts")}
                className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         MODAL 4: CHỈNH SỬA CA TRỰC (UC-L-21 Occurrence / Forward Pattern)
         ═══════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && selectedScheduleForEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleAttemptCloseModal("edit");
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100 animate-in zoom-in-95 duration-200"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900">
                    Chỉnh sửa ca làm việc
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-semibold">
                    {selectedScheduleForEdit.employeeName} ·{" "}
                    {formatDisplayDate(selectedScheduleForEdit.workDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAttemptCloseModal("edit")}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitEdit}
              className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar"
            >
              {/* Shift Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700">
                  Chọn ca làm việc mới
                </label>
                <select
                  value={editShiftId}
                  onChange={(e) => {
                    setEditShiftId(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white cursor-pointer"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700">
                  Trạng thái ca làm việc
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => {
                    setEditStatus(e.target.value as "scheduled" | "canceled");
                    setIsDirty(true);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white cursor-pointer"
                >
                  <option value="scheduled">Đã lên lịch (scheduled)</option>
                  <option value="canceled">Hủy ca này (canceled)</option>
                </select>
              </div>

              {/* Scope Choice if Recurring (UC-L-21 Rule) */}
              {selectedScheduleForEdit.isRecurring &&
                selectedScheduleForEdit.recurrenceId && (
                  <div className="space-y-2.5 p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <label className="text-xs font-extrabold text-zinc-800 block">
                      Phạm vi áp dụng chỉnh sửa
                    </label>

                    <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="editScope"
                        checked={editScope === "single"}
                        onChange={() => {
                          setEditScope("single");
                          setIsDirty(true);
                        }}
                        className="mt-0.5 text-[#2AC1BC] focus:ring-[#2AC1BC]"
                      />
                      <div>
                        <span className="font-bold text-zinc-800">
                          Chỉ áp dụng cho ca ngày này
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          Chỉ cập nhật ca trực hiện tại. Chuỗi lịch lặp lại trong
                          tương lai vẫn giữ nguyên.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 text-xs cursor-pointer pt-2 border-t border-zinc-200">
                      <input
                        type="radio"
                        name="editScope"
                        checked={editScope === "future"}
                        onChange={() => {
                          setEditScope("future");
                          setIsDirty(true);
                        }}
                        className="mt-0.5 text-[#2AC1BC] focus:ring-[#2AC1BC]"
                      />
                      <div>
                        <span className="font-bold text-amber-700">
                          Áp dụng cho toàn bộ các ca trong tương lai
                        </span>
                        <p className="text-[11px] text-amber-600/80 leading-relaxed">
                          Thao tác này sẽ ghi đè lên toàn bộ ca làm việc định kỳ
                          từ hôm nay trở đi, bao gồm các ca đã từng được chỉnh
                          sửa riêng lẻ.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleAttemptCloseModal("edit")}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25aba6] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
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
      {isConfirmCloseOpen && pendingModalToClose && (
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
                Bạn có thông tin chưa lưu. Nếu đóng bây giờ, toàn bộ các thay đổi
                sẽ bị hủy bỏ.
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
                  performCloseModal(pendingModalToClose);
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
