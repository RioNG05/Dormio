'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Send, User } from 'lucide-react'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { api } from '@/services/api'
import { Button, TextInput, Text } from '@/components/ui'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function AIChatBot() {
  const { locale } = useLanguage()
  const t = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize welcome message when component mounts or when messages are empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: t('aiChatWelcomeMessage'),
        },
      ])
    }
  }, [locale, t, messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      inputRef.current?.focus()
    }
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    inputRef.current?.focus()
    if (!input.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const response = await api.post<{ reply: string }>(
        '/v1/ai/chat',
        {
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          headers: {
            'Accept-Language': locale,
          },
        },
      )

      const replyData = (response as any).data
        ? (response as any).data.reply
        : (response as any).reply

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: replyData },
      ])
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('aiChatErrorMessage'),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Launcher Button with Mio Mascot */}
      {!isOpen && (
        <Button
          rounded="full"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 !w-14 !h-14 shadow-lg hover:scale-105 z-[100] group overflow-hidden p-0 border-2 border-primary/20 bg-primary"
          title={t('aiChatBotTitle')}
          aria-label={t('aiChatBotTitle')}
        >
          <img
            src="/mio-avt.png"
            alt="Mio AI"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent border-2 border-white dark:border-zinc-900 rounded-full z-10" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed sm:bottom-6 sm:right-6 bottom-0 right-0 w-full sm:w-[380px] h-[100dvh] sm:h-[550px] bg-card sm:rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden sm:border border-line animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-primary p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/30 shadow-xs bg-white/20">
                <img
                  src="/mio-avt.png"
                  alt="Mio AI"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <Text as="h3" size="base" weight="bold" color="inherit" className="text-white">
                  {t('aiChatHeaderTitle')}
                </Text>
                <Text as="p" size="xs" color="inherit" className="text-teal-100 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  {t('aiChatAlwaysOnline')}
                </Text>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              rounded="full"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 hover:text-white"
              aria-label={t('aiChatCloseAria')}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/50 custom-scrollbar">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-2 max-w-[85%] ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                      msg.role === 'user'
                        ? 'bg-line text-muted'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <img
                        src="/mio-avt.png"
                        alt="Mio AI"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm prose-invert'
                        : 'bg-card border border-line text-foreground rounded-tl-sm shadow-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0'
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <Text as="p" size="sm" color="inherit" className="my-1 leading-relaxed">
                            {children}
                          </Text>
                        ),
                        strong: ({ children }) => (
                          <Text as="strong" size="sm" weight="black" color="inherit">
                            {children}
                          </Text>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary/20 bg-primary/10">
                    <img
                      src="/mio-avt.png"
                      alt="Mio AI"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-card border border-line rounded-tl-sm shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce" />
                    <span
                      className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce"
                      style={{ animationDelay: '0.15s' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce"
                      style={{ animationDelay: '0.3s' }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3.5 sm:p-4 bg-card border-t border-line shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center w-full">
              <TextInput
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('aiChatInputPlaceholder')}
                disabled={isLoading}
                containerClassName="w-full space-y-0"
                className="pr-12 text-xs sm:text-sm py-2.5 bg-card-hover/80"
                rightIcon={
                  <Button
                    type="submit"
                    size="icon-sm"
                    disabled={!input.trim() || isLoading}
                    isLoading={isLoading}
                    className="shrink-0"
                    aria-label="Send"
                  >
                    <Send />
                  </Button>
                }
              />
            </form>
            <div className="text-center mt-2">
              <Text as="span" size="xs" color="subtle" className="text-[10px]">
                {t('aiChatPoweredBy')}
              </Text>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
