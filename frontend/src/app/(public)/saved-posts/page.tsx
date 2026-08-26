"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart, Trash2, ArrowRight, Sparkles, MapPin, Minimize2, Scale, QrCode,
  CheckCircle2, X, Check, Share2, Lock, ShieldCheck, Phone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/utils";

export default function SavedPostsPage() {
  const { isLoggedIn } = useAuth();

  const [savedRooms, setSavedRooms] = useState([
    {
      id: "1",
      title: "Phòng Studio Ban Công Nguyễn Huệ Quận 1 - View Đẹp",
      price: 4500000,
      depositAmount: 1000000,
      area: 25,
      address: "123 Nguyễn Huệ, Bến Nghé, Quận 1, TP. HCM",
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      amenities: ["Ban công", "Máy lạnh Inverter", "Tủ lạnh", "Bếp riêng", "Wifi free", "Khóa vân tay"],
      landlord: { name: "Nguyễn Văn Rio", phone: "0901.234.567" }
    },
    {
      id: "2",
      title: "Phòng Đơn Cao Cấp Tầng 1 Full Nội Thất Trung Tâm Q1",
      price: 4000000,
      depositAmount: 500000,
      area: 22,
      address: "125 Nguyễn Huệ, Bến Nghé, Quận 1, TP. HCM",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      amenities: ["Máy lạnh", "Tủ lạnh", "Nóng lạnh", "Giờ tự do", "Bảo vệ 24/7"],
      landlord: { name: "Trần Thị Lan", phone: "0987.654.321" }
    },
    {
      id: "3",
      title: "Phòng Đôi Sinh Viên Cầu Giấy Gần FTU Ngoại Thương",
      price: 3200000,
      depositAmount: 0, // Miễn phí cọc
      area: 24,
      address: "45 Chùa Láng, Đống Đa, Hà Nội",
      image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
      amenities: ["Wifi tốc độ cao", "Nóng lạnh", "Ban công", "Chỗ để xe"],
      landlord: { name: "Lê Hoàng Nam", phone: "0912.345.678" }
    }
  ]);

  // Selected Room IDs for Side-by-Side Comparison
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const toggleSelectCompare = (id: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeSaved = (id: string) => {
    setSavedRooms((prev) => prev.filter((room) => room.id !== id));
    setSelectedForCompare((prev) => prev.filter((item) => item !== id));
  };

  const selectedRoomsData = savedRooms.filter((r) => selectedForCompare.includes(r.id));

  // IF USER IS NOT LOGGED IN, SHOW LOGIN PROMPT LOCK SCREEN
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">
        {/* Full-Width Hero Header */}
        <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
          <div className="relative z-10 max-w-4xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-500/20 text-rose-400 text-xs font-black rounded-full border border-rose-500/30 shadow-lg">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" /> TÍNH NĂNG DÀNH CHO THÀNH VIÊN
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.18] drop-shadow-md">
              <span>Danh Sách Phòng Trọ Đã Lưu</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto">
              Vui lòng đăng nhập tài khoản để xem và quản lý danh sách các phòng trọ yêu thích của bạn.
            </p>
          </div>
        </section>

        {/* Lock Screen Body */}
        <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto shadow-inner border border-[#2AC1BC]/20">
            <Lock className="w-10 h-10 text-[#2AC1BC]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-zinc-900">Yêu Cầu Đăng Nhập Tài Khoản</h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-md mx-auto">
              Trang danh sách lưu trữ phòng trọ chỉ dành cho thành viên đã có tài khoản trên nền tảng Dormio. Đăng nhập ngay để lưu giữ các căn hộ ưng ý & đối chiếu so sánh giá 24/7!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 transition-all cursor-pointer hover:scale-105">
                Đăng nhập tài khoản ngay &rarr;
              </button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer">
                Tạo tài khoản mới
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">

      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-500/20 text-rose-400 text-xs font-black rounded-full border border-rose-500/30 shadow-lg">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" /> DANH SÁCH PHÒNG TRỌ ĐÃ LƯU
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] drop-shadow-md">
            <span className="inline-block whitespace-nowrap">Danh Sách Yêu Thích</span> <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent inline-block whitespace-nowrap">
              So Sánh & Đặt Cọc
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto text-balance">
            Tùy chọn tích chọn các phòng trọ để mở đối chiếu so sánh thông số giá thuê, tiền cọc và tiện ích.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full">
        {savedRooms.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-200/80 space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-zinc-900">Chưa có phòng trọ nào được lưu</h3>
            <p className="text-xs text-zinc-500 font-medium">Hãy dạo xem danh sách phòng trọ chính chủ và nhấp vào biểu tượng trái tim để lưu lại.</p>
            <Link href="/rooms">
              <button className="px-6 py-3 bg-[#2AC1BC] text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-[#72b3a3] transition-all cursor-pointer">
                Khám phá danh sách phòng ngay &rarr;
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8 pb-16">
            {/* Fixed Floating Bottom Compare Action Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[calc(100%-2rem)] bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 text-white p-4 sm:px-6 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                <span className="w-8 h-8 rounded-full bg-[#2AC1BC]/20 text-[#2AC1BC] flex items-center justify-center font-black">
                  {selectedForCompare.length}
                </span>
                <span className="hidden sm:inline">
                  Đã lưu <strong className="text-white">{savedRooms.length}</strong> phòng • Đã chọn <strong className="text-[#2AC1BC]">{selectedForCompare.length}</strong> phòng so sánh
                </span>
                <span className="sm:hidden text-white font-bold">
                  Đã chọn {selectedForCompare.length} phòng
                </span>
              </div>

              {/* Compare Button */}
              <button
                onClick={() => setIsCompareModalOpen(true)}
                disabled={selectedForCompare.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] to-[#FF6B35] disabled:opacity-40 hover:from-[#23B3AE] hover:to-[#ff5518] text-white font-extrabold text-xs rounded-full shadow-lg shadow-[#2AC1BC]/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 shrink-0"
              >
                <Scale className="w-4 h-4" /> Bắt đầu so sánh ({selectedForCompare.length}) →
              </button>
            </div>

            {/* Saved Rooms Cards Grid with Checkbox */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {savedRooms.map((room) => {
                const isSelected = selectedForCompare.includes(room.id);

                return (
                  <div
                    key={room.id}
                    className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group relative ${isSelected
                      ? "border-[#2AC1BC] shadow-lg ring-2 ring-[#2AC1BC]/20"
                      : "border-zinc-200/80 shadow-sm hover:shadow-md"
                      }`}
                  >
                    {/* Checkbox Selector for Compare */}
                    <div
                      onClick={() => toggleSelectCompare(room.id)}
                      className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-full text-white text-xs font-bold cursor-pointer hover:bg-zinc-900 transition-all shadow-md"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }} // handled by div click
                        className="w-4 h-4 accent-[#2AC1BC] cursor-pointer"
                      />
                      <span>{isSelected ? "Đã chọn so sánh" : "Chọn so sánh"}</span>
                    </div>

                    {/* Image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                      <img
                        src={room.image}
                        alt={room.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={() => removeSaved(room.id)}
                        className="absolute top-3 right-3 p-2 bg-zinc-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                        title="Bỏ lưu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <Link href={`/rooms/${room.id}`}>
                          <h3 className="font-extrabold text-zinc-900 text-base leading-snug group-hover:text-[#2AC1BC] transition-colors line-clamp-2">
                            {room.title}
                          </h3>
                        </Link>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(room.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center text-xs text-zinc-400 font-semibold gap-1 hover:text-[#2AC1BC] hover:underline cursor-pointer transition-colors"
                          title="Mở Google Maps xem vị trí chính xác"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                          <span className="truncate">{room.address}</span>
                        </a>
                      </div>

                      <div className="pt-3 border-t border-zinc-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-black text-rose-500">{formatVND(room.price)}</span>
                          <span className="text-xs text-zinc-700 font-bold">{room.area} m²</span>
                        </div>

                        <span className="text-[11px] font-bold text-zinc-500 block">
                          Tiền cọc: {room.depositAmount > 0 ? formatVND(room.depositAmount) : "Miễn phí cọc"}
                        </span>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Link href={`/rooms/${room.id}`}>
                            <button className="w-full py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 text-[#2AC1BC] font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center">
                              Xem Chi Tiết
                            </button>
                          </Link>
                          <Link href={`/rooms/${room.id}`}>
                            <button className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#ff5518] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center">
                              Đặt Cọc Giữ Phòng
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Side-by-Side Comparison Modal */}
      {isCompareModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsCompareModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-zinc-100 relative max-h-[90vh] overflow-y-auto cursor-default">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#2AC1BC]" /> Bảng Đối Chiếu So Sánh Chi Tiết ({selectedRoomsData.length} Phòng)
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  So sánh trực quan giá thuê, tiền cọc, diện tích và tiện ích đi kèm.
                </p>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="p-3 text-xs font-black text-zinc-400 uppercase w-44">Tiêu chí so sánh</th>
                    {selectedRoomsData.map((room) => (
                      <th key={room.id} className="p-3 min-w-[220px]">
                        <div className="space-y-2">
                          <img src={room.image} alt={room.title} className="w-full h-28 object-cover rounded-xl border border-zinc-200" />
                          <h4 className="font-extrabold text-xs text-zinc-900 line-clamp-2">{room.title}</h4>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs font-semibold">
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">Giá thuê / tháng</td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 font-black text-rose-500 text-sm">
                        {formatVND(room.price)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">Tiền cọc giữ chỗ</td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 font-bold text-zinc-900">
                        {room.depositAmount > 0 ? formatVND(room.depositAmount) : <span className="text-emerald-600 font-black">Miễn phí cọc xem phòng</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">Diện tích phòng</td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 text-zinc-800 font-extrabold">
                        {room.area} m²
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">Địa chỉ chi tiết</td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 text-zinc-600">
                        {room.address}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">Tiện ích đi kèm</td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {room.amenities.map((item, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-md text-[10px] font-bold">
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">Chủ nhà trọ</td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 text-zinc-700 font-bold">
                        {room.landlord.name} ({room.landlord.phone})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">Hành động</td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3">
                        <Link href={`/rooms/${room.id}`}>
                          <button className="w-full py-2 bg-[#FF6B35] hover:bg-[#ff5518] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all">
                            Xem & Đặt Cọc &rarr;
                          </button>
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}