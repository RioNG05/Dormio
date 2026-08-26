"use client";

import React, { useState } from "react";
import {
  Building2, CreditCard, ShieldCheck, Sparkles, Zap, Smartphone,
  FileText, Users, Cpu, MessageSquare, QrCode, BarChart3, Clock, CheckCircle2,
  ArrowRight, Check, Bot, MapPin, Calculator, ShieldAlert, Scale
} from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<"bhms" | "bhrp">("bhms");

  const bhmsFeatures = [
    {
      icon: CreditCard,
      title: "Thu Tiền VietQR Gạch Nợ Tự Động",
      desc: "Tự động tạo mã QR kèm chính xác số tiền & cú pháp. Ngay khi khách chuyển khoản, hệ thống gạch nợ hóa đơn tức thì 24/7 không cần đối soát thủ công.",
      tag: "Vận hành 0 đồng",
    },
    {
      icon: Cpu,
      title: "Quét Số Điện Nước AI OCR Từ Ảnh Chụp",
      desc: "Chụp ảnh đồng hồ điện nước, công nghệ AI tự động nhận diện chỉ số, tính toán số ký tiêu thụ và lập hóa đơn chính xác 100%.",
      tag: "Công nghệ AI",
    },
    {
      icon: FileText,
      title: "Hợp Đồng Điện Tử Thông Minh",
      desc: "Tạo mẫu hợp đồng thuê phòng chuẩn pháp lý Việt Nam, cảnh báo tự động khách thuê sắp hết hạn hợp đồng trước 30 ngày qua Zalo & App.",
      tag: "Chuẩn pháp lý",
    },
    {
      icon: Users,
      title: "Quản Lý Ca Làm & Nhân Viên Tùy Chỉnh",
      desc: "Phân quyền nhân viên quản lý từng nhà trọ, sắp xếp lịch phân ca, chấm công theo vị trí và duyệt công việc minh bạch.",
      tag: "Quản lý nhân sự",
    },
    {
      icon: BarChart3,
      title: "Báo Cáo Doanh Thu & Công Nợ 24/7",
      desc: "Biểu đồ tài chính trực quan phân tích chi tiết doanh thu thực tế, tiền điện nước thu hộ, chi phí bảo trì và danh sách nợ tồn đọng.",
      tag: "Tài chính 24/7",
    },
    {
      icon: Smartphone,
      title: "Thông Báo Zalo & App Tự Động",
      desc: "Tự động gửi hóa đơn thu tiền điện nước hàng tháng và tin nhắn nhắc nợ lịch sự trực tiếp tới điện thoại của khách thuê.",
      tag: "Tự động hóa 100%",
    }
  ];

  const bhrpFeatures = [
    {
      icon: QrCode,
      title: "Đặt Cọc Giữ Phòng VietQR Escrow",
      desc: "Khách thuê đặt cọc giữ chỗ an toàn qua cổng sàn Dormio. Nền tảng tạm giữ an toàn và tự động giải ngân cho chủ trọ khi thỏa thuận thành công.",
      tag: "Bảo vệ tiền cọc",
    },
    {
      icon: Scale,
      title: "So Sánh Thông Số Phòng Trọ Trực Quan",
      desc: "Tùy chọn tích chọn nhiều phòng trọ cùng lúc để đối chiếu song song mức giá thuê, tiền cọc yêu cầu, diện tích và tiện ích đi kèm.",
      tag: "Đối chiếu tiện lợi",
    },
    {
      icon: MapPin,
      title: "Tìm Phòng Trọ Trên Bản Đồ Vệ Tinh",
      desc: "Bản đồ vệ tinh tương tác tìm kiếm phòng trọ trực quan quanh khu vực trường đại học, bến xe bus và nơi làm việc với mức giá hiển thị trên từng ghim.",
      tag: "Bản đồ thông minh",
    },
    {
      icon: ShieldCheck,
      title: "Xác Thực Thông Tin Chính Chủ 100%",
      desc: "Đội ngũ Dormio kiểm duyệt giấy tờ chủ nhà và hình ảnh thực tế phòng trọ 100%, loại bỏ hoàn toàn tin rác và môi giới lừa đảo.",
      tag: "Uy tín hàng đầu",
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">

      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2AC1BC]/20 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/30 shadow-lg">
            <Sparkles className="w-4 h-4" /> BỘ TÍNH NĂNG NỔI BẬT DORMIO
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] drop-shadow-md">
            <span className="inline-block whitespace-nowrap">Tính Năng Vận Hành</span> <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent inline-block whitespace-nowrap">
              Thông Minh, Tự Động Hóa
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto text-balance">
            Khám phá bộ công cụ quản lý nhà trọ và sàn tìm phòng giúp tiết kiệm 80% thời gian vận hành.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-12">

        {/* Exactly 2 Main Section Tabs Switcher (Responsive Mobile Stack) */}
        <div className="flex justify-center w-full">
          <div className="flex flex-col sm:flex-row p-2 sm:p-1.5 bg-zinc-100 rounded-3xl border border-zinc-200/80 max-w-xl w-full gap-2 sm:gap-0">
            <button
              onClick={() => setActiveTab("bhms")}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === "bhms"
                ? "bg-[#2AC1BC] text-white shadow-lg shadow-[#2AC1BC]/30"
                : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <Building2 className="w-4 h-4" /> 1. Quản Lý Nhà Trọ (BHMS)
            </button>

            <button
              onClick={() => setActiveTab("bhrp")}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === "bhrp"
                ? "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30"
                : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <QrCode className="w-4 h-4" /> 2. Sàn Cho Thuê Phòng (BHRP)
            </button>
          </div>
        </div>

        {/* SECTION 1: BHMS — Color Theme: Teal #2AC1BC */}
        {activeTab === "bhms" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-3.5 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/20 uppercase inline-block whitespace-nowrap">
                PHÂN HỆ BHMS — DÀNH CHO CHỦ TRỌ VẬN HÀNH
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-snug">
                <span className="inline-block whitespace-nowrap">Tự Động Hóa 90% Quy Trình</span>{" "}
                <span className="inline-block whitespace-nowrap">Quản Lý Nhà Trọ</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bhmsFeatures.map((feat, idx) => {
                const Icon = feat.icon;

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-8 border border-[#2AC1BC]/20 hover:border-[#2AC1BC] shadow-xs hover:shadow-xl hover:shadow-[#2AC1BC]/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6 group cursor-pointer"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#2AC1BC]/10 text-[#2AC1BC] whitespace-nowrap">
                          {feat.tag}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-zinc-900 group-hover:text-[#2AC1BC] transition-colors leading-snug">
                        {feat.title}
                      </h3>

                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-[#2AC1BC]">
                      <span className="whitespace-nowrap">Khám phá tính năng</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: BHRP — Color Theme: Orange #FF6B35 */}
        {activeTab === "bhrp" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-3.5 py-1 bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-black rounded-full border border-[#FF6B35]/20 uppercase inline-block whitespace-nowrap">
                PHÂN HỆ BHRP — SÀN CHO THUÊ & TÌM PHÒNG
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-snug">
                <span className="inline-block whitespace-nowrap">Tiếp Cận Hàng Ngàn Khách</span>{" "}
                <span className="inline-block whitespace-nowrap">Thuê Phòng Mỗi Ngày</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {bhrpFeatures.map((feat, idx) => {
                const Icon = feat.icon;

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-7 sm:p-8 border border-[#FF6B35]/20 hover:border-[#FF6B35] shadow-xs hover:shadow-xl hover:shadow-[#FF6B35]/15 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6 group cursor-pointer"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#FF6B35]/10 text-[#FF6B35] whitespace-nowrap">
                          {feat.tag}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-zinc-900 group-hover:text-[#FF6B35] transition-colors leading-snug">
                        {feat.title}
                      </h3>

                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-[#FF6B35]">
                      <span className="whitespace-nowrap">Khám phá tính năng</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom CTA Registration Banner */}
        <div className="bg-zinc-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl border border-zinc-800 mt-12">
          <h2 className="text-2xl sm:text-4xl font-black text-white leading-snug">
            <span className="inline-block whitespace-nowrap">Sẵn sàng trải nghiệm</span>{" "}
            <span className="inline-block whitespace-nowrap">quản lý nhà trọ thông minh?</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-medium">
            Đăng ký tài khoản Dormio ngay hôm nay để dùng thử 7 ngày miễn phí đầy đủ tính năng.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register">
              <button className="px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/30 transition-all cursor-pointer hover:scale-105">
                Dùng thử miễn phí 7 ngày &rarr;
              </button>
            </Link>
            <Link href="/pricing">
              <button className="px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer">
                Xem chi tiết bảng giá
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
