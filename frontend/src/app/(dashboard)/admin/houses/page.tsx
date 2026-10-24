'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  X,
  RefreshCw,
  ChevronDown,
  User,
  Phone,
  DoorOpen,
  PieChart,
} from 'lucide-react'
import {
  Button,
  TableActionButton,
  TextInput,
  NumberInput,
  TextareaInput,
  Pagination,
  ViewModeToggle,
  Card,
  TableRow,
  Modal,
  EmptyState,
} from '@/components/ui'
import { DashboardPageHeader } from '@/components/layout'

export type HouseModerationItem = AdminHouseModerationItem

export default function AdminBoardingHouseModerationPage() {
  const { locale } = useLanguage()
  const t = useTranslations('admin')
  const router = useRouter()

  // Data State
  const [houses, setHouses] = useState<HouseModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Rule #9: Standardized Parallel Grid & Table Views (Grid as default)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6) // Default Grid = 6, Table = 10
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Multi-Value Column Filters State
  const [propertyQuery, setPropertyQuery] = useState('')
  const [landlordQuery, setLandlordQuery] = useState('')
  const [minRooms, setMinRooms] = useState('')
  const [maxRooms, setMaxRooms] = useState('')
  const [minOccupancy, setMinOccupancy] = useState('')
  const [maxOccupancy, setMaxOccupancy] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
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

  // Handle View Mode switch
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    setPageSize(mode === 'grid' ? 6 : 10)
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

  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === 'grid' ? 6 : 10))
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
      {/* Header using DashboardPageHeader with size='md' action buttons */}
      <DashboardPageHeader
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-accent-soft text-accent tracking-wide uppercase">
              <Building2 className="w-3.5 h-3.5" />
              {t('adminHouseModBadge')}
            </span>
            <span className="text-xs font-semibold text-muted">• {t('adminBlogsLiveDb')}</span>
          </div>
        }
        title={t('adminHouseModTitle')}
        subtitle={t('adminHouseModSubtitle')}
        actions={
          <Button
            variant="outline"
            size="md"
            onClick={handleRefresh}
            isLoading={refreshing}
            leftIcon={<RefreshCw />}
            title={t('adminHouseModRefresh')}
          >
            <span className="hidden sm:inline">{t('adminHouseModRefresh')}</span>
          </Button>
        }
      />

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
            size="md"
            onClick={() => fetchHouses()}
            className="shrink-0"
          >
            {t('adminBlogsRetry') || 'Thử lại'}
          </Button>
        </div>
      )}

      {/* Toolbar: Total count, Search filter, View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <span className="text-xs font-semibold text-muted pl-1">
          {t('adminBlogsShowingCount', { total: totalItems })}
        </span>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="text-xs text-muted hover:text-foreground"
            >
              {t('adminBlogsClearFilters') || 'Xóa bộ lọc'}
            </Button>
          )}
          <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
        </div>
      </div>

      {/* Main Content: Parallel Grid & Table Views */}
      {viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9: Default Grid view) */
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-line p-4 space-y-3 animate-pulse"
              >
                <div className="h-40 bg-line rounded-xl" />
                <div className="h-4 bg-line rounded w-3/4" />
                <div className="h-3 bg-line rounded w-1/2" />
                <div className="h-10 bg-card-hover rounded-xl" />
              </div>
            ))}
          </div>
        ) : houses.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-10 h-10 text-muted" />}
            title={t('adminBlogsNoPosts') || 'Không tìm thấy nhà trọ nào'}
            description={t('adminHouseModEmptyDesc') || 'Không có tòa nhà nào phù hợp với bộ lọc hiện tại.'}
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="md" onClick={resetAllFilters}>
                  {t('adminBlogsClearFilters') || 'Xóa bộ lọc'}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {houses.map(item => {
              const occupancyRate =
                item.occupancyRate ??
                (item.totalRooms > 0
                  ? Math.round((item.occupiedRooms / item.totalRooms) * 100)
                  : 0)

              return (
                <Card
                  key={item.id}
                  interactive
                  onClick={() => router.push(`/admin/houses/${item.id}`)}
                  className="overflow-hidden flex flex-col justify-between group cursor-pointer border border-line hover:border-primary/50 transition-all duration-200"
                >
                  <div>
                    {/* Cover Image & Status Badge */}
                    <div className="relative h-44 w-full bg-surface overflow-hidden rounded-xl border border-line mb-3">
                      <img
                        src={item.coverImage || '/house-placeholder.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs backdrop-blur-xs ${
                          item.status === 'active'
                            ? 'bg-success-soft text-success border border-success-subtle'
                            : item.status === 'locked'
                              ? 'bg-danger-soft text-danger border border-danger-subtle'
                              : 'bg-warning-soft text-warning border border-warning-subtle'
                        }`}
                      >
                        {item.status === 'active'
                          ? t('adminHouseModStatusActive')
                          : item.status === 'locked'
                            ? t('adminHouseModStatusLocked')
                            : t('adminHouseModStatusReported')}
                      </span>
                    </div>

                    {/* House Info */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted line-clamp-1">
                        {item.address}
                      </p>
                    </div>

                    {/* Landlord Contact */}
                    <div className="mt-3 p-2.5 rounded-xl bg-surface/60 border border-line space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <User className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="truncate">{item.landlordName || '---'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted text-[11px]">
                        <Phone className="w-3 h-3 text-muted shrink-0" />
                        <span>{item.landlordPhone || '---'}</span>
                      </div>
                    </div>

                    {/* Metrics: Rooms & Occupancy */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="p-2 rounded-xl bg-card-hover flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <div className="text-[10px] text-muted uppercase font-bold">{t('adminHouseModTotalRooms')}</div>
                          <div className="font-bold text-foreground">{item.totalRooms} {t('adminHouseModRoomsUnit')}</div>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-card-hover flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <div className="text-[10px] text-muted uppercase font-bold">{t('adminHouseModOccupancyRate')}</div>
                          <div className="font-bold text-foreground">{occupancyRate}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions (Row click navigates; button stops propagation) */}
                  <div className="pt-3 mt-3 border-t border-line flex items-center justify-between">
                    <span className="text-[11px] text-muted font-medium">
                      {item.occupiedRooms}/{item.totalRooms} phòng đã thuê
                    </span>
                    <div>
                      {item.status === 'locked' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenUnlock(item)}
                          leftIcon={<Unlock className="w-3.5 h-3.5 text-success" />}
                        >
                          {t('adminHouseModUnlockHouse')}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenLock(item)}
                          leftIcon={<Lock className="w-3.5 h-3.5 text-danger" />}
                        >
                          {t('adminHouseModLockHouse')}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        /* TABLE VIEW (With Column-Level Filters) */
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
              <tr className="border-b border-line bg-surface/40">
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
                      className="py-1.5 bg-card border-line rounded-lg text-[11px] font-medium text-foreground placeholder:text-muted focus:border-primary transition-all"
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
                      className="py-1.5 bg-card border-line rounded-lg text-[11px] font-medium text-foreground placeholder:text-muted focus:border-primary transition-all"
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
                      className="px-1.5 py-1.5 bg-card border-line rounded-lg text-[11px] text-center font-medium text-foreground placeholder:text-muted focus:border-primary"
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
                      className="px-1.5 py-1.5 bg-card border-line rounded-lg text-[11px] text-center font-medium text-foreground placeholder:text-muted focus:border-primary"
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
                      className="px-1.5 py-1.5 bg-card border-line rounded-lg text-[11px] text-center font-medium text-foreground placeholder:text-muted focus:border-primary"
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
                      className="px-1.5 py-1.5 bg-card border-line rounded-lg text-[11px] text-center font-medium text-foreground placeholder:text-muted focus:border-primary"
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
                    <Button
                      fullWidth
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
                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-card-hover cursor-pointer text-xs font-semibold text-foreground"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleStatusFilter(opt.id)}
                                  className="w-3.5 h-3.5 rounded text-primary focus:ring-primary/20 accent-primary"
                                />
                                <span>{opt.label}</span>
                              </label>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </th>

                {/* 6. Action column - Reset all filters */}
                <th className="p-2 text-right">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={resetAllFilters}
                      title={t('adminHouseModFilterClearAllTooltip')}
                    >
                      <X />
                    </Button>
                  )}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line font-medium text-foreground">
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-line rounded-xl" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 bg-line rounded" />
                          <div className="h-2.5 w-44 bg-line rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1.5">
                        <div className="h-3 w-28 bg-line rounded" />
                        <div className="h-2.5 w-20 bg-line rounded" />
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="h-3 w-16 bg-line rounded" />
                    </td>
                    <td className="p-3.5">
                      <div className="h-3 w-20 bg-line rounded" />
                    </td>
                    <td className="p-3.5">
                      <div className="h-5 w-20 bg-line rounded-full" />
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
                        {t('adminHouseModEmptyDesc') ||
                          'Không có tòa nhà nào phù hợp với bộ lọc đã chọn.'}
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={resetAllFilters}
                        >
                          {t('adminBlogsClearFilters') || 'Xóa bộ lọc'}
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
                    <TableRow
                      key={item.id}
                      interactive
                      onClick={() => router.push(`/admin/houses/${item.id}`)}
                    >
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.coverImage || '/house-placeholder.jpg'}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-line"
                          />
                          <div>
                            <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-muted line-clamp-1">
                              {item.address}
                            </div>
                          </div>
                        </div>
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
                    </TableRow>
                  )
                })
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

      {/* LOCK HOUSE MODAL using @/components/ui Modal with size='md' buttons */}
      <Modal
        isOpen={Boolean(lockTarget)}
        onClose={() => setLockTarget(null)}
        size="md"
        icon={<Lock className="w-5 h-5 text-red-600" />}
        title={t('adminHouseModLockHouse')}
        description={lockTarget?.name}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setLockTarget(null)}
              disabled={isLocking}
            >
              {t('adminBlogsCancel')}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmLock}
              disabled={isLocking || !lockReason.trim()}
              isLoading={isLocking}
            >
              {t('adminHouseModLockHouse')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            {t('adminHouseModLockConfirmDesc')}
          </p>
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
      </Modal>

      {/* UNLOCK HOUSE MODAL using @/components/ui Modal with size='md' buttons */}
      <Modal
        isOpen={Boolean(unlockTarget)}
        onClose={() => setUnlockTarget(null)}
        size="md"
        icon={<Unlock className="w-5 h-5 text-success" />}
        title={t('adminHouseModUnlockHouse')}
        description={unlockTarget?.name}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setUnlockTarget(null)}
              disabled={isUnlocking}
            >
              {t('adminBlogsCancel')}
            </Button>
            <Button
              size="md"
              onClick={handleConfirmUnlock}
              disabled={isUnlocking}
              isLoading={isUnlocking}
            >
              {t('adminHouseModUnlockHouse')}
            </Button>
          </>
        }
      >
        <p className="text-xs text-muted leading-relaxed">
          {unlockTarget && t('adminHouseModUnlockConfirmDesc', { name: unlockTarget.name })}
        </p>
      </Modal>
    </div>
  )
}

