'use client'

import React, { useState, useMemo, useEffect, useCallback, Suspense, useRef } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Building2,
  Shield,
  Users,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  CheckCircle2,
  Phone,
  ArrowLeft,
  ArrowRight,
  Camera,
  Eye,
  CheckSquare,
  User,
  FileText,
  Trash2,
  Upload,
  BellRing,
  RefreshCw,
} from 'lucide-react'
import {
  DutyTaskItem,
  getLocalizedPlace,
  getLocalizedStaffName,
  getCurrentWeekDays,
  getTodayISODate,
} from '../data'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  TextInput,
  SelectInput,
  TextareaInput,
  Checkbox,
  Text,
  Chip,
  Modal,
  EmptyState,
} from '@/components/ui'
import {
  staffScheduleService,
  StaffBoardingHouse,
  StaffScheduleItem,
} from '@/services/staff-schedule.service'
import { staffAttendanceService, StaffTodayOverview } from '@/services/staff-attendance.service'

function StaffScheduleContent() {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()
  const isEn = locale === 'en'

  // Boarding houses list & filter
  const [boardingHouses, setBoardingHouses] = useState<StaffBoardingHouse[]>([])
  const [isHousesLoading, setIsHousesLoading] = useState<boolean>(true)
  const [selectedHouse, setSelectedHouse] = useState<string>('all')

  // Week anchor date for navigation (Mon-Sun window)
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => new Date())

  // Schedules state
  const [schedules, setSchedules] = useState<StaffScheduleItem[]>([])
  const [isSchedulesLoading, setIsSchedulesLoading] = useState<boolean>(true)

  // Selected schedule item for unified detail modal
  const [selectedSchedule, setSelectedSchedule] = useState<StaffScheduleItem | null>(null)

  // Today's attendance overview & duties checklist state
  const [todayOverview, setTodayOverview] = useState<StaffTodayOverview | null>(null)
  const [todayDuties, setTodayDuties] = useState<DutyTaskItem[]>([])
  const [isDutiesLoading, setIsDutiesLoading] = useState<boolean>(true)

  // Today's ISO date string
  const todayStr = getTodayISODate()

  // Toast notification
  const { toast } = useToast()

  // Helper translations for shift names
  const getShiftName = (name: string) => {
    if (name.includes('Sáng')) return `${t('shiftMorning')} (07:00 - 15:00)`
    if (name.includes('Chiều')) return `${t('shiftAfternoon')} (15:00 - 23:00)`
    if (name.includes('Đêm')) return `${t('shiftNight')} (23:00 - 07:00)`
    return name
  }

  const getPositionName = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('bảo vệ') || lower.includes('an ninh') || lower.includes('security'))
      return t('positionSecurity')
    if (lower.includes('vệ sinh') || lower.includes('cleaning')) return t('positionCleaning')
    if (lower.includes('kỹ thuật') || lower.includes('bảo trì') || lower.includes('technical'))
      return t('positionTechnical')
    return name
  }

  // Dynamic week days based on weekAnchor (Mon-Sun)
  const weekDays = useMemo(() => {
    const rawDays = getCurrentWeekDays(weekAnchor)
    const labels = [
      t('dayMon'),
      t('dayTue'),
      t('dayWed'),
      t('dayThu'),
      t('dayFri'),
      t('daySat'),
      t('daySun'),
    ]
    return rawDays.map((d, idx) => ({
      label: labels[idx] || d.label,
      date: d.date,
      dayNum: d.dayNum,
      isToday: d.isToday,
    }))
  }, [weekAnchor, t])

  const startDate = weekDays[0]?.date
  const endDate = weekDays[weekDays.length - 1]?.date

  // Real-time dynamic today indicator label
  const todayLabel = useMemo(() => {
    const now = new Date()
    const dayOfWeekIndex = now.getDay()
    const dayNames = [
      t('daySun'),
      t('dayMon'),
      t('dayTue'),
      t('dayWed'),
      t('dayThu'),
      t('dayFri'),
      t('daySat'),
    ]
    const dayName = dayNames[dayOfWeekIndex] || ''
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`
    return t('todayWithDayDate', { day: dayName, date: formattedDate })
  }, [t])

  // 1. Fetch active assigned boarding houses
  useEffect(() => {
    let mounted = true
    setIsHousesLoading(true)
    staffScheduleService
      .getBoardingHouses()
      .then(houses => {
        if (mounted) setBoardingHouses(houses)
      })
      .catch(err => {
        console.error('Failed to load staff boarding houses:', err)
        if (mounted) setBoardingHouses([])
      })
      .finally(() => {
        if (mounted) setIsHousesLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  // 2. Fetch schedules for current week window & selected property
  const fetchSchedules = useCallback(async () => {
    if (!startDate || !endDate) return
    setIsSchedulesLoading(true)
    try {
      const items = await staffScheduleService.getSchedules({
        startDate,
        endDate,
        boardingHouseId: selectedHouse,
      })
      setSchedules(items)
    } catch (err) {
      console.error('Failed to load staff schedules:', err)
      setSchedules([])
    } finally {
      setIsSchedulesLoading(false)
    }
  }, [startDate, endDate, selectedHouse])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  // 3. Fetch today's duties checklist & sync with attendance overview
  const fetchTodayDuties = useCallback(async () => {
    setIsDutiesLoading(true)
    try {
      const overview = await staffAttendanceService.getTodayOverview()
      setTodayOverview(overview)
      if (overview?.schedule?.duties && Array.isArray(overview.schedule.duties)) {
        setTodayDuties(overview.schedule.duties)
      } else {
        setTodayDuties([])
      }
    } catch (err) {
      console.error('Failed to load today duties overview:', err)
      setTodayOverview(null)
      setTodayDuties([])
    } finally {
      setIsDutiesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodayDuties()

    const handleSync = () => {
      fetchTodayDuties()
    }

    window.addEventListener('dormio_attendance_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('dormio_attendance_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [fetchTodayDuties])

  // Navigation handlers
  const handlePrevWeek = () => {
    setWeekAnchor(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }

  const handleNextWeek = () => {
    setWeekAnchor(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  const handleCurrentWeek = () => {
    setWeekAnchor(new Date())
  }

  // Helper to extract duty lines from item
  const getDutyLines = (item: StaffScheduleItem) => {
    if (item.duties && item.duties.length > 0) {
      return item.duties.map(d => d.title)
    }
    if (!item.position.description) return []
    return item.position.description
      .split('\n')
      .filter(Boolean)
      .map(line => line.replace(/^[•\s\d.-]+/, ''))
  }

  // =========================================================================
  // NHIỆM VỤ HÔM NAY (TODAY'S TASKS) STATE & HANDLERS
  // =========================================================================
  const [activeDutyForProof, setActiveDutyForProof] = useState<DutyTaskItem | null>(null)
  const [dutyDraftPhoto, setDutyDraftPhoto] = useState<string | null>(null)
  const [dutyDraftNote, setDutyDraftNote] = useState<string>('')
  const dutyFileInputRef = useRef<HTMLInputElement>(null)

  // Enlarged photo preview lightbox
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{
    isOpen: boolean
    title: string
    imageUrl: string
    note?: string
  } | null>(null)

  const handleOpenDutyProofModal = (duty: DutyTaskItem) => {
    setActiveDutyForProof(duty)
    setDutyDraftPhoto(duty.photoProof || null)
    setDutyDraftNote(duty.note || '')
  }

  const handleToggleDuty = async (duty: DutyTaskItem) => {
    if (duty.requiresPhoto && !duty.photoProof && !duty.completed) {
      handleOpenDutyProofModal(duty)
      toast.warning(t('toastDutyProofRequired'))
      return
    }

    if (!todayOverview?.schedule?.id) {
      toast.warning(t('toastNoActiveShiftDuty'))
      return
    }

    try {
      const res = await staffAttendanceService.saveDutyProof({
        workScheduleId: todayOverview.schedule.id,
        dutyId: duty.id,
        markCompleted: !duty.completed,
      })

      if (res?.schedule?.duties) {
        setTodayDuties(res.schedule.duties)
      }
      window.dispatchEvent(new CustomEvent('dormio_attendance_updated'))
      toast.success(t('toastDutyStatusUpdated'))
    } catch (err: unknown) {
      toast.warning(err instanceof Error ? err.message : t('toastDutyUpdateFailed'))
    }
  }

  const handleSaveDutyProof = async (markComplete: boolean) => {
    if (!activeDutyForProof) return

    if (
      markComplete &&
      activeDutyForProof.requiresPhoto &&
      !dutyDraftPhoto &&
      !activeDutyForProof.photoProof
    ) {
      toast.warning(t('toastDutyProofRequired'))
      return
    }

    if (!todayOverview?.schedule?.id) {
      toast.warning(t('toastNoActiveShiftProof'))
      return
    }

    try {
      const res = await staffAttendanceService.saveDutyProof({
        workScheduleId: todayOverview.schedule.id,
        dutyId: activeDutyForProof.id,
        photo: dutyDraftPhoto || undefined,
        note: dutyDraftNote.trim() || undefined,
        markCompleted: markComplete,
      })

      if (res?.schedule?.duties) {
        setTodayDuties(res.schedule.duties)
      }
      window.dispatchEvent(new CustomEvent('dormio_attendance_updated'))
      setActiveDutyForProof(null)

      if (markComplete) {
        toast.success(t('toastDutyCompleted'))
      } else {
        toast.info(t('toastDutyProgressUpdated'))
      }
    } catch (err: unknown) {
      toast.warning(err instanceof Error ? err.message : t('toastDutyProofSaveFailed'))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      if (typeof event.target?.result === 'string') {
        setDutyDraftPhoto(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Progress metrics
  const totalDuties = todayDuties.length
  const completedDuties = todayDuties.filter(d => d.completed).length
  const progressPercent = totalDuties > 0 ? Math.round((completedDuties / totalDuties) * 100) : 0

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
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
              {t('schedTag')}
            </Chip>
          </div>
          <Text as="h1" size={{ base: '2xl', sm: '3xl' }} weight="black" color="default" className="tracking-tight">
            {t('schedTitle')}
          </Text>
          <Text size={{ base: 'xs', sm: 'sm' }} color="secondary" weight="medium">
            {t('schedSubtitle')}
          </Text>
        </div>

        {/* Action Button to Attendance History */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <Link
            href="/staff/shift-history"
            className="px-4 py-2.5 rounded-2xl bg-card-hover hover:bg-line text-foreground text-xs font-black flex items-center gap-2 transition-all shadow-2xs border border-line cursor-pointer"
          >
            <Clock className="w-4 h-4 text-primary" />
            <span>{t('btnViewAttendanceHistory')}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: WORK SCHEDULE ROSTER (LỊCH PHÂN CA TUẦN)                         */}
      {/* ========================================================================= */}
      <div className="space-y-5 animate-in fade-in duration-150">
        {/* Controls Bar */}
        <div className="bg-card rounded-2xl border border-line shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* House selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted" />
            {isHousesLoading ? (
              <div className="h-8 w-44 bg-card-hover rounded-xl animate-pulse" />
            ) : (
              <SelectInput
                value={selectedHouse}
                onChange={e => setSelectedHouse(e.target.value)}
                options={[
                  { value: 'all', label: t('filterAllHouses') },
                  ...boardingHouses.map(house => ({
                    value: house.id,
                    label: getLocalizedPlace(house.name, isEn),
                  })),
                ]}
                className="px-3.5 py-1.5 bg-surface border border-line rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                containerClassName="w-auto"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleCurrentWeek}
              title={t('titleReturnCurrentWeek')}
              leftIcon={<span className="w-2.5 h-2.5 rounded-full bg-primary" />}
            >
              {todayLabel}
            </Button>
          </div>
        </div>

        {/* Week Navigation bar */}
        <div className="bg-card rounded-2xl border border-line shadow-2xs p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={handlePrevWeek}
                title={t('titlePrevWeek')}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={handleNextWeek}
                title={t('titleNextWeek')}
              >
                <ChevronRight />
              </Button>
            </div>

            {/* Nút bấm "Xem lịch hôm nay" để trở về lịch làm việc của tuần hiện tại */}
            <Button
              variant="secondary"
              onClick={handleCurrentWeek}
              title={t('titleTodaySchedule')}
              leftIcon={<Calendar className="text-primary" />}
            >
              {t('btnTodaySchedule')}
            </Button>

            <Text size={{ base: 'xs', sm: 'sm' }} weight="black" color="default" className="ml-1">
              {t('weekLabel')}
            </Text>
          </div>

          <span className="text-xs font-semibold text-muted bg-surface px-3 py-1 rounded-xl border border-line font-mono self-start sm:self-center">
            {startDate} — {endDate}
          </span>
        </div>

        {/* SKELETON LOADING STATE FOR WEEK CALENDAR */}
        {isSchedulesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDays.map((_, idx) => (
              <div
                key={idx}
                className="min-h-[260px] rounded-2xl border border-line p-3 bg-card shadow-2xs flex flex-col justify-between animate-pulse"
              >
                <div className="border-b border-line pb-2 mb-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-3 w-10 bg-line rounded" />
                    <div className="h-5 w-12 bg-line rounded" />
                  </div>
                </div>
                <div className="space-y-2 flex-1 pt-2">
                  <div className="h-16 bg-card-hover rounded-xl" />
                  <div className="h-16 bg-card-hover rounded-xl" />
                </div>
                <div className="pt-2 border-t border-line mt-2">
                  <div className="h-3 w-14 mx-auto bg-line rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* WEEKLY CALENDAR GRID (7 columns) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDays.map((day, index) => {
              const schedulesForDay = schedules.filter(s => s.workDate === day.date)

              return (
                <div
                  key={index}
                  className={`min-h-[260px] rounded-2xl border p-3 flex flex-col justify-between transition-all ${
                    day.isToday
                      ? 'bg-primary/5 border-primary shadow-xs'
                      : 'bg-card border-line shadow-2xs'
                  }`}
                >
                  {/* Day Header */}
                  <div className="border-b border-line pb-2 mb-2 flex items-center justify-between">
                    <div>
                      <Text size="3xs" weight="bold" color="secondary" uppercase className="block">
                        {day.label}
                      </Text>
                      <Text
                        size="base"
                        weight="black"
                        color={day.isToday ? 'brand' : 'default'}
                      >
                        {day.dayNum}/{day.date.split('-')[1] || '09'}
                      </Text>
                    </div>
                    {day.isToday && (
                      <Chip variant="primary" size="xs" preventHover>
                        {t('todayBadge')}
                      </Chip>
                    )}
                  </div>

                  {/* Shifts List for Day */}
                  <div className="space-y-2 flex-1">
                    {schedulesForDay.length > 0 ? (
                      schedulesForDay.map(item => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedSchedule(item)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
                            item.status === 'completed'
                              ? 'bg-surface border-line text-foreground/90'
                              : 'bg-card border-primary/40 hover:border-primary'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <Text size="3xs" weight="black" color="brand" uppercase className="truncate">
                              {getShiftName(item.shift.name)}
                            </Text>
                          </div>

                          <Text size="2xs" weight="bold" color="default">
                            {item.shift.startTime} - {item.shift.endTime}
                          </Text>

                          <Text size="3xs" weight="semibold" color="secondary" className="truncate mt-1">
                            {getLocalizedPlace(item.boardingHouseName, isEn)}
                          </Text>

                          {item.coWorkers && item.coWorkers.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-muted mt-1.5 pt-1 border-t border-line">
                              <Users className="w-3 h-3 text-muted" />
                              <Text size="3xs" color="secondary">
                                {t('plusCoworkers', { count: item.coWorkers.length })}
                              </Text>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-center py-8">
                        <Text size="2xs" color="secondary" weight="medium" italic>
                          {t('offShift')}
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Day Footer note */}
                  <div className="pt-2 border-t border-line mt-2 text-center">
                    <Text size="3xs" color="secondary" weight="semibold">
                      {t('shiftCountPerDay', { count: schedulesForDay.length })}
                    </Text>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: NHIỆM VỤ HÔM NAY (TODAY'S TASKS CHECKLIST)                      */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4 border-t border-line">
        {/* Section Header & Progress Card */}
        <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-primary/10 text-primary">
                <CheckSquare className="w-4 h-4" />
              </span>
              <Chip variant="primary" size="xs" preventHover>
                {t('todayDutiesTag')}
              </Chip>
              <Text size="xs" color="secondary" weight="medium">• {todayStr}</Text>
            </div>
            <Text as="h2" size={{ base: 'lg', sm: 'xl' }} weight="black" color="default">
              {t('todayDutiesTitle')}
            </Text>
            <Text size="xs" color="secondary" weight="medium" className="leading-relaxed">
              {t('todayDutiesDesc')}
            </Text>
          </div>

          {/* Progress Indicator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-surface border border-line rounded-2xl p-3.5 min-w-[200px] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Text size="xs" weight="bold" color="secondary">
                  {t('dutyProgressLabel')}
                </Text>
                <Text size="sm" weight="black" color="brand" className="font-mono">
                  {completedDuties}/{totalDuties} ({progressPercent}%)
                </Text>
              </div>
              <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                <div
                  className="bg-linear-to-r from-primary to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SKELETON LOADING STATE FOR DUTIES */}
        {isDutiesLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-card rounded-2xl border border-line p-4" />
            <div className="h-20 bg-card rounded-2xl border border-line p-4" />
            <div className="h-20 bg-card rounded-2xl border border-line p-4" />
          </div>
        ) : todayDuties.length > 0 ? (
          /* Duties List */
          <div className="space-y-3">
            {todayDuties.map((duty, idx) => (
              <div
                key={duty.id}
                className={`bg-card rounded-2xl border transition-all p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  duty.completed
                    ? 'border-success-subtle bg-emerald-50/20'
                    : 'border-line hover:border-primary/50 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <Checkbox
                    checked={duty.completed}
                    onChange={() => handleToggleDuty(duty)}
                    className="mt-1"
                  />

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-muted">#{idx + 1}</span>
                      <Text
                        as="h3"
                        size="sm"
                        weight="black"
                        color="default"
                        className={`leading-snug ${duty.completed ? 'line-through text-muted' : ''}`}
                      >
                        {duty.title}
                      </Text>
                      {duty.requiresPhoto ? (
                        <Chip
                          variant="warning"
                          size="xs"
                          preventHover
                          leftIcon={<Camera className="w-3 h-3 text-warning" />}
                        >
                          {t('dutyPhotoRequired')}
                        </Chip>
                      ) : (
                        <Chip variant="neutral" size="xs" preventHover>
                          {t('dutyPhotoOptional')}
                        </Chip>
                      )}
                    </div>

                    {duty.note && (
                      <p className="text-xs text-muted italic bg-card/70 p-2 rounded-xl border border-line inline-block font-medium">
                        Ghi chú: &quot;{duty.note}&quot;
                      </p>
                    )}

                    {duty.completedAt && (
                      <Text size="2xs" weight="bold" color="success" className="block">
                        ✓ {t('dutyCompletedAt', { time: duty.completedAt })}
                      </Text>
                    )}
                  </div>
                </div>

                {/* Right side: Photo proof thumbnail and action button */}
                <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                  {duty.photoProof && (
                    <div
                      onClick={() =>
                        setPreviewPhotoModal({
                          isOpen: true,
                          title: duty.title,
                          imageUrl: duty.photoProof!,
                          note: duty.note,
                        })
                      }
                      className="flex items-center gap-2 p-1.5 rounded-xl bg-surface border border-line hover:border-primary cursor-pointer group transition-colors"
                      title={t('titleEnlargePhoto')}
                    >
                      <img
                        src={duty.photoProof}
                        alt="Proof"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="text-left pr-1 hidden sm:block">
                        <Text
                          size="3xs"
                          weight="bold"
                          color="default"
                          className="group-hover:text-primary flex items-center gap-1"
                        >
                          <Eye className="w-2.5 h-2.5" /> {t('dutyAuditProof')}
                        </Text>
                        <Text size="3xs" color="secondary" className="font-mono">
                          {duty.photoProofTime || todayStr}
                        </Text>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    onClick={() => handleOpenDutyProofModal(duty)}
                    leftIcon={<FileText className="text-primary" />}
                  >
                    {t('btnUpdateDetails')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State: Thông báo không có nhiệm vụ */
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8 text-success" />}
            title={t('noTasksAssigned')}
            description={t('noTasksAssignedDesc')}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED SHIFT DETAIL MODAL: GỘP THÔNG TIN CA LÀM & NHIỆM VỤ CA LÀM       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedSchedule)}
        onClose={() => setSelectedSchedule(null)}
        size="xl"
      >
        {selectedSchedule && (
          <>
            <Modal.Header
              title={
                <div>
                  <Chip variant="primary" size="xs" preventHover className="mb-1">
                    {t('detailTag')}
                  </Chip>
                  <Text as="h3" size={{ base: 'lg', sm: 'xl' }} weight="black" color="default">
                    {getShiftName(selectedSchedule.shift.name)}
                  </Text>
                </div>
              }
              onClose={() => setSelectedSchedule(null)}
            />
            <Modal.Body className="space-y-5">
              {/* 1. General Shift Info */}
              <div className="p-4 rounded-2xl bg-surface border border-line space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <Text size="xs" color="secondary" weight="medium">{t('detailDate')}</Text>
                  <Text size="xs" weight="bold" color="default">{selectedSchedule.workDate}</Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text size="xs" color="secondary" weight="medium">{t('detailPlace')}</Text>
                  <Text size="xs" weight="bold" color="default">
                    {getLocalizedPlace(selectedSchedule.boardingHouseName, isEn)}
                  </Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text size="xs" color="secondary" weight="medium">{t('detailPosition')}</Text>
                  <Text size="xs" weight="bold" color="brand">
                    {getPositionName(selectedSchedule.position.name)}
                  </Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text size="xs" color="secondary" weight="medium">{t('detailShiftType')}</Text>
                  <Text size="xs" weight="bold" color="default">
                    {selectedSchedule.isRecurring ? t('shiftTypeRecurring') : t('shiftTypeOneTime')}
                  </Text>
                </div>
              </div>

              {/* 2. Co-workers on duty */}
              {selectedSchedule.coWorkers && selectedSchedule.coWorkers.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    <Text size="xs" weight="black" color="default" uppercase className="tracking-wider">
                      {t('detailCoworkersTitle')}
                    </Text>
                  </div>
                  <div className="space-y-2">
                    {selectedSchedule.coWorkers.map(cw => (
                      <div
                        key={cw.id}
                        className="p-3 rounded-2xl bg-surface border border-line flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              cw.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                cw.name,
                              )}&background=2AC1BC&color=fff`
                            }
                            alt={cw.name}
                            className="w-8 h-8 rounded-full object-cover border border-line"
                          />
                          <div>
                            <Text size="xs" weight="bold" color="default" className="block">
                              {getLocalizedStaffName(cw.name, isEn)}
                            </Text>
                            <Text size="3xs" color="secondary">
                              {getPositionName(cw.positionName)}
                            </Text>
                          </div>
                        </div>
                        {cw.phone && (
                          <a
                            href={`tel:${cw.phone}`}
                            className="p-1.5 rounded-lg bg-card border border-line text-primary hover:bg-teal-50 shadow-2xs"
                            title={`Gọi cho ${cw.name}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Fixed Daily Routine Duties */}
              <div className="space-y-2.5 pt-2 border-t border-line">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary" />
                    <Text size="xs" weight="black" color="default" uppercase className="tracking-wider">
                      {t('routineDutiesTitle')}
                    </Text>
                  </div>
                  <Chip variant="primary" size="xs" preventHover>
                    {getPositionName(selectedSchedule.position.name)}
                  </Chip>
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-line text-xs text-foreground space-y-2.5">
                  {getDutyLines(selectedSchedule).length > 0 ? (
                    getDutyLines(selectedSchedule).map((line, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <Text size="xs" weight="medium" color="default" className="leading-relaxed">
                          {line}
                        </Text>
                      </div>
                    ))
                  ) : (
                    <Text size="xs" color="secondary" italic>{t('noRoutineDuties')}</Text>
                  )}
                </div>
              </div>

              {/* 4. Additional tasks / Landlord reminders */}
              <div className="space-y-2.5 pt-2 border-t border-line">
                <div className="flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-amber-500" />
                  <Text size="xs" weight="black" color="default" uppercase className="tracking-wider">
                    {t('landlordTasksTitle')}
                  </Text>
                </div>

                {selectedSchedule.additionalTasks && selectedSchedule.additionalTasks.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-warning-soft border border-warning-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <Text size="xs" weight="black" color="warning">
                          {t('upcomingDeadlines', {
                            count: selectedSchedule.additionalTasks.length,
                          })}
                        </Text>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-warning font-bold text-[10px]">
                        {selectedSchedule.workDate}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-warning-subtle">
                      {selectedSchedule.additionalTasks.map(task => (
                        <div
                          key={task.id}
                          className="p-2.5 rounded-xl bg-card border border-warning-subtle text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Text size="xs" weight="bold" color="default">{task.title}</Text>
                            <Chip variant="warning" size="xs" preventHover>
                              {task.deadline}
                            </Chip>
                          </div>
                          {task.description && (
                            <Text size="2xs" color="secondary" className="leading-snug">
                              {task.description}
                            </Text>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-surface border border-line text-muted text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <Text size="xs" color="secondary">{t('noAdditionalTasks')}</Text>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                fullWidth
                size="md"
                variant="secondary"
                onClick={() => setSelectedSchedule(null)}
              >
                {t('btnClose')}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* DUTY PROOF & NOTE MODAL                                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(activeDutyForProof)}
        onClose={() => setActiveDutyForProof(null)}
        size="lg"
      >
        {activeDutyForProof && (
          <>
            <Modal.Header
              icon={<FileText className="w-5 h-5 text-primary" />}
              title={t('dutyModalHeader')}
              onClose={() => setActiveDutyForProof(null)}
            />
            <Modal.Body className="space-y-4">
              {/* Task Info */}
              <div className="p-3.5 rounded-2xl bg-surface border border-line space-y-1">
                <Text size="3xs" weight="bold" color="secondary" uppercase className="tracking-wider block">
                  {t('taskTitleLabel')}
                </Text>
                <Text as="h4" size="xs" weight="black" color="default" className="leading-snug">
                  {activeDutyForProof.title}
                </Text>
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  {activeDutyForProof.requiresPhoto ? (
                    <Chip
                      variant="warning"
                      size="xs"
                      preventHover
                      leftIcon={<Camera className="w-3 h-3 text-warning" />}
                    >
                      {t('proofMandatory')}
                    </Chip>
                  ) : (
                    <Chip variant="neutral" size="xs" preventHover>
                      {t('proofOptional')}
                    </Chip>
                  )}
                </div>
              </div>

              {/* Hidden File Input */}
              <TextInput
                ref={dutyFileInputRef}
                type="file"
                accept="image/*"
                containerClassName="hidden"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Photo Upload / Preview */}
              <div className="space-y-2">
                <Text size="2xs" weight="bold" color="secondary" className="block">
                  {t('auditPhotoLabel')}
                </Text>

                {dutyDraftPhoto ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-line">
                    <img
                      src={dutyDraftPhoto}
                      alt="Proof"
                      className="w-16 h-16 rounded-xl object-cover border border-line"
                    />
                    <div className="space-y-1 text-xs flex-1">
                      <Chip variant="success" size="xs" preventHover>
                        ✓ {t('photoAttached')}
                      </Chip>
                      <Text size="2xs" color="secondary" className="font-mono">{todayStr}</Text>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDutyDraftPhoto(null)}
                      title={t('deletePhoto')}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ) : (
                  <Button
                    fullWidth
                    size="md"
                    variant="ghost"
                    onClick={() => dutyFileInputRef.current?.click()}
                    className="flex-col py-6"
                  >
                    <Camera className="w-6 h-6 text-primary" />
                    <span className="font-bold">{t('clickToCapturePhoto')}</span>
                    <Text size="3xs" color="secondary" weight="normal">
                      {t('autoTimestampDesc')}
                    </Text>
                  </Button>
                )}
              </div>

              {/* Note input */}
              <div className="space-y-1">
                <Text size="2xs" weight="bold" color="secondary" className="block">
                  {t('dutyNoteLabel')}
                </Text>
                <TextareaInput
                  rows={3}
                  value={dutyDraftNote}
                  onChange={e => setDutyDraftNote(e.target.value)}
                  placeholder={t('dutyNotePlaceholder')}
                  className="w-full p-3 bg-surface border border-line rounded-xl text-xs font-medium focus:outline-none focus:border-primary leading-relaxed"
                />
              </div>
            </Modal.Body>
            <Modal.Footer className="flex flex-wrap items-center justify-between gap-2.5">
              <Button
                size="md"
                variant="secondary"
                onClick={() => setActiveDutyForProof(null)}
              >
                {t('btnCancel')}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => handleSaveDutyProof(false)}
                  leftIcon={<FileText className="text-muted" />}
                >
                  {t('saveProgress')}
                </Button>

                <Button
                  size="md"
                  onClick={() => handleSaveDutyProof(true)}
                  leftIcon={<CheckCircle2 />}
                >
                  {t('btnCompleteDuty')}
                </Button>
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* PHOTO PREVIEW LIGHTBOX                                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(previewPhotoModal?.isOpen)}
        onClose={() => setPreviewPhotoModal(null)}
        size="lg"
      >
        {previewPhotoModal && (
          <>
            <Modal.Header
              icon={<Camera className="w-4 h-4 text-primary" />}
              title={previewPhotoModal.title}
              onClose={() => setPreviewPhotoModal(null)}
            />
            <Modal.Body className="p-0">
              <div className="relative bg-zinc-950 aspect-video max-h-[380px] flex items-center justify-center">
                <img
                  src={previewPhotoModal.imageUrl}
                  alt="Audit proof"
                  className="w-full h-full object-contain"
                />
              </div>

              {previewPhotoModal.note && (
                <div className="p-4 bg-surface border-t border-line space-y-1">
                  <Text size="3xs" weight="bold" color="secondary" uppercase className="tracking-wider block">
                    {t('lightboxNoteLabel')}
                  </Text>
                  <Text size="xs" color="default" weight="medium" italic className="leading-relaxed">
                    &quot;{previewPhotoModal.note}&quot;
                  </Text>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="flex justify-end">
              <Button
                size="md"
                variant="secondary"
                onClick={() => setPreviewPhotoModal(null)}
              >
                {t('btnClose')}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  )
}

export default function StaffSchedulePage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-xs text-muted font-bold">Loading...</div>}
    >
      <StaffScheduleContent />
    </Suspense>
  )
}
