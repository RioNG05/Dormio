'use client'

import React from 'react'
import {
  Building2,
  X,
  Check,
  DoorOpen,
  MoveRight,
  FileText,
  FileImage,
  Eye,
  File,
  ExternalLink,
} from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { ConversationItem } from '@/services/message.service'
import { Button, Chip, Text } from '@/components/ui'
import { getAvatarBg } from '../utils'

interface ChatMediaInfo {
  images: { id: string; url: string; name: string }[]
  files: { id: string; url: string; name: string; size: string; time: string }[]
  total: number
}

interface ContextualDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  activeChat: ConversationItem
  activeBuildingName?: string
  activeChatMedia: ChatMediaInfo
  onPreviewImage: (url: string) => void
  onNavigateRoom: (roomName?: string | null) => void
  onNavigateContract: (roomName?: string | null) => void
}

export const ContextualDetailDrawer: React.FC<ContextualDetailDrawerProps> = ({
  isOpen,
  onClose,
  activeChat,
  activeBuildingName,
  activeChatMedia,
  onPreviewImage,
  onNavigateRoom,
  onNavigateContract,
}) => {
  const t = useTranslations('landlord')

  if (!isOpen) return null

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Right Contextual Tenant & Room Panel */}
      <div className="fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto w-full sm:w-80 lg:w-80 border-l border-line bg-card flex flex-col shrink-0 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-200 shadow-2xl lg:shadow-none">
        {/* Panel Header */}
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-primary" /> {t('landlordMessagesDrawerTitle')}
          </h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {/* Tenant Profile Card */}
          <div className="p-4 bg-surface border border-line rounded-2xl text-center space-y-2">
            <div
              className={`w-14 h-14 rounded-2xl ${getAvatarBg(
                activeChat.participant.id || activeChat.participant.fullName,
              )} text-white font-black text-xl flex items-center justify-center mx-auto shadow-sm`}
            >
              {activeChat.participant.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-black text-sm text-foreground">
                {activeChat.participant.fullName}
              </h4>
              <p className="text-muted text-[11px] font-semibold mt-0.5">
                {activeChat.participant.phoneNumber || t('landlordMessagesNoPhone')}
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Chip variant="success" size="xs" preventHover leftIcon={<Check />}>
                {t('landlordMessagesDormioAccount')}
              </Chip>
            </div>
          </div>

          {/* Room & Building Info */}
          <div className="p-4 bg-card border border-line rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <span className="font-extrabold text-sm text-primary">
                {activeChat.participant.roomName || t('landlordMessagesNoRoom')}
              </span>
              <Chip size="xs" variant="info" preventHover>
                {activeChat.participant.boardingHouseName ||
                  activeBuildingName ||
                  t('landlordMessagesDefaultBuilding')}
              </Chip>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted font-semibold">{t('landlordMessagesRoleLabel')}</span>
                <span className="font-extrabold text-foreground">
                  {activeChat.participant.role === 'tenant'
                    ? t('landlordMessagesRoleTenant')
                    : t('landlordMessagesRoleProspect')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {activeChat.participant.roomName && (
            <div className="space-y-2 pt-1">
              <Button
                fullWidth
                size="md"
                variant="ghost"
                onClick={() => onNavigateRoom(activeChat.participant.roomName)}
                className="justify-between group"
                leftIcon={<DoorOpen />}
                rightIcon={<MoveRight />}
              >
                <Text size="xs" align="left" className="w-full">
                  {t('landlordMessagesViewRoomDetail').replace(
                    '{room}',
                    activeChat.participant.roomName || '',
                  )}
                </Text>
              </Button>

              <Button
                fullWidth
                size="md"
                variant="ghost"
                onClick={() => onNavigateContract(activeChat.participant.roomName)}
                className="justify-between group"
                leftIcon={<FileText />}
                rightIcon={<MoveRight />}
              >
                <Text size="xs" align="left" className="w-full">
                  {t('landlordMessagesViewContract').replace(
                    '{room}',
                    activeChat.participant.roomName || '',
                  )}
                </Text>
              </Button>
            </div>
          )}

          {/* Media & Attachments Storage Section */}
          <div className="p-4 bg-card border border-line rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                <FileImage className="w-4 h-4 text-primary" />{' '}
                {t('landlordMessagesMediaStorageTitle')}
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-card-hover text-muted rounded-md">
                {activeChatMedia.total}
              </span>
            </div>

            {activeChatMedia.total > 0 ? (
              <div className="space-y-3">
                {/* Images Grid */}
                {activeChatMedia.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {activeChatMedia.images.map((img, imgIdx) => (
                      <div
                        key={`drawer-img-${img.id || img.url}-${imgIdx}`}
                        onClick={() => onPreviewImage(img.url)}
                        className="relative aspect-video rounded-xl overflow-hidden border border-line group cursor-pointer bg-card-hover"
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Files List */}
                {activeChatMedia.files.length > 0 && (
                  <div className="space-y-1.5">
                    {activeChatMedia.files.map((file, fileIdx) => (
                      <div
                        key={`drawer-file-${file.id || file.url}-${fileIdx}`}
                        className="p-2 bg-surface border border-line rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-foreground truncate">
                              {file.name}
                            </p>
                            <p className="text-[9px] text-muted font-medium">
                              {file.size} • {file.time}
                            </p>
                          </div>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-line rounded-lg text-muted cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-[11px] font-bold text-muted space-y-1">
                <FileImage className="w-6 h-6 mx-auto text-zinc-300 stroke-1" />
                <p>{t('landlordMessagesNoMedia')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
