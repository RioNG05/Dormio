"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  description?: string;
  duration?: number; // ms (default: 5000, 0 for infinite)
}

export interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const TYPE_CONFIGS: Record<
  ToastType,
  {
    icon: React.ComponentType<{ className?: string }>;
    cardBg: string;
    borderColor: string;
    shadowColor: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
    descColor: string;
    closeColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    cardBg: "bg-emerald-50/95 dark:bg-emerald-950/95",
    borderColor: "border-emerald-200/90 dark:border-emerald-800/70",
    shadowColor: "shadow-emerald-500/10",
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    titleColor: "text-emerald-950 dark:text-emerald-100",
    descColor: "text-emerald-800/90 dark:text-emerald-300",
    closeColor: "text-emerald-600/70 hover:text-emerald-900 dark:text-emerald-400/70 dark:hover:text-emerald-100",
  },
  error: {
    icon: AlertCircle,
    cardBg: "bg-rose-50/95 dark:bg-rose-950/95",
    borderColor: "border-rose-200/90 dark:border-rose-800/70",
    shadowColor: "shadow-rose-500/10",
    iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400",
    iconColor: "text-rose-600 dark:text-rose-400",
    titleColor: "text-rose-950 dark:text-rose-100",
    descColor: "text-rose-800/90 dark:text-rose-300",
    closeColor: "text-rose-600/70 hover:text-rose-900 dark:text-rose-400/70 dark:hover:text-rose-100",
  },
  warning: {
    icon: AlertTriangle,
    cardBg: "bg-amber-50/95 dark:bg-amber-950/95",
    borderColor: "border-amber-200/90 dark:border-amber-800/70",
    shadowColor: "shadow-amber-500/10",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
    titleColor: "text-amber-950 dark:text-amber-100",
    descColor: "text-amber-800/90 dark:text-amber-300",
    closeColor: "text-amber-600/70 hover:text-amber-900 dark:text-amber-400/70 dark:hover:text-amber-100",
  },
  info: {
    icon: Info,
    cardBg: "bg-teal-50/95 dark:bg-teal-950/95",
    borderColor: "border-teal-200/90 dark:border-teal-800/70",
    shadowColor: "shadow-[#2AC1BC]/10",
    iconBg: "bg-teal-100 text-[#2AC1BC] dark:bg-teal-900/60 dark:text-teal-400",
    iconColor: "text-[#2AC1BC] dark:text-[#2AC1BC]",
    titleColor: "text-teal-950 dark:text-teal-100",
    descColor: "text-teal-800/90 dark:text-teal-300",
    closeColor: "text-teal-600/70 hover:text-teal-900 dark:text-teal-400/70 dark:hover:text-teal-100",
  },
};

/**
 * Single Toast card component.
 * Features:
 * - Slide-in and fade-in entry animation
 * - Auto-dismiss with pause-on-hover
 * - Accessible alert roles
 * - Crisp typography and icon matching semantic status
 */
export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const { id, type, title, message, description, duration = 5000 } = toast;
  const config = TYPE_CONFIGS[type] || TYPE_CONFIGS.info;
  const IconComponent = config.icon;

  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef(duration);
  const startTimeRef = useRef<number>(Date.now());
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (remainingTimeRef.current <= 0) return;
    startTimeRef.current = Date.now();
    timerIdRef.current = setTimeout(() => {
      onDismiss(id);
    }, remainingTimeRef.current);
  }, [id, onDismiss]);

  const pauseTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  }, []);

  useEffect(() => {
    if (duration > 0 && !isPaused) {
      startTimer();
    }
    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, [duration, isPaused, startTimer]);

  const handleMouseEnter = () => {
    if (duration > 0) {
      setIsPaused(true);
      pauseTimer();
    }
  };

  const handleMouseLeave = () => {
    if (duration > 0) {
      setIsPaused(false);
    }
  };

  // Content display logic:
  // If title is given, message is description (or use explicit description)
  const displayTitle = title || (description ? message : undefined);
  const displayBody = title ? (description || message) : (description || message);

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full rounded-2xl border p-4 shadow-xl backdrop-blur-md
        flex items-start gap-3.5 transition-all duration-300 ease-out
        animate-in slide-in-from-right-8 fade-in
        ${config.cardBg} ${config.borderColor} ${config.shadowColor}`}
    >
      {/* Icon Badge */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${config.iconBg}`}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        {displayTitle && (
          <h4 className={`text-sm font-extrabold leading-snug tracking-tight ${config.titleColor}`}>
            {displayTitle}
          </h4>
        )}
        <p
          className={`text-xs font-medium leading-relaxed ${
            displayTitle ? `mt-0.5 ${config.descColor}` : config.titleColor
          }`}
        >
          {displayBody}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss toast"
        className={`p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer shrink-0 ${config.closeColor} hover:bg-black/5 dark:hover:bg-white/10`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Toast Container rendered at the TOP-RIGHT of the screen.
 */
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastCard toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </aside>
  );
}
