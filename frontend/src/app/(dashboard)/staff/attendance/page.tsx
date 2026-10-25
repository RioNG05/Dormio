'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/context/LanguageContext'

export default function StaffAttendancePage() {
  const router = useRouter()
  const t = useTranslations('staffPortal')

  useEffect(() => {
    router.replace('/staff/shift-history')
  }, [router])

  return (
    <div className="p-12 text-center text-xs text-muted font-bold flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span>{t('redirecting') || 'Redirecting...'}</span>
    </div>
  )
}
