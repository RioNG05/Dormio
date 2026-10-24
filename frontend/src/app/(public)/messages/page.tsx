'use client'

import React, { Suspense } from 'react'
import { ChevronLeft, Lock } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button, Text } from '@/components/ui'
import { ChatView } from '@/components/chat'

function GuestMessagesFallback() {
  const t = useTranslations('chat')
  return (
    <div className="p-8 text-center text-xs font-bold text-muted flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span>{t('loading') || 'Loading...'}</span>
    </div>
  )
}

function GuestMessagesContent() {
  const t = useTranslations('guest')
  const { isLoggedIn } = useAuth()

  // Auth lock screen
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-[70vh] bg-card items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-inner border border-primary/20">
          <Lock className="w-10 h-10" />
        </div>
        <Text as="h2" variant="heading" size="2xl" weight="black" className="mb-2">
          {t('guestMessagesLockTitle')}
        </Text>
        <Text
          variant="subtitle"
          size="xs"
          weight="medium"
          className="leading-relaxed max-w-md mx-auto mb-6"
        >
          {t('guestMessagesLockDesc')}
        </Text>
        <Button
          href="/login?redirect=/messages"
          size="lg"
          rightIcon={<span>&rarr;</span>}
          className="rounded-2xl shadow-lg shadow-primary/25 hover:scale-105"
        >
          {t('guestMessagesLoginBtn')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
      {/* Top Header Trail */}
      <div className="flex items-center gap-3">
        <Button href="/" variant="ghost" size="icon-sm" title="Quay lại">
          <ChevronLeft />
        </Button>
        <div>
          <Text as="h1" variant="heading" size="2xl" weight="black">
            {t('guestMessagesTitle')}
          </Text>
          <Text variant="subtitle" size="xs">
            {t('guestMessagesSubtitle')}
          </Text>
        </div>
      </div>

      {/* Shared Chat View */}
      <ChatView role="public" />
    </div>
  )
}

export default function GuestMessagesPage() {
  return (
    <Suspense fallback={<GuestMessagesFallback />}>
      <GuestMessagesContent />
    </Suspense>
  )
}
