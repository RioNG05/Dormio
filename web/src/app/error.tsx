'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Home, RotateCcw, ChevronDown, ChevronUp, Terminal } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text, Chip } from '@/components/ui'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter()
  const t = useTranslations('common')
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  useEffect(() => {
    // Log runtime exception for observability
    console.error('[Dormio Root Error Boundary]', error)
  }, [error])

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
      <div className="w-full max-w-xl text-center space-y-6">
        {/* Status Graphic & 500 Code Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-danger-soft border border-danger-subtle text-danger flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300">
            <AlertTriangle className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.75]" />
          </div>
          <div className="absolute -bottom-2 -right-2">
            <Chip size="sm" variant="danger" preventHover>
              500
            </Chip>
          </div>
        </div>

        {/* Text Header */}
        <div className="space-y-3">
          <Text as="h1" size="2xl" weight="black" color="default" className="sm:text-3xl tracking-tight">
            {t('errorTitle')}
          </Text>
          <Text as="p" size="sm" weight="medium" color="secondary" className="max-w-md mx-auto leading-relaxed">
            {t('errorDesc')}
          </Text>
        </div>

        {/* Encountered Error Summary Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line text-left space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-danger">
              <Terminal className="w-4 h-4 shrink-0" />
              <Text as="span" size="xs" weight="bold" color="danger">
                {t('errorDetailsLabel')}
              </Text>
            </div>
            {error?.digest && (
              <Text as="span" size="3xs" color="subtle" mono>
                {t('errorDigestLabel')}: {error.digest}
              </Text>
            )}
          </div>

          <div className="p-3 rounded-xl bg-card border border-line font-mono text-xs text-foreground/90 break-words leading-relaxed">
            {error?.message || 'Unknown runtime error occurred.'}
          </div>

          {/* Toggle Technical Details if stack or extra props exist */}
          {error?.stack && (
            <div className="space-y-2 pt-1 border-t border-line">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer select-none"
              >
                {showTechnicalDetails ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>{t('errorHideDetails')}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>{t('errorShowDetails')}</span>
                  </>
                )}
              </button>

              {showTechnicalDetails && (
                <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 text-left leading-relaxed shadow-inner">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons: [Thử lại], [Quay lại], [Về trang chủ] */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => reset()}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="w-full sm:w-auto min-w-[130px]"
          >
            {t('tryAgain')}
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={handleGoBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto min-w-[130px]"
          >
            {t('goBack')}
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={handleGoHome}
            leftIcon={<Home className="w-4 h-4" />}
            className="w-full sm:w-auto min-w-[130px]"
          >
            {t('goHome')}
          </Button>
        </div>
      </div>
    </div>
  )
}

