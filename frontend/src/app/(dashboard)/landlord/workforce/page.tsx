"use client";

import React, { useState } from "react";
import { Plus, Search, UserCircle, MoreHorizontal, X, ShieldAlert } from "lucide-react";

export default function WorkforcePage() {
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

  const staff = [
    { id: "NV-001", name: "Trần Bảo Vệ", role: "Bảo vệ", phone: "0911222333", building: "Tòa A", status: "Đang làm" },
    { id: "NV-002", name: "Lê Quản Lý", role: "Quản lý tòa nhà", phone: "0922333444", building: "Tất cả", status: "Đang làm" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Nhân viên</h1>
          <p className="text-sm text-zinc-500">Quản lý danh sách bảo vệ, tạp vụ, người quản lý</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm nhân viên
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm nhân viên..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Họ tên</th>
                <th className="px-6 py-3 font-medium">Vai trò</th>
                <th className="px-6 py-3 font-medium">Số điện thoại</th>
                <th className="px-6 py-3 font-medium">Phụ trách</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900">{s.name}</div>
                        <div className="text-xs text-zinc-500">{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{s.role}</td>
                  <td className="px-6 py-4 text-zinc-600">{s.phone}</td>
                  <td className="px-6 py-4 text-zinc-600">{s.building}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                      {s.status}
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

      {/* Add Staff Modal */}
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
                  <UserCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Thêm nhân viên mới</h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Họ và tên <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="VD: Nguyễn Văn A" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Số điện thoại <span className="text-red-500">*</span></label>
                  <input type="tel" placeholder="09xxxxxxxxx" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Vai trò / Chức vụ</label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="quanly">Quản lý tòa nhà</option>
                    <option value="ketoan">Kế toán</option>
                    <option value="baove">Bảo vệ</option>
                    <option value="vesinh">Tạp vụ / Vệ sinh</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Phụ trách tòa nhà</label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="tatca">Tất cả</option>
                    <option value="toaa">Tòa A</option>
                    <option value="toab">Tòa B</option>
                  </select>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 text-orange-800 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Quyền truy cập</p>
                  <p className="mt-1 opacity-90">Tài khoản này sẽ có thể đăng nhập vào ứng dụng dành cho nhân viên (Staff App). Mật khẩu mặc định sẽ được gửi qua SMS.</p>
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
                className="px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
              >
                Lưu nhân viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
