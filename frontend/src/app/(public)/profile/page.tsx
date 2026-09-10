"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  User, Phone, Mail, MapPin, ShieldCheck, Camera, CheckCircle2, Lock, 
  Building, Calendar, CreditCard, Sparkles, Save, Edit3, KeyRound, QrCode, 
  ExternalLink, Eye, EyeOff, UserCheck, AlertCircle, Building2, Home, X, Upload, 
  FileText, Download, Check, AlertTriangle, RefreshCw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils";

export default function UniversalProfilePage() {
  const t = useTranslations("guest");
  const { currentLocale } = useLanguage();
  const { isLoggedIn, user } = useAuth();

  const [activeTab, setActiveTab] = useState<"info" | "role_data" | "bank" | "security">("info");
  
  // Tab 1 Edit Mode
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoSavedSuccess, setInfoSavedSuccess] = useState(false);

  // Tab 3 Edit Mode
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankSavedSuccess, setBankSavedSuccess] = useState(false);

  // Personal Info Form States
  const [fullName, setFullName] = useState(user?.name || t("guestProfileDefaultFullName"));
  const [phone, setPhone] = useState(user?.phone || "0987.654.321");
  const [email, setEmail] = useState(user?.email || "nguyenvana@gmail.com");
  const [dob, setDob] = useState("15/08/2002");
  const [identityCard, setIdentityCard] = useState("079202012345");
  const [idIssueDate, setIdIssueDate] = useState("12/04/2023");
  const [idIssuePlace, setIdIssuePlace] = useState(t("guestProfileDefaultIdIssuePlace"));
  const [address, setAddress] = useState(t("guestProfileDefaultAddress"));
  const [cccdEdited, setCccdEdited] = useState(false);

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState(t("guestProfileDefaultEmergencyName"));
  const [emergencyPhone, setEmergencyPhone] = useState("0912.345.678");

  // Bank Info for VietQR
  const [bankName, setBankName] = useState("TPBank");
  const [bankAccount, setBankAccount] = useState("0987654321");
  const [bankAccountName, setBankAccountName] = useState((user?.name || "NGUYEN VAN A").toUpperCase());

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSavedSuccess, setPasswordSavedSuccess] = useState(false);

  // Forgot Password Flow States
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const isLandlord = user?.role === "landlord";
  const isAdmin = user?.role === "admin";
  const isTenant = !isLandlord && !isAdmin;

  // Save Personal Info
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingInfo(false);
    setInfoSavedSuccess(true);
    setTimeout(() => setInfoSavedSuccess(false), 3000);
  };

  // Save Bank Info
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingBank(false);
    setBankSavedSuccess(true);
    setTimeout(() => setBankSavedSuccess(false), 3000);
  };

  // Save Password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(t("guestProfileAlertPasswordMismatch"));
      return;
    }
    setPasswordSavedSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSavedSuccess(false), 3000);
  };

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

                  <span className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider whitespace-nowrap ${
                    isLandlord ? 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30' :
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
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${
                activeTab === "info"
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
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${
                activeTab === "role_data"
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
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${
                activeTab === "bank"
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
              className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-center sm:text-left leading-tight ${
                activeTab === "security"
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

        {/* TAB 1: PERSONAL INFO & EKYC */}
        {activeTab === "info" && (
          <form onSubmit={handleSaveInfo} className="space-y-6 animate-in fade-in duration-300">
            
            {/* Success Toast Banner */}
            {infoSavedSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t("guestProfileInfoSuccess")}</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
              
              {/* Card Header with Edit Buttons (NO TEXT WRAPPING) */}
              <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-zinc-900">{t("guestProfileInfoSectionTitle")}</h3>
                  <p className="text-xs text-zinc-500 font-medium">{t("guestProfileInfoSectionSub")}</p>
                </div>

                {/* EDIT BUTTONS INSIDE TAB 1 (whitespace-nowrap) */}
                {!isEditingInfo ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0"
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    <span>{t("guestProfileInfoEditBtn")}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(false)}
                      className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <X className="w-4 h-4 shrink-0" /> {t("guestProfileBtnCancelShort")}
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 hover:scale-105 whitespace-nowrap shrink-0"
                    >
                      <Save className="w-4 h-4 shrink-0" /> {t("guestProfileBtnSaveDraft")}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{t("guestProfileInfoFullNameLabel")}</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{t("guestProfileInfoPhoneLabel")}</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{t("guestProfileInfoEmailLabel")}</label>
                  <input
                    type="email"
                    disabled={!isEditingInfo}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{t("guestProfileInfoDobLabel")}</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">{t("guestProfileInfoAddressLabel")}</label>
                <input
                  type="text"
                  disabled={!isEditingInfo}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Editable eKYC CCCD Card Box */}
            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-5">
              <div className="border-b border-zinc-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#2AC1BC] shrink-0" />
                  <h3 className="text-base font-black text-zinc-900">{t("guestProfileEkycSectionTitle")}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap ${
                  cccdEdited 
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30' 
                    : 'bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/30'
                }`}>
                  {cccdEdited ? t("guestProfileEkycPending") : t("guestProfileEkycAiVerified")}
                </span>
              </div>

              {/* Warning when editing CCCD */}
              {isEditingInfo && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t("guestProfileEkycNotice")}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">{t("guestProfileIdCardNumLabel")}</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={identityCard}
                    onChange={(e) => {
                      setIdentityCard(e.target.value);
                      setCccdEdited(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black text-zinc-900 font-mono focus:outline-none focus:border-[#2AC1BC] disabled:opacity-80"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">{t("guestProfileIdCardDateLabel")}</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={idIssueDate}
                    onChange={(e) => {
                      setIdIssueDate(e.target.value);
                      setCccdEdited(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-80"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">{t("guestProfileIdCardPlaceLabel")}</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={idIssuePlace}
                    onChange={(e) => {
                      setIdIssuePlace(e.target.value);
                      setCccdEdited(true);
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-80"
                  />
                </div>
              </div>

              {/* Front and Back Upload Simulation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2 text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-zinc-700">{t("guestProfileEkycFront")}</span>
                    {isEditingInfo && (
                      <span className="text-[10px] font-bold text-[#2AC1BC] cursor-pointer hover:underline flex items-center gap-1 whitespace-nowrap">
                        <Upload className="w-3 h-3 shrink-0" /> {t("guestProfileUploadNewPhoto")}
                      </span>
                    )}
                  </div>
                  <div className="aspect-[16/10] bg-zinc-200 rounded-xl overflow-hidden relative group border border-zinc-300">
                    <img
                      src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80"
                      alt={t("guestProfileEkycFront")}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-md whitespace-nowrap">
                      {t("guestProfileEkycFaceMatched")}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2 text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-zinc-700">{t("guestProfileEkycBack")}</span>
                    {isEditingInfo && (
                      <span className="text-[10px] font-bold text-[#2AC1BC] cursor-pointer hover:underline flex items-center gap-1 whitespace-nowrap">
                        <Upload className="w-3 h-3 shrink-0" /> {t("guestProfileUploadNewPhoto")}
                      </span>
                    )}
                  </div>
                  <div className="aspect-[16/10] bg-zinc-200 rounded-xl overflow-hidden relative group border border-zinc-300">
                    <img
                      src="https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80"
                      alt={t("guestProfileEkycBack")}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-md whitespace-nowrap">
                      {t("guestProfileEkycFingerprintValid")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Emergency Contact */}
            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-5">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-base font-black text-zinc-900">{t("guestProfileEmergencySectionTitle")}</h3>
                <p className="text-xs text-zinc-500 font-medium">{t("guestProfileEmergencySectionSub")}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{t("guestProfileEmergencyNameLabel")}</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{t("guestProfileEmergencyPhoneLabel")}</label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Action Button when Editing */}
            {isEditingInfo && (
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-extrabold text-xs rounded-2xl transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t("guestProfileBtnCancel")}
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{t("guestProfileBtnSaveProfile")} &rarr;</span>
                </button>
              </div>
            )}

          </form>
        )}

        {/* TAB 2: RENTED ROOM & CONTRACTS */}
        {activeTab === "role_data" && (
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
        )}

        {/* TAB 3: VIETQR BANK ACCOUNT */}
        {activeTab === "bank" && (
          <form onSubmit={handleSaveBank} className="space-y-6 animate-in fade-in duration-300">
            
            {/* Success Toast */}
            {bankSavedSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t("guestProfileBankSuccess")}</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
              
              <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-zinc-900">{t("guestProfileBankSectionTitle")}</h3>
                  <p className="text-xs text-zinc-500 font-medium">{t("guestProfileBankSectionSub")}</p>
                </div>

                {/* EDIT BUTTONS INSIDE TAB 3 (whitespace-nowrap) */}
                {!isEditingBank ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingBank(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0"
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    <span>{t("guestProfileBankEditBtn")}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingBank(false)}
                      className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <X className="w-4 h-4 shrink-0" /> {t("guestProfileBtnCancelShort")}
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 hover:scale-105 whitespace-nowrap shrink-0"
                    >
                      <Save className="w-4 h-4 shrink-0" /> {t("guestProfileBankBtnSave")}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">{t("guestProfileBankNameLabel")}</label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">{t("guestProfileBankAccNumLabel")}</label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">{t("guestProfileBankAccNameLabel")}</label>
                    <input
                      type="text"
                      disabled={!isEditingBank}
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC] disabled:opacity-75 uppercase"
                    />
                  </div>
                </div>

                {/* Live VietQR Card Preview */}
                <div className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-3xl border border-zinc-800 space-y-4 text-center shadow-xl relative overflow-hidden w-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#2AC1BC]/10 rounded-full blur-xl" />
                  <QrCode className="w-16 h-16 text-[#2AC1BC] mx-auto relative z-10 animate-pulse" />
                  <div className="relative z-10">
                    <h4 className="text-sm font-black text-white">{bankName || t("guestProfileBankCardNameDefault")}</h4>
                    <p className="text-lg font-black text-[#2AC1BC] font-mono tracking-widest mt-1">{bankAccount || "0000000000"}</p>
                    <p className="text-xs text-zinc-400 uppercase font-bold mt-1">{bankAccountName || t("guestProfileBankCardHolderDefault")}</p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/30 relative z-10 whitespace-nowrap">
                    {t("guestProfileBankAutoGenerated")}
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Save Action Button when Editing Bank */}
            {isEditingBank && (
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBank(false)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-extrabold text-xs rounded-2xl transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t("guestProfileBtnCancel")}
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{t("guestProfileBankBtnSave")} &rarr;</span>
                </button>
              </div>
            )}

          </form>
        )}

        {/* TAB 4: SECURITY & PASSWORD */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Password Toast Success */}
            {passwordSavedSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t("guestProfilePasswordSuccess")}</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6 w-full">
              
              <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-zinc-900">{t("guestProfilePasswordSectionTitle")}</h3>
                  <p className="text-xs text-zinc-500 font-medium">{t("guestProfilePasswordSectionSub")}</p>
                </div>
                
                {/* Forgot Password Trigger Button (whitespace-nowrap) */}
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(!isForgotPasswordOpen)}
                  className="text-xs font-extrabold text-[#2AC1BC] hover:underline cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("guestProfilePasswordForgot")}</span>
                </button>
              </div>

              {/* Forgot Password Recovery Accordion Panel */}
              {isForgotPasswordOpen && (
                <div className="p-5 bg-zinc-900 text-white rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                      <h4 className="text-xs font-black text-white">{t("guestProfileOtpModalTitle")}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(false)}
                      className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {!otpSent ? (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-300 font-medium">
                        {t("guestProfileOtpPrompt")}<strong className="text-[#2AC1BC]">{phone}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => setOtpSent(true)}
                        className="px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <span>{t("guestProfileOtpSendBtn")}</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  ) : !otpVerified ? (
                    <div className="space-y-3">
                      <p className="text-xs text-emerald-400 font-bold">
                        {t("guestProfileOtpSentSuccess", { phone })}
                      </p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-black tracking-widest text-center text-white focus:outline-none focus:border-[#2AC1BC]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (otpCode.length === 6) {
                              setOtpVerified(true);
                            } else {
                              alert(t("guestProfileAlertOtpDigits"));
                            }
                          }}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {t("guestProfileOtpConfirmBtn")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>{t("guestProfileOtpConfirmed")}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPasswordOpen(false);
                          setOtpSent(false);
                          setOtpVerified(false);
                        }}
                        className="underline text-white text-[10px] whitespace-nowrap ml-2 cursor-pointer"
                      >
                        {t("guestProfileBtnClose")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Password Change Form */}
              <form onSubmit={handleSavePassword} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{t("guestProfilePasswordCurrentLabel")}</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{t("guestProfilePasswordNewLabel")}</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            newPassword.length > 8 ? "bg-emerald-500 w-full" : "bg-amber-500 w-1/2"
                          }`} 
                        />
                      </div>
                      <span className="text-[10px] font-extrabold text-zinc-500 whitespace-nowrap">
                        {newPassword.length > 8 ? t("guestProfilePasswordStrengthStrong") : t("guestProfilePasswordStrengthMedium")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{t("guestProfilePasswordConfirmLabel")}</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] whitespace-nowrap"
                  >
                    <span>{t("guestProfilePasswordBtnSave")}</span>
                    <span>&rarr;</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}