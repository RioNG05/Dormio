"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, BellRing, Calendar, CheckCircle2, X, Clock,
  Send, MessageSquare, Users, Building2, Eye,
  AlertTriangle, UserCheck, Sparkles, Search, ChevronDown,
  LayoutGrid, List, RefreshCw, Wrench, Receipt, Volume2,
  MapPin, Check, FileText, ArrowUpRight, Flame, ShieldAlert,
  Clock3, Smartphone, Filter, ChevronLeft, ChevronRight, Trash2, Loader2
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import {
  announcementService,
  LandlordAnnouncementItem,
  LandlordAnnouncementsSummary
} from "@/services/announcement.service";

interface TaskItem {
  id: string;
  title: string;
  category: "Thu tiền" | "Bảo trì" | "Vệ sinh" | "Kiểm tra" | "Khác";
  assignee: {
    name: string;
    role: string;
    avatarBg: string;
  };
  dueDate: string;
  dueTime: string;
  priority: "Gấp" | "Trung bình" | "Thấp";
  status: "Chờ xử lý" | "Đang thực hiện" | "Đã hoàn thành" | "Quá hạn";
  isCompletedLate?: boolean;
  completedAtNote?: string;
  room?: string;
  notes: string;
}

export default function RemindersPage() {
  const { activeBuilding } = useAuth();
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const t = useTranslations("landlord");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<"reminders" | "notifications">("reminders");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMounted, setIsMounted] = useState(false);

  // Modals & Forms State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [selectedNotifDetail, setSelectedNotifDetail] = useState<LandlordAnnouncementItem | null>(null);
  const [deletingNotifId, setDeletingNotifId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");

  // Pagination State
  const [taskPage, setTaskPage] = useState(1);
  const [notifPage, setNotifPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const ITEMS_PER_PAGE = itemsPerPage;

  // New Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState<TaskItem["category"]>("Bảo trì");
  const [taskAssignee, setTaskAssignee] = useState("Nguyễn Văn Tuấn (Kỹ thuật)");
  const [taskRoom, setTaskRoom] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskItem["priority"]>("Trung bình");
  const [taskDueDate, setTaskDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taskDueTime, setTaskDueTime] = useState("14:00");
  const [taskNotes, setTaskNotes] = useState("");

  // New Notification Form State
  const [notifTitle, setNotifTitle] = useState("");
  const [notifContent, setNotifContent] = useState("");
  const [notifCategory, setNotifCategory] = useState("Điện nước");
  const [notifTargetScope, setNotifTargetScope] = useState("");
  const [notifChannel, setNotifChannel] = useState("Thông báo hệ thống");
  const [isSubmittingNotif, setIsSubmittingNotif] = useState(false);
  const [isDeletingNotif, setIsDeletingNotif] = useState(false);

  // Unsaved Changes Confirmation Modal state
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<"task" | "notif" | null>(null);

  // Real backend notifications state (UC-L-13)
  const [notifications, setNotifications] = useState<LandlordAnnouncementItem[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifTotalPages, setNotifTotalPages] = useState(1);
  const [notifSummary, setNotifSummary] = useState<LandlordAnnouncementsSummary>({
    totalAnnouncements: 0,
    totalTargetTenants: 0,
    emergencyCount: 0,
  });

  // Real tasks state persisted in localStorage per building
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (activeBuilding?.name) {
      setNotifTargetScope(activeBuilding.name);
    }
  }, [activeBuilding?.name]);

  // Load persisted tasks from localStorage
  useEffect(() => {
    if (!activeBuilding?.id) return;
    try {
      const saved = localStorage.getItem(`dormio_tasks_${activeBuilding.id}`);
      if (saved) {
        setTasks(JSON.parse(saved));
      } else {
        setTasks([]);
      }
    } catch {
      setTasks([]);
    }
  }, [activeBuilding?.id]);

  const saveTasks = (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    if (activeBuilding?.id) {
      try {
        localStorage.setItem(`dormio_tasks_${activeBuilding.id}`, JSON.stringify(newTasks));
      } catch {
        // storage quota fallback
      }
    }
  };

  // Fetch real broadcast announcements from backend API (UC-L-13)
  const fetchAnnouncements = useCallback(async () => {
    if (!activeBuilding?.id) return;
    setIsLoadingNotifs(true);
    try {
      const res = await announcementService.getAnnouncements(activeBuilding.id, {
        page: notifPage,
        limit: itemsPerPage,
        search: searchQuery,
        category: categoryFilter,
        channel: channelFilter,
      });

      setNotifications(res.data || []);
      setNotifTotal(res.meta?.total || 0);
      setNotifTotalPages(res.meta?.totalPages || 1);
      if (res.summary) {
        setNotifSummary(res.summary);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setIsLoadingNotifs(false);
    }
  }, [activeBuilding?.id, notifPage, itemsPerPage, searchQuery, categoryFilter, channelFilter]);

  useEffect(() => {
    if (activeTab === "notifications") {
      fetchAnnouncements();
    }
  }, [activeTab, fetchAnnouncements]);

  // Reset pagination on filter change
  useEffect(() => {
    setTaskPage(1);
    setNotifPage(1);
  }, [searchQuery, categoryFilter, statusFilter, priorityFilter, channelFilter, activeTab]);

  // Staff list options
  const staffList = [
    { name: "Nguyễn Văn Tuấn", role: isEn ? "Building Technical" : "Kỹ thuật tòa nhà", avatarBg: "bg-blue-600" },
    { name: "Trần Thị Mai", role: isEn ? "Accountant / Cashier" : "Kế toán / Thu ngân", avatarBg: "bg-emerald-600" },
    { name: "Lê Hoàng Nam", role: isEn ? "Morning Guard" : "Bảo vệ ca sáng", avatarBg: "bg-amber-600" },
    { name: "Phạm Quốc Huy", role: isEn ? "Floor Manager" : "Quản lý tầng 2-4", avatarBg: "bg-purple-600" },
  ];

  // Quick Notification Templates (Bilingual)
  const notificationTemplates = useMemo(() => [
    {
      title: isEn ? "Notice: Power grid maintenance interruption" : "Thông báo cúp điện bảo trì lưới điện",
      category: "Điện nước",
      content: isEn
        ? `Dear residents of ${activeBuilding?.name || "the building"},\n\nThe regional power authority will perform grid maintenance from 08:00 to 12:00 tomorrow. Please plan accordingly and disconnect high-power appliances before this period.\n\nThank you for your cooperation!`
        : `Kính gửi quý khách thuê phòng tại ${activeBuilding?.name || "tòa nhà"},\n\nHệ thống điện lực khu vực sẽ tiến hành bảo trì lưới điện từ 08:00 đến 12:00 ngày tới. Rất mong quý khách chủ động sắp xếp công việc và ngắt các thiết bị điện công suất lớn trước thời gian trên.\n\nTrân trọng thông báo!`,
    },
    {
      title: isEn ? "Reminder: Monthly rent settlement" : "Nhắc nhở quyết toán tiền nhà tháng này",
      category: "Tiền nhà",
      content: isEn
        ? `Dear residents,\n\nThis month's rent & service invoices have been updated on the Dormio app. Please review and settle payment prior to the due date to avoid late fees.\n\nThank you!`
        : `Kính báo quý khách thuê phòng,\n\nHóa đơn tiền nhà & dịch vụ tháng này đã được cập nhật trên ứng dụng. Đề nghị quý khách kiểm tra và thanh toán trước hạn để tránh phát sinh phí chậm nộp.\n\nCảm ơn sự hợp tác của quý khách!`,
    },
    {
      title: isEn ? "Building pest control routine schedule" : "Thông báo lịch diệt côn trùng toàn tòa nhà",
      category: "Nội quy",
      content: isEn
        ? `Building Management of ${activeBuilding?.name || "the building"} will conduct routine mosquito and pest spraying in corridors and common areas. Please keep room doors closed and cover food carefully.`
        : `Ban quản lý tòa nhà ${activeBuilding?.name || "tòa nhà"} sẽ tiến hành xịt muỗi và diệt côn trùng định kỳ khu vực hành lang và các tầng. Vui lòng đóng kín cửa phòng và che đậy thực phẩm cẩn thận.`,
    },
    {
      title: isEn ? "URGENT: Emergency water pump maintenance" : "THÔNG BÁO KHẨN: Bảo trì máy bơm nước khẩn cấp",
      category: "Khẩn cấp",
      content: isEn
        ? `Due to unexpected technical failure of the primary water pump, clean water supply will be temporarily suspended for approximately 2 hours. Technicians are working urgently to restore service.`
        : `Do sự cố kỹ thuật máy bơm chính, hệ thống nước sạch sẽ tạm ngưng trong khoảng 2 tiếng tới. Kỹ thuật viên đang xử lý gấp. Rất mong quý khách thông cảm!`,
    },
  ], [activeBuilding?.name, isEn]);

  // Handle task status toggling
  const handleToggleTaskComplete = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const isDone = t.status === "Đã hoàn thành";
        return {
          ...t,
          status: (isDone ? "Chờ xử lý" : "Đã hoàn thành") as TaskItem["status"],
          isCompletedLate: false,
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    saveTasks(updated);
  };

  // Rule #10: Modal Reset Behavior & Confirmation
  const closeAndResetTaskModal = () => {
    setTaskTitle("");
    setTaskCategory("Bảo trì");
    setTaskAssignee("Nguyễn Văn Tuấn (Kỹ thuật)");
    setTaskRoom("");
    setTaskPriority("Trung bình");
    setTaskDueDate(new Date().toISOString().slice(0, 10));
    setTaskDueTime("14:00");
    setTaskNotes("");
    setIsTaskModalOpen(false);
  };

  const closeAndResetNotifModal = () => {
    setNotifTitle("");
    setNotifContent("");
    setNotifCategory("Điện nước");
    setNotifTargetScope(activeBuilding?.name || (isEn ? "Entire building" : "Toàn bộ tòa nhà"));
    setNotifChannel("Thông báo hệ thống");
    setIsNotifModalOpen(false);
  };

  const requestCloseTaskModal = () => {
    if (taskTitle.trim() !== "" || taskNotes.trim() !== "" || taskRoom.trim() !== "") {
      setConfirmCloseTarget("task");
    } else {
      closeAndResetTaskModal();
    }
  };

  const requestCloseNotifModal = () => {
    if (notifTitle.trim() !== "" || notifContent.trim() !== "") {
      setConfirmCloseTarget("notif");
    } else {
      closeAndResetNotifModal();
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      title: taskTitle.trim(),
      category: taskCategory,
      assignee: {
        name: taskAssignee.split(" (")[0],
        role: taskAssignee.includes("(") ? taskAssignee.split("(")[1].replace(")", "") : (isEn ? "Staff" : "Nhân viên"),
        avatarBg: "bg-blue-600",
      },
      dueDate: taskDueDate,
      dueTime: taskDueTime,
      priority: taskPriority,
      status: "Chờ xử lý",
      room: taskRoom ? (taskRoom.startsWith("Phòng") || taskRoom.startsWith("Room") ? taskRoom : `${isEn ? "Room" : "Phòng"} ${taskRoom}`) : undefined,
      notes: taskNotes.trim(),
    };

    saveTasks([newTask, ...tasks]);
    closeAndResetTaskModal();
  };

  // Broadcast announcement via real API (UC-L-13)
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifContent.trim() || !activeBuilding?.id) return;

    setIsSubmittingNotif(true);
    try {
      await announcementService.broadcastAnnouncement(activeBuilding.id, {
        title: notifTitle.trim(),
        content: notifContent.trim(),
        category: notifCategory,
        targetScope: notifTargetScope || activeBuilding.name || (isEn ? "Entire building" : "Toàn bộ tòa nhà"),
        channel: notifChannel,
      });

      closeAndResetNotifModal();
      await fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || (isEn ? "Failed to broadcast announcement" : "Không thể gửi thông báo"));
    } finally {
      setIsSubmittingNotif(false);
    }
  };

  // Delete announcement via real API
  const handleDeleteAnnouncement = async (id: string) => {
    if (!activeBuilding?.id) return;
    setIsDeletingNotif(true);
    try {
      await announcementService.deleteAnnouncement(activeBuilding.id, id);
      setDeletingNotifId(null);
      if (selectedNotifDetail?.id === id) {
        setSelectedNotifDetail(null);
      }
      await fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || (isEn ? "Failed to delete announcement" : "Không thể xóa thông báo"));
    } finally {
      setIsDeletingNotif(false);
    }
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.room && t.room.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = categoryFilter === "" || t.category === categoryFilter;
      const matchStatus = statusFilter === "" ||
        (statusFilter === "Chờ xử lý"
          ? (t.status === "Chờ xử lý" || t.status === "Đang thực hiện" || t.status === "Quá hạn") && !t.isCompletedLate
          : statusFilter === "Đã hoàn thành"
            ? t.status === "Đã hoàn thành" && !t.isCompletedLate
            : statusFilter === "late"
              ? t.isCompletedLate
              : t.status === statusFilter);
      const matchPriority = priorityFilter === "" || t.priority === priorityFilter;

      return matchSearch && matchCategory && matchStatus && matchPriority;
    });
  }, [tasks, searchQuery, categoryFilter, statusFilter, priorityFilter]);

  // Paginated Tasks (Rule #9)
  const totalTaskPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE));
  const paginatedTasks = useMemo(() => {
    const start = (taskPage - 1) * ITEMS_PER_PAGE;
    return filteredTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTasks, taskPage, ITEMS_PER_PAGE]);

  // Quick stats
  const pendingCount = useMemo(() => tasks.filter(t => t.status === "Chờ xử lý" || t.status === "Đang thực hiện").length, [tasks]);
  const overdueCount = useMemo(() => tasks.filter(t => t.status === "Quá hạn" || t.priority === "Gấp").length, [tasks]);
  const totalNotifsSent = notifSummary.totalAnnouncements;

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Header & Dark Hero Banner */}
      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <BellRing className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
          {/* Building & Context Header */}
          <div className="space-y-3 max-w-xl w-full">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                {activeBuilding?.name || t("landlordRemindersActiveBuildingSelect")}
              </h1>
            </div>

            {activeBuilding?.address && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all w-full sm:w-auto">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                  <span className="text-xs font-bold text-zinc-200 truncate sm:whitespace-normal">{activeBuilding.address}</span>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="self-end sm:self-auto px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>{tCommon("viewMap")}</span> &rarr;
                </a>
              </div>
            )}

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("landlordRemindersHeroSubtitle")}
            </p>
          </div>

          {/* 4 Unified Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            {/* 1. Pending Tasks */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full lg:w-[135px]">
              <Clock3 className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#FF6B35] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">{t("landlordRemindersPendingTasks")}</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{pendingCount}</span>
              </div>
            </div>

            {/* 2. Overdue / Urgent */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[135px]">
              <ShieldAlert className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">{t("landlordRemindersHighPriority")}</span>
                <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">{overdueCount}</span>
              </div>
            </div>

            {/* 3. Broadcast Announcements (UC-L-13) */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[135px]">
              <Send className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#2AC1BC] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">{t("landlordRemindersStatTotalNotifs")}</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{totalNotifsSent}</span>
              </div>
            </div>

            {/* 4. Total Target Reach */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[135px]">
              <Users className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">{t("landlordRemindersStatReachedTenants")}</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{notifSummary.totalTargetTenants}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Segmented Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Module Switcher Tabs */}
        <div className="flex items-center p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/80 shadow-2xs">
          <button
            onClick={() => { setActiveTab("reminders"); setSearchQuery(""); setCategoryFilter(""); }}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === "reminders"
              ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/30"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
          >
            <BellRing className="w-4 h-4" />
            <span>{t("landlordRemindersTabTasks")}</span>
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${activeTab === "reminders" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
              }`}>
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("notifications"); setSearchQuery(""); setCategoryFilter(""); }}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === "notifications"
              ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/30"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
          >
            <Send className="w-4 h-4" />
            <span>{t("landlordRemindersTabNotifications")}</span>
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${activeTab === "notifications" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
              }`}>
              {notifTotal}
            </span>
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === "notifications" && (
            <button
              onClick={() => fetchAnnouncements()}
              disabled={isLoadingNotifs}
              title={isEn ? "Refresh list" : "Làm mới danh sách"}
              className="p-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-600 hover:text-zinc-900 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingNotifs ? "animate-spin text-[#2AC1BC]" : ""}`} />
            </button>
          )}

          {activeTab === "reminders" ? (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("landlordRemindersAssignTaskBtn")}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsNotifModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("landlordRemindersBroadcastNoticeBtn")}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("landlordRemindersSearchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50/70 border border-zinc-200/80 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-bold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
            >
              <option value="">{t("landlordRemindersFilterAllCategories")}</option>
              {activeTab === "reminders" ? (
                <>
                  <option value="Bảo trì">{t("landlordRemindersCatMaintenance")}</option>
                  <option value="Thu tiền">{t("landlordRemindersCatRent")}</option>
                  <option value="Kiểm tra">{t("landlordRemindersCatInspection")}</option>
                  <option value="Vệ sinh">{t("landlordRemindersCatCleaning")}</option>
                  <option value="Khác">{t("landlordRemindersCatOther")}</option>
                </>
              ) : (
                <>
                  <option value="Điện nước">{t("landlordRemindersNotifCatUtilities")}</option>
                  <option value="Tiền nhà">{t("landlordRemindersNotifCatRent")}</option>
                  <option value="Nội quy">{t("landlordRemindersNotifCatRules")}</option>
                  <option value="Khẩn cấp">{t("landlordRemindersNotifCatEmergency")}</option>
                </>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reminders specific filters */}
          {activeTab === "reminders" && (
            <>
              {/* Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-bold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                >
                  <option value="">{t("landlordRemindersFilterAllStatuses")}</option>
                  <option value="Chờ xử lý">{t("landlordRemindersStatusPending")}</option>
                  <option value="Đã hoàn thành">{t("landlordRemindersStatusCompleted")}</option>
                  <option value="Quá hạn">{t("landlordRemindersStatusOverdue")}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Priority */}
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs font-bold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                >
                  <option value="">{t("landlordRemindersFilterAllPriorities")}</option>
                  <option value="Gấp">{t("landlordRemindersPriorityUrgent")}</option>
                  <option value="Trung bình">{t("landlordRemindersPriorityMedium")}</option>
                  <option value="Thấp">{t("landlordRemindersPriorityLow")}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </>
          )}

          {/* View Switcher (Rule #9: Grid is Default) */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
            <button
              onClick={() => { setViewMode("grid"); setItemsPerPage(6); }}
              title={t("landlordRemindersViewGrid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-400 hover:text-zinc-700"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode("list"); setItemsPerPage(10); }}
              title={t("landlordRemindersViewList")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-400 hover:text-zinc-700"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tab 1: Staff Task Management Section */}
      {activeTab === "reminders" && (
        <>
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-zinc-200 border-dashed text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-3 text-zinc-400">
                <BellRing className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-800">
                {t("landlordRemindersEmptyTasksTitle")}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                {t("landlordRemindersEmptyTasksDesc")}
              </p>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="mt-4 px-4 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> {t("landlordRemindersBtnNewTask")}
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedTasks.map((task) => {
                  const isCompleted = task.status === "Đã hoàn thành";
                  const isLateCompleted = isCompleted && task.isCompletedLate;
                  const isOverdue = !isCompleted && (
                    task.status === "Quá hạn" ||
                    (task.dueDate && new Date(`${task.dueDate}T${task.dueTime || "23:59"}`) < new Date())
                  );
                  const isHighPriority = task.priority === "Gấp";

                  return (
                    <div
                      key={task.id}
                      className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group ${isLateCompleted ? "border-amber-300 bg-amber-50/20" :
                        isCompleted ? "border-emerald-200 bg-emerald-50/20" :
                          isOverdue ? "border-rose-200 bg-rose-50/10" : "border-zinc-200/80"
                        }`}
                    >
                      <div>
                        {/* Top Meta Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full tracking-wider ${isHighPriority ? "bg-rose-500/15 text-rose-600 border border-rose-500/20" :
                              task.priority === "Trung bình" ? "bg-amber-500/15 text-amber-600 border border-amber-500/20" :
                                "bg-zinc-100 text-zinc-600 border border-zinc-200"
                              }`}>
                              {task.priority === "Gấp" ? t("landlordRemindersPriorityUrgent") : task.priority === "Trung bình" ? t("landlordRemindersPriorityMedium") : t("landlordRemindersPriorityLow")}
                            </span>

                            {task.room && (
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 text-[10px] font-bold rounded-md">
                                {task.room}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                              {task.category === "Bảo trì" && <Wrench className="w-3.5 h-3.5 text-blue-500" />}
                              {task.category === "Thu tiền" && <Receipt className="w-3.5 h-3.5 text-emerald-500" />}
                              {task.category === "Kiểm tra" && <FileText className="w-3.5 h-3.5 text-amber-500" />}
                              {task.category}
                            </span>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-zinc-300 hover:text-rose-500 transition-colors cursor-pointer"
                              title={isEn ? "Delete task" : "Xóa công việc"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Task Title */}
                        <h3 className={`text-base font-bold text-zinc-900 leading-snug mb-2 ${isCompleted ? "line-through text-zinc-400" : ""}`}>
                          {task.title}
                        </h3>

                        {/* Notes / Description */}
                        <p className="text-xs text-zinc-500 leading-relaxed mb-4 line-clamp-2">
                          {task.notes || (isEn ? "No additional notes." : "Không có ghi chú thêm.")}
                        </p>

                        {/* Assignee Card */}
                        <div className="flex items-center gap-3 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 mb-4">
                          <div className={`w-8 h-8 rounded-full ${task.assignee.avatarBg} text-white font-black text-xs flex items-center justify-center shrink-0`}>
                            {task.assignee.name.split(" ").slice(-1)[0][0]}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-zinc-800 truncate">{task.assignee.name}</span>
                            <span className="text-[10px] font-semibold text-zinc-400">{task.assignee.role}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                          <Clock className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-500" : isLateCompleted ? "text-amber-500" : "text-zinc-400"}`} />
                          <span className={isOverdue ? "text-rose-600 font-extrabold" : isLateCompleted ? "text-amber-700 font-bold" : ""}>
                            {task.dueDate} ({task.dueTime})
                          </span>
                        </div>

                        <button
                          onClick={() => handleToggleTaskComplete(task.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isLateCompleted
                            ? "bg-amber-500 text-white shadow-2xs"
                            : isCompleted
                              ? "bg-emerald-500 text-white shadow-2xs"
                              : "bg-zinc-100 text-zinc-700 hover:bg-[#2AC1BC] hover:text-white"
                            }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isCompleted ? t("landlordRemindersStatusCompleted") : t("landlordRemindersMarkDone")}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Task Pagination Footer (Rule #9) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200/80 bg-white p-4 rounded-2xl border">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
                  <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
                    <span>{t("landlordRemindersPaginationShowing")}</span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={itemsPerPage || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setItemsPerPage(isNaN(val) || val <= 0 ? 1 : val);
                        setTaskPage(1);
                      }}
                      className="w-12 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs"
                    />
                    <span>{t("landlordRemindersPaginationPerPage")}</span>
                  </div>

                  <span className="hidden sm:inline text-zinc-300">|</span>

                  <div>
                    <span className="font-extrabold text-zinc-800">{(taskPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-extrabold text-zinc-800">{Math.min(taskPage * ITEMS_PER_PAGE, filteredTasks.length)}</span> {t("landlordRemindersPaginationOfTotal")} <span className="font-extrabold text-zinc-800">{filteredTasks.length}</span> {t("landlordRemindersPaginationTasks")}
                  </div>
                </div>
                {(() => {
                  const windowSize = 5;
                  const windowStart = Math.floor((taskPage - 1) / windowSize) * windowSize + 1;
                  const windowEnd = Math.min(windowStart + windowSize - 1, totalTaskPages);
                  const visiblePages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

                  return (
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={taskPage === 1}
                        onClick={() => setTaskPage(Math.max(windowStart - windowSize, 1))}
                        className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        &larr; {t("landlordRemindersPaginationPrev")}
                      </button>
                      {visiblePages.map(page => (
                        <button
                          key={page}
                          onClick={() => setTaskPage(page)}
                          className={`w-8 h-8 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${taskPage === page
                            ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/30"
                            : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        disabled={taskPage === totalTaskPages || windowStart + windowSize > totalTaskPages}
                        onClick={() => setTaskPage(Math.min(windowStart + windowSize, totalTaskPages))}
                        className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {t("landlordRemindersPaginationNext")} &rarr;
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* Table View */
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse min-w-[850px]">
                    <thead className="text-[11px] font-black text-zinc-500 uppercase bg-zinc-100/90 border-b border-zinc-200/80">
                      <tr>
                        <th className="px-4 py-3.5 whitespace-nowrap">{t("landlordRemindersFieldTitle")}</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">{t("landlordRemindersFieldCategory")}</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">{t("landlordRemindersFieldAssigneeStaff")}</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">{t("landlordRemindersFieldPriority")}</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">{t("landlordRemindersFieldDueDate")}</th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">{t("landlordRemindersColActions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {paginatedTasks.map((task) => {
                        const isCompleted = task.status === "Đã hoàn thành";
                        const isOverdue = !isCompleted && (
                          task.status === "Quá hạn" ||
                          (task.dueDate && new Date(`${task.dueDate}T${task.dueTime || "23:59"}`) < new Date())
                        );

                        return (
                          <tr key={task.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-zinc-900">{task.title}</div>
                              {task.room && <span className="text-[10px] text-zinc-400 font-bold">{task.room}</span>}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 text-[10px] font-bold rounded-md">
                                {task.category}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full ${task.assignee.avatarBg} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                                  {task.assignee.name.split(" ").slice(-1)[0][0]}
                                </div>
                                <span className="font-bold text-zinc-800">{task.assignee.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${task.priority === "Gấp" ? "bg-rose-50 text-rose-600 border border-rose-200" :
                                task.priority === "Trung bình" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                                  "bg-zinc-100 text-zinc-600"
                                }`}>
                                {task.priority === "Gấp" ? t("landlordRemindersPriorityUrgent") : task.priority === "Trung bình" ? t("landlordRemindersPriorityMedium") : t("landlordRemindersPriorityLow")}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <Clock className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-500" : "text-zinc-400"}`} />
                                <span className={`font-bold ${isOverdue ? "text-rose-600 font-extrabold" : "text-zinc-600"}`}>
                                  {task.dueDate} {task.dueTime}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleTaskComplete(task.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isCompleted
                                    ? "bg-emerald-500 text-white shadow-2xs"
                                    : "bg-zinc-100 text-zinc-700 hover:bg-[#2AC1BC] hover:text-white"
                                    }`}
                                >
                                  {isCompleted ? `✓ ${t("landlordRemindersStatusCompleted")}` : t("landlordRemindersMarkDone")}
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                                  title={isEn ? "Delete" : "Xóa"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Task Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
                  <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
                    <span>{t("landlordRemindersPaginationShowing")}</span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={itemsPerPage || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setItemsPerPage(isNaN(val) || val <= 0 ? 1 : val);
                        setTaskPage(1);
                      }}
                      className="w-12 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs"
                    />
                    <span>{t("landlordRemindersPaginationPerPage")}</span>
                  </div>

                  <span className="hidden sm:inline text-zinc-300">|</span>

                  <div>
                    <span className="font-extrabold text-zinc-800">{(taskPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-extrabold text-zinc-800">{Math.min(taskPage * ITEMS_PER_PAGE, filteredTasks.length)}</span> {t("landlordRemindersPaginationOfTotal")} <span className="font-extrabold text-zinc-800">{filteredTasks.length}</span> {t("landlordRemindersPaginationTasks")}
                  </div>
                </div>
                {(() => {
                  const windowSize = 5;
                  const windowStart = Math.floor((taskPage - 1) / windowSize) * windowSize + 1;
                  const windowEnd = Math.min(windowStart + windowSize - 1, totalTaskPages);
                  const visiblePages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

                  return (
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={taskPage === 1}
                        onClick={() => setTaskPage(Math.max(windowStart - windowSize, 1))}
                        className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        &larr; {t("landlordRemindersPaginationPrev")}
                      </button>
                      {visiblePages.map(page => (
                        <button
                          key={page}
                          onClick={() => setTaskPage(page)}
                          className={`w-8 h-8 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${taskPage === page
                            ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/30"
                            : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        disabled={taskPage === totalTaskPages || windowStart + windowSize > totalTaskPages}
                        onClick={() => setTaskPage(Math.min(windowStart + windowSize, totalTaskPages))}
                        className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {t("landlordRemindersPaginationNext")} &rarr;
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. Tab 2: Tenant Notifications Broadcast Section (UC-L-13 Real Backend Data) */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          {isLoadingNotifs ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 text-center">
              <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin mb-3" />
              <p className="text-xs font-bold text-zinc-600">{t("landlordRemindersLoadingNotifs")}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-zinc-200 border-dashed text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-3 text-zinc-400">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-800">
                {t("landlordRemindersEmptyNotifsTitle")}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                {t("landlordRemindersEmptyNotifsDesc")}
              </p>
              <button
                onClick={() => setIsNotifModalOpen(true)}
                className="mt-4 px-4 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-[#2AC1BC]/20"
              >
                <Plus className="w-4 h-4" /> {t("landlordRemindersCreateFirstNotif")}
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notifications.map((notif) => {
                const readPct = notif.totalTarget > 0 ? Math.round((notif.readCount / notif.totalTarget) * 100) : 0;
                return (
                  <div
                    key={notif.id}
                    onClick={() => setSelectedNotifDetail(notif)}
                    className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-[#2AC1BC]/40 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Header: Category Badge + Sent At */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                        <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-md uppercase shrink-0 ${
                          notif.category === "Khẩn cấp" || notif.category === "Emergency" ? "bg-rose-500/15 text-rose-600 border border-rose-500/30" :
                          notif.category === "Điện nước" || notif.category === "Utilities" ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
                          notif.category === "Tiền nhà" || notif.category === "Rent" ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30" :
                          "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                        }`}>
                          {notif.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-zinc-400">{notif.sentAt}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingNotifId(notif.id);
                            }}
                            className="text-zinc-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                            title={isEn ? "Delete announcement" : "Xóa thông báo"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Content Body */}
                      <div className="py-3 space-y-1.5">
                        <h3 className="font-extrabold text-sm text-zinc-900 group-hover:text-[#2AC1BC] transition-colors line-clamp-1">
                          {notif.title}
                        </h3>
                        <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed whitespace-pre-line">
                          {notif.content}
                        </p>
                      </div>

                      {/* Metadata Pills */}
                      <div className="flex flex-wrap items-center gap-2 py-2 border-t border-zinc-100 text-xs font-bold text-zinc-700">
                        <span className="inline-flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1 rounded-full text-[11px]">
                          <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> {notif.targetScope}
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-[#2AC1BC]/10 text-[#2AC1BC] px-2.5 py-1 rounded-full text-[11px]">
                          <Smartphone className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" /> {notif.channel}
                        </span>
                      </div>

                      {/* Read Progress Bar */}
                      <div className="pt-2 border-t border-zinc-100">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className="text-zinc-600">
                            {isEn ? "Read reach" : "Đã đọc"}: {notif.readCount}/{notif.totalTarget} {isEn ? "Tenants" : "Khách"}
                          </span>
                          <span className="text-[#2AC1BC]">{readPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2AC1BC] rounded-full transition-all" style={{ width: `${readPct}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Footer Action Button */}
                    <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedNotifDetail(notif); }}
                        className="w-full px-3 py-1.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC] text-[#2AC1BC] hover:text-white border border-[#2AC1BC]/30 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> {t("landlordRemindersViewDetails")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse min-w-[950px]">
                  <thead className="text-[11px] font-black text-zinc-500 uppercase bg-zinc-100/90 border-b border-zinc-200/80">
                    <tr>
                      <th className="px-4 py-3.5 whitespace-nowrap w-80">{t("landlordRemindersColCategoryTitle")}</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">{t("landlordRemindersColTargetAudience")}</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">{t("landlordRemindersColChannel")}</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">{t("landlordRemindersColReadRate")}</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">{t("landlordRemindersColSentAt")}</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap">{t("landlordRemindersColActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {notifications.map((notif) => {
                      const readPct = notif.totalTarget > 0 ? Math.round((notif.readCount / notif.totalTarget) * 100) : 0;

                      return (
                        <tr key={notif.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="px-4 py-4 max-w-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase shrink-0 ${
                                notif.category === "Khẩn cấp" || notif.category === "Emergency" ? "bg-rose-500/15 text-rose-600 border border-rose-500/30" :
                                notif.category === "Điện nước" || notif.category === "Utilities" ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
                                notif.category === "Tiền nhà" || notif.category === "Rent" ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30" :
                                "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                              }`}>
                                {notif.category}
                              </span>
                              <span className="font-bold text-zinc-900 text-sm truncate">{notif.title}</span>
                            </div>
                            <p className="text-zinc-500 text-xs line-clamp-1">{notif.content}</p>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                              <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> {notif.targetScope}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 whitespace-nowrap">
                              <Smartphone className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" /> {notif.channel}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap min-w-[160px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-zinc-700">{notif.readCount}/{notif.totalTarget} {isEn ? "Tenants" : "Khách"}</span>
                                <span className="text-[#2AC1BC]">{readPct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#2AC1BC] rounded-full transition-all" style={{ width: `${readPct}%` }} />
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-zinc-500 font-semibold whitespace-nowrap">
                            {notif.sentAt}
                          </td>

                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedNotifDetail(notif)}
                                className="px-3 py-1.5 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> {t("landlordRemindersViewDetails")}
                              </button>
                              <button
                                onClick={() => setDeletingNotifId(notif.id)}
                                className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title={isEn ? "Delete" : "Xóa"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications Pagination Footer (Rule #9) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
              <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
                <span>{t("landlordRemindersPaginationShowing")}</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={itemsPerPage || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setItemsPerPage(isNaN(val) || val <= 0 ? 1 : val);
                    setNotifPage(1);
                  }}
                  className="w-12 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs"
                />
                <span>{t("landlordRemindersPaginationPerPage")}</span>
              </div>

              <span className="hidden sm:inline text-zinc-300">|</span>

              <div>
                <span className="font-extrabold text-zinc-800">{(notifPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-extrabold text-zinc-800">{Math.min(notifPage * ITEMS_PER_PAGE, notifTotal)}</span> {t("landlordRemindersPaginationOfTotal")} <span className="font-extrabold text-zinc-800">{notifTotal}</span> {t("landlordRemindersPaginationAnnouncements")}
              </div>
            </div>
            {(() => {
              const windowSize = 5;
              const windowStart = Math.floor((notifPage - 1) / windowSize) * windowSize + 1;
              const windowEnd = Math.min(windowStart + windowSize - 1, notifTotalPages);
              const visiblePages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

              return (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={notifPage === 1}
                    onClick={() => setNotifPage(Math.max(windowStart - windowSize, 1))}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    &larr; {t("landlordRemindersPaginationPrev")}
                  </button>
                  {visiblePages.map(page => (
                    <button
                      key={page}
                      onClick={() => setNotifPage(page)}
                      className={`w-8 h-8 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${notifPage === page
                        ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/30"
                        : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={notifPage === notifTotalPages || windowStart + windowSize > notifTotalPages}
                    onClick={() => setNotifPage(Math.min(windowStart + windowSize, notifTotalPages))}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {t("landlordRemindersPaginationNext")} &rarr;
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 6. MODAL 1: Create Staff Task Modal */}
      {isTaskModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) requestCloseTaskModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/20 text-[#2AC1BC] rounded-xl border border-[#2AC1BC]/30">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white">{t("landlordRemindersTaskModalHeader")}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{t("landlordRemindersModalTaskSubtitle")}</p>
                </div>
              </div>
              <button
                onClick={requestCloseTaskModal}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-zinc-50/50">
              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  {t("landlordRemindersFieldTitle")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t("landlordRemindersFieldTaskTitlePlaceholder")}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                />
              </div>

              {/* Assignee & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{t("landlordRemindersFieldAssignee")}</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                  >
                    {staffList.map(s => (
                      <option key={s.name} value={`${s.name} (${s.role})`}>{s.name} - {s.role}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{t("landlordRemindersFieldRoom")}</label>
                  <input
                    type="text"
                    placeholder={t("landlordRemindersFieldRoomPlaceholder")}
                    value={taskRoom}
                    onChange={(e) => setTaskRoom(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] transition-all"
                  />
                </div>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{t("landlordRemindersFieldCategory")}</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                  >
                    <option value="Bảo trì">{t("landlordRemindersCatMaintenance")}</option>
                    <option value="Thu tiền">{t("landlordRemindersCatRent")}</option>
                    <option value="Kiểm tra">{t("landlordRemindersCatInspection")}</option>
                    <option value="Vệ sinh">{t("landlordRemindersCatCleaning")}</option>
                    <option value="Khác">{t("landlordRemindersCatOther")}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{t("landlordRemindersFieldPriority")}</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                  >
                    <option value="Gấp">{t("landlordRemindersPriorityUrgent")}</option>
                    <option value="Trung bình">{t("landlordRemindersPriorityMedium")}</option>
                    <option value="Thấp">{t("landlordRemindersPriorityLow")}</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{t("landlordRemindersFieldDueDate")}</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{t("landlordRemindersFieldDueTime")}</label>
                  <input
                    type="time"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{t("landlordRemindersFieldNotes")}</label>
                <textarea
                  rows={3}
                  placeholder={t("landlordRemindersFieldNotesPlaceholder")}
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] resize-none"
                />
              </div>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={requestCloseTaskModal}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  {t("landlordRemindersBtnCancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> {t("landlordRemindersBtnSubmitTask")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL 2: Create Tenant Broadcast Modal (UC-L-13) */}
      {isNotifModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) requestCloseNotifModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/20 text-[#2AC1BC] rounded-xl border border-[#2AC1BC]/30">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white">{t("landlordRemindersNotifModalHeader")}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{t("landlordRemindersModalNotifSubtitle")}</p>
                </div>
              </div>
              <button
                onClick={requestCloseNotifModal}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-zinc-50/50">
              {/* Quick Template Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("landlordRemindersSelectTemplate")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {notificationTemplates.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => {
                        setNotifTitle(tmpl.title);
                        setNotifContent(tmpl.content);
                        setNotifCategory(tmpl.category);
                      }}
                      className="p-2.5 text-left border border-zinc-200 hover:border-[#2AC1BC] hover:bg-[#2AC1BC]/5 rounded-xl transition-all bg-white cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-zinc-900 group-hover:text-[#2AC1BC] truncate">{tmpl.title}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">{tmpl.category}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  {t("landlordRemindersFieldTitle")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? "e.g. Electricity outage notice on 30/08" : "VD: Lịch cúp điện ngày 30/08"}
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                />
              </div>

              {/* Target & Channel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{t("landlordRemindersFieldTargetScope")}</label>
                  <input
                    type="text"
                    value={notifTargetScope}
                    onChange={(e) => setNotifTargetScope(e.target.value)}
                    placeholder={t("landlordRemindersFieldTargetScopePlaceholder")}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{t("landlordRemindersFieldChannelLabel")}</label>
                  <select
                    value={notifChannel}
                    onChange={(e) => setNotifChannel(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                  >
                    <option value="Thông báo hệ thống">{isEn ? "In-App Notification (Dormio)" : "Thông báo hệ thống (Dormio)"}</option>
                    <option value="Zalo OA">{isEn ? "Zalo Official Account" : "Zalo Official Account"}</option>
                    <option value="SMS">{isEn ? "Direct SMS Message" : "Tin nhắn SMS trực tiếp"}</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{t("landlordRemindersFieldCategory")}</label>
                <select
                  value={notifCategory}
                  onChange={(e) => setNotifCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                >
                  <option value="Điện nước">{t("landlordRemindersNotifCatUtilities")}</option>
                  <option value="Tiền nhà">{t("landlordRemindersNotifCatRent")}</option>
                  <option value="Nội quy">{t("landlordRemindersNotifCatRules")}</option>
                  <option value="Khẩn cấp">{t("landlordRemindersNotifCatEmergency")}</option>
                </select>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  {t("landlordRemindersFieldContent")} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder={t("landlordRemindersFieldContentPlaceholder")}
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] resize-none"
                />
              </div>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={requestCloseNotifModal}
                  disabled={isSubmittingNotif}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t("landlordRemindersBtnCancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNotif}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingNotif ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("landlordRemindersBroadcasting")}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t("landlordRemindersBtnSendNotif")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL 3: View Notification Detail */}
      {selectedNotifDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedNotifDetail(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-900 text-white">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 text-[10px] font-black rounded-full uppercase">
                  {selectedNotifDetail.category}
                </span>
                <h3 className="text-sm font-bold text-white">{t("landlordRemindersDetailTitle")}</h3>
              </div>
              <button
                onClick={() => setSelectedNotifDetail(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-medium">
              <div>
                <h2 className="text-base font-black text-zinc-900 leading-snug mb-1">{selectedNotifDetail.title}</h2>
                <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-bold">
                  <span>{t("landlordRemindersDetailSentAt", { time: selectedNotifDetail.sentAt })}</span>
                  <span>•</span>
                  <span>{t("landlordRemindersDetailChannel", { channel: selectedNotifDetail.channel })}</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 text-zinc-800 leading-relaxed whitespace-pre-line">
                {selectedNotifDetail.content}
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-zinc-700 font-bold">{t("landlordRemindersDetailTargetReach")}</span>
                </div>
                <span className="font-black text-blue-600 text-sm">
                  {t("landlordRemindersDetailResidentsUnit", { count: selectedNotifDetail.totalTarget })}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setDeletingNotifId(selectedNotifDetail.id);
                  setSelectedNotifDetail(null);
                }}
                className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> {t("landlordRemindersDetailDelete")}
              </button>

              <button
                onClick={() => setSelectedNotifDetail(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {t("landlordRemindersDetailClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL 4: Confirm Delete Announcement Modal */}
      {deletingNotifId && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDeletingNotifId(null); }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 border border-zinc-100">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center justify-center mx-auto text-rose-500 shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                {t("landlordRemindersConfirmDeleteTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
                {t("landlordRemindersConfirmDeleteDesc")}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingNotif}
                onClick={() => setDeletingNotifId(null)}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {t("landlordRemindersBtnCancel")}
              </button>
              <button
                type="button"
                disabled={isDeletingNotif}
                onClick={() => handleDeleteAnnouncement(deletingNotifId)}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{t("landlordRemindersDeleteAction")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL POP-UP: Confirm Close Form with Unsaved Changes (Rule #10) */}
      {confirmCloseTarget && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmCloseTarget(null); }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 border border-zinc-100">
            {/* Warning Amber Icon Badge */}
            <div className="w-14 h-14 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-2xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            {/* Header Title & Subtitle */}
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                {t("landlordRemindersConfirmDiscardTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
                {t("landlordRemindersConfirmDiscardDesc")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCloseTarget(null)}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 transition-all cursor-pointer shadow-2xs"
              >
                {t("landlordRemindersConfirmKeepEditing")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmCloseTarget === "task") closeAndResetTaskModal();
                  if (confirmCloseTarget === "notif") closeAndResetNotifModal();
                  setConfirmCloseTarget(null);
                }}
                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-500/30"
              >
                {t("landlordRemindersConfirmDiscardClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
