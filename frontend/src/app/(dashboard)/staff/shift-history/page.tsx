'use client'

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Building2,
  Shield,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Phone,
  ArrowLeft,
  Search,
  Camera,
  Eye,
  ShieldCheck,
  ArrowRight,
  FileText,
  Loader2,
  Filter,
  RotateCcw,
} from 'lucide-react'
import {
  AttendanceRecord,
  AttendanceWatermark,
  getLocalizedPlace,
  getLocalizedStaffName,
  getLocalizedExplanation,
} from '../data'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { Button, TextInput, NumberInput, SelectInput, Pagination } from '@/components/ui'
import {
  staffAttendanceService,
  StaffAttendanceHistorySummary,
  StaffShiftType,
} from '@/services/staff-attendance.service'

function StaffShiftHistoryContent() {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()

  // Dynamic Shift Types fetched from Backend (no hardcoded data)
  const [availableShifts, setAvailableShifts] = useState<StaffShiftType[]>([])
  const [isShiftsLoading, setIsShiftsLoading] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    setIsShiftsLoading(true)
    staffAttendanceService
      .getShifts()
      .then(shifts => {
        if (mounted) setAvailableShifts(shifts)
      })
      .catch(err => {
        console.error('Failed to load shift types from backend:', err)
        if (mounted) setAvailableShifts([])
      })
      .finally(() => {
        if (mounted) setIsShiftsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Filter Modal & Rule #10 Unsaved Confirmation States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false)
  const [showConfirmCloseModal, setShowConfirmCloseModal] = useState<boolean>(false)

  // Modal Draft States (edited by user inside the filter modal)
  const [modalStartDate, setModalStartDate] = useState<string>('')
  const [modalEndDate, setModalEndDate] = useState<string>('')
  const [modalShift, setModalShift] = useState<string>('all')
  const [modalStatus, setModalStatus] = useState<'all' | 'on_time' | 'late' | 'absent'>('all')

  // Applied Filter States (active filters applied to backend query)
  const [appliedStartDate, setAppliedStartDate] = useState<string>('')
  const [appliedEndDate, setAppliedEndDate] = useState<string>('')
  const [appliedShift, setAppliedShift] = useState<string>('all')
  const [appliedStatus, setAppliedStatus] = useState<'all' | 'on_time' | 'late' | 'absent'>('all')

  const hasAnyAppliedFilter = useMemo(() => {
    return (
      appliedStartDate !== '' ||
      appliedEndDate !== '' ||
      appliedShift !== 'all' ||
      appliedStatus !== 'all'
    )
  }, [appliedStartDate, appliedEndDate, appliedShift, appliedStatus])

  // Check if draft in modal differs from currently applied values (Rule #10)
  const hasModalChanges = useMemo(() => {
    return (
      modalStartDate !== appliedStartDate ||
      modalEndDate !== appliedEndDate ||
      modalShift !== appliedShift ||
      modalStatus !== appliedStatus
    )
  }, [
    modalStartDate,
    modalEndDate,
    modalShift,
    modalStatus,
    appliedStartDate,
    appliedEndDate,
    appliedShift,
    appliedStatus,
  ])

  const handleOpenFilterModal = () => {
    setModalStartDate(appliedStartDate)
    setModalEndDate(appliedEndDate)
    setModalShift(appliedShift)
    setModalStatus(appliedStatus)
    setIsFilterModalOpen(true)
  }

  const handleRequestCloseFilterModal = () => {
    if (hasModalChanges) {
      setShowConfirmCloseModal(true)
    } else {
      setIsFilterModalOpen(false)
    }
  }

  const handleConfirmDiscardAndClose = () => {
    setModalStartDate(appliedStartDate)
    setModalEndDate(appliedEndDate)
    setModalShift(appliedShift)
    setModalStatus(appliedStatus)
    setShowConfirmCloseModal(false)
    setIsFilterModalOpen(false)
  }

  const handleApplyModalFilter = () => {
    setAppliedStartDate(modalStartDate)
    setAppliedEndDate(modalEndDate)
    setAppliedShift(modalShift)
    setAppliedStatus(modalStatus)
    setCurrentPage(1)
    setIsFilterModalOpen(false)
  }

  const handleResetModalDrafts = () => {
    setModalStartDate('')
    setModalEndDate('')
    setModalShift('all')
    setModalStatus('all')
  }

  const handleClearAllFilters = () => {
    setAppliedStartDate('')
    setAppliedEndDate('')
    setAppliedShift('all')
    setAppliedStatus('all')
    setModalStartDate('')
    setModalEndDate('')
    setModalShift('all')
    setModalStatus('all')
    setCurrentPage(1)
  }

  // Data & loading state
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<StaffAttendanceHistorySummary>({
    total: 0,
    onTime: 0,
    late: 0,
    absent: 0,
    hours: '0.0',
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Pagination states (Table view: default 10)
  const [pageSizeInput, setPageSizeInput] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalItems, setTotalItems] = useState<number>(0)

  // Preview watermark photo modal
  const [previewImageModal, setPreviewImageModal] = useState<{
    isOpen: boolean
    title: string
    imageUrl: string
    watermark?: AttendanceWatermark
    note?: string
  } | null>(null)

  const getShiftName = (name: string) => {
    if (name.includes('Sáng')) return `${t('shiftMorning')} (07:00 - 15:00)`
    if (name.includes('Chiều')) return `${t('shiftAfternoon')} (15:00 - 23:00)`
    if (name.includes('Đêm')) return `${t('shiftNight')} (23:00 - 07:00)`
    return name
  }

  // Fetch paginated history from backend API
  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const validPageSize = Math.max(1, pageSizeInput || 10)
      const res = await staffAttendanceService.getHistory({
        page: currentPage,
        limit: validPageSize,
        status: appliedStatus !== 'all' ? appliedStatus : undefined,
        startDate: appliedStartDate || undefined,
        endDate: appliedEndDate || undefined,
        shiftName: appliedShift !== 'all' ? appliedShift : undefined,
      })

      setAttendances(res.data)
      setSummary(res.summary)
      setTotalItems(res.total)
      setTotalPages(res.totalPages)
    } catch (err) {
      console.error('Failed to fetch staff attendance history:', err)
      setAttendances([])
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSizeInput, appliedStatus, appliedStartDate, appliedEndDate, appliedShift])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Sync with check-in / check-out updates
  useEffect(() => {
    const handleSync = () => {
      fetchHistory()
    }
    window.addEventListener('dormio_attendance_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('dormio_attendance_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [fetchHistory])

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* HEADER BAR */}
      <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/staff"
              className="p-1.5 rounded-xl bg-card-hover hover:bg-line text-muted transition-colors"
              title={t('btnBackToOverview')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-black text-primary uppercase tracking-wider">
              {t('attHistoryTag')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {t('attHistoryTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-muted font-medium">{t('attHistorySubtitle')}</p>
        </div>

        {/* Action Link to Work Schedule */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <Link
            href="/staff/schedule"
            className="px-4 py-2.5 rounded-2xl bg-card-hover hover:bg-line text-foreground text-xs font-black flex items-center gap-2 transition-all shadow-2xs border border-line cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-primary" />
            <span>{t('btnViewWorkSchedule')}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted" />
          </Link>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-line shadow-2xs p-4 space-y-2 animate-pulse"
              >
                <div className="h-2.5 w-16 bg-line rounded" />
                <div className="h-7 w-12 bg-line rounded" />
                <div className="h-2.5 w-20 bg-card-hover rounded" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-card rounded-2xl border border-line shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">
                {t('metricTotalShifts')}
              </span>
              <div className="text-2xl font-black text-foreground">{summary.total}</div>
              <span className="text-[10px] font-semibold text-muted block">
                {t('metricMonthSub')}
              </span>
            </div>

            <div className="bg-card rounded-2xl border border-line shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">
                {t('metricOnTime')}
              </span>
              <div className="text-2xl font-black text-primary">{summary.onTime}</div>
              <span className="text-[10px] font-bold text-emerald-600 block">
                {t('metricOnTimeSub')}
              </span>
            </div>

            <div className="bg-card rounded-2xl border border-line shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">
                {t('metricLate')}
              </span>
              <div className="text-2xl font-black text-amber-600">{summary.late}</div>
              <span className="text-[10px] font-medium text-amber-600 block">
                {t('metricLateSub')}
              </span>
            </div>

            <div className="bg-card rounded-2xl border border-line shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">
                {t('metricAbsent')}
              </span>
              <div className="text-2xl font-black text-muted">{summary.absent}</div>
              <span className="text-[10px] font-medium text-muted block">
                {t('metricAbsentSub')}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-card rounded-2xl border border-line shadow-2xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase block">
                {t('metricHours')}
              </span>
              <div className="text-2xl font-black text-purple-600">{summary.hours}h</div>
              <span className="text-[10px] font-bold text-muted block">
                {t('metricHoursSub')}
              </span>
            </div>
          </>
        )}
      </div>

      {/* FILTER CONTROLS BAR (Above Table) */}
      <div className="bg-card rounded-2xl border border-line shadow-2xs p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút bấm "Sử dụng bộ lọc" */}
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleOpenFilterModal}
            title={t('titleFilterOpen')}
          >
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>{t('btnUseFilters')}</span>
            {hasAnyAppliedFilter && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>

          {/* Khi ấn apply ở modal thì hiện filter được áp dụng ở bên cạnh */}
          {hasAnyAppliedFilter ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Date Range Chip */}
              {(appliedStartDate || appliedEndDate) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card-hover border border-line text-foreground text-xs font-semibold">
                  <Calendar className="w-3 h-3 text-primary" />
                  <span>
                    {appliedStartDate && appliedEndDate
                      ? `${appliedStartDate} → ${appliedEndDate}`
                      : appliedStartDate
                        ? t('filterDateFrom', { date: appliedStartDate })
                        : t('filterDateTo', { date: appliedEndDate })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setAppliedStartDate('')
                      setAppliedEndDate('')
                      setCurrentPage(1)
                    }}
                    className="ml-0.5"
                    title={t('titleRemoveDateFilter')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </span>
              )}

              {/* Shift Chip */}
              {appliedShift !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card-hover border border-line text-foreground text-xs font-semibold">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>{getShiftName(appliedShift)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setAppliedShift('all')
                      setCurrentPage(1)
                    }}
                    className="ml-0.5"
                    title={t('titleRemoveShiftFilter')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </span>
              )}

              {/* Status Chip */}
              {appliedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card-hover border border-line text-foreground text-xs font-semibold">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span>
                    {appliedStatus === 'on_time' && t('tableStatusOnTime')}
                    {appliedStatus === 'late' && t('tableStatusLate')}
                    {appliedStatus === 'absent' && t('tableStatusAbsent')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setAppliedStatus('all')
                      setCurrentPage(1)
                    }}
                    className="ml-0.5"
                    title={t('titleRemoveStatusFilter')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </span>
              )}

              {/* Clear All Chip */}
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleClearAllFilters}
                className="ml-1 hover:underline"
              >
                {t('btnClearAll')}
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted font-medium italic">{t('noActiveFilters')}</span>
          )}
        </div>

        {/* Total records count */}
        <div className="text-xs text-muted font-medium self-start md:self-center">
          {t('totalRecords')} <strong className="text-foreground font-bold">{totalItems}</strong>
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="bg-card rounded-2xl border border-line shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/80 border-b border-line text-[11px] font-black text-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t('tableColDate')}</th>
                <th className="py-3.5 px-3">{t('tableColShift')}</th>
                <th className="py-3.5 px-3">{t('tableColCheckIn')}</th>
                <th className="py-3.5 px-3">{t('tableColCheckOut')}</th>
                <th className="py-3.5 px-3">{t('tableColStatus')}</th>
                <th className="py-3.5 px-3">{t('tableColHours')}</th>
                <th className="py-3.5 px-3">{t('tableColNote')}</th>
                <th className="py-3.5 px-3 text-center">{t('tableColAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-medium text-foreground">
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-3">
                        <div className="h-4 w-20 bg-line rounded" />
                      </td>
                      <td className="py-4 px-3">
                        <div className="h-4 w-28 bg-line rounded" />
                      </td>
                      <td className="py-4 px-3">
                        <div className="h-4 w-16 bg-line rounded" />
                      </td>
                      <td className="py-4 px-3">
                        <div className="h-4 w-16 bg-line rounded" />
                      </td>
                      <td className="py-4 px-3">
                        <div className="h-5 w-18 bg-card-hover rounded-lg" />
                      </td>
                      <td className="py-4 px-3">
                        <div className="h-4 w-10 bg-line rounded" />
                      </td>
                      <td className="py-4 px-3">
                        <div className="h-4 w-36 bg-card-hover rounded" />
                      </td>
                      <td className="py-4 px-3 text-center">
                        <div className="h-6 w-10 bg-card-hover rounded-lg mx-auto" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : attendances.length > 0 ? (
                attendances.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-4 px-3 font-bold text-foreground whitespace-nowrap">
                      {item.workDate}
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap font-bold">
                      <div>{getShiftName(item.shiftName)}</div>
                      <div className="text-[10px] text-muted font-normal">{item.shiftTime}</div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span>{item.checkIn || '--:--'}</span>
                        {item.checkInPhoto && (
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() =>
                              setPreviewImageModal({
                                isOpen: true,
                                title: `${t('tableColCheckIn')}: ${item.workDate} (${getShiftName(item.shiftName)})`,
                                imageUrl: item.checkInPhoto!,
                                watermark: item.checkInWatermark
                                  ? {
                                      ...item.checkInWatermark,
                                      place: getLocalizedPlace(item.checkInWatermark.place, locale),
                                      staffName: getLocalizedStaffName(
                                        item.checkInWatermark.staffName,
                                        locale,
                                      ),
                                    }
                                  : undefined,
                                note: getLocalizedExplanation(item.checkInExplanation, locale),
                              })
                            }
                            title={t('viewWatermarkCheckIn')}
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span>{item.checkOut || '--:--'}</span>
                        {item.checkOutPhoto && (
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() =>
                              setPreviewImageModal({
                                isOpen: true,
                                title: `${t('tableColCheckOut')}: ${item.workDate} (${getShiftName(item.shiftName)})`,
                                imageUrl: item.checkOutPhoto!,
                                watermark: item.checkOutWatermark
                                  ? {
                                      ...item.checkOutWatermark,
                                      place: getLocalizedPlace(item.checkOutWatermark.place, locale),
                                      staffName: getLocalizedStaffName(
                                        item.checkOutWatermark.staffName,
                                        locale,
                                      ),
                                    }
                                  : undefined,
                                note: getLocalizedExplanation(item.checkOutExplanation, locale),
                              })
                            }
                            title={t('viewWatermarkCheckOut')}
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      {item.status === 'on_time' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-success-soft text-success border border-success-subtle">
                          {item.isEarlyCheckOut ? t('tableStatusEarly') : t('tableStatusOnTime')}
                        </span>
                      )}
                      {item.status === 'late' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-warning-soft text-warning border border-warning-subtle">
                          {t('tableStatusLate')}
                        </span>
                      )}
                      {item.status === 'absent' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-danger-soft text-danger border border-danger-subtle">
                          {t('tableStatusAbsent')}
                        </span>
                      )}
                      {item.status === 'not_yet' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-card-hover text-muted">
                          {t('statusNotYet')}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 font-black text-primary">{item.totalHours}h</td>
                    <td className="py-4 px-3 text-[11px] text-muted max-w-xs">
                      {item.checkInExplanation ? (
                        <div
                          className="text-warning font-medium truncate"
                          title={getLocalizedExplanation(item.checkInExplanation, locale)}
                        >
                          <span className="font-bold">{t('tableLateShort')}</span> &quot;
                          {getLocalizedExplanation(item.checkInExplanation, locale)}&quot;
                        </div>
                      ) : item.checkOutExplanation ? (
                        <div
                          className="text-warning font-medium truncate"
                          title={getLocalizedExplanation(item.checkOutExplanation, locale)}
                        >
                          <span className="font-bold">{t('tableEarlyShort')}</span> &quot;
                          {getLocalizedExplanation(item.checkOutExplanation, locale)}&quot;
                        </div>
                      ) : item.editedByLandlord ? (
                        <span className="text-blue-600 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> {t('tableManualApproved')}
                        </span>
                      ) : (
                        getLocalizedExplanation(item.note, locale) || '--'
                      )}
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      {item.checkInPhoto || item.checkOutPhoto ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() =>
                            setPreviewImageModal({
                              isOpen: true,
                              title: `${item.workDate} (${getShiftName(item.shiftName)})`,
                              imageUrl: (item.checkInPhoto || item.checkOutPhoto)!,
                              watermark: item.checkInWatermark
                                ? {
                                    ...item.checkInWatermark,
                                    place: getLocalizedPlace(item.checkInWatermark.place, locale),
                                    staffName: getLocalizedStaffName(
                                      item.checkInWatermark.staffName,
                                      locale,
                                    ),
                                  }
                                : undefined,
                              note: getLocalizedExplanation(
                                item.checkInExplanation || item.checkOutExplanation || item.note,
                                locale,
                              ),
                            })
                          }
                          title={t('viewPhotoProof')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <span className="text-zinc-300 font-mono text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && attendances.length === 0 && (
        <div className="p-8 rounded-3xl bg-card border border-dashed border-line text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-card-hover flex items-center justify-center text-muted">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-foreground/90">{t('emptyHistoryTitle')}</p>
          <p className="text-[11px] text-muted">{t('emptyHistoryDesc')}</p>
          {hasAnyAppliedFilter && (
            <div className="pt-1">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={handleClearAllFilters}
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted" />
                <span>{t('btnResetFilters')}</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* RULE #9 STANDARDIZED PAGINATION BAR */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSizeInput}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSizeInput}
        pageSizeMax={100}
      />

      {/* WATERMARK PHOTO MODAL */}
      {previewImageModal && previewImageModal.isOpen && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden cursor-default my-auto border border-line"
          >
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black text-foreground truncate">
                  {previewImageModal.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setPreviewImageModal(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative bg-zinc-950 aspect-video max-h-[380px] flex items-center justify-center">
              <img
                src={previewImageModal.imageUrl}
                alt="Audit proof"
                className="w-full h-full object-contain"
              />
            </div>

            {previewImageModal.watermark && (
              <div className="p-4 bg-zinc-900 text-white space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-primary font-bold">
                  <span>🕒 {previewImageModal.watermark.time}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AUDIT VERIFIED
                  </span>
                </div>
                <div className="text-zinc-200 font-sans text-xs">
                  📍 {previewImageModal.watermark.place}
                </div>
                <div className="text-muted font-sans text-[11px]">
                  👤 {previewImageModal.watermark.staffName} • GPS:{' '}
                  {previewImageModal.watermark.coordinates}
                </div>
              </div>
            )}

            {previewImageModal.note && (
              <div className="p-4 bg-warning-soft border-t border-warning-subtle text-xs text-warning space-y-1">
                <span className="font-bold flex items-center gap-1 text-warning">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {t('explanationNoteTitle')}
                </span>
                <p className="italic text-foreground font-medium">
                  &quot;{previewImageModal.note}&quot;
                </p>
              </div>
            )}

            <div className="p-4 bg-surface border-t border-line flex justify-end">
              <Button size="xs"
                variant="secondary"
                type="button"
                onClick={() => setPreviewImageModal(null)}
              >
                {t('btnClose')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER MODAL */}
      {isFilterModalOpen && (
        <div
          onClick={handleRequestCloseFilterModal}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-3xl max-w-md w-full shadow-2xl overflow-hidden cursor-default my-auto border border-line animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-soft flex items-center justify-center text-primary">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">{t('titleFilterModal')}</h3>
                  <p className="text-[11px] text-muted font-medium">{t('descFilterModal')}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleRequestCloseFilterModal}
                title={t('btnClose')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Ngày trực: Date Range (From - To) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground/90 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{t('filterDateRange')}</span>
                  </label>
                  {(modalStartDate || modalEndDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setModalStartDate('')
                        setModalEndDate('')
                      }}
                    >
                      {t('filterClearDates')}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-muted block mb-1">
                      {t('filterFromDate')}
                    </span>
                    <TextInput
                      type="date"
                      value={modalStartDate}
                      onChange={e => setModalStartDate(e.target.value)}
                      containerClassName="space-y-0"
                      className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted block mb-1">
                      {t('filterToDate')}
                    </span>
                    <TextInput
                      type="date"
                      value={modalEndDate}
                      min={modalStartDate || undefined}
                      onChange={e => setModalEndDate(e.target.value)}
                      containerClassName="space-y-0"
                      className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Ca làm việc: Dynamic from backend */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/90 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{t('filterShiftType')}</span>
                </label>
                <div className="relative">
                  <SelectInput
                    value={modalShift}
                    onChange={e => setModalShift(e.target.value)}
                    disabled={isShiftsLoading}
                    options={[
                      { value: 'all', label: t('filterAllShifts') },
                      ...availableShifts.map(s => ({
                        value: s.name,
                        label: `${getShiftName(s.name)} (${s.startTime} - ${s.endTime})`,
                      })),
                    ]}
                    className="w-full px-3 py-2.5 bg-surface border border-line rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                  />
                  {isShiftsLoading && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-3.5 h-3.5 text-muted animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Trạng thái chấm công */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/90 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>{t('filterStatus')}</span>
                </label>
                <SelectInput
                  value={modalStatus}
                  onChange={e =>
                    setModalStatus(e.target.value as 'all' | 'on_time' | 'late' | 'absent')
                  }
                  options={[
                    { value: 'all', label: t('filterAllStatuses') },
                    { value: 'on_time', label: t('tableStatusOnTime') },
                    { value: 'late', label: t('tableStatusLate') },
                    { value: 'absent', label: t('tableStatusAbsent') },
                  ]}
                  className="w-full px-3 py-2.5 bg-surface border border-line rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-surface/80 border-t border-line flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleResetModalDrafts}
                title={t('titleResetDialog')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('btnReset')}</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleRequestCloseFilterModal}
                >
                  {t('btnCancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={handleApplyModalFilter}
                >
                  {t('btnApplyFilters')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RULE #10 CONFIRMATION MODAL */}
      {showConfirmCloseModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-line"
          >
            <div className="p-6">
              <div className="flex items-center gap-2.5 mb-2 text-amber-600">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <h3 className="text-base font-bold text-foreground">{t('confirmCloseTitle')}</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">{t('filterConfirmCloseDesc')}</p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <Button size="xs"
                variant="secondary"
                type="button"
                onClick={() => setShowConfirmCloseModal(false)}
                className="flex-1"
              >
                {t('btnContinueEditing')}
              </Button>
              <Button size="xs"
                variant="danger"
                type="button"
                onClick={handleConfirmDiscardAndClose}
                className="flex-1"
              >
                {t('btnDiscardAndClose')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StaffShiftHistoryPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-xs text-muted font-bold">Loading...</div>}
    >
      <StaffShiftHistoryContent />
    </Suspense>
  )
}
