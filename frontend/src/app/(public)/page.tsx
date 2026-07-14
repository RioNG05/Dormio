import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Building, CreditCard, ShieldCheck, Zap } from "lucide-react";

export default function HomePage() {
  const featuredRooms = [
    {
      id: "1",
      title: "Phòng trọ cao cấp Full đồ tại Quận 1, ban công rộng rãi",
      price: 4500000,
      area: 25,
      address: "123 Nguyễn Huệ, Bến Nghé, Quận 1, TP. HCM",
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "2",
      title: "Căn hộ dịch vụ studio thoáng mát, gần trường ĐH Ngoại Thương",
      price: 5500000,
      area: 30,
      address: "45 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "3",
      title: "Phòng trọ khép kín giá rẻ, an ninh tốt cho sinh viên",
      price: 2500000,
      area: 18,
      address: "88 Trần Đại Nghĩa, Bách Khoa, Hai Bà Trưng, Hà Nội",
      image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section based on AnHome reference */}
      <section className="relative pt-10 pb-24 lg:pt-16 lg:pb-32 overflow-hidden bg-white">
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0zOSAzOVYxaC0zOHYzOGgzOHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YwZjBmMCIvPjwvc3ZnPg==')] opacity-15" />
        {/* Soft Radial Glow */}
        <div className="absolute top-1/4 -left-[20%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] z-0 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Column - Content */}
            <div className="flex flex-col items-start text-left gap-6">
              {/* Badge */}
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary tracking-wide">
                <ShieldCheck className="mr-2 h-4 w-4" />
                GIẢI PHÁP QUẢN LÝ NHÀ TRỌ TOÀN DIỆN
              </div>
              
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.15]">
                Quản lý nhà trọ <br /> chuyên nghiệp, <br />
                <span className="text-primary">Tăng lợi nhuận dễ dàng</span>
              </h1>
              
              {/* Sub-headline */}
              <p className="text-lg text-zinc-500 max-w-lg leading-relaxed">
                Tiết kiệm thời gian, giảm thiểu rủi ro và tối ưu doanh thu với phần mềm quản lý nhà trọ thông minh Dormio.
              </p>

              {/* Features List */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-x-8 gap-y-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-zinc-700">Tiết kiệm thời gian</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-zinc-700">Giảm thiểu rủi ro</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-zinc-700">Tăng hiệu quả kinh doanh</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
                <Link href="/register?role=landlord" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-8 h-12 rounded-xl bg-primary hover:bg-primary-hover text-white text-base font-semibold shadow-lg shadow-primary/25">
                    Dùng thử miễn phí 7 ngày &rarr;
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-8 h-12 rounded-xl bg-accent hover:bg-accent-hover text-white text-base font-semibold shadow-lg shadow-accent/25 transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    Xem tính năng
                  </Button>
                </Link>
              </div>

              {/* Trust Indicator */}
              <div className="flex items-center gap-4 mt-6">
                <div className="flex -space-x-3">
                  <div className="w-9 h-9 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-xs font-bold text-orange-600">AM</div>
                  <div className="w-9 h-9 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">CH</div>
                  <div className="w-9 h-9 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center text-xs font-bold text-pink-600">AT</div>
                  <div className="w-9 h-9 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs font-bold text-green-600">LN</div>
                </div>
                <div className="flex flex-col">
                  <div className="flex text-amber-400 text-sm">
                    ★★★★★
                  </div>
                  <span className="text-sm text-zinc-500">
                    Hơn <strong className="text-zinc-900">10.000+</strong> chủ trọ tin dùng Dormio
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Mockup Graphic */}
            <div className="relative w-full h-[500px] flex items-center justify-center lg:justify-end">
              {/* Graphic Container */}
              <div className="relative w-full max-w-[550px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-100 overflow-hidden flex flex-col">
                {/* Browser/Window Header */}
                <div className="h-10 bg-zinc-50/80 border-b border-zinc-100 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-zinc-200"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-200"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-200"></div>
                </div>
                {/* Mockup Body */}
                <div className="flex flex-1 p-4 gap-4 bg-zinc-50/50">
                  {/* Sidebar Menu */}
                  <div className="w-24 flex flex-col gap-2">
                    <div className="bg-primary/10 text-primary text-xs font-bold rounded-lg p-2 flex flex-col items-center gap-1 border border-primary/20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      Tổng quan
                    </div>
                    <div className="text-zinc-400 text-xs font-semibold rounded-lg p-2 flex flex-col items-center gap-1">
                      <Building className="w-5 h-5" />
                      Phòng trọ
                    </div>
                    <div className="text-zinc-400 text-xs font-semibold rounded-lg p-2 flex flex-col items-center gap-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Hợp đồng
                    </div>
                  </div>
                  {/* Main content grid */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-zinc-500 mb-1">Tổng số phòng</div>
                        <div className="text-xl font-bold text-zinc-900">128</div>
                      </div>
                      <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-zinc-500 mb-1">Đang thuê</div>
                        <div className="text-xl font-bold text-zinc-900">96</div>
                      </div>
                      <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-zinc-500 mb-1">Doanh thu tháng</div>
                        <div className="text-xl font-bold text-zinc-900">45.620.000đ</div>
                        <div className="text-[10px] font-bold text-primary mt-1">+12,5%</div>
                      </div>
                      <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-zinc-500 mb-1">Công nợ</div>
                        <div className="text-xl font-bold text-accent">12.850.000đ</div>
                        <div className="text-[10px] font-bold text-accent mt-1">-3,2%</div>
                      </div>
                    </div>
                    {/* Mock Chart */}
                    <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm flex items-end gap-2 h-32">
                      {[40, 60, 45, 70, 55, 80, 50].map((h, i) => (
                        <div key={i} className="w-full bg-primary/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Floating Widget Mockup */}
                <div className="absolute -bottom-6 -left-6 bg-white border border-zinc-100 rounded-2xl p-4 shadow-xl w-40 z-20 flex flex-col gap-3">
                  <div>
                    <div className="text-[10px] text-zinc-400">Doanh thu</div>
                    <div className="text-sm font-bold text-zinc-900">45.620.000đ</div>
                  </div>
                  <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-3/4"></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400">Đã thu tháng này</div>
                    <div className="text-sm font-bold text-zinc-900">38/96 <span className="font-normal text-xs">phòng</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white border-y border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Tại sao chọn Dormio?</h2>
            <p className="mt-4 text-zinc-500">Trải nghiệm tìm phòng và quản lý khác biệt hoàn toàn.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: ShieldCheck, title: "Xác thực 100%", desc: "Mọi tin đăng và chủ nhà đều được kiểm duyệt kỹ lưỡng, đảm bảo an toàn tuyệt đối." },
              { icon: Building, title: "Quản lý thông minh", desc: "Hệ thống quản lý hợp đồng, hóa đơn và khiếu nại dành riêng cho người thuê và chủ nhà." },
              { icon: CreditCard, title: "Thanh toán tiện lợi", desc: "Thanh toán tiền phòng, điện nước hàng tháng dễ dàng qua các cổng thanh toán trực tuyến." },
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 rounded-3xl bg-primary/5 border border-primary/10 shadow-sm hover:shadow-xl hover:bg-primary/10 transition-all duration-300">
                <div className="p-4 bg-primary/10 rounded-2xl mb-6 text-primary">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3">{feature.title}</h3>
                <p className="text-zinc-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-24 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end md:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Phòng Trọ Nổi Bật
            </h2>
            <p className="text-zinc-500 mt-2">
              Những không gian sống chất lượng cao được đánh giá tốt nhất.
            </p>
          </div>
          <Link href="/rooms" className="inline-flex items-center justify-center rounded-xl bg-[#ee6927] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#d55e23] transition-colors">
            Xem tất cả phòng →
          </Link>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredRooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg border border-zinc-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Image Placeholder */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={room.image}
                  alt={room.title}
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-[#ee6927] px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                  Xác thực
                </div>
              </div>

              {/* Room Details */}
              <div className="flex flex-1 flex-col p-6 gap-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-lg text-zinc-900 leading-tight line-clamp-2 group-hover:text-[#ee6927] transition-colors">
                    {room.title}
                  </h3>
                </div>
                <div className="flex items-center text-sm text-zinc-500 gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-1">{room.address}</span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-[#ee6927]">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(room.price)}
                    </span>
                    <span className="text-xs text-zinc-400 font-normal">/tháng</span>
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-50 px-2.5 py-1 rounded-md text-sm font-medium text-zinc-600">
                    <Building className="h-4 w-4" />
                    {room.area} m²
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Services CTA Section based on Image 2 */}
      <section className="relative my-20 mx-4 sm:mx-6 lg:mx-auto max-w-7xl rounded-[2.5rem] overflow-hidden bg-primary shadow-2xl">
        <div className="relative px-8 py-16 md:px-16 md:py-20 flex flex-col lg:flex-row items-center justify-between gap-12 text-white">
          
          {/* Graphic / Icon */}
          <div className="hidden lg:flex items-center justify-center shrink-0 w-32 h-32">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M50 20L20 45V85H80V45L50 20Z" fill="white" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
                <path d="M40 85V55H60V85" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
                <path d="M50 10V20" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                <rect x="25" y="55" width="10" height="10" fill="currentColor" />
                <rect x="65" y="55" width="10" height="10" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Content & Buttons */}
          <div className="flex-1 text-center lg:text-left flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl leading-tight">
                Sẵn sàng quản lý nhà trọ hiệu quả hơn?
              </h2>
              <p className="text-white/90 text-lg">
                Tham gia cùng hàng ngàn chủ trọ đã tin dùng Dormio ngay hôm nay!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/register?role=landlord" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white text-primary hover:bg-zinc-100 border-none px-8 h-12 rounded-xl text-base font-bold shadow-xl transition-transform hover:-translate-y-1">
                  Dùng thử miễn phí 7 ngày
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto px-8 h-12 rounded-xl bg-accent hover:bg-accent-hover text-white text-base font-semibold shadow-lg shadow-accent/25 transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  Tìm hiểu thêm
                </Button>
              </Link>
            </div>
          </div>

          {/* Value Props List */}
          <div className="flex flex-col gap-4 shrink-0 text-white/90 lg:pl-12 lg:border-l lg:border-white/20">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span className="font-medium text-sm md:text-base">Không cần thẻ tín dụng</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span className="font-medium text-sm md:text-base">Hỗ trợ 24/7</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span className="font-medium text-sm md:text-base">Huỷ bất kỳ lúc nào</span>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
