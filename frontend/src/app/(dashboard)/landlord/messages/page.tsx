"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Camera, MoreVertical, Phone, Circle, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandlordMessagesPage() {
  // Mock Data: Chat List
  const conversations = [
    { id: "c1", room: "Phòng 101", tenant: "Nguyễn Văn A", lastMessage: "Tầm 2h chiều chủ nhật nha em.", time: "09:25 AM", unread: 0, online: true },
    { id: "c2", room: "Phòng 205", tenant: "Trần Thị B", lastMessage: "Anh ơi, bồn rửa chén bị nghẹt rồi ạ.", time: "Hôm qua", unread: 2, online: false },
    { id: "c3", room: "Phòng 302", tenant: "Lê Văn C", lastMessage: "Em đã chuyển khoản tiền phòng tháng này.", time: "Thứ 2", unread: 0, online: true },
    { id: "c4", room: "Phòng 105", tenant: "Phạm Hoàng D", lastMessage: "Vâng em cảm ơn.", time: "12/07", unread: 0, online: false },
  ];

  const [activeChat, setActiveChat] = useState(conversations[0]);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock Data: Messages for active chat
  const [messages, setMessages] = useState([
    { id: 1, sender: "me", text: "Chào bạn, tháng này tiền điện của phòng mình là 350k nhé.", time: "09:00 AM", isSystem: false },
    { id: 2, sender: "them", text: "Dạ vâng, em đã xem chi tiết hoá đơn trên hệ thống rồi ạ. Lát em sẽ chuyển khoản.", time: "09:15 AM", isSystem: false },
    { id: 3, sender: "me", text: "Ok em. À, cuối tuần này toà nhà có người đến xịt muỗi định kỳ. Em nhớ che đậy đồ ăn nhé.", time: "09:16 AM", isSystem: false },
    { id: 4, sender: "them", text: "Khoảng mấy giờ người ta xịt vậy anh?", time: "09:20 AM", isSystem: false },
    { id: 5, sender: "me", text: "Tầm 2h chiều chủ nhật nha em.", time: "09:25 AM", isSystem: false },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  // Handle switching chat to reset messages (mock logic)
  useEffect(() => {
    if (activeChat.id === "c2") {
      setMessages([
        { id: 101, sender: "them", text: "Anh ơi, bồn rửa chén bị nghẹt rồi ạ. Nước không rút được.", time: "08:00 AM", isSystem: false },
        { id: 102, sender: "them", text: "Anh gọi thợ qua xem giúp em với.", time: "08:01 AM", isSystem: false },
      ]);
    } else if (activeChat.id === "c1") {
      // default
      setMessages([
        { id: 1, sender: "me", text: "Chào bạn, tháng này tiền điện của phòng mình là 350k nhé.", time: "09:00 AM", isSystem: false },
        { id: 2, sender: "them", text: "Dạ vâng, em đã xem chi tiết hoá đơn trên hệ thống rồi ạ. Lát em sẽ chuyển khoản.", time: "09:15 AM", isSystem: false },
        { id: 3, sender: "me", text: "Ok em. À, cuối tuần này toà nhà có người đến xịt muỗi định kỳ. Em nhớ che đậy đồ ăn nhé.", time: "09:16 AM", isSystem: false },
        { id: 4, sender: "them", text: "Khoảng mấy giờ người ta xịt vậy anh?", time: "09:20 AM", isSystem: false },
        { id: 5, sender: "me", text: "Tầm 2h chiều chủ nhật nha em.", time: "09:25 AM", isSystem: false },
      ]);
    } else {
      setMessages([{ id: 999, sender: "me", text: "Cuộc trò chuyện mới...", time: "Bây giờ", isSystem: true }]);
    }
  }, [activeChat]);

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
  };

  const filteredConversations = conversations.filter(c => 
    c.room.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.tenant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      
      {/* Left Pane: Chat List */}
      <div className="w-80 flex flex-col border-r border-zinc-200 bg-zinc-50/50 shrink-0">
        <div className="p-4 border-b border-zinc-100 flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900">Tin nhắn</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm phòng, tên khách..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 h-10 w-full rounded-xl bg-white border border-zinc-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-zinc-100 last:border-0 ${
                activeChat.id === chat.id ? "bg-primary/5" : "hover:bg-zinc-100"
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-bold text-sm">
                  {chat.tenant.charAt(0)}
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="font-bold text-sm text-zinc-900 truncate">{chat.room}</div>
                  <div className={`text-xs ${chat.unread > 0 ? "text-primary font-bold" : "text-zinc-400"}`}>
                    {chat.time}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`text-xs truncate mr-2 ${chat.unread > 0 ? "text-zinc-900 font-semibold" : "text-zinc-500"}`}>
                    {chat.tenant}: {chat.lastMessage}
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {chat.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredConversations.length === 0 && (
            <div className="p-6 text-center text-sm text-zinc-500">
              Không tìm thấy cuộc trò chuyện nào.
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Active Chat Window */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                {activeChat.tenant.charAt(0)}
              </div>
              {activeChat.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                {activeChat.room} <span className="text-zinc-400 font-normal text-sm">- {activeChat.tenant}</span>
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                {activeChat.online ? (
                  <><Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> Đang hoạt động</>
                ) : (
                  <><Circle className="w-2 h-2 fill-zinc-300 text-zinc-300" /> Hoạt động {activeChat.time}</>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-primary rounded-full">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-500 rounded-full">
              <Info className="w-5 h-5" />
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
              <Camera className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Nhập tin nhắn tới ${activeChat.room}...`}
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

    </div>
  );
}
