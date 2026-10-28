import {
  ConversationItem,
  MessageItem,
  ContactItem,
  MessageAttachment,
  ConversationParticipant,
} from '@/services/message.service'

export type {
  ConversationItem,
  MessageItem,
  ContactItem,
  MessageAttachment,
  ConversationParticipant,
}

export interface ChatAttachmentInput {
  type: 'image' | 'file'
  url: string
  name: string
  sizeBytes: number
}

export interface ChatMediaItem {
  id: string
  url: string
  name: string
}

export interface ChatFileMediaItem extends ChatMediaItem {
  size: string
  time: string
}

export interface ChatMediaInfo {
  images: ChatMediaItem[]
  files: ChatFileMediaItem[]
  total: number
}

