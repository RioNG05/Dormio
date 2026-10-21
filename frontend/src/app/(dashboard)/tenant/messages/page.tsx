'use client'

import React, { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ChatView } from '@/components/chat'

function TenantMessagesFallback() {
  return (
    <div className="p-8 text-center text-xs font-bold text-muted">
      Đang tải tin nhắn...
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
          router.push('/tenant/bills')
        }}
      />
    </Suspense>
  )
}
