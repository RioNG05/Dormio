"use client";

import React from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Star } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "@/context/LanguageContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("auth");

  return (
    <div className="flex min-h-screen bg-white">
      {/* Cột Trái: Form Auth (Flex 1 - Responsive Padding) */}
      <div className="flex flex-1 flex-col justify-between px-4 py-8 sm:px-8 lg:px-14 xl:px-16 bg-white z-10 max-w-xl mx-auto w-full lg:max-w-2xl">
        
        {/* Header Brand Logo & Language Switcher */}
        <div className="flex items-center justify-between pb-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-[#2AC1BC] flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#2AC1BC]/20">
              D
            </div>
            <span className="text-2xl font-black tracking-tight text-zinc-900">
              Dormio<span className="text-[#FF6B35]">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-extrabold text-zinc-500 hover:text-[#2AC1BC] transition-colors">
              ← {t("homeLink")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Dynamic Form Content */}
        <div className="py-4">
          {children}
        </div>

        {/* Footer Legal Note */}
        <div className="pt-6 border-t border-zinc-100 text-center sm:text-left text-[11px] text-zinc-400 font-medium">
          {t("footerLegal", { year: new Date().getFullYear() })}
        </div>
      </div>

      {/* Cột Phải: Visual Interactive Dashboard Mockup Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 bg-[#090d12] relative flex-col items-center justify-center p-12 overflow-hidden border-l border-zinc-800">
        
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2AC1BC]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF6B35]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

        {/* Showcase Glassmorphism Container */}
        <div className="relative max-w-lg w-full space-y-6">
          
          {/* Main Dashboard Room Card */}
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 p-7 rounded-3xl shadow-2xl space-y-6 text-white relative">
            
            {/* Room Status Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/20 text-[#2AC1BC] flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{t("showcaseRoomTitle")}</h3>
                  <p className="text-[11px] text-zinc-400 font-medium">{t("showcaseRoomAddress")}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/30">
                {t("showcaseStatus")}
              </span>
            </div>

            {/* 3 Metric Stat Boxes */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80 space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold block">{t("showcaseRent")}</span>
                <div className="text-base font-black text-white">4.500.000đ</div>
                <span className="text-[9px] text-emerald-400 font-extrabold block">{t("showcasePaid")}</span>
              </div>

              <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80 space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold block">{t("showcaseUtilities")}</span>
                <div className="text-base font-black text-white">680.000đ</div>
                <span className="text-[9px] text-[#2AC1BC] font-extrabold block">{t("showcaseOcr")}</span>
              </div>

              <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80 space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold block">{t("showcaseOccupancy")}</span>
                <div className="text-base font-black text-white">98.5%</div>
                <span className="text-[9px] text-[#FF6B35] font-extrabold block">{t("showcaseGrowth")}</span>
              </div>
            </div>

            {/* VietQR Auto Reconciliation Banner */}
            <div className="p-4 bg-gradient-to-r from-[#2AC1BC]/15 via-zinc-900 to-zinc-900 rounded-2xl border border-[#2AC1BC]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#2AC1BC] text-white flex items-center justify-center font-black shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{t("showcaseVietqrTitle")}</h4>
                  <p className="text-[10px] text-zinc-400 font-medium">{t("showcaseVietqrDesc")}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-lg shrink-0">
                {t("showcaseVietqrSuccess")}
              </span>
            </div>

            {/* Floating Verified Landlord Testimonial Overlay */}
            <div className="absolute -bottom-6 -right-6 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 p-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-xs animate-in fade-in duration-500">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF7B44] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                NQ
              </div>
              <div className="space-y-0.5">
                <h5 className="text-xs font-extrabold text-white">{t("showcaseTestimonialName")}</h5>
                <p className="text-[10px] text-zinc-400 font-medium">{t("showcaseTestimonialRole")}</p>
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-black pt-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span className="text-zinc-300 ml-1">{t("showcaseTestimonialQuote")}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
