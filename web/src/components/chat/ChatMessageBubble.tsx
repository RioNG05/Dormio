/* eslint-disable @next/next/no-img-element */
'use client'

import React from 'react'
import { CheckCheck, File, Download, Sparkles } from 'lucide-react'
import { MessageItem } from '@/services/message.service'
import { formatMessageTime } from './utils'

export interface ChatMessageBubbleProps {
  message: MessageItem
  isMe: boolean
  onPreviewImage: (url: string) => void
  avatarNode?: React.ReactNode
  renderCustomCard?: (message: MessageItem) => React.ReactNode
  locale?: string
  systemBadgeLabel?: string
  fileDownloadLabel?: string
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isMe,
  onPreviewImage,
  avatarNode,
  renderCustomCard,
  locale = 'vi',
  systemBadgeLabel = 'THÔNG BÁO HỆ THỐNG',
  fileDownloadLabel = 'Tệp đính kèm',
}) => {
  const isSystemAlert =
    message.content.startsWith('📌 THÔNG BÁO') || message.content.startsWith('💳 THÔNG BÁO')

  if (isSystemAlert) {
    return (
      <div className="max-w-md mx-auto my-3 p-3.5 bg-card border border-primary/30 rounded-2xl shadow-2xs text-center space-y-2 animate-in fade-in">
        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-primary">
          <Sparkles className="w-4 h-4" /> {systemBadgeLabel}
        </div>
        <p className="text-xs text-foreground/90 font-semibold leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <div className="text-[10px] font-bold text-muted">
          {formatMessageTime(message.sentAt, locale)}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
    >
      {!isMe && avatarNode}

      <div
        className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
          isMe
            ? 'bg-primary text-white rounded-br-xs font-medium shadow-xs'
            : 'bg-card text-foreground border border-line rounded-bl-xs font-medium'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Custom Card Slot (e.g. Unpaid Bill card, Contract notification card) */}
        {renderCustomCard && renderCustomCard(message)}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2.5 space-y-2">
            {message.attachments.map((att, attIdx) => {
              if (att.type === 'image') {
                return (
                  <div
                    key={`att-img-${att.id || attIdx}`}
                    onClick={() => onPreviewImage(att.url)}
                    className="rounded-xl overflow-hidden border border-line max-w-[240px] cursor-pointer group"
                  >
                    <img
                      src={att.url}
                      alt="Attachment"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )
              }
              const kb = Math.round((att.sizeBytes || 0) / 1024)
              const sizeLabel = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`

              return (
                <a
                  key={`att-file-${att.id || attIdx}`}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-colors ${
                    isMe
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-card-hover text-foreground/90 hover:bg-line'
                  }`}
                >
                  <File className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">
                    {att.url.split('/').pop() || fileDownloadLabel} ({sizeLabel})
                  </span>
                  <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
                </a>
              )
            })}
          </div>
        )}

        {/* Timestamp and Read Status */}
        <div
          className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 font-medium ${
            isMe ? 'text-white/80' : 'text-muted'
          }`}
        >
          <span>{formatMessageTime(message.sentAt, locale)}</span>
          {isMe && (
            <CheckCheck
              className={`w-3.5 h-3.5 ${message.readAt ? 'text-white' : 'text-white/50'}`}
            />
          )}
        </div>
      </div>
    </div>
  )
}
