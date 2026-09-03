"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, Phone, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const t = useTranslations("auth");

  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    // Register user as platform tenant account by default
    login({
      name: fullName || "Dormio User",
      email: method === "email" ? email : `${phone}@dormio.vn`,
      phone: method === "phone" ? phone : undefined,
      role: "tenant",
    });

    router.push("/");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Badge */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-[#FF6B35] text-[11px] font-black rounded-full border border-rose-200 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 fill-[#FF6B35]" /> {t("registerBadge")}
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          {t("registerHeading")}
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          {t("registerSubheading")}
        </p>
      </div>

      {/* Input Method Selector Tabs (Phone vs Email) */}
      <div className="flex p-1 bg-zinc-100/80 rounded-2xl border border-zinc-200/60">
        <button
          type="button"
          onClick={() => setMethod("phone")}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            method === "phone" ? "bg-white text-[#2AC1BC] shadow-xs" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Phone className="w-3.5 h-3.5" /> {t("phoneMethod")}
        </button>
        <button
          type="button"
          onClick={() => setMethod("email")}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            method === "email" ? "bg-white text-[#2AC1BC] shadow-xs" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Mail className="w-3.5 h-3.5" /> {t("emailMethod")}
        </button>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider block">{t("fullNameLabel")}</label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
            />
          </div>
        </div>

        {/* Phone or Email based on selected method */}
        {method === "phone" ? (
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider block">{t("phoneLabel")}</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="0987 654 321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider block">{t("emailLabel")}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="nguyenvana@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
              />
            </div>
          </div>
        )}

        {/* Password Field */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider block">{t("passwordLabel")}</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider block">{t("confirmPasswordLabel")}</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 accent-[#2AC1BC] rounded cursor-pointer shrink-0"
          />
          <label htmlFor="terms" className="text-xs text-zinc-600 font-medium cursor-pointer">
            {t("agreeTerms")}{" "}
            <Link href="/terms" className="font-extrabold text-[#2AC1BC] hover:underline">
              {t("termsLink")}
            </Link>{" "}
            {t("andWord")}{" "}
            <Link href="/privacy" className="font-extrabold text-[#2AC1BC] hover:underline">
              {t("privacyLink")}
            </Link>.
          </label>
        </div>

        {/* Submit CTA Button */}
        <button
          type="submit"
          disabled={!agreed}
          className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#2AC1BC]/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
        >
          <span>{t("registerSubmit")}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </form>

      {/* Social Register Options */}
      <div className="space-y-3 pt-2">
        <div className="relative flex items-center justify-center">
          <div className="border-t border-zinc-100 w-full" />
          <span className="bg-white px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider absolute">{t("orLoginWith")}</span>
        </div>

        <button
          type="button"
          onClick={() => {
            login({ name: "Google User", email: "user@google.com", role: "tenant" });
            router.push("/");
          }}
          className="w-full py-3 px-4 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span className="font-black text-rose-500 text-sm">G</span> {t("loginGoogle")}
        </button>
      </div>

      {/* Bottom Auth Navigation Link */}
      <div className="text-center text-xs text-zinc-500 font-medium pt-2">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-extrabold text-[#2AC1BC] hover:underline">
          {t("loginNow")}
        </Link>
      </div>

    </div>
  );
}
