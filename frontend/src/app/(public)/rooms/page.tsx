"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Filter,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  Eye,
  X,
  ArrowRight,
  Heart,
  Share2,
  Copy,
  Check,
  User,
  Maximize2,
} from "lucide-react";
import { formatVND } from "@/utils";
import { useTranslations } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  postService,
  type PublicPostListing,
  type BrowsePostsParams,
} from "@/services/post.service";

const DEFAULT_ROOM_IMAGE = "/house-placeholder.jpg";

// ─── Helper: build full address string from structured fields ─────────────────
function buildAddressString(listing: PublicPostListing): string {
  const addr = listing.address;
  if (!addr) return listing.room?.boardingHouseName ?? "";
  const parts = [addr.houseNumber, addr.street, addr.ward, addr.district, addr.province]
    .filter(Boolean);
  return parts.join(", ");
}

// ─── Skeleton card for loading state ─────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row animate-pulse">
      <div className="md:w-[260px] lg:w-[290px] aspect-[4/3] md:aspect-auto shrink-0 bg-zinc-200" />
      <div className="p-6 flex-1 space-y-4">
        <div className="h-5 bg-zinc-200 rounded w-3/4" />
        <div className="h-3 bg-zinc-200 rounded w-1/2" />
        <div className="h-3 bg-zinc-200 rounded w-full" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-zinc-200 rounded-full" />
          <div className="h-6 w-20 bg-zinc-200 rounded-full" />
          <div className="h-6 w-20 bg-zinc-200 rounded-full" />
        </div>
        <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
          <div className="h-8 w-28 bg-zinc-200 rounded" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-zinc-200 rounded-xl" />
            <div className="h-9 w-20 bg-zinc-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination component ─────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  prevLabel: string;
  nextLabel: string;
}

