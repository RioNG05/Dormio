"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronDown,
  Loader2,
  X,
  Briefcase,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Power,
  Edit3,
  Trash2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  staffService,
  StaffItem,
  JobPosition,
  StaffSummary,
} from "@/services/staff.service";

export default function StaffPage() {
  const { activeBuilding } = useAuth();
  const buildingId = activeBuilding?.id || "";

  // Data states
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [summary, setSummary] = useState<StaffSummary>({
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    positionsCount: 0,
  });

  // UI / Filter states
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");

  // Rule #9: Standardized View & Pagination (Grid default = 6, Table = 10)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [pageSize, setPageSize] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Modal states
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  const [isPositionsModalOpen, setIsPositionsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [pendingCloseTarget, setPendingCloseTarget] = useState<
    "onboard" | "assignRole" | "positions" | null
  >(null);

  const [credentialModal, setCredentialModal] = useState<{
    isOpen: boolean;
    name: string;
    phone: string;
    password?: string;
  }>({
    isOpen: false,
    name: "",
    phone: "",
  });

  // Form states for Onboarding
  const [formDirty, setFormDirty] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<{
    id: string;
    fullName: string;
    phoneNumber: string;
    email?: string | null;
    avatarUrl?: string | null;
    role: string;
    isAlreadyStaffAtThisHouse?: boolean;
  } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Form input fields for Onboarding
  const [fullNameInput, setFullNameInput] = useState("");
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [isCreatingNewPosition, setIsCreatingNewPosition] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [newPositionDesc, setNewPositionDesc] = useState("");
  const [joinedAtInput, setJoinedAtInput] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [noteInput, setNoteInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Form states for Assign Role (UC-L-20 Step 3)
  const [assignTargetPositionId, setAssignTargetPositionId] = useState("");
  const [isAssignCreatingNew, setIsAssignCreatingNew] = useState(false);
  const [assignNewPosName, setAssignNewPosName] = useState("");
  const [assignNewPosDesc, setAssignNewPosDesc] = useState("");
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Position Management state (CRUD)
  const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null);
  const [posFormName, setPosFormName] = useState("");
  const [posFormDesc, setPosFormDesc] = useState("");
  const [posErrorMessage, setPosErrorMessage] = useState("");
  const [isPosSubmitting, setIsPosSubmitting] = useState(false);
  const [isAddingPositionInline, setIsAddingPositionInline] = useState(false);

  // Load staff list & positions
  const fetchStaffData = useCallback(async () => {
    if (!buildingId) return;
    setIsLoading(true);
    try {
      const [staffRes, posRes] = await Promise.all([
        staffService.getStaffList(buildingId, {
          page: currentPage,
          limit: pageSize,
          search: searchQuery.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          positionId: positionFilter === "all" ? undefined : positionFilter,
        }),
        staffService.getPositions(buildingId),
      ]);

      if (staffRes?.success) {
        setStaffList(staffRes.data || []);
        setSummary(
          staffRes.summary || {
            totalStaff: 0,
            activeStaff: 0,
            inactiveStaff: 0,
            positionsCount: 0,
          }
        );
        setTotalItems(staffRes.meta?.total || 0);
      }

      const posList = Array.isArray(posRes) ? posRes : (posRes as any)?.data || [];
      setPositions(posList);
      if (posList.length > 0 && !selectedPositionId) {
        setSelectedPositionId(posList[0].id);
      }
    } catch (err: any) {
      console.error("Failed to fetch staff data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    buildingId,
    currentPage,
    pageSize,
    searchQuery,
    statusFilter,
    positionFilter,
    selectedPositionId,
  ]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Handle phone lookup debounce or manual trigger
  const handleSearchPhone = async (phone: string) => {
    const clean = phone.trim();
    if (!clean || clean.length < 9) {
      setFoundUser(null);
      setHasSearched(false);
      return;
    }

    setIsSearchingUser(true);
    setErrorMessage("");
    try {
      const res = await staffService.searchUser(buildingId, clean);
      if (res?.found && res.user) {
        setFoundUser(res.user);
        setFullNameInput(res.user.fullName);
      } else {
        setFoundUser(null);
      }
      setHasSearched(true);
    } catch (err: any) {
      console.error("User search failed:", err);
    } finally {
      setIsSearchingUser(false);
    }
  };

  // Modal reset logic (Rule #10)
  const resetOnboardForm = () => {
    setFormDirty(false);
    setLookupPhone("");
    setFoundUser(null);
    setHasSearched(false);
    setFullNameInput("");
    setIsCreatingNewPosition(false);
    setNewPositionName("");
    setNewPositionDesc("");
    setJoinedAtInput(new Date().toISOString().split("T")[0]);
    setNoteInput("");
    setErrorMessage("");
    if (positions.length > 0) {
      setSelectedPositionId(positions[0].id);
    }
  };

  const handleAttemptCloseModal = (target: "onboard" | "assignRole" | "positions") => {
    if (formDirty) {
      setPendingCloseTarget(target);
      setIsConfirmCloseOpen(true);
    } else {
      if (target === "onboard") {
        setIsOnboardModalOpen(false);
        resetOnboardForm();
      } else if (target === "assignRole") {
        setIsAssignRoleModalOpen(false);
        setAssignError("");
      } else if (target === "positions") {
        setIsPositionsModalOpen(false);
        setEditingPosition(null);
        setIsAddingPositionInline(false);
      }
    }
  };

  const handleConfirmClose = () => {
    setIsConfirmCloseOpen(false);
    if (pendingCloseTarget === "onboard") {
      setIsOnboardModalOpen(false);
      resetOnboardForm();
    } else if (pendingCloseTarget === "assignRole") {
      setIsAssignRoleModalOpen(false);
      setAssignError("");
    } else if (pendingCloseTarget === "positions") {
      setIsPositionsModalOpen(false);
      setEditingPosition(null);
      setIsAddingPositionInline(false);
    }
    setPendingCloseTarget(null);
    setFormDirty(false);
  };

  // Submit Onboard Staff (UC-L-19)
  const handleSubmitOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) {
      setErrorMessage("Vui lòng chọn tòa nhà trước khi thêm nhân viên.");
      return;
    }

    const cleanPhone = lookupPhone.trim();
    if (!cleanPhone) {
      setErrorMessage("Vui lòng nhập số điện thoại nhân viên.");
      return;
    }

    if (!foundUser && !fullNameInput.trim()) {
      setErrorMessage("Vui lòng nhập họ và tên cho nhân viên mới.");
      return;
    }

    if (foundUser?.isAlreadyStaffAtThisHouse) {
      setErrorMessage("Nhân viên này đã đang làm việc tại nhà trọ này.");
      return;
    }

    if (isCreatingNewPosition && !newPositionName.trim()) {
      setErrorMessage("Vui lòng nhập tên vị trí công việc mới.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload: any = {
        phoneNumber: cleanPhone,
        joinedAt: new Date(joinedAtInput).toISOString(),
        note: noteInput.trim() || undefined,
      };

      if (foundUser) {
        payload.fullName = foundUser.fullName;
      } else {
        payload.fullName = fullNameInput.trim();
      }

      if (isCreatingNewPosition) {
        payload.newPositionName = newPositionName.trim();
        payload.newPositionDescription = newPositionDesc.trim() || undefined;
      } else {
        payload.positionId = selectedPositionId;
      }

      const res = await staffService.onboardStaff(buildingId, payload);

      if (res?.success) {
        setIsOnboardModalOpen(false);
        resetOnboardForm();
        await fetchStaffData();

        if (res.isNewUser && res.generatedPassword) {
          setCredentialModal({
            isOpen: true,
            name: res.data.fullName,
            phone: res.data.phoneNumber,
            password: res.generatedPassword,
          });
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi thêm nhân viên. Vui lòng thử lại.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign / Re-assign Role (UC-L-20 Step 3)
  const handleOpenAssignRoleModal = (staff: StaffItem) => {
    setSelectedStaff(staff);
    setAssignTargetPositionId(staff.positionId);
    setIsAssignCreatingNew(false);
    setAssignNewPosName("");
    setAssignNewPosDesc("");
    setAssignError("");
    setFormDirty(false);
    setIsAssignRoleModalOpen(true);
  };

  const handleSaveAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !buildingId) return;

    if (isAssignCreatingNew && !assignNewPosName.trim()) {
      setAssignError("Vui lòng nhập tên vị trí mới.");
      return;
    }

    setIsAssignSubmitting(true);
    setAssignError("");

    try {
      const payload: any = {};
      if (isAssignCreatingNew) {
        payload.newPositionName = assignNewPosName.trim();
        payload.newPositionDescription = assignNewPosDesc.trim() || undefined;
      } else {
        payload.positionId = assignTargetPositionId;
      }

      await staffService.assignRole(buildingId, selectedStaff.assignmentId, payload);
      setIsAssignRoleModalOpen(false);
      setFormDirty(false);
      await fetchStaffData();
    } catch (err: any) {
      setAssignError(
        err?.response?.data?.message || err?.message || "Không thể phân công vai trò."
      );
    } finally {
      setIsAssignSubmitting(false);
    }
  };

  // Toggle Staff Status (UC-L-20 Step 2 & 4)
  const handleToggleStatus = async (staff: StaffItem) => {
    const nextStatus = staff.status === "active" ? "inactive" : "active";
    const confirmMsg =
      nextStatus === "inactive"
        ? `Xác nhận chuyển nhân viên "${staff.fullName}" sang trạng thái ĐÃ NGHỈ? Các ca làm việc trong tương lai của nhân viên này sẽ bị hủy.`
        : `Kích hoạt lại trạng thái ĐANG LÀM VIỆC cho nhân viên "${staff.fullName}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await staffService.updateStaffStatus(buildingId, staff.assignmentId, {
        status: nextStatus,
      });
      await fetchStaffData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể cập nhật trạng thái nhân viên");
    }
  };

  // Manage Positions Actions (CRUD)
  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posFormName.trim()) {
      setPosErrorMessage("Tên vị trí không được để trống.");
      return;
    }

    setIsPosSubmitting(true);
    setPosErrorMessage("");
    try {
      if (editingPosition) {
        await staffService.updatePosition(buildingId, editingPosition.id, {
          name: posFormName.trim(),
          description: posFormDesc.trim() || undefined,
        });
      } else {
        await staffService.createPosition(buildingId, {
          name: posFormName.trim(),
          description: posFormDesc.trim() || undefined,
        });
      }

      setEditingPosition(null);
      setIsAddingPositionInline(false);
      setPosFormName("");
      setPosFormDesc("");
      setFormDirty(false);
      await fetchStaffData();
    } catch (err: any) {
      setPosErrorMessage(
        err?.response?.data?.message || err?.message || "Lỗi lưu vị trí công việc"
      );
    } finally {
      setIsPosSubmitting(false);
    }
  };

  const handleDeletePosition = async (pos: JobPosition) => {
    if (
      !window.confirm(
        `Xác nhận xóa vị trí công việc "${pos.name}"? Thao tác này không thể hoàn tác.`
      )
    )
      return;

    try {
      await staffService.deletePosition(buildingId, pos.id);
      await fetchStaffData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể xóa vị trí này.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  // Pagination calculations (Rule #9)
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const windowSize = 5;
  const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
  const visiblePages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
            Quản lý nhân sự
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Phân công vai trò, quản lý vị trí công việc và hồ sơ nhân sự (UC-L-19, UC-L-20)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingPosition(null);
              setIsAddingPositionInline(false);
              setPosFormName("");
              setPosFormDesc("");
              setPosErrorMessage("");
              setIsPositionsModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Briefcase className="w-4 h-4 text-[#2AC1BC]" />
            <span>Quản lý vị trí ({positions.length})</span>
          </button>

          <button
            onClick={() => {
              resetOnboardForm();
              setIsOnboardModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25aba6] rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Thêm nhân viên mới
          </button>
        </div>
      </div>

      {/* Dark Hero Stats Banner */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Users className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-[#2AC1BC] border border-[#2AC1BC]/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>{activeBuilding?.name || "Chưa chọn tòa nhà"}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Đội ngũ nhân sự & vai trò
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Dễ dàng phân quyền vai trò (Bảo vệ, Vệ sinh, Quản lý), cập nhật trạng thái làm việc và quy định nhiệm vụ công việc.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="flex flex-col p-3.5 bg-white/5 rounded-2xl border border-white/10 min-w-[125px]">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Tổng nhân sự
              </span>
              <span className="font-black text-white text-xl sm:text-2xl mt-1">
                {summary.totalStaff}
              </span>
            </div>

            <div className="flex flex-col p-3.5 bg-[#2AC1BC]/10 rounded-2xl border border-[#2AC1BC]/30 min-w-[125px]">
              <span className="text-[10px] uppercase font-bold text-[#2AC1BC] tracking-wider">
                Đang làm việc
              </span>
              <span className="font-black text-[#2AC1BC] text-xl sm:text-2xl mt-1">
                {summary.activeStaff}
              </span>
            </div>

            <div className="flex flex-col p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-700 min-w-[125px]">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Đã nghỉ việc
              </span>
              <span className="font-black text-zinc-300 text-xl sm:text-2xl mt-1">
                {summary.inactiveStaff}
              </span>
            </div>

            <div className="flex flex-col p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/30 min-w-[125px]">
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                Vị trí công việc
              </span>
              <span className="font-black text-blue-400 text-xl sm:text-2xl mt-1">
                {summary.positionsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, vị trí..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5">
            {/* Position filter */}
            <div className="relative min-w-[170px]">
              <select
                value={positionFilter}
                onChange={(e) => {
                  setPositionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-zinc-200 pl-3 pr-8 py-2 text-xs font-semibold text-zinc-800 bg-zinc-50 focus:bg-white focus:outline-none focus:border-[#2AC1BC] appearance-none cursor-pointer"
              >
                <option value="all">Tất cả vị trí ({positions.length})</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name} {pos.staffCount ? `(${pos.staffCount})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>

            {/* View Mode Toggle (Rule #9) */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
              <button
                onClick={() => {
                  setViewMode("grid");
                  setPageSize(6);
                  setCurrentPage(1);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid"
                  ? "bg-white text-[#2AC1BC] shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900"
                  }`}
                title="Xem dạng lưới (Grid)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode("table");
                  setPageSize(10);
                  setCurrentPage(1);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "table"
                  ? "bg-white text-[#2AC1BC] shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900"
                  }`}
                title="Xem dạng bảng (Table)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100">
          {[
            { label: "Tất cả nhân sự", val: "all", count: summary.totalStaff },
            { label: "Đang làm việc", val: "active", count: summary.activeStaff },
            { label: "Đã nghỉ việc", val: "inactive", count: summary.inactiveStaff },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => {
                setStatusFilter(tab.val as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === tab.val
                ? "bg-[#2AC1BC] text-white shadow-xs shadow-[#2AC1BC]/20"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${statusFilter === tab.val
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 text-zinc-700"
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2 bg-white rounded-3xl border border-zinc-200">
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">Đang tải danh sách nhân sự...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div className="max-w-sm space-y-1">
            <h3 className="text-base font-extrabold text-zinc-900">
              Chưa có nhân viên nào
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {searchQuery || statusFilter !== "all" || positionFilter !== "all"
                ? "Không tìm thấy nhân viên phù hợp với bộ lọc hiện tại. Thử xóa bớt điều kiện tìm kiếm."
                : "Bắt đầu thêm nhân viên bảo vệ, vệ sinh hoặc quản lý để đồng bộ ca làm việc và lịch trực."}
            </p>
          </div>
          <button
            onClick={() => {
              resetOnboardForm();
              setIsOnboardModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25aba6] rounded-xl transition-all shadow-sm cursor-pointer"
          >
            + Thêm nhân viên ngay
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Rule #9 default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map((staff) => {
            const isActive = staff.status === "active";
            return (
              <div
                key={staff.assignmentId}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-4">
                  {/* Card Header: Avatar, Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                        {staff.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-zinc-900 text-base group-hover:text-[#2AC1BC] transition-colors line-clamp-1">
                          {staff.fullName}
                        </h3>
                        <div className="inline-flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-[#2AC1BC]" />
                          <span className="text-xs font-bold text-[#2AC1BC]">
                            {staff.positionName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border shrink-0 ${isActive
                        ? "bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200"
                        }`}
                    >
                      {isActive ? "Đang làm" : "Đã nghỉ"}
                    </span>
                  </div>

                  {/* Details List */}
                  <div className="space-y-2 pt-1 text-xs text-zinc-600 border-t border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-bold text-zinc-900">{staff.phoneNumber}</span>
                    </div>
                    {staff.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="text-zinc-600 truncate">{staff.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>
                        Bắt đầu:{" "}
                        <strong className="text-zinc-700">
                          {new Date(staff.joinedAt).toLocaleDateString("vi-VN")}
                        </strong>
                      </span>
                    </div>
                    {staff.positionDescription && (
                      <div className="flex items-start gap-2 text-[11px] text-zinc-500 bg-zinc-50 p-2 rounded-xl">
                        <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 italic">
                          {staff.positionDescription}
                        </span>
                      </div>
                    )}
                    {staff.mustChangePassword && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-semibold">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Chờ đổi mật khẩu lần đầu</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions: Assign Role & Toggle Status */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedStaff(staff);
                        setIsDetailModalOpen(true);
                      }}
                      className="text-xs font-bold text-zinc-600 hover:text-zinc-900 px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      Chi tiết
                    </button>
                    <button
                      onClick={() => handleOpenAssignRoleModal(staff)}
                      className="text-xs font-bold text-[#2AC1BC] hover:bg-[#2AC1BC]/10 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      title="Đổi vai trò & nhiệm vụ"
                    >
                      <Edit3 className="w-3 h-3" /> Đổi vai trò
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(staff)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                      ? "text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60"
                      : "text-[#2AC1BC] bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 border border-[#2AC1BC]/30"
                      }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{isActive ? "Tạm nghỉ" : "Kích hoạt"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9 parallel table) */
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50/80 text-zinc-500 uppercase font-bold border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-3.5">Nhân viên</th>
                  <th className="px-6 py-3.5">Vị trí & Nhiệm vụ</th>
                  <th className="px-6 py-3.5">Số điện thoại</th>
                  <th className="px-6 py-3.5">Ngày tham gia</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {staffList.map((staff) => {
                  const isActive = staff.status === "active";
                  return (
                    <tr key={staff.assignmentId} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {staff.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-zinc-900 text-sm">
                              {staff.fullName}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {staff.email || "Chưa có email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-zinc-900">
                            {staff.positionName}
                          </span>
                          {staff.positionDescription && (
                            <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                              {staff.positionDescription}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900">
                        {staff.phoneNumber}
                      </td>
                      <td className="px-6 py-4 text-zinc-600">
                        {new Date(staff.joinedAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${isActive
                            ? "bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
                            }`}
                        >
                          {isActive ? "Đang làm việc" : "Đã nghỉ"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAssignRoleModal(staff)}
                            className="px-2.5 py-1 text-xs font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 rounded-lg transition-colors cursor-pointer"
                            title="Đổi vai trò & nhiệm vụ"
                          >
                            Đổi vai trò
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isActive
                              ? "text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100"
                              : "text-[#2AC1BC] bg-[#2AC1BC]/10 border-[#2AC1BC]/30 hover:bg-[#2AC1BC]/20"
                              }`}
                            title={isActive ? "Chuyển sang Đã nghỉ" : "Kích hoạt lại"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standardized Dormio Pagination Footer (Rule #9) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200">
            <span>Hiển thị</span>
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize || ""}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setPageSize(isNaN(val) || val <= 0 ? 1 : Math.min(val, 100));
                setCurrentPage(1);
              }}
              className="w-12 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs"
            />
            <span>/ trang</span>
          </div>

          <span className="hidden sm:inline text-zinc-300">|</span>

          <div>
            <span className="font-extrabold text-zinc-800">
              {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-extrabold text-zinc-800">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{" "}
            trên tổng số <span className="font-extrabold text-zinc-800">{totalItems}</span> nhân viên
          </div>
        </div>

        {/* 5-Page Window Jumping Pagination */}
        <div className="flex items-center gap-1.5">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(windowStart - windowSize, 1))}
            className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            &larr; Trước
          </button>
          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${currentPage === page
                ? "bg-[#2AC1BC] text-white shadow-xs shadow-[#2AC1BC]/30"
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
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ONBOARD STAFF (UC-L-19) */}
      {/* ========================================================================= */}
      {isOnboardModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleAttemptCloseModal("onboard");
          }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col max-h-[92vh]"
            onInput={() => setFormDirty(true)}
            onChange={() => setFormDirty(true)}
          >
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-900 text-base">
                    Thêm nhân viên mới
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-semibold">
                    Kiểm tra số điện thoại và phân công vai trò (UC-L-19)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAttemptCloseModal("onboard")}
                className="p-1.5 rounded-xl hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOnboard} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Phone lookup */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                    <span>Số điện thoại nhân viên</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="tel"
                        required
                        placeholder="VD: 0901234567"
                        value={lookupPhone}
                        onChange={(e) => {
                          setLookupPhone(e.target.value);
                          setFormDirty(true);
                          if (hasSearched) setHasSearched(false);
                        }}
                        onBlur={() => handleSearchPhone(lookupPhone)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearchPhone(lookupPhone);
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearchPhone(lookupPhone)}
                      disabled={isSearchingUser || !lookupPhone.trim()}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      {isSearchingUser ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Kiểm tra"
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Nhập SĐT để kiểm tra xem nhân viên đã có tài khoản trên Dormio hay chưa.
                  </p>
                </div>

                {/* Found user */}
                {hasSearched && foundUser && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-extrabold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tài khoản đã tồn tại trên Dormio</span>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black text-sm">
                        {foundUser.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-zinc-900 text-xs truncate">
                          {foundUser.fullName}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {foundUser.phoneNumber} {foundUser.email ? `• ${foundUser.email}` : ""}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-zinc-100 text-zinc-600 uppercase">
                        {foundUser.role}
                      </span>
                    </div>

                    {foundUser.isAlreadyStaffAtThisHouse && (
                      <div className="p-2 bg-amber-100/70 border border-amber-300 rounded-xl text-[11px] text-amber-800 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Nhân viên này hiện đã được phân công tại nhà trọ này.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* New user prompt */}
                {hasSearched && !foundUser && (
                  <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-orange-800 text-xs font-extrabold">
                      <Info className="w-4 h-4 text-[#FF6B35] shrink-0" />
                      <span>Chưa có tài khoản — Hệ thống sẽ tự động tạo tài khoản mới</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">
                        Họ và tên nhân viên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nguyễn Văn Bảo"
                        value={fullNameInput}
                        onChange={(e) => {
                          setFullNameInput(e.target.value);
                          setFormDirty(true);
                        }}
                        className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-[#FF6B35] transition-all"
                      />
                    </div>

                    <div className="p-2.5 bg-white/80 rounded-xl border border-orange-100 text-[11px] text-zinc-600 leading-relaxed space-y-1">
                      <p className="font-bold text-orange-700">Chính sách bảo mật (UC-AUTH-03):</p>
                      <p>
                        Mật khẩu ngẫu nhiên tạm thời sẽ được tạo tự động và hiển thị cho bạn sao chép sau khi lưu. Tài khoản sẽ bắt buộc đổi mật khẩu mới trong lần đầu đăng nhập.
                      </p>
                    </div>
                  </div>
                )}

                {/* Job Position selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                      <span>Vị trí công việc (Vai trò)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewPosition(!isCreatingNewPosition)}
                      className="text-[11px] font-bold text-[#2AC1BC] hover:underline cursor-pointer"
                    >
                      {isCreatingNewPosition ? "Chọn vị trí có sẵn" : "+ Tạo vị trí mới"}
                    </button>
                  </div>

                  {!isCreatingNewPosition ? (
                    <div className="relative">
                      <select
                        value={selectedPositionId}
                        onChange={(e) => {
                          setSelectedPositionId(e.target.value);
                          setFormDirty(true);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] appearance-none cursor-pointer"
                      >
                        {positions.map((pos) => (
                          <option key={pos.id} value={pos.id}>
                            {pos.name} {pos.description ? `— ${pos.description}` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="space-y-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                      <div>
                        <label className="text-[11px] font-bold text-zinc-600">
                          Tên vị trí mới <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={isCreatingNewPosition}
                          placeholder="VD: Kỹ thuật điện nước, Lễ tân"
                          value={newPositionName}
                          onChange={(e) => {
                            setNewPositionName(e.target.value);
                            setFormDirty(true);
                          }}
                          className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-zinc-600">
                          Mô tả nhiệm vụ tĩnh (duties list cho nhân viên)
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Kiểm tra đồng hồ, sửa chữa sự cố phòng trọ"
                          value={newPositionDesc}
                          onChange={(e) => {
                            setNewPositionDesc(e.target.value);
                            setFormDirty(true);
                          }}
                          className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Start Date & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">
                      Ngày bắt đầu làm việc
                    </label>
                    <input
                      type="date"
                      value={joinedAtInput}
                      onChange={(e) => {
                        setJoinedAtInput(e.target.value);
                        setFormDirty(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">
                      Ghi chú thêm
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Thử việc ca ngày"
                      value={noteInput}
                      onChange={(e) => {
                        setNoteInput(e.target.value);
                        setFormDirty(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50/60">
                <button
                  type="button"
                  onClick={() => handleAttemptCloseModal("onboard")}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (foundUser?.isAlreadyStaffAtThisHouse ?? false)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25aba6] disabled:opacity-50 rounded-xl transition-all shadow-md shadow-[#2AC1BC]/20 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu & Phân công</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN / RE-ASSIGN ROLE (UC-L-20 Step 3) */}
      {/* ========================================================================= */}
      {isAssignRoleModalOpen && selectedStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleAttemptCloseModal("assignRole");
          }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col max-h-[90vh]"
            onInput={() => setFormDirty(true)}
            onChange={() => setFormDirty(true)}
          >
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-900 text-base">
                    Phân công lại vai trò
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-semibold">
                    Đổi vị trí và cập nhật danh sách nhiệm vụ công việc (UC-L-20)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAttemptCloseModal("assignRole")}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignRole} className="p-6 space-y-4">
              {assignError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{assignError}</span>
                </div>
              )}

              {/* Staff Member Card Header */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                  {selectedStaff.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-extrabold text-zinc-900">
                    {selectedStaff.fullName}
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    SĐT: {selectedStaff.phoneNumber} • Hiện tại:{" "}
                    <strong className="text-[#2AC1BC]">{selectedStaff.positionName}</strong>
                  </p>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700">
                    Chọn vai trò mới <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAssignCreatingNew(!isAssignCreatingNew)}
                    className="text-[11px] font-bold text-[#2AC1BC] hover:underline cursor-pointer"
                  >
                    {isAssignCreatingNew ? "Chọn vị trí có sẵn" : "+ Tạo vị trí mới"}
                  </button>
                </div>

                {!isAssignCreatingNew ? (
                  <div className="relative">
                    <select
                      value={assignTargetPositionId}
                      onChange={(e) => {
                        setAssignTargetPositionId(e.target.value);
                        setFormDirty(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] appearance-none cursor-pointer"
                    >
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name} {pos.description ? `— ${pos.description}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600">
                        Tên vị trí mới <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Quản lý kỹ thuật"
                        value={assignNewPosName}
                        onChange={(e) => {
                          setAssignNewPosName(e.target.value);
                          setFormDirty(true);
                        }}
                        className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600">
                        Mô tả nhiệm vụ công việc
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Kiểm tra camera, hệ thống PCCC"
                        value={assignNewPosDesc}
                        onChange={(e) => {
                          setAssignNewPosDesc(e.target.value);
                          setFormDirty(true);
                        }}
                        className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Position Duty Description Preview */}
              {!isAssignCreatingNew && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-700">
                    Mô tả nhiệm vụ được giao:
                  </span>
                  <p className="italic text-zinc-700">
                    {positions.find((p) => p.id === assignTargetPositionId)?.description ||
                      "Chưa có mô tả nhiệm vụ chi tiết cho vị trí này."}
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => handleAttemptCloseModal("assignRole")}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isAssignSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25aba6] disabled:opacity-50 rounded-xl transition-all shadow-md shadow-[#2AC1BC]/20 cursor-pointer flex items-center gap-2"
                >
                  {isAssignSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <span>Xác nhận đổi vai trò</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANAGE JOB POSITIONS (CRUD) */}
      {/* ========================================================================= */}
      {isPositionsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleAttemptCloseModal("positions");
          }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col max-h-[90vh]"
            onInput={() => setFormDirty(true)}
            onChange={() => setFormDirty(true)}
          >
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-900 text-base">
                    Quản lý vị trí & nhiệm vụ công việc
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-semibold">
                    Cấu hình vai trò và mô tả nhiệm vụ tĩnh cho nhân viên tòa nhà
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAttemptCloseModal("positions")}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {posErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{posErrorMessage}</span>
                </div>
              )}

              {/* Inline Form to Add / Edit Position */}
              {(isAddingPositionInline || editingPosition) && (
                <form
                  onSubmit={handleSavePosition}
                  className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-zinc-900">
                      {editingPosition ? "Chỉnh sửa vị trí công việc" : "Thêm vị trí mới"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPosition(null);
                        setIsAddingPositionInline(false);
                      }}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 font-bold"
                    >
                      Đóng form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-700">
                        Tên vị trí <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Trưởng ban Quản lý"
                        value={posFormName}
                        onChange={(e) => {
                          setPosFormName(e.target.value);
                          setFormDirty(true);
                        }}
                        className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-700">
                        Nhiệm vụ & trách nhiệm (duties list)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Kiểm tra hành lang, thu gom rác chung"
                        value={posFormDesc}
                        onChange={(e) => {
                          setPosFormDesc(e.target.value);
                          setFormDirty(true);
                        }}
                        className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPosition(null);
                        setIsAddingPositionInline(false);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isPosSubmitting}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25aba6] rounded-xl shadow-xs"
                    >
                      {isPosSubmitting ? "Đang lưu..." : "Lưu vị trí"}
                    </button>
                  </div>
                </form>
              )}

              {/* Positions List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">
                    Danh sách các vị trí ({positions.length})
                  </span>
                  {!isAddingPositionInline && !editingPosition && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingPositionInline(true);
                        setEditingPosition(null);
                        setPosFormName("");
                        setPosFormDesc("");
                      }}
                      className="text-xs font-bold text-[#2AC1BC] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm vị trí mới
                    </button>
                  )}
                </div>

                <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                  {positions.map((pos) => (
                    <div
                      key={pos.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors"
                    >
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-zinc-900 text-xs sm:text-sm">
                            {pos.name}
                          </span>
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold">
                            {pos.staffCount || 0} nhân sự
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 italic">
                          {pos.description || "Chưa có mô tả nhiệm vụ"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPosition(pos);
                            setIsAddingPositionInline(false);
                            setPosFormName(pos.name);
                            setPosFormDesc(pos.description || "");
                          }}
                          className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                          title="Sửa vị trí"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePosition(pos)}
                          disabled={(pos.staffCount || 0) > 0}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                          title={
                            (pos.staffCount || 0) > 0
                              ? "Không thể xóa vì đang có nhân viên đảm nhận"
                              : "Xóa vị trí"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end bg-zinc-50/60">
              <button
                type="button"
                onClick={() => handleAttemptCloseModal("positions")}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREDENTIALS NOTIFICATION MODAL */}
      {/* ========================================================================= */}
      {credentialModal.isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setCredentialModal((prev) => ({ ...prev, isOpen: false }));
            }
          }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-zinc-100 p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-zinc-900">
                Đã thêm nhân viên thành công!
              </h3>
              <p className="text-xs text-zinc-500">
                Tài khoản mới đã được tạo cho nhân viên{" "}
                <strong className="text-zinc-800">{credentialModal.name}</strong>. Hãy chia sẻ thông tin đăng nhập bên dưới cho nhân viên:
              </p>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-left space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-semibold">Tên đăng nhập (SĐT):</span>
                <span className="font-extrabold text-zinc-900">{credentialModal.phone}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-semibold">Mật khẩu tạm thời:</span>
                <span className="font-mono font-black text-sm text-[#FF6B35] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                  {credentialModal.password}
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                copyToClipboard(
                  `Thông tin tài khoản nhân viên Dormio:\n- SĐT: ${credentialModal.phone}\n- Mật khẩu: ${credentialModal.password}\nVui lòng đăng nhập và đổi mật khẩu mới trong lần đầu tiên.`
                )
              }
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedPassword ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Đã sao chép vào bộ nhớ tạm!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép thông tin đăng nhập</span>
                </>
              )}
            </button>

            <button
              onClick={() => setCredentialModal((prev) => ({ ...prev, isOpen: false }))}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Đóng thông báo
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STAFF DETAIL VIEW */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsDetailModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-zinc-100 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-black text-lg">
                  {selectedStaff.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-900 text-base">
                    {selectedStaff.fullName}
                  </h3>
                  <p className="text-xs font-bold text-[#2AC1BC]">
                    {selectedStaff.positionName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-semibold">Trạng thái:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${selectedStaff.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-200 text-zinc-600"
                    }`}
                >
                  {selectedStaff.status === "active" ? "Đang làm việc" : "Đã nghỉ"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-semibold">Số điện thoại:</span>
                <span className="font-bold text-zinc-900">{selectedStaff.phoneNumber}</span>
              </div>
              {selectedStaff.email && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-semibold">Email:</span>
                  <span className="font-medium text-zinc-700">{selectedStaff.email}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-semibold">Ngày tham gia:</span>
                <span className="font-medium text-zinc-700">
                  {new Date(selectedStaff.joinedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              {selectedStaff.leftAt && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-semibold">Ngày nghỉ việc:</span>
                  <span className="font-medium text-rose-600">
                    {new Date(selectedStaff.leftAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
              {selectedStaff.positionDescription && (
                <div className="pt-2 border-t border-zinc-200/80">
                  <span className="text-zinc-500 font-semibold block mb-1">
                    Mô tả nhiệm vụ công việc:
                  </span>
                  <p className="text-zinc-700 italic">
                    {selectedStaff.positionDescription}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  handleOpenAssignRoleModal(selectedStaff);
                  setIsDetailModalOpen(false);
                }}
                className="px-3.5 py-2 text-xs font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 rounded-xl transition-colors cursor-pointer"
              >
                Đổi vai trò
              </button>
              <button
                onClick={() => {
                  handleToggleStatus(selectedStaff);
                  setIsDetailModalOpen(false);
                }}
                className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
              >
                {selectedStaff.status === "active" ? "Chuyển sang Đã nghỉ" : "Kích hoạt lại"}
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UNSAVED CHANGES CONFIRMATION (Rule #10) */}
      {/* ========================================================================= */}
      {isConfirmCloseOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsConfirmCloseOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-zinc-100 p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-zinc-900">
                Xác nhận đóng form
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Bạn có thông tin chưa được lưu. Nếu đóng bây giờ, các thay đổi sẽ bị hủy bỏ.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmCloseOpen(false)}
                className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-600/20"
              >
                Hủy thay đổi & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
