"use client";

import React, { useState } from "react";
import { 
  Wrench, Plus, Zap, Droplets, Wifi, Trash2, ShieldCheck, 
  CarFront, Search, Building2, MoreHorizontal, Edit, 
  Settings2, Info
} from "lucide-react";

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");

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
      (searchQuery === "" || service.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (buildingFilter === "" || service.building === "Tất cả" || service.building === buildingFilter)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý dịch vụ</h1>
          <p className="text-sm text-zinc-500">Thiết lập bảng giá và cấu hình dịch vụ tính phí cho khách thuê</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all">
          <Plus className="w-4 h-4" /> Thêm dịch vụ
        </button>
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
        <div className="relative flex-shrink-0 w-full md:w-auto">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <select 
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 text-sm text-zinc-700 bg-zinc-50 border border-transparent rounded-xl appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors font-medium min-w-[200px]"
          >
            <option value="">Lọc theo tòa nhà (Tất cả)</option>
            <option value="Dormio Building">Dormio Building</option>
            <option value="VinaHouse">VinaHouse</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
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
