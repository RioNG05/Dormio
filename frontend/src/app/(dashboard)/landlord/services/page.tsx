"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wrench, Plus, Zap, Droplets, Wifi, Trash2, ShieldCheck,
  CarFront, Search, Edit3, Info,
  UploadCloud, FileSpreadsheet, AlertTriangle, AlertCircle,
  CheckCircle2, Flame, Tv, Waves, Box,
  LayoutGrid, List, Home, X, Clock, MapPin, RefreshCw, Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import {
  serviceService,
  ServiceItem,
  ServicesSummary,
  ServiceAssignedRoom
} from "@/services/service.service";

export default function ServicesPage() {
  const { activeBuilding } = useAuth();
  const t = useTranslations("landlord");
  const { locale } = useLanguage();
  const isEn = locale === "en";

  // Data States
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [summary, setSummary] = useState<ServicesSummary>({
    totalServices: 0,
    meteredCount: 0,
    roomFixedCount: 0,
    otherCount: 0,
    activeCount: 0,
    inactiveCount: 0,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "" | "metered" | "room" | "person" | "other"
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination States (Rule #9: Grid default 6, Table 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Add / Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState<number | string>(0);
  const [formUnit, setFormUnit] = useState("kWh");
  const [formIsMetered, setFormIsMetered] = useState(false);
  const [formAutoApplied, setFormAutoApplied] = useState(true);
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");

  // Rooms Applied Modal State
  const [roomsModalService, setRoomsModalService] = useState<ServiceItem | null>(null);
  const [serviceRooms, setServiceRooms] = useState<ServiceAssignedRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert & Confirm Modals
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "warning" | "error" | "success" | "info";
  }>({
    isOpen: false,
    title: t("landlordServicesAlertDefaultTitle"),
    message: "",
    type: "info",
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const showAlert = (
    message: string,
    type: "warning" | "error" | "success" | "info" = "info",
    title: string = t("landlordServicesAlertDefaultTitle"),
  ) => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  // Helper to determine service visual representation
  const getServiceVisuals = (name: string, isMetered: boolean, unit: string) => {
    const lowerName = name.toLowerCase();
    const lowerUnit = unit.toLowerCase();

    if (lowerName.includes("điện") || lowerName.includes("dien") || lowerName.includes("elec")) {
      return {
        iconName: "Zap",
        color: "text-amber-500",
        bg: "bg-amber-50 border-amber-200/80",
        typeLabel: t("landlordServicesTypeMetered"),
      };
    }
    if (lowerName.includes("nước") || lowerName.includes("nuoc") || lowerName.includes("water")) {
      return {
        iconName: "Droplets",
        color: "text-blue-500",
        bg: "bg-blue-50 border-blue-200/80",
        typeLabel: t("landlordServicesTypeMetered"),
      };
    }
    if (lowerName.includes("wifi") || lowerName.includes("mạng") || lowerName.includes("internet")) {
      return {
        iconName: "Wifi",
        color: "text-indigo-500",
        bg: "bg-indigo-50 border-indigo-200/80",
        typeLabel: t("landlordServicesTypeFixedRoom"),
      };
    }
    if (lowerName.includes("rác") || lowerName.includes("vệ sinh") || lowerName.includes("rac") || lowerName.includes("clean") || lowerName.includes("trash")) {
      return {
        iconName: "Trash2",
        color: "text-emerald-500",
        bg: "bg-emerald-50 border-emerald-200/80",
        typeLabel: (lowerUnit.includes("người") || lowerUnit.includes("person")) ? t("landlordServicesTypeFixedPerson") : t("landlordServicesTypeFixedRoom"),
      };
    }
    if (lowerName.includes("xe") || lowerName.includes("gửi xe") || lowerName.includes("bãi xe") || lowerName.includes("park") || lowerName.includes("vehicle")) {
      return {
        iconName: "CarFront",
        color: "text-purple-500",
        bg: "bg-purple-50 border-purple-200/80",
        typeLabel: t("landlordServicesTypeQuantity"),
      };
    }
    if (lowerName.includes("an ninh") || lowerName.includes("thang máy") || lowerName.includes("bảo vệ") || lowerName.includes("security") || lowerName.includes("elevator")) {
      return {
        iconName: "ShieldCheck",
        color: "text-rose-500",
        bg: "bg-rose-50 border-rose-200/80",
        typeLabel: t("landlordServicesTypeFixedRoom"),
      };
    }
    if (lowerName.includes("gas") || lowerName.includes("bếp")) {
      return {
        iconName: "Flame",
        color: "text-orange-500",
        bg: "bg-orange-50 border-orange-200/80",
        typeLabel: isMetered ? t("landlordServicesTypeMetered") : t("landlordServicesTypeFixedRoom"),
      };
    }

    // Generic fallback
    let typeLabel = t("landlordServicesTypeFixed");
    if (isMetered) typeLabel = t("landlordServicesTypeMetered");
    else if (lowerUnit.includes("phòng") || lowerUnit.includes("phong") || lowerUnit.includes("room")) typeLabel = t("landlordServicesTypeFixedRoom");
    else if (lowerUnit.includes("người") || lowerUnit.includes("nguoi") || lowerUnit.includes("person")) typeLabel = t("landlordServicesTypeFixedPerson");
    else if (lowerUnit.includes("xe") || lowerUnit.includes("chiếc") || lowerUnit.includes("vehicle")) typeLabel = t("landlordServicesTypeQuantity");

    return {
      iconName: "Wrench",
      color: "text-[#2AC1BC]",
      bg: "bg-teal-50 border-teal-200/80",
      typeLabel,
    };
  };

  const renderIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case "Zap": return <Zap className={className} />;
      case "Droplets": return <Droplets className={className} />;
      case "Wifi": return <Wifi className={className} />;
      case "Trash2": return <Trash2 className={className} />;
      case "CarFront": return <CarFront className={className} />;
      case "ShieldCheck": return <ShieldCheck className={className} />;
      case "Flame": return <Flame className={className} />;
      case "Tv": return <Tv className={className} />;
      case "Waves": return <Waves className={className} />;
      default: return <Wrench className={className} />;
    }
  };

  // Fetch Services from Backend
  const fetchServices = useCallback(async () => {
    if (!activeBuilding?.id) return;
    setIsLoading(true);
    try {
      let isMeteredParam: boolean | undefined = undefined;
      if (typeFilter === "metered") isMeteredParam = true;
      if (typeFilter === "room" || typeFilter === "person" || typeFilter === "other") isMeteredParam = false;

      const response = await serviceService.getServices(activeBuilding.id, {
        search: searchQuery.trim() || undefined,
        isMetered: isMeteredParam,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (response && response.success) {
        setServices(response.data || []);
        setSummary(response.summary);
        setTotalItems(response.meta.total);
      }
    } catch (err: any) {
      showAlert(err?.message || "Không thể tải danh sách dịch vụ", "error", "Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, [activeBuilding?.id, searchQuery, typeFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Fetch Rooms for Assigned Modal
  const handleOpenRoomsModal = async (service: ServiceItem) => {
    if (!activeBuilding?.id) return;
    setRoomsModalService(service);
    setIsLoadingRooms(true);
    try {
      const res = await serviceService.getServiceRooms(activeBuilding.id, service.id);
      if (res && res.success && res.data) {
        setServiceRooms(res.data.rooms || []);
      }
    } catch (err: any) {
      showAlert(err?.message || "Không thể tải danh sách phòng áp dụng", "error");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Add Modal Open
  const handleOpenAddModal = () => {
    setSelectedService(null);
    setFormName("");
    setFormPrice(0);
    setFormUnit("kWh");
    setFormIsMetered(true);
    setFormAutoApplied(true);
    setFormStatus("active");
    setIsDirty(false);
    setIsModalOpen(true);
  };

  // Edit Modal Open
  const handleOpenEditModal = (srv: ServiceItem) => {
    setSelectedService(srv);
    setFormName(srv.name);
    setFormPrice(srv.numericPrice);
    setFormUnit(srv.unit);
    setFormIsMetered(srv.isMetered);
    setFormAutoApplied(srv.autoApplied);
    setFormStatus(srv.status);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  // Modal Close with Rule #10 Confirm Modal on Dirty Draft
  const handleCloseModal = () => {
    if (isDirty) {
      setConfirmModal({
        isOpen: true,
        title: t("landlordServicesConfirmCloseTitle"),
        message: t("landlordServicesConfirmCloseDesc"),
        confirmText: t("landlordServicesConfirmCloseDiscard"),
        cancelText: t("landlordServicesConfirmCloseKeep"),
        onConfirm: () => {
          setIsModalOpen(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setIsDirty(false);
        },
      });
    } else {
      setIsModalOpen(false);
    }
  };

  // Save (Create or Update) Service
  const handleSaveService = async () => {
    if (!formName.trim()) {
      showAlert(t("landlordServicesAlertMissingName"), "warning");
      return;
    }

    const priceNum = typeof formPrice === "number" ? formPrice : parseInt(String(formPrice).replace(/\D/g, ""), 10) || 0;
    if (priceNum < 0) {
      showAlert(t("landlordServicesAlertInvalidPrice"), "warning");
      return;
    }

    if (!formUnit.trim()) {
      showAlert(t("landlordServicesAlertMissingUnit"), "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!activeBuilding?.id) return;
      if (selectedService) {
        await serviceService.updateService(activeBuilding.id, selectedService.id, {
          name: formName.trim(),
          price: priceNum,
          unit: formUnit.trim(),
          isMetered: formIsMetered,
          autoApplied: formAutoApplied,
          status: formStatus,
        });
        showAlert(t("landlordServicesAlertUpdateSuccess"), "success");
      } else {
        await serviceService.createService(activeBuilding.id, {
          name: formName.trim(),
          price: priceNum,
          unit: formUnit.trim(),
          isMetered: formIsMetered,
          autoApplied: formAutoApplied,
          status: formStatus,
        });
        showAlert(t("landlordServicesAlertUpdateSuccess"), "success");
      }

      setIsModalOpen(false);
      setIsDirty(false);
      fetchServices();
    } catch (err: any) {
      showAlert(err?.message || "Thao tác thất bại", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Service Active Status
  const handleToggleActive = async (srv: ServiceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeBuilding?.id) return;
    const nextStatus = srv.status === "active" ? "inactive" : "active";

    try {
      await serviceService.updateService(activeBuilding.id, srv.id, { status: nextStatus });
      const statusText = nextStatus === "active"
        ? t("landlordServicesAlertStatusActive")
        : t("landlordServicesAlertStatusInactive");
      showAlert(
        t("landlordServicesAlertToggleStatus", { status: statusText, name: srv.name }),
        nextStatus === "active" ? "success" : "info",
      );
      // Optimistic update local state
      setServices((prev) =>
        prev.map((s) => (s.id === srv.id ? { ...s, status: nextStatus } : s)),
      );
      setSummary((prev) => ({
        ...prev,
        activeCount: nextStatus === "active" ? prev.activeCount + 1 : prev.activeCount - 1,
        inactiveCount: nextStatus === "inactive" ? prev.inactiveCount + 1 : prev.inactiveCount - 1,
      }));
    } catch (err: any) {
      showAlert(err?.message || "Không thể cập nhật trạng thái", "error");
      fetchServices();
    }
  };

  // Delete Service
  const handleDeleteService = async () => {
    if (!deleteTarget || !activeBuilding?.id) return;
    setIsDeleting(true);
    try {
      await serviceService.deleteService(activeBuilding.id, deleteTarget.id);
      showAlert(t("landlordServicesAlertDeleteSuccess", { name: deleteTarget.name }), "success");
      setDeleteTarget(null);
      fetchServices();
    } catch (err: any) {
      showAlert(err?.message || "Không thể xóa dịch vụ này", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculation for pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            {t("landlordServicesTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 font-medium">
            {t("landlordServicesSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => showAlert(t("landlordServicesAlertImportDeveloping"), "info")}
            className="cursor-pointer px-3 sm:px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" /> Import
          </button>
          <button
            onClick={() => showAlert(t("landlordServicesAlertExportSuccess"), "success")}
            className="cursor-pointer px-3 sm:px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export
          </button>
          <button
            onClick={fetchServices}
            className="cursor-pointer px-3 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-2xs flex items-center gap-1.5"
            title={t("landlordServicesRefresh")}
          >
            <RefreshCw className={`w-4 h-4 text-zinc-500 ${isLoading ? "animate-spin" : ""}`} /> {t("landlordServicesRefresh")}
          </button>
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t("landlordServicesAddNew")}
          </button>
        </div>
      </div>

      {/* DARK HERO BANNER CARD */}
      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Wrench className="w-48 sm:w-64 h-48 sm:h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="space-y-2.5 max-w-xl w-full">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                {activeBuilding?.name || t("landlordServicesBuildingFallback")}
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all w-full sm:w-auto">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                <span className="text-xs font-bold text-zinc-200 truncate sm:whitespace-normal">
                  {activeBuilding?.address || t("landlordServicesNoAddress")}
                </span>
              </div>
              {activeBuilding?.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="self-end sm:self-auto px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>{t("landlordServicesViewMap")}</span> &rarr;
                </a>
              )}
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("landlordServicesHeroSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full md:w-[135px]">
              <Wrench className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">{t("landlordServicesTotalServices")}</span>
                <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">{summary.totalServices}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full md:w-[135px]">
              <Zap className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#2AC1BC] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">{t("landlordServicesFilterMetered")}</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{summary.meteredCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full md:w-[135px]">
              <Wifi className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#FF6B35] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">{t("landlordServicesFixedRoom")}</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{summary.roomFixedCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full md:w-[135px]">
              <CarFront className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">{t("landlordServicesFixedPerson")}</span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{summary.otherCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guidance Alert Banner */}
      <div className="bg-[#2AC1BC]/5 border border-[#2AC1BC]/20 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
        <div className="bg-[#2AC1BC]/10 p-1.5 rounded-xl text-[#2AC1BC] shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs">
          <h3 className="font-extrabold text-zinc-900">{t("landlordServicesPricingRule")}</h3>
          <p className="text-zinc-600 leading-relaxed font-medium">
            {t("landlordServicesPricingRuleGuidance", { building: activeBuilding?.name || (isEn ? "the property" : "tòa nhà") })}
          </p>
        </div>
      </div>

      {/* FILTER & TOOLBAR BAR */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={t("landlordServicesSearchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
            />
          </div>

          {/* Right Toolbar: View Mode Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => {
                  setViewMode("grid");
                  setItemsPerPage(6);
                  setCurrentPage(1);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-[#2AC1BC] shadow-2xs font-extrabold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
                title={t("landlordServicesViewGrid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode("list");
                  setItemsPerPage(10);
                  setCurrentPage(1);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-[#2AC1BC] shadow-2xs font-extrabold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
                title={t("landlordServicesViewTable")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100">
          {[
            { label: t("landlordServicesFilterAll"), val: "" },
            { label: t("landlordServicesFilterMetered"), val: "metered" },
            { label: t("landlordServicesFilterFixed"), val: "room" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => {
                setTypeFilter(tab.val);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === tab.val
                  ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/20"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">{t("landlordServicesLoading")}</p>
        </div>
      )}

      {/* CONTENT DISPLAY: GRID OR LIST VIEW */}
      {!isLoading && viewMode === "grid" ? (
        /* GRID VIEW CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {services.length > 0 ? (
            services.map((service) => {
              const visual = getServiceVisuals(service.name, service.isMetered, service.unit);
              const isActive = service.status === "active";
              const formattedPrice = `${service.numericPrice.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫`;

              return (
                <div
                  key={service.id}
                  className={`bg-white border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all space-y-4 relative overflow-hidden flex flex-col justify-between ${
                    isActive ? "border-zinc-200/90" : "border-zinc-200 opacity-70 bg-zinc-50/50"
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Top Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 sm:w-12 h-11 sm:h-12 rounded-2xl flex items-center justify-center border shadow-2xs shrink-0 ${visual.bg} ${visual.color}`}>
                          {renderIcon(visual.iconName, "w-5 sm:w-6 h-5 sm:h-6")}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-black text-[#2AC1BC] bg-[#2AC1BC]/10 px-2 py-0.5 rounded-md border border-[#2AC1BC]/30">
                              {service.id.substring(0, 8).toUpperCase()}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                service.autoApplied
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}
                            >
                              {service.autoApplied ? t("landlordServicesMandatory") : t("landlordServicesOptional")}
                            </span>
                          </div>
                          <h3 className="font-black text-zinc-900 text-base sm:text-lg mt-1">{service.name}</h3>
                        </div>
                      </div>
                    </div>

                    {/* STATUS TOGGLE WITH SWITCH */}
                    <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80">
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold text-zinc-700 block">{t("landlordServicesAppliedStatus")}:</span>
                        <span className={`text-[11px] font-bold block ${isActive ? "text-emerald-600" : "text-zinc-400"}`}>
                          {isActive ? t("landlordServicesStatusOn") : t("landlordServicesStatusOff")}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleToggleActive(service, e)}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isActive ? "bg-[#2AC1BC]" : "bg-zinc-300"
                        }`}
                        title={isActive ? t("landlordServicesClickToDisable") : t("landlordServicesClickToEnable")}
                      >
                        <span className="sr-only">Toggle status</span>
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Service Specification Table */}
                    <div className="p-3.5 bg-zinc-50/80 rounded-2xl space-y-2 text-xs border border-zinc-100">
                      <div className="flex justify-between items-center text-zinc-600">
                        <span className="text-zinc-400 font-medium">{t("landlordServicesBillingTypeLabel")}</span>
                        <span className="font-bold text-zinc-900 bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                          {visual.typeLabel}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-600">
                        <span className="text-zinc-400 font-medium">{t("landlordServicesUnitLabel")}</span>
                        <span className="font-bold text-zinc-800">{service.unit}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-600 pt-1 border-t border-zinc-200/60">
                        <span className="text-zinc-400 font-medium">{t("landlordServicesDefaultPriceLabel")}</span>
                        <span className="font-black text-emerald-600 text-base sm:text-lg">{formattedPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Controls */}
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-1.5 text-xs">
                    <button
                      onClick={() => handleOpenRoomsModal(service)}
                      className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                      title={t("landlordServicesAppliedRooms")}
                    >
                      <Home className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("landlordServicesRoomsCount", { count: service.appliedRoomsCount })}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(service)}
                        className="px-3 py-1.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 text-[#2AC1BC] font-extrabold rounded-xl transition-colors flex items-center gap-1 cursor-pointer border border-[#2AC1BC]/30 text-[11px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> {t("landlordServicesEdit")}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(service)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer border border-rose-200 text-[11px]"
                        title={t("landlordServicesDeleteTooltip")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-zinc-200 border-dashed p-6 text-center space-y-2">
              <Wrench className="w-12 h-12 text-zinc-300 mb-1" />
              <p className="font-black text-zinc-900 text-base">{t("landlordServicesEmptyTitle")}</p>
              <p className="text-xs text-zinc-500">{t("landlordServicesEmptyDesc")}</p>
            </div>
          )}
        </div>
      ) : !isLoading ? (
        /* LIST VIEW TABLE */
        <div className="bg-white border border-zinc-200/80 rounded-2xl sm:rounded-3xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[900px]">
              <thead className="bg-zinc-50 text-zinc-500 uppercase font-extrabold border-b border-zinc-200 whitespace-nowrap">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[200px]">{t("landlordServicesCode")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[170px]">{t("landlordServicesType")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[100px]">{t("landlordServicesUnit")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[100px]">{t("landlordServicesPrice")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[100px]">{t("landlordServicesRule")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px]">{t("landlordServicesAppliedRooms")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[140px]">{t("landlordServicesStatus")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[120px] text-right">{t("landlordServicesActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                      {t("landlordServicesEmptyTitle")}
                    </td>
                  </tr>
                ) : (
                  services.map((service) => {
                    const visual = getServiceVisuals(service.name, service.isMetered, service.unit);
                    const isActive = service.status === "active";
                    const formattedPrice = `${service.numericPrice.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫`;

                    return (
                      <tr key={service.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${visual.bg} ${visual.color}`}>
                              {renderIcon(visual.iconName, "w-4.5 h-4.5")}
                            </div>
                            <div>
                              <span className="font-black text-zinc-900 block text-xs sm:text-sm whitespace-nowrap">{service.name}</span>
                              <span className="text-[10px] font-mono text-[#2AC1BC] font-bold block">
                                {service.id.substring(0, 8).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200 inline-block">
                            {visual.typeLabel}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-zinc-700 whitespace-nowrap">{service.unit}</td>
                        <td className="px-4 sm:px-6 py-4 font-black text-emerald-600 text-sm whitespace-nowrap">{formattedPrice}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border inline-block whitespace-nowrap ${
                              service.autoApplied
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            }`}
                          >
                            {service.autoApplied ? t("landlordServicesMandatory") : t("landlordServicesOptional")}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenRoomsModal(service)}
                            className="font-bold text-[#2AC1BC] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Home className="w-3.5 h-3.5" /> {t("landlordServicesRoomsCount", { count: service.appliedRoomsCount })}
                          </button>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleToggleActive(service, e)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isActive ? "bg-[#2AC1BC]" : "bg-zinc-300"
                              }`}
                              title={isActive ? t("landlordServicesClickToDisable") : t("landlordServicesClickToEnable")}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out ${
                                  isActive ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span className={`text-xs font-bold ${isActive ? "text-emerald-600 font-black" : "text-zinc-400"}`}>
                              {isActive ? t("landlordServicesAlertStatusActive") : t("landlordServicesAlertStatusInactive")}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(service)}
                              className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-[#2AC1BC]" /> {t("landlordServicesEdit")}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(service)}
                              className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                              title={t("landlordServicesDeleteTooltip")}
                            >
                              <Trash2 className="w-3 h-3" />
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
      ) : null}

      {/* Standardized Dormio Pagination Footer (Rule #9) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs mt-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
            <span>{t("landlordServicesPaginationShowing")}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={itemsPerPage || ""}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setItemsPerPage(isNaN(val) || val <= 0 ? 1 : Math.min(val, 100));
                setCurrentPage(1);
              }}
              className="w-12 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs"
            />
            <span>{t("landlordServicesPaginationPerPage")}</span>
          </div>

          <span className="hidden sm:inline text-zinc-300">|</span>

          <div>
            <span className="font-extrabold text-zinc-800">
              {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            -{" "}
            <span className="font-extrabold text-zinc-800">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            {t("landlordServicesPaginationTotal", { total: totalItems })}
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
                &larr; {t("landlordServicesPaginationPrev")}
              </button>
              {visiblePages.map((page) => (
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
                {t("landlordServicesPaginationNext")} &rarr;
              </button>
            </div>
          );
        })()}
      </div>

      {/* ADD / EDIT SERVICE MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col max-h-[90vh]">
            <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 text-[#FF6B35] rounded-xl">
                  <Wrench className="w-5 h-5 text-[#2AC1BC]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-zinc-900">
                    {selectedService ? t("landlordServicesModalEditTitle", { name: selectedService.name }) : t("landlordServicesModalAddTitle")}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">{t("landlordServicesModalSubtitle")}</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-zinc-700 mb-1">
                  {t("landlordServicesFormNameLabel")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("landlordServicesFormNamePlaceholder")}
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setIsDirty(true); }}
                  className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-extrabold text-zinc-700 mb-1">{t("landlordServicesFormMeasurementLabel")}</label>
                  <select
                    value={formIsMetered ? "metered" : "fixed"}
                    onChange={(e) => { setFormIsMetered(e.target.value === "metered"); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="metered">{t("landlordServicesFormOptionMetered")}</option>
                    <option value="fixed">{t("landlordServicesFormOptionFixed")}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-zinc-700 mb-1">{t("landlordServicesFormRuleLabel")}</label>
                  <select
                    value={formAutoApplied ? "mandatory" : "optional"}
                    onChange={(e) => { setFormAutoApplied(e.target.value === "mandatory"); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="mandatory">{t("landlordServicesFormOptionMandatory")}</option>
                    <option value="optional">{t("landlordServicesFormOptionOptional")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-extrabold text-zinc-700 mb-1">
                    {t("landlordServicesFormUnitLabel")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("landlordServicesFormUnitPlaceholder")}
                    value={formUnit}
                    onChange={(e) => { setFormUnit(e.target.value); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-zinc-700 mb-1">
                    {t("landlordServicesFormPriceLabel")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    placeholder={t("landlordServicesFormPricePlaceholder")}
                    value={formPrice}
                    onChange={(e) => { setFormPrice(e.target.value === "" ? "" : Number(e.target.value)); setIsDirty(true); }}
                    className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-zinc-700 mb-1">{t("landlordServicesFormStatusLabel")}</label>
                <select
                  value={formStatus}
                  onChange={(e) => { setFormStatus(e.target.value as "active" | "inactive"); setIsDirty(true); }}
                  className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="active">{t("landlordServicesFormOptionActive")}</option>
                  <option value="inactive">{t("landlordServicesFormOptionInactive")}</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                {t("landlordServicesModalCancel")}
              </button>
              <button
                type="button"
                onClick={handleSaveService}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t("landlordServicesModalSave")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPLIED ROOMS OVERVIEW MODAL */}
      {roomsModalService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setRoomsModalService(null); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-teal-50 border-teal-200 text-[#2AC1BC]">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-900">{roomsModalService.name}</h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {t("landlordServicesRoomsAppliedSubtitle", { count: serviceRooms.length })}
                  </span>
                </div>
              </div>
              <button onClick={() => setRoomsModalService(null)} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1 border border-zinc-100">
                <span className="text-zinc-500 font-bold block">
                  {t("landlordServicesPrice")}: <strong className="text-emerald-600 text-sm">{roomsModalService.numericPrice.toLocaleString(isEn ? "en-US" : "vi-VN")} ₫</strong> / {roomsModalService.unit}
                </span>
                <span className="text-zinc-400 block font-medium">
                  {t("landlordServicesType")}: {roomsModalService.isMetered ? t("landlordServicesMetered") : t("landlordServicesTypeFixed")} ({roomsModalService.autoApplied ? t("landlordServicesMandatory") : t("landlordServicesOptional")})
                </span>
              </div>

              <span className="font-extrabold text-zinc-700 block pt-2">{t("landlordServicesRoomsListTitle")}</span>

              {isLoadingRooms ? (
                <div className="py-8 flex justify-center items-center">
                  <Loader2 className="w-6 h-6 text-[#2AC1BC] animate-spin" />
                </div>
              ) : serviceRooms.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 text-xs">
                  {t("landlordServicesRoomsEmpty")}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {serviceRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-center font-bold text-zinc-800 text-xs"
                      title={`Tầng ${room.floor} - Trạng thái: ${room.status}`}
                    >
                      P.{room.roomNumber}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setRoomsModalService(null)}
              className="w-full py-2.5 bg-[#2AC1BC] text-white font-bold rounded-xl text-xs hover:bg-[#25ad87] transition-colors cursor-pointer shadow-2xs"
            >
              {t("landlordServicesRoomsClose")}
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 border border-zinc-100">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-rose-500 shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">{t("landlordServicesDeleteTitle")}</h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
                {t("landlordServicesDeleteMessage", { name: deleteTarget.name })}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 transition-all cursor-pointer shadow-2xs"
              >
                {t("landlordServicesDeleteCancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteService}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-500/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t("landlordServicesDeleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL (RULE #10) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || t("landlordServicesConfirmCloseDiscard")}
        cancelText={confirmModal.cancelText || t("landlordServicesConfirmCloseKeep")}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        btnText={t("landlordServicesAlertUnderstand")}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("landlord");
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 border border-zinc-100">
        <div className="w-14 h-14 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-zinc-900 tracking-tight">{title}</h3>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">{message}</p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 transition-all cursor-pointer shadow-2xs"
          >
            {cancelText || t("landlordServicesConfirmCloseKeep")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-500/30"
          >
            {confirmText || t("landlordServicesConfirmCloseDiscard")}
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
  btnText,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "warning" | "error" | "success" | "info";
  btnText?: string;
  onClose: () => void;
}) {
  const t = useTranslations("landlord");
  if (!isOpen) return null;

  const config = {
    warning: {
      bgColor: "bg-amber-500/10 text-amber-600 border-amber-200",
      icon: <AlertTriangle className="w-7 h-7 text-amber-500" />,
      btnColor: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
    },
    error: {
      bgColor: "bg-rose-500/10 text-rose-600 border-rose-200",
      icon: <AlertCircle className="w-7 h-7 text-rose-500" />,
      btnColor: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20",
    },
    success: {
      bgColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
      btnColor: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20",
    },
    info: {
      bgColor: "bg-orange-50 text-[#FF6B35] border-orange-200",
      icon: <Info className="w-7 h-7 text-[#FF6B35]" />,
      btnColor: "bg-[#FF6B35] hover:bg-[#e05a2b] text-white shadow-[#FF6B35]/20",
    },
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
          {btnText || t("landlordServicesAlertUnderstand")}
        </button>
      </div>
    </div>
  );
}
