'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { DashboardPageHeader, LandlordStatBanner, type LandlordStatChipItem } from '@/components/landlord'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  Calendar,
  CalendarDays,
  List,
  Layers,
  Settings,
  Loader2,
  Info,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { staffService, StaffItem } from '@/services/staff.service'
import {
  scheduleService,
  ShiftItem,
  WorkScheduleItem,
  SchedulesSummary,
} from '@/services/schedule.service'
import {
  Button,
  TextInput,
  SelectInput,
  TextareaInput,
  Checkbox,
  SearchInput,
  Pagination,
  ViewModeToggle,
  TableRow,
  Modal,
  EmptyState,
} from '@/components/ui'

// Days of week helper (Mon to Sun)
const DAYS_OF_WEEK = [
  { key: '2', labelKey: 'landlordScheduleDayMon', shortKey: 'landlordScheduleDayMonShort', dayIndex: 1 },
  { key: '3', labelKey: 'landlordScheduleDayTue', shortKey: 'landlordScheduleDayTueShort', dayIndex: 2 },
  { key: '4', labelKey: 'landlordScheduleDayWed', shortKey: 'landlordScheduleDayWedShort', dayIndex: 3 },
  { key: '5', labelKey: 'landlordScheduleDayThu', shortKey: 'landlordScheduleDayThuShort', dayIndex: 4 },
  { key: '6', labelKey: 'landlordScheduleDayFri', shortKey: 'landlordScheduleDayFriShort', dayIndex: 5 },
  { key: '7', labelKey: 'landlordScheduleDaySat', shortKey: 'landlordScheduleDaySatShort', dayIndex: 6 },
  { key: 'CN', labelKey: 'landlordScheduleDaySun', shortKey: 'landlordScheduleDaySunShort', dayIndex: 0 },
]

function getMondayOfCurrentWeek(d = new Date()): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

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

