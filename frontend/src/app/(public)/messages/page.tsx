"use client";

import React, { useState } from "react";
import { 
  Send, Search, User, CheckCheck, Image as ImageIcon, Paperclip, 
  MapPin, Phone, Building2, ChevronLeft, ShieldCheck, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@/context/LanguageContext";

export default function GuestMessagesPage() {
  const t = useTranslations("guestMessagesPage");
  const [activeConversationId, setActiveConversationId] = useState("1");
  const [messageInput, setMessageInput] = useState("");

  const conversations = [
    {
      id: "1",
      landlordName: "Nguyễn Văn Rio",
      roomTitle: "Phòng trọ cao cấp Full đồ tại Quận 1",
      roomPrice: "4.500.000 ₫",
      avatar: "R",
      lastMessage: "Dạ phòng 101 còn trống bạn nhé, bạn có muốn hẹn giờ qua xem phòng không?",
      timestamp: "10:45 AM",
      unread: true,
      messages: [
        { id: "m1", sender: "guest", text: "Chào anh Rio, phòng 101 ở Nguyễn Trãi còn trống không ạ?", time: "10:30 AM" },
        { id: "m2", sender: "landlord", text: "Chào bạn! Dạ phòng 101 còn trống bạn nhé, phòng đầy đủ máy lạnh, tủ lạnh, giường nệm.", time: "10:35 AM" },
        { id: "m3", sender: "landlord", text: "Dạ phòng 101 còn trống bạn nhé, bạn có muốn hẹn giờ qua xem phòng không?", time: "10:45 AM" },
      ]
    },
    {
      id: "2",
      landlordName: "Trần Văn Cường",
      roomTitle: "Căn hộ dịch vụ Studio Cầu Giấy",
      roomPrice: "5.500.000 ₫",
      avatar: "C",
      lastMessage: "Cọc giữ chỗ 1 triệu đồng để giữ phòng trong 3 ngày bạn nhé.",
      timestamp: "Hôm qua",
      unread: false,
      messages: [
        { id: "m10", sender: "guest", text: "Anh Cường ơi, cọc giữ chỗ trên ứng dụng Dormio hết bao nhiêu ạ?", time: "Hôm qua" },
        { id: "m11", sender: "landlord", text: "Cọc giữ chỗ 1 triệu đồng để giữ phòng trong 3 ngày bạn nhé.", time: "Hôm qua" },
      ]
    }
  ];

  const currentChat = conversations.find(c => c.id === activeConversationId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    currentChat.messages.push({
      id: `m_${Date.now()}`,
      sender: "guest",
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setMessageInput("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rooms">
          <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{t("title")}</h1>
          <p className="text-xs text-zinc-500">{t("subtitle")}</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] h-[calc(100vh-220px)]">
        {/* Left Column: Conversation List */}
        <div className="lg:col-span-4 border-r border-zinc-200 flex flex-col bg-zinc-50/50">
          <div className="p-4 border-b border-zinc-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all bg-zinc-50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`w-full text-left p-4 flex gap-3 transition-colors ${
                  activeConversationId === conv.id ? "bg-white shadow-xs border-l-4 border-l-[#2ac1bc]" : "hover:bg-zinc-100/60"
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white font-black flex items-center justify-center shrink-0">
                  {conv.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-extrabold text-zinc-900 text-sm truncate">{conv.landlordName}</h3>
                    <span className="text-[10px] text-zinc-400 font-semibold">{conv.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#2ac1bc] font-bold truncate mb-1">{conv.roomTitle}</p>
                  <p className="text-xs text-zinc-500 truncate">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Chat Box */}
        <div className="lg:col-span-8 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-white shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white font-black flex items-center justify-center text-sm">
                {currentChat.avatar}
              </div>
              <div>
                <h3 className="font-extrabold text-zinc-900 text-sm flex items-center gap-1.5">
                  {currentChat.landlordName}
                  <ShieldCheck className="w-4 h-4 text-[#2ac1bc]" />
                </h3>
                <p className="text-xs text-zinc-500 font-medium truncate max-w-xs">{currentChat.roomTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                {currentChat.roomPrice}
              </span>
              <a href="tel:0901234567" className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-600">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50/30">
            {currentChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "guest" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium ${
                    msg.sender === "guest"
                      ? "bg-zinc-900 text-white rounded-br-none shadow-md"
                      : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-none shadow-xs"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-zinc-400 mt-1 font-semibold px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder={t("inputPlaceholder")}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all bg-zinc-50"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2ac1bc] hover:bg-[#72b3a3] text-white rounded-xl text-xs font-bold shadow-md shadow-[#2ac1bc]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {t("send")} <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
