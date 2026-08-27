"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, Home, User, FileSignature, Receipt,
  Gauge, Banknote, Sparkles, Wrench, X, Zap, Droplets, ChevronDown,
  AlertTriangle, ShieldCheck, Phone, CreditCard, Building2, MapPin, Eye,
  History, Wallet, AlertCircle, CheckCircle2, Plus, Upload, Target
} from "lucide-react";
import { getRoomById, defaultRoomServices, Room } from "../data";

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

  // Edit Room Form states
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

  const [selectedMonth, setSelectedMonth] = useState("Tháng 8");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [meterRecordsMap, setMeterRecordsMap] = useState<Record<string, any>>({});

  const currentRecordKey = `${selectedMonth}-${selectedYear}`;
  const currentRecord = meterRecordsMap[currentRecordKey];

  const [formElec, setFormElec] = useState("");
  const [formWater, setFormWater] = useState("");

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
    setFormElec(currentRecord?.newElec || '');
    setFormWater(currentRecord?.newWater || '');
  }, [selectedMonth, selectedYear, isMeterModalOpen, currentRecord]);

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

  const oldElec = 1300;
  const oldWater = 30;

  const elecConsumption = formElec ? Math.max(0, parseInt(formElec) - oldElec) : 0;
  const elecTotal = elecConsumption * 3500;
  const waterConsumption = formWater ? Math.max(0, parseInt(formWater) - oldWater) : 0;
  const waterTotal = waterConsumption * 25000;
  const grandTotal = elecTotal + waterTotal;

  const handleSimulateAiOcr = () => {
    setIsOcrScanning(true);
    setOcrSuccessMsg("");
    setTimeout(() => {
      setFormElec("1428");
      setFormWater("45");
      setIsOcrScanning(false);
      setOcrSuccessMsg("✓ AI đã đọc ảnh công tơ thành công: Điện 1428 kWh, Nước 45 m³");
    }, 800);
  };

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

  const handleSaveEditRoom = () => {
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
  };

  const handleUpdateStatus = (newStatus: string) => {
    setRoom(prev => prev ? { ...prev, status: newStatus } : null);
  };

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
              🏢 {room.building === 'b2' ? 'Dormio Campus Cầu Giấy' : 'Dormio Premier Quận 1'}
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

          <button
            onClick={() => setIsContractModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            {isOccupied ? <><Eye className="w-3.5 h-3.5 text-purple-600" /> Hợp Đồng</> : <><FileSignature className="w-3.5 h-3.5 text-[#2AC1BC]" /> Tạo Hợp Đồng</>}
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Edit className="w-3.5 h-3.5 text-zinc-500" /> Sửa
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

          {/* Quick Action Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setIsMeterModalOpen(true)}
              className="p-4 bg-white rounded-2xl border border-zinc-200 hover:border-[#2AC1BC] transition-all shadow-2xs text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" fill="currentColor" />
              </div>
              <div className="text-xs font-black text-zinc-900">Ghi Chỉ Số</div>
              <div className="text-[10px] text-zinc-400 font-medium">Điện & Nước hàng tháng</div>
            </button>

            <button
              onClick={() => alert(`Lập hóa đơn phòng ${room.roomNumber} thành công!`)}
              className="p-4 bg-white rounded-2xl border border-zinc-200 hover:border-[#2AC1BC] transition-all shadow-2xs text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-zinc-900">Tạo Hóa Đơn</div>
              <div className="text-[10px] text-zinc-400 font-medium">Lập hóa đơn tháng này</div>
            </button>

            <button
              onClick={() => setIsContractModalOpen(true)}
              className="p-4 bg-white rounded-2xl border border-zinc-200 hover:border-[#2AC1BC] transition-all shadow-2xs text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileSignature className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-zinc-900">Hợp Đồng</div>
              <div className="text-[10px] text-zinc-400 font-medium">Chi tiết hoặc gia hạn</div>
            </button>

            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="p-4 bg-white rounded-2xl border border-zinc-200 hover:border-orange-400 transition-all shadow-2xs text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-zinc-900">Bảo Trì</div>
              <div className="text-[10px] text-zinc-400 font-medium">Báo sự cố thiết bị</div>
            </button>
          </div>

          {/* SPOTLIGHT TENANT PROFILE CARD */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-zinc-100 bg-zinc-50/50">
              <span className="font-black text-zinc-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#2AC1BC]" /> Khách Thuê Hiện Tại
              </span>
              {room.tenantCccd ? (
                <Link
                  href={`/landlord/customers/${room.tenantCccd}`}
                  className="text-xs font-bold text-[#2AC1BC] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  Xem hồ sơ khách ➔
                </Link>
              ) : (
                <button onClick={() => setIsEditModalOpen(true)} className="text-xs font-bold text-[#2AC1BC] hover:underline flex items-center gap-1 cursor-pointer shrink-0">
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
                        <span>📞 {room.tenantPhone || '0977815704'}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>🆔 CCCD: {room.tenantCccd || '00109313040168'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <a
                      href={`tel:${room.tenantPhone || '0977815704'}`}
                      className="px-3 py-1.5 bg-white text-zinc-800 border border-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-50 transition-colors shadow-2xs text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      📞 Gọi ngay
                    </a>
                    <Link
                      href={`/landlord/customers/${room.tenantCccd || '00109313040168'}`}
                      className="px-3.5 py-1.5 bg-[#2AC1BC] text-white rounded-xl text-xs font-bold hover:bg-[#25ad87] transition-all shadow-xs text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      📄 Hồ sơ
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

          {/* Hóa đơn & công nợ với Data Test Có Hóa Đơn Chưa Thu / Quá Hạn */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-3.5 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <h2 className="font-black text-zinc-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#2AC1BC]" /> Hóa Đơn & Công Nợ Gần Nhất
              </h2>
              <span className="self-start sm:self-auto px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-black animate-pulse">
                🔴 Còn 1 Hóa Đơn Chưa Thu (3.520.000 ₫)
              </span>
            </div>

            <div className="space-y-3">
              {/* Overdue Unpaid Invoice Example */}
              <div className="p-3.5 sm:p-4 bg-rose-500/5 rounded-2xl border border-rose-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 bg-rose-500 text-white rounded-xl font-black text-xs shadow-xs shrink-0">
                    09/26
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-xs font-black text-zinc-900">INV-202609-{room.roomNumber}</span>
                      <span className="text-[10px] font-bold text-rose-600">(Tháng 09/2026)</span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full">
                        🔴 Chưa thanh toán
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Hạn thanh toán: <strong className="text-rose-600">10/09/2026 (Quá hạn 5 ngày)</strong></p>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-rose-200/50">
                  <span className="text-sm sm:text-base font-black text-rose-600">3.520.000 ₫</span>
                  <div className="flex items-center gap-1.5">
                    <button className="px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1 shrink-0">
                      ⚡ VietQR
                    </button>
                    <a
                      href="https://zalo.me"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-[#0068FF] hover:bg-[#0052cc] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
                    >
                      💬 Zalo
                    </a>
                  </div>
                </div>
              </div>

              {/* Paid Invoices */}
              {[
                { id: `INV-202608-${room.roomNumber}`, period: "Tháng 08/2026", amount: "3.460.000 ₫", deadline: "10/08/2026", method: "VietQR Auto", status: "Đã thu" },
                { id: `INV-202607-${room.roomNumber}`, period: "Tháng 07/2026", amount: "3.478.000 ₫", deadline: "10/07/2026", method: "VietQR Auto", status: "Đã thu" },
              ].map((inv, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100/80 transition-colors rounded-xl border border-zinc-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-lg font-black text-xs shrink-0">
                      {inv.period.split(" ")[1]}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-black text-zinc-900">{inv.id}</span>
                        <span className="text-[10px] font-bold text-zinc-400">({inv.period})</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Phương thức: <strong className="text-zinc-700">{inv.method}</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-zinc-200/50">
                    <span className="text-xs sm:text-sm font-black text-[#2AC1BC]">{inv.amount}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-extrabold rounded-full shrink-0">
                      ✓ {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lịch sử ghi chỉ số & Nút Tạo Hóa Đơn AI OCR */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-3.5 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-100 pb-3">
              <div>
                <h2 className="font-black text-zinc-900 text-xs sm:text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-[#2AC1BC]" /> Lịch Sử Chốt Điện Nước & AI OCR
                </h2>
                <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium mt-0.5">Chủ trọ tự điền số hoặc tải ảnh công tơ để AI tự quét số điện/nước.</p>
              </div>

              <button
                onClick={() => setIsMeterModalOpen(true)}
                className="px-3.5 py-2 bg-[#2AC1BC] text-white text-xs font-black rounded-xl hover:bg-[#25ad87] transition-all cursor-pointer shadow-md shadow-[#2AC1BC]/20 flex items-center justify-center gap-1.5 shrink-0"
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
                  <summary className="flex flex-wrap sm:flex-nowrap justify-between items-center p-3 sm:p-3.5 bg-zinc-50/80 hover:bg-zinc-100/80 cursor-pointer select-none outline-none transition-colors gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-black text-[#2AC1BC] uppercase tracking-wider">
                        Chỉ Số {item.period}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400">({item.date})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-zinc-900">Tổng: {item.total}</span>
                      <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" />
                    </div>
                  </summary>

                  <div className="p-3 sm:p-4 bg-white border-t border-zinc-100 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <div className="font-black text-xs text-zinc-900 flex items-center gap-1">⚡ ĐIỆN (3.500 ₫/kWh)</div>
                        <span className="text-xs font-black text-zinc-900 sm:hidden">{item.elecCost}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                        <span className="text-[10px] text-zinc-500 font-medium">Cũ: {item.oldElec} ➔ Mới: {item.newElec} (Tiêu thụ: <strong className="text-zinc-900 font-bold">{item.elecUse} kWh</strong>)</span>
                        <span className="hidden sm:inline font-black text-[#2AC1BC]">{item.elecCost}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <div className="font-black text-xs text-zinc-900 flex items-center gap-1">💧 NƯỚC (25.000 ₫/m³)</div>
                        <span className="text-xs font-black text-zinc-900 sm:hidden">{item.waterCost}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                        <span className="text-[10px] text-zinc-500 font-medium">Cũ: {item.oldWater} ➔ Mới: {item.newWater} (Tiêu thụ: <strong className="text-zinc-900 font-bold">{item.waterUse} m³</strong>)</span>
                        <span className="hidden sm:inline font-black text-[#2AC1BC]">{item.waterCost}</span>
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* BẢO TRÌ & TIỀN ĐẶT CỌC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. Quản Lý Bảo Trì */}
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
                      Đang xử lý
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>Báo ngày: 25/08/2026</span>
                    <span className="text-rose-600">Mức độ cao</span>
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
                    <span>Mức độ nhẹ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Quản Lý Tiền Đặt Cọc */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-600" /> Quản Lý Tiền Đặt Cọc
                </h2>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[9px] font-black">
                  Dormio Escrow
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
                    Hoàn Cọc
                  </button>
                  <button className="py-1.5 px-2 bg-white text-rose-600 border border-rose-200 text-[11px] font-black rounded-xl hover:bg-rose-50 transition-all cursor-pointer">
                    Trừ Cọc
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
              📊 THÔNG SỐ PHÒNG {room.roomNumber}
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
                <span className="text-[9px] text-emerald-600 font-bold">✓ Khóa cọc</span>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">CÔNG NỢ</span>
                <div className="text-sm font-black text-emerald-600">0 ₫</div>
                <span className="text-[9px] text-zinc-500">Không nợ</span>
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
              {defaultRoomServices.map((service) => (
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
                  onClick={() => handleUpdateStatus('Trống')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isVacant ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  🔵 Trống
                </button>

                <button
                  onClick={() => handleUpdateStatus('Đang thuê')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isOccupied ? 'bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  🟢 Đang Thuê
                </button>

                <button
                  onClick={() => handleUpdateStatus('Bảo trì')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isMaintenance ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  🟠 Bảo Trì
                </button>

                <button
                  onClick={() => handleUpdateStatus('Đặt cọc')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${isReserved ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
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

      {/* EDIT ROOM MODAL */}
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
              <button onClick={handleSaveEditRoom} className="px-6 py-2 text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-xs transition-all">
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meter Recording Modal */}
      {isMeterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsMeterModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-black text-zinc-900">Ghi Chỉ Số & AI OCR — Phòng {room.roomNumber}</h2>
                <p className="text-xs text-zinc-500 font-medium">Nhập tay hoặc tải ảnh công tơ điện/nước để AI tự quét số.</p>
              </div>
              <button onClick={() => setIsMeterModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Tháng</label>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC]">
                    <option>Tháng 7</option>
                    <option>Tháng 8</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Năm</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC]">
                    <option>2026</option>
                    <option>2025</option>
                  </select>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between font-bold text-zinc-900 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" fill="currentColor" /> Điện (3.500 đ/kWh)
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Chỉ số cũ</label>
                    <input type="number" readOnly value={oldElec} className="w-full px-3 py-2 text-sm border border-zinc-200 bg-zinc-50 text-zinc-500 rounded-lg cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Chỉ số mới</label>
                    <input type="number" value={formElec} onChange={(e) => setFormElec(e.target.value)} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-[#2AC1BC] font-bold text-[#2AC1BC]" />
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between font-bold text-zinc-900 text-sm">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" fill="currentColor" /> Nước (25.000 đ/m³)
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Chỉ số cũ</label>
                    <input type="number" readOnly value={oldWater} className="w-full px-3 py-2 text-sm border border-zinc-200 bg-zinc-50 text-zinc-500 rounded-lg cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Chỉ số mới</label>
                    <input type="number" value={formWater} onChange={(e) => setFormWater(e.target.value)} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-[#2AC1BC] font-bold text-[#2AC1BC]" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 px-1 border-t border-zinc-100">
                <span className="font-bold text-zinc-900 text-base">Tổng tiền điện nước</span>
                <span className="font-black text-[#2AC1BC] text-lg">{grandTotal.toLocaleString()} ₫</span>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button onClick={() => setIsMeterModalOpen(false)} className="px-5 py-2 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50">
                Hủy
              </button>
              <button onClick={handleSaveMeter} className="px-6 py-2 text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-xs">
                Lưu chỉ số
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsIncidentModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" /> Báo Sự Cố Bảo Trì — Phòng {room.roomNumber}
              </h2>
              <button onClick={() => setIsIncidentModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setIsIncidentModalOpen(false); alert('Đã tạo báo cáo sự cố thành công!'); }} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Tên sự cố *</label>
                <input type="text" required placeholder="VD: Máy lạnh kêu to, rò rỉ nước..." className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Mức độ ưu tiên</label>
                <select className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none">
                  <option value="high">Mức độ cao (Gấp)</option>
                  <option value="medium">Bình thường</option>
                  <option value="low">Thấp</option>
                </select>
              </div>
              <div className="pt-2 border-t border-zinc-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsIncidentModalOpen(false)} className="px-4 py-2 text-xs font-bold text-zinc-600 bg-zinc-100 rounded-xl">Hủy</button>
                <button type="submit" className="px-5 py-2 text-xs font-black text-white bg-orange-500 rounded-xl hover:bg-orange-600 shadow-xs">Gửi yêu cầu bảo trì</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsContractModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="text-base font-black text-zinc-900">Chi Tiết / Tạo Hợp Đồng — Phòng {room.roomNumber}</h2>
              <button onClick={() => setIsContractModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2">
                <div className="flex justify-between"><span className="text-zinc-500 font-medium">Khách thuê:</span> <span className="font-bold text-zinc-900">{room.tenant || 'Chưa xếp'}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 font-medium">Giá phòng:</span> <span className="font-bold text-[#2AC1BC]">{room.price || '3.000.000 ₫'}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 font-medium">Tiền cọc:</span> <span className="font-bold text-purple-600">3.000.000 ₫</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 font-medium">Thời hạn hợp đồng:</span> <span className="font-bold text-zinc-800">12 Tháng (01/01/2026 - 01/01/2027)</span></div>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-100 flex justify-end gap-2 bg-zinc-50/50">
              <button onClick={() => setIsContractModalOpen(false)} className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl">Đóng</button>
              <button onClick={() => { setIsContractModalOpen(false); alert('Đã cập nhật hợp đồng!'); }} className="px-6 py-2 text-xs font-bold text-white bg-[#2AC1BC] rounded-xl shadow-xs">Cập nhật hợp đồng</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmModal(prev => ({ ...prev, isOpen: false })); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-500 shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-zinc-500">{confirmModal.message}</p>
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">Hủy</button>
              <button onClick={confirmModal.onConfirm} className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-colors">Đồng ý</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
