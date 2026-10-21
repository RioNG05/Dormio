'use client'

import React from 'react'
import { Plus, Loader2, MessageSquare } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { ConversationItem } from '@/services/message.service'
import { SearchInput, Button, ChipGroup } from '@/components/ui'
import { getAvatarBg, formatConversationTime } from '../utils'

export type ConversationTab = 'all' | 'unread' | 'read' | 'tenant' | 'lead'

interface ConversationListProps {
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
}

export const ConversationList: React.FC<ConversationListProps> = ({
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
}) => {
  const t = useTranslations('landlord')

  return (
    <div
      className={`w-full lg:w-96 border-r border-line flex-col bg-surface/50 shrink-0 ${mobileShowChat ? 'hidden lg:flex' : 'flex'
        }`}
    >
      {/* Top Search & Filter Tabs */}
      <div className="p-3.5 border-b border-line space-y-3 bg-card">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder={t('landlordMessagesSearchPlaceholder')}
            value={searchTerm}
            onChange={onSearchChange}
            containerClassName="flex-1"
          />
          <Button
            size="icon-sm"
            variant="primary"
            onClick={onOpenNewChat}
            title={t('landlordMessagesTooltipNewChat')}
            className="shrink-0"
          >
            <Plus />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="py-0.5">
          <ChipGroup<ConversationTab>
            value={activeTab}
            onChange={onTabChange}
            scrollable
            size="sm"
            options={[
              {
                value: 'all',
                label: t('landlordMessagesTabAll'),
                count: conversations.length,
                variant: 'default',
              },
              {
                value: 'unread',
                label: t('landlordMessagesTabUnread'),
                count: conversations.filter(c => c.unreadCount > 0).length,
                variant: 'warning',
              },
              {
                value: 'read',
                label: t('landlordMessagesTabRead'),
                count: conversations.filter(c => c.unreadCount === 0).length,
                variant: 'neutral',
              },
              {
                value: 'tenant',
                label: t('landlordMessagesTabTenant'),
                count: conversations.filter(c => c.participant.role === 'tenant').length,
                variant: 'info',
              },
              {
                value: 'lead',
                label: t('landlordMessagesTabLead'),
                count: conversations.filter(c => c.participant.role !== 'tenant').length,
                variant: 'purple',
              },
            ]}
          />
        </div>
      </div>

      {/* Conversation List Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-line">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-bold text-muted flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>{t('landlordMessagesLoadingConversations')}</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-muted space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-zinc-300 stroke-1" />
            <p>{t('landlordMessagesEmptyConversations')}</p>
            {hasContacts && (
              <Button
                variant="primary"
                onClick={onOpenNewChat}
                leftIcon={<Plus />}
                className="mt-2"
              >
                {t('landlordMessagesBtnStartChat')}
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((chat, chatIdx) => {
            const isSelected = activeChatId === chat.id
            const p = chat.participant
            const avatarBg = getAvatarBg(p.id || p.fullName)
            const isTenant = p.role === 'tenant'

            return (
              <div
                key={`conv-${chat.id}-${chatIdx}`}
                onClick={() => onSelectConversation(chat)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${isSelected
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
                      className={`text-[10px] font-bold shrink-0 ${chat.unreadCount > 0 ? 'text-primary' : 'text-muted'
                        }`}
                    >
                      {chat.lastMessage
                        ? formatConversationTime(chat.lastMessage.sentAt)
                        : formatConversationTime(chat.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-foreground/90 truncate">
                      {p.fullName}
                    </span>
                    {isTenant ? (
                      <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-success-soft text-success border border-success-subtle shrink-0">
                        {t('landlordMessagesRoleTenant')}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-info-soft text-info border border-info-subtle shrink-0">
                        {t('landlordMessagesRoleGuest')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${chat.unreadCount > 0
                        ? 'font-extrabold text-foreground'
                        : 'font-medium text-muted'
                        }`}
                    >
                      {chat.lastMessage?.content || t('landlordMessagesNoMessageYet')}
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

