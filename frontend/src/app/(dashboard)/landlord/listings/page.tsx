"use client";

import React, { useState } from "react";
import { Plus, Search, Filter, Image as ImageIcon, MapPin, MoreHorizontal, X, Check, UploadCloud, ChevronDown, Building2 } from "lucide-react";

export default function ListingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const getBuildingTitle = (id: string) => {
    if (id === "vinahouse") return "Dormio Campus Cầu Giấy";
    if (id === "dormio") return "Dormio Premier Quận 1";
    return "Dormio Premier Quận 1";
  };

  const handleCloseModal = () => {
    if (isDirty) {
      if (window.confirm("Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?")) {
        setIsModalOpen(false);
        setTimeout(() => setIsDirty(false), 200);
      }
    } else {
      setIsModalOpen(false);
    }
  };

  const listings = [
    { id: "L-101", room: "101", title: "Phòng trọ cao cấp Tầng 1, Đầy đủ nội thất", price: "3.500.000 ₫", status: "Đang hiển thị", views: 124 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#FF6B35] hover:bg-[#ff5518] rounded-xl shadow-md shadow-[#FF6B35]/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Đăng tin phòng trống mới
        </button>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-6 border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <ImageIcon className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {getBuildingTitle(buildingFilter)}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Đăng bài cho thuê phòng trống lên sàn BHRP, thu hút khách thuê tiềm năng và nhận tiền cọc giữ chỗ trực tuyến.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/10 backdrop-blur-md min-w-[135px]">
                <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Số tòa nhà</span>
                  <span className="font-black text-white text-lg leading-none mt-1">1</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[145px]">
                <ImageIcon className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tin đã đăng</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">{listings.length} tin</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2ac1bc]/10 hover:bg-[#2ac1bc]/20 transition-colors rounded-2xl border border-[#2ac1bc]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2ac1bc] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2ac1bc] tracking-wider">Đang hiển thị</span>
                  <span className="font-black text-[#2ac1bc] text-lg leading-none mt-1">1</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Lượt xem tin</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">124</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Yêu cầu cọc</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tin đăng..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex items-center w-full sm:w-56">
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 pl-3.5 pr-10 py-2 text-xs font-semibold text-zinc-900 bg-zinc-50/50 focus:bg-white focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all appearance-none cursor-pointer"
              >
                <option value="dormio">Dormio Premier Quận 1</option>
                <option value="vinahouse">Dormio Campus Cầu Giấy</option>
              </select>
              <ChevronDown className="absolute right-3.5 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Tin đăng</th>
                <th className="px-6 py-3 font-medium">Phòng</th>
                <th className="px-6 py-3 font-medium">Giá thuê</th>
                <th className="px-6 py-3 font-medium">Lượt xem</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {listings.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-900 line-clamp-1">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> 5 ảnh</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Đã ghim map</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">{item.room}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">{item.price}</td>
                  <td className="px-6 py-4 text-zinc-600">{item.views}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-zinc-400 hover:text-accent transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Listing Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]" onInput={() => setIsDirty(true)} onChange={() => setIsDirty(true)}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 text-accent rounded-lg">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Đăng tin tìm khách</h2>
                  <p className="text-sm text-zinc-500">Điền thông tin hấp dẫn để tìm kiếm khách thuê nhanh chóng</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              
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
                    <textarea rows={4} placeholder="Mô tả về không gian, tiện ích xung quanh, nội thất sẵn có, giờ giấc sinh hoạt..." className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"></textarea>
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
                <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-accent transition-colors cursor-pointer group">
                  <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-accent mb-3" />
                  <span className="text-sm font-bold text-zinc-900">Kéo thả ảnh vào đây hoặc click để tải lên</span>
                  <span className="text-xs text-zinc-500 mt-2">Nên đăng tối thiểu 4 ảnh rõ nét (phòng ngủ, nhà vệ sinh, không gian chung) để thu hút khách thuê.</span>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50/50">
              <button 
                onClick={handleCloseModal}
                className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => { setIsModalOpen(false); setIsDirty(false); }}
                className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
              >
                <Check className="w-4 h-4" /> Đăng tin
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
