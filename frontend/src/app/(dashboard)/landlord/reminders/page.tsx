"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, BellRing, Calendar, CheckCircle2, X, Clock,
  Send, MessageSquare, Users, Building2, Eye,
  AlertTriangle, UserCheck, Sparkles, Search, ChevronDown,
  LayoutGrid, List, RefreshCw, Wrench, Receipt, Volume2,
  MapPin, Check, FileText, ArrowUpRight, Flame, ShieldAlert,
  Clock3, Smartphone, Filter, ChevronLeft, ChevronRight
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

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

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  category: "Khẩn cấp" | "Điện nước" | "Tiền nhà" | "Nội quy";
  targetScope: string;
  sentAt: string;
  sender: string;
  readCount: number;
  totalTarget: number;
  channel: "Thông báo hệ thống" | "Zalo OA" | "SMS";
}

export default function RemindersPage() {
  const { activeBuilding } = useAuth();
  const [activeTab, setActiveTab] = useState<"reminders" | "notifications">("reminders");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMounted, setIsMounted] = useState(false);

  // Modals & Forms State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [selectedNotifDetail, setSelectedNotifDetail] = useState<NotificationItem | null>(null);

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
  const [taskRoom, setTaskRoom] = useState("101");
  const [taskPriority, setTaskPriority] = useState<TaskItem["priority"]>("Trung bình");
  const [taskDueDate, setTaskDueDate] = useState("2026-08-30");
  const [taskDueTime, setTaskDueTime] = useState("14:00");
  const [taskNotes, setTaskNotes] = useState("");

  // New Notification Form State
  const [notifTitle, setNotifTitle] = useState("");
  const [notifContent, setNotifContent] = useState("");
  const [notifCategory, setNotifCategory] = useState<NotificationItem["category"]>("Điện nước");
  const [notifTargetScope, setNotifTargetScope] = useState("Toàn bộ tòa nhà");
  const [notifChannel, setNotifChannel] = useState<NotificationItem["channel"]>("Thông báo hệ thống");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setTaskPage(1);
    setNotifPage(1);
  }, [searchQuery, categoryFilter, statusFilter, priorityFilter, channelFilter, activeTab]);

  // Staff list options
  const staffList = [
    { name: "Nguyễn Văn Tuấn", role: "Kỹ thuật tòa nhà", avatarBg: "bg-blue-600" },
    { name: "Trần Thị Mai", role: "Kế toán / Thu ngân", avatarBg: "bg-emerald-600" },
    { name: "Lê Hoàng Nam", role: "Bảo vệ ca sáng", avatarBg: "bg-amber-600" },
    { name: "Phạm Quốc Huy", role: "Quản lý tầng 2-4", avatarBg: "bg-purple-600" },
  ];

  // Quick Notification Templates
  const notificationTemplates = [
    {
      title: "Thông báo cúp điện bảo trì lưới điện",
      category: "Điện nước" as const,
      content: `Kính gửi quý khách thuê phòng tại ${activeBuilding.name},\n\nHệ thống điện lực khu vực sẽ tiến hành bảo trì lưới điện từ 08:00 đến 12:00 ngày tới. Rất mong quý khách chủ động sắp xếp công việc và ngắt các thiết bị điện công suất lớn trước thời gian trên.\n\nTrân trọng thông báo!`,
    },
    {
      title: "Nhắc nhở quyết toán tiền nhà tháng này",
      category: "Tiền nhà" as const,
      content: `Kính báo quý khách thuê phòng,\n\nHóa đơn tiền nhà & dịch vụ tháng này đã được cập nhật trên ứng dụng. Đề nghị quý khách kiểm tra và thanh toán trước hạn để tránh phát sinh phí chậm nộp.\n\nCảm ơn sự hợp tác của quý khách!`,
    },
    {
      title: "Thông báo lịch diệt côn trùng toàn tòa nhà",
      category: "Nội quy" as const,
      content: `Ban quản lý tòa nhà ${activeBuilding.name} sẽ tiến hành xịt muỗi và diệt côn trùng định kỳ khu vực hành lang và các tầng. Vui lòng đóng kín cửa phòng và che đậy thực phẩm cẩn thận.`,
    },
    {
      title: "THÔNG BÁO KHẨN: Bảo trì máy bơm nước khẩn cấp",
      category: "Khẩn cấp" as const,
      content: `Do sự cố kỹ thuật máy bơm chính, hệ thống nước sạch sẽ tạm ngưng trong khoảng 2 tiếng tới. Kỹ thuật viên đang xử lý gấp. Rất mong quý khách thông cảm!`,
    },
  ];

  // Mock Tasks Data (Expanded)
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "TSK-001",
      title: "Kiểm tra máy lạnh bị rò nước",
      category: "Bảo trì",
      assignee: { name: "Nguyễn Văn Tuấn", role: "Kỹ thuật", avatarBg: "bg-blue-600" },
      dueDate: "2026-08-29",
      dueTime: "10:30",
      priority: "Gấp",
      status: "Chờ xử lý",
      room: "Phòng 102",
      notes: "Khách thuê báo máy lạnh chảy nước tràn sàn từ đêm qua.",
    },
    {
      id: "TSK-002",
      title: "Chốt số điện nước đầu tháng",
      category: "Kiểm tra",
      assignee: { name: "Lê Hoàng Nam", role: "Bảo vệ", avatarBg: "bg-amber-600" },
      dueDate: "2026-08-31",
      dueTime: "17:00",
      priority: "Trung bình",
      status: "Đang thực hiện",
      room: "Tất cả các tầng",
      notes: "Chụp ảnh đồng hồ điện nước từng phòng gửi lên hệ thống OCR.",
    },
    {
      id: "TSK-003",
      title: "Thu tiền cọc và ký HĐ phòng 304",
      category: "Thu tiền",
      assignee: { name: "Trần Thị Mai", role: "Kế toán", avatarBg: "bg-emerald-600" },
      dueDate: "2026-08-28",
      dueTime: "15:00",
      priority: "Trung bình",
      status: "Đã hoàn thành",
      room: "Phòng 304",
      notes: "Khách hẹn mang tiền mặt và CCCD đến văn phòng.",
    },
    {
      id: "TSK-004",
      title: "Thay bóng đèn hành lang tầng 2",
      category: "Bảo trì",
      assignee: { name: "Nguyễn Văn Tuấn", role: "Kỹ thuật", avatarBg: "bg-blue-600" },
      dueDate: "2026-08-27",
      dueTime: "18:00",
      priority: "Gấp",
      status: "Quá hạn",
      room: "Hành lang Tầng 2",
      notes: "Đèn lối đi bị nhấp nháy liên tục gây chói mắt.",
    },
    {
      id: "TSK-005",
      title: "Sửa khoá cửa vân tay phòng 204",
      category: "Bảo trì",
      assignee: { name: "Nguyễn Văn Tuấn", role: "Kỹ thuật", avatarBg: "bg-blue-600" },
      dueDate: "2026-08-25",
      dueTime: "12:00",
      priority: "Gấp",
      status: "Đã hoàn thành",
      isCompletedLate: true,
      completedAtNote: "Xong trễ 1 ngày - Đã note xét duyệt cuối tháng",
      room: "Phòng 204",
      notes: "Khoá cửa vân tay hết pin, khách thuê không vào được phòng.",
    },
    {
      id: "TSK-006",
      title: "Vệ sinh bồn nước tầng mái định kỳ",
      category: "Vệ sinh",
      assignee: { name: "Phạm Quốc Huy", role: "Quản lý", avatarBg: "bg-purple-600" },
      dueDate: "2026-09-02",
      dueTime: "09:00",
      priority: "Trung bình",
      status: "Chờ xử lý",
      room: "Sân thượng",
      notes: "Xả cặn bồn inox 5000L và kiểm tra nắp đậy bảo vệ.",
    },
    {
      id: "TSK-007",
      title: "Bàn giao phòng 401 cho khách mới",
      category: "Kiểm tra",
      assignee: { name: "Trần Thị Mai", role: "Kế toán", avatarBg: "bg-emerald-600" },
      dueDate: "2026-09-01",
      dueTime: "14:00",
      priority: "Trung bình",
      status: "Chờ xử lý",
      room: "Phòng 401",
      notes: "Kiểm tra trang thiết bị nội thất và giao 2 thẻ từ.",
    },
  ]);

  // Mock Notifications Data (Expanded for Rich Pagination)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "NOTIF-001",
      title: "Thông báo cúp điện bảo trì lưới điện",
      content: `Kính gửi quý khách thuê phòng tại ${activeBuilding.name}, điện lực khu vực sẽ tiến hành bảo trì lưới điện từ 08:00 đến 12:00 ngày 30/08/2026.`,
      category: "Điện nước",
      targetScope: activeBuilding.name,
      sentAt: "2026-08-28 09:15",
      sender: "BQL Tòa nhà",
      readCount: 54,
      totalTarget: 60,
      channel: "Thông báo hệ thống",
    },
    {
      id: "NOTIF-002",
      title: "Nhắc nhở thanh toán tiền nhà & dịch vụ tháng 8",
      content: "Hóa đơn tháng 8 đã được cập nhật. Kính mời quý khách kiểm tra và thanh toán trước ngày 05/09/2026.",
      category: "Tiền nhà",
      targetScope: "Toàn bộ tòa nhà",
      sentAt: "2026-08-25 14:00",
      sender: "Kế toán",
      readCount: 58,
      totalTarget: 60,
      channel: "Zalo OA",
    },
    {
      id: "NOTIF-003",
      title: "Lịch xịt muỗi định kỳ toàn tòa nhà",
      content: "Sáng thứ 7 tuần này ban quản lý sẽ xịt muỗi toàn bộ hành lang và sân thượng. Đề nghị quý khách che đậy đồ ăn.",
      category: "Nội quy",
      targetScope: "Tầng 1, Tầng 2, Tầng 3",
      sentAt: "2026-08-20 10:00",
      sender: "Quản lý",
      readCount: 60,
      totalTarget: 60,
      channel: "Thông báo hệ thống",
    },
    {
      id: "NOTIF-004",
      title: "THÔNG BÁO KHẨN: Sự cố máy bơm nước sạch",
      content: "Do sự cố máy bơm chính, hệ thống nước tạm ngưng trong 2 tiếng. Kỹ thuật viên đang khắc phục gấp.",
      category: "Khẩn cấp",
      targetScope: activeBuilding.name,
      sentAt: "2026-08-18 07:30",
      sender: "BQL Tòa nhà",
      readCount: 60,
      totalTarget: 60,
      channel: "SMS",
    },
    {
      id: "NOTIF-005",
      title: "Kiểm tra hệ thống PCCC & chuông báo cháy",
      content: "BQL sẽ test chuông báo cháy vào 15h00 chiều nay. Quý khách vui lòng không hoảng loạn khi nghe tiếng chuông.",
      category: "Nội quy",
      targetScope: "Toàn bộ tòa nhà",
      sentAt: "2026-08-15 14:00",
      sender: "Quản lý",
      readCount: 52,
      totalTarget: 60,
      channel: "Thông báo hệ thống",
    },
    {
      id: "NOTIF-006",
      title: "Thông báo bảo trì thang máy tòa nhà",
      content: "Thang máy sẽ tạm dừng vận hành từ 13h30 - 15h00 để bảo dưỡng kỹ thuật định kỳ.",
      category: "Điện nước",
      targetScope: activeBuilding.name,
      sentAt: "2026-08-12 11:00",
      sender: "Kỹ thuật",
      readCount: 56,
      totalTarget: 60,
      channel: "Zalo OA",
    },
    {
      id: "NOTIF-007",
      title: "Nhắc nhở quy định giữ trật tự sau 22h00",
      content: "Đề nghị quý khách không mở nhạc lớn và hạn chế nói chuyện ồn ào ngoài hành lang sau 22h00.",
      category: "Nội quy",
      targetScope: "Tầng 2 & Tầng 3",
      sentAt: "2026-08-10 21:00",
      sender: "Bảo vệ",
      readCount: 49,
      totalTarget: 60,
      channel: "Thông báo hệ thống",
    },
    {
      id: "NOTIF-008",
      title: "Lịch súc rửa bể chứa nước ngầm",
      content: "BQL sẽ tiến hành súc rửa bể chứa nước ngầm vào chủ nhật tới. Quý khách vui lòng trữ nước tiêu dùng.",
      category: "Điện nước",
      targetScope: "Toàn bộ tòa nhà",
      sentAt: "2026-08-05 08:30",
      sender: "BQL Tòa nhà",
      readCount: 59,
      totalTarget: 60,
      channel: "SMS",
    },
    {
      id: "NOTIF-009",
      title: "Thông báo nhận bưu phẩm / hàng hóa tại bảo vệ",
      content: "Hiện có nhiều bưu phẩm Shopee/Lazada lưu tại phòng bảo vệ. Kính mời các khách thuê phòng 101, 202 xuống nhận.",
      category: "Nội quy",
      targetScope: "Phòng 101, 202",
      sentAt: "2026-08-02 16:15",
      sender: "Bảo vệ",
      readCount: 50,
      totalTarget: 60,
      channel: "Thông báo hệ thống",
    },
    {
      id: "NOTIF-010",
      title: "Đăng ký thông tin tạm trú đợt 2",
      content: "Yêu cầu các khách thuê mới chuyển đến trong tháng 8 gửi ảnh CCCD để đăng ký tạm trú với Công an phường.",
      category: "Nội quy",
      targetScope: "Toàn bộ tòa nhà",
      sentAt: "2026-07-28 09:00",
      sender: "Quản lý",
      readCount: 55,
      totalTarget: 60,
      channel: "Zalo OA",
    },
  ]);

  if (!isMounted) return null;

  // Handlers for task mutation
  const handleToggleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const isCurrentlyCompleted = t.status === "Đã hoàn thành";
        const wasOverdue = t.status === "Quá hạn" || t.isCompletedLate;

        if (isCurrentlyCompleted) {
          return { ...t, status: "Chờ xử lý" };
        } else {
          return {
            ...t,
            status: "Đã hoàn thành",
            isCompletedLate: wasOverdue ? true : t.isCompletedLate,
            completedAtNote: wasOverdue ? "Xong trễ hạn - Đã note xét duyệt cuối tháng" : undefined,
          };
        }
      }
      return t;
    }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `TSK-00${tasks.length + 1}`,
      title: taskTitle,
      category: taskCategory,
      assignee: {
        name: taskAssignee.split(" (")[0],
        role: taskAssignee.includes("(") ? taskAssignee.split("(")[1].replace(")", "") : "Nhân viên",
        avatarBg: "bg-blue-600",
      },
      dueDate: taskDueDate,
      dueTime: taskDueTime,
      priority: taskPriority,
      status: "Chờ xử lý",
      room: taskRoom ? `Phòng ${taskRoom}` : undefined,
      notes: taskNotes,
    };

    setTasks([newTask, ...tasks]);
    setIsTaskModalOpen(false);
    setTaskTitle("");
    setTaskNotes("");
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifContent.trim()) return;

    const newNotif: NotificationItem = {
      id: `NOTIF-00${notifications.length + 1}`,
      title: notifTitle,
      content: notifContent,
      category: notifCategory,
      targetScope: notifTargetScope,
      sentAt: new Date().toLocaleString("sv").slice(0, 16),
      sender: "BQL Tòa nhà",
      readCount: 1,
      totalTarget: 60,
      channel: notifChannel,
    };

    setNotifications([newNotif, ...notifications]);
    setIsNotifModalOpen(false);
    setNotifTitle("");
    setNotifContent("");
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
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

  // Filter Notifications
  const filteredNotifications = notifications.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.targetScope.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === "" || n.category === categoryFilter;
    const matchChannel = channelFilter === "" || n.channel === channelFilter;

    return matchSearch && matchCategory && matchChannel;
  });

  // Pagination Computations
  const totalTaskPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE) || 1;
  const paginatedTasks = filteredTasks.slice((taskPage - 1) * ITEMS_PER_PAGE, taskPage * ITEMS_PER_PAGE);

  const totalNotifPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE) || 1;
  const paginatedNotifications = filteredNotifications.slice((notifPage - 1) * ITEMS_PER_PAGE, notifPage * ITEMS_PER_PAGE);

  // Stat computations
  const pendingCount = tasks.filter(t => (t.status === "Chờ xử lý" || t.status === "Đang thực hiện" || t.status === "Quá hạn") && !t.isCompletedLate).length;
  const overdueCount = tasks.filter(t => (!t.status.includes("hoàn thành") && (t.status === "Quá hạn" || new Date(`${t.dueDate}T${t.dueTime || "23:59"}`) < new Date()))).length;
  const totalNotifsSent = notifications.length;
  const avgReadRate = Math.round(
    notifications.reduce((acc, n) => acc + (n.readCount / n.totalTarget) * 100, 0) / (notifications.length || 1)
  );

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
                {activeBuilding.name}
              </h1>
            </div>

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
                <span>Xem Bản Đồ</span> &rarr;
              </a>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Phân công việc cho nhân viên tòa nhà và phát sóng thông báo khẩn, lịch cúp điện nước đến ứng dụng khách thuê.
            </p>
          </div>

          {/* 4 Unified Stat Chips (Aesthetic Single Row matching Rooms, Contracts, Customers) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            {/* 1. Công việc chờ xử lý (Cam) */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full lg:w-[135px]">
              <Clock3 className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#FF6B35] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Chờ làm</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{pendingCount}</span>
              </div>
            </div>

            {/* 2. Việc quá hạn / Gấp (Đỏ) */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[135px]">
              <ShieldAlert className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Gấp</span>
                <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">{overdueCount}</span>
              </div>
            </div>

            {/* 3. Thông báo đã gửi (Xanh ngọc) */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[135px]">
              <Send className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#2AC1BC] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">TB đã gửi</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{totalNotifsSent}</span>
              </div>
            </div>

            {/* 4. Tỷ lệ khách đã đọc (Xanh dương) */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[135px]">
              <Eye className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Khách đọc</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{avgReadRate}%</span>
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
            <span>Nhắc nhở</span>
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
            <MessageSquare className="w-4 h-4" />
            <span>Thông Báo</span>
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${activeTab === "notifications" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
              }`}>
              {notifications.length}
            </span>
          </button>
        </div>

        {/* Action Trigger Buttons (Synchronized Teal Theme) */}
        <div className="flex items-center gap-2">
          {activeTab === "reminders" ? (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm nhắc nhở
            </button>
          ) : (
            <button
              onClick={() => setIsNotifModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" /> Soạn thông báo
            </button>
          )}
        </div>
      </div>

      {/* 3. Single-Row Toolbar Container (Search & Filters) */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={activeTab === "reminders" ? "Tìm tiêu đề việc, nhân viên, phòng..." : "Tìm thông báo, nội dung, đối tượng..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
            />
          </div>

          {/* Right Side Filters */}
          <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <div className="relative flex-1 sm:flex-initial min-w-[130px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:border-[#2AC1BC] cursor-pointer transition-colors shadow-2xs text-ellipsis overflow-hidden"
              >
                <option value="">Tất cả phân loại</option>
                {activeTab === "reminders" ? (
                  <>
                    <option value="Bảo trì">Bảo trì</option>
                    <option value="Thu tiền">Thu tiền</option>
                    <option value="Vệ sinh">Vệ sinh</option>
                    <option value="Kiểm tra">Kiểm tra</option>
                    <option value="Khác">Khác</option>
                  </>
                ) : (
                  <>
                    <option value="Điện nước">Điện nước</option>
                    <option value="Tiền nhà">Tiền nhà</option>
                    <option value="Nội quy">Nội quy</option>
                    <option value="Khẩn cấp">Khẩn cấp</option>
                  </>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>

            {/* Notifications Specific Filter: Kênh Gửi */}
            {activeTab === "notifications" && (
              <div className="relative flex-1 sm:flex-initial min-w-[130px]">
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:border-[#2AC1BC] cursor-pointer transition-colors shadow-2xs text-ellipsis overflow-hidden"
                >
                  <option value="">Tất cả kênh gửi</option>
                  <option value="Thông báo hệ thống">Thông báo hệ thống</option>
                  <option value="Zalo OA">Zalo Official Account</option>
                  <option value="SMS">Tin nhắn SMS trực tiếp</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              </div>
            )}

            {/* Reminders specific filters */}
            {activeTab === "reminders" && (
              <>
                <div className="relative flex-1 sm:flex-initial min-w-[130px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:border-[#2AC1BC] cursor-pointer transition-colors shadow-2xs text-ellipsis overflow-hidden"
                  >
                    <option value="">Mọi trạng thái</option>
                    <option value="Chờ xử lý">Chờ xử lý</option>
                    <option value="Đang thực hiện">Đang thực hiện</option>
                    <option value="Đã hoàn thành">Hoàn thành đúng hạn</option>
                    <option value="late">Hoàn thành trễ hạn</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                </div>

                <div className="relative flex-1 sm:flex-initial min-w-[130px]">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:border-[#2AC1BC] cursor-pointer transition-colors shadow-2xs text-ellipsis overflow-hidden"
                  >
                    <option value="">Mọi mức ưu tiên</option>
                    <option value="Gấp">Gấp / Cao</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Thấp">Thấp</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                </div>
              </>
            )}

            {/* View Switcher (For Reminders Tab) */}
            {activeTab === "reminders" && (
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shrink-0 ml-auto sm:ml-0">
                <button
                  onClick={() => { setViewMode("grid"); setItemsPerPage(6); setTaskPage(1); }}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-400 hover:text-zinc-700"
                    }`}
                  title="Dạng thẻ Grid"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setViewMode("list"); setItemsPerPage(10); setTaskPage(1); }}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-400 hover:text-zinc-700"
                    }`}
                  title="Dạng danh sách List"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Tab 1: Staff Task Management Section */}
      {activeTab === "reminders" && (
        <>
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-2xl border border-zinc-200 border-dashed text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-3 text-zinc-400">
                <BellRing className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-800">Không tìm thấy công việc phù hợp</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">Thử thay đổi từ khóa hoặc bộ lọc trạng thái để xem các công việc khác.</p>
              <button
                onClick={() => { setSearchQuery(""); setCategoryFilter(""); setStatusFilter(""); setPriorityFilter(""); }}
                className="mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Xóa tất cả bộ lọc
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
                              {task.priority === "Gấp" ? " Gấp / Ưu tiên" : task.priority}
                            </span>

                            {task.room && (
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 text-[10px] font-bold rounded-md">
                                {task.room}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                            {task.category === "Bảo trì" && <Wrench className="w-3.5 h-3.5 text-blue-500" />}
                            {task.category === "Thu tiền" && <Receipt className="w-3.5 h-3.5 text-emerald-500" />}
                            {task.category === "Kiểm tra" && <FileText className="w-3.5 h-3.5 text-amber-500" />}
                            {task.category}
                          </span>
                        </div>

                        {/* Task Title */}
                        <h3 className={`text-base font-bold text-zinc-900 leading-snug mb-2 ${isCompleted ? "line-through text-zinc-400" : ""}`}>
                          {task.title}
                        </h3>

                        {/* Notes / Description */}
                        <p className="text-xs text-zinc-500 leading-relaxed mb-4 line-clamp-2">
                          {task.notes || "Không có ghi chú thêm."}
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
                          <span>{isLateCompleted ? "Trễ hạn" : isCompleted ? "Đã xong" : "Xác nhận"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Task Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200/80 bg-white p-4 rounded-2xl border">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
                  <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
                    <span>Hiển thị</span>
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
                    <span>/ trang</span>
                  </div>

                  <span className="hidden sm:inline text-zinc-300">|</span>

                  <div>
                    <span className="font-extrabold text-zinc-800">{(taskPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-extrabold text-zinc-800">{Math.min(taskPage * ITEMS_PER_PAGE, filteredTasks.length)}</span> trên tổng số <span className="font-extrabold text-zinc-800">{filteredTasks.length}</span> công việc
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
                        &larr; Trước
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
                        Sau &rarr;
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
                        <th className="px-4 py-3.5 whitespace-nowrap">Tiêu đề công việc</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Phân loại</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Nhân viên phụ trách</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Mức ưu tiên</th>
                        <th className="px-4 py-3.5 whitespace-nowrap">Hạn xong</th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">Trạng thái / Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {paginatedTasks.map((task) => {
                        const isCompleted = task.status === "Đã hoàn thành";
                        const isLateCompleted = isCompleted && task.isCompletedLate;
                        const isOverdue = !isCompleted && (
                          task.status === "Quá hạn" ||
                          (task.dueDate && new Date(`${task.dueDate}T${task.dueTime || "23:59"}`) < new Date())
                        );

                        return (
                          <tr
                            key={task.id}
                            className={`hover:bg-zinc-50/80 transition-colors ${isLateCompleted ? "bg-amber-50/20" : isCompleted ? "bg-emerald-50/10" : isOverdue ? "bg-rose-50/30" : ""
                              }`}
                          >
                            <td className="px-4 py-3.5">
                              <div className={`font-bold ${isCompleted ? "line-through text-zinc-400" : "text-zinc-900"}`}>{task.title}</div>
                              <div className="text-[11px] text-zinc-400 font-semibold">{task.room || "Chung toàn nhà"}</div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="px-2 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-[11px] font-bold">
                                {task.category}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full ${task.assignee.avatarBg} text-white font-black text-[10px] flex items-center justify-center shrink-0`}>
                                  {task.assignee.name.split(" ").slice(-1)[0][0]}
                                </div>
                                <span className="font-bold text-zinc-800">{task.assignee.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${task.priority === "Gấp" ? "bg-rose-500/10 text-rose-600 border border-rose-500/30" :
                                task.priority === "Trung bình" ? "bg-amber-500/10 text-amber-600 border border-amber-500/30" :
                                  "bg-zinc-100 text-zinc-600"
                                }`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <Clock className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-500" : isLateCompleted ? "text-amber-500" : "text-zinc-400"}`} />
                                <span className={`font-bold ${isOverdue ? "text-rose-600 font-extrabold" : isLateCompleted ? "text-amber-700 font-bold" : "text-zinc-600"}`}>
                                  {task.dueDate} {task.dueTime}
                                </span>
                                {isLateCompleted && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-500/15 text-amber-700 border border-amber-500/30 rounded-md">
                                    ⚠️ Xong trễ (Note duyệt cuối tháng)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleToggleTaskComplete(task.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isLateCompleted
                                  ? "bg-amber-500 text-white shadow-2xs"
                                  : isCompleted
                                    ? "bg-emerald-500 text-white shadow-2xs"
                                    : "bg-zinc-100 text-zinc-700 hover:bg-[#2AC1BC] hover:text-white"
                                  }`}
                              >
                                {isLateCompleted ? "✓ Xong (Trễ hạn)" : isCompleted ? "✓ Đã xong" : "Xác nhận xong"}
                              </button>
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
                    <span>Hiển thị</span>
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
                    <span>/ trang</span>
                  </div>

                  <span className="hidden sm:inline text-zinc-300">|</span>

                  <div>
                    <span className="font-extrabold text-zinc-800">{(taskPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-extrabold text-zinc-800">{Math.min(taskPage * ITEMS_PER_PAGE, filteredTasks.length)}</span> trên tổng số <span className="font-extrabold text-zinc-800">{filteredTasks.length}</span> công việc
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
                        &larr; Trước
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
                        Sau &rarr;
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. Tab 2: Tenant Notifications Broadcast Section */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left border-collapse min-w-[950px]">
                <thead className="text-[11px] font-black text-zinc-500 uppercase bg-zinc-100/90 border-b border-zinc-200/80">
                  <tr>
                    <th className="px-4 py-3.5 whitespace-nowrap w-80">Phân loại & Tiêu đề</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Đối tượng nhận</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Kênh gửi</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Tỷ lệ đã đọc</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Thời gian đăng</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedNotifications.map((notif) => {
                    const readPct = Math.round((notif.readCount / notif.totalTarget) * 100);

                    return (
                      <tr key={notif.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="px-4 py-4 max-w-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase shrink-0 ${notif.category === "Khẩn cấp" ? "bg-rose-500/15 text-rose-600 border border-rose-500/30" :
                              notif.category === "Điện nước" ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
                                notif.category === "Tiền nhà" ? "bg-[#2AC1BC]/15 text-[#2AC1BC] border border-[#2AC1BC]/30" :
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

                        {/* Read Progress Bar */}
                        <td className="px-4 py-4 whitespace-nowrap min-w-[160px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-zinc-700">{notif.readCount}/{notif.totalTarget} Khách</span>
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
                          <button
                            onClick={() => setSelectedNotifDetail(notif)}
                            className="px-3 py-1.5 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notifications Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
              <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
                <span>Hiển thị</span>
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
                <span>/ trang</span>
              </div>

              <span className="hidden sm:inline text-zinc-300">|</span>

              <div>
                <span className="font-extrabold text-zinc-800">{(notifPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-extrabold text-zinc-800">{Math.min(notifPage * ITEMS_PER_PAGE, filteredNotifications.length)}</span> trên tổng số <span className="font-extrabold text-zinc-800">{filteredNotifications.length}</span> thông báo
              </div>
            </div>
            {(() => {
              const windowSize = 5;
              const windowStart = Math.floor((notifPage - 1) / windowSize) * windowSize + 1;
              const windowEnd = Math.min(windowStart + windowSize - 1, totalNotifPages);
              const visiblePages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

              return (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={notifPage === 1}
                    onClick={() => setNotifPage(Math.max(windowStart - windowSize, 1))}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    &larr; Trước
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
                    disabled={notifPage === totalNotifPages || windowStart + windowSize > totalNotifPages}
                    onClick={() => setNotifPage(Math.min(windowStart + windowSize, totalNotifPages))}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Sau &rarr;
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
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsTaskModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/20 text-[#2AC1BC] rounded-xl border border-[#2AC1BC]/30">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white">Giao việc cho nhân viên</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Tạo nhắc nhở và phân công nhiệm vụ cụ thể</p>
                </div>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-zinc-50/50">
              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Tên công việc <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kiểm tra máy lạnh rò nước phòng 102"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                />
              </div>

              {/* Assignee & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Nhân viên phụ trách</label>
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
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Phòng liên quan</label>
                  <input
                    type="text"
                    placeholder="VD: 101, 202 hoặc Hành lang"
                    value={taskRoom}
                    onChange={(e) => setTaskRoom(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] transition-all"
                  />
                </div>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Phân loại</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                  >
                    <option value="Bảo trì">Bảo trì / Sửa chữa</option>
                    <option value="Thu tiền">Thu tiền nhà / Cọc</option>
                    <option value="Kiểm tra">Kiểm tra / Chốt số</option>
                    <option value="Vệ sinh">Vệ sinh / Xịt muỗi</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Mức độ ưu tiên</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                  >
                    <option value="Gấp">Gấp / Ưu tiên</option>
                    <option value="Trung bình">Bình thường</option>
                    <option value="Thấp">Thấp</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Ngày hoàn thành</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Giờ hẹn xong</label>
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
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Ghi chú chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả cụ thể yêu cầu công việc..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] resize-none"
                />
              </div>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Tạo công việc mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL 2: Create Tenant Broadcast Modal (Synchronized Theme) */}
      {isNotifModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsNotifModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/20 text-[#2AC1BC] rounded-xl border border-[#2AC1BC]/30">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white">Soạn thông báo khách thuê</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Phát sóng sự việc đến ứng dụng di động khách thuê</p>
                </div>
              </div>
              <button
                onClick={() => setIsNotifModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-zinc-50/50">
              {/* Quick Template Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#2AC1BC]" /> Chọn mẫu thông báo nhanh
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
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Tiêu đề thông báo <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lịch cúp điện ngày 30/08"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                />
              </div>

              {/* Target & Channel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Đối tượng nhận</label>
                  <select
                    value={notifTargetScope}
                    onChange={(e) => setNotifTargetScope(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                  >
                    <option value={activeBuilding.name}>Toàn bộ tòa nhà ({activeBuilding.name})</option>
                    <option value="Tầng 1 & Tầng 2">Chỉ Tầng 1 & Tầng 2</option>
                    <option value="Tầng 3 & Tầng 4">Chỉ Tầng 3 & Tầng 4</option>
                    <option value="Phòng 101, 102, 103">Các phòng cụ thể chọn lọc</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Kênh phát sóng</label>
                  <select
                    value={notifChannel}
                    onChange={(e) => setNotifChannel(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                  >
                    <option value="Thông báo hệ thống">Thông báo hệ thống</option>
                    <option value="Zalo OA">Zalo Official Account</option>
                    <option value="SMS">Tin nhắn SMS trực tiếp</option>
                  </select>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Nội dung chi tiết <span className="text-rose-500">*</span></label>
                <textarea
                  rows={5}
                  required
                  placeholder="Nhập nội dung đầy đủ gửi đến khách thuê..."
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] resize-none"
                />
              </div>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNotifModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Phát sóng thông báo ngay
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
                <h3 className="text-sm font-bold text-white">Chi tiết thông báo</h3>
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
                  <span>Gửi lúc: {selectedNotifDetail.sentAt}</span>
                  <span>•</span>
                  <span>Kênh: {selectedNotifDetail.channel}</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 text-zinc-800 leading-relaxed whitespace-pre-line">
                {selectedNotifDetail.content}
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-zinc-700 font-bold">Tỷ lệ khách đọc App</span>
                </div>
                <span className="font-black text-blue-600 text-sm">
                  {selectedNotifDetail.readCount}/{selectedNotifDetail.totalTarget} Khách ({Math.round((selectedNotifDetail.readCount / selectedNotifDetail.totalTarget) * 100)}%)
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedNotifDetail(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
