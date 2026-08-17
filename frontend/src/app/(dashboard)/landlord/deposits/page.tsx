import React from "react";
import { Plus, Search, Filter, PiggyBank, MoreHorizontal } from "lucide-react";

export default function DepositsPage() {
  const deposits = [
    { id: "DC-102", room: "102", tenant: "Nguyễn Văn A", amount: "3.000.000 ₫", date: "15/08/2023", status: "Đang giữ" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Tiền đặt cọc</h1>
          <p className="text-sm text-zinc-500">Quản lý cọc giữ chỗ và cọc hợp đồng của khách thuê</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/20">
          <Plus className="w-4 h-4" /> Thêm đặt cọc
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="text-sm text-zinc-500 font-medium">Tổng tiền cọc đang giữ</div>
          <div className="text-2xl font-bold text-primary mt-1">3.000.000 ₫</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="text-sm text-zinc-500 font-medium">Đã hoàn cọc</div>
          <div className="text-2xl font-bold text-green-600 mt-1">0 ₫</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="text-sm text-zinc-500 font-medium">Đã trừ cọc</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">0 ₫</div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm theo phòng, tên khách..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100">
            <Filter className="w-4 h-4" /> Trạng thái
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Mã GD</th>
                <th className="px-6 py-3 font-medium">Phòng</th>
                <th className="px-6 py-3 font-medium">Khách thuê</th>
                <th className="px-6 py-3 font-medium">Số tiền</th>
                <th className="px-6 py-3 font-medium">Ngày đặt cọc</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {deposits.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900 flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-zinc-400" />
                    {d.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">{d.room}</td>
                  <td className="px-6 py-4 text-zinc-600">{d.tenant}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">{d.amount}</td>
                  <td className="px-6 py-4 text-zinc-600">{d.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                      {d.status}
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
