"use client";

import React, { useState } from "react";
import { 
  Package, Search, Plus, Download, MoreHorizontal, 
  CheckCircle2, AlertTriangle, Wrench, Box, Filter,
  Building2, ArrowUpDown
} from "lucide-react";

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  
  // Mock Data
  const assets = [
    { id: "AST-001", name: "Máy lạnh Daikin 1.5HP", category: "Điện lạnh", building: "Dormio Building", room: "101", status: "Đang sử dụng", dateAdded: "10/01/2026", value: "8.500.000 ₫" },
    { id: "AST-002", name: "Tủ lạnh Aqua 90L", category: "Điện lạnh", building: "Dormio Building", room: "102", status: "Đang sử dụng", dateAdded: "12/01/2026", value: "2.800.000 ₫" },
    { id: "AST-003", name: "Máy giặt Toshiba 8kg", category: "Điện lạnh", building: "VinaHouse", room: "Khu sinh hoạt chung", status: "Bảo trì", dateAdded: "15/02/2026", value: "4.500.000 ₫" },
    { id: "AST-004", name: "Giường gỗ công nghiệp 1m6", category: "Nội thất", building: "Dormio Building", room: "Kho", status: "Sẵn sàng", dateAdded: "20/03/2026", value: "1.800.000 ₫" },
    { id: "AST-005", name: "Bếp từ đôi Sunhouse", category: "Gia dụng", building: "VinaHouse", room: "201", status: "Hỏng hóc", dateAdded: "05/04/2026", value: "1.200.000 ₫" },
    { id: "AST-006", name: "Tủ quần áo gỗ MDF 2 cánh", category: "Nội thất", building: "Dormio Building", room: "205", status: "Đang sử dụng", dateAdded: "15/04/2026", value: "2.200.000 ₫" },
  ];

  const filteredAssets = assets.filter(asset => {
    return (
      (searchQuery === "" || asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || asset.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (statusFilter === "" || asset.status === statusFilter) &&
      (buildingFilter === "" || asset.building === buildingFilter)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Tài sản & Trang thiết bị</h1>
          <p className="text-sm text-zinc-500">Quản lý toàn bộ cơ sở vật chất và tình trạng thiết bị trong các tòa nhà</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Xuất dữ liệu
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all">
            <Plus className="w-4 h-4" /> Thêm tài sản
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm text-zinc-500 font-medium">Tổng tài sản</div>
            <div className="text-2xl font-bold text-zinc-900 mt-1">{assets.length}</div>
          </div>
        </div>
        
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 relative z-10">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <div className="text-sm text-zinc-500 font-medium">Đang sử dụng</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {assets.filter(a => a.status === 'Đang sử dụng' || a.status === 'Sẵn sàng').length}
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Wrench className="w-16 h-16" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 relative z-10">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <div className="text-sm text-zinc-500 font-medium">Bảo trì / Sửa chữa</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {assets.filter(a => a.status === 'Bảo trì').length}
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 relative z-10">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <div className="text-sm text-zinc-500 font-medium">Hỏng / Cần thanh lý</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {assets.filter(a => a.status === 'Hỏng hóc').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-50/50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo mã tài sản, tên..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <div className="relative flex-shrink-0">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <select 
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="pl-9 pr-10 py-2.5 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors font-medium min-w-[160px]"
              >
                <option value="">Tất cả tòa nhà</option>
                <option value="Dormio Building">Dormio Building</option>
                <option value="VinaHouse">VinaHouse</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>

            <div className="relative flex-shrink-0">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors font-medium min-w-[150px]"
              >
                <option value="">Mọi trạng thái</option>
                <option value="Đang sử dụng">Đang sử dụng</option>
                <option value="Sẵn sàng">Sẵn sàng (Kho)</option>
                <option value="Bảo trì">Đang bảo trì</option>
                <option value="Hỏng hóc">Hỏng hóc</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-800">
                    Mã TS <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-4">Tên tài sản</th>
                <th className="px-6 py-4">Vị trí</th>
                <th className="px-6 py-4">Phân loại</th>
                <th className="px-6 py-4">Nguyên giá</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredAssets.length > 0 ? filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-zinc-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-zinc-900 bg-zinc-100 px-2 py-1 rounded-md text-xs">{asset.id}</span>
                  </td>
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="font-bold text-zinc-900">{asset.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Thêm ngày: {asset.dateAdded}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-zinc-900 font-medium">{asset.room}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{asset.building}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">
                    <span className="bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full text-xs font-medium border border-zinc-200">
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-zinc-900">{asset.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${
                      asset.status === 'Đang sử dụng' || asset.status === 'Sẵn sàng' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      asset.status === 'Bảo trì' 
                        ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {asset.status === 'Đang sử dụng' || asset.status === 'Sẵn sàng' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                       asset.status === 'Bảo trì' ? <Wrench className="w-3.5 h-3.5" /> : 
                       <AlertTriangle className="w-3.5 h-3.5" />}
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <Package className="w-12 h-12 text-zinc-300 mb-3" />
                      <p className="font-medium text-zinc-900">Không tìm thấy tài sản nào</p>
                      <p className="text-sm mt-1">Hãy thử thay đổi điều kiện lọc hoặc tìm kiếm.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
