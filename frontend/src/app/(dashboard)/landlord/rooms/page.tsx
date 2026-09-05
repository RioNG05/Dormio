"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, Search, Download, Upload, MoreHorizontal, X, Home, Building2,
  Target, FileSignature, Receipt, ChevronDown, ArrowLeft, Eye,
  User, Banknote, Gauge, Trash2, Edit, AlertTriangle, Zap, Droplets, Trash, ShieldCheck, Sparkles, Wifi, History, Box, Wrench, Wallet, MapPin, UploadCloud, FileSpreadsheet
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { getAllRooms, saveAllRooms, Room } from "./data";

const amenityList = [
  { id: "wifi", vi: "WiFi", en: "WiFi" },
  { id: "ac", vi: "Điều hòa", en: "Air Conditioner" },
  { id: "water_heater", vi: "Nóng lạnh", en: "Water Heater" },
  { id: "wardrobe", vi: "Tủ quần áo", en: "Wardrobe" },
  { id: "bed", vi: "Giường", en: "Bed" },
  { id: "desk", vi: "Bàn học", en: "Study Desk" },
  { id: "kitchen", vi: "Kệ bếp", en: "Kitchen Shelf" },
  { id: "balcony", vi: "Ban công", en: "Balcony" },
  { id: "private_wc", vi: "WC riêng", en: "Private Bathroom" },
  { id: "washer", vi: "Máy giặt", en: "Washing Machine" },
  { id: "tv", vi: "Tivi", en: "Television" },
  { id: "fridge", vi: "Tủ lạnh", en: "Refrigerator" },
  { id: "parking", vi: "Gửi xe", en: "Parking Space" },
  { id: "elevator", vi: "Thang máy", en: "Elevator" },
  { id: "camera", vi: "Camera", en: "Security Camera" },
  { id: "security", vi: "Bảo vệ", en: "Security Guard" }
];

