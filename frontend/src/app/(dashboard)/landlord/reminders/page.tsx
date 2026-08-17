"use client";

import React, { useState } from "react";
import {
  Plus, BellRing, Calendar, CheckCircle, X, Clock,
  Send, MessageSquare, Users, Building2, Eye
} from "lucide-react";

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState<"reminders" | "notifications">("reminders");
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleCloseReminderModal = () => {
    if (isDirty) {
      if (window.confirm("Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?")) {
        setIsReminderModalOpen(false);
        setTimeout(() => setIsDirty(false), 200);
      }
    } else {
      setIsReminderModalOpen(false);
    }
  };

  const handleCloseNotifModal = () => {
    if (isDirty) {
      if (window.confirm("Thông báo chưa được gửi đi. Bạn có chắc chắn muốn hủy?")) {
        setIsNotifModalOpen(false);
        setTimeout(() => setIsDirty(false), 200);
      }
    } else {
      setIsNotifModalOpen(false);
    }
  };

  // Mock Data
  const reminders = [
    { id: 1, title: "Thu tiền điện nước tòa A", date: "Cuối mỗi tháng", status: "Đang mở", type: "Hàng tháng" },
    { id: 2, title: "Bảo trì thang máy", date: "15/10/2026", status: "Đã xong", type: "Không lặp" },
  ];

  const notifications = [
    { id: 1, title: "Thông báo cắt điện luân phiên", content: "Kính báo quý khách thuê, điện lực khu vực sẽ tiến hành bảo trì lưới điện từ 8:00 đến 12:00 ngày 20/07/2026.", target: "Toàn bộ tòa nhà Dormio Building", date: "16/07/2026 09:30", sender: "Quản lý" },
    { id: 2, title: "Lịch xịt muỗi định kỳ", content: "Cuối tuần này tòa nhà sẽ có đội vệ sinh đến xịt muỗi. Đề nghị các phòng che đậy đồ ăn cẩn thận.", target: "Tất cả khách thuê", date: "10/07/2026 14:00", sender: "Quản lý" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Thông báo & Nhắc nhở</h1>
          <p className="text-sm text-zinc-500">Quản lý thông báo & nhắc nhở gửi đến khách thuê</p>
        </div>
        <div>
          {activeTab === "reminders" ? (
            <button
              onClick={() => setIsReminderModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Thêm công việc
            </button>
          ) : (
            <button
              onClick={() => setIsNotifModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all"
            >
              <Send className="w-4 h-4" /> Gửi thông báo mới
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-100/50 p-1 rounded-xl w-full sm:w-fit border border-zinc-200">
        <button
          onClick={() => setActiveTab("reminders")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "reminders"
            ? "bg-white text-accent shadow-sm border border-zinc-200"
            : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
            }`}
        >
          <BellRing className="w-4 h-4" />
          Nhắc nhở công việc
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "notifications"
            ? "bg-white text-primary shadow-sm border border-zinc-200"
            : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
            }`}
        >
          <MessageSquare className="w-4 h-4" />
          Thông báo khách thuê
        </button>
      </div>

      {/* Tab Content: Notifications */}
      {activeTab === "notifications" && (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Tiêu đề / Nội dung</th>
                  <th className="px-6 py-4">Đối tượng nhận</th>
                  <th className="px-6 py-4">Thời gian gửi</th>
                  <th className="px-6 py-4">Người gửi</th>
                  <th className="px-6 py-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-zinc-50/80 transition-colors group">
                    <td className="px-6 py-4 max-w-md">
                      <div className="font-bold text-zinc-900 mb-1">{notif.title}</div>
                      <div className="text-zinc-500 text-xs truncate">{notif.content}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
                        <Users className="w-3 h-3" /> {notif.target}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-medium">{notif.date}</td>
                    <td className="px-6 py-4 text-zinc-600">{notif.sender}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {isReminderModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseReminderModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onInput={() => setIsDirty(true)} onChange={() => setIsDirty(true)}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 text-accent rounded-xl">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Thêm nhắc nhở công việc</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Hệ thống sẽ nhắc nhở bạn khi đến thời hạn</p>
                </div>
              </div>
              <button
                onClick={handleCloseReminderModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar bg-zinc-50/30">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Tiêu đề công việc <span className="text-red-500">*</span></label>
                <input type="text" placeholder="VD: Thu tiền nhà tháng 8" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Phân loại</label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="thutien">Thu tiền</option>
                    <option value="suachua">Sửa chữa / Bảo trì</option>
                    <option value="hopdong">Hợp đồng</option>
                    <option value="khac">Khác</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Lặp lại</label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="khong">Không lặp lại</option>
                    <option value="hangngay">Hàng ngày</option>
                    <option value="hangtuan">Hàng tuần</option>
                    <option value="hangthang">Hàng tháng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Ngày nhắc <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-zinc-700 bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Giờ nhắc (Tùy chọn)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="time" className="w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-zinc-700 bg-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Ghi chú thêm</label>
                <textarea rows={3} placeholder="Nhập mô tả chi tiết..." className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none bg-white"></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white">
              <button
                onClick={handleCloseReminderModal}
                className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => { setIsReminderModalOpen(false); setIsDirty(false); }}
                className="px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
              >
                Lưu nhắc nhở
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {isNotifModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseNotifModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onInput={() => setIsDirty(true)} onChange={() => setIsDirty(true)}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Soạn thông báo mới</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Thông báo sẽ được gửi qua App Khách thuê hoặc Zalo</p>
                </div>
              </div>
              <button
                onClick={handleCloseNotifModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar bg-zinc-50/30">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Đối tượng nhận thông báo <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors bg-white">
                    <input type="radio" name="target" className="w-4 h-4 text-primary focus:ring-primary accent-primary" defaultChecked />
                    <span className="text-sm font-medium text-zinc-900">Tất cả khách</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors bg-white">
                    <input type="radio" name="target" className="w-4 h-4 text-primary focus:ring-primary accent-primary" />
                    <span className="text-sm font-medium text-zinc-900">Theo Tòa nhà</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors bg-white">
                    <input type="radio" name="target" className="w-4 h-4 text-primary focus:ring-primary accent-primary" />
                    <span className="text-sm font-medium text-zinc-900">Chọn phòng</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Tiêu đề thông báo <span className="text-red-500">*</span></label>
                <input type="text" placeholder="VD: Lịch cúp điện ngày 20/07" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Nội dung chi tiết <span className="text-red-500">*</span></label>
                <textarea rows={5} placeholder="Nhập nội dung thông báo gửi đến khách..." className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none bg-white"></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white">
              <button
                onClick={handleCloseNotifModal}
                className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => { setIsNotifModalOpen(false); setIsDirty(false); }}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all"
              >
                <Send className="w-4 h-4" /> Gửi thông báo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
