"use client";

import React, { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  FileSignature,
  User,
  DollarSign,
  Home,
  AlertCircle,
  Sparkles,
  Search,
  ShieldCheck,
  IdCard,
  Building2,
  Calendar,
  CreditCard,
  Info,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getRooms, RoomItem } from "@/services/room.service";
import {
  getPendingPlatformDeposit,
  searchTenantByPhone,
  createPlatformContract,
  createDirectContract,
  PendingDepositResponse,
} from "@/services/contract.service";

export default function CreateContractPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2AC1BC]" />
        </div>
      }
    >
      <CreateContractPage />
    </Suspense>
  );
}

function CreateContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoomId = searchParams.get("roomId") || "";
  const { activeBuilding } = useAuth();

  // Wizard Step
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Rooms list & loading
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Form State
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [flowType, setFlowType] = useState<"platform" | "direct">("direct");
  const [pendingDeposit, setPendingDeposit] = useState<PendingDepositResponse | null>(null);
  const [isCheckingDeposit, setIsCheckingDeposit] = useState(false);

  // Tenant Fields
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantFullName, setTenantFullName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [tenantFound, setTenantFound] = useState<boolean | null>(null);
  const [hasIdentification, setHasIdentification] = useState(false);

  // Identification (CCCD) Fields
  const [showIdForm, setShowIdForm] = useState(false);
  const [identityNumber, setIdentityNumber] = useState("");
  const [idFullName, setIdFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("2000-01-01");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [nationality, setNationality] = useState("Việt Nam");
  const [placeOfResidence, setPlaceOfResidence] = useState("");

  // Terms & Financials
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
  );
  const [rentPrice, setRentPrice] = useState<number>(3500000);
  const [depositAmount, setDepositAmount] = useState<number>(3500000);
  const [monthlyPaymentDate, setMonthlyPaymentDate] = useState<number>(5);
  const [rentPaymentCycle, setRentPaymentCycle] = useState<number>(1);
  const [note, setNote] = useState("");

  // UI status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // UUID regex to ensure we only send real UUIDs to the backend
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Load rooms for the active building
  useEffect(() => {
    async function loadRooms() {
      if (!activeBuilding?.id || !UUID_REGEX.test(activeBuilding.id)) {
        setRooms([]);
        return;
      }

      setIsLoadingRooms(true);
      try {
        const res = await getRooms(activeBuilding.id, { limit: 100 });
        if (res?.data && res.data.length > 0) {
          setRooms(res.data);
        } else {
          setRooms([]);
        }
      } catch (err) {
        console.warn("Failed to load rooms from API:", err);
        setRooms([]);
      } finally {
        setIsLoadingRooms(false);
      }
    }
    loadRooms();
  }, [activeBuilding?.id]);

  // Check deposit whenever room selection changes
  useEffect(() => {
    async function checkDeposit() {
      if (!selectedRoomId || !activeBuilding?.id) {
        setPendingDeposit(null);
        setFlowType("direct");
        return;
      }

      // Skip API if building or room is not a UUID
      if (!UUID_REGEX.test(activeBuilding.id) || !UUID_REGEX.test(selectedRoomId)) {
        setPendingDeposit(null);
        setFlowType("direct");
        return;
      }

      setIsCheckingDeposit(true);
      try {
        const res = await getPendingPlatformDeposit(activeBuilding.id, selectedRoomId);
        if (res?.data) {
          // Flow A detected!
          setPendingDeposit(res.data);
          setFlowType("platform");
          setDepositAmount(res.data.amount);
          if (res.data.tenant) {
            setTenantPhone(res.data.tenant.phoneNumber || "");
            setTenantFullName(res.data.tenant.fullName || "");
            setTenantEmail(res.data.tenant.email || "");
            setTenantFound(true);
            setHasIdentification(!!res.data.tenant.userIdentification);
          }
        } else {
          // Flow B
          setPendingDeposit(null);
          setFlowType("direct");
        }
      } catch (err) {
        console.warn("Check deposit failed or none present, defaulting to direct flow:", err);
        setPendingDeposit(null);
        setFlowType("direct");
      } finally {
        setIsCheckingDeposit(false);
      }
    }
    checkDeposit();
  }, [selectedRoomId, activeBuilding?.id]);

  // Handle phone search debounce / action
  const handleSearchPhone = async (phoneToSearch: string) => {
    if (!phoneToSearch || phoneToSearch.length < 9) return;
    setIsSearchingPhone(true);
    try {
      const res = await searchTenantByPhone(phoneToSearch);
      if (res?.data?.exists && res.data.user) {
        setTenantFound(true);
        setTenantFullName(res.data.user.fullName || "");
        setTenantEmail(res.data.user.email || "");
        setHasIdentification(res.data.user.hasIdentification);
        if (!res.data.user.hasIdentification) {
          setShowIdForm(true);
        }
      } else {
        setTenantFound(false);
        setHasIdentification(false);
        setShowIdForm(true);
      }
    } catch {
      setTenantFound(false);
    } finally {
      setIsSearchingPhone(false);
    }
  };

  // Rule 10: Modal / Form Close Handling with custom Confirmation Modal
  const handleAttemptClose = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      router.push("/landlord/contracts");
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    router.push("/landlord/contracts");
  };

  // Form Submission
  const handleSubmitContract = async () => {
    if (!selectedRoomId) {
      setErrorMessage("Vui lòng chọn phòng cần lập hợp đồng.");
      setStep(1);
      return;
    }

    if (!activeBuilding?.id) {
      setErrorMessage("Chưa xác định được cơ sở nhà trọ đang hoạt động.");
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const isRealApi =
          UUID_REGEX.test(activeBuilding.id) && UUID_REGEX.test(selectedRoomId);

        if (isRealApi) {
          if (flowType === "platform") {
            // Flow A submission
            await createPlatformContract(activeBuilding.id, {
              roomId: selectedRoomId,
              startDate: new Date(startDate).toISOString(),
              endDate: new Date(endDate).toISOString(),
              rentPrice: Number(rentPrice),
              monthlyPaymentDate: Number(monthlyPaymentDate),
              rentPaymentCycle: Number(rentPaymentCycle),
              note: note || undefined,
            });
          } else {
            // Flow B submission
            if (!tenantPhone || !tenantFullName) {
              setErrorMessage("Vui lòng điền số điện thoại và tên khách thuê.");
              setStep(1);
              return;
            }

            const payload: any = {
              roomId: selectedRoomId,
              startDate: new Date(startDate).toISOString(),
              endDate: new Date(endDate).toISOString(),
              rentPrice: Number(rentPrice),
              depositAmount: Number(depositAmount),
              monthlyPaymentDate: Number(monthlyPaymentDate),
              rentPaymentCycle: Number(rentPaymentCycle),
              note: note || undefined,
              tenantPhoneNumber: tenantPhone,
              tenantFullName: tenantFullName,
              tenantEmail: tenantEmail || undefined,
            };

            if (showIdForm && identityNumber) {
              payload.identification = {
                identityNumber,
                fullName: idFullName || tenantFullName,
                dateOfBirth: new Date(dateOfBirth).toISOString(),
                gender,
                nationality: nationality || "Việt Nam",
                placeOfResidence: placeOfResidence ? { address: placeOfResidence } : {},
              };
            }

            await createDirectContract(activeBuilding.id, payload);
          }
        }

        router.push("/landlord/contracts?created=true");
      } catch (err: any) {
        console.error("Submit contract failed:", err);
        setErrorMessage(
          err?.message ||
            "Có lỗi xảy ra khi tạo hợp đồng. Vui lòng kiểm tra lại thông tin.",
        );
      }
    });
  };

  const selectedRoomObj = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#2AC1BC]" />
            <span>{activeBuilding?.name || "Khu trọ"}</span>
            <span>&bull;</span>
            <span>UC-L-04</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            Lập hợp đồng thuê mới
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Hỗ trợ hợp đồng trực tiếp (Flow B) và chuyển đổi đặt cọc nền tảng (Flow A)
          </p>
        </div>

        <button
          type="button"
          onClick={handleAttemptClose}
          className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>
      </div>

      {/* Progress Wizard */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            step === 1
              ? "bg-[#2AC1BC] text-white shadow-sm shadow-[#2AC1BC]/30"
              : step > 1
              ? "bg-[#2AC1BC]/10 text-[#2AC1BC]"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {step > 1 ? <Check className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
          1. Phòng & Khách thuê
        </button>

        <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />

        <button
          type="button"
          onClick={() => step > 1 && setStep(2)}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            step === 2
              ? "bg-[#2AC1BC] text-white shadow-sm shadow-[#2AC1BC]/30"
              : step > 2
              ? "bg-[#2AC1BC]/10 text-[#2AC1BC]"
              : "bg-zinc-100 text-zinc-400"
          }`}
        >
          {step > 2 ? <Check className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
          2. Điều khoản & Tài chính
        </button>

        <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />

        <button
          type="button"
          onClick={() => step > 2 && setStep(3)}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            step === 3
              ? "bg-[#2AC1BC] text-white shadow-sm shadow-[#2AC1BC]/30"
              : "bg-zinc-100 text-zinc-400"
          }`}
        >
          <FileSignature className="w-3.5 h-3.5" />
          3. Xác nhận & Ký kết
        </button>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-rose-400 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: Phòng & Khách thuê */}
      {step === 1 && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in duration-300">
          {/* Room Selection */}
          <div className="space-y-3 border-b border-zinc-100 pb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Home className="w-4 h-4 text-[#2AC1BC]" /> Chọn phòng thuê
              </h2>
              {isCheckingDeposit && (
                <span className="flex items-center gap-1.5 text-xs text-[#2AC1BC] font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang kiểm tra tiền cọc...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Phòng trống / Đã đặt cọc <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all cursor-pointer"
                >
                  <option value="">-- Chọn phòng trong nhà trọ --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.roomNumber} (Tầng {r.floor} - {r.roomType?.name || "Tiêu chuẩn"} - Trạng thái: {r.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoomObj && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs font-bold">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Thông tin phòng:</span>
                    <span className="text-zinc-900 font-extrabold text-sm">
                      Phòng {selectedRoomObj.roomNumber}
                    </span>
                    <span className="text-zinc-500 ml-1 text-xs">
                      (Tầng {selectedRoomObj.floor}, {selectedRoomObj.area || 20}m²)
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${
                      selectedRoomObj.status === "deposited"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {selectedRoomObj.status}
                  </span>
                </div>
              )}
            </div>

            {/* FLOW A BANNER IF PENDING PLATFORM DEPOSIT DETECTED */}
            {flowType === "platform" && pendingDeposit && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2 mt-4 animate-in zoom-in-95">
                <div className="flex items-center gap-2 text-purple-700 font-black text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Phát hiện khoản đặt cọc nền tảng Dormio (Flow A)</span>
                </div>
                <p className="text-xs text-purple-900 font-medium leading-relaxed">
                  Phòng này đã được khách thuê đặt cọc <strong>{pendingDeposit.amount.toLocaleString("vi-VN")} ₫</strong> qua bài đăng tìm phòng. Hợp đồng sẽ được khởi tạo ở trạng thái <strong>Bản nháp (Draft)</strong> để khách thuê xác nhận điện tử (UC-AUTH-04).
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-purple-800">
                  <span>Khách đặt cọc: <strong>{pendingDeposit.tenant?.fullName || "Khách nền tảng"}</strong></span>
                  <span>&bull;</span>
                  <span>SĐT: <strong>{pendingDeposit.tenant?.phoneNumber}</strong></span>
                  <span>&bull;</span>
                  <span>Số tiền cọc: <strong>{pendingDeposit.amount.toLocaleString("vi-VN")} ₫</strong> (Cố định)</span>
                </div>
              </div>
            )}
          </div>

          {/* Tenant Information Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#2AC1BC]" /> Thông tin khách thuê chính
              </h2>
              {flowType === "direct" && (
                <span className="text-[11px] text-zinc-500 font-bold">
                  Hợp đồng trực tiếp (Flow B) &bull; Kích hoạt ngay
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone Input with search lookup */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="VD: 0901234567"
                    disabled={flowType === "platform"}
                    value={tenantPhone}
                    onChange={(e) => {
                      setTenantPhone(e.target.value);
                      setIsDirty(true);
                      if (e.target.value.length === 10) {
                        handleSearchPhone(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all disabled:opacity-75"
                  />
                  {flowType === "direct" && (
                    <button
                      type="button"
                      onClick={() => handleSearchPhone(tenantPhone)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold bg-[#2AC1BC]/10 text-[#2AC1BC] hover:bg-[#2AC1BC] hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {isSearchingPhone ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Search className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
                {tenantFound === true && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Đã tìm thấy tài khoản trong hệ thống
                  </p>
                )}
                {tenantFound === false && flowType === "direct" && (
                  <p className="text-[11px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Khách mới &bull; Hệ thống sẽ tự động tạo tài khoản và gửi mã xác thực
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Họ và tên khách thuê <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn A"
                  disabled={flowType === "platform"}
                  value={tenantFullName}
                  onChange={(e) => {
                    setTenantFullName(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all disabled:opacity-75"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Email liên hệ (tùy chọn)
                </label>
                <input
                  type="email"
                  placeholder="VD: tenant@example.com"
                  disabled={flowType === "platform"}
                  value={tenantEmail}
                  onChange={(e) => {
                    setTenantEmail(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all disabled:opacity-75"
                />
              </div>

              {/* CCCD Status Toggle */}
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setShowIdForm(!showIdForm)}
                  className={`flex items-center justify-between px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    hasIdentification
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : showIdForm
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <IdCard className="w-4 h-4" />
                    {hasIdentification
                      ? "Đã có CCCD đã xác minh"
                      : showIdForm
                      ? "Thu gọn thông tin CCCD"
                      : "+ Nhập thông tin CCCD / Định danh"}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showIdForm ? "rotate-90" : ""}`} />
                </button>
              </div>
            </div>

            {/* Optional CCCD Form */}
            {showIdForm && (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4 animate-in fade-in">
                <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-[#2AC1BC]" /> Thông tin căn cước công dân (CCCD)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Số CCCD / CMND
                    </label>
                    <input
                      type="text"
                      placeholder="001201012345"
                      value={identityNumber}
                      onChange={(e) => {
                        setIdentityNumber(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Họ tên trên thẻ
                    </label>
                    <input
                      type="text"
                      placeholder={tenantFullName || "Họ và tên"}
                      value={idFullName}
                      onChange={(e) => {
                        setIdFullName(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Giới tính
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => {
                        setGender(e.target.value as "male" | "female");
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-[#2AC1BC]"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Quốc tịch
                    </label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => {
                        setNationality(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Địa chỉ thường trú
                    </label>
                    <input
                      type="text"
                      placeholder="Số nhà, phố, quận, tỉnh"
                      value={placeOfResidence}
                      onChange={(e) => {
                        setPlaceOfResidence(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedRoomId) {
                  setErrorMessage("Vui lòng chọn phòng trước khi tiếp tục.");
                  return;
                }
                if (!tenantPhone || !tenantFullName) {
                  setErrorMessage("Vui lòng nhập đầy đủ số điện thoại và tên khách thuê.");
                  return;
                }
                setErrorMessage(null);
                setStep(2);
              }}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
            >
              Tiếp tục <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Điều khoản & Tài chính */}
      {step === 2 && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in duration-300">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#2AC1BC]" /> Giá thuê & Tiền cọc
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rent Price */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Giá thuê phòng (VNĐ/tháng) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={50000}
                value={rentPrice}
                onChange={(e) => {
                  setRentPrice(Number(e.target.value));
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all"
              />
              <p className="text-[11px] text-zinc-400 mt-1 font-semibold">
                Thành tiền: {Number(rentPrice || 0).toLocaleString("vi-VN")} ₫
              </p>
            </div>

            {/* Deposit Amount */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Tiền đặt cọc (VNĐ) <span className="text-rose-500">*</span>
                {flowType === "platform" && (
                  <span className="text-purple-600 text-[10px] ml-1.5 font-bold">
                    (Khóa - Lấy từ cọc nền tảng)
                  </span>
                )}
              </label>
              <input
                type="number"
                min={0}
                disabled={flowType === "platform"}
                value={depositAmount}
                onChange={(e) => {
                  setDepositAmount(Number(e.target.value));
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all disabled:opacity-75"
              />
              <p className="text-[11px] text-zinc-400 mt-1 font-semibold">
                Thành tiền: {Number(depositAmount || 0).toLocaleString("vi-VN")} ₫
              </p>
            </div>

            {/* Monthly Payment Date */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Ngày thu tiền hàng tháng <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={monthlyPaymentDate}
                onChange={(e) => {
                  setMonthlyPaymentDate(Number(e.target.value));
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all"
              />
              <p className="text-[11px] text-zinc-400 mt-1 font-semibold">
                Hạn thanh toán định kỳ vào ngày {monthlyPaymentDate} mỗi tháng
              </p>
            </div>

            {/* Payment Cycle */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Chu kỳ thanh toán
              </label>
              <select
                value={rentPaymentCycle}
                onChange={(e) => {
                  setRentPaymentCycle(Number(e.target.value));
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all cursor-pointer"
              >
                <option value={1}>1 tháng / lần (Mặc định)</option>
                <option value={3}>3 tháng / lần</option>
                <option value={6}>6 tháng / lần</option>
                <option value={12}>1 năm / lần</option>
              </select>
            </div>
          </div>

          <div className="border-b border-zinc-100 pb-3 pt-2">
            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2AC1BC]" /> Thời hạn hợp đồng
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Ngày bắt đầu <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Ngày kết thúc <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all"
              />
            </div>

            <div className="col-span-full">
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Ghi chú điều khoản bổ sung (nếu có)
              </label>
              <textarea
                rows={3}
                placeholder="VD: Khách cam kết giữ gìn vệ sinh chung, không nuôi thú cưng..."
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] transition-all"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
            <button
              type="button"
              onClick={() => {
                if (!startDate || !endDate) {
                  setErrorMessage("Vui lòng chọn ngày bắt đầu và ngày kết thúc hợp đồng.");
                  return;
                }
                if (new Date(endDate) <= new Date(startDate)) {
                  setErrorMessage("Ngày kết thúc hợp đồng phải sau ngày bắt đầu.");
                  return;
                }
                setErrorMessage(null);
                setStep(3);
              }}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
            >
              Tiếp tục <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Xác nhận & Ký kết */}
      {step === 3 && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in duration-300">
          <div className="text-center max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto mb-2">
              <FileSignature className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-zinc-900">
              Xác nhận thông tin hợp đồng
            </h2>
            <p className="text-xs text-zinc-500">
              Vui lòng kiểm tra kỹ các thông số trước khi hệ thống tạo bản ghi hợp đồng chính thức
            </p>
          </div>

          {/* Summary Card */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <span className="font-bold text-zinc-500">Luồng hợp đồng:</span>
              <span
                className={`px-3 py-1 rounded-full font-black text-[11px] ${
                  flowType === "platform"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {flowType === "platform"
                  ? "Flow A — Cọc nền tảng Dormio (Bản nháp chờ duyệt)"
                  : "Flow B — Hợp đồng trực tiếp (Kích hoạt ngay)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-zinc-400 block text-[11px] font-semibold">Phòng:</span>
                <span className="font-black text-zinc-900 text-sm">
                  Phòng {selectedRoomObj?.roomNumber} (Tầng {selectedRoomObj?.floor})
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-semibold">Đại diện thuê:</span>
                <span className="font-black text-zinc-900 text-sm">
                  {tenantFullName} ({tenantPhone})
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-semibold">Thời hạn thuê:</span>
                <span className="font-bold text-zinc-800">
                  {startDate} &rarr; {endDate}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-semibold">Chu kỳ & Ngày thanh toán:</span>
                <span className="font-bold text-zinc-800">
                  Ngày {monthlyPaymentDate} hàng tháng &bull; {rentPaymentCycle} tháng/lần
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-semibold">Giá thuê hàng tháng:</span>
                <span className="font-black text-[#2AC1BC] text-sm">
                  {Number(rentPrice).toLocaleString("vi-VN")} ₫ / tháng
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-semibold">Tiền cọc ghi nhận:</span>
                <span className="font-black text-purple-700 text-sm">
                  {Number(depositAmount).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>

            {note && (
              <div className="pt-2 border-t border-zinc-200">
                <span className="text-zinc-400 block text-[11px] font-semibold">Ghi chú:</span>
                <p className="text-zinc-700 italic">{note}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmitContract}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo hợp đồng...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Ký & Tạo hợp đồng
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* RULE 10: Custom Pop-up Confirmation Modal for Unsaved Changes */}
      {showConfirmClose && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowConfirmClose(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-zinc-900">
                Xác nhận đóng form
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Bạn có thông tin hợp đồng đang nhập chưa được lưu. Bạn có chắc chắn muốn hủy bỏ và rời khỏi trang này?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="flex-1 py-2.5 px-4 text-xs font-black text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer shadow-sm shadow-rose-500/20"
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
