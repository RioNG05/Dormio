"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  notificationService,
  InAppNotification,
  resolveNotificationTarget,
} from "@/services/notification.service";
import {
  Bell,
  Sparkles,
  Receipt,
  FileText,
  Zap,
  AlertTriangle,
  CheckCheck,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";

interface NotificationBellProps {
  align?: "left" | "right";
  className?: string;
}

export default function NotificationBell({ align = "right", className = "" }: NotificationBellProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Read current user role from localStorage if present
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("dormio_user_role");
      setUserRole(role);
    }
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const list = await notificationService.getMyNotifications();
      setNotifications(list);
    } catch {
      // Keep existing state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (!n.isRead) {
          notificationService.markAsRead(n.id);
        }
        return { ...n, isRead: true };
      })
    );
  };

  const handleNotificationClick = (item: InAppNotification) => {
    // 1. Mark as read immediately in state & API
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      notificationService.markAsRead(item.id);
    }

    // 2. Resolve destination target
    const targetUrl = resolveNotificationTarget(item, userRole);

    if (targetUrl) {
      // Close dropdown & navigate
      setIsOpen(false);
      router.push(targetUrl);
    } else {
      // Informative/greeting notification — do not redirect
      // Kept open or acknowledged without page change
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      if (diffMins < 60) {
        return locale === "en" ? `${diffMins}m ago` : `${diffMins} phút trước`;
      }
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return locale === "en" ? `${diffHours}h ago` : `${diffHours} giờ trước`;
      }
      const diffDays = Math.floor(diffHours / 24);
      return locale === "en" ? `${diffDays}d ago` : `${diffDays} ngày trước`;
    } catch {
      return "";
    }
  };

  const getNotificationIcon = (type: string) => {
    const tLower = type.toLowerCase();
    if (tLower === "happy_new_year" || tLower.includes("greeting") || tLower.includes("tet")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    }
    if (
      tLower === "rental_payment" ||
      tLower === "billing_due" ||
      tLower.includes("invoice") ||
      tLower.includes("billing")
    ) {
      return (
        <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
          <Receipt className="w-4 h-4" />
        </div>
      );
    }
    if (tLower.includes("contract")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    if (tLower.includes("meter")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4" />
        </div>
      );
    }
    if (tLower.includes("grievance")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
        <Info className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all cursor-pointer focus:outline-none"
        aria-label={locale === "en" ? "Notifications" : "Thông báo"}
        title={locale === "en" ? "Notifications" : "Thông báo"}
      >
        <Bell className="w-5 h-5 transition-transform duration-200 active:scale-90" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Popover Panel */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-zinc-200 shadow-2xl z-50 overflow-hidden animate-scaleIn ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/70">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xs text-zinc-900 uppercase tracking-wider">
                {locale === "en" ? "Notifications" : "Thông báo"}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                  {unreadCount} {locale === "en" ? "new" : "mới"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{locale === "en" ? "Mark all read" : "Đọc tất cả"}</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-84 overflow-y-auto divide-y divide-zinc-100">
            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-orange-500/20 border-t-orange-600 animate-spin" />
                <span>{locale === "en" ? "Loading notifications..." : "Đang tải thông báo..."}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-zinc-700">
                  {locale === "en" ? "No notifications yet" : "Chưa có thông báo nào"}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {locale === "en"
                    ? "You will be notified about rental bills and updates."
                    : "Hệ thống sẽ gửi thông báo đến bạn khi có cập nhật mới."}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const targetUrl = resolveNotificationTarget(item, userRole);
                const hasRedirect = Boolean(targetUrl);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                      item.isRead ? "bg-white hover:bg-zinc-50/80" : "bg-orange-50/30 hover:bg-orange-50/60"
                    }`}
                  >
                    {getNotificationIcon(item.type)}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          className={`text-xs leading-snug line-clamp-1 ${
                            item.isRead ? "font-bold text-zinc-800" : "font-black text-zinc-900"
                          }`}
                        >
                          {item.title || item.content}
                        </h4>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>

                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-zinc-400 font-mono">
                          {formatTimeAgo(item.createdAt)}
                        </span>

                        {hasRedirect ? (
                          <span className="font-bold text-orange-600 hover:underline flex items-center gap-0.5">
                            <span>{locale === "en" ? "View details" : "Xem chi tiết"}</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-zinc-400 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>{locale === "en" ? "System announcement" : "Thông báo chung"}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-zinc-100 bg-zinc-50/50 text-center">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              {locale === "en" ? "Close" : "Đóng"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
