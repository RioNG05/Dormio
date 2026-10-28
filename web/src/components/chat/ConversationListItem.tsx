'use client'

import React from 'react'
import { ConversationItem } from '@/services/message.service'
import {
  getAvatarBg,
  formatDisplayName,
  formatPhoneDisplay,
  formatConversationTime,
} from './utils'

export interface ConversationListItemProps {
  conversation: ConversationItem
  isSelected: boolean
  onClick: () => void
  locale?: string
  roleLabel?: string
  fallbackName?: string
  noMessageText?: string
  avatarIcon?: React.ReactNode
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  isSelected,
  onClick,
  locale = 'vi',
  roleLabel,
  fallbackName = 'Người dùng',
  noMessageText = 'Chưa có tin nhắn mới',
  avatarIcon,
}) => {
  const p = conversation.participant
  const avatarBg = getAvatarBg(p?.id || p?.fullName || '')
  const initial = p?.fullName ? p.fullName.charAt(0).toUpperCase() : 'U'

  return (
    <div
      onClick={onClick}
      className={`p-3.5 flex items-start gap-3 transition-all cursor-pointer ${
        isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-card-hover'
      }`}
    >
      {/* Avatar with Status Indicator */}
      <div className="relative shrink-0 pt-0.5">
        <div
          className={`w-10 h-10 rounded-2xl ${avatarBg} text-white font-black text-sm flex items-center justify-center shadow-xs`}
        >
          {avatarIcon || initial}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
      </div>

      {/* Info & Last message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-xs sm:text-sm font-black text-foreground truncate">
            {formatDisplayName(p?.fullName, fallbackName)}
          </h3>
          <span className="text-[10px] text-muted shrink-0 font-medium">
            {formatConversationTime(conversation.updatedAt, locale)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          {roleLabel && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-card-hover text-muted border border-line shrink-0">
              {roleLabel}
            </span>
          )}
          {p?.phoneNumber && (
            <span className="text-[10px] text-muted truncate">
              {formatPhoneDisplay(p.phoneNumber)}
            </span>
          )}
        </div>

        <p className="text-xs text-muted truncate font-normal">
          {conversation.lastMessage?.content || noMessageText}
        </p>
      </div>

      {/* Unread Counter Badge */}
      {conversation.unreadCount > 0 && (
        <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-black flex items-center justify-center shrink-0">
          {conversation.unreadCount}
        </span>
      )}
    </div>
  )
}

