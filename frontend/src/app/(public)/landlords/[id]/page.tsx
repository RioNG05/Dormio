"use client";

import React from "react";
import Link from "next/link";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, Building2, CheckCircle2, Phone, Mail, MapPin } from "lucide-react";

export default function LandlordProfilePublicPage() {
  const t = useTranslations("landlordProfile");
  const tNav = useTranslations("nav");
  const { locale } = useLanguage();

  return (
    <div className="min-h-[70vh] bg-zinc-50/50 py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/rooms"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#2AC1BC] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {locale === "en" ? "Back to room search" : "Quay lại tìm phòng"}
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black text-2xl shrink-0">
              <Building2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("verifiedBadge")}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900">
                {t("title")}
              </h1>
              <p className="text-xs text-zinc-500">
                {locale === "en"
                  ? "Verified landlord operating on the Dormio SaaS platform."
                  : "Chủ nhà trọ chính chủ đã kiểm duyệt danh tính trên nền tảng Dormio."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-100 text-center">
            <div className="p-4 bg-zinc-50 rounded-2xl">
              <div className="text-xs text-zinc-400 font-medium">{t("totalProperties")}</div>
              <div className="text-lg font-black text-zinc-900 mt-1">2</div>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl">
              <div className="text-xs text-zinc-400 font-medium">{t("totalRooms")}</div>
              <div className="text-lg font-black text-zinc-900 mt-1">28</div>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl col-span-2 sm:col-span-1">
              <div className="text-xs text-zinc-400 font-medium">{locale === "en" ? "Rating" : "Đánh giá"}</div>
              <div className="text-lg font-black text-amber-500 mt-1">4.9 ★</div>
            </div>
          </div>

          <div className="pt-2 flex justify-center sm:justify-start">
            <Link
              href="/rooms"
              className="px-6 py-2.5 bg-[#2AC1BC] hover:bg-[#23a8a3] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {t("listedRooms")} &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}