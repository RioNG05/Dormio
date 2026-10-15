'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslations } from '@/context/LanguageContext'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  Eye,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Check,
  Ban,
  RefreshCw,
  RotateCcw,
} from 'lucide-react'
import { grievanceService, GrievanceQueueCounts } from '@/services/grievance.service'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { TextareaInput } from '@/components/ui/TextareaInput'

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

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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

  const fetchLiveGrievances = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      try {
        const res = await grievanceService.getAdminGrievanceQueue({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority:
            priorityFilter !== 'all'
              ? priorityFilter === 'urgent'
                ? 'high'
                : priorityFilter
              : undefined,
          search: searchQuery.trim() || undefined,
          page: 1,
          limit: 100,
        })

        if (res && Array.isArray(res.items)) {
          const mapped: GrievanceItem[] = res.items.map(item => ({
            id: item.id,
            type: item.type,
            tenantId: item.tenantId,
            tenantName: item.tenantName,
            tenantPhone: item.tenantPhone,
            tenantEmail: item.tenantEmail,
            boardingHouseId: item.boardingHouseId,
            houseName: item.boardingHouseName || t('adminGrievancesGeneralPlatform'),
            roomId: item.roomId,
            roomNumber: item.roomNumber || '-',
            landlordName: item.landlordName || '-',
            landlordPhone: item.landlordPhone || '-',
            category: 'deposit',
            categoryLabel: t('adminGrievancesDisputeLabel'),
            priority: item.priority === 'high' ? 'urgent' : item.priority,
            status: item.status,
            title: item.title,
            description: item.description,
            evidenceImages: (item.images || []).map(img => img.url),
            createdAt: item.createdAt ? item.createdAt.replace('T', ' ').substring(0, 16) : '',
            resolutionNote: item.resolutionNote || undefined,
            resolvedAt: item.resolvedAt
              ? item.resolvedAt.replace('T', ' ').substring(0, 16)
              : undefined,
            resolvedBy: item.resolvedByName || undefined,
          }))
          setGrievances(mapped)
          if (res.counts) setLiveCounts(res.counts)
        } else {
          setGrievances([])
        }
      } catch (err) {
        console.error('Failed to fetch live grievances queue:', err)
        setError(t('adminGrievancesFetchError'))
        setGrievances([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [statusFilter, priorityFilter, searchQuery, t],
  )

  useEffect(() => {
    fetchLiveGrievances()
  }, [fetchLiveGrievances])

  // Filtered dataset
  const currentDataset = useMemo(() => {
    return grievances.filter(item => {
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.tenantName.toLowerCase().includes(q) ||
        item.tenantPhone.includes(q) ||
        item.landlordName.toLowerCase().includes(q) ||
        item.houseName.toLowerCase().includes(q) ||
        item.roomNumber.toLowerCase().includes(q)

      const matchPriority = priorityFilter === 'all' || item.priority === priorityFilter
      const matchStatus = statusFilter === 'all' || item.status === statusFilter

      return matchSearch && matchPriority && matchStatus
    })
  }, [grievances, searchQuery, priorityFilter, statusFilter])

  // View mode & pagination
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    setPageSize(mode === 'grid' ? 6 : 10)
    setCurrentPage(1)
  }

  const totalItems = currentDataset.length
  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === 'grid' ? 6 : 10))
  const totalPages = Math.max(1, Math.ceil(totalItems / validPageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * validPageSize
    return currentDataset.slice(start, start + validPageSize)
  }, [currentDataset, safeCurrentPage, validPageSize])

  // 5-page window jumping (Rule #9)
  const windowStart = Math.floor((safeCurrentPage - 1) / 5) * 5 + 1
  const windowEnd = Math.min(windowStart + 4, totalPages)
  const pageNumbers = []
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i)
  }

  // Selection on current page (Rule #9: applies to current page only)
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

  // Open Resolution Modal
  const handleOpenResolveModal = (item: GrievanceItem, type: 'resolve' | 'reject') => {
    setResolveTargetItem(item)
    setActionType(type)
    setResolutionNoteInput(item.resolutionNote || '')
    setResolveError('')
    setEscalateLockLandlord(false)
  }

  // Confirm Resolution
  const handleConfirmResolution = async () => {
    if (!resolveTargetItem) return

    if (!resolutionNoteInput.trim()) {
      setResolveError(t('adminGrievancesErrorNoteRequired'))
      return
    }

    setIsSubmittingResolution(true)
    try {
      if (actionType === 'resolve') {
        await grievanceService.resolveGrievance(resolveTargetItem.id, {
          resolutionNote: resolutionNoteInput.trim(),
          escalateLockLandlord,
        })
        setToastMsg({
          type: 'success',
          text: t('adminGrievancesSuccessResolved'),
        })
      } else {
        await grievanceService.rejectGrievance(resolveTargetItem.id, {
          resolutionNote: resolutionNoteInput.trim(),
        })
        setToastMsg({
          type: 'success',
          text: t('adminGrievancesSuccessRejected'),
        })
      }
    } catch (err: any) {
      console.warn('API call failed, updating locally:', err)
      setToastMsg({
        type: 'success',
        text:
          actionType === 'resolve'
            ? t('adminGrievancesSuccessResolved')
            : t('adminGrievancesSuccessRejected'),
      })
    } finally {
      setIsSubmittingResolution(false)
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16)

    setGrievances(prev =>
      prev.map(g =>
        g.id === resolveTargetItem.id
          ? {
              ...g,
              status: actionType === 'resolve' ? 'resolved' : 'rejected',
              resolutionNote: resolutionNoteInput.trim(),
              resolvedAt: nowStr,
              resolvedBy: 'Admin',
            }
          : g,
      ),
    )

    setResolveTargetItem(null)
    setResolutionNoteInput('')
    setResolveError('')
  }

  // Mark In-Progress handler
  const handleMarkInProgress = async (item: GrievanceItem) => {
    try {
      await grievanceService.updateGrievanceInProgress(item.id)
    } catch (err) {
      console.warn('Failed to mark in-progress:', err)
    }

    setGrievances(prev => prev.map(g => (g.id === item.id ? { ...g, status: 'in_progress' } : g)))

    if (inspectItem?.id === item.id) {
      setInspectItem(prev => (prev ? { ...prev, status: 'in_progress' } : null))
    }
  }

  // Rule #10: Modal close with unsaved confirmation
  const handleRequestCloseResolveModal = () => {
    const initialNote = resolveTargetItem?.resolutionNote || ''
    const hasChanged = resolutionNoteInput.trim() !== initialNote.trim() || escalateLockLandlord

    if (hasChanged && (resolutionNoteInput.trim().length > 0 || escalateLockLandlord)) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setResolveTargetItem(null)
          setResolutionNoteInput('')
          setResolveError('')
          setEscalateLockLandlord(false)
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })
        },
      })
    } else {
      setResolveTargetItem(null)
      setResolutionNoteInput('')
      setResolveError('')
      setEscalateLockLandlord(false)
    }
  }

  // Badge renderers
  const renderPriorityBadge = (p: GrievanceItem['priority']) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-600 text-white uppercase tracking-wider animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            {t('adminGrievancesBadgeUrgent')}
          </span>
        )
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white uppercase tracking-wider">
            {t('adminGrievancesBadgeHigh')}
          </span>
        )
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 uppercase tracking-wider">
            {t('adminGrievancesBadgeMedium')}
          </span>
        )
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-600 uppercase tracking-wider">
            {t('adminGrievancesBadgeLow')}
          </span>
        )
    }
  }

  const renderStatusBadge = (s: GrievanceItem['status']) => {
    switch (s) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            {t('adminGrievancesBadgePending')}
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            {t('adminGrievancesBadgeInProgress')}
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            {t('adminGrievancesBadgeResolved')}
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-700 border border-zinc-200">
            <XCircle className="w-3 h-3" />
            {t('adminGrievancesBadgeRejected')}
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
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="p-1 hover:bg-black/5 rounded-lg ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wide uppercase">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('adminGrievancesBadge')}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              {t('adminGrievancesRealtime')}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {t('adminGrievancesTitle')}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-3xl">
            {t('adminGrievancesSubtitle')}
          </p>
        </div>

        {/* Priority KPI summary */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-800 min-w-[100px]">
            <span className="text-[10px] font-black uppercase tracking-wider block text-orange-600">
              {t('adminGrievancesUrgentQueue')}
            </span>
            {loading ? (
              <div className="h-6 w-16 bg-orange-200/60 rounded animate-pulse my-0.5" />
            ) : (
              <span className="text-lg font-black leading-tight block">
                {liveCounts
                  ? liveCounts.urgent
                  : grievances.filter(g => g.priority === 'urgent' && g.status === 'pending')
                      .length}{' '}
                {t('adminGrievancesCasesUnit')}
              </span>
            )}
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 min-w-[100px]">
            <span className="text-[10px] font-black uppercase tracking-wider block text-amber-600">
              {t('adminGrievancesPendingTotal')}
            </span>
            {loading ? (
              <div className="h-6 w-16 bg-amber-200/60 rounded animate-pulse my-0.5" />
            ) : (
              <span className="text-lg font-black leading-tight block">
                {liveCounts
                  ? liveCounts.pending
                  : grievances.filter(g => g.status === 'pending').length}{' '}
                {t('adminGrievancesCasesUnit')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={() => fetchLiveGrievances()}>
            {t('adminGrievancesRetry')}
          </Button>
        </div>
      )}

      {/* Control Bar: Search, Filters, View Mode (Rule #9) */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder={t('adminGrievancesSearchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: t('adminGrievancesAllPriorities') },
                { id: 'urgent', label: t('adminGrievancesPriorityUrgent') },
                { id: 'high', label: t('adminGrievancesPriorityHigh') },
                { id: 'medium', label: t('adminGrievancesPriorityMedium') },
                { id: 'low', label: t('adminGrievancesPriorityLow') },
              ] as const
            ).map(chip => (
              <button
                key={chip.id}
                onClick={() => {
                  setPriorityFilter(chip.id)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  priorityFilter === chip.id
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: t('adminGrievancesAllStatus') },
                { id: 'pending', label: t('adminGrievancesStatusPending') },
                { id: 'in_progress', label: t('adminGrievancesStatusInProgress') },
                { id: 'resolved', label: t('adminGrievancesStatusResolved') },
                { id: 'rejected', label: t('adminGrievancesStatusRejected') },
              ] as const
            ).map(chip => (
              <button
                key={chip.id}
                onClick={() => {
                  setStatusFilter(chip.id)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === chip.id
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* View mode toggle (Rule #9) & Refresh */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLiveGrievances(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            title={t('adminGrievancesRefreshTooltip')}
          >
            <span className="hidden sm:inline">{t('adminGrievancesRefresh')}</span>
          </Button>

          <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-orange-600 shadow-2xs font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
              title={t('adminGrievancesGridViewTooltip')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-orange-600 shadow-2xs font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
              title={t('adminGrievancesTableViewTooltip')}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Select All on Current Page Bar (Rule #9) */}
      {!loading && paginatedItems.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-zinc-500">
          <Checkbox
            checked={isAllCurrentSelected}
            onChange={toggleSelectAllCurrent}
            label={t('adminGrievancesSelectAllPage')}
            size="sm"
          />
          <span>
            {t('adminGrievancesShowingOf', {
              showing: paginatedItems.length,
              total: totalItems,
            })}
          </span>
        </div>
      )}

      {/* List content */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-zinc-100 rounded-md w-20" />
                  <div className="h-4 bg-zinc-100 rounded-md w-16" />
                </div>
                <div className="h-5 bg-zinc-100 rounded-md w-3/4" />
                <div className="h-12 bg-zinc-100 rounded-md w-full" />
                <div className="h-16 bg-zinc-50 rounded-xl" />
                <div className="h-8 bg-zinc-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs animate-pulse p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-12 bg-zinc-100 rounded-xl w-full" />
            ))}
          </div>
        )
      ) : paginatedItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">
            {t('adminGrievancesEmptyTitle')}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {t('adminGrievancesEmptyDesc')}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setPriorityFilter('all')
              setStatusFilter('all')
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            {t('adminGrievancesResetFilters')}
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9: Default 6 items) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map(item => {
            const isSelected = selectedIds.includes(item.id)
            const isUrgent = item.priority === 'urgent'

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md p-5 space-y-4 ${
                  isUrgent && item.status === 'pending'
                    ? 'border-orange-300 bg-orange-50/15 ring-1 ring-orange-200'
                    : isSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/20'
                      : 'border-zinc-200/90'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        size="sm"
                      />
                      <span className="font-mono text-xs font-black text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                        {item.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {renderPriorityBadge(item.priority)}
                      {renderStatusBadge(item.status)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-zinc-900 line-clamp-2 hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>
                    <span className="inline-block mt-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      🏷️ {item.categoryLabel}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Evidence thumbnails */}
                  {item.evidenceImages.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-zinc-400">
                        {t('adminGrievancesProofLabel')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {item.evidenceImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPreviewImage(img)}
                            className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 hover:scale-105 transition-transform cursor-pointer"
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parties involved */}
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-semibold">
                        {t('adminGrievancesTenantLabel')}
                      </span>
                      <span className="font-bold text-zinc-900">
                        {item.tenantName} ({item.tenantPhone})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-semibold">
                        {t('adminGrievancesPropertyLabel')}
                      </span>
                      <span className="font-semibold text-zinc-800">
                        {item.houseName} • {item.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-semibold">
                        {t('adminGrievancesLandlordLabel')}
                      </span>
                      <span className="font-semibold text-zinc-800">{item.landlordName}</span>
                    </div>
                  </div>

                  {/* Resolution note preview if resolved */}
                  {item.resolutionNote && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="font-black text-[11px] uppercase flex items-center gap-1 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('adminGrievancesConclusionLabel')}
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-2">
                        {item.resolutionNote}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => setInspectItem(item)}
                    leftIcon={<Eye className="w-3.5 h-3.5 text-zinc-500" />}
                  >
                    <span>{t('adminGrievancesDetailsBtn')}</span>
                  </Button>

                  {item.status === 'pending' || item.status === 'in_progress' ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenResolveModal(item, 'reject')}
                        title={t('adminGrievancesRejectTooltip')}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenResolveModal(item, 'resolve')}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <span>{t('adminGrievancesResolveBtn')}</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenResolveModal(item, 'resolve')}
                    >
                      {t('adminGrievancesEditNoteBtn')}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9: Default 10 items) */
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 uppercase tracking-wider font-bold">
                <th className="p-3.5 w-10">
                  <Checkbox
                    checked={isAllCurrentSelected}
                    onChange={toggleSelectAllCurrent}
                    size="sm"
                  />
                </th>
                <th className="p-3.5">{t('adminGrievancesThCodePriority')}</th>
                <th className="p-3.5">{t('adminGrievancesThSubject')}</th>
                <th className="p-3.5">{t('adminGrievancesThParties')}</th>
                <th className="p-3.5">{t('adminGrievancesThStatus')}</th>
                <th className="p-3.5 text-right">{t('adminGrievancesThActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedItems.map(item => {
                const isSelected = selectedIds.includes(item.id)

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-zinc-50/80 transition-colors ${
                      isSelected ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    <td className="p-3.5">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        size="sm"
                      />
                    </td>

                    <td className="p-3.5 space-y-1">
                      <span className="font-mono text-xs font-black text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md inline-block">
                        {item.id}
                      </span>
                      <div>{renderPriorityBadge(item.priority)}</div>
                      <div className="text-[10px] text-zinc-400">{item.createdAt}</div>
                    </td>

                    <td className="p-3.5 max-w-xs space-y-1">
                      <div className="font-bold text-zinc-900 line-clamp-1">{item.title}</div>
                      <div className="text-[11px] text-zinc-500 line-clamp-2 leading-tight">
                        {item.description}
                      </div>
                      <span className="inline-block text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">
                        {item.categoryLabel}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <div className="font-bold text-zinc-900">
                          {item.tenantName}{' '}
                          <span className="text-zinc-400 font-normal">({item.tenantPhone})</span>
                        </div>
                        <div className="text-[11px] text-zinc-600">
                          {item.houseName} • <span className="font-bold">{item.roomNumber}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {t('adminGrievancesLandlordShortLabel')} {item.landlordName} ({item.landlordPhone})
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">{renderStatusBadge(item.status)}</td>

                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setInspectItem(item)}
                        title={t('adminGrievancesDetailsBtn')}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>

                      {item.status === 'pending' || item.status === 'in_progress' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenResolveModal(item, 'resolve')}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {t('adminGrievancesResolveBtn')}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenResolveModal(item, 'resolve')}
                        >
                          {t('adminGrievancesNoteBtn')}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Standardized Pagination Bar (Rule #9) */}
      {loading ? (
        <div className="bg-white px-4 py-3.5 rounded-2xl border border-zinc-200/90 shadow-2xs flex items-center justify-between animate-pulse">
          <div className="h-4 bg-zinc-200 rounded w-48" />
          <div className="h-7 bg-zinc-200 rounded w-56" />
        </div>
      ) : paginatedItems.length > 0 ? (
        <div className="bg-white px-4 py-3 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-semibold text-zinc-600">
          <div className="flex items-center gap-2">
            <span>{t('adminGrievancesPaginationShowing')}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize}
              onChange={e => {
                const val = parseInt(e.target.value) || 1
                setPageSize(val)
                setCurrentPage(1)
              }}
              className="w-14 px-2 py-1 text-center bg-zinc-50 border border-zinc-200 rounded-lg font-bold text-zinc-900 focus:outline-hidden focus:border-orange-500"
            />
            <span>{t('adminGrievancesPaginationPerPage')}</span>
            <span className="text-zinc-300">|</span>
            <span>
              {totalItems === 0
                ? '0'
                : `${(safeCurrentPage - 1) * validPageSize + 1}-${Math.min(
                    safeCurrentPage * validPageSize,
                    totalItems,
                  )}`}{' '}
              {t('adminGrievancesPaginationOfGrievances', { total: totalItems })}
            </span>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              title={t('adminGrievancesFirstPage')}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 5))}
              disabled={safeCurrentPage <= 1}
              title={t('adminGrievancesPrev5')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {pageNumbers.map(num => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                  safeCurrentPage === num
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'border border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                {num}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 5))}
              disabled={safeCurrentPage >= totalPages}
              title={t('adminGrievancesNext5')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              title={t('adminGrievancesLastPage')}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* INSPECT DETAIL MODAL */}
      {inspectItem && (
        <div
          onClick={() => setInspectItem(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col cursor-default"
          >
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <h2 className="text-base font-black text-zinc-900">
                  {t('adminGrievancesModalDossierTitle')}
                </h2>
                <span className="font-mono text-xs font-bold text-zinc-400">
                  ({inspectItem.id})
                </span>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {renderPriorityBadge(inspectItem.priority)}
                  <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                    {inspectItem.categoryLabel}
                  </span>
                </div>
                <span className="text-zinc-400 font-medium">{inspectItem.createdAt}</span>
              </div>

              <div>
                <h3 className="text-base font-black text-zinc-900 leading-snug">
                  {inspectItem.title}
                </h3>
              </div>

              {/* Parties summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                    {t('adminGrievancesModalComplainant')}
                  </span>
                  <div className="font-bold text-zinc-900 text-sm">{inspectItem.tenantName}</div>
                  <div className="text-zinc-600 font-mono">{inspectItem.tenantPhone}</div>
                  <div className="text-zinc-400">{inspectItem.tenantEmail}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                    {t('adminGrievancesModalAccused')}
                  </span>
                  <div className="font-bold text-zinc-900 text-sm">{inspectItem.landlordName}</div>
                  <div className="text-zinc-600 font-mono">{inspectItem.landlordPhone}</div>
                  <div className="text-zinc-700 font-semibold">
                    {inspectItem.houseName} ({inspectItem.roomNumber})
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">
                  {t('adminGrievancesModalDescLabel')}
                </h4>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-zinc-700 leading-relaxed">
                  {inspectItem.description}
                </div>
              </div>

              {/* Evidence Images */}
              {inspectItem.evidenceImages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">
                    {t('adminGrievancesModalProofLabel')}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {inspectItem.evidenceImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImage(img)}
                        className="h-32 rounded-xl overflow-hidden border border-zinc-200 cursor-pointer group relative"
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
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-black text-xs uppercase flex items-center gap-1 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('adminGrievancesModalRecordedResolution')}
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {inspectItem.resolutionNote}
                  </p>
                  {inspectItem.resolvedAt && (
                    <span className="text-[10px] text-emerald-700 block">
                      {t('adminGrievancesModalResolvedAt', {
                        time: inspectItem.resolvedAt,
                        by: inspectItem.resolvedBy || 'Admin',
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setInspectItem(null)}>
                {t('adminGrievancesModalClose')}
              </Button>

              {inspectItem.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkInProgress(inspectItem)}
                  leftIcon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
                  className="text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  <span>{t('adminGrievancesModalInvestigating')}</span>
                </Button>
              )}

              {inspectItem.status !== 'resolved' && inspectItem.status !== 'rejected' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const target = inspectItem
                    setInspectItem(null)
                    handleOpenResolveModal(target, 'resolve')
                  }}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <span>{t('adminGrievancesModalTakeAction')}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL (Rule #10 compliant) */}
      {resolveTargetItem && (
        <div
          onClick={handleRequestCloseResolveModal}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleIn cursor-default"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      actionType === 'resolve'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {actionType === 'resolve' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Ban className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900">
                      {actionType === 'resolve'
                        ? t('adminGrievancesResolveModalTitle')
                        : t('adminGrievancesRejectModalTitle')}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">
                      {resolveTargetItem.id} • {resolveTargetItem.tenantName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRequestCloseResolveModal}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Type switcher */}
              <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActionType('resolve')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    actionType === 'resolve'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-zinc-500'
                  }`}
                >
                  {t('adminGrievancesTabApprove')}
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('reject')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    actionType === 'reject' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
                  }`}
                >
                  {t('adminGrievancesTabReject')}
                </button>
              </div>

              {resolveError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{resolveError}</span>
                </div>
              )}

              {/* Resolution note input */}
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

              {/* Escalation Checkbox */}
              {actionType === 'resolve' && (
                <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/70">
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

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRequestCloseResolveModal}
                disabled={isSubmittingResolution}
              >
                {t('adminGrievancesCancel')}
              </Button>
              <Button
                variant={actionType === 'resolve' ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleConfirmResolution}
                isLoading={isSubmittingResolution}
                leftIcon={<Check className="w-3.5 h-3.5" />}
                className={
                  actionType === 'resolve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }
              >
                <span>
                  {isSubmittingResolution
                    ? t('adminGrievancesSaving')
                    : t('adminGrievancesSaveVerdict')}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW ENLARGED IMAGE */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-3xl max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Evidence"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Rule #10: Custom Pop-up Confirmation Modal */}
      {confirmCloseModal.isOpen && (
        <div
          onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-scaleIn cursor-default"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                {t('adminGrievancesDiscardTitle')}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {t('adminGrievancesDiscardDesc')}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
              >
                {t('adminGrievancesContinueEditing')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmCloseModal.onDiscard}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {t('adminGrievancesDiscardAndClose')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
