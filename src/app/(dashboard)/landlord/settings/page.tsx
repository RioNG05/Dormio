import React from "react";
import { Save, User, Building, Lock } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Cài đặt hệ thống</h1>
        <p className="text-sm text-zinc-500">Quản lý thông tin cá nhân và thiết lập nhà trọ</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-zinc-200">
          <button className="px-6 py-3 text-sm font-bold text-primary border-b-2 border-primary bg-primary/5 flex items-center gap-2">
            <Building className="w-4 h-4" /> Thông tin nhà trọ
          </button>
          <button className="px-6 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
            <User className="w-4 h-4" /> Tài khoản
          </button>
          <button className="px-6 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Bảo mật
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Tên thương hiệu / Nhà trọ</label>
              <input type="text" defaultValue="Dormio Apartments" className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Số điện thoại liên hệ</label>
              <input type="text" defaultValue="0988777666" className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-zinc-700">Địa chỉ trụ sở chính</label>
              <input type="text" defaultValue="123 Nguyễn Văn Linh, Đà Nẵng" className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="space-y-2 md:col-span-2 border-t border-zinc-200 pt-6">
              <label className="text-sm font-bold text-zinc-700">Thông tin chuyển khoản (In trên hóa đơn)</label>
              <textarea rows={3} defaultValue="Ngân hàng Vietcombank&#13;&#10;STK: 0123456789&#13;&#10;Chủ TK: Nguyễn Văn Rio" className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"></textarea>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/20">
              <Save className="w-4 h-4" /> Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
