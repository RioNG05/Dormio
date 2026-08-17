"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, UploadCloud } from "lucide-react";
import Link from "next/link";

export default function CreateListingPage() {
  const router = useRouter();

  const handleFinish = () => {
    router.push("/landlord/listings");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 bg-white min-h-screen p-8 rounded-3xl border border-zinc-200 shadow-sm">
      <div className="flex items-center gap-4 border-b border-zinc-100 pb-6">
        <Link href="/landlord/listings" className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Đăng tin tìm khách</h1>
          <p className="text-sm text-zinc-500 mt-1">Điền thông tin hấp dẫn để tìm kiếm khách thuê nhanh chóng</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Basic Info */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">1. Thông tin cơ bản</h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Tiêu đề tin đăng <span className="text-red-500">*</span></label>
              <input type="text" placeholder="VD: Cho thuê phòng trọ cao cấp, full nội thất tại Quận 1..." className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Phòng áp dụng <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                  <option value="">-- Chọn phòng đang trống --</option>
                  <option value="101">Phòng 101 - Tòa A</option>
                  <option value="103">Phòng 103 - Tòa A</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Giá hiển thị (VND/tháng) <span className="text-red-500">*</span></label>
                <input type="text" placeholder="VD: 3,500,000" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">2. Mô tả chi tiết</h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Nội dung chi tiết</label>
              <textarea rows={6} placeholder="Mô tả về không gian, tiện ích xung quanh, nội thất sẵn có, giờ giấc sinh hoạt..." className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Số người ở tối đa</label>
                <input type="number" defaultValue="2" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                <input type="tel" placeholder="09xxxxxxxxx" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">3. Hình ảnh</h3>
          <div className="border-2 border-dashed border-zinc-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-accent transition-colors cursor-pointer group">
            <UploadCloud className="w-10 h-10 text-zinc-400 group-hover:text-accent mb-3" />
            <span className="text-sm font-bold text-zinc-900">Kéo thả ảnh vào đây hoặc click để tải lên</span>
            <span className="text-xs text-zinc-500 mt-2">Nên đăng tối thiểu 4 ảnh rõ nét (phòng ngủ, nhà vệ sinh, không gian chung) để thu hút khách thuê.</span>
          </div>
        </div>

        <div className="flex justify-end pt-8 border-t border-zinc-100">
          <div className="flex gap-3">
            <button 
              onClick={() => router.push("/landlord/listings")}
              className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={handleFinish}
              className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
            >
              <Check className="w-4 h-4" /> Đăng tin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
