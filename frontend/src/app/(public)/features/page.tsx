"use client";

import React, { useState } from "react";
import {
  Building2, CreditCard, ShieldCheck, Sparkles, Zap, Smartphone,
  FileText, Users, Cpu, MessageSquare, QrCode, BarChart3, Clock, CheckCircle2,
  ArrowRight, Check, Bot, MapPin, Calculator, ShieldAlert, Scale
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function FeaturesPage() {
  const t = useTranslations("featuresPage");
  const [activeTab, setActiveTab] = useState<"bhms" | "bhrp">("bhms");

  const bhmsFeatures = [
    {
      icon: CreditCard,
      title: t("bhms1Title"),
      desc: t("bhms1Desc"),
      tag: t("bhms1Tag"),
    },
    {
      icon: Cpu,
      title: t("bhms2Title"),
      desc: t("bhms2Desc"),
      tag: t("bhms2Tag"),
    },
    {
      icon: FileText,
      title: t("bhms3Title"),
      desc: t("bhms3Desc"),
      tag: t("bhms3Tag"),
    },
    {
      icon: Users,
      title: t("bhms4Title"),
      desc: t("bhms4Desc"),
      tag: t("bhms4Tag"),
    },
    {
      icon: BarChart3,
      title: t("bhms5Title"),
      desc: t("bhms5Desc"),
      tag: t("bhms5Tag"),
    },
    {
      icon: Smartphone,
      title: t("bhms6Title"),
      desc: t("bhms6Desc"),
      tag: t("bhms6Tag"),
    }
  ];

  const bhrpFeatures = [
    {
      icon: QrCode,
      title: t("bhrp1Title"),
      desc: t("bhrp1Desc"),
      tag: t("bhrp1Tag"),
    },
    {
      icon: Scale,
      title: t("bhrp2Title"),
      desc: t("bhrp2Desc"),
      tag: t("bhrp2Tag"),
    },
    {
      icon: MapPin,
      title: t("bhrp3Title"),
      desc: t("bhrp3Desc"),
      tag: t("bhrp3Tag"),
    },
    {
      icon: ShieldCheck,
      title: t("bhrp4Title"),
      desc: t("bhrp4Desc"),
      tag: t("bhrp4Tag"),
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">

      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2AC1BC]/20 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/30 shadow-lg">
            <Sparkles className="w-4 h-4" /> {t("badge")}
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] drop-shadow-md">
            <span className="inline-block whitespace-nowrap">{t("title1")}</span> <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent inline-block whitespace-nowrap">
              {t("title2")}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto text-balance">
            {t("subtitle")}
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
              <Building2 className="w-4 h-4" /> {t("bhmsTab")}
            </button>

            <button
              onClick={() => setActiveTab("bhrp")}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === "bhrp"
                ? "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30"
                : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <QrCode className="w-4 h-4" /> {t("bhrpTab")}
            </button>
          </div>
        </div>

        {/* SECTION 1: BHMS — Color Theme: Teal #2AC1BC */}
        {activeTab === "bhms" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-3.5 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/20 uppercase inline-block whitespace-nowrap">
                {t("bhmsBadge")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-snug">
                <span className="inline-block whitespace-nowrap">{t("bhmsTitle1")}</span>{" "}
                <span className="inline-block whitespace-nowrap">{t("bhmsTitle2")}</span>
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
                      <span className="whitespace-nowrap">{t("explore")}</span>
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
                {t("bhrpBadge")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-snug">
                <span className="inline-block whitespace-nowrap">{t("bhrpTitle1")}</span>{" "}
                <span className="inline-block whitespace-nowrap">{t("bhrpTitle2")}</span>
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
                      <span className="whitespace-nowrap">{t("explore")}</span>
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
            <span className="inline-block whitespace-nowrap">{t("ctaTitle1")}</span>{" "}
            <span className="inline-block whitespace-nowrap">{t("ctaTitle2")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-medium">
            {t("ctaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register">
              <button className="px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/30 transition-all cursor-pointer hover:scale-105">
                {t("trialBtn")}
              </button>
            </Link>
            <Link href="/pricing">
              <button className="px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer">
                {t("viewPricingBtn")}
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