export default function RoomsPage() {
  const { activeBuilding, buildings } = useAuth();
  const router = useRouter();
  const t = useTranslations("rooms");
  const { locale } = useLanguage();
  const tCommon = useTranslations("common");
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

  
  const getServiceName = (id: string, fallbackName: string) => {
    if (id === 'bao_ve') return t("serviceSecurity");
    if (id === 'dien') return t("serviceElectricity");
    if (id === 'nuoc') return t("serviceWater");
    if (id === 'rac') return t("serviceTrash");
    if (id === 've_sinh') return t("serviceCleaning");
    if (id === 'wifi') return t("serviceWifi");
    return fallbackName;
  };

  const getServiceUnit = (id: string, unit: string) => {
    if (id === 'dien') return locale === 'en' ? 'VND/kWh' : 'đ/kWh';
    if (id === 'nuoc') return locale === 'en' ? 'VND/m³' : 'đ/m³';
    if (id === 'bao_ve' || id === 'rac' || id === 've_sinh' || id === 'wifi') return locale === 'en' ? 'VND/room' : 'đ/phòng';
    return unit;
  };

  const [roomServices, setRoomServices] = useState([
    { id: 'bao_ve', name: t('serviceSecurity'), defaultPrice: '50.000', customPrice: '60.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 'dien', name: t('serviceElectricity'), defaultPrice: '3.500', customPrice: '3.500', unit: 'đ/kWh', isCustom: true, isRemovable: false },
    { id: 'nuoc', name: t('serviceWater'), defaultPrice: '25.000', customPrice: '25.000', unit: 'đ/m³', isCustom: true, isRemovable: false },
    { id: 'rac', name: t('serviceTrash'), defaultPrice: '20.000', customPrice: '20.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 've_sinh', name: t('serviceCleaning'), defaultPrice: '30.000', customPrice: '30.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 'wifi', name: t('serviceWifi'), defaultPrice: '100.000', customPrice: '100.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
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
        title: t('confirmCloseTitle'),
        message: t('confirmCloseMessage'),
        onConfirm: () => {
          setIsModalOpen(false);
          setIsDirty(false);
          setFormRoomNumber("");
          setFormNotes("");
          setSelectedAmenities([]);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      setIsModalOpen(false);
    }
  };

  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    setRooms(getAllRooms());

    const handleSync = () => {
      setRooms(getAllRooms());
    };
    window.addEventListener("dormio_rooms_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("dormio_rooms_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  const currentBuildingId = buildingFilter || activeBuilding?.id || 'b1';

  // Filter rooms according to current landlord's active boarding house
  const filteredRooms = rooms.filter(room => {
    const matchSearch = room.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBuilding = room.building === currentBuildingId;
    const matchStatus = statusFilter === "" ||
      room.status === statusFilter ||
      (statusFilter === "Trống" && (room.status === "vacant" || room.status === "Trống")) ||
      (statusFilter === "Đang thuê" && (room.status === "occupied" || room.status === "Đang thuê")) ||
      (statusFilter === "Bảo trì" && (room.status === "maintenance" || room.status === "Bảo trì")) ||
      (statusFilter === "Đặt cọc" && (room.status === "reserved" || room.status === "Đặt cọc"));
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

  const currentBuildingRooms = rooms.filter(r => r.building === currentBuildingId);
  const totalRooms = currentBuildingRooms.length;
  const occupiedCount = currentBuildingRooms.filter(r => r.status === 'occupied' || r.status === 'Đang thuê').length;
  const vacantCount = currentBuildingRooms.filter(r => r.status === 'vacant' || r.status === 'Trống').length;
  const maintenanceCount = currentBuildingRooms.filter(r => r.status === 'maintenance' || r.status === 'Bảo trì').length;
  const reservedCount = currentBuildingRooms.filter(r => r.status === 'reserved' || r.status === 'Đặt cọc').length;
  const occupancyRate = totalRooms > 0 ? ((occupiedCount / totalRooms) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
          <p className="text-sm text-zinc-500">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button className="cursor-pointer px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-emerald-600" /> {tCommon("import")}
          </button>
          <button className="cursor-pointer px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" /> {tCommon("export")}
          </button>
          <button
            onClick={() => {
              setSelectedRoomId(null);
              setFormBuilding(currentBuildingId);
              setFormRoomNumber("");
              setFormRoomType("studio");
              setFormFloor("1");
              setFormArea("25");
              setFormPrice("3.000.000");
              setFormNotes("");
              setSelectedAmenities(['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng']);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t("addRoom")}
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
                {t("inOperation")}
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
                <span>{t("viewMap")}</span> &rarr;
              </a>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("bannerDesc")}
            </p>
          </div>

          {/* Stat Chips split into Row 1 (2 cards: Tổng phòng & Tỷ lệ lấp đầy) and Row 2 (4 cards: Đang thuê, Trống, Bảo trì, Đặt cọc) */}
          <div className="flex flex-col items-end gap-2.5 sm:gap-3 w-full lg:w-auto mt-4 lg:mt-0">
            {/* HÀNG 1: 2 thẻ Thống Kê Tổng Quan */}
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-2.5 sm:gap-3 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10 backdrop-blur-md w-full lg:w-[135px]">
                <Home className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-zinc-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">{t("totalRooms")}</span>
                  <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{totalRooms}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[135px]">
                <Target className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">{t("occupancy")}</span>
                  <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">{occupancyRate}%</span>
                </div>
              </div>
            </div>

            {/* HÀNG 2: 4 thẻ Đồng Cấp Chi Tiết Trạng Thái */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-row lg:justify-end gap-2.5 sm:gap-3 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">{t("occupied")}</span>
                  <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{occupiedCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">{t("vacant")}</span>
                  <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{vacantCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full lg:w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">{t("maintenance")}</span>
                  <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{maintenanceCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 transition-colors rounded-xl border border-purple-500/30 backdrop-blur-md w-full lg:w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">{t("deposit")}</span>
                  <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{reservedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROOM LIST CONTAINER CARD WITH INTEGRATED TOOLBAR */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
        {/* SINGLE ROW TOOLBAR CONTAINER (Matching exact size & format in user screenshot) */}
        <div className="p-3 sm:p-4 border-b border-zinc-200/80">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Bar - Left side */}
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
              />
            </div>

            {/* Right side Filter Dropdowns (Status, Contract, Invoice) - Responsive Grid on Mobile, Flex on Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:items-center md:justify-end gap-2 w-full md:w-auto">
              {/* Trạng thái phòng */}
              <div className="relative w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:border-[#2AC1BC] cursor-pointer transition-colors whitespace-nowrap shadow-2xs"
                >
                  <option value="">{t("allStatuses")}</option>
                  <option value="Trống">{t("available")}</option>
                  <option value="Đang thuê">{t("occupied")}</option>
                  <option value="Bảo trì">{t("maintenance")}</option>
                  <option value="Đặt cọc">{t("deposit")}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              </div>

              {/* Hợp đồng */}
              <div className="relative w-full md:w-auto">
                <select
                  value={contractFilter}
                  onChange={(e) => setContractFilter(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:border-[#2AC1BC] cursor-pointer transition-colors whitespace-nowrap shadow-2xs"
                >
                  <option value="">{t("allContracts")}</option>
                  <option value="active">{t("activeContracts")}</option>
                  <option value="expired">{t("expiredContracts")}</option>
                  <option value="expiring_soon">{t("expiringSoonContracts")}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              </div>

              {/* Hóa đơn */}
              <div className="relative w-full md:w-auto">
                <select
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:border-[#2AC1BC] cursor-pointer transition-colors whitespace-nowrap shadow-2xs"
                >
                  <option value="">{t("allInvoices")}</option>
                  <option value="paid">{t("paidInvoices")}</option>
                  <option value="overdue">{t("overdueInvoices")}</option>
                  <option value="debt">{t("debtInvoices")}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-zinc-50/50 flex flex-col gap-4">
          {floors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-xl border border-zinc-200 border-dashed">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-800 mb-1">{t("notFoundTitle")}</h3>
              <p className="text-zinc-500 text-center max-w-sm">
                {t("notFoundDesc")}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setBuildingFilter("");
                  setStatusFilter("");
                  setContractFilter("");
                  setInvoiceFilter("");
                }}
                className="mt-6 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {t("clearFilter")}
              </button>
            </div>
          ) : (
            floors.map(floor => (
              <div key={floor} className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex-shrink-0 w-full md:w-28 bg-zinc-900 rounded-xl flex items-center justify-center px-4 py-3 text-white">
                  <span className="text-base font-black tracking-wider text-white flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{t("floorLabel")}</span>
                    <span className="text-xl font-black text-white">{floor}</span>
                  </span>
                </div>

                <div className="flex-1 flex flex-nowrap gap-3 items-center overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-zinc-50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300">
                  {(groupedRooms[floor] || []).map((room: any) => {
                    const isOccupied = room.status === 'occupied' || room.status === 'Đang thuê';
                    const isMaintenance = room.status === 'maintenance' || room.status === 'Bảo trì';
                    const isReserved = room.status === 'reserved' || room.status === 'Đặt cọc';
                    const isVacant = room.status === 'vacant' || room.status === 'Trống';

                    const statusDisplay = isOccupied ? t("occupied") : isMaintenance ? t("maintenance") : isReserved ? t("reserved") : isVacant ? t("available") : room.status;

                    return (
                      <div
                        key={`${room.building}-${room.id}`}
                        onClick={() => router.push(`/landlord/rooms/${room.fullRoomId || room.id}`)}
                        title={`${room.roomNumber || room.id} - ${statusDisplay}`}
                        className={`group flex-shrink-0 relative flex flex-col items-center justify-center p-3 rounded-2xl border w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] transition-all cursor-pointer hover:-translate-y-1 hover:shadow-lg ${isOccupied ? 'bg-[#2AC1BC]/10 border-[#2AC1BC]/30 hover:border-[#2AC1BC]' :
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

                        <span className={`text-2xl font-black ${isOccupied ? 'text-[#2AC1BC]' :
                          isMaintenance ? 'text-[#FF6B35]' :
                            isReserved ? 'text-purple-600' :
                              isVacant ? 'text-blue-600' :
                                'text-zinc-700'
                          }`}>
                          {room.roomNumber || room.id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
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
                  <h2 className="text-xl font-black text-zinc-900">{selectedRoomId ? t('editRoomTitle') : t('createRoomTitle')}</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">{selectedRoomId ? t('editRoomDesc') : t('createRoomDesc')}</p>
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
                      <Home className="w-4 h-4 text-accent" /> {t('basicInfo')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">{t('buildingLabel')} <span className="text-red-500">*</span></label>
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
                        <label className="text-sm font-semibold text-zinc-700">{t('roomNumberLabel')} <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formRoomNumber}
                          onChange={(e) => { setFormRoomNumber(e.target.value); setIsDirty(true); }}
                          placeholder="VD: 101, A01"
                          className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-bold text-zinc-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">{t('roomTypeLabel')}</label>
                        <select
                          value={formRoomType}
                          onChange={(e) => { setFormRoomType(e.target.value); setIsDirty(true); }}
                          className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white font-medium text-zinc-900"
                        >
                          <option value="studio">{t('studioType')}</option>
                          <option value="1pn">{t('oneBedType')}</option>
                          <option value="2pn">{t('twoBedType')}</option>
                          <option value="duplex">{t("penthouseType")}</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">{t('floor')}</label>
                        <input
                          type="text"
                          value={formFloor}
                          onChange={(e) => { setFormFloor(e.target.value); setIsDirty(true); }}
                          placeholder="VD: 1, 2..."
                          className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors font-medium text-zinc-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-zinc-700">{t('area')}</label>
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
                        <label className="text-sm font-semibold text-zinc-700">{t('price')} <span className="text-red-500">*</span></label>
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
                      <Receipt className="w-4 h-4 text-accent" /> {t('serviceConfig')}
                    </h3>
                    <div className="space-y-3">
                      {roomServices.map((service) => (
                        <div key={service.id} className="border border-zinc-200 rounded-lg p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 transition-colors hover:border-primary/30">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            {!service.isRemovable ? (
                              <span className="font-bold text-sm text-zinc-900">{getServiceName(service.id, service.name)}</span>
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
                                ({t("buildingDefault")}: {service.defaultPrice} {getServiceUnit(service.id, service.unit)})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-zinc-500">{t('customService')}</span>
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
                                title={t('deleteService')}
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
                      <Plus className="w-4 h-4" /> {t('addOtherService')}
                    </button>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent" /> {t('roomPhotos')}
                    </h3>
                    <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 hover:border-primary/50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-700 mb-1">{t('uploadPhotoHint')}</p>
                      <p className="text-xs text-zinc-500">{t('supportedPhotoFormat')}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent" /> {t('amenitiesTitle')}
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">{selectedAmenities.length} {t('selectedCount')}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 pb-1">
                      {amenityList.map(a => {
                        const isSelected = selectedAmenities.some(x => x === a.id || x === a.vi || x === a.en);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setSelectedAmenities(prev =>
                                prev.some(x => x === a.id || x === a.vi || x === a.en)
                                  ? prev.filter(x => x !== a.id && x !== a.vi && x !== a.en)
                                  : [...prev, a.id]
                              );
                              setIsDirty(true);
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${isSelected
                              ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                              : 'text-zinc-600 bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                              }`}
                          >
                            {locale === "en" ? a.en : a.vi}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
                      <FileSignature className="w-4 h-4 text-accent" /> {t("notesTitle")}
                    </h3>
                    <textarea
                      rows={4}
                      value={formNotes}
                      onChange={(e) => { setFormNotes(e.target.value); setIsDirty(true); }}
                      placeholder={t('notesPlaceholder')}
                      className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white z-10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
                >{t("cancelBtn")}</button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRoomId) {
                      const updated = rooms.map(r => {
                        if (`${r.building}-${r.id}` === selectedRoomId || `${r.building}-${r.roomNumber}` === selectedRoomId) {
                          return {
                            ...r,
                            roomNumber: formRoomNumber || r.roomNumber,
                            building: formBuilding || r.building,
                            floor: formFloor || r.floor,
                            area: formArea || r.area,
                            price: formPrice || r.price,
                            notes: formNotes,
                            amenities: [...selectedAmenities]
                          };
                        }
                        return r;
                      });
                      setRooms(updated);
                      saveAllRooms(updated);
                    } else {
                      const targetBuilding = formBuilding || currentBuildingId || "b1";
                      const bSeq = targetBuilding === 'b2' ? 2 : targetBuilding === 'b3' ? 3 : 1;
                      const newRoomNum = formRoomNumber || `${formFloor || 1}01`;
                      const fullRoomId = `${bSeq}${newRoomNum}`;
                      const newRoom: Room = {
                        id: fullRoomId,
                        fullRoomId: fullRoomId,
                        roomNumber: newRoomNum,
                        building: targetBuilding,
                        buildingSeq: bSeq,
                        floor: formFloor || "1",
                        status: "vacant",
                        contract: "none",
                        invoice: "none",
                        area: formArea || "25",
                        price: formPrice || "3.000.000 ₫",
                        notes: formNotes,
                        amenities: [...selectedAmenities]
                      };
                      const updated = [newRoom, ...rooms];
                      setRooms(updated);
                      saveAllRooms(updated);
                    }
                    setIsModalOpen(false);
                    setIsDirty(false);
                  }}
                  className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                >{t("saveRoomBtn")}</button>
              </div>
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

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("rooms");
  const displayTitle = title || t("confirmCloseTitle");
  const displayMessage = message || t("confirmCloseMessage");
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 border border-zinc-100">
        {/* Warning Amber Icon Badge */}
        <div className="w-14 h-14 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Header Title & Subtitle */}
        <div className="space-y-2">
          <h3 className="text-xl font-black text-zinc-900 tracking-tight">{displayTitle}</h3>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
            {displayMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 transition-all cursor-pointer shadow-2xs"
          >
            {t("continueEditing")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-500/30"
          >
            {t("discardAndClose")}
          </button>
        </div>
      </div>
    </div>
  );
}