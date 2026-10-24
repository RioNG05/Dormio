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
import {
  Button,
  TextInput,
  NumberInput,
  SelectInput,
  Pagination,
  Modal,
  EmptyState,
  TableActionButton,
  Text,
  Chip,
} from '@/components/ui'
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
            <Chip variant="primary" size="xs" preventHover>
              {t('attHistoryTag')}
            </Chip>
          </div>
          <Text as="h1" size={{ base: '2xl', sm: '3xl' }} weight="black" color="default" className="tracking-tight">
            {t('attHistoryTitle')}
          </Text>
          <Text size={{ base: 'xs', sm: 'sm' }} color="secondary" weight="medium">
            {t('attHistorySubtitle')}
          </Text>
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
              <Text size="3xs" weight="bold" color="secondary" uppercase className="block">
                {t('metricTotalShifts')}
              </Text>
              <Text size="2xl" weight="black" color="default">
                {summary.total}
              </Text>
              <Text size="3xs" weight="semibold" color="secondary" className="block">
                {t('metricMonthSub')}
              </Text>
            </div>

            <div className="bg-card rounded-2xl border border-line shadow-2xs p-4 space-y-1">
              <Text size="3xs" weight="bold" color="secondary" uppercase className="block">
                {t('metricOnTime')}
              </Text>
              <Text size="2xl" weight="black" color="brand">
                {summary.onTime}
              </Text>
              <Text size="3xs" weight="bold" color="success" className="block">
                {t('metricOnTimeSub')}
              </Text>
            </div>

            <div className="bg-card rounded-2xl border border-line shadow-2xs p-4 space-y-1">
              <Text size="3xs" weight="bold" color="secondary" uppercase className="block">
                {t('metricLate')}
              </Text>
              <Text size="2xl" weight="black" color="warning">
                {summary.late}
              </Text>
              <Text size="3xs" weight="medium" color="warning" className="block">
                {t('metricLateSub')}
              </Text>
            </div>

            <div className="bg-card rounded-2xl border border-line shadow-2xs p-4 space-y-1">
              <Text size="3xs" weight="bold" color="secondary" uppercase className="block">
                {t('metricAbsent')}
              </Text>
              <Text size="2xl" weight="black" color="secondary">
                {summary.absent}
              </Text>
              <Text size="3xs" weight="medium" color="secondary" className="block">
                {t('metricAbsentSub')}
              </Text>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-card rounded-2xl border border-line shadow-2xs p-4 space-y-1">
              <Text size="3xs" weight="bold" color="secondary" uppercase className="block">
                {t('metricHours')}
              </Text>
              <Text size="2xl" weight="black" color="default">
                {summary.hours}h
              </Text>
              <Text size="3xs" weight="bold" color="secondary" className="block">
                {t('metricHoursSub')}
              </Text>
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
            onClick={handleOpenFilterModal}
            title={t('titleFilterOpen')}
            leftIcon={<Filter className="text-primary" />}
            rightIcon={hasAnyAppliedFilter ? <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> : undefined}
          >
            {t('btnUseFilters')}
          </Button>

          {/* Khi ấn apply ở modal thì hiện filter được áp dụng ở bên cạnh */}
          {hasAnyAppliedFilter ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Date Range Chip */}
              {(appliedStartDate || appliedEndDate) && (
                <Chip
                  variant="secondary"
                  size="sm"
                  leftIcon={<Calendar className="w-3 h-3 text-primary" />}
                  onRemove={() => {
                    setAppliedStartDate('')
                    setAppliedEndDate('')
                    setCurrentPage(1)
                  }}
                  title={t('titleRemoveDateFilter')}
                >
                  {appliedStartDate && appliedEndDate
                    ? `${appliedStartDate} → ${appliedEndDate}`
                    : appliedStartDate
                      ? t('filterDateFrom', { date: appliedStartDate })
                      : t('filterDateTo', { date: appliedEndDate })}
                </Chip>
              )}

              {/* Shift Chip */}
              {appliedShift !== 'all' && (
                <Chip
                  variant="secondary"
                  size="sm"
                  leftIcon={<Clock className="w-3 h-3 text-primary" />}
                  onRemove={() => {
                    setAppliedShift('all')
                    setCurrentPage(1)
                  }}
                  title={t('titleRemoveShiftFilter')}
                >
                  {getShiftName(appliedShift)}
                </Chip>
              )}

              {/* Status Chip */}
              {appliedStatus !== 'all' && (
                <Chip
                  variant="secondary"
                  size="sm"
                  leftIcon={<ShieldCheck className="w-3 h-3 text-primary" />}
                  onRemove={() => {
                    setAppliedStatus('all')
                    setCurrentPage(1)
                  }}
                  title={t('titleRemoveStatusFilter')}
                >
                  {appliedStatus === 'on_time' && t('tableStatusOnTime')}
                  {appliedStatus === 'late' && t('tableStatusLate')}
                  {appliedStatus === 'absent' && t('tableStatusAbsent')}
                </Chip>
              )}

              {/* Clear All Chip */}
              <Button
                variant="ghost"
                onClick={handleClearAllFilters}
                className="ml-1 hover:underline"
              >
                {t('btnClearAll')}
              </Button>
            </div>
          ) : (
            <Text size="xs" color="secondary" weight="medium" italic>
              {t('noActiveFilters')}
            </Text>
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
                  <tr key={item.id} className="hover:bg-card-hover transition-colors duration-150">
                    <td className="py-4 px-3 font-bold text-foreground whitespace-nowrap">
                      <Text size="xs" weight="bold" color="default">
                        {item.workDate}
                      </Text>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap font-bold">
                      <Text size="xs" weight="bold" color="default">
                        {getShiftName(item.shiftName)}
                      </Text>
                      <Text size="3xs" color="secondary" weight="normal">
                        {item.shiftTime}
                      </Text>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <Text size="xs" weight="bold" color="default" className="font-mono">
                          {item.checkIn || '--:--'}
                        </Text>
                        {item.checkInPhoto && (
                          <TableActionButton
                            icon={<Camera />}
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
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <Text size="xs" weight="bold" color="default" className="font-mono">
                          {item.checkOut || '--:--'}
                        </Text>
                        {item.checkOutPhoto && (
                          <TableActionButton
                            icon={<Camera />}
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
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      {item.status === 'on_time' && (
                        <Chip variant="success" size="xs" preventHover>
                          {item.isEarlyCheckOut ? t('tableStatusEarly') : t('tableStatusOnTime')}
                        </Chip>
                      )}
                      {item.status === 'late' && (
                        <Chip variant="warning" size="xs" preventHover>
                          {t('tableStatusLate')}
                        </Chip>
                      )}
                      {item.status === 'absent' && (
                        <Chip variant="danger" size="xs" preventHover>
                          {t('tableStatusAbsent')}
                        </Chip>
                      )}
                      {item.status === 'not_yet' && (
                        <Chip variant="neutral" size="xs" preventHover>
                          {t('statusNotYet')}
                        </Chip>
                      )}
                    </td>
                    <td className="py-4 px-3 font-black text-primary">
                      <Text size="xs" weight="black" color="brand">
                        {item.totalHours}h
                      </Text>
                    </td>
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
                        <span className="text-info font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> {t('tableManualApproved')}
                        </span>
                      ) : (
                        getLocalizedExplanation(item.note, locale) || '--'
                      )}
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      {item.checkInPhoto || item.checkOutPhoto ? (
                        <TableActionButton
                          icon={<Eye />}
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
                        />
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
        <EmptyState
          icon={<Clock className="w-8 h-8" />}
          title={t('emptyHistoryTitle')}
          description={t('emptyHistoryDesc')}
          action={
            hasAnyAppliedFilter ? (
              <Button
                variant="secondary"
                onClick={handleClearAllFilters}
                leftIcon={<RotateCcw className="text-muted" />}
              >
                {t('btnResetFilters')}
              </Button>
            ) : undefined
          }
        />
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
        <Modal
          isOpen={previewImageModal.isOpen}
          onClose={() => setPreviewImageModal(null)}
          title={previewImageModal.title}
          size="md"
        >
          <Modal.Body className="space-y-4 pt-1">
            <div className="relative bg-zinc-950 rounded-2xl overflow-hidden aspect-video max-h-[380px] flex items-center justify-center border border-line">
              <img
                src={previewImageModal.imageUrl}
                alt="Audit proof"
                className="w-full h-full object-contain"
              />
            </div>

            {previewImageModal.watermark && (
              <div className="p-4 rounded-xl bg-surface border border-line space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-primary font-bold">
                  <span>🕒 {previewImageModal.watermark.time}</span>
                  <Chip variant="success" size="xs" preventHover>
                    AUDIT VERIFIED
                  </Chip>
                </div>
                <div className="text-foreground font-sans text-xs">
                  📍 {previewImageModal.watermark.place}
                </div>
                <div className="text-muted font-sans text-[11px]">
                  👤 {previewImageModal.watermark.staffName} • GPS:{' '}
                  {previewImageModal.watermark.coordinates}
                </div>
              </div>
            )}

            {previewImageModal.note && (
              <div className="p-4 rounded-xl bg-warning-soft border border-warning-subtle text-xs text-warning space-y-1">
                <span className="font-bold flex items-center gap-1 text-warning">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  {t('explanationNoteTitle')}
                </span>
                <p className="italic text-foreground font-medium">
                  &quot;{previewImageModal.note}&quot;
                </p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="flex justify-end">
            <Button
              size="md"
              variant="secondary"
              onClick={() => setPreviewImageModal(null)}
            >
              {t('btnClose')}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* FILTER MODAL */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={handleRequestCloseFilterModal}
        size="md"
      >
        <Modal.Header
          icon={
            <div className="w-8 h-8 rounded-xl bg-primary-soft flex items-center justify-center text-primary">
              <Filter className="w-4 h-4" />
            </div>
          }
          title={t('titleFilterModal')}
          description={t('descFilterModal')}
          onClose={handleRequestCloseFilterModal}
        />

        <Modal.Body className="space-y-4">
          {/* Ngày trực: Date Range (From - To) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Text size="xs" weight="bold" color="default" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{t('filterDateRange')}</span>
              </Text>
              {(modalStartDate || modalEndDate) && (
                <Button
                  variant="ghost"
                  size="xs"
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
                <Text size="3xs" weight="bold" color="secondary" className="block mb-1">
                  {t('filterFromDate')}
                </Text>
                <TextInput
                  type="date"
                  value={modalStartDate}
                  onChange={e => setModalStartDate(e.target.value)}
                  containerClassName="space-y-0"
                  className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                />
              </div>
              <div>
                <Text size="3xs" weight="bold" color="secondary" className="block mb-1">
                  {t('filterToDate')}
                </Text>
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
            <Text size="xs" weight="bold" color="default" className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{t('filterShiftType')}</span>
            </Text>
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
            <Text size="xs" weight="bold" color="default" className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>{t('filterStatus')}</span>
            </Text>
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
        </Modal.Body>

        {/* Footer */}
        <Modal.Footer className="flex items-center justify-between gap-3">
          <Button
            size="md"
            variant="ghost"
            onClick={handleResetModalDrafts}
            title={t('titleResetDialog')}
            leftIcon={<RotateCcw />}
          >
            {t('btnReset')}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="md"
              variant="secondary"
              onClick={handleRequestCloseFilterModal}
            >
              {t('btnCancel')}
            </Button>
            <Button
              size="md"
              onClick={handleApplyModalFilter}
            >
              {t('btnApplyFilters')}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* RULE #10 CONFIRMATION MODAL */}
      <Modal
        isOpen={showConfirmCloseModal}
        onClose={() => setShowConfirmCloseModal(false)}
        size="sm"
      >
        <Modal.Body className="pt-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-warning-soft text-warning flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <Text as="h3" size="base" weight="bold" color="default">
              {t('confirmCloseTitle')}
            </Text>
            <Text size="xs" color="secondary" className="leading-relaxed">
              {t('filterConfirmCloseDesc')}
            </Text>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex items-center gap-3">
          <Button
            size="md"
            variant="secondary"
            onClick={() => setShowConfirmCloseModal(false)}
            className="flex-1"
          >
            {t('btnContinueEditing')}
          </Button>
          <Button
            size="md"
            variant="danger"
            onClick={handleConfirmDiscardAndClose}
            className="flex-1"
          >
            {t('btnDiscardAndClose')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default function StaffShiftHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted font-bold flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      }
    >
      <StaffShiftHistoryContent />
    </Suspense>
  )
}
