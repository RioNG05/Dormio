import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Minimize2, Tag, ShieldCheck, User } from "lucide-react";
import { formatVND } from "@/utils";

interface RoomDetailPageProps {
  params: Promise<{ id: string }>;
}

// Mock function để lấy dữ liệu phòng theo ID
async function getRoomData(id: string) {
  // Giả lập cuộc gọi API
  const rooms = [
    {
      id: "1",
      title: "Phòng trọ cao cấp Full đồ tại Quận 1, ban công rộng rãi",
      price: 4500000,
      area: 25,
      address: "123 Nguyễn Huệ, Bến Nghé, Quận 1, TP. HCM",
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      ],
      description: `Phòng trọ đầy đủ tiện nghi thiết kế hiện đại tại trung tâm Quận 1.
      - Nội thất: Giường nệm cao cấp, tủ quần áo lớn, điều hòa Inverter tiết kiệm điện, tủ lạnh, bàn làm việc.
      - Khu bếp riêng biệt, trang bị đầy đủ dụng cụ nấu nướng.
      - Phòng tắm khép kín, vòi sen nóng lạnh, thiết bị vệ sinh cao cấp.
      - Tiện ích chung: Thang máy tốc độ cao, khóa vân tay an ninh, camera giám sát 24/7, máy giặt và sân phơi rộng rãi trên tầng thượng.
      - Vị trí: Ngay trục đường Nguyễn Huệ, thuận tiện di chuyển qua các quận lân cận, gần siêu thị, cửa hàng tiện lợi, hàng quán đông đúc.`,
      facilities: ["Wifi tốc độ cao", "Điều hòa", "Tủ lạnh", "Máy giặt", "Thang máy", "Khóa vân tay", "Ban công"],
      landlord: {
        name: "Nguyễn Văn Rio",
        phone: "0901.234.567",
        email: "landlord.rio@gmail.com",
      },
    },
  ];

  return rooms.find((r) => r.id === id) || rooms[0];
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { id } = await params;
  const room = await getRoomData(id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/rooms"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách phòng
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Images Gallery */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-900 md:col-span-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={room.images[0]}
                  alt={room.title}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            </div>
          </div>

          {/* Title & Stats */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              {room.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span>{room.address}</span>
              </div>
              <div className="flex items-center gap-1">
                <Minimize2 className="h-4 w-4 text-zinc-400" />
                <span>Diện tích: {room.area} m²</span>
              </div>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Description */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Thông tin chi tiết</h2>
            <div className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line text-sm">
              {room.description}
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Facilities */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Tiện ích đi kèm</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {room.facilities.map((fac, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800"
                >
                  <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
                  <span>{fac}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact/Rental Box */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-400 uppercase">Giá thuê phòng</span>
              <div className="flex items-baseline gap-1 text-red-500">
                <span className="text-3xl font-extrabold">{formatVND(room.price)}</span>
                <span className="text-sm font-normal text-zinc-400">/tháng</span>
              </div>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* Landlord Info */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Thông tin liên hệ</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{room.landlord.name}</div>
                  <div className="text-xs text-zinc-400">Chủ nhà trọ xác thực</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <a href={`tel:${room.landlord.phone}`} className="w-full">
                  <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                    Gọi: {room.landlord.phone}
                  </Button>
                </a>
                <Button variant="outline" className="w-full h-11">
                  Gửi tin nhắn trực tiếp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
