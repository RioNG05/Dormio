"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, Home, User, FileSignature, Receipt,
  Gauge, Banknote, Sparkles, Wrench, X, ChevronDown,
  AlertTriangle, Eye, History, Wallet, Plus, Upload, RefreshCw, Filter, Building2, AlertCircle
} from "lucide-react";
import { getRoomById, defaultRoomServices, Room } from "../data";

interface MeterHistoryRecord {
  period: string;       // "Tháng 09/2026"
  date: string;         // "01/09/2026 08:00"
  oldElec: number;
  newElec: number;
  oldWater: number;
  newWater: number;
  editReason?: string;
  editedAt?: string;
  isOpen?: boolean;
}

interface InvoiceRecord {
  id: string;           // "INV-202609-401"
  period: string;       // "Tháng 09/2026"
  monthSeq: string;     // "09/26"
  deadline: string;
  status: "Chưa thanh toán" | "Đã thu";
  method: string;
  isOverdue?: boolean;
  editReason?: string;
  editedAt?: string;
}

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Modals & form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState("");

  // Filter state for Month/Year
  const [selectedFilterPeriod, setSelectedFilterPeriod] = useState<string>("all");

  // Room Edit Form states
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editFloor, setEditFloor] = useState("");
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editServices, setEditServices] = useState([
    { id: 'bao_ve', name: 'Bảo vệ', defaultPrice: '50.000', customPrice: '60.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 'dien', name: 'Điện', defaultPrice: '3.500', customPrice: '3.500', unit: 'đ/kWh', isCustom: true, isRemovable: false },
    { id: 'nuoc', name: 'Nước', defaultPrice: '25.000', customPrice: '25.000', unit: 'đ/m³', isCustom: true, isRemovable: false },
    { id: 'rac', name: 'Rác', defaultPrice: '20.000', customPrice: '20.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 've_sinh', name: 'Vệ sinh', defaultPrice: '30.000', customPrice: '30.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 'wifi', name: 'Wifi', defaultPrice: '100.000', customPrice: '100.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
  ]);

  // Meter modal input states
  const [selectedMonth, setSelectedMonth] = useState("Tháng 8");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [formElec, setFormElec] = useState("1428");
  const [formWater, setFormWater] = useState("45");

  // Meter Readings History Data
  const [meterHistory, setMeterHistory] = useState<MeterHistoryRecord[]>([
    { period: "Tháng 09/2026", date: "01/09/2026 08:00", oldElec: 1428, newElec: 1530, oldWater: 45, newWater: 49, isOpen: true },
    { period: "Tháng 08/2026", date: "01/08/2026 08:30", oldElec: 1318, newElec: 1428, oldWater: 42, newWater: 45, isOpen: false },
    { period: "Tháng 07/2026", date: "01/07/2026 09:15", oldElec: 1210, newElec: 1318, oldWater: 38, newWater: 42, isOpen: false },
    { period: "Tháng 06/2026", date: "01/06/2026 08:10", oldElec: 1100, newElec: 1210, oldWater: 34, newWater: 38, isOpen: false },
    { period: "Tháng 05/2026", date: "01/05/2026 08:45", oldElec: 990, newElec: 1100, oldWater: 30, newWater: 34, isOpen: false },
    { period: "Tháng 04/2026", date: "01/04/2026 09:00", oldElec: 880, newElec: 990, oldWater: 26, newWater: 30, isOpen: false }
  ]);

  // Invoices History List
  const [invoicesHistory, setInvoicesHistory] = useState<InvoiceRecord[]>([
    { id: "INV-202609", period: "Tháng 09/2026", monthSeq: "09/26", deadline: "10/09/2026 (Quá hạn 5 ngày)", status: "Chưa thanh toán", method: "Chưa thu", isOverdue: true },
    { id: "INV-202608", period: "Tháng 08/2026", monthSeq: "08/26", deadline: "10/08/2026", status: "Đã thu", method: "VietQR Auto", isOverdue: false },
    { id: "INV-202607", period: "Tháng 07/2026", monthSeq: "07/26", deadline: "10/07/2026", status: "Đã thu", method: "VietQR Auto", isOverdue: false },
    { id: "INV-202606", period: "Tháng 06/2026", monthSeq: "06/26", deadline: "10/06/2026", status: "Đã thu", method: "VietQR Auto", isOverdue: false },
    { id: "INV-202605", period: "Tháng 05/2026", monthSeq: "05/26", deadline: "10/05/2026", status: "Đã thu", method: "VietQR Auto", isOverdue: false },
    { id: "INV-202604", period: "Tháng 04/2026", monthSeq: "04/26", deadline: "10/04/2026", status: "Đã thu", method: "VietQR Auto", isOverdue: false }
  ]);

  // Maintenance History List & Pagination
  interface MaintenanceRecord {
    id: string;
    title: string;
    description?: string;
    reportDate: string;
    status: "Đang xử lý" | "Đã xong";
    priority: "Mức độ cao" | "Mức độ trung bình" | "Mức độ nhẹ";
    completedDate?: string;
  }

  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([
    { id: "M1", title: "Hỏng máy lạnh (Chảy nước)", description: "Máy lạnh tầng 4 chảy tràn nước ra sàn phòng ngủ", reportDate: "25/08/2026", status: "Đang xử lý", priority: "Mức độ cao" },
    { id: "M2", title: "Thay bóng đèn nhà vệ sinh", description: "Bóng đèn led 12W bị cháy cần thay mới", reportDate: "10/07/2026", completedDate: "12/07/2026", status: "Đã xong", priority: "Mức độ nhẹ" },
    { id: "M3", title: "Sửa vòi nước bồn rửa chén rỉ nước", reportDate: "05/05/2026", completedDate: "06/05/2026", status: "Đã xong", priority: "Mức độ trung bình" },
    { id: "M4", title: "Bảo dưỡng máy giặt định kỳ", reportDate: "15/03/2026", completedDate: "15/03/2026", status: "Đã xong", priority: "Mức độ nhẹ" },
    { id: "M5", title: "Sửa khoá cửa vân tay phòng", reportDate: "10/01/2026", completedDate: "11/01/2026", status: "Đã xong", priority: "Mức độ cao" }
  ]);
  const [maintPage, setMaintPage] = useState(1);
  const MAINT_PER_PAGE = 2;

  const [incidentTitleInput, setIncidentTitleInput] = useState("");
  const [incidentDescInput, setIncidentDescInput] = useState("");
  const [incidentPriorityInput, setIncidentPriorityInput] = useState<"Mức độ cao" | "Mức độ trung bình" | "Mức độ nhẹ">("Mức độ trung bình");

  const handleCreateIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitleInput.trim()) {
      showToast("Vui lòng nhập tên sự cố!", "error");
      return;
    }
    const todayStr = new Date().toLocaleDateString("vi-VN");

    const newRecord: MaintenanceRecord = {
      id: `M_${Date.now()}`,
      title: incidentTitleInput.trim(),
      description: incidentDescInput.trim() || undefined,
      reportDate: todayStr,
      status: "Đang xử lý",
      priority: incidentPriorityInput
    };
    setMaintenanceHistory(prev => [newRecord, ...prev]);
    setIncidentTitleInput("");
    setIncidentDescInput("");
    setIncidentPriorityInput("Mức độ trung bình");
    setIsIncidentModalOpen(false);
    showToast("Đã tạo báo cáo sự cố bảo trì mới thành công!", "success");
  };

  // Helper for restricted Meter month & year selection (current & next month only)
  const getAvailableMeterPeriods = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1 to 12
    const currentYear = now.getFullYear();

    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const monthOptions = [
      { label: `Tháng ${currentMonth}`, value: `Tháng ${currentMonth}` },
      { label: `Tháng ${nextMonth}`, value: `Tháng ${nextMonth}` }
    ];

    const yearOptions = Array.from(new Set([currentYear.toString(), nextMonthYear.toString()]));

    return { monthOptions, yearOptions };
  };

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Pagination states
  const ITEMS_PER_PAGE = 2;
  const [invoicePage, setInvoicePage] = useState(1);
  const [meterPage, setMeterPage] = useState(1);

  // Meter Correction Modal State
  const [correctModal, setCorrectModal] = useState<{
    isOpen: boolean;
    period: string;
    oldElec: number;
    newElec: number;
    oldWater: number;
    newWater: number;
    reason: string;
    error: string;
  }>({
    isOpen: false,
    period: "",
    oldElec: 0,
    newElec: 0,
    oldWater: 0,
    newWater: 0,
    reason: "",
    error: ""
  });

  useEffect(() => {
    setIsMounted(true);
    if (resolvedParams.id) {
      const found = getRoomById(resolvedParams.id);
      setRoom(found);
      if (found) {
        setEditRoomNumber(found.roomNumber);
        setEditPrice(found.price || "3.000.000 ₫");
        setEditArea(found.area || "25");
        setEditFloor(found.floor || "1");
        setEditAmenities(found.amenities || ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng']);
        setEditNotes(found.notes || "");
      }
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    setInvoicePage(1);
    setMeterPage(1);
  }, [selectedFilterPeriod]);

  if (!isMounted) return null;

  if (!room) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 my-6">
        <p className="font-bold text-lg mb-2 text-zinc-800">Không tìm thấy thông tin phòng</p>
        <p className="text-xs text-zinc-500 mb-4">Mã phòng: {resolvedParams.id}</p>
        <Link
          href="/landlord/rooms"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2AC1BC] text-white text-xs font-bold rounded-xl hover:bg-[#25ad87] transition-colors"
        >
          &larr; Quay lại danh sách phòng
        </Link>
      </div>
    );
  }

  const isOccupied = room.status === 'Đang thuê';
  const isVacant = room.status === 'Trống';
  const isMaintenance = room.status === 'Bảo trì';
  const isReserved = room.status === 'Đặt cọc';

  // Base constants for financial logic
  const roomRentNum = parseInt((room.price || "3000000").replace(/\D/g, '')) || 3000000;
  // Fixed services sum: Bảo vệ (60k) + Wifi (100k) + Rác (20k) + Vệ sinh (30k) = 210.000 ₫
  const fixedServicesTotal = 210000;
  const elecUnitPrice = 3500;
  const waterUnitPrice = 25000;

  // Compute calculated values for any meter record
  const computeRecordFinancials = (m: MeterHistoryRecord) => {
    const elecUse = Math.max(0, m.newElec - m.oldElec);
    const elecCost = elecUse * elecUnitPrice;
    const waterUse = Math.max(0, m.newWater - m.oldWater);
    const waterCost = waterUse * waterUnitPrice;
    const meterTotal = elecCost + waterCost;
    const grandInvoiceTotal = roomRentNum + fixedServicesTotal + meterTotal;

    return {
      elecUse,
      elecCost,
      waterUse,
      waterCost,
      meterTotal,
      grandInvoiceTotal
    };
  };

  // Open correction modal for a specific period
  const handleOpenCorrectionModal = (record: MeterHistoryRecord) => {
    setCorrectModal({
      isOpen: true,
      period: record.period,
      oldElec: record.oldElec,
      newElec: record.newElec,
      oldWater: record.oldWater,
      newWater: record.newWater,
      reason: "",
      error: ""
    });
  };

  // Save correction action with mandatory reason check
  const handleSaveCorrection = () => {
    if (!correctModal.reason.trim()) {
      setCorrectModal(prev => ({ ...prev, error: "Vui lòng điền lý do điều chỉnh chỉ số (Bắt buộc)" }));
      return;
    }

    const nowStr = new Date().toLocaleString('vi-VN');

    // Update meter history
    setMeterHistory(prev => prev.map(item => {
      if (item.period === correctModal.period) {
        return {
          ...item,
          newElec: Number(correctModal.newElec),
          newWater: Number(correctModal.newWater),
          editReason: correctModal.reason,
          editedAt: nowStr
        };
      }
      return item;
    }));

    // Update invoice record with editReason tag
    setInvoicesHistory(prev => prev.map(inv => {
      if (inv.period === correctModal.period) {
        return {
          ...inv,
          editReason: correctModal.reason,
          editedAt: nowStr
        };
      }
      return inv;
    }));

    setCorrectModal(prev => ({ ...prev, isOpen: false }));
  };

  // Simulate AI OCR scanning
  const handleSimulateAiOcr = () => {
    setIsOcrScanning(true);
    setOcrSuccessMsg("");
    setTimeout(() => {
      setFormElec("1530");
      setFormWater("49");
      setIsOcrScanning(false);
      setOcrSuccessMsg("✓ AI đã quét số điện nước: Điện 1530 kWh, Nước 49 m³");
    }, 800);
  };

  // Save new meter reading from main modal
  const handleSaveNewMeterReading = () => {
    const periodFull = `Tháng ${selectedMonth.replace('Tháng ', '').padStart(2, '0')}/${selectedYear}`;
    const nowStr = new Date().toLocaleString('vi-VN');

    const lastRecord = meterHistory[0] || { newElec: 1428, newWater: 45 };

    const newRecord: MeterHistoryRecord = {
      period: periodFull,
      date: nowStr,
      oldElec: lastRecord.newElec,
      newElec: parseInt(formElec) || lastRecord.newElec,
      oldWater: lastRecord.newWater,
      newWater: parseInt(formWater) || lastRecord.newWater,
      isOpen: true
    };

    setMeterHistory(prev => [newRecord, ...prev.filter(p => p.period !== periodFull)]);
    setIsMeterModalOpen(false);
  };

  // Filtered meter records and invoices based on selected Filter Period
  const filteredMeterHistory = meterHistory.filter(m => selectedFilterPeriod === "all" || m.period === selectedFilterPeriod);
  const filteredInvoices = invoicesHistory.filter(inv => selectedFilterPeriod === "all" || inv.period === selectedFilterPeriod);

  const totalInvoicePages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvoices = filteredInvoices.slice((invoicePage - 1) * ITEMS_PER_PAGE, invoicePage * ITEMS_PER_PAGE);

  const totalMeterPages = Math.ceil(filteredMeterHistory.length / ITEMS_PER_PAGE) || 1;
  const paginatedMeterHistory = filteredMeterHistory.slice((meterPage - 1) * ITEMS_PER_PAGE, meterPage * ITEMS_PER_PAGE);

  // Get current unpaid invoice if available
  const unpaidInvoice = invoicesHistory.find(i => i.status === "Chưa thanh toán");
  const unpaidRecord = unpaidInvoice ? meterHistory.find(m => m.period === unpaidInvoice.period) : null;
  const unpaidFinancials = unpaidRecord ? computeRecordFinancials(unpaidRecord) : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/landlord/rooms"
            className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách phòng"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Phòng {room.roomNumber}</h1>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 sm:py-1 rounded-full border shrink-0 ${isOccupied ? 'text-[#2AC1BC] bg-[#2AC1BC]/10 border-[#2AC1BC]/30' :
              isMaintenance ? 'text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30' :
                isReserved ? 'text-purple-600 bg-purple-500/10 border-purple-500/30' :
                  isVacant ? 'text-blue-600 bg-blue-500/10 border-blue-500/30' :
                    'text-zinc-500 bg-zinc-100 border-zinc-200'
              }`}>
              {room.status}
            </span>
            <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-zinc-200/80 truncate max-w-[170px] sm:max-w-none">
              {room.building === 'b2' ? 'Dormio Campus Cầu Giấy' : 'Dormio Premier Quận 1'}
            </span>
            <span className="text-[11px] font-bold text-zinc-400">Mã ID: {room.id}</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
          {isOccupied && (
            <button
              onClick={() => setIsMeterModalOpen(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Gauge className="w-3.5 h-3.5" /> Chốt Điện Nước
            </button>
          )}

          {isOccupied ? (
            <Link
              href={`/landlord/contracts/HD-01012026-${room.building === 'b2' ? 2 : 1}-${room.roomNumber}`}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 text-purple-600" /> Hợp Đồng
            </Link>
          ) : (
            <button
              onClick={() => setIsContractModalOpen(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileSignature className="w-3.5 h-3.5 text-[#2AC1BC]" /> Tạo Hợp Đồng
            </button>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Edit className="w-3.5 h-3.5 text-[#2AC1BC]" /> Sửa
          </button>

          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Xóa phòng',
                message: `Bạn có chắc chắn muốn xóa phòng ${room.roomNumber} này không? Các dữ liệu liên quan sẽ bị xóa!`,
                onConfirm: () => {
                  router.push('/landlord/rooms');
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
              });
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Main Column */}
        <div className="xl:col-span-2 space-y-6">

          {/* SPOTLIGHT TENANT PROFILE CARD */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-zinc-100">
              <h2 className="font-black text-zinc-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#2AC1BC]" /> Khách Thuê Hiện Tại
              </h2>
              {isOccupied && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Sửa thông tin
                </button>
              )}
            </div>

            <div className="p-3.5 sm:p-5">
              {room.tenant ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 bg-[#2AC1BC]/5 rounded-2xl border border-[#2AC1BC]/20">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2AC1BC] text-white font-black text-base sm:text-lg flex items-center justify-center shadow-md shrink-0">
                      {room.tenant.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-zinc-900">{room.tenant}</h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold text-zinc-500 mt-0.5">
                        <span>SDT: {room.tenantPhone || '0977815704'}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>CCCD: {room.tenantCccd || '00109313040168'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <a
                      href={`tel:${room.tenantPhone || '0977815704'}`}
                      className="px-3 py-1.5 bg-red-600 text-white border border-zinc-200 rounded-xl text-xs font-bold hover:bg-red-500 transition-colors shadow-2xs text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Gọi ngay
                    </a>
                    <Link
                      href={`/landlord/customers/${room.tenantCccd || '00109313040168'}`}
                      className="px-3.5 py-1.5 bg-[#2AC1BC] text-white rounded-xl text-xs font-bold hover:bg-[#25ad87] transition-all shadow-xs text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Hồ sơ
                    </Link>
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

          {/* GLOBAL FILTER BAR FOR MONTH/YEAR */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-800">
              <Filter className="w-4 h-4 text-[#2AC1BC]" />
              <span>BỘ LỌC LỊCH SỬ THÁNG / NĂM:</span>
            </div>
            <div className="relative w-full sm:w-64">
              <select
                value={selectedFilterPeriod}
                onChange={(e) => setSelectedFilterPeriod(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer appearance-none"
              >
                <option value="all">Tất cả các tháng</option>
                <option value="Tháng 09/2026">Tháng 09/2026 (Hiện tại)</option>
                <option value="Tháng 08/2026">Tháng 08/2026</option>
                <option value="Tháng 07/2026">Tháng 07/2026</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* SECTION 1: HÓA ĐƠN & CÔNG NỢ (Tự động tính tiền = Phòng + Dịch Vụ + Điện + Nước) */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-3.5 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <h2 className="font-black text-zinc-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#2AC1BC]" /> Hóa Đơn & Công Nợ
              </h2>
              {unpaidInvoice && unpaidFinancials && (
                <span className="self-start sm:self-auto px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-black animate-pulse">
                  Còn 1 Hóa Đơn Chưa Thu ({unpaidFinancials.grandInvoiceTotal.toLocaleString('vi-VN')} ₫)
                </span>
              )}
            </div>

            <div className="space-y-3">
              {filteredInvoices.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-400 font-bold bg-zinc-50 rounded-xl">
                  Không tìm thấy hóa đơn nào trong kỳ lọc đã chọn.
                </div>
              ) : paginatedInvoices.map((inv) => {
                const rec = meterHistory.find(m => m.period === inv.period) || {
                  period: inv.period,
                  date: "",
                  oldElec: 0,
                  newElec: 0,
                  oldWater: 0,
                  newWater: 0
                };
                const fin = computeRecordFinancials(rec);
                const isUnpaid = inv.status === "Chưa thanh toán";

                return (
                  <div
                    key={inv.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${isUnpaid ? 'bg-rose-500/5 border-rose-500/30' : 'bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100/60'
                      }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 sm:p-2.5 text-white rounded-xl font-black text-xs shadow-xs shrink-0 ${isUnpaid ? 'bg-rose-500' : 'bg-[#2AC1BC]'}`}>
                          {inv.monthSeq}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-xs font-black text-zinc-900">{inv.id}-{room.roomNumber}</span>
                            <span className={`text-[10px] font-bold ${isUnpaid ? 'text-rose-600' : 'text-zinc-500'}`}>({inv.period})</span>
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${isUnpaid ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {isUnpaid ? 'Chưa thanh toán' : '✓ Đã thu'}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Hạn thanh toán: <strong className={isUnpaid ? "text-rose-600" : "text-zinc-700"}>{inv.deadline}</strong></p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-200/50">
                        <span className={`text-base sm:text-lg font-black whitespace-nowrap ${isUnpaid ? 'text-rose-600' : 'text-[#2AC1BC]'}`}>
                          {fin.grandInvoiceTotal.toLocaleString('vi-VN')} ₫
                        </span>
                        {isUnpaid ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button className="px-3 py-1.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1 shrink-0 whitespace-nowrap">
                              VietQR
                            </button>
                            <a
                              href="https://zalo.me"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-[#0068FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                            >
                              Zalo
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] font-extrabold text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded-md whitespace-nowrap">
                            {inv.method}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Breakdown details accordion/toggle */}
                    <div className="p-3 bg-white rounded-xl border border-zinc-200/60 text-xs space-y-1.5">
                      <div className="text-[11px] font-extrabold text-zinc-700 flex justify-between border-b border-zinc-100 pb-1">
                        <span>CHI TIẾT TIỀN HÓA ĐƠN THÁNG:</span>
                        <span className="text-[#2AC1BC] font-black whitespace-nowrap">{fin.grandInvoiceTotal.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-zinc-600 font-semibold pt-1">
                        <div className="p-1.5 bg-zinc-50 rounded-lg">
                          <span className="text-zinc-400 block text-[9px]">Tiền phòng:</span>
                          <strong className="text-zinc-900 whitespace-nowrap">{roomRentNum.toLocaleString('vi-VN')} ₫</strong>
                        </div>
                        <div className="p-1.5 bg-zinc-50 rounded-lg">
                          <span className="text-zinc-400 block text-[9px]">Dịch vụ cố định:</span>
                          <strong className="text-zinc-900 whitespace-nowrap">{fixedServicesTotal.toLocaleString('vi-VN')} ₫</strong>
                        </div>
                        <div className="p-1.5 bg-amber-50 rounded-lg">
                          <span className="text-amber-600 block text-[9px]">⚡ Điện ({fin.elecUse} kWh):</span>
                          <strong className="text-amber-900 whitespace-nowrap">{fin.elecCost.toLocaleString('vi-VN')} ₫</strong>
                        </div>
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                          <span className="text-blue-600 block text-[9px]">💧 Nước ({fin.waterUse} m³):</span>
                          <strong className="text-blue-900 whitespace-nowrap">{fin.waterCost.toLocaleString('vi-VN')} ₫</strong>
                        </div>
                      </div>

                      {/* Log tag if edited */}
                      {inv.editReason && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-800 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span>⚠️ Đã cập nhật lại hóa đơn do chỉnh sửa số điện/nước ({inv.editedAt}):</span>
                            <span className="italic block text-amber-900 font-extrabold">"{inv.editReason}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls for Invoices */}
              {totalInvoicePages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
                  <span className="text-[11px] font-bold text-zinc-500">
                    Hiển thị {(invoicePage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(invoicePage * ITEMS_PER_PAGE, filteredInvoices.length)} / {filteredInvoices.length} kỳ hóa đơn
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={invoicePage === 1}
                      onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      &larr; Trước
                    </button>
                    {Array.from({ length: totalInvoicePages }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInvoicePage(idx + 1)}
                        className={`w-7 h-7 text-xs font-black rounded-lg transition-colors cursor-pointer ${invoicePage === idx + 1
                          ? 'bg-[#2AC1BC] text-white shadow-2xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={invoicePage === totalInvoicePages}
                      onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p + 1))}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Sau &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: LỊCH SỬ CHỐT ĐIỆN NƯỚC (Cho phép chỉnh sửa khi sai sót) */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-3.5 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-100 pb-3">
              <div>
                <h2 className="font-black text-zinc-900 text-xs sm:text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-[#2AC1BC]" /> Lịch Sử Chốt Điện Nước
                </h2>
                <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium mt-0.5">Cho phép chỉnh sửa khi có sai sót (yêu cầu ghi rõ lý do để lưu nhật ký).</p>
              </div>

              <button
                onClick={() => setIsMeterModalOpen(true)}
                className="px-3.5 py-2 bg-[#2AC1BC] text-white text-xs font-black rounded-xl hover:bg-[#25ad87] transition-all cursor-pointer shadow-md shadow-[#2AC1BC]/20 flex items-center justify-center gap-1.5 shrink-0"
              >
                <Gauge className="w-4 h-4" /> Chốt Số / Quét AI OCR
              </button>
            </div>

            <div className="space-y-3">
              {filteredMeterHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-400 font-bold bg-zinc-50 rounded-xl">
                  Không có lịch sử chốt số điện nước nào trong kỳ lọc.
                </div>
              ) : paginatedMeterHistory.map((item) => {
                const fin = computeRecordFinancials(item);
                const matchingInvoice = invoicesHistory.find(inv => inv.period === item.period);
                const isPaid = matchingInvoice?.status === "Đã thu";

                return (
                  <details key={item.period} className="group border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs" open={item.isOpen}>
                    <summary className="flex flex-wrap sm:flex-nowrap justify-between items-center p-3 sm:p-3.5 bg-zinc-50/80 hover:bg-zinc-100/80 cursor-pointer select-none outline-none transition-colors gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-black text-[#2AC1BC] uppercase tracking-wider">
                          Chỉ Số {item.period}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400">({item.date})</span>
                        {item.editReason && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded-full">
                            ✏️ Đã chỉnh sửa
                          </span>
                        )}
                        {isPaid && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded-full">
                            ✓ Đã thanh toán
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {isPaid ? (
                          <span
                            className="px-2.5 py-1 bg-zinc-100 text-zinc-400 border border-zinc-200 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-not-allowed select-none"
                            title="Hóa đơn tháng này đã thanh toán. Không thể chỉnh sửa số điện nước."
                          >
                            Đã khóa (Đã thu)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenCorrectionModal(item);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Edit className="w-3 h-3 text-amber-600" /> Sửa số điện nước
                          </button>
                        )}
                        <span className="text-xs font-black text-zinc-900">Tổng: {fin.meterTotal.toLocaleString('vi-VN')} ₫</span>
                        <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" />
                      </div>
                    </summary>

                    <div className="p-3 sm:p-4 bg-white border-t border-zinc-100 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="font-black text-xs text-zinc-900 flex items-center gap-1">⚡ ĐIỆN (3.500 ₫/kWh)</div>
                          <span className="text-xs font-black text-zinc-900 sm:hidden">{fin.elecCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                          <span className="text-[10px] text-zinc-500 font-medium">Cũ: {item.oldElec} ➔ Mới: {item.newElec} (Tiêu thụ: <strong className="text-zinc-900 font-bold">{fin.elecUse} kWh</strong>)</span>
                          <span className="hidden sm:inline font-black text-[#2AC1BC]">{fin.elecCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="font-black text-xs text-zinc-900 flex items-center gap-1">💧 NƯỚC (25.000 ₫/m³)</div>
                          <span className="text-xs font-black text-zinc-900 sm:hidden">{fin.waterCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                          <span className="text-[10px] text-zinc-500 font-medium">Cũ: {item.oldWater} ➔ Mới: {item.newWater} (Tiêu thụ: <strong className="text-zinc-900 font-bold">{fin.waterUse} m³</strong>)</span>
                          <span className="hidden sm:inline font-black text-[#2AC1BC]">{fin.waterCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                      </div>

                      {/* Display edit reason log if present */}
                      {item.editReason && (
                        <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-0.5">
                          <div className="font-bold text-amber-800 text-[11px]">📝 Nhật ký chỉnh sửa ({item.editedAt}):</div>
                          <p className="text-[11px] text-amber-900 italic font-semibold">"{item.editReason}"</p>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}

              {/* Pagination Controls for Meter History */}
              {totalMeterPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
                  <span className="text-[11px] font-bold text-zinc-500">
                    Hiển thị {(meterPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(meterPage * ITEMS_PER_PAGE, filteredMeterHistory.length)} / {filteredMeterHistory.length} kỳ chốt số
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={meterPage === 1}
                      onClick={() => setMeterPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      &larr; Trước
                    </button>
                    {Array.from({ length: totalMeterPages }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMeterPage(idx + 1)}
                        className={`w-7 h-7 text-xs font-black rounded-lg transition-colors cursor-pointer ${meterPage === idx + 1
                          ? 'bg-[#2AC1BC] text-white shadow-2xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={meterPage === totalMeterPages}
                      onClick={() => setMeterPage(p => Math.min(totalMeterPages, p + 1))}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Sau &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BẢO TRÌ & TIỀN ĐẶT CỌC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. Quản Lý Bảo Trì */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                  <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#FF6B35]" /> Bảo Trì ({maintenanceHistory.length})
                  </h2>
                  <button
                    onClick={() => setIsIncidentModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-black text-[#FF6B35] bg-[#FF6B35]/10 rounded-xl hover:bg-[#FF6B35]/20 transition-all cursor-pointer shadow-2xs"
                  >
                    + Báo Sự Cố
                  </button>
                </div>

                <div className="space-y-3 min-h-[195px] pt-1">
                  {maintenanceHistory.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400 font-bold bg-zinc-50 rounded-xl">
                      Chưa có lịch sử bảo trì nào cho phòng này.
                    </div>
                  ) : (
                    maintenanceHistory
                      .slice((maintPage - 1) * MAINT_PER_PAGE, maintPage * MAINT_PER_PAGE)
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border min-h-[86px] flex flex-col justify-between ${item.status === 'Đang xử lý'
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : 'bg-zinc-50 border-zinc-100'
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-zinc-900 line-clamp-1">{item.title}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full shrink-0 ${item.status === 'Đang xử lý'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-700'
                              }`}>
                              {item.status === 'Đang xử lý' ? 'Đang xử lý' : '✓ Đã xong'}
                            </span>
                          </div>

                          {item.description ? (
                            <p className="text-[11px] text-zinc-600 font-medium leading-tight line-clamp-1 my-1">
                              {item.description}
                            </p>
                          ) : (
                            <div className="my-1"></div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold pt-0.5 border-t border-zinc-100/60">
                            <span>{item.completedDate ? `Hoàn thành: ${item.completedDate}` : `Báo ngày: ${item.reportDate}`}</span>
                            <span className={item.priority === 'Mức độ cao' ? 'text-rose-600 font-black' : 'text-zinc-500'}>
                              {item.priority}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Maintenance Pagination */}
              {Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE) > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 text-xs mt-auto">
                  <span className="text-[10px] text-zinc-400 font-bold">
                    Trang {maintPage} / {Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setMaintPage(prev => Math.max(1, prev - 1))}
                      disabled={maintPage === 1}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[10px] font-bold disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      &larr; Trước
                    </button>
                    <button
                      onClick={() => setMaintPage(prev => Math.min(Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE), prev + 1))}
                      disabled={maintPage === Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE)}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[10px] font-bold disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      Sau &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Quản Lý Tiền Đặt Cọc */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                  <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-purple-600" /> Quản Lý Tiền Đặt Cọc
                  </h2>
                  <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-full text-[10px] font-black">
                    Escrow
                  </span>
                </div>

                {/* Hero Deposit Amount Banner */}
                <div className="mt-3 p-4 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-indigo-500/10 rounded-2xl border border-purple-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider">
                      CỌC GIỮ AN TOÀN
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-200">
                      Đã khóa cọc
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-black text-purple-700 tracking-tight">
                      3.000.000 <span className="text-xs">₫</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-purple-200/50 pt-2.5 text-[10px]">
                    <div className="space-y-0.5">
                      <span className="text-zinc-400 font-medium block">Ngày nhận cọc:</span>
                      <span className="font-extrabold text-zinc-800">01/01/2026</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-zinc-400 font-medium block">Thời hạn HĐ:</span>
                      <span className="font-extrabold text-zinc-800">01/01/2027</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button & Security Note */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => showToast("Đã ghi nhận yêu cầu hoàn 3.000.000 ₫ cọc qua VietQR/Ví Escrow!", "success")}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" /> Hoàn Cọc Cho Khách Thuê
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">

          {/* COMPACT SIDEBAR 4 ROOM METRIC CARDS */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-4 space-y-3">
            <h2 className="flex items-center gap-2 font-black text-zinc-900 text-xs uppercase tracking-wider border-b border-zinc-100 pb-2">
              <Home className="w-4 h-4 text-[#2AC1BC]" /> <span>THÔNG SỐ PHÒNG {room.roomNumber}</span>
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">GIÁ THUÊ</span>
                <div className="text-sm font-black text-[#2AC1BC]">{room.price || '3.000.000 ₫'}</div>
                <span className="text-[9px] text-zinc-500">Đầu tháng</span>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">TIỀN CỌC</span>
                <div className="text-sm font-black text-purple-600">3.000.000 ₫</div>
                <span className="text-[9px] text-emerald-600 font-bold">Khóa cọc</span>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">CÔNG NỢ</span>
                <div className="text-sm font-black text-rose-600">
                  {unpaidFinancials ? `${unpaidFinancials.grandInvoiceTotal.toLocaleString('vi-VN')} ₫` : '0 ₫'}
                </div>
                <span className="text-[9px] text-rose-600 font-bold">Còn nợ tháng này</span>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">DIỆN TÍCH</span>
                <div className="text-xs font-black text-zinc-900">{room.area || '25'} m² • T{room.floor}</div>
                <span className="text-[9px] text-zinc-500">Ban công</span>
              </div>
            </div>
          </div>

          {/* Giá dịch vụ định kỳ với Badge màu sắc */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
            <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Banknote className="w-4 h-4 text-[#2AC1BC]" /> Giá Dịch Vụ
            </h2>
            <div className="space-y-2.5">
              {(editServices && editServices.length > 0 ? editServices : defaultRoomServices).map((service) => (
                <div key={service.id} className="flex justify-between items-center p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-zinc-800">{service.name}</span>
                    {service.isCustom && (
                      <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold">Tùy chỉnh</span>
                    )}
                  </div>
                  <span className="text-xs font-black text-[#2AC1BC]">
                    {service.customPrice} {service.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tiện nghi phòng */}
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
                        className="px-2.5 py-1 bg-zinc-100 text-zinc-700 border border-zinc-200/80 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Quản lý trạng thái phòng */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
            <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Building2 className="w-4 h-4 text-[#2AC1BC]" /> Trạng Thái Phòng
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">CHUYỂN TRẠNG THÁI NHANH:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRoom(prev => prev ? { ...prev, status: 'Trống' } : null)}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isVacant ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  Trống
                </button>

                <button
                  onClick={() => setRoom(prev => prev ? { ...prev, status: 'Đang thuê' } : null)}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isOccupied ? 'bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  Đang Thuê
                </button>

                <button
                  onClick={() => setRoom(prev => prev ? { ...prev, status: 'Bảo trì' } : null)}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isMaintenance ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  Bảo Trì
                </button>

                <button
                  onClick={() => setRoom(prev => prev ? { ...prev, status: 'Đặt cọc' } : null)}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isReserved ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  Đặt Cọc
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA SỐ ĐIỆN NƯỚC (CÓ YÊU CẦU NHẬP LÝ DO BẮT BUỘC) */}
      {correctModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setCorrectModal(prev => ({ ...prev, isOpen: false })); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">Sửa Số Điện Nước - {correctModal.period}</h2>
                  <p className="text-xs text-zinc-500 font-medium">Hóa đơn tháng tương ứng sẽ tự động cập nhật lại tổng tiền.</p>
                </div>
              </div>
              <button onClick={() => setCorrectModal(prev => ({ ...prev, isOpen: false }))} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {correctModal.error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{correctModal.error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-2">
                  <label className="block text-xs font-black text-zinc-900">⚡ Chỉ số ĐIỆN mới (kWh)</label>
                  <span className="text-[10px] text-zinc-500 block font-semibold">Chỉ số cũ: {correctModal.oldElec}</span>
                  <input
                    type="number"
                    value={correctModal.newElec}
                    onChange={(e) => setCorrectModal(prev => ({ ...prev, newElec: parseInt(e.target.value) || 0, error: "" }))}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-2">
                  <label className="block text-xs font-black text-zinc-900">💧 Chỉ số NƯỚC mới (m³)</label>
                  <span className="text-[10px] text-zinc-500 block font-semibold">Chỉ số cũ: {correctModal.oldWater}</span>
                  <input
                    type="number"
                    value={correctModal.newWater}
                    onChange={(e) => setCorrectModal(prev => ({ ...prev, newWater: parseInt(e.target.value) || 0, error: "" }))}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-900 mb-1.5">
                  Lý do điều chỉnh sai sót <span className="text-rose-600">* (Bắt buộc)</span>
                </label>
                <textarea
                  rows={3}
                  value={correctModal.reason}
                  onChange={(e) => setCorrectModal(prev => ({ ...prev, reason: e.target.value, error: "" }))}
                  placeholder="Ví dụ: Ghi nhầm chỉ số công tơ do chụp ảnh mờ, chủ trọ đính chính lại..."
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium"
                ></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button
                onClick={() => setCorrectModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveCorrection}
                className="px-6 py-2 text-xs font-black text-white bg-amber-600 rounded-xl hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
              >
                Lưu Thay Đổi & Update Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỐT SỐ ĐIỆN NƯỚC / AI OCR SỐ MỚI */}
      {isMeterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsMeterModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">Chốt Điện Nước & Quét AI OCR</h2>
                  <p className="text-xs text-zinc-500 font-medium">Ghi lại chỉ số điện nước hàng tháng cho Phòng {room.roomNumber}</p>
                </div>
              </div>
              <button onClick={() => setIsMeterModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Tháng </label>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white">
                    {getAvailableMeterPeriods().monthOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Năm</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white">
                    {getAvailableMeterPeriods().yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI OCR UPLOAD BOX */}
              <div className="p-4 bg-gradient-to-br from-[#2AC1BC]/10 to-teal-500/5 rounded-2xl border border-[#2AC1BC]/30 space-y-2 text-center">
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs text-[#2AC1BC] flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-xs font-black text-zinc-900">Tính năng AI Quét Số Tự Động (OCR)</h3>
                <p className="text-[10px] text-zinc-500 font-semibold">Tải lên ảnh chụp đồng hồ điện/nước, AI sẽ tự động trích xuất con số chính xác.</p>
                <button
                  type="button"
                  onClick={handleSimulateAiOcr}
                  disabled={isOcrScanning}
                  className="px-4 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isOcrScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {isOcrScanning ? "Đang AI phân tích ảnh..." : "📸 Tải ảnh công tơ để AI quét số"}
                </button>
                {ocrSuccessMsg && (
                  <p className="text-[11px] font-bold text-emerald-600 bg-white/80 p-2 rounded-xl border border-emerald-200 animate-in fade-in">
                    {ocrSuccessMsg}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-900">⚡ Chỉ số ĐIỆN mới (kWh)</label>
                  <input
                    type="number"
                    value={formElec}
                    onChange={(e) => setFormElec(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-1.5">
                  <label className="block text-xs font-black text-zinc-900">💧 Chỉ số NƯỚC mới (m³)</label>
                  <input
                    type="number"
                    value={formWater}
                    onChange={(e) => setFormWater(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button onClick={() => setIsMeterModalOpen(false)} className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleSaveNewMeterReading}
                className="px-6 py-2 text-xs font-black text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25ad87] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
              >
                Lưu & Chốt Chỉ Số
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT ROOM INFO MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900">Chỉnh Sửa Thông Tin Phòng {room.roomNumber}</h2>
                  <p className="text-xs text-zinc-500 font-medium">Cập nhật thông tin chi tiết phòng, giá thuê và tiện nghi.</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">Số phòng *</label>
                  <input
                    type="text"
                    value={editRoomNumber}
                    onChange={(e) => setEditRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">Giá thuê hàng tháng *</label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-[#2AC1BC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">Diện tích (m²)</label>
                  <input
                    type="text"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">Tầng số</label>
                  <input
                    type="text"
                    value={editFloor}
                    onChange={(e) => setEditFloor(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2">Danh sách tiện nghi</label>
                <div className="flex flex-wrap gap-2">
                  {['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng', 'Máy giặt', 'Tivi', 'Tủ lạnh', 'Bảo vệ'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setEditAmenities(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item])}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${editAmenities.includes(item)
                        ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/40 shadow-xs'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cấu hình dịch vụ phòng */}
              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-[#2AC1BC]" /> Giá Dịch Vụ Định Kỳ
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-medium">Bật "Tùy chỉnh" để đặt giá riêng</span>
                </div>

                <div className="space-y-2.5">
                  {editServices.map((service) => (
                    <div key={service.id} className="border border-zinc-200/80 rounded-xl p-3 bg-white flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2">
                        {!service.isRemovable ? (
                          <span className="font-bold text-xs text-zinc-900">{service.name}</span>
                        ) : (
                          <input
                            type="text"
                            value={service.name}
                            onChange={(e) => setEditServices(prev => prev.map(s => s.id === service.id ? { ...s, name: e.target.value } : s))}
                            className="w-24 text-xs font-bold text-zinc-900 bg-transparent border-b border-zinc-200 focus:border-[#2AC1BC] focus:outline-none"
                            placeholder="Tên dịch vụ"
                          />
                        )}
                        <span className="text-[10px] text-zinc-400 font-medium">({service.unit})</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-zinc-500">Tùy chỉnh</span>
                          <button
                            type="button"
                            onClick={() => setEditServices(prev => prev.map(s => s.id === service.id ? { ...s, isCustom: !s.isCustom } : s))}
                            className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer flex items-center ${service.isCustom ? 'bg-[#2AC1BC]' : 'bg-zinc-200'}`}
                          >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-transform ${service.isCustom ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                          </button>
                        </div>

                        <div className="relative w-28 flex items-center">
                          <input
                            type="text"
                            value={service.isCustom ? service.customPrice : service.defaultPrice}
                            onChange={(e) => setEditServices(prev => prev.map(s => s.id === service.id ? { ...s, customPrice: e.target.value } : s))}
                            disabled={!service.isCustom}
                            className={`w-full px-2.5 py-1 text-xs border border-zinc-200 rounded-lg font-bold ${!service.isCustom ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'text-[#2AC1BC] focus:border-[#2AC1BC] focus:outline-none'}`}
                          />
                        </div>

                        {service.isRemovable && (
                          <button
                            type="button"
                            onClick={() => setEditServices(prev => prev.filter(s => s.id !== service.id))}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setEditServices(prev => [...prev, { id: `custom_${Date.now()}`, name: '', defaultPrice: '0', customPrice: '0', unit: 'đ/tháng', isCustom: true, isRemovable: true }])}
                  className="w-full py-2 border-2 border-dashed border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:border-[#2AC1BC] hover:text-[#2AC1BC] hover:bg-[#2AC1BC]/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm dịch vụ tùy chỉnh mới
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">Ghi chú phòng</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ghi chú thêm..."
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                ></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                Hủy
              </button>
              <button
                onClick={() => {
                  setRoom(prev => prev ? {
                    ...prev,
                    roomNumber: editRoomNumber || prev.roomNumber,
                    price: editPrice.includes('₫') ? editPrice : `${editPrice} ₫`,
                    area: editArea || prev.area,
                    floor: editFloor || prev.floor,
                    amenities: editAmenities,
                    notes: editNotes
                  } : null);
                  setIsEditModalOpen(false);
                }}
                className="px-6 py-2 text-sm font-black text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25ad87] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BÁO SỰ CỐ BẢO TRÌ */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsIncidentModalOpen(false); }}>
          <form onSubmit={handleCreateIncidentSubmit} className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-[#FF6B35]/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF6B35] text-white rounded-xl">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">Báo Sự Cố Bảo Trì</h2>
                  <p className="text-xs text-zinc-500 font-medium">Tạo phiếu ghi nhận sự cố hỏng hóc cho phòng {room.roomNumber}</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsIncidentModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Tên sự cố *</label>
                <input
                  type="text"
                  required
                  value={incidentTitleInput}
                  onChange={(e) => setIncidentTitleInput(e.target.value)}
                  placeholder="VD: Hỏng vòi nước nhà vệ sinh, chảy nước điều hòa..."
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Mô tả chi tiết sự cố (Tùy chọn)</label>
                <textarea
                  rows={3}
                  value={incidentDescInput}
                  onChange={(e) => setIncidentDescInput(e.target.value)}
                  placeholder="VD: Vòi rửa chảy rỉ nước liên tục từ sáng nay, cần thợ thay gioăng cao su..."
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Mức độ ưu tiên *</label>
                <select
                  value={incidentPriorityInput}
                  onChange={(e) => setIncidentPriorityInput(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                >
                  <option value="Mức độ nhẹ">Mức độ nhẹ</option>
                  <option value="Mức độ trung bình">Mức độ trung bình</option>
                  <option value="Mức độ cao">Mức độ cao (Cần gấp)</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button type="button" onClick={() => setIsIncidentModalOpen(false)} className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-black text-white bg-[#FF6B35] hover:bg-[#e05a2b] rounded-xl shadow-md shadow-[#FF6B35]/20 transition-all cursor-pointer"
              >
                Gửi Báo Sự Cố
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmModal(prev => ({ ...prev, isOpen: false })); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-zinc-900">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-zinc-500 font-medium">{confirmModal.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors">
                Hủy
              </button>
              <button onClick={confirmModal.onConfirm} className="px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs">
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-bottom-5 ${toast.type === "success" ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20" : "bg-rose-600 text-white border-rose-500 shadow-rose-600/20"
          }`}>
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
