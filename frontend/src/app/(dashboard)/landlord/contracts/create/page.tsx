"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ChevronLeft, FileSignature, User, DollarSign, Home, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function CreateContractPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleFinish = () => {
    router.push("/landlord/contracts");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 bg-zinc-50/50 min-h-screen p-8 rounded-3xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Tạo hợp đồng mới</h1>
        <p className="text-sm text-zinc-500 mt-2">Hoàn thiện thông tin để tạo hợp đồng điện tử</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-3">
        <button 
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors ${
            step === 1 ? 'bg-accent text-white shadow-md shadow-accent/20' : step > 1 ? 'bg-accent/10 text-accent' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {step > 1 ? <Check className="w-4 h-4" /> : <Home className="w-4 h-4" />} Phòng & Khách
        </button>
        <ChevronRight className="w-4 h-4 text-zinc-300" />
        
        <button 
          onClick={() => step > 1 && setStep(2)}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors ${
            step === 2 ? 'bg-accent text-white shadow-md shadow-accent/20' : step > 2 ? 'bg-accent/10 text-accent' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {step > 2 ? <Check className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />} Tài chính & Dịch vụ
        </button>
        <ChevronRight className="w-4 h-4 text-zinc-300" />
        
        <button 
          onClick={() => step > 2 && setStep(3)}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors ${
            step === 3 ? 'bg-accent text-white shadow-md shadow-accent/20' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          <FileSignature className="w-4 h-4" /> Chốt hợp đồng
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 md:p-8">
        
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">Thông tin phòng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Tòa nhà <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="">-- Chọn tòa nhà --</option>
                    <option value="toaa">Tòa A</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Phòng <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="">-- Chọn phòng --</option>
                    <option value="101">101</option>
                    <option value="102">102</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Người đại diện thuê</h3>
                <button className="text-sm text-accent font-bold hover:underline">Thêm khách mới</button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Khách thuê <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                  <option value="">-- Tìm khách thuê có sẵn --</option>
                  <option value="kh1">Nguyễn Văn A - 0901234567</option>
                </select>
                <p className="text-xs text-zinc-500 mt-1">Gõ số điện thoại hoặc tên để tìm kiếm</p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Link href="/landlord/contracts" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                Hủy bỏ
              </Link>
              <button 
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm transition-all"
              >
                Tiếp theo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="space-y-6">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">Tài chính</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Giá thuê (VND/tháng) <span className="text-red-500">*</span></label>
                  <input type="text" defaultValue="3.000.000" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Tiền cọc (VND) <span className="text-red-500">*</span></label>
                  <input type="text" defaultValue="3.000.000" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Chu kỳ thu tiền</label>
                  <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="1">1 tháng/lần</option>
                    <option value="3">3 tháng/lần</option>
                    <option value="6">6 tháng/lần</option>
                    <option value="12">1 năm/lần</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Ngày thu tiền hàng tháng</label>
                  <input type="number" min="1" max="31" defaultValue="5" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">Thời hạn hợp đồng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Ngày bắt đầu <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Ngày kết thúc <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-zinc-700" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">Chốt chỉ số đồng hồ ban đầu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Số điện đầu</label>
                  <input type="number" defaultValue="0" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Số nước đầu</label>
                  <input type="number" defaultValue="0" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
              <button 
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm transition-all"
              >
                Tiếp theo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                <FileSignature className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Xác nhận tạo hợp đồng</h2>
              <p className="text-sm text-zinc-500 mt-1">Bạn có thể tải lên bản scan hợp đồng giấy để lưu trữ.</p>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Đính kèm tài liệu</h3>
                <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-accent transition-colors cursor-pointer group">
                  <ImageIcon className="w-10 h-10 text-zinc-400 group-hover:text-accent mb-3" />
                  <span className="text-sm font-bold text-zinc-700">Tải lên file PDF hoặc ảnh (tùy chọn)</span>
                  <span className="text-xs text-zinc-500 mt-1">Giới hạn 10MB</span>
                </div>
            </div>
            
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Phòng:</span>
                <span className="font-bold text-zinc-900">101 - Tòa A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Khách thuê:</span>
                <span className="font-bold text-zinc-900">Nguyễn Văn A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Thời hạn:</span>
                <span className="font-bold text-zinc-900">1 năm (15/08/2023 - 15/08/2024)</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-zinc-200">
                <span className="text-zinc-500 font-medium">Tổng tiền cọc phải thu:</span>
                <span className="font-bold text-accent text-base">3.000.000 ₫</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
              <button 
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
              >
                <Check className="w-4 h-4" /> Ký hợp đồng
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
