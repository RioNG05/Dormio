'use client'

import { useState, useRef, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react'
import type { Socket } from 'socket.io-client'
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
import { dispatchMessagesUpdated } from '@/hooks/use-unread-messages'
import {
  ChatAttachmentInput,
  ChatMediaInfo,
} from '@/components/chat/types'
import {
  appendOrUpdateMessage,
  extractChatMedia,
} from '@/components/chat/utils'

export interface UseChatSessionOptions {
  currentUserId?: string
  autoSelectFirst?: boolean
  autoCreateWithFirstContactIfEmpty?: boolean
  initialConversationId?: string
  defaultAttachmentText?: string
  locale?: string
}

const emptySubscribe = () => () => {}

export function useChatSession(options: UseChatSessionOptions = {}) {
  const {
    currentUserId,
    autoSelectFirst = false,
    autoCreateWithFirstContactIfEmpty = false,
    initialConversationId = '',
    defaultAttachmentText = 'Tệp đính kèm',
    locale = 'vi',
  } = options

  // React 19 recommended hydration-safe mounting check without cascading setState
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [activeChat, setActiveChat] = useState<ConversationItem | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])

  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Message input state
  const [inputMessage, setInputMessage] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachmentInput[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const activeChatRef = useRef<ConversationItem | null>(null)
  const conversationsRef = useRef<ConversationItem[]>([])
  const contactsRef = useRef<ContactItem[]>([])

  useEffect(() => {
    activeChatRef.current = activeChat
  }, [activeChat])

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  useEffect(() => {
    contactsRef.current = contacts
  }, [contacts])

  // 1. Initial Load: conversations & contacts
  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        const [convList, contactList] = await Promise.all([
          getConversations(),
          getContacts().catch(() => []),
        ])

        if (isCancelled) return

        setConversations(convList)
        setContacts(contactList)
        conversationsRef.current = convList
        contactsRef.current = contactList

        if (initialConversationId) {
          const match = convList.find(c => c.id === initialConversationId)
          if (match) {
            activeChatRef.current = match
            setActiveChat(match)
            return
          }
        }

        if (autoSelectFirst) {
          if (convList.length > 0) {
            activeChatRef.current = convList[0]
            setActiveChat(convList[0])
          } else if (autoCreateWithFirstContactIfEmpty && contactList.length > 0) {
            try {
              const newConv = await getOrCreateConversation(contactList[0].id)
              if (!isCancelled) {
                setConversations([newConv])
                conversationsRef.current = [newConv]
                activeChatRef.current = newConv
                setActiveChat(newConv)
              }
            } catch (err) {
              console.error('Failed to auto-create conversation with first contact:', err)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load initial conversations:', error)
      } finally {
        if (!isCancelled) {
          setIsLoadingConversations(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isCancelled = true
    }
  }, [autoSelectFirst, autoCreateWithFirstContactIfEmpty, initialConversationId])

  // 2. Real-time WebSocket connection
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
      if (activeChatRef.current && activeChatRef.current.id === newMsg.conversationId) {
        setMessages(prev => appendOrUpdateMessage(prev, newMsg))

        if (newMsg.senderId !== currentUserId) {
          markAsRead(activeChatRef.current.id)
            .then(() => dispatchMessagesUpdated())
            .catch(() => {})
        }
      }

      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id === newMsg.conversationId) {
            const isActive = activeChatRef.current?.id === c.id
            return {
              ...c,
              lastMessage: newMsg,
              updatedAt: newMsg.sentAt,
              unreadCount: isActive || newMsg.senderId === currentUserId ? 0 : c.unreadCount + 1,
            }
          }
          return c
        })
        conversationsRef.current = updated
        return updated
      })
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
  }, [isMounted, currentUserId])

  // 3. Switch conversation and join room
  useEffect(() => {
    if (!activeChat) {
      return
    }

    const currentChat = activeChat
    let isCancelled = false

    async function loadMessages() {
      setIsLoadingMessages(true)
      try {
        const msgs = await getConversationMessages(currentChat.id)
        if (!isCancelled) {
          const uniqueMap = new Map<string, MessageItem>()
          msgs.forEach(m => uniqueMap.set(m.id, m))
          setMessages(Array.from(uniqueMap.values()))
        }
      } catch (err) {
        console.error('Failed to load conversation messages:', err)
      } finally {
        if (!isCancelled) {
          setIsLoadingMessages(false)
        }
      }
    }

    if (socketRef.current) {
      socketRef.current.emit('join_conversation', { conversationId: currentChat.id })
    }

    loadMessages()

    if (currentChat.unreadCount > 0) {
      markAsRead(currentChat.id)
        .then(() => dispatchMessagesUpdated())
        .catch(() => {})
      setConversations(prev => {
        const updated = prev.map(c => (c.id === currentChat.id ? { ...c, unreadCount: 0 } : c))
        conversationsRef.current = updated
        return updated
      })
      dispatchMessagesUpdated()
    }

    return () => {
      isCancelled = true
      if (socketRef.current) {
        socketRef.current.emit('leave_conversation', { conversationId: currentChat.id })
      }
    }
  }, [activeChat])

  // 4. Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChat])

  // Media files extracted from messages
  const activeChatMedia: ChatMediaInfo = useMemo(() => {
    return extractChatMedia(messages, locale)
  }, [messages, locale])

  // Send message
  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend !== undefined ? textToSend : inputMessage).trim()
      if (!text && pendingAttachments.length === 0) return
      if (!activeChat) return

      setIsSending(true)
      try {
        const payload = {
          content: text || defaultAttachmentText,
          attachments: pendingAttachments.map((att, idx) => ({
            type: att.type,
            url: att.url,
            sizeBytes: att.sizeBytes,
            sortOrder: idx,
          })),
        }

        const savedMsg = await sendMessage(activeChat.id, payload)

        setMessages(prev => appendOrUpdateMessage(prev, savedMsg))
        setConversations(prev => {
          const updated = prev.map(c =>
            c.id === activeChat.id
              ? { ...c, lastMessage: savedMsg, updatedAt: savedMsg.sentAt, unreadCount: 0 }
              : c,
          )
          conversationsRef.current = updated
          return updated
        })

        if (textToSend === undefined) {
          setInputMessage('')
        }
        setPendingAttachments([])
        return savedMsg
      } catch (error) {
        console.error('Failed to send message:', error)
        throw error
      } finally {
        setIsSending(false)
      }
    },
    [activeChat, inputMessage, pendingAttachments, defaultAttachmentText],
  )

  // File upload reader
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
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

      e.target.value = ''
    },
    [],
  )

  const removePendingAttachment = useCallback((index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  const selectConversation = useCallback((chat: ConversationItem | null) => {
    activeChatRef.current = chat
    setActiveChat(chat)
    if (!chat) {
      setMessages([])
    }
  }, [])

  return {
    isMounted,
    conversations,
    setConversations,
    contacts,
    setContacts,
    activeChat,
    setActiveChat,
    selectConversation,
    messages: activeChat ? messages : [],
    setMessages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    inputMessage,
    setInputMessage,
    pendingAttachments,
    setPendingAttachments,
    removePendingAttachment,
    handleFileUpload,
    handleSendMessage,
    activeChatMedia,
    messagesEndRef,
    fileInputRef,
    imageInputRef,
    conversationsRef,
    contactsRef,
    socketRef,
  }
}
