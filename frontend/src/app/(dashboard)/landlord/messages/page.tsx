'use client'

import React, { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ChatView } from '@/components/chat'

function LandlordMessagesFallback() {
  return (
    <div className="p-8 text-center text-xs font-bold text-muted">
      Đang tải tin nhắn...
    </div>
  )
}

export default function LandlordMessagesPage() {
  const router = useRouter()

  return (
    <Suspense fallback={<LandlordMessagesFallback />}>
      <ChatView
        role="landlord"
        onNavigateRoom={roomName => {
          const roomNo = roomName?.replace('Phòng ', '') || ''
          router.push(`/landlord/rooms?search=${encodeURIComponent(roomNo)}`)
        }}
        onNavigateContract={roomName => {
          const roomNo = roomName?.replace('Phòng ', '') || ''
          router.push(`/landlord/contracts?search=${encodeURIComponent(roomNo)}`)
        }}
      />
    </Suspense>
  )
}
