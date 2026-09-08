"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Wrench,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  X,
  LoaderCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  setupBoardingHouse,
  type SetupBoardingHousePayload,
  type SetupRoomTypePayload,
  type SetupServicePayload,
} from "@/services/boarding-house.service";

// ─── TYPES & CONSTANTS ────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3;

interface ServiceItem extends SetupServicePayload {
  id: string;
}

interface RoomTypeItem extends SetupRoomTypePayload {
  id: string;
}

const MAX_FREE_TIER_ROOMS = 10;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: createId(),
    name: "Điện sinh hoạt",
    unit: "kWh",
    price: "3500",
    isMetered: true,
    autoApplied: true,
  },
  {
    id: createId(),
    name: "Nước sinh hoạt",
    unit: "m³",
    price: "25000",
    isMetered: true,
    autoApplied: true,
  },
  {
    id: createId(),
    name: "Internet / WiFi",
    unit: "tháng",
    price: "100000",
    isMetered: false,
    autoApplied: true,
  },
];

const DEFAULT_ROOM_TYPES: RoomTypeItem[] = [
  {
    id: createId(),
    name: "Phòng khép kín tiêu chuẩn",
    description: "Có gác lửng, WC khép kín, kệ bếp nấu ăn riêng",
  },
];

const NAME_FORMAT_PRESETS = [
  { label: "P{floor}0{index} (P101, P102...)", value: "P{floor}0{index}" },
  { label: "P{floor}{index} (P11, P12...)", value: "P{floor}{index}" },
  { label: "{floor}0{index} (101, 102...)", value: "{floor}0{index}" },
  { label: "Phòng {floor}0{index}", value: "Phòng {floor}0{index}" },
];

