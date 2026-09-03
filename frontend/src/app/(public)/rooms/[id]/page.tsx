"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Minimize2, ShieldCheck, User,
  Phone, QrCode, CheckCircle2, X, Sparkles, Lock, Calculator,
  Zap, Droplets, Wifi, Trash2, Check, MessageSquare, Heart, Share2, Copy, ShieldAlert, ExternalLink
} from "lucide-react";
import { formatVND } from "@/utils";
import { useTranslations } from "@/context/LanguageContext";

export default function RoomDetailPage() {
  const t = useTranslations("roomDetailPage");
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositStep, setDepositStep] = useState<"form" | "qr" | "success">("form");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Utility Calculator States - Default peopleCount: 1, electricityKwh: 0, waterM3: 0
  const [peopleCount, setPeopleCount] = useState(1);
  const [electricityKwh, setElectricityKwh] = useState(0);
  const [waterM3, setWaterM3] = useState(0);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  const room = {
    id: "1",
    code: "#ROOM-Q1-101",
    title: t("sampleTitle"),
    price: 4500000,
    depositAmount: 1000000, // Cài đặt bởi chủ nhà
    area: 25,
    address: t("sampleAddress"),
    electricityRate: 3800, // đ/kWh
    waterRate: 25000, // đ/m³
    serviceFee: 150000, // đ/người
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80"
    ],
    description: t("sampleDesc"),
    facilities: [
      t("facWifi"),
      t("facAc"),
      t("facFridge"),
      t("facElevator"),
      t("facLock"),
      t("facBalcony"),
      t("facParking")
    ],
    landlord: {
      name: "Nguyễn Văn Rio",
      phone: "0901.234.567",
      email: "landlord.rio@gmail.com",
    },
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Utility Cost Calculator Math
  const totalElectricityCost = electricityKwh * room.electricityRate;
  const totalWaterCost = waterM3 * room.waterRate;
  const totalServiceCost = peopleCount * room.serviceFee;
  const totalEstimatedMonthly = room.price + totalElectricityCost + totalWaterCost + totalServiceCost;

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full space-y-6">

        {/* Top Header Trail & Action Bar */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#2AC1BC] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {t("backToList")}
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${isSaved ? "bg-rose-500 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-white" : ""}`} />
              {isSaved ? t("saved") : t("save")}
            </button>

            <button
              onClick={() => setIsShareOpen(true)}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("share")}
            </button>
          </div>
        </div>

        {/* Room Title Header Block */}
        <div className="space-y-3 bg-zinc-50/80 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-extrabold rounded-full">
              {t("studioBadge")}
            </span>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
              {t("verifiedBadge")}
            </span>
            <span className="px-3 py-1 bg-zinc-200/80 text-zinc-700 text-xs font-extrabold rounded-full">
              {t("roomCode", { code: room.code })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 leading-snug">
            {room.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-zinc-200/60 text-xs font-semibold text-zinc-500">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(room.address)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-zinc-800 font-bold hover:text-[#2AC1BC] hover:underline cursor-pointer transition-colors group"
            >
              <MapPin className="h-4 w-4 text-[#2AC1BC]" />
              <span>{room.address}</span>
              <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-[#2AC1BC]" />
            </a>

            <div className="flex items-center gap-1 text-zinc-700">
              <Minimize2 className="h-4 w-4 text-zinc-400" />
              <span>{t("areaLabel")} <strong>{room.area} m²</strong></span>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">

          {/* Left Main Content */}
          <div className="lg:col-span-8 space-y-8">

            {/* Gallery Images Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-3xl overflow-hidden shadow-lg border border-zinc-200">
              <div className="md:col-span-2 aspect-video overflow-hidden bg-zinc-100 relative group">
                <img
                  src={room.images[0]}
                  alt={room.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 px-3 py-1 bg-[#2AC1BC] text-white text-xs font-black rounded-full shadow-md">
                  {t("photoBadge")}
                </span>
              </div>
              <div className="hidden md:flex flex-col gap-3">
                <div className="aspect-[4/3] overflow-hidden bg-zinc-100 rounded-2xl border border-zinc-200">
                  <img src={room.images[1]} alt="Detail 1" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[4/3] overflow-hidden bg-zinc-100 rounded-2xl border border-zinc-200">
                  <img src={room.images[2]} alt="Detail 2" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* 1. Description Section */}
            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-zinc-900">{t("descTitle")}</h2>
              <div className="text-zinc-600 leading-relaxed whitespace-pre-line text-xs font-medium bg-zinc-50 p-6 rounded-3xl border border-zinc-200/80">
                {room.description}
              </div>
            </div>

            {/* 2. Facilities Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-zinc-900">{t("facilitiesTitle")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.facilities.map((fac, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3.5 bg-white border border-zinc-200/80 rounded-2xl text-xs font-bold text-zinc-800 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#2AC1BC]" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Escrow Deposit Process Guarantee Box */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 rounded-3xl text-white space-y-4 shadow-xl border border-zinc-800">
              <span className="text-xs font-black text-[#2AC1BC] uppercase tracking-wider block">{t("escrowTitle")}</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#2AC1BC] text-white font-black text-xs inline-flex items-center justify-center">1</span>
                  <h4 className="font-extrabold text-xs text-white">{t("escrowStep1Title")}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{t("escrowStep1Desc")}</p>
                </div>

                <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-zinc-900 font-black text-xs inline-flex items-center justify-center">2</span>
                  <h4 className="font-extrabold text-xs text-white">{t("escrowStep2Title")}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{t("escrowStep2Desc")}</p>
                </div>

                <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-400 text-zinc-900 font-black text-xs inline-flex items-center justify-center">3</span>
                  <h4 className="font-extrabold text-xs text-white">{t("escrowStep3Title")}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{t("escrowStep3Desc")}</p>
                </div>
              </div>
            </div>

            {/* 4. Interactive Rent & Utility Calculator Card Widget */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl text-zinc-900 shadow-md border border-zinc-200/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#2AC1BC]" /> {t("calcTitle")}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    {t("calcSub")}
                  </p>
                </div>
                <button
                  onClick={() => setIsCalcOpen(!isCalcOpen)}
                  className="px-4 py-2 bg-[#2AC1BC] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer hover:bg-[#72b3a3] transition-colors shrink-0"
                >
                  {isCalcOpen ? t("calcClose") : t("calcOpen")}
                </button>
              </div>

              {isCalcOpen && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  {/* Slider 1 */}
                  <div className="space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">{t("peopleCountLabel")}</span>
                      <span className="text-[#2AC1BC] font-black">{peopleCount} {t("peopleUnit")}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={peopleCount}
                      onChange={(e) => setPeopleCount(Number(e.target.value))}
                      className="w-full accent-[#2AC1BC] cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-400 block">{t("serviceNote")} {formatVND(totalServiceCost)}</span>
                  </div>

                  {/* Slider 2 */}
                  <div className="space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">{t("electricityLabel")}</span>
                      <span className="text-amber-600 font-black">{electricityKwh} kWh</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="10"
                      value={electricityKwh}
                      onChange={(e) => setElectricityKwh(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-400 block">{t("electricityNote")} ({formatVND(totalElectricityCost)})</span>
                  </div>

                  {/* Slider 3 */}
                  <div className="space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">{t("waterLabel")}</span>
                      <span className="text-cyan-600 font-black">{waterM3} m³</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={waterM3}
                      onChange={(e) => setWaterM3(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-400 block">{t("waterNote")} ({formatVND(totalWaterCost)})</span>
                  </div>
                </div>
              )}

              {/* Total Summary Breakdown Box */}
              <div className="p-5 bg-zinc-900 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-zinc-400 font-semibold block">{t("totalCalcTitle")}</span>
                  <span className="text-3xl font-black text-rose-500">{formatVND(totalEstimatedMonthly)}</span>
                </div>
                <div className="text-xs text-zinc-400 font-medium space-y-0.5">
                  <div>• {t("rentPart")} <strong className="text-white">{formatVND(room.price)}</strong></div>
                  <div>• {t("utilPart")} <strong className="text-[#2AC1BC]">{formatVND(totalElectricityCost + totalWaterCost + totalServiceCost)}</strong></div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar Card: Booking & Landlord Info */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">

            {/* Price & Deposit Action Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xl space-y-6">
              <div className="space-y-1">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">{t("listedPriceLabel")}</span>
                <div className="text-3xl font-black text-rose-500">{formatVND(room.price)} <span className="text-xs text-zinc-400 font-normal">{t("month")}</span></div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-700 font-bold mt-2">
                  {t("depositLabel")} {formatVND(room.depositAmount)}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => { setIsDepositModalOpen(true); setDepositStep("form"); }}
                  className="w-full py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF7B44] hover:from-[#ff5518] hover:to-[#ff6d31] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#FF6B35]/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> {t("depositBtn")}
                </button>

                <a href={`tel:${room.landlord.phone}`} className="block">
                  <button className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Phone className="w-4 h-4 text-[#2AC1BC]" /> {t("callBtn")}
                  </button>
                </a>
              </div>

              {/* Landlord Contact Profile Card */}
              <div className="pt-6 border-t border-zinc-100 space-y-3">
                <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider block">{t("landlordTitle")}</span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black text-lg">
                    R
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900">{room.landlord.name}</h4>
                    <span className="text-xs font-semibold text-zinc-500">{t("phoneLabel")} {room.landlord.phone}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Share Modal */}
      {isShareOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsShareOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-zinc-100 relative cursor-default">
            <button
              onClick={() => setIsShareOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-zinc-100 rounded-full text-zinc-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#2AC1BC]" /> {t("shareTitle")}
            </h3>
            <p className="text-xs text-zinc-500 font-medium line-clamp-1">{room.title}</p>

            <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded-2xl border border-zinc-200">
              <input
                type="text"
                readOnly
                value={typeof window !== "undefined" ? window.location.href : ""}
                className="w-full text-xs font-semibold text-zinc-600 bg-transparent px-2 focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online VietQR Deposit Modal */}
      {isDepositModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsDepositModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-zinc-100 max-h-[90vh] overflow-y-auto cursor-default">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2AC1BC]" /> {t("modalTitle")}
              </h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1 hover:bg-zinc-100 rounded-xl text-zinc-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Escrow Explanation */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 rounded-2xl text-white space-y-2 border border-zinc-800">
              <span className="text-[10px] font-black text-[#2AC1BC] uppercase block">{t("escrowTitle")}</span>
              <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                {t("escrowModalDesc")}
              </p>
            </div>

            {depositStep === "form" && (
              <div className="space-y-4">
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-[#2AC1BC] uppercase">{t("selectedRoomLabel")}</span>
                  <h4 className="font-extrabold text-xs text-zinc-900 line-clamp-1">{room.title}</h4>
                  <div className="text-xs font-bold text-rose-500">{t("landlordDepositLabel")} {formatVND(room.depositAmount)}</div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 uppercase">{t("tenantNameLabel")}</label>
                    <input
                      type="text"
                      placeholder={t("tenantNamePlaceholder")}
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full mt-1 px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 uppercase">{t("tenantPhoneLabel")}</label>
                    <input
                      type="text"
                      placeholder={t("tenantPhonePlaceholder")}
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                      className="w-full mt-1 px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setDepositStep("qr")}
                  disabled={!tenantName || !tenantPhone}
                  className="w-full py-3 bg-[#FF6B35] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#FF6B35]/25 hover:bg-[#ff5518] transition-all cursor-pointer mt-2"
                >
                  {t("confirmQrBtn")}
                </button>
              </div>
            )}

            {depositStep === "qr" && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl inline-block">
                  <QrCode className="w-44 h-44 mx-auto text-zinc-900" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 font-semibold block">{t("transferAmountLabel")}</span>
                  <span className="text-2xl font-black text-rose-600">{formatVND(room.depositAmount)}</span>
                  <p className="text-[11px] text-zinc-400 font-medium">{t("transferContentLabel")} <span className="font-extrabold text-zinc-800">COC {tenantPhone} P101</span></p>
                </div>

                <button
                  onClick={() => setDepositStep("success")}
                  className="w-full py-3 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#2AC1BC]/25 transition-all cursor-pointer"
                >
                  {t("confirmTransferBtn")}
                </button>
              </div>
            )}

            {depositStep === "success" && (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-black text-zinc-900">{t("successTitle")}</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    {t("successDesc", { name: room.landlord.name })}
                  </p>
                </div>
                <button
                  onClick={() => setIsDepositModalOpen(false)}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t("closeModal")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
