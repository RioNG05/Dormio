/* eslint-disable @next/next/no-img-element */
'use client'

import React from 'react'
import { Send, Paperclip, ImageIcon, Loader2, File, X } from 'lucide-react'
import { Button, TextInput } from '@/components/ui'
import { ChatAttachmentInput } from './types'

export interface ChatInputBarProps {
  inputMessage: string
  onInputChange: (value: string) => void
  onSendMessage: () => void
  isSending: boolean
  pendingAttachments: ChatAttachmentInput[]
  onRemovePendingAttachment: (index: number) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  imageInputRef: React.RefObject<HTMLInputElement | null>
  placeholder?: string
  attachTooltip?: string
  imageTooltip?: string
  sendBtnText?: string
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputMessage,
  onInputChange,
  onSendMessage,
  isSending,
  pendingAttachments,
  onRemovePendingAttachment,
  onFileUpload,
  fileInputRef,
  imageInputRef,
  placeholder = 'Nhập tin nhắn...',
  attachTooltip = 'Đính kèm tệp',
  imageTooltip = 'Gửi hình ảnh',
  sendBtnText,
}) => {
  const canSend = !isSending && (inputMessage.trim().length > 0 || pendingAttachments.length > 0)

  return (
    <div className="border-t border-line bg-card shrink-0">
      {/* Pending Attachments Strip */}
      {pendingAttachments.length > 0 && (
        <div className="px-3.5 py-2 sm:px-4 bg-surface border-b border-line flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-card border border-line text-xs font-semibold text-foreground/90 shrink-0 shadow-2xs"
            >
              {att.type === 'image' ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className="w-7 h-7 rounded-lg object-cover border border-line"
                />
              ) : (
                <File className="w-4 h-4 text-primary shrink-0" />
              )}
              <span className="max-w-[120px] truncate">{att.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemovePendingAttachment(idx)}
                className="p-0.5 h-auto text-muted hover:text-foreground"
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main Form Bar */}
      <form
        onSubmit={e => {
          e.preventDefault()
          if (canSend) {
            onSendMessage()
          }
        }}
        className="p-2.5 sm:p-3.5 flex items-center gap-2"
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

        <div className="flex items-center gap-1 text-muted shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title={attachTooltip}
            className="p-2"
          >
            <Paperclip />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            title={imageTooltip}
            className="p-2"
          >
            <ImageIcon />
          </Button>
        </div>

        <TextInput
          type="text"
          value={inputMessage}
          onChange={e => onInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={isSending}
          containerClassName="flex-1 space-y-0"
          className="py-2 sm:py-2.5 rounded-xl bg-surface border border-line text-xs sm:text-sm font-medium focus:outline-none focus:border-primary transition-colors"
        />

        <Button
          type="submit"
          size={sendBtnText ? 'md' : undefined}
          disabled={!canSend}
          isLoading={isSending}
          leftIcon={!isSending ? <Send /> : undefined}
          className="shrink-0"
        >
          {sendBtnText && <span className="ml-1 hidden sm:inline">{sendBtnText}</span>}
        </Button>
      </form>
    </div>
  )
}
