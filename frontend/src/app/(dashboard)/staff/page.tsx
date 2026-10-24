'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Calendar,
  Shield,
  Phone,
  CheckSquare,
  Sparkles,
  MapPin,
  LogOut,
  ArrowRight,
  RefreshCw,
  Check,
  Users,
  Camera,
  Image as Upload,
  Eye,
  X,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Info,
  Lock,
} from 'lucide-react'
import {
  evaluateCheckInWindow,
  evaluateCheckOutWindow,
  Shift,
  JobPosition,
  WorkScheduleItem,
  AttendanceRecord,
  AttendanceWatermark,
  DutyTaskItem,
  getLocalizedPlace,
  getLocalizedStaffName,
  getLocalizedExplanation,
  getTodayISODate,
  saveAttendanceRecord,
} from './data'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { staffAttendanceService, StaffMonthlySummary } from '@/services/staff-attendance.service'
import { Button, TextInput, TextareaInput, Checkbox, Text, Chip, Modal } from '@/components/ui'

function getDutyTitle(duty: DutyTaskItem, _isEn = false): string {
  return duty.title
}

function getDutyNote(note?: string, _isEn = false): string {
  return note || ''
}

export default function StaffOverviewPage() {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()

  // Live Clock
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Mount state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false)

  const { user } = useAuth()

  // Today's schedule & duties state (initialized to null to represent no mock data)
  const [todaySchedule, setTodaySchedule] = useState<WorkScheduleItem | null>(null)
  const [dutyList, setDutyList] = useState<DutyTaskItem[]>([])
  const [staffName, setStaffName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const todayAdditionalTasks: any[] = []

  // Active attendance state
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)

  // Monthly summary state
  const [monthlySummary, setMonthlySummary] = useState<StaffMonthlySummary | null>(null)

  // Toast notification
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'info' | 'warning'
  } | null>(null)

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3800)
  }

  // Fetch live overview from backend ( & )
  const fetchOverview = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const data = await staffAttendanceService.getTodayOverview()
      if (data) {
        if (data.staffName) {
          setStaffName(data.staffName)
        }
        if (data.schedule && data.schedule.id) {
          setTodaySchedule(data.schedule)
          if (data.schedule.duties && Array.isArray(data.schedule.duties)) {
            setDutyList(data.schedule.duties)
          } else {
            setDutyList([])
          }
        } else {
          setTodaySchedule(null)
          setDutyList([])
        }

        if (data.attendance && data.attendance.id) {
          setAttendance(data.attendance)
          saveAttendanceRecord(data.attendance)
        } else {
          setAttendance(null)
        }
      } else {
        setTodaySchedule(null)
        setAttendance(null)
        setDutyList([])
      }
    } catch (err: any) {
      console.warn("Could not fetch today's staff overview from backend:", err)
      setTodaySchedule(null)
      setAttendance(null)
      setDutyList([])
      setFetchError(err?.message || 'ERR_FETCH_FAILED')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch monthly attendance summary from backend
  const fetchMonthlySummary = useCallback(async () => {
    try {
      const summary = await staffAttendanceService.getMonthlySummary()
      if (summary) {
        setMonthlySummary(summary)
      }
    } catch (err) {
      console.warn('Could not fetch monthly attendance summary from backend:', err)
    }
  }, [])

  // Safe client-side mount & lifecycle sync
  useEffect(() => {
    setIsMounted(true)
    setCurrentTime(new Date())

    fetchOverview()
    fetchMonthlySummary()

    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    const handleAttendanceEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AttendanceRecord>
      if (customEvent.detail) {
        setAttendance(customEvent.detail)
      }
    }
    window.addEventListener('dormio_attendance_updated', handleAttendanceEvent)

    return () => {
      clearInterval(interval)
      window.removeEventListener('dormio_attendance_updated', handleAttendanceEvent)
    }
  }, [fetchOverview, fetchMonthlySummary])

  // Format current effective time string (HH:mm:ss)
  const effectiveTimeString = currentTime
    ? currentTime.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '00:00:00'

  const effectiveHHMM = currentTime
    ? currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '00:00'

  // Evaluate check-in & check-out window constraints
  const checkInEval = useMemo(() => {
    if (!todaySchedule) {
      return { allowed: false, isLate: false, isTooEarly: false, reason: '' }
    }
    return evaluateCheckInWindow(todaySchedule.shift, effectiveHHMM, Boolean(attendance?.checkIn))
  }, [todaySchedule, effectiveHHMM, attendance?.checkIn])

  const checkOutEval = useMemo(() => {
    if (!todaySchedule) {
      return { allowed: false, isEarly: false, reason: '' }
    }
    return evaluateCheckOutWindow(
      todaySchedule.shift,
      effectiveHHMM,
      Boolean(attendance?.checkIn),
      Boolean(attendance?.checkOut),
    )
  }, [todaySchedule, effectiveHHMM, attendance?.checkIn, attendance?.checkOut])

  // Modals state
  const [activeModal, setActiveModal] = useState<'checkin' | 'checkout' | 'duty_proof' | null>(null)
  const [selectedDutyForProof, setSelectedDutyForProof] = useState<DutyTaskItem | null>(null)

  // Full-screen Image Preview Lightbox
  const [previewImageModal, setPreviewImageModal] = useState<{
    isOpen: boolean
    title: string
    imageUrl: string
    watermark?: AttendanceWatermark
    note?: string
  } | null>(null)

  // Rule #10: Unsaved changes confirmation modal
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [hasFormDraftChanges, setHasFormDraftChanges] = useState(false)

  const getShiftName = (s: Shift) => {
    if (s.id === 'shift-morning') return t('shiftMorning')
    if (s.id === 'shift-afternoon') return t('shiftAfternoon')
    if (s.id === 'shift-night') return t('shiftNight')
    return s.name
  }

  const getPositionName = (posOrName: string | JobPosition) => {
    const name = typeof posOrName === 'string' ? posOrName : posOrName.name
    const lower = name.toLowerCase()
    if (lower.includes('bảo vệ') || lower.includes('an ninh') || lower.includes('security'))
      return t('positionSecurity')
    if (lower.includes('vệ sinh') || lower.includes('cleaning')) return t('positionCleaning')
    if (lower.includes('kỹ thuật') || lower.includes('bảo trì') || lower.includes('technical'))
      return t('positionTechnical')
    return name
  }

  const todayStr = todaySchedule?.workDate || getTodayISODate()
  const todayFormattedDate = (currentTime || new Date()).toLocaleDateString(
    locale === 'en' ? 'en-US' : 'vi-VN',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  )

  const monthlySummaryTitle = useMemo(() => {
    const rawMonth =
      monthlySummary?.month ||
      (todaySchedule?.workDate ? todaySchedule.workDate.substring(0, 7) : '')
    if (rawMonth && /^\d{4}-\d{2}$/.test(rawMonth)) {
      const [year, month] = rawMonth.split('-')
      const monthNames = [
        'JANUARY',
        'FEBRUARY',
        'MARCH',
        'APRIL',
        'MAY',
        'JUNE',
        'JULY',
        'AUGUST',
        'SEPTEMBER',
        'OCTOBER',
        'NOVEMBER',
        'DECEMBER',
      ]
      const mIndex = parseInt(month, 10) - 1
      const mName = monthNames[mIndex] || month
      return t('monthlySummaryPattern', { monthName: mName, month, year })
    }
    return t('monthlySummaryDefault')
  }, [monthlySummary?.month, todaySchedule?.workDate, t])

  // Handle opening Check-in modal
  const handleOpenCheckIn = () => {
    if (!todaySchedule) return
    if (attendance?.checkIn) {
      showToast(t('checkInLockedToast'), 'info')
      return
    }
    if (!checkInEval.allowed) {
      showToast(
        checkInEval.isLate
          ? t('checkInEndedToast')
          : checkInEval.isTooEarly
            ? t('checkInNotOpenToast')
            : checkInEval.reason || t('checkInNotOpenToast'),
        'warning',
      )
      return
    }
    setHasFormDraftChanges(false)
    setActiveModal('checkin')
  }

  // Handle opening Check-out modal
  const handleOpenCheckOut = () => {
    if (!todaySchedule) return
    if (attendance?.checkOut) {
      showToast(t('checkOutLockedToast'), 'info')
      return
    }
    if (!checkOutEval.allowed) {
      showToast(t('checkOutRequireCheckInToast'), 'warning')
      return
    }
    setHasFormDraftChanges(false)
    setActiveModal('checkout')
  }

  // Dismiss / close modal directly
  const handleCloseModal = () => {
    setActiveModal(null)
    setSelectedDutyForProof(null)
    setHasFormDraftChanges(false)
    setShowConfirmClose(false)
  }

  const handleConfirmDiscardClose = () => {
    setShowConfirmClose(false)
    setActiveModal(null)
    setSelectedDutyForProof(null)
    setHasFormDraftChanges(false)
  }

  // Submit Check-in
  const handleConfirmCheckIn = (payload: {
    photo: string
    watermark: AttendanceWatermark
    capturedTime: string
    capturedDate?: string
    explanation?: string
  }) => {
    if (!todaySchedule) return

    const [h, m] = payload.capturedTime.split(':').map(Number)
    const capturedMinutes = (h || 0) * 60 + (m || 0)
    const [startH, startM] = todaySchedule.shift.startTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const isLate = capturedMinutes > startMinutes || checkInEval.isLate
    const newStatus: 'on_time' | 'late' = isLate ? 'late' : 'on_time'

    const baseAttendance: AttendanceRecord = attendance || {
      id: 'att-today',
      workScheduleId: todaySchedule.id,
      workDate: payload.capturedDate || todaySchedule.workDate,
      boardingHouseName: todaySchedule.boardingHouseName,
      shiftName: todaySchedule.shift.name,
      shiftTime: `${todaySchedule.shift.startTime} - ${todaySchedule.shift.endTime}`,
      checkIn: null,
      checkOut: null,
      status: 'not_yet',
      totalHours: 0,
      editedByLandlord: false,
    }

    const updated: AttendanceRecord = {
      ...baseAttendance,
      workDate: payload.capturedDate || baseAttendance.workDate,
      checkIn: payload.capturedTime,
      status: newStatus,
      checkInPhoto: payload.photo,
      checkInWatermark: payload.watermark,
      checkInExplanation: payload.explanation,
      note: isLate
        ? t('noteCheckInLate', {
            time: payload.capturedTime,
            place: getLocalizedPlace(payload.watermark.place, locale === 'en'),
            explanation:
              getLocalizedExplanation(payload.explanation, locale === 'en') || t('noneExplanation'),
          })
        : t('noteCheckInOnTime', {
            time: payload.capturedTime,
            place: getLocalizedPlace(payload.watermark.place, locale === 'en'),
          }),
    }

    setAttendance(updated)
    saveAttendanceRecord(updated)

    setActiveModal(null)
    setHasFormDraftChanges(false)
    showToast(
      isLate
        ? t('toastCheckInLate', {
            time: payload.capturedTime,
            place: getLocalizedPlace(payload.watermark.place, locale === 'en'),
          })
        : t('toastCheckInOnTime', {
            time: payload.capturedTime,
            place: getLocalizedPlace(payload.watermark.place, locale === 'en'),
          }),
      isLate ? 'warning' : 'success',
    )

    // Sync to backend API
    staffAttendanceService
      .checkIn({
        workScheduleId: todaySchedule.id,
        photo: payload.photo,
        watermark: payload.watermark,
        explanation: payload.explanation,
        capturedTime: payload.capturedTime,
      })
      .then(res => {
        if (res?.attendance) {
          setAttendance(res.attendance)
          saveAttendanceRecord(res.attendance)
        }
        if (res?.schedule?.duties) {
          setDutyList(res.schedule.duties)
        }
        staffAttendanceService
          .getMonthlySummary()
          .then(sum => sum && setMonthlySummary(sum))
          .catch(() => {})
      })
      .catch(err => {
        console.warn('Backend check-in sync failed (local state active):', err)
      })
  }

  // Submit Check-out
  const handleConfirmCheckOut = (payload: {
    photo: string
    watermark: AttendanceWatermark
    capturedTime: string
    capturedDate?: string
    explanation?: string
  }) => {
    if (!todaySchedule) return

    const [h, m] = payload.capturedTime.split(':').map(Number)
    const capturedMinutes = (h || 0) * 60 + (m || 0)
    const [endH, endM] = todaySchedule.shift.endTime.split(':').map(Number)
    const endMinutes = endH * 60 + endM
    const isEarly = capturedMinutes < endMinutes || checkOutEval.isEarly

    const baseAttendance: AttendanceRecord = attendance || {
      id: 'att-today',
      workScheduleId: todaySchedule.id,
      workDate: todaySchedule.workDate,
      boardingHouseName: todaySchedule.boardingHouseName,
      shiftName: todaySchedule.shift.name,
      shiftTime: `${todaySchedule.shift.startTime} - ${todaySchedule.shift.endTime}`,
      checkIn: null,
      checkOut: null,
      status: 'not_yet',
      totalHours: 0,
      editedByLandlord: false,
    }

    const updated: AttendanceRecord = {
      ...baseAttendance,
      checkOut: payload.capturedTime,
      totalHours: isEarly ? 7.5 : 8,
      isEarlyCheckOut: isEarly,
      checkOutPhoto: payload.photo,
      checkOutWatermark: payload.watermark,
      checkOutExplanation: payload.explanation,
      note: isEarly
        ? t('noteCheckOutEarly', {
            time: payload.capturedTime,
            place: getLocalizedPlace(payload.watermark.place, locale === 'en'),
            explanation:
              getLocalizedExplanation(payload.explanation, locale === 'en') || t('noneExplanation'),
          })
        : t('noteCheckOutCompleted', {
            time: payload.capturedTime,
            place: getLocalizedPlace(payload.watermark.place, locale === 'en'),
          }),
    }

    setAttendance(updated)
    saveAttendanceRecord(updated)

    setActiveModal(null)
    setHasFormDraftChanges(false)
    showToast(
      isEarly
        ? t('toastCheckOutEarly', {
            time: payload.capturedTime,
            place: getLocalizedPlace(payload.watermark.place, locale === 'en'),
          })
        : t('toastCheckOutSuccess', {
            time: payload.capturedTime,
            place: getLocalizedPlace(payload.watermark.place, locale === 'en'),
          }),
      isEarly ? 'warning' : 'success',
    )

    // Sync to backend API
    staffAttendanceService
      .checkOut({
        workScheduleId: todaySchedule.id,
        photo: payload.photo,
        watermark: payload.watermark,
        explanation: payload.explanation,
        capturedTime: payload.capturedTime,
      })
      .then(res => {
        if (res?.attendance) {
          setAttendance(res.attendance)
          saveAttendanceRecord(res.attendance)
        }
        if (res?.schedule?.duties) {
          setDutyList(res.schedule.duties)
        }
        staffAttendanceService
          .getMonthlySummary()
          .then(sum => sum && setMonthlySummary(sum))
          .catch(() => {})
      })
      .catch(err => {
        console.warn('Backend check-out sync failed (local state active):', err)
      })
  }

  // Toggle duty task status
  const handleToggleDuty = (duty: DutyTaskItem) => {
    if (!todaySchedule) return

    // If task requires photo and doesn't have proof yet, require photo first
    if (duty.requiresPhoto && !duty.photoProof && !duty.completed) {
      setSelectedDutyForProof(duty)
      setActiveModal('duty_proof')
      showToast(t('toastDutyProofRequired'), 'warning')
      return
    }

    const updated = dutyList.map(item => {
      if (item.id === duty.id) {
        const nextCompleted = !item.completed
        return {
          ...item,
          completed: nextCompleted,
          completedAt: nextCompleted ? effectiveTimeString : undefined,
        }
      }
      return item
    })

    setDutyList(updated)
    try {
      localStorage.setItem('dormio_staff_today_duties', JSON.stringify(updated))
    } catch {
      // Fallback
    }

    // Backend sync
    staffAttendanceService
      .saveDutyProof({
        workScheduleId: todaySchedule.id,
        dutyId: duty.id,
        markCompleted: !duty.completed,
      })
      .catch(err => {
        console.warn('Backend task toggle sync warning:', err)
      })
  }

  // Save Duty Proof / Update Progress / Mark Completed
  const handleSaveDutyProof = (payload: {
    dutyId: string
    photo?: string
    note?: string
    proofTime?: string
    markCompleted?: boolean
  }) => {
    if (!todaySchedule) return
    const targetDuty = dutyList.find(d => d.id === payload.dutyId)
    if (!targetDuty) return

    if (
      payload.markCompleted &&
      targetDuty.requiresPhoto &&
      !payload.photo &&
      !targetDuty.photoProof
    ) {
      showToast(t('toastDutyProofRequired'), 'warning')
      return
    }

    const now = new Date()
    const actualProofTime =
      payload.proofTime ||
      `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} - ${now.toLocaleDateString('vi-VN')}`
    const nowTimeStr = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const updated = dutyList.map(item => {
      if (item.id === payload.dutyId) {
        const isCompleted = payload.markCompleted ?? item.completed
        return {
          ...item,
          photoProof: payload.photo || item.photoProof,
          photoProofTime: payload.photo ? actualProofTime : item.photoProofTime,
          note: payload.note !== undefined ? payload.note : item.note,
          completed: isCompleted,
          completedAt: isCompleted ? item.completedAt || nowTimeStr : undefined,
        }
      }
      return item
    })

    setDutyList(updated)
    try {
      localStorage.setItem('dormio_staff_today_duties', JSON.stringify(updated))
    } catch {
      // Fallback
    }

    setActiveModal(null)
    setSelectedDutyForProof(null)
    setHasFormDraftChanges(false)

    if (payload.markCompleted) {
      showToast(t('toastDutyCompleted'), 'success')
    } else {
      showToast(t('toastDutyProgressUpdated'), 'info')
    }

    // Sync to backend API
    staffAttendanceService
      .saveDutyProof({
        workScheduleId: todaySchedule.id,
        dutyId: payload.dutyId,
        photo: payload.photo,
        note: payload.note,
        markCompleted: payload.markCompleted,
      })
      .then(res => {
        if (res?.schedule?.duties) {
          setDutyList(res.schedule.duties)
        }
      })
      .catch(err => {
        console.warn('Backend duty proof sync warning:', err)
      })
  }

  const currentStaffName = staffName || user?.name || t('defaultStaffName')
  const completedCount = dutyList.filter(d => d.completed).length

  if (isLoading || !isMounted) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-pulse">
        {/* Banner Skeleton */}
        <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1">
            <div className="h-5 w-24 bg-line rounded-full" />
            <div className="h-8 w-64 bg-line rounded-xl" />
            <div className="h-4 w-48 bg-card-hover rounded-md" />
          </div>
          <div className="h-14 w-48 bg-line rounded-2xl shrink-0" />
        </div>

        {/* 2-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-3xl border border-line shadow-2xs p-6 sm:p-7 space-y-6">
              <div className="flex justify-between items-center pb-5 border-b border-line">
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-line rounded-md" />
                  <div className="h-7 w-52 bg-line rounded-lg" />
                </div>
                <div className="h-8 w-32 bg-line rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="h-20 bg-card-hover rounded-2xl" />
                <div className="h-20 bg-card-hover rounded-2xl" />
                <div className="h-20 bg-card-hover rounded-2xl" />
              </div>
              <div className="h-48 bg-card-hover rounded-2xl" />
              <div className="space-y-3 pt-2">
                <div className="h-5 w-36 bg-line rounded-md" />
                <div className="h-16 bg-surface rounded-2xl border border-line" />
                <div className="h-16 bg-surface rounded-2xl border border-line" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-6 space-y-4">
              <div className="h-5 w-32 bg-line rounded-md" />
              <div className="h-16 bg-card-hover rounded-2xl" />
              <div className="h-16 bg-card-hover rounded-2xl" />
            </div>
            <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-6 space-y-4">
              <div className="h-5 w-40 bg-line rounded-md" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-card-hover rounded-2xl" />
                <div className="h-20 bg-card-hover rounded-2xl" />
                <div className="h-20 bg-card-hover rounded-2xl" />
                <div className="h-20 bg-card-hover rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white ${
              toast.type === 'success'
                ? 'bg-primary'
                : toast.type === 'warning'
                  ? 'bg-warning'
                  : 'bg-zinc-800'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* TOP BANNER: GREETING & CLOCK */}
      <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <Chip variant="primary" size="sm" preventHover className="tracking-wider uppercase font-black">
              {t('badge')}
            </Chip>
          </div>
          <Text as="h1" size={{ base: '2xl', sm: '3xl' }} weight="black" className="tracking-tight">
            {t('greeting', { name: currentStaffName })}
          </Text>
          <Text size={{ base: 'xs', sm: 'sm' }} color="secondary" weight="medium">
            {t('greetingSubtitle', { date: todayFormattedDate })}
          </Text>
        </div>

        {/* Live Digital Clock Widget */}
        <div className="flex flex-col items-start md:items-end z-10 shrink-0">
          <div className="bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-md border border-zinc-800 flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-emerald-400">
                {effectiveTimeString}
              </div>
              <Text size="3xs" weight="bold" color="secondary" uppercase align="right" className="tracking-widest">
                {t('realSystemTime')}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN SECTION: 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN LEFT (2 SPAN): TODAY'S SHIFT CARD & SMART TIMEKEEPING BUTTONS OR EMPTY STATE */}
        {!todaySchedule ? (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-3xl border border-line shadow-2xs p-8 sm:p-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                <Calendar className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <Text as="h2" size={{ base: 'xl', sm: '2xl' }} weight="black">
                  {t('noShiftTitle')}
                </Text>
                <Text size={{ base: 'xs', sm: 'sm' }} color="secondary" className="leading-relaxed">
                  {fetchError
                    ? fetchError === 'ERR_FETCH_FAILED'
                      ? t('errFailedLoad')
                      : fetchError
                    : t('noShiftDesc')}
                </Text>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => {
                    fetchOverview()
                    fetchMonthlySummary()
                  }}
                  leftIcon={<RefreshCw />}
                >
                  {t('btnRefreshData')}
                </Button>

                <Link
                  href="/staff/schedule"
                  className="py-2.5 px-4 rounded-xl bg-primary hover:bg-[#25ad87] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm shadow-primary/20"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('btnViewShiftSchedule')}</span>
                </Link>

                <Link
                  href="/staff/shift-history"
                  className="py-2.5 px-4 rounded-xl border border-line hover:bg-card-hover text-foreground/90 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{t('btnShiftHistory')}</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 space-y-6">
            {/* TODAY'S SHIFT HERO CARD */}
            <div className="bg-card rounded-3xl border border-line shadow-2xs p-6 sm:p-7 space-y-6">
              {/* Header of Shift Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-line">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                    <Text as="span" size="xs" weight="black" color="brand" uppercase className="tracking-wider">
                      {t('todayShiftTitle')}
                    </Text>
                  </div>
                  <Text as="h2" size={{ base: 'xl', sm: '2xl' }} weight="black">
                    {getShiftName(todaySchedule.shift)} ({todaySchedule.shift.startTime} -{' '}
                    {todaySchedule.shift.endTime})
                  </Text>
                </div>

                {/* Status Badge */}
                <div>
                  {attendance?.checkOut ? (
                    <Chip
                      variant="success"
                      size="md"
                      preventHover
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      className="font-black"
                    >
                      {t('badgeShiftCompleted')}
                    </Chip>
                  ) : attendance?.checkIn ? (
                    <Chip
                      variant="primary"
                      size="md"
                      preventHover
                      leftIcon={<Clock className="w-4 h-4 animate-spin" />}
                      className="font-black"
                    >
                      {t('badgeOnDuty')}
                    </Chip>
                  ) : (
                    <Chip
                      variant="warning"
                      size="md"
                      preventHover
                      leftIcon={<AlertCircle className="w-4 h-4" />}
                      className="font-black"
                    >
                      {t('badgeNotCheckedIn')}
                    </Chip>
                  )}
                </div>
              </div>

              {/* Shift Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-surface border border-line space-y-1">
                  <Text as="span" size="2xs" weight="bold" color="secondary" uppercase className="block">
                    {t('shiftLocationLabel')}
                  </Text>
                  <div className="flex items-center gap-2 font-black text-foreground text-xs sm:text-sm">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="truncate">{todaySchedule.boardingHouseName}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-line space-y-1">
                  <Text as="span" size="2xs" weight="bold" color="secondary" uppercase className="block">
                    {t('assignedRoleLabel')}
                  </Text>
                  <div className="flex items-center gap-2 font-black text-foreground text-xs sm:text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="truncate">{getPositionName(todaySchedule.position)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-line space-y-1">
                  <Text as="span" size="2xs" weight="bold" color="secondary" uppercase className="block">
                    {t('shiftDurationLabel')}
                  </Text>
                  <div className="flex items-center gap-2 font-black text-foreground text-xs sm:text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>
                      {t('shiftDurationHours', { hours: todaySchedule.shift.durationHours })}
                    </span>
                  </div>
                </div>
              </div>

              {/* TIMEKEEPING ACTION CONTAINER */}
              <div className="p-5 sm:p-6 rounded-2xl bg-linear-to-br from-zinc-50 to-zinc-100/80 border border-line space-y-4">
                <div className="flex items-center justify-between">
                  <Text as="h3" size="xs" weight="black" uppercase className="tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-primary" />
                    <span>{t('attendanceTitle')}</span>
                  </Text>
                  <Text as="span" size="2xs" weight="semibold" color="secondary">
                    {t('attendanceSubtitle')}
                  </Text>
                </div>

                {/* Status details line */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Check In info */}
                  <div className="p-3.5 rounded-xl bg-card border border-line flex flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text as="span" size="3xs" weight="bold" color="secondary" className="block">
                          {t('checkInTime')}
                        </Text>
                        <span className="font-black text-foreground text-sm">
                          {attendance?.checkIn ? `${attendance.checkIn}` : '--:--:--'}
                        </span>
                      </div>
                      <div>
                        {attendance?.checkIn ? (
                          <Chip
                            variant={attendance.status === 'late' ? 'warning' : 'success'}
                            size="xs"
                            preventHover
                            className="font-black"
                          >
                            {attendance.status === 'late' ? t('statusLate') : t('statusOnTime')}
                          </Chip>
                        ) : (
                          <Text as="span" size="3xs" color="secondary" weight="bold">
                            {t('windowCheckIn')}
                          </Text>
                        )}
                      </div>
                    </div>

                    {/* Photo & Watermark pill if checked in */}
                    {attendance?.checkIn && attendance?.checkInPhoto && (
                      <div className="pt-2 border-t border-line flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={attendance.checkInPhoto}
                            alt="Check-in proof"
                            className="w-8 h-8 rounded-lg object-cover border border-line cursor-pointer hover:opacity-80"
                            onClick={() =>
                              setPreviewImageModal({
                                isOpen: true,
                                title: t('checkInPhotoTitle'),
                                imageUrl: attendance.checkInPhoto!,
                                watermark: attendance.checkInWatermark
                                  ? {
                                      ...attendance.checkInWatermark,
                                      place: getLocalizedPlace(
                                        attendance.checkInWatermark.place,
                                        locale === 'en',
                                      ),
                                      staffName: getLocalizedStaffName(
                                        attendance.checkInWatermark.staffName,
                                        locale === 'en',
                                      ),
                                    }
                                  : undefined,
                                note: getLocalizedExplanation(
                                  attendance.checkInExplanation,
                                  locale === 'en',
                                ),
                              })
                            }
                          />
                          <div className="text-[10px] text-muted font-medium">
                            <span
                              className="text-foreground font-bold block truncate max-w-[150px]"
                              title={getLocalizedPlace(
                                attendance.checkInWatermark?.place ||
                                  todaySchedule.boardingHouseName,
                                locale === 'en',
                              )}
                            >
                              📍{' '}
                              {getLocalizedPlace(
                                attendance.checkInWatermark?.place ||
                                  todaySchedule.boardingHouseName,
                                locale === 'en',
                              )}
                            </span>
                            <span className="text-muted block truncate max-w-[150px]">
                              🕒 {attendance.checkInWatermark?.time || t('timePlaceStamped')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setPreviewImageModal({
                              isOpen: true,
                              title: t('checkInPhotoTitle'),
                              imageUrl: attendance.checkInPhoto!,
                              watermark: attendance.checkInWatermark
                                ? {
                                    ...attendance.checkInWatermark,
                                    place: getLocalizedPlace(
                                      attendance.checkInWatermark.place,
                                      locale === 'en',
                                    ),
                                    staffName: getLocalizedStaffName(
                                      attendance.checkInWatermark.staffName,
                                      locale === 'en',
                                    ),
                                  }
                                : undefined,
                              note: getLocalizedExplanation(
                                attendance.checkInExplanation,
                                locale === 'en',
                              ),
                            })
                          }
                          leftIcon={<Eye />}
                          className="hover:underline"
                        >
                          {t('viewPhoto')}
                        </Button>
                      </div>
                    )}

                    {/* Explanation snippet if present */}
                    {attendance?.checkInExplanation && (
                      <div className="p-2 rounded-lg bg-warning-soft border border-warning-subtle text-[11px] text-warning">
                        <span className="font-bold block">
                          {attendance.status === 'late'
                            ? t('explanationLate')
                            : t('explanationCheckIn')}
                        </span>
                        <Text size="xs" italic className="text-foreground/90 truncate">
                          &quot;
                          {getLocalizedExplanation(attendance.checkInExplanation, locale === 'en')}
                          &quot;
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Check Out info */}
                  <div className="p-3.5 rounded-xl bg-card border border-line flex flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text as="span" size="3xs" weight="bold" color="secondary" className="block">
                          {t('checkOutTime')}
                        </Text>
                        <span className="font-black text-foreground text-sm">
                          {attendance?.checkOut ? `${attendance.checkOut}` : '--:--:--'}
                        </span>
                      </div>
                      <div>
                        {attendance?.checkOut ? (
                          <Chip
                            variant={attendance.isEarlyCheckOut ? 'warning' : 'success'}
                            size="xs"
                            preventHover
                            className="font-black"
                          >
                            {attendance.isEarlyCheckOut ? t('statusEarly') : t('statusCompleted')}
                          </Chip>
                        ) : (
                          <Text as="span" size="3xs" color="secondary" weight="bold">
                            {t('windowCheckOut')}
                          </Text>
                        )}
                      </div>
                    </div>

                    {/* Photo & Watermark pill if checked out */}
                    {attendance?.checkOut && attendance?.checkOutPhoto && (
                      <div className="pt-2 border-t border-line flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={attendance.checkOutPhoto}
                            alt="Check-out proof"
                            className="w-8 h-8 rounded-lg object-cover border border-line cursor-pointer hover:opacity-80"
                            onClick={() =>
                              setPreviewImageModal({
                                isOpen: true,
                                title: t('checkOutPhotoTitle'),
                                imageUrl: attendance.checkOutPhoto!,
                                watermark: attendance.checkOutWatermark
                                  ? {
                                      ...attendance.checkOutWatermark,
                                      place: getLocalizedPlace(
                                        attendance.checkOutWatermark.place,
                                        locale === 'en',
                                      ),
                                      staffName: getLocalizedStaffName(
                                        attendance.checkOutWatermark.staffName,
                                        locale === 'en',
                                      ),
                                    }
                                  : undefined,
                                note: getLocalizedExplanation(
                                  attendance.checkOutExplanation,
                                  locale === 'en',
                                ),
                              })
                            }
                          />
                          <div className="text-[10px] text-muted font-medium">
                            <span
                              className="text-foreground font-bold block truncate max-w-[150px]"
                              title={getLocalizedPlace(
                                attendance.checkOutWatermark?.place ||
                                  todaySchedule.boardingHouseName,
                                locale === 'en',
                              )}
                            >
                              📍{' '}
                              {getLocalizedPlace(
                                attendance.checkOutWatermark?.place ||
                                  todaySchedule.boardingHouseName,
                                locale === 'en',
                              )}
                            </span>
                            <span className="text-muted block truncate max-w-[150px]">
                              🕒 {attendance.checkOutWatermark?.time || t('timePlaceStamped')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setPreviewImageModal({
                              isOpen: true,
                              title: t('checkOutPhotoTitle'),
                              imageUrl: attendance.checkOutPhoto!,
                              watermark: attendance.checkOutWatermark
                                ? {
                                    ...attendance.checkOutWatermark,
                                    place: getLocalizedPlace(
                                      attendance.checkOutWatermark.place,
                                      locale === 'en',
                                    ),
                                    staffName: getLocalizedStaffName(
                                      attendance.checkOutWatermark.staffName,
                                      locale === 'en',
                                    ),
                                  }
                                : undefined,
                              note: getLocalizedExplanation(
                                attendance.checkOutExplanation,
                                locale === 'en',
                              ),
                            })
                          }
                          leftIcon={<Eye />}
                          className="hover:underline"
                        >
                          {t('viewPhoto')}
                        </Button>
                      </div>
                    )}

                    {/* Explanation snippet if early check-out */}
                    {attendance?.checkOutExplanation && (
                      <div className="p-2 rounded-lg bg-warning-soft border border-warning-subtle text-[11px] text-warning">
                        <span className="font-bold block">{t('explanationEarly')}</span>
                        <Text size="xs" italic className="text-foreground/90 truncate">
                          &quot;
                          {getLocalizedExplanation(attendance.checkOutExplanation, locale === 'en')}
                          &quot;
                        </Text>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Check In Button */}
                  {attendance?.checkIn ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPreviewImageModal({
                          isOpen: true,
                          title: t('checkInPhotoLockedTitle'),
                          imageUrl: attendance.checkInPhoto || '',
                          watermark: attendance.checkInWatermark
                            ? {
                                ...attendance.checkInWatermark,
                                place: getLocalizedPlace(
                                  attendance.checkInWatermark.place,
                                  locale === 'en',
                                ),
                                staffName: getLocalizedStaffName(
                                  attendance.checkInWatermark.staffName,
                                  locale === 'en',
                                ),
                              }
                            : undefined,
                          note: getLocalizedExplanation(
                            attendance.checkInExplanation,
                            locale === 'en',
                          ),
                        })
                      }
                      leftIcon={<CheckCircle2 />}
                      className="sm:text-sm"
                    >
                      {t('btnCheckInLocked')}
                    </Button>
                  ) : (
                    <Button
                      disabled={!checkInEval.allowed}
                      onClick={handleOpenCheckIn}
                      leftIcon={<Camera />}
                    >
                      {checkInEval.isLate ? t('btnCheckInLate') : t('btnCheckInOnTime')}
                    </Button>
                  )}

                  {/* Check Out Button */}
                  {attendance?.checkOut ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPreviewImageModal({
                          isOpen: true,
                          title: t('checkOutPhotoLockedTitle'),
                          imageUrl: attendance.checkOutPhoto || '',
                          watermark: attendance.checkOutWatermark
                            ? {
                                ...attendance.checkOutWatermark,
                                place: getLocalizedPlace(
                                  attendance.checkOutWatermark.place,
                                  locale === 'en',
                                ),
                                staffName: getLocalizedStaffName(
                                  attendance.checkOutWatermark.staffName,
                                  locale === 'en',
                                ),
                              }
                            : undefined,
                          note: getLocalizedExplanation(
                            attendance.checkOutExplanation,
                            locale === 'en',
                          ),
                        })
                      }
                      leftIcon={<CheckCircle2 />}
                      className="sm:text-sm"
                    >
                      {t('btnCheckOutLocked')}
                    </Button>
                  ) : (
                    <Button
                      disabled={!checkOutEval.allowed}
                      onClick={handleOpenCheckOut}
                      leftIcon={<LogOut />}
                    >
                      {checkOutEval.isEarly ? t('btnCheckOutEarly') : t('btnCheckOutNormal')}
                    </Button>
                  )}
                </div>

                {/* Explanatory Notice */}
                <div className="p-3 rounded-xl bg-card border border-line text-[11px] text-muted space-y-1">
                  <div className="font-bold text-foreground/90 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>{t('rulesTitle')}</span>
                  </div>
                  <Text size="2xs" color="secondary" className="leading-relaxed">{t('rule1')}</Text>
                  <Text size="2xs" color="secondary" className="leading-relaxed">{t('rule2')}</Text>
                </div>
              </div>

              {/* CHECKLIST (NHIỆM VỤ CA LÀM • DUTY LIST ) */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-foreground text-xs font-black uppercase tracking-wider">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span>{t('checklistTitle')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <Chip variant="primary" size="sm" preventHover className="font-bold">
                      {t('checklistProgress', {
                        completed: completedCount,
                        total: dutyList.length,
                      })}
                    </Chip>
                    <Link
                      href="/staff/schedule"
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>{t('viewInSchedule')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Additional Tasks / Landlord Reminders Due Today Banner */}
                {todayAdditionalTasks.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-warning-soft border border-warning-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span className="text-xs font-bold text-warning">
                        {t('todayAdditionalNotice', { count: todayAdditionalTasks.length })}
                      </span>
                    </div>
                    <Link
                      href="/staff/schedule"
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-warning text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-2xs cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {t('btnViewTodayAdditional', { count: todayAdditionalTasks.length })}
                      </span>
                    </Link>
                  </div>
                )}

                {dutyList.length > 0 ? (
                  <div className="space-y-3">
                    {dutyList.map(duty => (
                      <div
                        key={duty.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          duty.completed
                            ? 'bg-success-soft border-success-subtle text-foreground'
                            : 'bg-card border-line text-foreground hover:border-primary/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* Left: Checkbox + Title + Proof Tag */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Checkbox
                              checked={duty.completed}
                              onChange={() => handleToggleDuty(duty)}
                              className="mt-1 shrink-0"
                            />
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-xs font-bold leading-snug ${duty.completed ? 'line-through text-muted' : 'text-foreground'}`}
                                >
                                  {getDutyTitle(duty, locale === 'en')}
                                </span>

                                {/* Requirement Tag */}
                                {duty.requiresPhoto ? (
                                  <Chip
                                    variant="warning"
                                    size="xs"
                                    preventHover
                                    leftIcon={<Camera className="w-3 h-3 text-warning" />}
                                    className="font-black shrink-0"
                                  >
                                    {t('requiresPhoto')}
                                  </Chip>
                                ) : (
                                  <Chip
                                    variant="secondary"
                                    size="xs"
                                    preventHover
                                    className="font-semibold shrink-0"
                                  >
                                    {t('photoOptional')}
                                  </Chip>
                                )}
                              </div>

                              {duty.note && (
                                <Text size="2xs" color="secondary" italic weight="medium">
                                  {t('notePrefix', {
                                    note: getDutyNote(duty.note, locale === 'en'),
                                  })}
                                </Text>
                              )}

                              {duty.completedAt && (
                                <Text size="3xs" color="success" weight="bold" className="flex items-center gap-1">
                                  <Check className="w-3 h-3" />{' '}
                                  {t('completedAtPrefix', { time: duty.completedAt })}
                                </Text>
                              )}
                            </div>
                          </div>

                          {/* Right: Photo proof thumbnail + Update details action button */}
                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pl-7 sm:pl-0">
                            {duty.photoProof && (
                              <div
                                onClick={() =>
                                  setPreviewImageModal({
                                    isOpen: true,
                                    title: `${t('dutyProofTitle')}: ${getDutyTitle(duty, locale === 'en')}`,
                                    imageUrl: duty.photoProof!,
                                    watermark: {
                                      time:
                                        duty.photoProofTime ||
                                        (duty.completedAt
                                          ? `${duty.completedAt} - ${todayStr}`
                                          : effectiveTimeString),
                                      place: getLocalizedPlace(
                                        todaySchedule.boardingHouseName || t('assignedBuilding'),
                                        locale === 'en',
                                      ),
                                      staffName: getLocalizedStaffName(
                                        currentStaffName,
                                        locale === 'en',
                                      ),
                                    },
                                    note: getDutyNote(duty.note, locale === 'en'),
                                  })
                                }
                                className="relative group cursor-pointer"
                                title={t('clickToEnlargeProof')}
                              >
                                <img
                                  src={duty.photoProof}
                                  alt="Proof thumbnail"
                                  className="w-10 h-10 rounded-xl object-cover border border-line shadow-2xs group-hover:opacity-80 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            )}

                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedDutyForProof(duty)
                                setActiveModal('duty_proof')
                              }}
                              leftIcon={<FileText />}
                              className="shrink-0"
                            >
                              {t('btnUpdateDetails')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-surface border border-dashed border-line text-center space-y-1">
                    <CheckSquare className="w-5 h-5 text-muted mx-auto" />
                    <Text size="xs" weight="bold" color="secondary">{t('noDutiesTitle')}</Text>
                    <Text size="2xs" color="secondary">{t('noDutiesDesc')}</Text>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COLUMN RIGHT (1 SPAN): CO-WORKERS ON SHIFT & QUICK METRICS */}
        <div className="space-y-6">
          {/* CO-WORKERS ON THE SAME SHIFT */}
          <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 text-foreground text-xs font-black uppercase tracking-wider">
                <Users className="w-4 h-4 text-primary" />
                <span>{t('coworkersTitle')}</span>
              </div>
              {todaySchedule && (
                <Chip variant="primary" size="xs" preventHover className="font-black">
                  {t('coworkersCount', { count: todaySchedule.coWorkers.length })}
                </Chip>
              )}
            </div>

            {todaySchedule && todaySchedule.coWorkers.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.coWorkers.map(cw => (
                  <div
                    key={cw.id}
                    className="p-3 rounded-2xl bg-surface border border-line flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          cw.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(cw.name)}&background=2AC1BC&color=fff`
                        }
                        alt={cw.name}
                        className="w-10 h-10 rounded-full object-cover border border-line shrink-0"
                      />
                      <div className="min-w-0">
                        <Text as="h4" size="xs" weight="black" className="truncate">{cw.name}</Text>
                        <Text size="2xs" weight="semibold" color="secondary" className="truncate">
                          {getPositionName(cw.positionName)}
                        </Text>
                      </div>
                    </div>
                    {cw.phone ? (
                      <a
                        href={`tel:${cw.phone}`}
                        title={t('callCoworker', { name: cw.name })}
                        className="p-2 rounded-xl bg-card border border-line text-primary hover:bg-primary/10 transition-colors shrink-0 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted text-xs font-medium space-y-1">
                <Users className="w-6 h-6 text-zinc-300 mx-auto" />
                <Text size="xs" weight="medium" color="secondary">{todaySchedule ? t('onlyStaffAssigned') : t('noScheduledShifts')}</Text>
                <Text size="2xs" color="secondary">
                  {todaySchedule ? t('coworkerNote') : t('coWorkersEmptyDesc')}
                </Text>
              </div>
            )}

            {todaySchedule && todaySchedule.coWorkers.length > 0 && (
              <div className="pt-2 text-[11px] text-muted leading-tight">
                {t('coworkerNote')}
              </div>
            )}
          </div>

          {/* MONTHLY SUMMARY METRICS WIDGET */}
          <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-6 space-y-4">
            <Text as="h3" size="xs" weight="black" uppercase className="tracking-wider">
              {monthlySummaryTitle}
            </Text>

            {monthlySummary && monthlySummary.totalShifts > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-surface border border-line space-y-0.5">
                  <Text as="span" size="3xs" weight="bold" color="secondary" uppercase className="block">
                    {t('metricTotalShifts')}
                  </Text>
                  <Text size="xl" weight="black">
                    {t('shiftsUnit', { count: monthlySummary.totalShifts })}
                  </Text>
                  <Text as="span" size="3xs" color="success" weight="bold">
                    {t('totalHoursUnit', { hours: monthlySummary.totalHours })}
                  </Text>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-line space-y-0.5">
                  <Text as="span" size="3xs" weight="bold" color="secondary" uppercase className="block">
                    {t('onTimeLabel')}
                  </Text>
                  <Text size="xl" weight="black" color="brand">
                    {monthlySummary.onTimeRate}%
                  </Text>
                  <Text as="span" size="3xs" color="secondary" weight="bold">
                    {t('onTimeStandard', {
                      count: `${monthlySummary.onTimeCount}/${monthlySummary.totalShifts}`,
                    })}
                  </Text>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-line space-y-0.5">
                  <Text as="span" size="3xs" weight="bold" color="secondary" uppercase className="block">
                    {t('lateLabel')}
                  </Text>
                  <Text size="xl" weight="black" color="warning">
                    {t('shiftsUnit', { count: monthlySummary.lateCount })}
                  </Text>
                  <Text as="span" size="3xs" color="secondary" weight="medium">
                    {t('lateHasExplanation')}
                  </Text>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-line space-y-0.5">
                  <Text as="span" size="3xs" weight="bold" color="secondary" uppercase className="block">
                    {t('earlyLabel')}
                  </Text>
                  <Text size="xl" weight="black" color="warning">
                    {t('shiftsUnit', { count: monthlySummary.earlyCount })}
                  </Text>
                  <Text as="span" size="3xs" color="secondary" weight="medium">
                    {t('earlyApproved')}
                  </Text>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-surface border border-dashed border-line text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-full bg-card border border-line flex items-center justify-center text-muted">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <Text size="xs" weight="bold">
                  {t('noMonthlyAttendanceTitle')}
                </Text>
                <Text size="2xs" color="secondary" className="leading-relaxed">
                  {t('noMonthlyAttendanceDesc')}
                </Text>
              </div>
            )}

            <Link
              href="/staff/shift-history"
              className="w-full py-2.5 px-4 rounded-xl border border-line hover:bg-card-hover text-foreground/90 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>{t('viewAttendanceHistory')}</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CHECK-IN / CHECK-OUT WITH CAMERA WATERMARK & EXPLANATION SECTION */}
      {/* ========================================================================= */}
      {activeModal &&
        (activeModal === 'checkin' || activeModal === 'checkout') &&
        todaySchedule && (
          <CheckInOutCameraModal
            mode={activeModal}
            isLate={activeModal === 'checkin' ? checkInEval.isLate : false}
            isEarly={activeModal === 'checkout' ? checkOutEval.isEarly : false}
            shiftName={todaySchedule.shift.name}
            shiftStartTime={todaySchedule.shift.startTime}
            shiftEndTime={todaySchedule.shift.endTime}
            effectiveTime={effectiveTimeString}
            boardingHouseName={todaySchedule.boardingHouseName}
            staffName={currentStaffName}
            onClose={handleCloseModal}
            onSubmit={data => {
              if (activeModal === 'checkin') {
                handleConfirmCheckIn(data)
              } else {
                handleConfirmCheckOut(data)
              }
            }}
            onChangeDraft={() => setHasFormDraftChanges(true)}
          />
        )}

      {/* ========================================================================= */}
      {/* MODAL 2: DUTY TASK PHOTO PROOF UPLOAD (LANDLORD REQUIRED AUDIT) */}
      {/* ========================================================================= */}
      {activeModal === 'duty_proof' && selectedDutyForProof && todaySchedule && (
        <DutyProofModal
          duty={selectedDutyForProof}
          boardingHouseName={todaySchedule.boardingHouseName}
          effectiveTime={effectiveTimeString}
          staffName={currentStaffName}
          onClose={handleCloseModal}
          onSubmit={payload => handleSaveDutyProof(payload)}
          onChangeDraft={() => setHasFormDraftChanges(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FULL SCREEN IMAGE VIEWER WITH WATERMARK AUDIT STAMP */}
      {/* ========================================================================= */}
      {previewImageModal && (
        <Modal
          isOpen={previewImageModal.isOpen}
          onClose={() => setPreviewImageModal(null)}
          size="xl"
          className="bg-zinc-900 text-white border-zinc-800"
        >
          <Modal.Header
            title={previewImageModal.title}
            icon={<ShieldCheck className="w-5 h-5 text-primary" />}
            onClose={() => setPreviewImageModal(null)}
            className="border-b border-zinc-800 text-zinc-100"
          />
          <Modal.Body className="p-0 overflow-hidden">
            {/* Read-only audit banner */}
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <Text as="span" size="xs" weight="bold" color="warning">{t('auditLockedBanner')}</Text>
              </span>
              <Text as="span" size="3xs" color="secondary" mono className="tracking-wider">
                {t('auditVerified')}
              </Text>
            </div>

            {/* Lightbox Image with Watermark Overlay */}
            <div className="relative bg-black flex items-center justify-center max-h-[460px] overflow-hidden">
              <img
                src={previewImageModal.imageUrl}
                alt="Enlarged Proof"
                className="w-full h-auto max-h-[460px] object-contain"
              />

              {/* Stamped Watermark HUD on the Photo */}
              {previewImageModal.watermark && (
                <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-white text-xs space-y-1 shadow-lg pointer-events-none">
                  <div className="flex items-center justify-between font-black text-primary text-[11px] uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {previewImageModal.watermark.time}
                    </span>
                    <Chip variant="success" size="xs" preventHover className="border border-emerald-500/30">
                      {t('validLocation')}
                    </Chip>
                  </div>
                  <div className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>
                      {getLocalizedPlace(previewImageModal.watermark.place, locale === 'en')}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-300 flex items-center justify-between pt-0.5 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-muted" />{' '}
                      {getLocalizedStaffName(
                        previewImageModal.watermark.staffName,
                        locale === 'en',
                      )}
                    </span>
                    <span className="font-mono text-muted">
                      {previewImageModal.watermark.coordinates || t('gpsRecorded')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Note / Explanation section if present */}
            {previewImageModal.note && (
              <div className="p-4 bg-zinc-800/80 border-t border-zinc-700/60 text-xs space-y-1">
                <Text as="span" size="xs" weight="bold" className="text-zinc-300 block">{t('explanationNoteTitle')}</Text>
                <Text size="xs" italic className="text-zinc-300">
                  &quot;{getLocalizedExplanation(previewImageModal.note, locale === 'en')}&quot;
                </Text>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-end">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setPreviewImageModal(null)}
            >
              {t('btnClose')}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* RULE #10 POP-UP CONFIRMATION MODAL ("Xác nhận đóng form") */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        size="sm"
      >
        <Modal.Body className="p-6 space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-warning-soft border border-warning-subtle text-warning flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <Text as="h3" size="base" weight="black">
              {t('confirmCloseTitle')}
            </Text>
            <Text size="xs" color="secondary" className="leading-relaxed">
              {t('confirmCloseDesc')}
            </Text>
          </div>
        </Modal.Body>
        <Modal.Footer className="grid grid-cols-2 gap-2.5 p-6 pt-0 border-t-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowConfirmClose(false)}
          >
            {t('btnContinueEditing')}
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleConfirmDiscardClose}
          >
            {t('btnDiscardAndClose')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

// =======================================================================================
// HELPER: ISOLATED LIVE CLOCK BADGE (PREVENTS FULL MODAL RE-RENDERING & SCREEN JITTER)
// =======================================================================================
function LiveClockBadge() {
  const { locale } = useLanguage()
  const [clockStr, setClockStr] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const d = String(now.getDate()).padStart(2, '0')
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const y = now.getFullYear()
      const h = String(now.getHours()).padStart(2, '0')
      const min = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      if (locale === 'en') {
        setClockStr(`${m}/${d}/${y} ${h}:${min}:${s}`)
      } else {
        setClockStr(`${d}/${m}/${y} ${h}:${min}:${s}`)
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [locale])

  return (
    <Chip
      variant="primary"
      size="xs"
      preventHover
      leftIcon={<Clock className="w-3.5 h-3.5 text-primary" />}
      className="font-mono font-bold tabular-nums shrink-0"
    >
      {clockStr || '--/--/---- --:--:--'}
    </Chip>
  )
}

// =======================================================================================
// HELPER: REAL-WORLD REVERSE GEOCODING (STRICTLY ACTUAL ADDRESS, NO BOARDING HOUSE SUFFIX)
// =======================================================================================
async function resolveRealGpsAddress(
  lat: number,
  lng: number,
  isEn = false,
): Promise<{ address: string; coordinates: string }> {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
  const coords = `${latStr}, ${lngStr}`

  // 1. Nominatim OpenStreetMap (Standard Street & Administrative Address)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${isEn ? 'en' : 'vi'}`,
      { signal: AbortSignal.timeout(3500) },
    )
    if (res.ok) {
      const data = await res.json()
      if (data && data.address) {
        const addr = data.address
        const street = addr.road || addr.street || addr.pedestrian || addr.suburb
        const ward = addr.suburb || addr.quarter || addr.neighbourhood || addr.village
        const district = addr.city_district || addr.district || addr.county
        const city = addr.city || addr.state || addr.province

        const parts = [street, ward, district, city].filter(Boolean)
        const unique = parts.filter((item, idx) => parts.indexOf(item) === idx)
        if (unique.length >= 2) {
          return { address: getLocalizedPlace(unique.join(', '), isEn), coordinates: coords }
        }
      }
      if (data && data.display_name) {
        return {
          address: getLocalizedPlace(
            data.display_name.split(',').slice(0, 4).join(',').trim(),
            isEn,
          ),
          coordinates: coords,
        }
      }
    }
  } catch {
    // Fallback to secondary provider
  }

  // 2. BigDataCloud Reverse Geocoding Client API
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${isEn ? 'en' : 'vi'}`,
      { signal: AbortSignal.timeout(3500) },
    )
    if (res.ok) {
      const data = await res.json()
      const parts = [
        data.locality || data.localityInfo?.administrative?.[3]?.name,
        data.city || data.principalSubdivisionCode || data.localityInfo?.administrative?.[2]?.name,
        data.principalSubdivision || data.countryName,
      ].filter(Boolean)
      if (parts.length > 0) {
        return { address: getLocalizedPlace(parts.join(', '), isEn), coordinates: coords }
      }
    }
  } catch {
    // Offline / timeout fallback
  }

  // 3. Fallback: Pure GPS Coordinates (No boarding house name added)
  return {
    address: isEn ? `GPS Coordinates: ${coords}` : `Tọa độ GPS: ${coords}`,
    coordinates: coords,
  }
}

// =======================================================================================
// SUB-COMPONENT: CHECK-IN / CHECK-OUT REAL DEVICE CAMERA MODAL (NO UPLOAD ALLOWED)
// =======================================================================================
interface CheckInOutCameraModalProps {
  mode: 'checkin' | 'checkout'
  isLate: boolean
  isEarly: boolean
  shiftName: string
  shiftStartTime?: string
  shiftEndTime?: string
  effectiveTime: string
  boardingHouseName: string
  staffName?: string
  onClose: () => void
  onSubmit: (data: {
    photo: string
    watermark: AttendanceWatermark
    capturedTime: string
    capturedDate?: string
    explanation?: string
  }) => void
  onChangeDraft: () => void
}

function CheckInOutCameraModal({
  mode,
  isLate,
  isEarly,
  shiftName,
  shiftStartTime,
  shiftEndTime,
  effectiveTime,
  boardingHouseName,
  staffName,
  onClose,
  onSubmit,
  onChangeDraft,
}: CheckInOutCameraModalProps) {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()
  const isEn = locale === 'en'

  const isRequireExplanation = isLate || isEarly

  // Real Camera Hardware Refs & States
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fallbackFileInputRef = useRef<HTMLInputElement>(null)

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [cameraStatus, setCameraStatus] = useState<'starting' | 'ready' | 'error' | 'unsupported'>(
    'starting',
  )
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Real device Geolocation & Reverse Geocoding (Pure GPS, NO boarding house appended)
  const [geoState, setGeoState] = useState<{
    status: 'locating' | 'ready' | 'error'
    place: string
    coordinates: string
    accuracy?: number
    error?: string
  }>({
    status: 'locating',
    place: t('gpsLocating'),
    coordinates: '',
  })

  // Captured states at the exact moment of taking photo
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [capturedWatermark, setCapturedWatermark] = useState<AttendanceWatermark | null>(null)
  const [capturedTime, setCapturedTime] = useState<string | null>(null)
  const [capturedDate, setCapturedDate] = useState<string | null>(null)

  const [isFlashing, setIsFlashing] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(null)

  // Preset reason chips for Check-in (Late / Handover)
  const checkInLatePresets = [
    t('presetLateTraffic'),
    t('presetLateIncident'),
    t('presetLateFamily'),
    t('presetLateWeather'),
    t('presetLateOvertime'),
  ]

  const checkInOnTimePresets = [
    t('presetOnTimeHandover'),
    t('presetOnTimeReady'),
    t('presetOnTimeVehicles'),
    t('presetOnTimeHygiene'),
  ]

  // Preset reason chips for Check-out (Early / Normal)
  const checkOutEarlyPresets = [
    t('presetEarlyHealth'),
    t('presetEarlyFamily'),
    t('presetEarlyHandover'),
    t('presetEarlyApproval'),
  ]

  const checkOutNormalPresets = [
    t('presetNormalGateLocked'),
    t('presetNormalDone'),
    t('presetNormalSafe'),
    t('presetNormalClean'),
  ]

  const currentPresets =
    mode === 'checkin'
      ? isLate
        ? checkInLatePresets
        : checkInOnTimePresets
      : isEarly
        ? checkOutEarlyPresets
        : checkOutNormalPresets

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  // Request actual Geolocation & Reverse Geocoding
  const locateUser = () => {
    setGeoState(prev => ({
      ...prev,
      status: 'locating',
      place: t('gpsLocatingShort'),
      coordinates: '',
      error: undefined,
    }))

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoState({
        status: 'error',
        place: t('gpsNoSupportDevice'),
        coordinates: t('gpsNotAvailable'),
        error: t('gpsNoSupportBrowser'),
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const acc = Math.round(pos.coords.accuracy)

        const { address, coordinates } = await resolveRealGpsAddress(lat, lng, isEn)

        setGeoState({
          status: 'ready',
          place: address,
          coordinates: coordinates,
          accuracy: acc,
        })
      },
      err => {
        let errorMsg = t('gpsCannotObtain')
        if (err.code === 1) errorMsg = t('gpsPermissionDenied')
        else if (err.code === 2) errorMsg = t('gpsLocationUnavailable')
        else if (err.code === 3) errorMsg = t('gpsTimeout')

        setGeoState({
          status: 'error',
          place: t('gpsPermissionNotGranted'),
          coordinates: t('gpsNotReady'),
          error: errorMsg,
        })
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
    )
  }

  // Start real device camera via getUserMedia
  const startCamera = async (modeToUse: 'user' | 'environment') => {
    stopCamera()
    setCameraStatus('starting')
    setCameraError(null)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unsupported')
      setCameraError(t('cameraNotSupported'))
      return
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: modeToUse },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = mediaStream

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play().catch(() => {})
      }
      setCameraStatus('ready')
    } catch (err: any) {
      console.warn('Camera init error:', err)
      setCameraStatus('error')
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(t('cameraDenied'))
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError(t('cameraNotFound'))
      } else {
        setCameraError(t('cameraConnectError', { error: err.message || t('cameraHardwareError') }))
      }
    }
  }

  useEffect(() => {
    startCamera(facingMode)
    locateUser()

    return () => {
      stopCamera()
    }
  }, [])

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  const handleCaptureRealFrame = () => {
    if (!videoRef.current || cameraStatus !== 'ready' || geoState.status === 'locating') return

    setIsFlashing(true)
    onChangeDraft()

    try {
      const now = new Date()
      const d = String(now.getDate()).padStart(2, '0')
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const y = now.getFullYear()
      const h = String(now.getHours()).padStart(2, '0')
      const min = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')

      const snapDateStr = isEn ? `${m}/${d}/${y}` : `${d}/${m}/${y}`
      const snapTimeStr = `${h}:${min}:${s}`
      const snapIsoDate = `${y}-${m}-${d}`
      const snapFullDateTime = `${snapDateStr} ${snapTimeStr}`

      const activePlace = getLocalizedPlace(
        geoState.status === 'ready' ? geoState.place : t('gpsAddressUndetermined'),
        isEn,
      )
      const activeCoords = geoState.status === 'ready' ? geoState.coordinates : t('gpsUnverified')

      const activeWatermark: AttendanceWatermark = {
        time: snapFullDateTime,
        place: activePlace,
        staffName: getLocalizedStaffName(staffName || t('defaultStaffName'), isEn),
        coordinates: activeCoords,
      }

      const video = videoRef.current
      const canvas = document.createElement('canvas')
      const width = video.videoWidth || 640
      const height = video.videoHeight || 480
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(width, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, width, height)
        ctx.setTransform(1, 0, 0, 1, 0, 0)

        const barHeight = Math.max(90, Math.floor(height * 0.22))
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
        ctx.fillRect(0, height - barHeight, width, barHeight)

        // Safe left padding: at least 36px or 4% of width to prevent cutoff
        const padX = Math.max(36, Math.floor(width * 0.04))
        const fontSize = Math.max(13, Math.min(22, Math.floor(width * 0.024)))

        ctx.fillStyle = '#2AC1BC'
        ctx.font = `bold ${fontSize}px monospace`
        ctx.fillText(
          `🕒 ${activeWatermark.time} | ${t('liveVerified')}`,
          padX,
          height - barHeight + fontSize + 8,
        )

        ctx.fillStyle = '#FFFFFF'
        ctx.font = `bold ${fontSize - 1}px sans-serif`
        ctx.fillText(`📍 ${activeWatermark.place}`, padX, height - barHeight + fontSize * 2 + 16)

        ctx.fillStyle = '#CBD5E1'
        ctx.font = `${fontSize - 2}px sans-serif`
        ctx.fillText(
          `👤 ${activeWatermark.staffName} • GPS: ${activeWatermark.coordinates}${geoState.accuracy ? ` (±${geoState.accuracy}m)` : ''}`,
          padX,
          height - barHeight + fontSize * 3 + 24,
        )

        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.92))
        setCapturedWatermark(activeWatermark)
        setCapturedTime(snapTimeStr)
        setCapturedDate(snapIsoDate)
        stopCamera()
      }
    } catch (err) {
      console.error('Failed to capture video frame:', err)
    } finally {
      setTimeout(() => setIsFlashing(false), 250)
    }
  }

  const handleFallbackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onChangeDraft()
    setIsFlashing(true)

    const now = new Date()
    const d = String(now.getDate()).padStart(2, '0')
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const y = now.getFullYear()
    const h = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const s = String(now.getSeconds()).padStart(2, '0')

    const snapDateStr = isEn ? `${m}/${d}/${y}` : `${d}/${m}/${y}`
    const snapTimeStr = `${h}:${min}:${s}`
    const snapIsoDate = `${y}-${m}-${d}`
    const snapFullDateTime = `${snapDateStr} ${snapTimeStr}`

    const activePlace = getLocalizedPlace(
      geoState.status === 'ready' ? geoState.place : t('gpsAddressUndetermined'),
      isEn,
    )
    const activeCoords = geoState.status === 'ready' ? geoState.coordinates : t('gpsUnverified')

    const activeWatermark: AttendanceWatermark = {
      time: snapFullDateTime,
      place: activePlace,
      staffName: getLocalizedStaffName(staffName || t('defaultStaffName'), isEn),
      coordinates: activeCoords,
    }

    const reader = new FileReader()
    reader.onload = event => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const width = img.width || 640
        const height = img.height || 480
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)

          const barHeight = Math.max(90, Math.floor(height * 0.22))
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
          ctx.fillRect(0, height - barHeight, width, barHeight)

          const padX = Math.max(36, Math.floor(width * 0.04))
          const fontSize = Math.max(13, Math.min(22, Math.floor(width * 0.024)))

          ctx.fillStyle = '#2AC1BC'
          ctx.font = `bold ${fontSize}px monospace`
          ctx.fillText(
            `🕒 ${activeWatermark.time} | ${t('liveVerified')}`,
            padX,
            height - barHeight + fontSize + 8,
          )

          ctx.fillStyle = '#FFFFFF'
          ctx.font = `bold ${fontSize - 1}px sans-serif`
          ctx.fillText(`📍 ${activeWatermark.place}`, padX, height - barHeight + fontSize * 2 + 16)

          ctx.fillStyle = '#CBD5E1'
          ctx.font = `${fontSize - 2}px sans-serif`
          ctx.fillText(
            `👤 ${activeWatermark.staffName} • GPS: ${activeWatermark.coordinates}${geoState.accuracy ? ` (±${geoState.accuracy}m)` : ''}`,
            padX,
            height - barHeight + fontSize * 3 + 24,
          )

          setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.92))
          setCapturedWatermark(activeWatermark)
          setCapturedTime(snapTimeStr)
          setCapturedDate(snapIsoDate)
          stopCamera()
        }
        setIsFlashing(false)
      }
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRetakePhoto = () => {
    setCapturedPhoto(null)
    setCapturedWatermark(null)
    setCapturedTime(null)
    setCapturedDate(null)
    onChangeDraft()
    startCamera(facingMode)
  }

  const handleSelectChip = (reason: string) => {
    setSelectedQuickReason(reason)
    setExplanation(reason)
    onChangeDraft()
  }

  const isFormValid =
    Boolean(capturedPhoto && capturedWatermark && capturedTime) &&
    (!isRequireExplanation || explanation.trim().length > 0)

  return (
    <Modal
      isOpen
      onClose={() => {
        stopCamera()
        onClose()
      }}
      size="xl"
    >
      <Modal.Header
        title={mode === 'checkin' ? t('modalCheckInTitle') : t('modalCheckOutTitle')}
        description={`${shiftName} • ${boardingHouseName}`}
        icon={
          <div
            className={`p-2 rounded-xl text-white ${mode === 'checkin' ? 'bg-primary' : 'bg-success'}`}
          >
            {mode === 'checkin' ? <Camera className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
          </div>
        }
        onClose={() => {
          stopCamera()
          onClose()
        }}
      />

      <Modal.Body className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-success-soft border border-success-subtle text-success text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            <Text as="span" size="2xs" weight="black" uppercase className="tracking-wide text-success">
              {t('cameraNotice')}
            </Text>
          </div>
        </div>

        <div className="space-y-2">
          {/* Stable Non-Jitter Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <Text as="span" size="xs" weight="bold" className="flex items-center gap-1.5 shrink-0 text-foreground/90">
              <Camera className="w-4 h-4 text-primary" />
              <span>
                {t('cameraLabel', {
                  facing: facingMode === 'user' ? t('cameraFront') : t('cameraRear'),
                })}
              </span>
            </Text>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Isolated Live Clock Badge */}
              <LiveClockBadge />

              {/* Stable GPS Status Badge */}
              {geoState.status === 'locating' && (
                <Chip
                  variant="warning"
                  size="xs"
                  preventHover
                  leftIcon={<RefreshCw className="w-3 h-3 animate-spin text-warning" />}
                  className="font-bold shrink-0"
                >
                  {t('locatingGps')}
                </Chip>
              )}
              {geoState.status === 'ready' && (
                <Chip
                  variant="success"
                  size="xs"
                  preventHover
                  leftIcon={<span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                  className="font-bold shrink-0"
                  title={geoState.place}
                >
                  {t('gpsReady', { coords: geoState.coordinates })}
                </Chip>
              )}
              {geoState.status === 'error' && (
                <Chip
                  variant="secondary"
                  size="xs"
                  leftIcon={<MapPin className="w-3 h-3 text-muted" />}
                  className="font-bold shrink-0"
                  title={geoState.error}
                >
                  {t('gpsDisabled')}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={locateUser}
                    className="hover:underline ml-1 inline text-[10px] p-0 h-auto"
                  >
                    {t('gpsRetry')}
                  </Button>
                </Chip>
              )}
            </div>
          </div>

          {/* Resolved GPS Address Banner (Pure address, no boarding house suffix) */}
          {geoState.status === 'ready' && (
            <div className="px-3 py-1.5 rounded-xl bg-card-hover text-foreground/90 text-[11px] font-medium flex items-center gap-1.5 truncate border border-line shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <Text as="span" size="2xs" weight="bold" className="text-foreground shrink-0">{t('realLocation')}</Text>
              <span
                className="truncate text-foreground/90"
                title={getLocalizedPlace(geoState.place, isEn)}
              >
                {getLocalizedPlace(geoState.place, isEn)}
              </span>
            </div>
          )}

          {/* Camera Viewport (aspect-video with object-contain to prevent any text clipping) */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border-2 border-zinc-800 shadow-inner group aspect-video max-h-[360px] w-full flex items-center justify-center">
            {!capturedPhoto ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${cameraStatus === 'ready' ? 'block' : 'hidden'}`}
                />
                {cameraStatus === 'starting' && (
                  <div className="text-center p-6 text-muted text-xs space-y-3">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                    <Text size="xs" weight="semibold" className="text-zinc-300">{t('cameraStarting')}</Text>
                  </div>
                )}
                {(cameraStatus === 'error' || cameraStatus === 'unsupported') && (
                  <div className="text-center p-6 text-muted text-xs space-y-3 max-w-sm">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                    <Text size="xs" weight="bold" className="text-zinc-200">{cameraError}</Text>
                    <TextInput
                      ref={fallbackFileInputRef}
                      type="file"
                      accept="image/*"
                      containerClassName="hidden"
                      className="hidden"
                      onChange={handleFallbackImageUpload}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 pt-1 justify-center">
                      <Button
                        variant="ghost"
                        onClick={() => startCamera(facingMode)}
                      >
                        {t('retryCamera')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => fallbackFileInputRef.current?.click()}
                        leftIcon={<Upload />}
                      >
                        {t('btnUploadDuty')}
                      </Button>
                    </div>
                  </div>
                )}
                {cameraStatus === 'ready' && (
                  <Button
                    variant="ghost"
                    onClick={handleToggleFacingMode}
                    leftIcon={<RefreshCw />}
                    className="absolute top-3 right-3 z-20 backdrop-blur-md"
                  >
                    {facingMode === 'user' ? t('cameraRear') : t('cameraFront')}
                  </Button>
                )}
                <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between">
                  <div className="flex justify-between p-2">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-primary" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-primary" />
                  </div>
                  <div className="flex justify-between p-2">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-primary" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-primary" />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={capturedPhoto}
                alt="Captured frame"
                className="w-full h-full object-contain animate-in fade-in duration-200"
              />
            )}
            {isFlashing && (
              <div className="absolute inset-0 bg-card animate-out fade-out duration-250 pointer-events-none z-30" />
            )}
          </div>

          {/* Captured Watermark Verification HUD below picture */}
          {capturedPhoto && capturedWatermark && (
            <div className="p-3.5 bg-zinc-900 rounded-2xl text-white text-xs border border-zinc-800 space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-primary flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5" /> {capturedWatermark.time}
                </span>
                <Chip variant="success" size="xs" preventHover className="border border-emerald-500/40">
                  {t('stampedReal')}
                </Chip>
              </div>
              <div className="text-zinc-200 text-[11px] font-medium flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">
                  {getLocalizedPlace(capturedWatermark.place, isEn)}
                </span>
              </div>
              <div className="text-muted text-[10px] flex items-center justify-between pt-1 border-t border-zinc-800">
                <span>{getLocalizedStaffName(capturedWatermark.staffName, isEn)}</span>
                <span className="font-mono text-zinc-300">
                  GPS: {capturedWatermark.coordinates}
                </span>
              </div>
            </div>
          )}

          {/* Snap Button */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {!capturedPhoto ? (
              <Button
                fullWidth
                disabled={cameraStatus !== 'ready' || geoState.status === 'locating'}
                onClick={handleCaptureRealFrame}
                leftIcon={
                  geoState.status === 'locating' ? (
                    <RefreshCw />
                  ) : (
                    <Camera />
                  )
                }
              >
                {geoState.status === 'locating' ? t('waitingGps') : t('btnCaptureNow')}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="outline"
                onClick={handleRetakePhoto}
                leftIcon={<RefreshCw />}
              >
                {t('btnRetake')}
              </Button>
            )}
          </div>
        </div>

        {/* EXPLANATION / NOTE SECTION */}
        <div className="space-y-3 pt-1 border-t border-line">
          <div className="p-4 sm:p-5 rounded-2xl bg-warning-soft border border-warning-subtle space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <Text as="h4" size="xs" weight="black" color="warning" uppercase>
                  {mode === 'checkin'
                    ? isLate
                      ? t('lateCheckInTitle')
                      : t('onTimeCheckInTitle')
                    : isEarly
                      ? t('earlyCheckOutTitle')
                      : t('normalCheckOutTitle')}
                </Text>
                <Text size="2xs" color="warning" weight="medium" className="leading-relaxed">
                  {mode === 'checkin'
                    ? isLate
                      ? t('lateCheckInDesc', { time: shiftStartTime || '07:00' })
                      : t('onTimeCheckInDesc')
                    : isEarly
                      ? t('earlyCheckOutDesc', { time: shiftEndTime || '15:00' })
                      : t('normalCheckOutDesc')}
                </Text>
              </div>
            </div>

            {/* Preset Chips */}
            <div className="space-y-1.5">
              <Text as="span" size="3xs" weight="bold" color="warning" uppercase className="block tracking-wider">
                {t('commonReasonsTitle')}
              </Text>
              <div className="flex flex-wrap gap-1.5">
                {currentPresets.map((chip, idx) => (
                  <Chip
                    key={idx}
                    variant={explanation.includes(chip) ? 'warning' : 'secondary'}
                    size="xs"
                    onClick={() => handleSelectChip(chip)}
                  >
                    {chip}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1">
              <TextareaInput
                rows={2}
                value={explanation}
                onChange={e => {
                  setExplanation(e.target.value)
                  onChangeDraft()
                }}
                placeholder={
                  mode === 'checkin'
                    ? isLate
                      ? t('placeholderExplanation')
                      : t('placeholderNote')
                    : isEarly
                      ? t('placeholderExplanation')
                      : t('placeholderCheckOutNote')
                }
                className="w-full p-2.5 rounded-xl bg-card border border-amber-300 text-xs text-foreground font-medium focus:outline-none focus:border-warning focus:ring-1 focus:ring-amber-500/20"
                containerClassName="space-y-0"
              />
              {isRequireExplanation && !explanation.trim() ? (
                <Text as="span" size="3xs" weight="bold" color="danger" className="block">
                  {t('explanationRequiredNotice')}
                </Text>
              ) : (
                <Text as="span" size="3xs" weight="medium" className="text-amber-700/80 block">
                  {t('explanationOptionalNotice')}
                </Text>
              )}
            </div>
          </div>
        </div>
      </Modal.Body>

      {/* MODAL FOOTER */}
      <Modal.Footer className="p-4 sm:p-5 bg-surface border-t border-line flex items-center justify-end gap-2.5">
        <Button
          variant="outline"
          size="md"
          onClick={() => {
            stopCamera()
            onClose()
          }}
        >
          {t('btnCancel')}
        </Button>
        <Button
          size="md"
          disabled={!isFormValid}
          onClick={() => {
            if (capturedPhoto && capturedWatermark && capturedTime && isFormValid) {
              stopCamera()
              onSubmit({
                photo: capturedPhoto,
                watermark: capturedWatermark,
                capturedTime: capturedTime,
                capturedDate: capturedDate || undefined,
                explanation: explanation.trim() || undefined,
              })
            }
          }}
          leftIcon={<Check />}
        >
          {mode === 'checkin' ? t('btnConfirmCheckIn') : t('btnConfirmCheckOut')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// =======================================================================================
// SUB-COMPONENT: DUTY PROOF UPLOAD MODAL (LANDLORD AUDIT REQUIREMENT)
// =======================================================================================
interface DutyProofModalProps {
  duty: DutyTaskItem
  boardingHouseName: string
  effectiveTime: string
  staffName?: string
  onClose: () => void
  onSubmit: (payload: {
    dutyId: string
    photo?: string
    note?: string
    proofTime?: string
    markCompleted?: boolean
  }) => void
  onChangeDraft: () => void
}

function DutyProofModal({
  duty,
  boardingHouseName,
  effectiveTime,
  staffName,
  onClose,
  onSubmit,
  onChangeDraft,
}: DutyProofModalProps) {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()

  const [photo, setPhoto] = useState<string>(duty.photoProof || '')
  const [note, setNote] = useState(duty.note || '')
  const [warningNotice, setWarningNotice] = useState<string | null>(null)
  const [proofTimeStr] = useState<string>(() => {
    const now = new Date()
    const loc = locale === 'en' ? 'en-US' : 'vi-VN'
    return `${now.toLocaleDateString(loc)} ${now.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChangeDraft()
      setWarningNotice(null)
      const reader = new FileReader()
      reader.onload = event => {
        if (event.target?.result) {
          setPhoto(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
    >
      <Modal.Header
        title={t('dutyProofTitle')}
        description={getDutyTitle(duty, locale === 'en')}
        icon={
          <div className="p-2 rounded-xl bg-primary text-white">
            <Camera className="w-5 h-5" />
          </div>
        }
        onClose={onClose}
      />

      {/* Content */}
      <Modal.Body className="p-5 sm:p-6 space-y-4">
        <div className="p-3 rounded-xl bg-primary-soft border border-primary-subtle text-xs text-primary flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <Text size="xs" color="brand" className="leading-relaxed">{t('dutyProofNotice')}</Text>
        </div>

        {/* Photo Preview Frame */}
        {photo ? (
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-16/10 flex items-center justify-center border border-zinc-800 shadow-inner">
            <img src={photo} alt="Duty proof" className="w-full h-full object-cover" />

            {/* Embedded Watermark Stamp */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/75 backdrop-blur-md rounded-xl p-2.5 border border-white/15 text-white text-[10px] space-y-0.5">
              <div className="flex items-center justify-between font-black text-primary">
                <span>🕒 {proofTimeStr}</span>
                <span className="text-emerald-400 font-bold">{t('stampedReal')}</span>
              </div>
              <div className="text-zinc-200 font-medium truncate">
                📍 {getLocalizedPlace(boardingHouseName, locale === 'en')}
              </div>
              <div className="text-muted text-[9px]">
                👤{' '}
                {getLocalizedStaffName(
                  staffName || t('employeeDefaultStaffName'),
                  locale === 'en',
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-line hover:border-primary bg-surface hover:bg-primary/5 aspect-16/10 flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-card border border-line flex items-center justify-center shadow-2xs text-primary">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <Text size="xs" weight="bold">{t('dutyProofUploadTitle')}</Text>
              <Text size="2xs" color="secondary">
                {duty.requiresPhoto ? t('requiresPhoto') : t('photoOptional')}
              </Text>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <TextInput
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            containerClassName="hidden"
            className="hidden"
            onChange={handleFileUpload}
          />
          <TextInput
            ref={fileRef}
            type="file"
            accept="image/*"
            containerClassName="hidden"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            onClick={() => cameraRef.current?.click()}
            leftIcon={<Camera />}
            className="flex-1"
          >
            <span>{t('btnCaptureNewDuty')}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            leftIcon={<Upload />}
          >
            <span>{t('btnUploadDuty')}</span>
          </Button>
        </div>

        {/* Note Input */}
        <TextInput
          label={t('dutyNoteLabel')}
          value={note}
          onChange={e => {
            setNote(e.target.value)
            onChangeDraft()
          }}
          placeholder={t('dutyNotePlaceholder')}
          className="w-full p-2.5 rounded-xl bg-surface border border-line text-xs text-foreground font-medium focus:outline-none focus:border-primary"
          containerClassName="space-y-1"
        />

        {/* Warning notice if required photo is missing */}
        {warningNotice && (
          <div className="p-3 rounded-xl bg-warning-soft border border-warning-subtle text-warning text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span>{warningNotice}</span>
          </div>
        )}
      </Modal.Body>

      {/* Footer with 2 separate action buttons: Update Progress & Complete Task */}
      <Modal.Footer className="p-4 sm:p-5 bg-surface border-t border-line flex flex-wrap items-center justify-between gap-2.5">
        <Button
          variant="outline"
          size="md"
          onClick={onClose}
        >
          {t('btnCancel')}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              onSubmit({
                dutyId: duty.id,
                photo: photo || undefined,
                note: note.trim() || undefined,
                proofTime: proofTimeStr,
                markCompleted: false,
              })
            }}
            leftIcon={<FileText />}
          >
            <span>{t('btnUpdateProgress')}</span>
          </Button>

          <Button
            size="md"
            onClick={() => {
              if (duty.requiresPhoto && !photo) {
                setWarningNotice(t('photoProofRequiredWarning'))
                return
              }
              onSubmit({
                dutyId: duty.id,
                photo: photo || undefined,
                note: note.trim() || undefined,
                proofTime: proofTimeStr,
                markCompleted: true,
              })
            }}
            leftIcon={<Check />}
          >
            <span>{t('btnCompleteDuty')}</span>
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
