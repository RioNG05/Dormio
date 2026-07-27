"use client";

import React, { useState } from "react";
import { Building2, MapPin, Plus, Search, Filter, Home, Layers, Users, MoreHorizontal, Edit, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";

interface BoardingHouseItem {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  totalFloors: number;
  totalRooms: number;
  rentedRooms: number;
  description: string;
}

export default function BoardingHousesPage() {
  const [houses, setHouses] = useState<BoardingHouseItem[]>([
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "Dormio House Quận 1 (Bến Nghé)",
      address: "123 Nguyễn Huệ, Phường Bến Nghé",
      city: "TP. Hồ Chí Minh",
      district: "Quận 1",
      totalFloors: 5,
      totalRooms: 15,
      rentedRooms: 12,
      description: "Tòa nhà căn hộ dịch vụ studio cao cấp full nội thất ngay trung tâm Quận 1.",
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "Dormio Student House Cầu Giấy",
      address: "45 Chùa Láng, Phường Láng Thượng",
      city: "Hà Nội",
      district: "Đống Đa",
      totalFloors: 4,
      totalRooms: 12,
      rentedRooms: 10,
      description: "Chung cư mini sinh viên giá rẻ gần Ngoại Thương, Ngoại Giao, Giao Thông Vận Tải.",
    },
    {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Dormio Premium Bình Thạnh",
      address: "78 Điện Biên Phủ, Phường 25",
      city: "TP. Hồ Chí Minh",
      district: "Bình Thạnh",
      totalFloors: 6,
      totalRooms: 18,
      rentedRooms: 15,
      description: "Căn hộ mini cao cấp view Landmark 81, thang máy mã từ, camera an ninh 24/7.",
    },
    {
      id: "house000-0004-4000-8000-house0000004",
      name: "Dormio Luxury Thủ Đức",
      address: "15 Võ Văn Ngân, Phường Linh Chiểu",
      city: "TP. Hồ Chí Minh",
      district: "TP. Thủ Đức",
      totalFloors: 5,
      totalRooms: 14,
      rentedRooms: 11,
      description: "Chung cư mini hiện đại gần trường ĐH Sư Phạm Kỹ Thuật.",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("TP. Hồ Chí Minh");
  const [district, setDistrict] = useState("Quận 1");
  const [totalFloors, setTotalFloors] = useState("5");

  const filteredHouses = houses.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddHouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;
    const newHouse: BoardingHouseItem = {
      id: `house-${Date.now()}`,
      name,
      address,
      city,
      district,
      totalFloors: Number(totalFloors) || 5,
      totalRooms: 10,
      rentedRooms: 0,
      description: "Tòa nhà mới thêm vào hệ thống.",
    };
    setHouses([newHouse, ...houses]);
    setModalOpen(false);
    setName("");
    setAddress("");
  };

  const totalBuildings = houses.length;
  const totalRoomsCount = houses.reduce((acc, h) => acc + h.totalRooms, 0);
  const totalRentedCount = houses.reduce((acc, h) => acc + h.rentedRooms, 0);
  const occupancyRate = totalRoomsCount > 0 ? Math.round((totalRentedCount / totalRoomsCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Tòa nhà & Nhà trọ</h1>
          <p className="text-sm text-zinc-500">Danh sách các cơ sở nhà trọ, chung cư mini đang quản lý</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm tòa nhà mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <div className="text-xs text-zinc-500 font-semibold uppercase">Tổng tòa nhà</div>
          <div className="text-2xl font-extrabold text-zinc-900 mt-1">{totalBuildings}</div>
        </div>
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <div className="text-xs text-zinc-500 font-semibold uppercase">Tổng số phòng</div>
          <div className="text-2xl font-extrabold text-primary mt-1">{totalRoomsCount}</div>
        </div>
        <div className="p-5 bg-white border border-emerald-200 bg-emerald-50/30 rounded-2xl shadow-xs">
          <div className="text-xs text-emerald-800 font-semibold uppercase">Đã thuê</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{totalRentedCount} phòng</div>
        </div>
        <div className="p-5 bg-white border border-amber-200 bg-amber-50/30 rounded-2xl shadow-xs">
          <div className="text-xs text-amber-800 font-semibold uppercase">Tỷ lệ lấp đầy</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{occupancyRate}%</div>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-zinc-100 pb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm tên tòa nhà, địa chỉ, quận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <span className="text-xs font-semibold text-zinc-500">Hiển thị {filteredHouses.length} tòa nhà</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHouses.map((house) => {
            const occ = Math.round((house.rentedRooms / house.totalRooms) * 100);
            return (
              <div key={house.id} className="border border-zinc-200 rounded-2xl p-5 hover:border-primary/50 hover:shadow-md transition-all bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-extrabold text-zinc-900 text-base line-clamp-1">{house.name}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-primary/10 text-primary shrink-0">
                      {house.totalFloors} Tầng
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {house.address}, {house.city}
                  </p>

                  <p className="text-xs text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
                    {house.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">Sức chứa phòng:</span>
                    <span className="font-extrabold text-zinc-900">{house.rentedRooms}/{house.totalRooms} phòng</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${occ}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-[11px] font-semibold text-zinc-400">
                    <span>Tỷ lệ lấp đầy: <strong className="text-emerald-600">{occ}%</strong></span>
                    <button className="text-primary font-bold hover:underline">Chi tiết phòng →</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Thêm Tòa Nhà */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-100 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-1.5 rounded-full hover:bg-zinc-100">✕</button>

            <h3 className="text-lg font-bold text-zinc-900 mb-1">Thêm tòa nhà mới</h3>
            <p className="text-xs text-zinc-500 mb-4">Khai báo thông tin cơ sở nhà trọ để tạo quản lý sơ đồ phòng</p>

            <form onSubmit={handleAddHouse} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Tên tòa nhà / Cơ sở</label>
                <input
                  type="text"
                  placeholder="VD: Dormio House Quận 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 border border-zinc-200 rounded-xl px-3 outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-10 border border-zinc-200 rounded-xl px-3 outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Tỉnh / Thành phố</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-10 border border-zinc-200 rounded-xl px-3 outline-none">
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Số tầng</label>
                  <input
                    type="number"
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(e.target.value)}
                    className="w-full h-10 border border-zinc-200 rounded-xl px-3 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 font-bold text-zinc-600 bg-zinc-100 rounded-xl">Hủy</button>
                <button type="submit" className="px-6 py-2 font-bold text-white bg-primary rounded-xl shadow-md">Thêm tòa nhà</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}