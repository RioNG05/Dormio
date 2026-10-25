'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations } from '@/context/LanguageContext'
import {
  Megaphone,
  Bell,
  Mail,
  MessageSquare,
  Send,
  AlertCircle,
  Search,
  X,
  Plus,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  Check,
  Loader2,
  Phone,
} from 'lucide-react'
import {
  adminNotificationService,
  MassNotificationStatusCounts,
  AdminNotifyChannel,
} from '@/services/admin-notification.service'
import {
  Button,
  TableActionButton,
  Checkbox,
  TextInput,
  TextareaInput,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  Card,
  TableRow,
  Modal,
  EmptyState,
  Avatar,
} from '@/components/ui'
import { DashboardPageHeader } from '@/components/layout'
import { adminUsersService, AdminUserItem } from '@/services/admin-users.service'

interface SelectedUserRecipient {
  id: string
  name: string
  phoneNumber?: string
  email?: string
  role?: string
  avatarUrl?: string | null
}

interface NotificationCampaign {
  id: string
  name: string
  title: string
  content: string
  targetGroup:
    | 'all_users'
    | 'all_landlords'
    | 'all_tenants'
    | 'all_staff'
    | 'all_admins'
    | 'specific_user'
  targetLabel: string
  targetId?: string
  channels: ('in_app' | 'email' | 'sms' | 'zalo')[]
  status: 'sent' | 'pending' | 'failed' | 'canceled'
  totalRecipients: number
  sentCount: number
  failedCount: number
  createdAt: string
  scheduledFor?: string
  createdBy: string
}