export default function WorkforceSchedulePage() {
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const buildingId = activeBuilding?.id || ''

  // ─── View & Navigation States ──────────────────────────────────────────
  // Rule #9: Standardized View & Pagination (Grid default = 6, Table = 10)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getMondayOfCurrentWeek())

  // List View Pagination (Rule #9)
  const [listPage, setListPage] = useState<number>(1)
  const [listPageSize, setListPageSize] = useState<number>(10)
  const [totalListItems, setTotalListItems] = useState<number>(0)

  // ─── Filter States ─────────────────────────────────────────────────────
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('')
  const [filterShiftId, setFilterShiftId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // ─── Data States ───────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [schedules, setSchedules] = useState<WorkScheduleItem[]>([])
  const [shifts, setShifts] = useState<ShiftItem[]>([])
  const [staffList, setStaffList] = useState<StaffItem[]>([])
  const [summary, setSummary] = useState<SchedulesSummary>({
    totalSchedules: 0,
    scheduledCount: 0,
    canceledCount: 0,
    recurringCount: 0,
    adhocCount: 0,
  })

  // Feedback banner
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // ─── Modal States ──────────────────────────────────────────────────────
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)
  const [isAdhocModalOpen, setIsAdhocModalOpen] = useState(false)
  const [isShiftsModalOpen, setIsShiftsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] = useState<WorkScheduleItem | null>(
    null,
  )

  // Rule #10: Modal confirmation state for unsaved changes
  const [isDirty, setIsDirty] = useState(false)
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false)
  const [pendingModalToClose, setPendingModalToClose] = useState<
    'recurring' | 'adhoc' | 'shifts' | 'edit' | null
  >(null)
  const [actionConfirm, setActionConfirm] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  // ─── Modal Form Drafts ─────────────────────────────────────────────────
  // Recurring form
  const [recurringEmployeeIds, setRecurringEmployeeIds] = useState<string[]>([])
  const [recurringShiftId, setRecurringShiftId] = useState<string>('')
  const [recurringDays, setRecurringDays] = useState<string[]>(['2', '4', '6'])
  const [recurringStartDate, setRecurringStartDate] = useState<string>(formatDateString(new Date()))
  const [recurringEndDate, setRecurringEndDate] = useState<string>(
    formatDateString(new Date(Date.now() + 30 * 86400000)),
  )
  const [recurringNote, setRecurringNote] = useState<string>('')
  const [isSubmittingRecurring, setIsSubmittingRecurring] = useState(false)

  // Ad-hoc form
  const [adhocEmployeeId, setAdhocEmployeeId] = useState<string>('')
  const [adhocShiftId, setAdhocShiftId] = useState<string>('')
  const [adhocWorkDate, setAdhocWorkDate] = useState<string>(formatDateString(new Date()))
  const [adhocNote, setAdhocNote] = useState<string>('')
  const [isSubmittingAdhoc, setIsSubmittingAdhoc] = useState(false)

  // Shifts management form
  const [newShiftName, setNewShiftName] = useState('')
  const [newShiftStart, setNewShiftStart] = useState('08:00')
  const [newShiftEnd, setNewShiftEnd] = useState('17:00')
  const [isCreatingShift, setIsCreatingShift] = useState(false)

  // Edit occurrence form
  const [editShiftId, setEditShiftId] = useState<string>('')
  const [editWorkDate, setEditWorkDate] = useState<string>('')
  const [editStatus, setEditStatus] = useState<'scheduled' | 'canceled'>('scheduled')
  const [editScope, setEditScope] = useState<'single' | 'future'>('single')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // ─── Compute 7 days for current week ───────────────────────────────────
  const weekDays = useMemo(() => {
    const days: {
      date: Date
      dateString: string
      label: string
      short: string
      isToday: boolean
    }[] = []
    const todayStr = formatDateString(new Date())

    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedWeekStart)
      d.setDate(selectedWeekStart.getDate() + i)
      const dateStr = formatDateString(d)
      const info = DAYS_OF_WEEK[i]
      days.push({
        date: d,
        dateString: dateStr,
        label: t(info.labelKey),
        short: t(info.shortKey),
        isToday: dateStr === todayStr,
      })
    }
    return days
  }, [selectedWeekStart, t])

  const weekRangeLabel = useMemo(() => {
    const startStr = formatDisplayDate(formatDateString(weekDays[0].date))
    const endStr = formatDisplayDate(formatDateString(weekDays[6].date))
    return `${startStr} – ${endStr}`
  }, [weekDays])

  // Client-side pagination for list view to avoid refetching on viewMode or page changes
  const paginatedSchedules = useMemo(() => {
    const start = (listPage - 1) * listPageSize
    return schedules.slice(start, start + listPageSize)
  }, [schedules, listPage, listPageSize])

  // ─── Load Shifts & Staff ───────────────────────────────────────────────
  const loadInitialDependencies = useCallback(async () => {
    if (!buildingId) return
    try {
      const [shiftsRes, staffRes] = await Promise.all([
        scheduleService.getShifts(buildingId),
        staffService.getStaffList(buildingId, { status: 'active', limit: 100 }),
      ])
      setShifts(shiftsRes || [])
      if (shiftsRes?.length > 0 && !recurringShiftId) {
        setRecurringShiftId(shiftsRes[0].id)
        setAdhocShiftId(shiftsRes[0].id)
      }
      setStaffList(staffRes?.data || [])
    } catch (err) {
      console.error('Failed to load shifts/staff:', err)
    }
  }, [buildingId, recurringShiftId])

  // ─── Fetch Schedules ───────────────────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    if (!buildingId || weekDays.length === 0) return
    setIsLoading(true)
    try {
      const startDate = formatDateString(weekDays[0].date)
      const endDate = formatDateString(weekDays[6].date)

      const res = await scheduleService.getSchedules(buildingId, {
        startDate,
        endDate,
        employeeId: filterEmployeeId || undefined,
        shiftId: filterShiftId || undefined,
        status: filterStatus !== 'all' ? (filterStatus as 'scheduled' | 'canceled') : undefined,
        search: searchQuery || undefined,
        page: 1,
        limit: 1000,
      })

      if (res?.data) {
        setSchedules(res.data)
        if (res.summary) setSummary(res.summary)
        setTotalListItems(res.total || res.data.length)
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err)
      showToast(
        'error',
        t('landlordScheduleToastFailedLoad'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    buildingId,
    weekDays,
    filterEmployeeId,
    filterShiftId,
    filterStatus,
    searchQuery,
    t,
  ])

  useEffect(() => {
    loadInitialDependencies()
  }, [loadInitialDependencies])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  // ─── Toast helper ──────────────────────────────────────────────────────
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // ─── Week navigation ───────────────────────────────────────────────────
  const handlePrevWeek = () => {
    const prev = new Date(selectedWeekStart)
    prev.setDate(selectedWeekStart.getDate() - 7)
    setSelectedWeekStart(prev)
    setListPage(1)
  }

  const handleNextWeek = () => {
    const next = new Date(selectedWeekStart)
    next.setDate(selectedWeekStart.getDate() + 7)
    setSelectedWeekStart(next)
    setListPage(1)
  }

  const handleCurrentWeek = () => {
    setSelectedWeekStart(getMondayOfCurrentWeek())
    setListPage(1)
  }

  // ─── Rule #10: Modal Reset and Confirmation ───────────────────────────
  const handleAttemptCloseModal = (modalType: 'recurring' | 'adhoc' | 'shifts' | 'edit') => {
    if (isDirty) {
      setPendingModalToClose(modalType)
      setIsConfirmCloseOpen(true)
    } else {
      performCloseModal(modalType)
    }
  }

  const performCloseModal = (modalType: 'recurring' | 'adhoc' | 'shifts' | 'edit') => {
    setIsDirty(false)
    if (modalType === 'recurring') {
      setIsRecurringModalOpen(false)
      setRecurringEmployeeIds([])
      setRecurringDays(['2', '4', '6'])
      setRecurringStartDate(formatDateString(new Date()))
      setRecurringEndDate(formatDateString(new Date(Date.now() + 30 * 86400000)))
      setRecurringNote('')
    } else if (modalType === 'adhoc') {
      setIsAdhocModalOpen(false)
      setAdhocEmployeeId('')
      setAdhocWorkDate(formatDateString(new Date()))
      setAdhocNote('')
    } else if (modalType === 'shifts') {
      setIsShiftsModalOpen(false)
      setNewShiftName('')
      setNewShiftStart('08:00')
      setNewShiftEnd('17:00')
    } else if (modalType === 'edit') {
      setIsEditModalOpen(false)
      setSelectedScheduleForEdit(null)
      setEditScope('single')
    }
  }

  // ─── Recurring Schedule Submit ─────────────────────────────────────────
  const handleSubmitRecurring = async (e: React.FormEvent) => {
    e.preventDefault()
    if (recurringEmployeeIds.length === 0) {
      showToast('error', t('landlordScheduleToastSelectEmployee'))
      return
    }
    if (!recurringShiftId) {
      showToast('error', t('landlordScheduleToastSelectShift'))
      return
    }
    if (recurringDays.length === 0) {
      showToast('error', t('landlordScheduleToastSelectDays'))
      return
    }

    setIsSubmittingRecurring(true)
    try {
      const res = await scheduleService.createRecurringSchedule(buildingId, {
        employeeIds: recurringEmployeeIds,
        shiftId: recurringShiftId,
        daysOfWeek: recurringDays.join(','),
        startDate: recurringStartDate,
        endDate: recurringEndDate,
        note: recurringNote || undefined,
      })

      showToast('success', res?.message || t('landlordScheduleToastRecurringSuccess'))
      performCloseModal('recurring')
      fetchSchedules()
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message || t('landlordScheduleToastFailedRecurring'),
      )
    } finally {
      setIsSubmittingRecurring(false)
    }
  }

  // ─── Ad-hoc Schedule Submit ────────────────────────────────────────────
  const handleSubmitAdhoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adhocEmployeeId) {
      showToast('error', t('landlordScheduleToastSelectEmployeeSingle'))
      return
    }
    if (!adhocShiftId) {
      showToast('error', t('landlordScheduleToastSelectShift'))
      return
    }
    if (!adhocWorkDate) {
      showToast('error', t('landlordScheduleToastSelectWorkDate'))
      return
    }

    setIsSubmittingAdhoc(true)
    try {
      await scheduleService.createAdhocSchedule(buildingId, {
        employeeId: adhocEmployeeId,
        shiftId: adhocShiftId,
        workDate: adhocWorkDate,
        note: adhocNote || undefined,
      })

      showToast('success', t('landlordScheduleToastAssignSuccess'))
      performCloseModal('adhoc')
      fetchSchedules()
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message || t('landlordScheduleToastFailedAdhoc'),
      )
    } finally {
      setIsSubmittingAdhoc(false)
    }
  }

  // ─── Shift Template Create ─────────────────────────────────────────────
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newShiftName.trim()) {
      showToast('error', t('landlordShiftsNameRequired'))
      return
    }

    setIsCreatingShift(true)
    try {
      const created = await scheduleService.createShift(buildingId, {
        name: newShiftName.trim(),
        startTime: newShiftStart,
        endTime: newShiftEnd,
      })

      showToast('success', `Đã tạo ca làm việc "${created.name}" thành công!`)
      setNewShiftName('')
      setShifts(prev => [...prev, created])
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message || t('landlordScheduleToastFailedCreateShift'),
      )
    } finally {
      setIsCreatingShift(false)
    }
  }

  // ─── Delete Shift Template ─────────────────────────────────────────────
  const handleDeleteShift = (shiftId: string, shiftName: string) => {
    setActionConfirm({
      title: t('landlordShiftsDeleteModalTitle') || 'Xóa ca mẫu',
      message: `Bạn có chắc chắn muốn xóa ca mẫu "${shiftName}"?`,
      onConfirm: async () => {
        try {
          await scheduleService.deleteShift(buildingId, shiftId)
          showToast('success', t('landlordShiftsToastDeleteSuccess'))
          setShifts(prev => prev.filter(s => s.id !== shiftId))
        } catch (err: any) {
          showToast('error', err?.response?.data?.message || 'Không thể xóa ca đang có lịch làm việc')
        }
      },
    })
  }

  // ─── Open Edit Modal ───────────────────────────────────────────────────
  const handleOpenEditModal = (item: WorkScheduleItem) => {
    setSelectedScheduleForEdit(item)
    setEditShiftId(item.shiftId)
    setEditWorkDate(item.workDate)
    setEditStatus(item.status)
    setEditScope('single')
    setIsDirty(false)
    setIsEditModalOpen(true)
  }

  // ─── Submit Edit Occurrence / Pattern ──────────────────────────────────
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScheduleForEdit) return

    setIsSubmittingEdit(true)
    try {
      if (editScope === 'future' && selectedScheduleForEdit.recurrenceId) {
        // Edit whole pattern forward
        const res = await scheduleService.updateRecurrence(
          buildingId,
          selectedScheduleForEdit.recurrenceId,
          {
            shiftId: editShiftId,
            status: editStatus,
          },
        )
        showToast('success', res?.message || t('landlordScheduleToastSuccessUpdateAllFuture'))
      } else {
        // Edit single occurrence
        await scheduleService.updateSchedule(buildingId, selectedScheduleForEdit.id, {
          shiftId: editShiftId,
          workDate: editWorkDate,
          status: editStatus,
        })
        showToast(
          'success',
          t('landlordScheduleToastSuccessUpdate'),
        )
      }

      performCloseModal('edit')
      fetchSchedules()
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message || t('landlordScheduleToastFailedUpdate'),
      )
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // ─── Cancel / Delete Single Schedule ───────────────────────────────────
  const handleDeleteSchedule = (item: WorkScheduleItem) => {
    const isRecurring = item.isRecurring && item.recurrenceId
    const message = isRecurring
      ? t('landlordScheduleConfirmRecurringDelete', {
          date: formatDisplayDate(item.workDate),
        })
      : t('landlordScheduleDeleteConfirm', {
          name: item.employeeName,
          date: formatDisplayDate(item.workDate),
        })

    setActionConfirm({
      title: t('landlordScheduleConfirmCancelTitle') || 'Xóa lịch làm việc',
      message,
      onConfirm: async () => {
        try {
          await scheduleService.deleteSchedule(buildingId, item.id, isRecurring ? 'future' : 'single')
          showToast('success', t('landlordScheduleToastSuccessCancel'))
          fetchSchedules()
        } catch (err: any) {
          showToast('error', err?.response?.data?.message || t('landlordScheduleToastFailedCancel'))
        }
      },
    })
  }

  // ─── Shift Badge Styler ────────────────────────────────────────────────
  const getShiftBadgeStyle = (shiftName: string) => {
    const lower = (shiftName || '').toLowerCase()
    if (lower.includes('sáng')) {
      return 'bg-warning-soft text-warning border-warning-subtle'
    }
    if (lower.includes('chiều')) {
      return 'bg-info-soft text-info border-info-subtle'
    }
    if (lower.includes('đêm')) {
      return 'bg-deposit-soft text-deposit border-deposit-subtle'
    }
    return 'bg-success-soft text-success border-success-subtle'
  }

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordScheduleStatTotalShifts'),
        value: summary.totalSchedules,
        icon: <Layers className="w-5 h-5 text-muted shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border-white/10 lg:w-[150px]',
        labelColor: 'secondary',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'assigned',
        label: t('landlordScheduleStatusAssigned'),
        value: summary.scheduledCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[150px]',
        labelColor: 'brand',
        valueColor: 'brand',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'recurring',
        label: t('landlordScheduleStatRecurringShifts'),
        value: summary.recurringCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-vacant shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-vacant/10 hover:bg-vacant/20 border-vacant/30 lg:w-[150px]',
        labelClassName: 'text-blue-400',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'adhoc',
        label: t('landlordScheduleStatAdhocShifts'),
        value: summary.adhocCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 lg:w-[150px]',
        labelClassName: 'text-amber-400',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
    ],
    [t, summary],
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Toast notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-[80] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 ${toastMessage.type === 'success'
            ? 'bg-success-soft text-success border-success-subtle shadow-emerald-500/10'
            : 'bg-danger-soft text-danger border-danger-subtle shadow-danger/10'
            }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─── Top Header & Primary Actions ───────────────────────────────── */}
      <DashboardPageHeader
        title={t('landlordScheduleTitle')}
        subtitle={t('landlordScheduleSubtitleFull')}
        actions={
          <>
            <Button
              size="md"
              variant="secondary"
              onClick={() => {
                setIsDirty(false)
                setIsAdhocModalOpen(true)
              }}
              leftIcon={<Plus />}
            >
              {t('landlordScheduleBtnAssign')}
            </Button>

            <Button
              size="md"
              variant="accent"
              onClick={() => {
                setIsDirty(false)
                setIsShiftsModalOpen(true)
              }}
              leftIcon={<Settings />}
            >
              {t('landlordScheduleBtnShiftTemplates')}
            </Button>

            <Button
              size="md"
              variant="primary"
              onClick={() => {
                setIsDirty(false)
                setIsRecurringModalOpen(true)
              }}
              leftIcon={<Repeat />}
            >
              {t('landlordScheduleBtnRecurring')}
            </Button>
          </>
        }
      />

      {/* ─── Stat Banner ────────────────────────────────────────────────────── */}
      <LandlordStatBanner
        watermarkIcon={<CalendarDays className="w-64 h-64" />}
        chips={statChips}
      />

      {/* ─── Control Bar: Date Navigator, Filters & View Mode Switcher ───── */}
      <div className="bg-card border border-line rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Week Date Navigator */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevWeek}
              title={t('landlordScheduleBtnPrevWeek')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCurrentWeek}
            >
              {t('landlordScheduleBtnToday')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              title={t('landlordScheduleBtnNextWeek')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 pl-2 text-sm font-bold text-foreground">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span>{weekRangeLabel}</span>
            </div>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-line">
          {/* Left: Fixed-width Search */}
          <div className="w-full sm:w-64 lg:w-72 shrink-0">
            <SearchInput
              placeholder={t('landlordScheduleFilterSearchPh')}
              value={searchQuery}
              onChange={val => {
                setSearchQuery(val)
                setListPage(1)
              }}
              containerClassName="w-full space-y-0"
            />
          </div>

          {/* Right: Selects & View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2.5 flex-1 min-w-0">
            <SelectInput
              value={filterEmployeeId}
              onChange={e => {
                setFilterEmployeeId(e.target.value)
                setListPage(1)
              }}
              containerClassName="w-auto min-w-[150px] space-y-0"
              options={[
                { value: '', label: `${t('landlordScheduleFilterStaffPh')} (${staffList.length})` },
                ...staffList.map(s => ({
                  value: s.employeeId,
                  label: `${s.fullName} (${s.positionName})`,
                })),
              ]}
            />

            <SelectInput
              value={filterShiftId}
              onChange={e => {
                setFilterShiftId(e.target.value)
                setListPage(1)
              }}
              containerClassName="w-auto min-w-[140px] space-y-0"
              options={[
                { value: '', label: `${t('landlordScheduleFilterShiftPh')} (${shifts.length})` },
                ...shifts.map(s => ({
                  value: s.id,
                  label: `${s.name} (${s.startTime} - ${s.endTime})`,
                })),
              ]}
            />

            <SelectInput
              value={filterStatus}
              onChange={e => {
                setFilterStatus(e.target.value)
                setListPage(1)
              }}
              containerClassName="w-auto min-w-[130px] space-y-0"
              options={[
                { value: 'all', label: t('landlordScheduleFilterStatusPh') },
                { value: 'scheduled', label: t('landlordScheduleStatusAssigned') },
                { value: 'canceled', label: t('landlordScheduleStatusCanceled') },
              ]}
            />

            <div className="shrink-0 ml-auto lg:ml-0">
              <ViewModeToggle
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: 'calendar', label: t('landlordScheduleViewCalendar'), title: t('landlordScheduleViewCalendar'), icon: <Calendar className="w-3.5 h-3.5" /> },
                  { value: 'list', label: t('landlordScheduleViewList'), title: t('landlordScheduleViewList'), icon: <List className="w-3.5 h-3.5" /> }
                ]}
                showLabels
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Views ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-card border border-line rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-xs font-bold text-muted">
            {t('landlordScheduleLoading')}
          </p>
        </div>
      ) : viewMode === 'calendar' ? (
        /* ═══════════════════════════════════════════════════════════════════
 VIEW 1: 7-DAY WEEK CALENDAR GRID
 ═══════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map(day => {
            const daySchedules = schedules.filter(s => s.workDate === day.dateString)

            return (
              <div
                key={day.dateString}
                className={`flex flex-col bg-card border rounded-2xl shadow-sm overflow-hidden transition-all min-h-[380px] ${day.isToday
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.01]'
                  : 'border-line'
                  }`}
              >
                {/* Column Day Header */}
                <div
                  className={`p-3 text-center border-b transition-colors ${day.isToday
                    ? 'bg-primary/10 border-primary/30 text-[#1fa8a3]'
                    : 'bg-surface/80 border-line text-foreground/90'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-extrabold">
                      {day.label}
                    </span>
                    {day.isToday && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-primary text-white rounded-full">
                        {t('landlordScheduleBtnToday')}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-muted mt-0.5">
                    {formatDisplayDate(day.dateString)}
                  </div>
                  <div className="text-[10px] font-bold text-muted mt-1">
                    {daySchedules.length} {t('landlordScheduleShiftsCount')}
                  </div>
                </div>

                {/* Shifts Container */}
                <div className="p-2.5 flex-1 space-y-2 overflow-y-auto max-h-[520px] custom-scrollbar">
                  {daySchedules.length === 0 ? (
                    <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4">
                      <div className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center text-zinc-300 mb-2">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-muted">
                        {t('landlordScheduleEmptyDay')}
                      </span>
                    </div>
                  ) : (
                    daySchedules.map(schedule => (
                      <div
                        key={schedule.id}
                        className={`p-3 rounded-xl border text-left transition-all relative group ${schedule.status === 'canceled'
                          ? 'bg-surface/60 border-line opacity-60 line-through'
                          : 'bg-card border-line hover:border-primary/60 hover:shadow-md'
                          }`}
                      >
                        {/* Status & Recurring Badge */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${getShiftBadgeStyle(
                              schedule.shiftName,
                            )}`}
                          >
                            {schedule.shiftName}
                          </span>

                          {schedule.isRecurring ? (
                            <span
                              className="flex items-center gap-0.5 text-[10px] font-bold text-info bg-info-soft px-1.5 py-0.5 rounded-md border border-info-subtle"
                              title={t('landlordScheduleWeeklyRecurringTitle')}
                            >
                              <Repeat className="w-2.5 h-2.5" />
                              <span>{t('landlordScheduleRepeat')}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-muted bg-card-hover px-1.5 py-0.5 rounded-md">
                              {t('landlordScheduleAdhoc')}
                            </span>
                          )}
                        </div>

                        {/* Employee info */}
                        <div className="font-extrabold text-xs text-foreground truncate">
                          {schedule.employeeName}
                        </div>
                        <div className="text-[10px] text-muted font-semibold truncate mb-2">
                          {schedule.positionName || t('landlordScheduleStaffFallback')}
                        </div>

                        {/* Working hours */}
                        <div className="flex items-center gap-1 text-[11px] font-bold text-muted mb-2">
                          <Clock className="w-3 h-3 text-muted" />
                          <span>
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>

                        {/* Action Buttons (visible on hover or focus) */}
                        <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-line">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(schedule)}
                            title={t('landlordScheduleEditShiftTitle')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          {schedule.status !== 'canceled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSchedule(schedule)}
                              title={t('landlordScheduleCancelShiftTitle')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
 VIEW 2: STANDARDIZED LIST / TABLE VIEW (Rule #9)
 ═══════════════════════════════════════════════════════════════════ */
        <div className="bg-card border border-line rounded-3xl shadow-sm overflow-hidden">
          {schedules.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3">
                <CalendarIcon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-foreground mb-1">
                {t('landlordScheduleEmptyTitle')}
              </h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {t('landlordScheduleEmptyDesc')}
              </p>
              <Button size="xs"
                onClick={() => {
                  setIsDirty(false)
                  setIsRecurringModalOpen(true)
                }}
                className="mt-4"
              >
                {t('landlordScheduleBtnRecurring')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface/70 text-muted font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">{t('landlordScheduleColDate')}</th>
                    <th className="py-3.5 px-4">{t('landlordScheduleColStaff')}</th>
                    <th className="py-3.5 px-4">{t('landlordScheduleColPosition')}</th>
                    <th className="py-3.5 px-4">{t('landlordScheduleColShift')}</th>
                    <th className="py-3.5 px-4">{t('landlordScheduleColTime')}</th>
                    <th className="py-3.5 px-4">{t('landlordScheduleColType')}</th>
                    <th className="py-3.5 px-4">{t('landlordScheduleColStatus')}</th>
                    <th className="py-3.5 px-4 text-right">{t('landlordScheduleColActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium text-foreground/90">
                  {paginatedSchedules.map(item => (
                    <TableRow
                      key={item.id}
                      className="group"
                      onClick={() => handleOpenEditModal(item)}
                    >
                      <td className="py-3 px-4 font-bold text-foreground">
                        {formatDisplayDate(item.workDate)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-foreground">{item.employeeName}</div>
                        <div className="text-[10px] text-muted">{item.employeePhone}</div>
                      </td>
                      <td className="py-3 px-4 text-muted font-semibold">
                        {item.positionName || t('landlordScheduleStaffFallback')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${getShiftBadgeStyle(
                            item.shiftName,
                          )}`}
                        >
                          {item.shiftName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground/90">
                        {item.startTime} – {item.endTime}
                      </td>
                      <td className="py-3 px-4">
                        {item.isRecurring ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-info bg-info-soft px-2 py-0.5 rounded-md border border-info-subtle">
                            <Repeat className="w-2.5 h-2.5" />
                            <span>{t('landlordScheduleWeeklyRecurringBadge')}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-muted bg-card-hover px-2 py-0.5 rounded-md">
                            {t('landlordScheduleAdhocShiftBadge')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.status === 'scheduled' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-success bg-success-soft rounded-md border border-success-subtle">
                            {t('landlordScheduleStatusAssigned')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-muted bg-card-hover rounded-md">
                            {t('landlordScheduleStatusCanceled')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(item)}
                            title={t('landlordShiftsBtnEdit')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          {item.status !== 'canceled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSchedule(item)}
                              title={t('landlordScheduleCancelShiftAction')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </TableRow>
                  ))}
                </tbody>
              </table>

              {/* Rule #9: Standardized Pagination Bar */}
              <Pagination
                currentPage={listPage}
                totalItems={schedules.length}
                pageSize={listPageSize}
                onPageChange={setListPage}
                onPageSizeChange={setListPageSize}
                pageSizeMax={100}
              />
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
 MODAL 1: PHÂN CA LẶP LẠI ( Step 2 Materialization)
 ═══════════════════════════════════════════════════════════════════ */}
      {isRecurringModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleAttemptCloseModal('recurring')
          }}
        >
          <div
            className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-line animate-in zoom-in-95 duration-200"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-line bg-surface/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">
                    {t('landlordScheduleModalRecurringTitle')}
                  </h2>
                  <p className="text-[11px] text-muted font-semibold">
                    {t('landlordScheduleModalRecurringSubtitle')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAttemptCloseModal('recurring')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmitRecurring}
              className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar"
            >
              {/* Select Employees */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground/90 flex items-center gap-1">
                    <span>{t('landlordScheduleModalStaffLabel')}</span>
                    <span className="text-danger">*</span>
                  </label>
                  <Button size="xs"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      if (recurringEmployeeIds.length === staffList.length) {
                        setRecurringEmployeeIds([])
                      } else {
                        setRecurringEmployeeIds(staffList.map(s => s.employeeId))
                      }
                      setIsDirty(true)
                    }}
                    className="hover:underline"
                  >
                    {recurringEmployeeIds.length === staffList.length
                      ? t('landlordScheduleDeselectAll')
                      : t('landlordScheduleSelectAll')}
                  </Button>
                </div>

                {staffList.length === 0 ? (
                  <div className="p-3 bg-warning-soft border border-warning-subtle rounded-xl text-xs text-warning font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    <span>
                      {t('landlordScheduleNoStaffWarning')}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-line rounded-xl bg-surface/50">
                    {staffList.map(s => {
                      const isChecked = recurringEmployeeIds.includes(s.employeeId)
                      return (
                        <div
                          key={s.employeeId}
                          className={`p-2 rounded-lg border text-xs transition-all ${isChecked
                            ? 'bg-card border-primary text-foreground shadow-sm'
                            : 'bg-transparent border-transparent hover:bg-card-hover text-muted'
                            }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setRecurringEmployeeIds(prev => [...prev, s.employeeId])
                              } else {
                                setRecurringEmployeeIds(prev =>
                                  prev.filter(id => id !== s.employeeId),
                                )
                              }
                              setIsDirty(true)
                            }}
                            label={
                              <div className="truncate">
                                <span className="font-bold">{s.fullName}</span>
                                <span className="text-[10px] text-muted ml-1">
                                  ({s.positionName || t('landlordScheduleStaffFallback')})
                                </span>
                              </div>
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Select Shift */}
              <div className="space-y-2">
                <SelectInput
                  label={t('landlordScheduleModalShiftLabel')}
                  required
                  value={recurringShiftId}
                  onChange={e => {
                    setRecurringShiftId(e.target.value)
                    setIsDirty(true)
                  }}
                  options={[
                    { value: '', label: t('landlordScheduleModalShiftPh') },
                    ...shifts.map(s => ({
                      value: s.id,
                      label: `${s.name} (${s.startTime} - ${s.endTime})`,
                    })),
                  ]}
                />
              </div>

              {/* Select Days of Week */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground/90 flex items-center gap-1">
                    <span>{t('landlordScheduleModalRepeatLabel')}</span>
                    <span className="text-danger">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Button size="xs"
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setRecurringDays(['2', '3', '4', '5', '6'])
                        setIsDirty(true)
                      }}
                    >
                      T2 - T6
                    </Button>
                    <span className="text-zinc-300">·</span>
                    <Button size="xs"
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setRecurringDays(['2', '4', '6'])
                        setIsDirty(true)
                      }}
                    >
                      T2, 4, 6
                    </Button>
                    <span className="text-zinc-300">·</span>
                    <Button size="xs"
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setRecurringDays(['3', '5', '7'])
                        setIsDirty(true)
                      }}
                    >
                      T3, 5, 7
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map(d => {
                    const isSelected = recurringDays.includes(d.key)
                    return (
                      <Button
                        key={d.key}
                        type="button"
                        variant={isSelected ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (isSelected) {
                            setRecurringDays(prev => prev.filter(k => k !== d.key))
                          } else {
                            setRecurringDays(prev => [...prev, d.key])
                          }
                          setIsDirty(true)
                        }}
                      >
                        {t(d.shortKey as any)}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  type="date"
                  label={t('landlordScheduleStartDate')}
                  required
                  value={recurringStartDate}
                  onChange={e => {
                    setRecurringStartDate(e.target.value)
                    setIsDirty(true)
                  }}
                />

                <TextInput
                  type="date"
                  label={t('landlordScheduleModalUntilLabel')}
                  required
                  value={recurringEndDate}
                  onChange={e => {
                    setRecurringEndDate(e.target.value)
                    setIsDirty(true)
                  }}
                />
              </div>

              {/* Duty Note */}
              <TextareaInput
                label={t('landlordScheduleModalNoteLabel')}
                rows={2}
                value={recurringNote}
                onChange={e => {
                  setRecurringNote(e.target.value)
                  setIsDirty(true)
                }}
                placeholder={t('landlordScheduleModalNotePh')}
              />

              {/* Pre-calculation Alert */}
              <div className="p-3 bg-info-soft border border-info-subtle rounded-xl text-xs text-info flex items-start gap-2">
                <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {t('landlordScheduleRecurringInfo')}
                </span>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                <Button size="xs"
                  type="button"
                  variant="outline"
                  onClick={() => handleAttemptCloseModal('recurring')}
                >
                  {t('landlordShiftsModalBtnCancel')}
                </Button>
                <Button size="xs"
                  type="submit"
                  disabled={isSubmittingRecurring}
                >
                  {isSubmittingRecurring ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('landlordScheduleMaterializing')}</span>
                    </>
                  ) : (
                    <span>{t('landlordScheduleModalSubmitRecurring')}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
 MODAL 2: PHÂN CA ĐƠN LẺ (AD-HOC)
 ═══════════════════════════════════════════════════════════════════ */}
      {isAdhocModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleAttemptCloseModal('adhoc')
          }}
        >
          <div
            className="bg-card rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-line animate-in zoom-in-95 duration-200"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            <div className="flex items-center justify-between p-6 border-b border-line bg-surface/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-warning-soft text-warning rounded-2xl border border-warning-subtle">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">
                    {t('landlordScheduleModalAssignTitle')}
                  </h2>
                  <p className="text-[11px] text-muted font-semibold">
                    {t('landlordScheduleModalAdhocSubtitle')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAttemptCloseModal('adhoc')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form
              onSubmit={handleSubmitAdhoc}
              className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar"
            >
              <div className="space-y-2">
                <SelectInput
                  label={t('landlordScheduleModalStaffLabel')}
                  required
                  value={adhocEmployeeId}
                  onChange={e => {
                    setAdhocEmployeeId(e.target.value)
                    setIsDirty(true)
                  }}
                  options={[
                    { value: '', label: t('landlordScheduleModalStaffPh') },
                    ...staffList.map(s => ({
                      value: s.employeeId,
                      label: `${s.fullName} (${s.positionName || t('landlordScheduleStaffFallback')})`,
                    })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SelectInput
                    label={t('landlordScheduleModalShiftLabel')}
                    required
                    value={adhocShiftId}
                    onChange={e => {
                      setAdhocShiftId(e.target.value)
                      setIsDirty(true)
                    }}
                    options={[
                      { value: '', label: t('landlordScheduleModalShiftPh') },
                      ...shifts.map(s => ({
                        value: s.id,
                        label: `${s.name} (${s.startTime} - ${s.endTime})`,
                      })),
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <TextInput
                    type="date"
                    label={t('landlordScheduleModalDateLabel')}
                    required
                    value={adhocWorkDate}
                    onChange={e => {
                      setAdhocWorkDate(e.target.value)
                      setIsDirty(true)
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <TextareaInput
                  label={t('landlordScheduleModalNoteLabel')}
                  rows={3}
                  value={adhocNote}
                  onChange={e => {
                    setAdhocNote(e.target.value)
                    setIsDirty(true)
                  }}
                  placeholder={t('landlordScheduleModalNotePh')}
                />
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                <Button size="xs"
                  type="button"
                  variant="outline"
                  onClick={() => handleAttemptCloseModal('adhoc')}
                >
                  {t('landlordShiftsModalBtnCancel')}
                </Button>
                <Button size="xs"
                  type="submit"
                  disabled={isSubmittingAdhoc}
                >
                  {isSubmittingAdhoc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('landlordScheduleSaving')}</span>
                    </>
                  ) : (
                    <span>{t('landlordScheduleModalSubmitAssign')}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
 MODAL 3: QUẢN LÝ CA LÀM VIỆC MẪU (SHIFTS CRUD)
 ═══════════════════════════════════════════════════════════════════ */}
      {isShiftsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleAttemptCloseModal('shifts')
          }}
        >
          <div
            className="bg-card rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-line animate-in zoom-in-95 duration-200"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            <div className="flex items-center justify-between p-6 border-b border-line bg-surface/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-card-hover text-foreground rounded-2xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">
                    {t('landlordScheduleModalTemplatesTitle')}
                  </h2>
                  <p className="text-[11px] text-muted font-semibold">
                    {t('landlordScheduleModalTemplatesSubtitle')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAttemptCloseModal('shifts')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {/* Add New Shift */}
              <form
                onSubmit={handleCreateShift}
                className="p-4 bg-surface border border-line rounded-2xl space-y-3"
              >
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>{t('landlordShiftsAddNewBtn')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <TextInput
                    placeholder={t('landlordScheduleShiftNamePh')}
                    value={newShiftName}
                    onChange={e => {
                      setNewShiftName(e.target.value)
                      setIsDirty(true)
                    }}
                  />
                  <TextInput
                    type="time"
                    value={newShiftStart}
                    onChange={e => {
                      setNewShiftStart(e.target.value)
                      setIsDirty(true)
                    }}
                  />
                  <TextInput
                    type="time"
                    value={newShiftEnd}
                    onChange={e => {
                      setNewShiftEnd(e.target.value)
                      setIsDirty(true)
                    }}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button size="xs"
                    type="submit"
                    disabled={isCreatingShift}
                  >
                    {isCreatingShift
                      ? t('landlordScheduleCreating')
                      : t('landlordScheduleAddShiftBtnText')}
                  </Button>
                </div>
              </form>

              {/* Current Shifts List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/90">
                  {t('landlordScheduleActiveTemplates', { count: shifts.length })}
                </label>
                <div className="divide-y divide-line border border-line rounded-2xl overflow-hidden bg-card">
                  {shifts.map(s => (
                    <div
                      key={s.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 text-[11px] font-extrabold rounded-xl border ${getShiftBadgeStyle(
                            s.name,
                          )}`}
                        >
                          {s.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/90">
                          <Clock className="w-3.5 h-3.5 text-muted" />
                          <span>
                            {s.startTime} – {s.endTime}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteShift(s.id, s.name)}
                        title={t('landlordShiftsBtnDelete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-line flex items-center justify-end bg-surface/60">
              <Button size="xs"
                type="button"
                variant="outline"
                onClick={() => handleAttemptCloseModal('shifts')}
              >
                {t('landlordScheduleClose')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
 MODAL 4: CHỈNH SỬA CA TRỰC ( Occurrence / Forward Pattern)
 ═══════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && selectedScheduleForEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleAttemptCloseModal('edit')
          }}
        >
          <div
            className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-line animate-in zoom-in-95 duration-200"
            onInput={() => setIsDirty(true)}
            onChange={() => setIsDirty(true)}
          >
            <div className="flex items-center justify-between p-6 border-b border-line bg-surface/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">
                    {t('landlordScheduleModalEditTitle')}
                  </h2>
                  <p className="text-[11px] text-muted font-semibold">
                    {selectedScheduleForEdit.employeeName} ·{' '}
                    {formatDisplayDate(selectedScheduleForEdit.workDate)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAttemptCloseModal('edit')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form
              onSubmit={handleSubmitEdit}
              className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar"
            >
              {/* Shift Picker */}
              <div className="space-y-2">
                <SelectInput
                  label={t('landlordScheduleSelectNewShift')}
                  value={editShiftId}
                  onChange={e => {
                    setEditShiftId(e.target.value)
                    setIsDirty(true)
                  }}
                  options={shifts.map(s => ({
                    value: s.id,
                    label: `${s.name} (${s.startTime} - ${s.endTime})`,
                  }))}
                />
              </div>

              {/* Status Picker */}
              <div className="space-y-2">
                <SelectInput
                  label={t('landlordScheduleShiftStatus')}
                  value={editStatus}
                  onChange={e => {
                    setEditStatus(e.target.value as 'scheduled' | 'canceled')
                    setIsDirty(true)
                  }}
                  options={[
                    {
                      value: 'scheduled',
                      label: `${t('landlordScheduleStatusAssigned')} (scheduled)`,
                    },
                    { value: 'canceled', label: t('landlordScheduleStatusCanceled') },
                  ]}
                />
              </div>

              {/* Scope Choice if Recurring ( Rule) */}
              {selectedScheduleForEdit.isRecurring && selectedScheduleForEdit.recurrenceId && (
                <div className="space-y-2.5 p-3.5 bg-surface border border-line rounded-2xl">
                  <label className="text-xs font-extrabold text-foreground block">
                    {t('landlordScheduleEditScope')}
                  </label>

                  <div
                    onClick={() => {
                      setEditScope('single')
                      setIsDirty(true)
                    }}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${editScope === 'single'
                      ? 'bg-card border-primary shadow-xs'
                      : 'bg-surface border-line hover:bg-card-hover'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${editScope === 'single'
                        ? 'border-primary bg-primary'
                        : 'border-line bg-card'
                        }`}
                    >
                      {editScope === 'single' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-card" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-foreground">
                        {t('landlordScheduleEditScopeSingleTitle')}
                      </span>
                      <p className="text-[11px] text-muted">
                        {t('landlordScheduleEditScopeSingleDesc')}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setEditScope('future')
                      setIsDirty(true)
                    }}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${editScope === 'future'
                      ? 'bg-card border-amber-500 shadow-xs'
                      : 'bg-surface border-line hover:bg-card-hover'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${editScope === 'future'
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-line bg-card'
                        }`}
                    >
                      {editScope === 'future' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-card" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-warning">
                        {t('landlordScheduleEditScopeFutureTitle')}
                      </span>
                      <p className="text-[11px] text-warning/80 leading-relaxed">
                        {t('landlordScheduleEditScopeFutureDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                <Button size="xs"
                  type="button"
                  variant="outline"
                  onClick={() => handleAttemptCloseModal('edit')}
                >
                  {t('landlordShiftsModalBtnCancel')}
                </Button>
                <Button size="xs"
                  type="submit"
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('landlordScheduleSaving')}</span>
                    </>
                  ) : (
                    <span>{t('landlordShiftsSaveShiftBtn')}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
 CONFIRMATION MODAL ON UNSAVED CHANGES (Rule #10)
 ═══════════════════════════════════════════════════════════════════ */}
      {isConfirmCloseOpen && pendingModalToClose && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setIsConfirmCloseOpen(false)
          }}
        >
          <div className="bg-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-line p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-warning-soft text-warning border border-warning-subtle flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-foreground">
                {t('landlordShiftsConfirmCloseTitle')}
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                {t('landlordShiftsConfirmCloseDesc')}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <Button size="xs"
                type="button"
                variant="outline"
                onClick={() => setIsConfirmCloseOpen(false)}
                className="flex-1"
              >
                {t('landlordShiftsConfirmCloseKeep')}
              </Button>
              <Button size="xs"
                type="button"
                variant="danger"
                onClick={() => {
                  setIsConfirmCloseOpen(false)
                  performCloseModal(pendingModalToClose)
                }}
                className="flex-1"
              >
                {t('landlordShiftsConfirmCloseDiscard')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal (Rule #10) */}
      {actionConfirm && (
        <Modal
          isOpen={!!actionConfirm}
          onClose={() => setActionConfirm(null)}
          size="sm"
        >
          <div className="space-y-4 pt-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-danger-soft text-danger flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                {actionConfirm.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {actionConfirm.message}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-line">
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => setActionConfirm(null)}
                className="flex-1"
              >
                {t('landlordShiftsModalBtnCancel') || 'Hủy bỏ'}
              </Button>
              <Button
                size="sm"
                variant="danger"
                type="button"
                onClick={() => {
                  const onConf = actionConfirm.onConfirm
                  setActionConfirm(null)
                  onConf()
                }}
                className="flex-1"
              >
                {t('btnConfirm') || 'Xác nhận'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
