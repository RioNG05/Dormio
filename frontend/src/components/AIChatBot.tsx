'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Loader2 } from 'lucide-react'
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
    }
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
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
      {/* Floating Launcher Button */}
      {!isOpen && (
        <Button
          variant="primary"
          rounded="full"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 !w-14 !h-14 shadow-lg hover:scale-105 z-[100] group relative"
          title={t('aiChatBotTitle')}
          aria-label={t('aiChatBotTitle')}
        >
          <Bot className="w-7 h-7 group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF6B35] border-2 border-white rounded-full" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed sm:bottom-6 sm:right-6 bottom-0 right-0 w-full sm:w-[380px] h-[100dvh] sm:h-[550px] bg-white sm:rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden sm:border border-zinc-200 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-[#2AC1BC] p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
                <Bot className="w-6 h-6 text-white" />
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 custom-scrollbar">
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-zinc-200 text-zinc-600'
                        : 'bg-[#2AC1BC]/10 text-[#2AC1BC]'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none ${
                      msg.role === 'user'
                        ? 'bg-[#2AC1BC] text-white rounded-tr-sm prose-invert'
                        : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0'
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
                  <div className="w-8 h-8 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-zinc-200 rounded-tl-sm shadow-sm flex items-center gap-1.5">
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
          <div className="p-3.5 sm:p-4 bg-white border-t border-zinc-100 shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center w-full">
              <TextInput
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('aiChatInputPlaceholder')}
                disabled={isLoading}
                containerClassName="w-full space-y-0"
                className="pr-12 text-xs sm:text-sm py-2.5 bg-zinc-100/80 focus:bg-white"
                rightIcon={
                  <Button
                    type="submit"
                    variant="primary"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    isLoading={isLoading}
                    className="!h-7 !w-7 rounded-lg shrink-0"
                    aria-label="Send"
                  >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
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
