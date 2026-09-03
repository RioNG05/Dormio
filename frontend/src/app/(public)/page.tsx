"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Building, CreditCard, ShieldCheck, ChevronDown, ArrowRight, Banknote, Sparkles, Star, Zap } from "lucide-react";
import { formatVND } from "@/utils";
import { useTranslations } from "@/context/LanguageContext";

export default function HomePage() {
  const t = useTranslations("home");
  const [activeTab, setActiveTab] = useState<"phong" | "studio" | "nguyencan">("phong");
  const [processTab, setProcessTab] = useState<"tenant" | "landlord">("tenant");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState<"all" | "hcm" | "hanoi">("all");

  const featuredRooms = [
    {
      id: "1",
      cityKey: "hcm",
      title: t("room1Title"),
      price: 4500000,
      area: 25,
      address: t("room1Address"),
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "2",
      cityKey: "hanoi",
      title: t("room2Title"),
      price: 5500000,
      area: 30,
      address: t("room2Address"),
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "3",
      cityKey: "hanoi",
      title: t("room3Title"),
      price: 2500000,
      area: 18,
      address: t("room3Address"),
      image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const filteredFeaturedRooms = featuredRooms.filter((room) => {
    if (selectedCityFilter === "hcm") return room.cityKey === "hcm";
    if (selectedCityFilter === "hanoi") return room.cityKey === "hanoi";
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* High-End Professional Hero Section (Fit Screen Height & Seamless Section Transition Divider) */}
      <section className="relative min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] flex flex-col justify-center items-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center overflow-hidden border-b border-zinc-800">
        
        {/* Dark Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        
        {/* Soft Ambient Glow Orbs behind text */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#2AC1BC]/20 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-[#FF6B35]/15 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Glowing Glassmorphism Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2AC1BC]/40 bg-zinc-900/70 px-4 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-extrabold text-[#2AC1BC] tracking-wider mb-4 sm:mb-6 shadow-[0_0_25px_rgba(42,193,188,0.25)] backdrop-blur-xl transition-transform hover:scale-105">
            <ShieldCheck className="w-4 h-4 text-[#2AC1BC]" />
            <span>{t("badge")}</span>
          </div>

          {/* Headline with Single Continuous Gradient from Teal to Orange on 'dễ dàng, tiện lợi' */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.18] drop-shadow-md">
            <span className="inline-block whitespace-nowrap">{t("titleLine1")}</span> <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#36D7D1] to-[#6BEAE6] bg-clip-text text-transparent inline-block whitespace-nowrap">
              {t("titleLine2")}
            </span> <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent inline-block whitespace-nowrap">
              {t("titleLine3")}
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mx-auto leading-relaxed mt-4 sm:mt-5 font-medium tracking-wide text-balance">
            {t("subtitle")}
          </p>

          {/* Floating Search Card Widget with Premium Shadows */}
          <div className="mt-6 sm:mt-8 w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-[28px] p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] text-zinc-900 border border-white/80 animate-in fade-in duration-700">
            
            {/* Category Tabs */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-3.5 border-b border-zinc-100 pb-3">
              <button
                onClick={() => setActiveTab("phong")}
                className={`px-5 sm:px-6 py-2 rounded-full font-black text-xs transition-all cursor-pointer ${
                  activeTab === "phong"
                    ? "bg-gradient-to-r from-[#2AC1BC] to-[#3BDAC8] text-white shadow-md shadow-[#2AC1BC]/25 scale-105"
                    : "text-zinc-500 font-bold hover:text-zinc-900"
                }`}
              >
                {t("tabRent")}
              </button>
              <button
                onClick={() => setActiveTab("studio")}
                className={`px-5 sm:px-6 py-2 rounded-full font-black text-xs transition-all cursor-pointer ${
                  activeTab === "studio"
                    ? "bg-gradient-to-r from-[#2AC1BC] to-[#3BDAC8] text-white shadow-md shadow-[#2AC1BC]/25 scale-105"
                    : "text-zinc-500 font-bold hover:text-zinc-900"
                }`}
              >
                {t("tabStudio")}
              </button>
              <button
                onClick={() => setActiveTab("nguyencan")}
                className={`px-5 sm:px-6 py-2 rounded-full font-black text-xs transition-all cursor-pointer ${
                  activeTab === "nguyencan"
                    ? "bg-gradient-to-r from-[#2AC1BC] to-[#3BDAC8] text-white shadow-md shadow-[#2AC1BC]/25 scale-105"
                    : "text-zinc-500 font-bold hover:text-zinc-900"
                }`}
              >
                {t("tabWhole")}
              </button>
            </div>

            {/* Inputs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-left items-end">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">{t("keywordLabel")}</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder={t("keywordPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 h-11 text-xs font-semibold bg-zinc-50/80 border border-zinc-200/90 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">{t("priceLabel")}</label>
                <div className="relative">
                  <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full pl-9 pr-8 h-11 text-xs font-bold bg-zinc-50/80 border border-zinc-200/90 rounded-2xl appearance-none focus:outline-none focus:border-[#2AC1BC] focus:bg-white focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all cursor-pointer"
                  >
                    <option value="">{t("allPrices")}</option>
                    <option value="under3">{t("under3m")}</option>
                    <option value="3to5">{t("from3to5m")}</option>
                    <option value="above5">{t("above5m")}</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
                </div>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <span className="text-[10px] font-black text-transparent select-none uppercase tracking-wider block hidden sm:block">&nbsp;</span>
                <Link href="/rooms" className="block w-full">
                  <button className="w-full h-11 bg-gradient-to-r from-[#FF6B35] to-[#FF7B44] hover:from-[#ff5518] hover:to-[#ff6d31] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-[#FF6B35]/25 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                    <Search className="w-3.5 h-3.5" /> {t("searchNow")}
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Action Buttons Below Search */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            <Link href="/register">
              <button className="px-7 py-3 bg-gradient-to-r from-[#2AC1BC] to-[#3BDAC8] hover:from-[#23B3AE] hover:to-[#32C5B5] text-white font-black text-xs sm:text-sm rounded-full shadow-[0_10px_30px_rgba(42,193,188,0.35)] transition-all hover:scale-105 cursor-pointer">
                {t("trialBtn")}
              </button>
            </Link>
            <Link href="#features">
              <button className="px-7 py-3 bg-zinc-900/80 hover:bg-[#FF6B35] text-white font-black text-xs sm:text-sm rounded-full border border-zinc-700/80 hover:border-[#FF6B35] backdrop-blur-md shadow-xs hover:shadow-[0_10px_25px_rgba(255,107,53,0.35)] hover:scale-105 transition-all duration-300 cursor-pointer">
                {t("exploreBtn")}
              </button>
            </Link>
          </div>

          {/* Social Proof Stars */}
          <div className="flex items-center justify-center gap-2 mt-5 sm:mt-6 text-xs text-zinc-400 font-medium">
            <div className="flex text-amber-400 text-sm tracking-widest">★★★★★</div>
            <span className="text-zinc-300">
              {t("socialProof")}
            </span>
          </div>
        </div>
      </section>

      {/* Process 3 Steps Section based on exact user reference image */}
      <section id="features" className="py-20 bg-zinc-50/50 border-b border-zinc-100 animate-in fade-in duration-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] text-[11px] font-extrabold tracking-wider uppercase mb-3 border border-[#2AC1BC]/20">
            {t("processBadge")}
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 leading-snug">
            <span className="block sm:inline">{t("processTitle1")}</span>
            <span className="block sm:inline">{t("processTitle2")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-xl mx-auto mt-2 mb-8 leading-relaxed">
            {t("processSubtitle")}
          </p>

          {/* Interactive Role Switcher Pill Tabs */}
          <div className="inline-flex items-center p-1 sm:p-1.5 bg-white border border-zinc-200/80 rounded-full shadow-xs mb-12 max-w-full overflow-x-auto">
            <button
              onClick={() => setProcessTab("tenant")}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                processTab === "tenant"
                  ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/25"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {t("forTenant")}
            </button>
            <button
              onClick={() => setProcessTab("landlord")}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                processTab === "landlord"
                  ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/25"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {t("forLandlord")}
            </button>
          </div>

          {/* 3 Step Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
            {processTab === "tenant" ? (
              <>
                {/* Step 01 */}
                <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-[#2AC1BC]/30 transition-all duration-300 flex flex-col justify-between space-y-6">
                  <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] font-black text-sm flex items-center justify-center">
                    01
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-zinc-900">{t("tenantStep1Title")}</h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      {t("tenantStep1Desc")}
                    </p>
                  </div>
                </div>

                {/* Step 02 */}
                <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-[#FF6B35]/30 transition-all duration-300 flex flex-col justify-between space-y-6">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] font-black text-sm flex items-center justify-center">
                    02
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-zinc-900">{t("tenantStep2Title")}</h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      {t("tenantStep2Desc")}
                    </p>
                  </div>
                </div>

                {/* Step 03 */}
                <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-[#2AC1BC]/30 transition-all duration-300 flex flex-col justify-between space-y-6">
                  <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] font-black text-sm flex items-center justify-center">
                    03
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-zinc-900">{t("tenantStep3Title")}</h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      {t("tenantStep3Desc")}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Step 01 Landlord */}
                <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-[#2AC1BC]/30 transition-all duration-300 flex flex-col justify-between space-y-6">
                  <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] font-black text-sm flex items-center justify-center">
                    01
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-zinc-900">{t("landlordStep1Title")}</h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      {t("landlordStep1Desc")}
                    </p>
                  </div>
                </div>

                {/* Step 02 Landlord */}
                <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-[#FF6B35]/30 transition-all duration-300 flex flex-col justify-between space-y-6">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] font-black text-sm flex items-center justify-center">
                    02
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-zinc-900">{t("landlordStep2Title")}</h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      {t("landlordStep2Desc")}
                    </p>
                  </div>
                </div>

                {/* Step 03 Landlord */}
                <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-[#2AC1BC]/30 transition-all duration-300 flex flex-col justify-between space-y-6">
                  <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] font-black text-sm flex items-center justify-center">
                    03
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-zinc-900">{t("landlordStep3Title")}</h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      {t("landlordStep3Desc")}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-extrabold text-[#2AC1BC] uppercase tracking-wider block mb-1">{t("bhrpBadge")}</span>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900">
              {t("featuredRoomsTitle")}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-semibold">
              {t("featuredRoomsSub")}
            </p>
          </div>

          {/* City Filter Tabs */}
          <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setSelectedCityFilter("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCityFilter === "all" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {t("allCities")}
            </button>
            <button
              onClick={() => setSelectedCityFilter("hcm")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCityFilter === "hcm" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {t("hcm")}
            </button>
            <button
              onClick={() => setSelectedCityFilter("hanoi")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCityFilter === "hanoi" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {t("hanoi")}
            </button>
          </div>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFeaturedRooms.map((room) => (
            <div
              key={room.id}
              className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm border border-zinc-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
                <img
                  src={room.image}
                  alt={room.title}
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white shadow-sm flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("verified")}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6 gap-3">
                <h3 className="font-extrabold text-base text-zinc-900 leading-snug line-clamp-2 group-hover:text-[#2AC1BC] transition-colors">
                  {room.title}
                </h3>
                <div className="flex items-center text-xs text-zinc-500 font-semibold gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{room.address}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-rose-600">
                      {formatVND(room.price)}
                    </span>
                    <span className="text-xs text-zinc-400 font-normal">{t("month")}</span>
                  </div>
                  <Link href={`/rooms/${room.id}`}>
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                      {t("viewDetail")} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verified Tenant Reviews & Social Proof Section */}
      <section className="py-20 bg-zinc-50 border-y border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-2">
            <span className="text-xs font-extrabold text-[#2AC1BC] uppercase tracking-wider block">{t("reviewsBadge")}</span>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900">
              {t("reviewsTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-semibold max-w-xl mx-auto">
              {t("reviewsSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: t("review1Name"),
                role: t("review1Role"),
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                text: t("review1Text"),
                rating: 5,
              },
              {
                name: t("review2Name"),
                role: t("review2Role"),
                avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
                text: t("review2Text"),
                rating: 5,
              },
              {
                name: t("review3Name"),
                role: t("review3Role"),
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
                text: t("review3Text"),
                rating: 5,
              }
            ].map((review, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex text-amber-400 text-sm tracking-widest">
                    {"★".repeat(review.rating)}
                  </div>
                  <p className="text-xs text-zinc-600 font-semibold leading-relaxed italic">
                    "{review.text}"
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center gap-3">
                  <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-xs text-zinc-900">{review.name}</h4>
                    <span className="text-[11px] font-bold text-[#2AC1BC] block">{review.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative my-16 mx-4 sm:mx-6 lg:mx-auto max-w-7xl rounded-3xl overflow-hidden bg-zinc-900 text-white shadow-2xl border border-zinc-800">
        <div className="px-8 py-14 md:px-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {t("ctaTitle")}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-semibold">
              {t("ctaSub")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <Link href="/register">
              <button className="px-8 py-3.5 bg-gradient-to-r from-[#2AC1BC] to-[#209F9B] hover:from-[#23B3AE] hover:to-[#1B8E8A] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#2AC1BC]/20 transition-all cursor-pointer">
                {t("ctaTrialBtn")}
              </button>
            </Link>
            <Link href="/contact">
              <button className="px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                {t("ctaConsultBtn")}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