function Pagination({ page, totalPages, onPageChange, prevLabel, nextLabel }: PaginationProps) {
  if (totalPages <= 1) return null;

  const windowSize = 5;
  const windowStart = Math.max(1, Math.floor((page - 1) / windowSize) * windowSize + 1);
  const windowEnd = Math.min(totalPages, windowStart + windowSize - 1);
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  return (
    <div className="flex items-center justify-center gap-1 pt-6">
      <button
        onClick={() => onPageChange(Math.max(1, windowStart - windowSize))}
        disabled={windowStart === 1}
        className="px-3 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 disabled:opacity-40 transition-colors cursor-pointer"
      >
        {prevLabel}
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${p === page
            ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/30"
            : "text-zinc-600 hover:bg-zinc-100"
            }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, windowStart + windowSize))}
        disabled={windowEnd === totalPages}
        className="px-3 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 disabled:opacity-40 transition-colors cursor-pointer"
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function RoomsPage() {
  const t = useTranslations("guest");
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // Filter state
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");

  // Applied filter (submitted)
  const [appliedFilters, setAppliedFilters] = useState<BrowsePostsParams>({});

  // UI state
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 12;

  // Data state
  const [listings, setListings] = useState<PublicPostListing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [quickViewRoom, setQuickViewRoom] = useState<PublicPostListing | null>(null);

  // Save & share state
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [shareModalRoom, setShareModalRoom] = useState<PublicPostListing | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Auto-dismiss toast notification
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Load saved post IDs for authenticated user
  useEffect(() => {
    if (!isLoggedIn) {
      setSavedIds([]);
      return;
    }
    let isMounted = true;
    postService
      .getSavedPostIds()
      .then((ids) => {
        if (isMounted) setSavedIds(ids);
      })
      .catch(() => {
        // Silently catch error if user is unauthenticated or network fails
      });
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // Fetch listings from API
  const fetchListings = useCallback(async (filters: BrowsePostsParams, page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await postService.browsePosts({ ...filters, page, limit: LIMIT });
      setListings(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError(t("guestRoomsErrorFetch"));
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Initial load and whenever applied filters / page change
  useEffect(() => {
    fetchListings(appliedFilters, currentPage);
  }, [appliedFilters, currentPage, fetchListings]);

  const handleApplyFilters = () => {
    const filters: BrowsePostsParams = {};
    if (search.trim()) filters.search = search.trim();
    if (province.trim()) filters.province = province.trim();
    if (district.trim()) filters.district = district.trim();
    if (ward.trim()) filters.ward = ward.trim();
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (minArea) filters.minArea = Number(minArea);
    if (maxArea) filters.maxArea = Number(maxArea);
    setCurrentPage(1);
    setAppliedFilters(filters);
  };

  const handleResetFilter = () => {
    setSearch("");
    setProvince("");
    setDistrict("");
    setWard("");
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setCurrentPage(1);
    setAppliedFilters({});
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSave = async (id: string) => {
    if (!isLoggedIn) {
      setToastMessage({
        type: "info",
        text: t("guestRoomsSaveLoginRequired"),
      });
      setTimeout(() => {
        router.push("/login");
      }, 1500);
      return;
    }

    const isCurrentlySaved = savedIds.includes(id);
    // Optimistic UI update
    setSavedIds((prev) =>
      isCurrentlySaved ? prev.filter((i) => i !== id) : [...prev, id]
    );

    try {
      if (isCurrentlySaved) {
        await postService.unsavePost(id);
        setToastMessage({
          type: "success",
          text: t("guestRoomsUnsaveSuccess"),
        });
      } else {
        await postService.savePost(id);
        setToastMessage({
          type: "success",
          text: t("guestRoomsSaveSuccess"),
        });
      }
    } catch (err: any) {
      // Revert optimistic update
      setSavedIds((prev) =>
        isCurrentlySaved ? [...prev, id] : prev.filter((i) => i !== id)
      );
      const isAuthError =
        err?.message?.includes("401") ||
        err?.message?.includes("expired") ||
        err?.message?.includes("log in");
      if (isAuthError) {
        setToastMessage({
          type: "info",
          text: t("guestRoomsSessionExpired"),
        });
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setToastMessage({
          type: "error",
          text: err?.message || t("guestRoomsSaveError"),
        });
      }
    }
  };

  const handleCopyShareLink = (room: PublicPostListing) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin + `/rooms/${room.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">

      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center text-white shadow-2xl overflow-hidden bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#2AC1BC]/15 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2AC1BC]/40 bg-zinc-900/70 px-4 py-1.5 text-[11px] sm:text-xs font-extrabold text-[#2AC1BC] tracking-wider mb-4 shadow-[0_0_20px_rgba(42,193,188,0.2)] backdrop-blur-xl">
            <Sparkles className="w-3.5 h-3.5 text-[#2AC1BC]" />
            <span>{t("guestRoomsBadge")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] drop-shadow-md">
            <span className="inline-block whitespace-nowrap">{t("guestRoomsTitle1")}</span> <br />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent inline-block whitespace-nowrap">
              {t("guestRoomsTitle2")}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed mt-3 max-w-xl mx-auto text-balance">
            {t("guestRoomsSubtitle")}
          </p>
        </div>
      </section>

      {/* Main Content Layout Grid Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Sidebar Filter Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
              <h2 className="font-extrabold text-zinc-900 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#2AC1BC]" /> {t("guestRoomsFilterTitle")}
              </h2>
              <button
                onClick={handleResetFilter}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t("guestRoomsResetFilter")}
              </button>
            </div>

            {/* Filter 1: Keyword */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">{t("guestRoomsKeywordLabel")}</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="filter-search"
                  type="text"
                  placeholder={t("guestRoomsKeywordPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter 2: Province */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">{t("guestRoomsProvinceLabel")}</label>
              <input
                id="filter-province"
                type="text"
                placeholder={t("guestRoomsProvincePlaceholder")}
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
              />
            </div>

            {/* Filter 3: District */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">{t("guestRoomsDistrictLabel")}</label>
              <input
                id="filter-district"
                type="text"
                placeholder={t("guestRoomsDistrictPlaceholder")}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
              />
            </div>

            {/* Filter 4: Ward */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">{t("guestRoomsWardLabel")}</label>
              <input
                id="filter-ward"
                type="text"
                placeholder={t("guestRoomsWardPlaceholder")}
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
              />
            </div>

            {/* Filter 5: Price range */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700">{t("guestRoomsMinPriceLabel")}</label>
              <input
                id="filter-min-price"
                type="number"
                placeholder={t("guestRoomsMinPricePlaceholder")}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
              />
              <label className="text-xs font-bold text-zinc-700">{t("guestRoomsMaxPriceLabel")}</label>
              <input
                id="filter-max-price"
                type="number"
                placeholder={t("guestRoomsMaxPricePlaceholder")}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
              />
            </div>

            {/* Filter 6: Area range */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700">{t("guestRoomsMinAreaLabel")}</label>
              <input
                id="filter-min-area"
                type="number"
                placeholder={t("guestRoomsMinAreaPlaceholder")}
                value={minArea}
                onChange={(e) => setMinArea(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
              />
              <label className="text-xs font-bold text-zinc-700">{t("guestRoomsMaxAreaLabel")}</label>
              <input
                id="filter-max-area"
                type="number"
                placeholder={t("guestRoomsMaxAreaPlaceholder")}
                value={maxArea}
                onChange={(e) => setMaxArea(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200/80 rounded-2xl focus:outline-none focus:border-[#2AC1BC] focus:bg-white transition-all"
              />
            </div>

            {/* Apply button */}
            <button
              id="apply-filters-btn"
              onClick={handleApplyFilters}
              className="w-full py-3 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white text-xs font-extrabold rounded-2xl shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" /> {t("guestRoomsApplyFilter")}
            </button>
          </div>

          {/* Right Main Room Cards / Map Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Results count + view toggle */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500 font-bold">
                {isLoading ? (
                  <span className="text-zinc-400">{t("guestRoomsLoading")}</span>
                ) : (
                  t("guestRoomsFoundCount", { count: total })
                )}
              </div>

              {/* List / Map View Mode Toggle Buttons */}
              <div className="flex items-center p-1 bg-zinc-100 rounded-2xl border border-zinc-200/80">
                <button
                  id="view-list-btn"
                  onClick={() => setViewMode("list")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === "list" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                    }`}
                >
                  <Filter className="w-3.5 h-3.5" /> {t("guestRoomsListView")}
                </button>
                <button
                  id="view-map-btn"
                  onClick={() => setViewMode("map")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === "map" ? "bg-[#2AC1BC] text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                    }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> {t("guestRoomsMapView")}
                </button>
              </div>
            </div>

            {/* Map view */}
            {viewMode === "map" ? (
              <div className="bg-zinc-900 rounded-3xl h-[520px] relative overflow-hidden shadow-xl border border-zinc-800 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
                  alt="Map Background"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/40 pointer-events-none" />

                {listings.map((listing, idx) => (
                  <div
                    key={listing.id}
                    onClick={() => setQuickViewRoom(listing)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group animate-bounce ${idx === 0
                      ? "top-1/3 left-1/3"
                      : idx === 1
                        ? "top-1/2 left-2/3"
                        : idx === 2
                          ? "top-2/3 left-1/2"
                          : "top-1/4 left-3/4"
                      }`}
                  >
                    <div className="px-3 py-1.5 bg-[#FF6B35] text-white text-xs font-black rounded-full shadow-2xl flex items-center gap-1 group-hover:scale-110 transition-transform">
                      <MapPin className="w-3.5 h-3.5" /> {formatVND(listing.depositAmount)}
                    </div>
                  </div>
                ))}

                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-2xl text-xs font-bold text-zinc-900 flex justify-between items-center">
                  <span>📍 {t("guestRoomsMapInfo")}</span>
                  <span className="text-[#2AC1BC] font-extrabold">
                    {t("guestRoomsMapPinTitle", { count: listings.length })}
                  </span>
                </div>
              </div>
            ) : (
              /* List view */
              <div className="space-y-6">
                {/* Loading skeletons */}
                {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}

                {/* Error state */}
                {!isLoading && error && (
                  <div className="text-center py-16 space-y-3">
                    <p className="text-sm text-red-500 font-semibold">{error}</p>
                    <button
                      onClick={() => fetchListings(appliedFilters, currentPage)}
                      className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {t("guestRoomsRetry")}
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && !error && listings.length === 0 && (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto">
                      <Search className="w-7 h-7 text-zinc-400" />
                    </div>
                    <h3 className="font-extrabold text-zinc-900 text-base">{t("guestRoomsEmptyTitle")}</h3>
                    <p className="text-sm text-zinc-400 font-medium">{t("guestRoomsEmptyDesc")}</p>
                    <button
                      onClick={handleResetFilter}
                      className="px-5 py-2.5 bg-[#2AC1BC] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer"
                    >
                      {t("guestRoomsEmptyReset")}
                    </button>
                  </div>
                )}

                {/* Listing cards */}
                {!isLoading &&
                  !error &&
                  listings.map((listing) => {
                    const isSaved = savedIds.includes(listing.id);
                    const imageUrl = listing.images?.[0]?.url || DEFAULT_ROOM_IMAGE;
                    const address = buildAddressString(listing);

                    return (
                      <div
                        key={listing.id}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            window.open(`/rooms/${listing.id}`, "_blank");
                          } else {
                            router.push(`/rooms/${listing.id}`);
                          }
                        }}
                        className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col md:flex-row group cursor-pointer"
                      >
                        {/* Left Image Column with Action Badges */}
                        <div className="relative md:w-[260px] lg:w-[290px] aspect-[4/3] md:aspect-auto shrink-0 overflow-hidden bg-zinc-100">
                          <img
                            src={imageUrl}
                            alt={listing.title}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_ROOM_IMAGE;
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          <span className="absolute top-3 left-3 px-3 py-1 bg-zinc-950/80 backdrop-blur-md text-white font-extrabold text-[11px] rounded-full shadow-md pointer-events-none">
                            {listing.room?.roomTypeName ?? t("guestRoomsBadgeAvailable")}
                          </span>

                          {/* Save Wishlist Button & Share Button */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSave(listing.id);
                              }}
                              className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-md ${isSaved
                                ? "bg-rose-500 text-white"
                                : "bg-zinc-900/70 text-white hover:bg-rose-500"
                                }`}
                              title={isSaved ? t("guestRoomsSaved") : t("guestRoomsSave")}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-white" : ""}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShareModalRoom(listing);
                              }}
                              className="p-2 rounded-full bg-zinc-900/70 text-white hover:bg-[#2AC1BC] backdrop-blur-md transition-all cursor-pointer shadow-md"
                              title={t("guestRoomsShareTitle")}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick View Button overlay */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setQuickViewRoom(listing);
                            }}
                            className="absolute bottom-3 left-3 right-3 py-2 bg-white/95 hover:bg-white text-zinc-900 backdrop-blur-md text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300 cursor-pointer z-10"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("guestRoomsQuickView")}
                          </button>
                        </div>

                        {/* Details column */}
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <h3 className="font-extrabold text-zinc-900 text-lg leading-snug group-hover:text-[#2AC1BC] transition-colors line-clamp-1 mb-2">
                              <Link
                                href={`/rooms/${listing.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-[#2AC1BC] transition-colors"
                              >
                                {listing.title}
                              </Link>
                            </h3>

                            {address && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center text-xs text-zinc-400 font-semibold gap-1 hover:text-[#2AC1BC] hover:underline cursor-pointer transition-colors w-fit z-10"
                                title={t("guestContactMaps")}
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                                <span className="truncate">{address}</span>
                              </a>
                            )}

                            {listing.room?.area && (
                              <span className="text-xs text-zinc-400 font-medium flex gap-1 mt-1">
                                <Maximize2 className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                                {listing.room.area} m²
                              </span>
                            )}

                            <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2 pt-1">
                              {listing.content}
                            </p>
                          </div>

                          {/* Poster info */}
                          {listing.poster && (
                            <Link
                              href={`/landlords/${listing.poster.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 hover:text-[#2AC1BC] transition-colors w-fit z-10 cursor-pointer group/poster"
                              title="Xem hồ sơ người đăng"
                            >
                              {listing.poster.avatarUrl ? (
                                <img
                                  src={listing.poster.avatarUrl}
                                  alt={listing.poster.username ?? ""}
                                  className="w-6 h-6 rounded-full object-cover border border-zinc-200"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                                  <User className="w-3.5 h-3.5 text-zinc-400" />
                                </div>
                              )}
                              <span className="text-xs text-zinc-500 font-semibold group-hover/poster:text-[#2AC1BC] transition-colors">
                                {listing.poster.username ?? t("guestRoomsDefaultLandlord")}
                              </span>
                            </Link>
                          )}

                          {/* Price + actions */}
                          <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="whitespace-nowrap">
                              <span className="text-2xl font-black text-rose-500">
                                {formatVND(listing.depositAmount)}
                              </span>
                              <span className="text-xs text-zinc-400 font-normal"> {t("guestRoomsMonth")}</span>
                              <span className="text-[11px] font-bold text-zinc-500 block">
                                {t("guestRoomsDepositLabel")}{" "}
                                {listing.depositAmount > 0
                                  ? formatVND(listing.depositAmount)
                                  : t("guestRoomsFreeDeposit")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Pagination */}
                {!isLoading && !error && (
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    prevLabel={t("guestRoomsPrev")}
                    nextLabel={t("guestRoomsNext")}
                  />
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ─── Share Modal ──────────────────────────────────────────────────────── */}
      {shareModalRoom && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShareModalRoom(null);
          }}
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
              <Share2 className="w-4 h-4 text-[#2AC1BC]" /> {t("guestRoomsShareTitle")}
            </h3>
            <p className="text-xs text-zinc-500 font-medium line-clamp-1">{shareModalRoom.title}</p>

            <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded-2xl border border-zinc-200">
              <input
                type="text"
                readOnly
                value={
                  typeof window !== "undefined"
                    ? window.location.origin + `/rooms/${shareModalRoom.id}`
                    : ""
                }
                className="w-full text-xs font-semibold text-zinc-600 bg-transparent px-2 focus:outline-none truncate"
              />
              <button
                onClick={() => handleCopyShareLink(shareModalRoom)}
                className="px-3 py-1.5 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? t("guestRoomsCopied") : t("guestRoomsCopy")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick View Modal ─────────────────────────────────────────────────── */}
      {quickViewRoom && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuickViewRoom(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-zinc-100 relative cursor-default">
            <button
              onClick={() => setQuickViewRoom(null)}
              className="absolute top-4 right-4 p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100">
                <img
                  src={quickViewRoom.images?.[0]?.url || DEFAULT_ROOM_IMAGE}
                  alt={quickViewRoom.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_ROOM_IMAGE;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="md:w-1/2 space-y-4">
                <span className="px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-[10px] font-extrabold rounded-full inline-block">
                  {quickViewRoom.room?.roomTypeName ? `${quickViewRoom.room.roomTypeName} • ` : ""}
                  {t("guestRoomsVerifiedLandlord")}
                </span>
                <h3 className="text-xl font-black text-zinc-900 leading-snug">
                  {quickViewRoom.title}
                </h3>
                <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2AC1BC]" /> {buildAddressString(quickViewRoom)}
                </div>
                <div className="text-2xl font-black text-rose-500">
                  {formatVND(quickViewRoom.depositAmount)}
                  <span className="text-xs text-zinc-400 font-normal"> {t("guestRoomsMonth")}</span>
                  <span className="text-[11px] font-bold text-zinc-500 block">
                    {t("guestRoomsDepositLabel")}{" "}
                    {quickViewRoom.depositAmount > 0
                      ? formatVND(quickViewRoom.depositAmount)
                      : t("guestRoomsFreeDeposit")}
                  </span>
                </div>

                {/* Features tags */}
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <span className="text-xs font-bold text-zinc-700 block">
                    {t("guestRoomsFeaturedAmenities")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickViewRoom.room?.roomTypeName && (
                      <span className="px-2.5 py-1 bg-zinc-100 text-[#2AC1BC] rounded-lg text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#2AC1BC]" /> {quickViewRoom.room.roomTypeName}
                      </span>
                    )}
                    {quickViewRoom.room?.area && (
                      <span className="px-2.5 py-1 bg-zinc-100 text-[#2AC1BC] rounded-lg text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#2AC1BC]" /> {quickViewRoom.room.area} m²
                      </span>
                    )}
                    {quickViewRoom.room?.floor && (
                      <span className="px-2.5 py-1 bg-zinc-100 text-[#2AC1BC] rounded-lg text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#2AC1BC]" /> Tầng {quickViewRoom.room.floor}
                      </span>
                    )}
                    {quickViewRoom.room?.boardingHouseName && (
                      <span className="px-2.5 py-1 bg-zinc-100 text-[#2AC1BC] rounded-lg text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#2AC1BC]" /> {quickViewRoom.room.boardingHouseName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <Link
                    href={`/rooms/${quickViewRoom.id}`}
                    className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2AC1BC]" /> {t("guestRoomsDetailBtn")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ─── Toast Feedback Notification ──────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${toastMessage.type === "success"
              ? "bg-zinc-900/95 text-white border-zinc-700 shadow-zinc-950/25"
              : toastMessage.type === "error"
                ? "bg-rose-500 text-white border-rose-400 shadow-rose-950/25"
                : "bg-zinc-900/95 text-white border-zinc-700 shadow-zinc-950/25"
              }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#2AC1BC] shrink-0" />
            ) : toastMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-[#2AC1BC] shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-lg text-zinc-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
