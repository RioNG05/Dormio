'use client'

import React, { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ChatView } from '@/components/chat'

function LandlordMessagesFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
