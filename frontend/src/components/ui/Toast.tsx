'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { Text } from './Text'
import { Button } from './Button'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  description?: string
  duration?: number // ms (default: 5000, 0 for infinite)
}

export interface ToastCardProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

const TYPE_CONFIGS: Record<
  ToastType,
  {
    icon: React.ComponentType<{ className?: string }>
    cardBg: string
    borderColor: string
    shadowColor: string
    iconBg: string
    iconColor: string
    titleColor: string
    descColor: string
    closeColor: string
  }
> = {
  success: {
    icon: CheckCircle2,
    cardBg: 'bg-card/95 backdrop-blur-md',
    borderColor: 'border-success-subtle',
    shadowColor: 'shadow-success/10',
    iconBg: 'bg-success-soft text-success',
    iconColor: 'text-success',
    titleColor: 'text-foreground',
    descColor: 'text-muted',
    closeColor:
      'text-muted hover:text-foreground',
  },
  error: {
    icon: AlertCircle,
    cardBg: 'bg-card/95 backdrop-blur-md',
    borderColor: 'border-danger-subtle',
    shadowColor: 'shadow-danger/10',
    iconBg: 'bg-danger-soft text-danger',
    iconColor: 'text-danger',
    titleColor: 'text-foreground',
    descColor: 'text-muted',
    closeColor:
      'text-muted hover:text-foreground',
  },
  warning: {
    icon: AlertTriangle,
    cardBg: 'bg-card/95 backdrop-blur-md',
    borderColor: 'border-warning-subtle',
    shadowColor: 'shadow-warning/10',
    iconBg: 'bg-warning-soft text-warning',
    iconColor: 'text-warning',
    titleColor: 'text-foreground',
    descColor: 'text-muted',
    closeColor:
      'text-muted hover:text-foreground',
  },
  info: {
    icon: Info,
    cardBg: 'bg-card/95 backdrop-blur-md',
    borderColor: 'border-primary-subtle',
    shadowColor: 'shadow-primary/10',
    iconBg: 'bg-primary-soft text-primary',
    iconColor: 'text-primary',
    titleColor: 'text-foreground',
    descColor: 'text-muted',
    closeColor:
      'text-muted hover:text-foreground',
  },
}

/**
 * Single Toast card component.
 * Features:
 * - Slide-in and fade-in entry animation
 * - Auto-dismiss with pause-on-hover
 * - Accessible alert roles
 * - Crisp typography and icon matching semantic status
 */
export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const { id, type, title, message, description, duration = 5000 } = toast
  const config = TYPE_CONFIGS[type] || TYPE_CONFIGS.info
  const IconComponent = config.icon

  const [isPaused, setIsPaused] = useState(false)
  const remainingTimeRef = useRef(duration)
  const startTimeRef = useRef<number>(Date.now())
  const timerIdRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = useCallback(() => {
    if (remainingTimeRef.current <= 0) return
    startTimeRef.current = Date.now()
    timerIdRef.current = setTimeout(() => {
      onDismiss(id)
    }, remainingTimeRef.current)
  }, [id, onDismiss])

  const pauseTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current)
      timerIdRef.current = null
    }
    const elapsed = Date.now() - startTimeRef.current
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
  }, [])

  useEffect(() => {
    if (duration > 0 && !isPaused) {
      startTimer()
    }
    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current)
      }
    }
  }, [duration, isPaused, startTimer])

  const handleMouseEnter = () => {
    if (duration > 0) {
      setIsPaused(true)
      pauseTimer()
    }
  }

  const handleMouseLeave = () => {
    if (duration > 0) {
      setIsPaused(false)
    }
  }

  // Content display logic:
  // If title is given, message is description (or use explicit description)
  const displayTitle = title || (description ? message : undefined)
  const displayBody = title ? description || message : description || message

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
          <Text
            as="h4"
            size="sm"
            weight="extrabold"
            color="inherit"
            className={`leading-snug tracking-tight ${config.titleColor}`}
          >
            {displayTitle}
          </Text>
        )}
        <Text
          as="p"
          size="xs"
          weight="medium"
          color="inherit"
          className={`leading-relaxed ${
            displayTitle ? `mt-0.5 ${config.descColor}` : config.titleColor
          }`}
        >
          {displayBody}
        </Text>
      </div>

      {/* Dismiss Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss toast"
        className={`!h-6 !w-6 -mr-1 -mt-1 rounded-lg shrink-0 ${config.closeColor} hover:bg-black/5 dark:hover:bg-white/10`}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

/**
 * Toast Container rendered at the TOP-RIGHT of the screen.
 */
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <aside
      aria-label="Notifications"
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-full pointer-events-none"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastCard toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </aside>
  )
}
