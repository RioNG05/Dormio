"use client";

import React, { useState } from "react";
import { 
  Package, Search, Plus, Download, MoreHorizontal, 
  CheckCircle2, AlertTriangle, Wrench, Box, Filter,
  Building2, ArrowUpDown, ChevronDown
} from "lucide-react";

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const getBuildingTitle = (id: string) => {
    if (id === "vinahouse") return "Dormio Campus Cầu Giấy";
    if (id === "dormio") return "Dormio Premier Quận 1";
    return "Dormio Premier Quận 1";
  };
  
  // Mock Data
  const assets = [
    { id: "AST-001", name: "Máy lạnh Daikin 1.5HP", category: "Điện lạnh", building: "Dormio Building", room: "101", status: "Đang sử dụng", dateAdded: "10/01/2026", value: "8.500.000 ₫" },
    { id: "AST-002", name: "Tủ lạnh Aqua 90L", category: "Điện lạnh", building: "Dormio Building", room: "102", status: "Đang sử dụng", dateAdded: "12/01/2026", value: "2.800.000 ₫" },
    { id: "AST-003", name: "Máy giặt Toshiba 8kg", category: "Điện lạnh", building: "VinaHouse", room: "Khu sinh hoạt chung", status: "Bảo trì", dateAdded: "15/02/2026", value: "4.500.000 ₫" },
    { id: "AST-004", name: "Giường gỗ công nghiệp 1m6", category: "Nội thất", building: "Dormio Building", room: "Kho", status: "Sẵn sàng", dateAdded: "20/03/2026", value: "1.800.000 ₫" },
    { id: "AST-005", name: "Bếp từ đôi Sunhouse", category: "Gia dụng", building: "Dormio Building", room: "201", status: "Hỏng hóc", dateAdded: "05/04/2026", value: "1.200.000 ₫" },
  ];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <button className="flex items-center gap-2 px-[#2ac1bc] px-4 py-2.5 text-xs font-bold text-white bg-[#2ac1bc] hover:bg-[#72b3a3] rounded-xl shadow-md shadow-[#2ac1bc]/20 transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Thêm tài sản mới
        </button>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-6 border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Package className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {getBuildingTitle(buildingFilter)}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Theo dõi danh mục trang thiết bị, tài sản cố định, máy lạnh, tủ lạnh trang bị tại các phòng.
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
                <Package className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng tài sản</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">{assets.length} món</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2ac1bc]/10 hover:bg-[#2ac1bc]/20 transition-colors rounded-2xl border border-[#2ac1bc]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2ac1bc] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2ac1bc] tracking-wider">Đang sử dụng</span>
                  <span className="font-black text-[#2ac1bc] text-lg leading-none mt-1">3</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Bảo trì</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">1</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Trong kho</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">1</span>
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
              placeholder="Tìm kiếm theo mã tài sản, tên, phòng..." 
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

            <div className="relative flex-shrink-0">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-4 pr-10 py-2 text-xs font-semibold text-zinc-900 bg-white border border-zinc-200 rounded-xl appearance-none focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 cursor-pointer transition-all min-w-[150px]"
              >
                <option value="">Mọi trạng thái</option>
                <option value="Đang sử dụng">Đang sử dụng</option>
                <option value="Sẵn sàng">Sẵn sàng (Kho)</option>
                <option value="Bảo trì">Đang bảo trì</option>
                <option value="Hỏng hóc">Hỏng hóc</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Assets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-500 uppercase font-bold border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3.5">Mã TS</th>
                <th className="px-6 py-3.5">Tên tài sản</th>
                <th className="px-6 py-3.5">Danh mục</th>
                <th className="px-6 py-3.5">Phòng / Vị trí</th>
                <th className="px-6 py-3.5">Giá trị</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900">{asset.id}</td>
                  <td className="px-6 py-4 font-bold text-zinc-800">{asset.name}</td>
                  <td className="px-6 py-4 text-zinc-500">{asset.category}</td>
                  <td className="px-6 py-4 text-zinc-700 font-bold">{asset.room}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">{asset.value}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      asset.status === 'Đang sử dụng' ? 'bg-[#2ac1bc]/10 text-[#2ac1bc] border-[#2ac1bc]/30' :
                      asset.status === 'Sẵn sàng' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                      asset.status === 'Bảo trì' ? 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30' :
                      'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
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
