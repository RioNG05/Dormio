"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2, AlertTriangle, Edit3, X, Save, QrCode
} from "lucide-react";
import { useTranslations } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user.service";

export default function BankAccountTab() {
  const t = useTranslations("guest");
  const { isLoggedIn } = useAuth();

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankSavedSuccess, setBankSavedSuccess] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankSaveError, setBankSaveError] = useState("");

  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [bankLoadError, setBankLoadError] = useState("");

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !bankAccount.trim() || !bankAccountName.trim()) {
      setBankSaveError(t("guestProfileBankErrorIncomplete"));
      return;
    }
    setIsSavingBank(true);
    setBankSaveError("");
    try {
      await userService.upsertBankAccount({
        bankName: bankName.trim(),
        accountNumber: bankAccount.trim(),
        accountName: bankAccountName.trim().toUpperCase(),
      });
      setIsEditingBank(false);
      setBankSavedSuccess(true);
      setTimeout(() => setBankSavedSuccess(false), 3000);
    } catch {
      setBankSaveError(t("guestProfileBankErrorSaveFailed"));
    } finally {
      setIsSavingBank(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    setIsBankLoading(true);
    setBankLoadError("");
    userService.getBankAccount().then((res) => {
      if (res.bankAccount) {
        setBankName(res.bankAccount.bankName);
        setBankAccount(res.bankAccount.accountNumber);
        setBankAccountName(res.bankAccount.accountName);
      }
    }).catch(() => {
      setBankLoadError(t("guestProfileBankErrorLoadFailed"));
    }).finally(() => {
      setIsBankLoading(false);
    });
  }, [isLoggedIn]);

  return (
    <form onSubmit={handleSaveBank} className="space-y-6 animate-in fade-in duration-300">
      {/* Loading state */}
      {isBankLoading && (
        <div className="p-4 bg-zinc-100 border border-zinc-200 text-zinc-500 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-200">
          <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <span>{t("guestProfileBankLoading")}</span>
        </div>
      )}

      {/* Load error */}
      {bankLoadError && !isBankLoading && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{bankLoadError}</span>
        </div>
      )}

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
        <div className="space-y-2 pt-2">
          {bankSaveError && (
            <p className="text-xs font-bold text-red-600 text-right">{bankSaveError}</p>
          )}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => { setIsEditingBank(false); setBankSaveError(""); }}
              disabled={isSavingBank}
              className="w-full sm:w-auto px-6 py-3.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-extrabold text-xs rounded-2xl transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {t("guestProfileBtnCancel")}
            </button>
            <button
              type="submit"
              disabled={isSavingBank}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingBank ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" /><span>{t("guestProfileBankSaving")}</span></>
              ) : (
                <><Save className="w-4 h-4 shrink-0" /><span>{t("guestProfileBankBtnSave")} &rarr;</span></>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
