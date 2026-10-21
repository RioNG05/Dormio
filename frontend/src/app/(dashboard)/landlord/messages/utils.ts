import { MessageItem } from '@/services/message.service'

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

export function getAvatarBg(str: string): string {
  if (!str) return 'bg-teal-600'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function formatConversationTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  } catch {
    return ''
  }
}

export function appendOrUpdateMessage(list: MessageItem[], newMsg: MessageItem): MessageItem[] {
  const index = list.findIndex(m => m.id === newMsg.id)
  if (index >= 0) {
    const updated = [...list]
    updated[index] = newMsg
    return updated
  }
  return [...list, newMsg]
}

