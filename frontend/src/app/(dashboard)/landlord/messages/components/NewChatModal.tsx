'use client'

import React, { useState, useMemo } from 'react'
import { X, ArrowRight, User, Loader2, AlertCircle } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { ContactItem } from '@/services/message.service'
import { SearchInput, Button } from '@/components/ui'
import { getAvatarBg } from '../utils'

interface NewChatModalProps {
  isOpen: boolean
  onClose: () => void
  contacts: ContactItem[]
  isCreatingChat: boolean
  onSelectContact: (contact: ContactItem) => void
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  contacts,
  isCreatingChat,
  onSelectContact,
}) => {
  const t = useTranslations('landlord')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCloseModalConfirm, setShowCloseModalConfirm] = useState(false)

  const filteredContacts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return contacts
    return contacts.filter(
      c =>
        c.fullName.toLowerCase().includes(q) ||
        (c.roomName && c.roomName.toLowerCase().includes(q)) ||
        (c.phoneNumber && c.phoneNumber.includes(q)),
    )
  }, [contacts, searchTerm])

  const handleAttemptClose = () => {
    if (searchTerm.trim()) {
      setShowCloseModalConfirm(true)
    } else {
      setSearchTerm('')
      onClose()
    }
  }

  const handleConfirmDiscard = () => {
    setShowCloseModalConfirm(false)
    setSearchTerm('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        onMouseDown={e => {
          if (e.target === e.currentTarget) handleAttemptClose()
        }}
      >
        <div className="bg-card rounded-3xl max-w-md w-full shadow-2xl border border-line overflow-hidden flex flex-col max-h-[85vh]">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-foreground">
                {t('landlordMessagesNewModalTitle')}
              </h3>
              <p className="text-xs text-muted mt-0.5">{t('landlordMessagesNewModalSub')}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={handleAttemptClose}>
              <X />
            </Button>
          </div>

          {/* Search Box */}
          <div className="p-4 border-b border-line bg-surface/50">
            <SearchInput
              placeholder={t('landlordMessagesNewModalSearch')}
              value={searchTerm}
              onChange={setSearchTerm}
              className="py-2 text-xs font-semibold bg-card border-line rounded-xl"
            />
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 divide-y divide-zinc-50">
            {isCreatingChat ? (
              <div className="p-8 text-center text-xs font-bold text-muted flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>{t('landlordMessagesOpeningChat')}</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-muted space-y-1">
                <User className="w-8 h-8 mx-auto text-zinc-300 stroke-1" />
                <p>{t('landlordMessagesNoContactsTitle')}</p>
                <p className="text-[10px] text-muted">{t('landlordMessagesNoContactsDesc')}</p>
              </div>
            ) : (
              filteredContacts.map((contact, contactIdx) => (
                <div
                  key={`contact-${contact.id}-${contactIdx}`}
                  onClick={() => {
                    setSearchTerm('')
                    onSelectContact(contact)
                  }}
                  className="p-3 mb-2 hover:bg-card-hover rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl ${getAvatarBg(
                        contact.id,
                      )} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs`}
                    >
                      {contact.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-2">
                        <h4 className="font-extrabold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                          {contact.fullName}
                        </h4>
                        {contact.roomName && (
                          <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-success-soft text-success border border-success-subtle shrink-0">
                            {contact.roomName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted font-medium truncate mt-0.5">
                        {contact.phoneNumber || t('landlordDepositsNoPhoneShort')} •{' '}
                        {contact.boardingHouseName || t('landlordMessagesDefaultBuilding')}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="group-hover:text-primary group-hover:bg-primary/10 shrink-0"
                  >
                    <ArrowRight />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal when Closing Form with Unsaved Inputs (Rule 10) */}
      {showCloseModalConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-line space-y-4">
            <div className="flex items-center gap-3 text-warning">
              <div className="p-2 bg-warning-soft rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-foreground">
                {t('landlordMessagesConfirmCloseTitle')}
              </h4>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {t('landlordMessagesConfirmCloseDesc')}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowCloseModalConfirm(false)}
              >
                {t('landlordMessagesConfirmCloseKeep')}
              </Button>
              <Button variant="danger" onClick={handleConfirmDiscard}>
                {t('landlordMessagesConfirmCloseDiscard')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

