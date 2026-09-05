"use client";

import React, { useState } from "react";
import {
  Wrench, Plus, Zap, Droplets, Wifi, Trash2, ShieldCheck,
  CarFront, Search, Building2, Edit3, Settings2, Info,
  UploadCloud, FileSpreadsheet, AlertTriangle, AlertCircle,
  CheckCircle2, DollarSign, Tag, Flame, Tv, Waves, Box,
  ChevronDown, LayoutGrid, List, Home, Users, Check, X, History,
  Layers, ArrowUpRight, Clock, MapPin
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export interface TierRate {
  name: string;
  from: number;
  to: number | null; // null = vô hạn
  price: number;
}

export interface PriceHistory {
  date: string;
  oldPrice: string;
  newPrice: string;
  reason: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  type: "Theo chỉ số đồng hồ" | "Cố định theo phòng" | "Cố định theo người" | "Theo số lượng / Đăng ký" | "Miễn phí" | string;
  unit: string;
  price: string;
  numericPrice: number;
  pricingMethod: "flat" | "tiered"; // Cố định vs Bậc thang
  tieredRates?: TierRate[];
  iconName: string;
  color: string;
  bg: string;
  isActive: boolean;
  isMandatory: boolean; // Bắt buộc hay Tùy chọn
  appliedRoomsCount: number;
  priceHistory: PriceHistory[];
  note?: string;
}

const initialServices: ServiceItem[] = [
  {
    id: "SRV-01",
    name: "Điện sinh hoạt",
    type: "Theo chỉ số đồng hồ",
    unit: "kWh",
    price: "3.500 ₫",
    numericPrice: 3500,
    pricingMethod: "flat",
    iconName: "Zap",
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200/80",
    isActive: true,
    isMandatory: true,
    appliedRoomsCount: 20,
    priceHistory: [
      { date: "01/01/2026", oldPrice: "3.200 ₫", newPrice: "3.500 ₫", reason: "Điều chỉnh theo giá điện EVN đầu năm" },
      { date: "01/06/2025", oldPrice: "3.000 ₫", newPrice: "3.200 ₫", reason: "Tăng nhẹ chi phí vận hành công tơ" }
    ],
    note: "Chốt chỉ số vào ngày 25 hàng tháng. Giá công tơ riêng."
  },
  {
    id: "SRV-02",
    name: "Nước sinh hoạt",
    type: "Theo chỉ số đồng hồ",
    unit: "m³",
    price: "25.000 ₫",
    numericPrice: 25000,
    pricingMethod: "flat",
    iconName: "Droplets",
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200/80",
    isActive: true,
    isMandatory: true,
    appliedRoomsCount: 20,
    priceHistory: [
      { date: "01/01/2026", oldPrice: "22.000 ₫", newPrice: "25.000 ₫", reason: "Điều chỉnh theo đơn giá nước sạch thành phố" }
    ],
    note: "Tính theo số khối (m³) trên đồng hồ từng phòng."
  },
  {
    id: "SRV-03",
    name: "Internet / Wifi tốc độ cao",
    type: "Cố định theo phòng",
    unit: "Phòng/Tháng",
    price: "100.000 ₫",
    numericPrice: 100000,
    pricingMethod: "flat",
    iconName: "Wifi",
    color: "text-indigo-500",
    bg: "bg-indigo-50 border-indigo-200/80",
    isActive: true,
    isMandatory: false,
    appliedRoomsCount: 18,
    priceHistory: [
      { date: "01/03/2025", oldPrice: "80.000 ₫", newPrice: "100.000 ₫", reason: "Nâng cấp đường truyền băng thông 300Mbps" }
    ],
    note: "Gói mạng doanh nghiệp 300Mbps, phủ sóng toàn tầng."
  },
  {
    id: "SRV-04",
    name: "Dịch vụ Vệ sinh & Thu gom rác",
    type: "Cố định theo người",
    unit: "Người/Tháng",
    price: "30.000 ₫",
    numericPrice: 30000,
    pricingMethod: "flat",
    iconName: "Trash2",
    color: "text-emerald-500",
    bg: "bg-emerald-50 border-emerald-200/80",
    isActive: true,
    isMandatory: true,
    appliedRoomsCount: 20,
    priceHistory: [],
    note: "Thu dọn rác sinh hoạt và lau dọn hành lang 3 lần/tuần."
  },
  {
    id: "SRV-05",
    name: "Phí gửi xe máy",
    type: "Theo số lượng / Đăng ký",
    unit: "Xe/Tháng",
    price: "120.000 ₫",
    numericPrice: 120000,
    pricingMethod: "flat",
    iconName: "CarFront",
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-200/80",
    isActive: true,
    isMandatory: false,
    appliedRoomsCount: 15,
    priceHistory: [],
    note: "Quản lý bằng thẻ từ xe máy, camera an ninh 24/7."
  },
  {
    id: "SRV-06",
    name: "Phí An ninh & Thang máy",
    type: "Cố định theo phòng",
    unit: "Phòng/Tháng",
    price: "50.000 ₫",
    numericPrice: 50000,
    pricingMethod: "flat",
    iconName: "ShieldCheck",
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-200/80",
    isActive: true,
    isMandatory: true,
    appliedRoomsCount: 20,
    priceHistory: [],
    note: "Bảo trì thang máy nhập khẩu & bảo vệ camera 24/24."
  }
];

export default function ServicesPage() {
  const t = useTranslations("services");
  const { locale } = useLanguage();
  const { activeBuilding } = useAuth();

  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Building prefix helper
  const buildingPrefix = activeBuilding.id === "vinahouse" ? "B2" : "B1";

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<string>("Theo chỉ số đồng hồ");
  const [formUnit, setFormUnit] = useState("kWh");
  const [formPrice, setFormPrice] = useState("3.500 ₫");
  const [formPricingMethod, setFormPricingMethod] = useState<"flat" | "tiered">("flat");
  const [formIcon, setFormIcon] = useState("Zap");
  const [formIsMandatory, setFormIsMandatory] = useState(true);
  const [formNote, setFormNote] = useState("");
  const [formChangeReason, setFormChangeReason] = useState("");

  // Rooms Applied Modal State
  const [roomsModalService, setRoomsModalService] = useState<ServiceItem | null>(null);

  // Price History Modal State
  const [historyModalService, setHistoryModalService] = useState<ServiceItem | null>(null);

  // Alert & Confirm Modals
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "warning" | "error" | "success" | "info";
  }>({
    isOpen: false,
    title: "Thông báo",
    message: "",
    type: "info"
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

  const showAlert = (message: string, type: "warning" | "error" | "success" | "info" = "warning", title: string = "Thông báo") => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const renderIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case "Zap": return <Zap className={className} />;
      case "Droplets": return <Droplets className={className} />;
      case "Wifi": return <Wifi className={className} />;
      case "Trash2": return <Trash2 className={className} />;
      case "CarFront": return <CarFront className={className} />;
      case "ShieldCheck": return <ShieldCheck className={className} />;
      case "Flame": return <Flame className={className} />;
      case "Tv": return <Tv className={className} />;
      case "Waves": return <Waves className={className} />;
      default: return <Box className={className} />;
    }
  };

  const handleOpenAddModal = () => {
    setSelectedService(null);
    setFormName("");
    setFormType("Theo chỉ số đồng hồ");
    setFormUnit("kWh");
    setFormPrice("3.500 ₫");
    setFormPricingMethod("flat");
    setFormIcon("Zap");
    setFormIsMandatory(true);
    setFormNote("");
    setFormChangeReason("");
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (srv: ServiceItem) => {
    setSelectedService(srv);
    setFormName(srv.name);
    setFormType(srv.type);
    setFormUnit(srv.unit);
    setFormPrice(srv.price);
    setFormPricingMethod(srv.pricingMethod);
    setFormIcon(srv.iconName);
    setFormIsMandatory(srv.isMandatory);
    setFormNote(srv.note || "");
    setFormChangeReason("");
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isDirty) {
      setConfirmModal({
        isOpen: true,
        title: locale === "en" ? "Confirm Form Close" : "Xác nhận đóng form",
        message: locale === "en" ? "You have unsaved changes. Are you sure you want to discard changes and close?" : "Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng và hủy các thông tin đã nhập?",
        confirmText: locale === "en" ? "Discard & Close" : "Hủy thay đổi & Đóng",
        cancelText: locale === "en" ? "Continue Editing" : "Tiếp tục sửa",
        onConfirm: () => {
          setIsModalOpen(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setTimeout(() => setIsDirty(false), 200);
        }
      });
    } else {
      setIsModalOpen(false);
    }
  };

  const handleSaveService = () => {
    if (!formName.trim()) {
      showAlert("Vui lòng nhập Tên dịch vụ!", "warning", "Thiếu thông tin");
      return;
    }

    const numPrice = parseInt(formPrice.replace(/\D/g, "")) || 0;
    const formattedPrice = numPrice > 0 ? `${numPrice.toLocaleString("vi-VN")} ₫` : formPrice;

    let iconColor = "text-amber-500";
    let iconBg = "bg-amber-50 border-amber-200/80";

    if (formIcon === "Droplets") { iconColor = "text-blue-500"; iconBg = "bg-blue-50 border-blue-200/80"; }
    else if (formIcon === "Wifi") { iconColor = "text-indigo-500"; iconBg = "bg-indigo-50 border-indigo-200/80"; }
    else if (formIcon === "Trash2") { iconColor = "text-emerald-500"; iconBg = "bg-emerald-50 border-emerald-200/80"; }
    else if (formIcon === "CarFront") { iconColor = "text-purple-500"; iconBg = "bg-purple-50 border-purple-200/80"; }
    else if (formIcon === "ShieldCheck") { iconColor = "text-rose-500"; iconBg = "bg-rose-50 border-rose-200/80"; }

    const todayStr = new Date().toLocaleDateString("vi-VN");

    if (selectedService) {
      // Check if price changed -> record audit log
      let updatedHistory = [...selectedService.priceHistory];
      if (selectedService.price !== formattedPrice) {
        updatedHistory.unshift({
          date: todayStr,
          oldPrice: selectedService.price,
          newPrice: formattedPrice,
          reason: formChangeReason.trim() || "Cập nhật đơn giá định kỳ"
        });
      }

      setServices(prev => prev.map(s => s.id === selectedService.id ? {
        ...s,
        name: formName.trim(),
        type: formType,
        unit: formUnit.trim(),
        price: formattedPrice,
        numericPrice: numPrice,
        pricingMethod: formPricingMethod,
        iconName: formIcon,
        color: iconColor,
        bg: iconBg,
        isMandatory: formIsMandatory,
        priceHistory: updatedHistory,
        note: formNote.trim()
      } : s));
      showAlert("Đã cập nhật dịch vụ thành công!", "success", "Cập nhật thành công");
    } else {
      const newId = `SRV-${String(services.length + 1).padStart(2, '0')}`;
      const newService: ServiceItem = {
        id: newId,
        name: formName.trim(),
        type: formType,
        unit: formUnit.trim(),
        price: formattedPrice,
        numericPrice: numPrice,
        pricingMethod: formPricingMethod,
        iconName: formIcon,
        color: iconColor,
        bg: iconBg,
        isActive: true,
        isMandatory: formIsMandatory,
        appliedRoomsCount: 20,
        priceHistory: [
          { date: todayStr, oldPrice: "Tạo mới", newPrice: formattedPrice, reason: "Khởi tạo đơn giá ban đầu" }
        ],
        note: formNote.trim()
      };
      setServices(prev => [newService, ...prev]);
      showAlert("Đã thêm dịch vụ mới thành công!", "success", "Thêm thành công");
    }

    setIsModalOpen(false);
    setIsDirty(false);
  };

  const handleToggleActive = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        const nextState = !s.isActive;
        showAlert(`Đã ${nextState ? 'KÍCH HOẠT' : 'TẠM DỪNG'} dịch vụ [${s.name}]`, nextState ? "success" : "info", "Cập nhật trạng thái");
        return { ...s, isActive: nextState };
      }
      return s;
    }));
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.unit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "" || service.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const paginatedServices = filteredServices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const meteredCount = services.filter(s => s.type === "Theo chỉ số đồng hồ").length;
  const roomFixedCount = services.filter(s => s.type === "Cố định theo phòng").length;
  const personFixedCount = services.filter(s => s.type === "Cố định theo người" || s.type === "Theo số lượng / Đăng ký").length;
  const activeCount = services.filter(s => s.isActive).length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 font-medium">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => showAlert("Tính năng Import cấu hình dịch vụ từ Excel đang được phát triển.", "info", "Tính năng thử nghiệm")}
            className="cursor-pointer px-3 sm:px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" /> Import
          </button>
          <button
            onClick={() => showAlert("Đã xuất bảng phí dịch vụ ra file Excel thành công!", "success", "Xuất file thành công")}
            className="cursor-pointer px-3 sm:px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export
          </button>
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t("addNew")}
          </button>
        </div>
      </div>

      {/* DARK HERO BANNER CARD (IDENTICAL TO ASSETS PAGE HERO BANNER) */}
      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Wrench className="w-48 sm:w-64 h-48 sm:h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="space-y-2.5 max-w-xl w-full">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                {activeBuilding.name}
              </h2>
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
                <span>Google Maps</span> &rarr;
              </a>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("heroSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full md:w-[135px]">
              <Wrench className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">{t("totalServices")}</span>
                <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">{services.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full md:w-[135px]">
              <Zap className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#2AC1BC] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">{t("metered")}</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{meteredCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full md:w-[135px]">
              <Wifi className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#FF6B35] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Cố định phòng</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{roomFixedCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full md:w-[135px]">
              <CarFront className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Theo người/xe</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{personFixedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guidance Alert Banner */}
      <div className="bg-[#2AC1BC]/5 border border-[#2AC1BC]/20 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
        <div className="bg-[#2AC1BC]/10 p-1.5 rounded-xl text-[#2AC1BC] shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs">
          <h3 className="font-extrabold text-zinc-900">Quy tắc tính bảng giá dịch vụ tòa nhà</h3>
          <p className="text-zinc-600 leading-relaxed font-medium">
            Đơn giá mặc định bên dưới áp dụng trực tiếp cho tất cả các phòng thuộc <strong className="text-zinc-800">{activeBuilding.name}</strong>. Các dịch vụ <span className="text-rose-600 font-bold">Bắt buộc</span> sẽ tự động thu hàng tháng, dịch vụ <span className="text-indigo-600 font-bold">Tùy chọn</span> có thể tùy chỉnh theo nhu cầu thực tế của từng khách thuê.
          </p>
        </div>
      </div>

      {/* FILTER & TOOLBAR BAR (FIXED FOR 100% MOBILE RESPONSIVENESS) */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar - Full Width on Mobile */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo tên dịch vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
            />
          </div>

          {/* Right Toolbar: View Mode Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <span className="text-xs text-zinc-400 font-semibold sm:hidden">Chế độ xem:</span>
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => { setViewMode("grid"); setItemsPerPage(6); setCurrentPage(1); }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white text-[#2AC1BC] shadow-2xs font-extrabold" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                title="Xem dạng thẻ (Grid)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setViewMode("list"); setItemsPerPage(10); setCurrentPage(1); }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-white text-[#2AC1BC] shadow-2xs font-extrabold" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                title="Xem dạng bảng (List)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills (Flex Wrap on Mobile so nothing overflows off screen) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100">
          {[
            { label: "Tất cả dịch vụ", val: "" },
            { label: "Theo đồng hồ", val: "Theo chỉ số đồng hồ" },
            { label: "Cố định theo phòng", val: "Cố định theo phòng" },
            { label: "Cố định theo người", val: "Cố định theo người" },
            { label: "Theo số lượng / Xe", val: "Theo số lượng / Đăng ký" }
          ].map(tab => (
            <button
              key={tab.val}
              onClick={() => setTypeFilter(tab.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${typeFilter === tab.val
                ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/20"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT DISPLAY: GRID OR LIST VIEW */}
      {viewMode === "grid" ? (
        /* GRID VIEW CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredServices.length > 0 ? (
            paginatedServices.map((service) => (
              <div
                key={service.id}
                className={`bg-white border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all space-y-4 relative overflow-hidden flex flex-col justify-between ${service.isActive ? "border-zinc-200/90" : "border-zinc-200 opacity-70 bg-zinc-50/50"
                  }`}
              >
                <div className="space-y-3.5">
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 sm:w-12 h-11 sm:h-12 rounded-2xl flex items-center justify-center border shadow-2xs shrink-0 ${service.bg} ${service.color}`}>
                        {renderIcon(service.iconName, "w-5 sm:w-6 h-5 sm:h-6")}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-black text-[#2AC1BC] bg-[#2AC1BC]/10 px-2 py-0.5 rounded-md border border-[#2AC1BC]/30">
                            {service.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${service.isMandatory ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}>
                            {service.isMandatory ? "Bắt buộc" : "Tùy chọn"}
                          </span>
                        </div>
                        <h3 className="font-black text-zinc-900 text-base sm:text-lg mt-1">{service.name}</h3>
                      </div>
                    </div>
                  </div>

                  {/* PROFESIONAL & MINIMAL STATUS TOGGLE WITH EXPLICIT STATE NOTE & SWITCH BUTTON */}
                  <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80">
                    <div className="space-y-0.5">
                      <span className="text-xs font-extrabold text-zinc-700 block">Trạng thái áp dụng:</span>
                      <span className={`text-[11px] font-bold block ${service.isActive ? "text-emerald-600" : "text-zinc-400"}`}>
                        {service.isActive ? "Đang Bật (Tính phí vào hóa đơn)" : "Đã Tắt (Tạm ngưng thu phí)"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleToggleActive(service.id, e)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${service.isActive ? "bg-[#2AC1BC]" : "bg-zinc-300"
                        }`}
                      title={service.isActive ? "Click để Tắt dịch vụ" : "Click để Bật dịch vụ"}
                    >
                      <span className="sr-only">Chuyển trạng thái áp dụng</span>
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${service.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>

                  {/* Service Specification Table */}
                  <div className="p-3.5 bg-zinc-50/80 rounded-2xl space-y-2 text-xs border border-zinc-100">
                    <div className="flex justify-between items-center text-zinc-600">
                      <span className="text-zinc-400 font-medium">Hình thức thu:</span>
                      <span className="font-bold text-zinc-900 bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                        {service.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-600">
                      <span className="text-zinc-400 font-medium">Đơn vị tính:</span>
                      <span className="font-bold text-zinc-800">{service.unit}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-600 pt-1 border-t border-zinc-200/60">
                      <span className="text-zinc-400 font-medium">Đơn giá mặc định:</span>
                      <span className="font-black text-emerald-600 text-base sm:text-lg">{service.price}</span>
                    </div>
                  </div>

                  {service.note && (
                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed italic bg-zinc-50/60 p-2.5 rounded-xl border border-zinc-100">
                      "{service.note}"
                    </p>
                  )}
                </div>

                {/* Footer Action Controls */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-1.5 text-xs">
                  <button
                    onClick={() => setRoomsModalService(service)}
                    className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    <Home className="w-3.5 h-3.5 text-[#2AC1BC]" /> {service.appliedRoomsCount} phòng
                  </button>

                  <button
                    onClick={() => setHistoryModalService(service)}
                    className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                    title="Xem lịch sử điều chỉnh giá"
                  >
                    <History className="w-3.5 h-3.5 text-amber-500" /> Lịch sử giá
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(service)}
                    className="px-3 py-1.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 text-[#2AC1BC] font-extrabold rounded-xl transition-colors flex items-center gap-1 cursor-pointer border border-[#2AC1BC]/30 text-[11px]"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Sửa
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-zinc-200 border-dashed p-6 text-center space-y-2">
              <Wrench className="w-12 h-12 text-zinc-300 mb-1" />
              <p className="font-black text-zinc-900 text-base">Không tìm thấy dịch vụ nào</p>
              <p className="text-xs text-zinc-500">Hãy thử tìm kiếm với từ khóa khác hoặc bấm "+ Thêm dịch vụ mới".</p>
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW TABLE */
        <div className="bg-white border border-zinc-200/80 rounded-2xl sm:rounded-3xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[900px]">
              <thead className="bg-zinc-50 text-zinc-500 uppercase font-extrabold border-b border-zinc-200 whitespace-nowrap">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[200px]">
                    Mã / Dịch vụ
                  </th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[170px]">Hình thức</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[100px]">Đơn vị</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[100px]">Đơn giá</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[100px]">Quy định</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px]">Phòng áp dụng</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[140px]">Trạng thái</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[110px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                      Không tìm thấy dịch vụ nào
                    </td>
                  </tr>
                ) : (
                  paginatedServices.map((service) => (
                    <tr key={service.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${service.bg} ${service.color}`}>
                            {renderIcon(service.iconName, "w-4.5 h-4.5")}
                          </div>
                          <div>
                            <span className="font-black text-zinc-900 block text-xs sm:text-sm whitespace-nowrap">{service.name}</span>
                            <span className="text-[10px] font-mono text-[#2AC1BC] font-bold block">{service.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200 inline-block">
                          {service.type}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-bold text-zinc-700 whitespace-nowrap">{service.unit}</td>
                      <td className="px-4 sm:px-6 py-4 font-black text-emerald-600 text-sm whitespace-nowrap">{service.price}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border inline-block whitespace-nowrap ${service.isMandatory ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                          {service.isMandatory ? "Bắt buộc" : "Tùy chọn"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setRoomsModalService(service)}
                          className="font-bold text-[#2AC1BC] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Home className="w-3.5 h-3.5" /> {service.appliedRoomsCount} phòng
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleToggleActive(service.id, e)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${service.isActive ? "bg-[#2AC1BC]" : "bg-zinc-300"
                              }`}
                            title={service.isActive ? "Click để Tắt" : "Click để Bật"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out ${service.isActive ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                          </button>
                          <span className={`text-xs font-bold ${service.isActive ? "text-emerald-600 font-black" : "text-zinc-400"}`}>
                            {service.isActive ? "Đang Bật" : "Đã Tắt"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setHistoryModalService(service)}
                            className="p-1.5 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                            title="Lịch sử thay đổi đơn giá"
                          >
                            <History className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(service)}
                            className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-[#2AC1BC]" /> Sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standardized Dormio Pagination Footer with Custom Rows Per Page */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs mt-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
            <span>Hiển thị</span>
            <input
              type="number"
              min={1}
              max={500}
              value={itemsPerPage || ""}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setItemsPerPage(isNaN(val) || val <= 0 ? 1 : val);
                setCurrentPage(1);
              }}
              className="w-12 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs"
            />
            <span>/ trang</span>
          </div>

          <span className="hidden sm:inline text-zinc-300">|</span>

          <div>
            <span className="font-extrabold text-zinc-800">{filteredServices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-extrabold text-zinc-800">{Math.min(currentPage * itemsPerPage, filteredServices.length)}</span> trên tổng số <span className="font-extrabold text-zinc-800">{filteredServices.length}</span> dịch vụ
          </div>
        </div>
        {(() => {
          const windowSize = 5;
          const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
          const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
          const visiblePages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

          return (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(windowStart - windowSize, 1))}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                &larr; Trước
              </button>
              {visiblePages.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/30"
                      : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages || windowStart + windowSize > totalPages}
                onClick={() => setCurrentPage(Math.min(windowStart + windowSize, totalPages))}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Sau &rarr;
              </button>
            </div>
          );
        })()}
      </div>

      {/* ADD / EDIT SERVICE MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col max-h-[90vh]">
            <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 text-[#FF6B35] rounded-xl">
                  <Wrench className="w-5 h-5 text-[#2AC1BC]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-zinc-900">
                    {selectedService ? `Chỉnh sửa dịch vụ [${selectedService.id}]` : "Thêm dịch vụ tiện ích mới"}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">Thiết lập đơn giá mặc định và hình thức thu phí</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-zinc-700 mb-1">
                  Tên dịch vụ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Điện sinh hoạt, Wifi, Giữ xe máy..."
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setIsDirty(true); }}
                  className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-extrabold text-zinc-700 mb-1">Hình thức thu phí</label>
                  <select
                    value={formType}
                    onChange={(e) => { setFormType(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="Theo chỉ số đồng hồ">Theo chỉ số đồng hồ (Điện, Nước)</option>
                    <option value="Cố định theo phòng">Cố định theo phòng (Wifi, Vệ sinh...)</option>
                    <option value="Cố định theo người">Cố định theo người (Rác, Nước...)</option>
                    <option value="Theo số lượng / Đăng ký">Theo số lượng / Đăng ký (Gửi xe)</option>
                    <option value="Miễn phí">Miễn phí / Tùy chọn</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-zinc-700 mb-1">Quy định áp dụng</label>
                  <select
                    value={formIsMandatory ? "mandatory" : "optional"}
                    onChange={(e) => { setFormIsMandatory(e.target.value === "mandatory"); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="mandatory">Bắt buộc tất cả các phòng</option>
                    <option value="optional">Tùy chọn đăng ký theo phòng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-extrabold text-zinc-700 mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    placeholder="VD: kWh, m³, Phòng/Tháng, Xe/Tháng..."
                    value={formUnit}
                    onChange={(e) => { setFormUnit(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-zinc-700 mb-1">Đơn giá mặc định (VNĐ)</label>
                  <input
                    type="text"
                    placeholder="VD: 3.500 ₫, 100.000 ₫..."
                    value={formPrice}
                    onChange={(e) => { setFormPrice(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none transition-all"
                  />
                </div>
              </div>

              {selectedService && selectedService.price !== formPrice && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 space-y-1 animate-in fade-in">
                  <label className="block font-extrabold text-amber-900 text-xs">Lý do điều chỉnh giá (Lưu nhật ký đối soát)</label>
                  <input
                    type="text"
                    placeholder="VD: Tăng theo giá EVN, điều chỉnh đơn giá nước sạch..."
                    value={formChangeReason}
                    onChange={(e) => setFormChangeReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-extrabold text-zinc-700 mb-1">Biểu tượng hiển thị</label>
                <select
                  value={formIcon}
                  onChange={(e) => { setFormIcon(e.target.value); setIsDirty(true); }}
                  className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="Zap">Zap (Tương ứng Điện)</option>
                  <option value="Droplets">Droplets (Tương ứng Nước)</option>
                  <option value="Wifi">Wifi (Tương ứng Internet)</option>
                  <option value="Trash2">Trash2 (Tương ứng Rác/Vệ sinh)</option>
                  <option value="CarFront">CarFront (Tương ứng Gửi xe)</option>
                  <option value="ShieldCheck">ShieldCheck (Tương ứng An ninh/Bảo vệ)</option>
                  <option value="Flame">Flame (Tương ứng Gas/Bếp)</option>
                  <option value="Tv">Tv (Tương ứng Truyền hình/Cáp)</option>
                  <option value="Waves">Waves (Tương ứng Hồ bơi/Sinh hoạt)</option>
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-zinc-700 mb-1">Ghi chú / Quy định thu phí</label>
                <textarea
                  rows={2}
                  placeholder="VD: Chốt số điện nước ngày 25 hàng tháng. Giá công tơ riêng..."
                  value={formNote}
                  onChange={(e) => { setFormNote(e.target.value); setIsDirty(true); }}
                  className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50">
              <button onClick={handleCloseModal} className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 cursor-pointer">
                Hủy bỏ
              </button>
              <button onClick={handleSaveService} className="px-5 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 cursor-pointer transition-all">
                Lưu dịch vụ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPLIED ROOMS OVERVIEW MODAL */}
      {roomsModalService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setRoomsModalService(null); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${roomsModalService.bg} ${roomsModalService.color}`}>
                  {renderIcon(roomsModalService.iconName, "w-5 h-5")}
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">{roomsModalService.name}</h3>
                  <span className="text-xs text-zinc-400 font-medium">Đang áp dụng cho {roomsModalService.appliedRoomsCount} phòng</span>
                </div>
              </div>
              <button onClick={() => setRoomsModalService(null)} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1 border border-zinc-100">
                <span className="text-zinc-500 font-bold block">Đơn giá thu: <strong className="text-emerald-600 text-sm">{roomsModalService.price}</strong> / {roomsModalService.unit}</span>
                <span className="text-zinc-400 block font-medium">Hình thức: {roomsModalService.type}</span>
              </div>

              <span className="font-extrabold text-zinc-700 block pt-2">Danh sách phòng đang tính phí:</span>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {Array.from({ length: roomsModalService.appliedRoomsCount }, (_, i) => {
                  const roomNum = 101 + i;
                  return (
                    <div key={roomNum} className="p-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-center font-bold text-zinc-800 text-xs">
                      P.{roomNum}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setRoomsModalService(null)}
              className="w-full py-2.5 bg-[#2AC1BC] text-white font-bold rounded-xl text-xs hover:bg-[#25ad87] transition-colors cursor-pointer shadow-2xs"
            >
              Đóng danh sách
            </button>
          </div>
        </div>
      )}

      {/* PRICE HISTORY AUDIT LOG MODAL */}
      {historyModalService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setHistoryModalService(null); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl border border-amber-200">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">Lịch sử thay đổi đơn giá</h3>
                  <span className="text-xs text-zinc-400 font-medium">{historyModalService.name} ({historyModalService.id})</span>
                </div>
              </div>
              <button onClick={() => setHistoryModalService(null)} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyModalService.priceHistory.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs space-y-1">
                <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-1" />
                <p className="font-bold text-zinc-600">Chưa có lịch sử điều chỉnh giá</p>
                <p className="text-[11px] text-zinc-400">Đơn giá dịch vụ này chưa từng thay đổi kể từ khi tạo.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 text-xs">
                {historyModalService.priceHistory.map((item, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" /> {item.date}
                      </span>
                      <div className="flex items-center gap-1 font-black">
                        <span className="text-zinc-400 line-through text-[11px]">{item.oldPrice}</span>
                        <span className="text-emerald-600 text-xs">➔ {item.newPrice}</span>
                      </div>
                    </div>
                    <p className="text-zinc-700 font-bold text-[11px] leading-relaxed">
                      Lý do: <span className="font-normal italic text-zinc-600">"{item.reason}"</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setHistoryModalService(null)}
              className="w-full py-2.5 bg-zinc-100 text-zinc-700 font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Đóng lịch sử
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Hủy thay đổi & Đóng",
  cancelText = "Tiếp tục chỉnh sửa",
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
          <h3 className="text-xl font-black text-zinc-900 tracking-tight">{title}</h3>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 transition-all cursor-pointer shadow-2xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-500/30"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertModal({
  isOpen,
  title,
  message,
  type = "info",
  onClose
}: {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "warning" | "error" | "success" | "info";
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const config = {
    warning: {
      bgColor: "bg-amber-500/10 text-amber-600 border-amber-200",
      icon: <AlertTriangle className="w-7 h-7 text-amber-500" />,
      btnColor: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
    },
    error: {
      bgColor: "bg-rose-500/10 text-rose-600 border-rose-200",
      icon: <AlertCircle className="w-7 h-7 text-rose-500" />,
      btnColor: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
    },
    success: {
      bgColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
      btnColor: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
    },
    info: {
      bgColor: "bg-orange-50 text-[#FF6B35] border-orange-200",
      icon: <Info className="w-7 h-7 text-[#FF6B35]" />,
      btnColor: "bg-[#FF6B35] hover:bg-[#e05a2b] text-white shadow-[#FF6B35]/20"
    }
  }[type];

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 p-6 space-y-4 text-center">
        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${config.bgColor}`}>
          {config.icon}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-zinc-900">{title}</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">{message}</p>
        </div>

        <button
          onClick={onClose}
          className={`w-full py-2.5 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer ${config.btnColor}`}
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}

