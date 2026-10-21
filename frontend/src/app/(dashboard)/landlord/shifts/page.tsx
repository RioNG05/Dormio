'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Clock,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  X,
  Check,
  AlertTriangle,
  CheckCircle2,
  Sun,
  Moon,
  Sunrise,
  Layers,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { scheduleService, ShiftItem } from '@/services/schedule.service'
import { Button, TextInput, SearchInput } from '@/components/ui'
import { LandlordPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'

export default function ShiftsPage() {
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const buildingId = activeBuilding?.id || ''

  const [shifts, setShifts] = useState<ShiftItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftItem | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false)

  const [formName, setFormName] = useState('')
  const [formStart, setFormStart] = useState('08:00')
  const [formEnd, setFormEnd] = useState('17:00')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchShifts = useCallback(async () => {
    if (!buildingId) return
    setIsLoading(true)
    try {
      const res = await scheduleService.getShifts(buildingId)
      setShifts(res || [])
    } catch (err) {
      console.error('Failed to fetch shifts:', err)
      showToast('error', t('landlordShiftsLoading'))
    } finally {
      setIsLoading(false)
    }
  }, [buildingId])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  const resetForm = () => {
    setFormName('')
    setFormStart('08:00')
    setFormEnd('17:00')
    setFormError('')
    setIsDirty(false)
    setEditingShift(null)
  }

  const handleAttemptClose = () => {
    if (isDirty) {
      setIsConfirmCloseOpen(true)
    } else {
      setIsModalOpen(false)
      resetForm()
    }
  }

  const handleConfirmClose = () => {
    setIsConfirmCloseOpen(false)
    setIsModalOpen(false)
    resetForm()
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (shift: ShiftItem) => {
    setEditingShift(shift)
    setFormName(shift.name)
    setFormStart(shift.startTime)
    setFormEnd(shift.endTime)
    setFormError('')
    setIsDirty(false)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError(t('landlordShiftsNameRequired'))
      return
    }
    if (formStart >= formEnd) {
      setFormError(t('landlordShiftsStartBeforeEnd'))
      return
    }

    setIsSubmitting(true)
    setFormError('')
    try {
      if (editingShift) {
        await scheduleService.updateShift(buildingId, editingShift.id, {
          name: formName.trim(),
          startTime: formStart,
          endTime: formEnd,
        })
        showToast('success', t('landlordShiftsToastEditSuccess'))
      } else {
        await scheduleService.createShift(buildingId, {
          name: formName.trim(),
          startTime: formStart,
          endTime: formEnd,
        })
        showToast('success', t('landlordShiftsToastAddSuccess'))
      }
      setIsModalOpen(false)
      resetForm()
      fetchShifts()
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ||
        err?.message ||
        t('landlordShiftsDeleteError'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (shift: ShiftItem) => {
    if (!confirm(t('landlordShiftsDeleteConfirm', { name: shift.name }))) return
    try {
      await scheduleService.deleteShift(buildingId, shift.id)
      showToast('success', t('landlordShiftsToastDeleteSuccess'))
      fetchShifts()
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || t('landlordShiftsDeleteError'))
    }
  }

  const getShiftCategory = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0], 10)
    if (hour >= 5 && hour < 12)
      return {
        label: t('landlordShiftsMorningShift'),
        icon: Sunrise,
        color: 'text-warning bg-warning-soft border-warning-subtle',
      }
    if (hour >= 12 && hour < 18)
      return {
        label: t('landlordShiftsAfternoonShift'),
        icon: Sun,
        color: 'text-info bg-info-soft border-info-subtle',
      }
    return {
      label: t('landlordShiftsNightShift'),
      icon: Moon,
      color: 'text-deposit bg-deposit-soft border-deposit-subtle',
    }
  }

  const getDurationHours = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const totalMins = eh * 60 + em - (sh * 60 + sm)
    if (totalMins <= 0) return '—'
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    return m > 0 ? `${h}h${m}m` : `${h}h`
  }

  const filteredShifts = shifts.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const statChips: LandlordStatChipItem[] = useMemo(() => {
    const morningCount = shifts.filter(s => {
      const h = parseInt(s.startTime.split(':')[0])
      return h >= 5 && h < 12
    }).length
    const afternoonCount = shifts.filter(s => {
      const h = parseInt(s.startTime.split(':')[0])
      return h >= 12 && h < 18
    }).length
    const nightCount = shifts.filter(s => {
      const h = parseInt(s.startTime.split(':')[0])
      return h < 5 || h >= 18
    }).length

    return [
      {
        key: 'total',
        label: t('landlordShiftsTotalShiftsCount'),
        value: shifts.length,
        icon: <Clock className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-muted shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border-white/10 lg:w-[135px]',
        labelColor: 'secondary',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'morning',
        label: t('landlordShiftsMorningShift'),
        value: morningCount,
        icon: <Sunrise className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-amber-400 shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 lg:w-[135px]',
        labelClassName: 'text-amber-400',
        valueClassName: 'text-amber-400 text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'afternoon',
        label: t('landlordShiftsAfternoonShift'),
        value: afternoonCount,
        icon: <Sun className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-blue-400 shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-vacant/10 hover:bg-vacant/20 border-vacant/30 lg:w-[135px]',
        labelClassName: 'text-blue-400',
        valueClassName: 'text-blue-400 text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'night',
        label: t('landlordShiftsNightShift'),
        value: nightCount,
        icon: <Moon className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-purple-400 shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 lg:w-[135px]',
        labelClassName: 'text-purple-400',
        valueColor: 'white',
        valueClassName: 'text-purple-400 text-base sm:text-lg leading-none mt-1',
      },
    ]
  }, [shifts, t])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[80] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 ${toast.type === 'success'
              ? 'bg-success-soft text-success border-success-subtle'
              : 'bg-danger-soft text-danger border-danger-subtle'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <LandlordPageHeader
        title={t('landlordShiftsTitle')}
        subtitle={`${t('landlordShiftsSubtitle')}: ${activeBuilding?.name || t('landlordRoomsBuildingDefault')}`}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            className="shrink-0"
            leftIcon={<Plus />}
          >
            {t('landlordShiftsAddNewBtn')}
          </Button>
        }
      />

      <LandlordStatBanner
        watermarkIcon={<Layers className="w-64 h-64" />}
        chips={statChips}
      />

      <div className="relative max-w-sm">
        <SearchInput
          placeholder={t('landlordShiftsFieldNamePh')}
          value={searchQuery}
          onChange={setSearchQuery}
          containerClassName="w-full space-y-0"
          className="w-full py-2 text-xs font-semibold bg-card border border-line rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2 bg-card rounded-3xl border border-line">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted font-medium">{t('landlordShiftsLoading')}</p>
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="bg-card border border-line rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <div className="max-w-sm space-y-1">
            <h3 className="text-base font-extrabold text-foreground">
              {searchQuery ? t('landlordShiftsSearchNotFound') : t('landlordShiftsEmptyTitle')}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {searchQuery ? t('landlordShiftsSearchNotFoundDesc') : t('landlordShiftsEmptyDesc')}
            </p>
          </div>
          {!searchQuery && (
            <Button size="xs"
              onClick={openCreateModal}
            >
              {t('landlordShiftsAddNow')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShifts.map(shift => {
            const cat = getShiftCategory(shift.startTime)
            const CategoryIcon = cat.icon
            const duration = getDurationHours(shift.startTime, shift.endTime)
            return (
              <div
                key={shift.id}
                className="bg-card border border-line rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${cat.color}`}
                      >
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-foreground text-base group-hover:text-primary transition-colors line-clamp-1">
                          {shift.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[11px] font-bold rounded-full border ${cat.color}`}
                        >
                          <CategoryIcon className="w-3 h-3" />
                          {cat.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface rounded-2xl p-4 border border-line space-y-2.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted tracking-wider mb-0.5">
                          {t('landlordShiftsStart')}
                        </p>
                        <p className="text-lg font-black text-foreground">{shift.startTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted tracking-wider mb-0.5">
                          {t('landlordShiftsEnd')}
                        </p>
                        <p className="text-lg font-black text-foreground">{shift.endTime}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                      <span className="text-muted font-medium">
                        {t('landlordShiftsDuration')}
                      </span>
                      <span className="font-extrabold text-foreground">{duration}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(shift)}
                    className="flex-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> {t('landlordShiftsBtnEdit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(shift)}
                    className="flex-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t('landlordShiftsBtnDelete')}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleAttemptClose}
        >
          <div
            className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-foreground">
                  {editingShift
                    ? t('landlordShiftsModalEditTitle')
                    : t('landlordShiftsModalAddTitle')}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {editingShift
                    ? t('landlordShiftsEditSubtitle')
                    : t('landlordShiftsCreateSubtitle')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAttemptClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TextInput
                label={t('landlordShiftsFieldName')}
                required
                value={formName}
                onChange={e => {
                  setFormName(e.target.value)
                  setIsDirty(true)
                }}
                placeholder={t('landlordShiftsFieldNamePh')}
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  type="time"
                  label={t('landlordShiftsFieldStartTime')}
                  required
                  value={formStart}
                  onChange={e => {
                    setFormStart(e.target.value)
                    setIsDirty(true)
                  }}
                />
                <TextInput
                  type="time"
                  label={t('landlordShiftsFieldEndTime')}
                  required
                  value={formEnd}
                  onChange={e => {
                    setFormEnd(e.target.value)
                    setIsDirty(true)
                  }}
                />
              </div>

              {formStart && formEnd && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl text-xs font-semibold text-primary">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {t('landlordShiftsDuration')}:{' '}
                    <strong>{getDurationHours(formStart, formEnd)}</strong>
                  </span>
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-danger-soft border border-danger-subtle rounded-xl text-xs font-bold text-danger">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button size="xs"
                  type="button"
                  variant="outline"
                  onClick={handleAttemptClose}
                  className="flex-1"
                >
                  {t('landlordShiftsModalBtnCancel')}
                </Button>
                <Button size="icon"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingShift
                    ? t('landlordShiftsSaveShiftBtn')
                    : t('landlordShiftsCreateShiftBtn')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmCloseOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-foreground mb-1">
              {t('landlordShiftsConfirmCloseTitle')}
            </h3>
            <p className="text-xs text-muted mb-5">{t('landlordShiftsConfirmCloseDesc')}</p>
            <div className="flex gap-2.5">
              <Button size="xs"
                variant="outline"
                onClick={() => setIsConfirmCloseOpen(false)}
                className="flex-1"
              >
                {t('landlordShiftsConfirmCloseKeep')}
              </Button>
              <Button size="xs"
                variant="ghost"
                onClick={handleConfirmClose}
                className="flex-1"
              >
                {t('landlordShiftsConfirmCloseDiscard')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
