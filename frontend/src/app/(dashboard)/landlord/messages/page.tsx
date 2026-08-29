"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send, Paperclip, Smile, ImageIcon, Phone, Circle, Search, Info,
  Building2, User, FileText, CheckCheck, Clock, Sparkles, ChevronRight,
  MapPin, MessageSquare, ShieldCheck, DollarSign, CalendarDays, ExternalLink,
  Plus, X, Filter, Check, Eye, AlertCircle, Bell, ArrowRight, Smartphone,
  DoorOpen, FileImage, File, ArrowLeft
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

// Media Attachment Interface
interface MediaAttachment {
  id: string;
  name: string;
  url: string;
  type: "image" | "file";
  size?: string;
  time: string;
}

// Conversation Item Interface
interface Conversation {
  id: string;
  room: string;
  building: string;
  tenant: string;
  phone: string;
  avatarBg: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  type: "tenant" | "lead";
  rentPrice?: string;
  contractStatus?: string;
  paymentStatus?: "Đã thu đủ" | "Còn nợ";
  mediaFiles?: MediaAttachment[];
}

// Message Item Interface
interface Message {
  id: number | string;
  sender: "me" | "them" | "system";
  text: string;
  time: string;
  isSystem?: boolean;
  systemAction?: {
    label: string;
    actionType: "invoice" | "contract" | "reminder";
    invoiceId?: string;
    period?: string;
  };
  attachments?: string[];
}

