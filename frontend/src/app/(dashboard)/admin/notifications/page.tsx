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
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Plus,
  Smartphone,
  Eye,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react'
import {
  adminNotificationService,
  MassNotificationStatusCounts,
} from '@/services/admin-notification.service'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { TextInput } from '@/components/ui/TextInput'
import { TextareaInput } from '@/components/ui/TextareaInput'
import { SelectInput } from '@/components/ui/SelectInput'
import { NumberInput } from '@/components/ui/NumberInput'
import { Pagination } from '@/components/ui/Pagination'
import { ViewModeToggle } from '@/components/ui/ViewModeToggle'
import { FilterToolbar } from '@/components/ui/FilterToolbar'

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

  // Rule #10: Modal Reset Confirmation
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean
    onDiscard: () => void
  }>({ isOpen: false, onDiscard: () => {} })

  // Live Campaigns Data
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [liveCounts, setLiveCounts] = useState<MassNotificationStatusCounts | null>(null)

  const fetchLiveCampaigns = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)

      try {
        const rawRes: any = await adminNotificationService.getMassNotificationJobs({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          channel: channelFilter !== 'all' ? channelFilter : undefined,
          search: searchQuery.trim() || undefined,
          page: 1,
          limit: 100,
        })

        const res = rawRes?.data ?? rawRes

        if (res && Array.isArray(res.items)) {
          const mapped: NotificationCampaign[] = res.items.map((item: any) => ({
            id: item.id,
            name: item.title,
            title: item.title,
            content: item.content,
            targetGroup: item.targetType as any,
            targetLabel: item.targetLabel || item.targetType,
            targetId: item.targetId,
            channels: [item.channel as any],
            status: item.status,
            totalRecipients: item.totalRecipients || 0,
            sentCount: item.sentCount || 0,
            failedCount: item.failedCount || 0,
            createdAt: item.createdAt ? item.createdAt.replace('T', ' ').substring(0, 16) : '',
            createdBy: item.creatorName || t('adminBlogsAdminAuthor'),
          }))
          setCampaigns(mapped)
          if (res.counts) setLiveCounts(res.counts)
        } else {
          setCampaigns([])
        }
      } catch (err) {
        console.warn('Failed to fetch live mass notifications:', err)
        setCampaigns([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [statusFilter, channelFilter, searchQuery, t],
  )

  useEffect(() => {
    fetchLiveCampaigns()
  }, [fetchLiveCampaigns])

  // Filtered dataset
  const currentDataset = useMemo(() => {
    return campaigns.filter(item => {
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)

      const matchStatus = statusFilter === 'all' || item.status === statusFilter
      const matchChannel = channelFilter === 'all' || item.channels.includes(channelFilter as any)

      return matchSearch && matchStatus && matchChannel
    })
  }, [campaigns, searchQuery, statusFilter, channelFilter])

  // View mode toggle
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
  }

  const totalItems = currentDataset.length
  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === 'grid' ? 6 : 10))
  const totalPages = Math.max(1, Math.ceil(totalItems / validPageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * validPageSize
    return currentDataset.slice(start, start + validPageSize)
  }, [currentDataset, safeCurrentPage, validPageSize])

  // Selection
  const isAllCurrentSelected =
    paginatedItems.length > 0 && paginatedItems.every(item => selectedIds.includes(item.id))

  const toggleSelectAllCurrent = () => {
    if (isAllCurrentSelected) {
      setSelectedIds(prev => prev.filter(id => !paginatedItems.some(item => item.id === id)))
    } else {
      const pageIds = paginatedItems.map(item => item.id)
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]))
  }

  // Compose Channels toggle
  const toggleComposeChannel = (ch: 'in_app' | 'email' | 'sms' | 'zalo') => {
    setComposeChannels(prev => {
      if (prev.includes(ch)) {
        if (prev.length === 1) return prev // keep at least 1
        return prev.filter(c => c !== ch)
      } else {
        return [...prev, ch]
      }
    })
  }

  // Rule #10: Check dirty form on close
  const isComposerDirty =
    composeName.trim().length > 0 ||
    composeTitle.trim().length > 0 ||
    composeContent.trim().length > 0 ||
    specificUserId.trim().length > 0

  const handleRequestCloseComposer = () => {
    if (isComposerDirty) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setIsComposeOpen(false)
          resetComposer()
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })
        },
      })
    } else {
      setIsComposeOpen(false)
      resetComposer()
    }
  }

  const resetComposer = () => {
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
  }

  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  // Validate form fields matching backend CreateMassNotificationDto & service requirements
  const validateComposer = (): boolean => {
    const errors: {
      channels?: string
      targetId?: string
      title?: string
      content?: string
      scheduleTime?: string
    } = {}

    if (!composeChannels || composeChannels.length === 0) {
      errors.channels = t('adminNotifyErrorChannelRequired')
    }

    const trimmedTitle = composeTitle.trim()
    if (!trimmedTitle) {
      errors.title = t('adminNotifyErrorTitleRequired')
    } else if (trimmedTitle.length < 3) {
      errors.title = t('adminNotifyErrorTitleMin')
    }

    const trimmedContent = composeContent.trim()
    if (!trimmedContent) {
      errors.content = t('adminNotifyErrorContentRequired')
    } else if (trimmedContent.length < 5) {
      errors.content = t('adminNotifyErrorContentMin')
    }

    if (composeTarget === 'specific_user') {
      const trimmedId = specificUserId.trim()
      if (!trimmedId) {
        errors.targetId = t('adminNotifyErrorTargetIdRequired')
      } else if (!UUID_V4_REGEX.test(trimmedId)) {
        errors.targetId = t('adminNotifyErrorTargetIdUuid')
      }
    }

    if (composeScheduleType === 'later') {
      if (!composeScheduleTime) {
        errors.scheduleTime = t('adminNotifyErrorScheduleTimeRequired')
      } else {
        const scheduleTimestamp = new Date(composeScheduleTime).getTime()
        if (isNaN(scheduleTimestamp) || scheduleTimestamp <= Date.now()) {
          errors.scheduleTime = t('adminNotifyErrorScheduleTimeFuture')
        }
      }
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      setFormError(t('adminNotifyErrorCreate'))
      return false
    }

    setFormError('')
    return true
  }

  // Send campaign
  const handleSendCampaign = async () => {
    if (!validateComposer()) {
      return
    }

    setIsSubmitting(true)
    setFormError('')

    const channelsToSend = composeChannels.length > 0 ? composeChannels : ['in_app']

    try {
      await Promise.all(
        channelsToSend.map(ch =>
          adminNotificationService.createMassNotificationJob({
            channel: ch as any,
            targetType: composeTarget === 'all_tenants' ? 'all_users' : (composeTarget as any),
            targetId: composeTarget === 'specific_user' ? specificUserId.trim() : undefined,
            title: composeTitle.trim(),
            content: composeContent.trim(),
          }),
        ),
      )
      await fetchLiveCampaigns(true)
      setIsComposeOpen(false)
      resetComposer()
    } catch (err: any) {
      console.error('Failed to create mass notification on backend:', err)
      const apiErrorMessage = err?.message || t('adminNotifyErrorCreate')
      setFormError(apiErrorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Retry campaign
  const handleRetryCampaign = async (jobId: string) => {
    try {
      await adminNotificationService.retryMassNotificationJob(jobId)
      await fetchLiveCampaigns(true)
      if (inspectCampaign?.id === jobId) {
        setInspectCampaign(prev => (prev ? { ...prev, status: 'pending', failedCount: 0 } : null))
      }
    } catch (err) {
      console.warn('Failed to retry campaign:', err)
    }
  }

  // Helper Channel Icon
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-accent-soft text-accent tracking-wide uppercase">
              <Megaphone className="w-3.5 h-3.5" />
              {t('adminNotifyBadge')}
            </span>
            <span className="text-xs font-semibold text-muted">
              • {t('adminNotifySubbadge')}
            </span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight mt-1">
            {t('adminNotifyTitle')}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {t('adminNotifySubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live KPI summary with skeleton placeholders during loading */}
          <div className="hidden md:flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-success-soft border border-success-subtle text-success min-w-[70px]">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-success">
                {t('adminNotifySent')}
              </span>
              {loading ? (
                <div className="h-4 w-10 bg-emerald-200/60 rounded animate-pulse my-0.5" />
              ) : (
                <span className="text-sm font-black leading-tight block">
                  {liveCounts ? liveCounts.sent : campaigns.filter(c => c.status === 'sent').length}
                </span>
              )}
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-info-soft border border-info-subtle text-info min-w-[70px]">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-info">
                {t('adminNotifyPending')}
              </span>
              {loading ? (
                <div className="h-4 w-10 bg-blue-200/60 rounded animate-pulse my-0.5" />
              ) : (
                <span className="text-sm font-black leading-tight block">
                  {liveCounts
                    ? liveCounts.pending
                    : campaigns.filter(c => c.status === 'pending').length}
                </span>
              )}
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-danger-soft border border-danger-subtle text-danger min-w-[70px]">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-danger">
                {t('adminNotifyFailed')}
              </span>
              {loading ? (
                <div className="h-4 w-10 bg-rose-200/60 rounded animate-pulse my-0.5" />
              ) : (
                <span className="text-sm font-black leading-tight block">
                  {liveCounts
                    ? liveCounts.failed
                    : campaigns.filter(c => c.status === 'failed').length}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsComposeOpen(true)}
            leftIcon={<Plus  />}
            className="self-start sm:self-auto"
          >
            {t('adminNotifyComposeCampaign')}
          </Button>
        </div>
      </div>

      {/* Control Bar: Search, Filters, View Mode (Rule #9) */}
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
            className="py-2 bg-surface border-line rounded-xl text-xs font-semibold text-foreground placeholder:text-muted focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
            leftIcon={<Search className="w-4 h-4 text-muted" />}
            rightIcon={
              searchQuery ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              ) : undefined
            }
          />
        }
        filters={
          <>
            {/* Status chips */}
            <div className="flex items-center gap-1 bg-card-hover p-1 rounded-xl">
              {(
                [
                  { id: 'all', label: t('adminNotifyAllStatus') },
                  { id: 'sent', label: t('adminNotifyStatusSent') },
                  { id: 'pending', label: t('adminNotifyStatusPending') },
                  { id: 'failed', label: t('adminNotifyStatusFailed') },
                  { id: 'canceled', label: t('adminNotifyStatusCanceled') },
                ] as const
              ).map(chip => (
                <Button
                  key={chip.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter(chip.id)
                    setCurrentPage(1)
                  }}
                >
                  {chip.label}
                </Button>
              ))}
            </div>

            {/* Channel filter dropdown */}
            <SelectInput
              value={channelFilter}
              onChange={e => {
                setChannelFilter(e.target.value)
                setCurrentPage(1)
              }}
              containerClassName="space-y-0 w-auto min-w-[140px]"
              className="py-2 bg-surface border-line rounded-xl text-xs font-semibold text-foreground/90 cursor-pointer focus:border-orange-500"
            >
              <option value="all">{t('adminNotifyAllChannels')}</option>
              <option value="in_app">{t('adminNotifyChannelInApp')}</option>
              <option value="email">{t('adminNotifyChannelEmail')}</option>
              <option value="sms">{t('adminNotifyChannelSms')}</option>
              <option value="zalo">{t('adminNotifyChannelZalo')}</option>
            </SelectInput>
          </>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLiveCampaigns(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            title={t('adminNotifyRefreshTooltip')}
          >
            <span className="hidden sm:inline">{t('adminNotifyRefresh')}</span>
          </Button>
        }
        viewMode={
          <ViewModeToggle
            value={viewMode}
            onChange={handleViewModeChange}
          />
        }
      />

      {/* Select All on Current Page Bar */}
      {!loading && paginatedItems.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted">
          <Checkbox
            checked={isAllCurrentSelected}
            onChange={toggleSelectAllCurrent}
            label={t('adminNotifySelectAllPage')}
            size="sm"
          />
          <span>
            {t('adminNotifyShowingOf', {
              showing: paginatedItems.length,
              total: totalItems,
            })}
          </span>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-line p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-card-hover rounded-md w-20" />
                  <div className="h-4 bg-card-hover rounded-md w-16" />
                </div>
                <div className="h-5 bg-card-hover rounded-md w-3/4" />
                <div className="h-12 bg-card-hover rounded-md w-full" />
                <div className="h-16 bg-surface rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-line overflow-hidden shadow-2xs animate-pulse p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-12 bg-card-hover rounded-xl w-full" />
            ))}
          </div>
        )
      ) : paginatedItems.length === 0 ? (
        <div className="bg-card rounded-3xl border border-line p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-card-hover text-muted flex items-center justify-center mx-auto">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {t('adminNotifyNoCampaigns')}
          </h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {t('adminNotifyNoCampaignsDesc')}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9: Default 6 items) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map(item => {
            const isSelected = selectedIds.includes(item.id)
            const percent =
              item.totalRecipients > 0
                ? Math.min(100, Math.round((item.sentCount / item.totalRecipients) * 100))
                : 0

            return (
              <div
                key={item.id}
                className={`bg-card rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 cursor-pointer p-5 space-y-4 ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-line'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        size="sm"
                      />
                      <span className="font-mono text-xs font-black text-foreground/90 bg-card-hover px-2 py-0.5 rounded-md">
                        {item.id}
                      </span>
                    </div>
                    {renderStatusBadge(item.status)}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-foreground line-clamp-1">{item.name}</h3>
                    <p className="text-xs font-bold text-orange-600 mt-0.5 line-clamp-1">
                      {item.title}
                    </p>
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

                  {/* Actions & Created Date */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted">
                    <span>{item.createdAt}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectCampaign(item)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      {t('adminNotifyDetailsBtn')}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW */
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
                  <tr
                    key={item.id}
                    className={`hover:bg-card-hover transition-colors duration-150 ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="p-3.5">
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
                      <div className="font-bold text-foreground">{item.name}</div>
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setInspectCampaign(item)}
                        title={t('adminNotifyDetailsBtn')}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Standardized Pagination Bar (Rule #9) */}
      <Pagination
        currentPage={safeCurrentPage}
        totalItems={totalItems}
        pageSize={validPageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeMax={100}
      />

      {/* COMPOSE CAMPAIGN MODAL (Rule #10 compliant) */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent-soft text-orange-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-foreground">
                  {t('adminNotifyComposeTitle')}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRequestCloseComposer}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-danger-soft border border-danger-subtle text-danger text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Campaign Internal Name */}
              <div className="space-y-1">
                <TextInput
                  label={t('adminNotifyCampaignName')}
                  value={composeName}
                  onChange={e => setComposeName(e.target.value)}
                  placeholder={t('adminNotifyCampaignNamePlaceholder')}
                />
              </div>

              {/* Channels Selection */}
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
                  className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${fieldErrors.channels ? 'p-1.5 rounded-2xl ring-2 ring-rose-400 bg-rose-50/20' : ''}`}
                >
                  {[
                    {
                      id: 'in_app' as const,
                      label: 'In-App Notification',
                      icon: Bell,
                    },
                    {
                      id: 'email' as const,
                      label: 'Email Broadcast',
                      icon: Mail,
                    },
                    {
                      id: 'sms' as const,
                      label: 'SMS Brandname',
                      icon: Smartphone,
                    },
                    {
                      id: 'zalo' as const,
                      label: 'Zalo ZNS',
                      icon: MessageSquare,
                    },
                  ].map(ch => {
                    const isSelected = composeChannels.includes(ch.id)
                    const Icon = ch.icon
                    return (
                      <Button size="icon-sm"
                        key={ch.id}
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          toggleComposeChannel(ch.id)
                          if (fieldErrors.channels)
                            setFieldErrors(prev => ({ ...prev, channels: undefined }))
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="w-4 h-4" />
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-orange-600 bg-orange-600 text-white'
                                : 'border-line'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-card" />}
                          </div>
                        </div>
                        <span className="text-[11px] leading-tight">{ch.label}</span>
                      </Button>
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

              {/* Target Audience Group (Prisma NotifyTarget) */}
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
                    <Button size="xs"
                      key={tgt.id}
                      type="button"
                      variant="ghost"
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
                  <div className="space-y-1 pt-1.5 animate-in fade-in duration-200">
                    <TextInput
                      label={t('adminNotifySpecificUserUuid')}
                      required
                      value={specificUserId}
                      onChange={e => {
                        setSpecificUserId(e.target.value)
                        if (fieldErrors.targetId)
                          setFieldErrors(prev => ({ ...prev, targetId: undefined }))
                      }}
                      placeholder="123e4567-e89b-12d3-a456-426614174000"
                      error={fieldErrors.targetId}
                    />
                  </div>
                )}
              </div>

              {/* Title / Subject (min 3 chars per backend) */}
              <div className="space-y-1">
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
              </div>

              {/* Content / Body (min 5 chars per backend) */}
              <div className="space-y-1">
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

              {/* Schedule options */}
              <div className="space-y-1.5">
                <div
                  className={`p-3 rounded-2xl bg-surface border transition-colors ${
                    fieldErrors.scheduleTime
                      ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400'
                      : 'border-line'
                  } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-foreground/90">
                      <TextInput
                        type="radio"
                        name="schedule"
                        checked={composeScheduleType === 'now'}
                        onChange={() => {
                          setComposeScheduleType('now')
                          if (fieldErrors.scheduleTime)
                            setFieldErrors(prev => ({ ...prev, scheduleTime: undefined }))
                        }}
                        containerClassName="space-y-0 inline-block w-auto"
                        className="text-orange-600 focus:ring-orange-500 cursor-pointer w-4 h-4"
                      />
                      <span>{t('adminNotifyScheduleNow')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-foreground/90">
                      <TextInput
                        type="radio"
                        name="schedule"
                        checked={composeScheduleType === 'later'}
                        onChange={() => setComposeScheduleType('later')}
                        containerClassName="space-y-0 inline-block w-auto"
                        className="text-orange-600 focus:ring-orange-500 cursor-pointer w-4 h-4"
                      />
                      <span>{t('adminNotifyScheduleLater')}</span>
                    </label>
                  </div>

                  {composeScheduleType === 'later' && (
                    <TextInput
                      type="datetime-local"
                      value={composeScheduleTime}
                      onChange={e => {
                        setComposeScheduleTime(e.target.value)
                        if (fieldErrors.scheduleTime)
                          setFieldErrors(prev => ({ ...prev, scheduleTime: undefined }))
                      }}
                      containerClassName="space-y-0"
                      className={`px-3 py-1.5 bg-card border rounded-xl text-xs font-bold text-foreground ${
                        fieldErrors.scheduleTime
                          ? 'border-danger focus:border-danger'
                          : 'border-line focus:border-orange-500'
                      }`}
                    />
                  )}
                </div>
                {fieldErrors.scheduleTime && (
                  <p className="text-[11px] text-danger font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.scheduleTime}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-surface border-t border-line flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestCloseComposer}
                disabled={isSubmitting}
              >
                {t('adminNotifyBtnCancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendCampaign}
                isLoading={isSubmitting}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                {t('adminNotifyBtnSubmit')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT REPORT MODAL */}
      {inspectCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-muted">
                  ({inspectCampaign.id})
                </span>
                <h3 className="text-base font-black text-foreground line-clamp-1">
                  {inspectCampaign.name}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInspectCampaign(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
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
                  <span className="font-black text-orange-600 text-sm mt-0.5 block">
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

            <div className="px-6 py-4 bg-surface border-t border-line flex items-center justify-end gap-2">
              {(inspectCampaign.status === 'failed' || inspectCampaign.status === 'pending') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRetryCampaign(inspectCampaign.id)}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  {t('adminRetry')}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectCampaign(null)}
              >
                {t('adminNotifyDetailClose')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rule #10: Custom Pop-up Confirmation Modal */}
      {confirmCloseModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-scaleIn">
            <div className="w-10 h-10 rounded-2xl bg-warning-soft text-warning flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {t('adminNotifyDiscardTitle')}
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {t('adminNotifyDiscardDesc')}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
              >
                {t('adminNotifyContinueEditing')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmCloseModal.onDiscard}
              >
                {t('adminNotifyDiscardAndClose')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
