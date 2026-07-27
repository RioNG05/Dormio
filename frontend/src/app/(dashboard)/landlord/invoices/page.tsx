"use client";

import React, { useState } from "react";
import { Plus, Search, Filter, FileText, Download, MoreHorizontal, CheckCircle2, Zap, Droplets } from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([
    { id: "INV-2026-07-001", room: "P101", period: "07/2026", amount: "5.326.000 ₫", deadline: "05/08/2026", status: "Chưa thu" },
    { id: "INV-2026-06-001", room: "P101", period: "06/2026", amount: "5.150.000 ₫", deadline: "05/07/2026", status: "Đã thu" },
    { id: "INV-2026-07-102", room: "P102", period: "07/2026", amount: "4.450.000 ₫", deadline: "05/08/2026", status: "Chưa thu" },
  ]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [roomCode, setRoomCode] = useState("P101");
  const [month, setMonth] = useState("7");
  const [year, setYear] = useState("2026");
  const [elecStart, setElecStart] = useState("1200");
  const [elecEnd, setElecEnd] = useState("1350");
  const [waterStart, setWaterStart] = useState("45");
  const [waterEnd, setWaterEnd] = useState("52");
  const [roomPrice, setRoomPrice] = useState("4500000");

  const elecUsage = Math.max(0, (Number(elecEnd) || 0) - (Number(elecStart) || 0));
  const waterUsage = Math.max(0, (Number(waterEnd) || 0) - (Number(waterStart) || 0));
  const elecAmount = elecUsage * 3800;
  const waterAmount = waterUsage * 18000;
  const totalAmount = (Number(roomPrice) || 0) + elecAmount + waterAmount + 130000; // 130k service

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const newInv = {
      id: `INV-${year}-${month.padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`,
      room: roomCode,
      period: `${month.padStart(2, "0")}/${year}`,
      amount: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalAmount),
      deadline: `05/${(Number(month) + 1).toString().padStart(2, "0")}/${year}`,
      status: "Chưa thu",
    };
    setInvoices([newInv, ...invoices]);
    setCreateModalOpen(false);
  };

  const totalInvoices = invoices.length;
  const totalPaid = invoices.filter(i => i.status === "Đã thu").length;
  const totalUnpaid = invoices.filter(i => i.status === "Chưa thu").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý hóa đơn</h1>
          <p className="text-sm text-zinc-500">Theo dõi công nợ, chốt chỉ số điện nước & phát hành hóa đơn hàng tháng</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer">
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <button 
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Chốt điện nước & Tạo HĐ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="text-sm text-zinc-500 font-medium">Tổng hóa đơn</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">{totalInvoices}</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="text-sm text-zinc-500 font-medium">Đã thu ({totalPaid})</div>
          <div className="text-2xl font-bold text-green-600 mt-1">5.150.000 ₫</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="text-sm text-zinc-500 font-medium">Chưa thu ({totalUnpaid})</div>
          <div className="text-2xl font-bold text-orange-500 mt-1">9.776.000 ₫</div>
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

      {/* Modal Chốt Điện Nước & Phát Hành Hóa Đơn */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-100 relative">
            <button 
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-1.5 rounded-full hover:bg-zinc-100"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-zinc-900 mb-1">Chốt số điện nước & Tạo hóa đơn</h3>
            <p className="text-xs text-zinc-500 mb-5">Nhập chỉ số tháng mới để tự động tính tổng tiền phòng</p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Chọn phòng</label>
                  <select 
                    value={roomCode} 
                    onChange={e => setRoomCode(e.target.value)}
                    className="w-full h-10 border border-zinc-200 rounded-lg px-3 text-sm focus:border-primary outline-none"
                  >
                    <option value="P101">P101 - Q1</option>
                    <option value="P102">P102 - Q1</option>
                    <option value="P201">P201 - Cầu Giấy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Tháng</label>
                  <input 
                    type="number" 
                    value={month} 
                    onChange={e => setMonth(e.target.value)}
                    className="w-full h-10 border border-zinc-200 rounded-lg px-3 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Năm</label>
                  <input 
                    type="number" 
                    value={year} 
                    onChange={e => setYear(e.target.value)}
                    className="w-full h-10 border border-zinc-200 rounded-lg px-3 text-sm focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Điện */}
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold mb-2">
                  <Zap className="w-4 h-4 text-amber-600" /> Điện (Đơn giá: 3.800đ/kWh)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-zinc-500">Chỉ số cũ (kWh)</span>
                    <input 
                      type="number" 
                      value={elecStart} 
                      onChange={e => setElecStart(e.target.value)}
                      className="w-full h-9 bg-white border border-zinc-200 rounded-lg px-3 text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500">Chỉ số mới (kWh)</span>
                    <input 
                      type="number" 
                      value={elecEnd} 
                      onChange={e => setElecEnd(e.target.value)}
                      className="w-full h-9 bg-white border border-zinc-200 rounded-lg px-3 text-sm font-bold text-amber-900"
                    />
                  </div>
                </div>
                <div className="text-right text-xs font-bold text-amber-700 mt-2">
                  Dùng: {elecUsage} kWh = {new Intl.NumberFormat("vi-VN").format(elecAmount)}đ
                </div>
              </div>

              {/* Nước */}
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200/60">
                <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold mb-2">
                  <Droplets className="w-4 h-4 text-blue-600" /> Nước (Đơn giá: 18.000đ/m³)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-zinc-500">Chỉ số cũ (m³)</span>
                    <input 
                      type="number" 
                      value={waterStart} 
                      onChange={e => setWaterStart(e.target.value)}
                      className="w-full h-9 bg-white border border-zinc-200 rounded-lg px-3 text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500">Chỉ số mới (m³)</span>
                    <input 
                      type="number" 
                      value={waterEnd} 
                      onChange={e => setWaterEnd(e.target.value)}
                      className="w-full h-9 bg-white border border-zinc-200 rounded-lg px-3 text-sm font-bold text-blue-900"
                    />
                  </div>
                </div>
                <div className="text-right text-xs font-bold text-blue-700 mt-2">
                  Dùng: {waterUsage} m³ = {new Intl.NumberFormat("vi-VN").format(waterAmount)}đ
                </div>
              </div>

              {/* Tổng kết */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex justify-between items-center text-sm">
                <span className="font-extrabold text-zinc-900 uppercase text-xs">Tổng hóa đơn phát hành:</span>
                <span className="font-extrabold text-primary text-base">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalAmount)}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20"
                >
                  Phát hành Hóa đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

