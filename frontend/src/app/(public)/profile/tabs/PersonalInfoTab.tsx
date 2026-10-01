"use client";

import React, { useState } from "react";
import {
  ShieldCheck, CheckCircle2, Edit3, Save, X, AlertTriangle, Upload
} from "lucide-react";
import { useTranslations } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function PersonalInfoTab() {
  const t = useTranslations("guest");
  const { user } = useAuth();

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoSavedSuccess, setInfoSavedSuccess] = useState(false);

  const [fullName, setFullName] = useState(user?.name || t("guestProfileDefaultFullName"));
  const [phone, setPhone] = useState(user?.phone || "0987.654.321");
  const [email, setEmail] = useState(user?.email || "nguyenvana@gmail.com");
  const [dob, setDob] = useState("15/08/2002");
  const [identityCard, setIdentityCard] = useState("079202012345");
  const [idIssueDate, setIdIssueDate] = useState("12/04/2023");
  const [idIssuePlace, setIdIssuePlace] = useState(t("guestProfileDefaultIdIssuePlace"));
  const [address, setAddress] = useState(t("guestProfileDefaultAddress"));
  const [cccdEdited, setCccdEdited] = useState(false);

  const [emergencyName, setEmergencyName] = useState(t("guestProfileDefaultEmergencyName"));
  const [emergencyPhone, setEmergencyPhone] = useState("0912.345.678");

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingInfo(false);
    setInfoSavedSuccess(true);
    setTimeout(() => setInfoSavedSuccess(false), 3000);
  };

  return (
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
        {/* Card Header with Edit Buttons */}
        <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-zinc-900">{t("guestProfileInfoSectionTitle")}</h3>
            <p className="text-xs text-zinc-500 font-medium">{t("guestProfileInfoSectionSub")}</p>
          </div>

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
  );
}
