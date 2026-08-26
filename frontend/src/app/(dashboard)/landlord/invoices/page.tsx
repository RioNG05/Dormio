"use client";

import React, { useState } from "react";
import { Plus, Search, Filter, FileText, Download, MoreHorizontal, Receipt, Building2, ChevronDown, Sparkles } from "lucide-react";

export default function InvoicesPage() {
  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const getBuildingTitle = (id: string) => {
    if (id === "vinahouse") return "Dormio Campus Cầu Giấy";
    if (id === "dormio") return "Dormio Premier Quận 1";
    return "Dormio Premier Quận 1";
  };

  const invoices = [
    { id: "INV-202308-102", room: "102", period: "08/2023", amount: "3.500.000 ₫", deadline: "20/08/2023", status: "Chưa thu" },
    { id: "INV-202307-102", room: "102", period: "07/2023", amount: "3.450.000 ₫", deadline: "20/07/2023", status: "Đã thu" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer">
          <Download className="w-4 h-4 text-emerald-600" /> Xuất Excel
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2ac1bc] hover:bg-[#72b3a3] rounded-xl shadow-md shadow-[#2ac1bc]/20 transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Tạo hóa đơn mới
        </button>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-6 border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Receipt className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {getBuildingTitle(buildingFilter)}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Theo dõi công nợ, tiền phòng, điện nước và chốt số tự động qua VietQR & AI OCR.
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
                <Receipt className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng hóa đơn</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">{invoices.length}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2ac1bc]/10 hover:bg-[#2ac1bc]/20 transition-colors rounded-2xl border border-[#2ac1bc]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2ac1bc] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2ac1bc] tracking-wider">Đã thu</span>
                  <span className="font-black text-[#2ac1bc] text-lg leading-none mt-1">3.45M ₫</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Chưa thu</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">3.50M ₫</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Hóa đơn mới</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm mã hóa đơn, phòng..." 
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all bg-zinc-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex items-center w-full sm:w-52">
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Mã HĐ</th>
                <th className="px-6 py-3 font-medium">Phòng</th>
                <th className="px-6 py-3 font-medium">Kỳ thu</th>
                <th className="px-6 py-3 font-medium">Số tiền</th>
                <th className="px-6 py-3 font-medium">Hạn thanh toán</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    {inv.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">{inv.room}</td>
                  <td className="px-6 py-4 text-zinc-600">{inv.period}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">{inv.amount}</td>
                  <td className="px-6 py-4 text-zinc-600">{inv.deadline}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                      inv.status === 'Đã thu' ? 'bg-green-100 text-green-700 border-green-200' :
                      inv.status === 'Chưa thu' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      'bg-red-100 text-red-700 border-red-200'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-zinc-400 hover:text-primary transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
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
