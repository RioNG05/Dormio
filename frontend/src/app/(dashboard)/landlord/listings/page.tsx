"use client";

import React, { useState } from "react";
import { Plus, Search, Filter, Image as ImageIcon, MapPin, MoreHorizontal, X, Check, UploadCloud } from "lucide-react";

export default function ListingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Đăng tin phòng</h1>
          <p className="text-sm text-zinc-500">Quản lý tin đăng tìm khách thuê trên hệ thống Dormio</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Đăng tin mới
        </button>
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
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors">
            <Filter className="w-4 h-4" /> Trạng thái
          </button>
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
