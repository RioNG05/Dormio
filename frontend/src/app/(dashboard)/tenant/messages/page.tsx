"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
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
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  DoorOpen,
  Receipt,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
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
  const t = useTranslations("tenantPortal");
  const { locale } = useLanguage();
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
        } else {
          // Fallback demo conversation so UI is interactive
          const demoConv: ConversationItem = {
            id: "demo-landlord-conv",
            name: "Nguyễn Văn Rio",
            createdAt: new Date().toISOString(),
            participant: {
              id: "landlord-demo-1",
              username: "landlord_rio",
              fullName: "Nguyễn Văn Rio",
              phoneNumber: "0901234567",
              avatarUrl: null,
              role: "landlord",
              roomName: "Phòng 101",
              boardingHouseName: "Dormio Premier Quận 1",
            },
            lastMessage: {
              id: "msg-demo-3",
              conversationId: "demo-landlord-conv",
              senderId: "landlord-demo-1",
              content: "Chào bạn, thông báo hóa đơn tiền phòng tháng này đã sẵn sàng nhé! 💳",
              isReacted: false,
              sentAt: new Date().toISOString(),
              readAt: null,
              attachments: [],
            },
            unreadCount: 1,
            updatedAt: new Date().toISOString(),
          };
          setConversations([demoConv]);
          setActiveChat(demoConv);
          setMessages([
            {
              id: "msg-demo-1",
              conversationId: "demo-landlord-conv",
              senderId: "landlord-demo-1",
              content: "Chào bạn, chúc bạn một ngày tốt lành! Nếu có bất kỳ sự cố điện nước hay cần hỗ trợ gì bạn cứ nhắn cho Ban quản lý nhé.",
              isReacted: false,
              sentAt: new Date(Date.now() - 7200000).toISOString(),
              readAt: new Date().toISOString(),
              attachments: [],
            },
            {
              id: "msg-demo-2",
              conversationId: "demo-landlord-conv",
              senderId: user?.id || "my-user-id",
              content: "Dạ em cảm ơn anh Rio nhiều ạ! Phòng ở rất thoải mái.",
              isReacted: false,
              sentAt: new Date(Date.now() - 3600000).toISOString(),
              readAt: new Date().toISOString(),
              attachments: [],
            },
            {
              id: "msg-demo-3",
              conversationId: "demo-landlord-conv",
              senderId: "landlord-demo-1",
              content: "Thông báo hóa đơn tiền phòng kỳ này đã có, bạn kiểm tra tại mục Hóa đơn nhé! 💳",
              isReacted: false,
              sentAt: new Date().toISOString(),
              readAt: null,
              attachments: [],
            },
          ]);
        }
      } catch (error) {
        console.warn("Could not load conversations, activating fallback:", error);
        const demoConv: ConversationItem = {
          id: "demo-landlord-conv",
          name: "Nguyễn Văn Rio",
          createdAt: new Date().toISOString(),
          participant: {
            id: "landlord-demo-1",
            username: "landlord_rio",
            fullName: "Nguyễn Văn Rio",
            phoneNumber: "0901234567",
            avatarUrl: null,
            role: "landlord",
            roomName: "Phòng 101",
            boardingHouseName: "Dormio Premier Quận 1",
          },
          lastMessage: {
            id: "msg-demo-3",
            conversationId: "demo-landlord-conv",
            senderId: "landlord-demo-1",
            content: "Chào bạn, thông báo hóa đơn tiền phòng tháng này đã sẵn sàng nhé! 💳",
            isReacted: false,
            sentAt: new Date().toISOString(),
            readAt: null,
            attachments: [],
          },
          unreadCount: 1,
          updatedAt: new Date().toISOString(),
        };
        setConversations([demoConv]);
        setActiveChat(demoConv);
        setMessages([
          {
            id: "msg-demo-1",
            conversationId: "demo-landlord-conv",
            senderId: "landlord-demo-1",
            content: "Chào bạn, chúc bạn một ngày tốt lành! Nếu có bất kỳ sự cố điện nước hay cần hỗ trợ gì bạn cứ nhắn cho Ban quản lý nhé.",
            isReacted: false,
            sentAt: new Date(Date.now() - 7200000).toISOString(),
            readAt: new Date().toISOString(),
            attachments: [],
          },
          {
            id: "msg-demo-2",
            conversationId: "demo-landlord-conv",
            senderId: user?.id || "my-user-id",
            content: "Dạ em cảm ơn anh Rio nhiều ạ! Phòng ở rất thoải mái.",
            isReacted: false,
            sentAt: new Date(Date.now() - 3600000).toISOString(),
            readAt: new Date().toISOString(),
            attachments: [],
          },
          {
            id: "msg-demo-3",
            conversationId: "demo-landlord-conv",
            senderId: "landlord-demo-1",
            content: "Thông báo hóa đơn tiền phòng kỳ này đã có, bạn kiểm tra tại mục Hóa đơn nhé! 💳",
            isReacted: false,
            sentAt: new Date().toISOString(),
            readAt: null,
            attachments: [],
          },
        ]);
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
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100dvh-3.5rem)] bg-white border-y border-zinc-200/80 overflow-hidden flex relative animate-in fade-in duration-300">
      {/* PANE 1: Left Conversation List */}
      <div
        className={`w-full md:w-80 lg:w-88 border-r border-zinc-200/80 flex flex-col bg-zinc-50/50 shrink-0 ${
          mobileShowChat ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header & Search */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-200/80 space-y-2.5 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              {t("messagesTitle")}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] text-[10px] font-black uppercase">
              {conversations.length} {locale === "en" ? "contacts" : "kênh"}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("searchChatPlaceholder")}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#2AC1BC] transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "all", label: t("tabAll") },
              { id: "landlord", label: t("tabLandlord") },
              { id: "employee", label: t("tabStaff") },
              { id: "unread", label: t("tabUnread") },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  // Filter behavior handled in UI
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  tab.id === "all"
                    ? "bg-[#2AC1BC] text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Contacts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 custom-scrollbar">
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
              const isSelected = activeChat?.id === conv.id;
              const isLandlordRole = conv.participant?.role === "landlord";

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveChat(conv);
                    setMobileShowChat(true);
                  }}
                  className={`p-3.5 flex items-start gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#2AC1BC]/10 border-l-4 border-l-[#2AC1BC]"
                      : "hover:bg-zinc-100/70"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-2xl ${
                        isLandlordRole ? "bg-emerald-600" : "bg-teal-600"
                      } text-white font-black text-sm flex items-center justify-center shadow-xs`}
                    >
                      {isLandlordRole ? (
                        <Building2 className="w-5 h-5" />
                      ) : (
                        <DoorOpen className="w-5 h-5" />
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-xs sm:text-sm font-black text-zinc-900 truncate">
                        {formatDisplayName(conv.participant?.fullName)}
                      </h3>
                      <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                        {formatConversationTime(conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60 shrink-0">
                        {isLandlordRole ? (locale === "en" ? "Landlord" : "Chủ Nhà Trọ") : (locale === "en" ? "House Manager" : "Quản Lý Trọ")}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {formatPhoneDisplay(conv.participant?.phoneNumber)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 truncate font-normal">
                      {conv.lastMessage?.content || "Chưa có tin nhắn mới"}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PANE 2: Center Main Chat Box */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-white h-full overflow-hidden ${
          !mobileShowChat ? "hidden md:flex" : "flex"
        }`}
      >
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 sm:px-5 sm:py-3.5 border-b border-zinc-200/80 flex items-center justify-between gap-2 bg-white shrink-0 z-10 shadow-2xs">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Back to list on mobile */}
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 -ml-1 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Quay lại danh sách"
                >
                  <ArrowLeft className="w-5 h-5 text-zinc-700" />
                </button>

                <div className="relative shrink-0">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${
                      activeChat.participant?.role === "landlord" ? "bg-emerald-600" : "bg-teal-600"
                    } text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs`}
                  >
                    {activeChat.participant?.role === "landlord" ? (
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-zinc-900 truncate shrink-0">
                      {formatDisplayName(activeChat.participant?.fullName)}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-bold truncate">
                      {activeChat.participant?.role === "landlord"
                        ? locale === "en" ? "Landlord" : "Chủ Nhà Trọ"
                        : locale === "en" ? "House Manager" : "Quản Lý Trọ"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-500" />
                    <span className="truncate">{t("onlineNow")}</span>
                    <span className="hidden sm:inline text-zinc-300">•</span>
                    <a
                      href={`tel:${activeChat.participant?.phoneNumber}`}
                      className="hidden sm:inline text-[#2AC1BC] hover:underline font-bold truncate"
                    >
                      {formatPhoneDisplay(activeChat.participant?.phoneNumber)}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <a
                  href={`tel:${activeChat.participant?.phoneNumber}`}
                  className="p-1.5 sm:p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-[#2AC1BC] hover:text-white hover:border-[#2AC1BC] transition-all cursor-pointer shadow-2xs"
                  title="Gọi điện"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setShowRightDrawer(!showRightDrawer)}
                  className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    showRightDrawer
                      ? "bg-[#2AC1BC] text-white border-[#2AC1BC]"
                      : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                  }`}
                  title="Thông tin phòng"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-zinc-50/40 custom-scrollbar">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-zinc-400 text-xs gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#2AC1BC]" />
                  <span>Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-xs space-y-2">
                  <MessageSquare className="w-10 h-10 text-zinc-300" />
                  <p>Bắt đầu cuộc trò chuyện với {formatDisplayName(activeChat.participant?.fullName)}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id || msg.senderId === "my-user-id";
                  const isInvoiceMsg =
                    msg.content.includes("hóa đơn") ||
                    msg.content.includes("tiền phòng") ||
                    msg.content.includes("INV-") ||
                    msg.content.includes("💳");

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMe && (
                        <div
                          className={`w-8 h-8 rounded-xl ${
                            activeChat.participant?.role === "landlord" ? "bg-emerald-600" : "bg-teal-600"
                          } text-white flex items-center justify-center font-bold text-xs shrink-0`}
                        >
                          {activeChat.participant?.fullName?.charAt(0) || "C"}
                        </div>
                      )}

                      <div
                        className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isMe
                            ? "bg-[#2AC1BC] text-white rounded-br-xs shadow-xs"
                            : "bg-white text-zinc-800 border border-zinc-200/80 rounded-bl-xs shadow-2xs"
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* Interactive Invoice Card shortcut inside Chat bubble */}
                        {isInvoiceMsg && !isMe && (
                          <div className="mt-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 space-y-2 text-zinc-800 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-amber-900 flex items-center gap-1">
                                <Receipt className="w-3.5 h-3.5 text-[#FF6B35]" />
                                Hóa Đơn Tiền Phòng Kỳ Này
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-900 text-[9px] font-bold">
                                Chờ thanh toán
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-600">
                              Bấm xem chi tiết các khoản chi phí và thanh toán nhanh qua VietQR.
                            </p>
                            <Link
                              href="/tenant/invoices"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold transition-all shadow-xs"
                            >
                              <span>Xem & Thanh toán</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {msg.attachments.map((att, attIdx) => {
                              if (att.type === "image") {
                                return (
                                  <div
                                    key={attIdx}
                                    className="rounded-xl overflow-hidden border border-zinc-200/80 max-w-[240px] cursor-pointer"
                                    onClick={() => setPreviewImage(att.url)}
                                  >
                                    <img
                                      src={att.url}
                                      alt="Attachment"
                                      className="w-full h-auto object-cover hover:scale-105 transition-transform"
                                    />
                                  </div>
                                );
                              }
                              return (
                                <a
                                  key={attIdx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium ${
                                    isMe
                                      ? "bg-teal-700/50 text-white"
                                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                  }`}
                                >
                                  <File className="w-4 h-4 shrink-0" />
                                  <span className="truncate">Tệp đính kèm ({Math.round(att.sizeBytes / 1024)} KB)</span>
                                </a>
                              );
                            })}
                          </div>
                        )}

                        <div
                          className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                            isMe ? "text-teal-100" : "text-zinc-400"
                          }`}
                        >
                          <span>{formatMessageTime(msg.sentAt)}</span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Pills */}
            <div className="px-3.5 py-1.5 border-t border-zinc-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
                {t("quickPillsTitle")}:
              </span>
              {quickReplies.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(pill)}
                  className="px-2.5 py-1 rounded-xl bg-zinc-50 border border-zinc-200/80 text-[11px] font-semibold text-zinc-600 hover:bg-[#2AC1BC]/10 hover:border-[#2AC1BC] hover:text-[#2AC1BC] transition-all shrink-0 cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Pending Attachments Bar */}
            {pendingAttachments.length > 0 && (
              <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50 flex items-center gap-2 overflow-x-auto shrink-0">
                {pendingAttachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 shrink-0"
                  >
                    <span>{att.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-2.5 sm:p-3.5 border-t border-zinc-200/80 bg-white flex items-center gap-2 shrink-0"
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => handleFileUpload(e, "file")}
              />
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "image")}
              />

              <div className="flex items-center gap-1 text-zinc-400">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                  title="Đính kèm tệp"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                  title="Gửi hình ảnh"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t("typeMessagePlaceholder")}
                className="flex-1 px-3.5 py-2 sm:py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#2AC1BC] transition-colors"
              />

              <Button
                type="submit"
                disabled={isSending || (!inputMessage.trim() && pendingAttachments.length === 0)}
                className="px-4 py-2 sm:py-2.5 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs font-bold cursor-pointer transition-all shadow-xs shadow-[#2AC1BC]/20 disabled:opacity-40 shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs p-6 space-y-3">
            <MessageSquare className="w-12 h-12 text-zinc-300" />
            <p className="font-semibold text-zinc-600 text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>

      {/* PANE 3: Room & Tenancy Context Panel (Desktop inline + Mobile/Tablet Drawer) */}
      {showRightDrawer && activeChat && (
        <>
          {/* Mobile/Tablet Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-2xs"
            onClick={() => setShowRightDrawer(false)}
          />

          {/* Side Panel Content */}
          <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-88 lg:static lg:z-auto lg:w-80 xl:w-88 border-l border-zinc-200/80 bg-zinc-50 flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-5 shrink-0 shadow-xl lg:shadow-none animate-in slide-in-from-right duration-200">
            {/* Header on mobile */}
            <div className="flex lg:hidden items-center justify-between pb-3 border-b border-zinc-200">
              <span className="text-xs font-black text-zinc-900 uppercase">
                {t("roomInfoTitle")}
              </span>
              <button
                onClick={() => setShowRightDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Room Overview Card */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  {t("roomInfoTitle")}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  {t("roomStatusActive")}
                </span>
              </div>

              <div>
                <h4 className="text-base font-black text-zinc-900">
                  {activeChat.participant?.roomName || "Phòng 101"} &bull; Studio
                </h4>
                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{activeChat.participant?.boardingHouseName || "Dormio Premier"}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{t("rentPrice")}</span>
                <span className="font-bold text-[#2AC1BC]">4.500.000 ₫/tháng</span>
              </div>
            </div>

            {/* Current Bill Due Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-900">
                  {t("paymentDue")}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                  {t("unpaid")}
                </span>
              </div>

              <div>
                <div className="text-lg font-black text-zinc-900">4.120.000 ₫</div>
                <div className="text-[11px] text-zinc-500 font-medium">
                  {t("dueDate")}: 05/08/2026
                </div>
              </div>

              <Link href="/tenant/invoices">
                <Button className="w-full h-8 rounded-xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1">
                  <span>{t("btnViewInvoice")}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {/* Shared Attachments & Photos */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                {t("sharedMedia")} ({activeChatMedia.total})
              </span>

              {activeChatMedia.total === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-2">Chưa có tệp chia sẻ</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {activeChatMedia.images.slice(0, 3).map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setPreviewImage(img.url)}
                      className="h-16 rounded-xl overflow-hidden border border-zinc-200 group relative cursor-pointer"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                  ))}
                  {activeChatMedia.files.slice(0, 3).map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-16 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer p-1"
                    >
                      <FileText className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-bold truncate max-w-full">{f.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}



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
