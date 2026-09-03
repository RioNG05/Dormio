"use client";
import { useTranslations } from "@/context/LanguageContext";

import React, { useState } from "react";
import { 
  AlertOctagon, Plus, Search, Filter, Wrench, Volume2, ShieldAlert, 
  CheckCircle2, Clock, ChevronDown, Building2, MessageSquare, Image as ImageIcon
} from "lucide-react";

export default function ComplaintsPage() {
  const t = useTranslations("operations");
  const [buildingFilter, setBuildingFilter] = useState("dormio");
  const [statusFilter, setStatusFilter] = useState("");

  const getBuildingTitle = (id: string) => {
    if (id === "vinahouse") return "Dormio Campus Cầu Giấy";
    if (id === "dormio") return "Dormio Premier Quận 1";
    return "Dormio Premier Quận 1";
  };

  const grievances = [
    {
      id: "GRV-102",
      room: "102",
      tenant: "Nguyễn Văn A",
      category: "Sửa chữa thiết bị",
      title: "Vòi nước phòng tắm bị rò rỉ nước",
      priority: "Cao",
      status: "Đang xử lý",
      date: "25/08/2026",
      assignee: "Nguyễn Văn Bảo"
    },
    {
      id: "GRV-205",
      room: "205",
      tenant: "Trần Thị B",
      category: "Tiếng ồn",
      title: "Phòng bên cạnh 206 gây ồn ào sau 23h",
      priority: "Trung bình",
      status: "Mới mở",
      date: "26/08/2026",
      assignee: "Chưa phân công"
    },
    {
      id: "GRV-301",
      room: "301",
      tenant: "Lê Văn C",
      category: "Sửa chữa thiết bị",
      title: "Máy lạnh phát ra tiếng kêu to và không mát",
      priority: "Cao",
      status: "Đã hoàn thành",
      date: "20/08/2026",
      assignee: "Thợ điện lạnh"
    },
    {
      id: "GRV-105",
      room: "105",
      tenant: "Phạm Hoàng D",
      category: "An ninh",
      title: "Quên chìa khóa cổng khóa vân tay",
      priority: "Thấp",
      status: "Đã hoàn thành",
      date: "18/08/2026",
      assignee: "Bảo vệ Cường"
    }
  ];

  const filteredGrievances = grievances.filter(g => 
    statusFilter === "" || g.status === statusFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2ac1bc] hover:bg-[#72b3a3] rounded-xl shadow-md shadow-[#2ac1bc]/20 transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Ghi nhận sự cố mới
        </button>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-6 border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <AlertOctagon className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {getBuildingTitle(buildingFilter)}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Tiếp nhận và xử lý sự cố thiết bị, khiếu nại tiếng ồn, an ninh từ khách thuê trọ (UC-T-07).
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
                <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng sự cố</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">{grievances.length}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2ac1bc]/10 hover:bg-[#2ac1bc]/20 transition-colors rounded-2xl border border-[#2ac1bc]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2ac1bc] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2ac1bc] tracking-wider">Đã xử lý</span>
                  <span className="font-black text-[#2ac1bc] text-lg leading-none mt-1">2</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Đang xử lý</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">1</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Mới mở</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm sự cố, số phòng..."
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all bg-zinc-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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

          <div className="relative flex items-center w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 pl-3.5 pr-10 py-2 text-xs font-semibold text-zinc-900 bg-zinc-50/50 focus:bg-white focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all appearance-none cursor-pointer"
            >
              <option value="">Trạng thái (Tất cả)</option>
              <option value="Mới mở">Mới mở</option>
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Đã hoàn thành">Đã hoàn thành</option>
            </select>
            <ChevronDown className="absolute right-3.5 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGrievances.map((g) => (
          <div key={g.id} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-3">
                <span className="px-3 py-1 bg-zinc-100 text-zinc-800 font-extrabold text-xs rounded-xl border border-zinc-200">
                  Phòng {g.room}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                  g.status === "Đã hoàn thành" ? "bg-[#2ac1bc]/10 text-[#2ac1bc] border-[#2ac1bc]/30" :
                  g.status === "Đang xử lý" ? "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30" :
                  "bg-blue-500/10 text-blue-500 border-blue-500/30"
                }`}>
                  {g.status}
                </span>
              </div>

              <div>
                <h3 className="font-black text-zinc-900 text-base leading-snug">{g.title}</h3>
                <p className="text-xs text-zinc-500 mt-1">Khách thuê: <span className="font-bold text-zinc-800">{g.tenant}</span> • Ngày gửi: {g.date}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                Phụ trách: <span className="font-bold text-zinc-800">{g.assignee}</span>
              </div>
              <button className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                Cập nhật xử lý
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}