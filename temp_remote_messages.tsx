"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  CheckCheck,
  Search,
  Phone,
  Info,
  ChevronRight,
  ArrowLeft,
  X,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Building2,
  Wrench,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

interface Message {
  id: string | number;
  sender: "me" | "them";
  text: string;
  time: string;
  isSystem?: boolean;
  systemAction?: {
    label: string;
    invoiceData?: {
      id: string;
      amount: number;
      period: string;
      dueDate: string;
    };
  };
}

interface Conversation {
  id: string;
  name: string;
  role: "landlord" | "employee";
  roleTitle: string;
  phone: string;
  avatarBg: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

const formatCurrency = (amount: number, locale: string) => {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function TenantMessagesPage() {
  const t = useTranslations("tenantPortal");
  const { locale } = useLanguage();

  const [activeConvId, setActiveConvId] = useState<string>("landlord_main");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<
    "all" | "landlord" | "employee" | "unread"
  >("all");

  const [selectedPayInvoice, setSelectedPayInvoice] = useState<{
    id: string;
    amount: number;
    period: string;
    dueDate: string;
  } | null>(null);
  const [hasCopied, setHasCopied] = useState<string | null>(null);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const [conversations] = useState<Conversation[]>([
    {
      id: "landlord_main",
      name: "Nguyễn Văn Rio",
      role: "landlord",
      roleTitle: locale === "en" ? "Landlord (Owner)" : "Chủ Nhà Trọ",
      phone: "0901.234.567",
      avatarBg: "bg-emerald-600",
      lastMessage:
        locale === "en"
          ? "Ok got it, I have received the room rent."
          : "Ok em, anh nhận được tiền phòng tháng này rồi nhé.",
      time: "10:30",
      unread: 0,
      online: true,
    },
    {
      id: "staff_manager",
      name: "Trần Thị Bích",
      role: "employee",
      roleTitle: locale === "en" ? "House Manager" : "Quản Lý Trọ",
      phone: "0908.765.432",
      avatarBg: "bg-teal-600",
      lastMessage:
        locale === "en"
          ? "Notice: Hallway spraying scheduled this Sat at 2:00 PM."
          : "BQL thông báo: Phun thuốc khử trùng hành lang thứ Bảy 14h nhé.",
      time: locale === "en" ? "Yesterday" : "Hôm qua",
      unread: 1,
      online: true,
    },
    {
      id: "staff_tech",
      name: "Lê Văn Cường",
      role: "employee",
      roleTitle: locale === "en" ? "Maintenance Tech" : "Kỹ Thuật Viên",
      phone: "0912.888.999",
      avatarBg: "bg-blue-600",
      lastMessage:
        locale === "en"
          ? "I will visit room 101 at 5:00 PM to inspect the AC."
          : "Chiều 17:00 anh qua phòng 101 kiểm tra điều hòa nhé.",
      time: "14/07",
      unread: 0,
      online: false,
    },
  ]);

  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({
    landlord_main: [
      {
        id: 1,
        sender: "them",
        text:
          locale === "en"
            ? "Hello! Electricity and water for room 101 has been calculated for July."
            : "Chào em! Tiền điện nước phòng 101 tháng 07 đã được chốt rồi nhé.",
        time: "08:45",
      },
      {
        id: 2,
        sender: "them",
        text:
          locale === "en"
            ? "Invoice #INV-072026 issued: 4,120,000 ₫. Due date: 05/08/2026."
            : "Hóa đơn kỳ Tháng 07/2026 đã được phát hành: 4.120.000 ₫. Hạn thanh toán: 05/08/2026.",
        time: "08:46",
        isSystem: true,
        systemAction: {
          label: locale === "en" ? "Pay Now via VietQR" : "Thanh toán ngay VietQR",
          invoiceData: {
            id: "INV-072026",
            amount: 4120000,
            period: "07/2026",
            dueDate: "05/08/2026",
          },
        },
      },
      {
        id: 3,
        sender: "me",
        text:
          locale === "en"
            ? "Thank you anh Rio. I've reviewed the bill and will pay right away."
            : "Dạ em cảm ơn anh. Em xem hóa đơn rồi, lát em chuyển khoản qua VietQR luôn ạ.",
        time: "09:15",
      },
      {
        id: 4,
        sender: "them",
        text:
          locale === "en"
            ? "Ok, I received your July room payment. Thanks!"
            : "Ok em, anh nhận được tiền phòng tháng này rồi nhé.",
        time: "10:30",
      },
    ],
    staff_manager: [
      {
        id: 101,
        sender: "them",
        text:
          locale === "en"
            ? "Management Notice: Regular pest control spraying scheduled for 2:00 PM this Saturday. Please keep windows closed."
            : "Ban quản lý thông báo: Phun thuốc diệt côn trùng định kỳ lúc 14:00 thứ Bảy. Quý cư dân vui lòng đóng cửa sổ.",
        time: "Hôm qua 09:00",
      },
      {
        id: 102,
        sender: "me",
        text:
          locale === "en"
            ? "Noted with thanks! How long will the common hallway spraying take?"
            : "Dạ em đã nhận được thông báo. Phun ở hành lang mất bao lâu vậy chị Bích?",
        time: "Hôm qua 09:30",
      },
    ],
    staff_tech: [
      {
        id: 201,
        sender: "them",
        text:
          locale === "en"
            ? "I will visit room 101 at 5:00 PM to check the AC leak. Will you be home?"
            : "Chiều 17:00 anh qua phòng 101 kiểm tra máng nước máy lạnh nhé. Em có ở phòng không?",
        time: "14/07 16:20",
      },
      {
        id: 202,
        sender: "me",
        text:
          locale === "en"
            ? "Yes anh Cường, I will be at room 101 by 4:45 PM. Thank you!"
            : "Dạ có anh ơi, 16h45 em đi làm về đến phòng rồi ạ. Em cảm ơn anh!",
        time: "14/07 16:25",
      },
    ],
  });

  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0];
  const activeMessages = messagesMap[activeConvId] || [];

  const quickPills = [
    locale === "en" ? "Report an AC fault" : "Báo sự cố máy lạnh",
    locale === "en" ? "Ask about July bill" : "Hỏi về hóa đơn T7",
    locale === "en" ? "Request payment extension" : "Xin gia hạn nộp tiền",
    locale === "en" ? "Register new motorcycle" : "Đăng ký thêm xe máy",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(key);
    setTimeout(() => setHasCopied(null), 2000);
  };

  const handleConfirmPaid = () => {
    setIsPaidSuccess(true);
    setTimeout(() => {
      setIsPaidSuccess(false);
      setSelectedPayInvoice(null);
    }, 1200);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const newMsg: Message = {
      id: Date.now(),
      sender: "me",
      text: text.trim(),
      time: new Date().toLocaleTimeString(locale === "en" ? "en-US" : "vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg],
    }));
    setInputMessage("");
  };

