'use client'

import React, { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ChatView } from '@/components/chat'
import { useTranslations } from '@/context/LanguageContext'

function TenantMessagesFallback() {
  const t = useTranslations('chat')
  return (
    <div className="p-8 text-center text-xs font-bold text-muted flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span>{t('loading') || 'Loading...'}</span>
    </div>
  )
}

export default function TenantMessagesPage() {
  const router = useRouter()

  return (
    <Suspense fallback={<TenantMessagesFallback />}>
      <ChatView
        role="tenant"
        onNavigateInvoice={() => {
          router.push('/tenant/invoices')
        }}
        onNavigateRoom={() => {
          router.push('/tenant/room')
        }}
      />
    </Suspense>
  )
}
