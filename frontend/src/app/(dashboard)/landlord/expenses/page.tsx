import React from "react";
import { Plus, Search, Filter, Receipt, MoreHorizontal } from "lucide-react";

export default function ExpensesPage() {
  const expenses = [
    { id: "CP-202308-01", category: "Bảo trì thang máy", date: "15/08/2023", amount: "1.500.000 ₫", room: "-", note: "Bảo trì định kỳ tháng 8" },
    { id: "CP-202308-02", category: "Sửa chữa", date: "10/08/2023", amount: "500.000 ₫", room: "102", note: "Thay vòi nước phòng tắm" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Chi phí</h1>
          <p className="text-sm text-zinc-500">Quản lý và ghi nhận các khoản chi phí phát sinh</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/20">
          <Plus className="w-4 h-4" /> Thêm chi phí
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm theo danh mục, phòng..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100">
              <Filter className="w-4 h-4" /> Tháng
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100">
              <Filter className="w-4 h-4" /> Danh mục
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Mã chi phí</th>
                <th className="px-6 py-3 font-medium">Danh mục</th>
                <th className="px-6 py-3 font-medium">Ngày ghi nhận</th>
                <th className="px-6 py-3 font-medium">Số tiền</th>
                <th className="px-6 py-3 font-medium">Phòng</th>
                <th className="px-6 py-3 font-medium">Ghi chú</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-zinc-400" />
                    {exp.id}
                  </td>
                  <td className="px-6 py-4 text-zinc-900">{exp.category}</td>
                  <td className="px-6 py-4 text-zinc-600">{exp.date}</td>
                  <td className="px-6 py-4 font-bold text-rose-600">-{exp.amount}</td>
                  <td className="px-6 py-4 text-zinc-600">{exp.room}</td>
                  <td className="px-6 py-4 text-zinc-600 max-w-xs truncate">{exp.note}</td>
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