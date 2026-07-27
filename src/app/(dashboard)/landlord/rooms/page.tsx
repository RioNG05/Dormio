"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Download, Upload, MoreHorizontal, X, Home, Building2, 
  Target, FileSignature, Receipt, ChevronDown, ArrowLeft, Eye,
  User, Banknote, Gauge, Trash2, Edit, AlertTriangle, Zap, Droplets, Trash, ShieldCheck, Sparkles, Wifi, History, Box, Wrench, Wallet
} from "lucide-react";

import { useRouter } from "next/navigation";

export default function RoomsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [isMounted, setIsMounted] = useState(false);

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
            tenantId: isRented ? `KH${roomStr}-${buildingHash}` : undefined
          });
        }
      }
    };

    buildRooms('dormio', 4, 15);
    buildRooms('vinahouse', 3, 10);
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
          onEdit={() => setIsModalOpen(true)} 
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
            onClick={() => setIsModalOpen(true)}
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
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dormio Building</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Quản lý tổng thể cấu trúc tòa nhà, theo dõi tình trạng lưu trú và tài sản theo thời gian thực trên tất cả các tầng.
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
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10 backdrop-blur-md w-full lg:w-[145px]">
                <Home className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Tổng số phòng</span>
                  <span className="font-black text-white text-lg leading-none mt-1">{totalRooms}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 rounded-xl border border-primary/20 backdrop-blur-md w-full lg:w-[145px]">
                <Target className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-primary/80 tracking-wider">Tỷ lệ lấp đầy</span>
                  <span className="font-black text-primary text-lg leading-none mt-1">{occupancyRate}%</span>
                </div>
              </div>
            </div>
            
            {/* Room Statuses */}
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-primary/30 backdrop-blur-md w-full lg:w-[145px]">
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(137,200,185,0.8)] flex-shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-primary/80 tracking-wider">Đang thuê</span>
                  <span className="font-black text-white text-lg leading-none mt-1">{occupiedCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-vacant/30 backdrop-blur-md w-full lg:w-[145px]">
                <div className="w-2 h-2 rounded-full bg-vacant shadow-[0_0_8px_rgba(14,165,233,0.7)] flex-shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-vacant/80 tracking-wider">Trống</span>
                  <span className="font-black text-white text-lg leading-none mt-1">{vacantCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-orange-500/30 backdrop-blur-md w-full lg:w-[145px]">
                <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-orange-400/80 tracking-wider">Bảo trì</span>
                  <span className="font-black text-white text-lg leading-none mt-1">{maintenanceCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-deposit/30 backdrop-blur-md w-full lg:w-[145px]">
                <div className="w-2 h-2 rounded-full bg-deposit shadow-[0_0_8px_rgba(147,51,234,0.6)] flex-shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-deposit/80 tracking-wider">Đặt cọc</span>
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
            {/* Tòa nhà */}
            <div className="relative flex-shrink-0">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <select 
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-lg appearance-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors font-medium"
              >
                <option value="">Tòa nhà</option>
                <option value="dormio">Dormio Building</option>
                <option value="vinahouse">VinaHouse</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
            </div>

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
              <div className="flex-shrink-0 w-full md:w-24 bg-zinc-900 rounded-xl flex flex-col items-center justify-center py-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Tầng</span>
                <span className="text-3xl font-black">{floor}</span>
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
                      className={`flex-shrink-0 relative flex flex-col items-center justify-center p-3 rounded-xl border w-[90px] h-[90px] transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md ${
                        isOccupied ? 'bg-primary/5 border-primary/20 hover:border-primary/50' :
                        isMaintenance ? 'bg-orange-50 border-orange-200 hover:border-orange-300' :
                        isReserved ? 'bg-deposit-bg border-deposit-border hover:border-deposit-hover' :
                        isVacant ? 'bg-vacant-bg border-vacant-border hover:border-vacant-hover' :
                        'bg-white border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {/* Status Dot */}
                      {isOccupied && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(137,200,185,0.8)]"></div>}
                      {isMaintenance && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]"></div>}
                      {isReserved && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-deposit shadow-[0_0_6px_rgba(147,51,234,0.6)]"></div>}
                      
                      <span className={`text-xl font-bold mt-1 ${
                        isOccupied ? 'text-primary' : 
                        isMaintenance ? 'text-orange-600' :
                        isReserved ? 'text-deposit' :
                        isVacant ? 'text-vacant' :
                        'text-zinc-700'
                      }`}>{room.id}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 px-2 py-0.5 rounded-full ${
                        isOccupied ? 'text-primary bg-primary/10' :
                        isMaintenance ? 'text-orange-600 bg-orange-100' :
                        isReserved ? 'text-deposit bg-deposit-bg' :
                        isVacant ? 'text-vacant bg-vacant-bg' :
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
                        <select className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white">
                          <option value="">Chọn tòa nhà</option>
                          <option value="dormio">Dormio Building</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Số phòng <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="VD: 101, A01" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Loại phòng</label>
                        <select className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white">
                          <option value="">Chọn loại phòng</option>
                          <option value="studio">Studio</option>
                          <option value="1pn">1 Phòng ngủ</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Tầng</label>
                        <input type="text" placeholder="VD: 1, 2..." className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Diện tích</label>
                        <div className="relative">
                          <input type="number" placeholder="0" className="w-full pl-3 pr-10 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">m²</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">Giá thuê <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input type="text" placeholder="3.000.000" className="w-full pl-3 pr-12 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-medium text-zinc-900" />
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
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                            selectedAmenities.includes(item) 
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
                onClick={() => { setIsModalOpen(false); setIsDirty(false); }}
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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900">Phòng {room.id}</h1>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isOccupied ? 'text-primary bg-primary/10' :
            isMaintenance ? 'text-orange-600 bg-orange-100' :
            isReserved ? 'text-deposit bg-deposit-bg' :
            isVacant ? 'text-vacant bg-vacant-bg' :
            'text-zinc-500 bg-zinc-100'
          }`}>
            {room.status}
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
          <button 
            onClick={() => setIsContractModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all whitespace-nowrap"
          >
            {isOccupied ? <><Eye className="w-4 h-4" /> Xem hợp đồng</> : <><FileSignature className="w-4 h-4" /> Tạo hợp đồng</>}
          </button>
          {isOccupied && (
            <button 
              onClick={() => setIsMeterModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors whitespace-nowrap"
            >
              <Gauge className="w-4 h-4" /> Ghi chỉ số
            </button>
          )}
          <button 
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors whitespace-nowrap"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
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
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-danger-hover shadow-sm transition-all whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" /> Xóa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Thông tin phòng */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-800 text-sm">Thông tin phòng</h2>
              <button className="text-zinc-400 hover:text-primary transition-colors"><Edit className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div 
                onClick={() => room.tenantId ? router.push(`/landlord/customers?id=${room.tenantId}`) : null}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${room.tenant ? 'bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10 hover:border-primary/40' : 'bg-zinc-50 border-zinc-100'}`}
              >
                <User className={`w-5 h-5 ${room.tenant ? 'text-primary' : 'text-zinc-400'}`} />
                <span className={`text-sm ${room.tenant ? 'text-primary font-bold hover:underline' : 'text-zinc-500'}`}>
                  {room.tenant ? room.tenant : 'Phòng chưa có khách'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Số phòng</div>
                  <div className="text-sm font-semibold text-zinc-900">{room.id}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Tòa nhà</div>
                  <div className="text-sm font-semibold text-zinc-900 capitalize">{room.building === 'dormio' ? 'Dormio Building' : 'VinaHouse'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Loại phòng</div>
                  <div className="text-sm font-semibold text-zinc-900">Phòng trọ</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Giá niêm yết</div>
                  <div className="text-sm font-semibold text-zinc-900">3.000.000 đ</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Tầng</div>
                  <div className="text-sm font-semibold text-zinc-900">{room.floor}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Diện tích</div>
                  <div className="text-sm font-semibold text-zinc-900">—</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hóa đơn & công nợ */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-4">
            <h2 className="font-bold text-zinc-800 text-sm flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-zinc-500" /> Hóa đơn & công nợ
            </h2>
            <div className="text-sm text-zinc-500">Chưa có hóa đơn nào</div>
          </div>

          {/* Lịch sử ghi chỉ số */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" /> Lịch sử ghi chỉ số
              </h2>
            </div>
            {Object.values(meterRecordsMap).length > 0 ? (
              <div className="space-y-4">
                {Object.values(meterRecordsMap).reverse().map((record: any, idx, arr) => (
                  <details key={idx} className="group border border-zinc-200 rounded-lg overflow-hidden" open={idx === 0}>
                    <summary className="flex justify-between items-center p-4 bg-zinc-50 cursor-pointer select-none outline-none">
                      <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">
                        CHI TIẾT DỊCH VỤ ({record.month}/{record.year})
                      </span>
                      <ChevronDown className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="p-4 bg-white border-t border-zinc-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="border-b border-zinc-100">
                              <th className="py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Danh mục</th>
                              <th className="py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Đơn giá</th>
                              <th className="py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Tiêu thụ / Số lượng</th>
                              <th className="py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Ngày ghi</th>
                              <th className="py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50">
                            <tr>
                              <td className="py-4 px-4">
                                <div className="font-bold text-sm text-zinc-900 mb-1">ĐIỆN</div>
                                <div className="text-xs text-zinc-500">Cũ: {record.oldElec} kWh | Mới: {record.newElec} kWh</div>
                              </td>
                              <td className="py-4 px-4 text-right text-sm font-medium text-zinc-600">3.500 đ/kWh</td>
                              <td className="py-4 px-4 text-right text-sm font-bold text-zinc-900">{record.elecConsumption} kWh</td>
                              <td className="py-4 px-4 text-right text-sm text-zinc-500">{record.date}</td>
                              <td className="py-4 px-4 text-right text-sm font-bold text-amber-600">{(record.elecConsumption * 3500).toLocaleString()} đ</td>
                            </tr>
                            <tr>
                              <td className="py-4 px-4">
                                <div className="font-bold text-sm text-zinc-900 mb-1">NƯỚC</div>
                                <div className="text-xs text-zinc-500">Cũ: {record.oldWater} m³ | Mới: {record.newWater} m³</div>
                              </td>
                              <td className="py-4 px-4 text-right text-sm font-medium text-zinc-600">25.000 đ/m³</td>
                              <td className="py-4 px-4 text-right text-sm font-bold text-zinc-900">{record.waterConsumption} m³</td>
                              <td className="py-4 px-4 text-right text-sm text-zinc-500">{record.date}</td>
                              <td className="py-4 px-4 text-right text-sm font-bold text-amber-600">{(record.waterConsumption * 25000).toLocaleString()} đ</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-500">Chưa có chỉ số nào</div>
            )}
          </div>

          {/* Tài sản trong phòng */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-4">
            <h2 className="font-bold text-zinc-800 text-sm flex items-center gap-2 mb-4">
              <Box className="w-4 h-4 text-zinc-500" /> Tài sản trong phòng
            </h2>
            <div className="text-sm text-zinc-500">Chưa có tài sản nào</div>
          </div>

          {/* Bảo trì & Đặt cọc */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-zinc-500" /> Bảo trì
                </h2>
                <button className="px-3 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors">
                  Tạo
                </button>
              </div>
              <div className="text-sm text-zinc-500">Chưa có yêu cầu bảo trì</div>
            </div>
            
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-4">
              <h2 className="font-bold text-zinc-800 text-sm flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-zinc-500" /> Đặt cọc
              </h2>
              <div className="text-sm text-zinc-500">Chưa có khoản cọc nào</div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Cần chú ý */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-4">
            <h2 className="font-bold text-orange-500 text-sm flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4" /> Cần chú ý
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-50 pb-2">
                <span className="text-sm text-zinc-500">Công nợ</span>
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Không có công nợ</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-50 pb-2">
                <span className="text-sm text-zinc-500">Hợp đồng</span>
                <span className="text-sm font-semibold text-zinc-300">—</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Chỉ số T7</span>
                <span className="text-sm font-semibold text-zinc-300">—</span>
              </div>
            </div>
          </div>

          {/* Giá dịch vụ */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-4">
            <h2 className="font-bold text-zinc-800 text-sm flex items-center gap-2 mb-4">
              <Banknote className="w-4 h-4 text-zinc-500" /> Giá dịch vụ hiệu lực
            </h2>
            <div className="space-y-3">
              {roomServices.map((service, index) => (
                <div key={service.id} className={`flex justify-between items-center ${index !== roomServices.length - 1 ? 'border-b border-zinc-50 pb-2' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-700">{service.name}</span>
                    {service.isCustom && (
                      <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">Tùy chỉnh</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-zinc-900">
                    {service.isCustom ? service.customPrice : service.defaultPrice} {service.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quản lý phòng */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-4">
            <h2 className="font-bold text-zinc-800 text-sm mb-4">Quản lý phòng</h2>
            
            <div className="mb-4">
              <div className="text-xs text-zinc-500 mb-2">Cập nhật trạng thái</div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onUpdateStatus('Trống')} className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${isVacant ? 'bg-vacant text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>Trống</button>
                <button onClick={() => onUpdateStatus('Đang thuê')} className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${isOccupied ? 'bg-primary text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>Đang thuê</button>
                <button onClick={() => onUpdateStatus('Bảo trì')} className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${isMaintenance ? 'bg-orange-500 text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>Bảo trì</button>
                <button onClick={() => onUpdateStatus('Đặt cọc')} className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${isReserved ? 'bg-deposit text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>Đặt cọc</button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 mt-2 border-t border-zinc-100">
              <span className="text-sm font-medium text-zinc-700">Đang ẩn khỏi sales</span>
              {/* Toggle Switch */}
              <div className="w-10 h-5 bg-zinc-200 rounded-full relative cursor-pointer hover:bg-zinc-300 transition-colors">
                <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Meter Recording Modal */}
      {isMeterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsMeterModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900">Ghi chỉ số — Phòng {room.id}</h2>
              <button onClick={() => setIsMeterModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[70vh]">
              {/* Month/Year Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
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
              <div className="border border-zinc-200 rounded-xl p-4 mb-4">
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
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Chỉ số mới</label>
                    <input type="number" value={formElec} onChange={(e) => setFormElec(e.target.value)} placeholder="Nhập chỉ số" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <div className="text-sm text-zinc-500">Tiêu thụ: <span className="font-bold text-primary">{formElec ? elecConsumption : 0} kWh</span></div>
                  <div className="text-sm font-medium text-zinc-900">Thành tiền: <span className="font-bold">{elecTotal.toLocaleString()} đ</span></div>
                </div>
              </div>

              {/* Water */}
              <div className="border border-zinc-200 rounded-xl p-4 mb-6">
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
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Chỉ số mới</label>
                    <input type="number" value={formWater} onChange={(e) => setFormWater(e.target.value)} placeholder="Nhập chỉ số" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
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