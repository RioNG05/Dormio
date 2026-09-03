"use client";
import { useTranslations } from "@/context/LanguageContext";

import React, { useState } from "react";
import { 
  Users, Plus, Search, Shield, UserCheck, Clock, Calendar, 
  ChevronDown, Building2, MoreHorizontal, Phone, Mail, CheckCircle2, AlertCircle
} from "lucide-react";

export default function StaffPage() {
  const t = useTranslations("workforce");
  const [activeTab, setActiveTab] = useState<"staff" | "schedules">("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const getBuildingTitle = (id: string) => {
    if (id === "vinahouse") return "Dormio Campus Cầu Giấy";
    if (id === "dormio") return "Dormio Premier Quận 1";
    return "Dormio Premier Quận 1";
  };

  const staffMembers = [
    {
      id: "STF-01",
      name: "Nguyễn Văn Bảo",
      role: "Quản lý tòa nhà",
      phone: "0901 234 567",
      email: "bao.nguyen@dormio.vn",
      shift: "Ca Hành Chính (08:00 - 17:00)",
      status: "Đang làm việc",
      avatar: "B"
    },
    {
      id: "STF-02",
      name: "Trần Văn Cường",
      role: "Bảo vệ ca sáng",
      phone: "0912 345 678",
      email: "cuong.tran@dormio.vn",
      shift: "Ca Sáng (06:00 - 14:00)",
      status: "Đang làm việc",
      avatar: "C"
    },
    {
      id: "STF-03",
      name: "Phạm Thị Hoa",
      role: "Nhân viên Vệ sinh",
      phone: "0987 654 321",
      email: "hoa.pham@dormio.vn",
      shift: "Ca Sáng (07:00 - 15:00)",
      status: "Đang làm việc",
      avatar: "H"
    },
    {
      id: "STF-04",
      name: "Lê Minh Tuấn",
      role: "Bảo vệ ca tối",
      phone: "0933 444 555",
      email: "tuan.le@dormio.vn",
      shift: "Ca Đêm (22:00 - 06:00)",
      status: "Nghỉ ca",
      avatar: "T"
    }
  ];

  const shifts = [
    { day: "Thứ 2 (25/08)", morning: "Trần Văn Cường, Phạm Thị Hoa", afternoon: "Nguyễn Văn Bảo", night: "Lê Minh Tuấn" },
    { day: "Thứ 3 (26/08)", morning: "Trần Văn Cường, Phạm Thị Hoa", afternoon: "Nguyễn Văn Bảo", night: "Lê Minh Tuấn" },
    { day: "Thứ 4 (27/08)", morning: "Trần Văn Cường, Phạm Thị Hoa", afternoon: "Nguyễn Văn Bảo", night: "Lê Minh Tuấn" },
    { day: "Thứ 5 (28/08)", morning: "Trần Văn Cường, Phạm Thị Hoa", afternoon: "Nguyễn Văn Bảo", night: "Lê Minh Tuấn" },
    { day: "Thứ 6 (29/08)", morning: "Trần Văn Cường, Phạm Thị Hoa", afternoon: "Nguyễn Văn Bảo", night: "Lê Minh Tuấn" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2ac1bc] hover:bg-[#72b3a3] rounded-xl shadow-md shadow-[#2ac1bc]/20 transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Thêm nhân viên mới
        </button>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-6 border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Users className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {getBuildingTitle(buildingFilter)}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Quản lý danh sách nhân viên, phân quyền vai trò (Bảo vệ, Vệ sinh, Quản lý) và theo dõi ca làm việc.
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
                <Users className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng nhân viên</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">{staffMembers.length} người</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2ac1bc]/10 hover:bg-[#2ac1bc]/20 transition-colors rounded-2xl border border-[#2ac1bc]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2ac1bc] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2ac1bc] tracking-wider">Đang làm việc</span>
                  <span className="font-black text-[#2ac1bc] text-lg leading-none mt-1">3</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Ca sáng</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">2</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Ca tối</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "staff" ? "bg-zinc-900 text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Danh sách nhân viên
          </button>
          <button
            onClick={() => setActiveTab("schedules")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "schedules" ? "bg-zinc-900 text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Lịch ca làm việc
          </button>
        </div>

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

      {/* Content Body */}
      {activeTab === "staff" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffMembers.map((staff) => (
            <div key={staff.id} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-black text-lg">
                    {staff.avatar}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-zinc-900 text-base">{staff.name}</h3>
                    <p className="text-xs text-[#2ac1bc] font-bold mt-0.5">{staff.role}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                  staff.status === "Đang làm việc" ? "bg-[#2ac1bc]/10 text-[#2ac1bc] border-[#2ac1bc]/30" : "bg-zinc-100 text-zinc-500 border-zinc-200"
                }`}>
                  {staff.status}
                </span>
              </div>

              <div className="space-y-2 pt-2 text-xs text-zinc-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="font-semibold text-zinc-900">{staff.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{staff.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="font-medium text-zinc-700">{staff.shift}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-500 uppercase font-bold border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Ca Sáng (06:00 - 14:00)</th>
                <th className="px-4 py-3">Ca Chiều (14:00 - 22:00)</th>
                <th className="px-4 py-3">Ca Đêm (22:00 - 06:00)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {shifts.map((s, idx) => (
                <tr key={idx} className="hover:bg-zinc-50">
                  <td className="px-4 py-4 font-bold text-zinc-900">{s.day}</td>
                  <td className="px-4 py-4 text-[#2ac1bc] font-semibold">{s.morning}</td>
                  <td className="px-4 py-4 text-zinc-700">{s.afternoon}</td>
                  <td className="px-4 py-4 text-blue-600 font-semibold">{s.night}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}