function MessagesContent() {
  const { activeBuilding } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlRoom = searchParams.get("room") || searchParams.get("search") || "";
  const urlTenant = searchParams.get("tenant") || "";
  const urlInvId = searchParams.get("invId") || "";
  const urlAmount = searchParams.get("amount") || "";
  const urlPeriod = searchParams.get("period") || "";
  const autoSend = searchParams.get("autoSend") === "true";

  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read" | "tenant" | "new_lead">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Mock Conversations List
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "c1",
      room: "Phòng 101",
      building: activeBuilding.name,
      tenant: "Nguyễn Văn Tuấn",
      phone: "0988 123 456",
      avatarBg: "bg-teal-600",
      lastMessage: "Dạ vâng, tầm 2h chiều chủ nhật em có nhà anh nhé.",
      time: "09:25 AM",
      unread: 0,
      online: true,
      type: "tenant",
      rentPrice: "3.500.000đ",
      contractStatus: "Còn hiệu lực",
      paymentStatus: "Đã thu đủ",
      mediaFiles: [
        { id: "m1", name: "Anh_dong_ho_dien_T8.jpg", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600", type: "image", time: "Hôm nay 08:30" },
        { id: "m2", name: "Bien_nhan_chuyen_khoan.png", url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600", type: "image", time: "Hôm nay 08:45" },
        { id: "m3", name: "Hop_dong_P101.pdf", url: "#", type: "file", size: "1.2 MB", time: "12/08/2026" },
      ]
    },
    {
      id: "c2",
      room: "Phòng 205",
      building: activeBuilding.name,
      tenant: "Trần Thị Mai",
      phone: "0912 345 678",
      avatarBg: "bg-[#2AC1BC]",
      lastMessage: "Anh ơi, vòi nước bồn rửa chén bị rò nhẹ ạ.",
      time: "08:15 AM",
      unread: 2,
      online: true,
      type: "tenant",
      rentPrice: "4.200.000đ",
      contractStatus: "Còn hiệu lực",
      paymentStatus: "Còn nợ",
      mediaFiles: [
        { id: "m4", name: "Anh_bon_rua_chen_ro.jpg", url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600", type: "image", time: "Hôm nay 08:10" }
      ]
    },
    {
      id: "c3",
      room: "Hỏi phòng 302",
      building: "Dormio Premier",
      tenant: "Lê Hoàng Nam (Khách mới)",
      phone: "0977 888 999",
      avatarBg: "bg-blue-600",
      lastMessage: "Chào anh, phòng 302 tháng 9 có chuyển vào ở ngay được không ạ?",
      time: "Hôm qua",
      unread: 1,
      online: false,
      type: "lead",
      rentPrice: "3.800.000đ",
      contractStatus: "Chưa thuê trọ",
      mediaFiles: []
    },
    {
      id: "c4",
      room: "Hỏi phòng 201",
      building: activeBuilding.name,
      tenant: "Đặng Bích Ngọc (Khách mới)",
      phone: "0909 333 444",
      avatarBg: "bg-indigo-600",
      lastMessage: "Dạ cho em hỏi phòng 201 có ban công rộng không anh?",
      time: "Thứ 2",
      unread: 0,
      online: true,
      type: "lead",
      rentPrice: "3.600.000đ",
      contractStatus: "Chưa thuê trọ",
      mediaFiles: []
    },
    {
      id: "c5",
      room: "Phòng 105",
      building: activeBuilding.name,
      tenant: "Hoàng Minh Trí",
      phone: "0933 555 777",
      avatarBg: "bg-emerald-600",
      lastMessage: "Em vừa chuyển khoản tiền nhà tháng này rồi ạ.",
      time: "12/08",
      unread: 0,
      online: false,
      type: "tenant",
      rentPrice: "3.200.000đ",
      contractStatus: "Sắp hết hạn",
      paymentStatus: "Đã thu đủ",
      mediaFiles: [
        { id: "m5", name: "Bien_nhan_1208.jpg", url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600", type: "image", time: "12/08 14:00" }
      ]
    },
  ]);

  const [activeChat, setActiveChat] = useState<Conversation>(conversations[0]);

  // Mock Messages Store per Conversation
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({
    c1: [
      { id: 1, sender: "them", text: "Chào anh, tháng này tiền điện nước của phòng 101 là bao nhiêu ạ?", time: "08:30 AM" },
      { id: 2, sender: "me", text: "Chào Tuấn, hóa đơn điện nước tháng này của em là 350.000đ nhé. Đã cập nhật trên app rồi.", time: "08:45 AM" },
      { id: 3, sender: "system", text: "Hóa đơn tháng 08/2026 phòng 101 đã được gửi tự động qua Zalo & App.", time: "08:46 AM", isSystem: true, systemAction: { label: "Xem Hóa Đơn", actionType: "invoice" } },
      { id: 4, sender: "them", text: "Dạ vâng em thấy rồi ạ. Cuối tuần này có lịch phun xịt trùng tòa nhà đúng không anh?", time: "09:10 AM" },
      { id: 5, sender: "me", text: "Đúng rồi em, tầm 2h chiều Chủ Nhật nhé. Em nhớ đóng cửa sổ và che đậy đồ ăn.", time: "09:20 AM" },
      { id: 6, sender: "them", text: "Dạ vâng, tầm 2h chiều chủ nhật em có nhà anh nhé.", time: "09:25 AM" },
    ],
    c2: [
      { id: 101, sender: "them", text: "Anh ơi, vòi nước bồn rửa chén bị rò nhẹ ạ.", time: "08:10 AM" },
      { id: 102, sender: "them", text: "Anh gọi thợ kỹ thuật qua xem giúp em với.", time: "08:15 AM" },
    ],
    c3: [
      { id: 201, sender: "them", text: "Chào anh, em xem trên nền tảng Dormio thấy phòng 302 đang đăng tin cho thuê.", time: "Hôm qua 15:30" },
      { id: 202, sender: "them", text: "Chào anh, phòng 302 tháng 9 có chuyển vào ở ngay được không ạ?", time: "Hôm qua 15:32" },
    ],
    c4: [
      { id: 301, sender: "them", text: "Dạ cho em hỏi phòng 201 có ban công rộng không anh?", time: "Thứ 2 10:00" },
      { id: 302, sender: "me", text: "Chào Ngọc, phòng 201 ban công hướng Nam thoáng mát lắm em nhé.", time: "Thứ 2 10:15" },
    ],
    c5: [
      { id: 401, sender: "them", text: "Em vừa chuyển khoản tiền nhà tháng này rồi ạ.", time: "12/08 14:00" },
    ],
  });

  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (urlRoom || urlTenant || urlInvId) {
      const matchConv = conversations.find((c) =>
        (urlRoom && (c.room.toLowerCase().includes(urlRoom.toLowerCase()) || c.room.replace('Phòng ', '') === urlRoom)) ||
        (urlTenant && c.tenant.toLowerCase().includes(urlTenant.toLowerCase()))
      );

      if (matchConv) {
        setActiveChat(matchConv);
        setMobileShowChat(true);

        if (autoSend && urlInvId) {
          const existingMsgs = messagesMap[matchConv.id] || [];
          const alreadySent = existingMsgs.some(m => m.systemAction?.invoiceId === urlInvId);

          if (!alreadySent) {
            const formattedAmount = urlAmount ? Number(urlAmount).toLocaleString("vi-VN") + " ₫" : "";
            const autoMsg: Message = {
              id: `inv-msg-${Date.now()}`,
              sender: "me",
              text: `📌 THÔNG BÁO HÓA ĐƠN THÁNG ${urlPeriod || "NÀY"}: Ban quản lý gửi thông báo thanh toán tiền phòng ${matchConv.room}. Tổng tiền: ${formattedAmount}. Quý khách vui lòng quét mã VietQR trong chi tiết hóa đơn hoặc chuyển khoản theo đúng hạn.`,
              time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
              isSystem: true,
              systemAction: {
                label: "Xem Hóa Đơn Chi Tiết",
                actionType: "invoice",
                invoiceId: urlInvId,
                period: urlPeriod,
              }
            };

            setMessagesMap(prev => ({
              ...prev,
              [matchConv.id]: [...(prev[matchConv.id] || []), autoMsg]
            }));

            setConversations(prev => prev.map(c => c.id === matchConv.id ? {
              ...c,
              lastMessage: `📌 Đã gửi thông báo hóa đơn ${urlInvId}`,
              time: "Vừa xong"
            } : c));
          }
        }
      }
    }
  }, [isMounted, urlRoom, urlTenant, urlInvId, urlAmount, urlPeriod, autoSend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat, messagesMap]);

  if (!isMounted) return null;

  // Filter Conversations Logic
  const filteredConversations = conversations.filter((c) => {
    const matchSearch =
      c.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    if (!matchSearch) return false;

    if (activeTab === "unread") return c.unread > 0;
    if (activeTab === "read") return c.unread === 0;
    if (activeTab === "tenant") return c.type === "tenant";
    if (activeTab === "new_lead") return c.type === "lead";
    return true;
  });

  const currentMessages = messagesMap[activeChat.id] || [];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const newMsg: Message = {
      id: Date.now(),
      sender: "me",
      text: text.trim(),
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg],
    }));

    // Update last message in conversation list
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? { ...c, lastMessage: text.trim(), time: "Vừa xong", unread: 0 }
          : c
      )
    );

    if (!textToSend) setInputMessage("");
  };

  // Preset Smart Quick Replies
  const quickReplies = [
    "Đã nhận thông tin, BQL sẽ kiểm tra ngay nhé!",
    "Đã báo thợ kỹ thuật sang hỗ trợ cho em rồi.",
    "Hóa đơn đã chốt trên ứng dụng, em kiểm tra nhé.",
    "Dạ phòng vẫn còn trống, anh/chị có thể xem ngay.",
  ];

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[100vh] bg-white border-y border-zinc-200/80 overflow-hidden flex">
      {/* PANE 1: Left Conversation List */}
      <div className={`w-full lg:w-96 border-r border-zinc-200/80 flex-col bg-zinc-50/50 shrink-0 ${
        mobileShowChat ? "hidden lg:flex" : "flex"
      }`}>
        {/* Top Search & Filter Tabs */}
        <div className="p-3.5 border-b border-zinc-200/80 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm tên, phòng, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
            />
          </div>

          {/* Filter Tabs (Flex-Wrap Responsive Pills) */}
          <div className="flex flex-wrap items-center gap-1.5 py-0.5 text-[11px] font-extrabold">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${activeTab === "all" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
                }`}
            >
              Tất cả ({conversations.length})
            </button>

            <button
              onClick={() => setActiveTab("unread")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${activeTab === "unread" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
                }`}
            >
              Chưa đọc ({conversations.filter(c => c.unread > 0).length})
            </button>

            <button
              onClick={() => setActiveTab("read")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${activeTab === "read" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
                }`}
            >
              Đã đọc ({conversations.filter(c => c.unread === 0).length})
            </button>

            <button
              onClick={() => setActiveTab("tenant")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${activeTab === "tenant" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
                }`}
            >
              Khách thuê ({conversations.filter(c => c.type === "tenant").length})
            </button>

            <button
              onClick={() => setActiveTab("new_lead")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${activeTab === "new_lead" ? "bg-[#2AC1BC] text-white shadow-2xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
                }`}
            >
              Khách mới ({conversations.filter(c => c.type === "lead").length})
            </button>
          </div>
        </div>

        {/* Conversation List Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-zinc-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-400">
              Không tìm thấy cuộc trò chuyện nào.
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const isSelected = activeChat.id === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat);
                    setConversations(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                    setMobileShowChat(true);
                  }}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${isSelected ? "bg-[#2AC1BC]/10 border-l-4 border-l-[#2AC1BC]" : "hover:bg-zinc-100/80"
                    }`}
                >
                  {/* Avatar with Status Dot */}
                  <div className="relative shrink-0 pt-0.5">
                    <div className={`w-10 h-10 rounded-2xl ${chat.avatarBg} text-white font-black text-sm flex items-center justify-center shadow-2xs`}>
                      {chat.tenant.charAt(0)}
                    </div>
                    {chat.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Đang hoạt động" />
                    )}
                  </div>

                  {/* Meta & Last Message */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs text-zinc-900 truncate">
                        {chat.room}
                      </span>
                      <span className={`text-[10px] font-bold shrink-0 ${chat.unread > 0 ? "text-[#2AC1BC]" : "text-zinc-400"}`}>
                        {chat.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-zinc-700 truncate">{chat.tenant}</span>
                      {chat.type === "tenant" && (
                        <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Khách thuê
                        </span>
                      )}
                      {chat.type === "lead" && (
                        <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          Khách mới
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${chat.unread > 0 ? "font-extrabold text-zinc-900" : "font-medium text-zinc-500"}`}>
                        {chat.lastMessage}
                      </p>
                      {chat.unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[#2AC1BC] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {chat.unread}
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
      <div className={`flex-1 flex-col min-w-0 bg-white ${
        mobileShowChat ? "flex" : "hidden lg:flex"
      }`}>
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
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${activeChat.avatarBg} text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-2xs`}>
                {activeChat.tenant.charAt(0)}
              </div>
              {activeChat.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="font-black text-xs sm:text-sm text-zinc-900 truncate shrink-0">
                  {activeChat.room}
                </h2>
                <span className="text-[11px] sm:text-xs font-bold text-zinc-500 truncate">
                  • {activeChat.tenant}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-zinc-400 truncate">
                {activeChat.online ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold shrink-0">
                    <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500 animate-pulse" /> Online
                  </span>
                ) : (
                  <span className="truncate">{activeChat.time}</span>
                )}
                <span className="hidden sm:inline">• {activeChat.phone}</span>
              </div>
            </div>
          </div>

          {/* Top Action Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={`tel:${activeChat.phone}`}
              className="p-1.5 sm:p-2 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer"
              title="Gọi điện"
            >
              <Phone className="w-4 h-4" />
            </a>
            {activeChat.type === "tenant" && (
              <button
                onClick={() => router.push(`/landlord/contracts?search=${encodeURIComponent(activeChat.room.replace('Phòng ', ''))}`)}
                className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Hợp đồng
              </button>
            )}
            <button
              onClick={() => setShowRightDrawer(!showRightDrawer)}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${showRightDrawer ? "bg-[#2AC1BC]/10 text-[#2AC1BC]" : "hover:bg-zinc-100 text-zinc-600"
                }`}
              title="Thông tin ngữ cảnh phòng"
            >
              <Info className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 bg-zinc-50/60">
          <div className="text-center my-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-white border border-zinc-200 px-3 py-1 rounded-full shadow-2xs">
              Hôm nay
            </span>
          </div>

          {currentMessages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="max-w-md mx-auto my-3 p-3 bg-white border border-[#2AC1BC]/30 rounded-2xl shadow-2xs text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#2AC1BC]">
                    <Sparkles className="w-4 h-4" /> Thông báo từ hệ thống Dormio
                  </div>
                  <p className="text-xs text-zinc-600 font-semibold leading-relaxed">{msg.text}</p>
                  {msg.systemAction && (
                    <button
                      onClick={() => {
                        if (msg.systemAction?.actionType === "invoice") {
                          const roomNo = activeChat.room.replace('Phòng ', '');
                          const invId = msg.systemAction.invoiceId || `INV-202608-${roomNo}`;
                          const period = msg.systemAction.period || "08/2026";
                          router.push(`/landlord/invoices?id=${encodeURIComponent(invId)}&room=${encodeURIComponent(roomNo)}&period=${encodeURIComponent(period)}&tenant=${encodeURIComponent(activeChat.tenant)}`);
                        } else if (msg.systemAction?.actionType === "contract") {
                          router.push(`/landlord/contracts?search=${encodeURIComponent(activeChat.room.replace('Phòng ', ''))}`);
                        } else {
                          router.push('/landlord/invoices');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC] hover:text-white text-[#2AC1BC] text-xs font-extrabold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs group"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{msg.systemAction.label} ({activeChat.room} - T08/2026)</span>
                    </button>
                  )}
                </div>
              );
            }

            const isMe = msg.sender === "me";

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${isMe
                    ? "bg-[#2AC1BC] text-white rounded-br-xs font-medium"
                    : "bg-white border border-zinc-200/80 text-zinc-900 rounded-bl-xs font-medium"
                    }`}
                >
                  {msg.text}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${isMe ? "text-zinc-400" : "text-zinc-400"}`}>
                  <span>{msg.time}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-[#2AC1BC]" />}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Preset Smart Quick Reply Chips */}
        <div className="px-4 py-2 bg-zinc-100/80 border-t border-zinc-200/80 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider shrink-0">Nhanh:</span>
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(reply)}
              className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-[#2AC1BC] hover:text-white text-zinc-700 border border-zinc-200 rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Message Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-zinc-200/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              title="Đính kèm tệp"
            >
              <Paperclip className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              title="Gửi hình ảnh"
            >
              <ImageIcon className="w-4.5 h-4.5" />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={`Soạn tin nhắn gửi đến ${activeChat.room}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-4 py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Gửi</span> <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Backdrop Overlay for Right Drawer */}
      {showRightDrawer && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowRightDrawer(false)}
        />
      )}

      {/* PANE 3: Right Contextual Tenant & Room Panel */}
      {showRightDrawer && (
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
              <div className={`w-14 h-14 rounded-2xl ${activeChat.avatarBg} text-white font-black text-xl flex items-center justify-center mx-auto shadow-sm`}>
                {activeChat.tenant.charAt(0)}
              </div>
              <div>
                <h4 className="font-black text-sm text-zinc-900">{activeChat.tenant}</h4>
                <p className="text-zinc-500 text-[11px] font-semibold mt-0.5">{activeChat.phone}</p>
              </div>

              <div className="pt-2 flex justify-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Đã xác minh CCCD (OCR)
                </span>
              </div>
            </div>

            {/* Room & Contract Info */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="font-extrabold text-sm text-[#2AC1BC]">{activeChat.room}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                  {activeChat.building}
                </span>
              </div>

              {activeChat.type === "tenant" ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-semibold">Giá thuê:</span>
                    <span className="font-black text-zinc-900">{activeChat.rentPrice || "3.500.000đ"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-semibold">Hợp đồng:</span>
                    <span className="font-extrabold text-emerald-600">{activeChat.contractStatus || "Còn hiệu lực"}</span>
                  </div>

                  {activeChat.paymentStatus && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-semibold">Tiền nhà:</span>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${activeChat.paymentStatus === "Đã thu đủ" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                        {activeChat.paymentStatus}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-zinc-50 rounded-xl text-center text-zinc-500 font-semibold text-[11px] leading-relaxed">
                  Khách mới tìm trọ trên sàn BHRP.<br />Chưa đăng ký phòng & chưa có hợp đồng.
                </div>
              )}
            </div>

            {/* Action Buttons: Link sang Phòng & Link sang Hợp đồng */}
            <div className="space-y-2 pt-1">
              {activeChat.type === "tenant" ? (
                <>
                  {/* Link sang Phòng tương ứng */}
                  <button
                    onClick={() => router.push(`/landlord/rooms?search=${encodeURIComponent(activeChat.room.replace('Phòng ', ''))}`)}
                    className="w-full p-2.5 bg-white hover:bg-[#2AC1BC]/10 hover:border-[#2AC1BC]/40 text-zinc-800 hover:text-[#2AC1BC] border border-zinc-200 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                  >
                    <span className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-[#2AC1BC]" /> Xem Chi Tiết {activeChat.room}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Link sang Hợp đồng phòng tương ứng */}
                  <button
                    onClick={() => router.push(`/landlord/contracts?search=${encodeURIComponent(activeChat.room.replace('Phòng ', ''))}`)}
                    className="w-full p-2.5 bg-white hover:bg-[#2AC1BC]/10 hover:border-[#2AC1BC]/40 text-zinc-800 hover:text-[#2AC1BC] border border-zinc-200 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#2AC1BC]" /> Xem Hợp Đồng {activeChat.room}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </>
              ) : (
                <div className="p-3 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 block">Chưa gắn thông tin phòng & hợp đồng</span>
                  <span className="text-[10px] text-zinc-400 block">Sẽ tự động cập nhật khi khách ký hợp đồng</span>
                </div>
              )}
            </div>

            {/* Media & Attachments Storage Section */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="font-extrabold text-xs text-zinc-900 flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-[#2AC1BC]" /> Lưu trữ Hình ảnh & Tệp
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-zinc-100 text-zinc-600 rounded-md">
                  {activeChat.mediaFiles?.length || 0}
                </span>
              </div>

              {activeChat.mediaFiles && activeChat.mediaFiles.length > 0 ? (
                <div className="space-y-2">
                  {/* Images Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {activeChat.mediaFiles.filter(m => m.type === "image").map(img => (
                      <div
                        key={img.id}
                        onClick={() => setPreviewImage(img.url)}
                        className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 group cursor-pointer bg-zinc-100"
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Files List */}
                  {activeChat.mediaFiles.filter(m => m.type === "file").map(file => (
                    <div key={file.id} className="p-2 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-zinc-900 truncate">{file.name}</p>
                          <p className="text-[9px] text-zinc-400 font-medium">{file.size} • {file.time}</p>
                        </div>
                      </div>
                      <a href="#" className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-500">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
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

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setPreviewImage(null); }}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={previewImage} alt="Xem trước hình ảnh" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandlordMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-zinc-400">Đang tải tin nhắn...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
