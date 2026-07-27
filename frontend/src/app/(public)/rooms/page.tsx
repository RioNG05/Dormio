"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Sparkles, SlidersHorizontal, CheckCircle2 } from "lucide-react";

const initialRooms = [
  {
    id: "1",
    title: "Phòng Studio Ban Công Nguyễn Huệ Quận 1 - View Đẹp",
    price: 4500000,
    area: 25,
    city: "TP. HCM",
    address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    description: "Căn hộ Studio thiết kế sang trọng, ban công thoáng mát, đầy đủ tiện nghi điều hòa, tủ lạnh, bếp nấu ăn, máy giặt. An ninh 24/7.",
    facilities: ["Ban công", "Máy lạnh", "Tủ lạnh", "Bếp riêng", "Wifi free"],
    badge: "Hot Rent",
  },
  {
    id: "2",
    title: "Phòng Đơn Cao Cấp Tầng 1 Full Nội Thất Trung Tâm Q1",
    price: 4000000,
    area: 22,
    city: "TP. HCM",
    address: "125 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    description: "Phòng trọ cao cấp khép kín, thiết kế tối giản hiện đại. Giờ giấc tự do, khóa cửa vân tay bảo mật.",
    facilities: ["Máy lạnh", "Tủ lạnh", "Nóng lạnh", "Giờ tự do"],
    badge: "Mới trống",
  },
  {
    id: "3",
    title: "Phòng Đôi Sinh Viên Cầu Giấy Gần Đại Học Ngoại Thương",
    price: 3200000,
    area: 24,
    city: "Hà Nội",
    address: "45 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội",
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80",
    description: "Phòng trọ sinh viên thoáng mát có ban công, gần FTU, DAV, UTC. Khép kín, giường tầng hoặc giường đôi tùy chọn.",
    facilities: ["Wifi tốc độ cao", "Nóng lạnh", "Ban công", "Chỗ để xe"],
    badge: "Giá tốt",
  },
  {
    id: "4",
    title: "Căn Hộ Duplex Cửa Sổ Lớn Bình Thạnh - View Landmark 81",
    price: 5500000,
    area: 30,
    city: "TP. HCM",
    address: "78 Điện Biên Phủ, Phường 25, Bình Thạnh, TP. HCM",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    description: "Căn hộ Duplex gác lửng trần cao, nội thất gỗ tự nhiên cao cấp, máy giặt riêng, cửa sổ thoáng đón ánh sáng tự nhiên.",
    facilities: ["Gác lửng", "Máy giặt riêng", "Thang máy", "Bảo vệ 24/7"],
    badge: "Cao cấp",
  },
  {
    id: "5",
    title: "Căn Hộ Studio Sân Thượng Chill View Landmark 81",
    price: 6000000,
    area: 35,
    city: "TP. HCM",
    address: "80 Điện Biên Phủ, Phường 25, Bình Thạnh, TP. HCM",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    description: "Căn hộ Penthouse sân thực sự đẳng cấp. Không gian mở rộng 35m2, bếp từ âm, sofa cao cấp, thích hợp ở 2-3 người.",
    facilities: ["Sân thượng chill", "Sofa", "Bếp từ âm", "Thang máy từ"],
    badge: "VIP",
  },
  {
    id: "6",
    title: "Phòng Trọ Khép Kín Giá Rẻ Sinh Viên Cầu Giấy",
    price: 2800000,
    area: 20,
    city: "Hà Nội",
    address: "47 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    description: "Phòng trọ giá sinh viên khép kín, đã có sẵn bình nóng lạnh, máy lạnh inverter tiết kiệm điện.",
    facilities: ["Máy lạnh", "Nóng lạnh", "An ninh tốt"],
    badge: "Tiết kiệm",
  },
];

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  const filteredRooms = initialRooms.filter((room) => {
    const matchesSearch =
      room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === "ALL" || room.city === selectedCity;
    const matchesPrice = maxPrice === "" || room.price <= Number(maxPrice);
    return matchesSearch && matchesCity && matchesPrice;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Khám phá phòng trọ cho thuê
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Hơn 500+ căn hộ studio & phòng trọ uy tín, đã xác thực thông tin chính chủ.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full w-fit">
          <Sparkles className="w-4 h-4 text-primary" /> Cập nhật mới liên tục 24/7
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Bộ lọc (Sidebar Filter) */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-5 h-fit sticky top-20">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" /> Bộ lọc tìm kiếm
            </h2>
            <button 
              onClick={() => { setSearchTerm(""); setSelectedCity("ALL"); setMaxPrice(""); }}
              className="text-xs text-zinc-400 hover:text-primary font-semibold"
            >
              Đặt lại
            </button>
          </div>

          {/* Tìm từ khóa */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Từ khóa</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Tên đường, quận, từ khóa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>

          {/* Địa điểm */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Thành phố</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-zinc-800 dark:bg-zinc-900 font-semibold"
            >
              <option value="ALL">Tất cả thành phố</option>
              <option value="TP. HCM">TP. Hồ Chí Minh</option>
              <option value="Hà Nội">Hà Nội</option>
            </select>
          </div>

          {/* Giá tối đa */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Giá tối đa (VNĐ)</label>
            <input
              type="number"
              placeholder="VD: 5000000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-xl border border-zinc-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
        </div>

        {/* Danh sách phòng */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium px-1">
            <span>Tìm thấy <strong className="text-zinc-900 dark:text-zinc-100">{filteredRooms.length}</strong> phòng trọ khả dụng</span>
          </div>

          {filteredRooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="group flex flex-col md:flex-row overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-lg transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950 hover:border-primary/40"
            >
              {/* Image */}
              <div className="relative w-full md:w-72 aspect-video md:aspect-auto md:h-52 overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0">
                <img
                  src={room.image}
                  alt={room.title}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-extrabold text-white bg-primary/90 backdrop-blur-xs rounded-full shadow-sm">
                  {room.badge}
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-6 gap-2.5">
                <h2 className="text-base font-bold text-zinc-900 group-hover:text-primary transition-colors dark:text-zinc-50 line-clamp-1">
                  {room.title}
                </h2>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {room.address}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {room.description}
                </p>

                {/* Facilities Badges */}
                <div className="flex flex-wrap gap-1.5 my-1">
                  {room.facilities.map((fac, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> {fac}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  <span className="text-lg font-extrabold text-rose-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(room.price)}
                    <span className="text-xs text-zinc-400 font-normal"> /tháng</span>
                  </span>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Diện tích: <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{room.area} m²</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {filteredRooms.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 p-8">
              <p className="text-zinc-500 font-medium">Không tìm thấy phòng trọ nào phù hợp với bộ lọc.</p>
              <button 
                onClick={() => { setSearchTerm(""); setSelectedCity("ALL"); setMaxPrice(""); }}
                className="mt-3 text-xs font-bold text-primary hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

