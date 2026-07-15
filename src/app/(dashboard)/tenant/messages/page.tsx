"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, ImageIcon, MoreVertical, Phone, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenantMessagesPage() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "landlord", text: "Chào bạn, tháng này tiền điện của phòng mình là 350k nhé.", time: "09:00 AM", isSystem: false },
    { id: 2, sender: "me", text: "Dạ vâng, em đã xem chi tiết hoá đơn trên hệ thống rồi ạ. Lát em sẽ chuyển khoản.", time: "09:15 AM", isSystem: false },
    { id: 3, sender: "landlord", text: "Ok em. À, cuối tuần này toà nhà có người đến xịt muỗi định kỳ. Em nhớ che đậy đồ ăn nhé.", time: "09:16 AM", isSystem: false },
    { id: 4, sender: "me", text: "Khoảng mấy giờ người ta xịt vậy anh?", time: "09:20 AM", isSystem: false },
    { id: 5, sender: "landlord", text: "Tầm 2h chiều chủ nhật nha em.", time: "09:25 AM", isSystem: false },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: inputMessage,
      time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
      isSystem: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");

    // Simulate auto-reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "landlord",
        text: "Hệ thống tự động: Anh Rio hiện không online. Xin để lại lời nhắn, anh ấy sẽ phản hồi sớm nhất.",
        time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              R
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">Ban Quản Lý (Anh Rio)</h2>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <Circle className="w-2 h-2 fill-current" /> Đang hoạt động
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-primary rounded-full">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-zinc-500 rounded-full">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 custom-scrollbar">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <span className="text-xs font-semibold text-zinc-400 bg-white px-3 py-1 rounded-full shadow-xs border border-zinc-100">
              Hôm nay
            </span>
          </div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}>
              {msg.isSystem ? (
                <div className="max-w-[80%] mx-auto mt-2 text-center text-xs font-medium text-zinc-500 italic bg-white px-4 py-2 rounded-xl border border-zinc-200">
                  {msg.text}
                </div>
              ) : (
                <div className="flex flex-col max-w-[75%]">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "me" 
                      ? "bg-primary text-white rounded-tr-sm" 
                      : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm"
                  }`}>
                    {msg.text}
                  </div>
                  <span className={`text-[11px] font-semibold text-zinc-400 mt-1.5 ${
                    msg.sender === "me" ? "text-right" : "text-left"
                  }`}>
                    {msg.time}
                  </span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input Form */}
      <div className="p-4 bg-white border-t border-zinc-100">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600 shrink-0 rounded-full">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600 shrink-0 rounded-full">
            <ImageIcon className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập tin nhắn..." 
              className="w-full h-12 pl-4 pr-12 rounded-xl bg-zinc-100 border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
            />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 rounded-full h-10 w-10">
              <Smile className="w-5 h-5" />
            </Button>
          </div>

          <Button type="submit" disabled={!inputMessage.trim()} className="h-12 w-12 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-sm shrink-0 flex items-center justify-center p-0 disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-5 h-5 ml-1" />
          </Button>
        </form>
      </div>

    </div>
  );
}
