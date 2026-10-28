'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home, FileQuestion, Compass } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text, Chip } from '@/components/ui'

export default function NotFound() {
  const router = useRouter()
  const t = useTranslations('common')

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-lg text-center space-y-6">
        {/* Status Graphic & Code Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-warning-soft border border-warning-subtle text-warning flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300">
            <FileQuestion className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.75]" />
          </div>
          <div className="absolute -bottom-2 -right-2">
            <Chip size="sm" variant="warning" preventHover>
              404
            </Chip>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <Text as="h1" size="2xl" weight="black" color="default" className="sm:text-3xl tracking-tight">
            {t('pageNotFoundTitle')}
          </Text>
          <Text as="p" size="sm" weight="medium" color="secondary" className="max-w-md mx-auto leading-relaxed">
            {t('pageNotFoundDesc')}
          </Text>
        </div>

        {/* Helpful Info Box */}
        <div className="p-4 rounded-2xl bg-surface border border-line text-left flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-xl bg-primary-soft text-primary shrink-0 mt-0.5">
            <Compass className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <Text as="p" size="xs" weight="bold" color="default">
              {t('pageNotFoundSubtitle')}
            </Text>
            <Text as="p" size="2xs" color="secondary" className="leading-relaxed">
              {t('appName')} • Quản lý và cho thuê phòng trọ
            </Text>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleGoBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto min-w-[140px]"
          >
            {t('goBack')}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleGoHome}
            leftIcon={<Home className="w-4 h-4" />}
            className="w-full sm:w-auto min-w-[140px]"
          >
            {t('goHome')}
          </Button>
        </div>
      </div>
    </div>
  )
}

