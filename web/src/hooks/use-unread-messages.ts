'use client'

import { useState, useEffect, useCallback } from 'react'
import { getConversations } from '@/services/message.service'

export const MESSAGES_UPDATED_EVENT = 'dormio_messages_updated'

/**
 * Dispatches a global event notifying all listeners that messages have been read or updated.
 */
export function dispatchMessagesUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MESSAGES_UPDATED_EVENT))
  }
}

/**
 * Hook to retrieve and reactively observe the total count of unread messages for the logged-in user.
 */
export function useUnreadMessages(enabled: boolean = true) {
  const [unreadCount, setUnreadCount] = useState<number>(0)

  const fetchUnreadCount = useCallback(async () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setUnreadCount(0)
      return
    }

    try {
      const convs = await getConversations()
      const total = convs.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)
      setUnreadCount(total)
    } catch {
      // Ignore background fetch errors (e.g. offline, rate limit)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    fetchUnreadCount()

    // Listen to custom updates dispatched from chat pages or user interactions
    const handleUpdated = () => {
      fetchUnreadCount()
    }
    window.addEventListener(MESSAGES_UPDATED_EVENT, handleUpdated)

    // Refresh when user refocuses window
    const handleFocus = () => {
      fetchUnreadCount()
    }
    window.addEventListener('focus', handleFocus)

    // Background interval poll every 15 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 15000)

    return () => {
      window.removeEventListener(MESSAGES_UPDATED_EVENT, handleUpdated)
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [enabled, fetchUnreadCount])

  return { unreadCount, refreshUnreadCount: fetchUnreadCount }
}

