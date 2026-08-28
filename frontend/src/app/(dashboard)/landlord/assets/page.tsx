"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package, Search, Plus, Download, MoreHorizontal,
  CheckCircle2, AlertTriangle, Wrench, Box, Filter,
  Building2, ArrowUpDown, ChevronDown, UploadCloud, FileSpreadsheet,
  MapPin, Eye, Edit3, Trash2, Tag, ShieldCheck, Sparkles, LayoutGrid, List,
  DollarSign, Home, AlertCircle, Info, Calendar, ArrowRight, BarChart3
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Asset, initialMockAssets, calculateDepreciation } from "./data";

export default function AssetsPage() {
  const { activeBuilding } = useAuth();
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>(initialMockAssets);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Form Field States (with SKU & Depreciation)
  const [formSku, setFormSku] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Điện lạnh");
  const [formRoom, setFormRoom] = useState("101");
  const [formValue, setFormValue] = useState("3.000.000 ₫");
  const [formPurchaseDate, setFormPurchaseDate] = useState("10/01/2025");
  const [formDepreciationYears, setFormDepreciationYears] = useState(5);
  const [formStatus, setFormStatus] = useState("Đang sử dụng");
  const [formModelCode, setFormModelCode] = useState("");
  const [formSerialNumber, setFormSerialNumber] = useState("");
  const [formWarrantyPeriod, setFormWarrantyPeriod] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formNote, setFormNote] = useState("");

  // Building Code Prefix for Asset ID (e.g. DORMIO-Q1)
  const buildingPrefix = activeBuilding?.id ? activeBuilding.id.toUpperCase() : "DORMIO-Q1";

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

  const handleCloseModal = () => {
    if (isDirty) {
      setConfirmModal({
        isOpen: true,
        title: "Xác nhận đóng form",
        message: "Bạn đang có thông tin chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thông tin đã nhập?",
        confirmText: "Hủy thay đổi & Đóng",
        cancelText: "Tiếp tục chỉnh sửa",
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

  const handleOpenAddModal = () => {
    setSelectedAsset(null);
    setFormSku(`TS-${Math.floor(100 + Math.random() * 900)}`);
    setFormName("");
    setFormCategory("Điện lạnh");
    setFormRoom("101");
    setFormValue("3.000.000 ₫");
    setFormPurchaseDate(new Date().toLocaleDateString("vi-VN"));
    setFormDepreciationYears(5);
    setFormStatus("Đang sử dụng");
    setFormModelCode("");
    setFormSerialNumber("");
    setFormWarrantyPeriod("");
    setFormSupplier("");
    setFormNote("");
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asset: Asset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAsset(asset);
    setFormSku(asset.sku || asset.id);
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormRoom(asset.room);
    setFormValue(asset.value);
    setFormPurchaseDate(asset.purchaseDate || asset.dateAdded || "10/01/2025");
    setFormDepreciationYears(asset.depreciationYears || 5);
    setFormStatus(asset.status);
    setFormModelCode(asset.modelCode || "");
    setFormSerialNumber(asset.serialNumber || "");
    setFormWarrantyPeriod(asset.warrantyPeriod || "");
    setFormSupplier(asset.supplier || "");
    setFormNote(asset.note || "");
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleSaveAsset = () => {
    if (!formName.trim()) {
      showAlert("Vui lòng nhập Tên tài sản!", "warning", "Thiếu thông tin");
      return;
    }
    if (!formSku.trim()) {
      showAlert("Vui lòng nhập Mã SKU cho tài sản!", "warning", "Thiếu thông tin");
      return;
    }

    const numVal = parseInt(formValue.replace(/\D/g, "")) || 0;
    const formattedVal = numVal > 0 ? `${numVal.toLocaleString("vi-VN")} ₫` : formValue;
    const cleanSku = formSku.trim().toUpperCase();
    const generatedId = `${buildingPrefix}-${cleanSku}`;

    if (selectedAsset) {
      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? {
        ...a,
        id: generatedId,
        sku: cleanSku,
        name: formName.trim(),
        category: formCategory,
        room: formRoom,
        value: formattedVal,
        numericValue: numVal,
        purchaseValue: numVal,
        purchaseDate: formPurchaseDate,
        depreciationYears: Number(formDepreciationYears) || 5,
        status: formStatus,
        modelCode: formModelCode.trim(),
        serialNumber: formSerialNumber.trim(),
        warrantyPeriod: formWarrantyPeriod.trim(),
        supplier: formSupplier.trim(),
        note: formNote.trim(),
      } : a));
      showAlert("Đã cập nhật thông tin tài sản thành công!", "success", "Cập nhật thành công");
    } else {
      const newAsset: Asset = {
        id: generatedId,
        sku: cleanSku,
        name: formName.trim(),
        category: formCategory,
        building: activeBuilding?.id || "dormio",
        buildingName: activeBuilding?.name || "Dormio Premier Quận 1",
        room: formRoom,
        status: formStatus,
        dateAdded: new Date().toLocaleDateString("vi-VN"),
        purchaseDate: formPurchaseDate,
        purchaseValue: numVal,
        depreciationYears: Number(formDepreciationYears) || 5,
        value: formattedVal,
        numericValue: numVal,
        modelCode: formModelCode.trim(),
        serialNumber: formSerialNumber.trim(),
        warrantyPeriod: formWarrantyPeriod.trim(),
        supplier: formSupplier.trim(),
        note: formNote.trim(),
        maintenanceLogs: []
      };
      setAssets(prev => [newAsset, ...prev]);
      showAlert(`Đã thêm tài sản mới mã [${generatedId}]!`, "success", "Thêm thành công");
    }

    setIsModalOpen(false);
    setIsDirty(false);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.sku && asset.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "" || asset.status === statusFilter;
    const matchesCategory = categoryFilter === "" || asset.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const inUseCount = assets.filter(a => a.status === "Đang sử dụng").length;
  const maintenanceCount = assets.filter(a => a.status === "Bảo trì" || a.status === "Hỏng hóc").length;
  const stockCount = assets.filter(a => a.status === "Sẵn sàng" || a.room === "Kho").length;

  // Calculate sum of initial values & sum of depreciated current values
  const totalPurchaseValueSum = assets.reduce((sum, a) => sum + (a.purchaseValue || a.numericValue || 0), 0);
  const totalCurrentValueSum = assets.reduce((sum, a) => sum + calculateDepreciation(a).currentValue, 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            Quản lý tài sản
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 font-medium">
            Danh mục trang thiết bị, quản lý SKU, vị trí phòng và tính toán khấu hao tự động
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => showAlert("Tính năng Import tài sản bằng Excel đang được phát triển.", "info", "Tính năng thử nghiệm")}
            className="cursor-pointer px-3 sm:px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" /> Import
          </button>
          <button
            onClick={() => showAlert("Đã xuất danh sách tài sản ra file Excel thành công!", "success", "Xuất file thành công")}
            className="cursor-pointer px-3 sm:px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export
          </button>
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm tài sản mới
          </button>
        </div>
      </div>

      {/* Building Overview Banner Card */}
      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Package className="w-48 sm:w-64 h-48 sm:h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="space-y-2.5 max-w-xl w-full">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                {activeBuilding.name}
              </h2>
              <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
                Mã: {buildingPrefix}
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
              Quản lý trang thiết bị theo Mã SKU riêng biệt. Giá trị khấu hao được tự động tính toán theo số tháng sử dụng thực tế.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full md:w-[135px]">
              <Package className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng TS</span>
                <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">{assets.length} món</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full md:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">Sử dụng</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{inUseCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full md:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Bảo trì</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{maintenanceCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full md:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Trong kho</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{stockCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs & Financial Valuation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["", "Điện lạnh", "Nội thất", "Gia dụng", "Điện nước", "An ninh"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${categoryFilter === cat
                ? "bg-[#2AC1BC] text-white shadow-xs shadow-[#2AC1BC]/20"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
                }`}
            >
              {cat === "" ? "Tất cả danh mục" : cat}
            </button>
          ))}
        </div>

        {/* Financial Valuation Summary (Initial vs Depreciated Current Value) */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-black text-emerald-800 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Giá gốc: {totalPurchaseValueSum.toLocaleString("vi-VN")} ₫</span>
          </div>

          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-black text-blue-800 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Giá trị hiện tại: {totalCurrentValueSum.toLocaleString("vi-VN")} ₫</span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-400 hover:text-zinc-600"}`}
              title="Chế độ lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-400 hover:text-zinc-600"}`}
              title="Chế độ danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-200 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between bg-zinc-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã SKU, Tên thiết bị, Phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto pl-4 pr-10 py-2 text-xs font-semibold text-zinc-900 bg-white border border-zinc-200 rounded-xl appearance-none focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 cursor-pointer transition-all min-w-[150px]"
            >
              <option value="">Mọi trạng thái</option>
              <option value="Đang sử dụng">Đang sử dụng</option>
              <option value="Sẵn sàng">Sẵn sàng (Kho)</option>
              <option value="Bảo trì">Đang bảo trì</option>
              <option value="Hỏng hóc">Hỏng hóc</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
          </div>
        </div>

        {/* GRID VIEW */}
        {viewMode === "grid" ? (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-500 font-medium">
                <Package className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
                Không tìm thấy tài sản phù hợp
              </div>
            ) : (
              filteredAssets.map(asset => {
                const dep = calculateDepreciation(asset);
                return (
                  <div
                    key={asset.id}
                    onClick={() => router.push(`/landlord/assets/${asset.id}`)}
                    className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-[#2AC1BC]/40 transition-all space-y-4 cursor-pointer relative group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                            {asset.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/30">
                            SKU: {asset.sku || asset.id}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${asset.status === 'Đang sử dụng' ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30' :
                          asset.status === 'Sẵn sàng' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            asset.status === 'Bảo trì' ? 'bg-orange-50 text-[#FF6B35] border-orange-200 animate-pulse' :
                              'bg-rose-50 text-rose-600 border-rose-200'
                          }`}>
                          {asset.status}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-zinc-900 group-hover:text-[#2AC1BC] transition-colors leading-snug">
                          {asset.name}
                        </h3>
                      </div>

                      <div className="p-3 bg-zinc-50 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center text-zinc-600">
                          <span className="text-zinc-400 font-medium">Vị trí:</span>
                          <span className="font-bold text-zinc-900 bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                            {asset.room}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-600">
                          <span className="text-zinc-400 font-medium">Giá trị gốc:</span>
                          <span className="font-bold text-zinc-900">{asset.value}</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-600">
                          <span className="text-zinc-400 font-medium">Khấu hao hiện tại:</span>
                          <span className="font-black text-emerald-600">
                            {dep.currentValue.toLocaleString("vi-VN")} ₫ <span className="text-[10px] text-zinc-400 font-normal">({dep.remainingPercent}%)</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={(e) => handleOpenEditModal(asset, e)}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#2AC1BC]" /> Sửa SKU
                      </button>
                      <span className="text-xs font-black text-[#2AC1BC] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* LIST VIEW TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[900px]">
              <thead className="bg-zinc-50 text-zinc-500 uppercase font-extrabold border-b border-zinc-200 whitespace-nowrap">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5">Mã SKU</th>
                  <th className="px-4 sm:px-6 py-3.5">Tên tài sản</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[120px]">Danh mục</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[120px]">Vị trí</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px]">Giá gốc</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[180px]">Giá khấu hao</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px]">Trạng thái</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                      Không tìm thấy tài sản phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const dep = calculateDepreciation(asset);
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => router.push(`/landlord/assets/${asset.id}`)}
                        className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="font-black text-[#2AC1BC] block font-mono">{asset.sku || asset.id}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-zinc-900 group-hover:text-[#2AC1BC] transition-colors whitespace-nowrap">
                          {asset.name}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-zinc-500 whitespace-nowrap">{asset.category}</td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-zinc-800 whitespace-nowrap">{asset.room}</td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-zinc-900 whitespace-nowrap">{asset.value}</td>
                        <td className="px-4 sm:px-6 py-4 font-black text-emerald-600 whitespace-nowrap">
                          {dep.currentValue.toLocaleString("vi-VN")} ₫
                          <span className="text-[10px] text-zinc-400 font-medium block">Còn {dep.remainingPercent}%</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-block whitespace-nowrap ${asset.status === 'Đang sử dụng' ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30' :
                            asset.status === 'Sẵn sàng' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                              asset.status === 'Bảo trì' ? 'bg-orange-50 text-[#FF6B35] border-orange-200 animate-pulse' :
                                'bg-rose-50 text-rose-600 border-rose-200'
                            }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleOpenEditModal(asset, e)}
                              className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3 text-[#2AC1BC]" /> Sửa
                            </button>
                            <Link
                              href={`/landlord/assets/${asset.id}`}
                              className="px-2.5 py-1 bg-orange-50 text-[#FF6B35] border border-orange-200/80 rounded-lg text-xs font-bold hover:bg-[#FF6B35] hover:text-white transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Xem
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT ASSET MODAL WITH SKU & DEPRECIATION */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col max-h-[90vh]">
            <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 text-[#FF6B35] rounded-xl">
                  <Package className="w-5 h-5 text-[#2AC1BC]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-zinc-900">
                    {selectedAsset ? `Chỉnh sửa tài sản [Mã SKU: ${formSku}]` : "Thêm mới tài sản thiết bị"}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">Nhập mã SKU tự quản lý, vị trí phòng & thông số khấu hao</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* SKU Code Input */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    Mã SKU tài sản<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: ML-DK-101"
                    value={formSku}
                    onChange={(e) => { setFormSku(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    Tên tài sản / Thiết bị <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Máy lạnh Daikin 1.5HP Inverter"
                    value={formName}
                    onChange={(e) => { setFormName(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Danh mục tài sản</label>
                  <select
                    value={formCategory}
                    onChange={(e) => { setFormCategory(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="Điện lạnh">Điện lạnh</option>
                    <option value="Nội thất">Nội thất</option>
                    <option value="Gia dụng">Gia dụng</option>
                    <option value="Điện nước">Điện nước</option>
                    <option value="An ninh">An ninh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Vị trí / Phòng lắp đặt</label>
                  <select
                    value={formRoom}
                    onChange={(e) => { setFormRoom(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="101">Phòng 101</option>
                    <option value="102">Phòng 102</option>
                    <option value="103">Phòng 103</option>
                    <option value="201">Phòng 201</option>
                    <option value="Kho">Kho chứa đồ</option>
                    <option value="Khu sinh hoạt chung">Khu sinh hoạt chung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Giá trị gốc ban đầu (VNĐ)</label>
                  <input
                    type="text"
                    placeholder="VD: 8.500.000 ₫"
                    value={formValue}
                    onChange={(e) => { setFormValue(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Ngày mua / Nhập bàn giao</label>
                  <input
                    type="text"
                    placeholder="VD: 10/01/2025"
                    value={formPurchaseDate}
                    onChange={(e) => { setFormPurchaseDate(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Thời gian khấu hao (Số năm)</label>
                  <select
                    value={formDepreciationYears}
                    onChange={(e) => { setFormDepreciationYears(Number(e.target.value)); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value={3}>3 năm (36 tháng)</option>
                    <option value={5}>5 năm (60 tháng)</option>
                    <option value={8}>8 năm (96 tháng)</option>
                    <option value={10}>10 năm (120 tháng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Trạng thái thiết bị</label>
                  <select
                    value={formStatus}
                    onChange={(e) => { setFormStatus(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="Đang sử dụng">Đang sử dụng</option>
                    <option value="Sẵn sàng">Sẵn sàng (Kho)</option>
                    <option value="Bảo trì">Đang bảo trì</option>
                    <option value="Hỏng hóc">Hỏng hóc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Mã Model</label>
                  <input
                    type="text"
                    placeholder="VD: FTKF35XVMV"
                    value={formModelCode}
                    onChange={(e) => { setFormModelCode(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Hạn bảo hành</label>
                  <input
                    type="text"
                    placeholder="VD: 12 tháng (đến 2027)"
                    value={formWarrantyPeriod}
                    onChange={(e) => { setFormWarrantyPeriod(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50">
              <button onClick={handleCloseModal} className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 cursor-pointer">
                Hủy bỏ
              </button>
              <button onClick={handleSaveAsset} className="px-5 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 cursor-pointer transition-all">
                Lưu tài sản
              </button>
            </div>
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
  confirmText = "Đồng ý",
  cancelText = "Hủy bỏ",
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
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-zinc-100 p-6 space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-200 mx-auto flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-zinc-900">{title}</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">{message}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
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
