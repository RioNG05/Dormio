"use client";

import React, { useState } from "react";
import {
  CheckCircle2, KeyRound, X, Eye, EyeOff
} from "lucide-react";
import { useTranslations } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function SecurityTab() {
  const t = useTranslations("guest");
  const { user } = useAuth();

  const phone = user?.phone || "0987.654.321";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSavedSuccess, setPasswordSavedSuccess] = useState(false);

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

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

  return (
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
                    className={`h-full rounded-full transition-all ${newPassword.length > 8 ? "bg-emerald-500 w-full" : "bg-amber-500 w-1/2"
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
  );
}
