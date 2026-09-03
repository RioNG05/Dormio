"use client";

import React, { useState } from "react";
import { Save, User, Building, Lock, CheckCircle2 } from "lucide-react";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<"building" | "account" | "security">("building");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{t("savedSuccess")}</span>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("building")}
            className={`px-6 py-3 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "building"
                ? "text-[#2AC1BC] border-b-2 border-[#2AC1BC] bg-[#2AC1BC]/5"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <Building className="w-4 h-4" /> {t("tabBuildingInfo")}
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`px-6 py-3 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "account"
                ? "text-[#2AC1BC] border-b-2 border-[#2AC1BC] bg-[#2AC1BC]/5"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <User className="w-4 h-4" /> {t("tabAccount")}
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-6 py-3 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "security"
                ? "text-[#2AC1BC] border-b-2 border-[#2AC1BC] bg-[#2AC1BC]/5"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <Lock className="w-4 h-4" /> {t("tabSecurity")}
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">
                {t("brandName")}
              </label>
              <input
                type="text"
                defaultValue="Dormio Apartments"
                className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">
                {t("phoneContact")}
              </label>
              <input
                type="text"
                defaultValue="0988777666"
                className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC]"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-zinc-700">
                {t("headquartersAddress")}
              </label>
              <input
                type="text"
                defaultValue="123 Nguyễn Văn Linh, Đà Nẵng"
                className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC]"
              />
            </div>
            <div className="space-y-2 md:col-span-2 border-t border-zinc-200 pt-6">
              <label className="text-sm font-bold text-zinc-700">
                {t("bankInfoLabel")}
              </label>
              <textarea
                rows={3}
                defaultValue={`Ngân hàng Vietcombank\nSTK: 0123456789\nChủ TK: Nguyễn Văn Rio`}
                className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/20 focus:border-[#2AC1BC]"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#2AC1BC] hover:bg-[#23a8a3] rounded-lg shadow-sm shadow-[#2AC1BC]/20 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" /> {t("btnSaveSettings")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
