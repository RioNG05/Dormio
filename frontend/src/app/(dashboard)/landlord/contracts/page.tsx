"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileSignature, Filter, MoreHorizontal, X, Check, ChevronRight, ChevronLeft, ChevronDown, DollarSign, Home, Image as ImageIcon, User, Building2, Activity, LayoutGrid, List, FileText, CalendarDays, Ban, ArrowLeft, Copy, Printer, Edit2, Zap, Droplet, Trash2, Wifi, ClipboardList, Shield, UploadCloud, Users, Gauge, History, MapPin, FileSpreadsheet, CreditCard, Eye } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";

export default function ContractsPage() {
  const t = useTranslations("contracts");
  const { activeBuilding } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isDirty, setIsDirty] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("dormio");

  const getBuildingTitle = (id: string) => {
    return activeBuilding.name;
  };
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isCheckoutNoticeModalOpen, setIsCheckoutNoticeModalOpen] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [isAdjustRentModalOpen, setIsAdjustRentModalOpen] = useState(false);
  const [isAdjustDepositModalOpen, setIsAdjustDepositModalOpen] = useState(false);
  const [isAdjustPaymentDateModalOpen, setIsAdjustPaymentDateModalOpen] = useState(false);
  const [adjustRentMethod, setAdjustRentMethod] = useState<'percent' | 'add' | 'set'>('percent');
  const [adjustDepositMethod, setAdjustDepositMethod] = useState<'percent' | 'add' | 'set'>('percent');
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [services, setServices] = useState([
    { id: 1, name: "Bảo vệ", type: "Cố định", price: 50000, unit: "đ/phòng", applied: true },
    { id: 2, name: "Điện", type: "Đồng hồ", price: 3500, unit: "đ/kWh", applied: true },
    { id: 3, name: "Nước", type: "Đồng hồ", price: 25000, unit: "đ/m³", applied: true },
    { id: 4, name: "Rác", type: "Cố định", price: 40000, unit: "đ/phòng", applied: true },
  ]);
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCloseModal = () => {
    if (isDirty) {
      if (window.confirm("Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?")) {
        setIsModalOpen(false);
        setTimeout(() => { setIsDirty(false); setStep(1); }, 200);
      }
    } else {
      setIsModalOpen(false);
      setTimeout(() => setStep(1), 200);
    }
  };

  const formatDateToInput = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const generateMockContracts = () => {
    const data: any[] = [];
    const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
    const dem = ["Văn", "Thị", "Hữu", "Minh", "Đức", "Ngọc", "Xuân", "Thu", "Thanh", "Hải", "Thành", "Công", "Quốc", "Khánh", "Gia"];
    const ten = ["An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Khang", "Linh", "Mai", "Nam", "Oanh", "Phong", "Quang", "Sơn", "Tuấn", "Uyên", "Vinh", "Vy", "Yến", "Tâm", "Thảo", "Trang", "Trung", "Tú", "Anh", "Bảo", "Châu", "Diệp", "Hân", "Khoa"];
    const statuses = ['Đang hiệu lực', 'Quá hạn', 'Đã chấm dứt'];
    const paymentStatuses = ['Đã thu đủ', 'Còn nợ'];

    let tenantIdCounter = 100;
    let contractCounter = 1;

    const generateForBuilding = (buildingId: string, floors: number, roomsPerFloor: number) => {
      for (let f = 1; f <= floors; f++) {
        for (let r = 1; r <= roomsPerFloor; r++) {
          // deterministic "randomness" based on f and r
          const seed = f * 100 + r;

          // 80% chance of being rented
          if (seed % 5 === 0) continue;

          const roomStr = `${f}${r.toString().padStart(2, '0')}`;
          const isOverdue = seed % 4 === 0;
          const buildingHash = buildingId === 'dormio' ? 1 : 2;
          const hash = parseInt(roomStr.replace(/\D/g, '') || "0") * buildingHash * 137 + 19;
          const tenantName = `${ho[hash % ho.length]} ${dem[(hash * 3) % dem.length]} ${ten[(hash * 7) % ten.length]}`;

          const mems = [];
          if (seed % 2 === 0) {
            mems.push({ name: 'Người thân ' + contractCounter, relation: 'Gia đình', phone: '090' + (1000000 + seed * 123) });
            if (seed % 3 === 0) mems.push({ name: 'Bạn bè ' + contractCounter, relation: 'Bạn bè', phone: '091' + (1000000 + seed * 456) });
          }

          const roomType = r % 3 === 0 ? 'Luxury' : r % 2 === 0 ? 'Studio' : '1PN';
          const price = r % 3 === 0 ? '5.000.000' : r % 2 === 0 ? '4.000.000' : '3.500.000';

          data.push({
            id: `HD-01012026-${buildingHash}-${roomStr}`,
            building: buildingId,
            room: roomStr,
            roomType: roomType,
            tenant: tenantName,
            tenantId: `KH${roomStr}-${buildingHash}`,
            startDate: `01/0${(contractCounter % 9) + 1}/2024`,
            endDate: `01/0${(contractCounter % 9) + 1}/2025`,
            isOverdue: isOverdue,
            price: `${price} ₫`,
            deposit: `${price} ₫`,
            paymentDate: `${(contractCounter % 28) + 1}`,
            paymentStatus: isOverdue ? 'Còn nợ' : paymentStatuses[contractCounter % 2],
            status: statuses[contractCounter % 3],
            history: [],
            members: mems
          });

          contractCounter++;
          tenantIdCounter++;
        }
      }
    };

    generateForBuilding('dormio', 4, 15);
    generateForBuilding('vinahouse', 3, 10);

    return data;
  };

  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [contracts, setContracts] = useState(generateMockContracts());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (!isMounted) {
    return null;
  }

  const handleTerminateContract = () => {
    const updated = contracts.map(c => c.id === selectedContract.id ? { ...c, status: 'Đã chấm dứt' } : c);
    setContracts(updated);
    setSelectedContract(updated.find(c => c.id === selectedContract.id));
    setIsTerminateModalOpen(false);
    showToast("Đã chấm dứt hợp đồng", "success");
  };

  const handleExtendContract = (newDate: string) => {
    const updated = contracts.map(c => c.id === selectedContract.id ? { ...c, endDate: formatDateToDisplay(newDate) } : c);
    setContracts(updated);
    setSelectedContract(updated.find(c => c.id === selectedContract.id));
    setIsExtendModalOpen(false);
    showToast("Đã gia hạn hợp đồng", "success");
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentPageIds = paginatedContracts.map(c => c.id);
    if (e.target.checked) {
      setSelectedContractIds(Array.from(new Set([...selectedContractIds, ...currentPageIds])));
    } else {
      setSelectedContractIds(selectedContractIds.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedContractIds([...selectedContractIds, id]);
    } else {
      setSelectedContractIds(selectedContractIds.filter(selectedId => selectedId !== id));
    }
  };

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast("Đã sao chép mã hợp đồng!", "success");
  };

  const handleFinish = () => {
    setIsModalOpen(false);
    setTimeout(() => { setStep(1); setIsDirty(false); }, 200);
  };

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const reason = formData.get("reason") as string;

    if (!reason || reason.trim() === "") {
      showToast("Vui lòng nhập lý do thay đổi hợp đồng!", "error");
      return;
    }

    const updatedContract = {
      ...selectedContract,
      room: formData.get("room"),
      startDate: formatDateToDisplay(formData.get("startDate") as string),
      endDate: formatDateToDisplay(formData.get("endDate") as string),
      price: formData.get("price") + " ₫",
      deposit: formData.get("deposit") + " ₫",
      paymentDate: formData.get("paymentDate"),
    };

    const today = new Date().toLocaleDateString("vi-VN");
    updatedContract.history = [
      { date: today, user: "Admin", content: reason },
      ...(updatedContract.history || [])
    ];

    setContracts(contracts.map(c => c.id === selectedContract.id ? updatedContract : c));
    setSelectedContract(updatedContract);
    setIsEditingContract(false);

    showToast("Đã cập nhật thông tin hợp đồng thành công!", "success");
  };

  const handleSaveCheckoutNotice = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const date = formData.get("checkoutDate") as string;
    const note = formData.get("checkoutNote") as string;

    if (!date) {
      showToast("Vui lòng chọn ngày dự kiến trả phòng!", "error");
      return;
    }

    const updatedContract = {
      ...selectedContract,
      checkoutNotice: {
        date: formatDateToDisplay(date),
        note: note
      }
    };

    setContracts(contracts.map(c => c.id === selectedContract.id ? updatedContract : c));
    setSelectedContract(updatedContract);
    setIsCheckoutNoticeModalOpen(false);
    showToast("Đã ghi nhận thông báo trả phòng!", "success");
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const customer = formData.get("customer") as string;
    const relation = formData.get("relation") as string;
    if (!customer) {
      showToast("Vui lòng chọn khách hàng", "error");
      return;
    }
    setMembers([...members, { name: customer, relation }]);
    setIsAddMemberModalOpen(false);
    showToast("Đã thêm thành viên", "success");
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const priceStr = formData.get("price") as string;
    const isApplied = formData.get("applied") === "on";

    if (!name) {
      showToast("Vui lòng nhập tên dịch vụ", "error");
      return;
    }

    if (editingService) {
      if (!isApplied) {
        setServices(services.map(s => s.id === editingService.id ? { ...s, applied: false } : s));
      } else {
        setServices(services.map(s => s.id === editingService.id ? { ...s, price: priceStr ? parseInt(priceStr) : s.price, applied: true } : s));
      }
      showToast("Đã cập nhật dịch vụ", "success");
    } else {
      setServices([...services, { id: Date.now(), name, type: "Tùy chỉnh", price: priceStr ? parseInt(priceStr) : 0, unit: "VNĐ", applied: true }]);
      showToast("Đã thêm dịch vụ", "success");
    }
    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  const filteredContracts = contracts.filter((c) => {
    if (searchQuery && !c.tenant.toLowerCase().includes(searchQuery.toLowerCase()) && !c.room.includes(searchQuery)) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (buildingFilter && c.building !== buildingFilter) return false;
    return true;
  });

  const totalItems = filteredContracts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedContracts = filteredContracts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-6 relative min-h-screen">
      {selectedContract && isDetailViewOpen ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => { setSelectedContract(null); setIsDetailViewOpen(false); }}
                className="mt-1 p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-900">Phòng {selectedContract.room}</h1>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${selectedContract.status === 'Đang hiệu lực' ? 'bg-green-50 text-green-600 border-green-100' :
                    selectedContract.status === 'Quá hạn' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                    {selectedContract.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-zinc-500">
                  <span className="font-medium text-zinc-700">{selectedContract.building === 'dormio' ? 'Dormio Building' : selectedContract.building === 'vinahouse' ? 'VinaHouse' : 'Dormio Building'}</span>
                  <span>·</span>
                  <span className="font-medium text-primary">{selectedContract.tenant}</span>
                  <span className="hidden sm:inline">|</span>
                  <span>Mã HĐ: {selectedContract.id}</span>
                  <button className="hover:text-zinc-700"><Copy className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsExtendModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <CalendarDays className="w-4 h-4" /> Gia hạn
              </button>
              <button
                onClick={() => setIsTerminateModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-danger bg-danger-bg border border-danger-border rounded-lg hover:bg-orange-100 transition-colors"
              >
                <Ban className="w-4 h-4" /> Chấm dứt
              </button>
              <button
                onClick={() => alert("Hệ thống sẽ tạo form hợp đồng bản PDF để xuất. Chức năng này sẽ được cập nhật sau.")}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <Printer className="w-4 h-4" /> In hợp đồng
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Thông tin hợp đồng */}
              <form onSubmit={handleSaveContract} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-zinc-900">Thông tin hợp đồng</h3>
                  </div>
                  {isEditingContract ? (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setIsEditingContract(false)} className="px-3 py-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Hủy</button>
                      <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors shadow-sm">Lưu thay đổi</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setIsEditingContract(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">
                      <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
                    </button>
                  )}
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1.5">Phòng</div>
                    {isEditingContract ? <input type="text" name="room" defaultValue={selectedContract.room} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" /> : <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">{selectedContract.room}</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1.5">Tòa nhà</div>
                    {isEditingContract ? <input type="text" name="building" defaultValue="Dormio Building" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" /> : <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">Dormio Building</div>}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1.5">Ngày bắt đầu</div>
                    {isEditingContract ? (
                      <input type="date" name="startDate" defaultValue={formatDateToInput(selectedContract.startDate)} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer" />
                    ) : <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">{selectedContract.startDate}</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1.5">Ngày kết thúc</div>
                    {isEditingContract ? (
                      <input type="date" name="endDate" defaultValue={formatDateToInput(selectedContract.endDate)} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer" />
                    ) : <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">{selectedContract.endDate}</div>}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1.5">Giá thuê</div>
                    {isEditingContract ? (
                      <div className="relative">
                        <input type="text" name="price" defaultValue={selectedContract.price.replace(' ₫', '')} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">VNĐ</span>
                      </div>
                    ) : <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">{selectedContract.price}</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1.5">Tiền đặt cọc</div>
                    {isEditingContract ? (
                      <div className="relative">
                        <input type="text" name="deposit" defaultValue={selectedContract.deposit?.replace(' ₫', '') || '0'} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">VNĐ</span>
                      </div>
                    ) : <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">{selectedContract.deposit}</div>}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1.5">{isEditingContract ? "Ngày thanh toán hàng tháng" : "Ngày thanh toán"}</div>
                    {isEditingContract ? (
                      <input type="number" name="paymentDate" min="1" max="31" defaultValue={selectedContract.paymentDate || '5'} className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                    ) : <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">Ngày {selectedContract.paymentDate || '5'} hàng tháng</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1.5">Ngày tạo</div>
                    <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">11/07/2026</div>
                  </div>
                </div>
                {isEditingContract && (
                  <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="border-t border-zinc-100 pt-5 mt-1">
                      <label className="block text-sm font-semibold text-zinc-700 mb-2">Lý do thay đổi <span className="text-red-500">*</span></label>
                      <textarea
                        name="reason"
                        className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        rows={3}
                        placeholder="Nhập lý do thay đổi thông tin hợp đồng để lưu lại lịch sử..."
                      ></textarea>
                    </div>
                  </div>
                )}

                {/* Lịch sử thay đổi */}
                <div className="px-5 py-4 bg-zinc-50/30 border-t border-zinc-100">
                  <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-zinc-500" />
                    Lịch sử thay đổi
                  </h4>
                  {selectedContract.history && selectedContract.history.length > 0 ? (
                    <div className="space-y-3 pl-1.5">
                      {selectedContract.history.map((item: any, idx: number) => (
                        <div key={idx} className="relative pl-4 border-l-2 border-primary/20">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                          <p className="text-sm font-medium text-zinc-800">{item.content}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{item.date} • {item.user}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 italic">Chưa có thay đổi nào.</p>
                  )}
                </div>
              </form>

              {/* Thông báo trả phòng */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <CalendarDays className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold text-zinc-900">Thông báo trả phòng</h3>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {selectedContract.checkoutNotice ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-zinc-500 mb-1">Ngày dự kiến trả phòng</p>
                          <p className="text-sm font-semibold text-zinc-900">{selectedContract.checkoutNotice.date}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-500 mb-1">Ghi chú</p>
                          <p className="text-sm font-semibold text-zinc-900">{selectedContract.checkoutNotice.note || "Không có"}</p>
                        </div>
                      </div>
                      <div>
                        <button onClick={() => setIsCheckoutNoticeModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-lg hover:bg-zinc-200 transition-colors">
                          <Edit2 className="w-4 h-4" /> Cập nhật thông báo
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-600">Khách thuê chưa thông báo trả phòng. Nhấn nút bên dưới để ghi nhận.</p>
                      <div>
                        <button onClick={() => setIsCheckoutNoticeModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-lg hover:bg-zinc-200 transition-colors">
                          <ClipboardList className="w-4 h-4" /> Ghi nhận trả phòng
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Tài liệu hợp đồng */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-zinc-900">Tài liệu hợp đồng</h3>
                </div>
                <div className="p-5">
                  <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group">
                    <div className="p-3 bg-zinc-100 rounded-full group-hover:bg-primary/10 transition-colors mb-3">
                      <UploadCloud className="w-6 h-6 text-zinc-500 group-hover:text-primary" />
                    </div>
                    <h4 className="font-semibold text-zinc-900 text-sm">Kéo thả hoặc nhấn để chọn</h4>
                    <p className="text-xs text-zinc-500 mt-1">0/10 ảnh · mỗi ảnh tối đa 5MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Khách thuê chính */}
              <div onClick={() => router.push(`/landlord/customers?id=${selectedContract.tenantId}`)} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 group-hover:bg-primary/5 transition-colors">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-zinc-900">Khách thuê chính</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl group-hover:bg-primary/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {selectedContract.tenant.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 text-sm">{selectedContract.tenant}</div>
                      <div className="text-xs text-zinc-500">0123456789</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phòng thuê */}
              <div onClick={() => router.push(`/landlord/rooms?id=${selectedContract.room}`)} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-green-500/30 transition-all group">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 group-hover:bg-green-50/50 transition-colors">
                  <Home className="w-4 h-4 text-green-500" />
                  <h3 className="font-semibold text-zinc-900">Phòng thuê</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 p-3 bg-green-50/50 border border-green-100 rounded-xl group-hover:bg-green-100/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-green-700 text-sm">Phòng {selectedContract.room}</div>
                      <div className="text-xs text-green-600/80">{selectedContract.roomType}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thành viên */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-zinc-900">Thành viên</h3>
                  </div>
                  <button onClick={() => setIsAddMemberModalOpen(true)} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
                    <Plus className="w-3 h-3" /> Thêm
                  </button>
                </div>
                <div className="p-0">
                  {members.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                      {members.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 hover:bg-zinc-50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-sm">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 text-sm">{m.name}</div>
                            <div className="text-xs text-zinc-500">{m.relation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 text-center">
                      <p className="text-sm text-zinc-500">Chưa có thành viên nào</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dịch vụ */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <h3 className="font-semibold text-zinc-900">Dịch vụ</h3>
                  </div>
                  <button onClick={() => { setEditingService(null); setIsServiceModalOpen(true); }} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
                    <Plus className="w-3 h-3" /> Thêm
                  </button>
                </div>
                <div className="p-0 divide-y divide-zinc-100">
                  {services.filter(s => s.applied).map(service => (
                    <div key={service.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900">{service.name}</span>
                        <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">{service.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-orange-600">
                          {service.price > 0 ? service.price.toLocaleString() : "Miễn phí"} <span className="text-xs text-zinc-500 font-normal">{service.price > 0 ? service.unit : ""}</span>
                        </span>
                        <button onClick={() => { setEditingService(service); setIsServiceModalOpen(true); }} className="text-zinc-400 hover:text-zinc-700 transition-colors"><Edit2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                  {services.filter(s => s.applied).length === 0 && (
                    <div className="p-5 text-center">
                      <p className="text-sm text-zinc-500">Chưa có dịch vụ nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Shared modals are rendered at the bottom */}

          {/* Checkout Notice Modal */}
          {isCheckoutNoticeModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md">
              <form onSubmit={handleSaveCheckoutNotice} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                  <h3 className="text-lg font-bold text-zinc-900">Ghi nhận thông báo trả phòng</h3>
                  <button type="button" onClick={() => setIsCheckoutNoticeModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Ngày dự kiến trả phòng <span className="text-red-500">*</span></label>
                    <input type="date" name="checkoutDate" defaultValue={formatDateToInput(selectedContract.checkoutNotice?.date)} required className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Ghi chú</label>
                    <input type="text" name="checkoutNote" defaultValue={selectedContract.checkoutNotice?.note} placeholder="Trả muộn 15 ngày" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
                  <button type="button" onClick={() => setIsCheckoutNoticeModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">
                    Hủy
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Member Modal */}
          {isAddMemberModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md">
              <form onSubmit={handleSaveMember} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                  <h3 className="text-lg font-bold text-zinc-900">Thêm thành viên</h3>
                  <button type="button" onClick={() => setIsAddMemberModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Khách hàng <span className="text-red-500">*</span></label>
                    <select name="customer" required className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white">
                      <option value="">Chọn khách hàng</option>
                      <option value="Trần Thị B">Trần Thị B</option>
                      <option value="Nguyễn Văn A">Nguyễn Văn A</option>
                      <option value="Lê Văn C">Lê Văn C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Quan hệ</label>
                    <input type="text" name="relation" placeholder="VD: Vợ/chồng, Con, Bạn cùng phòng..." className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
                  <button type="button" onClick={() => setIsAddMemberModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">
                    Huỷ
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
                    Thêm
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Service Modal */}
          {isServiceModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md">
              <form onSubmit={handleSaveService} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                  <h3 className="text-lg font-bold text-zinc-900">{editingService ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ"}</h3>
                  <button type="button" onClick={() => { setIsServiceModalOpen(false); setEditingService(null); }} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Dịch vụ</label>
                    <input type="text" name="name" defaultValue={editingService?.name || ""} placeholder="Nhập tên dịch vụ mới..." readOnly={!!editingService} className={`w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${editingService ? 'bg-zinc-100 text-zinc-500 outline-none' : ''}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Giá tùy chỉnh (để trống dùng giá mặc định)</label>
                    <div className="relative">
                      <input type="number" name="price" defaultValue={editingService?.price || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">VNĐ</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Lý do điều chỉnh</label>
                    <input type="text" name="reason" placeholder="VD: Điều chỉnh theo yêu cầu của khách" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                  {editingService && (
                    <label className="flex items-center gap-2 mt-4 cursor-pointer w-max">
                      <input type="checkbox" name="applied" defaultChecked={editingService.applied} className="w-4 h-4 text-primary rounded border-zinc-300 focus:ring-primary" />
                      <span className="text-sm font-medium text-zinc-900">Đang áp dụng</span>
                    </label>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
                  <button type="button" onClick={() => { setIsServiceModalOpen(false); setEditingService(null); }} className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">
                    Huỷ
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Toast Notification */}
          {toast && (
            <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl shadow-black/5 text-sm font-medium animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === "success" ? "bg-zinc-900 text-white" : "bg-red-50 text-red-600 border border-red-100"}`}>
              {toast.type === "success" ? <Check className="w-4 h-4 text-primary" /> : <Ban className="w-4 h-4" />}
              {toast.message}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Quản lý hợp đồng</h1>
              <p className="text-sm text-zinc-500">Danh sách hợp đồng thuê phòng, thời hạn và tình trạng thanh toán</p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => alert("Tính năng Import hợp đồng bằng file Excel đang được phát triển.")}
                className="cursor-pointer px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4 text-emerald-600" /> Import
              </button>
              <button
                onClick={() => alert("Đã xuất danh sách hợp đồng ra file Excel thành công!")}
                className="cursor-pointer px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Lập hợp đồng mới
              </button>
            </div>
          </div>

          {/* Building Overview Banner Card */}
          <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
              <FileSignature className="w-64 h-64" />
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
                  {t("bannerSub")}
                </p>
              </div>

          {/* 4 Unified Stat Chips (Aesthetic Single Row matching Assets, Services, Customers) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[135px]">
              <FileSignature className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">{t("totalContractsShort")}</span>
                <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">{contracts.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">{t("activeShort")}</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{contracts.filter(c => c.status === "Còn hiệu lực" || c.status === "Đang hiệu lực").length}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full lg:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">{t("expiringSoon")}</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{contracts.filter(c => c.status === "Sắp hết hạn" || c.status === "Quá hạn").length}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">{t("terminated")}</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{contracts.filter(c => c.status === "Chấm dứt" || c.status === "Đã chấm dứt").length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SINGLE ROW TOOLBAR (Filter Pills + Search Bar all in 1 Row) */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {[
              { label: t("all"), value: "" },
              { label: t("active"), value: "Đang hiệu lực" },
              { label: t("expiringSoon"), value: "Sắp hết hạn" },
              { label: t("expired"), value: "Quá hạn" },
              { label: t("terminated"), value: "Đã chấm dứt" },
            ].map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => { setStatusFilter(tab.value); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/20"
                      : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/80"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input & View Mode Switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm tên, số phòng, mã HĐ..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shrink-0">
              <button
                onClick={() => { setViewMode("grid"); setRowsPerPage(6); setCurrentPage(1); }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-[#2AC1BC] shadow-2xs font-extrabold" : "text-zinc-500 hover:text-zinc-900"}`}
                title="Xem dạng thẻ (Grid)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setViewMode("list"); setRowsPerPage(10); setCurrentPage(1); }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? "bg-white text-[#2AC1BC] shadow-2xs font-extrabold" : "text-zinc-500 hover:text-zinc-900"}`}
                title="Xem dạng bảng (List)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid View or Table View Container */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedContracts.length === 0 ? (
            <div className="col-span-full p-8 text-center text-zinc-400 font-bold bg-white border border-zinc-200/80 rounded-2xl">
              Không tìm thấy hợp đồng nào phù hợp với bộ lọc.
            </div>
          ) : (
            paginatedContracts.map((c, idx) => {
              const isSelected = selectedContractIds.includes(c.id);
              return (
                <div
                  key={c.id || idx}
                  onClick={() => router.push(`/landlord/contracts/${c.id}`)}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                    isSelected ? 'border-[#2AC1BC] bg-[#2AC1BC]/5 ring-2 ring-[#2AC1BC]/20' : 'border-zinc-200/80 hover:border-[#2AC1BC]/40'
                  }`}
                >
                  {/* Card Header: Checkbox + Room & Building & Status */}
                  <div>
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
                      <div className="flex items-start gap-2.5">
                        <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(e, c.id)}
                            className="rounded border-zinc-300 text-[#2AC1BC] focus:ring-[#2AC1BC] cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-base text-zinc-900 group-hover:text-[#2AC1BC] transition-colors">
                              Phòng {c.room}
                            </h3>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              {c.building === 'dormio' ? 'Dormio Premier' : 'Dormio Campus'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 font-bold flex items-center gap-1 mt-0.5">
                            <span>Mã: {c.id}</span>
                            <button
                              onClick={(e) => copyToClipboard(e, c.id)}
                              className="p-0.5 hover:text-[#2AC1BC] transition-colors rounded"
                              title="Sao chép mã hợp đồng"
                            >
                              <Copy className="w-3 h-3 text-zinc-400 hover:text-[#2AC1BC]" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-full border shrink-0 ${
                        c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        c.status === 'Sắp hết hạn' || c.status === 'Quá hạn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực' ? 'bg-emerald-500' :
                          c.status === 'Sắp hết hạn' || c.status === 'Quá hạn' ? 'bg-amber-500' : 'bg-zinc-400'
                        }`} />
                        {c.status}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="py-3 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400" /> Đại diện thuê:
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="font-extrabold text-zinc-900">{c.tenant}</span>
                          {c.members && c.members.length > 0 && (
                            <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                              <Users className="w-3 h-3 text-zinc-400" /> +{c.members.length} người ở cùng
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-zinc-400" /> Giá thuê:
                        </span>
                        <span className="font-black text-sm text-[#2AC1BC]">{c.price} / tháng</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-zinc-400" /> Thời hạn:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-800">{c.startDate} - {c.endDate}</span>
                          {c.isOverdue && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Hết hạn
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                        <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-zinc-400" /> Thu tiền:
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold rounded-full border ${
                          c.paymentStatus === 'Đã thu đủ' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {c.paymentStatus === 'Còn nợ' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                          {c.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedContract(c); setIsDetailViewOpen(true); }}
                      className="px-3 py-1.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC] text-[#2AC1BC] hover:text-white border border-[#2AC1BC]/30 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedContract(c); setIsExtendModalOpen(true); }}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Gia hạn hợp đồng"
                      >
                        <CalendarDays className="w-3.5 h-3.5" /> Gia hạn
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedContract(c); setIsTerminateModalOpen(true); }}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Chấm dứt hợp đồng"
                      >
                        <Ban className="w-3.5 h-3.5" /> Chấm dứt
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table Container with Visible Horizontal Scrollbar */
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full min-w-[850px] text-xs text-left border-collapse">
              <thead className="text-[11px] font-black text-zinc-500 uppercase bg-zinc-100/90 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-20 shadow-xs">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={paginatedContracts.length > 0 && paginatedContracts.every(c => selectedContractIds.includes(c.id))}
                      onChange={handleSelectAll}
                      className="rounded border-zinc-300 text-[#2AC1BC] focus:ring-[#2AC1BC] cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-3.5 whitespace-nowrap">PHÒNG & MÃ HĐ</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">KHÁCH THUÊ</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">THỜI HẠN HỢP ĐỒNG</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">GIÁ THUÊ</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">THU TIỀN</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">TRẠNG THÁI</th>
                  <th className="px-5 py-3.5 text-right whitespace-nowrap">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {paginatedContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-400 font-bold">
                      Không tìm thấy hợp đồng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedContracts.map((c, idx) => {
                    const isSelected = selectedContractIds.includes(c.id);
                    return (
                      <tr
                        key={c.id || idx}
                        onClick={() => router.push(`/landlord/contracts/${c.id}`)}
                        className={`hover:bg-zinc-50/80 transition-colors group cursor-pointer ${isSelected ? 'bg-[#2AC1BC]/5' : ''}`}
                      >
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(e, c.id)}
                            className="rounded border-zinc-300 text-[#2AC1BC] focus:ring-[#2AC1BC] cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-[#2AC1BC]">Phòng {c.room}</span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                {c.building === 'dormio' ? 'Dormio Premier' : 'Dormio Campus'}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-bold">
                              <span>{c.id}</span>
                              <button
                                onClick={(e) => copyToClipboard(e, c.id)}
                                className="p-1 hover:text-[#2AC1BC] transition-colors hover:bg-zinc-100 rounded"
                                title="Sao chép mã hợp đồng"
                              >
                                <Copy className="w-3 h-3 text-zinc-400 hover:text-[#2AC1BC]" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-zinc-900 text-sm">{c.tenant}</span>
                            {c.members && c.members.length > 0 && (
                              <span className="text-[10px] font-bold text-zinc-500 mt-0.5 flex items-center gap-1">
                                <Users className="w-3 h-3 text-zinc-400" /> +{c.members.length} thành viên
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-700 text-xs">{c.startDate} <span className="text-zinc-300 font-normal">-</span> {c.endDate}</span>
                            {c.isOverdue && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                Hết hạn
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-black text-zinc-900 text-sm whitespace-nowrap">
                          {c.price}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-full border ${c.paymentStatus === 'Đã thu đủ' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                            {c.paymentStatus === 'Còn nợ' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>}
                            {c.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold rounded-full border ${c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            c.status === 'Sắp hết hạn' || c.status === 'Quá hạn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-zinc-100 text-zinc-600 border-zinc-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực' ? 'bg-emerald-500' :
                              c.status === 'Sắp hết hạn' || c.status === 'Quá hạn' ? 'bg-amber-500' : 'bg-zinc-400'
                              }`}></span>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 text-zinc-400">
                            <button
                              onClick={(e) => { e.stopPropagation(); setIsExtendModalOpen(true); setSelectedContract(c); }}
                              className="p-1.5 hover:text-[#2AC1BC] hover:bg-[#2AC1BC]/10 rounded-lg transition-colors cursor-pointer"
                              title="Gia hạn hợp đồng"
                            >
                              <CalendarDays className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setIsTerminateModalOpen(true); setSelectedContract(c); }}
                              className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Chấm dứt hợp đồng"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                  value={rowsPerPage || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setRowsPerPage(isNaN(val) || val <= 0 ? 1 : val);
                    setCurrentPage(1);
                  }}
                  className="w-12 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs"
                />
                <span>/ trang</span>
              </div>

              <span className="hidden sm:inline text-zinc-300">|</span>

              <div>
                <span className="font-extrabold text-zinc-800">{totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> - <span className="font-extrabold text-zinc-800">{Math.min(currentPage * rowsPerPage, totalItems)}</span> trên tổng số <span className="font-extrabold text-zinc-800">{totalItems}</span> hợp đồng
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

          {/* Floating Action Bar */}
          {selectedContractIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[40] bg-white/80 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 px-2 py-2 flex items-center gap-2 animate-in slide-in-from-bottom-10 fade-in duration-500">
              <div className="px-5 py-2 bg-gradient-to-r from-primary to-primary-hover text-white font-bold text-sm rounded-full whitespace-nowrap shadow-md shadow-primary/20">
                {selectedContractIds.length} hợp đồng
              </div>
              <div className="w-px h-6 bg-zinc-200/50 mx-1"></div>
              <button onClick={() => setIsExtendModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-white hover:shadow-sm rounded-full transition-all whitespace-nowrap">
                <CalendarDays className="w-4 h-4 text-primary" /> Gia hạn
              </button>
              <button onClick={() => setIsAdjustRentModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-white hover:shadow-sm rounded-full transition-all whitespace-nowrap">
                <DollarSign className="w-4 h-4 text-primary" /> Giá thuê
              </button>
              <button onClick={() => setIsAdjustDepositModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-white hover:shadow-sm rounded-full transition-all whitespace-nowrap">
                <FileText className="w-4 h-4 text-primary" /> Tiền cọc
              </button>
              <button onClick={() => setIsAdjustPaymentDateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-white hover:shadow-sm rounded-full transition-all whitespace-nowrap">
                <CalendarDays className="w-4 h-4 text-primary" /> Ngày thu
              </button>
              <div className="w-px h-6 bg-zinc-200/50 mx-1"></div>
              <button onClick={() => setSelectedContractIds([])} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Shared Modals */}
      {isAdjustRentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsAdjustRentModalOpen(false); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900">Điều chỉnh giá thuê · {selectedContractIds.length} hợp đồng</h2>
              <button onClick={() => setIsAdjustRentModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-2">Cách điều chỉnh</label>
                <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                  <button onClick={() => setAdjustRentMethod('percent')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${adjustRentMethod === 'percent' ? 'bg-primary text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>Theo %</button>
                  <button onClick={() => setAdjustRentMethod('add')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${adjustRentMethod === 'add' ? 'bg-primary text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>Cộng/trừ</button>
                  <button onClick={() => setAdjustRentMethod('set')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${adjustRentMethod === 'set' ? 'bg-primary text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>Đặt giá trị</button>
                </div>
              </div>

              {adjustRentMethod === 'percent' && (
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-2">Phần trăm (+/-)</label>
                  <div className="relative">
                    <input type="text" placeholder="VD: 10 hoặc -5" className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-200 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400 pointer-events-none">%</span>
                  </div>
                </div>
              )}

              {adjustRentMethod === 'add' && (
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-2">Số tiền (+/-)</label>
                  <div className="relative">
                    <input type="text" placeholder="VD: 200000" className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-200 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400 pointer-events-none">đ</span>
                  </div>
                </div>
              )}

              {adjustRentMethod === 'set' && (
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-2">Giá trị mới</label>
                  <div className="relative">
                    <input type="text" placeholder="VND" className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-200 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400 pointer-events-none">VNĐ</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-2">Lý do</label>
                <textarea placeholder="VD: Điều chỉnh giá định kỳ 2026" rows={3} className="w-full px-4 py-3 text-sm font-medium border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-zinc-400"></textarea>
              </div>
            </div>

            <div className="p-6 pt-2 flex justify-between gap-3">
              <button onClick={() => setIsAdjustRentModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors w-1/3 text-center">Hủy</button>
              <button onClick={() => { setIsAdjustRentModalOpen(false); showToast(`Đã điều chỉnh giá thuê cho ${selectedContractIds.length} hợp đồng`, "success"); }} className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-hover transition-colors shadow-sm w-2/3 text-center">Áp dụng</button>
            </div>
          </div>
        </div>
      )}

      {isAdjustDepositModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsAdjustDepositModalOpen(false); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900">Điều chỉnh tiền cọc · {selectedContractIds.length} hợp đồng</h2>
              <button onClick={() => setIsAdjustDepositModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-2">Cách điều chỉnh</label>
                <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                  <button onClick={() => setAdjustDepositMethod('percent')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${adjustDepositMethod === 'percent' ? 'bg-primary text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>Theo %</button>
                  <button onClick={() => setAdjustDepositMethod('add')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${adjustDepositMethod === 'add' ? 'bg-primary text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>Cộng/trừ</button>
                  <button onClick={() => setAdjustDepositMethod('set')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${adjustDepositMethod === 'set' ? 'bg-primary text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>Đặt giá trị</button>
                </div>
              </div>

              {adjustDepositMethod === 'percent' && (
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-2">Phần trăm (+/-)</label>
                  <div className="relative">
                    <input type="text" placeholder="VD: 10 hoặc -5" className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-200 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400 pointer-events-none">%</span>
                  </div>
                </div>
              )}

              {adjustDepositMethod === 'add' && (
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-2">Số tiền (+/-)</label>
                  <div className="relative">
                    <input type="text" placeholder="VD: 200000" className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-200 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400 pointer-events-none">đ</span>
                  </div>
                </div>
              )}

              {adjustDepositMethod === 'set' && (
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-2">Giá trị mới</label>
                  <div className="relative">
                    <input type="text" placeholder="VND" className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-200 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400 pointer-events-none">VNĐ</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-2">Lý do</label>
                <textarea placeholder="VD: Điều chỉnh giá định kỳ 2026" rows={3} className="w-full px-4 py-3 text-sm font-medium border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-zinc-400"></textarea>
              </div>
            </div>

            <div className="p-6 pt-2 flex justify-between gap-3">
              <button onClick={() => setIsAdjustDepositModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors w-1/3 text-center">Hủy</button>
              <button onClick={() => { setIsAdjustDepositModalOpen(false); showToast(`Đã điều chỉnh tiền cọc cho ${selectedContractIds.length} hợp đồng`, "success"); }} className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-hover transition-colors shadow-sm w-2/3 text-center">Áp dụng</button>
            </div>
          </div>
        </div>
      )}

      {isAdjustPaymentDateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsAdjustPaymentDateModalOpen(false); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900">Đổi ngày thu tiền · {selectedContractIds.length} hợp đồng</h2>
              <button onClick={() => setIsAdjustPaymentDateModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-2">Ngày thu tiền hàng tháng</label>
                <input type="text" placeholder="1-31" className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>
            <div className="p-6 pt-2 flex justify-between gap-3">
              <button onClick={() => setIsAdjustPaymentDateModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors w-1/3 text-center">Hủy</button>
              <button onClick={() => { setIsAdjustPaymentDateModalOpen(false); showToast(`Đã đổi ngày thu tiền cho ${selectedContractIds.length} hợp đồng`, "success"); }} className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-hover transition-colors shadow-sm w-2/3 text-center">Áp dụng</button>
            </div>
          </div>
        </div>
      )}

      {isExtendModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsExtendModalOpen(false); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900">Gia hạn hợp đồng</h2>
              <button onClick={() => setIsExtendModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">Ngày kết thúc mới <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" placeholder="dd/mm/yyyy" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">Giá thuê mới (VNĐ)</label>
                <div className="relative">
                  <input type="text" placeholder="3.000.000" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">VNĐ</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1.5 font-medium">Để trống nếu giữ nguyên giá hiện tại (3.000.000 ₫)</p>
              </div>
            </div>
            <div className="p-6 pt-2 flex justify-end gap-3">
              <button onClick={() => setIsExtendModalOpen(false)} className="px-5 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">Huỷ</button>
              <button onClick={() => {
                if (selectedContract) {
                  setContracts(contracts.map(c => c.id === selectedContract.id ? { ...c, status: 'Đang hiệu lực' } : c));
                }
                setIsExtendModalOpen(false);
                showToast("Đã gia hạn hợp đồng", "success");
              }} className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-sm">Gia hạn</button>
            </div>
          </div>
        </div>
      )}

      {isTerminateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsTerminateModalOpen(false); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-danger">Chấm dứt hợp đồng</h2>
              <button onClick={() => setIsTerminateModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">Ngày chấm dứt <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" placeholder="dd/mm/yyyy" className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                  <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">Lý do chấm dứt <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select className="w-full pl-3 pr-10 py-2 text-sm border border-zinc-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer">
                    <option value="">Chọn lý do</option>
                    <option value="1">Khách không có nhu cầu thuê tiếp</option>
                    <option value="2">Vi phạm hợp đồng</option>
                    <option value="3">Thỏa thuận chấm dứt sớm</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-4">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Gauge className="w-4 h-4" />
                  <span>Chỉ số đồng hồ cuối</span>
                </div>
                <p className="text-xs text-zinc-500">Ghi chỉ số cuối cùng để tính tiền điện/nước kỳ cuối</p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold w-12 text-zinc-800">Điện</span>
                    <span className="text-sm text-zinc-500 whitespace-nowrap min-w-[50px]">Cũ: 11</span>
                    <div className="relative flex-1">
                      <input type="text" placeholder="Chỉ số mới" className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">kWh</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold w-12 text-zinc-800">Nước</span>
                    <span className="text-sm text-zinc-500 whitespace-nowrap min-w-[50px]">Cũ: 12</span>
                    <div className="relative flex-1">
                      <input type="text" placeholder="Chỉ số mới" className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">m³</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 pt-2 flex justify-end gap-3">
              <button onClick={() => setIsTerminateModalOpen(false)} className="px-5 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">Huỷ</button>
              <button onClick={() => {
                if (selectedContract) {
                  setContracts(contracts.map(c => c.id === selectedContract.id ? { ...c, status: 'Đã chấm dứt' } : c));
                }
                setIsTerminateModalOpen(false);
                showToast("Đã chấm dứt hợp đồng", "success");
              }} className="px-5 py-2 text-sm font-bold text-white bg-danger rounded-lg hover:bg-danger-hover transition-colors shadow-sm">Chấm dứt</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contract Modal (keeping existing one) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300" onInput={() => setIsDirty(true)} onChange={() => setIsDirty(true)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-zinc-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-primary rounded-lg">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Tạo hợp đồng mới</h2>
                  <p className="text-sm text-zinc-500">Hoàn thiện thông tin để tạo hợp đồng điện tử</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors absolute top-4 right-4 sm:relative sm:top-0 sm:right-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">

              {/* Progress Bar */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => setStep(1)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors ${step === 1 ? 'bg-primary text-white shadow-md' : step > 1 ? 'bg-blue-50 text-primary' : 'bg-zinc-100 text-zinc-500'
                    }`}
                >
                  {step > 1 ? <Check className="w-4 h-4" /> : <Home className="w-4 h-4" />} Phòng & Khách
                </button>
                <ChevronRight className="w-4 h-4 text-zinc-300 hidden sm:block" />

                <button
                  onClick={() => step > 1 && setStep(2)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors ${step === 2 ? 'bg-primary text-white shadow-md' : step > 2 ? 'bg-blue-50 text-primary' : 'bg-zinc-100 text-zinc-500'
                    }`}
                >
                  {step > 2 ? <Check className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />} Tài chính & Dịch vụ
                </button>
                <ChevronRight className="w-4 h-4 text-zinc-300 hidden sm:block" />

                <button
                  onClick={() => step > 2 && setStep(3)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors ${step === 3 ? 'bg-primary text-white shadow-md' : 'bg-zinc-100 text-zinc-500'
                    }`}
                >
                  <FileSignature className="w-4 h-4" /> Chốt hợp đồng
                </button>
              </div>

              {step === 1 && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">Thông tin phòng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Tòa nhà <span className="text-red-500">*</span></label>
                        <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors bg-white">
                          <option value="">-- Chọn tòa nhà --</option>
                          <option value="toaa">Tòa A</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Phòng <span className="text-red-500">*</span></label>
                        <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors bg-white">
                          <option value="">-- Chọn phòng --</option>
                          <option value="101">101</option>
                          <option value="102">102</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Người đại diện thuê</h3>
                      <button className="text-sm text-primary font-bold hover:underline">Thêm khách mới</button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">Khách thuê <span className="text-red-500">*</span></label>
                      <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors bg-white">
                        <option value="">-- Tìm khách thuê có sẵn --</option>
                        <option value="kh1">Nguyễn Văn A - 0901234567</option>
                      </select>
                      <p className="text-xs text-zinc-500 mt-1">Gõ số điện thoại hoặc tên để tìm kiếm</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-hover shadow-sm transition-all"
                    >
                      Tiếp theo <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">Tài chính</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Giá thuê (VND/tháng) <span className="text-red-500">*</span></label>
                        <input type="text" defaultValue="3.000.000" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Tiền cọc (VND) <span className="text-red-500">*</span></label>
                        <input type="text" defaultValue="3.000.000" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Chu kỳ thu tiền</label>
                        <select className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors bg-white">
                          <option value="1">1 tháng/lần</option>
                          <option value="3">3 tháng/lần</option>
                          <option value="6">6 tháng/lần</option>
                          <option value="12">1 năm/lần</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Ngày thu tiền hàng tháng</label>
                        <input type="number" min="1" max="31" defaultValue="5" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">Thời hạn hợp đồng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Ngày bắt đầu <span className="text-red-500">*</span></label>
                        <input type="date" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors text-zinc-700" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Ngày kết thúc <span className="text-red-500">*</span></label>
                        <input type="date" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors text-zinc-700" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">Chốt chỉ số đồng hồ ban đầu</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Số điện đầu</label>
                        <input type="number" defaultValue="0" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Số nước đầu</label>
                        <input type="number" defaultValue="0" className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Quay lại
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-hover shadow-sm transition-all"
                    >
                      Tiếp theo <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                      <FileSignature className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900">Xác nhận tạo hợp đồng</h2>
                    <p className="text-sm text-zinc-500 mt-1">Bạn có thể tải lên bản scan hợp đồng giấy để lưu trữ.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Đính kèm tài liệu</h3>
                    <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-primary transition-colors cursor-pointer group">
                      <ImageIcon className="w-10 h-10 text-zinc-400 group-hover:text-primary mb-3" />
                      <span className="text-sm font-bold text-zinc-700">Tải lên file PDF hoặc ảnh (tùy chọn)</span>
                      <span className="text-xs text-zinc-500 mt-1">Giới hạn 10MB</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Phòng:</span>
                      <span className="font-bold text-zinc-900">101 - Tòa A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Khách thuê:</span>
                      <span className="font-bold text-zinc-900">Nguyễn Văn A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Thời hạn:</span>
                      <span className="font-bold text-zinc-900">1 năm (15/08/2023 - 15/08/2024)</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-zinc-200">
                      <span className="text-zinc-500 font-medium">Tổng tiền cọc phải thu:</span>
                      <span className="font-bold text-primary text-base">3.000.000 ₫</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Quay lại
                    </button>
                    <button
                      onClick={handleFinish}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-hover shadow-sm transition-all"
                    >
                      <Check className="w-4 h-4" /> Ký hợp đồng
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

