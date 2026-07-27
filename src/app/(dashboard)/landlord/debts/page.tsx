"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, Search, Filter, Download, BellRing, 
  User, CheckCircle2, MoreHorizontal, ArrowUpDown, Clock
} from "lucide-react";

export default function DebtsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [durationFilter, setDurationFilter] = useState("");

  const debts = [
    { id: "DBT-101", room: "101", tenant: "Nguyễn Văn A", startMonth: "06/2026", duration: 2, amount: "7.000.000 ₫", status: "Quá hạn", phone: "0901234567" },
    { id: "DBT-205", room: "205", tenant: "Trần Thị B", startMonth: "07/2026", duration: 1, amount: "3.500.000 ₫", status: "Quá hạn", phone: "0987654321" },
    { id: "DBT-302", room: "302", tenant: "Lê Văn C", startMonth: "04/2026", duration: 4, amount: "14.000.000 ₫", status: "Nợ xấu", phone: "0912345678" },
    { id: "DBT-105", room: "105", tenant: "Phạm Hoàng D", startMonth: "07/2026", duration: 1, amount: "2.800.000 ₫", status: "Quá hạn", phone: "0909999888" },
  ];

  const filteredDebts = debts.filter(debt => {
    return (
      (searchQuery === "" || debt.room.toLowerCase().includes(searchQuery.toLowerCase()) || debt.tenant.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (durationFilter === "" || 
        (durationFilter === "1" && debt.duration === 1) ||
        (durationFilter === "2" && debt.duration === 2) ||
        (durationFilter === "3+" && debt.duration >= 3)
      )
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Công nợ</h1>
          <p className="text-sm text-zinc-500">Theo dõi chi tiết các khoản nợ đọng và quá hạn của khách thuê</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all">
            <BellRing className="w-4 h-4" /> Nhắc nợ hàng loạt
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 relative z-10">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <div className="text-sm text-zinc-500 font-medium">Tổng tiền nợ</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">27.300.000 ₫</div>
          </div>
        </div>
        
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm text-zinc-500 font-medium">Khách đang nợ</div>
            <div className="text-2xl font-bold text-zinc-900 mt-1">{debts.length}</div>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm text-zinc-500 font-medium">Nợ trên 2 tháng</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {debts.filter(d => d.duration >= 2).length}
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col gap-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white relative z-10">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <div className="text-sm text-zinc-500 font-medium">Nợ xấu ({">"} 3 tháng)</div>
            <div className="text-2xl font-bold text-zinc-900 mt-1">
              {debts.filter(d => d.duration >= 3).length}
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
              placeholder="Tìm kiếm theo phòng, tên khách thuê..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-shrink-0 w-full md:w-48">
              <select 
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors font-medium"
              >
                <option value="">Thời gian nợ (Tất cả)</option>
                <option value="1">1 tháng</option>
                <option value="2">2 tháng</option>
                <option value="3+">Từ 3 tháng trở lên</option>
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
                <th className="px-6 py-4">Phòng / Khách thuê</th>
                <th className="px-6 py-4">SĐT</th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-800">
                    Bắt đầu nợ <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-4">Số tháng nợ</th>
                <th className="px-6 py-4">Tổng tiền nợ</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredDebts.length > 0 ? filteredDebts.map((debt) => (
                <tr key={debt.id} className="hover:bg-zinc-50/80 transition-colors group">
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {debt.room}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900">{debt.tenant}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Phòng {debt.room}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-medium">{debt.phone}</td>
                  <td className="px-6 py-4 text-zinc-600">{debt.startMonth}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      debt.duration >= 3 ? 'bg-red-50 text-red-700 border-red-200' : 
                      debt.duration === 2 ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {debt.duration} tháng
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-zinc-900 text-base">{debt.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${
                      debt.status === 'Nợ xấu' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      <AlertTriangle className="w-3 h-3" />
                      {debt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-primary/20" title="Gửi nhắc nợ">
                        <BellRing className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-emerald-200" title="Thanh toán">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <CheckCircle2 className="w-12 h-12 text-emerald-300 mb-3" />
                      <p className="font-medium text-zinc-900">Không có công nợ nào</p>
                      <p className="text-sm mt-1">Tuyệt vời! Hiện không có khách hàng nào nợ tiền.</p>
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
