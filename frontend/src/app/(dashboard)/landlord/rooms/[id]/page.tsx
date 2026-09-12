"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, Home, User, FileSignature, Receipt,
  Gauge, Banknote, Sparkles, Wrench, X, ChevronDown,
  AlertTriangle, Eye, History, Wallet, Plus, Upload, RefreshCw, Filter,
  Building2, AlertCircle, Users, CheckCircle2, ShieldCheck, Phone, FileText
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import {
  getRoomDashboard,
  updateRoom,
  RoomDashboardResponse,
  RoomDashboardContract,
  RoomDashboardTenant,
} from "@/services/room.service";
import {
  meterReadingService,
  LandlordActiveMeteredService,
  LandlordMeterPeriodHistory,
  LandlordMeterEditAction,
} from "@/services/meter-reading.service";
import { defaultRoomServices, Room } from "../data";

interface MeterHistoryRecord {
  id?: string;
  period: string;       // "Tháng 09/2026"
  date: string;         // "01/09/2026 08:00"
  oldElec: number;
  newElec: number;
  oldWater: number;
  newWater: number;
  editReason?: string;
  editedAt?: string;
  editHistory?: Array<{
    id: string;
    serviceName: string;
    oldValue: number | null;
    newValue: number;
    reason: string | null;
    createdAt: string;
  }>;
  editActions?: LandlordMeterEditAction[];
  isOpen?: boolean;
}

interface InvoiceRecord {
  id: string;           // "INV-202609-401"
  period: string;       // "Tháng 09/2026"
  monthSeq: string;     // "09/26"
  deadline: string;
  status: "Chưa thanh toán" | "Đã thu";
  method: string;
  isOverdue?: boolean;
  editReason?: string;
  editedAt?: string;
}

interface MaintenanceRecord {
  id: string;
  title: string;
  description?: string;
  reportDate: string;
  status: "Đang xử lý" | "Đã xong";
  priority: "Mức độ cao" | "Mức độ trung bình" | "Mức độ nhẹ";
  completedDate?: string;
}


