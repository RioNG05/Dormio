"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit2, Trash2, User, Phone, Briefcase, CreditCard, Home, Clock,
  FileText, CalendarDays, Ban, Printer, Copy, Plus, X, ExternalLink, Search,
  ShieldCheck, Banknote, Sparkles, Building2, CheckCircle2, AlertTriangle, Users, Gauge
} from "lucide-react";
import { getContractById, Contract, ContractMember, ContractServiceItem } from "../data";
import { generateMockCustomers, Customer } from "../../customers/data";

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Modals
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCheckoutNoticeModalOpen, setIsCheckoutNoticeModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form states for contract edit
  const [editPrice, setEditPrice] = useState("");
  const [editDeposit, setEditDeposit] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("5");
  const [editEndDate, setEditEndDate] = useState("");
  const [editReason, setEditReason] = useState("");

  // Form states for member add (Dual-mode: select vs create)
  const [addMemberTab, setAddMemberTab] = useState<'select' | 'create'>('select');
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("Gia đình");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberCccd, setNewMemberCccd] = useState("");
  const [newMemberDob, setNewMemberDob] = useState("");
  const [newMemberGender, setNewMemberGender] = useState("nam");
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const [newMemberJob, setNewMemberJob] = useState("");
  const [newMemberWorkplace, setNewMemberWorkplace] = useState("");

  // Form states for extension
  const [extendEndDate, setExtendEndDate] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setIsMounted(true);
    setExistingCustomers(generateMockCustomers());
    if (resolvedParams.id) {
      const found = getContractById(decodeURIComponent(resolvedParams.id));
      setContract(found);
      if (found) {
        setEditPrice(found.price);
        setEditDeposit(found.deposit);
        setEditPaymentDate(found.paymentDate || "5");
        setEditEndDate(found.endDate);
      }
    }
  }, [resolvedParams.id]);

  const handleSelectExistingCustomer = (idStr: string) => {
    setSelectedCustomerId(idStr);
    const cust = existingCustomers.find(c => c.id === idStr || c.cccd === idStr);
    if (cust) {
      setNewMemberName(cust.name);
      setNewMemberPhone(cust.phone);
      setNewMemberCccd(cust.cccd);
    }
  };

  const handleSaveContractEdit = () => {
    if (!editReason.trim()) {
      showToast("Vui lòng nhập lý do thay đổi hợp đồng!", "error");
      return;
    }

    const todayStr = new Date().toLocaleDateString("vi-VN");
    setContract(prev => prev ? {
      ...prev,
      price: editPrice.includes("₫") ? editPrice : `${editPrice} ₫`,
      deposit: editDeposit.includes("₫") ? editDeposit : `${editDeposit} ₫`,
      paymentDate: editPaymentDate,
      endDate: editEndDate || prev.endDate,
      history: [
        { date: todayStr, user: "Admin (Chủ trọ)", content: `Cập nhật HĐ: ${editReason}` },
        ...(prev.history || [])
      ]
    } : null);

    setIsEditModalOpen(false);
    setEditReason("");
    showToast("Đã cập nhật hợp đồng thành công!", "success");
  };

  const handleSaveExtension = () => {
    if (!extendEndDate) {
      showToast("Vui lòng chọn ngày kết thúc mới!", "error");
      return;
    }

    const todayStr = new Date().toLocaleDateString("vi-VN");
    setContract(prev => prev ? {
      ...prev,
      endDate: extendEndDate,
      status: "Đang hiệu lực",
      history: [
        { date: todayStr, user: "Admin (Chủ trọ)", content: `Gia hạn hợp đồng tới ngày ${extendEndDate}` },
        ...(prev.history || [])
      ]
    } : null);

    setIsExtendModalOpen(false);
    showToast("Đã gia hạn hợp đồng thành công!", "success");
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      showToast("Vui lòng chọn hoặc nhập tên thành viên!", "error");
      return;
    }

    const newMem: ContractMember = {
      name: newMemberName,
      relation: newMemberRelation,
      phone: newMemberPhone || "—",
      cccd: newMemberCccd || "—"
    };

    // Update members list in current contract
    setContract(prev => prev ? {
      ...prev,
      members: [...(prev.members || []), newMem]
    } : null);

    // If Mode 2: Create new tenant -> Sync into Customer list
    if (addMemberTab === 'create' && contract) {
      const createdCccd = newMemberCccd.trim() || `00109${Math.floor(1000000 + Math.random() * 9000000)}`;
      const newCustomer: Customer = {
        id: createdCccd,
        name: newMemberName,
        phone: newMemberPhone || "0900000000",
        room: contract.room,
        building: contract.building,
        cccd: createdCccd,
        joinDate: contract.startDate,
        status: "Đang ở",
        dob: newMemberDob || "2000-01-01",
        gender: newMemberGender,
        address: newMemberAddress || "TP.HCM",
        email: `member${contract.room}@gmail.com`,
        job: newMemberJob || "Nhân viên",
        workplace: newMemberWorkplace || "Công ty",
        note: `Thành viên ở cùng phòng ${contract.room} (Chủ HĐ: ${contract.tenant})`,
        createdAt: new Date().toLocaleDateString("vi-VN"),
        updatedAt: new Date().toLocaleDateString("vi-VN")
      };
      setExistingCustomers(prev => [newCustomer, ...prev]);
      showToast(`Đã tạo khách thuê mới "${newMemberName}" & đồng bộ sang Quản lý Khách Thuê!`, "success");
    } else {
      showToast(`Đã thêm thành viên "${newMemberName}" vào hợp đồng!`, "success");
    }

    // Reset fields & close modal
    setNewMemberName("");
    setNewMemberPhone("");
    setNewMemberCccd("");
    setSelectedCustomerId("");
    setNewMemberDob("");
    setNewMemberAddress("");
    setNewMemberJob("");
    setNewMemberWorkplace("");
    setIsAddMemberModalOpen(false);
  };

  const handleTerminate = () => {
    const todayStr = new Date().toLocaleDateString("vi-VN");
    setContract(prev => prev ? {
      ...prev,
      status: "Đã chấm dứt",
      history: [
        { date: todayStr, user: "Admin (Chủ trọ)", content: "Chấm dứt hợp đồng thuê phòng" },
        ...(prev.history || [])
      ]
    } : null);

    setIsTerminateModalOpen(false);
    showToast("Đã chấm dứt hợp đồng", "success");
  };

  if (!isMounted) return null;

  if (!contract) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 my-6">
        <p className="font-bold text-lg mb-2 text-zinc-800">Không tìm thấy thông tin hợp đồng</p>
        <p className="text-xs text-zinc-500 mb-4">Mã HĐ: {resolvedParams.id}</p>
        <Link href="/landlord/contracts" className="inline-flex items-center gap-2 px-4 py-2 bg-[#2AC1BC] text-white text-xs font-bold rounded-xl hover:bg-[#25ad87] transition-colors">
          &larr; Quay lại danh sách hợp đồng
        </Link>
      </div>
    );
  }

  const fullRoomId = `${contract.buildingSeq}${contract.room}`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Toast Notice */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-2.5 rounded-xl font-bold text-xs shadow-xl animate-in slide-in-from-top-3 ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}>
          {toast.message}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/landlord/contracts"
            className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách hợp đồng"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Hợp Đồng Phòng {contract.room}
              </h1>
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider border shrink-0 ${contract.status === 'Đang hiệu lực' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                contract.status === 'Quá hạn' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  contract.status === 'Sắp hết hạn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}>
                {contract.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-semibold mt-0.5 flex flex-wrap items-center gap-2">
              <span>{contract.buildingName}</span>
              <span>•</span>
              <span>Mã HĐ: <strong className="text-[#2AC1BC] font-black">{contract.id}</strong></span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(contract.id);
                  showToast("Đã sao chép mã hợp đồng!", "success");
                }}
                className="p-1 hover:bg-zinc-100 rounded-md transition-colors text-zinc-400 hover:text-zinc-700"
                title="Sao chép mã"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
          <button
            onClick={() => setIsExtendModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <CalendarDays className="w-3.5 h-3.5" /> Gia Hạn
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#2AC1BC]" /> Sửa HĐ
          </button>

          <button
            onClick={() => alert("Xuất Hợp đồng bản PDF thành công!")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" /> In PDF
          </button>

          <button
            onClick={() => setIsTerminateModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Ban className="w-3.5 h-3.5" /> Chấm Dứt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* CARD 1: THÔNG TIN HỢP ĐỒNG & GIÁ THUÊ */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2AC1BC]" /> Điều Khoản Hợp Đồng & Giá Thuê
              </h3>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-2.5 py-1 text-xs font-bold text-[#2AC1BC] hover:bg-[#2AC1BC]/10 rounded-lg transition-colors flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Mã Hợp Đồng</span>
                <p className="font-black text-[#2AC1BC] text-sm tracking-wide">{contract.id}</p>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Phòng thuê & Loại phòng</span>
                <p className="font-extrabold text-zinc-900 text-sm">Phòng {contract.room} • {contract.roomType}</p>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Ngày bắt đầu hiệu lực</span>
                <p className="font-bold text-zinc-800">{contract.startDate}</p>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Ngày hết hạn hợp đồng</span>
                <p className="font-bold text-zinc-800">{contract.endDate}</p>
              </div>

              <div className="p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Giá thuê hàng tháng</span>
                <p className="font-black text-emerald-600 text-base">{contract.price}</p>
              </div>

              <div className="p-3.5 bg-purple-500/5 rounded-xl border border-purple-500/20 space-y-1">
                <span className="text-[10px] font-bold text-purple-600 uppercase">Tiền cọc giữ (Escrow)</span>
                <p className="font-black text-purple-600 text-base">{contract.deposit}</p>
              </div>

              <div className="sm:col-span-2 p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">Ngày thu tiền định kỳ hàng tháng</span>
                  <p className="font-bold text-zinc-800 text-xs">Ngày {contract.paymentDate || '5'} hàng tháng (Chốt số điện nước trước 2 ngày)</p>
                </div>
                <span className="px-2.5 py-1 bg-zinc-200 text-zinc-700 text-[10px] font-extrabold rounded-lg">
                  Tự động chốt VietQR
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: BÊN B - KHÁCH THUÊ CHÍNH */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#2AC1BC]" /> Bên B — Đại Diện Thuê (Chủ Hợp Đồng)
              </h3>
              <Link
                href={`/landlord/customers/${contract.tenantCccd}`}
                className="px-3 py-1 bg-[#2AC1BC] text-white text-xs font-bold rounded-lg hover:bg-[#25ad87] transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                Xem hồ sơ khách &rarr;
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2AC1BC] text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                  {contract.tenant.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-black text-zinc-900">{contract.tenant}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 font-semibold mt-0.5">
                    <span>SDT: {contract.tenantPhone}</span>
                    <span>•</span>
                    <span>CCCD: {contract.tenantCccd}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <a
                  href={`tel:${contract.tenantPhone}`}
                  className="px-3 py-1.5 bg-red-600 text-white border border-zinc-200 rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-2xs cursor-pointer"
                >
                  Gọi điện
                </a>
                <a
                  href={`https://zalo.me/${contract.tenantPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#0068FF] text-white rounded-xl text-xs font-bold hover:bg-[#0052cc] transition-colors shadow-2xs cursor-pointer"
                >
                  Zalo
                </a>
              </div>
            </div>
          </div>

          {/* CARD 3: THÀNH VIÊN Ở CÙNG */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2AC1BC]" /> Thành Viên Ở Cùng ({contract.members?.length || 0})
              </h3>
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-bold rounded-lg hover:bg-[#2AC1BC]/20 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm thành viên
              </button>
            </div>

            {(!contract.members || contract.members.length === 0) ? (
              <div className="p-4 text-center text-xs text-zinc-400 font-bold bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                Chưa có thành viên ở cùng nào được đăng ký trong hợp đồng này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contract.members.map((mem, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                        <span>{mem.name}</span>
                        <span className="text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded-md font-semibold">
                          {mem.relation}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium mt-0.5">SĐT: {mem.phone} • CCCD: {mem.cccd || "—"}</p>
                    </div>
                    <button
                      onClick={() => setContract(prev => prev ? { ...prev, members: prev.members.filter((_, i) => i !== idx) } : null)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa thành viên"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CARD 4: CẤU HÌNH DỊCH VỤ ĐỊNH KỲ */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Banknote className="w-4 h-4 text-[#2AC1BC]" /> Dịch Vụ Áp Dụng Cho Hợp Đồng
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {contract.services.map((svc) => (
                <div key={svc.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-800">{svc.name}</span>
                    <span className="text-[9px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded font-semibold">{svc.type}</span>
                  </div>
                  <span className="font-black text-[#2AC1BC]">
                    {svc.price.toLocaleString('vi-VN')} {svc.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 5: NHẬT KÝ LỊCH SỬ THAY ĐỔI */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Clock className="w-4 h-4 text-[#2AC1BC]" /> Nhật Ký Thay Đổi Hợp Đồng
            </h3>

            <div className="space-y-2.5">
              {contract.history.map((h, idx) => (
                <div key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs space-y-0.5">
                  <div className="flex justify-between items-center font-bold text-zinc-800">
                    <span>{h.content}</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">{h.date}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium">Người thực hiện: <strong className="text-zinc-700">{h.user}</strong></p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">

          {/* CARD BÊN A (CHỦ TRỌ / BQL) */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Building2 className="w-4 h-4 text-[#2AC1BC]" /> BÊN A — BQL TÒA NHÀ
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Tên đại diện BQL</span>
                <p className="font-extrabold text-zinc-900">Nguyễn Văn Quyền (Chủ trọ Dormio)</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Số điện thoại hỗ trợ</span>
                <p className="font-bold text-zinc-800">0988 123 456</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Tòa nhà</span>
                <p className="font-bold text-zinc-800">{contract.buildingName}</p>
              </div>
            </div>
          </div>

          {/* LINK SANG PHÒNG HIỆN TẠI */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Home className="w-4 h-4 text-[#2AC1BC]" /> PHÒNG THUÊ LIÊN QUAN
            </h3>

            <div className="p-4 bg-[#2AC1BC]/10 rounded-2xl border border-[#2AC1BC]/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-700">Phòng đăng ký:</span>
                <span className="text-base font-black text-[#2AC1BC]">Phòng {contract.room}</span>
              </div>

              <Link
                href={`/landlord/rooms/${fullRoomId}`}
                className="w-full py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                Đến Trang Chi Tiết Phòng {contract.room} &rarr;
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL 1: GIA HẠN HỢP ĐỒNG */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsExtendModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">Gia Hạn Hợp Đồng</h2>
                  <p className="text-xs text-zinc-500 font-medium">Chọn ngày kết thúc mới cho HĐ phòng {contract.room}</p>
                </div>
              </div>
              <button onClick={() => setIsExtendModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày kết thúc hiện tại</label>
                <input type="text" disabled value={contract.endDate} className="w-full px-3 py-2 text-xs bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày kết thúc mới *</label>
                <input
                  type="date"
                  value={extendEndDate}
                  onChange={(e) => setExtendEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button onClick={() => setIsExtendModalOpen(false)} className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleSaveExtension}
                className="px-6 py-2 text-xs font-black text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25ad87] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
              >
                Xác Nhận Gia Hạn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SỬA HỢP ĐỒNG */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">Chỉnh Sửa Hợp Đồng {contract.id}</h2>
                  <p className="text-xs text-zinc-500 font-medium">Cập nhật giá thuê, tiền cọc, ngày đóng tiền hàng tháng.</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Giá thuê hàng tháng *</label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-[#2AC1BC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Tiền cọc giữ *</label>
                  <input
                    type="text"
                    value={editDeposit}
                    onChange={(e) => setEditDeposit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày chốt đóng tiền hàng tháng</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editPaymentDate}
                  onChange={(e) => setEditPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Lý do điều chỉnh * (Bắt buộc để lưu lịch sử)</label>
                <textarea
                  rows={3}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ví dụ: Giảm giá thuê hỗ trợ sinh viên, điều chỉnh lại ngày đóng tiền..."
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium"
                ></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleSaveContractEdit}
                className="px-6 py-2 text-xs font-black text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25ad87] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: THÊM THÀNH VIÊN Ở CÙNG */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsAddMemberModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">Thêm Thành Viên Ở Cùng</h2>
                  <p className="text-xs text-zinc-500 font-medium">Đăng ký tạm trú cho thành viên phòng {contract.room}</p>
                </div>
              </div>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-2 bg-zinc-100/70 border-b border-zinc-200/60 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setAddMemberTab('select')}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${addMemberTab === 'select'
                  ? 'bg-white text-[#2AC1BC] shadow-xs font-black'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                <span>Chọn khách có sẵn</span>
              </button>

              <button
                type="button"
                onClick={() => setAddMemberTab('create')}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${addMemberTab === 'create'
                  ? 'bg-white text-[#2AC1BC] shadow-xs font-black'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                <span>Tạo mới khách thuê  </span>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {addMemberTab === 'select' ? (
                /* CÁCH 1: CHỌN KHÁCH THUÊ CÓ SẴN TRONG DATA (CÓ SEARCH) */
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-700 font-semibold">
                    Tìm kiếm khách thuê có sẵn trên hệ thống.
                  </div>

                  {/* Thanh Tìm Kiếm Khách Thuê */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Tìm kiếm khách thuê</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        placeholder="Nhập tên, số điện thoại, CCCD để tìm nhanh..."
                        className="w-full pl-9 pr-8 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900 bg-white"
                      />
                      {memberSearchQuery && (
                        <button
                          onClick={() => setMemberSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 rounded-full"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dropdown danh sách kết quả tìm kiếm */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-zinc-700">Chọn khách thuê *</label>
                      <span className="text-[10px] text-zinc-400 font-bold">
                        {existingCustomers.filter(c => !memberSearchQuery.trim() || c.name.toLowerCase().includes(memberSearchQuery.toLowerCase().trim()) || c.phone.includes(memberSearchQuery.trim()) || c.cccd.includes(memberSearchQuery.trim())).length} / {existingCustomers.length} khách thuê
                      </span>
                    </div>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectExistingCustomer(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                    >
                      <option value="">-- Bấm chọn khách thuê --</option>
                      {existingCustomers
                        .filter(c => {
                          if (!memberSearchQuery.trim()) return true;
                          const q = memberSearchQuery.toLowerCase().trim();
                          return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.cccd.includes(q);
                        })
                        .map((cust, idx) => (
                          <option key={`${cust.id}-${idx}`} value={cust.id}>
                            {cust.name} — SĐT: {cust.phone} (CCCD: {cust.cccd})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Preview Khách Thuê Đã Chọn */}
                  {newMemberName ? (
                    <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Khách thuê đã chọn</span>
                      <p className="font-extrabold text-zinc-900 text-sm">{newMemberName}</p>
                      <p className="text-zinc-500 font-medium">SĐT: <strong className="text-zinc-800">{newMemberPhone}</strong> • CCCD: <strong className="text-zinc-800">{newMemberCccd}</strong></p>
                    </div>
                  ) : memberSearchQuery && (
                    /* Danh Sách Kết Quả Nhanh Click-to-Select */
                    <div className="border border-zinc-200 rounded-xl divide-y divide-zinc-100 max-h-40 overflow-y-auto custom-scrollbar">
                      {existingCustomers
                        .filter(c => {
                          const q = memberSearchQuery.toLowerCase().trim();
                          return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.cccd.includes(q);
                        })
                        .slice(0, 5)
                        .map((cust, idx) => (
                          <div
                            key={`quick-${cust.id}-${idx}`}
                            onClick={() => handleSelectExistingCustomer(cust.id)}
                            className="p-2.5 hover:bg-[#2AC1BC]/10 cursor-pointer transition-colors flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-zinc-900 block">{cust.name}</span>
                              <span className="text-[10px] text-zinc-500">SĐT: {cust.phone} • CCCD: {cust.cccd}</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 px-2 py-0.5 rounded-md">Chọn</span>
                          </div>
                        ))}
                      {existingCustomers.filter(c => {
                        const q = memberSearchQuery.toLowerCase().trim();
                        return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.cccd.includes(q);
                      }).length === 0 && (
                          <div className="p-3 text-center text-xs text-zinc-400">Không tìm thấy khách thuê phù hợp với từ khóa "{memberSearchQuery}"</div>
                        )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Quan hệ với chủ Hợp đồng</label>
                    <select
                      value={newMemberRelation}
                      onChange={(e) => setNewMemberRelation(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                    >
                      <option value="Gia đình">Gia đình</option>
                      <option value="Bạn bè">Bạn bè</option>
                      <option value="Đồng nghiệp">Đồng nghiệp</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* CÁCH 2: TẠO MỚI TRONG HỢP ĐỒNG -> TỰ ĐỘNG ĐỒNG BỘ SANG MỤC KHÁCH THUÊ */
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                    ✨ Nhập đầy đủ thông tin bên dưới. Thành viên này sẽ <strong>tự động tạo hồ sơ mới</strong> trong mục Quản Lý Khách Thuê và gắn với Phòng {contract.room}.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="VD: Nguyễn Văn B"
                        className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Số điện thoại *</label>
                      <input
                        type="text"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        placeholder="VD: 0912345678"
                        className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Số CCCD / CMND *</label>
                      <input
                        type="text"
                        value={newMemberCccd}
                        onChange={(e) => setNewMemberCccd(e.target.value)}
                        placeholder="VD: 001099887766"
                        className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-[#2AC1BC]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày sinh</label>
                      <input
                        type="date"
                        value={newMemberDob}
                        onChange={(e) => setNewMemberDob(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Giới tính</label>
                      <select
                        value={newMemberGender}
                        onChange={(e) => setNewMemberGender(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                      >
                        <option value="nam">Nam</option>
                        <option value="nu">Nữ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Quan hệ với chủ HĐ</label>
                      <select
                        value={newMemberRelation}
                        onChange={(e) => setNewMemberRelation(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                      >
                        <option value="Gia đình">Gia đình</option>
                        <option value="Bạn bè">Bạn bè</option>
                        <option value="Đồng nghiệp">Đồng nghiệp</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Quê quán / Địa chỉ thường trú</label>
                      <input
                        type="text"
                        value={newMemberAddress}
                        onChange={(e) => setNewMemberAddress(e.target.value)}
                        placeholder="VD: Quận 1, TP. Hồ Chí Minh"
                        className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Nghề nghiệp</label>
                      <input
                        type="text"
                        value={newMemberJob}
                        onChange={(e) => setNewMemberJob(e.target.value)}
                        placeholder="VD: Sinh viên / Kỹ sư"
                        className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Nơi làm việc / Trường học</label>
                      <input
                        type="text"
                        value={newMemberWorkplace}
                        onChange={(e) => setNewMemberWorkplace(e.target.value)}
                        placeholder="VD: Đại học SPKT"
                        className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button onClick={() => setIsAddMemberModalOpen(false)} className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleAddMember}
                className="px-6 py-2 text-xs font-black text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25ad87] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
              >
                {addMemberTab === 'select' ? 'Gán Thành Viên' : 'Tạo & Đồng Bộ Khách Thuê'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TERMINATE CONTRACT CONFIRMATION */}
      {isTerminateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsTerminateModalOpen(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-zinc-900">Chấm Dứt Hợp Đồng</h3>
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              Bạn có chắc chắn muốn chấm dứt hợp đồng <strong className="text-zinc-900">{contract.id}</strong> (Phòng {contract.room}) không? Thao tác này sẽ chuyển trạng thái HĐ thành "Đã chấm dứt".
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsTerminateModalOpen(false)} className="px-4 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors">
                Hủy
              </button>
              <button onClick={handleTerminate} className="px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer">
                Đồng ý chấm dứt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
