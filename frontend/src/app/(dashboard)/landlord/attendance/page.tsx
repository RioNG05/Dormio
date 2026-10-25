'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Edit3,
  Loader2,
  Download,
  Info,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  attendanceService,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceStatus,
} from '@/services/attendance.service'
import { staffService, StaffItem } from '@/services/staff.service'
import { scheduleService, ShiftItem } from '@/services/schedule.service'
import {
  Button,
  TableActionButton,
  TextInput,
  SelectInput,
  TextareaInput,
  SearchInput,
  Pagination,
  ViewModeToggle,
  Card,
  TableRow,
  EmptyState,
  Modal,
  Chip,
} from '@/components/ui'
import { DashboardPageHeader, LandlordStatBanner, type LandlordStatChipItem } from '@/components/landlord'

function formatDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatDisplayTime(isoString: string | null): string {
  if (!isoString) return '--:--'
  const date = new Date(isoString)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export default function AttendancePage() {
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const { locale } = useLanguage()
  const isEn = locale === 'en'
  const buildingId = activeBuilding?.id || ''

  // ─── Rule #9: Parallel View & Default Grid ──────────────────────────────
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [pageSize, setPageSize] = useState<number>(6) // Default Grid = 6
  const [currentPage, setCurrentPage] = useState<number>(1)

  // ─── Filter & Date Range States ────────────────────────────────────────
  const [datePreset, setDatePreset] = useState<'today' | 'week' | 'month' | 'custom'>('month')
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date()
    return formatDateString(new Date(now.getFullYear(), now.getMonth(), 1))
  })
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date()
    return formatDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  })

  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('')
  const [filterShiftId, setFilterShiftId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // ─── Data States ───────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [totalItems, setTotalItems] = useState<number>(0)
  const [staffList, setStaffList] = useState<StaffItem[]>([])
  const [shifts, setShifts] = useState<ShiftItem[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalShifts: 0,
    onTimeCount: 0,
    lateCount: 0,
    absentCount: 0,
    notYetCount: 0,
    attendanceRate: 100,
  })

  // Feedback Toast
  const { toast } = useToast()

  // ─── Modal States ──────────────────────────────────────────────────────
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)

  // Form draft
  const [overrideStatus, setOverrideStatus] = useState<AttendanceStatus>('on_time')
  const [overrideCheckIn, setOverrideCheckIn] = useState<string>('')
  const [overrideCheckOut, setOverrideCheckOut] = useState<string>('')
  const [overrideNote, setOverrideNote] = useState<string>('')
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false)

  // Rule #10: Modal Confirmation on Unsaved Changes
  const [isDirty, setIsDirty] = useState(false)
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false)

  // Switch viewMode
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
  }

  // ─── Date Preset Handler ───────────────────────────────────────────────
  const handleDatePresetChange = (preset: 'today' | 'week' | 'month' | 'custom') => {
    setDatePreset(preset)
    const now = new Date()

    if (preset === 'today') {
      const todayStr = formatDateString(now)
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (preset === 'week') {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now.setDate(diff))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      setStartDate(formatDateString(monday))
      setEndDate(formatDateString(sunday))
    } else if (preset === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setStartDate(formatDateString(first))
      setEndDate(formatDateString(last))
    }
    setCurrentPage(1)
  }

  // ─── Load Dependencies (Staff, Shifts) ─────────────────────────────────
  const loadDependencies = useCallback(async () => {
    if (!buildingId) return
    try {
      const [staffRes, shiftsRes] = await Promise.all([
        staffService.getStaffList(buildingId, { status: 'active', limit: 100 }),
        scheduleService.getShifts(buildingId),
      ])
      setStaffList(staffRes?.data || [])
      setShifts(shiftsRes || [])
    } catch (err) {
      console.error('Failed to load attendance dependencies:', err)
    }
  }, [buildingId])

  // ─── Fetch Attendance Records ──────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (!buildingId) return
    setIsLoading(true)
    try {
      const res = await attendanceService.getAttendance(buildingId, {
        startDate,
        endDate,
        employeeId: filterEmployeeId || undefined,
        shiftId: filterShiftId || undefined,
        status: filterStatus !== 'all' ? (filterStatus as AttendanceStatus) : undefined,
        search: searchQuery || undefined,
        page: currentPage,
        limit: pageSize,
      })

      if (res?.data) {
        setRecords(res.data)
        if (res.summary) setSummary(res.summary)
        setTotalItems(res.total || res.data.length)
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err)
      toast.error(t('landlordAttendanceLoadError'))
    } finally {
      setIsLoading(false)
    }
  }, [
    buildingId,
    startDate,
    endDate,
    filterEmployeeId,
    filterShiftId,
    filterStatus,
    searchQuery,
    currentPage,
    pageSize,
  ])

  useEffect(() => {
    loadDependencies()
  }, [loadDependencies])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  // ─── Rule #10: Modal Reset and Confirmation ───────────────────────────
  const handleAttemptCloseOverride = () => {
    if (isDirty) {
      setIsConfirmCloseOpen(true)
    } else {
      performCloseOverride()
    }
  }

  const performCloseOverride = () => {
    setIsOverrideModalOpen(false)
    setSelectedRecord(null)
    setIsDirty(false)
    setOverrideStatus('on_time')
    setOverrideCheckIn('')
    setOverrideCheckOut('')
    setOverrideNote('')
  }

  const handleOpenOverride = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    setOverrideStatus(record.attendanceStatus)

    if (record.checkIn) {
      const d = new Date(record.checkIn)
      setOverrideCheckIn(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      )
    } else {
      setOverrideCheckIn(record.shiftStartTime)
    }

    if (record.checkOut) {
      const d = new Date(record.checkOut)
      setOverrideCheckOut(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      )
    } else {
      setOverrideCheckOut(record.shiftEndTime)
    }

    setOverrideNote('')
    setIsDirty(false)
    setIsOverrideModalOpen(true)
  }

  // ─── Submit Manual Override ────────────────────────────────────────────
  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return

    setIsSubmittingOverride(true)
    try {
      let checkInIso: string | undefined = undefined
      let checkOutIso: string | undefined = undefined

      if (overrideCheckIn) {
        checkInIso = new Date(`${selectedRecord.workDate}T${overrideCheckIn}:00`).toISOString()
      }

      if (overrideCheckOut) {
        checkOutIso = new Date(`${selectedRecord.workDate}T${overrideCheckOut}:00`).toISOString()
      }

      await attendanceService.overrideAttendance(buildingId, {
        workScheduleId: selectedRecord.workScheduleId,
        status: overrideStatus,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        note: overrideNote || undefined,
      })

      toast.success(t('landlordAttendanceToastManualSuccess'))
      performCloseOverride()
      fetchAttendance()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('landlordAttendanceUpdateError'))
    } finally {
      setIsSubmittingOverride(false)
    }
  }

  // ─── Status Badge Styler ───────────────────────────────────────────
  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'on_time':
        return (
          <Chip
            size="sm"
            preventHover
            variant="success"
            leftIcon={<CheckCircle2 className="w-3 h-3 text-success" />}
          >
            {t('landlordAttendanceStatOnTime')}
          </Chip>
        )
      case 'late':
        return (
          <Chip
            size="sm"
            preventHover
            variant="warning"
            leftIcon={<Clock className="w-3 h-3 text-warning" />}
          >
            {t('landlordAttendanceStatLate')}
          </Chip>
        )
      case 'absent':
        return (
          <Chip
            size="sm"
            preventHover
            variant="danger"
            leftIcon={<XCircle className="w-3 h-3 text-danger" />}
          >
            {t('landlordAttendanceStatusAbsent')}
          </Chip>
        )
      default:
        return (
          <Chip
            size="sm"
            preventHover
            variant="neutral"
            leftIcon={<HelpCircle className="w-3 h-3 text-muted" />}
          >
            {t('landlordAttendanceStatusNotYet')}
          </Chip>
        )
    }
  }

  // ─── Export simulation ─────────────────────────────────────────────────
  const handleExportData = () => {
    if (records.length === 0) {
      toast.error(t('landlordAttendanceExportNoData'))
      return
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        isEn
          ? 'Date,Employee,Phone,Position,Shift,Timeframe,Check-in,Check-out,Status,Adjusted By'
          : 'Ngày,Nhân viên,SĐT,Vị trí,Ca làm việc,Khung giờ,Check-in,Check-out,Trạng thái,Người điều chỉnh',
        ...records.map(
          r =>
            `"${formatDisplayDate(r.workDate)}","${r.employeeName}","${r.employeePhone
            }","${r.positionName || t('landlordAttendanceStaffDefault')}","${r.shiftName}","${r.shiftStartTime
            }-${r.shiftEndTime}","${formatDisplayTime(
              r.checkIn,
            )}","${formatDisplayTime(r.checkOut)}","${r.attendanceStatus === 'on_time'
              ? 'Đúng giờ'
              : r.attendanceStatus === 'late'
                ? 'Đi trễ'
                : r.attendanceStatus === 'absent'
                  ? 'Vắng mặt'
                  : 'Chưa chấm công'
            }","${r.editedByName || ''}"`,
        ),
      ].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `bang_cham_cong_${startDate}_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(t('landlordAttendanceExportSuccess'))
  }

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordAttendanceStatTotal'),
        value: summary.totalShifts,
        icon: <Clock className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-muted shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border-white/10 lg:w-[130px]',
        labelColor: 'secondary',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'onTime',
        label: t('landlordAttendanceStatOnTime'),
        value: summary.onTimeCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[130px]',
        labelColor: 'brand',
        valueColor: 'brand',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'late',
        label: t('landlordAttendanceStatLate'),
        value: summary.lateCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 lg:w-[130px]',
        labelClassName: 'text-amber-400',
        valueClassName: 'text-amber-400 text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'absent',
        label: t('landlordAttendanceStatusAbsent'),
        value: summary.absentCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 border-danger/30 lg:w-[130px]',
        labelClassName: 'text-rose-400',
        valueColor: 'danger',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'notYet',
        label: t('landlordAttendanceStatusUpcoming'),
        value: summary.notYetCount,
        icon: <HelpCircle className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-muted shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border-white/10 lg:w-[130px]',
        labelColor: 'secondary',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'rate',
        label: t('landlordAttendanceStatDiligence'),
        value: `${summary.attendanceRate}%`,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 lg:w-[130px]',
        labelClassName: 'text-emerald-400',
        valueClassName: 'text-emerald-400 text-base sm:text-lg leading-none mt-1',
      },
    ],
    [t, isEn, summary],
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* ─── Top Header ─────────────────────────────────────────────────── */}
      <DashboardPageHeader
        title={t('landlordAttendanceTitle')}
        subtitle={`${t('landlordAttendanceSubtitleFull')}`}
        actions={
          <Button
            variant="success"
            size="md"
            onClick={handleExportData}
            leftIcon={<Download />}
          >
            {t('landlordAttendanceBtnExport')} (CSV)
          </Button>
        }
      />

      {/* ─── Stat Banner ────────────────────────────────────────────────────── */}
      <LandlordStatBanner
        watermarkIcon={<Clock className="w-64 h-64" />}
        chips={statChips}
      />

      {/* ─── Filter & Control Bar ───────────────────────────────────────── */}
      <div className="bg-card border border-line rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Preset Buttons & Date Range */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-card-hover rounded-xl border border-line">
              <Button
                variant={datePreset === 'today' ? 'primary' : 'ghost'}
                onClick={() => handleDatePresetChange('today')}
              >
                {t('landlordAttendancePresetToday')}
              </Button>
              <Button
                variant={datePreset === 'week' ? 'primary' : 'ghost'}
                onClick={() => handleDatePresetChange('week')}
              >
                {t('landlordAttendancePresetWeek')}
              </Button>
              <Button
                variant={datePreset === 'month' ? 'primary' : 'ghost'}
                onClick={() => handleDatePresetChange('month')}
              >
                {t('landlordAttendancePresetMonth')}
              </Button>
              <Button
                variant={datePreset === 'custom' ? 'primary' : 'ghost'}
                onClick={() => setDatePreset('custom')}
              >
                {t('landlordAttendancePresetCustom')}
              </Button>
            </div>

            {/* Custom Date Inputs */}
            <div className="flex items-center gap-1.5 text-xs text-muted font-semibold">
              <TextInput
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  setDatePreset('custom')
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 border border-line rounded-xl text-xs bg-surface/60 font-semibold"
                containerClassName="space-y-0"
              />
              <span>→</span>
              <TextInput
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value)
                  setDatePreset('custom')
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 border border-line rounded-xl text-xs bg-surface/60 font-semibold"
                containerClassName="space-y-0"
              />
            </div>
          </div>
        </div>

        {/* Filters & View Switcher Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-line">
          {/* Left: Fixed-width Search */}
          <div className="w-full sm:w-64 lg:w-72 shrink-0">
            <SearchInput
              placeholder={t('landlordAttendanceFilterSearchPh')}
              value={searchQuery}
              onChange={val => {
                setSearchQuery(val)
                setCurrentPage(1)
              }}
              className="w-full text-xs font-semibold bg-surface/50"
              containerClassName="space-y-0"
            />
          </div>

          {/* Right: Selects & View Mode Toggle */}
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2.5 flex-1 min-w-0">
            <SelectInput
              value={filterEmployeeId}
              onChange={e => {
                setFilterEmployeeId(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                {
                  value: '',
                  label: `${t('landlordAttendanceFilterStaffPh')} (${staffList.length})`,
                },
                ...staffList.map(s => ({
                  value: s.employeeId,
                  label: `${s.fullName} (${s.positionName || t('landlordAttendanceStaffDefault')})`,
                })),
              ]}
              className="text-xs font-semibold bg-surface/50 cursor-pointer"
              containerClassName="w-auto min-w-[150px] space-y-0"
            />

            <SelectInput
              value={filterShiftId}
              onChange={e => {
                setFilterShiftId(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                {
                  value: '',
                  label: `${t('landlordAttendanceFilterShiftPh')} (${shifts.length})`,
                },
                ...shifts.map(s => ({
                  value: s.id,
                  label: `${s.name} (${s.startTime} - ${s.endTime})`,
                })),
              ]}
              className="text-xs font-semibold bg-surface/50 cursor-pointer"
              containerClassName="w-auto min-w-[140px] space-y-0"
            />

            <SelectInput
              value={filterStatus}
              onChange={e => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: t('landlordAttendanceFilterStatusPh') },
                { value: 'on_time', label: t('landlordAttendanceStatusOnTime') },
                { value: 'late', label: t('landlordAttendanceStatusLate') },
                { value: 'absent', label: t('landlordAttendanceStatusAbsent') },
                { value: 'not_yet', label: t('landlordAttendanceStatusNotYet') },
              ]}
              className="text-xs font-semibold bg-surface/50 cursor-pointer"
              containerClassName="w-auto min-w-[130px] space-y-0"
            />

            <div className="shrink-0 ml-auto lg:ml-0">
              <ViewModeToggle
                value={viewMode}
                onChange={handleViewModeChange}
                showLabels
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content Area ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-card border border-line rounded-3xl p-16 text-center flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-xs font-bold text-muted">
            {t('landlordAttendanceLoading')}
          </p>
        </div>
      ) : records.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<Clock className="w-8 h-8" />}
          title={t('landlordAttendanceEmptyTitle')}
          description={t('landlordAttendanceEmptyDesc')}
          action={
            <Button
              size="md"
              variant="outline"
              onClick={() => handleDatePresetChange('month')}
            >
              {t('landlordAttendanceViewMonth')}
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* ═══════════════════════════════════════════════════════════════════
 PARALLEL VIEW 1: GRID VIEW (Default = 6 items per page)
 ═══════════════════════════════════════════════════════════════════ */
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.map(item => (
              <Card
                key={item.workScheduleId}
                onClick={() => handleOpenOverride(item)}
                className="flex flex-col justify-between"
              >
              <Card.Header className="mx-4 sm:mx-5 mt-4 sm:mt-5 p-0">
                  {/* Top card bar: Date & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-line">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{formatDisplayDate(item.workDate)}</span>
                    </div>
                    {getStatusBadge(item.attendanceStatus)}
                  </div>

                  {/* Employee details */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-card-hover border border-line flex items-center justify-center text-muted font-black text-sm uppercase">
                      {item.employeeAvatar ? (
                        <img
                          src={item.employeeAvatar}
                          alt={item.employeeName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        item.employeeName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-foreground truncate">
                        {item.employeeName}
                      </div>
                      <div className="text-[11px] text-muted truncate">
                        {item.positionName || t('landlordAttendanceStaffDefault')} · {item.employeePhone}
                      </div>
                    </div>
                  </div>

                  {/* Shift details & Working Hours */}
                  <div className="bg-surface border border-line rounded-xl p-2.5 space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground/90">{item.shiftName}</span>
                      <span className="text-[11px] font-semibold text-muted">
                        {item.shiftStartTime} - {item.shiftEndTime}
                      </span>
                    </div>

                    {/* Check-in / Check-out timestamps */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/40 text-[11px]">
                      <div>
                        <span className="text-muted font-semibold block text-[10px] uppercase">
                          Check-in
                        </span>
                        <span className="font-bold text-foreground">
                          {formatDisplayTime(item.checkIn)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted font-semibold block text-[10px] uppercase">
                          Check-out
                        </span>
                        <span className="font-bold text-foreground">
                          {formatDisplayTime(item.checkOut)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edited by note if manual override */}
                  {item.editedByName && (
                    <div className="text-[10px] text-muted italic mb-2">
                      {isEn
                        ? `Adjusted by: ${item.editedByName}`
                        : `Đã điều chỉnh bởi: ${item.editedByName}`}
                    </div>
                  )}
                </Card.Header>

                {/* Bottom Action Button */}
                <Card.Footer className="mx-4 sm:mx-5 mb-4 sm:mb-5 p-0 pt-2 border-0">
                <Button fullWidth
                  variant="outline"
                  onClick={() => handleOpenOverride(item)}
                  leftIcon={<Edit3 />}
                  className="mt-2"
                >
                  <span>{t('landlordAttendanceBtnEdit')}</span>
                </Button>
                </Card.Footer>
              </Card>
            ))}
          </div>

          {/* Rule #9: Standardized Pagination Bar */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeMax={100}
            className="mt-4"
          />
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
 PARALLEL VIEW 2: TABLE VIEW (Default = 10 items per page)
 ═══════════════════════════════════════════════════════════════════ */
        <div className="bg-card border border-line rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface/70 text-muted font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">{t('landlordAttendanceColDate')}</th>
                  <th className="py-3.5 px-4">{t('landlordAttendanceColStaff')}</th>
                  <th className="py-3.5 px-4">{t('landlordAttendanceColPosition')}</th>
                  <th className="py-3.5 px-4">{t('landlordAttendanceColShift')}</th>
                  <th className="py-3.5 px-4">{t('landlordAttendanceColScheduledTime')}</th>
                  <th className="py-3.5 px-4">Check-in</th>
                  <th className="py-3.5 px-4">Check-out</th>
                  <th className="py-3.5 px-4">{t('landlordAttendanceColStatus')}</th>
                  <th className="py-3.5 px-4">{t('landlordAttendanceColAdjustedBy')}</th>
                  <th className="py-3.5 px-4 text-right">{t('landlordAttendanceColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-foreground/90">
                {records.map(item => (
                  <TableRow
                    key={item.workScheduleId}
                    className="group"
                    onClick={() => handleOpenOverride(item)}
                  >
                    <td className="py-3 px-4 font-bold text-foreground">
                      {formatDisplayDate(item.workDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-foreground">{item.employeeName}</div>
                      <div className="text-[10px] text-muted">{item.employeePhone}</div>
                    </td>
                    <td className="py-3 px-4 text-muted font-semibold">
                      {item.positionName || t('landlordAttendanceStaffDefault')}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">{item.shiftName}</td>
                    <td className="py-3 px-4 text-muted font-semibold">
                      {item.shiftStartTime} – {item.shiftEndTime}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">
                      {formatDisplayTime(item.checkIn)}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">
                      {formatDisplayTime(item.checkOut)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.attendanceStatus)}</td>
                    <td className="py-3 px-4 text-muted text-[11px]">
                      {item.editedByName || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <TableActionButton
                        icon={<Edit3 />}
                        onClick={event => {
                          event.stopPropagation()
                          handleOpenOverride(item)
                        }}
                        title={t('landlordAttendanceBtnEdit')}
                      />
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rule #9: Standardized Pagination Bar */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeMax={100}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: MANUAL ATTENDANCE OVERRIDE
          ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isOverrideModalOpen && Boolean(selectedRecord)}
        onClose={handleAttemptCloseOverride}
        size="lg"
      >
        {selectedRecord && (
          <>
            <Modal.Header
              title={t('landlordAttendanceModalManualTitle')}
              description={
                isEn
                  ? 'Override status and append to AuditLog transaction'
                  : 'Ghi đè trạng thái và lưu nhật ký kiểm toán (AuditLog)'
              }
              icon={
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
              }
            />

            {/* Form */}
            <form
              onSubmit={handleSubmitOverride}
              className="flex flex-col flex-1 overflow-hidden"
              onInput={() => setIsDirty(true)}
              onChange={() => setIsDirty(true)}
            >
              <Modal.Body className="space-y-4">
              {/* Shift info preview card */}
              <div className="p-3.5 bg-surface border border-line rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {selectedRecord.employeeName}
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {formatDisplayDate(selectedRecord.workDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted font-semibold">
                  <span>
                    {selectedRecord.shiftName} ({selectedRecord.shiftStartTime} -{' '}
                    {selectedRecord.shiftEndTime})
                  </span>
                  <span>{selectedRecord.positionName || t('landlordAttendanceStaffDefault')}</span>
                </div>
              </div>

              {/* Attendance Status Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/90 flex items-center gap-1">
                  <span>{t('landlordAttendanceModalStatusLabel')}</span>
                  <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={overrideStatus === 'on_time' ? 'primary' : 'outline'}
                    onClick={() => {
                      setOverrideStatus('on_time')
                      setIsDirty(true)
                    }}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${overrideStatus === 'on_time'
                        ? 'border-success bg-success'
                        : 'border-line bg-card'
                        }`}
                    >
                      {overrideStatus === 'on_time' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-card" />
                      )}
                    </div>
                    <span>{t('landlordAttendanceStatusOnTime')}</span>
                  </Button>

                  <Button
                    variant={overrideStatus === 'late' ? 'primary' : 'outline'}
                    onClick={() => {
                      setOverrideStatus('late')
                      setIsDirty(true)
                    }}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${overrideStatus === 'late'
                        ? 'border-warning bg-warning'
                        : 'border-line bg-card'
                        }`}
                    >
                      {overrideStatus === 'late' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-card" />
                      )}
                    </div>
                    <span>{t('landlordAttendanceStatusLate')}</span>
                  </Button>

                  <Button
                    variant={overrideStatus === 'absent' ? 'primary' : 'outline'}
                    onClick={() => {
                      setOverrideStatus('absent')
                      setIsDirty(true)
                    }}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${overrideStatus === 'absent'
                        ? 'border-danger bg-danger'
                        : 'border-line bg-card'
                        }`}
                    >
                      {overrideStatus === 'absent' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-card" />
                      )}
                    </div>
                    <span>{t('landlordAttendanceStatusAbsent')}</span>
                  </Button>

                  <Button
                    variant={overrideStatus === 'not_yet' ? 'primary' : 'outline'}
                    onClick={() => {
                      setOverrideStatus('not_yet')
                      setIsDirty(true)
                    }}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${overrideStatus === 'not_yet'
                        ? 'border-zinc-600 bg-zinc-600'
                        : 'border-line bg-card'
                        }`}
                    >
                      {overrideStatus === 'not_yet' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-card" />
                      )}
                    </div>
                    <span>{t('landlordAttendanceStatusNotYet')}</span>
                  </Button>
                </div>
              </div>

              {/* Time inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInput
                  type="time"
                  label={t('landlordAttendanceModalInTime')}
                  value={overrideCheckIn}
                  onChange={e => {
                    setOverrideCheckIn(e.target.value)
                    setIsDirty(true)
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold bg-card"
                  containerClassName="space-y-1.5"
                />

                <TextInput
                  type="time"
                  label={t('landlordAttendanceModalOutTime')}
                  value={overrideCheckOut}
                  onChange={e => {
                    setOverrideCheckOut(e.target.value)
                    setIsDirty(true)
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold bg-card"
                  containerClassName="space-y-1.5"
                />
              </div>

              {/* Adjustment Reason */}
              <TextareaInput
                rows={2}
                label={t('landlordAttendanceModalReasonLabel')}
                value={overrideNote}
                onChange={e => {
                  setOverrideNote(e.target.value)
                  setIsDirty(true)
                }}
                placeholder={
                  isEn
                    ? 'e.g. Employee reported device GPS error, landlord confirmed attendance via security camera...'
                    : 'Ví dụ: Nhân viên báo lỗi GPS thiết bị, chủ nhà xác nhận có mặt qua camera an ninh...'
                }
                className="w-full px-3 py-2 text-xs font-medium resize-none"
                containerClassName="space-y-1.5"
              />

              {/* AuditLog Notice */}
              <div className="p-3 bg-info-soft border border-info-subtle rounded-xl text-xs text-info flex items-start gap-2">
                <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[11px]">
                  {t('landlordAttendanceModalAuditRuleNotice')}
                </span>
              </div>

              </Modal.Body>

              {/* Actions */}
              <Modal.Footer>
                <div className="flex items-center justify-end gap-3 w-full">
                  <Button
                    size="md"
                    variant="outline"
                    onClick={handleAttemptCloseOverride}
                  >
                    {t('landlordShiftsModalBtnCancel')}
                  </Button>
                  <Button
                    size="md"
                    type="submit"
                    disabled={isSubmittingOverride}
                    isLoading={isSubmittingOverride}
                  >
                    <span>{t('landlordAttendanceModalBtnSubmit')}</span>
                  </Button>
                </div>
              </Modal.Footer>
            </form>
          </>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          CONFIRMATION MODAL ON UNSAVED CHANGES (Rule #10)
          ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isConfirmCloseOpen}
        onClose={() => setIsConfirmCloseOpen(false)}
        size="sm"
        zIndex={70}
      >
        <Modal.Body className="p-6 space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-warning-soft text-warning border border-warning-subtle flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-black text-foreground">
              {t('landlordShiftsConfirmCloseTitle')}
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              {t('landlordAttendanceConfirmCloseDesc')}
            </p>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className="flex items-center gap-2.5 w-full">
            <Button
              size="md"
              variant="outline"
              onClick={() => setIsConfirmCloseOpen(false)}
              className="flex-1"
            >
              {t('landlordShiftsConfirmCloseKeep')}
            </Button>
            <Button
              size="md"
              variant="danger"
              onClick={() => {
                setIsConfirmCloseOpen(false)
                performCloseOverride()
              }}
              className="flex-1"
            >
              {t('landlordShiftsConfirmCloseDiscard')}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
