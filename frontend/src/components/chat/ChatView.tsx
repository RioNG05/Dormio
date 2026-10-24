/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Phone,
  Info,
  CheckCheck,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Download,
  File,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  ConversationItem,
  ContactItem,
  getOrCreateConversation,
  sendMessage,
} from '@/services/message.service'
import { useChatSession } from '@/hooks'
import { Button } from '@/components/ui'
import { getAvatarBg, formatMessageTime, appendOrUpdateMessage } from './utils'
import { ChatSidebar } from './ChatSidebar'
import { ChatDrawer } from './ChatDrawer'
import { ChatInputBar } from './ChatInputBar'
import { QuickReplyPills } from './QuickReplyPills'
import { NewChatModal } from './NewChatModal'
import { ImageLightboxModal } from './ImageLightboxModal'

export interface ChatViewProps {
  role?: 'landlord' | 'tenant' | 'staff' | 'public'
  onNavigateRoom?: (roomName?: string | null) => void
  onNavigateContract?: (roomName?: string | null) => void
  onNavigateInvoice?: () => void
  onNavigateListing?: () => void
  customQuickReplies?: string[]
}

export const ChatView: React.FC<ChatViewProps> = ({
  role = 'landlord',
  onNavigateRoom,
  onNavigateContract,
  onNavigateInvoice,
  onNavigateListing,
  customQuickReplies,
}) => {
  const { user, activeBuilding } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const isLandlord = role === 'landlord'
  const basePath = useMemo(() => {
    if (role === 'landlord') return '/landlord/messages'
    if (role === 'staff') return '/staff/messages'
    if (role === 'public') return '/messages'
    return '/tenant/messages'
  }, [role])

  const urlConversationId = searchParams.get('conversationId') || searchParams.get('id') || ''
  const urlRoom = searchParams.get('room') || searchParams.get('search') || ''
  const urlTenant = searchParams.get('tenant') || ''
  const urlUserId = searchParams.get('userId') || searchParams.get('participantId') || ''
  const urlInvId = searchParams.get('invId') || ''
  const urlAmount = searchParams.get('amount') || ''
  const urlPeriod = searchParams.get('period') || ''
  const autoSend = searchParams.get('autoSend') === 'true'
  const urlType = searchParams.get('type') || ''
  const urlDepId = searchParams.get('depId') || ''

  const {
    isMounted,
    conversations,
    setConversations,
    contacts,
    activeChat,
    setActiveChat,
    selectConversation,
    messages,
    setMessages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    inputMessage,
    setInputMessage,
    pendingAttachments,
    removePendingAttachment,
    handleFileUpload,
    handleSendMessage,
    activeChatMedia,
    messagesEndRef,
    fileInputRef,
    imageInputRef,
    conversationsRef,
    contactsRef,
  } = useChatSession({
    currentUserId: user?.id,
    autoSelectFirst: role === 'tenant' || role === 'public',
    autoCreateWithFirstContactIfEmpty: role === 'tenant',
    initialConversationId: urlConversationId,
    defaultAttachmentText: 'Tệp đính kèm',
  })

  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showRightDrawer, setShowRightDrawer] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [isCreatingChat, setIsCreatingChat] = useState(false)

  const activeChatRef = useRef<ConversationItem | null>(null)
  const autoSentKeysRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    activeChatRef.current = activeChat
  }, [activeChat])

  // Preset Smart Quick Replies
  const quickReplies = useMemo(() => {
    if (customQuickReplies && customQuickReplies.length > 0) {
      return customQuickReplies
    }
    if (isLandlord) {
      return [
        'Đã nhận được thanh toán, cảm ơn bạn!',
        'Hạn đóng tiền phòng tháng này là ngày 05 nhé.',
        'Bạn có thể gửi lại ảnh hóa đơn chuyển khoản không?',
        'Bên mình sẽ cho người qua kiểm tra thiết bị trong hôm nay.',
      ]
    }
    if (role === 'staff') {
      return [
        'Bên em đã tiếp nhận thông tin và sẽ kiểm tra ngay ạ.',
        'Em đã kiểm tra thiết bị phòng xong rồi ạ.',
        'Anh/chị cần hỗ trợ thêm vấn đề gì không ạ?',
        'Dạ em đã nhận được thông tin từ quản lý.',
      ]
    }
    return [
      'Em đã chuyển khoản tiền phòng rồi ạ.',
      'Phòng em đang gặp sự cố thiết bị cần hỗ trợ.',
      'Cho em hỏi lịch thu gom rác tuần này với ạ.',
      'Dạ em đã nhận được thông báo.',
    ]
  }, [customQuickReplies, isLandlord])

  // Handle URL Navigation query params & synchronize active conversation
  useEffect(() => {
    if (!isMounted || isLoadingConversations) return

    // Case 1: Direct conversationId in URL
    if (urlConversationId) {
      if (activeChatRef.current?.id !== urlConversationId) {
        const match = conversationsRef.current.find(c => c.id === urlConversationId)
        if (match) {
          activeChatRef.current = match
          setActiveChat(match)
          setMobileShowChat(true)
        }
      }
      return
    }

    // Case 2: External query params (?room=..., ?tenant=..., ?userId=..., autoSend=true)
    if (urlUserId || urlRoom || urlTenant || urlInvId) {
      let isCancelled = false

      async function handleUrlParams() {
        let match: ConversationItem | undefined = undefined

        if (urlUserId) {
          match = conversationsRef.current.find(c => c.participant.id === urlUserId)
          if (!match) {
            try {
              const newConv = await getOrCreateConversation(urlUserId)
              if (newConv && !isCancelled) {
                setConversations(prev => {
                  const updated = [newConv, ...prev.filter(c => c.id !== newConv.id)]
                  conversationsRef.current = updated
                  return updated
                })
                match = newConv
              }
            } catch (e) {
              console.error('Failed to get/create conversation with userId:', e)
            }
          }
        } else if (urlRoom || urlTenant) {
          match = conversationsRef.current.find(c => {
            if (
              urlRoom &&
              (c.participant.roomName?.toLowerCase().includes(urlRoom.toLowerCase()) ||
                c.participant.roomName?.replace('Phòng ', '') === urlRoom)
            )
              return true
            if (urlTenant && c.participant.fullName.toLowerCase().includes(urlTenant.toLowerCase()))
              return true
            return false
          })

          if (!match) {
            const targetContact = contactsRef.current.find(ct => {
              if (
                urlRoom &&
                (ct.roomName?.toLowerCase().includes(urlRoom.toLowerCase()) ||
                  ct.roomName?.replace('Phòng ', '') === urlRoom)
              )
                return true
              if (urlTenant && ct.fullName.toLowerCase().includes(urlTenant.toLowerCase()))
                return true
              return false
            })

            if (targetContact) {
              try {
                const newConv = await getOrCreateConversation(targetContact.id)
                if (newConv && !isCancelled) {
                  setConversations(prev => {
                    const updated = [newConv, ...prev.filter(c => c.id !== newConv.id)]
                    conversationsRef.current = updated
                    return updated
                  })
                  match = newConv
                }
              } catch (e) {
                console.error('Failed to auto-create conversation from contact:', e)
              }
            }
          }
        }

        if (match && !isCancelled) {
          activeChatRef.current = match
          setActiveChat(match)
          setMobileShowChat(true)

          if (autoSend) {
            const autoKey = `${match.id}_${urlInvId || urlDepId || urlType || 'auto'}`
            if (!autoSentKeysRef.current[autoKey]) {
              autoSentKeysRef.current[autoKey] = true
              const roomLabel = match.participant.roomName || 'phòng của bạn'
              if (urlInvId) {
                const formattedAmount = urlAmount
                  ? Number(urlAmount).toLocaleString('vi-VN') + ' ₫'
                  : ''
                const autoMsgContent = `📌 THÔNG BÁO TIỀN PHÒNG (${urlPeriod || 'kỳ này'}):\nPhòng: ${roomLabel}\nSố tiền: ${formattedAmount}\nMã hóa đơn: #${urlInvId}\nVui lòng thanh toán sớm đúng hạn.`
                sendMessage(match.id, { content: autoMsgContent })
                  .then(savedMsg => {
                    setMessages(prev => appendOrUpdateMessage(prev, savedMsg))
                  })
                  .catch(console.error)
              } else if (urlType === 'upgrade' || urlDepId) {
                const formattedAmount = urlAmount
                  ? Number(urlAmount).toLocaleString('vi-VN') + ' ₫'
                  : ''
                const autoMsgContent = `💳 THÔNG BÁO ĐẶT CỌC PHÒNG ${roomLabel}:\nNgười thuê: ${match.participant.fullName}\nSố tiền cọc: ${formattedAmount}`
                sendMessage(match.id, { content: autoMsgContent })
                  .then(savedMsg => {
                    setMessages(prev => appendOrUpdateMessage(prev, savedMsg))
                  })
                  .catch(console.error)
              }
            }
          }

          const newParams = new URLSearchParams()
          newParams.set('conversationId', match.id)
          router.replace(`${basePath}?${newParams.toString()}`, { scroll: false })
        }
      }

      handleUrlParams()
      return () => {
        isCancelled = true
      }
    }

    if (!urlConversationId && !urlUserId && !urlRoom && !urlTenant && !urlInvId) {
      if (activeChatRef.current !== null && isLandlord) {
        activeChatRef.current = null
        setActiveChat(null)
        setMobileShowChat(false)
      }
    }
  }, [
    isMounted,
    isLoadingConversations,
    urlConversationId,
    urlRoom,
    urlTenant,
    urlUserId,
    urlInvId,
    urlAmount,
    urlPeriod,
    autoSend,
    urlType,
    urlDepId,
    router,
    isLandlord,
    setConversations,
    setActiveChat,
    setMessages,
    contactsRef,
    conversationsRef,
  ])

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const p = c.participant
      const matchSearch =
        (p?.fullName && p.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p?.roomName && p.roomName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p?.boardingHouseName &&
          p.boardingHouseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p?.phoneNumber && p.phoneNumber.includes(searchTerm))

      if (!matchSearch) return false

      if (activeTab === 'unread') return c.unreadCount > 0
      if (activeTab === 'read') return c.unreadCount === 0
      if (activeTab === 'tenant') return p.role === 'tenant'
      if (activeTab === 'lead') return p.role !== 'tenant'
      if (activeTab === 'landlord') return p.role === 'landlord'
      if (activeTab === 'staff') return p.role === 'employee'
      return true
    })
  }, [conversations, searchTerm, activeTab])

  // Select conversation and synchronize with URL
  const handleSelectConversation = useCallback(
    (chat: ConversationItem) => {
      if (activeChatRef.current?.id === chat.id) return
      selectConversation(chat)
      setMobileShowChat(true)
      const params = new URLSearchParams()
      params.set('conversationId', chat.id)
      router.replace(`${basePath}?${params.toString()}`, { scroll: false })
    },
    [basePath, router, selectConversation],
  )

  // Start new conversation from contact modal
  const handleSelectContactToChat = async (contact: ContactItem) => {
    setIsCreatingChat(true)
    try {
      const conv = await getOrCreateConversation(contact.id)
      setConversations(prev => {
        const exists = prev.some(c => c.id === conv.id)
        return exists ? prev : [conv, ...prev]
      })
      setShowNewChatModal(false)
      handleSelectConversation(conv)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreatingChat(false)
    }
  }

  const handleBackToList = () => {
    selectConversation(null)
    setMobileShowChat(false)
    router.replace(basePath, { scroll: false })
  }

  const defaultNavigateRoom = (roomName?: string | null) => {
    if (onNavigateRoom) {
      onNavigateRoom(roomName)
      return
    }
    const roomNo = roomName?.replace('Phòng ', '') || ''
    const target = isLandlord
      ? `/landlord/rooms?search=${encodeURIComponent(roomNo)}`
      : `/tenant/bills`
    router.push(target)
  }

  const defaultNavigateContract = (roomName?: string | null) => {
    if (onNavigateContract) {
      onNavigateContract(roomName)
      return
    }
    const roomNo = roomName?.replace('Phòng ', '') || ''
    router.push(`/landlord/contracts?search=${encodeURIComponent(roomNo)}`)
  }

  const defaultNavigateInvoice = () => {
    if (onNavigateInvoice) {
      onNavigateInvoice()
      return
    }
    router.push('/tenant/invoices')
  }

  if (!isMounted) return null

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100dvh-3.5rem)] lg:h-screen bg-card border-y border-line overflow-hidden flex">
      {/* PANE 1: Left Conversation List */}
      <ChatSidebar
        conversations={conversations}
        filteredConversations={filteredConversations}
        activeChatId={activeChat?.id}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={isLoadingConversations}
        onSelectConversation={handleSelectConversation}
        onOpenNewChat={() => setShowNewChatModal(true)}
        mobileShowChat={mobileShowChat}
        hasContacts={contacts.length > 0}
        role={role}
      />

      {/* PANE 2: Center Main Chat Stream */}
      <div
        className={`flex-1 flex-col min-w-0 bg-card ${
          mobileShowChat ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {activeChat ? (
          <>
            {/* Active Chat Header */}
            <div className="p-3 sm:px-5 sm:py-3 border-b border-line flex items-center justify-between gap-2 bg-card z-10 shadow-2xs">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Mobile Back Button */}
                <Button
                  variant="ghost"
                  onClick={handleBackToList}
                  className="lg:hidden -ml-1 shrink-0"
                  title="Quay lại danh sách"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground/90" />
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
                      <span>SĐT: {activeChat.participant.phoneNumber}</span>
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
                  <Button
                    href={`tel:${activeChat.participant.phoneNumber}`}
                    variant="ghost"
                    size="icon-sm"
                    title="Gọi điện"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowRightDrawer(!showRightDrawer)}
                  title="Thông tin chi tiết"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 bg-surface/60">
              {isLoadingMessages ? (
                <div className="p-8 text-center text-xs font-bold text-muted flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Đang tải nội dung tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-muted space-y-2">
                  <MessageSquare className="w-10 h-10 mx-auto text-zinc-300 stroke-1" />
                  <p>Bắt đầu cuộc trò chuyện với {activeChat.participant.fullName}</p>
                  <p className="text-[11px] font-semibold text-muted">
                    Gửi tin nhắn hoặc đính kèm tài liệu để kết nối trực tiếp.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe =
                    msg.senderId === user?.id ||
                    msg.senderId !== activeChat.participant.id ||
                    msg.senderId === 'my-user-id'

                  const isSystemAlert =
                    msg.content.startsWith('📌 THÔNG BÁO') ||
                    msg.content.startsWith('💳 THÔNG BÁO')

                  if (isSystemAlert) {
                    return (
                      <div
                        key={`sys-${msg.id}-${idx}`}
                        className="max-w-md mx-auto my-3 p-3.5 bg-card border border-primary/30 rounded-2xl shadow-2xs text-center space-y-2"
                      >
                        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-primary">
                          <Sparkles className="w-4 h-4" /> THÔNG BÁO HỆ THỐNG
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
                        className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                          isMe
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
                                    onClick={() => setPreviewImage(att.url)}
                                    className="cursor-pointer rounded-xl overflow-hidden border border-black/10 max-w-xs hover:opacity-95 transition-opacity"
                                  >
                                    <img
                                      src={att.url}
                                      alt="Attachment"
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
                                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-colors ${
                                    isMe
                                      ? 'bg-white/20 text-white hover:bg-white/30'
                                      : 'bg-card-hover text-foreground hover:bg-line'
                                  }`}
                                >
                                  <File className="w-4 h-4 shrink-0" />
                                  <span className="truncate flex-1">
                                    {att.url.split('/').pop() || 'Tệp đính kèm'}
                                  </span>
                                  <Download className="w-3.5 h-3.5 shrink-0" />
                                </a>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex items-center gap-1 text-[10px] font-bold text-muted`}
                      >
                        <span>{formatMessageTime(msg.sentAt)}</span>
                        {isMe && (
                          <span title={msg.readAt ? 'Đã xem' : 'Đã gửi'}>
                            <CheckCheck
                              className={`w-3 h-3 ${
                                msg.readAt ? 'text-primary' : 'text-zinc-300'
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
            <QuickReplyPills
              replies={quickReplies}
              onSelect={reply => handleSendMessage(reply)}
              disabled={isSending}
              label="Gợi ý trả lời nhanh"
            />

            {/* Message Input Bar */}
            <ChatInputBar
              inputMessage={inputMessage}
              onInputChange={setInputMessage}
              onSendMessage={() => handleSendMessage()}
              isSending={isSending}
              pendingAttachments={pendingAttachments}
              onRemovePendingAttachment={removePendingAttachment}
              onFileUpload={handleFileUpload}
              fileInputRef={fileInputRef}
              imageInputRef={imageInputRef}
              placeholder={`Nhập tin nhắn tới ${
                activeChat.participant.roomName || activeChat.participant.fullName
              }...`}
              attachTooltip="Đính kèm tệp tài liệu"
              imageTooltip="Gửi hình ảnh"
              sendBtnText="Gửi"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <p className="text-sm font-medium text-muted">
              Chọn một cuộc trò chuyện từ danh sách để bắt đầu nhắn tin.
            </p>
          </div>
        )}
      </div>

      {/* PANE 3: Right Contextual Detail Drawer */}
      {activeChat && (
        <ChatDrawer
          isOpen={showRightDrawer}
          onClose={() => setShowRightDrawer(false)}
          activeChat={activeChat}
          activeBuildingName={activeBuilding?.name}
          activeChatMedia={activeChatMedia}
          onPreviewImage={setPreviewImage}
          role={role}
          onNavigateRoom={defaultNavigateRoom}
          onNavigateContract={defaultNavigateContract}
          onNavigateInvoice={defaultNavigateInvoice}
        />
      )}

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        contacts={contacts}
        isCreatingChat={isCreatingChat}
        onSelectContact={handleSelectContactToChat}
      />

      {/* Image Preview Lightbox Modal */}
      <ImageLightboxModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  )
}
