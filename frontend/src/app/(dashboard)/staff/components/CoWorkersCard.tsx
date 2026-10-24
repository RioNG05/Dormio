'use client'

import React from 'react'
import { Users, Phone } from 'lucide-react'
import { WorkScheduleItem, JobPosition } from '../data'
import { useTranslations } from '@/context/LanguageContext'
import { Text, Chip } from '@/components/ui'

interface CoWorkersCardProps {
  todaySchedule: WorkScheduleItem | null
  getPositionName: (posOrName: string | JobPosition) => string
}

export function CoWorkersCard({ todaySchedule, getPositionName }: CoWorkersCardProps) {
  const t = useTranslations('staffPortal')

  return (
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
          <Text size="xs" weight="medium" color="secondary">
            {todaySchedule ? t('onlyStaffAssigned') : t('noScheduledShifts')}
          </Text>
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
  )
}
