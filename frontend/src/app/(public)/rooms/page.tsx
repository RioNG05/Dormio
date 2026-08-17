import React from "react";
import Link from "next/link";

// Mock data cho danh sách phòng trọ
const roomsData = [
  {
    id: "1",
    title: "Phòng trọ cao cấp Full đồ tại Quận 1, ban công rộng rãi",
    price: 4500000,
    area: 25,
    address: "123 Nguyễn Huệ, Bến Nghé, Quận 1, TP. HCM",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80",
    description: "Phòng trọ đầy đủ tiện nghi, giường tủ, máy lạnh, tủ lạnh, bếp nấu ăn. Khu vực an ninh có bảo vệ 24/7.",
  },
  {
    id: "2",
    title: "Căn hộ dịch vụ studio thoáng mát, gần trường ĐH Ngoại Thương",
    price: 5500000,
    area: 30,
    address: "45 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=500&q=80",
    description: "Căn hộ studio mới xây dựng, nội thất cao cấp hiện đại. Thích hợp cho người đi làm hoặc nhóm sinh viên.",
  },
  {
    id: "3",
    title: "Phòng trọ khép kín giá rẻ, an ninh tốt cho sinh viên",
    price: 2500000,
    area: 18,
    address: "88 Trần Đại Nghĩa, Bách Khoa, Hai Bà Trưng, Hà Nội",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=500&q=80",
    description: "Phòng trọ giá bình dân, có gác lửng, WC riêng, giờ giấc tự do không chung chủ. Gần các trường ĐH lớn.",
  },
  {
    id: "4",
    title: "Chung cư mini mới kính koong, full đồ quận Cầu Giấy",
    price: 6000000,
    area: 35,
    address: "12 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=500&q=80",
    description: "Chung cư mini đầy đủ nội thất sang trọng, thang máy, máy giặt chung, máy sấy quần áo. Chỗ để xe rộng.",
  },
];

export default function RoomsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
        Danh sách phòng trọ cho thuê
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Bộ lọc (Sidebar Filter) */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Bộ lọc tìm kiếm</h2>

          {/* Địa điểm */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Khu vực</label>
            <input
              type="text"
              placeholder="Hà Nội, TP. HCM..."
              className="w-full rounded-lg border border-zinc-200 p-2 text-sm focus:outline-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>

          {/* Khoảng giá */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Khoảng giá</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Từ"
                className="w-full rounded-lg border border-zinc-200 p-2 text-sm focus:outline-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
              />
              <span className="text-zinc-400">-</span>
              <input
                type="number"
                placeholder="Đến"
                className="w-full rounded-lg border border-zinc-200 p-2 text-sm focus:outline-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>

          {/* Diện tích */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Diện tích (m²)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Tối thiểu"
                className="w-full rounded-lg border border-zinc-200 p-2 text-sm focus:outline-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>

          <button className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            Áp dụng bộ lọc
          </button>
        </div>

        {/* Danh sách phòng */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {roomsData.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="group flex flex-col md:flex-row overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-950"
            >
              {/* Image */}
              <div className="relative w-full md:w-64 aspect-video md:aspect-auto md:h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={room.image}
                  alt={room.title}
                  className="h-full w-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                />
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-6 gap-3">
                <h2 className="text-lg font-bold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-500 line-clamp-1">
                  {room.title}
                </h2>
                <p className="text-xs text-zinc-400">{room.address}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {room.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  <span className="text-lg font-bold text-red-500">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(room.price)}
                    <span className="text-xs text-zinc-400 font-normal">/tháng</span>
                  </span>
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Diện tích: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{room.area} m²</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
