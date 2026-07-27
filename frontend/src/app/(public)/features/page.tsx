import React from "react";
import { CheckCircle2, Home, FileText, Wallet, Users, BarChart3, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
  const features = [
    {
      icon: Home,
      title: "Quản lý phòng trọ",
      description: "Thêm, sửa, xoá phòng nhanh chóng. Theo dõi tình trạng phòng trống, đang thuê dễ dàng trên sơ đồ trực quan.",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      icon: FileText,
      title: "Quản lý hợp đồng",
      description: "Tạo hợp đồng điện tử, lưu trữ và quản lý hợp đồng thuê hiệu quả. Tự động gia hạn và cảnh báo khi sắp hết hạn.",
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      icon: Wallet,
      title: "Thu chi & công nợ",
      description: "Ghi nhận thu chi, theo dõi công nợ chi tiết của từng phòng. Nhắc nợ tự động giúp hạn chế nợ xấu.",
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      icon: Users,
      title: "Quản lý khách thuê",
      description: "Lưu trữ thông tin chi tiết khách thuê, lịch sử thuê, và danh sách tạm trú tạm vắng.",
      color: "text-violet-600",
      bg: "bg-violet-100",
    },
    {
      icon: BarChart3,
      title: "Báo cáo thống kê",
      description: "Hệ thống biểu đồ báo cáo doanh thu, chi phí, công nợ, tỷ lệ lấp đầy trực quan, giúp bạn nắm bắt tình hình tức thì.",
      color: "text-rose-600",
      bg: "bg-rose-100",
    },
    {
      icon: Bell,
      title: "Nhắc việc thông minh",
      description: "Tự động nhắc nhở lịch thu tiền, hạn hợp đồng, và lịch bảo trì thiết bị giúp bạn không bỏ sót bất cứ việc gì.",
      color: "text-cyan-600",
      bg: "bg-cyan-100",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Header */}
      <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden bg-zinc-50 border-b border-zinc-200">
        <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0zOSAzOVYxaC0zOHYzOGgzOHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YwZjBmMCIvPjwvc3ZnPg==')] opacity-40" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary mb-6">
            <CheckCircle2 className="w-4 h-4" /> Tính năng nổi bật
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6">
            Đầy đủ công cụ giúp bạn <br className="hidden md:block" /> quản lý nhà trọ chuyên nghiệp
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto">
            Một nền tảng duy nhất thay thế sổ sách, bảng Excel và hàng chục ứng dụng rời rạc, giúp bạn tiết kiệm thời gian tối đa.
          </p>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div key={idx} className="group relative p-8 rounded-3xl border border-zinc-200 bg-white shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feat.bg} ${feat.color}`}>
                  <feat.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3 group-hover:text-primary transition-colors">
                  {feat.title}
                </h3>
                <p className="text-zinc-600 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white text-center">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Bạn đã sẵn sàng để chuyển đổi số?</h2>
          <p className="text-primary-foreground/90 text-lg mb-8">
            Hàng ngàn chủ trọ đã tin dùng Dormio. Hãy bắt đầu hành trình quản lý chuyên nghiệp của bạn ngay hôm nay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=landlord">
              <Button className="w-full sm:w-auto bg-white text-primary hover:bg-zinc-100 text-base font-bold px-8 h-14 rounded-xl shadow-lg">
                Dùng thử miễn phí 7 ngày
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/10 text-base font-semibold px-8 h-14 rounded-xl">
                Liên hệ tư vấn
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
