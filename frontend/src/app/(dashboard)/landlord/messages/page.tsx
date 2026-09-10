"use client";

import React, { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send, Paperclip, Smile, ImageIcon, Phone, Circle, Search, Info,
  Building2, User, FileText, CheckCheck, Clock, Sparkles, ChevronRight,
  MapPin, MessageSquare, ShieldCheck, DollarSign, CalendarDays, ExternalLink,
  Plus, X, Filter, Check, Eye, AlertCircle, Bell, ArrowRight, Smartphone,
  DoorOpen, FileImage, File, ArrowLeft, Loader2, Download
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import {
  ConversationItem,
  MessageItem,
  MessageAttachment,
  ContactItem,
  getConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  markAsRead,
  getContacts,
  initMessagesSocket,
} from "@/services/message.service";

const AVATAR_COLORS = [
  "bg-teal-600",
  "bg-[#2AC1BC]",
  "bg-blue-600",
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-rose-600",
];

function getAvatarBg(str: string): string {
  if (!str) return "bg-teal-600";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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

function MessagesContent() {
  const { user, activeBuilding } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlRoom = searchParams.get("room") || searchParams.get("search") || "";
  const urlTenant = searchParams.get("tenant") || "";
  const urlUserId = searchParams.get("userId") || searchParams.get("participantId") || "";
  const urlInvId = searchParams.get("invId") || "";
  const urlAmount = searchParams.get("amount") || "";
  const urlPeriod = searchParams.get("period") || "";
  const autoSend = searchParams.get("autoSend") === "true";
  const urlType = searchParams.get("type") || "";
  const urlDepId = searchParams.get("depId") || "";

  const [isMounted, setIsMounted] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [activeChat, setActiveChat] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read" | "tenant" | "lead">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const [showCloseModalConfirm, setShowCloseModalConfirm] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

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
  const autoSentKeysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);


  // Preset Smart Quick Replies
  const quickReplies = [
    "Đã nhận thông tin, BQL sẽ kiểm tra ngay nhé!",
    "Đã báo thợ kỹ thuật sang hỗ trợ cho em rồi.",
    "Hóa đơn đã chốt trên ứng dụng, em kiểm tra nhé.",
    "Dạ phòng vẫn còn trống, anh/chị có thể xem ngay.",
  ];

  // 1. Mount & load initial conversations & contacts
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
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoadingConversations(false);
      }
    }

    loadInitialData();
  }, []);

  // 2. Setup WebSocket connection
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
        // Auto mark as read if received in active chat
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

  // 4. Handle URL Navigation query params (?room=..., ?tenant=..., ?userId=..., autoSend=true)
  useEffect(() => {
    if (!isMounted || isLoadingConversations) return;

    async function handleUrlParams() {
      // Match from existing conversations
      let match = conversations.find((c) => {
        if (urlUserId && (c.participant.id === urlUserId)) return true;
        if (urlRoom && (c.participant.roomName?.toLowerCase().includes(urlRoom.toLowerCase()) ||
          c.participant.roomName?.replace("Phòng ", "") === urlRoom)) return true;
        if (urlTenant && c.participant.fullName.toLowerCase().includes(urlTenant.toLowerCase())) return true;
        return false;
      });

      // If not in existing conversations, search contacts or create conversation
      if (!match) {
        let targetContact = contacts.find((ct) => {
          if (urlUserId && ct.id === urlUserId) return true;
          if (urlRoom && (ct.roomName?.toLowerCase().includes(urlRoom.toLowerCase()) ||
            ct.roomName?.replace("Phòng ", "") === urlRoom)) return true;
          if (urlTenant && ct.fullName.toLowerCase().includes(urlTenant.toLowerCase())) return true;
          return false;
        });

        if (targetContact) {
          try {
            const newConv = await getOrCreateConversation(targetContact.id);
            setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
            match = newConv;
          } catch (e) {
            console.error("Failed to auto-create conversation from contact:", e);
          }
        } else if (urlUserId) {
          try {
            const newConv = await getOrCreateConversation(urlUserId);
            setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
            match = newConv;
          } catch (e) {
            console.error("Failed to auto-create conversation from userId:", e);
          }
        }
      }

      if (match) {
        setActiveChat(match);
        setMobileShowChat(true);

        // Handle autoSend if present
        if (autoSend) {
          const autoKey = `${match.id}_${urlInvId || urlDepId || urlType || "auto"}`;
          if (!autoSentKeysRef.current[autoKey]) {
            autoSentKeysRef.current[autoKey] = true;
            const roomLabel = match.participant.roomName || "phòng của bạn";
            if (urlInvId) {
              const formattedAmount = urlAmount ? Number(urlAmount).toLocaleString("vi-VN") + " ₫" : "";
              const autoMsgContent = `📌 THÔNG BÁO HÓA ĐƠN THÁNG ${urlPeriod || "NÀY"}: Ban quản lý gửi thông báo thanh toán tiền ${roomLabel}. Tổng tiền: ${formattedAmount}. Quý khách vui lòng kiểm tra chi tiết hóa đơn (mã ${urlInvId}) hoặc quét mã VietQR để hoàn tất thanh toán.`;
              sendMessage(match.id, { content: autoMsgContent })
                .then((savedMsg) => {
                  setMessages((prev) => appendOrUpdateMessage(prev, savedMsg));
                })
                .catch(console.error);
            } else if (urlType === "upgrade" || urlDepId) {
              const formattedAmount = urlAmount ? Number(urlAmount).toLocaleString("vi-VN") + " ₫" : "2.500.000 ₫";
              const autoMsgContent = `💳 THÔNG BÁO THU BỔ SUNG & NÂNG CỌC HỢP ĐỒNG: Ban quản lý gửi thông báo thu tiền cọc bổ sung cho ${roomLabel} (${match.participant.fullName}). Số tiền cần thanh toán: +${formattedAmount}. Quý khách vui lòng quét mã VietQR để hoàn tất nâng cọc hợp đồng.`;
              sendMessage(match.id, { content: autoMsgContent })
                .then((savedMsg) => {
                  setMessages((prev) => appendOrUpdateMessage(prev, savedMsg));
                })
                .catch(console.error);
            }
          }
        }

      }
    }

    if (urlRoom || urlTenant || urlUserId || urlInvId) {
      handleUrlParams();
    }
  }, [isMounted, isLoadingConversations, urlRoom, urlTenant, urlUserId, urlInvId, urlAmount, urlPeriod, autoSend, urlType, urlDepId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const p = c.participant;
      const matchSearch =
        (p.fullName && p.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.roomName && p.roomName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.phoneNumber && p.phoneNumber.includes(searchTerm));

      if (!matchSearch) return false;

      if (activeTab === "unread") return c.unreadCount > 0;
      if (activeTab === "read") return c.unreadCount === 0;
      if (activeTab === "tenant") return p.role === "tenant";
      if (activeTab === "lead") return p.role !== "tenant";
      return true;
    });
  }, [conversations, searchTerm, activeTab]);

  // Media files extracted from all messages of the active conversation
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

  // Send message handler
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

  // Handle file uploads (image / document)
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

    // Reset input
    e.target.value = "";
  };

  // Start new conversation from contact modal
  const handleSelectContactToChat = async (contact: ContactItem) => {
    setIsCreatingChat(true);
    try {
      const conv = await getOrCreateConversation(contact.id);
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      setActiveChat(conv);
      setMobileShowChat(true);
      setShowNewChatModal(false);
      setNewChatSearch("");
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Filtered contacts for modal
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const q = newChatSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        c.fullName.toLowerCase().includes(q) ||
        (c.roomName && c.roomName.toLowerCase().includes(q)) ||
        (c.phoneNumber && c.phoneNumber.includes(q))
      );
    });
  }, [contacts, newChatSearch]);

  const handleCloseNewChatModal = () => {
    if (newChatSearch.trim()) {
      setShowCloseModalConfirm(true);
    } else {
      setShowNewChatModal(false);
      setNewChatSearch("");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-4.5rem)] bg-white border-y border-zinc-200/80 overflow-hidden flex">
      {/* PANE 1: Left Conversation List */}
      <div
        className={`w-full lg:w-96 border-r border-zinc-200/80 flex-col bg-zinc-50/50 shrink-0 ${
          mobileShowChat ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Top Search & Filter Tabs */}
        <div className="p-3.5 border-b border-zinc-200/80 space-y-3 bg-white">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm tên, phòng, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
              />
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              title="Cuộc trò chuyện mới"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 py-0.5 text-[11px] font-extrabold">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-[#2AC1BC] text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              Tất cả ({conversations.length})
            </button>

            <button
              onClick={() => setActiveTab("unread")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === "unread"
                  ? "bg-[#2AC1BC] text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              Chưa đọc ({conversations.filter((c) => c.unreadCount > 0).length})
            </button>

            <button
              onClick={() => setActiveTab("read")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === "read"
                  ? "bg-[#2AC1BC] text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              Đã đọc ({conversations.filter((c) => c.unreadCount === 0).length})
            </button>

            <button
              onClick={() => setActiveTab("tenant")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === "tenant"
                  ? "bg-[#2AC1BC] text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              Khách thuê ({conversations.filter((c) => c.participant.role === "tenant").length})
            </button>

            <button
              onClick={() => setActiveTab("lead")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === "lead"
                  ? "bg-[#2AC1BC] text-white shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              Khách mới ({conversations.filter((c) => c.participant.role !== "tenant").length})
            </button>
          </div>
        </div>

        {/* Conversation List Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-zinc-100">
          {isLoadingConversations ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#2AC1BC]" />
              <span>Đang tải danh sách cuộc trò chuyện...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-zinc-300 stroke-1" />
              <p>Không tìm thấy cuộc trò chuyện nào.</p>
              {contacts.length > 0 && (
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC] hover:text-white text-[#2AC1BC] font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Bắt đầu trò chuyện với khách thuê
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map((chat, chatIdx) => {
              const isSelected = activeChat?.id === chat.id;
              const p = chat.participant;
              const avatarBg = getAvatarBg(p.id || p.fullName);
              const isTenant = p.role === "tenant";

              return (
                <div
                  key={`conv-${chat.id}-${chatIdx}`}
                  onClick={() => {
                    setActiveChat(chat);
                    setMobileShowChat(true);
                  }}

                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#2AC1BC]/10 border-l-4 border-l-[#2AC1BC]"
                      : "hover:bg-zinc-100/80"
                  }`}
                >
                  {/* Avatar with Status */}
                  <div className="relative shrink-0 pt-0.5">
                    <div
                      className={`w-10 h-10 rounded-2xl ${avatarBg} text-white font-black text-sm flex items-center justify-center shadow-2xs`}
                    >
                      {p.fullName ? p.fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                  </div>

                  {/* Meta & Last Message */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs text-zinc-900 truncate">
                        {p.roomName || p.fullName}
                      </span>
                      <span
                        className={`text-[10px] font-bold shrink-0 ${
                          chat.unreadCount > 0 ? "text-[#2AC1BC]" : "text-zinc-400"
                        }`}
                      >
                        {chat.lastMessage
                          ? formatConversationTime(chat.lastMessage.sentAt)
                          : formatConversationTime(chat.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-zinc-700 truncate">
                        {p.fullName}
                      </span>
                      {isTenant ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Khách thuê
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          Khách mới
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate ${
                          chat.unreadCount > 0
                            ? "font-extrabold text-zinc-900"
                            : "font-medium text-zinc-500"
                        }`}
                      >
                        {chat.lastMessage?.content || "Chưa có tin nhắn"}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[#2AC1BC] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {chat.unreadCount}
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

      {/* PANE 2: Center Main Chat Stream */}
      <div
        className={`flex-1 flex-col min-w-0 bg-white ${
          mobileShowChat ? "flex" : "hidden lg:flex"
        }`}
      >
        {activeChat ? (
          <>
            {/* Active Chat Header */}
            <div className="p-3 sm:px-5 sm:py-3 border-b border-zinc-200/80 flex items-center justify-between gap-2 bg-white z-10 shadow-2xs">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="lg:hidden p-1.5 -ml-1 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Quay lại danh sách"
                >
                  <ArrowLeft className="w-5 h-5 text-zinc-700" />
                </button>

                <div className="relative shrink-0">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${getAvatarBg(
                      activeChat.participant.id || activeChat.participant.fullName
                    )} text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-2xs`}
                  >
                    {activeChat.participant.fullName.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2 className="font-black text-xs sm:text-sm text-zinc-900 truncate shrink-0">
                      {activeChat.participant.roomName || activeChat.participant.fullName}
                    </h2>
                    <span className="text-[11px] sm:text-xs font-bold text-zinc-500 truncate">
                      • {activeChat.participant.fullName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-zinc-400 truncate">
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
              <div className="flex items-center gap-1 shrink-0">
                {activeChat.participant.phoneNumber && (
                  <a
                    href={`tel:${activeChat.participant.phoneNumber}`}
                    className="p-1.5 sm:p-2 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer"
                    title="Gọi điện"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {activeChat.participant.roomName && (
                  <button
                    onClick={() => {
                      const roomNo = activeChat.participant.roomName?.replace("Phòng ", "") || "";
                      router.push(`/landlord/contracts?search=${encodeURIComponent(roomNo)}`);
                    }}
                    className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Hợp đồng
                  </button>
                )}
                <button
                  onClick={() => setShowRightDrawer(!showRightDrawer)}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                    showRightDrawer
                      ? "bg-[#2AC1BC]/10 text-[#2AC1BC]"
                      : "hover:bg-zinc-100 text-zinc-600"
                  }`}
                  title="Thông tin chi tiết"
                >
                  <Info className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 bg-zinc-50/60">
              {isLoadingMessages ? (
                <div className="p-8 text-center text-xs font-bold text-zinc-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#2AC1BC]" />
                  <span>Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-zinc-400 space-y-2">
                  <MessageSquare className="w-10 h-10 mx-auto text-zinc-300 stroke-1" />
                  <p>Chưa có tin nhắn nào trong cuộc trò chuyện này.</p>
                  <p className="text-[11px] font-semibold text-zinc-400">
                    Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi!
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id || msg.senderId !== activeChat.participant.id;
                  const isSystemAlert =
                    msg.content.startsWith("📌 THÔNG BÁO") || msg.content.startsWith("💳 THÔNG BÁO");

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
                            : "bg-white border border-zinc-200/80 text-zinc-900 rounded-bl-xs font-medium"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                        {/* Attachments within bubble */}
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
                                  <span className="truncate flex-1">
                                    {att.url.split("/").pop() || "Tệp đính kèm"}
                                  </span>
                                  <Download className="w-3.5 h-3.5 shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex items-center gap-1 text-[10px] font-bold ${
                          isMe ? "text-zinc-400" : "text-zinc-400"
                        }`}
                      >
                        <span>{formatMessageTime(msg.sentAt)}</span>
                        {isMe && (
                          <span title={msg.readAt ? "Đã xem" : "Đã gửi"}>
                            <CheckCheck
                              className={`w-3 h-3 ${
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

            {/* Preset Smart Quick Reply Chips */}
            <div className="px-4 py-2 bg-zinc-100/80 border-t border-zinc-200/80 flex items-center gap-2 overflow-x-auto custom-scrollbar">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider shrink-0">
                Nhanh:
              </span>
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(reply)}
                  disabled={isSending}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-[#2AC1BC] hover:text-white text-zinc-700 border border-zinc-200 rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Pending Attachments Preview */}
            {pendingAttachments.length > 0 && (
              <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-200 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-extrabold text-zinc-500 uppercase shrink-0">
                  Đính kèm ({pendingAttachments.length}):
                </span>
                {pendingAttachments.map((att, index) => (
                  <div
                    key={index}
                    className="relative group bg-white border border-zinc-200 rounded-xl p-1.5 flex items-center gap-2 text-xs shrink-0"
                  >
                    {att.type === "image" ? (
                      <img src={att.url} alt={att.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <File className="w-5 h-5 text-[#2AC1BC]" />
                    )}
                    <span className="max-w-[120px] truncate font-semibold text-zinc-700">
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingAttachments((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="text-zinc-400 hover:text-rose-500 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Message Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-zinc-200/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "file")}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "image")}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                  title="Đính kèm tệp"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                  title="Gửi hình ảnh"
                >
                  <ImageIcon className="w-4.5 h-4.5" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`Soạn tin nhắn gửi đến ${
                      activeChat.participant.roomName || activeChat.participant.fullName
                    }...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={isSending}
                    className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSending || (!inputMessage.trim() && pendingAttachments.length === 0)}
                  className="px-4 py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Gửi</span> <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-3">
            <MessageSquare className="w-12 h-12 text-zinc-300 stroke-1" />
            <h3 className="font-extrabold text-sm text-zinc-700">Chưa chọn cuộc trò chuyện</h3>
            <p className="text-xs max-w-sm">
              Chọn một cuộc hội thoại từ danh sách bên trái hoặc nhấn nút "+" để bắt đầu nhắn tin với khách thuê.
            </p>
            {contacts.length > 0 && (
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                Bắt đầu trò chuyện
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Backdrop Overlay for Right Drawer */}
      {showRightDrawer && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowRightDrawer(false)}
        />
      )}

      {/* PANE 3: Right Contextual Tenant & Room Panel */}
      {showRightDrawer && activeChat && (
        <div className="fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto w-full sm:w-80 lg:w-80 border-l border-zinc-200/80 bg-white flex flex-col shrink-0 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-200 shadow-2xl lg:shadow-none">
          {/* Panel Header */}
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#2AC1BC]" /> Thông tin chi tiết
            </h3>
            <button
              onClick={() => setShowRightDrawer(false)}
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4 text-xs">
            {/* Tenant Profile Card */}
            <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-center space-y-2">
              <div
                className={`w-14 h-14 rounded-2xl ${getAvatarBg(
                  activeChat.participant.id || activeChat.participant.fullName
                )} text-white font-black text-xl flex items-center justify-center mx-auto shadow-sm`}
              >
                {activeChat.participant.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-black text-sm text-zinc-900">{activeChat.participant.fullName}</h4>
                <p className="text-zinc-500 text-[11px] font-semibold mt-0.5">
                  {activeChat.participant.phoneNumber || "Chưa cập nhật SĐT"}
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Tài khoản Dormio
                </span>
              </div>
            </div>

            {/* Room & Building Info */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="font-extrabold text-sm text-[#2AC1BC]">
                  {activeChat.participant.roomName || "Chưa gắn phòng"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                  {activeChat.participant.boardingHouseName || activeBuilding?.name || "Tòa nhà"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-semibold">Vai trò:</span>
                  <span className="font-extrabold text-zinc-900">
                    {activeChat.participant.role === "tenant" ? "Khách thuê" : "Khách xem phòng"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {activeChat.participant.roomName && (
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    const roomNo = activeChat.participant.roomName?.replace("Phòng ", "") || "";
                    router.push(`/landlord/rooms?search=${encodeURIComponent(roomNo)}`);
                  }}
                  className="w-full p-2.5 bg-white hover:bg-[#2AC1BC]/10 hover:border-[#2AC1BC]/40 text-zinc-800 hover:text-[#2AC1BC] border border-zinc-200 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                >
                  <span className="flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-[#2AC1BC]" /> Xem Chi Tiết {activeChat.participant.roomName}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    const roomNo = activeChat.participant.roomName?.replace("Phòng ", "") || "";
                    router.push(`/landlord/contracts?search=${encodeURIComponent(roomNo)}`);
                  }}
                  className="w-full p-2.5 bg-white hover:bg-[#2AC1BC]/10 hover:border-[#2AC1BC]/40 text-zinc-800 hover:text-[#2AC1BC] border border-zinc-200 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2AC1BC]" /> Xem Hợp Đồng {activeChat.participant.roomName}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

            {/* Media & Attachments Storage Section */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="font-extrabold text-xs text-zinc-900 flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-[#2AC1BC]" /> Lưu trữ Hình ảnh & Tệp
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-zinc-100 text-zinc-600 rounded-md">
                  {activeChatMedia.total}
                </span>
              </div>

              {activeChatMedia.total > 0 ? (
                <div className="space-y-3">
                  {/* Images Grid */}
                  {activeChatMedia.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {activeChatMedia.images.map((img, imgIdx) => (
                        <div
                          key={`drawer-img-${img.id || img.url}-${imgIdx}`}
                          onClick={() => setPreviewImage(img.url)}
                          className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 group cursor-pointer bg-zinc-100"
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Files List */}
                  {activeChatMedia.files.length > 0 && (
                    <div className="space-y-1.5">
                      {activeChatMedia.files.map((file, fileIdx) => (
                        <div
                          key={`drawer-file-${file.id || file.url}-${fileIdx}`}
                          className="p-2 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between gap-2"
                        >

                          <div className="flex items-center gap-2 min-w-0">
                            <File className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-zinc-900 truncate">{file.name}</p>
                              <p className="text-[9px] text-zinc-400 font-medium">
                                {file.size} • {file.time}
                              </p>
                            </div>
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-500 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-[11px] font-bold text-zinc-400 space-y-1">
                  <FileImage className="w-6 h-6 mx-auto text-zinc-300 stroke-1" />
                  <p>Chưa có hình ảnh/tệp nào được gửi</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseNewChatModal();
          }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900">Bắt đầu cuộc trò chuyện mới</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Chọn khách thuê từ danh sách phòng để bắt đầu nhắn tin
                </p>
              </div>
              <button
                onClick={handleCloseNewChatModal}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, số phòng hoặc số điện thoại..."
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 divide-y divide-zinc-50">
              {isCreatingChat ? (
                <div className="p-8 text-center text-xs font-bold text-zinc-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2AC1BC]" />
                  <span>Đang mở cuộc trò chuyện...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-zinc-400 space-y-1">
                  <User className="w-8 h-8 mx-auto text-zinc-300 stroke-1" />
                  <p>Không tìm thấy khách thuê phù hợp.</p>
                  <p className="text-[10px] text-zinc-400">
                    Khách thuê sẽ xuất hiện khi có hợp đồng đang hiệu lực.
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact, contactIdx) => (
                  <div
                    key={`contact-${contact.id}-${contactIdx}`}
                    onClick={() => handleSelectContactToChat(contact)}
                    className="p-3 hover:bg-zinc-50 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >

                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl ${getAvatarBg(
                          contact.id
                        )} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        {contact.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-xs text-zinc-900 group-hover:text-[#2AC1BC] transition-colors truncate">
                            {contact.fullName}
                          </h4>
                          {contact.roomName && (
                            <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              {contact.roomName}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
                          {contact.phoneNumber || "Chưa có SĐT"} • {contact.boardingHouseName || "Tòa nhà"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-2 text-zinc-400 group-hover:text-[#2AC1BC] group-hover:bg-[#2AC1BC]/10 rounded-xl transition-all shrink-0 cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal when Closing Form with Unsaved Inputs (Rule 10) */}
      {showCloseModalConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-zinc-900">Xác nhận đóng form</h4>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Bạn có nội dung tìm kiếm chưa hoàn tất. Bạn có chắc muốn hủy bỏ và đóng form không?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCloseModalConfirm(false)}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                onClick={() => {
                  setShowCloseModalConfirm(false);
                  setShowNewChatModal(false);
                  setNewChatSearch("");
                }}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy thay đổi & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPreviewImage(null);
          }}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Xem trước hình ảnh"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandlordMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-bold text-zinc-400">
          Đang tải tin nhắn...
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