export default function SetupWizardPage() {
  const router = useRouter();
  const { buildings, selectBuilding, refreshBuildings, upgradeToLandlord } = useAuth();

  // ─── WIZARD PROGRESS ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ─── STEP 1 STATE: GENERAL INFO ──────────────────────────────────────────────
  const [info, setInfo] = useState({
    name: "",
    description: "",
    country: "Việt Nam",
    province: "",
    city: "",
    district: "",
    ward: "",
    street: "",
    houseNumber: "",
    totalFloor: "3",
    builtAt: new Date().toISOString().slice(0, 10),
    thumbnail: "",
  });

  // ─── STEP 2 STATE: SERVICES & ROOM TYPES ─────────────────────────────────────
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>(DEFAULT_ROOM_TYPES);

  // ─── STEP 3 STATE: BULK ROOM GENERATION ──────────────────────────────────────
  const [roomsConfig, setRoomsConfig] = useState({
    floorCount: 3,
    roomsPerFloor: 3,
    nameFormat: "P{floor}0{index}",
    area: "22",
    maxOccupants: 2,
    roomTypeIndex: 0,
    serviceIndices: [0, 1, 2], // default apply initial services
  });

  // ─── HELPERS & TOUCHED DETECTION ─────────────────────────────────────────────
  const isDirty = useMemo(() => {
    return (
      info.name.trim() !== "" ||
      info.street.trim() !== "" ||
      info.province.trim() !== "" ||
      info.houseNumber.trim() !== "" ||
      info.district.trim() !== "" ||
      info.ward.trim() !== "" ||
      step > 1
    );
  }, [info, step]);

  const updateInfo = (field: keyof typeof info, value: string) => {
    setInfo((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-sync floorCount in Step 3 if totalFloor changes
      if (field === "totalFloor") {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setRoomsConfig((rc) => ({ ...rc, floorCount: parsed }));
        }
      }
      return next;
    });
  };

  // ─── STEP 1 VALIDATION ───────────────────────────────────────────────────────
  const isStep1Valid = useMemo(() => {
    return Boolean(
      info.name.trim() &&
      info.houseNumber.trim() &&
      info.street.trim() &&
      info.ward.trim() &&
      info.district.trim() &&
      info.province.trim() &&
      info.country.trim() &&
      info.builtAt
    );
  }, [info]);

  // ─── STEP 2 OPERATIONS & VALIDATION ──────────────────────────────────────────
  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        id: createId(),
        name: "",
        unit: "tháng",
        price: "0",
        isMetered: false,
        autoApplied: true,
      },
    ]);
  };

  const updateService = (
    id: string,
    field: keyof SetupServicePayload,
    value: string | boolean
  ) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const addRoomType = () => {
    setRoomTypes((prev) => [
      ...prev,
      {
        id: createId(),
        name: "",
        description: "",
      },
    ]);
  };

  const updateRoomType = (
    id: string,
    field: keyof SetupRoomTypePayload,
    value: string
  ) => {
    setRoomTypes((prev) =>
      prev.map((rt) => (rt.id === id ? { ...rt, [field]: value } : rt))
    );
  };

  const removeRoomType = (id: string) => {
    setRoomTypes((prev) => prev.filter((rt) => rt.id !== id));
  };

  const isStep2Valid = useMemo(() => {
    // Must have at least 1 room type with a valid name
    const validRoomTypes = roomTypes.filter((rt) => rt.name.trim().length > 0);
    if (validRoomTypes.length === 0) return false;

    // Any non-empty service must have name, unit, and valid price
    const hasInvalidService = services.some((s) => {
      if (!s.name.trim() && !s.price.trim()) return false;
      const validPrice = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(s.price.trim());
      return !s.name.trim() || !s.unit.trim() || !validPrice;
    });

    return !hasInvalidService;
  }, [roomTypes, services]);

  // ─── STEP 3 PREVIEW & QUOTA CALCULATION ──────────────────────────────────────
  const totalRoomsToCreate = useMemo(() => {
    const floors = Math.max(1, roomsConfig.floorCount);
    const perFloor = Math.max(1, roomsConfig.roomsPerFloor);
    return floors * perFloor;
  }, [roomsConfig.floorCount, roomsConfig.roomsPerFloor]);

  const isQuotaExceeded = totalRoomsToCreate > MAX_FREE_TIER_ROOMS;

  const generatedRoomsPreview = useMemo(() => {
    const list: Array<{ floor: number; roomNumbers: string[] }> = [];
    const floors = Math.min(Math.max(1, roomsConfig.floorCount), 30);
    const perFloor = Math.min(Math.max(1, roomsConfig.roomsPerFloor), 30);

    for (let f = 1; f <= floors; f++) {
      const roomNumbers: string[] = [];
      for (let i = 1; i <= perFloor; i++) {
        const num = roomsConfig.nameFormat
          .replace(/\{floor\}/g, String(f))
          .replace(/\{index\}/g, String(i));
        roomNumbers.push(num);
      }
      list.push({ floor: f, roomNumbers });
    }
    return list;
  }, [roomsConfig.floorCount, roomsConfig.roomsPerFloor, roomsConfig.nameFormat]);

  const toggleServiceIndex = (index: number) => {
    setRoomsConfig((prev) => {
      const current = prev.serviceIndices;
      if (current.includes(index)) {
        return { ...prev, serviceIndices: current.filter((i) => i !== index) };
      } else {
        return { ...prev, serviceIndices: [...current, index] };
      }
    });
  };

  // ─── SUBMISSION (ATOMIC UC-L-01) ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setErrorMessage(null);

    if (isQuotaExceeded) {
      setErrorMessage(
        `Số phòng (${totalRoomsToCreate}) vượt quá giới hạn gói Miễn phí (${MAX_FREE_TIER_ROOMS} phòng). Vui lòng giảm số tầng hoặc số phòng.`
      );
      return;
    }

    const cleanedRoomTypes = roomTypes
      .filter((rt) => rt.name.trim().length > 0)
      .map((rt) => ({
        name: rt.name.trim(),
        description: rt.description?.trim() || undefined,
      }));

    if (cleanedRoomTypes.length === 0) {
      setErrorMessage("Vui lòng nhập ít nhất một loại phòng hợp lệ.");
      setStep(2);
      return;
    }

    const cleanedServices = services
      .filter((s) => s.name.trim().length > 0)
      .map((s) => ({
        name: s.name.trim(),
        price: s.price.trim() || "0",
        unit: s.unit.trim(),
        isMetered: Boolean(s.isMetered),
        autoApplied: Boolean(s.autoApplied),
      }));

    const safeRoomTypeIndex = Math.min(
      Math.max(0, roomsConfig.roomTypeIndex),
      cleanedRoomTypes.length - 1
    );

    const safeServiceIndices = roomsConfig.serviceIndices.filter(
      (idx) => idx >= 0 && idx < cleanedServices.length
    );

    const payload: SetupBoardingHousePayload = {
      name: info.name.trim(),
      description: info.description.trim() || undefined,
      houseNumber: info.houseNumber.trim(),
      street: info.street.trim(),
      ward: info.ward.trim(),
      district: info.district.trim(),
      province: info.province.trim(),
      city: info.city.trim() || undefined,
      country: info.country.trim() || "Việt Nam",
      totalFloor: info.totalFloor ? parseInt(info.totalFloor, 10) : undefined,
      builtAt: info.builtAt,
      thumbnail: info.thumbnail.trim() || undefined,
      services: cleanedServices,
      roomTypes: cleanedRoomTypes,
      rooms: {
        floorCount: roomsConfig.floorCount,
        roomsPerFloor: roomsConfig.roomsPerFloor,
        nameFormat: roomsConfig.nameFormat.trim(),
        area: roomsConfig.area.trim() || undefined,
        maxOccupants: roomsConfig.maxOccupants || undefined,
        roomTypeIndex: safeRoomTypeIndex,
        serviceIndices: safeServiceIndices,
      },
    };

    setIsSubmitting(true);
    try {
      const result = await setupBoardingHouse(payload);
      const newHouse = result.boardingHouse;

      // Update Auth context with newly created property and promote role
      if (newHouse?.id) {
        const fullAddress = [
          newHouse.houseNumber,
          newHouse.street,
          newHouse.ward,
          newHouse.district,
          newHouse.province,
        ]
          .filter(Boolean)
          .join(", ");

        upgradeToLandlord({
          houseName: newHouse.name,
          houseAddress: fullAddress,
        });

        await refreshBuildings();
        selectBuilding(newHouse.id);
      }

      // Granted dashboard access upon successful creation -> navigate to landlord overview
      router.push("/landlord");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo nhà trọ.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      if (buildings.length > 0) {
        router.push("/landlord");
      } else {
        router.push("/");
      }
    }
  };

  const confirmDiscardAndExit = () => {
    setShowCancelModal(false);
    if (buildings.length > 0) {
      router.push("/landlord");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 pb-20 px-4 sm:px-6">
      {/* ─── HEADER & STEPPER ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-bold border border-[#2AC1BC]/20">
              <Sparkles className="w-3.5 h-3.5" /> Quy trình khởi tạo 3 bước (UC-L-01)
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
              Thiết lập nhà trọ & Tạo phòng hàng loạt
            </h1>
            <p className="mt-1 text-sm text-zinc-500 font-medium">
              Chỉ mất 2 phút để hoàn tất hồ sơ pháp lý, bảng dịch vụ và cấu hình sơ đồ phòng ban đầu.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="self-start sm:self-auto text-xs font-bold text-zinc-400 hover:text-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            Hủy bỏ
          </button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
          <StepperItem
            stepNumber={1}
            currentStep={step}
            title="Thông tin chung"
            desc="Địa chỉ & Tòa nhà"
            icon={<Building2 className="w-4 h-4" />}
            onClick={() => step > 1 && setStep(1)}
          />
          <StepperItem
            stepNumber={2}
            currentStep={step}
            title="Dịch vụ & Loại phòng"
            desc="Biểu giá & Tiện ích"
            icon={<Layers className="w-4 h-4" />}
            onClick={() => {
              if (step > 2 || isStep1Valid) setStep(2);
            }}
          />
          <StepperItem
            stepNumber={3}
            currentStep={step}
            title="Tạo phòng hàng loạt"
            desc="Sơ đồ & Preview"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => {
              if (isStep1Valid && isStep2Valid) setStep(3);
            }}
          />
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700 flex items-start gap-3 shadow-xs animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-red-900">Không thể hoàn tất tạo nhà trọ</p>
            <p className="text-red-700 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* ─── STEP 1: GENERAL PROPERTY INFORMATION ────────────────────────────── */}
      {step === 1 && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900">1. Thông tin cơ sở nhà trọ</h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Tên hiển thị và địa chỉ chính xác giúp quản lý hóa đơn và hợp đồng thuê.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Field label="Tên nhà trọ / Tòa nhà" required hint="Tên sẽ hiển thị trên thanh chọn nhà trọ">
                  <input
                    type="text"
                    required
                    value={info.name}
                    onChange={(e) => updateInfo("name", e.target.value)}
                    placeholder="Ví dụ: KTX Ánh Dương 1, Tòa nhà Bình An..."
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                  />
                </Field>
              </div>

              <Field label="Số nhà" required>
                <input
                  type="text"
                  required
                  value={info.houseNumber}
                  onChange={(e) => updateInfo("houseNumber", e.target.value)}
                  placeholder="Ví dụ: 12/4, 45B..."
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label="Tên đường / Phố" required>
                <input
                  type="text"
                  required
                  value={info.street}
                  onChange={(e) => updateInfo("street", e.target.value)}
                  placeholder="Ví dụ: Võ Văn Ngân, Lê Văn Việt..."
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label="Phường / Xã" required>
                <input
                  type="text"
                  required
                  value={info.ward}
                  onChange={(e) => updateInfo("ward", e.target.value)}
                  placeholder="Ví dụ: Phường Linh Trung"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label="Quận / Huyện" required>
                <input
                  type="text"
                  required
                  value={info.district}
                  onChange={(e) => updateInfo("district", e.target.value)}
                  placeholder="Ví dụ: TP. Thủ Đức, Quận 9..."
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label="Tỉnh / Thành phố" required>
                <input
                  type="text"
                  required
                  value={info.province}
                  onChange={(e) => updateInfo("province", e.target.value)}
                  placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội..."
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label="Quốc gia" required>
                <input
                  type="text"
                  required
                  value={info.country}
                  onChange={(e) => updateInfo("country", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label="Tổng số tầng của tòa nhà" hint="Dùng để tự động điền cấu hình tạo phòng">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={info.totalFloor}
                  onChange={(e) => updateInfo("totalFloor", e.target.value)}
                  placeholder="Ví dụ: 3"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label="Năm / Ngày hoàn thành xây dựng" required>
                <input
                  type="date"
                  required
                  value={info.builtAt}
                  onChange={(e) => updateInfo("builtAt", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Ảnh đại diện (URL Cloudinary hoặc hình ảnh)" hint="Tùy chọn tải ảnh nhà trọ">
                  <input
                    type="url"
                    value={info.thumbnail}
                    onChange={(e) => updateInfo("thumbnail", e.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="Mô tả tóm tắt tòa nhà" hint="Tiện ích xung quanh, nội quy cơ bản...">
                  <textarea
                    rows={3}
                    value={info.description}
                    onChange={(e) => updateInfo("description", e.target.value)}
                    placeholder="Gần các trường đại học, khu vực an ninh cao, có bảo vệ 24/7..."
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15 resize-none"
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2AC1BC] text-white text-sm font-black shadow-sm hover:bg-[#25aca7] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Tiếp tục sang bước 2 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ─── STEP 2: SERVICES & ROOM TYPES ──────────────────────────────────── */}
      {step === 2 && (
        <section className="space-y-6 animate-in fade-in duration-300">
          {/* Services Section */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900">2a. Dịch vụ ban đầu</h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Các dịch vụ dùng để tính tiền điện, nước, dịch vụ kèm theo hàng tháng.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addService}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm dịch vụ
              </button>
            </div>

            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-zinc-200 text-center text-xs text-zinc-400">
                  Chưa có dịch vụ nào. Bấm &quot;Thêm dịch vụ&quot; để thiết lập biểu phí.
                </div>
              ) : (
                services.map((service, index) => (
                  <div
                    key={service.id}
                    className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                          Tên dịch vụ #{index + 1}
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => updateService(service.id, "name", e.target.value)}
                          placeholder="Ví dụ: Điện, Nước, WiFi..."
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                          Đơn giá (VNĐ)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={service.price}
                          onChange={(e) => updateService(service.id, "price", e.target.value)}
                          placeholder="3500"
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                          Đơn vị
                        </label>
                        <input
                          type="text"
                          value={service.unit}
                          onChange={(e) => updateService(service.id, "unit", e.target.value)}
                          placeholder="kWh, m³..."
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-4 py-2">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={service.isMetered}
                            onChange={(e) =>
                              updateService(service.id, "isMetered", e.target.checked)
                            }
                            className="rounded border-zinc-300 text-[#2AC1BC] focus:ring-[#2AC1BC] h-3.5 w-3.5"
                          />
                          Đồng hồ
                        </label>

                        <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={service.autoApplied}
                            onChange={(e) =>
                              updateService(service.id, "autoApplied", e.target.checked)
                            }
                            className="rounded border-zinc-300 text-[#2AC1BC] focus:ring-[#2AC1BC] h-3.5 w-3.5"
                          />
                          Tự áp dụng
                        </label>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeService(service.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa dịch vụ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Room Types Section */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-zinc-900">2b. Loại phòng</h2>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200">
                      Bắt buộc ≥ 1 loại
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">
                    Phân loại phòng (Studio, Gác lửng, 1PN...) để gán cho các phòng tạo ở Bước 3.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addRoomType}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm loại phòng
              </button>
            </div>

            <div className="space-y-3">
              {roomTypes.map((rt, index) => (
                <div
                  key={rt.id}
                  className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5">
                      <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                        Tên loại phòng #{index + 1} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={rt.name}
                        onChange={(e) => updateRoomType(rt.id, "name", e.target.value)}
                        placeholder="Ví dụ: Studio ban công, Phòng đơn..."
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                        Mô tả đặc điểm tiện nghi
                      </label>
                      <input
                        type="text"
                        value={rt.description ?? ""}
                        onChange={(e) => updateRoomType(rt.id, "description", e.target.value)}
                        placeholder="Ví dụ: Có máy lạnh, tủ lạnh, giường nệm..."
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      {roomTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoomType(rt.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa loại phòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại Bước 1
            </button>
            <button
              type="button"
              disabled={!isStep2Valid}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2AC1BC] text-white text-sm font-black shadow-sm hover:bg-[#25aca7] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Tiếp tục sang bước 3 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ─── STEP 3: BULK GENERATE ROOMS & PREVIEW ─────────────────────────── */}
      {step === 3 && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Generation Settings Form */}
            <div className="lg:col-span-7 rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900">3. Thiết lập tạo phòng hàng loạt</h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Hệ thống tự động sinh số phòng và gán loại phòng, dịch vụ đi kèm.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Số tầng tạo phòng" required>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={roomsConfig.floorCount}
                    onChange={(e) =>
                      setRoomsConfig((prev) => ({
                        ...prev,
                        floorCount: Math.max(1, parseInt(e.target.value, 10) || 1),
                      }))
                    }
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </Field>

                <Field label="Số phòng mỗi tầng" required>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={roomsConfig.roomsPerFloor}
                    onChange={(e) =>
                      setRoomsConfig((prev) => ({
                        ...prev,
                        roomsPerFloor: Math.max(1, parseInt(e.target.value, 10) || 1),
                      }))
                    }
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field
                    label="Mẫu đánh số phòng (Template)"
                    required
                    hint="{floor} là số tầng, {index} là số thứ tự phòng trong tầng"
                  >
                    <input
                      type="text"
                      required
                      value={roomsConfig.nameFormat}
                      onChange={(e) =>
                        setRoomsConfig((prev) => ({
                          ...prev,
                          nameFormat: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {NAME_FORMAT_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() =>
                            setRoomsConfig((prev) => ({
                              ...prev,
                              nameFormat: preset.value,
                            }))
                          }
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                            roomsConfig.nameFormat === preset.value
                              ? "bg-[#2AC1BC]/10 border-[#2AC1BC] text-[#2AC1BC] font-bold"
                              : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <Field label="Diện tích trung bình (m²)">
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={roomsConfig.area}
                    onChange={(e) =>
                      setRoomsConfig((prev) => ({
                        ...prev,
                        area: e.target.value,
                      }))
                    }
                    placeholder="25.0"
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </Field>

                <Field label="Sức chứa tối đa (người)">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={roomsConfig.maxOccupants}
                    onChange={(e) =>
                      setRoomsConfig((prev) => ({
                        ...prev,
                        maxOccupants: Math.max(1, parseInt(e.target.value, 10) || 1),
                      }))
                    }
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Gán loại phòng mặc định" required>
                    <select
                      value={roomsConfig.roomTypeIndex}
                      onChange={(e) =>
                        setRoomsConfig((prev) => ({
                          ...prev,
                          roomTypeIndex: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                    >
                      {roomTypes
                        .filter((rt) => rt.name.trim())
                        .map((rt, idx) => (
                          <option key={rt.id} value={idx}>
                            {rt.name} {rt.description ? `(${rt.description})` : ""}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-700 block mb-2">
                    Dịch vụ tự động gán vào từng phòng:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {services
                      .filter((s) => s.name.trim())
                      .map((service, idx) => {
                        const isSelected = roomsConfig.serviceIndices.includes(idx);
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => toggleServiceIndex(idx)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              isSelected
                                ? "bg-[#2AC1BC]/10 border-[#2AC1BC] text-[#2AC1BC]"
                                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            }`}
                          >
                            <span
                              className={`w-3 h-3 rounded-full flex items-center justify-center border text-[9px] ${
                                isSelected
                                  ? "bg-[#2AC1BC] text-white border-transparent"
                                  : "border-zinc-300 bg-white"
                              }`}
                            >
                              {isSelected && "✓"}
                            </span>
                            {service.name} ({service.price}₫/{service.unit})
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Room Preview Panel & Quota Indicator */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2AC1BC]" />
                    <h3 className="text-sm font-black text-zinc-900">Xem trước sơ đồ phòng</h3>
                  </div>
                  <span className="text-xs font-extrabold text-[#2AC1BC] bg-[#2AC1BC]/10 px-2.5 py-0.5 rounded-full">
                    {totalRoomsToCreate} phòng
                  </span>
                </div>

                {/* Quota Indicator Banner */}
                {isQuotaExceeded ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Vượt quá giới hạn gói Free ({totalRoomsToCreate}/{MAX_FREE_TIER_ROOMS} phòng)
                    </div>
                    <p className="text-amber-800 leading-relaxed font-medium">
                      Gói tài khoản Miễn phí chỉ cho phép quản lý tối đa {MAX_FREE_TIER_ROOMS} phòng.
                      Vui lòng giảm số tầng hoặc số phòng mỗi tầng để có thể khởi tạo.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Hạn mức gói Free:
                    </span>
                    <span className="font-extrabold">
                      {totalRoomsToCreate} / {MAX_FREE_TIER_ROOMS} phòng
                    </span>
                  </div>
                )}

                {/* Live Preview Room Grid by Floor */}
                <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
                  {generatedRoomsPreview.map((group) => (
                    <div
                      key={group.floor}
                      className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-zinc-600 uppercase tracking-wider">
                          Tầng {group.floor}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold">
                          {group.roomNumbers.length} phòng
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.roomNumbers.map((roomCode) => (
                          <span
                            key={roomCode}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-800 shadow-2xs"
                          >
                            {roomCode}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-[11px] text-zinc-400 flex items-center gap-1.5 border-t border-zinc-100">
                  <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  Bạn có thể chỉnh sửa lại giá thuê, diện tích từng phòng sau khi tạo.
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 Navigation / Submit */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại Bước 2
            </button>
            <button
              type="button"
              disabled={isSubmitting || isQuotaExceeded || totalRoomsToCreate < 1}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#2AC1BC] text-white text-sm font-black shadow-md hover:bg-[#25aca7] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Đang thiết lập dữ liệu...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Hoàn thành & Khởi tạo nhà trọ
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* ─── CUSTOM POPUP CONFIRMATION MODAL (RULE 10) ───────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-100 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-zinc-900">Xác nhận đóng form</h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Bạn đã nhập một số dữ liệu cho nhà trọ này. Nếu thoát bây giờ, các thông tin đã điền
                sẽ không được lưu lại.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={confirmDiscardAndExit}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-xs"
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

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function StepperItem({
  stepNumber,
  currentStep,
  title,
  desc,
  icon,
  onClick,
}: {
  stepNumber: WizardStep;
  currentStep: WizardStep;
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const isCompleted = currentStep > stepNumber;
  const isActive = currentStep === stepNumber;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
        isActive
          ? "border-[#2AC1BC] bg-[#2AC1BC]/5 shadow-xs"
          : isCompleted
          ? "border-zinc-200 bg-white hover:bg-zinc-50"
          : "border-zinc-100 bg-zinc-50/50 opacity-60"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
          isCompleted
            ? "bg-emerald-600 text-white"
            : isActive
            ? "bg-[#2AC1BC] text-white shadow-sm"
            : "bg-zinc-200 text-zinc-600"
        }`}
      >
        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : icon}
      </div>
      <div className="min-w-0 hidden sm:block">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase text-zinc-400">
            Bước {stepNumber}
          </span>
        </div>
        <p
          className={`text-xs font-black truncate ${
            isActive ? "text-zinc-900" : "text-zinc-600"
          }`}
        >
          {title}
        </p>
        <p className="text-[10px] text-zinc-400 truncate font-medium">{desc}</p>
      </div>
    </button>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-700">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {hint && <span className="text-[11px] text-zinc-400 font-medium">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
