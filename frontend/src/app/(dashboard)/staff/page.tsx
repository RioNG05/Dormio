'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
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
  getLocalizedExplanation,
  getTodayISODate,
  saveAttendanceRecord,
} from './data'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { staffAttendanceService, StaffMonthlySummary } from '@/services/staff-attendance.service'
import {
  StaffOverviewSkeleton,
  StaffBanner,
  NoShiftCard,
  TodayShiftCard,
  DutyTaskList,
  CoWorkersCard,
  MonthlySummaryCard,
  CheckInOutCameraModal,
  DutyProofModal,
  PreviewImageModal,
  ConfirmCloseModal,
  PreviewImageModalData,
} from './components'

export default function StaffOverviewPage() {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()

  // Live Clock
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Mount state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false)

  const { user } = useAuth()

  // Today's schedule & duties state
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
  const { toast } = useToast()

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    if (type === 'success') {
      toast.success(message)
    } else if (type === 'warning') {
      toast.warning(message)
    } else {
      toast.info(message)
    }
  }

  // Fetch live overview from backend
  const fetchOverview = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const data = await staffAttendanceService.getTodayOverview()
      if (data && data.schedule) {
        setTodaySchedule(data.schedule)
        setDutyList(data.schedule.duties || [])
        if (data.staffName) setStaffName(data.staffName)

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
      console.warn('Could not fetch monthly attendance summary:', err)
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
  const [previewImageModal, setPreviewImageModal] = useState<PreviewImageModalData | null>(null)

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
    if (hasFormDraftChanges) {
      setShowConfirmClose(true)
      return
    }
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

    if (!duty.completed && duty.requiresPhoto && !duty.photoProof) {
      setSelectedDutyForProof(duty)
      setHasFormDraftChanges(false)
      setActiveModal('duty_proof')
      return
    }

    const updated = dutyList.map(item => {
      if (item.id === duty.id) {
        const nextCompleted = !item.completed
        return {
          ...item,
          completed: nextCompleted,
          completedAt: nextCompleted
            ? new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })
            : undefined,
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

    const changedItem = updated.find(d => d.id === duty.id)
    if (changedItem?.completed) {
      showToast(t('toastDutyCompleted'), 'success')
    } else {
      showToast(t('toastDutyReopened'), 'info')
    }

    // Sync to backend API
    staffAttendanceService
      .saveDutyProof({
        workScheduleId: todaySchedule.id,
        dutyId: duty.id,
        markCompleted: changedItem?.completed,
      })
      .then(res => {
        if (res?.schedule?.duties) {
          setDutyList(res.schedule.duties)
        }
      })
      .catch(err => {
        console.warn('Backend duty toggle sync warning:', err)
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
    return <StaffOverviewSkeleton />
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* TOP BANNER: GREETING & CLOCK */}
      <StaffBanner
        currentStaffName={currentStaffName}
        todayFormattedDate={todayFormattedDate}
        effectiveTimeString={effectiveTimeString}
      />

      {/* MAIN SECTION: 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN LEFT (2 SPAN): TODAY'S SHIFT CARD & SMART TIMEKEEPING BUTTONS OR EMPTY STATE */}
        {!todaySchedule ? (
          <NoShiftCard
            fetchError={fetchError}
            onRefresh={() => {
              fetchOverview()
              fetchMonthlySummary()
            }}
          />
        ) : (
          <div className="lg:col-span-2 space-y-6">
            <TodayShiftCard
              todaySchedule={todaySchedule}
              attendance={attendance}
              checkInEval={checkInEval}
              checkOutEval={checkOutEval}
              getShiftName={getShiftName}
              getPositionName={getPositionName}
              onOpenCheckIn={handleOpenCheckIn}
              onOpenCheckOut={handleOpenCheckOut}
              onPreviewPhoto={data => setPreviewImageModal(data)}
            >
              <DutyTaskList
                dutyList={dutyList}
                todayAdditionalTasks={todayAdditionalTasks}
                completedCount={completedCount}
                todaySchedule={todaySchedule}
                effectiveTimeString={effectiveTimeString}
                currentStaffName={currentStaffName}
                todayStr={todayStr}
                onToggleDuty={handleToggleDuty}
                onSelectDutyForProof={duty => {
                  setSelectedDutyForProof(duty)
                  setHasFormDraftChanges(false)
                  setActiveModal('duty_proof')
                }}
                onPreviewPhoto={data => setPreviewImageModal(data)}
              />
            </TodayShiftCard>
          </div>
        )}

        {/* COLUMN RIGHT (1 SPAN): CO-WORKERS ON SHIFT & QUICK METRICS */}
        <div className="space-y-6">
          <CoWorkersCard
            todaySchedule={todaySchedule}
            getPositionName={getPositionName}
          />

          <MonthlySummaryCard
            monthlySummary={monthlySummary}
            monthlySummaryTitle={monthlySummaryTitle}
          />
        </div>
      </div>

      {/* MODAL 1: CHECK-IN / CHECK-OUT WITH CAMERA WATERMARK & EXPLANATION */}
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

      {/* MODAL 2: DUTY TASK PHOTO PROOF UPLOAD */}
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

      {/* MODAL 3: FULL SCREEN IMAGE VIEWER WITH WATERMARK AUDIT STAMP */}
      <PreviewImageModal
        data={previewImageModal}
        onClose={() => setPreviewImageModal(null)}
      />

      {/* RULE #10 POP-UP CONFIRMATION MODAL ("Xác nhận đóng form") */}
      <ConfirmCloseModal
        isOpen={showConfirmClose}
        onContinueEditing={() => setShowConfirmClose(false)}
        onDiscardAndClose={handleConfirmDiscardClose}
      />
    </div>
  )
}
