'use client'

import React from 'react'
import {
  Send,
  Paperclip,
  ImageIcon,
  Phone,
  Info,
  CheckCheck,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Download,
  File,
  X,
} from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { ConversationItem, MessageItem } from '@/services/message.service'
import { TextInput, Button } from '@/components/ui'
import { getAvatarBg, formatMessageTime } from '../utils'

interface ChatStreamProps {
  activeChat: ConversationItem | null
  messages: MessageItem[]
  isLoadingMessages: boolean
  isSending: boolean
  currentUserId?: string
  quickReplies: string[]
  pendingAttachments: { type: 'image' | 'file'; url: string; name: string; sizeBytes: number }[]
  onRemovePendingAttachment: (index: number) => void
  inputMessage: string
  onInputChange: (val: string) => void
  onSendMessage: (textToSend?: string) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => void
  onPreviewImage: (url: string) => void
  onToggleRightDrawer: () => void
  onBackToList: () => void
  mobileShowChat: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  imageInputRef: React.RefObject<HTMLInputElement | null>
  onNavigateContract: (roomName?: string | null) => void
}

export const ChatStream: React.FC<ChatStreamProps> = ({
  activeChat,
  messages,
  isLoadingMessages,
  isSending,
  currentUserId,
  quickReplies,
  pendingAttachments,
  onRemovePendingAttachment,
  inputMessage,
  onInputChange,
  onSendMessage,
  onFileUpload,
  onPreviewImage,
  onToggleRightDrawer,
  onBackToList,
  mobileShowChat,
  messagesEndRef,
  fileInputRef,
  imageInputRef,
}) => {
  const t = useTranslations('landlord')

  return (
    <div
      className={`flex-1 flex-col min-w-0 bg-card ${mobileShowChat ? 'flex' : 'hidden lg:flex'}`}
    >
      {activeChat ? (
        <>
          {/* Active Chat Header */}
          <div className="p-3 sm:px-5 sm:py-3 border-b border-line flex items-center justify-between gap-2 bg-card z-10 shadow-2xs">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Mobile Back Button */}
              <Button
                variant="success"
                onClick={onBackToList}
                className="lg:hidden -ml-1 shrink-0"
                title={t('landlordMessagesTooltipBackToList')}
              >
                <ArrowLeft className="text-foreground/90" />
              </Button>

              <div className="relative shrink-0">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${getAvatarBg(
                    activeChat.participant.id || activeChat.participant.fullName,
                  )} text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-2xs`}
                >
                  {activeChat.participant.fullName.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold text-muted truncate">
                    {activeChat.participant.fullName}
                  </span>
                  <h2 className="font-black text-xs sm:text-sm text-foreground truncate shrink-0">
                    • {activeChat.participant.roomName || activeChat.participant.fullName}
                  </h2>
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-muted truncate">
                  {activeChat.participant.phoneNumber && (
                    <span>
                      {t('landlordMessagesPhonePrefix')} {activeChat.participant.phoneNumber}
                    </span>
                  )}
                  {activeChat.participant.boardingHouseName && (
                    <span className="hidden sm:inline">
                      • {activeChat.participant.boardingHouseName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Top Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {activeChat.participant.phoneNumber && (
                <a href={`tel:${activeChat.participant.phoneNumber}`}>
                  <Button
                    variant="success"
                    size="icon-sm"
                    title={t('landlordMessagesTooltipCall')}
                  >
                    <Phone />
                  </Button>
                </a>
              )}
              <Button
                variant="accent"
                size="icon-sm"
                onClick={onToggleRightDrawer}
                title={t('landlordMessagesTooltipInfo')}
              >
                <Info />
              </Button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 bg-surface/60">
            {isLoadingMessages ? (
              <div className="p-8 text-center text-xs font-bold text-muted flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>{t('landlordMessagesLoadingMessages')}</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-muted space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-zinc-300 stroke-1" />
                <p>{t('landlordMessagesEmptyChatTitle')}</p>
                <p className="text-[11px] font-semibold text-muted">
                  {t('landlordMessagesEmptyChatDesc')}
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe =
                  msg.senderId === currentUserId || msg.senderId !== activeChat.participant.id
                const isSystemAlert =
                  msg.content.startsWith('📌 THÔNG BÁO') || msg.content.startsWith('💳 THÔNG BÁO')

                if (isSystemAlert) {
                  return (
                    <div
                      key={`sys-${msg.id}-${idx}`}
                      className="max-w-md mx-auto my-3 p-3.5 bg-card border border-primary/30 rounded-2xl shadow-2xs text-center space-y-2"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-primary">
                        <Sparkles className="w-4 h-4" /> {t('landlordMessagesSystemNoticeBadge')}
                      </div>
                      <p className="text-xs text-foreground/90 font-semibold leading-relaxed">
                        {msg.content}
                      </p>
                      <div className="text-[10px] font-bold text-muted">
                        {formatMessageTime(msg.sentAt)}
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={`msg-${msg.id}-${idx}`}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${isMe
                        ? 'bg-primary text-white rounded-br-xs font-medium'
                        : 'bg-card border border-line text-foreground rounded-bl-xs font-medium'
                        }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                      {/* Attachments within bubble */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {msg.attachments.map((att, attIdx) => {
                            if (att.type === 'image') {
                              return (
                                <div
                                  key={`att-img-${att.id || att.url}-${attIdx}`}
                                  onClick={() => onPreviewImage(att.url)}
                                  className="cursor-pointer rounded-xl overflow-hidden border border-black/10 max-w-xs hover:opacity-95 transition-opacity"
                                >
                                  <img
                                    src={att.url}
                                    alt={t('landlordMessagesAttachmentAlt')}
                                    className="w-full max-h-60 object-cover"
                                  />
                                </div>
                              )
                            }
                            return (
                              <a
                                key={`att-file-${att.id || att.url}-${attIdx}`}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-colors ${isMe
                                  ? 'bg-white/20 text-white hover:bg-white/30'
                                  : 'bg-card-hover text-foreground hover:bg-line'
                                  }`}
                              >
                                <File className="w-4 h-4 shrink-0" />
                                <span className="truncate flex-1">
                                  {att.url.split('/').pop() ||
                                    t('landlordMessagesDefaultAttachment')}
                                </span>
                                <Download className="w-3.5 h-3.5 shrink-0" />
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-1 text-[10px] font-bold ${isMe ? 'text-muted' : 'text-muted'
                        }`}
                    >
                      <span>{formatMessageTime(msg.sentAt)}</span>
                      {isMe && (
                        <span
                          title={
                            msg.readAt
                              ? t('landlordMessagesStatusSeen')
                              : t('landlordMessagesStatusSent')
                          }
                        >
                          <CheckCheck
                            className={`w-3 h-3 ${msg.readAt ? 'text-primary' : 'text-zinc-300'
                              }`}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Smart Quick Reply Chips */}
          <div className="px-4 py-2 bg-card-hover/80 border-t border-line flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <span className="text-[10px] font-black text-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              {t('landlordMessagesQuickRepliesTitle')}:
            </span>
            {quickReplies.map((reply, idx) => (
              <Button
                key={idx}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSendMessage(reply)}
                disabled={isSending}
                className="shrink-0"
              >
                {reply}
              </Button>
            ))}
          </div>

          {/* Pending Attachments Preview */}
          {pendingAttachments.length > 0 && (
            <div className="px-4 py-2 bg-surface border-t border-line flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-extrabold text-muted uppercase shrink-0">
                {t('landlordMessagesAttachmentsCount').replace(
                  '{count}',
                  String(pendingAttachments.length),
                )}
              </span>
              {pendingAttachments.map((att, index) => (
                <div
                  key={index}
                  className="relative group bg-card border border-line rounded-xl p-1.5 flex items-center gap-2 text-xs shrink-0"
                >
                  {att.type === 'image' ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <File className="w-5 h-5 text-primary" />
                  )}
                  <span className="max-w-[120px] truncate font-semibold text-foreground/90">
                    {att.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemovePendingAttachment(index)}
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Message Input Bar */}
          <div className="p-3 sm:p-4 bg-card border-t border-line">
            <form
              onSubmit={e => {
                e.preventDefault()
                onSendMessage()
              }}
              className="flex items-center gap-2"
            >
              {/* Hidden File Inputs */}
              <TextInput
                type="file"
                ref={fileInputRef}
                containerClassName="hidden"
                className="hidden"
                onChange={e => onFileUpload(e, 'file')}
              />
              <TextInput
                type="file"
                accept="image/*"
                ref={imageInputRef}
                containerClassName="hidden"
                className="hidden"
                onChange={e => onFileUpload(e, 'image')}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => fileInputRef.current?.click()}
                title={t('landlordMessagesTooltipAttachFile')}
              >
                <Paperclip />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => imageInputRef.current?.click()}
                title={t('landlordMessagesTooltipSendImage')}
              >
                <ImageIcon />
              </Button>

              <TextInput
                placeholder={t('landlordMessagesComposePlaceholder').replace(
                  '{name}',
                  activeChat.participant.roomName || activeChat.participant.fullName,
                )}
                value={inputMessage}
                onChange={e => onInputChange(e.target.value)}
                disabled={isSending}
                containerClassName="flex-1"
              />

              <Button
                variant="primary"
                size="md"
                disabled={isSending || (!inputMessage.trim() && pendingAttachments.length === 0)}
                isLoading={isSending}
                rightIcon={<Send />}
                className="shrink-0"
              >
                {t('landlordMessagesSendBtn')}
              </Button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="text-sm font-medium text-muted">{t('landlordMessagesSelectPrompt')}</p>
        </div>
      )}
    </div>
  )
}
