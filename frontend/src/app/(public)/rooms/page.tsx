"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search, MapPin, Filter, RotateCcw, ShieldCheck, Sparkles,
  ChevronDown, CheckCircle2, Eye, QrCode, X, Lock, Phone, MessageSquare,
  ArrowRight, User, Heart, Share2, Copy, Check, ShieldAlert, ArrowDownUp
} from "lucide-react";
import { formatVND } from "@/utils";
import { useTranslations } from "next-intl";

export default function RoomsPage() {
  const t = useTranslations("roomsPage");
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [quickViewRoom, setQuickViewRoom] = useState<any>(null);
  const [depositRoom, setDepositRoom] = useState<any>(null);
  const [depositStep, setDepositStep] = useState<"form" | "qr" | "success">("form");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");

  // Saved Rooms & Share State
  const [savedRoomIds, setSavedRoomIds] = useState<string[]>([]);
  const [shareModalRoom, setShareModalRoom] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const roomsData = [
    {
      id: "1",
      badge: t("badgeHot"),
      title: t("room1Title"),
      address: t("room1Address"),
      description: t("room1Desc"),
      amenities: ["Ban công", "Máy lạnh Inverter", "Tủ lạnh", "Bếp riêng", "Wifi free", "Khóa vân tay"],
      price: 4500000,
      depositAmount: 1000000, // Cài đặt bởi chủ trọ
      area: 25,
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      city: "hcm",
      landlord: { name: "Nguyễn Văn Rio", phone: "0901.234.567" }
    },
    {
      id: "2",
      badge: t("badgeAvailable"),
      title: t("room2Title"),
      address: t("room2Address"),
      description: t("room2Desc"),
      amenities: ["Máy lạnh", "Tủ lạnh", "Nóng lạnh", "Giờ tự do", "Bảo vệ 24/7"],
      price: 4000000,
      depositAmount: 500000, // Cài đặt bởi chủ trọ
      area: 22,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      city: "hcm",
      landlord: { name: "Trần Thị Lan", phone: "0987.654.321" }
    },
    {
      id: "3",
      badge: t("badgeGoodPrice"),
      title: t("room3Title"),
      address: t("room3Address"),
      description: t("room3Desc"),
      amenities: ["Wifi tốc độ cao", "Nóng lạnh", "Ban công", "Chỗ để xe"],
      price: 3200000,
      depositAmount: 0, // Chủ trọ cài đặt miễn phí cọc xem phòng
      area: 24,
      image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
      city: "hanoi",
      landlord: { name: "Lê Hoàng Nam", phone: "0912.345.678" }
    },
    {
      id: "4",
      badge: t("badgeHot"),
      title: t("room4Title"),
      address: t("room4Address"),
      description: t("room4Desc"),
      amenities: ["Thang máy", "Khóa vân tay", "Máy giặt chung", "Ban công"],
      price: 5500000,
      depositAmount: 1500000, // Cài đặt bởi chủ trọ
      area: 32,
      image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
      city: "hanoi",
      landlord: { name: "Phạm Văn Đức", phone: "0934.567.890" }
    }
  ];

  const toggleSaveRoom = (id: string) => {
    setSavedRoomIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopyShareLink = (room: any) => {
    navigator.clipboard.writeText(window.location.origin + `/rooms/${room.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleResetFilter = () => {
    setSearchQuery("");
    setCityFilter("all");
    setMaxPrice("");
  };

  const filteredRooms = roomsData.filter((room) => {
    const matchesSearch =
      room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === "all" || room.city === cityFilter;
    const matchesPrice = !maxPrice || room.price <= Number(maxPrice);
    return matchesSearch && matchesCity && matchesPrice;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">

      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center text-white shadow-2xl overflow-hidden bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#2AC1BC]/15 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2AC1BC]/40 bg-zinc-900/70 px-4 py-1.5 text-[11px] sm:text-xs font-extrabold text-[#2AC1BC] tracking-wider mb-4 shadow-[0_0_20px_rgba(42,193,188,0.2)] backdrop-blur-xl">
            <Sparkles className="w-3.5 h-3.5 text-[#2AC1BC]" />
            <span>{t("badge")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] drop-shadow-md">
            <span className="inline-block whitespace-nowrap">{t("title1")}</span> <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent inline-block whitespace-nowrap">
              {t("title2")}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed mt-3 max-w-xl mx-auto text-balance">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Main Content Layout Grid Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Sidebar Filter Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
              <h2 className="font-extrabold text-zinc-900 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#2AC1BC]" /> {t("filterTitle")}
              </h2>
              <button
                onClick={handleResetFilter}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t("resetFilter")}
              </button>
            </div>

            {/* Filter 1: Từ khóa */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">{t("keywordLabel")}</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder={t("keywordPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter 2: Thành phố */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">{t("cityLabel")}</label>
              <div className="relative">
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl appearance-none focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">{t("allCities")}</option>
                  <option value="hcm">{t("hcm")}</option>
                  <option value="hanoi">{t("hanoi")}</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none stroke-[2.5]" />
              </div>
            </div>

            {/* Filter 3: Giá tối đa */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">{t("maxPriceLabel")}</label>
              <input
                type="number"
                placeholder={t("maxPricePlaceholder")}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right Main Room Cards / Map Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500 font-bold">
                {t("foundCount", { count: filteredRooms.length })}
              </div>

              {/* List / Map View Mode Toggle Buttons */}
              <div className="flex items-center p-1 bg-zinc-100 rounded-2xl border border-zinc-200/80">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === "list"
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900"
                    }`}
                >
                  <Filter className="w-3.5 h-3.5" /> {t("listView")}
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === "map"
                      ? "bg-[#2AC1BC] text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900"
                    }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> {t("mapView")}
                </button>
              </div>
            </div>

            {viewMode === "map" ? (
              /* Interactive Map View Simulation */
              <div className="bg-zinc-900 rounded-3xl h-[520px] relative overflow-hidden shadow-xl border border-zinc-800 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
                  alt="Map Background"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/40 pointer-events-none" />

                {/* Map Pins */}
                {filteredRooms.map((room, idx) => (
                  <div
                    key={room.id}
                    onClick={() => setQuickViewRoom(room)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group animate-bounce ${idx === 0 ? "top-1/3 left-1/3" : idx === 1 ? "top-1/2 left-2/3" : idx === 2 ? "top-2/3 left-1/2" : "top-1/4 left-3/4"
                      }`}
                  >
                    <div className="px-3 py-1.5 bg-[#FF6B35] text-white text-xs font-black rounded-full shadow-2xl flex items-center gap-1 group-hover:scale-110 transition-transform">
                      <MapPin className="w-3.5 h-3.5" /> {formatVND(room.price)}
                    </div>
                  </div>
                ))}

                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-2xl text-xs font-bold text-zinc-900 flex justify-between items-center">
                  <span>{t("mapInfo")}</span>
                  <span className="text-[#2AC1BC] font-extrabold">{t("mapPinTitle", { count: filteredRooms.length })}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredRooms.map((room) => {
                  const isSaved = savedRoomIds.includes(room.id);

                  return (
                    <div
                      key={room.id}
                      className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col md:flex-row group"
                    >
                      {/* Left Image Column with Action Badges */}
                      <div className="relative md:w-[230px] lg:w-[250px] aspect-[4/3] md:aspect-auto shrink-0 overflow-hidden bg-zinc-100">
                        <img
                          src={room.image}
                          alt={room.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        <span className="absolute top-3 left-3 px-3 py-1 bg-[#2AC1BC] text-white text-[11px] font-extrabold rounded-full shadow-md">
                          {room.badge}
                        </span>

                        {/* Top-Right Action Buttons: Save & Share */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                          <button
                            onClick={() => toggleSaveRoom(room.id)}
                            className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-md ${isSaved
                                ? "bg-rose-500 text-white"
                                : "bg-zinc-900/70 text-white hover:bg-rose-500"
                              }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-white" : ""}`} />
                          </button>

                          <button
                            onClick={() => setShareModalRoom(room)}
                            className="p-2 rounded-full bg-zinc-900/70 text-white hover:bg-[#2AC1BC] backdrop-blur-md transition-all cursor-pointer shadow-md"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Hover Quick View Trigger */}
                        <button
                          onClick={() => setQuickViewRoom(room)}
                          className="absolute bottom-3 left-3 right-3 py-2 bg-zinc-900/80 hover:bg-zinc-900 backdrop-blur-md text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("quickView")}
                        </button>
                      </div>

                      {/* Right Details Column */}
                      <div className="p-5 sm:p-6 flex-1 min-w-0 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <Link href={`/rooms/${room.id}`}>
                              <h3 className="font-extrabold text-zinc-900 text-base sm:text-lg leading-snug group-hover:text-[#2AC1BC] transition-colors line-clamp-1">
                                {room.title}
                              </h3>
                            </Link>
                          </div>

                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(room.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center text-xs text-zinc-400 font-semibold gap-1 hover:text-[#2AC1BC] hover:underline cursor-pointer transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                            <span className="truncate">{room.address}</span>
                          </a>

                          <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2 pt-1">
                            {room.description}
                          </p>
                        </div>

                        {/* Amenities Tags Row */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                          {room.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] text-[11px] font-bold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-[#2AC1BC]" /> {amenity}
                            </span>
                          ))}
                        </div>

                        {/* Price & Deposit Configured by Landlord & Action Buttons */}
                        <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="whitespace-nowrap shrink-0">
                            <span className="text-xl sm:text-2xl font-black text-rose-500">
                              {formatVND(room.price)}
                            </span>
                            <span className="text-xs text-zinc-400 font-normal"> {t("month")}</span>
                            <span className="text-[11px] font-bold text-zinc-500 block">
                              {t("depositLabel")} {room.depositAmount > 0 ? formatVND(room.depositAmount) : t("freeDeposit")}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <span className="text-xs text-zinc-700 font-bold hidden xl:inline mr-1 whitespace-nowrap">
                              {room.area} m²
                            </span>

                            {/* Renamed Button "Đặt Cọc" */}
                            <button
                              onClick={() => { setDepositRoom(room); setDepositStep("form"); }}
                              className="px-3 sm:px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5518] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF6B35]/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> {t("depositBtn")}
                            </button>

                            <Link href={`/rooms/${room.id}`}>
                              <button className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0">
                                {t("detailBtn")}
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Share Modal Popup */}
      {shareModalRoom && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShareModalRoom(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-zinc-100 relative cursor-default">
            <button
              onClick={() => setShareModalRoom(null)}
              className="absolute top-4 right-4 p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#2AC1BC]" /> {t("shareTitle")}
            </h3>
            <p className="text-xs text-zinc-500 font-medium line-clamp-1">{shareModalRoom.title}</p>

            <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded-2xl border border-zinc-200">
              <input
                type="text"
                readOnly
                value={typeof window !== "undefined" ? window.location.origin + `/rooms/${shareModalRoom.id}` : ""}
                className="w-full text-xs font-semibold text-zinc-600 bg-transparent px-2 focus:outline-none truncate"
              />
              <button
                onClick={() => handleCopyShareLink(shareModalRoom)}
                className="px-3 py-1.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? t("copied") : t("copy")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Quick View Modal Popup */}
      {quickViewRoom && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setQuickViewRoom(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 border border-zinc-100 relative max-h-[90vh] overflow-y-auto cursor-default">
            <button
              onClick={() => setQuickViewRoom(null)}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="md:w-1/2 aspect-video md:aspect-square rounded-2xl overflow-hidden bg-zinc-100 shrink-0">
                <img src={quickViewRoom.image} alt={quickViewRoom.title} className="w-full h-full object-cover" />
              </div>

              <div className="md:w-1/2 space-y-4">
                <span className="px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-[10px] font-extrabold rounded-full inline-block">
                  {quickViewRoom.badge} • {t("verifiedLandlord")}
                </span>
                <h3 className="text-xl font-black text-zinc-900 leading-snug">{quickViewRoom.title}</h3>
                <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2AC1BC]" /> {quickViewRoom.address}
                </div>
                <div className="text-2xl font-black text-rose-500">{formatVND(quickViewRoom.price)} <span className="text-xs text-zinc-400 font-normal">{t("month")}</span></div>

                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <span className="text-xs font-bold text-zinc-700 block">Tiện ích nổi bật:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickViewRoom.amenities.map((item: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-zinc-100 text-[#2AC1BC] rounded-lg text-[11px] font-semibold">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => { setDepositRoom(quickViewRoom); setQuickViewRoom(null); setDepositStep("form"); }}
                    className="flex-1 py-3 bg-[#FF6B35] text-white rounded-xl font-extrabold text-xs shadow-md shadow-[#FF6B35]/20 hover:bg-[#ff5518] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> {t("depositBtn")}
                  </button>
                  <a href={`tel:${quickViewRoom.landlord.phone}`} className="flex-1">
                    <button className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                      <Phone className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("callLandlord")}
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Fast VietQR Deposit Modal Popup with Clear 3-Step Escrow Explanation & Configured Amount */}
      {depositRoom && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDepositRoom(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-zinc-100 max-h-[90vh] overflow-y-auto cursor-default">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2AC1BC]" /> {t("escrowModalTitle")}
              </h3>
              <button onClick={() => setDepositRoom(null)} className="p-1 hover:bg-zinc-100 rounded-xl text-zinc-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clear 3-Step Escrow Guarantee Process Banner */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 rounded-2xl text-white space-y-3 border border-zinc-800">
              <span className="text-[10px] font-black text-[#2AC1BC] uppercase tracking-wider block">{t("escrowTitle")}</span>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-zinc-800/80 p-2 rounded-xl border border-zinc-700/50 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-[#2AC1BC] text-white font-black inline-flex items-center justify-center">1</span>
                  <p className="font-bold text-zinc-200">{t("escrowStep1")}</p>
                </div>
                <div className="bg-zinc-800/80 p-2 rounded-xl border border-zinc-700/50 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-zinc-900 font-black inline-flex items-center justify-center">2</span>
                  <p className="font-bold text-zinc-200">{t("escrowStep2")}</p>
                </div>
                <div className="bg-zinc-800/80 p-2 rounded-xl border border-zinc-700/50 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-400 text-zinc-900 font-black inline-flex items-center justify-center">3</span>
                  <p className="font-bold text-zinc-200">{t("escrowStep3")}</p>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium italic leading-relaxed text-center">
                {t("escrowNote")}
              </p>
            </div>

            {depositStep === "form" && (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1.5">
                  <span className="text-[10px] font-bold text-[#2AC1BC] uppercase">{t("selectedRoom")}</span>
                  <h4 className="font-extrabold text-xs text-zinc-900 line-clamp-1">{depositRoom.title}</h4>

                  {depositRoom.depositAmount > 0 ? (
                    <div className="text-xs font-black text-rose-500">
                      {t("depositLabel")} {formatVND(depositRoom.depositAmount)}
                    </div>
                  ) : (
                    <div className="text-xs font-black text-emerald-600">
                      {t("freeDepositNote")}
                    </div>
                  )}
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
                  <span className="text-xs text-zinc-500 font-semibold block">{t("qrAmountLabel")}</span>
                  <span className="text-2xl font-black text-rose-600">
                    {depositRoom.depositAmount > 0 ? formatVND(depositRoom.depositAmount) : "0 ₫"}
                  </span>
                  <p className="text-[11px] text-zinc-400 font-medium">{t("qrContentLabel")} <span className="font-extrabold text-zinc-800">COC {tenantPhone} #{depositRoom.id}</span></p>
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
                    {t("successDesc", { name: depositRoom.landlord.name })}
                  </p>
                </div>
                <button
                  onClick={() => setDepositRoom(null)}
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
