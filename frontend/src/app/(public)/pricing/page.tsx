"use client";

import React, { useState } from "react";
import {
  Check, X, Sparkles, Building2, QrCode, HelpCircle, ChevronDown,
  CreditCard, Cpu, FileText, Users, BarChart3, Smartphone,
  Scale, MapPin, ShieldCheck, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function PricingPage() {
  const { currentLocale } = useLanguage();
  const t = useTranslations("guest");

  // Shared tab — controls both features & pricing sections simultaneously
  const [activeSection, setActiveSection] = useState<"bhms" | "bhrp">("bhms");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const discountRate = billingCycle === "yearly" ? 0.8 : 1.0;

  // ── Feature data ──────────────────────────────────────────────────────────
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
    },
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
    },
  ];

  // ── Pricing plan data ─────────────────────────────────────────────────────
  const bhmsPlans = [
    {
      name: t("guestPricingFreePlanName"),
      priceMonthly: 0,
      description: t("guestPricingFreePlanDesc"),
      features: [
        t("guestPricingFreeF1"),
        t("guestPricingFreeF2"),
        t("guestPricingFreeF3"),
        t("guestPricingFreeF4"),
      ],
      notIncluded: [
        t("guestPricingFreeN1"),
        t("guestPricingFreeN2"),
        t("guestPricingFreeN3"),
      ],
      cta: t("guestPricingFreeCta"),
      popular: false,
    },
    {
      name: t("guestPricingProPlanName"),
      priceMonthly: 199000,
      description: t("guestPricingProPlanDesc"),
      features: [
        t("guestPricingProF1"),
        t("guestPricingProF2"),
        t("guestPricingProF3"),
        t("guestPricingProF4"),
        t("guestPricingProF5"),
        t("guestPricingProF6"),
      ],
      notIncluded: [t("guestPricingProN1")],
      cta: t("guestPricingProCta"),
      popular: true,
    },
    {
      name: t("guestPricingEntPlanName"),
      priceMonthly: 499000,
      description: t("guestPricingEntPlanDesc"),
      features: [
        t("guestPricingEntF1"),
        t("guestPricingEntF2"),
        t("guestPricingEntF3"),
        t("guestPricingEntF4"),
        t("guestPricingEntF5"),
        t("guestPricingEntF6"),
      ],
      notIncluded: [],
      cta: t("guestPricingEntCta"),
      popular: false,
    },
  ];

  const bhrpPlans = [
    {
      name: t("guestPricingStdListingName"),
      priceMonthly: 0,
      description: t("guestPricingStdListingDesc"),
      features: [
        t("guestPricingStdF1"),
        t("guestPricingStdF2"),
        t("guestPricingStdF3"),
        t("guestPricingStdF4"),
      ],
      notIncluded: [
        t("guestPricingStdN1"),
        t("guestPricingStdN2"),
        t("guestPricingStdN3"),
      ],
      cta: t("guestPricingStdCta"),
      popular: false,
    },
    {
      name: t("guestPricingVipGoldName"),
      priceMonthly: 199000,
      description: t("guestPricingVipGoldDesc"),
      features: [
        t("guestPricingVipGoldF1"),
        t("guestPricingVipGoldF2"),
        t("guestPricingVipGoldF3"),
        t("guestPricingVipGoldF4"),
        t("guestPricingVipGoldF5"),
      ],
      notIncluded: [t("guestPricingVipGoldN1")],
      cta: t("guestPricingVipGoldCta"),
      popular: true,
    },
    {
      name: t("guestPricingVipDiamondName"),
      priceMonthly: 499000,
      description: t("guestPricingVipDiamondDesc"),
      features: [
        t("guestPricingVipDiamondF1"),
        t("guestPricingVipDiamondF2"),
        t("guestPricingVipDiamondF3"),
        t("guestPricingVipDiamondF4"),
        t("guestPricingVipDiamondF5"),
      ],
      notIncluded: [],
      cta: t("guestPricingVipDiamondCta"),
      popular: false,
    },
  ];

  const faqs = [
    { q: t("guestPricingFaq1Q"), a: t("guestPricingFaq1A") },
    { q: t("guestPricingFaq2Q"), a: t("guestPricingFaq2A") },
    { q: t("guestPricingFaq3Q"), a: t("guestPricingFaq3A") },
  ];

  // Derived helpers
  const isBhms = activeSection === "bhms";
  const accentColor = isBhms ? "#2AC1BC" : "#FF6B35";

  const currentFeatures = isBhms ? bhmsFeatures : bhrpFeatures;
  const currentPlans = isBhms ? bhmsPlans : bhrpPlans;

  const formatPrice = (n: number) =>
    n.toLocaleString(currentLocale === "en" ? "en-US" : "vi-VN");

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2AC1BC]/20 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/30 shadow-lg">
            <Sparkles className="w-4 h-4" /> {t("guestPricingBadge")}
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] drop-shadow-md">
            <span className="inline-block whitespace-nowrap">{t("guestPricingTitle1")}</span>{" "}
            <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent inline-block whitespace-nowrap">
              {t("guestPricingTitle2")}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto text-balance">
            {t("guestPricingSubtitle")}
          </p>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-20">

        {/* ── Shared Tab Switcher (controls both Features & Pricing) ───────── */}
        <div className="flex justify-center w-full">
          <div className="flex flex-col sm:flex-row p-2 sm:p-1.5 bg-zinc-100 rounded-3xl border border-zinc-200/80 max-w-xl w-full gap-2 sm:gap-0">
            <button
              id="tab-bhms"
              onClick={() => setActiveSection("bhms")}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${isBhms ? "bg-[#2AC1BC] text-white shadow-lg shadow-[#2AC1BC]/30" : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <Building2 className="w-4 h-4" /> {t("guestFeaturesBhmsTab")}
            </button>

            <button
              id="tab-bhrp"
              onClick={() => setActiveSection("bhrp")}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${!isBhms ? "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30" : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <QrCode className="w-4 h-4" /> {t("guestFeaturesBhrpTab")}
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1 — PRICING
        ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-8 animate-in fade-in duration-300">
          {/* Section header + billing toggle */}
          <div className="flex flex-col items-center gap-6">
            <div className="text-center max-w-2xl space-y-2">
              <span
                className="px-3.5 py-1 text-xs font-black rounded-full border uppercase inline-block whitespace-nowrap"
                style={{ backgroundColor: `${accentColor}1A`, color: accentColor, borderColor: `${accentColor}33` }}
              >
                {isBhms ? t("guestPricingBhmsBadge") : t("guestPricingBhrpBadge")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-snug">
                {isBhms ? (
                  <>
                    <span className="inline-block whitespace-nowrap">{t("guestPricingBhmsTitle1")}</span>{" "}
                    <span className="inline-block whitespace-nowrap">{t("guestPricingBhmsTitle2")}</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block whitespace-nowrap">{t("guestPricingBhrpTitle1")}</span>{" "}
                    <span className="inline-block whitespace-nowrap">{t("guestPricingBhrpTitle2")}</span>
                  </>
                )}
              </h2>
            </div>

            {/* Billing cycle toggle */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-2 sm:p-1.5 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs font-bold w-full sm:w-auto">
              <button
                id="billing-monthly"
                onClick={() => setBillingCycle("monthly")}
                className={`w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl transition-all cursor-pointer ${billingCycle === "monthly" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                  }`}
              >
                {t("guestPricingPayMonthly")}
              </button>
              <button
                id="billing-yearly"
                onClick={() => setBillingCycle("yearly")}
                className={`w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${billingCycle === "yearly" ? "bg-zinc-900 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                  }`}
              >
                <span>{t("guestPricingPayYearly")}</span>
                <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full uppercase">
                  {t("guestPricingSave20")}
                </span>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {currentPlans.map((plan, idx) => {
              const finalPrice = Math.round(plan.priceMonthly * discountRate);
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between space-y-6 relative cursor-pointer ${plan.popular ? "-translate-y-2" : "hover:shadow-md"
                    }`}
                  style={
                    plan.popular
                      ? {
                        borderColor: accentColor,
                        boxShadow: `0 20px 40px ${accentColor}26`,
                        outline: `2px solid ${accentColor}33`,
                      }
                      : { borderColor: "#e4e4e7" }
                  }
                >
                  {plan.popular && (
                    <span
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-md whitespace-nowrap"
                      style={{ backgroundColor: accentColor }}
                    >
                      {isBhms ? t("guestPricingMostPopular") : t("guestPricingBhrp3xViews")}
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-zinc-900">{plan.name}</h3>
                      <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="py-2 border-y border-zinc-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black" style={{ color: accentColor }}>
                          {finalPrice === 0 ? "0 ₫" : `${formatPrice(finalPrice)} ₫`}
                        </span>
                        <span className="text-xs text-zinc-400 font-bold">{t("guestPricingMonth")}</span>
                      </div>
                      {billingCycle === "yearly" && finalPrice > 0 && (
                        <span className="text-[10px] font-bold block mt-0.5" style={{ color: isBhms ? "#059669" : "#d97706" }}>
                          {t("guestPricingYearlyPayNote")}: {formatPrice(finalPrice * 12)} ₫ {t("guestPricingYear")}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider block">
                        {isBhms ? t("guestPricingIncluded") : t("guestPricingBhrpIncluded")}
                      </span>
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs font-semibold text-zinc-700">
                          <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentColor }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                      {plan.notIncluded.map((feat, nIdx) => (
                        <div key={nIdx} className="flex items-start gap-2 text-xs font-medium text-zinc-400 opacity-60">
                          <X className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                          <span className="line-through">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link href="/register" className="pt-4">
                    <button
                      className="w-full py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md text-white"
                      style={
                        plan.popular
                          ? { backgroundColor: accentColor }
                          : { backgroundColor: "#18181b" }
                      }
                      onMouseEnter={e => {
                        if (plan.popular) (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
                        else (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#27272a";
                      }}
                      onMouseLeave={e => {
                        if (plan.popular) (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                        else (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#18181b";
                      }}
                    >
                      {plan.cta} &rarr;
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2 — FEATURES
        ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-8 animate-in fade-in duration-300">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span
              className="px-3.5 py-1 text-xs font-black rounded-full border uppercase inline-block whitespace-nowrap"
              style={{ backgroundColor: `${accentColor}1A`, color: accentColor, borderColor: `${accentColor}33` }}
            >
              {isBhms ? t("guestFeaturesBhmsBadge") : t("guestFeaturesBhrpBadge")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-snug">
              {isBhms ? (
                <>
                  <span className="inline-block whitespace-nowrap">{t("guestFeaturesBhmsTitle1")}</span>{" "}
                  <span className="inline-block whitespace-nowrap">{t("guestFeaturesBhmsTitle2")}</span>
                </>
              ) : (
                <>
                  <span className="inline-block whitespace-nowrap">{t("guestFeaturesBhrpTitle1")}</span>{" "}
                  <span className="inline-block whitespace-nowrap">{t("guestFeaturesBhrpTitle2")}</span>
                </>
              )}
            </h2>
          </div>

          {/* Feature cards grid */}
          <div className={`grid grid-cols-1 gap-6 sm:gap-8 ${isBhms ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 max-w-5xl mx-auto"}`}>
            {currentFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-7 sm:p-8 border shadow-xs hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6 group"
                  style={{
                    borderColor: `${accentColor}33`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = accentColor)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = `${accentColor}33`)}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap"
                        style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
                      >
                        {feat.tag}
                      </span>
                    </div>

                    <h3
                      className="text-lg font-black text-zinc-900 transition-colors leading-snug group-hover:text-current"
                      style={{ "--hover-color": accentColor } as React.CSSProperties}
                    >
                      {feat.title}
                    </h3>

                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FAQ Accordion ────────────────────────────────────────────────── */}
        <section className="bg-zinc-50 rounded-3xl p-8 sm:p-12 border border-zinc-200/80 space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h3 className="text-xl font-black text-zinc-900 flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#2AC1BC]" /> {t("guestPricingFaqTitle")}
            </h3>
            <p className="text-xs text-zinc-500 font-medium">{t("guestPricingFaqSubtitle")}</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs cursor-pointer space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-zinc-900">
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180 text-[#2AC1BC]" : ""}`} />
                  </div>
                  {isOpen && (
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed pt-2 border-t border-zinc-100 animate-in fade-in duration-200">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
        <section className="bg-zinc-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl border border-zinc-800">
          <h2 className="text-2xl sm:text-4xl font-black text-white leading-snug">
            <span className="inline-block whitespace-nowrap">{t("guestPricingCtaTitle1")}</span>{" "}
            <span className="inline-block whitespace-nowrap">{t("guestPricingCtaTitle2")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-medium">
            {t("guestPricingCtaSubtitle")}
          </p>
          <div className="flex justify-center">
            <Link href="/register">
              <button className="px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/30 transition-all cursor-pointer hover:scale-105">
                {t("guestPricingCtaBtn")} &rarr;
              </button>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
