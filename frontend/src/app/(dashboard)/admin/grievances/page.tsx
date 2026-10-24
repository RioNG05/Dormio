'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslations } from '@/context/LanguageContext'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Search,
  Clock,
  X,
  Check,
  Ban,
  RefreshCw,
} from 'lucide-react'
import { grievanceService, GrievanceQueueCounts } from '@/services/grievance.service'
import {
  Button,
  TableActionButton,
  Checkbox,
  TextareaInput,
  TextInput,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  Card,
  TableRow,
  Modal,
  EmptyState,
} from '@/components/ui'
import { DashboardPageHeader } from '@/components/layout'

interface GrievanceItem {
  id: string
  type?: 'complaint' | 'inquiry' | 'feedback'
  tenantId?: string
  tenantName: string
  tenantPhone: string
  tenantEmail: string
  boardingHouseId?: string | null
  houseName: string
  roomId?: string | null
  roomNumber: string
  landlordName: string
  landlordPhone: string
  category: 'deposit' | 'utilities' | 'maintenance' | 'security' | 'contract' | 'other'
  categoryLabel: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
  title: string
  description: string
  evidenceImages: string[]
  createdAt: string
  resolutionNote?: string
  resolvedAt?: string
  resolvedBy?: string
}

export default function AdminGrievancesPage() {
  const t = useTranslations('admin')

  // Rule #9: Standardized View & Pagination (Grid is ALWAYS default)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6) // Default 6 for grid, 10 for table

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<
    'all' | 'urgent' | 'high' | 'medium' | 'low'
  >('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'in_progress' | 'resolved' | 'rejected'
  >('all')

  // Modals
  const [inspectItem, setInspectItem] = useState<GrievanceItem | null>(null)
  const [resolveTargetItem, setResolveTargetItem] = useState<GrievanceItem | null>(null)
  const [actionType, setActionType] = useState<'resolve' | 'reject'>('resolve')
  const [resolutionNoteInput, setResolutionNoteInput] = useState('')
  const [resolveError, setResolveError] = useState('')
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false)
  const [escalateLockLandlord, setEscalateLockLandlord] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Rule #10: Modal Reset Confirmation
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean
    onDiscard: () => void
  }>({ isOpen: false, onDiscard: () => {} })

  // Data & State
  const [grievances, setGrievances] = useState<GrievanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveCounts, setLiveCounts] = useState<GrievanceQueueCounts | null>(null)
  const [toastMsg, setToastMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMsg) return
    const timer = setTimeout(() => setToastMsg(null), 4000)
    return () => clearTimeout(timer)
  }, [toastMsg])

  // Fetch live grievances
  const fetchLiveGrievances = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      try {
        const [queueRes, countsRes] = await Promise.all([
          grievanceService.getAdminGrievanceQueue({
            page: 1,
            limit: 100,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          }),
          grievanceService.getAdminGrievanceCounts().catch(() => null),
        ])

        if (queueRes?.items) {
          const mapped: GrievanceItem[] = queueRes.items.map(item => ({
            id: item.id,
            type: (item.type as any) || 'complaint',
            tenantId: item.tenantId,
            tenantName: item.tenantName || 'Khách thuê',
            tenantPhone: item.tenantPhone || '---',
            tenantEmail: item.tenantEmail || '---',
            boardingHouseId: item.boardingHouseId,
            houseName: item.houseName || 'Nhà trọ',
            roomId: item.roomId,
            roomNumber: item.roomNumber || 'Phòng',
            landlordName: item.landlordName || 'Chủ trọ',
            landlordPhone: item.landlordPhone || '---',
            category: (item.category as any) || 'other',
            categoryLabel: item.categoryLabel || item.category || 'Khác',
            priority: (item.priority as any) || 'medium',
            status: (item.status as any) || 'pending',
            title: item.title,
            description: item.description,
            evidenceImages: item.images || [],
            createdAt: item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '---',
            resolutionNote: item.resolutionNote,
            resolvedAt: item.resolvedAt
              ? new Date(item.resolvedAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : undefined,
            resolvedBy: item.resolvedBy,
          }))

          setGrievances(mapped)
        }

        if (countsRes) {
          setLiveCounts(countsRes)
        }
      } catch (err: any) {
        console.error('Failed to load admin grievances:', err)
        setError(t('adminGrievancesLoadError'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [statusFilter, priorityFilter, t],
  )

  useEffect(() => {
    fetchLiveGrievances()
  }, [fetchLiveGrievances])

  // Filter & Search logic
  const filteredGrievances = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return grievances.filter(item => {
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tenantName.toLowerCase().includes(q) ||
        item.tenantPhone.includes(q) ||
        item.houseName.toLowerCase().includes(q) ||
        item.roomNumber.toLowerCase().includes(q) ||
        item.landlordName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)

      const matchPriority = priorityFilter === 'all' || item.priority === priorityFilter
      const matchStatus = statusFilter === 'all' || item.status === statusFilter

      return matchSearch && matchPriority && matchStatus
    })
  }, [grievances, searchQuery, priorityFilter, statusFilter])

  // Pagination calculation
  const totalItems = filteredGrievances.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === 'grid' ? 6 : 10))

  const paginatedGrievances = useMemo(() => {
    const start = (safeCurrentPage - 1) * validPageSize
    return filteredGrievances.slice(start, start + validPageSize)
  }, [filteredGrievances, safeCurrentPage, validPageSize])

  // Handle View Mode switch
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    setPageSize(mode === 'grid' ? 6 : 10)
    setCurrentPage(1)
  }

  // Action: Open Resolution Modal
  const handleOpenResolveModal = (item: GrievanceItem, type: 'resolve' | 'reject') => {
    setResolveTargetItem(item)
    setActionType(type)
    setResolutionNoteInput('')
    setResolveError('')
    setEscalateLockLandlord(false)
  }

  const isResolveDirty = useMemo(() => {
    return resolutionNoteInput.trim().length > 0 || escalateLockLandlord
  }, [resolutionNoteInput, escalateLockLandlord])

  const handleRequestCloseResolveModal = () => {
    if (isResolveDirty) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setResolveTargetItem(null)
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })
        },
      })
    } else {
      setResolveTargetItem(null)
    }
  }

  // Confirm Resolution Verdict
  const handleConfirmResolution = async () => {
    if (!resolveTargetItem) return
    if (!resolutionNoteInput.trim()) {
      setResolveError(t('adminGrievancesNoteRequired'))
      return
    }

    setIsSubmittingResolution(true)
    setResolveError('')

    try {
      if (actionType === 'resolve') {
        await grievanceService.resolveGrievance(resolveTargetItem.id, {
          resolutionNote: resolutionNoteInput.trim(),
          escalateLockLandlord,
        })
        setToastMsg({
          type: 'success',
          text: t('adminGrievancesResolveSuccess'),
        })
      } else {
        await grievanceService.rejectGrievance(resolveTargetItem.id, {
          reason: resolutionNoteInput.trim(),
        })
        setToastMsg({
          type: 'success',
          text: t('adminGrievancesRejectSuccess'),
        })
      }

      setResolveTargetItem(null)
      fetchLiveGrievances(true)
    } catch (err: any) {
      console.error('Error submitting resolution:', err)
      setResolveError(err?.response?.data?.message || t('adminGrievancesSubmitError'))
    } finally {
      setIsSubmittingResolution(false)
    }
  }

  // Fast In-Progress Investigation Tag
  const handleMarkInProgress = async (item: GrievanceItem) => {
    try {
      await grievanceService.investigateGrievance(item.id)
      setToastMsg({
        type: 'success',
        text: t('adminGrievancesInvestigatingSuccess'),
      })
      if (inspectItem?.id === item.id) {
        setInspectItem({ ...inspectItem, status: 'in_progress' })
      }
      fetchLiveGrievances(true)
    } catch (err) {
      console.error('Failed to mark in progress:', err)
    }
  }

  // Metric counts
  const totalCases = liveCounts?.total ?? grievances.length
  const urgentCases =
    liveCounts?.urgent ?? grievances.filter(g => g.priority === 'urgent').length
  const pendingCases =
    liveCounts?.pending ?? grievances.filter(g => g.status === 'pending').length
  const inProgressCases =
    liveCounts?.inProgress ?? grievances.filter(g => g.status === 'in_progress').length
  const resolvedCases =
    liveCounts?.resolved ?? grievances.filter(g => g.status === 'resolved').length

  const renderPriorityBadge = (priority: GrievanceItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-danger-soft text-danger ring-1 ring-red-400 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {t('adminGrievancesPriorityUrgent')}
          </span>
        )
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-soft text-danger">
            {t('adminGrievancesPriorityHigh')}
          </span>
        )
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-soft text-warning">
            {t('adminGrievancesPriorityMedium')}
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-card-hover text-foreground/80">
            {t('adminGrievancesPriorityLow')}
          </span>
        )
    }
  }

  const renderStatusBadge = (status: GrievanceItem['status']) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-success-soft text-success inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-success" />
            {t('adminGrievancesStatusResolved')}
          </span>
        )
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-card-hover text-foreground/80 inline-flex items-center gap-1">
            <Ban className="w-3 h-3 text-muted" />
            {t('adminGrievancesStatusRejected')}
          </span>
        )
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-info-soft text-info inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-info animate-spin" />
            {t('adminGrievancesStatusInProgress')}
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-warning-soft text-warning inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {t('adminGrievancesStatusPending')}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-70 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold animate-fadeIn ${
            toastMsg.type === 'success'
              ? 'bg-success-soft text-success border-success-subtle'
              : 'bg-danger-soft text-danger border-danger-subtle'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          )}
          <span>{toastMsg.text}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMsg(null)}
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
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('adminGrievancesBadge')}
            </span>
            <span className="text-xs font-semibold text-muted">
              • {t('adminGrievancesRealtime')}
            </span>
          </div>
        }
        title={t('adminGrievancesTitle')}
        subtitle={t('adminGrievancesSubtitle')}
        actions={
          <Button
            variant="outline"
            size="md"
            onClick={() => fetchLiveGrievances(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw />}
          >
            <span className="hidden sm:inline">{t('adminGrievancesRefresh')}</span>
          </Button>
        }
      />

      {/* Priority & Status KPI summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-line text-foreground shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider block text-muted">
            {t('adminGrievancesTotalCases')}
          </span>
          {loading ? (
            <div className="h-5 w-12 bg-line/60 rounded animate-pulse my-0.5" />
          ) : (
            <span className="text-xl font-black leading-tight block text-foreground">
              {totalCases}
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-info-soft border border-info-subtle text-info shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider block text-info">
            {t('adminGrievancesInProgressTotal')}
          </span>
          {loading ? (
            <div className="h-5 w-12 bg-blue-200/60 rounded animate-pulse my-0.5" />
          ) : (
            <span className="text-xl font-black leading-tight block">
              {inProgressCases}
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-warning-soft border border-warning-subtle text-warning shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider block text-warning">
            {t('adminGrievancesPendingTotal')}
          </span>
          {loading ? (
            <div className="h-5 w-12 bg-amber-200/60 rounded animate-pulse my-0.5" />
          ) : (
            <span className="text-xl font-black leading-tight block">
              {pendingCases}
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-danger-soft border border-danger-subtle text-danger shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider block text-danger">
            {t('adminGrievancesUrgentQueue')}
          </span>
          {loading ? (
            <div className="h-5 w-12 bg-orange-200/60 rounded animate-pulse my-0.5" />
          ) : (
            <span className="text-xl font-black leading-tight block">
              {urgentCases}
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-success-soft border border-success-subtle text-success shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider block text-success">
            {t('adminGrievancesResolvedTotal')}
          </span>
          {loading ? (
            <div className="h-5 w-12 bg-emerald-200/60 rounded animate-pulse my-0.5" />
          ) : (
            <span className="text-xl font-black leading-tight block">
              {resolvedCases}
            </span>
          )}
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-danger-soft border border-danger-subtle rounded-2xl text-danger text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="md" onClick={() => fetchLiveGrievances()}>
            {t('adminGrievancesRetry')}
          </Button>
        </div>
      )}

      {/* Filter Toolbar */}
      <FilterToolbar
        search={
          <TextInput
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={t('adminGrievancesSearchPlaceholder')}
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
            {/* Priority filter buttons */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-line text-xs font-semibold">
              {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(p => (
                <Button
                  key={p}
                  size="sm"
                  variant={priorityFilter === p ? 'secondary' : 'ghost'}
                  onClick={() => {
                    setPriorityFilter(p)
                    setCurrentPage(1)
                  }}
                  className="rounded-lg text-xs"
                >
                  {p === 'all'
                    ? t('adminGrievancesFilterAll')
                    : p === 'urgent'
                      ? t('adminGrievancesPriorityUrgent')
                      : p === 'high'
                        ? t('adminGrievancesPriorityHigh')
                        : p === 'medium'
                          ? t('adminGrievancesPriorityMedium')
                          : t('adminGrievancesPriorityLow')}
                </Button>
              ))}
            </div>

            {/* Status filter buttons */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-line text-xs font-semibold">
              {(['all', 'pending', 'in_progress', 'resolved', 'rejected'] as const).map(s => (
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
                    ? t('adminGrievancesFilterAll')
                    : s === 'pending'
                      ? t('adminGrievancesStatusPending')
                      : s === 'in_progress'
                        ? t('adminGrievancesStatusInProgress')
                        : s === 'resolved'
                          ? t('adminGrievancesStatusResolved')
                          : t('adminGrievancesStatusRejected')}
                </Button>
              ))}
            </div>
          </div>
        }
        viewModeToggle={
          <ViewModeToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
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
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-line rounded" />
                  <div className="h-4 w-16 bg-line rounded-full" />
                </div>
                <div className="h-5 w-3/4 bg-line rounded" />
                <div className="h-14 bg-card-hover rounded-xl" />
                <div className="h-10 bg-line rounded-xl" />
              </div>
            ))}
          </div>
        ) : paginatedGrievances.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="w-10 h-10 text-muted" />}
            title={t('adminGrievancesNoComplaintsTitle')}
            description={t('adminGrievancesNoComplaintsDesc')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedGrievances.map(item => {
              const isUrgent = item.priority === 'urgent'

              return (
                <Card
                  key={item.id}
                  interactive
                  onClick={() => setInspectItem(item)}
                  className={`overflow-hidden flex flex-col justify-between group cursor-pointer border transition-all duration-200 p-5 space-y-4 ${
                    isUrgent && item.status === 'pending'
                      ? 'border-danger/40 bg-danger/5 ring-1 ring-danger/20'
                      : 'border-line hover:border-primary/50'
                  }`}
                >
                  {/* Card Top */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-foreground/90 bg-card-hover px-2 py-0.5 rounded-md">
                        {item.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {renderPriorityBadge(item.priority)}
                        {renderStatusBadge(item.status)}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <span className="inline-block mt-1 text-[11px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-md">
                        {item.categoryLabel}
                      </span>
                    </div>

                    <p className="text-xs text-muted line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Evidence thumbnails */}
                    {item.evidenceImages.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-muted">
                          {t('adminGrievancesProofLabel')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.evidenceImages.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={e => {
                                e.stopPropagation()
                                setPreviewImage(img)
                              }}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-line hover:border-primary transition-colors shrink-0"
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Parties involved */}
                    <div className="p-3 rounded-xl bg-surface border border-line text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-muted font-semibold">
                          {t('adminGrievancesTenantLabel')}
                        </span>
                        <span className="font-bold text-foreground">
                          {item.tenantName} ({item.tenantPhone})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted font-semibold">
                          {t('adminGrievancesPropertyLabel')}
                        </span>
                        <span className="font-semibold text-foreground">
                          {item.houseName} • {item.roomNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted font-semibold">
                          {t('adminGrievancesLandlordLabel')}
                        </span>
                        <span className="font-semibold text-foreground">{item.landlordName}</span>
                      </div>
                    </div>

                    {/* Resolution note preview if resolved */}
                    {item.resolutionNote && (
                      <div className="p-3 rounded-xl bg-success-soft border border-success-subtle text-xs text-success space-y-1">
                        <div className="font-black text-[11px] uppercase flex items-center gap-1 text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('adminGrievancesConclusionLabel')}
                        </div>
                        <p className="text-[11px] leading-relaxed line-clamp-2">
                          {item.resolutionNote}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Actions (View button removed; click card opens details) */}
                  <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted font-medium">
                      {item.createdAt}
                    </span>
                    {item.status === 'pending' || item.status === 'in_progress' ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenResolveModal(item, 'reject')}
                          title={t('adminGrievancesRejectTooltip')}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleOpenResolveModal(item, 'resolve')}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          <span>{t('adminGrievancesVerdictBtn')}</span>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        /* TABLE VIEW (Row click navigates/inspects; view button removed) */
        <div className="bg-card rounded-2xl border border-line shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-line bg-surface/70 text-muted uppercase tracking-wider font-black">
                <th className="p-3.5 min-w-[220px]">{t('adminGrievancesColComplaint')}</th>
                <th className="p-3.5 min-w-[170px]">{t('adminGrievancesColTenant')}</th>
                <th className="p-3.5 min-w-[170px]">{t('adminGrievancesColLandlord')}</th>
                <th className="p-3.5 min-w-[120px]">{t('adminGrievancesColPriority')}</th>
                <th className="p-3.5 min-w-[130px]">{t('adminGrievancesColStatus')}</th>
                <th className="p-3.5 text-right min-w-[110px]">{t('adminGrievancesColActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-medium text-foreground">
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3.5"><div className="h-4 w-40 bg-line rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-28 bg-line rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-28 bg-line rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-16 bg-line rounded-full" /></td>
                    <td className="p-3.5"><div className="h-4 w-16 bg-line rounded-full" /></td>
                    <td className="p-3.5 text-right"><div className="h-7 w-16 bg-line rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedGrievances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-card-hover text-muted flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">
                        {t('adminGrievancesNoComplaintsTitle')}
                      </h3>
                      <p className="text-xs text-muted max-w-sm mx-auto">
                        {t('adminGrievancesNoComplaintsDesc')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedGrievances.map(item => (
                  <TableRow
                    key={item.id}
                    interactive
                    onClick={() => setInspectItem(item)}
                  >
                    <td className="p-3.5 max-w-xs">
                      <div className="font-mono text-[10px] text-muted">#{item.id}</div>
                      <div className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-muted line-clamp-1 mt-0.5">
                        {item.categoryLabel} • {item.createdAt}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{item.tenantName}</div>
                      <div className="text-[11px] text-muted font-mono">{item.tenantPhone}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{item.landlordName}</div>
                      <div className="text-[11px] text-muted">
                        {item.houseName} ({item.roomNumber})
                      </div>
                    </td>

                    <td className="p-3.5">{renderPriorityBadge(item.priority)}</td>

                    <td className="p-3.5">{renderStatusBadge(item.status)}</td>

                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {item.status === 'pending' || item.status === 'in_progress' ? (
                        <>
                          <TableActionButton
                            icon={<Ban />}
                            onClick={() => handleOpenResolveModal(item, 'reject')}
                            title={t('adminGrievancesRejectTooltip')}
                          />
                          <TableActionButton
                            icon={<Check />}
                            onClick={() => handleOpenResolveModal(item, 'resolve')}
                            title={t('adminGrievancesVerdictBtn')}
                          />
                        </>
                      ) : (
                        <span className="text-[11px] text-muted font-medium">--</span>
                      )}
                    </td>
                  </TableRow>
                ))
              )}
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

      {/* INSPECT DETAIL MODAL using @/components/ui Modal */}
      <Modal
        isOpen={Boolean(inspectItem)}
        onClose={() => setInspectItem(null)}
        size="2xl"
        icon={<AlertTriangle className="w-5 h-5 text-primary" />}
        title={t('adminGrievancesModalDossierTitle')}
        description={inspectItem ? `ID: ${inspectItem.id}` : undefined}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setInspectItem(null)}>
              {t('adminGrievancesModalClose')}
            </Button>

            {inspectItem?.status === 'pending' && (
              <Button
                variant="outline"
                size="md"
                onClick={() => handleMarkInProgress(inspectItem)}
                leftIcon={<Clock className="w-4 h-4" />}
              >
                <span>{t('adminGrievancesModalInvestigating')}</span>
              </Button>
            )}

            {inspectItem &&
              inspectItem.status !== 'resolved' &&
              inspectItem.status !== 'rejected' && (
                <Button
                  size="md"
                  onClick={() => {
                    const target = inspectItem
                    setInspectItem(null)
                    handleOpenResolveModal(target, 'resolve')
                  }}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  <span>{t('adminGrievancesModalTakeAction')}</span>
                </Button>
              )}
          </>
        }
      >
        {inspectItem && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {renderPriorityBadge(inspectItem.priority)}
                <span className="font-bold text-primary bg-accent-soft px-2 py-0.5 rounded-md">
                  {inspectItem.categoryLabel}
                </span>
              </div>
              <span className="text-muted font-medium">{inspectItem.createdAt}</span>
            </div>

            <div>
              <h3 className="text-base font-black text-foreground leading-snug">
                {inspectItem.title}
              </h3>
            </div>

            {/* Parties summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-surface border border-line">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted block">
                  {t('adminGrievancesModalComplainant')}
                </span>
                <div className="font-bold text-foreground text-sm">{inspectItem.tenantName}</div>
                <div className="text-muted font-mono">{inspectItem.tenantPhone}</div>
                <div className="text-muted">{inspectItem.tenantEmail}</div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted block">
                  {t('adminGrievancesModalAccused')}
                </span>
                <div className="font-bold text-foreground text-sm">{inspectItem.landlordName}</div>
                <div className="text-muted font-mono">{inspectItem.landlordPhone}</div>
                <div className="text-foreground/90 font-semibold">
                  {inspectItem.houseName} ({inspectItem.roomNumber})
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-foreground uppercase text-[11px] tracking-wider">
                {t('adminGrievancesModalDescLabel')}
              </h4>
              <div className="p-3.5 rounded-2xl bg-surface border border-line text-foreground/90 leading-relaxed">
                {inspectItem.description}
              </div>
            </div>

            {/* Evidence Images */}
            {inspectItem.evidenceImages.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-foreground uppercase text-[11px] tracking-wider">
                  {t('adminGrievancesModalProofLabel')}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {inspectItem.evidenceImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewImage(img)}
                      className="h-32 rounded-xl overflow-hidden border border-line cursor-pointer group relative"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                        {t('adminGrievancesModalEnlarge')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Resolution Note */}
            {inspectItem.resolutionNote && (
              <div className="p-4 rounded-2xl bg-success-soft border border-success-subtle text-success space-y-1">
                <div className="font-black text-xs uppercase flex items-center gap-1 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('adminGrievancesModalRecordedResolution')}
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  {inspectItem.resolutionNote}
                </p>
                {inspectItem.resolvedAt && (
                  <span className="text-[10px] text-success block">
                    {t('adminGrievancesModalResolvedAt', {
                      time: inspectItem.resolvedAt,
                      by: inspectItem.resolvedBy || 'Admin',
                    })}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* RESOLUTION MODAL using @/components/ui Modal */}
      <Modal
        isOpen={Boolean(resolveTargetItem)}
        onClose={handleRequestCloseResolveModal}
        size="lg"
        icon={actionType === 'resolve' ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Ban className="w-5 h-5 text-danger" />}
        title={actionType === 'resolve' ? t('adminGrievancesResolveModalTitle') : t('adminGrievancesRejectModalTitle')}
        description={resolveTargetItem ? `${resolveTargetItem.id} • ${resolveTargetItem.tenantName}` : undefined}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={handleRequestCloseResolveModal}
              disabled={isSubmittingResolution}
            >
              {t('adminGrievancesCancel')}
            </Button>
            <Button
              size="md"
              variant={actionType === 'resolve' ? 'primary' : 'danger'}
              onClick={handleConfirmResolution}
              isLoading={isSubmittingResolution}
              leftIcon={<Check />}
            >
              <span>
                {isSubmittingResolution
                  ? t('adminGrievancesSaving')
                  : t('adminGrievancesSaveVerdict')}
              </span>
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Action Type switcher */}
          <div className="flex items-center gap-2 p-1 bg-card-hover rounded-xl text-xs font-bold">
            <Button
              variant={actionType === 'resolve' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActionType('resolve')}
              className="flex-1"
            >
              {t('adminGrievancesTabApprove')}
            </Button>
            <Button
              variant={actionType === 'reject' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActionType('reject')}
              className="flex-1"
            >
              {t('adminGrievancesTabReject')}
            </Button>
          </div>

          {resolveError && (
            <div className="p-3 rounded-xl bg-danger-soft border border-danger-subtle text-danger text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{resolveError}</span>
            </div>
          )}

          <TextareaInput
            label={t('adminGrievancesMandatoryNote')}
            required
            rows={4}
            value={resolutionNoteInput}
            onChange={e => setResolutionNoteInput(e.target.value)}
            placeholder={
              actionType === 'resolve'
                ? t('adminGrievancesResolvePlaceholder')
                : t('adminGrievancesRejectPlaceholder')
            }
          />

          {actionType === 'resolve' && (
            <div className="p-3 rounded-xl bg-accent-soft border border-accent-subtle">
              <Checkbox
                checked={escalateLockLandlord}
                onChange={e => setEscalateLockLandlord(e.target.checked)}
                label={t('adminGrievancesEscalateLabel')}
                description={t('adminGrievancesEscalateDesc')}
                size="sm"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* PREVIEW ENLARGED IMAGE using @/components/ui Modal */}
      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        size="3xl"
        title={t('adminGrievancesProofLabel')}
        footer={
          <Button variant="secondary" size="md" onClick={() => setPreviewImage(null)}>
            {t('adminGrievancesModalClose')}
          </Button>
        }
      >
        {previewImage && (
          <div className="flex items-center justify-center p-2">
            <img
              src={previewImage}
              alt="Evidence"
              className="max-w-full max-h-[70vh] rounded-2xl shadow-xl object-contain"
            />
          </div>
        )}
      </Modal>

      {/* RULE #10: POP-UP CONFIRMATION MODAL using @/components/ui Modal */}
      <Modal
        isOpen={confirmCloseModal.isOpen}
        onClose={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
        size="sm"
        icon={<AlertTriangle className="w-5 h-5 text-warning" />}
        title={t('adminGrievancesDiscardTitle')}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
            >
              {t('adminGrievancesContinueEditing')}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={confirmCloseModal.onDiscard}
            >
              {t('adminGrievancesDiscardAndClose')}
            </Button>
          </>
        }
      >
        <p className="text-xs text-muted leading-relaxed">
          {t('adminGrievancesDiscardDesc')}
        </p>
      </Modal>
    </div>
  )
}

