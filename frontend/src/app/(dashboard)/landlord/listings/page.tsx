"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Image as ImageIcon,
  ChevronDown,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  Coins,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import {
  postService,
  PostListing,
  PostQuotaStatus,
  UnlistedVacantRoom,
} from "@/services/post.service";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function ListingsPage() {
  const t = useTranslations("landlord");
  const { currentLocale } = useLanguage();

  // View mode: Standardized to Grid view as default
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [buildingFilter, setBuildingFilter] = useState("all");

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Default 6 for grid, 10 for table
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Data states
  const [listings, setListings] = useState<PostListing[]>([]);
  const [quota, setQuota] = useState<PostQuotaStatus | null>(null);
  const [unlistedRooms, setUnlistedRooms] = useState<UnlistedVacantRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch listings and quota
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [quotaRes, listingsRes, unlistedRes] = await Promise.allSettled([
        postService.getQuota(),
        postService.getMyListings({
          page,
          limit: pageSize,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
        }),
        postService.getUnlistedRooms(),
      ]);

      if (quotaRes.status === "fulfilled") {
        setQuota(quotaRes.value);
      } else {
        setQuota({
          isLandlord: true,
          planName: "free",
          baseDailyQuota: 3,
          bonusDailyQuota: 0,
          dailyPostQuota: 3,
          freePostsUsedToday: 0,
          freePostsRemainingToday: 3,
          purchasedCreditsAvailable: 0,
          canPublish: true,
        });
      }

      if (listingsRes.status === "fulfilled") {
        setListings(listingsRes.value.data || []);
        setTotalItems(listingsRes.value.meta?.total || 0);
        setTotalPages(listingsRes.value.meta?.totalPages || 1);
      } else {
        setListings([]);
        setTotalItems(0);
        setTotalPages(1);
      }

      if (unlistedRes.status === "fulfilled") {
        setUnlistedRooms(unlistedRes.value || []);
      } else {
        setUnlistedRooms([]);
      }
    } catch (err: any) {
      console.error("Error loading listings data:", err);
      setListings([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleToggleStatus = async (item: PostListing) => {
    const newStatus = item.status === "posted" ? "hidden" : "posted";
    try {
      await postService.updatePostStatus(item.id, newStatus);
      showToast(
        newStatus === "posted"
          ? t("landlordListingsToastShowSuccess", { title: item.title })
          : t("landlordListingsToastHideSuccess", { title: item.title })
      );
      loadData();
    } catch (err: any) {
      showToast(err.message || t("landlordListingsToastStatusError"), "error");
    }
  };

  // Window jumping pagination (5 pages window)
  const windowSize = 5;
  const currentWindow = Math.floor((page - 1) / windowSize);
  const windowStart = currentWindow * windowSize + 1;
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
  const pageNumbers = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i);
  }

  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">

      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-bottom-2 duration-300 ${toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/20"
              : "bg-rose-600 text-white shadow-rose-600/20"
            }`}
        >
          {toast.type === "success" ? (
            <ShieldCheck className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{t("landlordListingsPageTitle")}</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            {t("landlordListingsPageSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/landlord/listings/create"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#FF6B35] hover:bg-[#ff5518] rounded-xl shadow-md shadow-[#FF6B35]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t("landlordListingsNewListingBtn")}
          </Link>
        </div>
      </div>

      {/* Dark Banner Card Hero */}
      <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <ImageIcon className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase rounded-full tracking-wider backdrop-blur-md">
                {quota?.isLandlord ? t("landlordListingsQuotaLandlord", { plan: quota.planName || "Free" }) : t("landlordListingsQuotaBroker")}
              </span>
              <span className="text-xs text-zinc-400">{t("landlordListingsQuotaResetNotice")}</span>
            </div>
            <h2 className="text-xl md:text-3xl font-black tracking-tight text-white">
              {t("landlordListingsBhrpBannerTitle")}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {t("landlordListingsBhrpBannerDesc")}
            </p>
          </div>

          {/* Quota & Reach Statistics */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/10 backdrop-blur-md min-w-[140px]">
              <Coins className="w-5 h-5 text-[#FF6B35] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">{t("landlordListingsFreeToday")}</span>
                <span className="font-black text-white text-base leading-none mt-1">
                  {quota ? `${quota.freePostsRemainingToday} / ${quota.dailyPostQuota}` : "1 / 1"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/10 backdrop-blur-md min-w-[140px]">
              <Sparkles className="w-5 h-5 text-[#2ac1bc] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">{t("landlordListingsPaidCredits")}</span>
                <span className="font-black text-[#2ac1bc] text-base leading-none mt-1">
                  {t("landlordListingsPaidUnit", { count: quota?.purchasedCreditsAvailable ?? 0 })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/10 backdrop-blur-md min-w-[140px]">
              <Eye className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">{t("landlordListingsTotalPublished")}</span>
                <span className="font-black text-white text-base leading-none mt-1">
                  {t("landlordListingsPaidUnit", { count: totalItems })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UC-L-12: AI Rental Post Suggestions for Unlisted Vacant Rooms */}
      {unlistedRooms.length > 0 && (
        <div className="bg-linear-to-r from-teal-950 via-zinc-900 to-zinc-900 border border-teal-800/40 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Gợi ý AI (UC-L-12)
                </span>
                <span className="text-xs text-zinc-300">Phát hiện {unlistedRooms.length} phòng trống chưa có tin đăng</span>
              </div>
              <h3 className="text-base font-bold text-white">Đăng tin tìm khách ngay để tối ưu tỷ lệ lấp đầy</h3>
            </div>
            <Link
              href="/landlord/listings/create"
              className="text-xs font-bold text-[#2AC1BC] hover:underline"
            >
              Xem tất cả phòng &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlistedRooms.slice(0, 3).map((room) => (
              <div
                key={room.roomId}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#2AC1BC]/50 transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>P.{room.roomNumber} (Tầng {room.floor})</span>
                    <span className="text-[10px] text-[#2AC1BC] font-semibold">• {room.roomTypeName}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 line-clamp-1">{room.boardingHouseName}</div>
                  <div className="text-[10px] text-amber-300">Đang trống {room.vacantDays} ngày</div>
                </div>
                <Link
                  href={`/landlord/listings/create?roomId=${room.roomId}&aiDraft=true`}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#2AC1BC] hover:bg-[#23a5a0] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Soạn tin AI</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and View Mode Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("landlordListingsSearchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-colors"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-zinc-200 pl-3 pr-8 py-2 text-xs font-semibold text-zinc-700 bg-zinc-50/50 hover:bg-white focus:outline-none focus:border-[#FF6B35] transition-colors appearance-none cursor-pointer"
            >
              <option value="">{t("landlordListingsFilterAllStatus")}</option>
              <option value="posted">{t("landlordListingsStatusPosted")}</option>
              <option value="draft">{t("landlordListingsStatusDraft")}</option>
              <option value="hidden">{t("landlordListingsStatusHidden")}</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>

          {/* View Toggle (Grid / Table) */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                setPageSize(6);
                setPage(1);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "grid"
                  ? "bg-white text-[#FF6B35] shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> {t("landlordListingsViewGrid")}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("table");
                setPageSize(10);
                setPage(1);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "table"
                  ? "bg-white text-[#FF6B35] shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <List className="w-3.5 h-3.5" /> {t("landlordListingsViewList")}
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
          <span className="text-xs font-bold text-zinc-500">{t("landlordListingsLoading")}</span>
        </div>
      ) : listings.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-zinc-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF6B35] flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-black text-zinc-900">{t("landlordListingsEmptyTitle")}</h3>
            <p className="text-xs text-zinc-500">
              {t("landlordListingsEmptyDesc")}
            </p>
          </div>
          <Link
            href="/landlord/listings/create"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#FF6B35] hover:bg-[#ff5518] rounded-xl shadow-md shadow-[#FF6B35]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t("landlordListingsCreateFirstBtn")}
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const firstImage =
              item.images && item.images.length > 0
                ? item.images[0].url
                : "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80";

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col group"
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-video w-full bg-zinc-100 overflow-hidden">
                  <img
                    src={firstImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-[10px] font-black uppercase rounded-full shadow-sm backdrop-blur-md ${item.status === "posted"
                          ? "bg-emerald-500/90 text-white"
                          : item.status === "draft"
                            ? "bg-amber-500/90 text-white"
                            : "bg-zinc-800/90 text-zinc-200"
                        }`}
                    >
                      {item.status === "posted"
                        ? t("landlordListingsStatusPosted")
                        : item.status === "draft"
                          ? t("landlordListingsStatusDraft")
                          : t("landlordListingsStatusHidden")}
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-black/60 text-white backdrop-blur-md">
                      {item.sourceType === "free_quote" ? t("landlordListingsSourceFree") : t("landlordListingsSourcePaid")}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-xl text-white text-[10px] font-bold flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-[#2ac1bc]" /> {t("landlordListingsViewsBadge", { count: item.viewsCount })}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="font-bold text-zinc-700">
                        {item.room
                          ? t("landlordListingsRoomLabel", {
                            room: item.room.roomNumber,
                            house: item.room.boardingHouseName || t("landlordListingsRoomFallback"),
                          })
                          : t("landlordListingsUnlinkedRoom")}
                      </span>
                      <span>{new Date(item.createdAt).toLocaleDateString(currentLocale === "vi" ? "vi-VN" : "en-US")}</span>
                    </div>

                    <h3 className="text-base font-black text-zinc-900 line-clamp-2 leading-snug group-hover:text-[#FF6B35] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  {/* Financial & Controls */}
                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-zinc-400">{t("landlordListingsDepositHolding")}</div>
                      <div className="text-sm font-black text-[#FF6B35]">
                        {Number(item.depositAmount).toLocaleString(currentLocale === "vi" ? "vi-VN" : "en-US")} ₫
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${item.status === "posted"
                            ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        title={item.status === "posted" ? t("landlordListingsTitleHide") : t("landlordListingsTitleShow")}
                      >
                        {item.status === "posted" ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> {t("landlordListingsBtnToggleHide")}
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> {t("landlordListingsActionRepublish")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-black uppercase text-zinc-500 tracking-wider">
                  <th className="px-6 py-4">{t("landlordListingsColListing")}</th>
                  <th className="px-6 py-4">{t("landlordListingsColLinkedRoom")}</th>
                  <th className="px-6 py-4">{t("landlordListingsColDeposit")}</th>
                  <th className="px-6 py-4">{t("landlordListingsColQuota")}</th>
                  <th className="px-6 py-4">{t("landlordListingsColViews")}</th>
                  <th className="px-6 py-4">{t("landlordListingsColStatus")}</th>
                  <th className="px-6 py-4 text-right">{t("landlordListingsColActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-zinc-900 line-clamp-1">{item.title}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{item.content}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-700">
                      {item.room ? `P.${item.room.roomNumber} (${item.room.boardingHouseName || t("landlordListingsRoomFallback")})` : "—"}
                    </td>
                    <td className="px-6 py-4 font-black text-[#FF6B35]">
                      {Number(item.depositAmount).toLocaleString(currentLocale === "vi" ? "vi-VN" : "en-US")} ₫
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700">
                        {item.sourceType === "free_quote" ? t("landlordListingsSourceFree") : t("landlordListingsSourcePaid")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-bold">{item.viewsCount}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${item.status === "posted"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.status === "draft"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                          }`}
                      >
                        {item.status === "posted"
                          ? t("landlordListingsStatusPosted")
                          : item.status === "draft"
                            ? t("landlordListingsStatusDraft")
                            : t("landlordListingsStatusHidden")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition-colors cursor-pointer"
                      >
                        {item.status === "posted" ? t("landlordListingsBtnToggleHide") : t("landlordListingsBtnToggleShow")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standardized Pagination Bar */}
      {totalItems > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {/* Items per page and range display */}
          <div className="flex items-center gap-2 text-zinc-600">
            <span>{t("landlordListingsItemsPerPage")}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                setPageSize(val);
                setPage(1);
              }}
              className="w-14 px-2 py-1 text-center font-bold border border-zinc-200 rounded-lg focus:outline-none focus:border-[#FF6B35]"
            />
            <span>{t("landlordListingsPerPageUnit")} | </span>
            <span className="font-bold text-zinc-900">
              {startIndex}-{endIndex} {t("landlordListingsPaginationOf")} {totalItems} {t("landlordListingsPaginationItems")}
            </span>
          </div>

          {/* 5-Page Window Jumping Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title={t("landlordListingsPaginationPrev")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {windowStart > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  className="w-8 h-8 font-bold border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  1
                </button>
                {windowStart > 2 && <span className="px-1 text-zinc-400">...</span>}
              </>
            )}

            {pageNumbers.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPage(num)}
                className={`w-8 h-8 font-bold rounded-xl transition-colors cursor-pointer ${page === num
                    ? "bg-[#FF6B35] text-white shadow-sm shadow-[#FF6B35]/20"
                    : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
              >
                {num}
              </button>
            ))}

            {windowEnd < totalPages && (
              <>
                {windowEnd < totalPages - 1 && <span className="px-1 text-zinc-400">...</span>}
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  className="w-8 h-8 font-bold border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title={t("landlordListingsPaginationNext")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
