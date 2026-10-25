'use client'

import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { Chip } from '@/components/ui'

export function LiveClockBadge() {
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
