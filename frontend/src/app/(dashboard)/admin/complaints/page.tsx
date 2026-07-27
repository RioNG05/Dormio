"use client";

import React, { useState } from "react";
import { AlertCircle, Clock, CheckCircle2, Search, Filter, MessageSquare, MoreHorizontal, ShieldAlert, User, Home, ArrowUpRight } from "lucide-react";

interface ComplaintItem {
  id: string;
  room: string;
  building: string;
  tenantName: string;
  tenantPhone: string;
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  createdDate: string;
}

export default function LandlordComplaintsPage() {
  const initialComplaints: ComplaintItem[] = Array.from({ length: 50 }).map((_, i) => {
    const buildings = ["Dormio House Quận 1", "Dormio Student House Cầu Giấy", "Dormio Premium Bình Thạnh"];
    const rooms = ["P101", "P102", "P201", "P202", "P301", "P302", "P401", "P402"];
    const names = ["Trần Thị Thu Hà", "Phạm Quốc Bảo", "Vũ Thị Mai Anh", "Nguyễn Văn Hùng", "Lê Thanh Sơn", "Đỗ Hải Yến", "Bùi Hoàng Nam"];
    const titles = [
      "Điều hòa kêu to và yếu lạnh",
      "Vòi sen nhà vệ sinh bị rỉ nước",
      "Bóng đèn tuýp ban công hỏng",
      "Wifi tầng 2 sóng yếu hay rớt mạng",
      "Ống thoát nước bồn rửa bát chảy chậm",
      "Chốt khóa cửa bấm vân tay kẹt",
      "Đề nghị vệ sinh khu vực hành lang",
      "Tủ lạnh phát ra tiếng ồn về đêm",
    ];

    const bIdx = i % buildings.length;
    const rIdx = i % rooms.length;
    const nIdx = i % names.length;
    const tIdx = i % titles.length;

    const priority: "HIGH" | "MEDIUM" | "LOW" = i % 5 === 0 ? "HIGH" : i % 2 === 0 ? "MEDIUM" : "LOW";
    const status: "PENDING" | "IN_PROGRESS" | "RESOLVED" = i % 3 === 0 ? "PENDING" : i % 3 === 1 ? "IN_PROGRESS" : "RESOLVED";

    return {
      id: `SC-2026-${(i + 1).toString().padStart(3, "0")}`,
      room: rooms[rIdx],
      building: buildings[bIdx],
      tenantName: names[nIdx],
      tenantPhone: `090${(3000000 + i * 179).toString().slice(0, 7)}`,
      title: titles[tIdx],
      description: `Khách phản ánh về sự cố ${titles[tIdx].toLowerCase()}, nhờ kĩ thuật qua hỗ trợ xử lý sớm.`,
      priority,
      status,
      createdDate: `${(1 + (i % 25)).toString().padStart(2, "0")}/07/2026`,
    };
  });

  const [complaints, setComplaints] = useState<ComplaintItem[]>(initialComplaints);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);

  const filteredComplaints = complaints.filter((item) => {
    const matchesTab = activeTab === "ALL" || item.status === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleUpdateStatus = (id: string, newStatus: "PENDING" | "IN_PROGRESS" | "RESOLVED") => {
    setComplaints(complaints.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint({ ...selectedComplaint, status: newStatus });
    }
  };

  const pendingCount = complaints.filter((c) => c.status === "PENDING").length;
  const inProgressCount = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý sự cố & Phản ánh</h1>
          <p className="text-sm text-zinc-500">Tiếp nhận ticket hỏng hóc từ khách thuê và theo dõi tiến độ sửa chữa</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">Tổng sự cố</div>
          <div className="text-2xl font-extrabold text-zinc-900 mt-1">{complaints.length}</div>
        </div>
        <div className="p-4 bg-white border border-amber-200 bg-amber-50/40 rounded-xl shadow-xs">
          <div className="text-xs text-amber-800 font-semibold uppercase tracking-wide flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Chờ xử lý
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
        </div>
        <div className="p-4 bg-white border border-blue-200 bg-blue-50/40 rounded-xl shadow-xs">
          <div className="text-xs text-blue-800 font-semibold uppercase tracking-wide flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Đang sửa chữa
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{inProgressCount}</div>
        </div>
        <div className="p-4 bg-white border border-emerald-200 bg-emerald-50/40 rounded-xl shadow-xs">
          <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wide flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-1.5 bg-zinc-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "ALL" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              Tất cả ({complaints.length})
            </button>
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "PENDING" ? "bg-white text-amber-600 shadow-xs" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              Chờ xử lý ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("IN_PROGRESS")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "IN_PROGRESS" ? "bg-white text-blue-600 shadow-xs" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              Đang sửa ({inProgressCount})
            </button>
            <button
              onClick={() => setActiveTab("RESOLVED")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "RESOLVED" ? "bg-white text-emerald-600 shadow-xs" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              Đã xong ({resolvedCount})
            </button>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm mã ticket, tên phòng, người gửi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3">Mã ticket</th>
                <th className="px-6 py-3">Tòa nhà / Phòng</th>
                <th className="px-6 py-3">Người báo</th>
                <th className="px-6 py-3">Nội dung phản ánh</th>
                <th className="px-6 py-3">Độ ưu tiên</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3 text-right">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredComplaints.slice(0, 20).map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-6 py-4 font-extrabold text-zinc-900">{item.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-primary">{item.room}</div>
                    <div className="text-[11px] text-zinc-400">{item.building}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-zinc-800">{item.tenantName}</div>
                    <div className="text-[11px] text-zinc-400">{item.tenantPhone}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="font-bold text-zinc-900 line-clamp-1">{item.title}</div>
                    <div className="text-[11px] text-zinc-500 line-clamp-1">{item.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.priority === "HIGH" ? "bg-rose-100 text-rose-700" : item.priority === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600"}`}>
                      {item.priority === "HIGH" ? "Cao (Gấp)" : item.priority === "MEDIUM" ? "Vừa" : "Thấp"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-extrabold text-[11px]">
                        <Clock className="w-3 h-3" /> Chờ xử lý
                      </span>
                    )}
                    {item.status === "IN_PROGRESS" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px]">
                        <AlertCircle className="w-3 h-3" /> Đang sửa
                      </span>
                    )}
                    {item.status === "RESOLVED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Đã xong
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                      className="text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2 py-1 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="PENDING">Chờ xử lý</option>
                      <option value="IN_PROGRESS">Đang sửa</option>
                      <option value="RESOLVED">Đã hoàn thành</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}