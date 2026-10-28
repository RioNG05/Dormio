'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, RefreshCw, Clock } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text } from '@/components/ui'

interface NoShiftCardProps {
  fetchError: string | null
  onRefresh: () => void
}

export function NoShiftCard({ fetchError, onRefresh }: NoShiftCardProps) {
  const t = useTranslations('staffPortal')

  return (
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
          <Button onClick={onRefresh} leftIcon={<RefreshCw />}>
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
  )
}
