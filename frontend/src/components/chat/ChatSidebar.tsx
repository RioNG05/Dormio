'use client'

import React from 'react'
import { Plus, Loader2, MessageSquare } from 'lucide-react'
import { ConversationItem } from '@/services/message.service'
import { SearchInput, Button, ChipGroup } from '@/components/ui'
import { getAvatarBg, formatConversationTime } from './utils'

export type ConversationTab = string

export interface ChatSidebarProps {
  conversations: ConversationItem[]
  filteredConversations: ConversationItem[]
  activeChatId?: string
  activeTab: ConversationTab
  onTabChange: (tab: ConversationTab) => void
  searchTerm: string
  onSearchChange: (value: string) => void
  isLoading: boolean
  onSelectConversation: (chat: ConversationItem) => void
  onOpenNewChat: () => void
  mobileShowChat: boolean
  hasContacts: boolean
  role?: 'landlord' | 'tenant' | 'staff'
  locale?: string
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  filteredConversations,
  activeChatId,
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  isLoading,
  onSelectConversation,
  onOpenNewChat,
  mobileShowChat,
  hasContacts,
  role = 'landlord',
  locale = 'vi',
}) => {
  const isLandlord = role === 'landlord'

  const tabOptions = isLandlord
    ? [
        {
          value: 'all',
          label: 'Tất cả',
          count: conversations.length,
          variant: 'default' as const,
        },
        {
          value: 'unread',
          label: 'Chưa đọc',
          count: conversations.filter(c => c.unreadCount > 0).length,
          variant: 'warning' as const,
        },
        {
          value: 'read',
          label: 'Đã đọc',
          count: conversations.filter(c => c.unreadCount === 0).length,
          variant: 'neutral' as const,
        },
        {
          value: 'tenant',
          label: 'Khách thuê',
          count: conversations.filter(c => c.participant.role === 'tenant').length,
          variant: 'info' as const,
        },
        {
          value: 'lead',
          label: 'Khách xem phòng',
          count: conversations.filter(c => c.participant.role !== 'tenant').length,
          variant: 'purple' as const,
        },
      ]
    : role === 'staff'
    ? [
        {
          value: 'all',
          label: 'Tất cả',
          count: conversations.length,
          variant: 'default' as const,
        },
        {
          value: 'unread',
          label: 'Chưa đọc',
          count: conversations.filter(c => c.unreadCount > 0).length,
          variant: 'warning' as const,
        },
        {
          value: 'landlord',
          label: 'Chủ nhà',
          count: conversations.filter(c => c.participant.role === 'landlord').length,
          variant: 'info' as const,
        },
        {
          value: 'tenant',
          label: 'Khách thuê',
          count: conversations.filter(c => c.participant.role === 'tenant').length,
          variant: 'purple' as const,
        },
        {
          value: 'staff',
          label: 'Đồng nghiệp',
          count: conversations.filter(c => c.participant.role === 'employee').length,
          variant: 'neutral' as const,
        },
      ]
    : [
        {
          value: 'all',
          label: 'Tất cả',
          count: conversations.length,
          variant: 'default' as const,
        },
        {
          value: 'unread',
          label: 'Chưa đọc',
          count: conversations.filter(c => c.unreadCount > 0).length,
          variant: 'warning' as const,
        },
        {
          value: 'read',
          label: 'Đã đọc',
          count: conversations.filter(c => c.unreadCount === 0).length,
          variant: 'neutral' as const,
        },
        {
          value: 'landlord',
          label: 'Chủ nhà',
          count: conversations.filter(c => c.participant.role === 'landlord').length,
          variant: 'info' as const,
        },
        {
          value: 'staff',
          label: 'Nhân viên',
          count: conversations.filter(c => c.participant.role === 'employee').length,
          variant: 'purple' as const,
        },
      ]

  const getRoleBadge = (participantRole?: string) => {
    if (participantRole === 'landlord') {
      return (
        <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-success-soft text-success border border-success-subtle shrink-0">
          Chủ nhà
        </span>
      )
    }
    if (participantRole === 'employee') {
      return (
        <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-purple-soft text-purple-600 border border-purple-subtle shrink-0">
          Nhân viên
        </span>
      )
    }
    if (participantRole === 'tenant') {
      return (
        <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-success-soft text-success border border-success-subtle shrink-0">
          Khách thuê
        </span>
      )
    }
    return (
      <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-info-soft text-info border border-info-subtle shrink-0">
        Khách vãng lai
      </span>
    )
  }

  return (
    <div
      className={`w-full lg:w-96 border-r border-line flex flex-col bg-surface/50 shrink-0 ${
        mobileShowChat ? 'hidden lg:flex' : 'flex'
      }`}
    >
      {/* Top Search & Filter Tabs */}
      <div className="p-3.5 border-b border-line space-y-3 bg-card">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Tìm theo tên, số phòng, số điện thoại..."
            value={searchTerm}
            onChange={onSearchChange}
            containerClassName="flex-1"
          />
          <Button
            size="icon-sm"
            onClick={onOpenNewChat}
            title="Bắt đầu cuộc trò chuyện mới"
            className="shrink-0"
          >
            <Plus />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="py-0.5">
          <ChipGroup<string>
            value={activeTab}
            onChange={onTabChange}
            scrollable
            size="sm"
            options={tabOptions}
          />
        </div>
      </div>

      {/* Conversation List Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-line">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-bold text-muted flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Đang tải danh sách cuộc trò chuyện...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-muted space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-zinc-300 stroke-1" />
            <p>Chưa có cuộc trò chuyện nào</p>
            {hasContacts && (
              <Button
                onClick={onOpenNewChat}
                leftIcon={<Plus />}
                className="mt-2"
              >
                Bắt đầu nhắn tin
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((chat, chatIdx) => {
            const isSelected = activeChatId === chat.id
            const p = chat.participant
            const avatarBg = getAvatarBg(p.id || p.fullName)

            return (
              <div
                key={`conv-${chat.id}-${chatIdx}`}
                onClick={() => onSelectConversation(chat)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-l-4 border-l-primary'
                    : 'hover:bg-card-hover'
                }`}
              >
                {/* Avatar with Status */}
                <div className="relative shrink-0 pt-0.5">
                  <div
                    className={`w-10 h-10 rounded-2xl ${avatarBg} text-white font-black text-sm flex items-center justify-center shadow-2xs`}
                  >
                    {p.fullName ? p.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>

                {/* Meta & Last Message */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-xs text-foreground truncate">
                      {p.roomName || p.fullName}
                    </span>
                    <span
                      className={`text-[10px] font-bold shrink-0 ${
                        chat.unreadCount > 0 ? 'text-primary' : 'text-muted'
                      }`}
                    >
                      {chat.lastMessage
                        ? formatConversationTime(chat.lastMessage.sentAt, locale)
                        : formatConversationTime(chat.updatedAt, locale)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-foreground/90 truncate">
                      {p.fullName}
                    </span>
                    {getRoleBadge(p.role)}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        chat.unreadCount > 0
                          ? 'font-extrabold text-foreground'
                          : 'font-medium text-muted'
                      }`}
                    >
                      {chat.lastMessage?.content || 'Chưa có tin nhắn nào'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

