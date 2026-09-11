"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Send,
  Search,
  CheckCheck,
  ChevronLeft,
  ShieldCheck,
  Phone,
  Lock,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  ConversationItem,
  MessageItem,
  getConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
  initMessagesSocket,
} from "@/services/message.service";

function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatConversationTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

function appendOrUpdateMessage(
  list: MessageItem[],
  newMsg: MessageItem
): MessageItem[] {
  const index = list.findIndex((m) => m.id === newMsg.id);
  if (index >= 0) {
    const updated = [...list];
    updated[index] = newMsg;
    return updated;
  }
  return [...list, newMsg];
}

function GuestMessagesContent() {
  const t = useTranslations("guest");
  const { currentLocale } = useLanguage();
  const isEn = currentLocale === "en";
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetConvId = searchParams.get("conversationId");

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeChat, setActiveChat] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const activeChatRef = useRef<ConversationItem | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // 1. Load initial user conversations
  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoadingConversations(false);
      return;
    }

    let isMounted = true;
    setIsLoadingConversations(true);

    getConversations()
      .then((list) => {
        if (!isMounted) return;
        setConversations(list);

        if (targetConvId) {
          const match = list.find((c) => c.id === targetConvId);
          if (match) {
            setActiveChat(match);
          } else if (list.length > 0) {
            setActiveChat(list[0]);
          }
        } else if (list.length > 0) {
          setActiveChat(list[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load conversations:", err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingConversations(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, targetConvId]);

  // 2. Setup WebSocket connection for real-time messaging
  useEffect(() => {
    if (!isLoggedIn) return;

    const socket = initMessagesSocket();
    if (!socket) return;
    socketRef.current = socket;

    socket.on("connect", () => {
      if (activeChatRef.current) {
        socket.emit("join_conversation", {
          conversationId: activeChatRef.current.id,
        });
      }
    });

    socket.on("new_message", (newMsg: MessageItem) => {
      if (
        activeChatRef.current &&
        activeChatRef.current.id === newMsg.conversationId
      ) {
        setMessages((prev) => appendOrUpdateMessage(prev, newMsg));
        if (newMsg.senderId !== user?.id) {
          markAsRead(activeChatRef.current.id).catch(() => { });
        }
      }

      // Update conversation list item
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            const isActive = activeChatRef.current?.id === c.id;
            return {
              ...c,
              lastMessage: newMsg,
              updatedAt: newMsg.sentAt,
              unreadCount:
                isActive || newMsg.senderId === user?.id
                  ? 0
                  : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    });

    socket.on(
      "messages_read",
      ({ conversationId }: { conversationId: string; readerId: string }) => {
        if (
          activeChatRef.current &&
          activeChatRef.current.id === conversationId
        ) {
          setMessages((prev) =>
            prev.map((m) =>
              m.readAt ? m : { ...m, readAt: new Date().toISOString() }
            )
          );
        }
      }
    );

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isLoggedIn, user?.id]);

  // 3. Load messages when active chat changes & join socket room
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    let isCancelled = false;
    setIsLoadingMessages(true);

    if (socketRef.current) {
      socketRef.current.emit("join_conversation", {
        conversationId: activeChat.id,
      });
    }

    getConversationMessages(activeChat.id)
      .then((msgs) => {
        if (!isCancelled) {
          const uniqueMap = new Map<string, MessageItem>();
          msgs.forEach((m) => uniqueMap.set(m.id, m));
          setMessages(Array.from(uniqueMap.values()));
        }
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingMessages(false);
        }
      });

    // Mark as read
    if (activeChat.unreadCount > 0) {
      markAsRead(activeChat.id).catch(() => { });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChat.id ? { ...c, unreadCount: 0 } : c
        )
      );
    }

    return () => {
      isCancelled = true;
      if (socketRef.current && activeChat) {
        socketRef.current.emit("leave_conversation", {
          conversationId: activeChat.id,
        });
      }
    };
  }, [activeChat?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat || isSending) return;

    const content = messageInput.trim();
    setMessageInput("");
    setIsSending(true);

    try {
      const sentMsg = await sendMessage(activeChat.id, { content });
      setMessages((prev) => appendOrUpdateMessage(prev, sentMsg));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? { ...c, lastMessage: sentMsg, updatedAt: sentMsg.sentAt }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Auth lock screen
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-white items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mb-6 shadow-inner border border-[#2AC1BC]/20">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2">
          {t("guestMessagesLockTitle")}
        </h2>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-md mx-auto mb-6">
          {t("guestMessagesLockDesc")}
        </p>
        <Link href="/login?redirect=/messages">
          <button className="px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 transition-all cursor-pointer hover:scale-105">
            {t("guestMessagesLoginBtn")} &rarr;
          </button>
        </Link>
      </div>
    );
  }

  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.toLowerCase();
    const name = conv.participant?.fullName || conv.participant?.username || "";
    const lastContent = conv.lastMessage?.content || "";
    return (
      name.toLowerCase().includes(q) || lastContent.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header Trail */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rooms">
          <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500 cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            {t("guestMessagesTitle")}
          </h1>
          <p className="text-xs text-zinc-500">{t("guestMessagesSubtitle")}</p>
        </div>
      </div>

      {/* Main Chat Shell */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] h-[calc(100vh-200px)]">
        {/* Left Column: Conversations List */}
        <div className="lg:col-span-4 border-r border-zinc-200 flex flex-col bg-zinc-50/40">
          {/* Search Box */}
          <div className="p-4 border-b border-zinc-200/80 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("guestMessagesSearchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all bg-zinc-50"
              />
            </div>
          </div>

          {/* List Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-xs text-zinc-400 font-semibold space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2AC1BC]" />
                <p>Đang tải tin nhắn...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto" />
                <h4 className="text-xs font-extrabold text-zinc-700">
                  {t("guestMessagesEmptyList")}
                </h4>
                <p className="text-[11px] text-zinc-400 font-medium">
                  {t("guestMessagesEmptyListSub")}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeChat?.id === conv.id;
                const participantName =
                  conv.participant?.fullName ||
                  conv.participant?.username ||
                  "Chủ nhà";
                const initial = participantName.charAt(0).toUpperCase();
                const lastMsg = conv.lastMessage?.content || "";
                const timeStr = formatConversationTime(
                  conv.lastMessage?.sentAt || conv.updatedAt
                );

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveChat(conv)}
                    className={`w-full text-left p-4 flex gap-3 transition-all cursor-pointer ${isSelected
                        ? "bg-white shadow-xs border-l-4 border-l-[#2ac1bc]"
                        : "hover:bg-zinc-100/60"
                      }`}
                  >
                    {conv.participant?.avatarUrl ? (
                      <img
                        src={conv.participant.avatarUrl}
                        alt={participantName}
                        className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-zinc-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white font-black flex items-center justify-center shrink-0 text-sm">
                        {initial}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-extrabold text-zinc-900 text-xs truncate">
                          {participantName}
                        </h3>
                        <span className="text-[10px] text-zinc-400 font-semibold">
                          {timeStr}
                        </span>
                      </div>
                      {conv.participant?.boardingHouseName && (
                        <p className="text-[11px] text-[#2ac1bc] font-bold truncate mb-0.5">
                          {conv.participant.boardingHouseName}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500 truncate">{lastMsg}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="self-center px-1.5 py-0.5 bg-[#2AC1BC] text-white text-[10px] font-black rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Box */}
        <div className="lg:col-span-8 flex flex-col bg-white">
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <MessageSquare className="w-12 h-12 text-zinc-300 mb-3" />
              <h3 className="font-extrabold text-sm text-zinc-700">
                {t("guestMessagesSelectToChat")}
              </h3>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-200/80 flex justify-between items-center bg-white shadow-xs">
                <div className="flex items-center gap-3">
                  {activeChat.participant?.avatarUrl ? (
                    <img
                      src={activeChat.participant.avatarUrl}
                      alt={activeChat.participant.fullName || "User"}
                      className="w-10 h-10 rounded-xl object-cover border border-zinc-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white font-black flex items-center justify-center text-sm">
                      {(
                        activeChat.participant?.fullName ||
                        activeChat.participant?.username ||
                        "P"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-zinc-900 text-sm flex items-center gap-1.5">
                      {activeChat.participant?.fullName ||
                        activeChat.participant?.username}
                      <ShieldCheck className="w-4 h-4 text-[#2ac1bc]" />
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium truncate max-w-xs">
                      {activeChat.participant?.boardingHouseName ||
                        (activeChat.participant?.role === "landlord"
                          ? "Chủ nhà trọ chính chủ"
                          : "Đối tác Dormio")}
                    </p>
                  </div>
                </div>

                {activeChat.participant?.phoneNumber && (
                  <a
                    href={`tel:${activeChat.participant.phoneNumber}`}
                    className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-600 flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Phone className="w-4 h-4 text-[#2AC1BC]" />
                    <span className="hidden sm:inline">
                      {activeChat.participant.phoneNumber}
                    </span>
                  </a>
                )}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50/40">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2AC1BC]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                    <p className="text-xs text-zinc-400 font-medium">
                      Chưa có tin nhắn trong cuộc trò chuyện này. Hãy gửi lời chào đến chủ nhà!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    const time = formatMessageTime(msg.sentAt);

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"
                          }`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium ${isMe
                              ? "bg-zinc-900 text-white rounded-br-none shadow-md"
                              : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-none shadow-xs"
                            }`}
                        >
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1 font-semibold px-1">
                          <span>{time}</span>
                          {isMe && (
                            <CheckCheck
                              className={`w-3 h-3 ${msg.readAt ? "text-[#2AC1BC]" : "text-zinc-300"
                                }`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-zinc-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={t("guestMessagesInputPlaceholder")}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all bg-zinc-50"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="px-5 py-2.5 bg-[#2ac1bc] hover:bg-[#72b3a3] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-[#2ac1bc]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      {t("guestMessagesSend")}{" "}
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuestMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2AC1BC]" />
        </div>
      }
    >
      <GuestMessagesContent />
    </Suspense>
  );
}