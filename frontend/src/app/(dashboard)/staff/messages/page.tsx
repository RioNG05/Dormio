'use client'

import React, { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ChatView } from '@/components/chat'

function StaffMessagesFallback() {
  return (
    <div className="p-8 text-center text-xs font-bold text-muted">
      Đang tải tin nhắn...
    </div>
  )
}

export default function StaffMessagesPage() {
  const router = useRouter()

  return (
    <Suspense fallback={<StaffMessagesFallback />}>
      <ChatView
        role="staff"
        onNavigateRoom={() => {
          router.push('/staff/schedule')
        }}
        onNavigateContract={() => {
          router.push('/staff/schedule')
        }}
      />
    </Suspense>
  )
}

