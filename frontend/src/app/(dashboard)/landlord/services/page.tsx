"use client";

import React, { useState } from "react";
import { 
  Wrench, Plus, Zap, Droplets, Wifi, Trash2, ShieldCheck, 
  CarFront, Search, Building2, MoreHorizontal, Edit, 
  Settings2, Info, ChevronDown
} from "lucide-react";

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const getBuildingTitle = (id: string) => {
    if (id === "vinahouse") return "Dormio Campus Cầu Giấy";
    if (id === "dormio") return "Dormio Premier Quận 1";
    return "Dormio Premier Quận 1";
  };

  const services = [
    { id: "SRV-01", name: "Điện sinh hoạt", type: "Theo chỉ số đồng hồ", unit: "kWh", price: "3.500 ₫", building: "Tất cả", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-50" },
    { id: "SRV-02", name: "Nước sinh hoạt", type: "Theo khối (m³)", unit: "m³", price: "25.000 ₫", building: "Tất cả", icon: Droplets, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "SRV-03", name: "Internet / Wifi", type: "Cố định / Phòng", unit: "Phòng", price: "100.000 ₫", building: "Dormio Building", icon: Wifi, color: "text-indigo-500", bg: "bg-indigo-50" },
    { id: "SRV-04", name: "Thu gom rác", type: "Cố định / Người", unit: "Người", price: "20.000 ₫", building: "Tất cả", icon: Trash2, color: "text-zinc-500", bg: "bg-zinc-100" },
    { id: "SRV-05", name: "Giữ xe máy", type: "Cố định / Xe", unit: "Xe", price: "120.000 ₫", building: "VinaHouse", icon: CarFront, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: "SRV-06", name: "Phí bảo vệ / An ninh", type: "Cố định / Phòng", unit: "Phòng", price: "50.000 ₫", building: "Tất cả", icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  const filteredServices = services.filter(service => {
    return (
      (searchQuery === "" || service.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2ac1bc] hover:bg-[#72b3a3] rounded-xl shadow-md shadow-[#2ac1bc]/20 transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Thêm dịch vụ mới
        </button>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-6 border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Wrench className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {getBuildingTitle(buildingFilter)}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Thiết lập đơn giá điện, nước, dịch vụ vệ sinh và quản lý phí sinh hoạt tiện ích toàn nhà.
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
                <Wrench className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng dịch vụ</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">{services.length}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2ac1bc]/10 hover:bg-[#2ac1bc]/20 transition-colors rounded-2xl border border-[#2ac1bc]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2ac1bc] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2ac1bc] tracking-wider">Theo đồng hồ</span>
                  <span className="font-black text-[#2ac1bc] text-lg leading-none mt-1">2</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Cố định phòng</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">2</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Cố định đầu người</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-4">
        <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-primary text-sm">Hướng dẫn thiết lập</h3>
          <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
            Mỗi tòa nhà có thể có mức giá dịch vụ khác nhau. Nếu bạn tạo dịch vụ với phạm vi "Tất cả tòa nhà", dịch vụ đó sẽ được áp dụng làm mặc định. 
            Bạn có thể tùy chỉnh đơn giá cho từng phòng trong mục Quản lý phòng.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm dịch vụ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 border border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="relative flex-shrink-0 w-full sm:w-56">
          <select 
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="w-full pl-3.5 pr-10 py-2.5 text-xs font-semibold text-zinc-900 bg-zinc-50/50 border border-zinc-200 rounded-xl appearance-none hover:bg-white focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 cursor-pointer transition-all"
          >
            <option value="dormio">Dormio Premier Quận 1</option>
            <option value="vinahouse">Dormio Campus Cầu Giấy</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? filteredServices.map((service) => (
          <div key={service.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            {/* Top Row */}
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.bg} ${service.color}`}>
                  <service.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg">{service.name}</h3>
                  <span className="bg-zinc-100 text-zinc-600 text-[11px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block border border-zinc-200">
                    {service.building}
                  </span>
                </div>
              </div>
              <button className="text-zinc-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/5">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <hr className="border-zinc-100 my-4" />

            {/* Details */}
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Hình thức thu:</span>
                <span className="font-semibold text-zinc-800">{service.type}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Đơn vị tính:</span>
                <span className="font-semibold text-zinc-800">{service.unit}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Đơn giá mặc định:</span>
                <span className="font-bold text-primary text-base">{service.price}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex-1 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-semibold py-2 rounded-xl text-sm transition-colors border border-zinc-200 flex items-center justify-center gap-2">
                <Edit className="w-4 h-4" /> Sửa
              </button>
              <button className="flex-1 bg-primary/5 hover:bg-primary/10 text-primary font-semibold py-2 rounded-xl text-sm transition-colors border border-primary/20 flex items-center justify-center gap-2">
                <Settings2 className="w-4 h-4" /> Cấu hình
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-zinc-200 border-dashed">
            <Wrench className="w-12 h-12 text-zinc-300 mb-3" />
            <p className="font-medium text-zinc-900">Không tìm thấy dịch vụ nào</p>
            <p className="text-sm text-zinc-500 mt-1">Hãy thử tìm kiếm với từ khóa khác.</p>
          </div>
        )}
      </div>
    </div>
  );
}
