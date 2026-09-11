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
import { useTranslations, useLanguage } from "@/context/LanguageContext";
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

export default function SetupWizardPage() {
  const router = useRouter();
  const { buildings, selectBuilding, refreshBuildings, upgradeToLandlord } = useAuth();
  const t = useTranslations("landlord");
  const { currentLocale } = useLanguage();

  // ─── WIZARD PROGRESS ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ─── STEP 1 STATE: GENERAL INFO ──────────────────────────────────────────────
  const [info, setInfo] = useState({
    name: "",
    description: "",
    country: t("landlordSetupCountryDefault"),
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
  const [services, setServices] = useState<ServiceItem[]>(() => [
    {
      id: createId(),
      name: t("landlordSetupDefaultServiceElec"),
      unit: "kWh",
      price: "3500",
      isMetered: true,
      autoApplied: true,
    },
    {
      id: createId(),
      name: t("landlordSetupDefaultServiceWater"),
      unit: "m³",
      price: "25000",
      isMetered: true,
      autoApplied: true,
    },
    {
      id: createId(),
      name: t("landlordSetupDefaultServiceInternet"),
      unit: t("landlordSetupDefaultUnitMonth"),
      price: "100000",
      isMetered: false,
      autoApplied: true,
    },
  ]);

  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>(() => [
    {
      id: createId(),
      name: t("landlordSetupDefaultRoomTypeName"),
      description: t("landlordSetupDefaultRoomTypeDesc"),
    },
  ]);

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

  const nameFormatPresets = useMemo(
    () => [
      { label: "P{floor}0{index} (P101, P102...)", value: "P{floor}0{index}" },
      { label: "P{floor}{index} (P11, P12...)", value: "P{floor}{index}" },
      { label: "{floor}0{index} (101, 102...)", value: "{floor}0{index}" },
      {
        label: `${t("landlordSetupPresetRoomPrefix")} {floor}0{index}`,
        value: `${t("landlordSetupPresetRoomPrefix")} {floor}0{index}`,
      },
    ],
    [t]
  );

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
        unit: t("landlordSetupDefaultUnitMonth"),
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
        t("landlordSetupErrorQuotaExceeded")
          .replace("{total}", String(totalRoomsToCreate))
          .replace("{max}", String(MAX_FREE_TIER_ROOMS))
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
      setErrorMessage(t("landlordSetupErrorNoRoomType"));
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
      country: info.country.trim() || t("landlordSetupCountryDefault"),
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
      const msg = err instanceof Error ? err.message : t("landlordSetupErrorGeneric");
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
              <Sparkles className="w-3.5 h-3.5" /> {t("landlordSetupBadge")}
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
              {t("landlordSetupTitle")}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 font-medium">
              {t("landlordSetupSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="self-start sm:self-auto text-xs font-bold text-zinc-400 hover:text-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            {t("landlordSetupCancel")}
          </button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
          <StepperItem
            stepNumber={1}
            currentStep={step}
            stepLabel={t("landlordSetupStepNumber")}
            title={t("landlordSetupStep1Title")}
            desc={t("landlordSetupStep1Desc")}
            icon={<Building2 className="w-4 h-4" />}
            onClick={() => step > 1 && setStep(1)}
          />
          <StepperItem
            stepNumber={2}
            currentStep={step}
            stepLabel={t("landlordSetupStepNumber")}
            title={t("landlordSetupStep2Title")}
            desc={t("landlordSetupStep2Desc")}
            icon={<Layers className="w-4 h-4" />}
            onClick={() => {
              if (step > 2 || isStep1Valid) setStep(2);
            }}
          />
          <StepperItem
            stepNumber={3}
            currentStep={step}
            stepLabel={t("landlordSetupStepNumber")}
            title={t("landlordSetupStep3Title")}
            desc={t("landlordSetupStep3Desc")}
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
            <p className="font-bold text-red-900">{t("landlordSetupErrorTitle")}</p>
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
                <h2 className="text-lg font-black text-zinc-900">{t("landlordSetupSection1Title")}</h2>
                <p className="text-xs text-zinc-500 font-medium">
                  {t("landlordSetupSection1Desc")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Field
                  label={t("landlordSetupNameLabel")}
                  required
                  hint={t("landlordSetupNameHint")}
                >
                  <input
                    type="text"
                    required
                    value={info.name}
                    onChange={(e) => updateInfo("name", e.target.value)}
                    placeholder={t("landlordSetupNamePlaceholder")}
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                  />
                </Field>
              </div>

              <Field label={t("landlordSetupHouseNumberLabel")} required>
                <input
                  type="text"
                  required
                  value={info.houseNumber}
                  onChange={(e) => updateInfo("houseNumber", e.target.value)}
                  placeholder={t("landlordSetupHouseNumberPlaceholder")}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label={t("landlordSetupStreetLabel")} required>
                <input
                  type="text"
                  required
                  value={info.street}
                  onChange={(e) => updateInfo("street", e.target.value)}
                  placeholder={t("landlordSetupStreetPlaceholder")}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label={t("landlordSetupWardLabel")} required>
                <input
                  type="text"
                  required
                  value={info.ward}
                  onChange={(e) => updateInfo("ward", e.target.value)}
                  placeholder={t("landlordSetupWardPlaceholder")}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label={t("landlordSetupDistrictLabel")} required>
                <input
                  type="text"
                  required
                  value={info.district}
                  onChange={(e) => updateInfo("district", e.target.value)}
                  placeholder={t("landlordSetupDistrictPlaceholder")}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label={t("landlordSetupProvinceLabel")} required>
                <input
                  type="text"
                  required
                  value={info.province}
                  onChange={(e) => updateInfo("province", e.target.value)}
                  placeholder={t("landlordSetupProvincePlaceholder")}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label={t("landlordSetupCountryLabel")} required>
                <input
                  type="text"
                  required
                  value={info.country}
                  onChange={(e) => updateInfo("country", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field
                label={t("landlordSetupTotalFloorLabel")}
                hint={t("landlordSetupTotalFloorHint")}
              >
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={info.totalFloor}
                  onChange={(e) => updateInfo("totalFloor", e.target.value)}
                  placeholder={t("landlordSetupTotalFloorPlaceholder")}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <Field label={t("landlordSetupBuiltAtLabel")} required>
                <input
                  type="date"
                  required
                  value={info.builtAt}
                  onChange={(e) => updateInfo("builtAt", e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                />
              </Field>

              <div className="md:col-span-2">
                <Field
                  label={t("landlordSetupThumbnailLabel")}
                  hint={t("landlordSetupThumbnailHint")}
                >
                  <input
                    type="url"
                    value={info.thumbnail}
                    onChange={(e) => updateInfo("thumbnail", e.target.value)}
                    placeholder={t("landlordSetupThumbnailPlaceholder")}
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/15"
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field
                  label={t("landlordSetupDescriptionLabel")}
                  hint={t("landlordSetupDescriptionHint")}
                >
                  <textarea
                    rows={3}
                    value={info.description}
                    onChange={(e) => updateInfo("description", e.target.value)}
                    placeholder={t("landlordSetupDescriptionPlaceholder")}
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
              {t("landlordSetupCancel")}
            </button>
            <button
              type="button"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2AC1BC] text-white text-sm font-black shadow-sm hover:bg-[#25aca7] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("landlordSetupNextToStep2")} <ChevronRight className="w-4 h-4" />
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
                  <h2 className="text-lg font-black text-zinc-900">{t("landlordSetupSection2aTitle")}</h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    {t("landlordSetupSection2aDesc")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addService}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> {t("landlordSetupAddService")}
              </button>
            </div>

            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-zinc-200 text-center text-xs text-zinc-400">
                  {t("landlordSetupNoServices")}
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
                          {t("landlordSetupServiceNameLabel").replace("{index}", String(index + 1))}
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => updateService(service.id, "name", e.target.value)}
                          placeholder={t("landlordSetupServiceNamePlaceholder")}
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                          {t("landlordSetupServicePriceLabel")}
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
                          {t("landlordSetupServiceUnitLabel")}
                        </label>
                        <input
                          type="text"
                          value={service.unit}
                          onChange={(e) => updateService(service.id, "unit", e.target.value)}
                          placeholder={t("landlordSetupServiceUnitPlaceholder")}
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
                          {t("landlordSetupServiceMetered")}
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
                          {t("landlordSetupServiceAutoApplied")}
                        </label>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeService(service.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t("landlordSetupDeleteService")}
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
                    <h2 className="text-lg font-black text-zinc-900">{t("landlordSetupSection2bTitle")}</h2>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200">
                      {t("landlordSetupSection2bRequired")}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">
                    {t("landlordSetupSection2bDesc")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addRoomType}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> {t("landlordSetupAddRoomType")}
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
                        {t("landlordSetupRoomTypeNameLabel").replace("{index}", String(index + 1))}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={rt.name}
                        onChange={(e) => updateRoomType(rt.id, "name", e.target.value)}
                        placeholder={t("landlordSetupRoomTypeNamePlaceholder")}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                        {t("landlordSetupRoomTypeDescLabel")}
                      </label>
                      <input
                        type="text"
                        value={rt.description ?? ""}
                        onChange={(e) => updateRoomType(rt.id, "description", e.target.value)}
                        placeholder={t("landlordSetupRoomTypeDescPlaceholder")}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      {roomTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoomType(rt.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t("landlordSetupDeleteRoomType")}
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
              <ChevronLeft className="w-4 h-4" /> {t("landlordSetupBackToStep1")}
            </button>
            <button
              type="button"
              disabled={!isStep2Valid}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2AC1BC] text-white text-sm font-black shadow-sm hover:bg-[#25aca7] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("landlordSetupNextToStep3")} <ChevronRight className="w-4 h-4" />
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
                  <h2 className="text-lg font-black text-zinc-900">{t("landlordSetupSection3Title")}</h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    {t("landlordSetupSection3Desc")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t("landlordSetupFloorCountLabel")} required>
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

                <Field label={t("landlordSetupRoomsPerFloorLabel")} required>
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
                    label={t("landlordSetupNameFormatLabel")}
                    required
                    hint={t("landlordSetupNameFormatHint")}
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
                      {nameFormatPresets.map((preset) => (
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

                <Field label={t("landlordSetupAreaLabel")}>
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

                <Field label={t("landlordSetupMaxOccupantsLabel")}>
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
                  <Field label={t("landlordSetupDefaultRoomTypeLabel")} required>
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
                    {t("landlordSetupAutoAssignServicesLabel")}
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
                    <h3 className="text-sm font-black text-zinc-900">{t("landlordSetupPreviewTitle")}</h3>
                  </div>
                  <span className="text-xs font-extrabold text-[#2AC1BC] bg-[#2AC1BC]/10 px-2.5 py-0.5 rounded-full">
                    {totalRoomsToCreate} {t("landlordSetupRoomsTotal")}
                  </span>
                </div>

                {/* Quota Indicator Banner */}
                {isQuotaExceeded ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      {t("landlordSetupQuotaExceededTitle")
                        .replace("{total}", String(totalRoomsToCreate))
                        .replace("{max}", String(MAX_FREE_TIER_ROOMS))}
                    </div>
                    <p className="text-amber-800 leading-relaxed font-medium">
                      {t("landlordSetupQuotaExceededDesc").replace("{max}", String(MAX_FREE_TIER_ROOMS))}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {t("landlordSetupQuotaLimitLabel")}
                    </span>
                    <span className="font-extrabold">
                      {t("landlordSetupQuotaRatio")
                        .replace("{total}", String(totalRoomsToCreate))
                        .replace("{max}", String(MAX_FREE_TIER_ROOMS))}
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
                          {t("landlordSetupFloorPrefix")} {group.floor}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold">
                          {t("landlordSetupPreviewFloorRooms").replace("{count}", String(group.roomNumbers.length))}
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
                  {t("landlordSetupPreviewHint")}
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
              <ChevronLeft className="w-4 h-4" /> {t("landlordSetupBackToStep2")}
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
                  {t("landlordSetupSubmitting")}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t("landlordSetupSubmit")}
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
              <h3 className="text-lg font-black text-zinc-900">{t("landlordSetupConfirmCloseTitle")}</h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                {t("landlordSetupConfirmCloseDesc")}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                {t("landlordSetupConfirmCloseContinue")}
              </button>
              <button
                type="button"
                onClick={confirmDiscardAndExit}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-xs"
              >
                {t("landlordSetupConfirmCloseDiscard")}
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
  stepLabel,
  title,
  desc,
  icon,
  onClick,
}: {
  stepNumber: WizardStep;
  currentStep: WizardStep;
  stepLabel: string;
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
            {stepLabel} {stepNumber}
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
