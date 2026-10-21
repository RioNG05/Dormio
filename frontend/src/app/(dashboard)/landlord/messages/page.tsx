'use client'

import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import {
  ConversationItem,
  MessageItem,
  ContactItem,
  getConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  markAsRead,
  getContacts,
  initMessagesSocket,
} from '@/services/message.service'
import { dispatchMessagesUpdated } from '@/hooks'
import { appendOrUpdateMessage, formatConversationTime } from './utils'
import {
  ConversationList,
  ConversationTab,
  ChatStream,
  ContextualDetailDrawer,
  NewChatModal,
  ImageLightboxModal,
} from './components'

function MessagesContent() {
  const { user, activeBuilding } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('landlord')

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

  const [isMounted, setIsMounted] = useState(false)
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [activeChat, setActiveChat] = useState<ConversationItem | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])

  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const [activeTab, setActiveTab] = useState<ConversationTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showRightDrawer, setShowRightDrawer] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [isCreatingChat, setIsCreatingChat] = useState(false)

  // Message input state
  const [inputMessage, setInputMessage] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<
    { type: 'image' | 'file'; url: string; name: string; sizeBytes: number }[]
  >([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<any>(null)
  const activeChatRef = useRef<ConversationItem | null>(null)
  const conversationsRef = useRef<ConversationItem[]>([])
  const contactsRef = useRef<ContactItem[]>([])
  const autoSentKeysRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    activeChatRef.current = activeChat
  }, [activeChat])

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  useEffect(() => {
    contactsRef.current = contacts
  }, [contacts])

  // Preset Smart Quick Replies
  const quickReplies = useMemo(
    () => [
      t('landlordMessagesQuick1'),
      t('landlordMessagesQuick2'),
      t('landlordMessagesQuick3'),
      t('landlordMessagesQuick4'),
    ],
    [t],
  )

  // 1. Mount & load initial conversations & contacts
  useEffect(() => {
    setIsMounted(true)

    async function loadInitialData() {
      setIsLoadingConversations(true)
      try {
        const [convList, contactList] = await Promise.all([
          getConversations(),
          getContacts().catch(() => []),
        ])
        setConversations(convList)
        setContacts(contactList)
        conversationsRef.current = convList
        contactsRef.current = contactList

        if (urlConversationId) {
          const match = convList.find(c => c.id === urlConversationId)
          if (match) {
            activeChatRef.current = match
            setActiveChat(match)
            setMobileShowChat(true)
          }
        }
      } catch (error) {
        console.error('Failed to load conversations:', error)
      } finally {
        setIsLoadingConversations(false)
      }
    }

    loadInitialData()
  }, [])

  // 2. Setup WebSocket connection
  useEffect(() => {
    if (!isMounted) return

    const socket = initMessagesSocket()
    if (!socket) return
    socketRef.current = socket

    socket.on('connect', () => {
      if (activeChatRef.current) {
        socket.emit('join_conversation', { conversationId: activeChatRef.current.id })
      }
    })

    socket.on('new_message', (newMsg: MessageItem) => {
      // If message belongs to active chat, append or update it
      if (activeChatRef.current && activeChatRef.current.id === newMsg.conversationId) {
        setMessages(prev => appendOrUpdateMessage(prev, newMsg))
        // Auto mark as read if received in active chat
        if (newMsg.senderId !== user?.id) {
          markAsRead(activeChatRef.current.id)
            .then(() => dispatchMessagesUpdated())
            .catch(() => {})
        }
      }

      // Update conversations list lastMessage & unread count
      setConversations(prev =>
        prev.map(c => {
          if (c.id === newMsg.conversationId) {
            const isActive = activeChatRef.current?.id === c.id
            return {
              ...c,
              lastMessage: newMsg,
              updatedAt: newMsg.sentAt,
              unreadCount: isActive || newMsg.senderId === user?.id ? 0 : c.unreadCount + 1,
            }
          }
          return c
        }),
      )
      dispatchMessagesUpdated()
    })

    socket.on(
      'messages_read',
      ({ conversationId }: { conversationId: string; readerId: string }) => {
        if (activeChatRef.current && activeChatRef.current.id === conversationId) {
          setMessages(prev =>
            prev.map(m => (m.readAt ? m : { ...m, readAt: new Date().toISOString() })),
          )
        }
      },
    )

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [isMounted, user?.id])

  // 3. Switch conversation & join WebSocket room
  useEffect(() => {
    if (!activeChat) {
      setMessages([])
      return
    }

    let isCancelled = false
    setIsLoadingMessages(true)

    if (socketRef.current) {
      socketRef.current.emit('join_conversation', { conversationId: activeChat.id })
    }

    getConversationMessages(activeChat.id)
      .then(msgs => {
        if (!isCancelled) {
          const uniqueMap = new Map<string, MessageItem>()
          msgs.forEach(m => uniqueMap.set(m.id, m))
          setMessages(Array.from(uniqueMap.values()))
        }
      })
      .catch(err => {
        console.error('Failed to load messages:', err)
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingMessages(false)
        }
      })

    // Mark as read on open
    if (activeChat.unreadCount > 0) {
      markAsRead(activeChat.id)
        .then(() => dispatchMessagesUpdated())
        .catch(() => {})
      setConversations(prev =>
        prev.map(c => (c.id === activeChat.id ? { ...c, unreadCount: 0 } : c)),
      )
      dispatchMessagesUpdated()
    }

    return () => {
      isCancelled = true
      if (socketRef.current && activeChat) {
        socketRef.current.emit('leave_conversation', { conversationId: activeChat.id })
      }
    }
  }, [activeChat?.id])

  // 4. Handle URL Navigation query params & synchronize active conversation
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

        // 1. If urlUserId is provided, find or create conversation for this exact user
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
          // 2. Fallback to matching by room or tenant name if urlUserId not provided
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

          // Handle autoSend if present
          if (autoSend) {
            const autoKey = `${match.id}_${urlInvId || urlDepId || urlType || 'auto'}`
            if (!autoSentKeysRef.current[autoKey]) {
              autoSentKeysRef.current[autoKey] = true
              const roomLabel = match.participant.roomName || t('landlordMessagesYourRoom')
              if (urlInvId) {
                const formattedAmount = urlAmount
                  ? Number(urlAmount).toLocaleString('vi-VN') + ' ₫'
                  : ''
                const autoMsgContent = t('landlordMessagesAutoInvoiceNotice')
                  .replace('{period}', urlPeriod || t('landlordMessagesCurrentPeriod'))
                  .replace('{room}', roomLabel)
                  .replace('{amount}', formattedAmount)
                  .replace('{invId}', urlInvId)
                sendMessage(match.id, { content: autoMsgContent })
                  .then(savedMsg => {
                    setMessages(prev => appendOrUpdateMessage(prev, savedMsg))
                  })
                  .catch(console.error)
              } else if (urlType === 'upgrade' || urlDepId) {
                const formattedAmount = urlAmount
                  ? Number(urlAmount).toLocaleString('vi-VN') + ' ₫'
                  : ''
                const autoMsgContent = t('landlordMessagesAutoDepositNotice')
                  .replace('{room}', roomLabel)
                  .replace('{tenant}', match.participant.fullName)
                  .replace('{amount}', formattedAmount)
                sendMessage(match.id, { content: autoMsgContent })
                  .then(savedMsg => {
                    setMessages(prev => appendOrUpdateMessage(prev, savedMsg))
                  })
                  .catch(console.error)
              }
            }
          }

          // Synchronize URL with conversationId
          const newParams = new URLSearchParams()
          newParams.set('conversationId', match.id)
          router.replace(`/landlord/messages?${newParams.toString()}`, { scroll: false })
        }
      }

      handleUrlParams()
      return () => {
        isCancelled = true
      }
    }

    // Case 3: No conversation query in URL -> reset activeChat to null
    if (!urlConversationId && !urlUserId && !urlRoom && !urlTenant && !urlInvId) {
      if (activeChatRef.current !== null) {
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
  ])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChat])

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const p = c.participant
      const matchSearch =
        (p.fullName && p.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.roomName && p.roomName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.phoneNumber && p.phoneNumber.includes(searchTerm))

      if (!matchSearch) return false

      if (activeTab === 'unread') return c.unreadCount > 0
      if (activeTab === 'read') return c.unreadCount === 0
      if (activeTab === 'tenant') return p.role === 'tenant'
      if (activeTab === 'lead') return p.role !== 'tenant'
      return true
    })
  }, [conversations, searchTerm, activeTab])

  // Media files extracted from all messages of the active conversation
  const activeChatMedia = useMemo(() => {
    const images: { id: string; url: string; name: string }[] = []
    const files: { id: string; url: string; name: string; size: string; time: string }[] = []

    messages.forEach(m => {
      if (m.attachments && Array.isArray(m.attachments)) {
        m.attachments.forEach(att => {
          if (att.type === 'image') {
            images.push({
              id: att.id,
              url: att.url,
              name: att.url.split('/').pop() || 'image.png',
            })
          } else {
            const kb = Math.round(att.sizeBytes / 1024)
            const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
            files.push({
              id: att.id,
              url: att.url,
              name: att.url.split('/').pop() || 'file',
              size: sizeStr,
              time: formatConversationTime(m.sentAt),
            })
          }
        })
      }
    })

    return { images, files, total: images.length + files.length }
  }, [messages])

  // Select conversation and synchronize with URL
  const handleSelectConversation = (chat: ConversationItem) => {
    if (activeChatRef.current?.id === chat.id) return
    activeChatRef.current = chat
    setActiveChat(chat)
    setMobileShowChat(true)
    const params = new URLSearchParams()
    params.set('conversationId', chat.id)
    router.replace(`/landlord/messages?${params.toString()}`, { scroll: false })
  }

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputMessage).trim()
    if (!text && pendingAttachments.length === 0) return
    if (!activeChat) return

    setIsSending(true)
    try {
      const payload = {
        content: text || t('landlordMessagesDefaultAttachmentText'),
        attachments: pendingAttachments.map((att, idx) => ({
          type: att.type,
          url: att.url,
          sizeBytes: att.sizeBytes,
          sortOrder: idx,
        })),
      }

      const savedMsg = await sendMessage(activeChat.id, payload)

      setMessages(prev => appendOrUpdateMessage(prev, savedMsg))
      setConversations(prev =>
        prev.map(c =>
          c.id === activeChat.id
            ? { ...c, lastMessage: savedMsg, updatedAt: savedMsg.sentAt, unreadCount: 0 }
            : c,
        ),
      )

      if (textToSend === undefined) {
        setInputMessage('')
      }
      setPendingAttachments([])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  // Handle file uploads (image / document)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = uploadEvent => {
        const url = uploadEvent.target?.result as string
        setPendingAttachments(prev => [
          ...prev,
          {
            type,
            url,
            name: file.name,
            sizeBytes: file.size,
          },
        ])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    e.target.value = ''
  }

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
    activeChatRef.current = null
    setActiveChat(null)
    setMobileShowChat(false)
    router.replace('/landlord/messages', { scroll: false })
  }

  const handleNavigateRoom = (roomName?: string | null) => {
    const roomNo = roomName?.replace('Phòng ', '') || ''
    router.push(`/landlord/rooms?search=${encodeURIComponent(roomNo)}`)
  }

  const handleNavigateContract = (roomName?: string | null) => {
    const roomNo = roomName?.replace('Phòng ', '') || ''
    router.push(`/landlord/contracts?search=${encodeURIComponent(roomNo)}`)
  }

  if (!isMounted) return null

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100dvh-3.5rem)] lg:h-screen bg-card border-y border-line overflow-hidden flex">
      {/* PANE 1: Left Conversation List */}
      <ConversationList
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
      />

      {/* PANE 2: Center Main Chat Stream */}
      <ChatStream
        activeChat={activeChat}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        isSending={isSending}
        currentUserId={user?.id}
        quickReplies={quickReplies}
        pendingAttachments={pendingAttachments}
        onRemovePendingAttachment={index =>
          setPendingAttachments(prev => prev.filter((_, i) => i !== index))
        }
        inputMessage={inputMessage}
        onInputChange={setInputMessage}
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        onPreviewImage={setPreviewImage}
        onToggleRightDrawer={() => setShowRightDrawer(!showRightDrawer)}
        onBackToList={handleBackToList}
        mobileShowChat={mobileShowChat}
        messagesEndRef={messagesEndRef}
        fileInputRef={fileInputRef}
        imageInputRef={imageInputRef}
        onNavigateContract={handleNavigateContract}
      />

      {/* PANE 3: Right Contextual Tenant & Room Panel */}
      {activeChat && (
        <ContextualDetailDrawer
          isOpen={showRightDrawer}
          onClose={() => setShowRightDrawer(false)}
          activeChat={activeChat}
          activeBuildingName={activeBuilding?.name}
          activeChatMedia={activeChatMedia}
          onPreviewImage={setPreviewImage}
          onNavigateRoom={handleNavigateRoom}
          onNavigateContract={handleNavigateContract}
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

function LandlordMessagesFallback() {
  const t = useTranslations('landlord')
  return (
    <div className="p-8 text-center text-xs font-bold text-muted">
      {t('landlordMessagesLoadingMessages')}
    </div>
  )
}

export default function LandlordMessagesPage() {
  return (
    <Suspense fallback={<LandlordMessagesFallback />}>
      <MessagesContent />
    </Suspense>
  )
}
