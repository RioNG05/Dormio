"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, MoreHorizontal, UserPlus, X, UploadCloud, User, Plus, Building2, Activity, ArrowUpDown, LayoutGrid, List, ChevronDown, Upload, Download, Target, Users, ChevronLeft, ChevronRight, ArrowLeft, Edit2, Trash2, Phone, Briefcase, CreditCard, Home, Clock, Image as ImageIcon, AlertTriangle } from "lucide-react";

const CustomerDetailView = ({ customer, onBack, onEdit, onDelete }: { customer: any, onBack: () => void, onEdit: () => void, onDelete: () => void }) => {
  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors bg-zinc-50"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase shadow-sm">
              {customer.name.charAt(0)}
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-zinc-900">{customer.name}</h2>
              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${customer.status === 'Đang ở'
                  ? 'bg-blue-100 text-blue-700'
                  : customer.status === 'Sắp hết hợp đồng'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-zinc-100 text-zinc-600'
                }`}>
                {customer.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={onEdit} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors">
            <Edit2 className="w-4 h-4" /> Chỉnh sửa
          </button>
          <button onClick={onDelete} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-danger-hover transition-colors shadow-sm shadow-orange-600/20">
            <Trash2 className="w-4 h-4" /> Xóa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin cá nhân */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 text-sm mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Thông tin cá nhân
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                <div className="text-sm font-medium text-zinc-500">Họ tên</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                <div className="text-sm font-medium text-zinc-500">Số CCCD/CMND</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.cccd}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                <div className="text-sm font-medium text-zinc-500">Ngày sinh</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.dob || "—"}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                <div className="text-sm font-medium text-zinc-500">Giới tính</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.gender === "nam" ? "Nam" : (customer.gender === "nu" ? "Nữ" : (customer.gender ? "Khác" : "—"))}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-zinc-500">Địa chỉ thường trú</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.address || "—"}</div>
              </div>
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 text-sm mb-6 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Thông tin liên hệ
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                <div className="text-sm font-medium text-zinc-500">Số điện thoại</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.phone}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-zinc-500">Email</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.email || "—"}</div>
              </div>
            </div>
          </div>

          {/* Thông tin bổ sung */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 text-sm mb-6 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" /> Thông tin bổ sung
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                <div className="text-sm font-medium text-zinc-500">Nghề nghiệp</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.job || "—"}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                <div className="text-sm font-medium text-zinc-500">Nơi làm việc</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.workplace || "—"}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                <div className="text-sm font-medium text-zinc-500">Ghi chú</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.note || "—"}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                <div className="text-sm font-medium text-zinc-500">Ngày tạo</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.createdAt || "—"}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-zinc-500">Cập nhật lần cuối</div>
                <div className="col-span-2 text-sm font-semibold text-zinc-900">{customer.updatedAt || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Ảnh CCCD/CMND */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 text-sm mb-6 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Ảnh CCCD/CMND
            </h3>
            <div className="space-y-6">
              <div>
                <div className="text-xs font-semibold text-zinc-500 mb-2">Mặt trước</div>
                <div className="border-2 border-dashed border-zinc-200 rounded-xl h-32 flex flex-col items-center justify-center bg-zinc-50/50">
                  <ImageIcon className="w-8 h-8 text-zinc-300 mb-2" />
                  <span className="text-xs text-zinc-400 font-medium">Chưa có ảnh</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500 mb-2">Mặt sau</div>
                <div className="border-2 border-dashed border-zinc-200 rounded-xl h-32 flex flex-col items-center justify-center bg-zinc-50/50">
                  <ImageIcon className="w-8 h-8 text-zinc-300 mb-2" />
                  <span className="text-xs text-zinc-400 font-medium">Chưa có ảnh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phòng hiện tại */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" /> Phòng hiện tại
            </h3>
            <div className="text-sm text-zinc-500 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              {customer.status === 'Đã rời' ? 'Chưa thuê phòng' : `Phòng ${customer.room}`}
            </div>
          </div>

          {/* Lịch sử thuê phòng */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 text-sm mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Lịch sử thuê phòng
            </h3>
            <div className="text-sm text-zinc-500 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              {customer.status === 'Đã rời' ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
                  <div>
                    <div className="font-semibold text-zinc-800">Đã thuê phòng {customer.room}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Trạng thái: Đã rời</div>
                  </div>
                </div>
              ) : (
                'Chưa có lịch sử thuê phòng'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useAuth } from "@/context/AuthContext";

export default function CustomersPage() {
  const { activeBuilding } = useAuth();
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
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });


  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, buildingFilter, statusFilter, sortFilter, itemsPerPage]);

  const handleCloseModal = () => {
    if (isDirty) {
      if (window.confirm("Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?")) {
        setIsModalOpen(false);
        setTimeout(() => setIsDirty(false), 200);
      }
    } else {
      setIsModalOpen(false);
    }
  };

  const generateMockCustomers = () => {
    const data: any[] = [];
    const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
    const dem = ["Văn", "Thị", "Hữu", "Minh", "Đức", "Ngọc", "Xuân", "Thu", "Thanh", "Hải", "Thành", "Công", "Quốc", "Khánh", "Gia"];
    const ten = ["An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Khang", "Linh", "Mai", "Nam", "Oanh", "Phong", "Quang", "Sơn", "Tuấn", "Uyên", "Vinh", "Vy", "Yến", "Tâm", "Thảo", "Trang", "Trung", "Tú", "Anh", "Bảo", "Châu", "Diệp", "Hân", "Khoa"];

    const generateForBuilding = (buildingId: string, floors: number, roomsPerFloor: number) => {
      for (let f = 1; f <= floors; f++) {
        for (let r = 1; r <= roomsPerFloor; r++) {
          const seed = f * 100 + r;
          if (seed % 5 === 0) continue; // Match the skip logic in contracts

          const roomStr = `${f}${r.toString().padStart(2, '0')}`;
          const buildingHash = buildingId === 'dormio' ? 1 : 2;
          const hash = parseInt(roomStr.replace(/\D/g, '') || "0") * buildingHash * 137 + 19;
          const name = `${ho[hash % ho.length]} ${dem[(hash * 3) % dem.length]} ${ten[(hash * 7) % ten.length]}`;

          data.push({
            id: `KH${roomStr}-${buildingHash}`,
            name,
            phone: `09${(10000000 + hash * 1234).toString()}`,
            room: roomStr,
            building: buildingId,
            cccd: `00109${(1000000 + hash * 5678).toString()}`,
            joinDate: `01/0${(hash % 9) + 1}/2024`,
            status: "Đang ở",
            dob: "2000-01-01",
            gender: hash % 2 === 0 ? "nam" : "nu",
            address: "Khu công nghệ cao, TP.HCM",
            email: `kh${roomStr}@gmail.com`,
            job: "Sinh viên",
            workplace: "Đại học SPKT",
            note: "",
            createdAt: "10/07/2026",
            updatedAt: "10/07/2026"
          });
        }
      }
    };

    generateForBuilding('dormio', 4, 15);
    generateForBuilding('vinahouse', 3, 10);

    // Thêm một số khách đã rời
    data.push({
      id: "KH999", name: "Khách Đã Rời", phone: "0900000000", room: "201", building: "dormio", cccd: "0000000", joinDate: "01/01/2023", status: "Đã rời", dob: "1990-01-01", gender: "nam", address: "Hà Nội", email: "old@gmail.com", job: "Nhân viên", workplace: "Công ty", note: "", createdAt: "10/07/2026", updatedAt: "10/07/2026"
    });

    return data;
  };

  const [customers, setCustomers] = useState(generateMockCustomers());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rawId = params.get('id');
      if (rawId) {
        // Handle legacy IDs by appending -1 (dormio default)
        const id = rawId.includes('-') ? rawId : (rawId.startsWith('KH') ? `${rawId}-1` : rawId);
        setTimeout(() => {
          setCustomers(prev => {
            let cust = prev.find(c => c.id === id);
            if (!cust && id.startsWith('KH')) {
              const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
              const dem = ["Văn", "Thị", "Hữu", "Minh", "Đức", "Ngọc", "Xuân", "Thu", "Thanh", "Hải", "Thành", "Công", "Quốc", "Khánh", "Gia"];
              const ten = ["An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Khang", "Linh", "Mai", "Nam", "Oanh", "Phong", "Quang", "Sơn", "Tuấn", "Uyên", "Vinh", "Vy", "Yến", "Tâm", "Thảo", "Trang", "Trung", "Tú", "Anh", "Bảo", "Châu", "Diệp", "Hân", "Khoa"];

              const buildingHash = id.endsWith('-1') ? 1 : 2;
              const roomStr = id.replace('KH', '').split('-')[0];
              const hash = parseInt(roomStr.replace(/\D/g, '') || "0") * buildingHash * 137 + 19;
              const tenantName = `${ho[hash % ho.length]} ${dem[(hash * 3) % dem.length]} ${ten[(hash * 7) % ten.length]}`;
              cust = {
                id: id,
                name: tenantName || "Khách thuê " + roomStr,
                phone: "0901234567",
                room: roomStr,
                building: buildingHash === 1 ? "dormio" : "vinahouse",
                cccd: "001090123456",
                joinDate: "01/01/2024",
                status: "Đang ở",
                dob: "2000-01-01",
                gender: hash % 2 === 0 ? "nam" : "nu",
                address: "Khu công nghệ cao, TP.HCM",
                email: `kh${roomStr}@gmail.com`,
                job: "Sinh viên",
                workplace: "Đại học SPKT",
                note: "",
                createdAt: "10/07/2026",
                updatedAt: "10/07/2026"
              };
            }
            if (cust) {
              setSelectedCustomer(cust);
              if (!prev.find(c => c.id === id)) {
                return [cust, ...prev];
              }
            }
            return prev;
          });
        }, 100);
      }
    }
  }, []);


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
      {selectedCustomer ? (
        <CustomerDetailView
          customer={selectedCustomer}
          onBack={() => setSelectedCustomer(null)}
          onEdit={() => setIsModalOpen(true)}
          onDelete={() => {
            setConfirmModal({
              isOpen: true,
              title: 'Xóa khách thuê',
              message: `Bạn có chắc chắn muốn xóa khách thuê ${selectedCustomer.name} không? Dữ liệu không thể khôi phục.`,
              onConfirm: () => {
                setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
                setSelectedCustomer(null);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
              }
            });
          }}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Quản Lý Khách Thuê — {activeBuilding.name}</h1>
              <p className="text-sm text-zinc-500">Danh sách khách thuê tòa nhà {activeBuilding.name} ({activeBuilding.address})</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                <Upload className="w-4 h-4" /> Import
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Thêm khách thuê
              </button>
            </div>
          </div>

          {/* Overview Banner */}
          <div className="bg-zinc-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
              <Users className="w-64 h-64" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2 max-w-xl">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dormio Building</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Quản lý tổng thể danh sách khách hàng lưu trú, thông tin liên lạc và tình trạng lưu trú hiện tại.
                </p>
              </div>

              <div className="flex flex-col items-end gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10 backdrop-blur-md w-full lg:w-[145px]">
                    <Building2 className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Số tòa nhà</span>
                      <span className="font-black text-white text-lg leading-none mt-1">1</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 rounded-xl border border-primary/20 backdrop-blur-md w-full lg:w-[145px]">
                    <Users className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-primary/80 tracking-wider">Tổng khách thuê</span>
                      <span className="font-black text-primary text-lg leading-none mt-1">{totalCustomers}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-row lg:justify-end gap-3 w-full">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[145px]">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-blue-400/80 tracking-wider">Đang ở</span>
                      <span className="font-black text-white text-lg leading-none mt-1">{stayingCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-orange-500/30 backdrop-blur-md w-full lg:w-[145px]">
                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-orange-400/80 tracking-wider">Sắp hết HĐ</span>
                      <span className="font-black text-white text-lg leading-none mt-1">{expiringCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-zinc-500/30 backdrop-blur-md w-full lg:w-[145px]">
                    <div className="w-2 h-2 rounded-full bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.8)] flex-shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-400/80 tracking-wider">Đã rời</span>
                      <span className="font-black text-white text-lg leading-none mt-1">{leftCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              <div className="relative w-full md:w-64 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm tên, SĐT, CCCD..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Trạng thái */}
              <div className="relative flex-shrink-0">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-lg appearance-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors font-medium"
                >
                  <option value="">Trạng thái</option>
                  <option value="Đang ở">Đang ở</option>
                  <option value="Sắp hết hợp đồng">Sắp hết hợp đồng</option>
                  <option value="Đã rời">Đã rời</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
              </div>

              {/* Sắp xếp */}
              <div className="relative flex-shrink-0">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <select
                  value={sortFilter}
                  onChange={(e) => setSortFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-lg appearance-none hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors font-medium"
                >
                  <option value="">Sắp xếp</option>
                  <option value="name_asc">Theo tên (A-Z)</option>
                  <option value="room_asc">Theo số phòng</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200 shrink-0">
              <button className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-white rounded shadow-sm transition-all"><LayoutGrid className="w-4 h-4" /></button>
              <button className="p-1.5 text-primary bg-white rounded shadow-sm transition-all"><List className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm text-left relative">
                <thead className="text-[11px] font-bold text-zinc-500 uppercase bg-zinc-50/50 border-b border-zinc-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Tên khách thuê</th>
                    <th className="px-6 py-4">SĐT</th>
                    <th className="px-6 py-4">CCCD/CMND</th>
                    <th className="px-6 py-4">Tòa nhà</th>
                    <th className="px-6 py-4">Phòng hiện tại</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4"></th>
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
                        className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                              {customer.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-zinc-900">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-700">{customer.phone}</td>
                        <td className="px-6 py-4 font-medium text-zinc-700">{customer.cccd}</td>
                        <td className="px-6 py-4 font-medium text-zinc-700 capitalize">{customer.building === 'dormio' ? 'Dormio' : 'VinaHouse'}</td>
                        <td className="px-6 py-4 font-medium text-zinc-700">{customer.status === 'Đã rời' ? "—" : customer.room}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${customer.status === 'Đang ở'
                              ? 'bg-blue-100 text-blue-700'
                              : customer.status === 'Sắp hết hợp đồng'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-2 text-sm text-zinc-600 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200/50 shadow-sm">
              <span className="font-medium">Hiển thị</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent focus:outline-none font-bold text-primary cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="font-medium">/ trang</span>
            </div>

            <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-xl border border-zinc-200/50 shadow-sm">
              <span className="text-sm font-medium text-zinc-600">
                {sortedCustomers.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedCustomers.length)} của <span className="font-bold text-zinc-900">{sortedCustomers.length}</span>
              </span>
              <div className="flex gap-1 border-l border-zinc-200/50 pl-3 ml-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Tenant Modal */}
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
                <div className="p-2 bg-accent/10 text-accent rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">{selectedCustomer ? "Chỉnh sửa khách thuê" : "Thêm khách thuê mới"}</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar bg-zinc-50/50">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Họ tên <span className="text-red-500">*</span></label>
                  <input type="text" defaultValue={selectedCustomer?.name || ""} placeholder="Nguyễn Văn A" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Số CCCD/CMND</label>
                  <input type="text" defaultValue={selectedCustomer?.cccd || ""} placeholder="001234567890" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Ngày sinh</label>
                  <input type="date" defaultValue={selectedCustomer?.dob || ""} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white text-zinc-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Giới tính</label>
                  <select defaultValue={selectedCustomer?.gender || "nam"} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white">
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                    <option value="khac">Khác</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Địa chỉ thường trú</label>
                <textarea rows={2} defaultValue={selectedCustomer?.address || ""} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Số điện thoại</label>
                  <input type="tel" defaultValue={selectedCustomer?.phone || ""} placeholder="0901234567" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Email</label>
                  <input type="email" defaultValue={selectedCustomer?.email || ""} placeholder="email@example.com" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Nghề nghiệp</label>
                  <input type="text" defaultValue={selectedCustomer?.job || ""} placeholder="VD: Kỹ sư, Sinh viên..." className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Nơi làm việc</label>
                  <input type="text" defaultValue={selectedCustomer?.workplace || ""} placeholder="VD: Công ty ABC..." className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Ảnh mặt trước</label>
                  <div className="border border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-blue-50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <UploadCloud className="w-5 h-5 text-zinc-400 group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900">Kéo thả hoặc nhấn để chọn</span>
                    <span className="text-xs text-zinc-500 mt-1">Tối đa 5MB</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Ảnh mặt sau</label>
                  <div className="border border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-blue-50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <UploadCloud className="w-5 h-5 text-zinc-400 group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900">Kéo thả hoặc nhấn để chọn</span>
                    <span className="text-xs text-zinc-500 mt-1">Tối đa 5MB</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Ghi chú</label>
                <textarea rows={3} defaultValue={selectedCustomer?.note || ""} placeholder="Ghi chú thêm về khách thuê" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white resize-none"></textarea>
              </div>

            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50/50">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => { setIsModalOpen(false); setIsDirty(false); }}
                className="px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
              >
                {selectedCustomer ? "Lưu thay đổi" : "Lưu khách thuê"}
              </button>
            </div>
          </div>
        </div>
      )}
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

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-500 shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
          <p className="text-sm text-zinc-500">{message}</p>
        </div>
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">Hủy</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-bold text-white bg-danger rounded-lg hover:bg-danger-hover shadow-md shadow-orange-600/20 transition-colors">Đồng ý</button>
        </div>
      </div>
    </div>
  );
}
