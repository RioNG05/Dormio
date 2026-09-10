"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Paperclip,
  ImageIcon,
  Phone,
  Circle,
  Search,
  Info,
  Building2,
  FileText,
  CheckCheck,
  Sparkles,
  MessageSquare,
  X,
  AlertCircle,
  Loader2,
  File,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  DoorOpen,
  Receipt,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
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
} from "@/services/message.service";

// Avatar colors based on user identity
const AVATAR_COLORS = [
  "bg-[#2AC1BC]",
  "bg-teal-600",
  "bg-blue-600",
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-rose-600",
];

function getAvatarBg(str: string): string {
  if (!str) return "bg-[#2AC1BC]";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDisplayName(name?: string | null): string {
  if (!name) return "Chủ trọ";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatConversationTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

function appendOrUpdateMessage(list: MessageItem[], newMsg: MessageItem): MessageItem[] {
  const index = list.findIndex((m) => m.id === newMsg.id);
  if (index >= 0) {
    const updated = [...list];
    updated[index] = newMsg;
    return updated;
  }
  return [...list, newMsg];
}

export default function TenantMessagesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [activeChat, setActiveChat] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Message input state
  const [inputMessage, setInputMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    { type: "image" | "file"; url: string; name: string; sizeBytes: number }[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<any>(null);
  const activeChatRef = useRef<ConversationItem | null>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Tenant Quick Replies
  const quickReplies = [
    "Dạ em đã thanh toán tiền phòng tháng này rồi ạ! 💳",
    "Em nhờ BQL kiểm tra giúp thiết bị trong phòng với ạ. 🔧",
    "Cho em hỏi lịch thu gom rác / vệ sinh tuần này thế nào ạ? 🧹",
    "Dạ em đã nhận được thông báo, cảm ơn BQL! 🙏",
  ];

  // 1. Mount & load initial conversations & contacts from real DB
  useEffect(() => {
    setIsMounted(true);

    async function loadInitialData() {
      setIsLoadingConversations(true);
      try {
        const [convList, contactList] = await Promise.all([
          getConversations(),
          getContacts().catch(() => []),
        ]);

        setConversations(convList);
        setContacts(contactList);

        if (convList.length > 0) {
          setActiveChat(convList[0]);
        } else if (contactList.length > 0) {
          // If no conversation exists yet, auto-open/create conversation with primary landlord contact
          try {
            const newConv = await getOrCreateConversation(contactList[0].id);
            setConversations([newConv]);
            setActiveChat(newConv);
          } catch (createErr) {
            console.error("Auto-open conversation failed:", createErr);
          }
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoadingConversations(false);
      }
    }

    loadInitialData();
  }, []);

  // 2. Setup WebSocket connection for real-time messages
  useEffect(() => {
    if (!isMounted) return;

    const socket = initMessagesSocket();
    if (!socket) return;
    socketRef.current = socket;

    socket.on("connect", () => {
      if (activeChatRef.current) {
        socket.emit("join_conversation", { conversationId: activeChatRef.current.id });
      }
    });

    socket.on("new_message", (newMsg: MessageItem) => {
      // If message belongs to active chat, append or update it
      if (activeChatRef.current && activeChatRef.current.id === newMsg.conversationId) {
        setMessages((prev) => appendOrUpdateMessage(prev, newMsg));
        // Auto mark as read if received in active chat from landlord
        if (newMsg.senderId !== user?.id) {
          markAsRead(activeChatRef.current.id).catch(() => {});
        }
      }

      // Update conversations list lastMessage & unread count
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            const isActive = activeChatRef.current?.id === c.id;
            return {
              ...c,
              lastMessage: newMsg,
              updatedAt: newMsg.sentAt,
              unreadCount: isActive || newMsg.senderId === user?.id ? 0 : c.unreadCount + 1,
            };
          }
          return c;
        })
      );
    });

    socket.on("messages_read", ({ conversationId }: { conversationId: string; readerId: string }) => {
      if (activeChatRef.current && activeChatRef.current.id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.readAt ? m : { ...m, readAt: new Date().toISOString() }))
        );
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isMounted, user?.id]);

  // 3. Switch conversation & join WebSocket room
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    let isCancelled = false;
    setIsLoadingMessages(true);

    if (socketRef.current) {
      socketRef.current.emit("join_conversation", { conversationId: activeChat.id });
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

    // Mark as read on open
    if (activeChat.unreadCount > 0) {
      markAsRead(activeChat.id).catch(() => {});
      setConversations((prev) =>
        prev.map((c) => (c.id === activeChat.id ? { ...c, unreadCount: 0 } : c))
      );
    }

    return () => {
      isCancelled = true;
      if (socketRef.current && activeChat) {
        socketRef.current.emit("leave_conversation", { conversationId: activeChat.id });
      }
    };
  }, [activeChat?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const p = c.participant;
      const matchSearch =
        (p.fullName && p.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.roomName && p.roomName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.boardingHouseName && p.boardingHouseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.phoneNumber && p.phoneNumber.includes(searchTerm));
      return matchSearch;
    });
  }, [conversations, searchTerm]);

  // Extracted media files from active chat
  const activeChatMedia = useMemo(() => {
    const images: { id: string; url: string; name: string }[] = [];
    const files: { id: string; url: string; name: string; size: string; time: string }[] = [];

    messages.forEach((m) => {
      if (m.attachments && Array.isArray(m.attachments)) {
        m.attachments.forEach((att) => {
          if (att.type === "image") {
            images.push({
              id: att.id,
              url: att.url,
              name: att.url.split("/").pop() || "image.png",
            });
          } else {
            const kb = Math.round(att.sizeBytes / 1024);
            const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
            files.push({
              id: att.id,
              url: att.url,
              name: att.url.split("/").pop() || "file",
              size: sizeStr,
              time: formatConversationTime(m.sentAt),
            });
          }
        });
      }
    });

    return { images, files, total: images.length + files.length };
  }, [messages]);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!text && pendingAttachments.length === 0) return;
    if (!activeChat) return;

    setIsSending(true);
    try {
      const payload = {
        content: text || "Đính kèm tệp tin",
        attachments: pendingAttachments.map((att, idx) => ({
          type: att.type,
          url: att.url,
          sizeBytes: att.sizeBytes,
          sortOrder: idx,
        })),
      };

      const savedMsg = await sendMessage(activeChat.id, payload);

      setMessages((prev) => appendOrUpdateMessage(prev, savedMsg));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? { ...c, lastMessage: savedMsg, updatedAt: savedMsg.sentAt, unreadCount: 0 }
            : c
        )
      );

      if (textToSend === undefined) {
        setInputMessage("");
      }
      setPendingAttachments([]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle attachment file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
        setPendingAttachments((prev) => [
          ...prev,
          {
            type,
            url,
            name: file.name,
            sizeBytes: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const copyPhoneNumber = (phone?: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Sidebar: Conversations & Landlord Contacts ────────────── */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-col border-r border-zinc-200/80 bg-white shrink-0 ${
            mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-zinc-900">Tin nhắn</h1>
              <p className="text-xs text-zinc-500">Trao đổi với Chủ trọ & Ban quản lý</p>
            </div>
            {contacts.length > 0 && contacts[0].boardingHouseName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] text-[11px] font-bold">
                <Building2 className="w-3 h-3" />
                {contacts[0].boardingHouseName}
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-zinc-100">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm cuộc trò chuyện..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-100 border-none rounded-xl text-xs font-medium text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/30"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-zinc-50">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-xs font-semibold text-zinc-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#2AC1BC]" />
                <span>Đang tải danh sách...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-zinc-300" />
                <p className="font-semibold text-zinc-600">Chưa có cuộc trò chuyện nào</p>
                {contacts.length > 0 ? (
                  <button
                    onClick={async () => {
                      try {
                        const newConv = await getOrCreateConversation(contacts[0].id);
                        setConversations([newConv]);
                        setActiveChat(newConv);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="mt-2 px-3 py-1.5 bg-[#2AC1BC] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#23a8a3] transition-colors"
                  >
                    Bắt đầu nhắn tin với {formatDisplayName(contacts[0].fullName)}
                  </button>
                ) : (
                  <p className="text-[11px]">Vui lòng kiểm tra lại hợp đồng thuê trọ của bạn.</p>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeChat?.id === conv.id;
                const p = conv.participant;
                const displayName = formatDisplayName(p.fullName);
                const avatarInitial = displayName.charAt(0).toUpperCase() || "C";
                const isSystemLast =
                  conv.lastMessage?.content?.startsWith("📌 THÔNG BÁO") ||
                  conv.lastMessage?.content?.startsWith("💳 THÔNG BÁO");

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveChat(conv);
                      setMobileShowChat(true);
                    }}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isActive ? "bg-[#2AC1BC]/10" : "hover:bg-zinc-50/80"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs ${getAvatarBg(
                          displayName
                        )}`}
                      >
                        {avatarInitial}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <h2 className="text-xs font-bold text-zinc-900 truncate">
                          {displayName}
                        </h2>
                        {conv.updatedAt && (
                          <span className="text-[10px] text-zinc-400 font-semibold shrink-0 ml-1">
                            {formatConversationTime(conv.updatedAt)}
                          </span>
                        )}
                      </div>

                      {/* Property context badge */}
                      {(p.roomName || p.boardingHouseName) && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#2AC1BC] mb-1 truncate">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {p.roomName ? `${p.roomName}` : ""}
                            {p.roomName && p.boardingHouseName ? " • " : ""}
                            {p.boardingHouseName || ""}
                          </span>
                        </div>
                      )}

                      {/* Last message snippet */}
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] text-zinc-500 truncate">
                          {isSystemLast ? (
                            <span className="text-amber-600 font-bold">
                              [Thông báo hệ thống]
                            </span>
                          ) : (
                            conv.lastMessage?.content || "Nhấp để trò chuyện..."
                          )}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="min-w-4.5 h-4.5 px-1 bg-[#2AC1BC] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Center Main Chat Pane ───────────────────────────────────────── */}
        <div
          className={`flex-1 flex-col bg-zinc-50/50 ${
            mobileShowChat ? "flex" : "hidden md:flex"
          }`}
        >
          {activeChat ? (
            <>
              {/* Chat Top Header */}
              <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-zinc-200/80 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-500 md:hidden cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {/* Landlord Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs ${getAvatarBg(
                        activeChat.participant.fullName
                      )}`}
                    >
                      {formatDisplayName(activeChat.participant.fullName).charAt(0)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  {/* Landlord Name & Context */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                        {formatDisplayName(activeChat.participant.fullName)}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-extrabold shrink-0">
                        Chủ trọ
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 truncate">
                      {activeChat.participant.roomName && (
                        <span className="font-semibold text-[#2AC1BC] truncate">
                          {activeChat.participant.roomName}
                          {activeChat.participant.boardingHouseName &&
                            ` • ${activeChat.participant.boardingHouseName}`}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[10px]">
                        <Circle className="w-1.5 h-1.5 fill-current" /> Đang hoạt động
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Header Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {activeChat.participant.phoneNumber && (
                    <a
                      href={`tel:${activeChat.participant.phoneNumber}`}
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-700 transition-colors cursor-pointer"
                      title={`Gọi điện: ${activeChat.participant.phoneNumber}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => setShowRightDrawer(!showRightDrawer)}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      showRightDrawer
                        ? "bg-[#2AC1BC]/10 text-[#2AC1BC]"
                        : "hover:bg-zinc-100 text-zinc-600"
                    }`}
                    title="Thông tin chủ trọ & phòng trọ"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4 bg-zinc-50/70">
                {isLoadingMessages ? (
                  <div className="p-8 text-center text-xs font-bold text-zinc-400 flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#2AC1BC]" />
                    <span>Đang tải tin nhắn...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-zinc-400 space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto text-zinc-300 stroke-1" />
                    <p className="text-zinc-600 font-bold">Chưa có tin nhắn nào trong cuộc trò chuyện này.</p>
                    <p className="text-[11px] font-semibold text-zinc-400">
                      Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi với chủ trọ!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isLandlord = msg.senderId === activeChat.participant.id;
                    const isMe = !isLandlord;
                    const isSystemAlert =
                      msg.content.startsWith("📌 THÔNG BÁO") ||
                      msg.content.startsWith("💳 THÔNG BÁO");

                    if (isSystemAlert) {
                      return (
                        <div
                          key={`sys-${msg.id}-${idx}`}
                          className="max-w-md mx-auto my-3 p-3.5 bg-white border border-[#2AC1BC]/30 rounded-2xl shadow-2xs text-center space-y-2"
                        >
                          <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#2AC1BC]">
                            <Sparkles className="w-4 h-4" /> Thông báo từ hệ thống Dormio
                          </div>
                          <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
                            {msg.content}
                          </p>
                          <div className="text-[10px] font-bold text-zinc-400">
                            {formatMessageTime(msg.sentAt)}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`msg-${msg.id}-${idx}`}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            isMe
                              ? "bg-[#2AC1BC] text-white rounded-br-xs font-medium"
                              : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-xs font-medium"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {msg.attachments.map((att, attIdx) => {
                                if (att.type === "image") {
                                  return (
                                    <div
                                      key={`att-img-${att.id || att.url}-${attIdx}`}
                                      onClick={() => setPreviewImage(att.url)}
                                      className="cursor-pointer rounded-xl overflow-hidden border border-black/10 max-w-xs hover:opacity-95 transition-opacity"
                                    >
                                      <img
                                        src={att.url}
                                        alt="Hình ảnh đính kèm"
                                        className="w-full max-h-60 object-cover"
                                      />
                                    </div>
                                  );
                                }
                                return (
                                  <a
                                    key={`att-file-${att.id || att.url}-${attIdx}`}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-colors ${
                                      isMe
                                        ? "bg-white/20 text-white hover:bg-white/30"
                                        : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                                    }`}
                                  >
                                    <File className="w-4 h-4 shrink-0" />
                                    <span className="truncate">Tệp tin đính kèm</span>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Timestamp & Read receipts */}
                        <div
                          className={`flex items-center gap-1 text-[10px] font-bold text-zinc-400 px-1 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>{formatMessageTime(msg.sentAt)}</span>
                          {isMe && (
                            <span title={msg.readAt ? "Đã xem" : "Đã gửi"}>
                              <CheckCheck
                                className={`w-3.5 h-3.5 ${
                                  msg.readAt ? "text-[#2AC1BC]" : "text-zinc-300"
                                }`}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips for Tenants */}
              <div className="px-4 py-2 bg-white border-t border-zinc-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-extrabold text-zinc-400 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#2AC1BC]" /> Gợi ý nhanh:
                </span>
                {quickReplies.map((reply, rIdx) => (
                  <button
                    key={rIdx}
                    onClick={() => handleSendMessage(reply)}
                    className="px-3 py-1 bg-zinc-100 hover:bg-[#2AC1BC]/15 hover:text-[#2AC1BC] text-zinc-600 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Pending Attachments Preview */}
              {pendingAttachments.length > 0 && (
                <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-200/80 flex items-center gap-2 overflow-x-auto">
                  {pendingAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="relative flex items-center gap-2 p-1.5 bg-white rounded-xl border border-zinc-200 text-xs font-semibold"
                    >
                      {att.type === "image" ? (
                        <img
                          src={att.url}
                          alt="preview"
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <File className="w-5 h-5 text-zinc-500" />
                      )}
                      <span className="max-w-[120px] truncate text-zinc-700">{att.name}</span>
                      <button
                        onClick={() =>
                          setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Input Box */}
              <div className="p-3 sm:p-4 bg-white border-t border-zinc-200/80">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 sm:gap-3"
                >
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "image")}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "file")}
                  />

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
                    title="Gửi hình ảnh"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
                    title="Đính kèm tệp tin"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Nhập tin nhắn gửi cho chủ trọ..."
                    className="flex-1 px-4 py-2.5 bg-zinc-100 border-none rounded-xl text-xs sm:text-sm font-medium text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/30"
                  />

                  <button
                    type="submit"
                    disabled={(!inputMessage.trim() && pendingAttachments.length === 0) || isSending}
                    className="p-2.5 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-zinc-300 stroke-1" />
              <h2 className="text-base font-bold text-zinc-700">Chưa chọn cuộc trò chuyện</h2>
              <p className="text-xs text-zinc-400 max-w-sm">
                Hãy chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu trao đổi với chủ trọ.
              </p>
            </div>
          )}
        </div>

        {/* ─── Right Sidebar: Landlord & Property Info Drawer ──────────────── */}
        {showRightDrawer && activeChat && (
          <div className="w-80 border-l border-zinc-200/80 bg-white p-5 flex flex-col gap-5 shrink-0 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900">Thông tin chi tiết</h2>
              <button
                onClick={() => setShowRightDrawer(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Landlord Profile Card */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col items-center text-center space-y-3">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xs ${getAvatarBg(
                  activeChat.participant.fullName
                )}`}
              >
                {formatDisplayName(activeChat.participant.fullName).charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {formatDisplayName(activeChat.participant.fullName)}
                </h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#2AC1BC]/10 text-[#2AC1BC] text-[10px] font-extrabold rounded-full">
                  Chủ trọ phụ trách
                </span>
              </div>

              {activeChat.participant.phoneNumber && (
                <div className="w-full flex items-center justify-between p-2.5 bg-white rounded-xl border border-zinc-200/80 text-xs">
                  <span className="font-bold text-zinc-700">
                    {formatPhoneDisplay(activeChat.participant.phoneNumber)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyPhoneNumber(activeChat.participant.phoneNumber)}
                      className="p-1 text-zinc-400 hover:text-[#2AC1BC] cursor-pointer"
                      title="Sao chép số"
                    >
                      {copiedPhone ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`tel:${activeChat.participant.phoneNumber}`}
                      className="p-1 text-[#2AC1BC] hover:text-[#23a8a3] cursor-pointer"
                      title="Gọi điện"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Property Context */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                Nơi bạn đang thuê
              </h4>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2 text-xs">
                {activeChat.participant.boardingHouseName && (
                  <div className="flex items-center gap-2 text-zinc-700">
                    <Building2 className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                    <span className="font-bold">{activeChat.participant.boardingHouseName}</span>
                  </div>
                )}
                {activeChat.participant.roomName && (
                  <div className="flex items-center gap-2 text-zinc-700">
                    <DoorOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{activeChat.participant.roomName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions for Tenant */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                Lối tắt tiện ích
              </h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => router.push("/tenant/invoices")}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-[#2AC1BC]/10 hover:text-[#2AC1BC] text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#2AC1BC]" />
                    <span>Hóa đơn tiền phòng</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>

                <button
                  onClick={() => router.push("/tenant/complaints")}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-rose-50 hover:text-rose-600 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Gửi khiếu nại / phản ánh</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Shared Media */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                  Tệp & Hình ảnh đã chia sẻ
                </h4>
                <span className="text-[11px] font-bold text-zinc-500">
                  {activeChatMedia.total}
                </span>
              </div>

              {activeChatMedia.images.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {activeChatMedia.images.slice(0, 6).map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setPreviewImage(img.url)}
                      className="aspect-square rounded-lg overflow-hidden border border-zinc-200 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img src={img.url} alt="shared" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {activeChatMedia.files.length > 0 && (
                <div className="space-y-1.5">
                  {activeChatMedia.files.slice(0, 3).map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-100 text-xs transition-colors"
                    >
                      <File className="w-4 h-4 text-zinc-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-zinc-800">{f.name}</p>
                        <p className="text-[10px] text-zinc-400">{f.size}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {activeChatMedia.total === 0 && (
                <p className="text-xs text-zinc-400 italic text-center py-2">
                  Chưa có ảnh hay tệp nào được trao đổi.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Image Lightbox Preview Modal ──────────────────────────────────── */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Xem ảnh"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-white text-zinc-800 rounded-full shadow-lg hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
