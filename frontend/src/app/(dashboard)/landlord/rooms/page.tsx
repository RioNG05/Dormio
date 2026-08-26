"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, Search, Download, Upload, MoreHorizontal, X, Home, Building2,
  Target, FileSignature, Receipt, ChevronDown, ArrowLeft, Eye,
  User, Banknote, Gauge, Trash2, Edit, AlertTriangle, Zap, Droplets, Trash, ShieldCheck, Sparkles, Wifi, History, Box, Wrench, Wallet, MapPin
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RoomsPage() {
  const { activeBuilding, buildings } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  const [isMounted, setIsMounted] = useState(false);

  // Form states for room create/edit
  const [formBuilding, setFormBuilding] = useState("b1");
  const [formRoomNumber, setFormRoomNumber] = useState("");
  const [formRoomType, setFormRoomType] = useState("studio");
  const [formFloor, setFormFloor] = useState("1");
  const [formArea, setFormArea] = useState("25");
  const [formPrice, setFormPrice] = useState("3.000.000");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      const building = params.get('building');
      if (id) {
        setSelectedRoomId(building ? `${building}-${id}` : `dormio-${id}`);
      }
    }
  }, []);

  const [roomServices, setRoomServices] = useState([
    { id: 'bao_ve', name: 'Bảo vệ', defaultPrice: '50.000', customPrice: '60.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 'dien', name: 'Điện', defaultPrice: '3.500', customPrice: '3.500', unit: 'đ/kWh', isCustom: true, isRemovable: false },
    { id: 'nuoc', name: 'Nước', defaultPrice: '25.000', customPrice: '25.000', unit: 'đ/m³', isCustom: true, isRemovable: false },
    { id: 'rac', name: 'Rác', defaultPrice: '20.000', customPrice: '20.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 've_sinh', name: 'Vệ sinh', defaultPrice: '30.000', customPrice: '30.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 'wifi', name: 'Wifi', defaultPrice: '100.000', customPrice: '100.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
  ]);

  const handleAddService = () => {
    setRoomServices([
      ...roomServices,
      { id: `custom_${Date.now()}`, name: '', defaultPrice: '0', customPrice: '0', unit: 'VNĐ', isCustom: true, isRemovable: true }
    ]);
  };

  const handleRemoveService = (id: string | number) => {
    setRoomServices(roomServices.filter(s => s.id !== id));
  };

  const handleUpdateService = (id: string | number, field: string, value: any) => {
    setRoomServices(roomServices.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");

  const handleCloseModal = () => {
    if (isDirty) {
      setConfirmModal({
        isOpen: true,
        title: 'Cảnh báo chưa lưu',
        message: 'Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng trang này không?',
        onConfirm: () => {
          setIsModalOpen(false);
          setTimeout(() => setIsDirty(false), 200);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      setIsModalOpen(false);
    }
  };

  const generateMockRooms = () => {
    const data: any[] = [];
    const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
    const dem = ["Văn", "Thị", "Hữu", "Minh", "Đức", "Ngọc", "Xuân", "Thu", "Thanh", "Hải", "Thành", "Công", "Quốc", "Khánh", "Gia"];
    const ten = ["An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Khang", "Linh", "Mai", "Nam", "Oanh", "Phong", "Quang", "Sơn", "Tuấn", "Uyên", "Vinh", "Vy", "Yến", "Tâm", "Thảo", "Trang", "Trung", "Tú", "Anh", "Bảo", "Châu", "Diệp", "Hân", "Khoa"];

    const buildRooms = (buildingId: string, floors: number, roomsPerFloor: number) => {
      for (let f = 1; f <= floors; f++) {
        for (let r = 1; r <= roomsPerFloor; r++) {
          const roomStr = `${f}${r.toString().padStart(2, '0')}`;
          const seed = f * 100 + r;
          const isTrang = seed % 5 === 0;
          const isBaoTri = seed % 17 === 0;

          let status = "Đang thuê";
          if (isTrang) status = "Trống";
          else if (isBaoTri) status = "Bảo trì";
          else if (seed % 11 === 0) status = "Đặt cọc";

          const buildingHash = buildingId === 'dormio' ? 1 : 2;
          const hash = parseInt(roomStr) * buildingHash * 137 + 19;

          const isRented = status === 'Đang thuê' || status === 'Đặt cọc';

          data.push({
            id: roomStr,
            floor: f.toString(),
            status: status,
            building: buildingId,
            contract: isRented ? (seed % 7 === 0 ? "expired" : "active") : "none",
            invoice: isRented ? (seed % 8 === 0 ? "debt" : "paid") : "none",
            tenant: isRented ? `${ho[hash % ho.length]} ${dem[(hash * 3) % dem.length]} ${ten[(hash * 7) % ten.length]}` : undefined,
            tenantId: isRented ? `KH${roomStr}-${buildingHash}` : undefined,
            amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng']
          });
        }
      }
    };

    buildRooms('b1', 4, 15);
    buildRooms('b2', 3, 10);
    return data;
  };

  const [rooms, setRooms] = useState(generateMockRooms());

  if (!isMounted) {
    return null;
  }

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchSearch = room.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBuilding = buildingFilter === "" || room.building === buildingFilter;
    const matchStatus = statusFilter === "" || room.status === statusFilter;
    const matchContract = contractFilter === "" || room.contract === contractFilter;
    const matchInvoice = invoiceFilter === "" || room.invoice === invoiceFilter;

    return matchSearch && matchBuilding && matchStatus && matchContract && matchInvoice;
  });

  // Group rooms by floor
  const groupedRooms = filteredRooms.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = [];
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<string, typeof rooms>);

  // Sort floors descending
  const floors = Object.keys(groupedRooms).sort((a, b) => Number(b) - Number(a));

  const selectedRoom = selectedRoomId ? rooms.find(r => `${r.building}-${r.id}` === selectedRoomId) : null;

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter(r => r.status === 'Đang thuê').length;
  const vacantCount = rooms.filter(r => r.status === 'Trống').length;
  const maintenanceCount = rooms.filter(r => r.status === 'Bảo trì').length;
  const reservedCount = rooms.filter(r => r.status === 'Đặt cọc').length;
  const occupancyRate = totalRooms > 0 ? ((occupiedCount / totalRooms) * 100).toFixed(1) : '0.0';

  return (
    <>
      {selectedRoom ? (
        <RoomDetailView
          room={selectedRoom}
          onBack={() => setSelectedRoomId(null)}
          onEdit={() => {
            setFormBuilding(selectedRoom.building || "dormio");
            setFormRoomNumber(selectedRoom.id || "");
            setFormRoomType(selectedRoom.roomType || "studio");
            setFormFloor(selectedRoom.floor || "1");
            setFormArea(selectedRoom.area || "25");
            setFormPrice(selectedRoom.price || "3.000.000");
            setFormNotes(selectedRoom.notes || "");
            setSelectedAmenities(selectedRoom.amenities || ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng']);
            setIsModalOpen(true);
          }}
          roomServices={roomServices}
          onUpdateStatus={(newStatus) => {
            setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, status: newStatus } : r));
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Quản lý phòng</h1>
              <p className="text-sm text-zinc-500">Danh sách phòng theo tòa nhà, loại phòng và trạng thái</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                <Upload className="w-4 h-4" /> Import
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <button
                onClick={() => {
                  setFormBuilding("dormio");
                  setFormRoomNumber("");
                  setFormRoomType("studio");
                  setFormFloor("1");
                  setFormArea("25");
                  setFormPrice("3.000.000");
                  setFormNotes("");
                  setSelectedAmenities(['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng']);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Thêm phòng
              </button>
            </div>
          </div>

          {/* Building Overview Banner */}
          <div className="bg-zinc-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
              <Building2 className="w-64 h-64" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3 max-w-xl">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  {activeBuilding.name}
                  <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 text-[10px] font-black rounded-full uppercase tracking-wider">
                    Đang vận hành
                  </span>
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
                  Quản lý tổng thể cấu trúc phòng, theo dõi tình trạng lưu trú và tài sản.
                </p>
              </div>

              <div className="flex flex-col items-end gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                {/* Building Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10 backdrop-blur-md w-full lg:w-[145px]">
                    <Building2 className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Tổng số tầng</span>
                      <span className="font-black text-white text-lg leading-none mt-1">4</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[145px]">
                    <Home className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng số phòng</span>
                      <span className="font-black text-rose-500 text-lg leading-none mt-1">{totalRooms}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[145px]">
                    <Target className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tỷ lệ lấp đầy</span>
                      <span className="font-black text-rose-500 text-lg leading-none mt-1">{occupancyRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Room Statuses */}
                <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[145px]">
                    <div className="w-2 h-2 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">Đang thuê</span>
                      <span className="font-black text-white text-lg leading-none mt-1">{occupiedCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[145px]">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Trống</span>
                      <span className="font-black text-white text-lg leading-none mt-1">{vacantCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full lg:w-[145px]">
                    <div className="w-2 h-2 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Bảo trì</span>
                      <span className="font-black text-white text-lg leading-none mt-1">{maintenanceCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 transition-colors rounded-xl border border-purple-500/30 backdrop-blur-md w-full lg:w-[145px]">
                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">Đặt cọc</span>
                      <span className="font-black text-white text-lg leading-none mt-1">{reservedCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Filters & Table */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm phòng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                {/* Trạng thái */}
                <div className="relative flex-shrink-0">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-lg appearance-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors font-medium"
                  >
                    <option value="">Trạng thái</option>
                    <option value="Trống">Trống</option>
                    <option value="Đang thuê">Đang thuê</option>
                    <option value="Bảo trì">Bảo trì</option>
                    <option value="Đặt cọc">Đặt cọc</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
                </div>

                {/* Hợp đồng */}
                <div className="relative flex-shrink-0">
                  <FileSignature className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <select
                    value={contractFilter}
                    onChange={(e) => setContractFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-lg appearance-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors font-medium"
                  >
                    <option value="">Hợp đồng</option>
                    <option value="active">Đang hiệu lực</option>
                    <option value="expired">Quá hạn</option>
                    <option value="expiring_soon">Sắp hết hạn (≤30 ngày)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
                </div>

                {/* Hóa đơn */}
                <div className="relative flex-shrink-0">
                  <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <select
                    value={invoiceFilter}
                    onChange={(e) => setInvoiceFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-lg appearance-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors font-medium"
                  >
                    <option value="">Hóa đơn</option>
                    <option value="paid">Đã thu</option>
                    <option value="overdue">Quá hạn</option>
                    <option value="debt">Còn nợ</option>
                    <option value="none">Chưa có</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="p-5 bg-zinc-50/50 flex flex-col gap-4">
              {floors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-xl border border-zinc-200 border-dashed">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-800 mb-1">Không tìm thấy phòng</h3>
                  <p className="text-zinc-500 text-center max-w-sm">
                    Không có phòng nào phù hợp với bộ lọc tìm kiếm của bạn. Vui lòng thử lại với các tiêu chí khác.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setBuildingFilter("");
                      setStatusFilter("");
                      setContractFilter("");
                      setInvoiceFilter("");
                    }}
                    className="mt-6 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : floors.map(floor => (
                <div key={floor} className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                  {/* Floor Label */}
                  <div className="flex-shrink-0 w-full md:w-28 bg-zinc-900 rounded-xl flex items-center justify-center px-4 py-3 text-white">
                    <span className="text-base font-black tracking-wider text-white flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-400">TẦNG</span>
                      <span className="text-xl font-black text-white">{floor}</span>
                    </span>
                  </div>

                  {/* Room Grid / Shelf */}
                  <div className="flex-1 flex flex-nowrap gap-3 items-center overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-zinc-50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300">
                    {(groupedRooms[floor] || []).map((room: any) => {
                      const isOccupied = room.status === 'Đang thuê';
                      const isMaintenance = room.status === 'Bảo trì';
                      const isReserved = room.status === 'Đặt cọc';
                      const isVacant = room.status === 'Trống';

                      return (
                        <div
                          key={`${room.building}-${room.id}`}
                          onClick={() => setSelectedRoomId(`${room.building}-${room.id}`)}
                          className={`flex-shrink-0 relative flex flex-col items-center justify-center p-3 rounded-xl border w-[90px] h-[90px] transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md ${isOccupied ? 'bg-[#2AC1BC]/10 border-[#2AC1BC]/30 hover:border-[#2AC1BC]' :
                            isMaintenance ? 'bg-[#FF6B35]/10 border-[#FF6B35]/30 hover:border-[#FF6B35]' :
                              isReserved ? 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500' :
                                isVacant ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500' :
                                  'bg-white border-zinc-200 hover:border-zinc-300'
                            }`}
                        >
                          {/* Status Dot */}
                          {isOccupied && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#2AC1BC] shadow-[0_0_6px_rgba(42,193,188,0.8)]"></div>}
                          {isMaintenance && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FF6B35] shadow-[0_0_6px_rgba(255,107,53,0.8)]"></div>}
                          {isReserved && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(139,92,246,0.8)]"></div>}
                          {isVacant && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]"></div>}

                          <span className={`text-xl font-bold mt-1 ${isOccupied ? 'text-[#2AC1BC]' :
                            isMaintenance ? 'text-[#FF6B35]' :
                              isReserved ? 'text-purple-600' :
                                isVacant ? 'text-blue-600' :
                                  'text-zinc-700'
                            }`}>{room.id}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 px-2 py-0.5 rounded-full ${isOccupied ? 'text-[#2AC1BC] bg-[#2AC1BC]/15' :
                            isMaintenance ? 'text-[#FF6B35] bg-[#FF6B35]/15' :
                              isReserved ? 'text-purple-600 bg-purple-500/15' :
                                isVacant ? 'text-blue-600 bg-blue-500/15' :
                                  'text-zinc-500 bg-zinc-100'
                            }`}>
                            {room.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onInput={() => setIsDirty(true)} onChange={() => setIsDirty(true)}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 text-accent rounded-xl">
                  {selectedRoomId ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900">{selectedRoomId ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">{selectedRoomId ? 'Cập nhật thông tin chi tiết của phòng và dịch vụ' : 'Điền thông tin chi tiết để tạo phòng trên hệ thống'}</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-zinc-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Cột trái: Thông tin chính */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Card 1: Thông tin cơ bản */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
                      <Home className="w-4 h-4 text-accent" /> Thông tin cơ bản
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Tòa nhà <span className="text-red-500">*</span></label>
                        <select
                          value={formBuilding}
                          onChange={(e) => { setFormBuilding(e.target.value); setIsDirty(true); }}
                          className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white font-medium text-zinc-900"
                        >
                          {(buildings && buildings.length > 0 ? buildings : [
                            { id: "b1", name: "Dormio Premier Quận 1" },
                            { id: "b2", name: "Dormio Campus Cầu Giấy" },
                            { id: "b3", name: "Dormio Luxury Bình Thạnh" }
                          ]).map((b: any) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Số phòng <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formRoomNumber}
                          onChange={(e) => { setFormRoomNumber(e.target.value); setIsDirty(true); }}
                          placeholder="VD: 101, A01"
                          className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-bold text-zinc-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Loại phòng</label>
                        <select
                          value={formRoomType}
                          onChange={(e) => { setFormRoomType(e.target.value); setIsDirty(true); }}
                          className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white font-medium text-zinc-900"
                        >
                          <option value="studio">Studio (Khép kín)</option>
                          <option value="1pn">1 Phòng ngủ (1PN)</option>
                          <option value="2pn">2 Phòng ngủ (2PN)</option>
                          <option value="duplex">Penthouse / Duplex</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Tầng</label>
                        <input
                          type="text"
                          value={formFloor}
                          onChange={(e) => { setFormFloor(e.target.value); setIsDirty(true); }}
                          placeholder="VD: 1, 2..."
                          className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-medium text-zinc-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Diện tích</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formArea}
                            onChange={(e) => { setFormArea(e.target.value); setIsDirty(true); }}
                            placeholder="0"
                            className="w-full pl-3 pr-10 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-medium text-zinc-900"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">m²</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Giá thuê <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formPrice}
                            onChange={(e) => { setFormPrice(e.target.value); setIsDirty(true); }}
                            placeholder="3.000.000"
                            className="w-full pl-3 pr-12 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-bold text-[#2AC1BC]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">VNĐ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Cấu hình dịch vụ */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-accent" /> Cấu hình dịch vụ phòng
                    </h3>
                    <div className="space-y-3">
                      {roomServices.map((service) => (
                        <div key={service.id} className="border border-zinc-200 rounded-lg p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 transition-colors hover:border-primary/30">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            {!service.isRemovable ? (
                              <span className="font-bold text-sm text-zinc-900">{service.name}</span>
                            ) : (
                              <input
                                type="text"
                                value={service.name}
                                onChange={(e) => handleUpdateService(service.id, 'name', e.target.value)}
                                className="w-24 text-sm font-bold text-zinc-900 bg-transparent border-b border-zinc-200 focus:border-primary focus:outline-none transition-colors"
                                placeholder="Tên DV"
                              />
                            )}
                            {!service.isRemovable && (
                              <span className="text-xs text-zinc-500 hidden sm:inline-block">
                                (Tòa nhà: {service.defaultPrice} {service.unit})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-zinc-500">Tùy chỉnh</span>
                              <button
                                onClick={() => handleUpdateService(service.id, 'isCustom', !service.isCustom)}
                                className={`w-10 h-6 rounded-full relative transition-colors flex items-center ${service.isCustom ? 'bg-blue-500' : 'bg-zinc-200'}`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${service.isCustom ? 'translate-x-5' : 'translate-x-1'}`}></div>
                              </button>
                            </div>

                            <div className="relative w-32 flex items-center">
                              <input
                                type="text"
                                value={service.isCustom ? service.customPrice : service.defaultPrice}
                                onChange={(e) => handleUpdateService(service.id, 'customPrice', e.target.value)}
                                disabled={!service.isCustom}
                                className={`w-full pl-3 pr-12 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-medium ${!service.isCustom ? 'bg-zinc-50 text-zinc-500 cursor-not-allowed' : 'text-zinc-900'}`}
                              />
                              {service.isRemovable ? (
                                <input
                                  type="text"
                                  value={service.unit}
                                  onChange={(e) => handleUpdateService(service.id, 'unit', e.target.value)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 text-xs text-zinc-500 font-medium bg-transparent border-none p-0 focus:ring-0 text-right"
                                />
                              ) : (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-medium">VNĐ</span>
                              )}
                            </div>

                            {service.isRemovable && (
                              <button
                                onClick={() => handleRemoveService(service.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                title="Xóa dịch vụ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAddService}
                      className="w-full mt-4 py-2 border-2 border-dashed border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Thêm dịch vụ khác
                    </button>
                  </div>

                  {/* Card 4: Hình ảnh phòng */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent" /> Hình ảnh phòng
                    </h3>
                    <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 hover:border-primary/50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-700 mb-1">Nhấn để tải lên hoặc kéo thả ảnh vào đây</p>
                      <p className="text-xs text-zinc-500">Hỗ trợ JPG, PNG (Tối đa 5MB)</p>
                    </div>
                  </div>

                  {/* Card 4: Thông tin hợp đồng (Nếu đang thuê) */}
                  {selectedRoomId && rooms.find(r => `${r.building}-${r.id}` === selectedRoomId)?.status === 'Đang thuê' && (
                    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-accent" /> Thông tin hợp đồng hiện tại
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                        <div>
                          <div className="text-xs text-zinc-500 mb-1">Khách thuê</div>
                          <div className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                            <User className={`w-3.5 h-3.5 ${rooms.find(r => `${r.building}-${r.id}` === selectedRoomId)?.tenant ? 'text-primary' : 'text-zinc-400'}`} /> {rooms.find(r => `${r.building}-${r.id}` === selectedRoomId)?.tenant || "Chưa có"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 mb-1">Số điện thoại</div>
                          <div className="text-sm font-semibold text-zinc-900">0901234567</div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 mb-1">Thời hạn</div>
                          <div className="text-sm font-semibold text-zinc-900">01/01/2026 - 31/12/2026</div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 mb-1">Tiền cọc</div>
                          <div className="text-sm font-semibold text-zinc-900 text-green-600">3.000.000 đ</div>
                        </div>
                      </div>
                      <button type="button" className="mt-4 w-full py-2.5 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors border border-primary/20 flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" /> Xem chi tiết hợp đồng
                      </button>
                    </div>
                  )}
                </div>

                {/* Cột phải: Tiện nghi & Ghi chú */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Card 3: Tiện nghi */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent" /> Tiện nghi
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">{selectedAmenities.length} đã chọn</span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 pb-1">
                      {['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Bàn học', 'Kệ bếp', 'Ban công', 'WC riêng', 'Máy giặt', 'Tivi', 'Tủ lạnh', 'Gửi xe', 'Thang máy', 'Camera', 'Bảo vệ'].map(item => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setSelectedAmenities(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]);
                            setIsDirty(true);
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${selectedAmenities.includes(item)
                            ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                            : 'text-zinc-600 bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                            }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card 4: Ghi chú */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
                      <FileSignature className="w-4 h-4 text-accent" /> Ghi chú
                    </h3>
                    <textarea
                      rows={4}
                      value={formNotes}
                      onChange={(e) => { setFormNotes(e.target.value); setIsDirty(true); }}
                      placeholder="Ghi chú thêm về tình trạng phòng, đồ đạc..."
                      className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                    ></textarea>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white z-10">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (selectedRoomId) {
                    setRooms(prev => prev.map(r => {
                      if (`${r.building}-${r.id}` === selectedRoomId) {
                        return {
                          ...r,
                          id: formRoomNumber || r.id,
                          building: formBuilding || r.building,
                          floor: formFloor || r.floor,
                          area: formArea || r.area,
                          price: formPrice || r.price,
                          roomType: formRoomType,
                          notes: formNotes,
                          amenities: [...selectedAmenities]
                        };
                      }
                      return r;
                    }));
                  } else {
                    const newId = formRoomNumber || `10${rooms.length + 1}`;
                    const newRoom = {
                      id: newId,
                      floor: formFloor || "1",
                      status: "Trống",
                      building: formBuilding || "dormio",
                      contract: "none",
                      invoice: "none",
                      area: formArea || "25",
                      price: formPrice || "3.000.000",
                      roomType: formRoomType,
                      notes: formNotes,
                      amenities: [...selectedAmenities]
                    };
                    setRooms(prev => [newRoom, ...prev]);
                  }
                  setIsModalOpen(false);
                  setIsDirty(false);
                }}
                className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5"
              >
                Lưu phòng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

function RoomDetailView({ room, onBack, onEdit, roomServices, onUpdateStatus }: { room: any; onBack: () => void; onEdit: () => void; roomServices: any[]; onUpdateStatus: (status: string) => void }) {
  const router = useRouter();
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState('');

  const handleSimulateAiOcr = () => {
    setIsOcrScanning(true);
    setOcrSuccessMsg('');
    setTimeout(() => {
      setFormElec('1428');
      setFormWater('45');
      setIsOcrScanning(false);
      setOcrSuccessMsg('✓ AI đã đọc ảnh công tơ thành công: Điện 1428 kWh, Nước 45 m³');
    }, 600);
  };

  const [selectedMonth, setSelectedMonth] = useState('Tháng 8');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Format: { 'Tháng 7-2026': { month, year, date, oldElec, newElec, ... } }
  const [meterRecordsMap, setMeterRecordsMap] = useState<Record<string, any>>({});

  const currentRecordKey = `${selectedMonth}-${selectedYear}`;
  const currentRecord = meterRecordsMap[currentRecordKey];

  const [formElec, setFormElec] = useState<string>('');
  const [formWater, setFormWater] = useState<string>('');

  useEffect(() => {
    setFormElec(currentRecord?.newElec || '');
    setFormWater(currentRecord?.newWater || '');
  }, [selectedMonth, selectedYear, isMeterModalOpen]); // include isMeterModalOpen to refresh when reopened

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  const getOldIndices = () => {
    if (selectedMonth === 'Tháng 8' && selectedYear === '2026') {
      const prev = meterRecordsMap['Tháng 7-2026'];
      if (prev) return { elec: prev.newElec, water: prev.newWater };
    }
    return { elec: '123', water: '12' }; // Mock default
  };

  const oldIndices = getOldIndices();
  const oldElec = oldIndices.elec;
  const oldWater = oldIndices.water;

  const elecPrice = 3500;
  const elecConsumption = formElec ? Math.max(0, parseInt(formElec) - parseInt(oldElec)) : 0;
  const elecTotal = elecConsumption * elecPrice;

  const waterPrice = 25000;
  const waterConsumption = formWater ? Math.max(0, parseInt(formWater) - parseInt(oldWater)) : 0;
  const waterTotal = waterConsumption * waterPrice;

  const grandTotal = elecTotal + waterTotal;

  const handleSaveMeter = () => {
    if (!formElec && !formWater) {
      setIsMeterModalOpen(false);
      return;
    }

    const record = {
      month: selectedMonth,
      year: selectedYear,
      date: new Date().toLocaleDateString('vi-VN'),
      oldElec,
      newElec: formElec,
      elecConsumption,
      oldWater,
      newWater: formWater,
      waterConsumption,
      total: grandTotal
    };

    setMeterRecordsMap({ ...meterRecordsMap, [currentRecordKey]: record });
    setIsMeterModalOpen(false);
  };

  const isOccupied = room.status === 'Đang thuê';
  const isMaintenance = room.status === 'Bảo trì';
  const isReserved = room.status === 'Đặt cọc';
  const isVacant = room.status === 'Trống';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">Phòng {room.id}</h1>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${isOccupied ? 'text-[#2AC1BC] bg-[#2AC1BC]/10 border-[#2AC1BC]/30' :
              isMaintenance ? 'text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30' :
                isReserved ? 'text-purple-600 bg-purple-500/10 border-purple-500/30' :
                  isVacant ? 'text-blue-600 bg-blue-500/10 border-blue-500/30' :
                    'text-zinc-500 bg-zinc-100 border-zinc-200'
              }`}>
              {room.status}
            </span>
            <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200/80">
              🏢 {room.building === 'b2' ? 'Dormio Campus Cầu Giấy' : room.building === 'b3' ? 'Dormio Luxury Bình Thạnh' : 'Dormio Premier Quận 1'}
            </span>
          </div>
        </div>

        {/* Action Toolbar with Clear Visual Hierarchy */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
          {isOccupied && (
            <button
              onClick={() => setIsMeterModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Gauge className="w-4 h-4" /> Ghi Chỉ Số Điện Nước
            </button>
          )}

          <button
            onClick={() => setIsContractModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            {isOccupied ? <><Eye className="w-4 h-4 text-purple-600" /> Xem Hợp Đồng</> : <><FileSignature className="w-4 h-4 text-[#2AC1BC]" /> Tạo Hợp Đồng</>}
          </button>

          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Edit className="w-4 h-4 text-zinc-500" /> Chỉnh Sửa
          </button>

          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Xóa phòng',
                message: `Bạn có chắc chắn muốn xóa phòng ${room.id} này không? Các dữ liệu liên quan sẽ bị xóa!`,
                onConfirm: () => {
                  onBack();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
              });
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4 text-rose-600" /> Xóa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Main Column */}
        <div className="xl:col-span-2 space-y-6">

          {/* SPOTLIGHT TENANT PROFILE CARD */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
              <span className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#2AC1BC]" /> Khách Thuê Hiện Tại
              </span>
              {room.tenant && (
                <button className="text-xs font-bold text-[#2AC1BC] hover:underline flex items-center gap-1 cursor-pointer">
                  <Edit className="w-3.5 h-3.5" /> Sửa thông tin
                </button>
              )}
            </div>

            <div className="p-5">
              {room.tenant ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#2AC1BC]/5 rounded-2xl border border-[#2AC1BC]/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#2AC1BC] text-white font-black text-lg flex items-center justify-center shadow-md">
                      {room.tenant.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-zinc-900">{room.tenant}</h3>
                      <p className="text-xs font-bold text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span>📱 0901.234.567</span>
                        <span>•</span>
                        <span>Dọn vào: 01/01/2026</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href="tel:0901234567"
                      className="px-3 py-1.5 bg-white text-zinc-800 border border-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-50 transition-colors shadow-2xs"
                    >
                      📞 Gọi điện
                    </a>
                    <a
                      href="https://zalo.me"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs"
                    >
                      💬 Zalo
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 space-y-2">
                  <p className="text-xs text-zinc-500 font-bold">Phòng hiện tại đang trống, chưa có người ở.</p>
                  <button
                    onClick={() => setIsContractModalOpen(true)}
                    className="px-4 py-2 bg-[#2AC1BC] text-white text-xs font-black rounded-xl hover:bg-[#25ad87] transition-all cursor-pointer shadow-xs"
                  >
                    + Lập Hợp Đồng Nhận Khách Mới
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hóa đơn & công nợ với Data Test Có Hóa Đơn Chưa Thu / Quá Hạn */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#2AC1BC]" /> Hóa Đơn & Công Nợ Gần Nhất
              </h2>
              <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-black animate-pulse">
                🔴 Còn 1 Hóa Đơn Chưa Thu (3.520.000 ₫)
              </span>
            </div>

            <div className="space-y-3">
              {/* Overdue Unpaid Invoice Example */}
              <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-500 text-white rounded-xl font-black text-xs shadow-xs">
                      09/26
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-900">INV-202609-401</span>
                        <span className="text-[10px] font-bold text-rose-600">(Tháng 09/2026)</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Hạn thanh toán: <strong className="text-rose-600">10/09/2026 (Quá hạn 5 ngày)</strong></p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                    <span className="text-base font-black text-rose-600">3.520.000 ₫</span>
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full">
                      🔴 Chưa thanh toán
                    </span>
                  </div>
                </div>

                {/* Quick Remind Actions for Overdue Invoice */}
                <div className="flex items-center gap-2 pt-2 border-t border-rose-200/50">
                  <button className="flex-1 py-1.5 bg-[#2AC1BC] text-white text-xs font-black rounded-xl hover:bg-[#25ad87] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5">
                    ⚡ Gửi Mã VietQR Nhắc Nợ Tự Động
                  </button>
                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    💬 Zalo Nhắc Nợ
                  </a>
                </div>
              </div>

              {/* Paid Invoices */}
              {[
                { id: "INV-202608-401", period: "Tháng 08/2026", amount: "3.460.000 ₫", deadline: "10/08/2026", method: "VietQR Auto-Gạch Nợ", status: "Đã thu" },
                { id: "INV-202607-401", period: "Tháng 07/2026", amount: "3.478.000 ₫", deadline: "10/07/2026", method: "VietQR Auto-Gạch Nợ", status: "Đã thu" },
              ].map((inv, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100/80 transition-colors rounded-xl border border-zinc-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-lg font-black text-xs">
                      {inv.period.split(" ")[1]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-900">{inv.id}</span>
                        <span className="text-[9px] font-bold text-zinc-400">({inv.period})</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Phương thức: <strong className="text-zinc-700">{inv.method}</strong></p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                    <span className="text-sm font-black text-[#2AC1BC]">{inv.amount}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-extrabold rounded-full">
                      ✓ {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lịch sử ghi chỉ số & Nút Tạo Hóa Đơn AI OCR */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div>
                <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-[#2AC1BC]" /> Lịch Sử Chốt Điện Nước & AI OCR
                </h2>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Chủ trọ tự điền số hoặc tải ảnh công tơ để AI tự quét số điện/nước.</p>
              </div>

              <button
                onClick={() => setIsMeterModalOpen(true)}
                className="px-3.5 py-2 bg-[#2AC1BC] text-white text-xs font-black rounded-xl hover:bg-[#25ad87] transition-all cursor-pointer shadow-md shadow-[#2AC1BC]/20 flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Gauge className="w-4 h-4" /> 📸 Chốt Số / Quét AI OCR
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  period: "Tháng 08/2026",
                  date: "01/08/2026 08:30",
                  oldElec: 1318,
                  newElec: 1428,
                  elecUse: 110,
                  elecCost: "385.000 ₫",
                  oldWater: 42,
                  newWater: 45,
                  waterUse: 3,
                  waterCost: "75.000 ₫",
                  total: "460.000 ₫",
                  isOpen: true
                },
                {
                  period: "Tháng 07/2026",
                  date: "01/07/2026 09:15",
                  oldElec: 1210,
                  newElec: 1318,
                  elecUse: 108,
                  elecCost: "378.000 ₫",
                  oldWater: 38,
                  newWater: 42,
                  waterUse: 4,
                  waterCost: "100.000 ₫",
                  total: "478.000 ₫",
                  isOpen: false
                },
              ].map((item, idx) => (
                <details key={idx} className="group border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs" open={item.isOpen}>
                  <summary className="flex justify-between items-center p-3.5 bg-zinc-50/80 hover:bg-zinc-100/80 cursor-pointer select-none outline-none transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-[#2AC1BC] uppercase tracking-wider">
                        CHỈ SỐ {item.period}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400">({item.date})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-zinc-900">Tổng: {item.total}</span>
                      <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" />
                    </div>
                  </summary>

                  <div className="p-4 bg-white border-t border-zinc-100 space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b border-zinc-100">
                            <th className="py-2 px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Danh mục</th>
                            <th className="py-2 px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider text-right">Đơn giá</th>
                            <th className="py-2 px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider text-right">Tiêu thụ</th>
                            <th className="py-2 px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          <tr>
                            <td className="py-2.5 px-3">
                              <div className="font-black text-xs text-zinc-900 flex items-center gap-1">⚡ ĐIỆN</div>
                              <div className="text-[10px] text-zinc-500 font-medium">Cũ: {item.oldElec} kWh ➔ Mới: {item.newElec} kWh</div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs font-semibold text-zinc-600">3.500 ₫/kWh</td>
                            <td className="py-2.5 px-3 text-right text-xs font-black text-zinc-900">{item.elecUse} kWh</td>
                            <td className="py-2.5 px-3 text-right text-xs font-black text-[#2AC1BC]">{item.elecCost}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3">
                              <div className="font-black text-xs text-zinc-900 flex items-center gap-1">💧 NƯỚC</div>
                              <div className="text-[10px] text-zinc-500 font-medium">Cũ: {item.oldWater} m³ ➔ Mới: {item.newWater} m³</div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs font-semibold text-zinc-600">25.000 ₫/m³</td>
                            <td className="py-2.5 px-3 text-right text-xs font-black text-zinc-900">{item.waterUse} m³</td>
                            <td className="py-2.5 px-3 text-right text-xs font-black text-[#2AC1BC]">{item.waterCost}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* NÂNG CẤP UI/UX BẢO TRÌ & TIỀN ĐẶT CỌC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. Nâng Cấp Bảo Trì */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#FF6B35]" /> Bảo Trì (2)
                </h2>
                <button
                  onClick={() => setIsIncidentModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-black text-[#FF6B35] bg-[#FF6B35]/10 rounded-xl hover:bg-[#FF6B35]/20 transition-all cursor-pointer shadow-2xs"
                >
                  + Báo Sự Cố
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-900">Hỏng máy lạnh (Chảy nước)</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded-full">
                      🟡 Đang xử lý
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>Báo ngày: 25/08/2026</span>
                    <span className="text-rose-600">🔴 Mức độ cao</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700">Thay bóng đèn nhà vệ sinh</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-extrabold rounded-full">
                      ✓ Đã xong
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                    <span>Hoàn thành ngày: 12/07/2026</span>
                    <span>🟢 Mức độ nhẹ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Nâng Cấp Quản Lý Tiền Đặt Cọc */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-600" /> Quản Lý Tiền Đặt Cọc
                </h2>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[9px] font-black">
                  🔒 Dormio Escrow
                </span>
              </div>

              <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-600">Tiền cọc giữ:</span>
                  <span className="text-base font-black text-purple-600">3.000.000 ₫</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-semibold border-t border-purple-200/40 pt-2">
                  <span>Ngày cọc: 01/01/2026</span>
                  <span>Hợp đồng: Hạn 01/01/2027</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button className="py-1.5 px-2 bg-purple-600 text-white text-[11px] font-black rounded-xl hover:bg-purple-700 transition-all shadow-2xs cursor-pointer">
                    💸 Hoàn Cọc Khách
                  </button>
                  <button className="py-1.5 px-2 bg-white text-rose-600 border border-rose-200 text-[11px] font-black rounded-xl hover:bg-rose-50 transition-all cursor-pointer">
                    ⚖️ Trừ Tiền Cọc
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">

          {/* COMPACT SIDEBAR 4 ROOM METRIC CARDS */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-4 space-y-3">
            <h2 className="font-black text-zinc-900 text-xs uppercase tracking-wider border-b border-zinc-100 pb-2">
              📊 Thông Số Phòng {room.id}
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">GIÁ THUÊ</span>
                <div className="text-sm font-black text-[#2AC1BC]">{room.price ? (room.price.includes('₫') || room.price.includes('đ') ? room.price : `${room.price} ₫`) : '3.000.000 ₫'}</div>
                <span className="text-[9px] text-zinc-500">Đầu tháng</span>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">TIỀN CỌC</span>
                <div className="text-sm font-black text-purple-600">3.000.000 ₫</div>
                <span className="text-[9px] text-emerald-600 font-bold">✓ Khóa cọc</span>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">CÔNG NỢ</span>
                <div className="text-sm font-black text-emerald-600">0 ₫</div>
                <span className="text-[9px] text-zinc-500">Không nợ</span>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">CẤU TRÚC</span>
                <div className="text-xs font-black text-zinc-900">{room.area || '25'} m² • T{room.floor}</div>
                <span className="text-[9px] text-zinc-500">Ban công</span>
              </div>
            </div>
          </div>

          {/* Giá dịch vụ với Badge màu sắc */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
            <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Banknote className="w-4 h-4 text-[#2AC1BC]" /> Giá Dịch Vụ
            </h2>
            <div className="space-y-2.5">
              {roomServices.map((service, index) => (
                <div key={service.id} className="flex justify-between items-center p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-zinc-800">{service.name}</span>
                    {service.isCustom && (
                      <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold">Tùy chỉnh</span>
                    )}
                  </div>
                  <span className="text-xs font-black text-[#2AC1BC]">
                    {service.isCustom ? service.customPrice : service.defaultPrice} {service.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tiện nghi phòng (Đồng bộ với Modal Chỉnh Sửa, Không dùng Icon) */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
            {(() => {
              const amenitiesList = room.amenities || ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng'];
              return (
                <>
                  <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Sparkles className="w-4 h-4 text-[#2AC1BC]" /> Tiện Nghi ({amenitiesList.length})
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {amenitiesList.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-extrabold text-zinc-800 shadow-2xs hover:bg-zinc-100 transition-colors"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Quản lý trạng thái phòng chuẩn 4 mã màu */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
            <h2 className="font-black text-zinc-900 text-sm border-b border-zinc-100 pb-3">Quản Lý Trạng Thái Phòng</h2>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider block">Cập nhật nhanh</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateStatus('Trống')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isVacant ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                >
                  🔵 Trống
                </button>

                <button
                  onClick={() => onUpdateStatus('Đang thuê')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isOccupied ? 'bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                >
                  🟢 Đang Thuê
                </button>

                <button
                  onClick={() => onUpdateStatus('Bảo trì')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isMaintenance ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                >
                  🟠 Bảo Trì
                </button>

                <button
                  onClick={() => onUpdateStatus('Đặt cọc')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isReserved ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                >
                  🟣 Đặt Cọc
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
              <span className="text-xs font-bold text-zinc-700">Đang ẩn khỏi danh sách sales</span>
              <div className="w-10 h-5 bg-zinc-200 rounded-full relative cursor-pointer hover:bg-zinc-300 transition-colors">
                <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-xs"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meter Recording Modal with AI OCR Upload Feature */}
      {isMeterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsMeterModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-black text-zinc-900">Ghi Chỉ Số & AI OCR — Phòng {room.id}</h2>
                <p className="text-xs text-zinc-500 font-medium">Nhập tay hoặc tải ảnh công tơ điện/nước để AI tự quét số.</p>
              </div>
              <button onClick={() => setIsMeterModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4">

              {/* AI OCR PHOTO UPLOAD WIDGET */}
              <div className="p-4 bg-[#2AC1BC]/5 rounded-2xl border border-dashed border-[#2AC1BC]/30 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-bold">
                  📸
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-900">Tải Ảnh Công Tơ Cho AI Tự Quét Số</h4>
                  <p className="text-[10px] text-zinc-500 font-medium">Chủ trọ không cần điền tay, chọn hoặc chụp ảnh công tơ điện/nước để AI điền số tự động.</p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateAiOcr}
                  disabled={isOcrScanning}
                  className="px-4 py-2 bg-[#2AC1BC] text-white text-xs font-black rounded-xl hover:bg-[#25ad87] transition-all cursor-pointer shadow-sm shadow-[#2AC1BC]/20 inline-flex items-center gap-1.5"
                >
                  {isOcrScanning ? "✨ AI Đang Phân Tích & Quét Ảnh..." : "✨ Tải Ảnh Lên & Quét AI OCR Tự Động"}
                </button>

                {ocrSuccessMsg && (
                  <p className="text-xs font-bold text-emerald-600 animate-in fade-in duration-300">
                    {ocrSuccessMsg}
                  </p>
                )}
              </div>

              {/* Month/Year Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Tháng</label>
                  <div className="relative">
                    <select value={selectedMonth} onChange={handleMonthChange} className="w-full appearance-none bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors">
                      <option>Tháng 7</option>
                      <option>Tháng 8</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Năm</label>
                  <div className="relative">
                    <select value={selectedYear} onChange={handleYearChange} className="w-full appearance-none bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                      <option>2026</option>
                      <option>2025</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Electricity */}
              <div className="border border-zinc-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" fill="currentColor" /> Điện
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    3.500 đ/kWh •
                    {formElec ? <span className="text-green-600 font-medium">đã ghi</span> : <span className="text-orange-500 font-medium">chưa ghi</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Chỉ số cũ</label>
                    <input type="number" readOnly value={oldElec} className="w-full px-3 py-2 text-sm border border-zinc-200 bg-zinc-50 text-zinc-500 cursor-not-allowed rounded-lg focus:outline-none" title="Chỉ số cũ được lấy tự động từ tháng trước" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Chỉ số mới (Hoặc AI tự fill)</label>
                    <input type="number" value={formElec} onChange={(e) => setFormElec(e.target.value)} placeholder="Nhập chỉ số" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-[#2AC1BC]" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <div className="text-sm text-zinc-500">Tiêu thụ: <span className="font-bold text-primary">{formElec ? elecConsumption : 0} kWh</span></div>
                  <div className="text-sm font-medium text-zinc-900">Thành tiền: <span className="font-bold">{elecTotal.toLocaleString()} đ</span></div>
                </div>
              </div>

              {/* Water */}
              <div className="border border-zinc-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
                    <Droplets className="w-4 h-4 text-blue-500" fill="currentColor" /> Nước
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    25.000 đ/m³ •
                    {formWater ? <span className="text-green-600 font-medium">đã ghi</span> : <span className="text-orange-500 font-medium">chưa ghi</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Chỉ số cũ</label>
                    <input type="number" readOnly value={oldWater} className="w-full px-3 py-2 text-sm border border-zinc-200 bg-zinc-50 text-zinc-500 cursor-not-allowed rounded-lg focus:outline-none" title="Chỉ số cũ được lấy tự động từ tháng trước" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Chỉ số mới (Hoặc AI tự fill)</label>
                    <input type="number" value={formWater} onChange={(e) => setFormWater(e.target.value)} placeholder="Nhập chỉ số" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-[#2AC1BC]" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <div className="text-sm text-zinc-500">Tiêu thụ: <span className="font-bold text-primary">{formWater ? waterConsumption : 0} m³</span></div>
                  <div className="text-sm font-medium text-zinc-900">Thành tiền: <span className="font-bold">{waterTotal.toLocaleString()} đ</span></div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 px-1">
                <span className="font-bold text-zinc-900 text-base">Tổng cộng</span>
                <span className="font-black text-zinc-900 text-lg">{grandTotal.toLocaleString()} đ</span>
              </div>
            </div>

            <div className="p-5 border-t border-zinc-100 flex justify-end gap-3">
              <button onClick={() => setIsMeterModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                Huỷ
              </button>
              <button onClick={handleSaveMeter} className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-md shadow-accent/20 transition-all hover:-translate-y-0.5">
                Lưu chỉ số
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INCIDENT REPORT MODAL (MODAL BÁO SỰ CỐ BẢO TRÌ) */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsIncidentModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#FF6B35]" /> Báo Sự Cố Bảo Trì — Phòng {room.id}
              </h2>
              <button onClick={() => setIsIncidentModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setIsIncidentModalOpen(false); alert('Đã tạo báo cáo sự cố bảo trì thành công!'); }} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Tên sự cố / Tiêu đề *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hỏng máy lạnh, chảy nước..."
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Mức độ ưu tiên</label>
                <select className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20">
                  <option value="high">🔴 Mức độ cao (Cần gấp)</option>
                  <option value="medium">🟡 Mức độ trung bình</option>
                  <option value="low">🟢 Mức độ nhẹ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Mô tả chi tiết sự cố</label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả tình trạng hư hỏng..."
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                ></textarea>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-[#FF6B35] rounded-xl hover:bg-[#e05a2b] transition-all shadow-md shadow-[#FF6B35]/20 cursor-pointer"
                >
                  Gửi Yêu Cầu Bảo Trì
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsContractModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-white z-10">
              <h2 className="text-xl font-bold text-zinc-900">{isOccupied ? 'Chi tiết hợp đồng' : 'Tạo hợp đồng mới'} — Phòng {room.id}</h2>
              <button onClick={() => setIsContractModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              {/* Tenant Info */}
              <div>
                <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> 1. Thông tin khách thuê
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Họ và tên</label>
                    <input type="text" placeholder="Vd: Nguyễn Văn A" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Số điện thoại</label>
                    <input type="tel" placeholder="090..." className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">CCCD / CMND</label>
                    <input type="text" placeholder="Số căn cước công dân" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
              </div>

              {/* Contract Info */}
              <div>
                <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-primary" /> 2. Chi tiết hợp đồng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Tiền thuê hàng tháng</label>
                    <div className="relative">
                      <input type="number" defaultValue="3000000" className="w-full pl-3 pr-10 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">VNĐ</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Tiền cọc</label>
                    <div className="relative">
                      <input type="number" defaultValue="3000000" className="w-full pl-3 pr-10 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">VNĐ</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Ngày bắt đầu</label>
                    <input type="date" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Ngày kết thúc</label>
                    <input type="date" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button onClick={() => setIsContractModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                Đóng
              </button>
              <button onClick={() => setIsContractModalOpen(false)} className="px-8 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-md shadow-accent/20 transition-all hover:-translate-y-0.5">
                {isOccupied ? 'Cập nhật' : 'Tạo hợp đồng'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-500 shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
          <p className="text-sm text-zinc-500">{message}</p>
        </div>
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">Hủy</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-bold text-white bg-danger rounded-lg hover:bg-danger-hover shadow-md shadow-orange-600/20 transition-colors">Đồng ý</button>
        </div>
      </div>
    </div>
  );
}