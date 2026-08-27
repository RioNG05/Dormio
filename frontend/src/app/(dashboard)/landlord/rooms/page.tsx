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
      const rawId = params.get('id');
      const building = params.get('building');
      if (rawId) {
        const seq = (building === 'b2' || building === 'vinahouse') ? 2 : 1;
        const roomId = rawId.length === 3 ? `${seq}${rawId}` : rawId;
        router.push(`/landlord/rooms/${encodeURIComponent(roomId)}`);
      }
    }
  }, [router]);

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

    const buildRooms = (buildingId: string, buildingSeq: number, floors: number, roomsPerFloor: number) => {
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

          const hash = parseInt(roomStr) * buildingSeq * 137 + 19;
          const isRented = status === 'Đang thuê' || status === 'Đặt cọc';
          const fullRoomId = `${buildingSeq}${roomStr}`;

          data.push({
            id: roomStr,
            fullRoomId: fullRoomId,
            floor: f.toString(),
            status: status,
            building: buildingId,
            buildingSeq: buildingSeq,
            contract: isRented ? (seed % 7 === 0 ? "expired" : "active") : "none",
            invoice: isRented ? (seed % 8 === 0 ? "debt" : "paid") : "none",
            tenant: isRented ? `${ho[hash % ho.length]} ${dem[(hash * 3) % dem.length]} ${ten[(hash * 7) % ten.length]}` : undefined,
            tenantId: isRented ? `KH${roomStr}-${buildingSeq}` : undefined,
            amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng']
          });
        }
      }
    };

    buildRooms('b1', 1, 4, 15);
    buildRooms('b2', 2, 3, 10);
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

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter(r => r.status === 'Đang thuê').length;
  const vacantCount = rooms.filter(r => r.status === 'Trống').length;
  const maintenanceCount = rooms.filter(r => r.status === 'Bảo trì').length;
  const reservedCount = rooms.filter(r => r.status === 'Đặt cọc').length;
  const occupancyRate = totalRooms > 0 ? ((occupiedCount / totalRooms) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý phòng</h1>
          <p className="text-sm text-zinc-500">Danh sách phòng theo tòa nhà, loại phòng và trạng thái</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => {
              setFormBuilding("b1");
              setFormRoomNumber("");
              setFormRoomType("studio");
              setFormFloor("1");
              setFormArea("25");
              setFormPrice("3.000.000");
              setFormNotes("");
              setSelectedAmenities(['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng']);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm phòng
          </button>
        </div>
      </div>

      {/* Building Overview Banner */}
      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Building2 className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
          <div className="space-y-3 max-w-xl w-full">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                {activeBuilding.name}
              </h2>
              <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
                Đang vận hành
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all w-full sm:w-auto">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                <span className="text-xs font-bold text-zinc-200 truncate sm:whitespace-normal">{activeBuilding.address}</span>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                target="_blank"
                rel="noreferrer"
                className="self-end sm:self-auto px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <span>Xem Bản Đồ</span> &rarr;
              </a>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Quản lý tổng thể cấu trúc phòng, theo dõi tình trạng lưu trú và tài sản.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 w-full lg:w-auto mt-4 lg:mt-0">
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
              <div className="flex-shrink-0 w-full md:w-28 bg-zinc-900 rounded-xl flex items-center justify-center px-4 py-3 text-white">
                <span className="text-base font-black tracking-wider text-white flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400">TẦNG</span>
                  <span className="text-xl font-black text-white">{floor}</span>
                </span>
              </div>

              <div className="flex-1 flex flex-nowrap gap-3 items-center overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-zinc-50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300">
                {(groupedRooms[floor] || []).map((room: any) => {
                  const isOccupied = room.status === 'Đang thuê';
                  const isMaintenance = room.status === 'Bảo trì';
                  const isReserved = room.status === 'Đặt cọc';
                  const isVacant = room.status === 'Trống';

                  return (
                    <div
                      key={`${room.building}-${room.id}`}
                      onClick={() => router.push(`/landlord/rooms/${room.fullRoomId}`)}
                      className={`flex-shrink-0 relative flex flex-col items-center justify-center p-3 rounded-xl border w-[90px] h-[90px] transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md ${isOccupied ? 'bg-[#2AC1BC]/10 border-[#2AC1BC]/30 hover:border-[#2AC1BC]' :
                        isMaintenance ? 'bg-[#FF6B35]/10 border-[#FF6B35]/30 hover:border-[#FF6B35]' :
                          isReserved ? 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500' :
                            isVacant ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500' :
                              'bg-white border-zinc-200 hover:border-zinc-300'
                        }`}
                    >
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Room Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onInput={() => setIsDirty(true)} onChange={() => setIsDirty(true)}>
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

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-zinc-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
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
                </div>

                <div className="lg:col-span-2 space-y-6">
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
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-colors">Đồng ý</button>
        </div>
      </div>
    </div>
  );
}