"use client";

import React, { useState } from "react";
import {
  Building2, CreditCard, ShieldCheck, Sparkles, Smartphone,
  FileText, Users, Cpu, QrCode, BarChart3,
  ArrowRight, MapPin, Scale
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@/context/LanguageContext";

export default function FeaturesPage() {
  const t = useTranslations("guest");
  const [activeTab, setActiveTab] = useState<"bhms" | "bhrp">("bhms");

  const bhmsFeatures = [
    {
      icon: CreditCard,
      title: t("guestFeaturesBhms1Title"),
      desc: t("guestFeaturesBhms1Desc"),
      tag: t("guestFeaturesBhms1Tag"),
    },
    {
      icon: Cpu,
      title: t("guestFeaturesBhms2Title"),
      desc: t("guestFeaturesBhms2Desc"),
      tag: t("guestFeaturesBhms2Tag"),
    },
    {
      icon: FileText,
      title: t("guestFeaturesBhms3Title"),
      desc: t("guestFeaturesBhms3Desc"),
      tag: t("guestFeaturesBhms3Tag"),
    },
    {
      icon: Users,
      title: t("guestFeaturesBhms4Title"),
      desc: t("guestFeaturesBhms4Desc"),
      tag: t("guestFeaturesBhms4Tag"),
    },
    {
      icon: BarChart3,
      title: t("guestFeaturesBhms5Title"),
      desc: t("guestFeaturesBhms5Desc"),
      tag: t("guestFeaturesBhms5Tag"),
    },
    {
      icon: Smartphone,
      title: t("guestFeaturesBhms6Title"),
      desc: t("guestFeaturesBhms6Desc"),
      tag: t("guestFeaturesBhms6Tag"),
    }
  ];

  const bhrpFeatures = [
    {
      icon: QrCode,
      title: t("guestFeaturesBhrp1Title"),
      desc: t("guestFeaturesBhrp1Desc"),
      tag: t("guestFeaturesBhrp1Tag"),
    },
    {
      icon: Scale,
      title: t("guestFeaturesBhrp2Title"),
      desc: t("guestFeaturesBhrp2Desc"),
      tag: t("guestFeaturesBhrp2Tag"),
    },
    {
      icon: MapPin,
      title: t("guestFeaturesBhrp3Title"),
      desc: t("guestFeaturesBhrp3Desc"),
      tag: t("guestFeaturesBhrp3Tag"),
    },
    {
      icon: ShieldCheck,
      title: t("guestFeaturesBhrp4Title"),
      desc: t("guestFeaturesBhrp4Desc"),
      tag: t("guestFeaturesBhrp4Tag"),
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">

      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2AC1BC]/20 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/30 shadow-lg">
            <Sparkles className="w-4 h-4" /> {t("guestFeaturesBadge")}
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] drop-shadow-md">
            <span className="inline-block whitespace-nowrap">{t("guestFeaturesTitle1")}</span> <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent inline-block whitespace-nowrap">
              {t("guestFeaturesTitle2")}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto text-balance">
            {t("guestFeaturesSubtitle")}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-12">

        {/* Exactly 2 Main Section Tabs Switcher (Responsive Mobile Stack) */}
        <div className="flex justify-center w-full">
          <div className="flex flex-col sm:flex-row p-2 sm:p-1.5 bg-zinc-100 rounded-3xl border border-zinc-200/80 max-w-xl w-full gap-2 sm:gap-0">
            <button
              onClick={() => setActiveTab("bhms")}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === "bhms"
                ? "bg-[#2AC1BC] text-white shadow-lg shadow-[#2AC1BC]/30"
                : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <Building2 className="w-4 h-4" /> {t("guestFeaturesBhmsTab")}
            </button>

            <button
              onClick={() => setActiveTab("bhrp")}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === "bhrp"
                ? "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30"
                : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <QrCode className="w-4 h-4" /> {t("guestFeaturesBhrpTab")}
            </button>
          </div>
        </div>

        {/* SECTION 1: BHMS — Color Theme: Teal #2AC1BC */}
        {activeTab === "bhms" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-3.5 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/20 uppercase inline-block whitespace-nowrap">
                {t("guestFeaturesBhmsBadge")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-snug">
                <span className="inline-block whitespace-nowrap">{t("guestFeaturesBhmsTitle1")}</span>{" "}
                <span className="inline-block whitespace-nowrap">{t("guestFeaturesBhmsTitle2")}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bhmsFeatures.map((feat, idx) => {
                const Icon = feat.icon;

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-8 border border-[#2AC1BC]/20 hover:border-[#2AC1BC] shadow-xs hover:shadow-xl hover:shadow-[#2AC1BC]/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6 group cursor-pointer"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#2AC1BC]/10 text-[#2AC1BC] whitespace-nowrap">
                          {feat.tag}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-zinc-900 group-hover:text-[#2AC1BC] transition-colors leading-snug">
                        {feat.title}
                      </h3>

                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-[#2AC1BC]">
                      <span className="whitespace-nowrap">{t("guestFeaturesExplore")}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: BHRP — Color Theme: Orange #FF6B35 */}
        {activeTab === "bhrp" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-3.5 py-1 bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-black rounded-full border border-[#FF6B35]/20 uppercase inline-block whitespace-nowrap">
                {t("guestFeaturesBhrpBadge")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-snug">
                <span className="inline-block whitespace-nowrap">{t("guestFeaturesBhrpTitle1")}</span>{" "}
                <span className="inline-block whitespace-nowrap">{t("guestFeaturesBhrpTitle2")}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {bhrpFeatures.map((feat, idx) => {
                const Icon = feat.icon;

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-7 sm:p-8 border border-[#FF6B35]/20 hover:border-[#FF6B35] shadow-xs hover:shadow-xl hover:shadow-[#FF6B35]/15 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6 group cursor-pointer"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#FF6B35]/10 text-[#FF6B35] whitespace-nowrap">
                          {feat.tag}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-zinc-900 group-hover:text-[#FF6B35] transition-colors leading-snug">
                        {feat.title}
                      </h3>

                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-[#FF6B35]">
                      <span className="whitespace-nowrap">{t("guestFeaturesExplore")}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom CTA Registration Banner */}
        <div className="bg-zinc-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl border border-zinc-800 mt-12">
          <h2 className="text-2xl sm:text-4xl font-black text-white leading-snug">
            <span className="inline-block whitespace-nowrap">{t("guestFeaturesCtaTitle1")}</span>{" "}
            <span className="inline-block whitespace-nowrap">{t("guestFeaturesCtaTitle2")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-medium">
            {t("guestFeaturesCtaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register">
              <button className="px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/30 transition-all cursor-pointer hover:scale-105">
                {t("guestFeaturesTrialBtn")}
              </button>
            </Link>
            <Link href="/pricing">
              <button className="px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer">
                {t("guestFeaturesViewPricingBtn")}
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
