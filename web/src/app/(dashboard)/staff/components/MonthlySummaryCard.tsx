'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'
import { StaffMonthlySummary } from '@/services/staff-attendance.service'
import { useTranslations } from '@/context/LanguageContext'
import { Text } from '@/components/ui'

interface MonthlySummaryCardProps {
  monthlySummary: StaffMonthlySummary | null
  monthlySummaryTitle: string
}

export function MonthlySummaryCard({
  monthlySummary,
  monthlySummaryTitle,
}: MonthlySummaryCardProps) {
  const t = useTranslations('staffPortal')

  return (
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
  )
}
