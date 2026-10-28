'use client'

import React from 'react'
import Link from 'next/link'
import {
  CheckSquare,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  Eye,
  FileText,
} from 'lucide-react'
import {
  WorkScheduleItem,
  DutyTaskItem,
  AttendanceWatermark,
  getLocalizedPlace,
  getLocalizedStaffName,
} from '../data'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { Button, Text, Chip, Checkbox } from '@/components/ui'

interface DutyTaskListProps {
  dutyList: DutyTaskItem[]
  todayAdditionalTasks?: any[]
  completedCount: number
  todaySchedule: WorkScheduleItem
  effectiveTimeString: string
  currentStaffName: string
  todayStr: string
  onToggleDuty: (duty: DutyTaskItem) => void
  onSelectDutyForProof: (duty: DutyTaskItem) => void
  onPreviewPhoto: (data: {
    isOpen: boolean
    title: string
    imageUrl: string
    watermark?: AttendanceWatermark
    note?: string
  }) => void
}

export function DutyTaskList({
  dutyList,
  todayAdditionalTasks = [],
  completedCount,
  todaySchedule,
  effectiveTimeString,
  currentStaffName,
  todayStr,
  onToggleDuty,
  onSelectDutyForProof,
  onPreviewPhoto,
}: DutyTaskListProps) {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()

  const getDutyTitle = (duty: DutyTaskItem) => duty.title
  const getDutyNote = (note?: string) => note || ''

  return (
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
                    onChange={() => onToggleDuty(duty)}
                    className="mt-1 shrink-0"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold leading-snug ${duty.completed ? 'line-through text-muted' : 'text-foreground'}`}
                      >
                        {getDutyTitle(duty)}
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
                          note: getDutyNote(duty.note),
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
                        onPreviewPhoto({
                          isOpen: true,
                          title: `${t('dutyProofTitle')}: ${getDutyTitle(duty)}`,
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
                          note: getDutyNote(duty.note),
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
                    size="sm"
                    onClick={() => onSelectDutyForProof(duty)}
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
  )
}
