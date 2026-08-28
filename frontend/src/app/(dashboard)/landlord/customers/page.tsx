"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, MoreHorizontal, UserPlus, X, UploadCloud, User, Plus, Building2, Activity, ArrowUpDown, LayoutGrid, List, ChevronDown, Upload, Download, Target, Users, ChevronLeft, ChevronRight, ArrowLeft, Edit2, Trash2, Phone, Briefcase, CreditCard, Home, Clock, Image as ImageIcon, AlertTriangle, MapPin, AlertCircle, CheckCircle2, Info, UserCheck, FileSpreadsheet, UserCircle2, PhoneCall, MessageCircle, Eye, Edit3, Link2, Mail, LogOut, Sparkles, ShieldCheck } from "lucide-react";
import { generateMockCustomers, mockSystemTenantUsers, SystemTenantUser } from "./data";
import { useAuth } from "@/context/AuthContext";

export default function CustomersPage() {
  const { activeBuilding } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // Professional Alert Popup Modal State
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "warning" | "error" | "success" | "info";
  }>({
    isOpen: false,
    title: "Thông báo",
    message: "",
    type: "info",
  });

  const showAlert = (message: string, type: "warning" | "error" | "success" | "info" = "warning", title: string = "Thông báo") => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  // 2-Way Add Tenant State
  const [addMode, setAddMode] = useState<"manual" | "existing_user">("manual");
  const [selectedSystemUser, setSelectedSystemUser] = useState<SystemTenantUser | null>(null);
  const [systemSearchTerm, setSystemSearchTerm] = useState("");

  // Form Controlled States
  const [nameInput, setNameInput] = useState("");
  const [cccdInput, setCccdInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [genderInput, setGenderInput] = useState("nam");
  const [addressInput, setAddressInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [jobInput, setJobInput] = useState("");
  const [workplaceInput, setWorkplaceInput] = useState("");
  const [roomInput, setRoomInput] = useState("101");
  const [buildingInput, setBuildingInput] = useState("dormio");
  const [noteInput, setNoteInput] = useState("");
  const [hasAccountState, setHasAccountState] = useState(false);

  // Link Account Modal State
  const [linkAccountModal, setLinkAccountModal] = useState<{ isOpen: boolean; customer: any | null }>({
    isOpen: false,
    customer: null
  });
  const [linkSearchQuery, setLinkSearchQuery] = useState("");


  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, buildingFilter, statusFilter, sortFilter, itemsPerPage]);

  const handleCloseModal = () => {
    if (isDirty) {
      setConfirmModal({
        isOpen: true,
        title: "Xác nhận đóng form",
        message: "Bạn đang có thông tin chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thông tin đã nhập?",
        confirmText: "Hủy thay đổi & Đóng",
        cancelText: "Tiếp tục chỉnh sửa",
        type: "warning",
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

  const [customers, setCustomers] = useState(generateMockCustomers());

  const handleOpenAddModal = () => {
    setSelectedCustomer(null);
    setAddMode("manual");
    setSelectedSystemUser(null);
    setSystemSearchTerm("");
    setNameInput("");
    setCccdInput("");
    setDobInput("");
    setGenderInput("nam");
    setAddressInput("");
    setPhoneInput("");
    setEmailInput("");
    setJobInput("");
    setWorkplaceInput("");
    setRoomInput("101");
    setBuildingInput(activeBuilding?.id || "dormio");
    setNoteInput("");
    setHasAccountState(false);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust: any) => {
    setSelectedCustomer(cust);
    setAddMode(cust.hasAccount ? "existing_user" : "manual");
    setSelectedSystemUser(null);
    setNameInput(cust.name || "");
    setCccdInput(cust.cccd || "");
    setDobInput(cust.dob || "");
    setGenderInput(cust.gender || "nam");
    setAddressInput(cust.address || "");
    setPhoneInput(cust.phone || "");
    setEmailInput(cust.email || "");
    setJobInput(cust.job || "");
    setWorkplaceInput(cust.workplace || "");
    setRoomInput(cust.room || "");
    setBuildingInput(cust.building || "dormio");
    setNoteInput(cust.note || "");
    setHasAccountState(!!cust.hasAccount);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleSelectSystemUser = (user: SystemTenantUser) => {
    setSelectedSystemUser(user);
    setNameInput(user.name);
    setCccdInput(user.cccd);
    setDobInput(user.dob);
    setGenderInput(user.gender);
    setAddressInput(user.address);
    setPhoneInput(user.phone);
    setEmailInput(user.email);
    setJobInput(user.job);
    setWorkplaceInput(user.workplace);
    setHasAccountState(true);
    setIsDirty(true);
  };

  const handleSaveCustomer = () => {
    if (!nameInput.trim()) {
      showAlert("Vui lòng nhập Họ và tên khách thuê!", "warning", "Thiếu thông tin");
      return;
    }
    if (!phoneInput.trim()) {
      showAlert("Vui lòng nhập Số điện thoại liên hệ!", "warning", "Thiếu thông tin");
      return;
    }

    if (selectedCustomer) {
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? {
        ...c,
        name: nameInput.trim(),
        phone: phoneInput.trim(),
        cccd: cccdInput.trim() || c.cccd,
        dob: dobInput,
        gender: genderInput,
        address: addressInput,
        email: emailInput,
        job: jobInput,
        workplace: workplaceInput,
        room: roomInput,
        building: buildingInput,
        note: noteInput,
        hasAccount: hasAccountState,
        accountEmail: hasAccountState ? emailInput : undefined,
        updatedAt: new Date().toLocaleDateString("vi-VN")
      } : c));
      showAlert("Đã cập nhật thông tin khách thuê thành công!", "success", "Cập nhật thành công");
    } else {
      const targetCCCD = cccdInput.trim();
      if (targetCCCD && customers.some(c => c.cccd === targetCCCD)) {
        showAlert(`Khách thuê với số CCCD [${targetCCCD}] đã tồn tại trong danh sách của bạn! Vui lòng kiểm tra lại.`, "error", "Trùng lặp CCCD");
        return;
      }

      const newId = targetCCCD || `00109${Math.floor(1000000 + Math.random() * 9000000)}`;
      const newCust = {
        id: newId,
        name: nameInput.trim(),
        phone: phoneInput.trim(),
        cccd: newId,
        room: roomInput || "101",
        building: buildingInput || "dormio",
        joinDate: new Date().toLocaleDateString("vi-VN"),
        status: "Đang ở",
        dob: dobInput || "2000-01-01",
        gender: genderInput,
        address: addressInput || "TP. Thủ Đức, TP.HCM",
        email: emailInput,
        job: jobInput || "Tự do",
        workplace: workplaceInput || "TP.HCM",
        note: noteInput,
        hasAccount: hasAccountState,
        accountEmail: hasAccountState ? emailInput : undefined,
        createdAt: new Date().toLocaleDateString("vi-VN"),
        updatedAt: new Date().toLocaleDateString("vi-VN")
      };
      setCustomers(prev => [newCust, ...prev]);
      showAlert("Đã thêm khách thuê mới vào danh sách thành công!", "success", "Thêm thành công");
    }

    setIsModalOpen(false);
    setIsDirty(false);
  };

  const handleLinkAccountSubmit = (user: SystemTenantUser) => {
    if (!linkAccountModal.customer) return;

    setCustomers(prev => prev.map(c => c.id === linkAccountModal.customer.id ? {
      ...c,
      name: user.name,
      phone: user.phone,
      email: user.email,
      cccd: user.cccd,
      dob: user.dob,
      gender: user.gender,
      address: user.address,
      job: user.job,
      workplace: user.workplace,
      hasAccount: true,
      accountEmail: user.email,
      updatedAt: new Date().toLocaleDateString("vi-VN")
    } : c));

    setLinkAccountModal({ isOpen: false, customer: null });
    showAlert(`Đã liên kết thành công tài khoản Tenant ${user.name} (${user.email}) với hồ sơ khách thuê!`, "success", "Liên kết thành công");
  };

  const filteredSystemUsers = mockSystemTenantUsers
    .filter(u => !customers.some(c => c.cccd === u.cccd || c.phone === u.phone))
    .filter(u => {
      const q = systemSearchTerm.toLowerCase().trim();
      if (!q) return true;
      return u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.cccd.includes(q);
    });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rawId = params.get('id');
      if (rawId) {
        router.push(`/landlord/customers/${encodeURIComponent(rawId)}`);
      }
    }
  }, [router]);


  if (!isMounted) {
    return null;
  }

  const filteredCustomers = customers.filter(customer => {
    const matchSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.cccd.includes(searchQuery);
    const matchBuilding = buildingFilter === "" || customer.building === buildingFilter;
    const matchStatus = statusFilter === "" || customer.status === statusFilter;
    return matchSearch && matchBuilding && matchStatus;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortFilter === "name_asc") return a.name.localeCompare(b.name);
    if (sortFilter === "room_asc") return a.room.localeCompare(b.room);
    return 0;
  });

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + itemsPerPage);

  const totalCustomers = customers.length;
  const stayingCount = customers.filter(c => c.status === 'Đang ở').length;
  const expiringCount = customers.filter(c => c.status === 'Sắp hết hợp đồng').length;
  const leftCount = customers.filter(c => c.status === 'Đã rời').length;

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            Quản lý khách thuê
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 font-medium">
            Danh sách khách thuê theo tòa nhà, phòng và trạng thái liên kết
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => showAlert("Tính năng Import danh sách khách thuê bằng Excel đang được phát triển.", "info", "Tính năng thử nghiệm")}
            className="cursor-pointer px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" /> Import
          </button>
          <button
            onClick={() => showAlert("Đã xuất danh sách khách thuê ra file Excel thành công!", "success", "Xuất file thành công")}
            className="cursor-pointer px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export
          </button>
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Thêm khách thuê
          </button>
        </div>
      </div>

      {/* Building Overview Banner */}
      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Users className="w-64 h-64" />
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

            {/* Separated Address Line with Integrated Map Link */}
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
              Quản lý tổng thể danh sách khách hàng lưu trú, thông tin liên lạc và tình trạng hợp đồng.
            </p>
          </div>

          {/* 4 Unified Stat Chips (Aesthetic Single Row matching Assets & Services) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[135px]">
              <Users className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Tổng khách</span>
                <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">{totalCustomers}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">Đang ở</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{stayingCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full lg:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Sắp hết HĐ</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{expiringCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Đã rời</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{leftCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SINGLE ROW TOOLBAR (Filter Pills + Search + Sort + View Switcher all in 1 Row) */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left Controls: Status Pills + Search + Sort */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Filter Pills */}
            {[
              { id: "", label: "Tất cả", count: totalCustomers, color: "text-zinc-700 bg-zinc-100 border-zinc-200" },
              { id: "Đang ở", label: "Đang ở", count: stayingCount, color: "text-[#2AC1BC] bg-[#2AC1BC]/10 border-[#2AC1BC]/30" },
              { id: "Sắp hết hợp đồng", label: "Sắp hết HĐ", count: expiringCount, color: "text-orange-700 bg-orange-50 border-orange-200" },
              { id: "Đã rời", label: "Đã rời", count: leftCount, color: "text-blue-700 bg-blue-50 border-blue-200" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap shrink-0 ${statusFilter === tab.id
                    ? "bg-[#2AC1BC] text-white border-[#2AC1BC] shadow-2xs"
                    : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                  }`}
              >
                <span className="whitespace-nowrap">{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black whitespace-nowrap ${statusFilter === tab.id ? "bg-white/20 text-white" : tab.color
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}

            {/* Separator Line */}
            <div className="hidden xl:block h-6 w-px bg-zinc-200 mx-1 shrink-0" />

            {/* Search Input */}
            <div className="relative w-full sm:w-52 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm tên, SĐT, CCCD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
              />
            </div>

            {/* Sort Select */}
            <div className="relative shrink-0">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-100 focus:outline-none focus:border-[#2AC1BC] cursor-pointer transition-colors whitespace-nowrap"
              >
                <option value="">Sắp xếp</option>
                <option value="name_asc">Theo tên (A-Z)</option>
                <option value="room_asc">Theo số phòng</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Right Controls: View Mode Switcher */}
          <div className="flex items-center justify-end gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0 self-end lg:self-auto">
            <button
              onClick={() => { setViewMode("grid"); setItemsPerPage(6); setCurrentPage(1); }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-[#2AC1BC] shadow-2xs font-extrabold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              title="Xem dạng thẻ (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode("list"); setItemsPerPage(10); setCurrentPage(1); }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? "bg-white text-[#2AC1BC] shadow-2xs font-extrabold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              title="Xem dạng bảng (List)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer View: Grid or List */}
      {
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCustomers.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500">
                Không tìm thấy khách thuê phù hợp
              </div>
            ) : (
              paginatedCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black text-sm uppercase shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/landlord/customers/${customer.id}`} className="font-bold text-zinc-900 text-sm hover:text-[#2AC1BC] cursor-pointer transition-colors truncate block">
                          {customer.name}
                        </Link>
                        <p className="text-xs text-zinc-500 font-medium truncate">CCCD: {customer.cccd}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 whitespace-nowrap ${customer.status === 'Đang ở'
                      ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/30'
                      : customer.status === 'Sắp hết hợp đồng'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                      {customer.status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-zinc-50 rounded-xl space-y-1.5 text-xs text-zinc-600">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 font-medium whitespace-nowrap">Tòa & Phòng:</span>
                      <span className="font-bold text-zinc-900 whitespace-nowrap">{customer.building === 'dormio' ? 'Dormio' : 'VinaHouse'} — Phòng {customer.status === 'Đã rời' ? "—" : customer.room}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 font-medium whitespace-nowrap">Ngày ở:</span>
                      <span className="font-semibold text-zinc-800 whitespace-nowrap">{customer.joinDate}</span>
                    </div>
                    {customer.status === 'Sắp hết hợp đồng' && (
                      <div className="flex justify-between items-center pt-1 border-t border-orange-200/60 text-orange-800 font-bold">
                        <span className="whitespace-nowrap">⏳ Hạn hợp đồng:</span>
                        <span className="text-orange-600 animate-pulse whitespace-nowrap">Còn 5 ngày</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Inline Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <a
                      href={`tel:${customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="py-1.5 bg-red-600 text-white border border-zinc-200 rounded-xl text-[11px] font-extrabold hover:bg-red-500 transition-colors text-center flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap"
                    >
                      <PhoneCall className="w-3 h-3" /> Gọi
                    </a>
                    <a
                      href={`https://zalo.me/${customer.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="py-1.5 bg-[#0068FF] text-white rounded-xl text-[11px] font-extrabold hover:bg-[#0052cc] transition-colors text-center flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap"
                    >
                      <MessageCircle className="w-3 h-3" /> Zalo
                    </a>
                    <Link
                      href={`/landlord/customers/${customer.id}`}
                      className="py-1.5 bg-orange-50 text-[#FF6B35] border border-orange-200/80 rounded-xl text-[11px] font-extrabold hover:bg-[#FF6B35] hover:text-white transition-colors text-center flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-3 h-3" /> Xem
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm text-left relative">
                <thead className="text-[11px] font-bold text-zinc-500 uppercase bg-zinc-50/80 border-b border-zinc-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Tên khách thuê</th>
                    <th className="px-6 py-4 whitespace-nowrap">SĐT</th>
                    <th className="px-6 py-4 whitespace-nowrap">CCCD/CMND</th>
                    <th className="px-6 py-4 whitespace-nowrap">Tòa nhà</th>
                    <th className="px-6 py-4 whitespace-nowrap">Phòng hiện tại</th>
                    <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Thao tác nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {sortedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                        Không tìm thấy khách thuê phù hợp
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                        onClick={() => router.push(`/landlord/customers/${customer.id}`)}
                      >
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black text-xs uppercase shrink-0">
                              {customer.name.charAt(0)}
                            </div>
                            <span className="font-bold text-zinc-900 group-hover:text-[#2AC1BC] transition-colors">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-zinc-700 whitespace-nowrap">{customer.phone}</td>
                        <td className="px-6 py-3.5 font-medium text-zinc-700 whitespace-nowrap">{customer.cccd}</td>
                        <td className="px-6 py-3.5 font-medium text-zinc-700 capitalize whitespace-nowrap">{customer.building === 'dormio' ? 'Dormio' : 'VinaHouse'}</td>
                        <td className="px-6 py-3.5 font-medium text-zinc-700 whitespace-nowrap">{customer.status === 'Đã rời' ? "—" : customer.room}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border whitespace-nowrap ${customer.status === 'Đang ở'
                            ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30'
                            : customer.status === 'Sắp hết hợp đồng'
                              ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={`tel:${customer.phone}`}
                              title="Gọi điện"
                              className="px-2.5 py-1 bg-red-600 text-white border border-zinc-200 rounded-lg text-xs font-bold hover:bg-red-500 transition-colors shadow-2xs flex items-center gap-1 whitespace-nowrap"
                            >
                              <PhoneCall className="w-3 h-3" /> Gọi
                            </a>
                            <a
                              href={`https://zalo.me/${customer.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat Zalo"
                              className="px-2.5 py-1 bg-[#0068FF] text-white rounded-lg text-xs font-bold hover:bg-[#0052cc] transition-colors shadow-2xs flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" /> Zalo
                            </a>
                            <Link
                              href={`/landlord/customers/${customer.id}`}
                              className="px-2.5 py-1 bg-orange-50 text-[#FF6B35] border border-orange-200/80 rounded-lg text-xs font-bold hover:bg-[#FF6B35] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> Xem
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

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
            <span className="font-extrabold text-zinc-800">{sortedCustomers.length === 0 ? 0 : startIndex + 1}</span> - <span className="font-extrabold text-zinc-800">{Math.min(startIndex + itemsPerPage, sortedCustomers.length)}</span> trên tổng số <span className="font-extrabold text-zinc-800">{sortedCustomers.length}</span> khách thuê
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

      {/* Add / Edit Tenant Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onInput={() => setIsDirty(true)} onChange={() => setIsDirty(true)}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{selectedCustomer ? "Chỉnh sửa khách thuê" : "Thêm khách thuê mới"}</h2>
                  <p className="text-xs text-zinc-500 font-medium">Quản lý hồ sơ và liên kết tài khoản Tenant trên hệ thống</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar bg-zinc-50/50">

              {/* 2-WAY ADD TENANT SELECTION TABS */}
              {!selectedCustomer && (
                <div className="space-y-3">
                  <div className="p-1.5 bg-zinc-200/60 rounded-2xl border border-zinc-200 grid grid-cols-2 gap-1.5 font-bold text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setAddMode("manual");
                        setSelectedSystemUser(null);
                        setHasAccountState(false);
                      }}
                      className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${addMode === "manual"
                        ? "bg-white text-zinc-900 shadow-xs font-black border border-zinc-200"
                        : "text-zinc-500 hover:text-zinc-800"
                        }`}
                    >
                      <UserPlus className="w-4 h-4 text-[#2AC1BC]" />
                      <span>Khách chưa có account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddMode("existing_user")}
                      className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${addMode === "existing_user"
                        ? "bg-[#FF6B35] text-white shadow-xs font-black"
                        : "text-zinc-500 hover:text-zinc-800"
                        }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Khách đã có account</span>
                    </button>
                  </div>

                  {/* WAY 1 BANNER */}
                  {addMode === "manual" && (
                    <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-medium text-blue-800 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block text-blue-900 mb-0.5">Thêm mới thủ công</span>
                        Khách thuê chưa đăng ký tài khoản trên hệ thống Dormio.
                      </div>
                    </div>
                  )}

                  {/* WAY 2 SYSTEM USER SEARCH & AUTO POPULATE */}
                  {addMode === "existing_user" && (
                    <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#FF6B35]" /> Tìm & Chọn tài khoản trong hệ thống
                        </label>
                        <span className="text-[10px] font-black text-[#FF6B35] bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                          Auto-Fill 100%
                        </span>
                      </div>

                      <div className="relative">
                        <Search className="w-4 h-4 text-[#FF6B35] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={systemSearchTerm}
                          onChange={(e) => setSystemSearchTerm(e.target.value)}
                          placeholder="Nhập tên, số điện thoại (VD: 0912...), email hoặc số CCCD..."
                          className="w-full pl-9 pr-3 py-2 text-xs border border-orange-200 rounded-xl focus:outline-none focus:border-[#FF6B35] bg-white font-bold text-zinc-900 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                        {filteredSystemUsers.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic p-4 text-center bg-white/60 rounded-xl border border-dashed border-zinc-200">Không tìm thấy tài khoản Tenant nào trùng khớp với từ khóa tìm kiếm.</p>
                        ) : (
                          filteredSystemUsers.map((user) => {
                            const isSelected = selectedSystemUser?.userId === user.userId;
                            return (
                              <div
                                key={user.userId}
                                onClick={() => handleSelectSystemUser(user)}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                  ? "bg-gradient-to-r from-orange-50 to-amber-50/50 border-[#FF6B35] ring-2 ring-[#FF6B35]/20 shadow-xs"
                                  : "bg-white border-zinc-200/80 hover:border-orange-300 hover:bg-orange-50/30 hover:shadow-2xs"
                                  }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-[#FF6B35] text-white flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-2xs">
                                    {user.name.charAt(0)}
                                  </div>
                                  <div className="space-y-1 min-w-0">
                                    <div className="font-black text-zinc-900 text-sm truncate flex items-center gap-1.5">
                                      <span>{user.name}</span>
                                      {isSelected && (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">
                                          Đã chọn
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-0.5 text-xs text-zinc-600 font-medium">
                                      <div className="flex items-center gap-1.5 text-zinc-700">
                                        <Phone className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                                        <span className="font-bold text-zinc-800">{user.phone}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-zinc-500">
                                        <CreditCard className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                        <span>CCCD: {user.cccd}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-zinc-500 truncate">
                                        <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                        <span className="truncate">{user.email}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all shrink-0 cursor-pointer ${isSelected
                                    ? "bg-[#FF6B35] text-white shadow-xs"
                                    : "bg-orange-50 text-[#FF6B35] border border-orange-200 hover:bg-[#FF6B35] hover:text-white"
                                    }`}
                                >
                                  {isSelected ? "Đã chọn" : "Chọn thêm"}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {selectedSystemUser && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                          <span>Đã tự động tải và cập nhật hồ sơ từ tài khoản <strong>{selectedSystemUser.name}</strong> ({selectedSystemUser.email})!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PERSONAL INFO FIELDS */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider border-b border-zinc-200 pb-1">THÔNG TIN HỒ SƠ KHÁCH THUÊ</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Họ và tên khách thuê <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Số CCCD / CMND <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={cccdInput}
                      onChange={(e) => setCccdInput(e.target.value)}
                      placeholder="VD: 001201099882"
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="VD: 0987654321"
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Địa chỉ Email</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="VD: email@example.com"
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Ngày sinh</label>
                    <input
                      type="date"
                      value={dobInput}
                      onChange={(e) => setDobInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-800 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Giới tính</label>
                    <select
                      value={genderInput}
                      onChange={(e) => setGenderInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                    >
                      <option value="nam">Nam</option>
                      <option value="nu">Nữ</option>
                      <option value="khac">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Địa chỉ thường trú</label>
                  <textarea
                    rows={2}
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900 bg-white resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Nghề nghiệp</label>
                    <input
                      type="text"
                      value={jobInput}
                      onChange={(e) => setJobInput(e.target.value)}
                      placeholder="VD: Kỹ sư phần mềm, Sinh viên..."
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Nơi làm việc / Học tập</label>
                    <input
                      type="text"
                      value={workplaceInput}
                      onChange={(e) => setWorkplaceInput(e.target.value)}
                      placeholder="VD: Công ty FPT, Đại học SPKT..."
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                    />
                  </div>
                </div>



                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Ghi chú thêm</label>
                  <textarea
                    rows={2}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Ghi chú thêm về thông tin cá nhân khách thuê..."
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900 bg-white resize-none"
                  ></textarea>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="text-xs font-bold text-zinc-500">
                Trạng thái TK: {hasAccountState ? <span className="text-emerald-600 font-extrabold">✓ Đã liên kết Account</span> : <span className="text-amber-600 font-extrabold">Chưa liên kết TK</span>}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomer}
                  className="px-6 py-2 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
                >
                  {selectedCustomer ? "Lưu thay đổi" : "Lưu khách thuê"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* QUICK LINK ACCOUNT MODAL */}
      {
        linkAccountModal.isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setLinkAccountModal({ isOpen: false, customer: null }); }}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-orange-50/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FF6B35] text-white rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-900">Liên Kết Tài Khoản Tenant</h2>
                    <p className="text-xs text-zinc-500 font-medium">Hồ sơ: {linkAccountModal.customer?.name} ({linkAccountModal.customer?.phone})</p>
                  </div>
                </div>
                <button onClick={() => setLinkAccountModal({ isOpen: false, customer: null })} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                    placeholder="Tìm tài khoản theo tên, SĐT, Email..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-orange-200 rounded-xl focus:outline-none focus:border-[#FF6B35] font-bold text-zinc-900 bg-white"
                  />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {mockSystemTenantUsers
                    .filter(u => !linkSearchQuery || u.name.toLowerCase().includes(linkSearchQuery.toLowerCase()) || u.phone.includes(linkSearchQuery) || u.email.toLowerCase().includes(linkSearchQuery))
                    .map((u) => (
                      <div key={u.userId} className="p-3 bg-white border border-zinc-200/80 hover:border-orange-300 hover:bg-orange-50/30 rounded-2xl flex items-center justify-between gap-3 text-xs transition-all shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-[#FF6B35] text-white flex items-center justify-center font-black text-xs uppercase shrink-0 shadow-2xs">
                            {u.name.charAt(0)}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-extrabold text-zinc-900 text-xs truncate">{u.name}</div>
                            <div className="flex flex-col gap-0.5 text-[11px] text-zinc-500 font-medium">
                              <div className="flex items-center gap-1.5 text-zinc-700">
                                <Phone className="w-3 h-3 text-[#FF6B35] shrink-0" />
                                <span className="font-bold">{u.phone}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CreditCard className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span>CCCD: {u.cccd}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <User className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="truncate">{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLinkAccountSubmit(u)}
                          className="px-3.5 py-1.5 bg-[#FF6B35] hover:bg-[#e05a2b] text-white font-black text-xs rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
                        >
                          Liên kết
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-4 border-t border-zinc-100 flex justify-end bg-zinc-50">
                <button onClick={() => setLinkAccountModal({ isOpen: false, customer: null })} className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )
      }
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

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
  type = "warning",
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
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
