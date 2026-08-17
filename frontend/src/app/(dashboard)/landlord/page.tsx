import React from "react";
import Link from "next/link";
import { Building, Users, FileText, TrendingUp, TrendingDown, Plus, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandlordDashboardPage() {
  // Simulate an empty state (new landlord account)
  const hasRooms = false;

  const stats = [
    { name: "Tổng số phòng", value: "128", icon: Building, trend: "up", trendValue: "+2", color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Đang thuê", value: "96", icon: Users, trend: "up", trendValue: "+5%", color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "Doanh thu tháng", value: "45.620.000đ", icon: TrendingUp, trend: "up", trendValue: "+12.5%", color: "text-amber-600", bg: "bg-amber-100" },
    { name: "Công nợ", value: "12.850.000đ", icon: TrendingDown, trend: "down", trendValue: "-3.2%", color: "text-rose-600", bg: "bg-rose-100" },
  ];

  if (!hasRooms) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Building className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 mb-4">Chào mừng đến Dormio!</h1>
        <p className="text-lg text-zinc-500 mb-8 leading-relaxed">
          Có vẻ như bạn chưa có phòng trọ nào trên hệ thống. Hãy thực hiện <strong>Thiết lập nhà trọ</strong> để chúng tôi giúp bạn tạo bảng giá dịch vụ và khởi tạo hàng loạt phòng trọ chỉ trong 2 phút.
        </p>
        <Link href="/landlord/setup" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 h-14 px-8 text-lg transition-all hover:scale-105">
          <Plus className="w-6 h-6" /> Bắt đầu thiết lập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tổng quan</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Theo dõi trạng thái phòng trọ, hóa đơn và hợp đồng thuê phòng của bạn.
          </p>
        </div>
        <Link href="/landlord/setup">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm gap-2">
            <Plus className="w-4 h-4" /> Thêm nhà trọ mới
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-500">{stat.name}</span>
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-zinc-900 mb-1">{stat.value}</div>
              <div className={`text-xs font-semibold flex items-center gap-1 ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trendValue} so với tháng trước
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid of Chart and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Mock Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Doanh thu 6 tháng gần nhất
            </h2>
          </div>
          <div className="h-64 flex items-end gap-4">
            {/* Mock bars */}
            {[40, 60, 45, 70, 55, 80].map((h, i) => (
              <div key={i} className="relative w-full h-full flex flex-col justify-end group">
                <div className="w-full bg-primary/20 group-hover:bg-primary/40 rounded-t-lg transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
                <div className="absolute -bottom-6 w-full text-center text-xs text-zinc-400 font-medium">
                  T{i+1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Recent Tenants */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-zinc-900 mb-4">Thao tác nhanh</h2>
            <div className="flex flex-col gap-3">
              <Link href="/landlord/setup" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors w-full text-left group">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform"><Building className="w-4 h-4" /></div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Thêm phòng mới</div>
                  <div className="text-xs text-zinc-500">Đăng thêm phòng trọ cho thuê</div>
                </div>
              </Link>
              <Link href="/landlord/contracts" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors w-full text-left group">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform"><FileText className="w-4 h-4" /></div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Tạo hợp đồng</div>
                  <div className="text-xs text-zinc-500">Ký hợp đồng với khách mới</div>
                </div>
              </Link>
            </div>
          </div>
          
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex-1">
            <h2 className="text-base font-bold text-zinc-900 mb-4 flex justify-between items-center">
              Hợp đồng sắp hết hạn
              <Link href="/landlord/contracts" className="text-xs text-primary font-semibold cursor-pointer">Xem tất cả</Link>
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">P1</div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Phòng 101</div>
                    <div className="text-xs text-zinc-500">Trần Thị B</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-rose-500">Còn 5 ngày</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
