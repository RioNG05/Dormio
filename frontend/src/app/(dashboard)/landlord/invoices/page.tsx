"use client";

import React, { useState } from "react";
import { Plus, Search, Filter, FileText, Download, MoreHorizontal, Receipt, Building2, ChevronDown, Sparkles, MapPin, FileSpreadsheet } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function InvoicesPage() {
  const { activeBuilding } = useAuth();
  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const getBuildingTitle = (id: string) => {
    return activeBuilding.name;
  };

  const invoices = [
    { id: "INV-202308-102", room: "102", period: "08/2023", amount: "3.500.000 ₫", deadline: "20/08/2023", status: "Chưa thu" },
    { id: "INV-202307-102", room: "102", period: "07/2023", amount: "3.450.000 ₫", deadline: "20/07/2023", status: "Đã thu" },
  ];

  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrMeterValue, setOcrMeterValue] = useState("1428");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <button
          onClick={() => setIsOcrModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-900 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors shadow-xs cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" /> AI Quét Điện Nước OCR
        </button>
        <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Xuất Excel
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2ac1bc] hover:bg-[#72b3a3] rounded-xl shadow-md shadow-[#2ac1bc]/20 transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Tạo hóa đơn mới
        </button>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden mb-6 border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Receipt className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              {getBuildingTitle(buildingFilter)}
            </h2>

            {/* Separated Address Line with Integrated Map Link */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all">
              <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
              <span className="text-xs font-bold text-zinc-200">{activeBuilding.address}</span>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                target="_blank"
                rel="noreferrer"
                className="ml-1.5 px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <span>Xem Bản Đồ</span> &rarr;
              </a>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Theo dõi công nợ, tiền phòng, điện nước và chốt số tự động qua VietQR & AI OCR.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/10 backdrop-blur-md min-w-[135px]">
                <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Số tòa nhà</span>
                  <span className="font-black text-white text-lg leading-none mt-1">1</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md min-w-[145px]">
                <Receipt className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng hóa đơn</span>
                  <span className="font-black text-rose-500 text-lg leading-none mt-1">{invoices.length}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2ac1bc]/10 hover:bg-[#2ac1bc]/20 transition-colors rounded-2xl border border-[#2ac1bc]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2ac1bc] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2ac1bc] tracking-wider">Đã thu</span>
                  <span className="font-black text-[#2ac1bc] text-lg leading-none mt-1">3.45M ₫</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-2xl border border-[#FF6B35]/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Chưa thu</span>
                  <span className="font-black text-[#FF6B35] text-lg leading-none mt-1">3.50M ₫</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-2xl border border-blue-500/30 backdrop-blur-md min-w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Hóa đơn mới</span>
                  <span className="font-black text-blue-400 text-lg leading-none mt-1">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm mã hóa đơn, phòng..." 
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2ac1bc] focus:ring-4 focus:ring-[#2ac1bc]/10 transition-all bg-zinc-50/50"
            />
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

      {/* AI OCR METER READING SPLIT-SCREEN VERIFICATION MODAL */}
      {isOcrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-zinc-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Sparkles className="w-6 h-6 fill-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900">AI OCR Đối Soát Chỉ Số Đồng Hồ Điện</h2>
                  <p className="text-xs text-zinc-500 font-medium">So sánh ảnh chụp thực tế và số liệu AI tự động nhận diện trước khi tính hóa đơn.</p>
                </div>
              </div>
              <button
                onClick={() => setIsOcrModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Split Screen Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
              
              {/* Left Side: Photo with AI Bounding Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-zinc-700 uppercase tracking-wider">1. Ảnh Chụp Đồng Hồ Phòng 102</span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-extrabold">
                    AI Độ Chính Xác 99.4%
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-amber-500/50 bg-zinc-900 h-64 flex items-center justify-center group shadow-inner">
                  {/* Mock Meter Screen Visual */}
                  <div className="text-center space-y-2">
                    <div className="inline-block px-6 py-3 bg-black/80 rounded-xl border-2 border-emerald-400 font-mono text-3xl font-black text-emerald-400 tracking-widest shadow-[0_0_15px_rgba(52,211,153,0.5)] relative">
                      {ocrMeterValue}
                      <span className="absolute -top-3 -right-3 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded-full animate-bounce">
                        OCR Box
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">Đồng hồ cơ khí 1 pha — Chụp lúc 08:30 hôm nay</p>
                  </div>
                </div>
              </div>

              {/* Right Side: AI Extracted Details & Inputs */}
              <div className="space-y-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-200/80 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs font-black text-zinc-700 uppercase tracking-wider block">2. Chi Tiết Tính Tiền Điện Tháng 8</span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-zinc-200">
                      <span className="text-[10px] font-extrabold text-zinc-400 block">CHỈ SỐ CŨ</span>
                      <span className="text-base font-black text-zinc-800">1.318 kWh</span>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                      <span className="text-[10px] font-extrabold text-amber-700 block">CHỈ SỐ MỚI (AI OCR)</span>
                      <input
                        type="text"
                        value={ocrMeterValue}
                        onChange={(e) => setOcrMeterValue(e.target.value)}
                        className="w-full text-base font-black text-amber-700 bg-transparent outline-none border-b border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-zinc-200 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-zinc-600">
                      <span>Sản lượng tiêu thụ:</span>
                      <span className="text-zinc-900 font-black">{Math.max(0, parseInt(ocrMeterValue || "0") - 1318)} kWh</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-zinc-600">
                      <span>Đơn giá điện:</span>
                      <span className="text-zinc-900">3.500 ₫ / kWh</span>
                    </div>
                    <div className="border-t border-zinc-100 pt-2 flex justify-between text-sm font-black text-zinc-900">
                      <span>Thành tiền điện:</span>
                      <span className="text-[#2AC1BC]">
                        {((Math.max(0, parseInt(ocrMeterValue || "0") - 1318)) * 3500).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setIsOcrModalOpen(false)}
                    className="flex-1 py-3 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => {
                      alert(`Đã xác nhận chỉ số ${ocrMeterValue} kWh & gộp vào hóa đơn thành công!`);
                      setIsOcrModalOpen(false);
                    }}
                    className="flex-1 py-3 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    ✓ Xác Nhận & Lập Hóa Đơn
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
