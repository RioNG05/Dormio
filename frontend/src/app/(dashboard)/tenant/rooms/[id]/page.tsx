"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building,
  MapPin,
  Phone,
  Calendar,
  Zap,
  Droplets,
  Wifi,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileSignature,
  Home,
  User,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils";
import { api } from "@/services/api";

interface TenancyApiResponse {
  success: boolean;
  data: {
    contract: {
      id: string;
      startDate: string;
      endDate: string;
      rentPrice: number;
      monthlyPaymentDate: number;
      depositAmount: number;
      note?: string;
    };
    room: {
      id: string;
      roomNumber: string;
      floor: number;
      area?: number;
      maxOccupants?: number;
      roomTypeName?: string;
    };
    boardingHouse: {
      id: string;
      name: string;
      address: string;
      landlord: {
        name: string;
        phoneNumber: string;
        email?: string;
      };
    };
    services: Array<{
      id: string;
      name: string;
      price: number;
      unit: string;
      isMetered: boolean;
    }>;
  } | null;
}

export default function TenantRoomDetailPage() {
  const t = useTranslations("tenantPortal");
  const { locale } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [tenancyData, setTenancyData] = useState<TenancyApiResponse["data"] | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDetails() {
      try {
        const response = await api.get<TenancyApiResponse>("/v1/tenant/tenancy", { silent: true });
        if (isMounted && response?.data) {
          setTenancyData(response.data);
        }
      } catch (err) {
        // Fallback demo handled below
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#2AC1BC] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-zinc-500 font-medium">{t("tenantLoadingRoomDetails")}</span>
      </div>
    );
  }

  if (!tenancyData || !tenancyData.room) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-16 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 mb-4">
          <Home className="w-8 h-8" />
        </div>
        <h2 className="text-lg sm:text-xl font-black text-zinc-900">
          {t("tenantRoomNotFoundTitle")}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
          {t("tenantRoomNotFoundDesc")}
        </p>
        <div className="pt-4">
          <Link
            href="/tenant"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("tenantBackToDashboard")}</span>
          </Link>
        </div>
      </div>
    );
  }

  const room = tenancyData.room;
  const house = tenancyData.boardingHouse || {
    id: "bh-unknown",
    name: t("tenantFallbackBuildingName"),
    address: t("tenantFallbackAddress"),
    landlord: {
      name: t("tenantFallbackLandlord"),
      phoneNumber: t("tenantFallbackNotUpdated"),
    },
  };
  const contract = tenancyData.contract || {
    id: "HD-PENDING",
    startDate: "",
    endDate: "",
    rentPrice: 0,
    monthlyPaymentDate: 5,
    depositAmount: 0,
    note: "",
  };
  const services = tenancyData.services || [];

  const getServiceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("điện") || lower.includes("electric")) return <Zap className="w-5 h-5 text-amber-500" />;
    if (lower.includes("nước") || lower.includes("water")) return <Droplets className="w-5 h-5 text-sky-500" />;
    if (lower.includes("mạng") || lower.includes("wifi") || lower.includes("internet")) return <Wifi className="w-5 h-5 text-indigo-500" />;
    return <Trash2 className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb / Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/tenant"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-zinc-200/80 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-[#2AC1BC]" />
          <span>{t("tenantBackToDashboard")}</span>
        </Link>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          {t("tenantActiveTenancyBadge")}
        </span>
      </div>

      {/* Main Room Spotlight Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#2AC1BC]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#2AC1BC]/20 text-[#2AC1BC] text-[11px] font-black rounded-full border border-[#2AC1BC]/30 uppercase tracking-wider">
                {room.roomTypeName || "Studio"}
              </span>
              <span className="text-xs text-zinc-400 font-semibold">
                {t("tenantFloorLabel", { floor: room.floor })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span>{room.roomNumber}</span>
              <span className="text-lg sm:text-xl font-normal text-zinc-400">| {house.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
              <span>{house.address}</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 space-y-1 sm:text-right shrink-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              {t("tenantMonthlyRent")}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#2AC1BC]">
              {formatCurrency(contract.rentPrice)}
            </div>
            <span className="text-[11px] text-zinc-400 block font-medium">
              {t("tenantRentDueOnDay", { day: contract.monthlyPaymentDate })}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Content: Details & Amenities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Room Specifications & Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Specs Card */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-5">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide flex items-center gap-2">
                <Home className="w-4 h-4 text-[#2AC1BC]" />
                {t("tenantRoomSpecifications")}
              </h3>
              <span className="text-xs font-bold text-zinc-500">ID: {room.id}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                  {t("tenantFloorArea")}
                </span>
                <span className="text-sm font-black text-zinc-900 block">{room.area || 25} m²</span>
              </div>
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                  {t("tenantMaxOccupants")}
                </span>
                <span className="text-sm font-black text-zinc-900 block">{t("tenantOccupantsCount", { count: room.maxOccupants || 2 })}</span>
              </div>
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                  {t("tenantFloorLevel")}
                </span>
                <span className="text-sm font-black text-zinc-900 block">{t("tenantFloorLabel", { floor: room.floor })}</span>
              </div>
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                  {t("tenantDeposit")}
                </span>
                <span className="text-sm font-black text-emerald-600 block">{formatCurrency(contract.depositAmount)}</span>
              </div>
            </div>
          </div>

          {/* Connected Services */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2AC1BC]" />
                {t("tenantRegisteredServices")}
              </h3>
              <span className="text-xs text-zinc-400 font-semibold">{t("tenantActiveServices", { count: services.length })}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((svc) => (
                <div key={svc.id} className="p-4 bg-zinc-50 hover:bg-zinc-100/80 rounded-2xl border border-zinc-200/60 flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-zinc-200/60">
                      {getServiceIcon(svc.name)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-800">{svc.name}</p>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {svc.isMetered ? t("tenantServiceMetered") : t("tenantServiceFixed")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-zinc-900">{formatCurrency(svc.price)}</p>
                    <span className="text-[10px] text-zinc-400">/{svc.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Landlord & Quick Links */}
        <div className="space-y-6">
          {/* Landlord Contact Card */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
              {t("tenantRoleLandlord")}
            </h3>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2AC1BC] to-teal-400 text-white font-black text-base flex items-center justify-center shadow-md shadow-[#2AC1BC]/20">
                {(house.landlord?.name || "C").charAt(0)}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-zinc-900">{house.landlord?.name || t("tenantFallbackLandlord")}</h4>
                <p className="text-xs text-zinc-500 font-medium">{house.landlord?.phoneNumber || t("tenantFallbackNotUpdated")}</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`tel:${house.landlord.phoneNumber}`}
                className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#ff5518] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#FF6B35]/20 flex items-center justify-center gap-2 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t("tenantCallLandlord")}</span>
              </a>
              <Link
                href="/tenant/messages"
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <span>{t("tenantChatInPortal")}</span>
              </Link>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-zinc-700">
              {t("tenantRelatedActions")}
            </h4>
            <div className="space-y-2">
              <Link
                href="/tenant/invoices"
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-200/60 hover:border-[#2AC1BC] text-xs font-bold text-zinc-700 hover:text-[#2AC1BC] transition-colors"
              >
                <span>{t("tenantViewMonthlyInvoices")}</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
              <Link
                href="/tenant/complaints"
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-200/60 hover:border-[#2AC1BC] text-xs font-bold text-zinc-700 hover:text-[#2AC1BC] transition-colors"
              >
                <span>{t("tenantReportIssueOrRepair")}</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}