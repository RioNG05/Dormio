'use client'

import React, { useState, useMemo } from 'react'
import { X, ArrowRight, User, Loader2, AlertCircle } from 'lucide-react'
import { ContactItem } from '@/services/message.service'
import { SearchInput, Button, Modal, Text } from '@/components/ui'
import { getAvatarBg } from './utils'

export interface NewChatModalProps {
  isOpen: boolean
  onClose: () => void
  contacts: ContactItem[]
  isCreatingChat: boolean
  onSelectContact: (contact: ContactItem) => void
  title?: string
  subTitle?: string
  searchPlaceholder?: string
  noContactsTitle?: string
  noContactsDesc?: string
  loadingText?: string
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  contacts,
  isCreatingChat,
  onSelectContact,
  title = 'Bắt đầu cuộc trò chuyện mới',
  subTitle = 'Chọn người dùng từ danh bạ để gửi tin nhắn',
  searchPlaceholder = 'Tìm kiếm theo tên, phòng hoặc số điện thoại...',
  noContactsTitle = 'Không tìm thấy người liên hệ',
  noContactsDesc = 'Danh bạ hiện chưa có người liên hệ phù hợp',
  loadingText = 'Đang mở cuộc trò chuyện...',
}) => {
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleAttemptClose} size="md">
        <Modal.Header
          title={title}
          description={subTitle}
          onClose={handleAttemptClose}
        />

        {/* Search Box */}
        <div className="p-4 border-b border-line bg-surface/50">
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={setSearchTerm}
            className="py-2 text-xs font-semibold bg-card border-line rounded-xl"
          />
        </div>

        {/* Contact List */}
        <Modal.Body className="p-2 divide-y divide-zinc-50 max-h-[60vh] overflow-y-auto">
          {isCreatingChat ? (
            <div className="p-8 text-center text-xs font-bold text-muted flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>{loadingText}</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-muted space-y-1">
              <User className="w-8 h-8 mx-auto text-zinc-300 stroke-1" />
              <p>{noContactsTitle}</p>
              <p className="text-[10px] text-muted">{noContactsDesc}</p>
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
                    {contact.fullName ? contact.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Text as="h4" size="xs" weight="extrabold" color="default" className="group-hover:text-primary transition-colors truncate">
                        {contact.fullName}
                      </Text>
                      {contact.roomName && (
                        <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-success-soft text-success border border-success-subtle shrink-0">
                          {contact.roomName}
                        </span>
                      )}
                    </div>
                    <Text size="2xs" color="secondary" className="truncate mt-0.5">
                      {contact.phoneNumber || 'Chưa có SĐT'} •{' '}
                      {contact.boardingHouseName || 'Nhà trọ Dormio'}
                    </Text>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="group-hover:text-primary group-hover:bg-primary/10 shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </Modal.Body>
      </Modal>

      {/* Confirmation Modal when Closing Form with Unsaved Inputs (Rule 10) */}
      <Modal
        isOpen={showCloseModalConfirm}
        onClose={() => setShowCloseModalConfirm(false)}
        size="sm"
      >
        <Modal.Body className="pt-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-warning-soft text-warning flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <Text as="h4" size="sm" weight="extrabold" color="default">
              Xác nhận đóng tìm kiếm
            </Text>
            <Text size="xs" color="secondary" className="leading-relaxed">
              Bạn đang có nội dung tìm kiếm chưa hoàn tất. Bạn có chắc chắn muốn hủy?
            </Text>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex items-center gap-2">
          <Button
            size="md"
            variant="secondary"
            onClick={() => setShowCloseModalConfirm(false)}
            className="flex-1"
          >
            Tiếp tục tìm kiếm
          </Button>
          <Button
            size="md"
            variant="danger"
            onClick={handleConfirmDiscard}
            className="flex-1"
          >
            Hủy thay đổi & Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

