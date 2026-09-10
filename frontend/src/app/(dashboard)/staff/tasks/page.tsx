"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckSquare, Clock, AlertTriangle, CheckCircle2,
  Filter, Search, ArrowLeft, Building2, Calendar,
  LayoutGrid, List, ChevronLeft, ChevronRight, ChevronsLeft,
  ChevronsRight, Camera, X, Eye, Shield, Sparkles,
  Info, AlertCircle, FileText, Check, Upload, Trash2,
  RefreshCw, CornerDownRight, Tag, BellRing, ArrowRight
} from "lucide-react";
import {
  MOCK_STAFF_TASKS,
  StaffTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  DutyTaskItem,
  getLocalizedPlace,
  getLocalizedStaffName,
  getTodayISODate,
  getRelativeISODate,
  getDailyDutiesForPosition,
  JOB_POSITIONS
} from "../data";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

function StaffTasksContent() {
  const t = useTranslations("staffPortal");
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const searchParams = useSearchParams();

  // URL query params
  const initialTab = searchParams.get("tab") === "additional" ? "additional" : "daily";
  const initialDate = searchParams.get("date") || "all";

  // Top-level Navigation Switcher: "daily" vs "additional"
  const [activeTab, setActiveTab] = useState<"daily" | "additional">(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "additional" || tabParam === "daily") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Today & reference dates
  const todayStr = getTodayISODate();
  const tomorrowStr = getRelativeISODate(1);

  // =========================================================================
  // TAB 1: NHIỆM VỤ HÀNG NGÀY (DAILY ROUTINE TASKS - FIXED PER POSITION)
  // =========================================================================
  const currentPosition = JOB_POSITIONS[0]; // "Bảo vệ & Vận hành sảnh"
  const [dailyDuties, setDailyDuties] = useState<DutyTaskItem[]>(() =>
    getDailyDutiesForPosition(currentPosition.id)
  );

  // Sync daily duties with localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dormio_staff_today_duties");
      if (saved) {
        setDailyDuties(JSON.parse(saved));
      }
    } catch {
      // Fallback
    }
  }, []);

  const saveDailyDuties = (newDuties: DutyTaskItem[]) => {
    setDailyDuties(newDuties);
    try {
      localStorage.setItem("dormio_staff_today_duties", JSON.stringify(newDuties));
    } catch {
      // Fallback
    }
  };

  const handleToggleDailyDuty = (duty: DutyTaskItem) => {
    if (duty.requiresPhoto && !duty.photoProof && !duty.completed) {
      handleOpenDutyProofModal(duty);
      showToast(
        isEn
          ? "This task requires photo proof. Please capture or upload a photo before completing!"
          : "Nhiệm vụ này yêu cầu ảnh đối chiếu. Vui lòng chụp hoặc tải ảnh trước khi hoàn thành!",
        "warning"
      );
      return;
    }

    const updated = dailyDuties.map((d) => {
      if (d.id === duty.id) {
        const nextCompleted = !d.completed;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} - ${todayStr}`;
        return {
          ...d,
          completed: nextCompleted,
          completedAt: nextCompleted ? timeStr : undefined
        };
      }
      return d;
    });
    saveDailyDuties(updated);
    showToast(isEn ? "Updated daily duty status" : "Đã cập nhật trạng thái nhiệm vụ hàng ngày");
  };

  // Proof Modal for Daily Duty
  const [activeDutyForProof, setActiveDutyForProof] = useState<DutyTaskItem | null>(null);
  const [dutyDraftPhoto, setDutyDraftPhoto] = useState<string | null>(null);
  const [dutyDraftNote, setDutyDraftNote] = useState<string>("");
  const [dutyDraftChanged, setDutyDraftChanged] = useState(false);

  const handleOpenDutyProofModal = (duty: DutyTaskItem) => {
    setActiveDutyForProof(duty);
    setDutyDraftPhoto(duty.photoProof || null);
    setDutyDraftNote(duty.note || "");
    setDutyDraftChanged(false);
  };

  const handleSaveDutyProof = (markComplete: boolean) => {
    if (!activeDutyForProof) return;

    if (markComplete && activeDutyForProof.requiresPhoto && !dutyDraftPhoto && !activeDutyForProof.photoProof) {
      showToast(
        isEn
          ? "This task requires photo proof before completing!"
          : "Nhiệm vụ này yêu cầu ảnh đối chiếu. Vui lòng chụp hoặc tải ảnh trước khi hoàn thành!",
        "warning"
      );
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} - ${todayStr}`;

    const updated = dailyDuties.map((d) => {
      if (d.id === activeDutyForProof.id) {
        const isCompleted = markComplete ? true : d.completed;
        return {
          ...d,
          completed: isCompleted,
          photoProof: dutyDraftPhoto || d.photoProof,
          photoProofTime: dutyDraftPhoto ? timeStr : d.photoProofTime,
          completedAt: isCompleted ? (d.completedAt || timeStr) : undefined,
          note: dutyDraftNote.trim() || d.note
        };
      }
      return d;
    });

    saveDailyDuties(updated);
    setActiveDutyForProof(null);
    setDutyDraftChanged(false);

    if (markComplete) {
      showToast(isEn ? "Task completed successfully!" : "Đã hoàn thành nhiệm vụ thành công!");
    } else {
      showToast(isEn ? "Progress updated successfully!" : "Đã cập nhật tiến độ nhiệm vụ!");
    }
  };

  // Daily duties progress calculations
  const totalDaily = dailyDuties.length;
  const completedDaily = dailyDuties.filter(d => d.completed).length;
  const dailyProgressPercent = totalDaily > 0 ? Math.round((completedDaily / totalDaily) * 100) : 0;

  // =========================================================================
  // TAB 2: NHẮC NHỞ & NHIỆM VỤ BỔ SUNG (ADDITIONAL TASKS / REMINDERS FROM LANDLORD)
  // =========================================================================
  const [tasks, setTasks] = useState<StaffTask[]>(MOCK_STAFF_TASKS);

  // Rule #9: Standardized View & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // 4 Core Filters for Additional Tasks: Ngày / Status / Priority / Nhà trọ + Search
  const [dateFilter, setDateFilter] = useState<string>(initialDate);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "completed" | "overdue">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [houseFilter, setHouseFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Update dateFilter if URL query param changes
  useEffect(() => {
    const dParam = searchParams.get("date");
    if (dParam) {
      setDateFilter(dParam);
    }
  }, [searchParams]);

  // Active Additional Task for Detail & Execution Modal
  const [activeTaskModal, setActiveTaskModal] = useState<StaffTask | null>(null);

  // Form draft state in modal
  const [modalStatus, setModalStatus] = useState<TaskStatus>("pending");
  const [modalNote, setModalNote] = useState<string>("");
  const [modalPhoto, setModalPhoto] = useState<string | null>(null);
  const [checkedRequirements, setCheckedRequirements] = useState<number[]>([]);
  const [hasFormDraftChanges, setHasFormDraftChanges] = useState(false);

  // Rule #10: Custom Pop-up Confirmation Modal for unsaved changes
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Preview enlarged photo modal
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{
    isOpen: boolean;
    title: string;
    imageUrl: string;
    note?: string;
  } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type?: "success" | "info" | "warning" } | null>(null);

  const showToast = (msg: string, type: "success" | "info" | "warning" = "info") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Pagination states (Rule #9: default Grid=6, Table=10)
  const [pageSizeInput, setPageSizeInput] = useState<number>(viewMode === "grid" ? 6 : 10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [windowStart, setWindowStart] = useState<number>(1);

  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    const newSize = mode === "grid" ? 6 : 10;
    setPageSizeInput(newSize);
    setCurrentPage(1);
    setWindowStart(1);
  };

  // Helper: Deadline Status Analyzer
  const analyzeDeadline = (deadlineStr: string, status: TaskStatus) => {
    if (status === "completed" || status === "approved") {
      return { type: "done", label: isEn ? "Completed" : "Hoàn thành", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    const nowTime = new Date().getTime();
    const deadlineTime = new Date(deadlineStr.replace(" ", "T") + ":00").getTime();

    if (deadlineTime < nowTime) {
      return { type: "overdue", label: isEn ? "Overdue" : "Quá hạn", color: "bg-red-50 text-red-700 border-red-200" };
    }
    if (deadlineStr.startsWith(todayStr)) {
      return { type: "today", label: isEn ? "Due Today" : "Hạn hôm nay", color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (deadlineStr.startsWith(tomorrowStr)) {
      return { type: "tomorrow", label: isEn ? "Due Tomorrow" : "Hạn ngày mai", color: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    return { type: "upcoming", label: isEn ? "Upcoming" : "Sắp tới", color: "bg-zinc-100 text-zinc-700 border-zinc-200" };
  };

  // Priority Localizer & Badge Colors
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return { label: isEn ? "Urgent" : "Khẩn cấp", color: "bg-red-50 text-red-700 border-red-200" };
      case "high":
        return { label: isEn ? "High" : "Cao", color: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { label: isEn ? "Normal" : "Tiêu chuẩn", color: "bg-zinc-100 text-zinc-600 border-zinc-200" };
    }
  };

  // All additional tasks & landlord reminders (isCustomTask === true)
  const allAdditionalTasks = useMemo(() => {
    return tasks.filter(t => t.isCustomTask);
  }, [tasks]);

  // Filtered Additional Tasks
  const filteredAdditionalTasks = useMemo(() => {
    return allAdditionalTasks.filter((task) => {
      // 1. Filter by Date
      let matchDate = true;
      if (dateFilter !== "all") {
        matchDate = task.deadline.startsWith(dateFilter);
      }

      // 2. Filter by Status
      let matchStatus = true;
      if (statusFilter === "pending") matchStatus = task.status === "pending";
      else if (statusFilter === "in_progress") matchStatus = task.status === "in_progress";
      else if (statusFilter === "completed") matchStatus = task.status === "completed" || task.status === "approved";
      else if (statusFilter === "overdue") {
        const deadlineState = analyzeDeadline(task.deadline, task.status);
        matchStatus = deadlineState.type === "overdue";
      }

      // 3. Filter by Priority
      const matchPriority = priorityFilter === "all" || task.priority === priorityFilter;

      // 4. Filter by Boarding House
      const matchHouse = houseFilter === "all" || task.boardingHouseId === houseFilter;

      // 5. Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.requirements.some(r => r.toLowerCase().includes(q)) ||
        task.boardingHouseName.toLowerCase().includes(q);

      return matchDate && matchStatus && matchPriority && matchHouse && matchSearch;
    });
  }, [allAdditionalTasks, dateFilter, statusFilter, priorityFilter, houseFilter, searchQuery, todayStr, tomorrowStr]);

  // Pagination calculations (Rule #9)
  const validPageSize = Math.max(1, pageSizeInput || (viewMode === "grid" ? 6 : 10));
  const totalItems = filteredAdditionalTasks.length;
  const totalPages = Math.ceil(totalItems / validPageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * validPageSize;
  const endIndex = Math.min(startIndex + validPageSize, totalItems);
  const paginatedAdditionalTasks = filteredAdditionalTasks.slice(startIndex, endIndex);

  // Window jumping (windowStart ± 5)
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

  // Summary Metrics for Additional Tasks
  const stats = useMemo(() => {
    const total = allAdditionalTasks.length;
    const pending = allAdditionalTasks.filter(t => t.status === "pending").length;
    const inProgress = allAdditionalTasks.filter(t => t.status === "in_progress").length;
    const completed = allAdditionalTasks.filter(t => t.status === "completed" || t.status === "approved").length;
    const urgent = allAdditionalTasks.filter(t => {
      const isOver = analyzeDeadline(t.deadline, t.status).type === "overdue";
      return t.priority === "urgent" || isOver;
    }).length;

    return { total, pending, inProgress, completed, urgent };
  }, [allAdditionalTasks]);

  // Open task detail/report modal
  const handleOpenTaskModal = (task: StaffTask) => {
    setActiveTaskModal(task);
    setModalStatus(task.status);
    setModalNote(task.completionNote || "");
    setModalPhoto(task.photoProof || null);
    setCheckedRequirements(task.status === "completed" || task.status === "approved" ? task.requirements.map((_, i) => i) : []);
    setHasFormDraftChanges(false);
  };

  // Close modal with Rule #10 check
  const handleAttemptCloseModal = () => {
    if (hasFormDraftChanges) {
      setShowConfirmClose(true);
    } else {
      setActiveTaskModal(null);
      setActiveDutyForProof(null);
      setHasFormDraftChanges(false);
      setDutyDraftChanged(false);
    }
  };

  const handleConfirmDiscardAndClose = () => {
    setShowConfirmClose(false);
    setActiveTaskModal(null);
    setActiveDutyForProof(null);
    setHasFormDraftChanges(false);
    setDutyDraftChanged(false);
  };

  // Toggle requirement checklist item in modal
  const handleToggleRequirement = (index: number) => {
    setHasFormDraftChanges(true);
    setCheckedRequirements((prev) =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Upload photo proof
  const handleUploadPhotoProof = () => {
    setHasFormDraftChanges(true);
    setModalPhoto("https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80");
  };

  // Save Task Changes
  const handleSaveTaskReport = (newStatus: TaskStatus) => {
    if (!activeTaskModal) return;

    const now = new Date();
    const formattedNow = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} - ${todayStr}`;

    setTasks((prev) =>
      prev.map((item) => {
        if (item.id === activeTaskModal.id) {
          return {
            ...item,
            status: newStatus,
            completionNote: modalNote.trim() || item.completionNote,
            photoProof: modalPhoto || item.photoProof,
            photoProofTime: modalPhoto ? formattedNow : item.photoProofTime,
            completedAt: newStatus === "completed" ? formattedNow : item.completedAt
          };
        }
        return item;
      })
    );

    setActiveTaskModal(null);
    setHasFormDraftChanges(false);
    showToast(isEn ? "Task report submitted successfully" : "Đã cập nhật báo cáo nhiệm vụ thành công");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
            toast.type === "warning"
              ? "bg-amber-900 text-amber-100 border-amber-800"
              : toast.type === "success"
                ? "bg-emerald-900 text-emerald-100 border-emerald-800"
                : "bg-zinc-900 text-white border-zinc-800"
          }`}>
            {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {(!toast.type || toast.type === "info") && <Sparkles className="w-4 h-4 text-[#2AC1BC] shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* HEADER BAR & 2-PART NAVIGATION SWITCHER */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/staff"
              className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
              title={isEn ? "Back to Overview" : "Quay lại tổng quan ca"}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-black text-[#2AC1BC] uppercase tracking-wider">
              {isEn ? "STAFF TASKS CENTER" : "TRUNG TÂM NHIỆM VỤ"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {isEn ? "Staff Duties & Reminders" : "Nhiệm Vụ & Nhắc Nhở"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            {isEn
              ? "Manage fixed daily duties and ad-hoc landlord reminders in one unified portal."
              : "Quản lý đồng thời nhiệm vụ hàng ngày cố định theo vị trí và các nhắc nhở bổ sung từ Chủ trọ."}
          </p>
        </div>

        {/* 2-Part Switcher: Nhiệm vụ hàng ngày vs Nhiệm vụ bổ sung */}
        <div className="flex p-1.5 bg-zinc-100/90 rounded-2xl border border-zinc-200/80 self-start md:self-center shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "daily"
                ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/80"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Shield className={`w-4 h-4 ${activeTab === "daily" ? "text-[#2AC1BC]" : "text-zinc-400"}`} />
            <span>{isEn ? "Daily Duties" : "Nhiệm vụ hàng ngày"}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "daily" ? "bg-[#2AC1BC]/15 text-[#2AC1BC]" : "bg-zinc-200 text-zinc-600"
            }`}>
              {completedDaily}/{totalDaily}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("additional")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "additional"
                ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/80"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <BellRing className={`w-4 h-4 ${activeTab === "additional" ? "text-amber-500" : "text-zinc-400"}`} />
            <span>{isEn ? "Additional Reminders" : "Nhắc nhở bổ sung"}</span>
            {stats.pending + stats.inProgress > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                {stats.pending + stats.inProgress}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: NHIỆM VỤ HÀNG NGÀY (DAILY ROUTINE TASKS)                        */}
      {/* ========================================================================= */}
      {activeTab === "daily" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Position Info & Progress Card */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-black bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/20">
                  {isEn ? "Fixed Position:" : "Vị trí cố định:"} {currentPosition.name}
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  • {todayStr}
                </span>
              </div>
              <h2 className="text-lg font-black text-zinc-900">
                {isEn ? "Standard Routine Duties Checklist" : "Checklist Nhiệm Vụ Hàng Ngày Cố Định"}
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                {currentPosition.description}
              </p>
            </div>

            {/* Progress Gauge */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 min-w-[240px] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-600">
                  {isEn ? "Today's Progress:" : "Tiến độ hôm nay:"}
                </span>
                <span className="font-black text-[#2AC1BC] text-sm font-mono">
                  {completedDaily}/{totalDaily} ({dailyProgressPercent}%)
                </span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-linear-to-r from-[#2AC1BC] to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${dailyProgressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium block text-right">
                {dailyProgressPercent === 100
                  ? (isEn ? "✓ All daily tasks completed!" : "✓ Đã hoàn thành toàn bộ ca!")
                  : (isEn ? "Pending checklist items..." : "Đang thực hiện trong ca trực...")}
              </span>
            </div>
          </div>

          {/* Daily Duties Checklist */}
          <div className="space-y-3.5">
            {dailyDuties.map((duty, idx) => {
              return (
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
                      onChange={() => handleToggleDailyDuty(duty)}
                      className="w-5 h-5 rounded-md text-[#2AC1BC] focus:ring-[#2AC1BC] mt-1 cursor-pointer shrink-0"
                    />

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-400">
                          #{idx + 1}
                        </span>
                        <h3 className={`text-sm font-black text-zinc-900 leading-snug ${
                          duty.completed ? "line-through text-zinc-500" : ""
                        }`}>
                          {duty.title}
                        </h3>
                        {duty.requiresPhoto ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-amber-600" />
                            {isEn ? "Photo proof required" : "Landlord yêu cầu ảnh đối chiếu"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 text-zinc-500">
                            {isEn ? "Optional photo" : "Không bắt buộc ảnh"}
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
                          ✓ {isEn ? "Finished at" : "Hoàn thành lúc"} {duty.completedAt}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Photo proof thumbnail and button */}
                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                    {duty.photoProof && (
                      <div
                        onClick={() => setPreviewPhotoModal({
                          isOpen: true,
                          title: duty.title,
                          imageUrl: duty.photoProof!,
                          note: duty.note
                        })}
                        className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-[#2AC1BC] cursor-pointer group transition-colors"
                        title={isEn ? "View enlarged audit photo" : "Xem ảnh đối chiếu phóng to"}
                      >
                        <img
                          src={duty.photoProof}
                          alt="Proof"
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="text-left pr-1 hidden sm:block">
                          <span className="text-[10px] font-bold text-zinc-700 group-hover:text-[#2AC1BC] block flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" /> {isEn ? "Audit Proof" : "Ảnh đối chiếu"}
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
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#2AC1BC]" />
                      <span>{isEn ? "Update details" : "Cập nhật chi tiết"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: NHẮC NHỞ & NHIỆM VỤ BỔ SUNG (ADDITIONAL TASKS / LANDLORD REMINDERS) */}
      {/* ========================================================================= */}
      {activeTab === "additional" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Info Banner */}
          <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-3">
            <BellRing className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-black text-sm block text-amber-950">
                {isEn ? "Landlord Ad-hoc Tasks & Urgent Reminders" : "Nhắc Nhở Bổ Sung & Nhiệm Vụ Đột Xuất Từ Chủ Trọ"}
              </span>
              <p className="text-amber-800 leading-relaxed font-medium">
                {isEn
                  ? "Displays custom tasks, meter check handovers, and emergency notifications assigned directly by the Landlord outside the standard routine checklist."
                  : "Hiển thị các đầu việc phát sinh, chỉ số điện nước bàn giao phòng, kiểm tra đột xuất được Chủ trọ giao bổ sung ngoài nhiệm vụ cố định hàng ngày."}
              </p>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                {isEn ? "Total Reminders" : "Tổng nhắc nhở"}
              </span>
              <div className="text-2xl font-black text-zinc-900">{stats.total}</div>
              <span className="text-[10px] font-semibold text-zinc-500 block">
                {isEn ? "Assigned" : "Được giao"}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                {isEn ? "Pending" : "Đang chờ"}
              </span>
              <div className="text-2xl font-black text-zinc-700">{stats.pending}</div>
              <span className="text-[10px] font-semibold text-zinc-400 block">
                {isEn ? "Not started" : "Chưa thực hiện"}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                {isEn ? "In Progress" : "Đang xử lý"}
              </span>
              <div className="text-2xl font-black text-blue-600">{stats.inProgress}</div>
              <span className="text-[10px] font-bold text-blue-600 block">
                {isEn ? "Handling" : "Đang tiếp nhận"}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                {isEn ? "Completed" : "Đã xong"}
              </span>
              <div className="text-2xl font-black text-[#2AC1BC]">{stats.completed}</div>
              <span className="text-[10px] font-bold text-emerald-600 block">
                {isEn ? "Done" : "Hoàn thành"}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                {isEn ? "Urgent / Overdue" : "Khẩn cấp / Quá hạn"}
              </span>
              <div className="text-2xl font-black text-red-600">{stats.urgent}</div>
              <span className="text-[10px] font-bold text-red-500 block">
                {isEn ? "Action needed" : "Cần ưu tiên xử lý"}
              </span>
            </div>
          </div>

          {/* 4 CORE FILTERS BAR: Ngày / Status / Mức độ ưu tiên / Nhà trọ */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* 1. Lọc theo Ngày (Date/Month/Year) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#2AC1BC]" />
                    <span>{isEn ? "Filter by Date" : "Lọc theo Ngày"}</span>
                  </label>
                  {dateFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilter("all");
                        setCurrentPage(1);
                        setWindowStart(1);
                      }}
                      className="text-[10px] font-bold text-[#2AC1BC] hover:underline cursor-pointer"
                      title={isEn ? "Show all dates" : "Xem tất cả các ngày"}
                    >
                      {isEn ? "All Dates" : "Tất cả"}
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={dateFilter === "all" ? "" : dateFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDateFilter(val || "all");
                      setCurrentPage(1);
                      setWindowStart(1);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                  />
                  {dateFilter === "all" && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilter(todayStr);
                        setCurrentPage(1);
                        setWindowStart(1);
                      }}
                      className="absolute right-2 px-2 py-0.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#2AC1BC] text-[10px] font-bold transition-colors cursor-pointer border border-teal-200/60"
                      title={isEn ? "Filter today" : "Lọc hôm nay"}
                    >
                      {isEn ? "Today" : "Hôm nay"}
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Lọc theo Trạng thái (Status) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#2AC1BC]" />
                  <span>{isEn ? "Filter by Status" : "Lọc theo Trạng thái"}</span>
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                    setWindowStart(1);
                  }}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                >
                  <option value="all">{isEn ? "All Statuses" : "Tất cả trạng thái"}</option>
                  <option value="pending">{isEn ? "Pending" : "Đang chờ"}</option>
                  <option value="in_progress">{isEn ? "In Progress" : "Đang thực hiện"}</option>
                  <option value="completed">{isEn ? "Completed" : "Đã hoàn thành"}</option>
                  <option value="overdue">{isEn ? "Overdue" : "Quá hạn deadline"}</option>
                </select>
              </div>

              {/* 3. Lọc theo Mức độ ưu tiên (Priority) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>{isEn ? "Filter by Priority" : "Mức độ ưu tiên"}</span>
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setCurrentPage(1);
                    setWindowStart(1);
                  }}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                >
                  <option value="all">{isEn ? "All Priorities" : "Tất cả mức ưu tiên"}</option>
                  <option value="urgent">{isEn ? "Urgent" : "Khẩn cấp"}</option>
                  <option value="high">{isEn ? "High" : "Ưu tiên cao"}</option>
                  <option value="normal">{isEn ? "Normal" : "Tiêu chuẩn"}</option>
                </select>
              </div>

              {/* 4. Lọc theo Nhà trọ (Boarding House) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-zinc-400" />
                  <span>{isEn ? "Boarding House" : "Lọc theo Nhà trọ"}</span>
                </label>
                <select
                  value={houseFilter}
                  onChange={(e) => {
                    setHouseFilter(e.target.value);
                    setCurrentPage(1);
                    setWindowStart(1);
                  }}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                >
                  <option value="all">{isEn ? "All Houses" : "Tất cả cơ sở"}</option>
                  <option value="b1">{isEn ? "HOLA Dormitory (Block A)" : "KTX HOLA (Khu A)"}</option>
                  <option value="b2">{isEn ? "Dormio Campus Cau Giay" : "Dormio Campus Cầu Giấy"}</option>
                </select>
              </div>

              {/* 5. Search box & View mode toggle */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                  <Search className="w-3 h-3 text-zinc-400" />
                  <span>{isEn ? "Search & View" : "Tìm kiếm & Dạng xem"}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isEn ? "Search keyword..." : "Nhập từ khóa..."}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2AC1BC]"
                  />
                  <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleViewModeChange("grid")}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === "grid"
                          ? "bg-[#2AC1BC] text-white shadow-2xs"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                      title={isEn ? "Grid View" : "Xem dạng lưới"}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewModeChange("table")}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === "table"
                          ? "bg-[#2AC1BC] text-white shadow-2xs"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                      title={isEn ? "Table View" : "Xem dạng bảng"}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Active Date Filter Notice */}
            {dateFilter !== "all" && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-100">
                <span className="text-zinc-600 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#2AC1BC]" />
                  <span>{isEn ? "Filtering additional reminders on date:" : "Đang lọc các nhắc nhở bổ sung theo ngày:"}</span>
                  <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md font-mono">{dateFilter}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDateFilter("all")}
                  className="text-[11px] font-bold text-[#2AC1BC] hover:underline cursor-pointer"
                >
                  {isEn ? "Clear date filter (View all)" : "Bỏ lọc ngày (Xem tất cả)"}
                </button>
              </div>
            )}
          </div>

          {/* DISPLAY MODE 1: GRID VIEW (Default per Rule #9) */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedAdditionalTasks.length === 0 ? (
                <div className="col-span-full bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3 className="text-base font-black text-zinc-800">
                    {isEn ? "No additional tasks matching the filters" : "Không có nhắc nhở bổ sung nào phù hợp"}
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    {isEn
                      ? "There are no ad-hoc tasks or reminders matching your current search and date filters."
                      : "Không tìm thấy nhiệm vụ bổ sung nào trong ngày hoặc tiêu chí lọc này."}
                  </p>
                </div>
              ) : (
                paginatedAdditionalTasks.map((task) => {
                  const dl = analyzeDeadline(task.deadline, task.status);
                  const prio = getPriorityBadge(task.priority);

                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-5 space-y-4 hover:border-[#2AC1BC]/50 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide">
                            {isEn ? "Landlord Reminder" : "Nhắc nhở bổ sung"}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${prio.color}`}>
                            {prio.label}
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-zinc-900 leading-snug">
                          {task.title}
                        </h3>

                        <p className="text-xs text-zinc-500 leading-relaxed font-normal line-clamp-2">
                          {task.description}
                        </p>

                        {task.landlordNote && (
                          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 space-y-0.5">
                            <span className="font-bold text-amber-800 flex items-center gap-1">
                              <BellRing className="w-3 h-3 text-amber-600" />
                              {isEn ? "Landlord Directive:" : "Lưu ý từ Chủ trọ:"}
                            </span>
                            <p className="italic text-zinc-700 leading-tight">
                              &quot;{task.landlordNote}&quot;
                            </p>
                          </div>
                        )}

                        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5 text-xs">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            {isEn ? "Key Criteria:" : "Tiêu chí nghiệm thu:"}
                          </span>
                          <div className="space-y-1">
                            {task.requirements.slice(0, 2).map((req, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-700 font-medium">
                                <Check className="w-3 h-3 text-[#2AC1BC] shrink-0 mt-0.5" />
                                <span className="truncate">{req}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Deadline & Location */}
                        <div className="space-y-1 text-xs pt-1 border-t border-zinc-100">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{isEn ? "Deadline:" : "Hạn chót:"}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-zinc-800 font-mono text-[11px]">{task.deadline}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${dl.color}`}>
                                {dl.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="truncate">{getLocalizedPlace(task.boardingHouseName, isEn)}</span>
                            </span>
                            {task.requiresPhoto && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shrink-0">
                                <Camera className="w-2.5 h-2.5" /> {isEn ? "Photo proof" : "Cần ảnh"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Action Button & Photo proof */}
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                        <div>
                          {task.photoProof && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoModal({
                                isOpen: true,
                                title: task.title,
                                imageUrl: task.photoProof!,
                                note: task.completionNote
                              })}
                              className="flex items-center gap-1 text-[10px] font-bold text-[#2AC1BC] hover:underline cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isEn ? "View proof" : "Xem ảnh"}</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenTaskModal(task)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            task.status === "completed" || task.status === "approved"
                              ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                              : "bg-[#2AC1BC] text-white hover:bg-[#22a8a4] shadow-2xs"
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            {task.status === "completed" || task.status === "approved"
                              ? (isEn ? "Review Report" : "Xem báo cáo")
                              : (isEn ? "Execute & Report" : "Xử lý & Báo cáo")}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* DISPLAY MODE 2: TABLE VIEW */}
          {viewMode === "table" && (
            <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-black text-zinc-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{isEn ? "Task Title" : "Nhiệm vụ & Nhắc nhở"}</th>
                      <th className="py-3 px-3">{isEn ? "Boarding House" : "Nhà trọ"}</th>
                      <th className="py-3 px-3">{isEn ? "Deadline" : "Hạn chót"}</th>
                      <th className="py-3 px-3">{isEn ? "Priority" : "Ưu tiên"}</th>
                      <th className="py-3 px-3">{isEn ? "Status" : "Trạng thái"}</th>
                      <th className="py-3 px-3">{isEn ? "Photo Proof" : "Ảnh đối chiếu"}</th>
                      <th className="py-3 px-4 text-right">{isEn ? "Actions" : "Thao tác"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                    {paginatedAdditionalTasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-400 font-bold">
                          {isEn ? "No additional reminders found." : "Không có nhắc nhở bổ sung nào."}
                        </td>
                      </tr>
                    ) : (
                      paginatedAdditionalTasks.map((task) => {
                        const dl = analyzeDeadline(task.deadline, task.status);
                        const prio = getPriorityBadge(task.priority);

                        return (
                          <tr key={task.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-bold text-zinc-900">{task.title}</div>
                              <div className="text-[11px] text-zinc-400 truncate max-w-xs">{task.description}</div>
                            </td>
                            <td className="py-4 px-3 whitespace-nowrap text-zinc-600">
                              {getLocalizedPlace(task.boardingHouseName, isEn)}
                            </td>
                            <td className="py-4 px-3 whitespace-nowrap">
                              <div className="font-mono text-[11px] font-bold text-zinc-800">{task.deadline}</div>
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border ${dl.color} inline-block mt-0.5`}>
                                {dl.label}
                              </span>
                            </td>
                            <td className="py-4 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${prio.color}`}>
                                {prio.label}
                              </span>
                            </td>
                            <td className="py-4 px-3 whitespace-nowrap">
                              {task.status === "completed" || task.status === "approved" ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {isEn ? "Completed" : "Hoàn thành"}
                                </span>
                              ) : task.status === "in_progress" ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                                  {isEn ? "In Progress" : "Đang xử lý"}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-zinc-100 text-zinc-600">
                                  {isEn ? "Pending" : "Đang chờ"}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-3 whitespace-nowrap">
                              {task.photoProof ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPhotoModal({
                                    isOpen: true,
                                    title: task.title,
                                    imageUrl: task.photoProof!,
                                    note: task.completionNote
                                  })}
                                  className="flex items-center gap-1 text-[10px] font-bold text-[#2AC1BC] hover:underline cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>{isEn ? "View proof" : "Xem ảnh"}</span>
                                </button>
                              ) : task.requiresPhoto ? (
                                <span className="text-[10px] text-amber-600 font-bold">
                                  {isEn ? "Required" : "Cần chụp ảnh"}
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-400">
                                  {isEn ? "Optional" : "Không bắt buộc"}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenTaskModal(task)}
                                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                              >
                                {isEn ? "Detail / Report" : "Chi tiết / Báo cáo"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STANDARDIZED PAGINATION (Rule #9) */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span>{isEn ? "Show" : "Hiển thị"}</span>
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
                <span>{isEn ? "/ page" : "/ trang"}</span>
              </div>

              <span className="text-zinc-300">|</span>

              <span>
                {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} {isEn ? "of" : "trên"} {totalItems} {isEn ? "items" : "mục"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevWindow}
                disabled={windowStart === 1}
                className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title={isEn ? "Back 5 pages" : "Lùi 5 trang"}
              >
                <ChevronsLeft className="w-4 h-4 text-zinc-600" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title={isEn ? "Previous page" : "Trang trước"}
              >
                <ChevronLeft className="w-4 h-4 text-zinc-600" />
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(num)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      safeCurrentPage === num
                        ? "bg-[#2AC1BC] text-white shadow-2xs"
                        : "hover:bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title={isEn ? "Next page" : "Trang tiếp"}
              >
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </button>

              <button
                type="button"
                onClick={handleNextWindow}
                disabled={windowEnd === totalPages}
                className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title={isEn ? "Forward 5 pages" : "Tiến 5 trang"}
              >
                <ChevronsRight className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DAILY DUTY PHOTO PROOF & NOTE MODAL                             */}
      {/* ========================================================================= */}
      {activeDutyForProof && (
        <div
          onClick={handleAttemptCloseModal}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 cursor-default my-auto border border-zinc-200 animate-scaleIn"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#2AC1BC]" />
                <h3 className="text-base font-black text-zinc-900">
                  {isEn ? "Submit Daily Duty Proof" : "Ảnh Đối Chiếu Nhiệm Vụ Hàng Ngày"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAttemptCloseModal}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {isEn ? "Duty Title" : "Nhiệm vụ đang thực hiện"}
                </span>
                <p className="text-xs font-black text-zinc-800 leading-snug">
                  {activeDutyForProof.title}
                </p>
              </div>

              {/* Photo preview / upload */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-600 block">
                  {isEn ? "Audit Proof Image:" : "Hình ảnh hiện trường đối chiếu:"}
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
                        ✓ {isEn ? "Photo Ready" : "Ảnh đã tải lên"}
                      </span>
                      <p className="text-[11px] text-zinc-500 font-mono">{todayStr}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDutyDraftPhoto(null);
                        setDutyDraftChanged(true);
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-red-50 text-zinc-400 hover:text-red-600 border border-zinc-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDutyDraftPhoto("https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80");
                      setDutyDraftChanged(true);
                    }}
                    className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-zinc-300 hover:border-[#2AC1BC] bg-zinc-50/70 hover:bg-[#2AC1BC]/5 text-zinc-700 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-[#2AC1BC]" />
                    <span>{isEn ? "Click to capture / attach photo" : "Nhấn để chụp hoặc tải ảnh đối chiếu"}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      {isEn ? "Automatically timestamps time & date" : "Tự động đóng dấu mốc thời gian & ngày"}
                    </span>
                  </button>
                )}
              </div>

              {/* Note input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-600 block">
                  {isEn ? "Result Note / Explanation:" : "Ghi chú kết quả thực hiện:"}
                </label>
                <textarea
                  rows={3}
                  value={dutyDraftNote}
                  onChange={(e) => {
                    setDutyDraftNote(e.target.value);
                    setDutyDraftChanged(true);
                  }}
                  placeholder={isEn ? "e.g. Cleared 45 vehicles, safety latch working properly..." : "VD: Đã kiểm tra cổng chính, bãi xe xếp gọn gàng theo lối thoát nạn..."}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2AC1BC] leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleAttemptCloseModal}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveDutyProof(false)}
                  className="px-4 py-2.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{isEn ? "Update Progress" : "Cập nhật tiến độ"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveDutyProof(true)}
                  className="px-4.5 py-2.5 bg-[#2AC1BC] hover:bg-[#22a8a4] text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEn ? "Complete Task" : "Hoàn thành nhiệm vụ"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADDITIONAL TASK EXECUTION & REPORTING MODAL                      */}
      {/* ========================================================================= */}
      {activeTaskModal && (
        <div
          onClick={handleAttemptCloseModal}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 cursor-default my-auto border border-zinc-200 animate-scaleIn"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2AC1BC]" />
                <h3 className="text-base font-black text-zinc-900 truncate">
                  {isEn ? "Task Progress Report" : "Báo Cáo Tiến Độ Nhiệm Vụ"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAttemptCloseModal}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Task Header info */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                    {isEn ? "Landlord Reminder" : "Nhắc nhở bổ sung"}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 font-bold">
                    Hạn: {activeTaskModal.deadline}
                  </span>
                </div>
                <h4 className="text-sm font-black text-zinc-900 leading-snug">
                  {activeTaskModal.title}
                </h4>
                <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                  {activeTaskModal.description}
                </p>
                {activeTaskModal.landlordNote && (
                  <div className="pt-2 border-t border-zinc-200/70 text-[11px] text-amber-900 font-medium italic">
                    Lưu ý: &quot;{activeTaskModal.landlordNote}&quot;
                  </div>
                )}
              </div>

              {/* Requirements Checklist */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-600 block">
                  {isEn ? "Checklist of requirements:" : "Tiêu chí đã hoàn thành:"}
                </label>
                <div className="space-y-2">
                  {activeTaskModal.requirements.map((req, idx) => {
                    const isChecked = checkedRequirements.includes(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleToggleRequirement(idx)}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? "bg-teal-50/70 border-[#2AC1BC] text-zinc-900"
                            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRequirement(idx)}
                          className="mt-0.5 w-4 h-4 rounded text-[#2AC1BC] focus:ring-[#2AC1BC] cursor-pointer shrink-0"
                        />
                        <span className={`leading-relaxed font-medium ${isChecked ? "line-through text-zinc-500" : ""}`}>
                          {req}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Photo Proof Section */}
              <div className="space-y-2 pt-1 border-t border-zinc-100">
                <label className="text-[11px] font-bold text-zinc-600 block">
                  {isEn ? "Photo Proof Attachment:" : "Ảnh chụp nghiệm thu hiện trường:"}
                </label>

                {modalPhoto ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                    <img
                      src={modalPhoto}
                      alt="Proof"
                      className="w-16 h-16 rounded-xl object-cover border border-zinc-200"
                    />
                    <div className="space-y-1 text-xs flex-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ {isEn ? "Photo Ready" : "Ảnh đã đính kèm"}
                      </span>
                      <p className="text-[11px] text-zinc-500 font-mono">{todayStr}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalPhoto(null);
                        setHasFormDraftChanges(true);
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-red-50 text-zinc-400 hover:text-red-600 border border-zinc-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleUploadPhotoProof}
                    className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-zinc-300 hover:border-[#2AC1BC] bg-zinc-50/70 hover:bg-[#2AC1BC]/5 text-zinc-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#2AC1BC]" />
                    <span>{isEn ? "Upload Proof Photo" : "Chụp / Tải ảnh nghiệm thu"}</span>
                  </button>
                )}

                {/* Execution Note */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-zinc-600 block">
                    {isEn ? "Completion Note:" : "Ghi chú kết quả xử lý:"}
                  </label>
                  <textarea
                    rows={2}
                    value={modalNote}
                    onChange={(e) => {
                      setModalNote(e.target.value);
                      setHasFormDraftChanges(true);
                    }}
                    placeholder={isEn ? "e.g. Repaired lamp, hallway well lit..." : "Nhập báo cáo chi tiết cho Chủ trọ..."}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2AC1BC] leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAttemptCloseModal}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveTaskReport("in_progress")}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer"
                >
                  {isEn ? "In Progress" : "Đang thực hiện"}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveTaskReport("completed")}
                  className="px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#22a8a4] text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEn ? "Mark Completed" : "Hoàn thành nhiệm vụ"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RULE #10: CONFIRM DISCARD CHANGES POP-UP MODAL                            */}
      {/* ========================================================================= */}
      {showConfirmClose && (
        <div
          onClick={() => setShowConfirmClose(false)}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 cursor-default border border-zinc-200 animate-scaleIn text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-zinc-900">
                {isEn ? "Discard Unsaved Changes?" : "Xác nhận đóng form"}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {isEn
                  ? "You have unsaved form inputs or photo proofs. Are you sure you want to discard changes?"
                  : "Bạn có những thông tin hoặc ảnh xác thực chưa hoàn tất. Bạn có chắc chắn muốn hủy thay đổi và đóng không?"}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmClose(false)}
                className="w-full py-2.5 rounded-xl bg-[#2AC1BC] hover:bg-[#22a8a4] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                {isEn ? "Continue Editing" : "Tiếp tục chỉnh sửa"}
              </button>

              <button
                type="button"
                onClick={handleConfirmDiscardAndClose}
                className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {isEn ? "Discard & Close" : "Hủy thay đổi & Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO PREVIEW MODAL */}
      {previewPhotoModal && previewPhotoModal.isOpen && (
        <div
          onClick={() => setPreviewPhotoModal(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden cursor-default my-auto border border-zinc-200"
          >
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-900 truncate">
                {previewPhotoModal.title}
              </h3>
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
                alt="Proof"
                className="w-full h-full object-contain"
              />
            </div>

            {previewPhotoModal.note && (
              <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-800 space-y-1">
                <span className="font-bold text-zinc-600 block">
                  {isEn ? "Execution Note:" : "Ghi chú kết quả:"}
                </span>
                <p className="italic text-zinc-800 font-medium leading-relaxed">
                  &quot;{previewPhotoModal.note}&quot;
                </p>
              </div>
            )}

            <div className="p-4 bg-white border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isEn ? "Close" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function StaffTasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400 font-bold">Loading...</div>}>
      <StaffTasksContent />
    </Suspense>
  );
}
