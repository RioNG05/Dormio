"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building, Users, FileText, TrendingUp, TrendingDown, Plus, Activity, 
  Building2, ChevronDown, ArrowUpRight, Sparkles, MapPin, CheckCircle2, ShieldCheck, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function LandlordDashboardPage() {
  const { user, upgradeToLandlord } = useAuth();

  // Onboarding Setup Form States for new Landlord
  const [initHouseName, setInitHouseName] = useState("");
  const [initHouseAddress, setInitHouseAddress] = useState("");
  const [initRoomCount, setInitRoomCount] = useState("10");
  const [initAveragePrice, setInitAveragePrice] = useState("4500000");

  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const handleInitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initHouseName || !initHouseAddress) return;
    upgradeToLandlord({ houseName: initHouseName, houseAddress: initHouseAddress });
  };

  // CHECK IF LANDLORD HAS NOT CREATED THEIR FIRST HOUSE YET
  const isNewLandlord = !user?.houseName || user?.houseName === "";

  if (isNewLandlord) {
    return (
      <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-8 animate-in fade-in duration-500">
        
        {/* Welcome Empty State Header */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/30 shadow-lg">
            <Sparkles className="w-4 h-4 fill-[#2AC1BC]" /> THIẾT LẬP NHÀ TRỌ BAN ĐẦU
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
            Chào mừng bạn đến với <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] to-[#FF6B35] bg-clip-text text-transparent">
              Dormio Landlord Dashboard
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xl mx-auto">
            Hệ thống quản lý của bạn đang ở trạng thái <strong>trống trơn</strong>. Hãy hoàn tất thiết lập tòa nhà trọ đầu tiên để bắt đầu tạo sơ đồ phòng, phát hành hợp đồng & gạch nợ VietQR tự động.
          </p>
        </div>

        {/* Onboarding Initial Setup Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-xl space-y-6">
          <div className="border-b border-zinc-100 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900">Tạo Khảo Sát Tòa Nhà Trọ Đầu Tiên</h2>
              <p className="text-xs text-zinc-500 font-medium">Nhập thông tin cơ bản để Dormio tự động khởi tạo bộ quản lý phòng cho bạn.</p>
            </div>
          </div>

          <form onSubmit={handleInitSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-700">TÊN KHU TRỌ / TÒA NHÀ ĐẦU TIÊN *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Trọ Cao Cấp An Bình"
                    value={initHouseName}
                    onChange={(e) => setInitHouseName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-700">ĐỊA CHỈ TÒA NHÀ *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                    value={initHouseAddress}
                    onChange={(e) => setInitHouseAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-700">SỐ LƯỢNG PHÒNG DỰ KIẾN QUẢN LÝ</label>
                <input
                  type="number"
                  placeholder="10"
                  value={initRoomCount}
                  onChange={(e) => setInitRoomCount(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-zinc-700">GIÁ THUÊ TRUNG BÌNH DỰ KIẾN (VNĐ/tháng)</label>
                <input
                  type="number"
                  placeholder="4500000"
                  value={initAveragePrice}
                  onChange={(e) => setInitAveragePrice(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>

            </div>

            {/* Feature Checklist Highlights */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2">
              <span className="text-[11px] font-extrabold text-zinc-600 block">TÍNH NĂNG ĐƯỢC TỰ ĐỘNG TÍCH HỢP CHO TÒA NHÀ MỚI:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold text-zinc-700">
                <span className="flex items-center gap-1.5 text-[#2AC1BC]"><CheckCircle2 className="w-4 h-4 shrink-0" /> Gạch nợ VietQR 24/7</span>
                <span className="flex items-center gap-1.5 text-[#2AC1BC]"><CheckCircle2 className="w-4 h-4 shrink-0" /> Quét chỉ số điện nước AI</span>
                <span className="flex items-center gap-1.5 text-[#2AC1BC]"><CheckCircle2 className="w-4 h-4 shrink-0" /> Hợp đồng điện tử PDF</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] to-[#FF6B35] hover:from-[#23B3AE] hover:to-[#ff5518] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#2AC1BC]/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>🚀 Khởi Tạo Tòa Nhà & Vào Dashboard Quản Lý ngay &rarr;</span>
            </button>
          </form>
        </div>

      </div>
    );
  }

  // ACTIVE DASHBOARD VIEW (WHEN HOUSE IS CONFIGURED)
  const houseTitle = user?.houseName || "Dormio Premier Quận 1";

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Tổng Quan Bất Động Sản</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Báo cáo hiệu suất kinh doanh cho <strong>{houseTitle}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex items-center w-full sm:w-64">
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 pl-3.5 pr-10 py-2 text-xs font-semibold text-zinc-900 bg-white focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all appearance-none cursor-pointer shadow-xs"
            >
              <option value="custom">{houseTitle}</option>
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
              {houseTitle}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Tòa nhà vừa khởi tạo thành công tại: <strong className="text-zinc-200">{user?.houseAddress || "TP. Hồ Chí Minh"}</strong>.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[145px]">
                <Building className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng số phòng</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">10 phòng</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2ac1bc]/10 hover:bg-[#2ac1bc]/20 transition-colors rounded-2xl border border-[#2ac1bc]/30 backdrop-blur-md min-w-[145px]">
                <Users className="w-4 h-4 text-[#2ac1bc] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2ac1bc] tracking-wider">Đang ở</span>
                  <span className="font-black text-[#2ac1bc] text-lg leading-none mt-1">0 phòng</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Doanh thu tháng</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">0 ₫</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Phòng trống</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">10 phòng</span>
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
                <Activity className="w-5 h-5 text-[#2ac1bc]" /> Doanh Thu Vận Hành — {houseTitle}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Tòa nhà mới sẵn sàng chào đón khách thuê đầu tiên</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Sẵn sàng 100%
            </span>
          </div>

          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <Building2 className="w-10 h-10 text-zinc-300 mb-2" />
            <h3 className="text-sm font-bold text-zinc-700">Tòa nhà chưa có dữ liệu doanh thu tháng</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">Tạo hợp đồng thuê phòng đầu tiên để bắt đầu ghi nhận doanh thu và kích hoạt tự động gạch nợ VietQR.</p>
            <Link href="/landlord/contracts/create" className="mt-4">
              <Button className="bg-[#2ac1bc] hover:bg-[#72b3a3] text-white text-xs font-bold rounded-xl shadow-xs">
                + Lập Hợp Đồng Đầu Tiên
              </Button>
            </Link>
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
        </div>
      </div>
    </div>
  );
}
