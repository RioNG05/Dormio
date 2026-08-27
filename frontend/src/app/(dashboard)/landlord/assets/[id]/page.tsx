"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Package, Wrench, Calendar, Building2, Home, User,
  DollarSign, ShieldCheck, Tag, Plus, Edit3, Trash2, CheckCircle2,
  AlertTriangle, Clock, MapPin, FileText, ChevronRight, AlertCircle, Info,
  ChevronLeft, BarChart3, TrendingDown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Asset, initialMockAssets, MaintenanceLog, calculateDepreciation } from "../data";

// Mock Room Tenants dictionary for automatic tenant reflection when room changes
const mockRoomTenants: Record<string, { name: string; phone: string }> = {
  "101": { name: "Nguyễn Văn A", phone: "0901234567" },
  "102": { name: "Trần Thị B", phone: "0987654321" },
  "103": { name: "Lê Văn C", phone: "0912345678" },
  "105": { name: "Phạm Hoàng D", phone: "0909999888" },
  "201": { name: "Vũ Thị E", phone: "0933445566" },
  "202": { name: "Hoàng Văn F", phone: "0977889900" }
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { activeBuilding } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 2;

  // Building Code Prefix for Asset ID (e.g. DORMIO-Q1)
  const buildingPrefix = activeBuilding?.id ? activeBuilding.id.toUpperCase() : "DORMIO-Q1";

  // Maintenance Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logType, setLogType] = useState("Bảo dưỡng định kỳ");
  const [logDescription, setLogDescription] = useState("");
  const [logCost, setLogCost] = useState("200.000 ₫");
  const [logPerformer, setLogPerformer] = useState("");

  // Edit Asset Modal State (with SKU & Depreciation)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSku, setEditSku] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Điện lạnh");
  const [editRoom, setEditRoom] = useState("101");
  const [editPurchaseValue, setEditPurchaseValue] = useState("8.500.000 ₫");
  const [editPurchaseDate, setEditPurchaseDate] = useState("10/01/2024");
  const [editDepreciationYears, setEditDepreciationYears] = useState(5);
  const [editStatus, setEditStatus] = useState("Đang sử dụng");
  const [editModelCode, setEditModelCode] = useState("");
  const [editSerialNumber, setEditSerialNumber] = useState("");
  const [editWarrantyPeriod, setEditWarrantyPeriod] = useState("");
  const [editSupplier, setEditSupplier] = useState("");

  // Alert & Confirm Modals
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: "warning" | "error" | "success" | "info" }>({
    isOpen: false,
    title: "Thông báo",
    message: "",
    type: "info"
  });

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { }
  });

  const showAlert = (message: string, type: "warning" | "error" | "success" | "info" = "warning", title: string = "Thông báo") => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    if (id) {
      const found = initialMockAssets.find(a => a.id === id || a.id.toLowerCase() === String(id).toLowerCase() || a.sku === id);
      if (found) {
        setAsset(found);
        setMaintenanceLogs(found.maintenanceLogs || []);
      } else {
        setAsset({
          id: String(id),
          sku: "ML-DK-101",
          name: "Thiết bị tài sản #" + id,
          category: "Điện lạnh",
          building: "dormio",
          room: "101",
          status: "Đang sử dụng",
          dateAdded: "10/01/2024",
          purchaseDate: "10/01/2024",
          purchaseValue: 8500000,
          depreciationYears: 5,
          value: "8.500.000 ₫",
          numericValue: 8500000,
          modelCode: "MODEL-2026-X",
          serialNumber: "SN-99812-VN",
          warrantyPeriod: "24 tháng (đến 2028)",
          supplier: "Điện Máy Xanh",
          note: "",
          maintenanceLogs: []
        });
      }
    }
  }, [id]);

  if (!asset) {
    return (
      <div className="p-8 sm:p-12 text-center text-zinc-500">
        <Package className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 text-zinc-300 animate-pulse" />
        <p className="font-bold text-xs sm:text-sm">Đang tải thông tin tài sản...</p>
      </div>
    );
  }

  // Check if location is a tenant room (starts with numbers, P101, Phòng 101, etc.)
  const isTenantRoom = (roomStr: string) => {
    if (!roomStr) return false;
    const trimmed = roomStr.trim();
    return /^\d+$/.test(trimmed) || /^p\d+/i.test(trimmed) || /^phòng\s*\d+/i.test(trimmed);
  };

  const hasRoomLink = isTenantRoom(asset.room);
  const currentTenant = mockRoomTenants[asset.room] || { name: "Nguyễn Văn A", phone: "0901234567" };
  const dep = calculateDepreciation(asset);

  // Pagination calculation for Maintenance Logs
  const totalLogPages = Math.ceil(maintenanceLogs.length / logsPerPage) || 1;
  const paginatedLogs = maintenanceLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);

  const handleOpenEditModal = () => {
    setEditSku(asset.sku || asset.id);
    setEditName(asset.name);
    setEditCategory(asset.category);
    setEditRoom(asset.room);
    setEditPurchaseValue(asset.value);
    setEditPurchaseDate(asset.purchaseDate || asset.dateAdded || "10/01/2024");
    setEditDepreciationYears(asset.depreciationYears || 5);
    setEditStatus(asset.status);
    setEditModelCode(asset.modelCode || "");
    setEditSerialNumber(asset.serialNumber || "");
    setEditWarrantyPeriod(asset.warrantyPeriod || "");
    setEditSupplier(asset.supplier || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEditAsset = () => {
    if (!editName.trim()) {
      showAlert("Vui lòng nhập Tên tài sản!", "warning", "Thiếu thông tin");
      return;
    }
    if (!editSku.trim()) {
      showAlert("Vui lòng nhập Mã SKU cho tài sản!", "warning", "Thiếu thông tin");
      return;
    }

    const numVal = parseInt(editPurchaseValue.replace(/\D/g, "")) || 0;
    const formattedVal = numVal > 0 ? `${numVal.toLocaleString("vi-VN")} ₫` : editPurchaseValue;
    const cleanSku = editSku.trim().toUpperCase();
    const generatedId = `${buildingPrefix}-${cleanSku}`;

    setAsset(prev => prev ? {
      ...prev,
      id: generatedId,
      sku: cleanSku,
      name: editName.trim(),
      category: editCategory,
      room: editRoom,
      value: formattedVal,
      numericValue: numVal,
      purchaseValue: numVal,
      purchaseDate: editPurchaseDate,
      depreciationYears: Number(editDepreciationYears) || 5,
      status: editStatus,
      modelCode: editModelCode.trim(),
      serialNumber: editSerialNumber.trim(),
      warrantyPeriod: editWarrantyPeriod.trim(),
      supplier: editSupplier.trim()
    } : null);

    setIsEditModalOpen(false);
    showAlert("Đã cập nhật thông tin SKU, vị trí & khấu hao tài sản thành công!", "success", "Cập nhật thành công");
  };

  const handleAddMaintenanceLog = () => {
    if (!logDescription.trim()) {
      showAlert("Vui lòng nhập chi tiết công việc bảo trì!", "warning", "Thiếu thông tin");
      return;
    }

    const newLog: MaintenanceLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString("vi-VN"),
      type: logType,
      description: logDescription.trim(),
      cost: logCost.trim() || "0 ₫",
      performer: logPerformer.trim() || "Kỹ thuật viên"
    };

    setMaintenanceLogs(prev => [newLog, ...prev]);
    setLogPage(1); // Reset to page 1 to view newly added log
    setIsLogModalOpen(false);
    setLogDescription("");
    setLogPerformer("");
    showAlert("Đã ghi nhận nhật ký bảo trì mới!", "success", "Ghi nhận thành công");
  };

  const handleStatusChange = (newStatus: string) => {
    setAsset(prev => prev ? { ...prev, status: newStatus } : null);
    showAlert(`Đã cập nhật trạng thái tài sản thành: ${newStatus}`, "success", "Cập nhật trạng thái");
  };

  const handleDeleteAsset = () => {
    setConfirmModal({
      isOpen: true,
      title: "Xác nhận xóa tài sản",
      message: `Bạn có chắc chắn muốn xóa tài sản [${asset.name}] khỏi hệ thống? Hành động này không thể hoàn tác.`,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showAlert("Đã xóa tài sản thành công!", "success", "Đã xóa");
        setTimeout(() => router.push("/landlord/assets"), 1000);
      }
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-zinc-500 flex-wrap">
        <Link href="/landlord/assets" className="hover:text-[#2AC1BC] flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Danh sách tài sản
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
        <span className="text-zinc-900 font-extrabold truncate">{asset.name} (SKU: {asset.sku || asset.id})</span>
      </div>

      {/* Main Asset Header Card (With Sub-bar for Location & Tenant right under Title) */}
      <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-orange-50 border border-orange-200/80 text-[#FF6B35] flex items-center justify-center shrink-0 shadow-2xs">
            <Package className="w-6 sm:w-8 h-6 sm:h-8" />
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
                {asset.category}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-[#2AC1BC] bg-[#2AC1BC]/10 px-2 py-0.5 rounded-md border border-[#2AC1BC]/30">
                SKU: {asset.sku || asset.id}
              </span>
              <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold border ${asset.status === 'Đang sử dụng' ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30' :
                  asset.status === 'Sẵn sàng' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    asset.status === 'Bảo trì' ? 'bg-orange-50 text-[#FF6B35] border-orange-200 animate-pulse' :
                      'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                {asset.status}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-snug">{asset.name}</h1>

            {/* LOCATION & TENANT SUB-BAR DIRECTLY UNDER TITLE */}
            <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold text-zinc-600 pt-2 border-t border-zinc-100">
              <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200/80">
                <Home className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                <span>Vị trí lắp đặt: <strong className="text-zinc-900">{hasRoomLink ? `Phòng ${asset.room}` : asset.room}</strong></span>
                {hasRoomLink && (
                  <Link href={`/landlord/rooms?id=${asset.room}`} className="ml-1 text-[#2AC1BC] hover:underline font-bold">
                    [Xem phòng &rarr;]
                  </Link>
                )}
              </div>

              {hasRoomLink && (
                <div className="flex items-center gap-1.5 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200/80">
                  <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Khách thuê phòng: <strong className="text-zinc-900">{currentTenant.name}</strong> ({currentTenant.phone})</span>
                  <Link href="/landlord/customers" className="ml-1 text-emerald-700 hover:underline font-bold">
                    [Hồ sơ &rarr;]
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
          <button
            onClick={() => handleStatusChange(asset.status === "Bảo trì" ? "Đang sử dụng" : "Bảo trì")}
            className="px-3 sm:px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Wrench className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-600" /> {asset.status === "Bảo trì" ? "Hoàn tất bảo trì" : "Báo bảo trì"}
          </button>
          <button
            onClick={handleOpenEditModal}
            className="px-3 sm:px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#2AC1BC]" /> Chỉnh sửa
          </button>
          <button
            onClick={handleDeleteAsset}
            className="px-3 sm:px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> Xóa
          </button>
        </div>
      </div>

      {/* Grid Layout Details (Items-stretch so both columns are ALWAYS 100% equal in height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Left Column (7 Cols on desktop: Info + Valuation) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 sm:space-y-6">
          {/* General Information Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
              <Info className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#2AC1BC]" />
              <h2 className="text-sm sm:text-base font-black text-zinc-900">Thông tin chi tiết tài sản</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="p-3 sm:p-3.5 bg-zinc-50 rounded-2xl space-y-1">
                <span className="text-zinc-400 font-medium block">Mã Model / Kiểu dáng</span>
                <span className="font-bold text-zinc-800">{asset.modelCode || "— Chưa cập nhật"}</span>
              </div>
              <div className="p-3 sm:p-3.5 bg-zinc-50 rounded-2xl space-y-1">
                <span className="text-zinc-400 font-medium block">Số Serial máy</span>
                <span className="font-bold text-zinc-800">{asset.serialNumber || "— Chưa cập nhật"}</span>
              </div>
              <div className="p-3 sm:p-3.5 bg-zinc-50 rounded-2xl space-y-1">
                <span className="text-zinc-400 font-medium block">Ngày mua / Nhập bàn giao</span>
                <span className="font-bold text-zinc-800">{asset.purchaseDate || asset.dateAdded}</span>
              </div>
              <div className="p-3 sm:p-3.5 bg-zinc-50 rounded-2xl space-y-1">
                <span className="text-zinc-400 font-medium block">Hạn bảo hành nhà sản xuất</span>
                <span className="font-bold text-emerald-700">{asset.warrantyPeriod || "12 tháng"}</span>
              </div>
            </div>
          </div>

          {/* REAL-WORLD LINEAR DEPRECIATION VALUATION CARD */}
          <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-emerald-600" />
                  <h2 className="text-sm sm:text-base font-black text-zinc-900">Định giá & Khấu hao tài sản</h2>
                </div>
                <span className="text-[10px] font-black text-zinc-500 bg-zinc-100 px-2 py-1 rounded-lg">
                  Thời gian sử dụng: {asset.depreciationYears || 5} năm ({dep.totalMonths} tháng)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
                <div className="p-3.5 sm:p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-1">
                  <span className="text-emerald-700 font-medium block">Giá trị ban đầu (Giá gốc)</span>
                  <span className="font-black text-emerald-900 text-base sm:text-lg">{asset.value}</span>
                  <span className="text-[10px] text-emerald-700 font-medium block">Ngày mua: {asset.purchaseDate || asset.dateAdded}</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-1">
                  <span className="text-amber-700 font-medium block">Khấu hao lũy kế ({dep.depreciatedPercent}%)</span>
                  <span className="font-black text-amber-900 text-base sm:text-lg">
                    - {dep.accumulatedDepreciation.toLocaleString("vi-VN")} ₫
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium block">Đã dùng: {dep.monthsUsed} / {dep.totalMonths} tháng</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl space-y-1">
                  <span className="text-blue-700 font-medium block">Giá trị ước tính hiện tại ({dep.remainingPercent}%)</span>
                  <span className="font-black text-blue-900 text-base sm:text-lg">
                    {dep.currentValue.toLocaleString("vi-VN")} ₫
                  </span>
                  <span className="text-[10px] text-blue-700 font-medium block">Khấu hao ~{Math.round(dep.monthlyDepreciation).toLocaleString("vi-VN")} ₫/tháng</span>
                </div>
              </div>
            </div>

            {/* VISUAL DEPRECIATION PROGRESS BAR */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-extrabold text-zinc-700">
                <span>Tỷ lệ giá trị còn lại ({dep.remainingPercent}%)</span>
                <span className="text-amber-600">Đã khấu hao {dep.depreciatedPercent}%</span>
              </div>
              <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden flex p-0.5 border border-zinc-200">
                <div
                  style={{ width: `${dep.remainingPercent}%` }}
                  className="h-full bg-[#2AC1BC] rounded-full transition-all duration-500 shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols on desktop: Always 100% equal height with Left Column) */}
        <div className="lg:col-span-5 flex flex-col">
          {/* Maintenance Logs Section */}
          <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-amber-500 shrink-0" />
                  <h2 className="text-sm sm:text-base font-black text-zinc-900">Nhật ký bảo trì & Sửa chữa</h2>
                </div>
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="px-3 py-1.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm nhật ký
                </button>
              </div>

              {maintenanceLogs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400 text-xs space-y-2.5 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200/80 flex items-center justify-center shadow-2xs">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-extrabold text-zinc-800 text-sm">Chưa có lịch sử bảo trì</p>
                    <p className="text-xs text-zinc-400 font-medium max-w-xs mx-auto mt-1">
                      Ấn nút "+ Thêm nhật ký" để lưu thông tin vệ sinh, bơm gas hoặc sửa chữa định kỳ.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1 max-h-[340px] sm:max-h-[370px]">
                  {maintenanceLogs.map(log => (
                    <div key={log.id} className="p-3.5 sm:p-4 bg-zinc-50 rounded-2xl border border-zinc-200/60 space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-extrabold text-[10px]">
                            {log.type}
                          </span>
                          <span className="text-zinc-400 font-medium text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-400 inline shrink-0" /> {log.date}
                          </span>
                        </div>
                        <span className="font-black text-emerald-600 text-xs sm:text-sm bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 shrink-0">
                          {log.cost}
                        </span>
                      </div>

                      <p className="font-bold text-zinc-800 leading-relaxed text-xs sm:text-sm break-words">
                        {log.description}
                      </p>

                      <div className="text-[11px] text-zinc-400 font-medium pt-1.5 border-t border-zinc-200/50 flex items-center justify-between">
                        <span>Người thực hiện: <strong className="text-zinc-700">{log.performer}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT ASSET MODAL WITH SKU & DEPRECIATION PARAMETERS */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col max-h-[90vh]">
            <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 text-[#FF6B35] rounded-xl">
                  <Edit3 className="w-5 h-5 text-[#2AC1BC]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-zinc-900">
                    Chỉnh sửa thông tin tài sản [Mã SKU: {editSku}]
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">Cập nhật mã SKU tự quản lý, vị trí phòng & thông số khấu hao</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* SKU Code Input */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Mã SKU (Chủ trọ tự quản lý) *</label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Tên tài sản / Thiết bị *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Danh mục tài sản</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
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
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="101">Phòng 101 (Khách: Nguyễn Văn A)</option>
                    <option value="102">Phòng 102 (Khách: Trần Thị B)</option>
                    <option value="103">Phòng 103 (Khách: Lê Văn C)</option>
                    <option value="105">Phòng 105 (Khách: Phạm Hoàng D)</option>
                    <option value="201">Phòng 201 (Khách: Vũ Thị E)</option>
                    <option value="Kho">Kho chứa đồ (Không có khách)</option>
                    <option value="Khu sinh hoạt chung">Khu sinh hoạt chung (Không có khách)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Giá gốc ban đầu (VNĐ)</label>
                  <input
                    type="text"
                    value={editPurchaseValue}
                    onChange={(e) => setEditPurchaseValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Ngày mua / Nhập bàn giao</label>
                  <input
                    type="text"
                    placeholder="VD: 10/01/2024"
                    value={editPurchaseDate}
                    onChange={(e) => setEditPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Thời gian khấu hao (Số năm)</label>
                  <select
                    value={editDepreciationYears}
                    onChange={(e) => setEditDepreciationYears(Number(e.target.value))}
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
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
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
                    value={editModelCode}
                    onChange={(e) => setEditModelCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">Hạn bảo hành</label>
                  <input
                    type="text"
                    value={editWarrantyPeriod}
                    onChange={(e) => setEditWarrantyPeriod(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 cursor-pointer">
                Hủy bỏ
              </button>
              <button onClick={handleSaveEditAsset} className="px-5 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 cursor-pointer transition-all">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAINTENANCE LOG MODAL */}
      {isLogModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsLogModalOpen(false); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-base text-zinc-900">Ghi nhận nhật ký bảo trì</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-zinc-700 mb-1">Loại công việc</label>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  className="w-full px-3 py-2 font-semibold border border-zinc-200 rounded-xl outline-none"
                >
                  <option value="Bảo dưỡng định kỳ">Bảo dưỡng định kỳ</option>
                  <option value="Sửa chữa linh kiện">Sửa chữa linh kiện</option>
                  <option value="Vệ sinh & Nạp gas">Vệ sinh & Nạp gas</option>
                  <option value="Thay thế mới">Thay thế mới</option>
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-zinc-700 mb-1">Mô tả công việc <span className="text-rose-500">*</span></label>
                <textarea
                  rows={2}
                  placeholder="VD: Kiểm tra và nạp thêm 0.5kg gas R32..."
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  className="w-full px-3 py-2 font-semibold border border-zinc-200 rounded-xl outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-zinc-700 mb-1">Chi phí thực hiện (VNĐ)</label>
                <input
                  type="text"
                  placeholder="VD: 250.000 ₫"
                  value={logCost}
                  onChange={(e) => setLogCost(e.target.value)}
                  className="w-full px-3 py-2 font-semibold border border-zinc-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-zinc-700 mb-1">Người / Đơn vị thực hiện</label>
                <input
                  type="text"
                  placeholder="VD: Thợ điện lạnh Tuấn"
                  value={logPerformer}
                  onChange={(e) => setLogPerformer(e.target.value)}
                  className="w-full px-3 py-2 font-semibold border border-zinc-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setIsLogModalOpen(false)} className="px-4 py-2 font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl cursor-pointer">
                Hủy
              </button>
              <button onClick={handleAddMaintenanceLog} className="px-4 py-2 font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 cursor-pointer transition-all">
                Lưu nhật ký
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

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-zinc-100 p-6 space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-200 mx-auto flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-zinc-900">{title}</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">{message}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button onClick={onCancel} className="px-4 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100">
            Hủy bỏ
          </button>
          <button onClick={onConfirm} className="px-4 py-2.5 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20">
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertModal({ isOpen, title, message, type = "info", onClose }: { isOpen: boolean; title: string; message: string; type?: "warning" | "error" | "success" | "info"; onClose: () => void; }) {
  if (!isOpen) return null;
  const config = {
    warning: { bgColor: "bg-amber-500/10 text-amber-600 border-amber-200", icon: <AlertTriangle className="w-7 h-7 text-amber-500" />, btnColor: "bg-amber-500 text-white" },
    error: { bgColor: "bg-rose-500/10 text-rose-600 border-rose-200", icon: <AlertCircle className="w-7 h-7 text-rose-500" />, btnColor: "bg-rose-500 text-white" },
    success: { bgColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />, btnColor: "bg-emerald-500 text-white" },
    info: { bgColor: "bg-orange-50 text-[#FF6B35] border-orange-200", icon: <Info className="w-7 h-7 text-[#FF6B35]" />, btnColor: "bg-[#FF6B35] text-white" }
  }[type];

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 p-6 space-y-4 text-center">
        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${config.bgColor}`}>
          {config.icon}
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-zinc-900">{title}</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">{message}</p>
        </div>
        <button onClick={onClose} className={`w-full py-2.5 text-xs font-black rounded-xl transition-all shadow-md ${config.btnColor}`}>
          Đã hiểu
        </button>
      </div>
    </div>
  );
}