export default function AdminNotificationsPage() {
  const t = useTranslations('admin')

  // Rule #9: Standardized View & Pagination
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid') // Grid is ALWAYS default
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6) // Default 6 for grid, 10 for table

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'sent' | 'pending' | 'failed' | 'canceled'
  >('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Composer Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [composeName, setComposeName] = useState('')
  const [composeTitle, setComposeTitle] = useState('')
  const [composeContent, setComposeContent] = useState('')
  const [composeTarget, setComposeTarget] =
    useState<NotificationCampaign['targetGroup']>('all_users')
  const [specificUserId, setSpecificUserId] = useState('')
  // Selected specific user recipients
  const [selectedRecipients, setSelectedRecipients] = useState<SelectedUserRecipient[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<AdminUserItem[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [userSearchDropdownOpen, setUserSearchDropdownOpen] = useState(false)
  const userSearchDropdownRef = React.useRef<HTMLDivElement>(null)

  const [composeChannels, setComposeChannels] = useState<('in_app' | 'email' | 'sms' | 'zalo')[]>([
    'in_app',
  ])
  const [composeScheduleType, setComposeScheduleType] = useState<'now' | 'later'>('now')
  const [composeScheduleTime, setComposeScheduleTime] = useState('')
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    channels?: string
    targetId?: string
    title?: string
    content?: string
    scheduleTime?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inspect Campaign Modal
  const [inspectCampaign, setInspectCampaign] = useState<NotificationCampaign | null>(null)

  // Rule #10: Modal Reset Confirmation Pop-up
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean
    onDiscard: () => void
  }>({ isOpen: false, onDiscard: () => {} })

  // Data & State
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveCounts, setLiveCounts] = useState<MassNotificationStatusCounts | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!feedbackMsg) return
    const timer = setTimeout(() => setFeedbackMsg(null), 4000)
    return () => clearTimeout(timer)
  }, [feedbackMsg])

  // Click outside listener for user search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userSearchDropdownRef.current &&
        !userSearchDropdownRef.current.contains(event.target as Node)
      ) {
        setUserSearchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search for users by name, phone or email
  useEffect(() => {
    if (composeTarget !== 'specific_user') {
      setUserSearchResults([])
      return
    }

    const q = userSearchQuery.trim()
    if (!q) {
      setUserSearchResults([])
      setIsSearchingUsers(false)
      return
    }

    setIsSearchingUsers(true)
    const timer = setTimeout(async () => {
      try {
        const res = await adminUsersService.getUsers({
          query: q,
          limit: 10,
        })
        setUserSearchResults(res?.items || [])
      } catch (err) {
        console.error('Error searching users:', err)
        setUserSearchResults([])
      } finally {
        setIsSearchingUsers(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [userSearchQuery, composeTarget])

  const handleToggleSelectUser = (u: AdminUserItem) => {
    setSelectedRecipients(prev => {
      const exists = prev.some(item => item.id === u.id)
      if (exists) {
        return prev.filter(item => item.id !== u.id)
      } else {
        const displayName = u.fullName || u.username || u.phoneNumber || u.email || 'User'
        return [
          ...prev,
          {
            id: u.id,
            name: displayName,
            phoneNumber: u.phoneNumber,
            email: u.email || undefined,
            role: u.role,
            avatarUrl: u.avatarUrl,
          },
        ]
      }
    })
    if (fieldErrors.targetId) {
      setFieldErrors(prev => ({ ...prev, targetId: undefined }))
    }
  }

  const handleRemoveRecipient = (userId: string) => {
    setSelectedRecipients(prev => prev.filter(u => u.id !== userId))
  }

  const handleClearAllRecipients = () => {
    setSelectedRecipients([])
  }

  // Fetch campaigns from backend
  const fetchCampaigns = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      try {
        const listRes = await adminNotificationService.getMassNotificationJobs({
          page: 1,
          limit: 100,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          channel: channelFilter !== 'all' ? channelFilter : undefined,
        })

        if (listRes?.items) {
          const mapped: NotificationCampaign[] = listRes.items.map((item: any) => ({
            id: item.id,
            name: item.name || item.title,
            title: item.title,
            content: item.content,
            targetGroup: (item.targetType as any) || 'all_users',
            targetLabel: item.targetLabel || item.targetType,
            targetId: item.targetId,
            channels: (item.channels as any) || [item.channel] || ['in_app'],
            status: (item.status as any) || 'sent',
            totalRecipients: item.totalRecipients || 0,
            sentCount: item.sentCount || 0,
            failedCount: item.failedCount || 0,
            createdAt: item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '---',
            scheduledFor: item.scheduledFor,
            createdBy: item.createdBy || 'Admin',
          }))

          setCampaigns(mapped)
        }

        if (listRes?.counts) {
          setLiveCounts(listRes.counts)
        }
      } catch (err: any) {
        console.error('Failed to load mass notifications:', err)
        setError(t('adminNotifyLoadError'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [statusFilter, channelFilter, t],
  )

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // Client-side search and filtering
  const filteredCampaigns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return campaigns.filter(c => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)

      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      const matchChannel = channelFilter === 'all' || c.channels.includes(channelFilter as any)

      return matchSearch && matchStatus && matchChannel
    })
  }, [campaigns, searchQuery, statusFilter, channelFilter])

  // Pagination calculation
  const totalItems = filteredCampaigns.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === 'grid' ? 6 : 10))

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * validPageSize
    return filteredCampaigns.slice(start, start + validPageSize)
  }, [filteredCampaigns, safeCurrentPage, validPageSize])

  // Switch view mode
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    setPageSize(mode === 'grid' ? 6 : 10)
    setCurrentPage(1)
  }

  // Selection handlers
  const isAllCurrentSelected = useMemo(() => {
    if (paginatedItems.length === 0) return false
    return paginatedItems.every(item => selectedIds.includes(item.id))
  }, [paginatedItems, selectedIds])

  const toggleSelectAllCurrent = () => {
    if (isAllCurrentSelected) {
      const currentIds = new Set(paginatedItems.map(i => i.id))
      setSelectedIds(prev => prev.filter(id => !currentIds.has(id)))
    } else {
      const newIds = new Set([...selectedIds, ...paginatedItems.map(i => i.id)])
      setSelectedIds(Array.from(newIds))
    }
  }

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    )
  }

  // Compose flow with Rule #10 validation
  const resetComposeForm = useCallback(() => {
    setComposeName('')
    setComposeTitle('')
    setComposeContent('')
    setComposeTarget('all_users')
    setSpecificUserId('')
    setComposeChannels(['in_app'])
    setComposeScheduleType('now')
    setComposeScheduleTime('')
    setFormError('')
    setFieldErrors({})
    setIsSubmitting(false)
  }, [])

  const isComposeDirty = useMemo(() => {
    return Boolean(
      composeName.trim() ||
      composeTitle.trim() ||
      composeContent.trim() ||
      selectedRecipients.length > 0 ||
      userSearchQuery.trim() ||
      specificUserId.trim() ||
      composeChannels.length > 1 ||
      !composeChannels.includes('in_app') ||
      composeScheduleType !== 'now',
    )
  }, [
    composeName,
    composeTitle,
    composeContent,
    selectedRecipients,
    userSearchQuery,
    specificUserId,
    composeChannels,
    composeScheduleType,
  ])

  const handleOpenCompose = () => {
    resetComposeForm()
    setIsComposeOpen(true)
  }

  const handleRequestCloseComposer = () => {
    if (isComposeDirty) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          resetComposeForm()
          setIsComposeOpen(false)
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })
        },
      })
    } else {
      resetComposeForm()
      setIsComposeOpen(false)
    }
  }

  const toggleComposeChannel = (channel: 'in_app' | 'email' | 'sms' | 'zalo') => {
    setComposeChannels(prev =>
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel],
    )
  }

  // Submit Mass Notification
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const errors: typeof fieldErrors = {}

    if (composeChannels.length === 0) {
      errors.channels = t('adminNotifyErrorNoChannel')
    }
    if (composeTarget === 'specific_user' && selectedRecipients.length === 0) {
      errors.targetId = t('adminNotifyErrorTargetUsersRequired')
    }
    if (!composeTitle.trim() || composeTitle.trim().length < 3) {
      errors.title = t('adminNotifyErrorTitleLength')
    }
    if (!composeContent.trim() || composeContent.trim().length < 5) {
      errors.content = t('adminNotifyErrorContentLength')
    }
    if (composeScheduleType === 'later' && !composeScheduleTime) {
      errors.scheduleTime = t('adminNotifyErrorScheduleTime')
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const targetIds = selectedRecipients.map(u => u.id)
      await adminNotificationService.createMassNotificationJob({
        channel: (composeChannels[0] as AdminNotifyChannel) || 'in_app',
        channels: composeChannels as AdminNotifyChannel[],
        targetType: composeTarget as any,
        targetId: composeTarget === 'specific_user' ? targetIds[0] : undefined,
        targetIds: composeTarget === 'specific_user' ? targetIds : undefined,
        title: composeTitle.trim(),
        content: composeContent.trim(),
      })

      setFeedbackMsg({
        type: 'success',
        text:
          composeScheduleType === 'later'
            ? t('adminNotifyCampaignScheduledSuccess')
            : t('adminNotifyCampaignDispatchedSuccess'),
      })

      setIsComposeOpen(false)
      resetComposeForm()
      fetchCampaigns(true)
    } catch (err: any) {
      console.error('Failed to submit mass notification:', err)
      setFormError(err?.response?.data?.message || t('adminNotifySubmitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Retry campaign
  const handleRetryCampaign = async (campaignId: string) => {
    try {
      await adminNotificationService.retryMassNotificationJob(campaignId)
      setFeedbackMsg({
        type: 'success',
        text: t('adminNotifyRetrySuccess'),
      })
      if (inspectCampaign?.id === campaignId) {
        setInspectCampaign(null)
      }
      fetchCampaigns(true)
    } catch (err) {
      console.error('Retry failed:', err)
    }
  }

  // Render channel badges
  const renderChannelBadges = (channels: NotificationCampaign['channels']) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {channels.map(ch => {
        switch (ch) {
          case 'in_app':
            return (
              <span
                key={ch}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-info-soft text-info border border-info-subtle"
              >
                <Bell className="w-3 h-3" />
                In-App
              </span>
            )
          case 'email':
            return (
              <span
                key={ch}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-deposit-soft text-deposit border border-deposit-subtle"
              >
                <Mail className="w-3 h-3" />
                Email
              </span>
            )
          case 'sms':
            return (
              <span
                key={ch}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-warning-soft text-warning border border-warning-subtle"
              >
                <Smartphone className="w-3 h-3" />
                SMS
              </span>
            )
          case 'zalo':
            return (
              <span
                key={ch}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-primary-soft text-primary border border-primary-subtle"
              >
                <MessageSquare className="w-3 h-3" />
                Zalo ZNS
              </span>
            )
        }
      })}
    </div>
  )

  const renderStatusBadge = (status: NotificationCampaign['status']) => {
    switch (status) {
      case 'sent':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-success-soft text-success border border-success-subtle">
            {t('adminNotifyStatusSent')}
          </span>
        )
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-info-soft text-info border border-info-subtle">
            {t('adminNotifyStatusPending')}
          </span>
        )
      case 'failed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-danger-soft text-danger border border-danger-subtle">
            {t('adminNotifyStatusFailed')}
          </span>
        )
      case 'canceled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-card-hover text-muted border border-line">
            {t('adminNotifyStatusCanceled')}
          </span>
        )
    }
  }

  const getTargetLabel = (target: NotificationCampaign['targetGroup']) => {
    switch (target) {
      case 'all_users':
        return t('adminNotifyTargetAllUsers')
      case 'all_landlords':
        return t('adminNotifyTargetAllLandlords')
      case 'all_tenants':
        return t('adminNotifyTargetAllTenants')
      case 'all_staff':
        return t('adminNotifyTargetAllStaff')
      case 'all_admins':
        return t('adminNotifyTargetAllAdmins')
      case 'specific_user':
        return t('adminNotifyTargetSpecificUser')
      default:
        return target
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed top-4 right-4 z-70 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-success-soft text-success border-success-subtle'
              : 'bg-danger-soft text-danger border-danger-subtle'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setFeedbackMsg(null)}
            className="ml-2"
          >
            <X />
          </Button>
        </div>
      )}

      {/* Header using DashboardPageHeader with size='md' action buttons */}
      <DashboardPageHeader
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-accent-soft text-accent tracking-wide uppercase">
              <Megaphone className="w-3.5 h-3.5" />
              {t('adminNotifyBadge')}
            </span>
            <span className="text-xs font-semibold text-muted">
              • {t('adminNotifySubbadge')}
            </span>
          </div>
        }
        title={t('adminNotifyTitle')}
        subtitle={t('adminNotifySubtitle')}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchCampaigns(true)}
              isLoading={refreshing}
              leftIcon={<RefreshCw />}
            >
              <span className="hidden sm:inline">{t('adminNotifyRefresh')}</span>
            </Button>
            <Button
              size="md"
              onClick={handleOpenCompose}
              leftIcon={<Plus />}
            >
              <span>{t('adminNotifyBtnCompose')}</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-line text-foreground shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider block text-muted">
            {t('adminNotifyTotalCampaigns')}
          </span>
          {loading ? (
            <div className="h-5 w-12 bg-line/60 rounded animate-pulse my-0.5" />
          ) : (
            <span className="text-xl font-black leading-tight block text-foreground">
              {campaigns.length}
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-success-soft border border-success-subtle text-success shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider block text-success">
            {t('adminNotifySent')}
          </span>
          {loading ? (
            <div className="h-5 w-12 bg-emerald-200/60 rounded animate-pulse my-0.5" />
          ) : (
            <span className="text-xl font-black leading-tight block">
              {liveCounts ? liveCounts.sent : campaigns.filter(c => c.status === 'sent').length}
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-info-soft border border-info-subtle text-info shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider block text-info">
            {t('adminNotifyPending')}
          </span>
          {loading ? (
            <div className="h-5 w-12 bg-blue-200/60 rounded animate-pulse my-0.5" />
          ) : (
            <span className="text-xl font-black leading-tight block">
              {liveCounts ? liveCounts.pending : campaigns.filter(c => c.status === 'pending').length}
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-danger-soft border border-danger-subtle text-danger shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider block text-danger">
            {t('adminNotifyFailed')}
          </span>
          {loading ? (
            <div className="h-5 w-12 bg-orange-200/60 rounded animate-pulse my-0.5" />
          ) : (
            <span className="text-xl font-black leading-tight block">
              {liveCounts ? liveCounts.failed : campaigns.filter(c => c.status === 'failed').length}
            </span>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-danger-soft border border-danger-subtle rounded-2xl text-danger text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="md" onClick={() => fetchCampaigns()}>
            {t('adminBlogsRetry')}
          </Button>
        </div>
      )}

      {/* Control Bar: Search, Filters, View Mode */}
      <FilterToolbar
        search={
          <TextInput
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={t('adminNotifySearchPlaceholder')}
            containerClassName="w-full space-y-0"
            className="py-2 bg-surface border-line rounded-xl text-xs font-semibold text-foreground placeholder:text-muted focus:border-primary transition-all"
            leftIcon={<Search className="w-4 h-4 text-muted" />}
            rightIcon={
              searchQuery ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setSearchQuery('')}
                >
                  <X />
                </Button>
              ) : undefined
            }
          />
        }
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-line text-xs font-semibold">
              {(['all', 'sent', 'pending', 'failed', 'canceled'] as const).map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? 'secondary' : 'ghost'}
                  onClick={() => {
                    setStatusFilter(s)
                    setCurrentPage(1)
                  }}
                  className="rounded-lg text-xs"
                >
                  {s === 'all'
                    ? t('adminNotifyFilterStatusAll')
                    : s === 'sent'
                      ? t('adminNotifyStatusSent')
                      : s === 'pending'
                        ? t('adminNotifyStatusPending')
                        : s === 'failed'
                          ? t('adminNotifyStatusFailed')
                          : t('adminNotifyStatusCanceled')}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-line text-xs font-semibold">
              {(['all', 'in_app', 'email', 'sms', 'zalo'] as const).map(ch => (
                <Button
                  key={ch}
                  size="sm"
                  variant={channelFilter === ch ? 'secondary' : 'ghost'}
                  onClick={() => {
                    setChannelFilter(ch)
                    setCurrentPage(1)
                  }}
                  className="rounded-lg text-xs"
                >
                  {ch === 'all'
                    ? t('adminNotifyAllChannels')
                    : ch === 'in_app'
                      ? 'In-App'
                      : ch === 'email'
                        ? 'Email'
                        : ch === 'sms'
                          ? 'SMS'
                          : 'Zalo'}
                </Button>
              ))}
            </div>
          </div>
        }
        viewMode={
          <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
        }
      />

      {/* Main Content: Parallel Grid & Table Views */}
      {viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9: Default Grid view) */
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-line p-5 space-y-4 animate-pulse"
              >
                <div className="h-4 bg-line rounded w-1/3" />
                <div className="h-5 bg-line rounded w-3/4" />
                <div className="h-12 bg-card-hover rounded-xl" />
                <div className="h-4 bg-line rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : paginatedItems.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="w-10 h-10 text-muted" />}
            title={t('adminNotifyNoCampaignsFound')}
            description={t('adminNotifyTryAdjustingFilter')}
            action={
              <Button size="md" onClick={handleOpenCompose} leftIcon={<Plus />}>
                {t('adminNotifyBtnCompose')}
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedItems.map(item => {
              const percent =
                item.totalRecipients > 0
                  ? Math.min(100, Math.round((item.sentCount / item.totalRecipients) * 100))
                  : 0

              return (
                <Card
                  key={item.id}
                  interactive
                  onClick={() => setInspectCampaign(item)}
                  className="overflow-hidden flex flex-col justify-between group cursor-pointer border border-line hover:border-primary/50 transition-all duration-200 p-5 space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-foreground/90 bg-card-hover px-2 py-0.5 rounded-md">
                        {item.id}
                      </span>
                      {renderStatusBadge(item.status)}
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <h4 className="text-xs font-bold text-orange-600 line-clamp-1 mt-0.5">
                        {item.title}
                      </h4>
                    </div>

                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-line space-y-3 text-xs">
                    {/* Target & Channels */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-muted bg-card-hover px-2 py-0.5 rounded-md">
                        {getTargetLabel(item.targetGroup)}
                      </span>
                      {renderChannelBadges(item.channels)}
                    </div>

                    {/* Dispatch Stats Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-muted">
                          {item.sentCount.toLocaleString()} / {item.totalRecipients.toLocaleString()}{' '}
                          {t('adminNotifyRecipientsUnit')}
                        </span>
                        <span className="text-success">{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-card-hover overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    {/* Footer Date & Status (View button removed; clicking card inspects) */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted">
                      <span>{item.createdAt}</span>
                      <span className="font-semibold text-foreground/80">
                        {item.createdBy}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        /* TABLE VIEW (Row click navigates/inspects; view button removed) */
        <div className="bg-card rounded-2xl border border-line overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface border-b border-line font-bold text-muted">
                <th className="p-3.5 w-10">
                  <Checkbox
                    checked={isAllCurrentSelected}
                    onChange={toggleSelectAllCurrent}
                    size="sm"
                  />
                </th>
                <th className="p-3.5">{t('adminNotifyThIdName')}</th>
                <th className="p-3.5">{t('adminNotifyThTargetChannels')}</th>
                <th className="p-3.5">{t('adminNotifyThContent')}</th>
                <th className="p-3.5">{t('adminNotifyThProgress')}</th>
                <th className="p-3.5">{t('adminNotifyThStatus')}</th>
                <th className="p-3.5 text-right">{t('adminNotifyThActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paginatedItems.map(item => {
                const isSelected = selectedIds.includes(item.id)
                const percent =
                  item.totalRecipients > 0
                    ? Math.min(100, Math.round((item.sentCount / item.totalRecipients) * 100))
                    : 0

                return (
                  <TableRow
                    key={item.id}
                    interactive
                    onClick={() => setInspectCampaign(item)}
                    className={isSelected ? 'bg-primary/5' : ''}
                  >
                    <td className="p-3.5" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        size="sm"
                      />
                    </td>

                    <td className="p-3.5 space-y-0.5">
                      <span className="font-mono text-xs font-black text-foreground/90 bg-card-hover px-2 py-0.5 rounded-md inline-block">
                        {item.id}
                      </span>
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-muted">{item.createdAt}</div>
                    </td>

                    <td className="p-3.5 space-y-1.5">
                      <span className="font-semibold text-muted bg-card-hover px-2 py-0.5 rounded-md inline-block">
                        {getTargetLabel(item.targetGroup)}
                      </span>
                      <div>{renderChannelBadges(item.channels)}</div>
                    </td>

                    <td className="p-3.5 max-w-xs space-y-0.5">
                      <div className="font-bold text-orange-600 line-clamp-1">{item.title}</div>
                      <div className="text-muted line-clamp-1">{item.content}</div>
                    </td>

                    <td className="p-3.5 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span>{item.sentCount.toLocaleString()}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-line overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">{renderStatusBadge(item.status)}</td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      {item.status === 'failed' || item.status === 'pending' ? (
                        <TableActionButton
                          icon={<RotateCcw />}
                          onClick={() => handleRetryCampaign(item.id)}
                          title={t('adminRetry')}
                        />
                      ) : (
                        <span className="text-[11px] text-muted font-medium">--</span>
                      )}
                    </td>
                  </TableRow>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Standardized Pagination Bar */}
      <Pagination
        currentPage={safeCurrentPage}
        totalItems={totalItems}
        pageSize={validPageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeMax={100}
      />

      {/* COMPOSE CAMPAIGN MODAL using @/components/ui Modal with size='md' buttons */}
      <Modal
        isOpen={isComposeOpen}
        onClose={handleRequestCloseComposer}
        size="2xl"
        icon={<Megaphone className="w-5 h-5 text-primary" />}
        title={t('adminNotifyComposeTitle')}
        asForm
        onSubmit={handleSendCampaign}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={handleRequestCloseComposer}
              disabled={isSubmitting}
            >
              {t('adminNotifyBtnCancel')}
            </Button>
            <Button
              type="submit"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<Send />}
            >
              {t('adminNotifyBtnSubmit')}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-danger-soft border border-danger-subtle text-danger text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
              <span>{formError}</span>
            </div>
          )}

          <TextInput
            label={t('adminNotifyCampaignName')}
            value={composeName}
            onChange={e => setComposeName(e.target.value)}
            placeholder={t('adminNotifyCampaignNamePlaceholder')}
          />

          {/* Delivery Channels */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground/90 block">
                {t('adminNotifyDeliveryChannels')}
                <span className="text-danger ml-1 font-bold">*</span>
              </label>
              <span className="text-[11px] font-bold text-muted">
                {composeChannels.length} {t('adminNotifyAllChannels')}
              </span>
            </div>
            <div
              className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${fieldErrors.channels ? 'p-1.5 rounded-2xl ring-2 ring-danger bg-danger/5' : ''}`}
            >
              {[
                { id: 'in_app' as const, label: 'In-App Notification', icon: Bell },
                { id: 'email' as const, label: 'Email Broadcast', icon: Mail },
                { id: 'sms' as const, label: 'SMS Brandname', icon: Smartphone },
                { id: 'zalo' as const, label: 'Zalo ZNS', icon: MessageSquare },
              ].map(ch => {
                const isSelected = composeChannels.includes(ch.id)
                const Icon = ch.icon
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      toggleComposeChannel(ch.id)
                      if (fieldErrors.channels)
                        setFieldErrors(prev => ({ ...prev, channels: undefined }))
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'border-line bg-surface hover:bg-card-hover text-foreground/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className="w-4 h-4" />
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-primary bg-primary text-white'
                            : 'border-line'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-card" />}
                      </div>
                    </div>
                    <span className="text-[11px] leading-tight font-bold">{ch.label}</span>
                  </button>
                )
              })}
            </div>
            {fieldErrors.channels && (
              <p className="text-[11px] text-danger font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.channels}</span>
              </p>
            )}
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground/90 block">
              {t('adminNotifyTargetGroup')}
              <span className="text-danger ml-1 font-bold">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'all_users' as const, label: t('adminNotifyTargetAllUsers') },
                { id: 'all_landlords' as const, label: t('adminNotifyTargetAllLandlords') },
                { id: 'all_tenants' as const, label: t('adminNotifyTargetAllTenants') },
                { id: 'all_staff' as const, label: t('adminNotifyTargetAllStaff') },
                { id: 'all_admins' as const, label: t('adminNotifyTargetAllAdmins') },
                { id: 'specific_user' as const, label: t('adminNotifyTargetSpecificUser') },
              ].map(tgt => (
                <Button
                  key={tgt.id}
                  variant={composeTarget === tgt.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setComposeTarget(tgt.id)
                    if (tgt.id !== 'specific_user' && fieldErrors.targetId) {
                      setFieldErrors(prev => ({ ...prev, targetId: undefined }))
                    }
                  }}
                >
                  {tgt.label}
                </Button>
              ))}
            </div>

            {composeTarget === 'specific_user' && (
              <div ref={userSearchDropdownRef} className="space-y-2.5 pt-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground/90 block">
                    {t('adminNotifyTargetSpecificUser')}
                    <span className="text-danger ml-1 font-bold">*</span>
                  </label>
                  {selectedRecipients.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {t('adminNotifySelectedUsersCount', { count: selectedRecipients.length })}
                      </span>
                      {selectedRecipients.length >= 2 && (
                        <button
                          type="button"
                          onClick={handleClearAllRecipients}
                          className="text-[11px] text-danger hover:underline font-semibold"
                        >
                          {t('adminNotifyClearAllSelected')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected users chips shelf */}
                {selectedRecipients.length > 0 && (
                  <div className="p-2.5 rounded-2xl bg-surface border border-line flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {selectedRecipients.map(u => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-card border border-line text-foreground text-xs shadow-xs hover:border-primary/50 transition-colors"
                      >
                        <Avatar src={u.avatarUrl || undefined} name={u.name} size="xs" />
                        <div className="flex flex-col">
                          <span className="font-bold leading-tight line-clamp-1 max-w-[140px] sm:max-w-[180px]">
                            {u.name}
                          </span>
                          <span className="text-[10px] text-muted leading-tight">
                            {u.phoneNumber || u.email || u.role}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(u.id)}
                          className="w-5 h-5 rounded-lg hover:bg-danger-soft text-muted hover:text-danger flex items-center justify-center transition-colors ml-1"
                          title="Bỏ chọn"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search Bar Input */}
                <div className="relative">
                  <TextInput
                    placeholder={t('adminNotifySearchUserPlaceholder')}
                    value={userSearchQuery}
                    onChange={e => {
                      setUserSearchQuery(e.target.value)
                      setUserSearchDropdownOpen(true)
                    }}
                    onFocus={() => setUserSearchDropdownOpen(true)}
                    leftIcon={<Search className="w-4 h-4 text-muted" />}
                    rightIcon={
                      isSearchingUsers ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : userSearchQuery ? (
                        <button
                          type="button"
                          onClick={() => setUserSearchQuery('')}
                          className="text-muted hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : null
                    }
                    className="bg-surface"
                    error={fieldErrors.targetId}
                  />

                  {/* Dropdown Results */}
                  {userSearchDropdownOpen && userSearchQuery.trim().length > 0 && (
                    <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-card border border-line rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      {isSearchingUsers ? (
                        <div className="p-4 flex items-center justify-center gap-2 text-muted text-xs">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span>{t('adminNotifySearchingUsers')}</span>
                        </div>
                      ) : userSearchResults.length === 0 ? (
                        <div className="p-4 text-center text-muted text-xs">
                          {t('adminNotifySelectUserEmpty')}
                        </div>
                      ) : (
                        <div className="p-1 space-y-0.5">
                          {userSearchResults.map(user => {
                            const isSelected = selectedRecipients.some(item => item.id === user.id)
                            const displayName =
                              user.fullName || user.username || user.phoneNumber || user.email || 'User'
                            return (
                              <div
                                key={user.id}
                                onClick={() => handleToggleSelectUser(user)}
                                className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                                  isSelected
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'hover:bg-surface text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Avatar
                                    src={user.avatarUrl || undefined}
                                    name={displayName}
                                    size="sm"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs truncate">{displayName}</span>
                                      <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                                          user.role === 'landlord'
                                            ? 'bg-accent/15 text-accent'
                                            : user.role === 'admin'
                                              ? 'bg-purple-500/15 text-purple-600'
                                              : user.role === 'employee'
                                                ? 'bg-blue-500/15 text-blue-600'
                                                : 'bg-amber-500/15 text-amber-600'
                                        }`}
                                      >
                                        {user.role}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-muted flex items-center gap-3 truncate">
                                      {user.phoneNumber && (
                                        <span className="flex items-center gap-1 font-mono">
                                          <Phone className="w-3 h-3" /> {user.phoneNumber}
                                        </span>
                                      )}
                                      {user.email && (
                                        <span className="flex items-center gap-1 truncate">
                                          <Mail className="w-3 h-3 shrink-0" /> {user.email}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {isSelected ? (
                                    <span className="px-2 py-1 rounded-lg bg-primary text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                                      <Check className="w-3 h-3" />
                                      {t('adminNotifyUserAlreadySelected')}
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-lg bg-surface border border-line text-foreground/80 text-[10px] font-bold hover:border-primary hover:text-primary transition-colors">
                                      + {t('adminNotifySelectUserBtn')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {fieldErrors.targetId && (
                  <p className="text-[11px] text-danger font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.targetId}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <TextInput
            label={t('adminNotifyMessageTitle')}
            required
            value={composeTitle}
            onChange={e => {
              setComposeTitle(e.target.value)
              if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: undefined }))
            }}
            placeholder={t('adminNotifyMessageTitlePlaceholder')}
            error={fieldErrors.title}
          />

          <TextareaInput
            label={t('adminNotifyMessageContent')}
            required
            rows={5}
            value={composeContent}
            onChange={e => {
              setComposeContent(e.target.value)
              if (fieldErrors.content)
                setFieldErrors(prev => ({ ...prev, content: undefined }))
            }}
            placeholder={t('adminNotifyMessageContentPlaceholder')}
            error={fieldErrors.content}
          />
        </div>
      </Modal>

      {/* INSPECT REPORT MODAL using @/components/ui Modal */}
      <Modal
        isOpen={Boolean(inspectCampaign)}
        onClose={() => setInspectCampaign(null)}
        size="lg"
        icon={<Megaphone className="w-5 h-5 text-primary" />}
        title={inspectCampaign?.name}
        description={inspectCampaign ? `ID: ${inspectCampaign.id}` : undefined}
        footer={
          <div className="flex items-center justify-end gap-2">
            {(inspectCampaign?.status === 'failed' || inspectCampaign?.status === 'pending') && (
              <Button
                size="md"
                onClick={() => handleRetryCampaign(inspectCampaign.id)}
                leftIcon={<RotateCcw />}
              >
                {t('adminRetry')}
              </Button>
            )}
            <Button
              variant="outline"
              size="md"
              onClick={() => setInspectCampaign(null)}
            >
              {t('adminNotifyDetailClose')}
            </Button>
          </div>
        }
      >
        {inspectCampaign && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-muted block">
                {t('adminNotifyMessageTitle')}
              </span>
              <h4 className="text-sm font-black text-foreground">{inspectCampaign.title}</h4>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface border border-line text-foreground/90 leading-relaxed">
              {inspectCampaign.content}
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-surface border border-line">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase block">
                  {t('adminNotifyTargetGroup')}
                </span>
                <span className="font-bold text-foreground text-sm mt-0.5 block">
                  {getTargetLabel(inspectCampaign.targetGroup)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted uppercase block">
                  {t('adminNotifyDetailCreatedBy')}
                </span>
                <span className="font-bold text-foreground text-sm mt-0.5 block">
                  {inspectCampaign.createdBy}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted uppercase block">
                  {t('adminNotifyDetailSentCount')}
                </span>
                <span className="font-black text-success text-sm mt-0.5 block">
                  {inspectCampaign.sentCount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted uppercase block">
                  {t('adminNotifyDetailFailedCount')}
                </span>
                <span className="font-black text-danger text-sm mt-0.5 block">
                  {inspectCampaign.failedCount}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-muted uppercase block mb-1.5">
                {t('adminNotifyDetailChannels')}
              </span>
              {renderChannelBadges(inspectCampaign.channels)}
            </div>
          </div>
        )}
      </Modal>

      {/* RULE #10: POP-UP CONFIRMATION MODAL using @/components/ui Modal */}
      <Modal
        isOpen={confirmCloseModal.isOpen}
        onClose={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
        size="sm"
        icon={<AlertTriangle className="w-5 h-5 text-warning" />}
        title={t('adminNotifyDiscardTitle')}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
            >
              {t('adminNotifyContinueEditing')}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={confirmCloseModal.onDiscard}
            >
              {t('adminNotifyDiscardAndClose')}
            </Button>
          </>
        }
      >
        <p className="text-xs text-muted leading-relaxed">
          {t('adminNotifyDiscardDesc')}
        </p>
      </Modal>
    </div>
  )
}

