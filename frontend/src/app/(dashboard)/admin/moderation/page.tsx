"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import {
  ShieldAlert, ShieldCheck, Search, Filter, Lock, Unlock, Eye,
  AlertTriangle, CheckCircle2, XCircle, LayoutGrid, Table as TableIcon,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Home, Building2,
  Users, MapPin, DollarSign, Calendar, X, AlertCircle, Sparkles, RefreshCw
} from "lucide-react";

interface ListingItem {
  id: string;
  title: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  houseName: string;
  address: string;
  price: number;
  deposit: number;
  roomArea: number;
  status: "active" | "locked" | "reported";
  reportsCount: number;
  reportReasons: string[];
  lockReason?: string;
  lockedAt?: string;
  createdAt: string;
  coverImage: string;
  photosCount: number;
}

interface HouseItem {
  id: string;
  name: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  address: string;
  totalRooms: number;
  occupiedRooms: number;
  status: "active" | "locked" | "reported";
  reportsCount: number;
  reportReasons: string[];
  lockReason?: string;
  lockedAt?: string;
  createdAt: string;
  coverImage: string;
}

export default function AdminModerationPage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  // Tab State
  const [activeTab, setActiveTab] = useState<"listings" | "houses">("listings");

  // Rule #9: Standardized View & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Grid is ALWAYS default
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for grid, 10 for table

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked" | "reported">("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [inspectItem, setInspectItem] = useState<ListingItem | HouseItem | null>(null);
  const [lockTargetItem, setLockTargetItem] = useState<{ id: string; type: "listing" | "house"; title: string } | null>(null);
  const [lockReasonInput, setLockReasonInput] = useState("");
  const [lockPreset, setLockPreset] = useState<string>("fake_images");
  const [unlockTargetItem, setUnlockTargetItem] = useState<{ id: string; type: "listing" | "house"; title: string } | null>(null);

  // Rule #10: Modal Reset Confirmation
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean;
    onDiscard: () => void;
  }>({ isOpen: false, onDiscard: () => {} });

  // Initial Mock Data: Rental Listings
  const [listings, setListings] = useState<ListingItem[]>([
    {
      id: "LST-9001",
      title: isEn ? "Studio Luxury Q1 full balcony only 800k/month" : "Studio Cao cấp Quận 1 view ban công chỉ 800k/tháng",
      landlordName: "Lê Minh Tuấn",
      landlordPhone: "0901.234.567",
      landlordEmail: "tuan.le@gmail.com",
      houseName: "Dormio Signature Q1",
      address: "128 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM",
      price: 800000,
      deposit: 800000,
      roomArea: 35,
      status: "reported",
      reportsCount: 8,
      reportReasons: [
        isEn ? "Unrealistic bait price for District 1" : "Giá ảo câu khách, khi gọi điện báo giá 8 triệu",
        isEn ? "Demanding unverified deposit" : "Yêu cầu chuyển cọc giữ chỗ qua STK lạ",
      ],
      createdAt: "2026-09-02",
      coverImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80",
      photosCount: 6,
    },
    {
      id: "LST-9002",
      title: isEn ? "Cozy Mezzanine Room near FPT University HCMC" : "Phòng gác lửng thoáng mát gần ĐH FPT Sài Gòn",
      landlordName: "Nguyễn Văn Hùng",
      landlordPhone: "0988.765.432",
      landlordEmail: "hung.nguyen@yahoo.com",
      houseName: "Nhà trọ Hưng Thịnh",
      address: "45 Đường D1, Phường Tăng Nhơn Phú A, TP. Thủ Đức",
      price: 3200000,
      deposit: 3200000,
      roomArea: 24,
      status: "active",
      reportsCount: 0,
      reportReasons: [],
      createdAt: "2026-09-04",
      coverImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80",
      photosCount: 4,
    },
    {
      id: "LST-9003",
      title: isEn ? "Cheap single room in Binh Thanh - Ask deposit to personal bank" : "Phòng đơn giá rẻ Bình Thạnh - Chuyển cọc trước để xem phòng",
      landlordName: "Phạm Thu Thảo",
      landlordPhone: "0933.112.233",
      landlordEmail: "thao.pham@gmail.com",
      houseName: "Nhà trọ Bình Thạnh 18",
      address: "220/15 Xô Viết Nghệ Tĩnh, Phường 21, Bình Thạnh, TP.HCM",
      price: 2500000,
      deposit: 5000000,
      roomArea: 18,
      status: "locked",
      reportsCount: 14,
      reportReasons: [
        isEn ? "Scam deposit fraud" : "Lừa cọc xem phòng rồi chặn số điện thoại",
        isEn ? "Fake pictures from web" : "Ảnh chụp khách sạn trên mạng",
      ],
      lockReason: isEn ? "Suspicious fraud deposit collection reported by multiple users" : "Ép buộc khách chuyển cọc ngoài và lừa đảo cọc xem phòng",
      lockedAt: "2026-09-06",
      createdAt: "2026-08-28",
      coverImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop&q=80",
      photosCount: 5,
    },
    {
      id: "LST-9004",
      title: isEn ? "Modern 1BR Apartment in Cau Giay, Hanoi" : "Căn hộ 1 phòng ngủ khép kín Cầu Giấy, Hà Nội",
      landlordName: "Hoàng Văn Tuấn",
      landlordPhone: "0944.556.677",
      landlordEmail: "tuan.hoang@gmail.com",
      houseName: "Dormio Green Hanoi",
      address: "88 Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
      price: 4500000,
      deposit: 4500000,
      roomArea: 32,
      status: "active",
      reportsCount: 0,
      reportReasons: [],
      createdAt: "2026-09-05",
      coverImage: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format&fit=crop&q=80",
      photosCount: 8,
    },
    {
      id: "LST-9005",
      title: isEn ? "Homestay style dorm bed near Foreign Trade University" : "Giường KTX homestay cao cấp gần ĐH Ngoại Thương",
      landlordName: "Vũ Mai Linh",
      landlordPhone: "0911.223.344",
      landlordEmail: "linh.vu@gmail.com",
      houseName: "KTX Sinh Viên Xanh",
      address: "91 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội",
      price: 1600000,
      deposit: 1600000,
      roomArea: 40,
      status: "reported",
      reportsCount: 3,
      reportReasons: [
        isEn ? "Room capacity exceeds listing description" : "Nhồi nhét 12 người trong phòng 20m2, khác với mô tả 4 người",
      ],
      createdAt: "2026-09-01",
      coverImage: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop&q=80",
      photosCount: 5,
    },
    {
      id: "LST-9006",
      title: isEn ? "Airy mini studio near Tan Son Nhat airport" : "Mini Studio thoáng mát gần sân bay Tân Sơn Nhất",
      landlordName: "Trần Bảo Ngọc",
      landlordPhone: "0977.889.900",
      landlordEmail: "ngoc.tran@gmail.com",
      houseName: "Dormio Airport Suites",
      address: "15 Bạch Đằng, Phường 2, Tân Bình, TP.HCM",
      price: 3800000,
      deposit: 3800000,
      roomArea: 28,
      status: "active",
      reportsCount: 0,
      reportReasons: [],
      createdAt: "2026-09-06",
      coverImage: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80",
      photosCount: 7,
    },
    {
      id: "LST-9007",
      title: isEn ? "Independent room near Danang University of Technology" : "Phòng riêng biệt lập gần ĐH Bách Khoa Đà Nẵng",
      landlordName: "Phan Đình Trí",
      landlordPhone: "0935.667.889",
      landlordEmail: "tri.phan@gmail.com",
      houseName: "Nhà trọ Bách Khoa ĐN",
      address: "54 Nguyễn Lương Bằng, Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng",
      price: 1800000,
      deposit: 1800000,
      roomArea: 20,
      status: "active",
      reportsCount: 0,
      reportReasons: [],
      createdAt: "2026-08-30",
      coverImage: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?w=600&auto=format&fit=crop&q=80",
      photosCount: 3,
    },
  ]);

  // Initial Mock Data: Boarding Houses
  const [houses, setHouses] = useState<HouseItem[]>([
    {
      id: "BHS-101",
      name: "Dormio Signature Q1",
      landlordName: "Lê Minh Tuấn",
      landlordPhone: "0901.234.567",
      landlordEmail: "tuan.le@gmail.com",
      address: "128 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM",
      totalRooms: 16,
      occupiedRooms: 12,
      status: "reported",
      reportsCount: 9,
      reportReasons: [
        isEn ? "Reports of fraudulent deposit schemes" : "Bị phản ánh có tin đăng mồi nhử giá ảo và cọc ngoài",
      ],
      createdAt: "2026-07-15",
      coverImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "BHS-102",
      name: "Nhà trọ Hưng Thịnh Thủ Đức",
      landlordName: "Nguyễn Văn Hùng",
      landlordPhone: "0988.765.432",
      landlordEmail: "hung.nguyen@yahoo.com",
      address: "45 Đường D1, Phường Tăng Nhơn Phú A, TP. Thủ Đức",
      totalRooms: 24,
      occupiedRooms: 22,
      status: "active",
      reportsCount: 0,
      reportReasons: [],
      createdAt: "2026-06-10",
      coverImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "BHS-103",
      name: "Nhà trọ Bình Thạnh 18",
      landlordName: "Phạm Thu Thảo",
      landlordPhone: "0933.112.233",
      landlordEmail: "thao.pham@gmail.com",
      address: "220/15 Xô Viết Nghệ Tĩnh, Phường 21, Bình Thạnh, TP.HCM",
      totalRooms: 8,
      occupiedRooms: 3,
      status: "locked",
      reportsCount: 15,
      reportReasons: [
        isEn ? "Multiple fraud complaints from prospective tenants" : "Nhiều khách thuê tố cáo chủ nhà lừa tiền cọc và không giao phòng",
      ],
      lockReason: isEn ? "House suspended due to confirmed deposit fraud" : "Đình chỉ toàn bộ cơ sở do chủ trọ liên tục lừa cọc xem phòng",
      lockedAt: "2026-09-06",
      createdAt: "2026-08-01",
      coverImage: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "BHS-104",
      name: "Dormio Green Hanoi",
      landlordName: "Hoàng Văn Tuấn",
      landlordPhone: "0944.556.677",
      landlordEmail: "tuan.hoang@gmail.com",
      address: "88 Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
      totalRooms: 30,
      occupiedRooms: 28,
      status: "active",
      reportsCount: 0,
      reportReasons: [],
      createdAt: "2026-05-20",
      coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "BHS-105",
      name: "KTX Sinh Viên Xanh",
      landlordName: "Vũ Mai Linh",
      landlordPhone: "0911.223.344",
      landlordEmail: "linh.vu@gmail.com",
      address: "91 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội",
      totalRooms: 12,
      occupiedRooms: 10,
      status: "reported",
      reportsCount: 4,
      reportReasons: [
        isEn ? "Overcrowding in dorm rooms violating fire safety" : "Xếp quá số người quy định, vi phạm quy chuẩn PCCC",
      ],
      createdAt: "2026-08-11",
      coverImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "BHS-106",
      name: "Dormio Airport Suites",
      landlordName: "Trần Bảo Ngọc",
      landlordPhone: "0977.889.900",
      landlordEmail: "ngoc.tran@gmail.com",
      address: "15 Bạch Đằng, Phường 2, Tân Bình, TP.HCM",
      totalRooms: 20,
      occupiedRooms: 19,
      status: "active",
      reportsCount: 0,
      reportReasons: [],
      createdAt: "2026-07-01",
      coverImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80",
    },
  ]);

  // Filtered dataset
  const currentDataset = useMemo(() => {
    const list = activeTab === "listings" ? listings : houses;
    return list.filter((item) => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        item.id.toLowerCase().includes(query) ||
        ("title" in item && item.title.toLowerCase().includes(query)) ||
        ("name" in item && item.name.toLowerCase().includes(query)) ||
        item.landlordName.toLowerCase().includes(query) ||
        item.landlordPhone.includes(query) ||
        item.address.toLowerCase().includes(query);

      // Status
      const matchStatus =
        statusFilter === "all" ||
        item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [activeTab, listings, houses, searchQuery, statusFilter]);

  // Adjust pageSize on viewMode change if standard
  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    setPageSize(mode === "grid" ? 6 : 10);
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalItems = currentDataset.length;
  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === "grid" ? 6 : 10));
  const totalPages = Math.max(1, Math.ceil(totalItems / validPageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * validPageSize;
    return currentDataset.slice(start, start + validPageSize);
  }, [currentDataset, safeCurrentPage, validPageSize]);

  // 5-page window jumping
  const windowStart = Math.floor((safeCurrentPage - 1) / 5) * 5 + 1;
  const windowEnd = Math.min(windowStart + 4, totalPages);
  const pageNumbers = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i);
  }

  // Select all on current page only (Rule #9)
  const isAllCurrentSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedIds.includes(item.id));

  const toggleSelectAllCurrent = () => {
    if (isAllCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedItems.some((item) => item.id === id)));
    } else {
      const pageIds = paginatedItems.map((item) => item.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Lock Action Handlers
  const handleOpenLockModal = (item: ListingItem | HouseItem) => {
    setLockTargetItem({
      id: item.id,
      type: "title" in item ? "listing" : "house",
      title: "title" in item ? item.title : item.name,
    });
    setLockReasonInput("");
    setLockPreset("fake_images");
  };

  const handleConfirmLock = () => {
    if (!lockTargetItem) return;

    let finalReason = lockReasonInput.trim();
    if (!finalReason) {
      if (lockPreset === "fake_images") {
        finalReason = isEn ? "Fake photos copied from internet" : "Ảnh giả mạo, không đúng phòng thực tế";
      } else if (lockPreset === "bait_price") {
        finalReason = isEn ? "Fraudulent bait price" : "Giá ảo câu khách, sai lệch thực tế khi liên hệ";
      } else if (lockPreset === "scam_deposit") {
        finalReason = isEn ? "Scam deposit / Bypassing platform escrow" : "Ép buộc chuyển cọc ngoài, lừa đảo cọc xem phòng";
      } else {
        finalReason = isEn ? "Policy violation" : "Vi phạm quy chế quản lý và kiểm duyệt nền tảng";
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];

    if (lockTargetItem.type === "listing") {
      setListings((prev) =>
        prev.map((item) =>
          item.id === lockTargetItem.id
            ? { ...item, status: "locked", lockReason: finalReason, lockedAt: todayStr }
            : item
        )
      );
    } else {
      setHouses((prev) =>
        prev.map((item) =>
          item.id === lockTargetItem.id
            ? { ...item, status: "locked", lockReason: finalReason, lockedAt: todayStr }
            : item
        )
      );
    }

    setLockTargetItem(null);
    setLockReasonInput("");
  };

  // Unlock Action Handlers
  const handleConfirmUnlock = () => {
    if (!unlockTargetItem) return;

    if (unlockTargetItem.type === "listing") {
      setListings((prev) =>
        prev.map((item) =>
          item.id === unlockTargetItem.id
            ? { ...item, status: "active", lockReason: undefined, lockedAt: undefined, reportsCount: 0, reportReasons: [] }
            : item
        )
      );
    } else {
      setHouses((prev) =>
        prev.map((item) =>
          item.id === unlockTargetItem.id
            ? { ...item, status: "active", lockReason: undefined, lockedAt: undefined, reportsCount: 0, reportReasons: [] }
            : item
        )
      );
    }

    setUnlockTargetItem(null);
  };

  // Rule #10: Modal close with unsaved check
  const handleRequestCloseLockModal = () => {
    if (lockReasonInput.trim().length > 0) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setLockTargetItem(null);
          setLockReasonInput("");
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} });
        },
      });
    } else {
      setLockTargetItem(null);
      setLockReasonInput("");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wide uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              {isEn ? "Content & Property Moderation" : "Kiểm Duyệt & Giám Sát"}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              • {isEn ? "Active by default, admin can inspect & lock" : "Tự do đăng bài & có quyền khóa khi vi phạm"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {isEn ? "Listings & Boarding Houses Inspection" : "Giám Sát Tin Đăng & Cơ Sở Nhà Trọ"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isEn
              ? "All landlord listings and houses are published instantly. Admin verifies reports, checks authenticity, and can suspend fraudulent items."
              : "Người dùng đăng bài và tạo nhà trọ tự động. Admin có quyền kiểm tra tính xác thực, phát hiện gian dối và khóa/đình chỉ ngay lập tức."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-zinc-200/80 rounded-2xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab("listings");
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "listings"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Home className="w-4 h-4 text-orange-600" />
            <span>{isEn ? "Rental Listings" : "Tin đăng phòng"}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-zinc-100 text-zinc-600">
              {listings.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("houses");
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "houses"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>{isEn ? "Boarding Houses" : "Cơ sở nhà trọ"}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-zinc-100 text-zinc-600">
              {houses.length}
            </span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search, Status Filter, View Toggle (Rule #9) */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                activeTab === "listings"
                  ? (isEn ? "Search listing title, landlord, address..." : "Tìm tin đăng, tên chủ trọ, địa chỉ...")
                  : (isEn ? "Search house name, landlord, address..." : "Tìm tên nhà trọ, chủ trọ, địa chỉ...")
              }
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            {(
              [
                { id: "all", label: isEn ? "All" : "Tất cả" },
                { id: "active", label: isEn ? "Active" : "Bình thường" },
                { id: "reported", label: isEn ? "Reported" : "Bị báo cáo" },
                { id: "locked", label: isEn ? "Locked" : "Đã khóa" },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                onClick={() => {
                  setStatusFilter(chip.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === chip.id
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right side: View mode toggle & Batch Actions */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-700 animate-fadeIn">
              <span>{isEn ? `Selected (${selectedIds.length})` : `Đã chọn (${selectedIds.length})`}</span>
              <button
                onClick={() => {
                  // Batch lock
                  if (activeTab === "listings") {
                    setListings((prev) =>
                      prev.map((item) =>
                        selectedIds.includes(item.id)
                          ? { ...item, status: "locked", lockReason: isEn ? "Suspended via bulk admin action" : "Đình chỉ hàng loạt bởi Quản trị viên" }
                          : item
                      )
                    );
                  } else {
                    setHouses((prev) =>
                      prev.map((item) =>
                        selectedIds.includes(item.id)
                          ? { ...item, status: "locked", lockReason: isEn ? "Suspended via bulk admin action" : "Đình chỉ hàng loạt bởi Quản trị viên" }
                          : item
                      )
                    );
                  }
                  setSelectedIds([]);
                }}
                className="px-2 py-0.5 rounded-md bg-orange-600 text-white text-[11px] font-bold hover:bg-orange-700 cursor-pointer"
              >
                {isEn ? "Bulk Lock" : "Khóa hàng loạt"}
              </button>
            </div>
          )}

          {/* Rule #9: Parallel Grid & Table toggles, Grid default */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-orange-600 shadow-2xs font-extrabold" : "text-zinc-400 hover:text-zinc-700"
              }`}
              title={isEn ? "Grid View (Default)" : "Chế độ Lưới (Mặc định)"}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-orange-600 shadow-2xs font-extrabold" : "text-zinc-400 hover:text-zinc-700"
              }`}
              title={isEn ? "Table View" : "Chế độ Bảng"}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Select All on Current Page Bar */}
      {paginatedItems.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-zinc-500">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllCurrentSelected}
              onChange={toggleSelectAllCurrent}
              className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <span>
              {isEn
                ? "Select all on this page"
                : "Chọn tất cả trên trang này"}
            </span>
          </label>
          <span>
            {isEn
              ? `Showing ${paginatedItems.length} of ${totalItems} items`
              : `Hiển thị ${paginatedItems.length} trên ${totalItems} mục`}
          </span>
        </div>
      )}

      {/* Main Content: Grid View or Table View */}
      {paginatedItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">
            {isEn ? "No matching records found" : "Không tìm thấy dữ liệu phù hợp"}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {isEn
              ? "Try adjusting your search query or filter to see more items."
              : "Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc trạng thái."}
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isEn ? "Reset filters" : "Đặt lại bộ lọc"}
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9: Default 6 items) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map((item) => {
            const isListing = "title" in item;
            const isSelected = selectedIds.includes(item.id);
            const isLocked = item.status === "locked";
            const isReported = item.status === "reported";

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden relative shadow-2xs hover:shadow-md ${
                  isLocked
                    ? "border-orange-300 bg-orange-50/20"
                    : isReported
                    ? "border-amber-300 bg-amber-50/15"
                    : isSelected
                    ? "border-orange-500 ring-2 ring-orange-500/20"
                    : "border-zinc-200/90"
                }`}
              >
                {/* Card Top / Image Banner */}
                <div>
                  <div className="relative h-44 w-full bg-zinc-100 overflow-hidden">
                    <img
                      src={item.coverImage}
                      alt={isListing ? item.title : item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

                    {/* Checkbox overlay */}
                    <div className="absolute top-3 left-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4.5 h-4.5 rounded border-white/80 text-orange-600 focus:ring-orange-500 bg-white/90 shadow-sm cursor-pointer"
                      />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-600 text-white shadow-xs uppercase tracking-wider">
                          <Lock className="w-3 h-3" />
                          {isEn ? "LOCKED / SUSPENDED" : "ĐÃ KHÓA"}
                        </span>
                      ) : isReported ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs uppercase tracking-wider">
                          <AlertTriangle className="w-3 h-3" />
                          {item.reportsCount} {isEn ? "REPORTS" : "BÁO CÁO"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          {isEn ? "ACTIVE" : "HOẠT ĐỘNG"}
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay info */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] font-mono font-bold bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                        {item.id}
                      </span>
                      {isListing && (
                        <div className="text-base font-black text-white mt-1 drop-shadow-xs whitespace-nowrap inline-flex items-baseline gap-1">
                          <span>{item.price.toLocaleString("vi-VN")} ₫</span>
                          <span className="text-xs font-normal text-zinc-200">/tháng</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-black text-zinc-900 line-clamp-1 hover:text-orange-600 transition-colors">
                        {isListing ? item.title : item.name}
                      </h3>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{item.address}</span>
                      </p>
                    </div>

                    {/* Landlord details */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-zinc-700">
                        <span className="font-semibold text-zinc-500">{isEn ? "Landlord:" : "Chủ trọ:"}</span>
                        <span className="font-bold text-zinc-900">{item.landlordName}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>{isEn ? "Contact:" : "SĐT:"}</span>
                        <span className="font-mono font-medium text-zinc-700">{item.landlordPhone}</span>
                      </div>
                    </div>

                    {/* Lock reason warning if locked */}
                    {isLocked && item.lockReason && (
                      <div className="p-2.5 rounded-xl bg-orange-100/60 border border-orange-200 text-xs text-orange-800 space-y-1">
                        <div className="font-black flex items-center gap-1 text-[11px] uppercase tracking-wide text-orange-900">
                          <Lock className="w-3 h-3" />
                          {isEn ? "Suspension Reason:" : "Lý do khóa bài:"}
                        </div>
                        <p className="text-[11px] leading-relaxed font-medium">
                          {item.lockReason}
                        </p>
                        {item.lockedAt && (
                          <span className="text-[10px] text-orange-600 block">
                            {isEn ? `Locked on: ${item.lockedAt}` : `Thời điểm khóa: ${item.lockedAt}`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Report alert if reported */}
                    {!isLocked && isReported && item.reportReasons.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <div className="font-black flex items-center gap-1 text-[11px] uppercase tracking-wide text-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          {isEn ? "Recent User Reports:" : "Phản ánh từ người dùng:"}
                        </div>
                        <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-900/90 font-medium">
                          {item.reportReasons.map((r, i) => (
                            <li key={i} className="line-clamp-1">{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 border-t border-zinc-100 mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setInspectItem(item)}
                    className="flex-1 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{isEn ? "Inspect" : "Kiểm tra"}</span>
                  </button>

                  {isLocked ? (
                    <button
                      onClick={() =>
                        setUnlockTargetItem({
                          id: item.id,
                          type: isListing ? "listing" : "house",
                          title: isListing ? item.title : item.name,
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{isEn ? "Unlock" : "Mở khóa"}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenLockModal(item)}
                      className="px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200 hover:border-transparent text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isEn ? "Lock" : "Khóa"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9: Default 10 items) */
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 uppercase tracking-wider font-bold">
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={isAllCurrentSelected}
                    onChange={toggleSelectAllCurrent}
                    className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">{isEn ? "Item & Address" : "Tiêu đề / Cơ sở"}</th>
                <th className="p-3.5">{isEn ? "Landlord" : "Chủ trọ"}</th>
                <th className="p-3.5">{isEn ? "Pricing / Capacity" : "Giá / Quy mô"}</th>
                <th className="p-3.5">{isEn ? "Status & Reports" : "Trạng thái"}</th>
                <th className="p-3.5 text-right">{isEn ? "Actions" : "Hành động"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedItems.map((item) => {
                const isListing = "title" in item;
                const isSelected = selectedIds.includes(item.id);
                const isLocked = item.status === "locked";
                const isReported = item.status === "reported";

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-zinc-50/80 transition-colors ${
                      isSelected ? "bg-orange-50/30" : ""
                    }`}
                  >
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.coverImage}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-zinc-400 font-bold">
                              {item.id}
                            </span>
                            <span className="text-[10px] text-zinc-400">• {item.createdAt}</span>
                          </div>
                          <div className="font-bold text-zinc-900 line-clamp-1 max-w-xs">
                            {isListing ? item.title : item.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 line-clamp-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>{item.address}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-zinc-900">{item.landlordName}</div>
                      <div className="font-mono text-[11px] text-zinc-500">{item.landlordPhone}</div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[150px]">{item.landlordEmail}</div>
                    </td>

                    <td className="p-3.5">
                      {isListing ? (
                        <div>
                          <span className="font-black text-zinc-900 text-sm whitespace-nowrap inline-flex items-baseline gap-0.5">
                            <span>{item.price.toLocaleString("vi-VN")}</span>
                            <span>₫</span>
                          </span>
                          <span className="text-zinc-400 text-[10px] ml-1">/tháng</span>
                          <div className="text-[11px] text-zinc-500">
                            {isEn ? `Area: ${item.roomArea} m²` : `Diện tích: ${item.roomArea} m²`}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="font-black text-zinc-900">
                            {item.occupiedRooms} / {item.totalRooms}
                          </span>
                          <span className="text-[11px] text-zinc-500 ml-1">
                            {isEn ? "rooms occupied" : "phòng đã thuê"}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      {isLocked ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-700">
                            <Lock className="w-3 h-3" />
                            {isEn ? "LOCKED" : "ĐÃ KHÓA"}
                          </span>
                          {item.lockReason && (
                            <p className="text-[10px] text-orange-600 line-clamp-1 max-w-[180px]">
                              {item.lockReason}
                            </p>
                          )}
                        </div>
                      ) : isReported ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            {item.reportsCount} {isEn ? "Reports" : "Báo cáo"}
                          </span>
                          {item.reportReasons.length > 0 && (
                            <p className="text-[10px] text-amber-700 line-clamp-1 max-w-[180px]">
                              {item.reportReasons[0]}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          {isEn ? "ACTIVE" : "HOẠT ĐỘNG"}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setInspectItem(item)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                        title={isEn ? "Inspect details" : "Xem chi tiết"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isLocked ? (
                        <button
                          onClick={() =>
                            setUnlockTargetItem({
                              id: item.id,
                              type: isListing ? "listing" : "house",
                              title: isListing ? item.title : item.name,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 cursor-pointer shadow-2xs"
                        >
                          {isEn ? "Unlock" : "Mở khóa"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenLockModal(item)}
                          className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 font-bold text-[11px] hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                        >
                          {isEn ? "Lock" : "Khóa"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Standardized Pagination Bar (Rule #9) */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-semibold text-zinc-600">
        {/* Left: Hiển thị [<input>] / trang | X-Y trên Z mục */}
        <div className="flex items-center gap-2">
          <span>{isEn ? "Showing" : "Hiển thị"}</span>
          <input
            type="number"
            min={1}
            max={100}
            value={pageSize}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setPageSize(val);
              setCurrentPage(1);
            }}
            className="w-14 px-2 py-1 text-center bg-zinc-50 border border-zinc-200 rounded-lg font-bold text-zinc-900 focus:outline-none focus:border-orange-500"
          />
          <span>{isEn ? "/ page" : "/ trang"}</span>
          <span className="text-zinc-300">|</span>
          <span>
            {totalItems === 0
              ? "0"
              : `${(safeCurrentPage - 1) * validPageSize + 1}-${Math.min(
                  safeCurrentPage * validPageSize,
                  totalItems
                )}`}{" "}
            {isEn ? `of ${totalItems} items` : `trên ${totalItems} mục`}
          </span>
        </div>

        {/* Right: 5-page window jumping controls */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          {/* First page */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "First page" : "Trang đầu"}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Prev 5 pages */}
          <button
            onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 5))}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "Previous 5 pages" : "Lùi 5 trang"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers within window */}
          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                safeCurrentPage === num
                  ? "bg-orange-600 text-white shadow-2xs"
                  : "border border-zinc-200 hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              {num}
            </button>
          ))}

          {/* Next 5 pages */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 5))}
            disabled={safeCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "Next 5 pages" : "Tiến 5 trang"}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 text-zinc-600 cursor-pointer"
            title={isEn ? "Last page" : "Trang cuối"}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* INSPECT DETAIL MODAL */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <h2 className="text-base font-black text-zinc-900">
                  {isEn ? "Item Inspection & Audit Record" : "Hồ Sơ Kiểm Tra & Giám Sát Chi Tiết"}
                </h2>
                <span className="text-xs font-mono text-zinc-400 font-bold">({inspectItem.id})</span>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="relative h-56 rounded-2xl overflow-hidden bg-zinc-100">
                <img
                  src={inspectItem.coverImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white ${
                    inspectItem.status === "locked" ? "bg-orange-600" : inspectItem.status === "reported" ? "bg-amber-500" : "bg-emerald-600"
                  }`}>
                    {inspectItem.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-zinc-900">
                  {"title" in inspectItem ? inspectItem.title : inspectItem.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  {inspectItem.address}
                </p>
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div>
                  <span className="text-zinc-400 font-bold uppercase text-[10px] block">
                    {isEn ? "Landlord Name" : "Chủ cơ sở / Người đăng"}
                  </span>
                  <span className="text-sm font-black text-zinc-900 mt-0.5 block">
                    {inspectItem.landlordName}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 font-bold uppercase text-[10px] block">
                    {isEn ? "Phone & Email" : "Liên hệ"}
                  </span>
                  <span className="text-sm font-mono font-bold text-zinc-800 mt-0.5 block">
                    {inspectItem.landlordPhone} • {inspectItem.landlordEmail}
                  </span>
                </div>

                {"price" in inspectItem && (
                  <div>
                    <span className="text-zinc-400 font-bold uppercase text-[10px] block">
                      {isEn ? "Rental Price & Deposit" : "Tiền thuê & Tiền cọc"}
                    </span>
                    <span className="text-sm font-black text-orange-600 mt-0.5 block whitespace-nowrap">
                      {inspectItem.price.toLocaleString("vi-VN")} ₫ / {isEn ? "month" : "tháng"}
                    </span>
                  </div>
                )}

                {"totalRooms" in inspectItem && (
                  <div>
                    <span className="text-zinc-400 font-bold uppercase text-[10px] block">
                      {isEn ? "Room Capacity" : "Quy mô phòng"}
                    </span>
                    <span className="text-sm font-black text-indigo-600 mt-0.5 block">
                      {inspectItem.occupiedRooms} / {inspectItem.totalRooms} phòng đang ở
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-zinc-400 font-bold uppercase text-[10px] block">
                    {isEn ? "Date Created" : "Ngày khởi tạo"}
                  </span>
                  <span className="text-xs font-semibold text-zinc-700 mt-0.5 block">
                    {inspectItem.createdAt}
                  </span>
                </div>
              </div>

              {/* Lock notice if locked */}
              {inspectItem.status === "locked" && inspectItem.lockReason && (
                <div className="p-4 rounded-2xl bg-orange-100 text-orange-900 border border-orange-200 space-y-1">
                  <div className="font-black text-xs flex items-center gap-1.5 uppercase">
                    <Lock className="w-4 h-4" />
                    {isEn ? "Current Suspension Notice" : "Thông báo đình chỉ hiển thị"}
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {inspectItem.lockReason}
                  </p>
                  {inspectItem.lockedAt && (
                    <span className="text-[10px] text-orange-700 block">
                      {isEn ? `Enforced on: ${inspectItem.lockedAt}` : `Thời gian áp dụng: ${inspectItem.lockedAt}`}
                    </span>
                  )}
                </div>
              )}

              {/* Reports list */}
              {inspectItem.reportReasons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    {isEn ? `User Reports (${inspectItem.reportsCount})` : `Chi tiết báo cáo vi phạm (${inspectItem.reportsCount})`}
                  </h4>
                  <div className="space-y-1.5">
                    {inspectItem.reportReasons.map((r, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                        ⚠️ {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {isEn ? "Close" : "Đóng"}
              </button>

              {inspectItem.status === "locked" ? (
                <button
                  onClick={() => {
                    setUnlockTargetItem({
                      id: inspectItem.id,
                      type: "title" in inspectItem ? "listing" : "house",
                      title: "title" in inspectItem ? inspectItem.title : inspectItem.name,
                    });
                    setInspectItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isEn ? "Unlock Item" : "Mở khóa mục này"}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleOpenLockModal(inspectItem);
                    setInspectItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isEn ? "Lock / Suspend" : "Khóa / Đình chỉ"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOCK CONFIRMATION MODAL WITH REASON INPUT (Rule #10 compliant) */}
      {lockTargetItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900">
                      {isEn ? "Confirm Suspension / Lock" : "Xác Nhận Khóa / Đình Chỉ"}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-1">
                      {lockTargetItem.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRequestCloseLockModal}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                {isEn
                  ? "When locked, this item will immediately be hidden from the public platform. The landlord will receive an alert with the reason specified below."
                  : "Sau khi khóa, mục này sẽ bị ẩn hoàn toàn trên sàn tìm kiếm công khai. Chủ trọ sẽ nhận thông báo nêu rõ nguyên nhân vi phạm."}
              </p>

              {/* Preset selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">
                  {isEn ? "Select Violation Type:" : "Chọn nhóm hành vi vi phạm:"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "fake_images", label: isEn ? "Fake photos" : "Ảnh giả mạo / Copy" },
                    { id: "bait_price", label: isEn ? "Unrealistic bait price" : "Giá ảo câu khách" },
                    { id: "scam_deposit", label: isEn ? "Scam deposit fraud" : "Lừa đảo cọc xem phòng" },
                    { id: "other", label: isEn ? "Other violation" : "Lý do khác" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setLockPreset(preset.id)}
                      className={`px-3 py-2 rounded-xl text-left font-bold transition-all border cursor-pointer ${
                        lockPreset === preset.id
                          ? "bg-orange-50 border-orange-400 text-orange-700"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed custom reason textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 block">
                  {isEn ? "Detailed Violation Note (Required for Landlord notification):" : "Chi tiết căn cứ xử phạt (Gửi đến chủ trọ):"}
                </label>
                <textarea
                  rows={3}
                  value={lockReasonInput}
                  onChange={(e) => setLockReasonInput(e.target.value)}
                  placeholder={
                    isEn
                      ? "Enter exact audit findings, e.g., Watermark indicates stolen photo, or tenant reported paying 1M deposit with no response..."
                      : "Nhập căn cứ xử phạt, ví dụ: Ảnh có watermark web khác, hoặc nhận phản ánh ép cọc 500k qua STK cá nhân rồi chặn liên lạc..."
                  }
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={handleRequestCloseLockModal}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>
              <button
                onClick={handleConfirmLock}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isEn ? "Confirm & Lock Item" : "Xác nhận Khóa Vi Phạm"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNLOCK MODAL */}
      {unlockTargetItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Unlock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-zinc-900">
                {isEn ? "Unlock and Restore Item?" : "Mở Khóa & Khôi Phục Hoạt Động?"}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {isEn
                  ? `Are you sure you want to restore "${unlockTargetItem.title}"? It will become public and visible to all prospective tenants immediately.`
                  : `Bạn có chắc muốn gỡ lệnh khóa cho "${unlockTargetItem.title}"? Bài đăng sẽ ngay lập tức được hiển thị công khai trên nền tảng.`}
              </p>
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setUnlockTargetItem(null)}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>
              <button
                onClick={handleConfirmUnlock}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
              >
                {isEn ? "Confirm Unlock" : "Xác nhận Mở Khóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule #10: Custom Pop-up Confirmation Modal for Form Close */}
      {confirmCloseModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-scaleIn">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                {isEn ? "Discard Unsaved Changes?" : "Xác nhận đóng form"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {isEn
                  ? "You have entered violation details. Are you sure you want to discard changes and close?"
                  : "Bạn có thông tin chưa lưu. Bạn có chắc muốn đóng và hủy các nội dung đã nhập?"}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {isEn ? "Continue Editing" : "Tiếp tục chỉnh sửa"}
              </button>
              <button
                onClick={confirmCloseModal.onDiscard}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors cursor-pointer shadow-2xs"
              >
                {isEn ? "Discard & Close" : "Hủy thay đổi & Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
