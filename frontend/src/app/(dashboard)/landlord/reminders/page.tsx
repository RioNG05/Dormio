"use client";

import React, { useState } from "react";
import { Plus, BellRing, Calendar, CheckCircle, X, Clock } from "lucide-react";

export default function RemindersPage() {
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

  const reminders = [
    { id: 1, title: "Thu tiền điện nước tòa A", date: "Cuối mỗi tháng", status: "Đang mở", type: "Hàng tháng" },
    { id: 2, title: "Bảo trì thang máy", date: "15/10/2024", status: "Đã xong", type: "Không lặp" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Nhắc nhở</h1>
          <p className="text-sm text-zinc-500">Hệ thống thông báo tự động và To-do list</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm nhắc nhở
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-accent" />
              Công việc cần làm
            </h2>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">1 việc</span>
          </div>
          
          <div className="space-y-4">
            {reminders.filter(r => r.status === "Đang mở").map(r => (
              <div key={r.id} className="flex items-start gap-4 p-4 border border-zinc-100 bg-zinc-50 rounded-lg">
                <button className="mt-1 w-5 h-5 rounded-full border-2 border-zinc-300 hover:border-accent transition-colors" />
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900">{r.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {r.date}</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-zinc-200">{r.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Đã hoàn thành
            </h2>
          </div>
          
          <div className="space-y-4 opacity-70">
            {reminders.filter(r => r.status === "Đã xong").map(r => (
              <div key={r.id} className="flex items-start gap-4 p-4 border border-zinc-100 bg-white rounded-lg">
                <div className="mt-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <CheckCircle className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-zinc-500 line-through">{r.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-zinc-400">
                    <span>Hoàn thành: {r.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]" onInput={() => setIsDirty(true)} onChange={() => setIsDirty(true)}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 text-accent rounded-lg">
                  <BellRing className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Tạo nhắc nhở mới</h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Tiêu đề công việc <span className="text-red-500">*</span></label>
                <input type="text" placeholder="VD: Thu tiền nhà tháng 8" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Phân loại</label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="thutien">Thu tiền</option>
                    <option value="suachua">Sửa chữa / Bảo trì</option>
                    <option value="hopdong">Hợp đồng</option>
                    <option value="khac">Khác</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Lặp lại</label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="khong">Không lặp lại</option>
                    <option value="hangngay">Hàng ngày</option>
                    <option value="hangtuan">Hàng tuần</option>
                    <option value="hangthang">Hàng tháng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Ngày nhắc <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Giờ nhắc (Tùy chọn)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="time" className="w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-zinc-700" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Ghi chú thêm</label>
                <textarea rows={3} placeholder="Nhập mô tả chi tiết..." className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"></textarea>
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
                className="px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
              >
                Lưu nhắc nhở
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
