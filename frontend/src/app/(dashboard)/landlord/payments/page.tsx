import { useTranslations } from "@/context/LanguageContext";
import React from "react";
import { Plus, Search, Filter, CreditCard, ArrowDownLeft, MoreHorizontal } from "lucide-react";

export default function PaymentsPage() {
  const t = useTranslations("invoices");
  const payments = [
    { id: "PT-001", invoice: "INV-202307-102", room: "102", date: "20/07/2023", amount: "3.450.000 ₫", method: "Chuyển khoản", status: "Thành công" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Công nợ & Thanh toán</h1>
          <p className="text-sm text-zinc-500">Lịch sử thu tiền và theo dõi công nợ của khách</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/20">
          <CreditCard className="w-4 h-4" /> Ghi nhận thanh toán
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm border-l-4 border-l-green-500">
          <div className="text-sm text-zinc-500 font-medium">Tổng thu (tháng này)</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">3.450.000 ₫</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm border-l-4 border-l-orange-500">
          <div className="text-sm text-zinc-500 font-medium">Tổng công nợ</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">3.500.000 ₫</div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-zinc-200">
          <button className="px-6 py-3 text-sm font-bold text-primary border-b-2 border-primary bg-primary/5">
            Lịch sử thanh toán
          </button>
          <button className="px-6 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50">
            Danh sách công nợ
          </button>
        </div>
        
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm theo mã GD, phòng..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100">
              <Filter className="w-4 h-4" /> Hình thức
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Mã giao dịch</th>
                <th className="px-6 py-3 font-medium">Phòng</th>
                <th className="px-6 py-3 font-medium">Hóa đơn</th>
                <th className="px-6 py-3 font-medium">Ngày thanh toán</th>
                <th className="px-6 py-3 font-medium">Số tiền</th>
                <th className="px-6 py-3 font-medium">Hình thức</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900 flex items-center gap-2">
                    <ArrowDownLeft className="w-4 h-4 text-green-500" />
                    {p.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">{p.room}</td>
                  <td className="px-6 py-4 text-blue-600 underline cursor-pointer">{p.invoice}</td>
                  <td className="px-6 py-4 text-zinc-600">{p.date}</td>
                  <td className="px-6 py-4 font-bold text-green-600">+{p.amount}</td>
                  <td className="px-6 py-4 text-zinc-600">{p.method}</td>
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
