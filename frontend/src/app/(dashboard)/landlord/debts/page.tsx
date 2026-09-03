"use client";
import { useTranslations } from "@/context/LanguageContext";

import React, { useState } from "react";
import { 
  AlertTriangle, Search, Filter, Download, BellRing, 
  User, CheckCircle2, MoreHorizontal, ArrowUpDown, Clock, ChevronDown, Building2, FileSpreadsheet
} from "lucide-react";

export default function DebtsPage() {
  const t = useTranslations("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const getBuildingTitle = (id: string) => {
    if (id === "vinahouse") return "Dormio Campus Cầu Giấy";
    if (id === "dormio") return "Dormio Premier Quận 1";
    return "Dormio Premier Quận 1";
  };

  const debts = [
    { id: "DBT-101", room: "101", tenant: "Nguyễn Văn A", startMonth: "06/2026", duration: 2, amount: "7.000.000 ₫", status: "Quá hạn", phone: "0901234567" },
    { id: "DBT-205", room: "205", tenant: "Trần Thị B", startMonth: "07/2026", duration: 1, amount: "3.500.000 ₫", status: "Quá hạn", phone: "0987654321" },
    { id: "DBT-302", room: "302", tenant: "Lê Văn C", startMonth: "04/2026", duration: 4, amount: "14.000.000 ₫", status: "Nợ xấu", phone: "0912345678" },
    { id: "DBT-105", room: "105", tenant: "Phạm Hoàng D", startMonth: "07/2026", duration: 1, amount: "2.800.000 ₫", status: "Quá hạn", phone: "0909999888" },
  ];

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.tenant.toLowerCase().includes(searchQuery.toLowerCase()) || debt.room.includes(searchQuery);
    const matchesDuration = durationFilter === "" || (durationFilter === "3+" ? debt.duration >= 3 : debt.duration === Number(durationFilter));
    return matchesSearch && matchesDuration;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export Excel
        </button>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-6 border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <AlertTriangle className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {getBuildingTitle(buildingFilter)}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Theo dõi danh sách nợ tiền phòng quá hạn, gửi nhắc nhở thanh toán Zalo / SMS tự động.
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
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng tiền nợ</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">27.30M ₫</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Nợ quá hạn</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">13.30M ₫</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 transition-colors rounded-2xl border border-purple-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">Nợ xấu (3+ thg)</span>
                  <span className="font-black text-purple-400 text-lg leading-none mt-1">14.00M ₫</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Khách nợ</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">4 phòng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-50/50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo phòng, tên khách thuê..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex items-center w-full sm:w-56">
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 pl-3.5 pr-10 py-2 text-xs font-semibold text-zinc-900 bg-white focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all appearance-none cursor-pointer"
              >
                <option value="dormio">Dormio Premier Quận 1</option>
                <option value="vinahouse">Dormio Campus Cầu Giấy</option>
              </select>
              <ChevronDown className="absolute right-3.5 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
            </div>

            <div className="relative flex-shrink-0 w-full sm:w-48">
              <select 
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2 text-xs font-semibold text-zinc-900 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 cursor-pointer transition-all"
              >
                <option value="">Thời gian nợ (Tất cả)</option>
                <option value="1">1 tháng</option>
                <option value="2">2 tháng</option>
                <option value="3+">Từ 3 tháng trở lên</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-500 uppercase font-bold border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4">Phòng / Khách thuê</th>
                <th className="px-6 py-4">SĐT</th>
                <th className="px-6 py-4">Bắt đầu nợ</th>
                <th className="px-6 py-4">Số tháng nợ</th>
                <th className="px-6 py-4">Tổng tiền nợ</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {filteredDebts.map((debt) => (
                <tr key={debt.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35] font-black text-sm shrink-0">
                        {debt.room}
                      </div>
                      <div>
                        <div className="font-extrabold text-zinc-900 text-sm">{debt.tenant}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Phòng {debt.room}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-700 font-semibold">{debt.phone}</td>
                  <td className="px-6 py-4 text-zinc-600">{debt.startMonth}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">{debt.duration} tháng</td>
                  <td className="px-6 py-4 font-black text-rose-600 text-sm">{debt.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                      debt.status === "Nợ xấu" ? "bg-purple-500/10 text-purple-500 border-purple-500/30" : "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30"
                    }`}>
                      {debt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                      Gửi nhắc nợ Zalo
                    </button>
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
