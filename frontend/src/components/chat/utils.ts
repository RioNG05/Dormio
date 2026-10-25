import { MessageItem } from '@/services/message.service'
import { ChatMediaInfo } from './types'

export const AVATAR_COLORS = [
  'bg-teal-600',
  'bg-primary',
  'bg-info',
  'bg-indigo-600',
  'bg-success',
  'bg-deposit',
  'bg-warning',
  'bg-danger',
]

/**
 * Returns a consistent avatar background color class for a given string identifier.
 */
export function getAvatarBg(str: string): string {
  if (!str) return 'bg-teal-600'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/**
 * Capitalizes names nicely for display.
 */
export function formatDisplayName(name?: string | null, fallback = ''): string {
  if (!name) return fallback
  return name
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Formats a phone number for display with spacing (e.g. 0912 345 678).
 */
export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

/**
 * Formats message timestamp to HH:mm.
 */
export function formatMessageTime(isoString: string, locale = 'vi'): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString(locale === 'en' ? 'en-US' : 'vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * Formats conversation list item timestamp (HH:mm if today, DD/MM otherwise).
 */
export function formatConversationTime(isoString?: string | null, locale = 'vi'): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString(locale === 'en' ? 'en-US' : 'vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * Inserts or updates a message in an existing message list immutably.
 */
export function appendOrUpdateMessage(list: MessageItem[], newMsg: MessageItem): MessageItem[] {
  const index = list.findIndex(m => m.id === newMsg.id)
  if (index >= 0) {
    const updated = [...list]
    updated[index] = newMsg
    return updated
  }
  return [...list, newMsg]
}

/**
 * Extracts and aggregates all images and file attachments from messages into a structured object.
 */
export function extractChatMedia(messages: MessageItem[], locale = 'vi'): ChatMediaInfo {
  const images: { id: string; url: string; name: string }[] = []
  const files: { id: string; url: string; name: string; size: string; time: string }[] = []

  messages.forEach(m => {
    if (m.attachments && Array.isArray(m.attachments)) {
      m.attachments.forEach(att => {
        if (att.type === 'image') {
          images.push({
            id: att.id || att.url,
            url: att.url,
            name: att.url.split('/').pop() || 'image.png',
          })
        } else {
          const kb = Math.round((att.sizeBytes || 0) / 1024)
          const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
          files.push({
            id: att.id || att.url,
            url: att.url,
            name: att.url.split('/').pop() || 'file',
            size: sizeStr,
            time: formatConversationTime(m.sentAt, locale),
          })
        }
      })
    }
  })

  return { images, files, total: images.length + files.length }
}

