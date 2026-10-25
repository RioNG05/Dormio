'use client'

import React from 'react'
import { Clock } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Text, Chip } from '@/components/ui'

interface StaffBannerProps {
  currentStaffName: string
  todayFormattedDate: string
  effectiveTimeString: string
}

export function StaffBanner({
  currentStaffName,
  todayFormattedDate,
  effectiveTimeString,
}: StaffBannerProps) {
  const t = useTranslations('staffPortal')

  return (
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
  )
}
