"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Phone, Mail, ShieldCheck, Camera, Lock,
  Building, CreditCard, UserCheck, Building2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";

import PersonalInfoTab from "./tabs/PersonalInfoTab";
import RoleDataTab from "./tabs/RoleDataTab";
import BankAccountTab from "./tabs/BankAccountTab";
import SecurityTab from "./tabs/SecurityTab";

function UniversalProfilePage() {
  const t = useTranslations("guest");
  const { isLoggedIn, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab value derived from URL param
  type TabKey = "info" | "role_data" | "bank" | "security";
  const TAB_PARAM_MAP: Record<string, TabKey> = {
    "personal-info": "info",
    "role": "role_data",
    "bank": "bank",
    "security": "security",
  };
  const TAB_URL_MAP: Record<TabKey, string> = {
    info: "personal-info",
    role_data: "role",
    bank: "bank",
    security: "security",
  };
  const rawTab = searchParams.get("tab") ?? "personal-info";
  const activeTab: TabKey = TAB_PARAM_MAP[rawTab] ?? "info";

  const setActiveTab = (tab: TabKey) => {
    router.push(`/profile?tab=${TAB_URL_MAP[tab]}`, { scroll: false });
  };

  const isLandlord = user?.role === "landlord";
  const isAdmin = user?.role === "admin";
  const isTenant = !isLandlord && !isAdmin;

  const fullName = user?.name || t("guestProfileDefaultFullName");
  const phone = user?.phone || "0987.654.321";
  const email = user?.email || "nguyenvana@gmail.com";

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center shadow-inner">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black text-zinc-900">{t("guestProfileLockTitle")}</h2>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            {t("guestProfileLockDesc")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="px-6 py-3 bg-[#2AC1BC] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/20 whitespace-nowrap">
            {t("guestProfileLockLoginBtn")} &rarr;
          </Link>
          <Link href="/register" className="px-6 py-3 bg-zinc-900 text-white font-extrabold text-xs rounded-2xl whitespace-nowrap">
            {t("guestProfileLockRegisterBtn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">

        {/* Top Profile Banner Hero Spotlight */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 rounded-3xl p-5 sm:p-8 text-white shadow-2xl border border-zinc-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2AC1BC]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Image with Edit Badge */}
              <div className="relative group shrink-0">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
                  alt={fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-[#2AC1BC] shadow-xl group-hover:opacity-90 transition-opacity"
                />
                <button
                  title={t("guestProfileAvatarChangeTooltip")}
                  className="absolute bottom-1 right-1 p-2 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white rounded-xl shadow-lg transition-transform hover:scale-110 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 bg-[#2AC1BC]/20 text-[#2AC1BC] text-[10px] font-black rounded-full border border-[#2AC1BC]/30 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                    <ShieldCheck className="w-3.5 h-3.5" /> {t("guestProfileEkycVerifiedBadge")}
                  </span>

                  <span className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider whitespace-nowrap ${isLandlord ? 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30' :
                      isAdmin ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                    {isLandlord && t("guestProfileRoleLandlord")}
                    {isTenant && t("guestProfileRoleTenant")}
                    {isAdmin && t("guestProfileRoleAdmin")}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white">{fullName}</h1>
                <p className="text-xs text-zinc-400 font-medium">{t("guestProfileHeroSubtitle")}</p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 pt-1 text-xs text-zinc-300 font-semibold">
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone className="w-3.5 h-3.5 text-[#2AC1BC]" /> {phone}</span>
                  <span className="hidden sm:inline text-zinc-600">•</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Mail className="w-3.5 h-3.5 text-[#2AC1BC]" /> {email}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 100% Mobile & Desktop Responsive Tab Navigation Bar (Balanced 2-Line Phrases on Mobile, Single Line on Desktop) */}
        <div className="w-full border-b border-zinc-200 pb-3">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2 w-full">

            {/* Tab 1 */}
            <button
              onClick={() => setActiveTab("info")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${activeTab === "info"
                  ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>
                <span className="block sm:inline">{t("guestProfileTabInfo1")}</span>
                <span className="block sm:inline">{t("guestProfileTabInfo2")}</span>
              </span>
            </button>

            {/* Tab 2 */}
            <button
              onClick={() => setActiveTab("role_data")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${activeTab === "role_data"
                  ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                }`}
            >
              {isLandlord ? <Building2 className="w-4 h-4 shrink-0" /> : <Building className="w-4 h-4 shrink-0" />}
              <span>
                {isLandlord ? (
                  <>
                    <span className="block sm:inline">{t("guestProfileTabLandlordRole1")}</span>
                    <span className="block sm:inline">{t("guestProfileTabLandlordRole2")}</span>
                  </>
                ) : (
                  <>
                    <span className="block sm:inline">{t("guestProfileTabTenantRole1")}</span>
                    <span className="block sm:inline">{t("guestProfileTabTenantRole2")}</span>
                  </>
                )}
              </span>
            </button>

            {/* Tab 3 */}
            <button
              onClick={() => setActiveTab("bank")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${activeTab === "bank"
                  ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>
                <span className="block sm:inline">{t("guestProfileTabBank1")}</span>
                <span className="block sm:inline">{t("guestProfileTabBank2")}</span>
              </span>
            </button>

            {/* Tab 4 */}
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${activeTab === "security"
                  ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/20"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                <span className="block sm:inline">{t("guestProfileTabSecurity1")}</span>
                <span className="block sm:inline">{t("guestProfileTabSecurity2")}</span>
              </span>
            </button>

          </div>
        </div>

        {/* Render Tab Contents */}
        {activeTab === "info" && <PersonalInfoTab />}
        {activeTab === "role_data" && <RoleDataTab />}
        {activeTab === "bank" && <BankAccountTab />}
        {activeTab === "security" && <SecurityTab />}

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8 text-xs font-bold text-zinc-400">Loading profile...</div>}>
      <UniversalProfilePage />
    </React.Suspense>
  );
}