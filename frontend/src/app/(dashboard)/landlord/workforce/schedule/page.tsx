"use client";

import React, { useState } from "react";
import { Plus, Calendar as CalendarIcon, X, Clock } from "lucide-react";

export default function SchedulePage() {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Lịch làm việc</h1>
          <p className="text-sm text-zinc-500">Phân ca và xếp lịch làm việc cho nhân viên</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Phân ca mới
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 text-center text-zinc-500 py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
          <CalendarIcon className="w-8 h-8 text-zinc-300" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Chưa có lịch làm việc nào được phân</h3>
        <p className="max-w-md mx-auto mb-6">Bạn chưa xếp lịch làm việc cho nhân viên trong tuần này. Bấm vào nút bên dưới để bắt đầu phân ca.</p>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-bold text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
        >
          Bắt đầu phân ca
        </button>
      </div>

      {/* Add Shift Modal */}
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
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Phân ca làm việc mới</h2>
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
                <label className="text-sm font-bold text-zinc-700">Chọn nhân viên <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                  <option value="">-- Chọn nhân viên --</option>
                  <option value="nv1">Trần Bảo Vệ - Bảo vệ</option>
                  <option value="nv2">Lê Quản Lý - Quản lý</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Ca làm việc <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="sang">Ca sáng (06:00 - 14:00)</option>
                    <option value="chieu">Ca chiều (14:00 - 22:00)</option>
                    <option value="dem">Ca đêm (22:00 - 06:00)</option>
                    <option value="hanhchinh">Hành chính (08:00 - 17:00)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Ngày làm việc <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-zinc-700" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Ghi chú công việc</label>
                <textarea rows={3} placeholder="Ví dụ: Cần kiểm tra khu vực nhà xe kỹ thuật..." className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"></textarea>
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
                Xác nhận xếp ca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