const AMENITY_LABELS: Record<string, { vi: string; en: string }> = {
  WiFi: { vi: "WiFi", en: "WiFi" },
  "Điều hòa": { vi: "Điều hòa", en: "Air Conditioner" },
  "Nóng lạnh": { vi: "Nóng lạnh", en: "Water Heater" },
  "Tủ quần áo": { vi: "Tủ quần áo", en: "Wardrobe" },
  Giường: { vi: "Giường", en: "Bed" },
  "Kệ bếp": { vi: "Kệ bếp", en: "Kitchen Shelf" },
  "Ban công": { vi: "Ban công", en: "Balcony" },
  "WC riêng": { vi: "WC riêng", en: "Private Bathroom" },
  "Máy giặt": { vi: "Máy giặt", en: "Washing Machine" },
  Tivi: { vi: "Tivi", en: "TV" },
  "Tủ lạnh": { vi: "Tủ lạnh", en: "Refrigerator" },
  "Bảo vệ": { vi: "Bảo vệ", en: "Security Guard" },
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapStatusToDisplay = (status?: string): 'Đang thuê' | 'Trống' | 'Bảo trì' | 'Đặt cọc' => {
  switch (status?.toLowerCase()) {
    case 'occupied':
    case 'đang thuê':
      return 'Đang thuê';
    case 'maintainace':
    case 'maintenance':
    case 'bảo trì':
      return 'Bảo trì';
    case 'deposited':
    case 'đặt cọc':
      return 'Đặt cọc';
    case 'available':
    case 'trống':
    default:
      return 'Trống';
  }
};

const mapDisplayToBackendStatus = (status: string): string => {
  switch (status) {
    case 'Đang thuê':
      return 'occupied';
    case 'Bảo trì':
      return 'maintainace';
    case 'Đặt cọc':
      return 'deposited';
    case 'Trống':
    default:
      return 'available';
  }
};

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { activeBuilding } = useAuth();
  const t = useTranslations("landlord");
  const { currentLocale } = useLanguage();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Đang thuê':
        return t("landlordRoomDetailStatusOccupied");
      case 'Trống':
        return t("landlordRoomDetailStatusAvailable");
      case 'Bảo trì':
        return t("landlordRoomDetailStatusMaintenance");
      case 'Đặt cọc':
        return t("landlordRoomDetailStatusDeposited");
      default:
        return status;
    }
  };

  const priorityLabels: Record<string, string> = {
    'Mức độ cao': t('landlordRoomDetailPriorityHigh'),
    'Mức độ trung bình': t('landlordRoomDetailPriorityMedium'),
    'Mức độ nhẹ': t('landlordRoomDetailPriorityLow'),
  };

  const [room, setRoom] = useState<Room | null>(null);
  const [dashboardData, setDashboardData] = useState<RoomDashboardResponse | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  const [discardConfirmModal, setDiscardConfirmModal] = useState<{ isOpen: boolean; onConfirm: () => void }>({
    isOpen: false,
    onConfirm: () => { },
  });

  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState("");

  // Filter state for Month/Year
  const [selectedFilterPeriod, setSelectedFilterPeriod] = useState<string>("all");

  // Room Edit Form states
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editFloor, setEditFloor] = useState("");
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editServices, setEditServices] = useState([
    { id: 'bao_ve', name: 'Bảo vệ', defaultPrice: '50.000', customPrice: '60.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 'dien', name: 'Điện', defaultPrice: '3.500', customPrice: '3.500', unit: 'đ/kWh', isCustom: true, isRemovable: false },
    { id: 'nuoc', name: 'Nước', defaultPrice: '25.000', customPrice: '25.000', unit: 'đ/m³', isCustom: true, isRemovable: false },
    { id: 'rac', name: 'Rác', defaultPrice: '20.000', customPrice: '20.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 've_sinh', name: 'Vệ sinh', defaultPrice: '30.000', customPrice: '30.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
    { id: 'wifi', name: 'Wifi', defaultPrice: '100.000', customPrice: '100.000', unit: 'đ/phòng', isCustom: true, isRemovable: false },
  ]);

  // Initial snapshot to detect unsaved changes
  const [initialEditValues, setInitialEditValues] = useState({
    roomNumber: "",
    price: "",
    area: "",
    floor: "",
  });

  // Current date for default picker
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  // Meter modal input states
  const [selectedMonth, setSelectedMonth] = useState(`Tháng ${currentMonthNum}`);
  const [selectedYear, setSelectedYear] = useState(currentYearNum.toString());
  const [formElec, setFormElec] = useState("");
  const [formWater, setFormWater] = useState("");
  const [isSubmittingMeter, setIsSubmittingMeter] = useState(false);

  // Meter Readings History & Active Services Data (UC-L-09)
  const [meterHistory, setMeterHistory] = useState<MeterHistoryRecord[]>([]);
  const [meterHistoryRaw, setMeterHistoryRaw] = useState<LandlordMeterPeriodHistory[]>([]);
  const [roomMeteredServices, setRoomMeteredServices] = useState<LandlordActiveMeteredService[]>([]);

  // Invoices History List (initialized empty; loaded from API)
  const [invoicesHistory, setInvoicesHistory] = useState<InvoiceRecord[]>([]);

  // Maintenance History List & Pagination (initialized empty; no mockup data)
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [maintPage, setMaintPage] = useState(1);
  const MAINT_PER_PAGE = 2;

  const [incidentTitleInput, setIncidentTitleInput] = useState("");
  const [incidentDescInput, setIncidentDescInput] = useState("");
  const [incidentPriorityInput, setIncidentPriorityInput] = useState<"Mức độ cao" | "Mức độ trung bình" | "Mức độ nhẹ">("Mức độ trung bình");

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Pagination states
  const ITEMS_PER_PAGE = 2;
  const [invoicePage, setInvoicePage] = useState(1);
  const [meterPage, setMeterPage] = useState(1);

  // Meter Correction Modal State
  const [correctModal, setCorrectModal] = useState<{
    isOpen: boolean;
    period: string;
    oldElec: number;
    newElec: number;
    oldWater: number;
    newWater: number;
    reason: string;
    error: string;
  }>({
    isOpen: false,
    period: "",
    oldElec: 0,
    newElec: 0,
    oldWater: 0,
    newWater: 0,
    reason: "",
    error: ""
  });

  const isRealUuid = Boolean(
    resolvedParams.id && UUID_REGEX.test(resolvedParams.id)
  );

  // Load Dashboard Data (Aggregated query UC-L-05) or fallback to mock
  useEffect(() => {
    setIsMounted(true);

    async function loadDashboard() {
      setIsLoading(true);
      if (isRealUuid && activeBuilding?.id && UUID_REGEX.test(activeBuilding.id)) {
        try {
          const rawRes = await getRoomDashboard(activeBuilding.id, resolvedParams.id);
          const res = (rawRes as any)?.data?.room ? (rawRes as any).data : rawRes;
          setDashboardData(res);

          const r = res?.room;
          if (!r) {
            console.error("Room data is missing from dashboard response:", res);
            return;
          }
          const activeContract = res.currentContract;
          const primaryTenant =
            activeContract?.tenants?.find((t: any) => t.isPrimary) ||
            activeContract?.tenants?.[0];

          const formattedPrice = activeContract?.rentPrice
            ? `${parseInt(activeContract.rentPrice).toLocaleString('vi-VN')} ₫`
            : r.roomType?.name
            ? `3.000.000 ₫`
            : '3.000.000 ₫';

          const mappedRoom: Room = {
            id: r.id,
            roomNumber: r.roomNumber,
            building: activeBuilding.id,
            buildingSeq: 1,
            floor: String(r.floor),
            price: formattedPrice,
            area: r.area ? String(r.area) : "25",
            status: mapStatusToDisplay(r.status),
            contract: activeContract ? "active" : "none",
            invoice: (res.invoices || []).some((i: any) => i.status?.toLowerCase() !== 'paid') ? "debt" : "paid",
            tenant: primaryTenant?.fullName || undefined,
            tenantPhone: primaryTenant?.phoneNumber || undefined,
            tenantCccd: primaryTenant?.identityNumber || undefined,
            amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng'],
            notes: activeContract?.note || "",
          };

          setRoom(mappedRoom);
          setEditRoomNumber(r.roomNumber);
          setEditPrice(formattedPrice);
          setEditArea(mappedRoom.area || "25");
          setEditFloor(mappedRoom.floor || "1");
          setInitialEditValues({
            roomNumber: r.roomNumber,
            price: formattedPrice,
            area: mappedRoom.area || "25",
            floor: mappedRoom.floor || "1",
          });

          // Populate live services if attached
          if (res.services && res.services.length > 0) {
            setEditServices(
              res.services.map((s: any) => ({
                id: s.id,
                name: s.name,
                defaultPrice: parseInt(s.price).toLocaleString('vi-VN'),
                customPrice: parseInt(s.price).toLocaleString('vi-VN'),
                unit: s.unit ? `đ/${s.unit}` : 'đ/tháng',
                isCustom: false,
                isRemovable: false,
              }))
            );
          }

          // Populate live invoices if available
          if (res.invoices && res.invoices.length > 0) {
            setInvoicesHistory(
              res.invoices.map((inv: any) => {
                const due = new Date(inv.dueDate);
                const month = (due.getMonth() + 1).toString().padStart(2, '0');
                const year = due.getFullYear();
                const isPaid = inv.status?.toLowerCase() === 'paid';
                return {
                  id: inv.id.slice(0, 8).toUpperCase(),
                  period: `Tháng ${month}/${year}`,
                  monthSeq: `${month}/${String(year).slice(-2)}`,
                  deadline: due.toLocaleDateString('vi-VN'),
                  status: isPaid ? 'Đã thu' : 'Chưa thanh toán',
                  method: inv.paymentMethod || 'VietQR Auto',
                  isOverdue: !isPaid && new Date() > due,
                };
              })
            );
          }

          // Load active metered services & meter history (UC-L-09)
          try {
            const [meterServicesRes, meterHistoryRes] = await Promise.all([
              meterReadingService.getLandlordRoomMeteredServices(activeBuilding.id, resolvedParams.id),
              meterReadingService.getLandlordRoomMeterHistory(activeBuilding.id, resolvedParams.id),
            ]);

            if (meterServicesRes?.services) {
              setRoomMeteredServices(meterServicesRes.services);
              const elec = meterServicesRes.services.find(s => s.serviceName.toLowerCase().includes('điện'));
              const water = meterServicesRes.services.find(s => s.serviceName.toLowerCase().includes('nước'));
              if (elec?.unbilledReading?.readingValue != null) {
                setFormElec(elec.unbilledReading.readingValue.toString());
              }
              if (water?.unbilledReading?.readingValue != null) {
                setFormWater(water.unbilledReading.readingValue.toString());
              }
            }

            if (meterHistoryRes?.history) {
              setMeterHistoryRaw(meterHistoryRes.history);
              const mapped = meterHistoryRes.history.map((h, idx) => {
                const elec = h.services.find(s => s.serviceName.toLowerCase().includes('điện') || s.unit.toLowerCase() === 'kwh');
                const water = h.services.find(s => s.serviceName.toLowerCase().includes('nước') || s.unit.toLowerCase().includes('m3') || s.unit.toLowerCase().includes('m³'));
                return {
                  id: h.id || `cycle_${h.period}_${idx}`,
                  period: h.period,
                  date: h.date,
                  oldElec: elec?.oldReading ?? 0,
                  newElec: elec?.newReading ?? 0,
                  oldWater: water?.oldReading ?? 0,
                  newWater: water?.newReading ?? 0,
                  isOpen: idx === 0,
                  editReason: h.editReason,
                  editedAt: h.editedAt,
                  editHistory: h.editHistory,
                  editActions: h.editActions,
                };
              });
              setMeterHistory(mapped);
            }
          } catch (mErr) {
            console.warn("Could not load landlord meter readings:", mErr);
            setMeterHistory([]);
          }
        } catch (err: any) {
          console.error("Failed to load room dashboard from API:", err);
          setMeterHistory([]);
          setMaintenanceHistory([]);
          setRoom(null);
        }
      } else {
        setRoom(null);
      }
      setIsLoading(false);
    }

    loadDashboard();
  }, [resolvedParams.id, activeBuilding?.id, isRealUuid]);

  useEffect(() => {
    setInvoicePage(1);
    setMeterPage(1);
  }, [selectedFilterPeriod]);

  // Modal reset behavior with confirmation for unsaved changes (Rule 10)
  const handleCloseEditModal = () => {
    const hasChanges =
      editRoomNumber !== initialEditValues.roomNumber ||
      editPrice !== initialEditValues.price ||
      editArea !== initialEditValues.area ||
      editFloor !== initialEditValues.floor;

    if (hasChanges) {
      setDiscardConfirmModal({
        isOpen: true,
        onConfirm: () => {
          setEditRoomNumber(initialEditValues.roomNumber);
          setEditPrice(initialEditValues.price);
          setEditArea(initialEditValues.area);
          setEditFloor(initialEditValues.floor);
          setIsEditModalOpen(false);
          setDiscardConfirmModal({ isOpen: false, onConfirm: () => { } });
        },
      });
    } else {
      setIsEditModalOpen(false);
    }
  };

  const handleSaveRoomDetails = async () => {
    if (isRealUuid && activeBuilding?.id && UUID_REGEX.test(activeBuilding.id)) {
      try {
        const cleanArea = parseFloat(editArea) || undefined;
        const cleanFloor = parseInt(editFloor) || undefined;

        await updateRoom(activeBuilding.id, resolvedParams.id, {
          roomNumber: editRoomNumber.trim(),
          floor: cleanFloor,
          area: cleanArea,
        });

        setRoom((prev) =>
          prev
            ? {
                ...prev,
                roomNumber: editRoomNumber || prev.roomNumber,
                price: editPrice.includes('₫') ? editPrice : `${editPrice} ₫`,
                area: editArea || prev.area,
                floor: editFloor || prev.floor,
                amenities: editAmenities,
                notes: editNotes,
              }
            : null
        );
        setInitialEditValues({
          roomNumber: editRoomNumber,
          price: editPrice,
          area: editArea,
          floor: editFloor,
        });
        setIsEditModalOpen(false);
        showToast(t("landlordRoomDetailToastUpdateSuccess"), "success");
      } catch (err: any) {
        console.error("Failed to update room:", err);
        showToast(err.message || t("landlordRoomDetailToastUpdateError"), "error");
      }
    } else {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              roomNumber: editRoomNumber || prev.roomNumber,
              price: editPrice.includes('₫') ? editPrice : `${editPrice} ₫`,
              area: editArea || prev.area,
              floor: editFloor || prev.floor,
              amenities: editAmenities,
              notes: editNotes,
            }
          : null
      );
      setInitialEditValues({
        roomNumber: editRoomNumber,
        price: editPrice,
        area: editArea,
        floor: editFloor,
      });
      setIsEditModalOpen(false);
      showToast(t("landlordRoomDetailToastUpdateSuccess"), "success");
    }
  };

  const handleUpdateStatus = async (newDisplayStatus: 'Trống' | 'Đang thuê' | 'Bảo trì' | 'Đặt cọc') => {
    const newBackendStatus = mapDisplayToBackendStatus(newDisplayStatus);
    setRoom((prev) => (prev ? { ...prev, status: newDisplayStatus } : null));

    if (isRealUuid && activeBuilding?.id && UUID_REGEX.test(activeBuilding.id)) {
      try {
        await updateRoom(activeBuilding.id, resolvedParams.id, { status: newBackendStatus });
        showToast(t("landlordRoomDetailToastStatusChanged").replace("{status}", getStatusLabel(newDisplayStatus)), "success");
      } catch (err: any) {
        console.error("Failed to update status:", err);
        showToast(err.message || t("landlordRoomDetailToastStatusError"), "error");
      }
    } else {
      showToast(t("landlordRoomDetailToastStatusChanged").replace("{status}", getStatusLabel(newDisplayStatus)), "success");
    }
  };

  const handleCreateIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitleInput.trim()) {
      showToast(t("landlordRoomDetailToastIncidentNameRequired"), "error");
      return;
    }
    const todayStr = new Date().toLocaleDateString("vi-VN");

    const newRecord: MaintenanceRecord = {
      id: `M_${Date.now()}`,
      title: incidentTitleInput.trim(),
      description: incidentDescInput.trim() || undefined,
      reportDate: todayStr,
      status: "Đang xử lý",
      priority: incidentPriorityInput
    };
    setMaintenanceHistory(prev => [newRecord, ...prev]);
    setIncidentTitleInput("");
    setIncidentDescInput("");
    setIncidentPriorityInput("Mức độ trung bình");
    setIsIncidentModalOpen(false);
    showToast(t("landlordRoomDetailToastIncidentSuccess"), "success");
  };

  // Helper for restricted Meter month & year selection (current & next month only)
  const getAvailableMeterPeriods = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1 to 12
    const currentYear = now.getFullYear();

    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const monthOptions = [
      { label: t("landlordRoomDetailFilterMonth").replace("{month}", String(currentMonth)), value: `Tháng ${currentMonth}` },
      { label: t("landlordRoomDetailFilterMonth").replace("{month}", String(nextMonth)), value: `Tháng ${nextMonth}` }
    ];

    const yearOptions = Array.from(new Set([currentYear.toString(), nextMonthYear.toString()]));

    return { monthOptions, yearOptions };
  };

  // Open correction modal for a specific period
  const handleOpenCorrectionModal = (record: MeterHistoryRecord) => {
    setCorrectModal({
      isOpen: true,
      period: record.period,
      oldElec: record.oldElec,
      newElec: record.newElec,
      oldWater: record.oldWater,
      newWater: record.newWater,
      reason: "",
      error: ""
    });
  };

  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Close meter modal with unsaved confirmation check (Rule 10)
  const handleCloseMeterModal = () => {
    if (formElec.trim() !== "" || formWater.trim() !== "") {
      setDiscardConfirmModal({
        isOpen: true,
        onConfirm: () => {
          setFormElec("");
          setFormWater("");
          setIsMeterModalOpen(false);
          setDiscardConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      setIsMeterModalOpen(false);
    }
  };

  // Close correction modal with unsaved confirmation check (Rule 10)
  const handleCloseCorrectionModal = () => {
    if (correctModal.reason.trim() !== "") {
      setDiscardConfirmModal({
        isOpen: true,
        onConfirm: () => {
          setCorrectModal(prev => ({ ...prev, isOpen: false }));
          setDiscardConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      setCorrectModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Save correction action with mandatory reason check (UC-L-09)
  const handleSaveCorrection = async () => {
    if (!correctModal.reason.trim()) {
      setCorrectModal(prev => ({ ...prev, error: t("landlordRoomDetailToastReasonRequired") }));
      return;
    }

    if (!activeBuilding?.id || !resolvedParams.id) {
      showToast(t("landlordRoomDetailToastRoomNotFound"), "error");
      return;
    }

    const rawPeriod = meterHistoryRaw.find(h => h.period === correctModal.period);
    if (!rawPeriod) {
      setMeterHistory(prev => prev.map(item => {
        if (item.period === correctModal.period) {
          const changes = [];
          if (Number(correctModal.newElec) !== item.newElec) {
            changes.push({ serviceName: 'Điện', oldValue: item.newElec, newValue: Number(correctModal.newElec), unit: 'kWh' });
          }
          if (Number(correctModal.newWater) !== item.newWater) {
            changes.push({ serviceName: 'Nước', oldValue: item.newWater, newValue: Number(correctModal.newWater), unit: 'm³' });
          }
          const newAction: LandlordMeterEditAction = {
            id: `mock_act_${Date.now()}`,
            reason: correctModal.reason,
            createdAt: new Date().toISOString(),
            changes,
          };
          return {
            ...item,
            newElec: Number(correctModal.newElec),
            newWater: Number(correctModal.newWater),
            editReason: correctModal.reason,
            editedAt: new Date().toLocaleString('vi-VN'),
            editActions: changes.length > 0 ? [newAction, ...(item.editActions || [])] : item.editActions,
          };
        }
        return item;
      }));
      setCorrectModal(prev => ({ ...prev, isOpen: false }));
      showToast(t("landlordRoomDetailToastMeterAdjustSuccess"), "success");
      return;
    }

    try {
      setIsSubmittingCorrection(true);
      const elecItem = rawPeriod.services.find(s => s.serviceName.toLowerCase().includes('điện') || s.unit.toLowerCase() === 'kwh');
      const waterItem = rawPeriod.services.find(s => s.serviceName.toLowerCase().includes('nước') || s.unit.toLowerCase().includes('m3') || s.unit.toLowerCase().includes('m³'));

      const sharedActionId = crypto.randomUUID();
      const updatePromises = [];
      if (elecItem && Number(correctModal.newElec) !== elecItem.newReading) {
        updatePromises.push(
          meterReadingService.updateLandlordMeterReading(activeBuilding.id, elecItem.id, {
            readingValue: Number(correctModal.newElec),
            reason: correctModal.reason,
            actionId: sharedActionId,
          })
        );
      }
      if (waterItem && Number(correctModal.newWater) !== waterItem.newReading) {
        updatePromises.push(
          meterReadingService.updateLandlordMeterReading(activeBuilding.id, waterItem.id, {
            readingValue: Number(correctModal.newWater),
            reason: correctModal.reason,
            actionId: sharedActionId,
          })
        );
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      setCorrectModal(prev => ({ ...prev, isOpen: false }));
      showToast(t("landlordRoomDetailToastMeterAdjustSuccess"), "success");

      // Reload meter history
      const newHistoryRes = await meterReadingService.getLandlordRoomMeterHistory(activeBuilding.id, resolvedParams.id);
      if (newHistoryRes?.history) {
        setMeterHistoryRaw(newHistoryRes.history);
        const mapped = newHistoryRes.history.map((h, idx) => {
          const elec = h.services.find(s => s.serviceName.toLowerCase().includes('điện') || s.unit.toLowerCase() === 'kwh');
          const water = h.services.find(s => s.serviceName.toLowerCase().includes('nước') || s.unit.toLowerCase().includes('m3') || s.unit.toLowerCase().includes('m³'));
          return {
            id: h.id || `cycle_${h.period}_${idx}`,
            period: h.period,
            date: h.date,
            oldElec: elec?.oldReading ?? 0,
            newElec: elec?.newReading ?? 0,
            oldWater: water?.oldReading ?? 0,
            newWater: water?.newReading ?? 0,
            isOpen: idx === 0,
            editReason: h.editReason,
            editedAt: h.editedAt,
            editHistory: h.editHistory,
            editActions: h.editActions,
          };
        });
        setMeterHistory(mapped);
      }
    } catch (err: any) {
      console.error("Failed to update meter reading:", err);
      showToast(err.message || t("landlordRoomDetailToastMeterAdjustError"), "error");
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  // Simulate AI OCR scanning
  const handleSimulateAiOcr = () => {
    setIsOcrScanning(true);
    setOcrSuccessMsg("");
    setTimeout(() => {
      const elecService = roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('điện'));
      const waterService = roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('nước'));
      const baseElec = elecService?.lastReading?.readingValue ?? (meterHistory[0]?.newElec || 1400);
      const baseWater = waterService?.lastReading?.readingValue ?? (meterHistory[0]?.newWater || 40);
      const scannedElec = baseElec + Math.floor(Math.random() * 40) + 60;
      const scannedWater = baseWater + Math.floor(Math.random() * 4) + 3;
      setFormElec(scannedElec.toString());
      setFormWater(scannedWater.toString());
      setIsOcrScanning(false);
      setOcrSuccessMsg(t("landlordRoomDetailToastOcrSuccess").replace("{elec}", String(scannedElec)).replace("{water}", String(scannedWater)));
    }, 800);
  };

  // Save new meter reading from main modal (UC-L-09)
  const handleSaveNewMeterReading = async () => {
    if (!formElec && !formWater) {
      showToast(t("landlordRoomDetailToastMeterInputRequired"), "error");
      return;
    }

    if (!activeBuilding?.id || !resolvedParams.id) {
      showToast(t("landlordRoomDetailToastRoomNotFound"), "error");
      return;
    }

    const elecService = roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('điện'));
    const waterService = roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('nước'));

    const readings: Array<{ serviceId: string; readingValue: number; imageUrl?: string }> = [];
    if (elecService && formElec.trim() !== '') {
      readings.push({
        serviceId: elecService.serviceId,
        readingValue: parseFloat(formElec),
      });
    }
    if (waterService && formWater.trim() !== '') {
      readings.push({
        serviceId: waterService.serviceId,
        readingValue: parseFloat(formWater),
      });
    }

    if (readings.length === 0) {
      showToast(t("landlordRoomDetailToastMeterServiceNotFound"), "error");
      return;
    }

    try {
      setIsSubmittingMeter(true);
      const parsedMonth = parseInt(selectedMonth.replace('Tháng ', '').trim(), 10);
      const parsedYear = parseInt(selectedYear.trim(), 10);

      await meterReadingService.recordLandlordMeterReading(activeBuilding.id, {
        roomId: resolvedParams.id,
        month: isNaN(parsedMonth) ? undefined : parsedMonth,
        year: isNaN(parsedYear) ? undefined : parsedYear,
        readings,
      });

      const periodFull = `Tháng ${selectedMonth.replace('Tháng ', '').padStart(2, '0')}/${selectedYear}`;
      showToast(t("landlordRoomDetailToastMeterLogSuccess").replace("{period}", periodFull), "success");
      setIsMeterModalOpen(false);

      // Refresh meter services & history
      const [newServicesRes, newHistoryRes] = await Promise.all([
        meterReadingService.getLandlordRoomMeteredServices(activeBuilding.id, resolvedParams.id),
        meterReadingService.getLandlordRoomMeterHistory(activeBuilding.id, resolvedParams.id),
      ]);

      if (newServicesRes?.services) {
        setRoomMeteredServices(newServicesRes.services);
      }
      if (newHistoryRes?.history) {
        setMeterHistoryRaw(newHistoryRes.history);
        const mapped = newHistoryRes.history.map((h, idx) => {
          const elec = h.services.find(s => s.serviceName.toLowerCase().includes('điện') || s.unit.toLowerCase() === 'kwh');
          const water = h.services.find(s => s.serviceName.toLowerCase().includes('nước') || s.unit.toLowerCase().includes('m3') || s.unit.toLowerCase().includes('m³'));
          return {
            id: h.id || `cycle_${h.period}_${idx}`,
            period: h.period,
            date: h.date,
            oldElec: elec?.oldReading ?? 0,
            newElec: elec?.newReading ?? 0,
            oldWater: water?.oldReading ?? 0,
            newWater: water?.newReading ?? 0,
            isOpen: idx === 0,
            editReason: h.editReason,
            editedAt: h.editedAt,
            editHistory: h.editHistory,
            editActions: h.editActions,
          };
        });
        setMeterHistory(mapped);
      }
    } catch (err: any) {
      console.error("Failed to record meter readings:", err);
      showToast(err.message || t("landlordRoomDetailToastMeterLogError"), "error");
    } finally {
      setIsSubmittingMeter(false);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-16 bg-zinc-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="h-44 bg-zinc-100 rounded-2xl"></div>
            <div className="h-64 bg-zinc-100 rounded-2xl"></div>
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-zinc-100 rounded-2xl"></div>
            <div className="h-60 bg-zinc-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 my-6 shadow-xs">
        <p className="font-bold text-lg mb-2 text-zinc-800">{t("landlordRoomDetailNotFound")}</p>
        <p className="text-xs text-zinc-500 mb-4">{t("landlordRoomDetailRoomCode")}: {resolvedParams.id}</p>
        <Link
          href="/landlord/rooms"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2AC1BC] text-white text-xs font-bold rounded-xl hover:bg-[#25ad87] transition-colors"
        >
          &larr; {t("landlordRoomDetailBack")}
        </Link>
      </div>
    );
  }

  const isOccupied = room.status === 'Đang thuê';
  const isVacant = room.status === 'Trống';
  const isMaintenance = room.status === 'Bảo trì';
  const isReserved = room.status === 'Đặt cọc';

  // Base constants for financial calculations
  const roomRentNum = parseInt((room.price || "3000000").replace(/\D/g, '')) || 3000000;
  const fixedServicesTotal = 210000;
  const elecService = roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('điện'));
  const waterService = roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('nước'));
  const elecUnitPrice = elecService?.unitPrice ?? 3500;
  const waterUnitPrice = waterService?.unitPrice ?? 25000;

  const computeRecordFinancials = (m: MeterHistoryRecord) => {
    const elecUse = Math.max(0, m.newElec - m.oldElec);
    const elecCost = elecUse * elecUnitPrice;
    const waterUse = Math.max(0, m.newWater - m.oldWater);
    const waterCost = waterUse * waterUnitPrice;
    const meterTotal = elecCost + waterCost;
    const grandInvoiceTotal = roomRentNum + fixedServicesTotal + meterTotal;

    return {
      elecUse,
      elecCost,
      waterUse,
      waterCost,
      meterTotal,
      grandInvoiceTotal
    };
  };

  // Filtered meter records and invoices based on selected Filter Period
  const filteredMeterHistory = meterHistory.filter(m => selectedFilterPeriod === "all" || m.period === selectedFilterPeriod);
  const filteredInvoices = invoicesHistory.filter(inv => selectedFilterPeriod === "all" || inv.period === selectedFilterPeriod);

  const totalInvoicePages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvoices = filteredInvoices.slice((invoicePage - 1) * ITEMS_PER_PAGE, invoicePage * ITEMS_PER_PAGE);

  const totalMeterPages = Math.ceil(filteredMeterHistory.length / ITEMS_PER_PAGE) || 1;
  const paginatedMeterHistory = filteredMeterHistory.slice((meterPage - 1) * ITEMS_PER_PAGE, meterPage * ITEMS_PER_PAGE);

  const unpaidInvoice = invoicesHistory.find(i => i.status === "Chưa thanh toán");
  const unpaidRecord = unpaidInvoice ? meterHistory.find(m => m.period === unpaidInvoice.period) : null;
  const unpaidFinancials = unpaidRecord ? computeRecordFinancials(unpaidRecord) : null;

  const currentContract = dashboardData?.currentContract;
  const primaryTenant = currentContract?.tenants?.find((t) => t.isPrimary) || currentContract?.tenants?.[0];
  const otherTenants = currentContract?.tenants?.filter((t) => t.id !== primaryTenant?.id) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/landlord/rooms"
            className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition-colors cursor-pointer shrink-0"
            title={t("landlordRoomDetailBack")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">{t("landlordRoomDetailRoomPrefix")} {room.roomNumber}</h1>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 sm:py-1 rounded-full border shrink-0 ${
              isOccupied ? 'text-[#2AC1BC] bg-[#2AC1BC]/10 border-[#2AC1BC]/30' :
              isMaintenance ? 'text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30' :
              isReserved ? 'text-purple-600 bg-purple-500/10 border-purple-500/30' :
              isVacant ? 'text-blue-600 bg-blue-500/10 border-blue-500/30' :
              'text-zinc-500 bg-zinc-100 border-zinc-200'
            }`}>
              {getStatusLabel(room.status)}
            </span>
            <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-zinc-200/80 truncate max-w-[170px] sm:max-w-none">
              {activeBuilding?.name || (room.building === 'b2' ? 'Dormio Campus Cầu Giấy' : 'Dormio Premier Quận 1')}
            </span>
            {dashboardData?.room?.roomType?.name && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                {dashboardData.room.roomType.name}
              </span>
            )}
            <span className="text-[11px] font-bold text-zinc-400">ID: {room.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
          {isOccupied && (
            <button
              onClick={() => setIsMeterModalOpen(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Gauge className="w-3.5 h-3.5" /> {t("landlordRoomDetailBtnLogMeter")}
            </button>
          )}

          {isOccupied ? (
            <Link
              href={
                currentContract?.id
                  ? `/landlord/contracts/${currentContract.id}`
                  : `/landlord/contracts/HD-01012026-${room.building === 'b2' ? 2 : 1}-${room.roomNumber}`
              }
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 text-purple-600" /> {t("landlordRoomDetailBtnViewContract")}
            </Link>
          ) : (
            <Link
              href={`/landlord/contracts/create?roomId=${dashboardData?.room?.id || room?.id || resolvedParams.id}`}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileSignature className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("landlordRoomDetailBtnCreateContract")}
            </Link>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Edit className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("landlordRoomDetailBtnEdit")}
          </button>

          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: t("landlordRoomDetailDeleteTitle"),
                message: t("landlordRoomDetailDeleteConfirm").replace("{roomNumber}", room.roomNumber),
                onConfirm: () => {
                  router.push('/landlord/rooms');
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
              });
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" /> {t("landlordRoomDetailBtnDelete")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Main Column */}
        <div className="xl:col-span-2 space-y-6">

          {/* SPOTLIGHT TENANT PROFILE CARD */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-zinc-100">
              <h2 className="font-black text-zinc-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordRoomDetailCurrentTenantTitle")}
              </h2>
              {isOccupied && currentContract && (
                <Link
                  href={`/landlord/contracts/${currentContract.id}`}
                  className="px-2.5 py-1 text-[11px] font-bold text-[#2AC1BC] hover:bg-[#2AC1BC]/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> {t("landlordRoomDetailContractDetailBtn")}
                </Link>
              )}
            </div>

            <div className="p-3.5 sm:p-5">
              {room.tenant || primaryTenant ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 bg-[#2AC1BC]/5 rounded-2xl border border-[#2AC1BC]/20">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2AC1BC] text-white font-black text-base sm:text-lg flex items-center justify-center shadow-md shrink-0">
                        {(primaryTenant?.fullName || room.tenant || "K").charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black text-zinc-900">
                            {primaryTenant?.fullName || room.tenant}
                          </h3>
                          {primaryTenant?.hasIdentification && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                              <ShieldCheck className="w-3 h-3" /> {t("landlordRoomDetailHasCccd")}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold text-zinc-500 mt-0.5">
                          <span>{t("landlordRoomDetailPhoneLabel")} {primaryTenant?.phoneNumber || room.tenantPhone || '0977815704'}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{t("landlordRoomDetailCccdLabel")} {primaryTenant?.identityNumber || room.tenantCccd || t("landlordRoomDetailNotUpdated")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                      <a
                        href={`tel:${primaryTenant?.phoneNumber || room.tenantPhone || '0977815704'}`}
                        className="px-3 py-1.5 bg-red-600 text-white border border-zinc-200 rounded-xl text-xs font-bold hover:bg-red-500 transition-colors shadow-2xs text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3 h-3" /> {t("landlordRoomDetailCallNow")}
                      </a>
                      <Link
                        href={`/landlord/customers/${primaryTenant?.identityNumber || room.tenantCccd || '00109313040168'}`}
                        className="px-3.5 py-1.5 bg-[#2AC1BC] text-white rounded-xl text-xs font-bold hover:bg-[#25ad87] transition-all shadow-xs text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {t("landlordRoomDetailProfileBtn")}
                      </Link>
                    </div>
                  </div>

                  {/* Co-occupants list if present */}
                  {otherTenants.length > 0 && (
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 text-xs">
                      <span className="text-[11px] font-bold text-zinc-500 block mb-1.5">
                        {t("landlordRoomDetailRoommatesCount").replace("{count}", String(otherTenants.length))}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {otherTenants.map((ot) => (
                          <div
                            key={ot.id}
                            className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg text-[11px] font-bold text-zinc-800 flex items-center gap-1.5 shadow-2xs"
                          >
                            <Users className="w-3 h-3 text-zinc-400" />
                            <span>{ot.fullName}</span>
                            <span className="text-zinc-400 font-normal">({ot.phoneNumber})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 space-y-2">
                  <p className="text-xs text-zinc-500 font-bold">{t("landlordRoomDetailVacantDesc")}</p>
                  <button
                    onClick={() => router.push(`/landlord/contracts/create?roomId=${dashboardData?.room.id || room?.id || resolvedParams.id}`)}
                    className="px-4 py-2 bg-[#2AC1BC] text-white text-xs font-black rounded-xl hover:bg-[#25ad87] transition-all cursor-pointer shadow-xs"
                  >
                    {t("landlordRoomDetailCreateContractNew")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* GLOBAL FILTER BAR FOR MONTH/YEAR */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-800">
              <Filter className="w-4 h-4 text-[#2AC1BC]" />
              <span>{t("landlordRoomDetailFilterPeriodLabel")}</span>
            </div>
            <div className="relative w-full sm:w-64">
              <select
                value={selectedFilterPeriod}
                onChange={(e) => setSelectedFilterPeriod(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] cursor-pointer appearance-none"
              >
                <option value="all">{t("landlordRoomDetailFilterAllMonths")}</option>
                <option value="Tháng 09/2026">{t("landlordRoomDetailFilterCurrentMonth").replace("{month}", "09/2026")}</option>
                <option value="Tháng 08/2026">{t("landlordRoomDetailFilterMonth").replace("{month}", "08/2026")}</option>
                <option value="Tháng 07/2026">{t("landlordRoomDetailFilterMonth").replace("{month}", "07/2026")}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* SECTION 1: HÓA ĐƠN & CÔNG NỢ */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-3.5 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <h2 className="font-black text-zinc-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordRoomDetailInvoicesTitle")}
              </h2>
              {unpaidInvoice && unpaidFinancials && (
                <span className="self-start sm:self-auto px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-black animate-pulse">
                  {t("landlordRoomDetailUnpaidInvoicesBadge").replace("{count}", "1").replace("{amount}", unpaidFinancials.grandInvoiceTotal.toLocaleString("vi-VN"))}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {invoicesHistory.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2">
                  <Receipt className="w-8 h-8 text-zinc-300 mx-auto" />
                  <p className="text-xs text-zinc-600 font-bold">{t("landlordRoomDetailNoInvoicesTitle")}</p>
                  <p className="text-[11px] text-zinc-400">{t("landlordRoomDetailNoInvoicesDesc")}</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-400 font-bold bg-zinc-50 rounded-xl">
                  {t("landlordRoomDetailNoInvoicesInFilter")}
                </div>
              ) : paginatedInvoices.map((inv) => {
                const rec = meterHistory.find(m => m.period === inv.period) || {
                  period: inv.period,
                  date: "",
                  oldElec: 0,
                  newElec: 0,
                  oldWater: 0,
                  newWater: 0
                };
                const fin = computeRecordFinancials(rec);
                const isUnpaid = inv.status === "Chưa thanh toán";

                return (
                  <div
                    key={inv.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${
                      isUnpaid ? 'bg-rose-500/5 border-rose-500/30' : 'bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 sm:p-2.5 text-white rounded-xl font-black text-xs shadow-xs shrink-0 ${isUnpaid ? 'bg-rose-500' : 'bg-[#2AC1BC]'}`}>
                          {inv.monthSeq}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-xs font-black text-zinc-900">{inv.id}-{room.roomNumber}</span>
                            <span className={`text-[10px] font-bold ${isUnpaid ? 'text-rose-600' : 'text-zinc-500'}`}>({inv.period})</span>
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${isUnpaid ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {isUnpaid ? t("landlordRoomDetailInvoiceStatusUnpaid") : t("landlordRoomDetailInvoiceStatusPaid")}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">{t("landlordRoomDetailInvoiceDeadline")} <strong className={isUnpaid ? "text-rose-600" : "text-zinc-700"}>{inv.deadline}</strong></p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-200/50">
                        <span className={`text-base sm:text-lg font-black whitespace-nowrap ${isUnpaid ? 'text-rose-600' : 'text-[#2AC1BC]'}`}>
                          {fin.grandInvoiceTotal.toLocaleString('vi-VN')} ₫
                        </span>
                        {isUnpaid ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button className="px-3 py-1.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1 shrink-0 whitespace-nowrap">
                              VietQR
                            </button>
                            <a
                              href="https://zalo.me"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-[#0068FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                            >
                              Zalo
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] font-extrabold text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded-md whitespace-nowrap">
                            {inv.method}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-zinc-200/60 text-xs space-y-1.5">
                      <div className="text-[11px] font-extrabold text-zinc-700 flex justify-between border-b border-zinc-100 pb-1">
                        <span>{t("landlordRoomDetailInvoiceDetailsTitle")}</span>
                        <span className="text-[#2AC1BC] font-black whitespace-nowrap">{fin.grandInvoiceTotal.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-zinc-600 font-semibold pt-1">
                        <div className="p-1.5 bg-zinc-50 rounded-lg">
                          <span className="text-zinc-400 block text-[9px]">{t("landlordRoomDetailInvoiceRoomPrice")}</span>
                          <strong className="text-zinc-900 whitespace-nowrap">{roomRentNum.toLocaleString('vi-VN')} ₫</strong>
                        </div>
                        <div className="p-1.5 bg-zinc-50 rounded-lg">
                          <span className="text-zinc-400 block text-[9px]">{t("landlordRoomDetailInvoiceFixedServices")}</span>
                          <strong className="text-zinc-900 whitespace-nowrap">{fixedServicesTotal.toLocaleString('vi-VN')} ₫</strong>
                        </div>
                        <div className="p-1.5 bg-amber-50 rounded-lg">
                          <span className="text-amber-600 block text-[9px]">{t("landlordRoomDetailInvoiceElecUsage").replace("{usage}", String(fin.elecUse))}</span>
                          <strong className="text-amber-900 whitespace-nowrap">{fin.elecCost.toLocaleString('vi-VN')} ₫</strong>
                        </div>
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                          <span className="text-blue-600 block text-[9px]">{t("landlordRoomDetailInvoiceWaterUsage").replace("{usage}", String(fin.waterUse))}</span>
                          <strong className="text-blue-900 whitespace-nowrap">{fin.waterCost.toLocaleString('vi-VN')} ₫</strong>
                        </div>
                      </div>

                      {inv.editReason && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-800 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span>{t("landlordRoomDetailInvoiceEditedNotice").replace("{editedAt}", inv.editedAt || "")}</span>
                            <span className="italic block text-amber-900 font-extrabold">"{inv.editReason}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls for Invoices */}
              {totalInvoicePages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
                  <span className="text-[11px] font-bold text-zinc-500">
                    {t("landlordRoomDetailShowingItems").replace("{start}", String((invoicePage - 1) * ITEMS_PER_PAGE + 1)).replace("{end}", String(Math.min(invoicePage * ITEMS_PER_PAGE, filteredInvoices.length))).replace("{total}", String(filteredInvoices.length))}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={invoicePage === 1}
                      onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      {t("landlordRoomDetailPaginationPrev")}
                    </button>
                    {Array.from({ length: totalInvoicePages }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInvoicePage(idx + 1)}
                        className={`w-7 h-7 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                          invoicePage === idx + 1 ? 'bg-[#2AC1BC] text-white shadow-2xs' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={invoicePage === totalInvoicePages}
                      onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p + 1))}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      {t("landlordRoomDetailPaginationNext")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION: LỊCH SỬ THUÊ PHÒNG (RENTAL HISTORY - UC-L-05) */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-3.5 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="font-black text-zinc-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordRoomDetailRentalHistoryTitle").replace("{count}", String(dashboardData?.rentalHistory?.length || (room?.tenant ? 1 : 0)))}
              </h2>
              <span className="text-[10px] font-bold text-zinc-500">{t("landlordRoomDetailRentalHistorySubtitle")}</span>
            </div>

            <div className="space-y-3">
              {dashboardData && dashboardData.rentalHistory.length > 0 ? (
                dashboardData.rentalHistory.map((hist) => {
                  const isActive = hist.status === 'active';
                  return (
                    <div
                      key={hist.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive ? 'bg-[#2AC1BC]/5 border-[#2AC1BC]/30' : 'bg-zinc-50 border-zinc-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          isActive ? 'bg-[#2AC1BC] text-white' : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          {hist.primaryTenantName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-zinc-900">{hist.primaryTenantName}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                            }`}>
                              {isActive ? t("landlordRoomDetailContractActive") : t("landlordRoomDetailContractEnded")}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 font-medium mt-0.5">
                            <span>{new Date(hist.startDate).toLocaleDateString('vi-VN')} - {new Date(hist.endDate).toLocaleDateString('vi-VN')}</span>
                            {hist.primaryTenantPhone && <span className="ml-2">• {hist.primaryTenantPhone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60">
                        <span className="text-xs font-black text-[#2AC1BC]">
                          {parseInt(hist.rentPrice).toLocaleString('vi-VN')} {t("landlordRoomDetailRentPerMonth")}
                        </span>
                        <Link
                          href={`/landlord/contracts/${hist.id}`}
                          className="px-2.5 py-1 text-[11px] font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
                        >
                          {t("landlordRoomDetailViewContractShort")}
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-zinc-400 font-bold bg-zinc-50 rounded-xl">
                  {t("landlordRoomDetailNoRentalHistory")}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: LỊCH SỬ CHỐT ĐIỆN NƯỚC */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-3.5 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-100 pb-3">
              <div>
                <h2 className="font-black text-zinc-900 text-xs sm:text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordRoomDetailMeterHistoryTitle")}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium mt-0.5">{t("landlordRoomDetailMeterHistoryDesc")}</p>
              </div>

              <button
                onClick={() => setIsMeterModalOpen(true)}
                className="px-3.5 py-2 bg-[#2AC1BC] text-white text-xs font-black rounded-xl hover:bg-[#25ad87] transition-all cursor-pointer shadow-md shadow-[#2AC1BC]/20 flex items-center justify-center gap-1.5 shrink-0"
              >
                <Gauge className="w-4 h-4" /> {t("landlordRoomDetailMeterLogBtn")}
              </button>
            </div>

            <div className="space-y-3">
              {meterHistory.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-200/70 text-zinc-400 flex items-center justify-center mx-auto">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-sm text-zinc-700">{t("landlordRoomDetailNoMeterDataTitle")}</p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto font-medium">{t("landlordRoomDetailNoMeterDataDesc")}</p>
                </div>
              ) : filteredMeterHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-400 font-bold bg-zinc-50 rounded-xl">
                  {t("landlordRoomDetailNoMeterDataInFilter")}
                </div>
              ) : paginatedMeterHistory.map((item, itemIdx) => {
                const fin = computeRecordFinancials(item);
                const matchingInvoice = invoicesHistory.find(inv => inv.period === item.period);
                const isPaid = matchingInvoice?.status === "Đã thu";

                return (
                  <details key={item.id || `${item.period}-${itemIdx}`} className="group border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs" open={item.isOpen}>
                    <summary className="flex flex-wrap sm:flex-nowrap justify-between items-center p-3 sm:p-3.5 bg-zinc-50/80 hover:bg-zinc-100/80 cursor-pointer select-none outline-none transition-colors gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-black text-[#2AC1BC] uppercase tracking-wider">
                          {t("landlordRoomDetailReadingPeriod").replace("{period}", item.period)}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400">({item.date})</span>
                        {item.editReason && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded-full">
                            {t("landlordRoomDetailEditedBadge")}
                          </span>
                        )}
                        {isPaid && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded-full">
                            {t("landlordRoomDetailPaidBadge")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {isPaid ? (
                          <span
                            className="px-2.5 py-1 bg-zinc-100 text-zinc-400 border border-zinc-200 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-not-allowed select-none"
                            title={t("landlordRoomDetailLockedTooltip")}
                          >
                            {t("landlordRoomDetailLockedBadge")}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenCorrectionModal(item);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Edit className="w-3 h-3 text-amber-600" /> {t("landlordRoomDetailEditMeterBtn")}
                          </button>
                        )}
                        <span className="text-xs font-black text-zinc-900">{t("landlordRoomDetailTotalAmount")} {fin.meterTotal.toLocaleString('vi-VN')} ₫</span>
                        <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" />
                      </div>
                    </summary>

                    <div className="p-3 sm:p-4 bg-white border-t border-zinc-100 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="font-black text-xs text-zinc-900 flex items-center gap-1">{t("landlordRoomDetailElecHeader").replace("{unitPrice}", elecUnitPrice.toLocaleString('vi-VN'))}</div>
                          <span className="text-xs font-black text-zinc-900 sm:hidden">{fin.elecCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                          <span className="text-[10px] text-zinc-500 font-medium">{t("landlordRoomDetailElecStats").replace("{index}", String(item.newElec)).replace("{usage}", String(fin.elecUse))}</span>
                          <span className="hidden sm:inline font-black text-[#2AC1BC]">{fin.elecCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="font-black text-xs text-zinc-900 flex items-center gap-1">{t("landlordRoomDetailWaterHeader").replace("{unitPrice}", waterUnitPrice.toLocaleString('vi-VN'))}</div>
                          <span className="text-xs font-black text-zinc-900 sm:hidden">{fin.waterCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                          <span className="text-[10px] text-zinc-500 font-medium">{t("landlordRoomDetailWaterStats").replace("{index}", String(item.newWater)).replace("{usage}", String(fin.waterUse))}</span>
                          <span className="hidden sm:inline font-black text-[#2AC1BC]">{fin.waterCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                      </div>

                      {item.editActions && item.editActions.length > 0 ? (
                        <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-2">
                          <div className="font-bold text-amber-800 text-[11px] flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-amber-700" /> {t("landlordRoomDetailEditHistoryTitle").replace("{count}", String(item.editActions.length))}
                          </div>
                          <div className="space-y-1.5">
                            {item.editActions.map((act, actIdx) => (
                              <div key={act.id || actIdx} className="p-2 bg-white/90 border border-amber-200/70 rounded-lg text-[11px] text-amber-900 space-y-1 shadow-2xs">
                                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-500 border-b border-amber-100 pb-1">
                                  <span className="font-bold text-amber-800">{t("landlordRoomDetailEditHistoryTimes").replace("{times}", String(item.editActions!.length - actIdx))}</span>
                                  <span>{new Date(act.createdAt).toLocaleString('vi-VN')}</span>
                                </div>
                                <div className="space-y-0.5">
                                  {act.changes.map((ch, chIdx) => (
                                    <div key={chIdx} className="text-[11px]">
                                      <strong>{ch.serviceName}</strong>: {ch.oldValue !== null ? ch.oldValue : t("landlordRoomDetailNotAvailable")} ➔ <strong className="text-zinc-900">{ch.newValue}</strong> {ch.unit || ''}
                                    </div>
                                  ))}
                                </div>
                                {act.reason && (
                                  <div className="text-[10px] text-zinc-600 italic pt-0.5">
                                    {t("landlordRoomDetailEditReasonLabel")} &ldquo;{act.reason}&rdquo;
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : item.editHistory && item.editHistory.length > 0 ? (
                        <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1.5">
                          <div className="font-bold text-amber-800 text-[11px] flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-amber-700" /> {t("landlordRoomDetailEditHistorySingle")}
                          </div>
                          <div className="space-y-1">
                            {item.editHistory.map((eh, ehIdx) => (
                              <div key={eh.id || ehIdx} className="text-[11px] text-amber-900 border-b border-amber-200/50 last:border-0 pb-1 last:pb-0 flex flex-wrap justify-between gap-1">
                                <span>
                                  <strong>{eh.serviceName}</strong>: {eh.oldValue !== null ? eh.oldValue : t("landlordRoomDetailNotAvailable")} ➔ <strong className="text-zinc-900">{eh.newValue}</strong>
                                  {eh.reason && <span className="italic text-zinc-600"> &mdash; "{eh.reason}"</span>}
                                </span>
                                <span className="text-[10px] text-zinc-500">{new Date(eh.createdAt).toLocaleString('vi-VN')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : item.editReason ? (
                        <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-0.5">
                          <div className="font-bold text-amber-800 text-[11px]">{t("landlordRoomDetailEditLogTitle").replace("{editedAt}", item.editedAt || "")}</div>
                          <p className="text-[11px] text-amber-900 italic font-semibold">"{item.editReason}"</p>
                        </div>
                      ) : null}
                    </div>
                  </details>
                );
              })}

              {/* Pagination Controls for Meter History */}
              {totalMeterPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
                  <span className="text-[11px] font-bold text-zinc-500">
                    {t("landlordRoomDetailShowingMeters").replace("{start}", String((meterPage - 1) * ITEMS_PER_PAGE + 1)).replace("{end}", String(Math.min(meterPage * ITEMS_PER_PAGE, filteredMeterHistory.length))).replace("{total}", String(filteredMeterHistory.length))}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={meterPage === 1}
                      onClick={() => setMeterPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      {t("landlordRoomDetailPaginationPrev")}
                    </button>
                    {Array.from({ length: totalMeterPages }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMeterPage(idx + 1)}
                        className={`w-7 h-7 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                          meterPage === idx + 1 ? 'bg-[#2AC1BC] text-white shadow-2xs' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={meterPage === totalMeterPages}
                      onClick={() => setMeterPage(p => Math.min(totalMeterPages, p + 1))}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      {t("landlordRoomDetailPaginationNext")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BẢO TRÌ & TIỀN ĐẶT CỌC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. Quản Lý Bảo Trì */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                  <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#FF6B35]" /> {t("landlordRoomDetailMaintenanceTitle").replace("{count}", String(maintenanceHistory.length))}
                  </h2>
                  <button
                    onClick={() => setIsIncidentModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-black text-[#FF6B35] bg-[#FF6B35]/10 rounded-xl hover:bg-[#FF6B35]/20 transition-all cursor-pointer shadow-2xs"
                  >
                    {t("landlordRoomDetailReportIncidentBtn")}
                  </button>
                </div>

                <div className="space-y-3 min-h-[195px] pt-1">
                  {maintenanceHistory.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400 font-bold bg-zinc-50 rounded-xl">
                      {t("landlordRoomDetailNoMaintenance")}
                    </div>
                  ) : (
                    maintenanceHistory
                      .slice((maintPage - 1) * MAINT_PER_PAGE, maintPage * MAINT_PER_PAGE)
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border min-h-[86px] flex flex-col justify-between ${
                            item.status === 'Đang xử lý' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-50 border-zinc-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-zinc-900 line-clamp-1">{item.title}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full shrink-0 ${
                              item.status === 'Đang xử lý' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {item.status === "Đang xử lý" ? t("landlordRoomDetailMaintenanceProcessing") : t("landlordRoomDetailMaintenanceDone")}
                            </span>
                          </div>

                          {item.description ? (
                            <p className="text-[11px] text-zinc-600 font-medium leading-tight line-clamp-1 my-1">
                              {item.description}
                            </p>
                          ) : (
                            <div className="my-1"></div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold pt-0.5 border-t border-zinc-100/60">
                            <span>{item.completedDate ? t("landlordRoomDetailMaintenanceCompletedDate").replace("{date}", item.completedDate) : t("landlordRoomDetailMaintenanceReportDate").replace("{date}", item.reportDate)}</span>
                            <span className={item.priority === 'Mức độ cao' ? 'text-rose-600 font-black' : 'text-zinc-500'}>
                              {(priorityLabels[item.priority] || item.priority)}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Maintenance Pagination */}
              {Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE) > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 text-xs mt-auto">
                  <span className="text-[10px] text-zinc-400 font-bold">
                    Trang {maintPage} / {Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setMaintPage(prev => Math.max(1, prev - 1))}
                      disabled={maintPage === 1}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[10px] font-bold disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      {t("landlordRoomDetailPaginationPrev")}
                    </button>
                    <button
                      onClick={() => setMaintPage(prev => Math.min(Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE), prev + 1))}
                      disabled={maintPage === Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE)}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[10px] font-bold disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      {t("landlordRoomDetailPaginationNext")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Quản Lý Tiền Đặt Cọc */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                  <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-purple-600" /> {t("landlordRoomDetailDepositTitle")}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-full text-[10px] font-black">
                    Escrow
                  </span>
                </div>

                <div className="mt-3 p-4 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-indigo-500/10 rounded-2xl border border-purple-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider">
                      {t("landlordRoomDetailDepositSafeBadge")}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-200">
                      {currentContract?.deposit?.status === "active" ? t("landlordRoomDetailDepositLocked") : t("landlordRoomDetailDepositLabel")}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-black text-purple-700 tracking-tight">
                      {currentContract?.deposit?.amount
                        ? parseInt(currentContract.deposit.amount).toLocaleString('vi-VN')
                        : "3.000.000"}{" "}
                      <span className="text-xs">₫</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-purple-200/50 pt-2.5 text-[10px]">
                    <div className="space-y-0.5">
                      <span className="text-zinc-400 font-medium block">{t("landlordRoomDetailContractStartDate")}</span>
                      <span className="font-extrabold text-zinc-800">
                        {currentContract?.startDate
                          ? new Date(currentContract.startDate).toLocaleDateString('vi-VN')
                          : '01/01/2026'}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-zinc-400 font-medium block">{t("landlordRoomDetailContractDuration")}</span>
                      <span className="font-extrabold text-zinc-800">
                        {currentContract?.endDate
                          ? new Date(currentContract.endDate).toLocaleDateString('vi-VN')
                          : '01/01/2027'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => showToast(t("landlordRoomDetailRefundToast"), "success")}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" /> {t("landlordRoomDetailRefundDepositBtn")}
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">

          {/* COMPACT SIDEBAR 4 ROOM METRIC CARDS */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-4 space-y-3">
            <h2 className="flex items-center gap-2 font-black text-zinc-900 text-xs uppercase tracking-wider border-b border-zinc-100 pb-2">
              <Home className="w-4 h-4 text-[#2AC1BC]" /> <span>{t("landlordRoomDetailSpecsTitle").replace("{roomNumber}", room.roomNumber)}</span>
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">{t("landlordRoomDetailRentLabel")}</span>
                <div className="text-sm font-black text-[#2AC1BC]">{room.price || '3.000.000 ₫'}</div>
                <span className="text-[9px] text-zinc-500">
                  {currentContract ? t("landlordRoomDetailMonthlyDueDay").replace("{day}", String(currentContract.monthlyPaymentDate)) : t("landlordRoomDetailStartOfMonth")}
                </span>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">{t("landlordRoomDetailDepositSpecLabel")}</span>
                <div className="text-sm font-black text-purple-600">
                  {currentContract?.deposit?.amount
                    ? `${parseInt(currentContract.deposit.amount).toLocaleString('vi-VN')} ₫`
                    : '3.000.000 ₫'}
                </div>
                <span className="text-[9px] text-emerald-600 font-bold">{t("landlordRoomDetailLockDepositText")}</span>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">{t("landlordRoomDetailDebtLabel")}</span>
                <div className="text-sm font-black text-rose-600">
                  {unpaidFinancials ? `${unpaidFinancials.grandInvoiceTotal.toLocaleString('vi-VN')} ₫` : '0 ₫'}
                </div>
                <span className="text-[9px] text-rose-600 font-bold">{t("landlordRoomDetailDebtOutstanding")}</span>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase block">{t("landlordRoomDetailAreaLabel")}</span>
                <div className="text-xs font-black text-zinc-900">{room.area || '25'} m² • T{room.floor}</div>
                <span className="text-[9px] text-zinc-500">
                  {dashboardData?.room.maxOccupants ? t("landlordRoomDetailMaxOccupantsText").replace("{count}", String(dashboardData.room.maxOccupants)) : t("landlordRoomDetailBalconyText")}
                </span>
              </div>
            </div>
          </div>

          {/* Giá dịch vụ định kỳ với Badge màu sắc */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
            <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Banknote className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordRoomDetailServicesTitle")}
            </h2>
            <div className="space-y-2.5">
              {(editServices && editServices.length > 0 ? editServices : defaultRoomServices).map((service) => (
                <div key={service.id} className="flex justify-between items-center p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-zinc-800">{service.name}</span>
                    {service.isCustom && (
                      <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold">{t("landlordRoomDetailCustomServiceBadge")}</span>
                    )}
                  </div>
                  <span className="text-xs font-black text-[#2AC1BC]">
                    {service.customPrice} {service.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tiện nghi phòng */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
            {(() => {
              const amenitiesList = room.amenities || ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng'];
              return (
                <>
                  <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Sparkles className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordRoomDetailAmenitiesTitle").replace("{count}", String(amenitiesList.length))}
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {amenitiesList.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-zinc-100 text-zinc-700 border border-zinc-200/80 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        {(AMENITY_LABELS[item]?.[currentLocale === "en" ? "en" : "vi"] || item)}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Quản lý trạng thái phòng */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 space-y-4">
            <h2 className="font-black text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Building2 className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordRoomDetailRoomStatusTitle")}
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">{t("landlordRoomDetailQuickSwitchStatus")}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateStatus('Trống')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    isVacant ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {t("landlordRoomDetailStatusBtnAvailable")}
                </button>

                <button
                  onClick={() => handleUpdateStatus('Đang thuê')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    isOccupied ? 'bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {t("landlordRoomDetailStatusBtnOccupied")}
                </button>

                <button
                  onClick={() => handleUpdateStatus('Bảo trì')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    isMaintenance ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {t("landlordRoomDetailStatusBtnMaintenance")}
                </button>

                <button
                  onClick={() => handleUpdateStatus('Đặt cọc')}
                  className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    isReserved ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {t("landlordRoomDetailStatusBtnDeposited")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA SỐ ĐIỆN NƯỚC (CÓ YÊU CẦU NHẬP LÝ DO BẮT BUỘC) */}
      {correctModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setCorrectModal(prev => ({ ...prev, isOpen: false })); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">{t("landlordRoomDetailModalCorrectTitle").replace("{period}", correctModal.period)}</h2>
                  <p className="text-xs text-zinc-500 font-medium">{t("landlordRoomDetailModalCorrectDesc")}</p>
                </div>
              </div>
              <button onClick={() => setCorrectModal(prev => ({ ...prev, isOpen: false }))} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {correctModal.error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{correctModal.error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-2">
                  <label className="block text-xs font-black text-zinc-900">{t("landlordRoomDetailNewElecLabel")}</label>
                  <span className="text-[10px] text-zinc-500 block font-semibold">{t("landlordRoomDetailOldIndexLabel").replace("{index}", String(correctModal.oldElec))}</span>
                  <input
                    type="number"
                    value={correctModal.newElec}
                    onChange={(e) => setCorrectModal(prev => ({ ...prev, newElec: parseInt(e.target.value) || 0, error: "" }))}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-2">
                  <label className="block text-xs font-black text-zinc-900">{t("landlordRoomDetailNewWaterLabel")}</label>
                  <span className="text-[10px] text-zinc-500 block font-semibold">{t("landlordRoomDetailOldIndexLabel").replace("{index}", String(correctModal.oldWater))}</span>
                  <input
                    type="number"
                    value={correctModal.newWater}
                    onChange={(e) => setCorrectModal(prev => ({ ...prev, newWater: parseInt(e.target.value) || 0, error: "" }))}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-900 mb-1.5">
                  {t("landlordRoomDetailReasonRequiredLabel")}
                </label>
                <textarea
                  rows={3}
                  value={correctModal.reason}
                  onChange={(e) => setCorrectModal(prev => ({ ...prev, reason: e.target.value, error: "" }))}
                  placeholder={t("landlordRoomDetailReasonPlaceholder")}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium"
                ></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button
                onClick={handleCloseCorrectionModal}
                className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
              >{t("landlordRoomDetailModalCancelBtn")}</button>
              <button
                onClick={handleSaveCorrection}
                disabled={isSubmittingCorrection}
                className="px-6 py-2 text-xs font-black text-white bg-amber-600 rounded-xl hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingCorrection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {isSubmittingCorrection ? t("landlordRoomDetailSaving") : t("landlordRoomDetailSaveAndUpdateInvoice")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỐT SỐ ĐIỆN NƯỚC / AI OCR SỐ MỚI (UC-L-09) */}
      {isMeterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) handleCloseMeterModal(); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">{t("landlordRoomDetailModalLogMeterTitle")}</h2>
                  <p className="text-xs text-zinc-500 font-medium">{t("landlordRoomDetailModalLogMeterDesc").replace("{roomNumber}", room.roomNumber)}</p>
                </div>
              </div>
              <button onClick={handleCloseMeterModal} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">{t("landlordRoomDetailMonthLabel")}</label>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white">
                    {getAvailableMeterPeriods().monthOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">{t("landlordRoomDetailYearLabel")}</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white">
                    {getAvailableMeterPeriods().yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI OCR UPLOAD BOX */}
              <div className="p-4 bg-gradient-to-br from-[#2AC1BC]/10 to-teal-500/5 rounded-2xl border border-[#2AC1BC]/30 space-y-2 text-center">
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs text-[#2AC1BC] flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-xs font-black text-zinc-900">{t("landlordRoomDetailOcrTitle")}</h3>
                <p className="text-[10px] text-zinc-500 font-semibold">{t("landlordRoomDetailOcrDesc")}</p>
                <button
                  type="button"
                  onClick={handleSimulateAiOcr}
                  disabled={isOcrScanning}
                  className="px-4 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isOcrScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {isOcrScanning ? t("landlordRoomDetailOcrScanning") : t("landlordRoomDetailOcrUploadBtn")}
                </button>
                {ocrSuccessMsg && (
                  <p className="text-[11px] font-bold text-emerald-600 bg-white/80 p-2 rounded-xl border border-emerald-200 animate-in fade-in">
                    {ocrSuccessMsg}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-zinc-900">{t("landlordRoomDetailNewElecLabel")}</label>
                    {roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('điện'))?.lastReading && (
                      <span className="text-[10px] text-zinc-400 font-bold">
                        {t("landlordRoomDetailOldReadingPrefix")} {roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('điện'))?.lastReading?.readingValue}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={formElec}
                    placeholder={t("landlordRoomDetailElecPlaceholder")}
                    onChange={(e) => setFormElec(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-zinc-900">{t("landlordRoomDetailNewWaterLabel")}</label>
                    {roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('nước'))?.lastReading && (
                      <span className="text-[10px] text-zinc-400 font-bold">
                        {t("landlordRoomDetailOldReadingPrefix")} {roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('nước'))?.lastReading?.readingValue}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={formWater}
                    placeholder={t("landlordRoomDetailWaterPlaceholder")}
                    onChange={(e) => setFormWater(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button onClick={handleCloseMeterModal} className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer">{t("landlordRoomDetailModalCancelBtn")}</button>
              <button
                onClick={handleSaveNewMeterReading}
                disabled={isSubmittingMeter}
                className="px-6 py-2 text-xs font-black text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25ad87] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingMeter && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {isSubmittingMeter ? t("landlordRoomDetailSaving") : t("landlordRoomDetailSaveAndLogMeter")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT ROOM INFO MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) handleCloseEditModal(); }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900">{t("landlordRoomDetailModalEditRoomTitle").replace("{roomNumber}", room.roomNumber)}</h2>
                  <p className="text-xs text-zinc-500 font-medium">{t("landlordRoomDetailModalEditRoomDesc")}</p>
                </div>
              </div>
              <button onClick={handleCloseEditModal} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">{t("landlordRoomDetailRoomNumberLabel")}</label>
                  <input
                    type="text"
                    value={editRoomNumber}
                    onChange={(e) => setEditRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">{t("landlordRoomDetailRentMonthlyLabel")}</label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-[#2AC1BC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">{t("landlordRoomDetailAreaLabel")}</label>
                  <input
                    type="text"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">{t("landlordRoomDetailFloorLabel")}</label>
                  <input
                    type="text"
                    value={editFloor}
                    onChange={(e) => setEditFloor(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2">{t("landlordRoomDetailAmenitiesListLabel")}</label>
                <div className="flex flex-wrap gap-2">
                  {['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ quần áo', 'Giường', 'Kệ bếp', 'Ban công', 'WC riêng', 'Máy giặt', 'Tivi', 'Tủ lạnh', 'Bảo vệ'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setEditAmenities(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item])}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        editAmenities.includes(item)
                          ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/40 shadow-xs'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {(AMENITY_LABELS[item]?.[currentLocale === "en" ? "en" : "vi"] || item)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cấu hình dịch vụ phòng */}
              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordRoomDetailRecurringServicesTitle")}
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-medium">{t("landlordRoomDetailCustomPriceHint")}</span>
                </div>

                <div className="space-y-2.5">
                  {editServices.map((service) => (
                    <div key={service.id} className="border border-zinc-200/80 rounded-xl p-3 bg-white flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2">
                        {!service.isRemovable ? (
                          <span className="font-bold text-xs text-zinc-900">{service.name}</span>
                        ) : (
                          <input
                            type="text"
                            value={service.name}
                            onChange={(e) => setEditServices(prev => prev.map(s => s.id === service.id ? { ...s, name: e.target.value } : s))}
                            className="w-24 text-xs font-bold text-zinc-900 bg-transparent border-b border-zinc-200 focus:border-[#2AC1BC] focus:outline-none"
                            placeholder={t("landlordRoomDetailServiceNamePlaceholder")}
                          />
                        )}
                        <span className="text-[10px] text-zinc-400 font-medium">({service.unit})</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-zinc-500">{t("landlordRoomDetailCustomToggle")}</span>
                          <button
                            type="button"
                            onClick={() => setEditServices(prev => prev.map(s => s.id === service.id ? { ...s, isCustom: !s.isCustom } : s))}
                            className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer flex items-center ${service.isCustom ? 'bg-[#2AC1BC]' : 'bg-zinc-200'}`}
                          >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-transform ${service.isCustom ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                          </button>
                        </div>

                        <div className="relative w-28 flex items-center">
                          <input
                            type="text"
                            value={service.isCustom ? service.customPrice : service.defaultPrice}
                            onChange={(e) => setEditServices(prev => prev.map(s => s.id === service.id ? { ...s, customPrice: e.target.value } : s))}
                            disabled={!service.isCustom}
                            className={`w-full px-2.5 py-1 text-xs border border-zinc-200 rounded-lg font-bold ${!service.isCustom ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'text-[#2AC1BC] focus:border-[#2AC1BC] focus:outline-none'}`}
                          />
                        </div>

                        {service.isRemovable && (
                          <button
                            type="button"
                            onClick={() => setEditServices(prev => prev.filter(s => s.id !== service.id))}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setEditServices(prev => [...prev, { id: `custom_${Date.now()}`, name: '', defaultPrice: '0', customPrice: '0', unit: 'đ/tháng', isCustom: true, isRemovable: true }])}
                  className="w-full py-2 border-2 border-dashed border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:border-[#2AC1BC] hover:text-[#2AC1BC] hover:bg-[#2AC1BC]/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {t("landlordRoomDetailAddCustomService")}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">{t("landlordRoomDetailNotesLabel")}</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder={t("landlordRoomDetailNotesPlaceholder")}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                ></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button onClick={handleCloseEditModal} className="px-5 py-2 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">{t("landlordRoomDetailModalCancelBtn")}</button>
              <button
                onClick={handleSaveRoomDetails}
                className="px-6 py-2 text-sm font-black text-white bg-[#2AC1BC] rounded-xl hover:bg-[#25ad87] shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer"
              >
                {t("landlordRoomDetailSaveChangesBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BÁO SỰ CỐ BẢO TRÌ */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsIncidentModalOpen(false); }}>
          <form onSubmit={handleCreateIncidentSubmit} className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-[#FF6B35]/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF6B35] text-white rounded-xl">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">{t("landlordRoomDetailModalIncidentTitle")}</h2>
                  <p className="text-xs text-zinc-500 font-medium">{t("landlordRoomDetailModalIncidentDesc").replace("{roomNumber}", room.roomNumber)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsIncidentModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">{t("landlordRoomDetailIncidentNameLabel")}</label>
                <input
                  type="text"
                  required
                  value={incidentTitleInput}
                  onChange={(e) => setIncidentTitleInput(e.target.value)}
                  placeholder={t("landlordRoomDetailIncidentNamePlaceholder")}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">{t("landlordRoomDetailIncidentDescLabel")}</label>
                <textarea
                  rows={3}
                  value={incidentDescInput}
                  onChange={(e) => setIncidentDescInput(e.target.value)}
                  placeholder={t("landlordRoomDetailIncidentDescPlaceholder")}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-medium text-zinc-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">{t("landlordRoomDetailPriorityLabel")}</label>
                <select
                  value={incidentPriorityInput}
                  onChange={(e) => setIncidentPriorityInput(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] font-bold text-zinc-900 bg-white"
                >
                  <option value="Mức độ nhẹ">{t("landlordRoomDetailPriorityLow")}</option>
                  <option value="Mức độ trung bình">{t("landlordRoomDetailPriorityMedium")}</option>
                  <option value="Mức độ cao">{t("landlordRoomDetailPriorityHighUrgent")}</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button type="button" onClick={() => setIsIncidentModalOpen(false)} className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">{t("landlordRoomDetailModalCancelBtn")}</button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-black text-white bg-[#FF6B35] hover:bg-[#e05a2b] rounded-xl shadow-md shadow-[#FF6B35]/20 transition-all cursor-pointer"
              >
                {t("landlordRoomDetailSendIncidentBtn")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmModal(prev => ({ ...prev, isOpen: false })); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-zinc-900">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-zinc-500 font-medium">{confirmModal.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors">{t("landlordRoomDetailModalCancelBtn")}</button>
              <button onClick={confirmModal.onConfirm} className="px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs">
                {t("landlordRoomDetailDeleteBtnConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNSAVED CHANGES CONFIRMATION MODAL (RULE 10) */}
      {discardConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setDiscardConfirmModal(prev => ({ ...prev, isOpen: false })); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4 border border-zinc-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">{t("landlordRoomDetailConfirmCloseTitle")}</h3>
                <p className="text-xs text-zinc-500 font-medium">{t("landlordRoomDetailConfirmCloseDesc")}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setDiscardConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
              >
                {t("landlordRoomDetailConfirmCloseContinue")}
              </button>
              <button
                type="button"
                onClick={discardConfirmModal.onConfirm}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                {t("landlordRoomDetailConfirmCloseDiscard")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-bottom-5 ${
          toast.type === "success" ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20" : "bg-rose-600 text-white border-rose-500 shadow-rose-600/20"
        }`}>
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
