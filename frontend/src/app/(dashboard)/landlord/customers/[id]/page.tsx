"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit2, Trash2, User, Phone, Briefcase, CreditCard, Home, Clock,
  Image as ImageIcon, FileSignature, Receipt, AlertTriangle, ShieldCheck,
  CheckCircle2, X, Upload, ExternalLink, Calendar, MapPin, Mail, Sparkles
} from "lucide-react";
import { getCustomerById, Customer } from "../data";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCccd, setEditCccd] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editJob, setEditJob] = useState("");
  const [editWorkplace, setEditWorkplace] = useState("");
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    setIsMounted(true);
    if (resolvedParams.id) {
      const found = getCustomerById(decodeURIComponent(resolvedParams.id));
      setCustomer(found);
      if (found) {
        setEditName(found.name);
        setEditPhone(found.phone);
        setEditCccd(found.cccd);
        setEditDob(found.dob || "2000-01-01");
        setEditGender(found.gender || "nam");
        setEditAddress(found.address || "Khu công nghệ cao, TP.HCM");
        setEditEmail(found.email || `kh${found.room}@gmail.com`);
        setEditJob(found.job || "Sinh viên");
        setEditWorkplace(found.workplace || "Đại học SPKT");
        setEditNote(found.note || "");
      }
    }
  }, [resolvedParams.id]);

  if (!isMounted) return null;

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 my-6">
        <p className="font-bold text-lg mb-2 text-zinc-800">Không tìm thấy thông tin khách thuê</p>
        <p className="text-xs text-zinc-500 mb-4">Số CCCD / Mã khách: {resolvedParams.id}</p>
        <Link href="/landlord/customers" className="inline-flex items-center gap-2 px-4 py-2 bg-[#2AC1BC] text-white text-xs font-bold rounded-xl hover:bg-[#25ad87] transition-colors">
          &larr; Quay lại danh sách khách thuê
        </Link>
      </div>
    );
  }

  const isStaying = customer.status === "Đang ở" || customer.status === "Sắp hết hợp đồng";
  const buildingSeq = customer.building === "vinahouse" ? 2 : 1;
  const fullRoomId = `${buildingSeq}${customer.room}`;

  const handleSaveCustomer = () => {
    setCustomer(prev => prev ? {
      ...prev,
      name: editName || prev.name,
      phone: editPhone || prev.phone,
      cccd: editCccd || prev.cccd,
      dob: editDob || prev.dob,
      gender: editGender || prev.gender,
      address: editAddress || prev.address,
      email: editEmail || prev.email,
      job: editJob || prev.job,
      workplace: editWorkplace || prev.workplace,
      note: editNote || prev.note,
      updatedAt: new Date().toLocaleDateString('vi-VN')
    } : null);
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/landlord/customers"
            className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2AC1BC] text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">{customer.name}</h1>
                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider border shrink-0 ${customer.status === 'Đang ở'
                    ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30'
                    : customer.status === 'Sắp hết hợp đồng'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                  {customer.status}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                CCCD: <span className="font-bold text-zinc-800">{customer.cccd}</span> • SĐT: <span className="font-bold text-zinc-800">{customer.phone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
          <a
            href={`tel:${customer.phone}`}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            📞 Gọi điện
          </a>
          <a
            href={`https://zalo.me/${customer.phone}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0068FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            💬 Nhắn Zalo
          </a>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#2AC1BC]" /> Sửa thông tin
          </button>
          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Xóa khách thuê',
                message: `Bạn có chắc chắn muốn xóa khách thuê ${customer.name} (CCCD: ${customer.cccd}) khỏi hệ thống không?`,
                onConfirm: () => {
                  router.push('/landlord/customers');
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
              });
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* CARD 1: THÔNG TIN CÁ NHÂN */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <User className="w-4 h-4 text-[#2AC1BC]" /> Thông Tin Cá Nhân
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Họ và tên</span>
                <p className="font-extrabold text-zinc-900 text-sm">{customer.name}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Số CCCD / CMND</span>
                <p className="font-black text-[#2AC1BC] text-sm tracking-wide">{customer.cccd}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Ngày sinh</span>
                <p className="font-bold text-zinc-800">{customer.dob || "01/01/2000"}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Giới tính</span>
                <p className="font-bold text-zinc-800">{customer.gender === "nam" ? "Nam 👨" : "Nữ 👩"}</p>
              </div>

              <div className="sm:col-span-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Địa chỉ thường trú / Quê quán</span>
                <p className="font-bold text-zinc-800">{customer.address || "Khu công nghệ cao, Phường Tân Phú, TP. Thủ Đức, TP.HCM"}</p>
              </div>
            </div>
          </div>

          {/* CARD 2: THÔNG TIN LIÊN HỆ & NGHỀ NGHIỆP */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Phone className="w-4 h-4 text-[#2AC1BC]" /> Liên Hệ & Công Việc
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Số điện thoại</span>
                <p className="font-black text-zinc-900 text-sm">{customer.phone}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Email</span>
                <p className="font-bold text-zinc-800">{customer.email || `kh${customer.room}@gmail.com`}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Nghề nghiệp</span>
                <p className="font-bold text-zinc-800">{customer.job || "Sinh viên / Kỹ sư"}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Nơi làm việc / Trường học</span>
                <p className="font-bold text-zinc-800">{customer.workplace || "Đại học SPKT / FPT Software"}</p>
              </div>
            </div>
          </div>

          {/* CARD 3: HÌNH ẢNH GIẤY TỜ CCCD */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#2AC1BC]" /> Ảnh Giấy Tờ CCCD / CMND
              </h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                ✓ Đã xác minh OCR
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-zinc-600 block">Mặt trước CCCD</span>
                <div
                  onClick={() => setIsImagePreviewOpen("https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=600&q=80")}
                  className="group relative border-2 border-dashed border-zinc-200 rounded-2xl h-44 overflow-hidden bg-zinc-50 flex items-center justify-center cursor-pointer hover:border-[#2AC1BC] transition-all"
                >
                  <img
                    src="https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=600&q=80"
                    alt="CCCD Mặt trước"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                    🔍 Nhấn để xem ảnh phóng to
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-zinc-600 block">Mặt sau CCCD</span>
                <div
                  onClick={() => setIsImagePreviewOpen("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80")}
                  className="group relative border-2 border-dashed border-zinc-200 rounded-2xl h-44 overflow-hidden bg-zinc-50 flex items-center justify-center cursor-pointer hover:border-[#2AC1BC] transition-all"
                >
                  <img
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"
                    alt="CCCD Mặt sau"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                    🔍 Nhấn để xem ảnh phóng to
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">

          {/* CARD: PHÒNG ĐANG Ở & HỢP ĐỒNG */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Home className="w-4 h-4 text-[#2AC1BC]" /> HỢP ĐỒNG & PHÒNG HIỆN TẠI
            </h3>

            {isStaying ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-[#2AC1BC]/10 rounded-2xl border border-[#2AC1BC]/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-600">Đang thuê phòng:</span>
                    <Link
                      href={`/landlord/rooms/${fullRoomId}`}
                      className="text-base font-black text-[#2AC1BC] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Phòng {customer.room} <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-semibold border-t border-[#2AC1BC]/20 pt-2 flex justify-between">
                    <span>Tòa nhà: {customer.building === "vinahouse" ? "Dormio Campus" : "Dormio Premier"}</span>
                    <span>Tầng {customer.room.charAt(0)}</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-zinc-700">
                    <span>Mã hợp đồng:</span>
                    <Link
                      href={`/landlord/contracts/HD-01012026-${buildingSeq}-${customer.room}`}
                      className="text-[#2AC1BC] hover:underline font-black flex items-center gap-1 cursor-pointer"
                      title="Xem chi tiết hợp đồng"
                    >
                      HD-01012026-{buildingSeq}-{customer.room} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-500 font-semibold">
                    <span>Thời hạn:</span>
                    <span>01/01/2026 ➔ 01/01/2027</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-700 font-bold pt-1">
                    <span>Tiền cọc giữ:</span>
                    <span className="font-black text-purple-600">3.000.000 ₫</span>
                  </div>
                </div>

                <Link
                  href={`/landlord/rooms/${fullRoomId}`}
                  className="w-full py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Home className="w-4 h-4" /> Xem Chi Tiết Phòng {customer.room} &rarr;
                </Link>
              </div>
            ) : (
              <div className="p-4 text-center bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-500 font-bold">
                Khách thuê này hiện đã chấm dứt hợp đồng và rời đi.
              </div>
            )}
          </div>

          {/* CARD: LỊCH SỬ THUÊ & THANH TOÁN */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Clock className="w-4 h-4 text-[#2AC1BC]" /> LỊCH SỬ LƯU TRÚ
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs space-y-1">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-zinc-900">Phòng {customer.room} ({customer.building === "vinahouse" ? "Campus" : "Premier"})</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">
                    Đang ở
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">Từ ngày 01/01/2026 - Đến nay</p>
              </div>

              <div className="p-3 bg-zinc-50/60 rounded-xl border border-zinc-100 text-xs space-y-1">
                <div className="flex justify-between items-center font-semibold text-zinc-600">
                  <span>Phòng 201 (Dormio Premier)</span>
                  <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[9px] font-bold rounded-full">
                    Đã rời
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">Từ 01/01/2024 - 31/12/2025</p>
              </div>
            </div>
          </div>

          {/* CARD: GHI CHÚ CHỦ TRỌ */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <FileSignature className="w-4 h-4 text-[#2AC1BC]" /> GHI CHÚ CỦA CHỦ TRỌ
            </h3>
            <p className="text-xs text-zinc-600 font-medium italic bg-zinc-50 p-3 rounded-xl border border-zinc-100">
              "{customer.note || "Khách thuê ngoan ngoãn, đóng tiền đúng hạn hàng tháng qua VietQR, giữ vệ sinh phòng sạch sẽ."}"
            </p>
          </div>

        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA THÔNG TIN KHÁCH THUÊ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">Chỉnh Sửa Khách Thuê: {customer.name}</h2>
                  <p className="text-xs text-zinc-500 font-medium">Cập nhật họ tên, CCCD, thông tin liên hệ và công việc.</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Số CCCD / CMND *</label>
                  <input
                    type="text"
                    value={editCccd}
                    onChange={(e) => setEditCccd(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-[#2AC1BC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Giới tính</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                  >
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Nghề nghiệp</label>
                  <input
                    type="text"
                    value={editJob}
                    onChange={(e) => setEditJob(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Nơi làm việc</label>
                  <input
                    type="text"
                    value={editWorkplace}
                    onChange={(e) => setEditWorkplace(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Ghi chú</label>
                  <textarea
                    rows={3}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleSaveCustomer}
                className="px-6 py-2 text-xs font-black text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25ad87] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM ẢNH CCCD PHÓNG TO */}
      {isImagePreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsImagePreviewOpen(null); }}>
          <div className="relative max-w-3xl w-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center">
            <button
              onClick={() => setIsImagePreviewOpen(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={isImagePreviewOpen} alt="CCCD Phóng to" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE */}
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
    </div>
  );
}
