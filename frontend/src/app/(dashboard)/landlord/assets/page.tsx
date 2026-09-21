"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package, Search, Plus, Download, MoreHorizontal,
  CheckCircle2, AlertTriangle, Wrench, Box, Filter,
  Building2, ArrowUpDown, ChevronDown, UploadCloud, FileSpreadsheet,
  MapPin, Eye, Edit3, Trash2, Tag, ShieldCheck, Sparkles, LayoutGrid, List,
  DollarSign, Home, AlertCircle, Info, Calendar, ArrowRight, BarChart3, Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";
import {
  assetService,
  AssetItem,
  AssetCondition,
  AssetsSummary,
} from "@/services/asset.service";
import { getRooms, RoomItem } from "@/services/room.service";
import { calculateDepreciation } from "./data";

export default function AssetsPage() {
  const { activeBuilding } = useAuth();
  const router = useRouter();
  const t = useTranslations("landlord");
  const tRef = React.useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // Data & Loading States
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([]);
  const [summary, setSummary] = useState<AssetsSummary>({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    goodConditionCount: 0,
    needsRepairCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination States (Rule #9: Grid=6, Table=10 default)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);

  // Form Field States
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Điện lạnh");
  const [formRoomId, setFormRoomId] = useState<string>("");
  const [formLocation, setFormLocation] = useState("101");
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formCondition, setFormCondition] = useState<AssetCondition>("good");
  const [formValue, setFormValue] = useState("3.000.000 ₫");
  const [formPurchaseDate, setFormPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formDepreciationYears, setFormDepreciationYears] = useState(5);
  const [formNote, setFormNote] = useState("");

  // Building Code Prefix for Asset ID
  const buildingPrefix = activeBuilding?.id
    ? activeBuilding.id.slice(0, 8).toUpperCase()
    : "DORMIO";

  // Alert & Confirm Modals
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "warning" | "error" | "success" | "info";
  }>({
    isOpen: false,
    title: t("landlordAssetsAlertTitle"),
    message: "",
    type: "info",
  });


  const showAlert = (
    message: string,
    type: "warning" | "error" | "success" | "info" = "warning",
    title?: string
  ) => {
    setAlertModal({
      isOpen: true,
      title: title || tRef.current("landlordAssetsAlertTitle"),
      message,
      type,
    });
  };

  // Map condition to UI label
  const getStatusLabel = (cond: AssetCondition | string) => {
    switch (cond) {
      case "new":
        return t("landlordAssetsStatusReady");
      case "good":
        return t("landlordAssetsStatusInUse");
      case "under_repair":
        return t("landlordAssetsStatusMaintenance");
      case "damaged":
        return t("landlordAssetsStatusBroken");
      case "lost":
        return t("landlordAssetsStatusLost");
      case "disposed":
        return t("landlordAssetsStatusDisposed");
      default:
        return cond;
    }
  };

  // Map UI status filter to backend condition
  const mapUiStatusToCondition = (uiStatus: string): string => {
    if (uiStatus === "Đang sử dụng") return "good";
    if (uiStatus === "Sẵn sàng") return "new";
    if (uiStatus === "Bảo trì") return "under_repair";
    if (uiStatus === "Hỏng hóc") return "damaged";
    return uiStatus;
  };

  const getCategoryLabel = (category: string | null) => {
    if (!category) return t("landlordAssetsCatGeneral");
    if (category === "Điện lạnh") return t("landlordAssetsCatRefrigeration");
    if (category === "Nội thất") return t("landlordAssetsCatFurniture");
    if (category === "Gia dụng") return t("landlordAssetsCatAppliances");
    if (category === "Điện nước") return t("landlordAssetsCatUtilities");
    if (category === "An ninh") return t("landlordAssetsCatSecurity");
    return category;
  };

  // Fetch Rooms
  useEffect(() => {
    if (!activeBuilding?.id) return;
    getRooms(activeBuilding.id)
      .then((res) => {
        if (res && res.data) {
          setAvailableRooms(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load rooms:", err);
      });
  }, [activeBuilding?.id]);

  // Fetch Assets from Backend API
  const fetchAssets = useCallback(async () => {
    if (!activeBuilding?.id) return;
    setIsLoading(true);
    try {
      const conditionParam = statusFilter ? mapUiStatusToCondition(statusFilter) : undefined;
      const res = await assetService.getAssets(activeBuilding.id, {
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        condition: conditionParam || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (res && res.success) {
        setAssets(res.data || []);
        if (res.summary) {
          setSummary(res.summary);
        }
        if (res.pagination) {
          setTotalRecords(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        }
      }
    } catch (error: any) {
      console.error("Error loading assets:", error);
      showAlert(
        error?.message || tRef.current("landlordAssetsLoadFailed"),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeBuilding?.id, searchQuery, categoryFilter, statusFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsDirty(false);
  };

  const handleOpenAddModal = () => {
    setSelectedAsset(null);
    setFormName("");
    setFormCategory("Điện lạnh");
    setFormRoomId(availableRooms.length > 0 ? availableRooms[0].id : "");
    setFormLocation(
      availableRooms.length > 0
        ? t("landlordAssetsRoomPrefix", { room: availableRooms[0].roomNumber })
        : t("landlordAssetsLocationStorage")
    );
    setFormQuantity(1);
    setFormCondition("good");
    setFormValue("3.000.000 ₫");
    setFormPurchaseDate(new Date().toISOString().split("T")[0]);
    setFormDepreciationYears(5);
    setFormNote("");
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asset: AssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAsset(asset);
    setFormName(asset.name);
    setFormCategory(asset.category || "Điện lạnh");
    setFormRoomId(asset.roomId || "");
    setFormLocation(asset.location || asset.roomName);
    setFormQuantity(asset.quantity || 1);
    setFormCondition(asset.condition || "good");
    setFormValue(
      asset.purchasePrice
        ? `${Number(asset.purchasePrice).toLocaleString("vi-VN")} ₫`
        : "0 ₫"
    );
    setFormPurchaseDate(
      asset.purchaseDate
        ? asset.purchaseDate.split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setFormDepreciationYears(5);
    setFormNote(asset.note || "");
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleSaveAsset = async () => {
    if (!formName.trim()) {
      showAlert(t("landlordAssetsNameRequired"), "warning", t("landlordAssetsInfoMissing"));
      return;
    }

    const numVal = parseInt(formValue.replace(/\D/g, "")) || 0;
    if (!activeBuilding?.id) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        category: formCategory,
        location: formLocation.trim() || "Chung",
        roomId: formRoomId || null,
        quantity: Number(formQuantity) || 1,
        condition: formCondition,
        purchasePrice: numVal,
        purchaseDate: formPurchaseDate ? new Date(formPurchaseDate).toISOString() : undefined,
        note: formNote.trim() || undefined,
      };

      if (selectedAsset) {
        await assetService.updateAsset(activeBuilding.id, selectedAsset.id, payload);
        showAlert(t("landlordAssetsToastEditSuccess"), "success", t("landlordAssetsToastEditSuccess"));
      } else {
        await assetService.createAsset(activeBuilding.id, payload);
        showAlert(t("landlordAssetsToastAddSuccess"), "success", t("landlordAssetsToastAddSuccess"));
      }

      setIsModalOpen(false);
      setIsDirty(false);
      fetchAssets();
    } catch (err: any) {
      console.error("Save asset error:", err);
      showAlert(
        err?.message || tRef.current("landlordAssetsSaveFailed"),
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (asset: AssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeBuilding?.id) return;

    try {
      await assetService.deleteAsset(activeBuilding.id, asset.id);
      showAlert(t("landlordAssetsToastDeleteSuccess"), "success");
      fetchAssets();
    } catch (err: any) {
      showAlert(err?.message || tRef.current("landlordAssetsDeleteFailed"), "error");
    }
  };

  // Financial Valuation Calculation (Original vs Depreciated Current Value)
  const totalPurchaseValueSum = summary.totalValue || 0;
  const totalCurrentValueSum = assets.reduce((sum, a) => {
    const dep = calculateDepreciation({
      purchasePrice: a.purchasePrice,
      purchaseDate: a.purchaseDate,
      depreciationYears: 5,
    });
    return sum + dep.currentValue;
  }, 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            {t("landlordAssetsPageTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 font-medium">
            {t("landlordAssetsPageSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t("landlordAssetsAddBtn")}
          </button>
        </div>
      </div>

      {/* Building Overview Banner Card */}
      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Package className="w-48 sm:w-64 h-48 sm:h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="space-y-2.5 max-w-xl w-full">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                {activeBuilding?.name || "Dormio"}
              </h2>
              <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
                {t("landlordAssetsCodePrefix", { code: buildingPrefix })}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all w-full sm:w-auto">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                <span className="text-xs font-bold text-zinc-200 truncate sm:whitespace-normal">
                  {activeBuilding?.address || t("landlordAssetsNoAddress")}
                </span>
              </div>
              {activeBuilding?.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="self-end sm:self-auto px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>{t("landlordAssetsBtnViewMap")}</span> &rarr;
                </a>
              )}
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("landlordAssetsBannerSub")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full md:w-[135px]">
              <Package className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">
                  {t("landlordAssetsTotalAssetsShort")}
                </span>
                <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">
                  {t("landlordAssetsItemsCount", { count: summary.totalItems })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full md:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">
                  {t("landlordAssetsInUse")}
                </span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">
                  {summary.goodConditionCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full md:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">
                  {t("landlordAssetsUnderMaintenance")}
                </span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">
                  {summary.needsRepairCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full md:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">
                  {t("landlordAssetsTotalQuantity")}
                </span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">
                  {summary.totalQuantity}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs & Financial Valuation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["", "Điện lạnh", "Nội thất", "Gia dụng", "Điện nước", "An ninh"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategoryFilter(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${categoryFilter === cat
                ? "bg-[#2AC1BC] text-white shadow-xs shadow-[#2AC1BC]/20"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
                }`}
            >
              {cat === ""
                ? t("landlordAssetsFilterAllCategories")
                : cat === "Điện lạnh"
                  ? t("landlordAssetsCatRefrigeration")
                  : cat === "Nội thất"
                    ? t("landlordAssetsCatFurniture")
                    : cat === "Gia dụng"
                      ? t("landlordAssetsCatAppliances")
                      : cat === "Điện nước"
                        ? t("landlordAssetsCatUtilities")
                        : cat === "An ninh"
                          ? t("landlordAssetsCatSecurity")
                          : cat}
            </button>
          ))}
        </div>

        {/* Financial Valuation Summary */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-black text-emerald-800 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {t("landlordAssetsOriginalValueLabel")}{" "}
              {totalPurchaseValueSum.toLocaleString("vi-VN")} ₫
            </span>
          </div>

          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-black text-blue-800 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {t("landlordAssetsCurrentValueLabel")}{" "}
              {totalCurrentValueSum.toLocaleString("vi-VN")} ₫
            </span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setViewMode("grid");
                setItemsPerPage(6);
                setCurrentPage(1);
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid"
                ? "bg-white text-zinc-900 shadow-2xs"
                : "text-zinc-400 hover:text-zinc-600"
                }`}
              title={t("landlordAssetsViewGrid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                setItemsPerPage(10);
                setCurrentPage(1);
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list"
                ? "bg-white text-zinc-900 shadow-2xs"
                : "text-zinc-400 hover:text-zinc-600"
                }`}
              title={t("landlordAssetsViewTable")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-200 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between bg-zinc-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={t("landlordAssetsSearchPh")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto pl-4 pr-10 py-2 text-xs font-semibold text-zinc-900 bg-white border border-zinc-200 rounded-xl appearance-none focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 cursor-pointer transition-all min-w-[150px]"
            >
              <option value="">{t("landlordAssetsFilterAllStatuses")}</option>
              <option value="Đang sử dụng">{t("landlordAssetsStatusInUse")}</option>
              <option value="Sẵn sàng">{t("landlordAssetsStatusReady")}</option>
              <option value="Bảo trì">{t("landlordAssetsStatusMaintenance")}</option>
              <option value="Hỏng hóc">{t("landlordAssetsStatusBroken")}</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="py-20 text-center text-zinc-500 font-medium">
            <Loader2 className="w-8 h-8 mx-auto text-[#2AC1BC] animate-spin mb-3" />
            <p className="text-xs font-bold text-zinc-500">
              {t("landlordAssetsLoading")}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-500 font-medium">
                <Package className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
                {t("landlordAssetsEmptyTitle")}
              </div>
            ) : (
              assets.map((asset) => {
                const dep = calculateDepreciation({
                  purchasePrice: asset.purchasePrice,
                  purchaseDate: asset.purchaseDate,
                  depreciationYears: 5,
                });
                return (
                  <div
                    key={asset.id}
                    onClick={() => router.push(`/landlord/assets/${asset.id}`)}
                    className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-[#2AC1BC]/40 transition-all space-y-4 cursor-pointer relative group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                            {getCategoryLabel(asset.category)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/30">
                            {asset.code}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${asset.condition === "good"
                            ? "bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30"
                            : asset.condition === "new"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : asset.condition === "under_repair"
                                ? "bg-orange-50 text-[#FF6B35] border-orange-200 animate-pulse"
                                : "bg-rose-50 text-rose-600 border-rose-200"
                            }`}
                        >
                          {getStatusLabel(asset.condition)}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-zinc-900 group-hover:text-[#2AC1BC] transition-colors leading-snug">
                          {asset.name}
                        </h3>
                        {asset.quantity > 1 && (
                          <span className="text-[11px] font-bold text-zinc-400 block mt-0.5">
                            {t("landlordAssetsQuantityCount", { count: asset.quantity })}
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-zinc-50 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center text-zinc-600">
                          <span className="text-zinc-400 font-medium">{t("landlordAssetsLocation")}</span>
                          <span className="font-bold text-zinc-900 bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                            {asset.roomName || asset.location}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-600">
                          <span className="text-zinc-400 font-medium">{t("landlordAssetsOriginalValueLabel")}</span>
                          <span className="font-bold text-zinc-900">
                            {asset.purchasePrice
                              ? `${Number(asset.purchasePrice).toLocaleString("vi-VN")} ₫`
                              : "0 ₫"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-600">
                          <span className="text-zinc-400 font-medium">{t("landlordAssetsCurrentValueLabel")}</span>
                          <span className="font-black text-emerald-600">
                            {dep.currentValue.toLocaleString("vi-VN")} ₫{" "}
                            <span className="text-[10px] text-zinc-400 font-normal">
                              ({dep.remainingPercent}%)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditModal(asset, e)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("landlordAssetsBtnEditSku")}
                        </button>
                        <button
                          onClick={(e) => handleDeleteAsset(asset, e)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                          title={t("landlordAssetsBtnDelete")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-black text-[#2AC1BC] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        {t("landlordAssetsBtnDetails")} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* LIST VIEW TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[900px]">
              <thead className="bg-zinc-50 text-zinc-500 uppercase font-extrabold border-b border-zinc-200 whitespace-nowrap">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5">{t("landlordAssetsFieldSku")}</th>
                  <th className="px-4 sm:px-6 py-3.5">{t("landlordAssetsColName")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[120px]">{t("landlordAssetsColCategory")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[120px]">{t("landlordAssetsColRoom")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px]">{t("landlordAssetsColOriginalValue")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[180px]">{t("landlordAssetsColCurrentValue")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px]">{t("landlordAssetsColStatus")}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px] text-right">{t("landlordAssetsColActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                      {t("landlordAssetsEmptyTitle")}
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => {
                    const dep = calculateDepreciation({
                      purchasePrice: asset.purchasePrice,
                      purchaseDate: asset.purchaseDate,
                      depreciationYears: 5,
                    });
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => router.push(`/landlord/assets/${asset.id}`)}
                        className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="font-black text-[#2AC1BC] block font-mono">{asset.code}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-zinc-900 group-hover:text-[#2AC1BC] transition-colors whitespace-nowrap">
                          {asset.name}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-zinc-500 whitespace-nowrap">
                          {getCategoryLabel(asset.category)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-zinc-800 whitespace-nowrap">
                          {asset.roomName || asset.location}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-zinc-900 whitespace-nowrap">
                          {asset.purchasePrice
                            ? `${Number(asset.purchasePrice).toLocaleString("vi-VN")} ₫`
                            : "0 ₫"}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-black text-emerald-600 whitespace-nowrap">
                          {dep.currentValue.toLocaleString("vi-VN")} ₫
                          <span className="text-[10px] text-zinc-400 font-medium block">
                            {t("landlordAssetsRemaining")} {dep.remainingPercent}%
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-block whitespace-nowrap ${asset.condition === "good"
                              ? "bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30"
                              : asset.condition === "new"
                                ? "bg-blue-50 text-blue-600 border-blue-200"
                                : asset.condition === "under_repair"
                                  ? "bg-orange-50 text-[#FF6B35] border-orange-200 animate-pulse"
                                  : "bg-rose-50 text-rose-600 border-rose-200"
                              }`}
                          >
                            {getStatusLabel(asset.condition)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => handleOpenEditModal(asset, e)}
                              className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3 text-[#2AC1BC]" /> {t("landlordAssetsBtnEdit")}
                            </button>
                            <button
                              onClick={(e) => handleDeleteAsset(asset, e)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title={t("landlordAssetsBtnDelete")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              href={`/landlord/assets/${asset.id}`}
                              className="px-2.5 py-1 bg-orange-50 text-[#FF6B35] border border-orange-200/80 rounded-lg text-xs font-bold hover:bg-[#FF6B35] hover:text-white transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> {t("landlordAssetsBtnViewDetail")}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Standardized Dormio Pagination Footer with Custom Rows Per Page */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs mt-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
            <span>{t("landlordAssetsShowing")}</span>
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
            <span>{t("landlordAssetsPerPage")}</span>
          </div>

          <span className="hidden sm:inline text-zinc-300">|</span>

          <div>
            <span className="font-extrabold text-zinc-800">
              {totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            -{" "}
            <span className="font-extrabold text-zinc-800">
              {Math.min(currentPage * itemsPerPage, totalRecords)}
            </span>{" "}
            {t("landlordAssetsOfTotal")}{" "}
            <span className="font-extrabold text-zinc-800">{totalRecords}</span>{" "}
            {t("landlordAssetsAssetsUnit")}
          </div>
        </div>

        {(() => {
          const windowSize = 5;
          const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
          const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
          const visiblePages = Array.from(
            { length: Math.max(0, windowEnd - windowStart + 1) },
            (_, i) => windowStart + i
          );

          return (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(windowStart - windowSize, 1))}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                &larr; {t("landlordAssetsPrev")}
              </button>
              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${currentPage === page
                    ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/30"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages || windowStart + windowSize > totalPages}
                onClick={() => setCurrentPage(Math.min(windowStart + windowSize, totalPages))}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {t("landlordAssetsNext")} &rarr;
              </button>
            </div>
          );
        })()}
      </div>

      {/* ADD / EDIT ASSET MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col max-h-[90vh]">
            <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 text-[#FF6B35] rounded-xl">
                  <Package className="w-5 h-5 text-[#2AC1BC]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-zinc-900">
                    {selectedAsset
                      ? `${t("landlordAssetsModalEditTitle")} [${selectedAsset.code}]`
                      : t("landlordAssetsModalAddTitle")}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">{t("landlordAssetsModalSub")}</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    {t("landlordAssetsFieldName")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("landlordAssetsFieldNamePh")}
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    {t("landlordAssetsFieldCategory")}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="Điện lạnh">{t("landlordAssetsCatRefrigeration")}</option>
                    <option value="Nội thất">{t("landlordAssetsCatFurniture")}</option>
                    <option value="Gia dụng">{t("landlordAssetsCatAppliances")}</option>
                    <option value="Điện nước">{t("landlordAssetsCatUtilities")}</option>
                    <option value="An ninh">{t("landlordAssetsCatSecurity")}</option>
                  </select>
                </div>

                {/* Room Selection */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    {t("landlordAssetsFieldRoom")}
                  </label>
                  <select
                    value={formRoomId}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setFormRoomId(selectedVal);
                      setIsDirty(true);
                      if (!selectedVal) {
                        setFormLocation(t("landlordAssetsLocationSharedOrStorage"));
                      } else {
                        const targetRoom = availableRooms.find((r) => r.id === selectedVal);
                        if (targetRoom) {
                          setFormLocation(t("landlordAssetsRoomPrefix", { room: targetRoom.roomNumber }));
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="">{t("landlordAssetsRoomSharedOption")}</option>
                    {availableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {t("landlordAssetsRoomPrefix", { room: room.roomNumber })}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Detail */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    {t("landlordAssetsFieldLocationDetail")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("landlordAssetsFieldLocationDetailPh")}
                    value={formLocation}
                    onChange={(e) => {
                      setFormLocation(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    {t("landlordAssetsFieldQuantity")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formQuantity}
                    onChange={(e) => {
                      setFormQuantity(Math.max(1, parseInt(e.target.value) || 1));
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                {/* Purchase Value */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    {t("landlordAssetsFieldPurchaseValue")}
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 8.500.000 ₫"
                    value={formValue}
                    onChange={(e) => {
                      setFormValue(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    {t("landlordAssetsFieldPurchaseDate")}
                  </label>
                  <input
                    type="date"
                    value={formPurchaseDate}
                    onChange={(e) => {
                      setFormPurchaseDate(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none"
                  />
                </div>

                {/* Condition / Status */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    {t("landlordAssetsFieldStatus")}
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => {
                      setFormCondition(e.target.value as AssetCondition);
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="good">{t("landlordAssetsStatusInUse")}</option>
                    <option value="new">{t("landlordAssetsStatusReady")}</option>
                    <option value="under_repair">{t("landlordAssetsStatusMaintenance")}</option>
                    <option value="damaged">{t("landlordAssetsStatusBroken")}</option>
                    <option value="lost">{t("landlordAssetsStatusLost")}</option>
                    <option value="disposed">{t("landlordAssetsStatusDisposed")}</option>
                  </select>
                </div>

                {/* Note */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1">
                    {t("landlordAssetsFieldNoteWarranty")}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t("landlordAssetsFieldNoteWarrantyPh")}
                    value={formNote}
                    onChange={(e) => {
                      setFormNote(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:border-[#2AC1BC] outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                {t("landlordAssetsBtnCancel")}
              </button>
              <button
                onClick={handleSaveAsset}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2AC1BC] hover:bg-[#25ad87] disabled:opacity-50 rounded-xl shadow-sm shadow-[#2AC1BC]/20 cursor-pointer transition-all flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t("landlordAssetsModalBtnSave")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
