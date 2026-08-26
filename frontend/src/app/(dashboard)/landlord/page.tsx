"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building, Users, FileText, TrendingUp, TrendingDown, Plus, Activity, 
  Building2, ChevronDown, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandlordDashboardPage() {
  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const getBuildingTitle = (id: string) => {
    if (id === "vinahouse") return "Dormio Campus Cầu Giấy";
    if (id === "dormio") return "Dormio Premier Quận 1";
    return "Dormio Premier Quận 1";
  };

  const getBuildingStats = (id: string) => {
    if (id === "vinahouse") {
      return {
        totalRooms: "85 phòng",
        rentedRooms: "72 phòng",
        revenue: "32.40M ₫",
        revenueExact: "32.400.000 ₫",
        vacantRooms: "13 phòng",
        chartData: [
          { month: "Tháng 3", amount: "26.5M", percent: 60 },
          { month: "Tháng 4", amount: "28.1M", percent: 68 },
          { month: "Tháng 5", amount: "29.0M", percent: 70 },
          { month: "Tháng 6", amount: "30.5M", percent: 76 },
          { month: "Tháng 7", amount: "31.2M", percent: 80 },
          { month: "Tháng 8", amount: "32.4M", percent: 88 },
        ],
        expiryRoom: "Phòng 302",
        expiryTenant: "Lê Văn C",
        expiryDays: "Còn 3 ngày",
        expiryCode: "P302",
      };
    }
    return {
      totalRooms: "128 phòng",
      rentedRooms: "96 phòng",
      revenue: "45.62M ₫",
      revenueExact: "45.620.000 ₫",
      vacantRooms: "32 phòng",
      chartData: [
        { month: "Tháng 3", amount: "38.2M", percent: 65 },
        { month: "Tháng 4", amount: "41.0M", percent: 72 },
        { month: "Tháng 5", amount: "39.5M", percent: 68 },
        { month: "Tháng 6", amount: "43.8M", percent: 82 },
        { month: "Tháng 7", amount: "42.1M", percent: 78 },
        { month: "Tháng 8", amount: "45.6M", percent: 92 },
      ],
      expiryRoom: "Phòng 101",
      expiryTenant: "Trần Thị B",
      expiryDays: "Còn 5 ngày",
      expiryCode: "P101",
    };
  };

  const currentStats = getBuildingStats(buildingFilter);

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Tổng Quan Bất Động Sản</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Báo cáo hiệu suất kinh doanh, tỷ lệ lấp đầy và tình hình thu tiền tự động.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex items-center w-full sm:w-56">
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 pl-3.5 pr-10 py-2 text-xs font-semibold text-zinc-900 bg-white focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all appearance-none cursor-pointer shadow-xs"
            >
              <option value="dormio">Dormio Premier Quận 1</option>
              <option value="vinahouse">Dormio Campus Cầu Giấy</option>
            </select>
            <ChevronDown className="absolute right-3.5 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
          </div>

          <Link href="/landlord/setup">
            <Button className="bg-[#2ac1bc] hover:bg-[#72b3a3] text-white rounded-xl shadow-md shadow-[#2ac1bc]/20 text-xs font-bold gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Thêm Tòa Nhà Trọ Mới
            </Button>
          </Link>
        </div>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-2 border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Activity className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {getBuildingTitle(buildingFilter)}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Hệ thống đang vận hành ổn định. Đã thu tự động {currentStats.revenueExact} qua VietQR trong tháng này.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[145px]">
                <Building className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng số phòng</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">{currentStats.totalRooms}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2ac1bc]/10 hover:bg-[#2ac1bc]/20 transition-colors rounded-2xl border border-[#2ac1bc]/30 backdrop-blur-md min-w-[145px]">
                <Users className="w-4 h-4 text-[#2ac1bc] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2ac1bc] tracking-wider">Đang ở</span>
                  <span className="font-black text-[#2ac1bc] text-lg leading-none mt-1">{currentStats.rentedRooms}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Doanh thu tháng</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">{currentStats.revenue}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Phòng trống</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">{currentStats.vacantRooms}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Chart and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart Widget */}
        <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-zinc-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#2ac1bc]" /> Doanh Thu 6 Tháng Gần Nhất — {getBuildingTitle(buildingFilter)}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Biểu đồ tăng trưởng tiền phòng & dịch vụ tiện ích</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +12.5% YoY
            </span>
          </div>

          <div className="h-64 flex items-end gap-5 pt-4">
            {currentStats.chartData.map((bar, i) => (
              <div key={i} className="relative w-full h-full flex flex-col justify-end items-center group">
                <div className="text-[10px] font-bold text-zinc-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.amount}
                </div>
                <div 
                  className="w-full bg-[#2ac1bc]/20 group-hover:bg-[#2ac1bc] rounded-t-xl transition-all duration-300 cursor-pointer relative" 
                  style={{ height: `${bar.percent}%` }}
                >
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#2ac1bc] rounded-t-xl group-hover:bg-white" />
                </div>
                <div className="mt-3 text-xs text-zinc-600 font-bold">
                  {bar.month}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Expiry Widgets */}
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-zinc-900 mb-4">Lối Tắt Thao Tác Nhanh</h2>
            <div className="flex flex-col gap-3">
              <Link href="/landlord/rooms" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">Sơ đồ phòng ở</div>
                    <div className="text-[11px] text-zinc-500">Xem nhanh theo từng tầng</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              </Link>

              <Link href="/landlord/invoices" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#2ac1bc]/10 text-[#2ac1bc] group-hover:scale-110 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">AI OCR Chốt Điện Nước</div>
                    <div className="text-[11px] text-zinc-500">Chụp ảnh hóa đơn đồng hồ</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              </Link>

              <Link href="/landlord/contracts/create" className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">Lập Hợp Đồng Thuê Mới</div>
                    <div className="text-[11px] text-zinc-500">Ký duyệt chữ ký điện tử PDF</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm flex-1">
            <h2 className="text-base font-bold text-zinc-900 mb-4 flex justify-between items-center">
              Hợp đồng sắp hết hạn
              <Link href="/landlord/contracts" className="text-xs text-[#2ac1bc] font-semibold cursor-pointer hover:underline">Xem tất cả</Link>
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center font-bold text-xs">{currentStats.expiryCode}</div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">{currentStats.expiryRoom}</div>
                    <div className="text-[11px] text-zinc-500">{currentStats.expiryTenant}</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">{currentStats.expiryDays}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
