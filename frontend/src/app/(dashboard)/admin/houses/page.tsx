'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import {
  getAdminHouses,
  lockAdminHouse,
  unlockAdminHouse,
  AdminHouseModerationItem,
} from '@/services/boarding-house.service'
import {
  Building2,
  Search,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RefreshCw,
  Filter,
  RotateCcw,
  Check,
  ChevronDown,
} from 'lucide-react'
import { Button, TableActionButton, TextInput, NumberInput, TextareaInput, Pagination } from '@/components/ui'

export type HouseModerationItem = AdminHouseModerationItem

export default function AdminBoardingHouseModerationPage() {
  const { locale } = useLanguage()
  const t = useTranslations('admin')

  // Data State
  const [houses, setHouses] = useState<HouseModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Table Mode state (Table Mode only - Rule #9)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Multi-Value Column Filters State
  const [propertyQuery, setPropertyQuery] = useState('')
  const [landlordQuery, setLandlordQuery] = useState('')
  const [minRooms, setMinRooms] = useState('')
  const [maxRooms, setMaxRooms] = useState('')
  const [minOccupancy, setMinOccupancy] = useState('')
  const [maxOccupancy, setMaxOccupancy] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([]) // empty = all, or combination of active, locked, reported
  const [tableStatusDropdownOpen, setTableStatusDropdownOpen] = useState(false)

  // Debounced filter inputs for responsive typing without hammering the API (300ms)
  const [debouncedProperty, setDebouncedProperty] = useState(propertyQuery)
  const [debouncedLandlord, setDebouncedLandlord] = useState(landlordQuery)
  const [debouncedMinRooms, setDebouncedMinRooms] = useState(minRooms)
  const [debouncedMaxRooms, setDebouncedMaxRooms] = useState(maxRooms)
  const [debouncedMinOccupancy, setDebouncedMinOccupancy] = useState(minOccupancy)
  const [debouncedMaxOccupancy, setDebouncedMaxOccupancy] = useState(maxOccupancy)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProperty(propertyQuery), 300)
    return () => clearTimeout(timer)
  }, [propertyQuery])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLandlord(landlordQuery), 300)
    return () => clearTimeout(timer)
  }, [landlordQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinRooms(minRooms)
      setDebouncedMaxRooms(maxRooms)
    }, 300)
    return () => clearTimeout(timer)
  }, [minRooms, maxRooms])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinOccupancy(minOccupancy)
      setDebouncedMaxOccupancy(maxOccupancy)
    }, 300)
    return () => clearTimeout(timer)
  }, [minOccupancy, maxOccupancy])

  // Lock Modal State
  const [lockTarget, setLockTarget] = useState<HouseModerationItem | null>(null)
  const [lockReason, setLockReason] = useState('')
  const [lockReasonError, setLockReasonError] = useState('')
  const [isLocking, setIsLocking] = useState(false)

  // Unlock Modal State
  const [unlockTarget, setUnlockTarget] = useState<HouseModerationItem | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)

  // Status options definition
  const statusOptions = useMemo(
    () => [
      { id: 'active', label: t('adminHouseModStatusActive') || 'Hoạt động' },
      { id: 'locked', label: t('adminHouseModStatusLocked') || 'Bị khóa' },
      { id: 'reported', label: t('adminHouseModStatusReported') || 'Báo cáo' },
    ],
    [t],
  )

  const toggleStatusFilter = (statusId: string) => {
    setStatusFilters(prev => {
      const next = prev.includes(statusId) ? prev.filter(s => s !== statusId) : [...prev, statusId]
      setCurrentPage(1)
      return next
    })
  }

  const hasActiveFilters = Boolean(
    propertyQuery.trim() ||
    landlordQuery.trim() ||
    minRooms !== '' ||
    maxRooms !== '' ||
    minOccupancy !== '' ||
    maxOccupancy !== '' ||
    statusFilters.length > 0,
  )

  const resetAllFilters = () => {
    setPropertyQuery('')
    setLandlordQuery('')
    setMinRooms('')
    setMaxRooms('')
    setMinOccupancy('')
    setMaxOccupancy('')
    setStatusFilters([])
    setCurrentPage(1)
  }

  // Fetch live boarding houses directly from backend API
  const fetchHouses = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true)
      setError(null)
      try {
        const res = await getAdminHouses({
          propertyQuery: debouncedProperty.trim() || undefined,
          landlordQuery: debouncedLandlord.trim() || undefined,
          minRooms: debouncedMinRooms !== '' ? Number(debouncedMinRooms) : undefined,
          maxRooms: debouncedMaxRooms !== '' ? Number(debouncedMaxRooms) : undefined,
          minOccupancy: debouncedMinOccupancy !== '' ? Number(debouncedMinOccupancy) : undefined,
          maxOccupancy: debouncedMaxOccupancy !== '' ? Number(debouncedMaxOccupancy) : undefined,
          status: statusFilters.length > 0 ? statusFilters.join(',') : undefined,
          page: currentPage,
          limit: pageSize,
        })

        const list = res?.data || []
        setHouses(list)
        const total = res?.pagination?.total ?? res?.meta?.total ?? list.length
        setTotalItems(total)
        const pages =
          res?.pagination?.totalPages ??
          res?.meta?.totalPages ??
          Math.max(1, Math.ceil(total / pageSize))
        setTotalPages(pages)
      } catch (err: any) {
        console.error('Failed to fetch admin houses from backend:', err)
        setError(err?.message || t('adminBlogsFetchError'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [
      debouncedProperty,
      debouncedLandlord,
      debouncedMinRooms,
      debouncedMaxRooms,
      debouncedMinOccupancy,
      debouncedMaxOccupancy,
      statusFilters,
      currentPage,
      pageSize,
      t,
    ],
  )

  useEffect(() => {
    fetchHouses()
  }, [fetchHouses])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchHouses(true)
    setFeedbackMsg({ type: 'success', text: t('adminBlogsRefresh') })
    setTimeout(() => setFeedbackMsg(null), 3000)
  }

  const validPageSize = Math.max(1, Number(pageSize) || 10)
  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages))

  // Lock handler
  const handleOpenLock = (item: HouseModerationItem) => {
    setLockTarget(item)
    setLockReason('')
    setLockReasonError('')
  }

  const handleConfirmLock = async () => {
    if (!lockTarget) return
    if (!lockReason.trim()) {
      setLockReasonError(t('adminHouseModLockReasonRequired'))
      return
    }
    setIsLocking(true)
    try {
      await lockAdminHouse(lockTarget.id, lockReason.trim())
      await fetchHouses(true)
      setLockTarget(null)
      setLockReason('')
      setFeedbackMsg({ type: 'success', text: t('adminHouseModLockSuccess') })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } catch (err: any) {
      console.error('Failed to lock house:', err)
      setLockReasonError(err?.message || 'Không thể khóa tòa nhà')
    } finally {
      setIsLocking(false)
    }
  }

  // Unlock handler
  const handleOpenUnlock = (item: HouseModerationItem) => {
    setUnlockTarget(item)
  }

  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return
    setIsUnlocking(true)
    try {
      await unlockAdminHouse(unlockTarget.id)
      await fetchHouses(true)
      setUnlockTarget(null)
      setFeedbackMsg({ type: 'success', text: t('adminHouseModUnlockSuccess') })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } catch (err: any) {
      console.error('Failed to unlock house:', err)
      setFeedbackMsg({ type: 'error', text: err?.message || 'Không thể mở khóa tòa nhà' })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } finally {
      setIsUnlocking(false)
    }
  }

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-accent-soft text-accent tracking-wide uppercase">
              <Building2 className="w-3.5 h-3.5" />
              {t('adminHouseModBadge')}
            </span>
            <span className="text-xs font-semibold text-muted">• {t('adminBlogsLiveDb')}</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight mt-1">
            {t('adminHouseModTitle')}
          </h1>
          <p className="text-xs text-muted mt-0.5">{t('adminHouseModSubtitle')}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={handleRefresh}
            isLoading={refreshing}
            leftIcon={<RefreshCw />}
            title={t('adminHouseModRefresh')}
          >
            <span className="hidden sm:inline">{t('adminHouseModRefresh')}</span>
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-success-soft border-success-subtle text-success'
              : 'bg-danger-soft border-danger-subtle text-danger'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span className="font-bold">{feedbackMsg.text}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setFeedbackMsg(null)}
          >
            <X />
          </Button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger-soft border border-danger-subtle text-danger text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <Button
            variant="danger"
            onClick={() => fetchHouses()}
            className="shrink-0"
          >
            {t('adminBlogsRetry') || 'Thử lại'}
          </Button>
        </div>
      )}

      <span className="text-xs font-semibold text-muted pl-2">
        {t('adminBlogsShowingCount', { total: totalItems })}
      </span>

      {/* Main Content: Table Mode Only (With Column-Level Filters) */}
      <div className="bg-card rounded-2xl border border-line shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[950px]">
          <thead>
            {/* Row 1: Column Headers */}
            <tr className="border-b border-line bg-surface/70 text-muted uppercase tracking-wider font-black">
              <th className="p-3.5 min-w-[240px]">{t('adminHouseModColHouseAddress')}</th>
              <th className="p-3.5 min-w-[190px]">{t('adminHouseModLandlordContact')}</th>
              <th className="p-3.5 min-w-[170px]">{t('adminHouseModTotalRooms')}</th>
              <th className="p-3.5 min-w-[170px]">{t('adminHouseModOccupancyRate')}</th>
              <th className="p-3.5 min-w-[180px]">{t('adminHouseModColStatus')}</th>
              <th className="p-3.5 text-right min-w-[90px]">{t('adminHouseModColActions')}</th>
            </tr>

            {/* Row 2: Column-level Filter Inputs Row */}
            <tr className="border-b border-line bg-zinc-100/75">
              {/* 1. Property & Address search */}
              <th className="p-2">
                <div className="relative">
                  <TextInput
                    type="text"
                    value={propertyQuery}
                    onChange={e => {
                      setPropertyQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder={t('adminHouseModFilterPropertyPlaceholder')}
                    containerClassName="space-y-0"
                    className="py-1.5 bg-card border-line rounded-lg text-[11px] font-medium text-foreground placeholder:text-muted focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
                    leftIcon={<Search className="w-3.5 h-3.5 text-muted" />}
                    rightIcon={
                      propertyQuery ? (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setPropertyQuery('')
                            setCurrentPage(1)
                          }}
                          title={t('adminHouseModFilterClearTooltip')}
                        >
                          <X />
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              </th>

              {/* 2. Landlord Contact search */}
              <th className="p-2">
                <div className="relative">
                  <TextInput
                    type="text"
                    value={landlordQuery}
                    onChange={e => {
                      setLandlordQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder={t('adminHouseModFilterLandlordPlaceholder')}
                    containerClassName="space-y-0"
                    className="py-1.5 bg-card border-line rounded-lg text-[11px] font-medium text-foreground placeholder:text-muted focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
                    leftIcon={<Search className="w-3.5 h-3.5 text-muted" />}
                    rightIcon={
                      landlordQuery ? (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setLandlordQuery('')
                            setCurrentPage(1)
                          }}
                          title={t('adminHouseModFilterClearTooltip')}
                        >
                          <X />
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              </th>

              {/* 3. Total Rooms range filter */}
              <th className="p-2">
                <div className="flex items-center gap-1.5">
                  <NumberInput
                    min={0}
                    value={minRooms}
                    onChange={e => {
                      setMinRooms(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder={t('adminHouseModFilterFrom')}
                    containerClassName="space-y-0 w-16"
                    className="px-1.5 py-1.5 bg-card border-line rounded-lg text-[11px] text-center font-medium text-foreground placeholder:text-muted focus:border-orange-500"
                  />
                  <span className="text-muted text-xs">-</span>
                  <NumberInput
                    min={0}
                    value={maxRooms}
                    onChange={e => {
                      setMaxRooms(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder={t('adminHouseModFilterTo')}
                    containerClassName="space-y-0 w-16"
                    className="px-1.5 py-1.5 bg-card border-line rounded-lg text-[11px] text-center font-medium text-foreground placeholder:text-muted focus:border-orange-500"
                  />
                  {(minRooms || maxRooms) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setMinRooms('')
                        setMaxRooms('')
                        setCurrentPage(1)
                      }}
                      title={t('adminHouseModFilterClearRoomsTooltip')}
                    >
                      <X />
                    </Button>
                  )}
                </div>
              </th>

              {/* 4. Occupancy Rate range filter */}
              <th className="p-2">
                <div className="flex items-center gap-1.5">
                  <NumberInput
                    min={0}
                    max={100}
                    value={minOccupancy}
                    onChange={e => {
                      setMinOccupancy(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder={t('adminHouseModFilterOccupancyFrom')}
                    containerClassName="space-y-0 w-16"
                    className="px-1.5 py-1.5 bg-card border-line rounded-lg text-[11px] text-center font-medium text-foreground placeholder:text-muted focus:border-orange-500"
                  />
                  <span className="text-muted text-xs">-</span>
                  <NumberInput
                    min={0}
                    max={100}
                    value={maxOccupancy}
                    onChange={e => {
                      setMaxOccupancy(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder={t('adminHouseModFilterOccupancyTo')}
                    containerClassName="space-y-0 w-16"
                    className="px-1.5 py-1.5 bg-card border-line rounded-lg text-[11px] text-center font-medium text-foreground placeholder:text-muted focus:border-orange-500"
                  />
                  {(minOccupancy || maxOccupancy) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setMinOccupancy('')
                        setMaxOccupancy('')
                        setCurrentPage(1)
                      }}
                      title={t('adminHouseModFilterClearOccupancyTooltip')}
                    >
                      <X />
                    </Button>
                  )}
                </div>
              </th>

              {/* 5. Status multi-filter dropdown */}
              <th className="p-2 relative">
                <div className="relative">
                  <Button fullWidth
                    variant="ghost"
                    onClick={() => setTableStatusDropdownOpen(!tableStatusDropdownOpen)}
                  >
                    <span className="truncate">
                      {statusFilters.length === 0
                        ? t('adminHouseModFilterStatusAll')
                        : t('adminHouseModFilterStatusSelected', { count: statusFilters.length })}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
                  </Button>

                  {tableStatusDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setTableStatusDropdownOpen(false)}
                      />
                      <div className="absolute left-0 mt-1 w-52 bg-card rounded-xl border border-line shadow-xl p-2 z-30 space-y-1 animate-scaleIn">
                        <div className="flex items-center justify-between pb-1.5 border-b border-line text-[10px] font-bold text-muted px-1">
                          <span>{t('adminHouseModFilterStatusHeader')}</span>
                          {statusFilters.length > 0 && (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setStatusFilters([])
                                setCurrentPage(1)
                              }}
                            >
                              {t('adminHouseModFilterDeselect')}
                            </Button>
                          )}
                        </div>
                        {statusOptions.map(opt => {
                          const checked = statusFilters.includes(opt.id)
                          return (
                            <label
                              key={opt.id}
                              onClick={() => toggleStatusFilter(opt.id)}
                              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-card-hover text-xs font-semibold text-foreground/90 cursor-pointer"
                            >
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                  checked
                                    ? 'bg-orange-600 border-orange-600 text-white'
                                    : 'border-line bg-card'
                                }`}
                              >
                                {checked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="flex-1">{opt.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </th>

              {/* 6. Clear column filters action */}
              <th className="p-2 text-right">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={resetAllFilters}
                    title={t('adminHouseModFilterClearAll')}
                  >
                    <RotateCcw />
                  </Button>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-line shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-line rounded-md w-3/4" />
                        <div className="h-2.5 bg-card-hover rounded-md w-1/2" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="space-y-1.5">
                      <div className="h-3.5 bg-line rounded-md w-28" />
                      <div className="h-2.5 bg-card-hover rounded-md w-20" />
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="h-3.5 bg-line rounded-md w-14" />
                  </td>
                  <td className="p-3.5">
                    <div className="h-3.5 bg-line rounded-md w-20" />
                  </td>
                  <td className="p-3.5">
                    <div className="h-5 bg-line rounded-full w-20" />
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="h-7 w-7 bg-line rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : houses.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-muted">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-card-hover text-muted flex items-center justify-center mx-auto">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{t('adminBlogsNoPosts')}</h3>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      {hasActiveFilters
                        ? t('adminHouseModEmptyFiltered')
                        : t('adminBlogsNoPostsDesc')}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        onClick={resetAllFilters}
                        className="mt-2"
                        leftIcon={<RotateCcw />}
                      >
                        <span>{t('adminHouseModFilterClearAll')}</span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              houses.map(item => {
                const occupancyRate =
                  item.occupancyRate ??
                  (item.totalRooms > 0
                    ? Math.round((item.occupiedRooms / item.totalRooms) * 100)
                    : 0)
                return (
                  <tr key={item.id} className="hover:bg-card-hover transition-colors duration-150">
                    <td className="p-3.5 max-w-xs">
                      <Link
                        href={`/admin/houses/${item.id}`}
                        className="cursor-pointer group flex items-center gap-3"
                      >
                        <img
                          src={item.coverImage || '/house-placeholder.jpg'}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-line"
                        />
                        <div>
                          <div className="font-bold text-foreground group-hover:text-orange-600 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-muted line-clamp-1">
                            {item.address}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{item.landlordName}</div>
                      <div className="text-[11px] text-muted">{item.landlordPhone}</div>
                    </td>
                    <td className="p-3.5 font-bold text-foreground">
                      {item.totalRooms} {t('adminHouseModRoomsUnit')}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">
                        {item.occupiedRooms}/{item.totalRooms} ({occupancyRate}%)
                      </div>
                    </td>
                    <td className="p-3.5 space-y-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                          item.status === 'active'
                            ? 'bg-success-soft text-success'
                            : item.status === 'locked'
                              ? 'bg-danger-soft text-danger ring-1 ring-red-300'
                              : 'bg-warning-soft text-warning'
                        }`}
                      >
                        {item.status === 'active'
                          ? t('adminHouseModStatusActive')
                          : item.status === 'locked'
                            ? t('adminHouseModStatusLocked')
                            : t('adminHouseModStatusReported')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {item.status === 'locked' ? (
                        <TableActionButton
                          icon={<Unlock />}
                          onClick={() => handleOpenUnlock(item)}
                          title={t('adminHouseModUnlockHouse')}
                        />
                      ) : (
                        <TableActionButton
                          icon={<Lock />}
                          onClick={() => handleOpenLock(item)}
                          title={t('adminHouseModLockHouse')}
                        />
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Standardized Pagination Bar */}
      <Pagination
        currentPage={safeCurrentPage}
        totalItems={totalItems}
        pageSize={validPageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeMax={100}
      />

      {/* LOCK HOUSE MODAL */}
      {lockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-danger-soft border border-danger-subtle flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {t('adminHouseModLockHouse')}
                </h3>
                <p className="text-xs text-muted font-mono truncate max-w-[240px]">
                  {lockTarget.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              {t('adminHouseModLockConfirmDesc')}
            </p>

            <div className="space-y-1.5 text-left">
              <TextareaInput
                label={t('adminHouseModLockReasonLabel')}
                required
                rows={3}
                value={lockReason}
                onChange={e => {
                  setLockReason(e.target.value)
                  if (lockReasonError) setLockReasonError('')
                }}
                placeholder={t('adminHouseModLockReasonPlaceholder')}
                error={lockReasonError}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button
                variant="secondary"
                onClick={() => setLockTarget(null)}
                disabled={isLocking}
              >
                {t('adminBlogsCancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmLock}
                disabled={isLocking || !lockReason.trim()}
                isLoading={isLocking}
              >
                <span>{t('adminHouseModLockHouse')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* UNLOCK HOUSE MODAL */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-success">
              <div className="w-10 h-10 rounded-2xl bg-success-soft border border-success-subtle flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {t('adminHouseModUnlockHouse')}
                </h3>
                <p className="text-xs text-muted font-mono truncate max-w-[240px]">
                  {unlockTarget.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              {t('adminHouseModUnlockConfirmDesc', { name: unlockTarget.name })}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button
                variant="secondary"
                onClick={() => setUnlockTarget(null)}
                disabled={isUnlocking}
              >
                {t('adminBlogsCancel')}
              </Button>
              <Button
                onClick={handleConfirmUnlock}
                disabled={isUnlocking}
                isLoading={isUnlocking}
              >
                <span>{t('adminHouseModUnlockHouse')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
