import React from "react";
import { Plus, Search, Filter, FileText, Download, MoreHorizontal } from "lucide-react";

export default function InvoicesPage() {
  const invoices = [
    { id: "INV-202308-102", room: "102", period: "08/2023", amount: "3.500.000 ₫", deadline: "20/08/2023", status: "Chưa thu" },
    { id: "INV-202307-102", room: "102", period: "07/2023", amount: "3.450.000 ₫", deadline: "20/07/2023", status: "Đã thu" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý hóa đơn</h1>
          <p className="text-sm text-zinc-500">Theo dõi công nợ, tiền phòng và các dịch vụ hàng tháng</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Tạo hóa đơn
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="text-sm text-zinc-500 font-medium">Tổng hóa đơn</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">2</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="text-sm text-zinc-500 font-medium">Đã thu</div>
          <div className="text-2xl font-bold text-green-600 mt-1">3.450.000 ₫</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="text-sm text-zinc-500 font-medium">Chưa thu</div>
          <div className="text-2xl font-bold text-orange-500 mt-1">3.500.000 ₫</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="text-sm text-zinc-500 font-medium">Quá hạn</div>
          <div className="text-2xl font-bold text-red-600 mt-1">0 ₫</div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm mã hóa đơn, phòng..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100">
              <Filter className="w-4 h-4" /> Tháng
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100">
              <Filter className="w-4 h-4" /> Trạng thái
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Mã HĐ</th>
                <th className="px-6 py-3 font-medium">Phòng</th>
                <th className="px-6 py-3 font-medium">Kỳ thu</th>
                <th className="px-6 py-3 font-medium">Số tiền</th>
                <th className="px-6 py-3 font-medium">Hạn thanh toán</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    {inv.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">{inv.room}</td>
                  <td className="px-6 py-4 text-zinc-600">{inv.period}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">{inv.amount}</td>
                  <td className="px-6 py-4 text-zinc-600">{inv.deadline}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                      inv.status === 'Đã thu' ? 'bg-green-100 text-green-700 border-green-200' :
                      inv.status === 'Chưa thu' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      'bg-red-100 text-red-700 border-red-200'
                    }`}>
                      {inv.status}
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
