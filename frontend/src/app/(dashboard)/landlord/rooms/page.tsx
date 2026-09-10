"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Search, MoreHorizontal, X, Home, Building2,
  Target, FileSignature, Receipt, ChevronDown, Eye,
  Trash2, Edit, AlertTriangle, Sparkles, MapPin, UploadCloud,
  FileSpreadsheet, Grid, List, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2, CheckCircle2, ShieldAlert, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  bulkGenerateRooms,
  createRoom,
  getRoom,
  getRoomMetadata,
  getRooms,
  updateRoom,
  type RoomItem,
  type RoomMetadata,
  type RoomServiceItem,
  type RoomTypeItem,
} from "@/services/room.service";

export default function RoomsPage() {
  const { activeBuilding, buildings, refreshBuildings, selectBuilding } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // View mode & pagination according to Rule 9
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for grid, 10 for table
  const [windowStart, setWindowStart] = useState(1);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Metadata from backend
  const [metadata, setMetadata] = useState<RoomMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");

  // Feedback Notification
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals & dirty tracking according to Rule 10
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isSingleDirty, setIsSingleDirty] = useState(false);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkDirty, setIsBulkDirty] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "Xác nhận đóng form",
    message: "Bạn đang có thông tin chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thông tin đã nhập?",
    onConfirm: () => {},
  });

  // Single room form states (UC-L-03)
  const [formBuilding, setFormBuilding] = useState("b1");
  const [formRoomNumber, setFormRoomNumber] = useState("");
  const [formRoomTypeId, setFormRoomTypeId] = useState("");
  const [formFloor, setFormFloor] = useState("1");
  const [formArea, setFormArea] = useState("25");
  const [formMaxOccupants, setFormMaxOccupants] = useState("2");
  const [formStatus, setFormStatus] = useState("available");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formPrice, setFormPrice] = useState("3.500.000");
  const [formNotes, setFormNotes] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);

  // Bulk Generate form states (UC-L-02)
  const [bulkFloorCount, setBulkFloorCount] = useState<number>(3);
  const [bulkRoomsPerFloor, setBulkRoomsPerFloor] = useState<number>(4);
  const [bulkNameFormat, setBulkNameFormat] = useState<string>("P{floor}0{index}");
  const [bulkArea, setBulkArea] = useState<string>("25");
  const [bulkMaxOccupants, setBulkMaxOccupants] = useState<string>("2");
  const [bulkRoomTypeId, setBulkRoomTypeId] = useState<string>("");
  const [bulkServiceIds, setBulkServiceIds] = useState<string[]>([]);

  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync default pageSize when viewMode changes (Rule 9: default Grid=6, Table=10)
  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    setPageSize(mode === "grid" ? 6 : 10);
    setCurrentPage(1);
    setWindowStart(1);
    setSelectedRoomIds([]);
  };

  // Ensure buildings are loaded from backend on mount
  useEffect(() => {
    if (buildings.length === 0) {
      refreshBuildings();
    }
  }, [buildings.length, refreshBuildings]);

  // Load real room metadata & backend rooms whenever activeBuilding changes
  const fetchBuildingData = useCallback(async (buildingId: string) => {
    if (!buildingId) return;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(buildingId)) return;
    try {
      setIsLoadingMetadata(true);
      const [meta, realRoomsRes] = await Promise.all([
        getRoomMetadata(buildingId),
        getRooms(buildingId, { limit: 100 }),
      ]);
      const safeMeta: RoomMetadata = (meta as any)?.data?.roomTypes ? (meta as any).data : meta;
      setMetadata(safeMeta);

      if (safeMeta?.roomTypes && safeMeta.roomTypes.length > 0) {
        setBulkRoomTypeId((prev) => prev || safeMeta.roomTypes[0].id);
      }
      if (safeMeta?.services && safeMeta.services.length > 0) {
        setBulkServiceIds((prev) => (prev.length === 0 ? safeMeta.services.map((s) => s.id) : prev));
      }

      // Map real rooms from backend safely
      const rawRooms: any[] = Array.isArray(realRoomsRes?.data)
        ? realRoomsRes.data
        : Array.isArray((realRoomsRes as any)?.data?.data)
        ? (realRoomsRes as any).data.data
        : Array.isArray(realRoomsRes)
        ? (realRoomsRes as any)
        : [];

      const mapped = rawRooms.map((r: any) => ({
        id: r.roomNumber,
        fullRoomId: r.id,
        floor: (r.floor !== undefined && r.floor !== null ? r.floor : 1).toString(),
        status:
          r.status === 'available'
            ? 'Trống'
            : r.status === 'occupied'
            ? 'Đang thuê'
            : r.status === 'maintainace'
            ? 'Bảo trì'
            : r.status === 'deposited'
            ? 'Đặt cọc'
            : (r.status || 'Trống'),
        building: buildingId,
        buildingSeq: 1,
        contract: r.status === 'occupied' ? 'active' : 'none',
        invoice: 'paid',
        area: r.area || '25',
        price: '3.500.000',
        roomType: r.roomType?.name || 'Studio',
        services: (r.services || []).map((s: any) => s.name || s),
        amenities: ['WiFi', 'Điều hòa', 'WC riêng'],
      }));
      setRooms(mapped);
    } catch (err) {
      console.error("Failed to fetch building data:", err);
      setRooms([]);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    const targetBuildingId = activeBuilding?.id || (buildings.length > 0 ? buildings[0].id : "");
    if (targetBuildingId) {
      fetchBuildingData(targetBuildingId);
    }
  }, [activeBuilding?.id, buildings, fetchBuildingData]);

  // Reset single room form drafts (Rule 10)
  const resetSingleForm = useCallback(() => {
    setSelectedRoomId(null);
    setFormRoomNumber("");
    setFormFloor("1");
    setFormArea("25");
    setFormMaxOccupants("2");
    setFormStatus("available");
    setFormImageUrl("");
    setFormPrice("3.500.000");
    setFormNotes("");
    setSingleError(null);
    setIsSingleDirty(false);
    if (metadata?.roomTypes?.[0]) {
      setFormRoomTypeId(metadata.roomTypes[0].id);
    } else {
      setFormRoomTypeId("");
    }
    if (metadata?.services) {
      setSelectedServiceIds(metadata.services.map((s) => s.id));
    } else {
      setSelectedServiceIds([]);
    }
    setSelectedAmenities(['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng']);
  }, [metadata]);

  // Open create modal
  const handleOpenCreateModal = () => {
    resetSingleForm();
    setIsSingleModalOpen(true);
  };

  // Open edit modal for an existing room
  const handleOpenEditModal = async (room: any) => {
    setSelectedRoomId(room.fullRoomId || room.id);
    setFormBuilding(room.building || activeBuilding?.id || "b1");
    setFormRoomNumber(room.id || "");
    setFormFloor(room.floor || "1");
    setFormArea(room.area ? String(room.area).replace(/[^\d.]/g, "") : "25");
    setFormMaxOccupants(room.maxOccupants ? String(room.maxOccupants) : "2");
    setFormStatus(
      room.status === 'Trống' ? 'available' :
      room.status === 'Đang thuê' ? 'occupied' :
      room.status === 'Bảo trì' ? 'maintainace' :
      room.status === 'Đặt cọc' ? 'deposited' : (room.status || 'available')
    );
    setFormImageUrl(room.imageUrl || "");
    setFormPrice(room.price || "3.500.000");
    setFormNotes(room.notes || "");
    setSingleError(null);
    setIsSingleDirty(false);

    if (metadata?.roomTypes) {
      const matchType = metadata.roomTypes.find(
        (rt) => rt.name.toLowerCase() === (room.roomType || "").toLowerCase() || rt.id === room.roomTypeId,
      );
      setFormRoomTypeId(matchType ? matchType.id : (metadata.roomTypes[0]?.id || ""));
    }

    const buildingId = activeBuilding?.id || "";
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_RE.test(buildingId) && UUID_RE.test(room.fullRoomId)) {
      try {
        const fullRoom = await getRoom(buildingId, room.fullRoomId);
        if (fullRoom) {
          setFormRoomNumber(fullRoom.roomNumber);
          setFormFloor(String(fullRoom.floor));
          if (fullRoom.area) setFormArea(String(fullRoom.area));
          if (fullRoom.maxOccupants) setFormMaxOccupants(String(fullRoom.maxOccupants));
          if (fullRoom.status) setFormStatus(fullRoom.status);
          if (fullRoom.imageUrl) setFormImageUrl(fullRoom.imageUrl);
          if (fullRoom.roomType) setFormRoomTypeId(fullRoom.roomType.id);
          if (fullRoom.services) setSelectedServiceIds(fullRoom.services.map((s) => s.id));
        }
      } catch {
        if (metadata?.services && Array.isArray(room.services)) {
          const matchedIds = metadata.services
            .filter((s) => room.services.includes(s.name) || room.services.includes(s.id))
            .map((s) => s.id);
          setSelectedServiceIds(matchedIds);
        }
      }
    } else {
      if (metadata?.services && Array.isArray(room.services)) {
        const matchedIds = metadata.services
          .filter((s) => room.services.includes(s.name))
          .map((s) => s.id);
        setSelectedServiceIds(matchedIds);
      }
    }

    setSelectedAmenities(room.amenities || ['WiFi', 'Điều hòa', 'WC riêng']);
    setIsSingleModalOpen(true);
  };

  // Handle single room modal close with Rule 10 dirty check
  const handleCloseSingleModal = () => {
    if (isSingleDirty) {
      setConfirmModal({
        isOpen: true,
        title: "Xác nhận đóng form",
        message: "Bạn đang có thông tin chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thông tin đã nhập?",
        onConfirm: () => {
          setIsSingleModalOpen(false);
          resetSingleForm();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setIsSingleModalOpen(false);
      resetSingleForm();
    }
  };

  // Handle single room submit (UC-L-03)
  const handleSingleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError(null);

    if (!formRoomNumber.trim()) {
      setSingleError("Vui lòng nhập số phòng.");
      return;
    }

    const floorNum = parseInt(formFloor, 10);
    if (isNaN(floorNum) || floorNum < 1) {
      setSingleError("Tầng phải là một số nguyên lớn hơn hoặc bằng 1.");
      return;
    }

    if (!formRoomTypeId) {
      setSingleError("Vui lòng chọn loại phòng.");
      return;
    }

    const buildingId = activeBuilding?.id;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!buildingId || !UUID_RE.test(buildingId)) {
      setSingleError("Không tìm thấy thông tin tòa nhà. Vui lòng chọn lại tòa nhà và thử lại.");
      return;
    }

    setIsSingleSubmitting(true);
    try {
      if (selectedRoomId && UUID_RE.test(selectedRoomId)) {
        // UC-L-03: Update Room
        await updateRoom(buildingId, selectedRoomId, {
          roomNumber: formRoomNumber.trim(),
          floor: floorNum,
          area: formArea ? parseFloat(formArea) : undefined,
          maxOccupants: formMaxOccupants ? parseInt(formMaxOccupants, 10) : undefined,
          roomTypeId: formRoomTypeId,
          status: formStatus,
          imageUrl: formImageUrl.trim() || undefined,
          serviceIds: selectedServiceIds,
        });
        setToastMessage({
          type: "success",
          text: `Đã cập nhật phòng ${formRoomNumber.trim()} thành công!`,
        });
      } else {
        // UC-L-03: Create Room
        await createRoom(buildingId, {
          roomNumber: formRoomNumber.trim(),
          floor: floorNum,
          area: formArea ? parseFloat(formArea) : undefined,
          maxOccupants: formMaxOccupants ? parseInt(formMaxOccupants, 10) : undefined,
          roomTypeId: formRoomTypeId,
          status: formStatus,
          imageUrl: formImageUrl.trim() || undefined,
          serviceIds: selectedServiceIds,
        });
        setToastMessage({
          type: "success",
          text: `Đã tạo mới phòng ${formRoomNumber.trim()} thành công!`,
        });
      }

      // Refresh room list from server
      await fetchBuildingData(buildingId);
      setIsSingleModalOpen(false);
      setIsSingleDirty(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể lưu thông tin phòng. Vui lòng thử lại.";
      setSingleError(msg);
    } finally {
      setIsSingleSubmitting(false);
    }
  };

  // Reset bulk form drafts
  const resetBulkForm = () => {
    setBulkFloorCount(3);
    setBulkRoomsPerFloor(4);
    setBulkNameFormat("P{floor}0{index}");
    setBulkArea("25");
    setBulkMaxOccupants("2");
    setBulkError(null);
    setIsBulkDirty(false);
    if (metadata?.roomTypes?.[0]) {
      setBulkRoomTypeId(metadata.roomTypes[0].id);
    }
    if (metadata?.services) {
      setBulkServiceIds(metadata.services.map((s) => s.id));
    }
  };

  // Handle bulk generate modal close with Rule 10 dirty check
  const handleCloseBulkModal = () => {
    if (isBulkDirty) {
      setConfirmModal({
        isOpen: true,
        title: "Xác nhận đóng form",
        message: "Bạn đang có thiết lập tạo phòng chưa tạo. Bạn có chắc chắn muốn đóng và hủy bỏ các thay đổi?",
        onConfirm: () => {
          setIsBulkModalOpen(false);
          resetBulkForm();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setIsBulkModalOpen(false);
      resetBulkForm();
    }
  };

  // Real-time Preview computation for generated room numbers
  const previewRoomNumbers = useMemo(() => {
    const list: string[] = [];
    const template = bulkNameFormat || "P{floor}0{index}";
    const floors = Math.max(1, Math.min(bulkFloorCount || 1, 50));
    const perFloor = Math.max(1, Math.min(bulkRoomsPerFloor || 1, 50));

    for (let f = 1; f <= floors; f++) {
      for (let i = 1; i <= perFloor; i++) {
        const code = template
          .replace(/\{floor:0?2\}/g, String(f).padStart(2, "0"))
          .replace(/\{floor\}/g, String(f))
          .replace(/\{index:0?2\}/g, String(i).padStart(2, "0"))
          .replace(/\{index\}/g, String(i))
          .trim();
        list.push(code);
      }
    }
    return list;
  }, [bulkFloorCount, bulkRoomsPerFloor, bulkNameFormat]);

  const totalGeneratedCount = previewRoomNumbers.length;
  const currentTotalRooms = rooms.filter(
    (r) => buildingFilter === "" || r.building === buildingFilter || r.building === activeBuilding?.id,
  ).length;

  const maxPlanRoom = metadata?.maxRoom ?? 10;
  const isOverQuota = currentTotalRooms + totalGeneratedCount > maxPlanRoom;

  // Handle Bulk Generate Form Submit (UC-L-02)
  const handleBulkGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);

    if (!bulkNameFormat.trim()) {
      setBulkError("Vui lòng nhập mẫu đặt tên phòng (ví dụ: P{floor}0{index}).");
      return;
    }

    if (bulkFloorCount < 1 || bulkRoomsPerFloor < 1) {
      setBulkError("Số tầng và số phòng mỗi tầng phải tối thiểu là 1.");
      return;
    }

    if (!bulkRoomTypeId) {
      setBulkError("Vui lòng chọn loại phòng trước khi tạo hàng loạt.");
      return;
    }

    const buildingId = activeBuilding?.id;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!buildingId || !UUID_RE.test(buildingId)) {
      setBulkError("Không tìm thấy thông tin tòa nhà. Vui lòng chọn lại tòa nhà và thử lại.");
      return;
    }

    // Check duplicate room numbers within generated list
    const uniqueSet = new Set(previewRoomNumbers);
    if (uniqueSet.size !== previewRoomNumbers.length) {
      setBulkError("Mẫu đặt tên tạo ra các số phòng trùng nhau trong cùng một đợt. Vui lòng tinh chỉnh lại mẫu số phòng.");
      return;
    }

    setIsBulkSubmitting(true);
    try {
      const response = await bulkGenerateRooms(buildingId, {
        floorCount: bulkFloorCount,
        roomsPerFloor: bulkRoomsPerFloor,
        nameFormat: bulkNameFormat.trim(),
        area: bulkArea ? parseFloat(bulkArea) : undefined,
        maxOccupants: bulkMaxOccupants ? parseInt(bulkMaxOccupants, 10) : undefined,
        roomTypeId: bulkRoomTypeId,
        serviceIds: bulkServiceIds,
      });

      setToastMessage({
        type: "success",
        text: `Đã tạo tự động thành công ${response.count} phòng mới vào hệ thống!`,
      });

      // Refresh room list from server
      await fetchBuildingData(buildingId);
      setIsBulkModalOpen(false);
      resetBulkForm();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể tạo phòng tự động. Vui lòng thử lại.";
      setBulkError(msg);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    const matchSearch = room.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBuilding = buildingFilter === "" || room.building === buildingFilter;
    const matchStatus = statusFilter === "" || room.status === statusFilter;
    const matchContract = contractFilter === "" || room.contract === contractFilter;
    const matchInvoice = invoiceFilter === "" || room.invoice === invoiceFilter;

    return matchSearch && matchBuilding && matchStatus && matchContract && matchInvoice;
  });

  // Standardized Pagination calculations (Rule 9)
  const totalItems = filteredRooms.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

  // Group paginated rooms by floor for Grid View
  const groupedRooms = paginatedRooms.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = [];
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<string, typeof rooms>);

  const floors = Object.keys(groupedRooms).sort((a, b) => Number(b) - Number(a));

  // 5-page window jumping according to Rule 9
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages - windowStart + 1) },
    (_, i) => windowStart + i,
  );

  const handlePrevWindow = () => {
    const newStart = Math.max(1, windowStart - 5);
    setWindowStart(newStart);
    setCurrentPage(newStart);
  };

  const handleNextWindow = () => {
    if (windowStart + 5 <= totalPages) {
      const newStart = windowStart + 5;
      setWindowStart(newStart);
      setCurrentPage(newStart);
    }
  };

  // Select-All applies to current page only (Rule 9)
  const currentPageRoomIds = paginatedRooms.map((r) => r.fullRoomId || r.id);
  const isAllCurrentPageSelected =
    currentPageRoomIds.length > 0 &&
    currentPageRoomIds.every((id) => selectedRoomIds.includes(id));

  const toggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      setSelectedRoomIds((prev) => prev.filter((id) => !currentPageRoomIds.includes(id)));
    } else {
      setSelectedRoomIds((prev) => Array.from(new Set([...prev, ...currentPageRoomIds])));
    }
  };

  const toggleSelectRoom = (id: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const totalRoomsCount = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status === "Đang thuê").length;
  const vacantCount = rooms.filter((r) => r.status === "Trống").length;
  const maintenanceCount = rooms.filter((r) => r.status === "Bảo trì").length;
  const reservedCount = rooms.filter((r) => r.status === "Đặt cọc").length;
  const occupancyRate = totalRoomsCount > 0 ? ((occupiedCount / totalRoomsCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 p-1 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Quản lý phòng</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Danh sách phòng theo tòa nhà, cấu hình dịch vụ và sinh mã phòng tự động
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <button className="cursor-pointer px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-emerald-600" /> Import
          </button>
          <button className="cursor-pointer px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export
          </button>

          {/* UC-L-02: Bulk Generate Trigger Button */}
          <button
            onClick={() => {
              resetBulkForm();
              setIsBulkModalOpen(true);
            }}
            className="cursor-pointer px-4 py-2 text-xs sm:text-sm font-bold text-zinc-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            title="Tạo hàng loạt phòng theo tầng và mẫu số phòng (UC-L-02)"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>Tạo phòng tự động</span>
          </button>

          {/* Single Room Add Button (UC-L-03) */}
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm phòng
          </button>
        </div>
      </div>

      {/* Building Overview Banner */}
      <div className="bg-zinc-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Building2 className="w-64 h-64" />
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
                <span className="text-xs font-bold text-zinc-200 truncate sm:whitespace-normal">
                  {activeBuilding.address}
                </span>
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
              Quản lý tổng thể cấu trúc phòng, theo dõi tình trạng lưu trú và tài sản.
            </p>
          </div>

          {/* Stat Chips */}
          <div className="flex flex-col items-end gap-2.5 sm:gap-3 w-full lg:w-auto mt-4 lg:mt-0">
            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:justify-end gap-2.5 sm:gap-3 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/10 backdrop-blur-md w-full lg:w-[140px]">
                <Home className="w-5 h-5 text-zinc-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Tổng phòng</span>
                  <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{totalRoomsCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-2xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[140px]">
                <Target className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Lấp đầy</span>
                  <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">{occupancyRate}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-row lg:justify-end gap-2.5 sm:gap-3 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3 px-3 py-2 bg-[#2AC1BC]/10 rounded-2xl border border-[#2AC1BC]/30 w-full lg:w-[130px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">Đang thuê</span>
                  <span className="font-black text-white text-sm sm:text-base leading-none mt-0.5">{occupiedCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3 py-2 bg-blue-500/10 rounded-2xl border border-blue-500/30 w-full lg:w-[130px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Phòng trống</span>
                  <span className="font-black text-white text-sm sm:text-base leading-none mt-0.5">{vacantCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3 py-2 bg-[#FF6B35]/10 rounded-2xl border border-[#FF6B35]/30 w-full lg:w-[130px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">Bảo trì</span>
                  <span className="font-black text-white text-sm sm:text-base leading-none mt-0.5">{maintenanceCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3 py-2 bg-purple-500/10 rounded-2xl border border-purple-500/30 w-full lg:w-[130px]">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">Đặt cọc</span>
                  <span className="font-black text-white text-sm sm:text-base leading-none mt-0.5">{reservedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card with Toolbar & View Switcher (Rule 9) */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-sm overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-4 border-b border-zinc-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-50/40">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm số phòng, loại phòng..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all shadow-2xs"
              />
            </div>

            {/* View Switcher: Grid vs Table (Rule 9: Grid default) */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
              <button
                type="button"
                onClick={() => handleViewModeChange("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
                title="Hiển thị dạng lưới (Grid view - Mặc định)"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lưới</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
                title="Hiển thị dạng bảng (Table view)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bảng</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:border-[#2AC1BC] cursor-pointer shadow-2xs"
              >
                <option value="">Mọi trạng thái</option>
                <option value="Trống">Trống</option>
                <option value="Đang thuê">Đang thuê</option>
                <option value="Bảo trì">Bảo trì</option>
                <option value="Đặt cọc">Đặt cọc</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={contractFilter}
                onChange={(e) => {
                  setContractFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-8 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl appearance-none hover:bg-zinc-50 focus:outline-none focus:border-[#2AC1BC] cursor-pointer shadow-2xs"
              >
                <option value="">Mọi hợp đồng</option>
                <option value="active">HĐ Có hiệu lực</option>
                <option value="expired">HĐ Quá hạn</option>
                <option value="none">Chưa có HĐ</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Content Section: Grid View vs Table View */}
        <div className="p-5">
          {isLoadingMetadata ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin mb-3" />
              <p className="text-sm font-bold text-zinc-700">Đang tải dữ liệu phòng từ máy chủ...</p>
              <p className="text-xs text-zinc-400 mt-1">Đang đồng bộ thông tin phòng và dịch vụ</p>
            </div>
          ) : paginatedRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-zinc-50/50 rounded-2xl border border-zinc-200 border-dashed text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-center mb-4 text-zinc-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-1">Không tìm thấy phòng phù hợp</h3>
              <p className="text-xs text-zinc-500 max-w-sm">
                Không có phòng nào thỏa mãn tiêu chí tìm kiếm hoặc cơ sở hiện chưa có phòng.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("");
                    setContractFilter("");
                    setInvoiceFilter("");
                  }}
                  className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-4 py-2 bg-[#2AC1BC] text-white text-xs font-bold rounded-xl hover:bg-[#25ad87] transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> Tạo phòng tự động
                </button>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW (Grouped by floor or cards) */
            <div className="space-y-4">
              {floors.map((floor) => (
                <div
                  key={floor}
                  className="flex flex-col md:flex-row gap-4 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-2xs hover:border-zinc-300 transition-all"
                >
                  <div className="flex-shrink-0 w-full md:w-24 bg-zinc-900 rounded-xl flex items-center justify-center px-3 py-3 text-white">
                    <span className="text-sm font-black tracking-wider text-white flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">TẦNG</span>
                      <span className="text-lg font-black">{floor}</span>
                    </span>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-3 items-center">
                    {(groupedRooms[floor] || []).map((room: any) => {
                      const isOccupied = room.status === "Đang thuê";
                      const isMaintenance = room.status === "Bảo trì";
                      const isReserved = room.status === "Đặt cọc";
                      const isVacant = room.status === "Trống";
                      const isSelected = selectedRoomIds.includes(room.fullRoomId || room.id);

                      return (
                        <div
                          key={`${room.building}-${room.id}`}
                          onClick={() => router.push(`/landlord/rooms/${room.fullRoomId}`)}
                          className={`relative flex flex-col items-center justify-center p-3 rounded-xl border w-[100px] h-[100px] transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md ${
                            isSelected ? "ring-2 ring-[#2AC1BC] " : ""
                          }${
                            isOccupied
                              ? "bg-[#2AC1BC]/10 border-[#2AC1BC]/30 hover:border-[#2AC1BC]"
                              : isMaintenance
                              ? "bg-[#FF6B35]/10 border-[#FF6B35]/30 hover:border-[#FF6B35]"
                              : isReserved
                              ? "bg-purple-500/10 border-purple-500/30 hover:border-purple-500"
                              : isVacant
                              ? "bg-blue-500/10 border-blue-500/30 hover:border-blue-500"
                              : "bg-white border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectRoom(room.fullRoomId || room.id);
                            }}
                            className="absolute top-2 left-2 w-3.5 h-3.5 rounded text-[#2AC1BC] border-zinc-300 focus:ring-[#2AC1BC] cursor-pointer"
                          />

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(room);
                            }}
                            className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-800 hover:bg-white/80 rounded-md transition-all cursor-pointer opacity-80 hover:opacity-100"
                            title="Chỉnh sửa phòng (UC-L-03)"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <span
                            className={`text-lg font-black mt-1 ${
                              isOccupied
                                ? "text-[#2AC1BC]"
                                : isMaintenance
                                ? "text-[#FF6B35]"
                                : isReserved
                                ? "text-purple-600"
                                : isVacant
                                ? "text-blue-600"
                                : "text-zinc-800"
                            }`}
                          >
                            {room.id}
                          </span>

                          <span
                            className={`text-[9px] font-black uppercase tracking-wider mt-1 px-2 py-0.5 rounded-md ${
                              isOccupied
                                ? "text-[#2AC1BC] bg-[#2AC1BC]/15"
                                : isMaintenance
                                ? "text-[#FF6B35] bg-[#FF6B35]/15"
                                : isReserved
                                ? "text-purple-600 bg-purple-500/15"
                                : isVacant
                                ? "text-blue-600 bg-blue-500/15"
                                : "text-zinc-500 bg-zinc-100"
                            }`}
                          >
                            {room.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW (Rule 9) */
            <div className="overflow-x-auto rounded-2xl border border-zinc-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200 uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllCurrentPageSelected}
                        onChange={toggleSelectAllCurrentPage}
                        className="w-3.5 h-3.5 rounded text-[#2AC1BC] border-zinc-300 focus:ring-[#2AC1BC] cursor-pointer"
                        title="Chọn tất cả trong trang hiện tại"
                      />
                    </th>
                    <th className="p-3">Số phòng</th>
                    <th className="p-3">Tầng</th>
                    <th className="p-3">Loại phòng</th>
                    <th className="p-3">Diện tích</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Dịch vụ đi kèm</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70">
                  {paginatedRooms.map((room) => {
                    const isSelected = selectedRoomIds.includes(room.fullRoomId || room.id);
                    return (
                      <tr
                        key={`${room.building}-${room.id}`}
                        className={`hover:bg-zinc-50/80 transition-colors ${
                          isSelected ? "bg-cyan-50/50" : ""
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRoom(room.fullRoomId || room.id)}
                            className="w-3.5 h-3.5 rounded text-[#2AC1BC] border-zinc-300 focus:ring-[#2AC1BC] cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-black text-zinc-900 text-sm">{room.id}</td>
                        <td className="p-3 font-semibold text-zinc-600">Tầng {room.floor}</td>
                        <td className="p-3 font-medium text-zinc-700">{room.roomType || "Studio"}</td>
                        <td className="p-3 text-zinc-600">{room.area ? `${room.area} m²` : "25 m²"}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              room.status === "Đang thuê"
                                ? "bg-[#2AC1BC]/15 text-[#2AC1BC]"
                                : room.status === "Trống"
                                ? "bg-blue-100 text-blue-700"
                                : room.status === "Bảo trì"
                                ? "bg-[#FF6B35]/15 text-[#FF6B35]"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {room.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(room.services || ["Điện", "Nước"]).map((s: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] rounded font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(room)}
                            className="p-1.5 text-zinc-500 hover:text-[#2AC1BC] hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa phòng (UC-L-03)"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/landlord/rooms/${room.fullRoomId}`)}
                            className="p-1.5 text-zinc-500 hover:text-[#2AC1BC] hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Standardized Pagination Bar (Rule 9) */}
        <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600 font-medium">
          {/* Left section: Hiển thị [<input>] / trang | X-Y trên Z mục */}
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  setPageSize(val);
                  setCurrentPage(1);
                  setWindowStart(1);
                }
              }}
              className="w-14 px-2 py-1 text-center font-bold bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-[#2AC1BC]"
            />
            <span>/ trang</span>
            <span className="text-zinc-300 mx-1">|</span>
            <span>
              {totalItems === 0
                ? "0 - 0"
                : `${startIndex + 1} - ${endIndex}`}{" "}
              trên {totalItems} phòng
            </span>
          </div>

          {/* Right section: 5-page window jumping controls */}
          <div className="flex items-center gap-1">
            {/* Jump -5 window */}
            <button
              onClick={handlePrevWindow}
              disabled={windowStart === 1}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Lùi 5 trang"
            >
              <ChevronsLeft className="w-4 h-4 text-zinc-600" />
            </button>

            {/* Prev single page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-600" />
            </button>

            {/* 5-page numbered window */}
            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`min-w-8 h-8 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                  safeCurrentPage === num
                    ? "bg-[#2AC1BC] text-white shadow-xs"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {num}
              </button>
            ))}

            {/* Next single page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            {/* Jump +5 window */}
            <button
              onClick={handleNextWindow}
              disabled={windowStart + 5 > totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Tiến 5 trang"
            >
              <ChevronsRight className="w-4 h-4 text-zinc-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BULK GENERATE ROOMS MODAL (UC-L-02)                                       */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseBulkModal();
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 border border-zinc-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-100 bg-white z-10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                    Tạo phòng tự động (Hàng loạt)
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Hệ thống tự động sinh số phòng theo số tầng và cấu trúc mẫu chỉ định
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseBulkModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleBulkGenerateSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-zinc-50/40">
              {bulkError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-black text-red-800">Không thể khởi tạo phòng</p>
                    <p className="font-medium leading-relaxed">{bulkError}</p>
                  </div>
                </div>
              )}

              {/* Quota Info Banner */}
              <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#2AC1BC]" />
                    Hạn mức gói phòng hiện tại:
                  </span>
                  <span className="text-zinc-900 font-black">
                    {currentTotalRooms} / {maxPlanRoom} phòng
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isOverQuota ? "bg-red-500" : "bg-[#2AC1BC]"
                    }`}
                    style={{
                      width: `${Math.min(100, ((currentTotalRooms + totalGeneratedCount) / maxPlanRoom) * 100)}%`,
                    }}
                  />
                </div>
                {isOverQuota && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Cảnh báo: Tạo thêm {totalGeneratedCount} phòng sẽ vượt quá hạn mức gói ({maxPlanRoom} phòng). Vui lòng điều chỉnh hoặc nâng cấp gói.
                  </p>
                )}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">
                    Số tầng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={bulkFloorCount}
                    onChange={(e) => {
                      setBulkFloorCount(parseInt(e.target.value, 10) || 1);
                      setIsBulkDirty(true);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">
                    Số phòng mỗi tầng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={bulkRoomsPerFloor}
                    onChange={(e) => {
                      setBulkRoomsPerFloor(parseInt(e.target.value, 10) || 1);
                      setIsBulkDirty(true);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-700">
                      Mẫu đặt tên số phòng <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      Placeholder: <code className="bg-zinc-100 px-1 py-0.5 rounded text-[#2AC1BC] font-mono">&#123;floor&#125;</code>, <code className="bg-zinc-100 px-1 py-0.5 rounded text-[#2AC1BC] font-mono">&#123;index&#125;</code>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={bulkNameFormat}
                    onChange={(e) => {
                      setBulkNameFormat(e.target.value);
                      setIsBulkDirty(true);
                    }}
                    placeholder="VD: P{floor}0{index} hoặc {floor}0{index}"
                    className="w-full px-3.5 py-2 text-xs font-bold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 font-mono text-zinc-800"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-zinc-500">
                    <span className="font-bold">Mẫu gợi ý:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkNameFormat("P{floor}0{index}");
                        setIsBulkDirty(true);
                      }}
                      className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded font-mono cursor-pointer"
                    >
                      P&#123;floor&#125;0&#123;index&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkNameFormat("{floor}0{index}");
                        setIsBulkDirty(true);
                      }}
                      className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded font-mono cursor-pointer"
                    >
                      &#123;floor&#125;0&#123;index&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkNameFormat("P{floor}{index:02}");
                        setIsBulkDirty(true);
                      }}
                      className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded font-mono cursor-pointer"
                    >
                      P&#123;floor&#125;&#123;index:02&#125;
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Loại phòng</label>
                  <select
                    value={bulkRoomTypeId}
                    onChange={(e) => {
                      setBulkRoomTypeId(e.target.value);
                      setIsBulkDirty(true);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-zinc-800 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                  >
                    {metadata?.roomTypes && metadata.roomTypes.length > 0 ? (
                      metadata.roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="studio">Studio (Khép kín)</option>
                        <option value="1pn">1 Phòng ngủ (1PN)</option>
                        <option value="2pn">2 Phòng ngủ (2PN)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Diện tích (m²)</label>
                  <input
                    type="number"
                    min={1}
                    value={bulkArea}
                    onChange={(e) => {
                      setBulkArea(e.target.value);
                      setIsBulkDirty(true);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              {/* Service Associations Checkboxes */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#2AC1BC]" />
                    Dịch vụ áp dụng tự động cho các phòng tạo mới
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Đã chọn {bulkServiceIds.length} dịch vụ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {metadata?.services && metadata.services.length > 0 ? (
                    metadata.services.map((srv) => {
                      const checked = bulkServiceIds.includes(srv.id);
                      return (
                        <label
                          key={srv.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            checked
                              ? "bg-[#2AC1BC]/10 border-[#2AC1BC]/40 text-[#2AC1BC]"
                              : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setBulkServiceIds((prev) =>
                                prev.includes(srv.id)
                                  ? prev.filter((id) => id !== srv.id)
                                  : [...prev, srv.id],
                              );
                              setIsBulkDirty(true);
                            }}
                            className="w-3.5 h-3.5 rounded text-[#2AC1BC] border-zinc-300 focus:ring-[#2AC1BC]"
                          />
                          <span className="truncate">{srv.name}</span>
                        </label>
                      );
                    })
                  ) : (
                    ["Điện", "Nước", "WiFi", "Vệ sinh"].map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-3.5 h-3.5 rounded text-[#2AC1BC]"
                        />
                        <span>{item}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="bg-zinc-900 rounded-2xl p-4 sm:p-5 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Xem trước danh sách số phòng ({previewRoomNumbers.length} phòng)
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Tầng: 1..{bulkFloorCount} | Phòng: 1..{bulkRoomsPerFloor}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-2 bg-white/5 rounded-xl border border-white/10">
                  {previewRoomNumbers.map((code, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white font-mono text-xs rounded-lg border border-white/10 font-bold"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseBulkModal}
                  className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isBulkSubmitting || isOverQuota}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {isBulkSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isBulkSubmitting
                    ? "Đang khởi tạo phòng..."
                    : `Xác nhận tạo ${totalGeneratedCount} phòng`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE ROOM ADD/EDIT MODAL                                                */}
      {/* ========================================================================= */}
      {isSingleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseSingleModal();
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onInput={() => setIsSingleDirty(true)}
            onChange={() => setIsSingleDirty(true)}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl">
                  {selectedRoomId ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900">
                    {selectedRoomId ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {selectedRoomId
                      ? "Cập nhật thông tin chi tiết của phòng và dịch vụ áp dụng (UC-L-03)"
                      : "Điền thông tin chi tiết để tạo phòng trên hệ thống và liên kết dịch vụ (UC-L-03)"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseSingleModal}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSingleRoomSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-zinc-50/50 space-y-6">
                {/* Error Banner */}
                {singleError && (
                  <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-2xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{singleError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Column: Basic Details */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-4">
                      <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                        <Home className="w-4 h-4 text-[#2AC1BC]" /> Thông tin phòng
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-700">Tòa nhà</label>
                          <div className="w-full px-3 py-2 text-xs border border-zinc-200 bg-zinc-50 rounded-xl font-medium text-zinc-700 truncate">
                            {activeBuilding?.name || "Dormio Boarding House"}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-700">
                            Số phòng <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formRoomNumber}
                            onChange={(e) => {
                              setFormRoomNumber(e.target.value);
                              setIsSingleDirty(true);
                            }}
                            placeholder="VD: 101, A01"
                            className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-700">
                            Loại phòng <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formRoomTypeId}
                            onChange={(e) => {
                              setFormRoomTypeId(e.target.value);
                              setIsSingleDirty(true);
                            }}
                            className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900 bg-white"
                          >
                            {metadata?.roomTypes && metadata.roomTypes.length > 0 ? (
                              metadata.roomTypes.map((rt) => (
                                <option key={rt.id} value={rt.id}>
                                  {rt.name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="studio">Studio (Khép kín)</option>
                                <option value="1pn">1 Phòng ngủ (1PN)</option>
                                <option value="2pn">2 Phòng ngủ (2PN)</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-700">
                            Tầng <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={formFloor}
                            onChange={(e) => {
                              setFormFloor(e.target.value);
                              setIsSingleDirty(true);
                            }}
                            placeholder="VD: 1, 2..."
                            className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-700">Diện tích (m²)</label>
                          <input
                            type="number"
                            step="0.1"
                            min={1}
                            value={formArea}
                            onChange={(e) => {
                              setFormArea(e.target.value);
                              setIsSingleDirty(true);
                            }}
                            placeholder="25"
                            className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-700">Số người tối đa</label>
                          <input
                            type="number"
                            min={1}
                            value={formMaxOccupants}
                            onChange={(e) => {
                              setFormMaxOccupants(e.target.value);
                              setIsSingleDirty(true);
                            }}
                            placeholder="2"
                            className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-700">Trạng thái phòng</label>
                          <select
                            value={formStatus}
                            onChange={(e) => {
                              setFormStatus(e.target.value);
                              setIsSingleDirty(true);
                            }}
                            className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900 bg-white"
                          >
                            <option value="available">Trống (Sẵn sàng cho thuê)</option>
                            <option value="occupied">Đang thuê</option>
                            <option value="maintainace">Bảo trì</option>
                            <option value="deposited">Đặt cọc</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-700">Giá thuê tham khảo (VNĐ)</label>
                          <input
                            type="text"
                            value={formPrice}
                            onChange={(e) => {
                              setFormPrice(e.target.value);
                              setIsSingleDirty(true);
                            }}
                            placeholder="3.500.000"
                            className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-[#2AC1BC]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-zinc-700">URL ảnh đại diện phòng</label>
                        <input
                          type="text"
                          value={formImageUrl}
                          onChange={(e) => {
                            setFormImageUrl(e.target.value);
                            setIsSingleDirty(true);
                          }}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                        />
                      </div>
                    </div>

                    {/* Room Services Association (UC-L-03) */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-[#2AC1BC]" /> Dịch vụ phòng (UC-L-03)
                        </h3>
                        <span className="text-[11px] font-semibold text-zinc-500">
                          Đã chọn {selectedServiceIds.length} dịch vụ
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Tích chọn các dịch vụ áp dụng cho phòng này. Dịch vụ không chọn sẽ tự động tách khỏi phòng.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {metadata?.services && metadata.services.length > 0 ? (
                          metadata.services.map((srv) => {
                            const isChecked = selectedServiceIds.includes(srv.id);
                            return (
                              <label
                                key={srv.id}
                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-[#2AC1BC]/10 border-[#2AC1BC]/40 text-[#2AC1BC]"
                                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setSelectedServiceIds((prev) =>
                                        prev.includes(srv.id)
                                          ? prev.filter((id) => id !== srv.id)
                                          : [...prev, srv.id],
                                      );
                                      setIsSingleDirty(true);
                                    }}
                                    className="w-3.5 h-3.5 rounded text-[#2AC1BC] border-zinc-300 focus:ring-[#2AC1BC]"
                                  />
                                  <span className="truncate">{srv.name}</span>
                                </div>
                                <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                                  {srv.price} đ/{srv.unit}
                                </span>
                              </label>
                            );
                          })
                        ) : (
                          ["Điện (3.500 đ/kWh)", "Nước (25.000 đ/m³)", "WiFi (100.000 đ/tháng)", "Rác (20.000 đ/phòng)"].map((label, idx) => (
                            <label
                              key={idx}
                              className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                defaultChecked
                                className="w-3.5 h-3.5 rounded text-[#2AC1BC]"
                              />
                              <span>{label}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Amenities & Notes */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-3">
                      <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#2AC1BC]" /> Tiện nghi phòng
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng'].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setSelectedAmenities((prev) =>
                                prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
                              );
                              setIsSingleDirty(true);
                            }}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                              selectedAmenities.includes(item)
                                ? "bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30"
                                : "text-zinc-600 bg-white border-zinc-200 hover:bg-zinc-50"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-2">
                      <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-[#2AC1BC]" /> Ghi chú nội bộ
                      </h3>
                      <textarea
                        rows={4}
                        value={formNotes}
                        onChange={(e) => {
                          setFormNotes(e.target.value);
                          setIsSingleDirty(true);
                        }}
                        placeholder="Ghi chú thêm về hiện trạng phòng, nội thất bàn giao..."
                        className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-5 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white z-10">
                <button
                  type="button"
                  onClick={handleCloseSingleModal}
                  disabled={isSingleSubmitting}
                  className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSingleSubmitting}
                  className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {isSingleSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : selectedRoomId ? (
                    <Edit className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isSingleSubmitting
                    ? "Đang lưu..."
                    : selectedRoomId
                    ? "Lưu thay đổi"
                    : "Tạo phòng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Rule 10) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function ConfirmModal({
  isOpen,
  title = "Xác nhận đóng form",
  message = "Bạn đang có thông tin chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thông tin đã nhập?",
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 border border-zinc-100">
        <div className="w-14 h-14 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">{title}</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 transition-all cursor-pointer shadow-2xs"
          >
            Tiếp tục chỉnh sửa
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-500/30"
          >
            Hủy thay đổi & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}