'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/context/LanguageContext'
import {
  notificationService,
  InAppNotification,
  resolveNotificationTarget,
  NOTIFICATION_EVENT_NAME,
} from '@/services/notification.service'
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
  UserCheck,
  Crown,
} from 'lucide-react'
import { Button, Text, Chip } from '@/components/ui'

interface NotificationBellProps {
  align?: 'left' | 'right'
  className?: string
}

interface PopoverPosition {
  left: number
  width: number
  placement: 'top' | 'bottom'
  maxHeight: number
}

export default function NotificationBell({
  align = 'right',
  className = '',
}: NotificationBellProps) {
  const router = useRouter()
  const t = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<PopoverPosition | null>(null)

  // Read current user role from localStorage if present
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('dormio_user_role')
      setUserRole(role)
    }
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const list = await notificationService.getMyNotifications()
      setNotifications(list)
    } catch {
      // Keep existing state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  // Listen for real-time local notification events
  useEffect(() => {
    const handleNotificationAdded = (event: Event) => {
      const customEvent = event as CustomEvent<InAppNotification>
      if (customEvent.detail) {
        setNotifications(prev => [
          customEvent.detail,
          ...prev.filter(n => n.id !== customEvent.detail.id),
        ])
      } else {
        loadNotifications()
      }
    }

    window.addEventListener(NOTIFICATION_EVENT_NAME, handleNotificationAdded)
    return () => {
      window.removeEventListener(NOTIFICATION_EVENT_NAME, handleNotificationAdded)
    }
  }, [])

  // Calculate dynamic responsive position to prevent overflow off any screen edge
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 12

    // Fluid responsive width: max 384px, or available screen width minus margins
    const popoverWidth = Math.min(384, Math.max(260, vw - margin * 2))

    // Calculate clamped horizontal offset relative to containerRef
    const preferredOffset = align === 'right' ? rect.width - popoverWidth : 0
    const minOffset = margin - rect.left
    const maxOffset = vw - margin - rect.left - popoverWidth
    const clampedOffset = Math.max(minOffset, Math.min(preferredOffset, maxOffset))

    // Calculate available vertical space and auto-flip if space below is limited
    const spaceBelow = vh - rect.bottom - margin
    const spaceAbove = rect.top - margin
    const placement: 'top' | 'bottom' = spaceBelow < 360 && spaceAbove > spaceBelow ? 'top' : 'bottom'
    const availableHeight = placement === 'bottom' ? spaceBelow - 16 : spaceAbove - 16
    const maxHeight = Math.max(240, Math.min(520, availableHeight))

    setPosition({
      left: clampedOffset,
      width: popoverWidth,
      placement,
      maxHeight,
    })
  }, [align])

  // Recalculate position on scroll or resize while popover is open
  useEffect(() => {
    if (!isOpen) return

    updatePosition()

    const handleResizeOrScroll = () => {
      updatePosition()
    }

    window.addEventListener('resize', handleResizeOrScroll, { passive: true })
    window.addEventListener('scroll', handleResizeOrScroll, { passive: true, capture: true })

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll)
      window.removeEventListener('scroll', handleResizeOrScroll, true)
    }
  }, [isOpen, updatePosition])

  // Close when clicking/tapping outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside, { passive: true })
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    await notificationService.markAllAsRead()
  }

  const handleNotificationClick = (item: InAppNotification) => {
    // 1. Mark as read immediately in state & API
    if (!item.isRead) {
      setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n)))
      notificationService.markAsRead(item.id)
    }

    // 2. Resolve destination target
    const targetUrl = resolveNotificationTarget(item, userRole)

    if (targetUrl) {
      // Close dropdown & navigate
      setIsOpen(false)
      router.push(targetUrl)
    } else {
      // Informative/greeting notification — do not redirect
    }
  }

  const handleToggleOpen = () => {
    if (!isOpen) {
      updatePosition()
      loadNotifications()
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  const formatTimeAgo = (isoDate: string) => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime()
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)))
      if (diffMins < 60) {
        return t('notificationsTimeMinutesAgo').replace('{mins}', String(diffMins))
      }
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) {
        return t('notificationsTimeHoursAgo').replace('{hours}', String(diffHours))
      }
      const diffDays = Math.floor(diffHours / 24)
      return t('notificationsTimeDaysAgo').replace('{days}', String(diffDays))
    } catch {
      return ''
    }
  }

  const getNotificationIcon = (type: string) => {
    const tLower = type.toLowerCase()
    if (
      tLower === 'account_registration_success' ||
      tLower.includes('register') ||
      tLower.includes('welcome')
    ) {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <UserCheck className="w-4 h-4" />
        </div>
      )
    }
    if (
      tLower === 'package_payment_success' ||
      tLower.includes('package') ||
      tLower.includes('subscription')
    ) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4" />
        </div>
      )
    }
    if (tLower === 'happy_new_year' || tLower.includes('greeting') || tLower.includes('tet')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-deposit-soft text-deposit flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
      )
    }
    if (
      tLower === 'rental_payment' ||
      tLower === 'billing_due' ||
      tLower.includes('invoice') ||
      tLower.includes('billing')
    ) {
      return (
        <div className="w-8 h-8 rounded-xl bg-accent-soft text-orange-600 flex items-center justify-center shrink-0">
          <Receipt className="w-4 h-4" />
        </div>
      )
    }
    if (tLower.includes('contract')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-info-soft text-info flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
      )
    }
    if (tLower.includes('meter')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-primary-soft text-cyan-600 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4" />
        </div>
      )
    }
    if (tLower.includes('grievance')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-danger-soft text-red-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-card-hover text-muted flex items-center justify-center shrink-0">
        <Info className="w-4 h-4" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Bell Trigger Button */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleToggleOpen}
        aria-label={t('notifications')}
        title={t('notifications')}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-danger text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Floating Popover Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={t('notifications')}
          style={{
            width: position ? `${position.width}px` : 'min(384px, calc(100vw - 24px))',
            left: position ? `${position.left}px` : 0,
            maxHeight: position ? `${position.maxHeight}px` : 'min(520px, 80vh)',
            transformOrigin: position?.placement === 'top' ? 'bottom' : 'top',
          }}
          className={`absolute ${
            position?.placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } bg-card rounded-2xl sm:rounded-3xl border border-line shadow-2xl z-50 overflow-hidden animate-scaleIn flex flex-col`}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface/70 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Text as="h3" size="xs" weight="black" color="default" uppercase className="tracking-wider shrink-0">
                {t('notifications')}
              </Text>
              {unreadCount > 0 && (
                <Chip variant="warning" size="sm">
                  {unreadCount} {t('notificationsNew')}
                </Chip>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleMarkAllAsRead}
                leftIcon={<CheckCheck className="text-primary w-3.5 h-3.5" />}
                className="shrink-0"
              >
                <Text color="brand" size="xs">
                  {t('notificationsMarkAllRead')}
                </Text>
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-line custom-scrollbar overscroll-contain">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-orange-500/20 border-t-orange-600 animate-spin" />
                <Text as="span" size="xs" color="subtle">
                  {t('notificationsLoading')}
                </Text>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-card-hover text-muted flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <Text size="xs" weight="bold" color="default">
                  {t('notificationsEmptyTitle')}
                </Text>
                <Text size="2xs" color="subtle">
                  {t('notificationsEmptyDesc')}
                </Text>
              </div>
            ) : (
              notifications.map(item => {
                const targetUrl = resolveNotificationTarget(item, userRole)
                const hasRedirect = Boolean(targetUrl)

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className="p-3 sm:p-3.5 transition-colors flex items-start gap-3 text-left bg-card hover:bg-card-hover cursor-pointer"
                  >
                    {getNotificationIcon(item.type)}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <Text
                          as="h4"
                          size="xs"
                          weight={item.isRead ? 'bold' : 'black'}
                          color={item.isRead ? 'secondary' : 'default'}
                          className="leading-snug line-clamp-1"
                        >
                          {item.title || item.content}
                        </Text>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0 mt-1" />
                        )}
                      </div>

                      <Text size="2xs" color="secondary" clamp={2} className="leading-relaxed break-words">
                        {item.content}
                      </Text>

                      <div className="flex items-center justify-between text-[10px] pt-1 gap-2 flex-wrap sm:flex-nowrap">
                        <Text as="span" size="3xs" color="subtle" mono className="shrink-0">
                          {formatTimeAgo(item.createdAt)}
                        </Text>

                        {hasRedirect ? (
                          <Button variant="ghost" size="xs" rightIcon={<ChevronRight className="text-accent w-3 h-3" />}>
                            <Text color="orange" size="xs" className="hover:underline">
                              {t('viewDetail')}
                            </Text>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="xs" leftIcon={<CheckCircle2 className="text-success w-3 h-3" />}>
                            <Text color="success" size="xs">
                              {t('notificationsSystemAnnouncement')}
                            </Text>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-line bg-surface/50 text-center shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              {t('close')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
