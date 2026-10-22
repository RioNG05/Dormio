'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Send,
  CheckCheck,
  ChevronLeft,
  ShieldCheck,
  Phone,
  Lock,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import {
  ConversationItem,
  MessageItem,
  getConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
  initMessagesSocket,
} from '@/services/message.service'
import { Button, Form, SearchInput, Text, TextInput } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { resolveErrorMessage } from '@/utils'

function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatConversationTime(isoString?: string): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })
  } catch {
    return ''
  }
}

function appendOrUpdateMessage(list: MessageItem[], newMsg: MessageItem): MessageItem[] {
  const index = list.findIndex(m => m.id === newMsg.id)
  if (index >= 0) {
    const updated = [...list]
    updated[index] = newMsg
    return updated
  }
  return [...list, newMsg]
}

function GuestMessagesContent() {
  const t = useTranslations('guest')
  const tErrors = useTranslations('errors')
  const { toast } = useToast()
  const { isLoggedIn, user } = useAuth()
  const searchParams = useSearchParams()
  const targetConvId = searchParams.get('conversationId')

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeChat, setActiveChat] = useState<ConversationItem | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])

  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const activeChatRef = useRef<ConversationItem | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    activeChatRef.current = activeChat
  }, [activeChat])

  // 1. Load initial user conversations
  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoadingConversations(false)
      return
    }

    let isMounted = true
    setIsLoadingConversations(true)

    getConversations()
      .then(list => {
        if (!isMounted) return
        setConversations(list)

        if (targetConvId) {
          const match = list.find(c => c.id === targetConvId)
          if (match) {
            setActiveChat(match)
          } else if (list.length > 0) {
            setActiveChat(list[0])
          }
        } else if (list.length > 0) {
          setActiveChat(list[0])
        }
      })
      .catch(err => {
        console.error('Failed to load conversations:', err)
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingConversations(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn, targetConvId])

  // 2. Setup WebSocket connection for real-time messaging
  useEffect(() => {
    if (!isLoggedIn) return

    const socket = initMessagesSocket()
    if (!socket) return
    socketRef.current = socket

    socket.on('connect', () => {
      if (activeChatRef.current) {
        socket.emit('join_conversation', {
          conversationId: activeChatRef.current.id,
        })
      }
    })

    socket.on('new_message', (newMsg: MessageItem) => {
      if (activeChatRef.current && activeChatRef.current.id === newMsg.conversationId) {
        setMessages(prev => appendOrUpdateMessage(prev, newMsg))
        if (newMsg.senderId !== user?.id) {
          markAsRead(activeChatRef.current.id).catch(() => {})
        }
      }

      // Update conversation list item
      setConversations(prev =>
        prev.map(c => {
          if (c.id === newMsg.conversationId) {
            const isActive = activeChatRef.current?.id === c.id
            return {
              ...c,
              lastMessage: newMsg,
              updatedAt: newMsg.sentAt,
              unreadCount: isActive || newMsg.senderId === user?.id ? 0 : (c.unreadCount || 0) + 1,
            }
          }
          return c
        }),
      )
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
  }, [isLoggedIn, user?.id])

  // 3. Load messages when active chat changes & join socket room
  useEffect(() => {
    if (!activeChat) {
      setMessages([])
      return
    }

    let isCancelled = false
    setIsLoadingMessages(true)

    if (socketRef.current) {
      socketRef.current.emit('join_conversation', {
        conversationId: activeChat.id,
      })
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

    // Mark as read
    if (activeChat.unreadCount > 0) {
      markAsRead(activeChat.id).catch(() => {})
      setConversations(prev =>
        prev.map(c => (c.id === activeChat.id ? { ...c, unreadCount: 0 } : c)),
      )
    }

    return () => {
      isCancelled = true
      if (socketRef.current && activeChat) {
        socketRef.current.emit('leave_conversation', {
          conversationId: activeChat.id,
        })
      }
    }
  }, [activeChat?.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 4. Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !activeChat || isSending) return

    const content = messageInput.trim()
    setMessageInput('')
    setIsSending(true)

    try {
      const sentMsg = await sendMessage(activeChat.id, { content })
      setMessages(prev => appendOrUpdateMessage(prev, sentMsg))
      setConversations(prev =>
        prev.map(c =>
          c.id === activeChat.id ? { ...c, lastMessage: sentMsg, updatedAt: sentMsg.sentAt } : c,
        ),
      )
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessageInput(content)
      toast.error(resolveErrorMessage(err, tErrors))
    } finally {
      setIsSending(false)
    }
  }

  // Auth lock screen
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-card items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-inner border border-primary/20">
          <Lock className="w-10 h-10" />
        </div>
        <Text as="h2" variant="heading" size="2xl" weight="black" className="mb-2">
          {t('guestMessagesLockTitle')}
        </Text>
        <Text
          variant="subtitle"
          size="xs"
          weight="medium"
          className="leading-relaxed max-w-md mx-auto mb-6"
        >
          {t('guestMessagesLockDesc')}
        </Text>
        <Link href="/login?redirect=/messages">
          <Button
            size="lg"
            rightIcon={<span>&rarr;</span>}
            className="rounded-2xl shadow-lg shadow-primary/25 hover:scale-105"
          >
            {t('guestMessagesLoginBtn')}
          </Button>
        </Link>
      </div>
    )
  }

  const filteredConversations = conversations.filter(conv => {
    const q = searchQuery.toLowerCase()
    const name = conv.participant?.fullName || conv.participant?.username || ''
    const lastContent = conv.lastMessage?.content || ''
    return name.toLowerCase().includes(q) || lastContent.toLowerCase().includes(q)
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header Trail */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon-sm" title="Quay lại">
            <ChevronLeft />
          </Button>
        </Link>
        <div>
          <Text as="h1" variant="heading" size="2xl" weight="black">
            {t('guestMessagesTitle')}
          </Text>
          <Text variant="subtitle" size="xs">
            {t('guestMessagesSubtitle')}
          </Text>
        </div>
      </div>

      {/* Main Chat Shell */}
      <div className="bg-card border border-line rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] h-[calc(100vh-200px)]">
        {/* Left Column: Conversations List */}
        <div className="lg:col-span-4 border-r border-line flex flex-col bg-zinc-50/40">
          {/* Search Box using SearchInput */}
          <div className="p-4 border-b border-line bg-card">
            <SearchInput
              value={searchQuery}
              onImmediateChange={setSearchQuery}
              onChange={setSearchQuery}
              placeholder={t('guestMessagesSearchPlaceholder')}
              className="bg-surface py-2"
            />
          </div>

          {/* List Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {isLoadingConversations ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                <Text variant="caption" size="xs" weight="semibold" color="subtle">
                  {t('guestMessagesLoadingList')}
                </Text>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto" />
                <Text as="h4" variant="heading" size="xs" weight="extrabold" color="secondary">
                  {t('guestMessagesEmptyList')}
                </Text>
                <Text variant="caption" size="2xs" weight="medium" color="subtle">
                  {t('guestMessagesEmptyListSub')}
                </Text>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = activeChat?.id === conv.id
                const participantName =
                  conv.participant?.fullName ||
                  conv.participant?.username ||
                  t('guestMessagesDefaultParticipant')
                const initial = participantName.charAt(0).toUpperCase()
                const lastMsg = conv.lastMessage?.content || ''
                const timeStr = formatConversationTime(conv.lastMessage?.sentAt || conv.updatedAt)

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveChat(conv)}
                    className={`w-full text-left p-4 flex gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-card shadow-xs border-l-4 border-l-primary'
                        : 'hover:bg-zinc-100/60'
                    }`}
                  >
                    {conv.participant?.avatarUrl ? (
                      <img
                        src={conv.participant.avatarUrl}
                        alt={participantName}
                        className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-line"
                      />
                    ) : (
                      <Text
                        as="div"
                        size="sm"
                        weight="black"
                        color="white"
                        className="w-11 h-11 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0"
                      >
                        {initial}
                      </Text>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1 gap-2">
                        <Text as="h3" variant="heading" size="xs" weight="extrabold" truncate>
                          {participantName}
                        </Text>
                        <Text
                          as="span"
                          variant="caption"
                          size="3xs"
                          weight="semibold"
                          color="subtle"
                          className="shrink-0"
                        >
                          {timeStr}
                        </Text>
                      </div>
                      {conv.participant?.boardingHouseName && (
                        <Text
                          variant="caption"
                          size="2xs"
                          weight="bold"
                          color="brand"
                          truncate
                          className="mb-0.5"
                        >
                          {conv.participant.boardingHouseName}
                        </Text>
                      )}
                      <Text variant="body" size="xs" color="secondary" truncate>
                        {lastMsg}
                      </Text>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Text
                        as="span"
                        variant="badge"
                        size="3xs"
                        weight="black"
                        color="white"
                        className="self-center px-1.5 py-0.5 bg-primary rounded-full"
                      >
                        {conv.unreadCount}
                      </Text>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Box */}
        <div className="lg:col-span-8 flex flex-col bg-card">
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted">
              <MessageSquare className="w-12 h-12 text-zinc-300 mb-3" />
              <Text as="h3" variant="heading" size="sm" weight="extrabold" color="secondary">
                {t('guestMessagesSelectToChat')}
              </Text>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-line flex justify-between items-center bg-card shadow-xs">
                <div className="flex items-center gap-3">
                  {activeChat.participant?.avatarUrl ? (
                    <img
                      src={activeChat.participant.avatarUrl}
                      alt={activeChat.participant.fullName || 'User'}
                      className="w-10 h-10 rounded-xl object-cover border border-line"
                    />
                  ) : (
                    <Text
                      as="div"
                      size="sm"
                      weight="black"
                      color="white"
                      className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center"
                    >
                      {(activeChat.participant?.fullName || activeChat.participant?.username || 'P')
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  )}
                  <div>
                    <Text
                      as="h3"
                      variant="heading"
                      size="sm"
                      weight="extrabold"
                      className="flex items-center gap-1.5"
                    >
                      <Text as="span" variant="heading" size="sm" weight="extrabold">
                        {activeChat.participant?.fullName || activeChat.participant?.username}
                      </Text>
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </Text>
                    <Text variant="subtitle" size="xs" weight="medium" truncate className="max-w-xs">
                      {activeChat.participant?.boardingHouseName ||
                        (activeChat.participant?.role === 'landlord'
                          ? t('guestMessagesRoleLandlord')
                          : t('guestMessagesRolePartner'))}
                    </Text>
                  </div>
                </div>

                {activeChat.participant?.phoneNumber && (
                  <a
                    href={`tel:${activeChat.participant.phoneNumber}`}
                    className="p-2 hover:bg-card-hover rounded-xl transition-colors text-muted flex items-center gap-1.5"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                    <Text
                      as="span"
                      size="xs"
                      weight="bold"
                      color="secondary"
                      className="hidden sm:inline"
                    >
                      {activeChat.participant.phoneNumber}
                    </Text>
                  </a>
                )}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50/40">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full text-muted">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                    <Text variant="body" size="xs" weight="medium" color="subtle">
                      {t('guestMessagesEmptyConversation')}
                    </Text>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === user?.id
                    const time = formatMessageTime(msg.sentAt)

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <Text
                          as="div"
                          variant="body"
                          size="xs"
                          weight="medium"
                          color={isMe ? 'white' : 'default'}
                          className={`max-w-md px-4 py-3 rounded-2xl leading-relaxed ${
                            isMe
                              ? 'bg-zinc-900 rounded-br-none shadow-md'
                              : 'bg-card border border-line rounded-bl-none shadow-xs'
                          }`}
                        >
                          {msg.content}
                        </Text>
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <Text as="span" variant="caption" size="3xs" weight="semibold" color="subtle">
                            {time}
                          </Text>
                          {isMe && (
                            <CheckCheck
                              className={`w-3 h-3 ${
                                msg.readAt ? 'text-primary' : 'text-zinc-300'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form using Form, TextInput, and Button */}
              <Form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-line bg-card flex items-center gap-2 space-y-0"
              >
                <TextInput
                  placeholder={t('guestMessagesInputPlaceholder')}
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  containerClassName="flex-1"
                  className="bg-surface"
                />
                <Button
                  type="submit"
                  size="md"
                  disabled={!messageInput.trim() || isSending}
                  isLoading={isSending}
                  rightIcon={!isSending ? <Send /> : undefined}
                  className="shrink-0"
                >
                  {t('guestMessagesSend')}
                </Button>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GuestMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <GuestMessagesContent />
    </Suspense>
  )
}
