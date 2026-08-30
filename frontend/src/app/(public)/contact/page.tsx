"use client";

import React, { useState } from "react";
import {
  Sparkles, Phone, Mail, MapPin, MessageSquare, Send, CheckCircle2, ChevronDown, Clock, ShieldCheck, ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [topic, setTopic] = useState("tu-van");
  const [customSubject, setCustomSubject] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !content) return;
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20 overflow-x-hidden">

      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2AC1BC]/20 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/30 shadow-lg">
            <Sparkles className="w-4 h-4" /> HỖ TRỢ TRỰC TUYẾN DORMIO 24/7
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] drop-shadow-md">
            <span>Liên Hệ Hỗ Trợ &</span> <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent">
              Tư Vấn Giải Pháp
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto text-balance">
            Bạn có câu hỏi, góp ý hay cần tư vấn giải pháp quản lý nhà trọ? Hãy gửi yêu cầu cho chúng tôi.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 w-full">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left Column: Direct Support Channels (Leveraging Both Primary Colors) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[#2AC1BC] uppercase tracking-wider block">KÊNH LIÊN HỆ TRỰC TIẾP</span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-snug">
                Chúng tôi luôn sẵn sàng hỗ trợ
              </h2>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Đội ngũ CSKH Dormio làm việc từ 08:00 - 21:00 tất cả các ngày trong tuần.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Channel 1: SĐT / Zalo (Clickable tel:) */}
              <a
                href="tel:0901234567"
                className="p-5 rounded-3xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-4 hover:border-[#FF6B35] transition-all group shadow-xs cursor-pointer block"
                title="Bấm để gọi điện tư vấn ngay"
              >
                <div className="p-3.5 bg-[#FF6B35]/10 text-[#FF6B35] rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-900 text-sm">Hotline & Zalo OA Khẩn Cấp</h3>
                  <p className="text-xs font-black text-[#FF6B35] mt-0.5 group-hover:underline">0901.234.567 (Tư vấn 24/7)</p>
                  <span className="text-[10px] text-zinc-400 font-medium block mt-1">Phản hồi nhanh trong 3 phút • Bấm để gọi</span>
                </div>
              </a>

              {/* Channel 2: Email (Clickable mailto:) */}
              <a
                href="mailto:support@dormio.vn"
                className="p-5 rounded-3xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-4 hover:border-[#2AC1BC] transition-all group shadow-xs cursor-pointer block"
                title="Bấm để gửi email hỗ trợ"
              >
                <div className="p-3.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-900 text-sm">Email Hỗ Trợ Kỹ Thuật & VietQR</h3>
                  <p className="text-xs font-semibold text-zinc-800 mt-0.5 group-hover:text-[#2AC1BC] group-hover:underline">support@dormio.vn</p>
                  <span className="text-[10px] text-zinc-400 font-medium block mt-1">Giải đáp chi tiết trong 2 giờ • Bấm để gửi mail</span>
                </div>
              </a>

              {/* Channel 3: Địa chỉ Trụ Sở */}
              <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-4 hover:border-zinc-400 transition-all group shadow-xs">
                <div className="p-3.5 bg-zinc-900 text-white rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-[#2AC1BC]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-zinc-900 text-sm">Văn Phòng Trụ Sở Dormio</h3>
                  <p className="text-xs text-zinc-600 font-medium leading-relaxed">Tòa nhà FPT, Khu Công Nghệ Cao, Q.9, TP. Thủ Đức, TP. HCM</p>

                  <a
                    href="https://www.google.com/maps/search/?api=1&query=T%C3%B2a+nh%C3%A0+FPT+Khu+C%C3%B4ng+Ngh%E1%BB%87+Cao+Quan+9+Ho+Chi+Minh"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2AC1BC] hover:underline pt-1"
                  >
                    <span>Mở Google Maps chỉ đường</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-xl space-y-6">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-zinc-900">Gửi yêu cầu thành công!</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Cảm ơn bạn đã liên hệ với Dormio. Đội ngũ chuyên gia sẽ gọi điện phản hồi tới số điện thoại <strong className="text-zinc-900">{phone}</strong> trong vòng 15 phút.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-zinc-900 text-white font-extrabold text-xs rounded-xl hover:bg-zinc-800 transition-all cursor-pointer shadow-md"
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-lg font-black text-zinc-900">Gửi Tin Nhắn Yêu Cầu Hỗ Trợ</h3>
                  <p className="text-xs text-zinc-500 font-medium">Điền thông tin bên dưới để chuyên viên tư vấn Dormio liên hệ hỗ trợ bạn.</p>
                </div>

                {/* Topic Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Chủ đề bạn cần hỗ trợ *</label>
                  <div className="relative">
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-2xl appearance-none focus:outline-none focus:border-[#2AC1BC] cursor-pointer"
                    >
                      <option value="tu-van">Tư vấn gói phần mềm quản lý trọ (BHMS)</option>
                      <option value="bhrp">Hỗ trợ đăng tin cho thuê phòng (BHRP)</option>
                      <option value="ky-thuat">Báo lỗi kỹ thuật & Thanh toán VietQR</option>
                      <option value="khac">Khác (Chủ đề khác)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
                  </div>
                </div>

                {/* Dynamic input when topic === "khac" */}
                {topic === "khac" && (
                  <div className="space-y-1.5 animate-in fade-in duration-300">
                    <label className="text-xs font-bold text-zinc-700">Tiêu đề cụ thể *</label>
                    <input
                      type="text"
                      placeholder="Nhập tiêu đề chủ đề cần hỗ trợ..."
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-4 py-3 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Họ và tên *</label>
                    <input
                      type="text"
                      placeholder="Nhập họ và tên..."
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Số điện thoại liên hệ *</label>
                    <input
                      type="text"
                      placeholder="Nhập số điện thoại..."
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Nội dung chi tiết câu hỏi *</label>
                  <textarea
                    rows={4}
                    placeholder="Mô tả chi tiết thắc mắc hoặc câu hỏi của bạn..."
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-3 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                {/* Solid Brand Teal Action Button */}
                <button
                  type="submit"
                  className="w-full py-4 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#2AC1BC]/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <Send className="w-4 h-4" /> Gửi Yêu Cầu Hỗ Trợ Ngay &rarr;
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-zinc-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl border border-zinc-800">
          <h2 className="text-2xl sm:text-4xl font-black text-white leading-snug">
            Sẵn sàng trải nghiệm quản lý nhà trọ thông minh?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-medium">
            Đăng ký tài khoản Dormio ngay hôm nay để trải nghiệm miễn phí 7 ngày đầy đủ các tính năng nâng cao.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/30 transition-all cursor-pointer hover:scale-105">
                Dùng thử miễn phí 7 ngày &rarr;
              </button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer">
                Xem chi tiết bảng giá
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