  // Filtered Conversations
  const filteredConversations = conversations.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchSearch) return false;
    if (activeFilterTab === "all") return true;
    if (activeFilterTab === "unread") return c.unread > 0;
    return c.role === activeFilterTab;
  });

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100dvh-3.5rem)] bg-white border-y border-zinc-200/80 overflow-hidden flex relative animate-in fade-in duration-300">
      {/* PANE 1: Left Conversation List */}
      <div
        className={`w-full md:w-80 lg:w-88 border-r border-zinc-200/80 flex flex-col bg-zinc-50/50 shrink-0 ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchChatPlaceholder")}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium focus:outline-none focus:border-[#2AC1BC] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
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
                onClick={() => setActiveFilterTab(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeFilterTab === tab.id
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
          {filteredConversations.map((conv) => {
            const isSelected = activeConversation.id === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveConvId(conv.id);
                  setMobileView("chat");
                }}
                className={`p-3.5 flex items-start gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#2AC1BC]/10 border-l-4 border-l-[#2AC1BC]"
                    : "hover:bg-zinc-100/70"
                }`}
              >
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-2xl ${conv.avatarBg} text-white font-black text-sm flex items-center justify-center shadow-xs`}
                  >
                    {conv.role === "landlord" ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      <Wrench className="w-5 h-5" />
                    )}
                  </div>
                  {conv.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-xs sm:text-sm font-black text-zinc-900 truncate">
                      {conv.name}
                    </h3>
                    <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                      {conv.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60 shrink-0">
                      {conv.roleTitle}
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate">
                      {conv.phone}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 truncate font-normal">
                    {conv.lastMessage}
                  </p>
                </div>

                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {conv.unread}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PANE 2: Center Main Chat Box */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-white h-full overflow-hidden ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Chat Header (Clean Responsive 1-line like Landlord) */}
        <div className="p-3 sm:px-5 sm:py-3.5 border-b border-zinc-200/80 flex items-center justify-between gap-2 bg-white shrink-0 z-10 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Back to list on mobile */}
            <button
              onClick={() => setMobileView("list")}
              className="md:hidden p-1.5 -ml-1 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-700" />
            </button>

            <div className="relative shrink-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${activeConversation.avatarBg} text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs`}
              >
                {activeConversation.role === "landlord" ? (
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              {activeConversation.online && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-zinc-900 truncate shrink-0">
                  {activeConversation.name}
                </h3>
                <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-bold truncate">
                  {activeConversation.roleTitle}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    activeConversation.online
                      ? "bg-emerald-500"
                      : "bg-zinc-300"
                  }`}
                />
                <span className="truncate">
                  {activeConversation.online ? t("onlineNow") : t("offline")}
                </span>
                <span className="hidden sm:inline text-zinc-300">•</span>
                <a
                  href={`tel:${activeConversation.phone}`}
                  className="hidden sm:inline text-[#2AC1BC] hover:underline font-bold truncate"
                >
                  {activeConversation.phone}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <a
              href={`tel:${activeConversation.phone}`}
              className="p-1.5 sm:p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-[#2AC1BC] hover:text-white hover:border-[#2AC1BC] transition-all cursor-pointer shadow-2xs"
              title="Gọi điện"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={() => setShowInfoSidebar(!showInfoSidebar)}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                showInfoSidebar
                  ? "bg-[#2AC1BC] text-white border-[#2AC1BC]"
                  : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
              }`}
              title="Thông tin phòng"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Feed (min-h-0 to guarantee no vertical overflow) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-zinc-50/40 custom-scrollbar">
          {activeMessages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 max-w-md mx-auto my-2 text-center space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-900">
                    <CreditCard className="w-4 h-4 text-[#FF6B35]" />
                    <span>{msg.text}</span>
                  </div>
                  {msg.systemAction && (
                    <button
                      onClick={() =>
                        setSelectedPayInvoice(
                          msg.systemAction?.invoiceData || {
                            id: "INV-072026",
                            amount: 4120000,
                            period: "07/2026",
                            dueDate: "05/08/2026",
                          }
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <span>{msg.systemAction.label}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            }

            const isMe = msg.sender === "me";
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {!isMe && (
                  <div
                    className={`w-8 h-8 rounded-xl ${activeConversation.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                  >
                    {activeConversation.name.charAt(0)}
                  </div>
                )}

                <div
                  className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? "bg-[#2AC1BC] text-white rounded-br-xs shadow-xs"
                      : "bg-white text-zinc-800 border border-zinc-200/80 rounded-bl-xs shadow-2xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                      isMe ? "text-teal-100" : "text-zinc-400"
                    }`}
                  >
                    <span>{msg.time}</span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompt Pills */}
        <div className="px-3.5 py-1.5 border-t border-zinc-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
            {t("quickPillsTitle")}:
          </span>
          {quickPills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(pill)}
              className="px-2.5 py-1 rounded-xl bg-zinc-50 border border-zinc-200/80 text-[11px] font-semibold text-zinc-600 hover:bg-[#2AC1BC]/10 hover:border-[#2AC1BC] hover:text-[#2AC1BC] transition-all shrink-0 cursor-pointer"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-2.5 sm:p-3.5 border-t border-zinc-200/80 bg-white flex items-center gap-2 shrink-0"
        >
          <div className="flex items-center gap-1 text-zinc-400">
            <button
              type="button"
              className="p-2 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              title="Đính kèm tệp"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
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
            disabled={!inputMessage.trim()}
            className="px-4 py-2 sm:py-2.5 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs font-bold cursor-pointer transition-all shadow-xs shadow-[#2AC1BC]/20 disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* PANE 3: Room & Tenancy Context Panel (Desktop inline + Mobile/Tablet Drawer) */}
      {showInfoSidebar && (
        <>
          {/* Mobile/Tablet Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-2xs"
            onClick={() => setShowInfoSidebar(false)}
          />

          {/* Side Panel Content */}
          <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-88 lg:static lg:z-auto lg:w-80 xl:w-88 border-l border-zinc-200/80 bg-zinc-50 flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-5 shrink-0 shadow-xl lg:shadow-none animate-in slide-in-from-right duration-200">
            {/* Header on mobile */}
            <div className="flex lg:hidden items-center justify-between pb-3 border-b border-zinc-200">
              <span className="text-xs font-black text-zinc-900 uppercase">
                {t("roomInfoTitle")}
              </span>
              <button
                onClick={() => setShowInfoSidebar(false)}
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
                  {t("roomNumber")} 101 &bull; Studio
                </h4>
                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Dormio Premier Quận 1</span>
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{t("rentPrice")}</span>
                <span className="font-bold text-[#2AC1BC]">
                  {formatCurrency(4500000, locale)}
                </span>
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
                <div className="text-lg font-black text-zinc-900">
                  {formatCurrency(4120000, locale)}
                </div>
                <div className="text-[11px] text-zinc-500 font-medium">
                  {t("dueDate")}: 05/08/2026
                </div>
              </div>

              <Button
                onClick={() =>
                  setSelectedPayInvoice({
                    id: "INV-072026",
                    amount: 4120000,
                    period: "07/2026",
                    dueDate: "05/08/2026",
                  })
                }
                className="w-full h-8 rounded-xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1"
              >
                <span>{t("btnViewInvoice")}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Shared Attachments & Photos */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                {t("sharedMedia")}
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="h-16 rounded-xl overflow-hidden border border-zinc-200 group relative">
                  <img
                    src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=200&q=80"
                    alt="Electric Meter"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="h-16 rounded-xl overflow-hidden border border-zinc-200 group relative">
                  <img
                    src="https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=200&q=80"
                    alt="Water Meter"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="h-16 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                  <FileText className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold">HĐ.PDF</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Embedded Dynamic VietQR Payment Modal */}
      {selectedPayInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedPayInvoice(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-zinc-200 my-auto"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-zinc-900">
                    {t("vietQrTitle")}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {t("vietQrSubtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayInvoice(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 text-xs custom-scrollbar">
              {/* Left Column: VietQR Code Box */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-center space-y-3">
                <div className="bg-white p-3 rounded-2xl shadow-xs border border-zinc-200 relative group">
                  {/* Generated Demo VietQR */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=2A-DORMIO-PAY-${selectedPayInvoice.id}-${selectedPayInvoice.amount}`}
                    alt="VietQR Payment"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                  <div className="absolute inset-0 bg-[#2AC1BC]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded-full shadow-md">
                      VietQR Auto-Detect
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-zinc-500">
                    {locale === "en"
                      ? "Scan with any Banking App or MoMo"
                      : "Quét bằng ứng dụng Ngân hàng hoặc Ví MoMo"}
                  </span>
                  <p className="text-[10px] text-zinc-400">
                    {locale === "en"
                      ? "Idempotent instant webhook confirmation"
                      : "Xác thực tức thì không qua trung gian"}
                  </p>
                </div>
              </div>

              {/* Right Column: Invoice Details & Banking Transfer info */}
              <div className="space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 space-y-1">
                    <span className="text-[10px] font-black uppercase text-[#FF6B35]">
                      {locale === "en" ? "Amount Payable" : "Số tiền thanh toán"}
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-zinc-900">
                      {formatCurrency(selectedPayInvoice.amount, locale)}
                    </div>
                  </div>

                  <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                    <div className="flex items-center justify-between py-1 border-b border-zinc-200/60 text-zinc-500">
                      <span>{t("beneficiaryBank")}</span>
                      <span className="font-bold text-zinc-900">
                        MBBank (Quân Đội)
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-zinc-200/60 text-zinc-500">
                      <span>{t("accountNumber")}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-zinc-900">
                          0901234567
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard("0901234567", "acc")
                          }
                          className="p-1 hover:bg-zinc-200 rounded text-zinc-500 cursor-pointer"
                        >
                          {hasCopied === "acc" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-zinc-200/60 text-zinc-500">
                      <span>{t("accountHolder")}</span>
                      <span className="font-bold text-zinc-900">
                        NGUYEN VAN RIO
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 text-zinc-500">
                      <span>{t("transferContent")}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {selectedPayInvoice.id}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(selectedPayInvoice.id, "content")
                          }
                          className="p-1 hover:bg-zinc-200 rounded text-zinc-500 cursor-pointer"
                        >
                          {hasCopied === "content" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="pt-2">
                  <Button
                    onClick={handleConfirmPaid}
                    disabled={isPaidSuccess}
                    className="w-full py-3 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs font-bold cursor-pointer transition-all shadow-sm shadow-[#2AC1BC]/20 flex items-center justify-center gap-2"
                  >
                    {isPaidSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 animate-bounce" />
                        <span>{t("ocrSuccess")}</span>
                      </>
                    ) : (
                      <span>{t("btnConfirmPaid")}</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
