"use client";

import React from "react";
import Link from "next/link";
import {
  Building2, Home, MapPin, ExternalLink, Phone, FileText
} from "lucide-react";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/utils";

export default function RoleDataTab() {
  const t = useTranslations("guest");
  const { currentLocale } = useLanguage();
  const { user } = useAuth();

  const isLandlord = user?.role === "landlord";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {isLandlord ? (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900">{user?.houseName || t("guestProfileLandlordMockHouseName")}</h3>
                <p className="text-xs text-zinc-500 font-medium">{user?.houseAddress || t("guestProfileLandlordMockHouseAddress")}</p>
              </div>
            </div>

            <Link href="/landlord" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FF6B35] hover:bg-[#ff5518] text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-[#FF6B35]/20 hover:scale-105 whitespace-nowrap shrink-0">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{t("guestProfileOpenDashboard")} &rarr;</span>
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("guestProfileLandlordManagedRooms")}</span>
              <span className="text-lg font-black text-zinc-900 block">{t("guestProfileLandlordRoomsCount", { count: 10 })}</span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("guestProfileLandlordRevenueMonth")}</span>
              <span className="text-lg font-black text-[#2AC1BC] block">{formatCurrency(45000000, currentLocale)}</span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("guestProfileLandlordSubscription")}</span>
              <span className="text-xs font-black text-emerald-600 block uppercase">{t("guestProfileLandlordProTier")}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
          {/* Header CTA to Jump to Tenant Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-5 gap-4">
            <div className="space-y-1.5">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-full text-xs font-black whitespace-nowrap inline-block">
                {t("guestProfileTenantRoomActive")}
              </span>

              {/* Room Name with clear vertical spacing */}
              <h3 className="text-2xl font-black text-zinc-900 pt-1">
                {t("guestProfileTenantMockRoomTitle")}
              </h3>

              {/* Clickable Address with Google Maps Integration */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent("123 Nguyen Hue Ben Nghe District 1 HCMC")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#2AC1BC] hover:text-[#23B3AE] hover:underline inline-flex items-center gap-1.5 bg-[#2AC1BC]/10 px-3 py-1.5 rounded-xl border border-[#2AC1BC]/20 transition-all"
                >
                  <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                  <span>{t("guestProfileTenantMockRoomAddress")}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#2AC1BC] ml-1 shrink-0" />
                </a>
              </div>
            </div>

            {/* Direct Jump Button to Tenant Dashboard (whitespace-nowrap) */}
            <Link href="/tenant" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 py-3.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0">
                <Home className="w-4 h-4 shrink-0" />
                <span>{t("guestProfileTenantRoomDashboard")} &rarr;</span>
              </button>
            </Link>
          </div>

          {/* Lease Details Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("guestProfileTenantMonthlyRent")}</span>
              <span className="text-xl font-black text-rose-500 block">
                {formatCurrency(4500000, currentLocale)}{t("guestProfileTenantPerMonth")}
              </span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("guestProfileTenantDepositEscrow")}</span>
              <span className="text-xl font-black text-[#2AC1BC] block">{formatCurrency(1000000, currentLocale)}</span>
              <span className="text-[9px] text-emerald-600 font-bold block">{t("guestProfileTenantContractEscrowProtected")}</span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("guestProfileTenantContractTerm")}</span>
              <span className="text-sm font-black text-zinc-900 block">01/01/2026 - 31/12/2026</span>
              <span className="text-[9px] text-zinc-500 font-bold block">
                {t("guestProfileTenantContractDuration", { stayed: 8, total: 12, percent: 66 })}
              </span>
            </div>
          </div>

          {/* Lease Progress Bar */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2">
            <div className="flex flex-col sm:flex-row justify-between text-xs font-bold text-zinc-700 gap-1">
              <span>{t("guestProfileTenantContractProgress")}</span>
              <span>{t("guestProfileTenantContractRemaining", { percent: 66, months: 4 })}</span>
            </div>
            <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#2AC1BC] rounded-full" style={{ width: "66%" }} />
            </div>
          </div>

          {/* Landlord Contact & Contract Export */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 text-white rounded-3xl space-y-4 shadow-xl border border-zinc-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-white">{t("guestProfileLandlordManager")}</h4>
                <p className="text-xs text-zinc-400 font-medium">
                  {t("guestProfileLandlordContractInfo", { name: t("guestProfileLandlordMockName"), phone: "0901.234.567" })}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <a
                  href="tel:0901234567"
                  className="px-4 py-2.5 bg-[#FF6B35] hover:bg-[#ff5518] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#FF6B35]/20 inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("guestProfileCallLandlord")}</span>
                </a>

                <button
                  type="button"
                  onClick={() => alert(t("guestProfileAlertDownloadPdf"))}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-xs rounded-xl transition-all border border-zinc-700 inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileText className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                  <span>{t("guestProfileDownloadContractPdf")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
