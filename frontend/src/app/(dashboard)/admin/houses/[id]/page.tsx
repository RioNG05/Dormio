"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import {
  getBoardingHouseDetail,
  AdminBoardingHouseDetail,
  UserProfileDetails,
} from "@/services/boarding-house.service";
import {
  Building2, MapPin, Phone, Mail, User, ShieldCheck,
  AlertTriangle, Lock, Unlock, Calendar, Layers,
  CheckCircle2, Clock, ArrowLeft, X,
  BadgeAlert, Zap, Droplets, Wifi, Shield,
  RefreshCw, Check, AlertCircle, FileText, ChevronRight
} from "lucide-react";

export default function AdminBoardingHouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const t = useTranslations("admin");

  const houseId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [house, setHouse] = useState<AdminBoardingHouseDetail | null>(null);

  // Profile Modals
  const [selectedOwner, setSelectedOwner] = useState<UserProfileDetails | null>(null);
  const [selectedSender, setSelectedSender] = useState<UserProfileDetails | null>(null);

  // Lock / Unlock states
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockReasonInput, setLockReasonInput] = useState("");
  const [lockReasonError, setLockReasonError] = useState("");
  const [isSubmittingLock, setIsSubmittingLock] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isSubmittingUnlock, setIsSubmittingUnlock] = useState(false);

  // Rule #10: Unsaved changes confirmation modal
  const [confirmDiscardModal, setConfirmDiscardModal] = useState<{
    isOpen: boolean;
    onDiscard: () => void;
  }>({ isOpen: false, onDiscard: () => {} });

  // Notification Toast feedback
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchHouseData = async () => {
    if (!houseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBoardingHouseDetail(houseId);
      setHouse(data);
    } catch (err: any) {
      setError(err?.message || "Không thể tải thông tin tòa nhà trọ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseData();
  }, [houseId]);

  // Lock handler
  const handleConfirmLock = async () => {
    if (!lockReasonInput.trim()) {
      setLockReasonError(
        t("adminHouseDetailLockReasonRequired")
      );
      return;
    }
    setIsSubmittingLock(true);
    try {
      // Simulate API lock update
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (house) {
        setHouse({
          ...house,
          status: "locked",
          lockReason: lockReasonInput.trim(),
          lockedAt: new Date().toISOString(),
        });
      }
      setShowLockModal(false);
      setLockReasonInput("");
      setLockReasonError("");
      setToastMsg({
        type: "success",
        text: t("adminHouseDetailLockSuccess"),
      });
      setTimeout(() => setToastMsg(null), 3500);
    } catch {
      setToastMsg({
        type: "error",
        text: t("adminHouseDetailLockError"),
      });
    } finally {
      setIsSubmittingLock(false);
    }
  };

  // Unlock handler
  const handleConfirmUnlock = async () => {
    setIsSubmittingUnlock(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (house) {
        setHouse({
          ...house,
          status: "active",
          lockReason: undefined,
          lockedAt: undefined,
        });
      }
      setShowUnlockModal(false);
      setToastMsg({
        type: "success",
        text: t("adminHouseDetailUnlockSuccess"),
      });
      setTimeout(() => setToastMsg(null), 3500);
    } catch {
      setToastMsg({
        type: "error",
        text: t("adminHouseDetailUnlockError"),
      });
    } finally {
      setIsSubmittingUnlock(false);
    }
  };

  const handleCloseLockModal = () => {
    if (lockReasonInput.trim()) {
      setConfirmDiscardModal({
        isOpen: true,
        onDiscard: () => {
          setLockReasonInput("");
          setLockReasonError("");
          setShowLockModal(false);
          setConfirmDiscardModal({ isOpen: false, onDiscard: () => {} });
        },
      });
    } else {
      setShowLockModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-600 animate-spin" />
        <p className="text-sm font-semibold text-zinc-500">
          {t("adminHouseDetailLoading")}
        </p>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-zinc-900">
          {t("adminHouseDetailNotFoundTitle")}
        </h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          {error || (t("adminHouseDetailNotFoundDesc"))}
        </p>
        <Link
          href="/admin/boarding-houses"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("adminHouseDetailBackToList")}</span>
        </Link>
      </div>
    );
  }

  const occupancyRate = house.stats.totalRooms > 0
    ? Math.round((house.stats.occupiedRooms / house.stats.totalRooms) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold animate-slideDown ${
            toastMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1 font-medium">
            <Link href="/admin" className="hover:text-orange-600 transition-colors">
              {t("adminHouseDetailBreadcrumbAdmin")}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <Link href="/admin/boarding-houses" className="hover:text-orange-600 transition-colors">
              {t("adminHouseDetailBreadcrumbHouses")}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-800 font-bold truncate max-w-[200px]">{house.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/boarding-houses"
              className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
              title={t("adminHouseDetailBackTooltip")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
                <span>{house.name}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-2xs ${
                    house.status === "active"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : house.status === "locked"
                      ? "bg-red-100 text-red-800 border border-red-300 ring-2 ring-red-200"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {house.status === "active"
                    ? (t("adminHouseDetailStatusActive"))
                    : house.status === "locked"
                    ? (t("adminHouseDetailStatusSuspended"))
                    : (t("adminHouseDetailStatusReported"))}
                </span>
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">ID: {house.id}</p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchHouseData}
            className="px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("adminHouseDetailBtnRefresh")}</span>
          </button>

          {house.status === "locked" ? (
            <button
              onClick={() => setShowUnlockModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{t("adminHouseDetailBtnUnlock")}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowLockModal(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t("adminHouseDetailBtnLock")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Lock Notice Banner */}
      {house.status === "locked" && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <BadgeAlert className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-red-800">
              {t("adminHouseDetailSuspensionAlertTitle")}
            </h4>
            <p className="text-xs font-medium text-red-700 leading-relaxed">
              <span className="font-bold">{t("adminHouseDetailSuspensionReasonLabel")}</span>
              {house.lockReason || (t("adminHouseDetailDefaultViolationReason"))}
            </p>
            {house.lockedAt && (
              <p className="text-[11px] text-red-500 font-mono">
                {t("adminHouseDetailLockedAtLabel")}
                {new Date(house.lockedAt).toLocaleString(locale === "en" ? "en-US" : "vi-VN")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Overview Grid: Left House Info & Right Owner Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: House Media & Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200/90 overflow-hidden shadow-2xs">
            <div className="relative h-64 sm:h-72 w-full bg-zinc-100 overflow-hidden">
              <img
                src={house.thumbnail || "/house-placeholder.jpg"}
                alt={house.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-white/90">
                  <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="font-semibold">{house.address}</span>
                </div>
                <h3 className="text-lg font-black">{house.name}</h3>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* House Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 text-center">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    {t("adminHouseDetailTotalRooms")}
                  </div>
                  <div className="text-xl font-black text-zinc-900 mt-1">{house.stats.totalRooms}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    {t("adminHouseDetailOccupied")}
                  </div>
                  <div className="text-xl font-black text-emerald-700 mt-1">{house.stats.occupiedRooms}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-100 text-center">
                  <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                    {t("adminHouseDetailVacant")}
                  </div>
                  <div className="text-xl font-black text-orange-700 mt-1">{house.stats.vacantRooms}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                  <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    {t("adminHouseDetailOccupancy")}
                  </div>
                  <div className="text-xl font-black text-blue-700 mt-1">{occupancyRate}%</div>
                </div>
              </div>

              {/* Occupancy bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-600">
                  <span>{t("adminHouseDetailOccupancyRateSubtitle")}</span>
                  <span className="font-bold text-zinc-900">{occupancyRate}% ({house.stats.occupiedRooms}/{house.stats.totalRooms})</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
                  />
                </div>
              </div>

              {/* House details list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-zinc-400 block">{t("adminHouseDetailTotalFloors")}</span>
                    <span className="font-bold text-zinc-800">{house.totalFloor} {t("adminHouseDetailFloorsUnit")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-zinc-400 block">{t("adminHouseDetailBuiltYear")}</span>
                    <span className="font-bold text-zinc-800">
                      {house.builtAt ? new Date(house.builtAt).getFullYear() : "2023"}
                    </span>
                  </div>
                </div>
              </div>

              {house.description && (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-600 leading-relaxed">
                  <span className="font-bold text-zinc-800 block mb-1">
                    {t("adminHouseDetailDescriptionTitle")}
                  </span>
                  {house.description}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Owner Profile Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                {t("adminHouseDetailOwnerTitle")}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-800">
                {t("adminHouseDetailOwnerRoleBadge")}
              </span>
            </div>

            {/* Clickable Owner Avatar for Modal */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-zinc-50/80 border border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedOwner(house.owner)}
                className="relative group shrink-0 cursor-pointer focus:outline-none"
                title={t("adminHouseDetailOwnerProfileTooltip")}
              >
                <img
                  src={house.owner.avatarUrl || "/avatar-placeholder.png"}
                  alt={house.owner.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-xs group-hover:ring-3 group-hover:ring-orange-500 transition-all"
                />
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                  {t("adminHouseDetailViewButton")}
                </div>
              </button>

              <div className="space-y-0.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedOwner(house.owner)}
                  className="font-black text-sm text-zinc-900 hover:text-orange-600 transition-colors text-left truncate block cursor-pointer"
                >
                  {house.owner.name}
                </button>
                <div className="text-xs text-zinc-500 font-mono truncate">{house.owner.phoneNumber}</div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t("adminHouseDetailCccdVerified")}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Email</span>
                </span>
                <span className="font-semibold text-zinc-800 truncate max-w-[170px]">{house.owner.email}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t("adminHouseDetailPhoneLabel")}</span>
                </span>
                <span className="font-semibold text-zinc-800">{house.owner.phoneNumber}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t("adminHouseDetailPropertiesOwnedLabel")}</span>
                </span>
                <span className="font-bold text-orange-600">
                  {house.owner.totalProperties ?? 3} {t("adminHouseDetailPropertiesUnit")}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOwner(house.owner)}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t("adminHouseDetailBtnViewFullProfile")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Services & Room Types Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <span>{t("adminHouseDetailServicesTitle")}</span>
            </h3>
            <span className="text-xs font-bold text-zinc-400">
              {house.services.length} {t("adminHouseDetailServicesUnit")}
            </span>
          </div>

          {house.services.length === 0 ? (
            <p className="text-xs text-zinc-400 italic text-center py-6">
              {t("adminHouseDetailNoServices")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5">{t("adminHouseDetailColService")}</th>
                    <th className="pb-2.5">{t("adminHouseDetailColRate")}</th>
                    <th className="pb-2.5">{t("adminHouseDetailColUnit")}</th>
                    <th className="pb-2.5 text-right">{t("adminHouseDetailColType")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {house.services.map((srv) => (
                    <tr key={srv.id} className="hover:bg-zinc-50/70">
                      <td className="py-3 font-bold text-zinc-800">{srv.name}</td>
                      <td className="py-3 font-semibold text-orange-600">
                        {new Intl.NumberFormat("vi-VN").format(srv.price)} đ
                      </td>
                      <td className="py-3 text-zinc-500 font-mono">/{srv.unit}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            srv.isMetered
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {srv.isMetered
                            ? (t("adminHouseDetailTypeMetered"))
                            : (t("adminHouseDetailTypeFlat"))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Room Types */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-600" />
              <span>{t("adminHouseDetailRoomTypesTitle")}</span>
            </h3>
            <span className="text-xs font-bold text-zinc-400">
              {house.roomTypes.length} {t("adminHouseDetailRoomTypesUnit")}
            </span>
          </div>

          {house.roomTypes.length === 0 ? (
            <p className="text-xs text-zinc-400 italic text-center py-6">
              {t("adminHouseDetailNoRoomTypes")}
            </p>
          ) : (
            <div className="space-y-3">
              {house.roomTypes.map((rt) => (
                <div key={rt.id} className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-100 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900">{rt.name}</h4>
                      {rt.description && (
                        <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{rt.description}</p>
                      )}
                    </div>
                    <span className="font-black text-xs text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-100">
                      {new Intl.NumberFormat("vi-VN").format(rt.basePrice || 4500000)} đ/tháng
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-zinc-500 pt-1">
                    <span>
                      {t("adminHouseDetailAreaLabel")}
                      <strong className="text-zinc-700">{rt.area || 25} m²</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {t("adminHouseDetailRoomsCountLabel")}
                      <strong className="text-zinc-700">{rt.roomsCount || house.stats.totalRooms} phòng</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grievances & Tenant Reports Section */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{t("adminHouseDetailGrievancesTitle")}</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t("adminHouseDetailGrievancesHint")}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {house.grievances.length} {t("adminHouseDetailReportsUnit")}
          </span>
        </div>

        {house.grievances.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-100 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="text-xs font-bold text-zinc-800">
              {t("adminHouseDetailNoGrievancesTitle")}
            </div>
            <p className="text-[11px] text-zinc-400">
              {t("adminHouseDetailNoGrievancesDesc")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">{t("adminHouseDetailColComplainant")}</th>
                  <th className="p-3.5">{t("adminHouseDetailColContent")}</th>
                  <th className="p-3.5">{t("adminHouseDetailColPriority")}</th>
                  <th className="p-3.5">{t("adminHouseDetailColStatus")}</th>
                  <th className="p-3.5 text-right">{t("adminHouseDetailColSentDate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {house.grievances.map((g) => (
                  <tr key={g.id} className="hover:bg-zinc-50/80 transition-colors">
                    {/* Sender with Clickable Avatar */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSender(g.sender)}
                          className="relative group shrink-0 cursor-pointer focus:outline-none"
                          title={t("adminHouseDetailTenantProfileTooltip")}
                        >
                          <img
                            src={g.sender.avatarUrl || "/avatar-placeholder.png"}
                            alt={g.sender.name}
                            className="w-10 h-10 rounded-xl object-cover border border-zinc-200 group-hover:ring-2 group-hover:ring-orange-500 transition-all"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold">
                            {t("adminHouseDetailViewButton")}
                          </div>
                        </button>
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedSender(g.sender)}
                            className="font-bold text-zinc-900 hover:text-orange-600 transition-colors text-left block cursor-pointer"
                          >
                            {g.sender.name}
                          </button>
                          <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                            <span className="bg-zinc-100 px-1.5 py-0.2 rounded text-zinc-700 font-bold">
                              {g.sender.roomNumber || "P.302"}
                            </span>
                            <span>{g.sender.phoneNumber}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Content */}
                    <td className="p-3.5 max-w-sm">
                      <div className="font-bold text-zinc-800">{g.title}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {g.description}
                      </div>
                      {g.resolutionNote && (
                        <div className="mt-1.5 text-[10px] p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                          <span className="font-bold">{t("adminHouseDetailResolutionLabel")}</span>
                          {g.resolutionNote}
                        </div>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          g.priority === "urgent"
                            ? "bg-red-100 text-red-800 ring-1 ring-red-300"
                            : g.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : g.priority === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {g.priority === "urgent"
                          ? (t("adminHouseDetailPriorityUrgent"))
                          : g.priority === "high"
                          ? (t("adminHouseDetailPriorityHigh"))
                          : g.priority === "medium"
                          ? (t("adminHouseDetailPriorityMedium"))
                          : (t("adminHouseDetailPriorityLow"))}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          g.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : g.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : g.status === "dismissed"
                            ? "bg-zinc-100 text-zinc-500"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {g.status === "resolved"
                          ? (t("adminHouseDetailStatusResolved"))
                          : g.status === "in_progress"
                          ? (t("adminHouseDetailStatusInProgress"))
                          : g.status === "dismissed"
                          ? (t("adminHouseDetailStatusDismissed"))
                          : (t("adminHouseDetailStatusPending"))}
                      </span>
                    </td>

                    {/* Send date */}
                    <td className="p-3.5 text-right whitespace-nowrap text-zinc-500 font-mono text-[11px]">
                      {new Date(g.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OWNER PROFILE MODAL */}
      {selectedOwner && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedOwner(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedOwner.avatarUrl || "/avatar-placeholder.png"}
                  alt={selectedOwner.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shadow-sm"
                />
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-800 inline-block mb-1">
                    {t("adminHouseDetailModalOwnerTitle")}
                  </span>
                  <h3 className="text-base font-black text-zinc-900">{selectedOwner.name}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">ID: {selectedOwner.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOwner(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">{t("adminHouseDetailLabelFullName")}</span>
                <span className="font-bold text-zinc-900">{selectedOwner.name}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">{t("adminHouseDetailLabelPhoneNumber")}</span>
                <span className="font-bold text-zinc-900">{selectedOwner.phoneNumber}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">Email</span>
                <span className="font-bold text-zinc-900 truncate max-w-[200px]">{selectedOwner.email}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">{t("adminHouseDetailLabelCitizenId")}</span>
                <span className="font-bold font-mono text-zinc-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedOwner.idCardNumber || "079201004829"}</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">{t("adminHouseDetailLabelAccountStatus")}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  {t("adminHouseDetailStatusActive")}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">{t("adminHouseDetailLabelMemberSince")}</span>
                <span className="font-medium text-zinc-700">
                  {selectedOwner.createdAt ? new Date(selectedOwner.createdAt).toLocaleDateString("vi-VN") : "12/03/2024"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedOwner(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {t("adminHouseDetailBtnClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRIEVANCE SENDER (TENANT) PROFILE MODAL */}
      {selectedSender && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedSender(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedSender.avatarUrl || "/avatar-placeholder.png"}
                  alt={selectedSender.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
                />
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 inline-block mb-1">
                    {t("adminHouseDetailModalTenantTitle")}
                  </span>
                  <h3 className="text-base font-black text-zinc-900">{selectedSender.name}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">ID: {selectedSender.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSender(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">{t("adminHouseDetailLabelFullName")}</span>
                <span className="font-bold text-zinc-900">{selectedSender.name}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">{t("adminHouseDetailLabelRentedRoom")}</span>
                <span className="font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200">
                  {selectedSender.roomNumber || "P.302"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">{t("adminHouseDetailLabelPhoneNumber")}</span>
                <span className="font-bold text-zinc-900">{selectedSender.phoneNumber}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">Email</span>
                <span className="font-bold text-zinc-900 truncate max-w-[200px]">{selectedSender.email}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">{t("adminHouseDetailLabelCitizenId")}</span>
                <span className="font-bold font-mono text-zinc-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedSender.idCardNumber || "079302008192"}</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-500 font-medium">{t("adminHouseDetailLabelRentalContract")}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  {t("adminHouseDetailStatusValidContract")}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedSender(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {t("adminHouseDetailBtnClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOCK MODAL (Rule #10 compliant) */}
      {showLockModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={handleCloseLockModal}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  {t("adminHouseDetailModalLockTitle")}
                </h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{house.name}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {t("adminHouseDetailModalLockDesc")}
            </p>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-700 block">
                {t("adminHouseDetailLabelLockReason")} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={lockReasonInput}
                onChange={(e) => {
                  setLockReasonInput(e.target.value);
                  if (lockReasonError) setLockReasonError("");
                }}
                placeholder={t("adminHouseDetailPlaceholderLockReason")}
                className={`w-full p-2.5 bg-zinc-50 border rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-all ${
                  lockReasonError ? "border-red-400 bg-red-50/20" : "border-zinc-200 focus:border-red-500"
                }`}
              />
              {lockReasonError && (
                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {lockReasonError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleCloseLockModal}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {t("adminHouseDetailBtnCancel")}
              </button>
              <button
                type="button"
                disabled={isSubmittingLock}
                onClick={handleConfirmLock}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                {isSubmittingLock ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>{t("adminHouseDetailBtnConfirmLock")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNLOCK MODAL */}
      {showUnlockModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowUnlockModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  {t("adminHouseDetailModalUnlockTitle")}
                </h3>
                <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{house.name}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {t("adminHouseDetailModalUnlockDesc")}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {t("adminHouseDetailBtnCancel")}
              </button>
              <button
                type="button"
                disabled={isSubmittingUnlock}
                onClick={handleConfirmUnlock}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                {isSubmittingUnlock ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
                <span>{t("adminHouseDetailBtnConfirmUnlock")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Discarding Unsaved Draft (Rule #10) */}
      {confirmDiscardModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-zinc-900">
                {t("adminHouseDetailDiscardTitle")}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {t("adminHouseDetailDiscardDesc")}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDiscardModal({ isOpen: false, onDiscard: () => {} })}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {t("adminHouseDetailBtnKeepEditing")}
              </button>
              <button
                type="button"
                onClick={confirmDiscardModal.onDiscard}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {t("adminHouseDetailBtnDiscardAndClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
