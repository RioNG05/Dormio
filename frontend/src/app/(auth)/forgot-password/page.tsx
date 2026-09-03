"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Phone, Mail, Sparkles, ArrowRight, CheckCircle2
} from "lucide-react";
import { useTranslations } from "@/context/LanguageContext";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountIdentifier) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Badge */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-[11px] font-black rounded-full border border-[#2AC1BC]/30 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 fill-[#2AC1BC]" /> {t("forgotBadge")}
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          {t("forgotHeading")}
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          {t("forgotSubheading")}
        </p>
      </div>

      {submitted ? (
        <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-200 text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900">{t("forgotSuccessTitle")}</h3>
            <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
              {t("forgotSuccessMsg")}
            </p>
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-2.5 bg-zinc-900 text-white font-extrabold text-xs rounded-xl hover:bg-zinc-800 transition-all cursor-pointer shadow-md"
          >
            {t("forgotSubmit")}
          </button>
        </div>
      ) : (
        <>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                {method === "phone" ? t("phoneLabel") : t("emailLabel")}
              </label>
              <div className="relative">
                {method === "phone" ? (
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                ) : (
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                )}
                <input
                  type={method === "phone" ? "tel" : "email"}
                  required
                  placeholder={method === "phone" ? "0987 654 321" : "nguyenvana@gmail.com"}
                  value={accountIdentifier}
                  onChange={(e) => setAccountIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#2AC1BC]/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] mt-2"
            >
              <span>{t("forgotSubmit")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </>
      )}

      {/* Bottom Auth Navigation Link */}
      <div className="text-center text-xs text-zinc-500 font-medium pt-2">
        <Link href="/login" className="font-extrabold text-[#2AC1BC] hover:underline">
          ← {t("backToLogin")}
        </Link>
      </div>

    </div>
  );
}
