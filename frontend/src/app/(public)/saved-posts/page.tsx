"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Trash2,
  ArrowRight,
  Sparkles,
  MapPin,
  Minimize2,
  Scale,
  QrCode,
  CheckCircle2,
  X,
  Check,
  Share2,
  Lock,
  ShieldCheck,
  Phone,
  Building2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils";
import { postService, type PublicPostListing } from "@/services/post.service";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80";

export default function SavedPostsPage() {
  const t = useTranslations("guest");
  const { currentLocale } = useLanguage();
  const isEn = currentLocale === "en";
  const { isLoggedIn } = useAuth();

  const [savedRooms, setSavedRooms] = useState<PublicPostListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Selected Room IDs for Side-by-Side Comparison
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Fetch saved rooms on mount if authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    setIsLoading(true);
    postService
      .getSavedPosts()
      .then((posts) => {
        if (isMounted) {
          setSavedRooms(posts);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch saved posts:", err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // Auto clear toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleSelectCompare = (id: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeSaved = async (id: string) => {
    const previous = [...savedRooms];
    setSavedRooms((prev) => prev.filter((room) => room.id !== id));
    setSelectedForCompare((prev) => prev.filter((item) => item !== id));

    try {
      await postService.unsavePost(id);
      setToastMessage({
        type: "success",
        text: t("guestSavedPostsRemoveSuccess"),
      });
    } catch (err) {
      console.error("Failed to remove saved post:", err);
      setSavedRooms(previous);
      setToastMessage({
        type: "error",
        text: t("guestSavedPostsRemoveError"),
      });
    }
  };

  const formatAddress = (
    addr?: PublicPostListing["address"],
    fallbackName?: string
  ): string => {
    if (!addr) return fallbackName || "";
    const parts = [
      addr.houseNumber,
      addr.street,
      addr.ward,
      addr.district,
      addr.province,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : fallbackName || "";
  };

  const selectedRoomsData = savedRooms.filter((r) =>
    selectedForCompare.includes(r.id)
  );

  // IF USER IS NOT LOGGED IN, SHOW LOGIN PROMPT LOCK SCREEN
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">
        {/* Full-Width Hero Header */}
        <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
          <div className="relative z-10 max-w-4xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-500/20 text-rose-400 text-xs font-black rounded-full border border-rose-500/30 shadow-lg">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />{" "}
              {t("guestSavedPostsMemberBadge")}
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.18] drop-shadow-md">
              <span>{t("guestSavedPostsLockHeroTitle")}</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto">
              {t("guestSavedPostsLockHeroSub")}
            </p>
          </div>
        </section>

        {/* Lock Screen Body */}
        <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto shadow-inner border border-[#2AC1BC]/20">
            <Lock className="w-10 h-10 text-[#2AC1BC]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-zinc-900">
              {t("guestSavedPostsLockTitle")}
            </h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-md mx-auto">
              {t("guestSavedPostsLockDesc")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 transition-all cursor-pointer hover:scale-105">
                {t("guestSavedPostsLoginBtn")} &rarr;
              </button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer">
                {t("guestSavedPostsRegisterBtn")}
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold text-white ${
              toastMessage.type === "success"
                ? "bg-emerald-600"
                : toastMessage.type === "error"
                ? "bg-rose-600"
                : "bg-blue-600"
            }`}
          >
            {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toastMessage.type === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-500/20 text-rose-400 text-xs font-black rounded-full border border-rose-500/30 shadow-lg">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" /> {t("guestSavedPostsBadge")}
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] drop-shadow-md">
            <span className="inline-block whitespace-nowrap">{t("guestSavedPostsTitle1")}</span> <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent inline-block whitespace-nowrap">
              {t("guestSavedPostsTitle2")}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto text-balance">
            {t("guestSavedPostsSubtitle")}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-zinc-200/80 overflow-hidden shadow-sm animate-pulse flex flex-col justify-between"
              >
                <div className="aspect-[16/9] bg-zinc-200" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-zinc-200 rounded w-3/4" />
                  <div className="h-4 bg-zinc-100 rounded w-1/2" />
                  <div className="pt-3 border-t border-zinc-100 flex justify-between">
                    <div className="h-6 bg-zinc-200 rounded w-1/3" />
                    <div className="h-4 bg-zinc-100 rounded w-1/4" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-9 bg-zinc-100 rounded-xl" />
                    <div className="h-9 bg-zinc-200 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : savedRooms.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-200/80 space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-zinc-900">{t("guestSavedPostsEmptyTitle")}</h3>
            <p className="text-xs text-zinc-500 font-medium">{t("guestSavedPostsEmptySub")}</p>
            <Link href="/rooms">
              <button className="px-6 py-3 bg-[#2AC1BC] text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-[#72b3a3] transition-all cursor-pointer">
                {t("guestSavedPostsExploreRooms")} &rarr;
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8 pb-16">
            {/* Fixed Floating Bottom Compare Action Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[calc(100%-2rem)] bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 text-white p-4 sm:px-6 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                <span className="w-8 h-8 rounded-full bg-[#2AC1BC]/20 text-[#2AC1BC] flex items-center justify-center font-black">
                  {selectedForCompare.length}
                </span>
                <span className="hidden sm:inline">
                  {t("guestSavedPostsSelectedInfo", {
                    savedCount: savedRooms.length,
                    compareCount: selectedForCompare.length,
                  })}
                </span>
                <span className="sm:hidden text-white font-bold">
                  {t("guestSavedPostsSelectedMobile", {
                    compareCount: selectedForCompare.length,
                  })}
                </span>
              </div>

              {/* Compare Button */}
              <button
                onClick={() => setIsCompareModalOpen(true)}
                disabled={selectedForCompare.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] to-[#FF6B35] disabled:opacity-40 hover:from-[#23B3AE] hover:to-[#ff5518] text-white font-extrabold text-xs rounded-full shadow-lg shadow-[#2AC1BC]/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 shrink-0"
              >
                <Scale className="w-4 h-4" />{" "}
                {t("guestSavedPostsCompareBtn", { count: selectedForCompare.length })} &rarr;
              </button>
            </div>

            {/* Saved Rooms Cards Grid with Checkbox */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {savedRooms.map((room) => {
                const isSelected = selectedForCompare.includes(room.id);
                const roomTitle = room.title;
                const roomAddress = formatAddress(
                  room.address,
                  room.room?.boardingHouseName
                );
                const roomImg = room.images?.[0]?.url || FALLBACK_IMAGE;

                return (
                  <div
                    key={room.id}
                    className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group relative ${
                      isSelected
                        ? "border-[#2AC1BC] shadow-lg ring-2 ring-[#2AC1BC]/20"
                        : "border-zinc-200/80 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Checkbox Selector for Compare */}
                    <div
                      onClick={() => toggleSelectCompare(room.id)}
                      className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-full text-white text-xs font-bold cursor-pointer hover:bg-zinc-900 transition-all shadow-md"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by div click
                        className="w-4 h-4 accent-[#2AC1BC] cursor-pointer"
                      />
                      <span>
                        {isSelected
                          ? t("guestSavedPostsSelectedCompare")
                          : t("guestSavedPostsSelectCompare")}
                      </span>
                    </div>

                    {/* Image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                      <img
                        src={roomImg}
                        alt={roomTitle}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={() => removeSaved(room.id)}
                        className="absolute top-3 right-3 p-2 bg-zinc-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                        title={t("guestSavedPostsRemoveTitle")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <Link href={`/rooms/${room.id}`}>
                          <h3 className="font-extrabold text-zinc-900 text-base leading-snug group-hover:text-[#2AC1BC] transition-colors line-clamp-2">
                            {roomTitle}
                          </h3>
                        </Link>
                        {roomAddress && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              roomAddress
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center text-xs text-zinc-400 font-semibold gap-1 hover:text-[#2AC1BC] hover:underline cursor-pointer transition-colors"
                            title={t("guestSavedPostsMapTitle")}
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                            <span className="truncate">{roomAddress}</span>
                          </a>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-black text-rose-500">
                            {formatCurrency(room.depositAmount, currentLocale)}
                          </span>
                          {room.room?.area && (
                            <span className="text-xs text-zinc-700 font-bold">
                              {room.room.area} m²
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-bold text-zinc-500 block">
                          {t("guestSavedPostsDepositLabel")}{" "}
                          {room.depositAmount > 0
                            ? formatCurrency(room.depositAmount, currentLocale)
                            : t("guestSavedPostsFreeDepositShort")}
                        </span>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Link href={`/rooms/${room.id}`}>
                            <button className="w-full py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 text-[#2AC1BC] font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center">
                              {t("guestSavedPostsViewDetails")}
                            </button>
                          </Link>
                          <Link href={`/rooms/${room.id}`}>
                            <button className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#ff5518] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center">
                              {t("guestSavedPostsDepositNow")}
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Side-by-Side Comparison Modal */}
      {isCompareModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCompareModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-zinc-100 relative max-h-[90vh] overflow-y-auto cursor-default">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#2AC1BC]" />{" "}
                  {t("guestSavedPostsModalTitle", {
                    count: selectedRoomsData.length,
                  })}
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  {t("guestSavedPostsModalSub")}
                </p>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="p-3 text-xs font-black text-zinc-400 uppercase w-44">
                      {t("guestSavedPostsColCriteria")}
                    </th>
                    {selectedRoomsData.map((room) => {
                      const title = room.title;
                      const img = room.images?.[0]?.url || FALLBACK_IMAGE;
                      return (
                        <th key={room.id} className="p-3 min-w-[220px]">
                          <div className="space-y-2">
                            <img
                              src={img}
                              alt={title}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                              }}
                              className="w-full h-28 object-cover rounded-xl border border-zinc-200"
                            />
                            <h4 className="font-extrabold text-xs text-zinc-900 line-clamp-2">
                              {title}
                            </h4>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs font-semibold">
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">
                      {t("guestSavedPostsRowPrice")}
                    </td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 font-black text-rose-500 text-sm">
                        {formatCurrency(room.depositAmount, currentLocale)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">
                      {t("guestSavedPostsRowDeposit")}
                    </td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 font-bold text-zinc-900">
                        {room.depositAmount > 0 ? (
                          formatCurrency(room.depositAmount, currentLocale)
                        ) : (
                          <span className="text-emerald-600 font-black">
                            {t("guestSavedPostsFreeDeposit")}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">
                      {t("guestSavedPostsRowArea")}
                    </td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 text-zinc-800 font-extrabold">
                        {room.room?.area ? `${room.room.area} m²` : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">
                      {t("guestSavedPostsRowAddress")}
                    </td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 text-zinc-600">
                        {formatAddress(
                          room.address,
                          room.room?.boardingHouseName
                        ) || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">
                      {t("guestSavedPostsRoomTypePlaceholder")}
                    </td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 text-zinc-700 font-bold">
                        {room.room?.boardingHouseName
                          ? `${room.room.boardingHouseName} - P.${room.room.roomNumber}`
                          : room.room?.roomTypeName || t("guestSavedPostsRoomTypePlaceholder")}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">
                      {t("guestSavedPostsRowLandlord")}
                    </td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3 text-zinc-700 font-bold">
                        {room.poster?.username || t("guestSavedPostsLandlordPlaceholder")}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-500">
                      {t("guestSavedPostsRowAction")}
                    </td>
                    {selectedRoomsData.map((room) => (
                      <td key={room.id} className="p-3">
                        <Link href={`/rooms/${room.id}`}>
                          <button className="w-full py-2 bg-[#FF6B35] hover:bg-[#ff5518] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all">
                            {t("guestSavedPostsViewAndDeposit")} &rarr;
                          </button>
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}